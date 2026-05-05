import pytest
from decimal import Decimal
from unittest.mock import patch, call

from apps.stock.models import Ingredient


# broadcast_staff_event is imported lazily inside the handler; patch at the source module.
BROADCAST_PATH = 'core.realtime.broadcast_staff_event'


@pytest.fixture
def ingredient_above_threshold(db):
    return Ingredient.objects.create(
        nom='Farine',
        unite_mesure='g',
        stock_actuel=Decimal('1000.00'),
        seuil_alerte=Decimal('200.00'),
    )


class TestStockAlertSignal:
    def test_broadcast_fires_when_stock_crosses_threshold_downward(self, ingredient_above_threshold):
        """Alert fires exactly once when stock drops from above to below the threshold."""
        with patch(BROADCAST_PATH) as mock_broadcast:
            ingredient_above_threshold.stock_actuel = Decimal('100.00')
            ingredient_above_threshold.save()

        mock_broadcast.assert_called_once()

    def test_broadcast_not_fired_when_stock_already_low(self, ingredient_above_threshold):
        """No alert when stock is already below threshold — prevents WebSocket spam (Pitfall 2)."""
        ingredient_above_threshold.stock_actuel = Decimal('50.00')
        ingredient_above_threshold.save()

        with patch(BROADCAST_PATH) as mock_broadcast:
            ingredient_above_threshold.stock_actuel = Decimal('30.00')
            ingredient_above_threshold.save()

        mock_broadcast.assert_not_called()

    def test_broadcast_fires_on_create_below_threshold(self, db):
        """New ingredient created already below threshold must trigger the alert."""
        with patch(BROADCAST_PATH) as mock_broadcast:
            Ingredient.objects.create(
                nom='Sel',
                unite_mesure='g',
                stock_actuel=Decimal('10.00'),
                seuil_alerte=Decimal('50.00'),
            )

        mock_broadcast.assert_called_once()

    def test_broadcast_not_fired_on_create_above_threshold(self, db):
        """New ingredient created above threshold must not trigger any alert."""
        with patch(BROADCAST_PATH) as mock_broadcast:
            Ingredient.objects.create(
                nom='Poivre',
                unite_mesure='g',
                stock_actuel=Decimal('500.00'),
                seuil_alerte=Decimal('100.00'),
            )

        mock_broadcast.assert_not_called()

    def test_broadcast_payload_contains_required_fields(self, ingredient_above_threshold):
        """Payload must include ingredient_id, nom, stock_actuel, seuil_alerte, unite_mesure."""
        with patch(BROADCAST_PATH) as mock_broadcast:
            ingredient_above_threshold.stock_actuel = Decimal('50.00')
            ingredient_above_threshold.save()

        mock_broadcast.assert_called_once()
        _, kwargs = mock_broadcast.call_args
        assert kwargs['event_type'] == 'stock.alert'
        payload = kwargs['payload']
        assert payload['ingredient_id'] == ingredient_above_threshold.id
        assert payload['nom'] == 'Farine'
        assert payload['stock_actuel'] == '50.00'
        assert payload['seuil_alerte'] == '200.00'
        assert payload['unite_mesure'] == 'g'

    def test_broadcast_fires_once_on_exact_threshold_crossing(self, ingredient_above_threshold):
        """Stock landing exactly at the seuil_alerte counts as crossing (<=)."""
        with patch(BROADCAST_PATH) as mock_broadcast:
            ingredient_above_threshold.stock_actuel = Decimal('200.00')
            ingredient_above_threshold.save()

        mock_broadcast.assert_called_once()

    def test_broadcast_not_fired_when_stock_rises_above_threshold(self, ingredient_above_threshold):
        """Saving stock above threshold after a previous low state must not fire an alert."""
        ingredient_above_threshold.stock_actuel = Decimal('50.00')
        ingredient_above_threshold.save()

        with patch(BROADCAST_PATH) as mock_broadcast:
            ingredient_above_threshold.stock_actuel = Decimal('1000.00')
            ingredient_above_threshold.save()

        mock_broadcast.assert_not_called()

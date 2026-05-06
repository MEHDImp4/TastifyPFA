from decimal import Decimal

import pytest

from apps.paiements.models import Paiement
from apps.paiements.services import create_payment


@pytest.mark.django_db
def test_completed_queryset_filters_only_completed_payments(payable_commande):
    create_payment(
        commande_id=payable_commande.id,
        montant=Decimal('5.00'),
        methode=Paiement.Methode.ESPECES,
        statut=Paiement.Statut.COMPLETE,
    )
    create_payment(
        commande_id=payable_commande.id,
        montant=Decimal('4.00'),
        methode=Paiement.Methode.ESPECES,
        statut=Paiement.Statut.EN_ATTENTE,
    )

    completed_statuses = list(Paiement.objects.completed().values_list('statut', flat=True))

    assert completed_statuses == [Paiement.Statut.COMPLETE]


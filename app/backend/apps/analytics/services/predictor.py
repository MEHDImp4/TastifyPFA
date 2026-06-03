from datetime import date, timedelta

from django.db.models import Sum

from apps.commandes.models import CommandeLigne
from apps.menu.models import Plat


class DemandPredictor:
    """
    Prévision volontairement simple.
    Au lieu d'un modèle Machine Learning difficile à expliquer, on utilise la moyenne
    des ventes récentes pour estimer les besoins de la semaine prochaine.
    """

    @classmethod
    def predict_next_week(cls):
        forecast_dates = []
        for i in range(1, 8):
            forecast_dates.append(date.today() + timedelta(days=i))

        predictions = {}

        for plat in Plat.objects.filter(est_active=True):
            average_quantity = cls._get_average_daily_sales(plat)
            predictions[plat.id] = {}

            for forecast_date in forecast_dates:
                predictions[plat.id][forecast_date.isoformat()] = average_quantity

        return predictions

    @classmethod
    def get_baseline_forecast(cls):
        """Valeur de secours quand il n'y a pas encore assez d'historique."""
        return cls.predict_next_week()

    @staticmethod
    def _get_average_daily_sales(plat):
        thirty_days_ago = date.today() - timedelta(days=30)
        rows = (
            CommandeLigne.objects.filter(
                plat=plat,
                commande__statut='PAYEE',
                created_at__date__gte=thirty_days_ago,
            )
            .values('created_at__date')
            .annotate(total=Sum('quantite'))
        )

        daily_totals = []
        for row in rows:
            daily_totals.append(row['total'] or 0)

        if not daily_totals:
            return 10

        return round(sum(daily_totals) / len(daily_totals), 2)

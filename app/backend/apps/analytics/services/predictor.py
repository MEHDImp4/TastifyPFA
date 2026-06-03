import logging
from datetime import date, timedelta
from django.db import models
from apps.menu.models import Plat
from apps.commandes.models import CommandeLigne

logger = logging.getLogger(__name__)

class DemandPredictor:
    @classmethod
    def predict_next_week(cls):
        """
        Returns a dictionary {plat_id: {date: predicted_qty}}
        calculated using simple historical average (rule-based database query).
        Removes scikit-learn RandomForest regression.
        """
        predictions = {}
        forecast_dates = [date.today() + timedelta(days=i) for i in range(1, 8)]
        
        # Calculate a simple average daily quantity sold per plat in the last 30 days
        # If no sales history, default to a sensible base daily rate (e.g. 1.0 unit)
        thirty_days_ago = date.today() - timedelta(days=30)
        
        for plat in Plat.objects.filter(est_active=True):
            total_qty = CommandeLigne.objects.filter(
                plat=plat,
                commande__statut='PAYEE',
                commande__created_at__date__gte=thirty_days_ago
            ).aggregate(total=models.Sum('quantite'))['total'] or 0
            
            daily_avg = float(total_qty) / 30.0
            
            # Ensure a reasonable minimum default baseline if sales are low/zero
            if daily_avg <= 0.05:
                daily_avg = 1.0
                
            plat_preds = {}
            for d in forecast_dates:
                plat_preds[d.isoformat()] = daily_avg
            predictions[plat.id] = plat_preds
            
        return predictions

    @classmethod
    def get_baseline_forecast(cls):
        today = date.today()
        forecast = {}
        for plat in Plat.objects.filter(est_active=True):
            forecast[plat.id] = {
                (today + timedelta(days=i)).isoformat(): 10 for i in range(1, 8)
            }
        return forecast

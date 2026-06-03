import pandas as pd
import numpy as np
from django.db import models
from sklearn.ensemble import RandomForestRegressor
from apps.commandes.models import CommandeLigne
from apps.menu.models import Plat
from ..models import WeatherData
from datetime import date, timedelta

class DemandPredictor:
    @classmethod
    def get_training_data(cls):
        """
        Gathers historical sales and weather data.
        """
        # Get sales aggregated by day and plat
        sales = CommandeLigne.objects.filter(
            commande__statut='PAYEE'
        ).values('commande__created_at__date', 'plat_id').annotate(
            qty=models.Sum('quantite')
        )
        
        if not sales:
            return None
            
        df = pd.DataFrame(list(sales))
        df.columns = ['date', 'plat_id', 'qty']
        
        # Get weather
        weather = WeatherData.objects.all().values('date', 'temp_max', 'rain_mm')
        w_df = pd.DataFrame(list(weather))
        
        if w_df.empty:
            return None
            
        # Merge
        merged = pd.merge(df, w_df, on='date', how='left')
        
        # Feature Engineering
        merged['date'] = pd.to_datetime(merged['date'])
        merged['day_of_week'] = merged['date'].dt.dayofweek
        merged['month'] = merged['date'].dt.month
        
        return merged

    @classmethod
    def predict_next_week(cls):
        """
        Returns a dictionary {plat_id: {date: predicted_qty}}
        """
        data = cls.get_training_data()
        
        # If not enough data, return a baseline (avg sales)
        if data is None or len(data) < 10:
            return cls.get_baseline_forecast()
            
        predictions = {}
        forecast_dates = [date.today() + timedelta(days=i) for i in range(1, 8)]
        
        # Fetch weather forecast
        w_forecast = WeatherData.objects.filter(date__in=forecast_dates)
        w_map = {w.date: w for w in w_forecast}
        
        for plat in Plat.objects.filter(est_active=True):
            p_data = data[data['plat_id'] == plat.id]
            if len(p_data) < 3:
                predictions[plat.id] = {d: 5 for d in forecast_dates} # Dummy baseline
                continue
                
            X = p_data[['day_of_week', 'month', 'temp_max', 'rain_mm']].fillna(0)
            y = p_data['qty']
            
            model = RandomForestRegressor(n_estimators=50)
            model.fit(X, y)
            
            plat_preds = {}
            for d in forecast_dates:
                w = w_map.get(d)
                feat = np.array([[d.weekday(), d.month, float(w.temp_max if w else 25), float(w.rain_mm if w else 0)]])
                plat_preds[d.isoformat()] = float(model.predict(feat)[0])
            
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

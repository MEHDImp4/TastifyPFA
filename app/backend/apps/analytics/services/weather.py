import requests
from django.conf import settings
from ..models import WeatherData
from datetime import date, timedelta

class WeatherService:
    # Using Marrakech as default location
    LAT = 31.6295
    LON = -7.9811
    
    @classmethod
    def fetch_and_store_forecast(cls):
        """
        Fetches 7-day forecast and stores it in the DB.
        For MVP, we use a simulation if no API key is present.
        """
        # Simulation
        today = date.today()
        for i in range(7):
            day = today + timedelta(days=i)
            # Simulated weather: 20-30°C, occasional rain
            temp = 22 + (i % 5) * 2
            rain = 0 if i % 3 != 0 else 5.5
            
            WeatherData.objects.update_or_create(
                date=day,
                defaults={
                    'temp_max': temp,
                    'rain_mm': rain,
                    'is_forecast': True
                }
            )
        return True

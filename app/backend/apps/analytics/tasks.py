from celery import shared_task
from .services.weather import WeatherService
from .services.predictor import DemandPredictor
import logging

logger = logging.getLogger(__name__)

@shared_task(name="apps.analytics.tasks.update_weather_and_predictions")
def update_weather_and_predictions():
    """
    Daily task to refresh weather forecast and pre-calculate demand.
    """
    logger.info("Starting weather sync...")
    WeatherService.fetch_and_store_forecast()
    
    logger.info("Starting demand prediction pre-calculation...")
    # This just exercises the model for now
    DemandPredictor.predict_next_week()
    
    return "Weather and predictions updated."

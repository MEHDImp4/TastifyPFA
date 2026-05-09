from django.db import models

class WeatherData(models.Model):
    date = models.DateField(unique=True)
    temp_max = models.DecimalField(max_digits=5, decimal_places=2)
    rain_mm = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_forecast = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        type_str = "Forecast" if self.is_forecast else "History"
        return f"{self.date} - {self.temp_max}°C - {type_str}"

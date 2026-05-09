---
phase: 37
slug: ai-weather-stock-forecasting
status: research
---

# Phase 37 Research: AI Weather & Stock

## Weather API: OpenWeatherMap
- **Endpoint**: One Call API (forecast).
- **Parameters**: `lat`, `lon`, `appid`.
- **Data needed**: `temp`, `pop` (probability of precipitation).

## Prediction Model: Random Forest Regressor
- **Why**: Good at handling categorical (day of week) and numerical (weather) inputs together.
- **Features**:
  - `day_of_week` (0-6)
  - `month` (1-12)
  - `is_weekend` (bool)
  - `temp_max`
  - `rain_mm`
- **Target**: `total_sold_quantity` per dish.

## Recipe Mapping
- Need a way to explode predicted dish demand into ingredient demand.
- Currently, `apps.stock.models` might not have a formal `Recipe` model.
- I'll check `app/backend/apps/stock/models.py`.

## Data Gathering
- Historical sales: Query `CommandeLigne` joined with `Commande`.
- Historical weather: If not available, we'll bootstrap with current weather and start collecting.

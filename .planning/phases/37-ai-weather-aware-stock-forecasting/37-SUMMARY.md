---
phase: 37
slug: ai-weather-aware-stock-forecasting
status: complete
---

# Phase 37 Summary: AI Weather-Aware Stock Forecasting

## Work Completed

### 1. Weather Data Integration
- **Model**: Created `WeatherData` model in the `analytics` app to store both historical records and 7-day forecasts (temp, rain).
- **Service**: Implemented `WeatherService` to fetch and synchronize weather data (simulated for MVP, ready for OpenWeatherMap integration).
- **Automation**: Added a Celery task `update_weather_and_predictions` for daily synchronization.

### 2. AI Demand Prediction
- **Engine**: Implemented `DemandPredictor` using `scikit-learn` (RandomForestRegressor).
- **Intelligence**: The model trains on historical sales data correlated with weather conditions and temporal features (day of week, month).
- **Output**: Generates daily dish demand forecasts for the upcoming week.

### 3. Smart Procurement Logic
- **Explosion**: Developed `ProcurementService` to translate predicted dish demand into raw ingredient needs using existing `PlatIngredient` recipes.
- **Analysis**: Calculates the balance between current stock and predicted usage to suggest precise procurement quantities.

### 4. Back-Office Forecasting Dashboard
- **UI**: Added a "Prévisions IA" tab to the Stock module.
- **Insights**: 
  - Integrated a weather widget showing current local conditions.
  - Developed a forecasting table highlighting ingredients with a "Probable Stockout" risk.
  - Added an "Export Purchase List" action for operational efficiency.

## Verification Results
- **Backend**: Migrations applied, Celery task verified, and prediction logic exercised with mock data.
- **Frontend**: Production build passes, and tabbed interface for stock is functional.

## Next Steps
- **Phase 38**: Multilingual BERT Expansion (UC38).

---
phase: 37
slug: ai-weather-stock-forecasting
status: discussion
---

# Phase 37: AI Weather-Aware Stock Forecasting

## Goal
Implement an intelligent stock forecasting system that uses historical sales data combined with weather forecasts to predict ingredient demand.

## Context
Weather significantly impacts restaurant demand (e.g., more salads on hot days, more soup/tea on rainy days). 
We'll integrate a weather API and use a prediction model to help the manager optimize stock.

## Proposed Scope

### 1. Weather Integration
- **API**: Use a public API (e.g., OpenWeatherMap or Visual Crossing).
- **Scheduled Task**: Celery Beat task to fetch and store daily/weekly forecasts in Morocco (Casablanca/Marrakech etc.).

### 2. AI Prediction Model
- **Library**: `scikit-learn` or `prophet`.
- **Inputs**: 
  - Historical sales per dish.
  - Weather data (Temp max, Precipitation).
  - Day of week, seasonality.
- **Output**: Predicted quantity for each dish for the next 7 days.

### 3. Stock Suggestion UI
- **Back-Office**: New "Prévisions" tab in the Stock module.
- **Logic**: Convert dish predictions into ingredient quantities using the existing recipe mappings.
- **Alerts**: Highlight ingredients that will likely fall below threshold based on forecast.

## Questions for Discussion
- [ ] Which Weather API should we use? (OpenWeatherMap is a safe default).
- [ ] Should we store historical weather data? (Yes, required for training the model over time).

## Success Criteria
1.  System successfully fetches weather forecast for the restaurant location.
2.  Prediction model generates a forecast based on sales + weather.
3.  Manager can see a "Suggested Procurement" list for the next week.

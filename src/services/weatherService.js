import api from './api';

/**
 * Environmental risk service — weather, forecasts, disease pressure.
 */
export const weatherService = {
  /**
   * Get current microclimate conditions for a GPS location.
   */
  getCurrentConditions: (lat, lng) =>
    api.get('/weather/current', { params: { lat, lng } }),

  /**
   * Get an N-day weather forecast with disease risk scores.
   */
  getForecast: (lat, lng, days = 5) =>
    api.get('/weather/forecast', { params: { lat, lng, days } }),

  /**
   * Get a disease-pressure risk score for a specific location.
   */
  getDiseaseRisk: (lat, lng) =>
    api.get('/weather/disease-risk', { params: { lat, lng } }),
};

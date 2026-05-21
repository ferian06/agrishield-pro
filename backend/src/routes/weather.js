const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Uses Open-Meteo (free, no API key required)
const OPEN_METEO = 'https://api.open-meteo.com/v1';

async function fetchMeteo(path) {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(`${OPEN_METEO}${path}`);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  return res.json();
}

function diseaseRiskScore(temp, humidity, rain) {
  // Simple heuristic: warm + humid + recent rain = high risk
  let score = 0;
  if (temp >= 20 && temp <= 30) score += 30;
  if (humidity >= 70) score += 40;
  if (rain > 0) score += 30;
  return Math.min(100, score);
}

// GET /v1/weather/current?lat=&lng=
router.get('/current', requireAuth, async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ message: 'lat and lng are required.' });

  try {
    const data = await fetchMeteo(
      `/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m,weather_code&timezone=auto`
    );
    const c = data.current;
    const risk = diseaseRiskScore(c.temperature_2m, c.relative_humidity_2m, c.rain);

    res.json({
      temperature: c.temperature_2m,
      humidity: c.relative_humidity_2m,
      rain: c.rain,
      windSpeed: c.wind_speed_10m,
      weatherCode: c.weather_code,
      diseaseRisk: risk,
      riskLevel: risk < 30 ? 'Low' : risk < 60 ? 'Moderate' : 'High',
      timestamp: c.time,
    });
  } catch (err) {
    res.status(502).json({ message: 'Weather service unavailable.', detail: err.message });
  }
});

// GET /v1/weather/forecast?lat=&lng=&days=5
router.get('/forecast', requireAuth, async (req, res) => {
  const { lat, lng, days = 5 } = req.query;
  if (!lat || !lng) return res.status(400).json({ message: 'lat and lng are required.' });

  const d = Math.min(14, Math.max(1, parseInt(days)));

  try {
    const data = await fetchMeteo(
      `/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean,weather_code&timezone=auto&forecast_days=${d}`
    );

    const forecast = data.daily.time.map((date, i) => ({
      date,
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      precipitation: data.daily.precipitation_sum[i],
      humidity: data.daily.relative_humidity_2m_mean[i],
      weatherCode: data.daily.weather_code[i],
      diseaseRisk: diseaseRiskScore(
        (data.daily.temperature_2m_max[i] + data.daily.temperature_2m_min[i]) / 2,
        data.daily.relative_humidity_2m_mean[i],
        data.daily.precipitation_sum[i],
      ),
    }));

    res.json({ forecast });
  } catch (err) {
    res.status(502).json({ message: 'Weather service unavailable.', detail: err.message });
  }
});

// GET /v1/weather/disease-risk?lat=&lng=
router.get('/disease-risk', requireAuth, async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ message: 'lat and lng are required.' });

  try {
    const data = await fetchMeteo(
      `/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,rain&timezone=auto`
    );
    const c = data.current;
    const score = diseaseRiskScore(c.temperature_2m, c.relative_humidity_2m, c.rain);

    res.json({
      score,
      level: score < 30 ? 'Low' : score < 60 ? 'Moderate' : 'High',
      factors: {
        temperature: c.temperature_2m,
        humidity: c.relative_humidity_2m,
        rain: c.rain,
      },
    });
  } catch (err) {
    res.status(502).json({ message: 'Weather service unavailable.', detail: err.message });
  }
});

module.exports = router;

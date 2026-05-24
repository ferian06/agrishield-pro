const cron = require('node-cron');
const { db, all } = require('../db/database');
const { sendPushToUser } = require('../utils/pushService');

async function runWeatherAlerts() {
  console.log('[cron] Running daily weather disease-risk check…');

  // Get all users with push subscriptions that have a saved location
  let subs;
  try {
    subs = all(await db.execute({
      sql: 'SELECT DISTINCT user_id, lat, lng FROM push_subscriptions WHERE lat IS NOT NULL AND lng IS NOT NULL',
      args: [],
    }));
  } catch (err) {
    console.error('[cron] DB error fetching subscriptions:', err.message);
    return;
  }

  if (subs.length === 0) {
    console.log('[cron] No subscriptions with location — skipping.');
    return;
  }

  const { default: fetch } = await import('node-fetch');

  for (const sub of subs) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${sub.lat}&longitude=${sub.lng}` +
        `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code` +
        `&forecast_days=1`;

      const res  = await fetch(url, { timeout: 8000 });
      const data = await res.json();
      const c    = data.current;

      if (!c) continue;

      const humidity = c.relative_humidity_2m ?? 0;
      const rain     = c.precipitation        ?? 0;
      const temp     = c.temperature_2m       ?? 25;

      // Simple disease-risk score (mirrors the frontend calculation)
      const riskScore =
        (humidity > 80 ? 40 : humidity > 70 ? 25 : 0) +
        (rain > 0 ? 30 : 0) +
        (temp > 20 && temp < 30 ? 20 : 0);

      const riskLevel = riskScore >= 60 ? 'High' : riskScore >= 35 ? 'Moderate' : 'Low';

      if (riskLevel === 'High' || riskLevel === 'Moderate') {
        await sendPushToUser(sub.user_id, {
          title: `🌧️ ${riskLevel} Disease Risk Today`,
          body:  `Humidity ${humidity}%${rain > 0 ? ` · Rain ${rain}mm` : ''} · ${Math.round(temp)}°C — Check your crops and apply preventive treatment if needed.`,
          url:   '/resources',
          tag:   'weather-alert',
        });
        console.log(`[cron] Sent ${riskLevel} alert to user ${sub.user_id}`);
      }
    } catch (err) {
      console.error(`[cron] Alert failed for user ${sub.user_id}:`, err.message);
    }
  }

  console.log('[cron] Weather check complete.');
}

function initWeatherCron() {
  // Run every day at 07:00 AM server time
  cron.schedule('0 7 * * *', () => {
    runWeatherAlerts().catch(err => console.error('[cron] Unhandled error:', err.message));
  });
  console.log('[cron] Daily weather alert job scheduled (07:00 AM).');
}

module.exports = { initWeatherCron, runWeatherAlerts };

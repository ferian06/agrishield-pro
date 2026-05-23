const webpush = require('web-push');
const { db, all } = require('../db/database');

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  webpush.setVapidDetails(
    `mailto:${VAPID_EMAIL || 'admin@greenguild.ai'}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  vapidConfigured = true;
}

/**
 * Send a push notification to all active subscriptions for a user.
 * Silently removes expired/invalid subscriptions (HTTP 410/404).
 */
async function sendPushToUser(userId, payload) {
  ensureVapid();
  if (!vapidConfigured) return;

  const subs = all(await db.execute({
    sql: 'SELECT * FROM push_subscriptions WHERE user_id = ?',
    args: [userId],
  }));

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.execute({
            sql: 'DELETE FROM push_subscriptions WHERE endpoint = ?',
            args: [sub.endpoint],
          });
        }
      }
    })
  );
}

module.exports = { sendPushToUser };

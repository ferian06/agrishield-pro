const express = require('express');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /v1/notifications/subscribe
router.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth
    ) {
      return res.status(400).json({ message: 'Invalid subscription object.' });
    }

    const { lat, lng } = req.body;
    await db.execute({
      sql: `INSERT OR REPLACE INTO push_subscriptions (user_id, endpoint, p256dh, auth, lat, lng)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [req.user.id, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, lat || null, lng || null],
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /v1/notifications/unsubscribe
router.delete('/unsubscribe', requireAuth, async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM push_subscriptions WHERE user_id = ?',
      args: [req.user.id],
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

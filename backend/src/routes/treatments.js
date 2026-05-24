const express = require('express');
const { db, one, all } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /v1/treatments — log a treatment as applied
router.post('/', requireAuth, async (req, res) => {
  try {
    const { scanId, note } = req.body;
    if (!scanId) return res.status(400).json({ message: 'scanId is required.' });

    const scan = one(await db.execute({
      sql: 'SELECT id FROM scans WHERE id = ? AND user_id = ?',
      args: [parseInt(scanId), req.user.id],
    }));
    if (!scan) return res.status(404).json({ message: 'Scan not found.' });

    const result = await db.execute({
      sql: 'INSERT INTO treatment_logs (scan_id, user_id, note) VALUES (?, ?, ?)',
      args: [parseInt(scanId), req.user.id, note || null],
    });

    const log = one(await db.execute({
      sql: 'SELECT * FROM treatment_logs WHERE id = ?',
      args: [Number(result.lastInsertRowid)],
    }));

    res.status(201).json({ log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /v1/treatments/history — all treatment logs for user
router.get('/history', requireAuth, async (req, res) => {
  try {
    const logs = all(await db.execute({
      sql: `SELECT t.id, t.scan_id, t.note, t.applied_at, s.disease, s.crop_type
            FROM treatment_logs t
            JOIN scans s ON s.id = t.scan_id
            WHERE t.user_id = ?
            ORDER BY t.applied_at DESC`,
      args: [req.user.id],
    }));
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /v1/treatments/scan/:scanId — most recent treatment log for a scan
router.get('/scan/:scanId', requireAuth, async (req, res) => {
  try {
    const log = one(await db.execute({
      sql: 'SELECT * FROM treatment_logs WHERE scan_id = ? AND user_id = ? ORDER BY applied_at DESC LIMIT 1',
      args: [parseInt(req.params.scanId), req.user.id],
    }));
    res.json({ log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

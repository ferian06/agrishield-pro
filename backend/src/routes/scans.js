const express = require('express');
const { db, one, all } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Stub AI diagnosis — swap for Plant.id / Roboflow API when ready
function diagnose(cropType) {
  const library = {
    tomato: [
      { disease: 'Early Blight',   confidence: 0.87, severity: 'Moderate', recommendations: ['Remove affected leaves immediately', 'Apply copper-based fungicide every 7–10 days', 'Avoid overhead watering', 'Ensure good air circulation'] },
      { disease: 'Late Blight',    confidence: 0.91, severity: 'High',     recommendations: ['Apply mancozeb or chlorothalonil fungicide', 'Destroy infected plant material', 'Do not compost affected tissue', 'Monitor neighbouring plants closely'] },
      { disease: 'Healthy',        confidence: 0.95, severity: 'None',     recommendations: ['Continue current care routine', 'Monitor weekly for early signs of stress', 'Maintain consistent watering schedule'] },
    ],
    corn: [
      { disease: 'Gray Leaf Spot',              confidence: 0.83, severity: 'Moderate', recommendations: ['Apply foliar fungicide at early signs', 'Rotate crops next season', 'Use resistant hybrid varieties', 'Improve field drainage'] },
      { disease: 'Northern Corn Leaf Blight',   confidence: 0.88, severity: 'High',     recommendations: ['Apply triazole fungicide', 'Remove heavily infected debris after harvest', 'Plant resistant varieties', 'Scout fields every 5–7 days'] },
      { disease: 'Healthy',                     confidence: 0.93, severity: 'None',     recommendations: ['Crop looks healthy — continue monitoring', 'Maintain soil fertility', 'Check for pest pressure during tasselling'] },
    ],
    wheat: [
      { disease: 'Stripe Rust',    confidence: 0.89, severity: 'High',     recommendations: ['Apply propiconazole or tebuconazole fungicide', 'Scout weekly', 'Use certified disease-free seed', 'Report outbreaks to local agriculture office'] },
      { disease: 'Powdery Mildew', confidence: 0.84, severity: 'Moderate', recommendations: ['Apply sulfur-based fungicide', 'Improve air circulation', 'Avoid excess nitrogen fertiliser', 'Remove crop debris after harvest'] },
      { disease: 'Healthy',        confidence: 0.96, severity: 'None',     recommendations: ['No disease detected', 'Continue standard crop management', 'Reassess at heading stage'] },
    ],
  };
  const pool = library[cropType?.toLowerCase()] || library.tomato;
  return pool[Math.floor(Math.random() * pool.length)];
}

// POST /v1/scans
router.post('/', requireAuth, async (req, res) => {
  try {
    const { image, cropType } = req.body;
    if (!cropType) return res.status(400).json({ message: 'cropType is required.' });

    const result_diag = diagnose(cropType);
    const result = await db.execute({
      sql: `INSERT INTO scans (user_id, crop_type, image_data, disease, confidence, severity, recommendations, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')`,
      args: [req.user.id, cropType, image || null, result_diag.disease, result_diag.confidence, result_diag.severity, JSON.stringify(result_diag.recommendations)],
    });

    res.status(201).json({
      scanId: Number(result.lastInsertRowid),
      disease: result_diag.disease,
      confidence: result_diag.confidence,
      severity: result_diag.severity,
      recommendations: result_diag.recommendations,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /v1/scans/history  — must come BEFORE /:id routes
router.get('/history', requireAuth, async (req, res) => {
  try {
    const scans = all(await db.execute({
      sql: `SELECT id, crop_type, disease, confidence, severity, recommendations, status, created_at
            FROM scans WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      args: [req.user.id],
    })).map(parseScan);
    res.json({ scans });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /v1/scans/:id/diagnosis
router.get('/:id/diagnosis', requireAuth, async (req, res) => {
  try {
    const scan = one(await db.execute({
      sql: 'SELECT * FROM scans WHERE id = ? AND user_id = ?',
      args: [parseInt(req.params.id), req.user.id],
    }));
    if (!scan) return res.status(404).json({ message: 'Scan not found.' });
    res.json(parseScan(scan));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /v1/scans/:id/feedback
router.post('/:id/feedback', requireAuth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!['up', 'down'].includes(rating))
      return res.status(400).json({ message: "rating must be 'up' or 'down'." });

    const scan = one(await db.execute({
      sql: 'SELECT id FROM scans WHERE id = ? AND user_id = ?',
      args: [parseInt(req.params.id), req.user.id],
    }));
    if (!scan) return res.status(404).json({ message: 'Scan not found.' });

    await db.execute({
      sql: 'INSERT INTO scan_feedback (scan_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      args: [scan.id, req.user.id, rating, comment || null],
    });

    res.json({ message: 'Feedback recorded. Thank you!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function parseScan(s) {
  return { ...s, recommendations: s.recommendations ? JSON.parse(s.recommendations) : [] };
}

module.exports = router;

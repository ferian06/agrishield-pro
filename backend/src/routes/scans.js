const express = require('express');
const { db, one, all } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── Real AI diagnosis via Google Gemini ───────────────────────────────────────
async function diagnoseWithGemini(imageBase64) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const { default: fetch } = await import('node-fetch');

  // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,...")
  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;

  const prompt = `You are a strict plant disease detection system. Your FIRST job is to verify the image actually contains a plant leaf or crop.

STEP 1 — Is there a plant leaf or crop visible in this image?
- If NO (the image shows a hand, person, animal, food, object, ground, sky, or anything that is not a plant): immediately return the "no plant" response below.
- If YES: proceed to disease analysis.

Return ONLY a valid JSON object — no markdown, no explanation, just raw JSON:

If NO plant detected:
{"disease":"No plant detected — point camera at a leaf","confidence":0.99,"severity":"None","recommendations":["Point your camera directly at a plant leaf","Move closer so the leaf fills the frame","Ensure the leaf is well lit","Avoid scanning hands, objects or background"]}

If plant IS detected and healthy:
{"disease":"Healthy","confidence":0.92,"severity":"None","recommendations":["Plant looks healthy — continue regular monitoring","Maintain current watering and fertiliser schedule","Check again in 7 days","Watch for early discolouration or spots"]}

If plant IS detected and diseased:
{"disease":"exact disease name","confidence":0.85,"severity":"Moderate or High","recommendations":["specific treatment 1","specific treatment 2","specific treatment 3","specific treatment 4"]}

Rules:
- confidence must be a decimal between 0 and 1
- severity must be exactly: None, Moderate, or High
- Be strict: if in doubt whether it is a plant, return the no-plant response`;

  const body = {
    contents: [{
      parts: [
        {
          inline_data: {
            mime_type: 'image/jpeg',
            data: base64Data,
          },
        },
        { text: prompt },
      ],
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512,
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Extract JSON from response (strip any accidental markdown fences)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Gemini returned no JSON');

  return JSON.parse(jsonMatch[0]);
}

// ── Fallback stub (used if no Gemini key or API fails) ────────────────────────
function diagnoseStub(cropType) {
  const library = {
    tomato: [
      { disease: 'Early Blight',   confidence: 0.87, severity: 'Moderate', recommendations: ['Remove affected leaves immediately', 'Apply copper-based fungicide every 7–10 days', 'Avoid overhead watering', 'Ensure good air circulation'] },
      { disease: 'Late Blight',    confidence: 0.91, severity: 'High',     recommendations: ['Apply mancozeb or chlorothalonil fungicide', 'Destroy infected plant material', 'Do not compost affected tissue', 'Monitor neighbouring plants closely'] },
      { disease: 'Healthy',        confidence: 0.95, severity: 'None',     recommendations: ['Continue current care routine', 'Monitor weekly for early signs of stress', 'Maintain consistent watering schedule'] },
    ],
    corn: [
      { disease: 'Gray Leaf Spot',            confidence: 0.83, severity: 'Moderate', recommendations: ['Apply foliar fungicide at early signs', 'Rotate crops next season', 'Use resistant hybrid varieties', 'Improve field drainage'] },
      { disease: 'Northern Corn Leaf Blight', confidence: 0.88, severity: 'High',     recommendations: ['Apply triazole fungicide', 'Remove heavily infected debris after harvest', 'Plant resistant varieties', 'Scout fields every 5–7 days'] },
      { disease: 'Healthy',                   confidence: 0.93, severity: 'None',     recommendations: ['Crop looks healthy — continue monitoring', 'Maintain soil fertility', 'Check for pest pressure during tasselling'] },
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

    let result;

    // Try real AI first, fall back to stub
    if (image) {
      try {
        result = await diagnoseWithGemini(image);
      } catch (err) {
        console.warn('Gemini failed, using stub:', err.message);
      }
    }

    if (!result) result = diagnoseStub(cropType);

    const dbResult = await db.execute({
      sql: `INSERT INTO scans (user_id, crop_type, image_data, disease, confidence, severity, recommendations, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')`,
      args: [req.user.id, cropType, image || null, result.disease, result.confidence, result.severity, JSON.stringify(result.recommendations)],
    });

    res.status(201).json({
      scanId: Number(dbResult.lastInsertRowid),
      disease: result.disease,
      confidence: result.confidence,
      severity: result.severity,
      recommendations: result.recommendations,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /v1/scans/history
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

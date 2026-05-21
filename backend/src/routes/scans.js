const express = require('express');
const { db, one, all } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── Hugging Face plant disease detection ──────────────────────────────────────
async function diagnoseWithHuggingFace(imageBase64) {
  const token = process.env.HF_TOKEN;
  if (!token) return null;

  const { default: fetch } = await import('node-fetch');

  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;

  const imageBuffer = Buffer.from(base64Data, 'base64');

  const res = await fetch(
    'https://api-inference.huggingface.co/models/linkanjarad/plant-disease-detection',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'image/jpeg',
      },
      body: imageBuffer,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF API error: ${res.status} — ${err.slice(0, 200)}`);
  }

  const results = await res.json();

  // Model returns [{ label: 'Tomato___Early_blight', score: 0.92 }, ...]
  if (!Array.isArray(results) || results.length === 0) return null;

  const top = results[0];
  const parts = top.label.split('___');
  const diseasePart = parts[1] ? parts[1].replace(/_/g, ' ').trim() : parts[0].replace(/_/g, ' ').trim();
  const isHealthy = diseasePart.toLowerCase().includes('healthy');

  const disease     = isHealthy ? 'Healthy' : diseasePart;
  const confidence  = top.score;
  const severity    = isHealthy ? 'None' : confidence > 0.7 ? 'High' : 'Moderate';
  const recommendations = getRecommendations(disease, isHealthy);

  return { disease, confidence, severity, recommendations };
}

function getRecommendations(disease, isHealthy) {
  if (isHealthy) return [
    'Plant looks healthy — continue regular monitoring',
    'Maintain consistent watering schedule',
    'Check again in 7 days',
    'Watch for early discolouration or spots',
  ];

  const map = {
    'early blight':     ['Remove infected leaves immediately', 'Apply copper-based fungicide every 7 days', 'Avoid overhead watering', 'Ensure good air circulation between plants'],
    'late blight':      ['Apply mancozeb or chlorothalonil fungicide immediately', 'Remove and destroy infected plant material', 'Do not compost affected tissue', 'Monitor neighbouring plants closely'],
    'common rust':      ['Apply foliar fungicide at first signs', 'Remove severely infected leaves', 'Improve air circulation', 'Use resistant varieties next season'],
    'leaf spot':        ['Apply copper fungicide spray', 'Remove and dispose of infected leaves', 'Avoid wetting foliage when watering', 'Maintain proper plant spacing'],
    'powdery mildew':   ['Apply sulfur-based fungicide', 'Improve air circulation around plants', 'Avoid excess nitrogen fertiliser', 'Water at base, not on leaves'],
    'bacterial spot':   ['Apply copper bactericide', 'Remove infected plant parts', 'Avoid working with plants when wet', 'Rotate crops next season'],
    'leaf blight':      ['Apply fungicide spray immediately', 'Remove infected plant debris', 'Avoid overhead irrigation', 'Scout field every 5 days'],
    'mosaic virus':     ['Remove and destroy infected plants immediately', 'Control aphid populations with insecticide', 'Use virus-free seed next season', 'Disinfect tools between plants'],
    'yellow leaf curl': ['Remove infected plants to prevent spread', 'Control whitefly with insecticide', 'Use reflective mulch to deter insects', 'Plant resistant varieties'],
  };

  const d = disease.toLowerCase();
  for (const [key, recs] of Object.entries(map)) {
    if (d.includes(key)) return recs;
  }

  return [
    `Treat for ${disease} with appropriate fungicide`,
    'Remove and destroy visibly infected plant material',
    'Improve air circulation around affected plants',
    'Consult your local agricultural extension officer',
  ];
}

// ── Groq vision fallback ──────────────────────────────────────────────────────
async function diagnoseWithGroq(imageBase64) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const { default: fetch } = await import('node-fetch');

  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;

  const prompt = `You are a strict plant disease detection system. First check: does this image show a plant leaf or crop?

If NO plant visible return exactly this JSON:
{"disease":"No plant detected — point camera at a leaf","confidence":0.99,"severity":"None","recommendations":["Point camera at a plant leaf","Move closer so the leaf fills the frame","Ensure good lighting","Tap scan again"]}

If plant IS healthy:
{"disease":"Healthy","confidence":0.92,"severity":"None","recommendations":["Plant looks healthy","Continue regular monitoring","Check again in 7 days","Watch for early discolouration"]}

If plant IS diseased:
{"disease":"exact disease name","confidence":0.85,"severity":"Moderate or High","recommendations":["treatment 1","treatment 2","treatment 3","treatment 4"]}

Return ONLY raw JSON, no markdown, no explanation.`;

  const body = {
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Data}` } },
        { type: 'text', text: prompt },
      ],
    }],
    max_tokens: 512,
    temperature: 0.1,
  };

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Groq error: ${res.status} — ${errBody.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Groq returned no JSON');
  return JSON.parse(jsonMatch[0]);
}

// ── Gemini fallback ───────────────────────────────────────────────────────────
async function diagnoseWithGemini(imageBase64) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const { default: fetch } = await import('node-fetch');

  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;

  const prompt = `You are a strict plant disease detection system. First check: does this image show a plant leaf or crop?

If NO plant visible, return exactly:
{"disease":"No plant detected — point camera at a leaf","confidence":0.99,"severity":"None","recommendations":["Point camera at a plant leaf","Move closer so the leaf fills the frame","Ensure good lighting","Tap scan again"]}

If plant IS healthy, return:
{"disease":"Healthy","confidence":0.92,"severity":"None","recommendations":["Plant looks healthy","Continue regular monitoring","Check again in 7 days","Watch for early discolouration"]}

If plant IS diseased:
{"disease":"exact disease name","confidence":0.85,"severity":"Moderate or High","recommendations":["treatment 1","treatment 2","treatment 3","treatment 4"]}

Return ONLY raw JSON, no markdown.`;

  const body = {
    contents: [{ parts: [{ inline_data: { mime_type: 'image/jpeg', data: base64Data } }, { text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini error: ${res.status} — ${errBody.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Gemini returned no JSON');
  return JSON.parse(jsonMatch[0]);
}

// ── Stub fallback ─────────────────────────────────────────────────────────────
function diagnoseStub(cropType) {
  const library = {
    tomato:  [
      { disease: 'Early Blight',   confidence: 0.87, severity: 'Moderate', recommendations: ['Remove affected leaves', 'Apply copper fungicide every 7 days', 'Avoid overhead watering', 'Ensure good air circulation'] },
      { disease: 'Late Blight',    confidence: 0.91, severity: 'High',     recommendations: ['Apply mancozeb fungicide immediately', 'Destroy infected material', 'Do not compost affected tissue', 'Monitor neighbouring plants'] },
      { disease: 'Healthy',        confidence: 0.95, severity: 'None',     recommendations: ['Continue current care routine', 'Monitor weekly', 'Maintain consistent watering'] },
    ],
    default: [
      { disease: 'Leaf Spot',      confidence: 0.82, severity: 'Moderate', recommendations: ['Apply copper fungicide', 'Remove infected leaves', 'Avoid wetting foliage', 'Maintain plant spacing'] },
      { disease: 'Healthy',        confidence: 0.93, severity: 'None',     recommendations: ['Plant looks healthy', 'Continue monitoring', 'Maintain good soil health'] },
    ],
  };
  const pool = library[cropType?.toLowerCase()] || library.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

// POST /v1/scans
router.post('/', requireAuth, async (req, res) => {
  try {
    const { image, cropType } = req.body;
    if (!cropType) return res.status(400).json({ message: 'cropType is required.' });

    let result = null;
    let aiProvider = 'stub';

    if (image) {
      // 1. Try Hugging Face
      if (process.env.HF_TOKEN) {
        try {
          console.log('[scan] Calling Hugging Face...');
          result = await diagnoseWithHuggingFace(image);
          if (result) { aiProvider = 'huggingface'; console.log('[scan] HF result:', result.disease); }
        } catch (err) {
          console.error('[scan] HF error:', err.message);
        }
      }

      // 2. Try Groq if HF failed
      if (!result && process.env.GROQ_API_KEY) {
        try {
          console.log('[scan] Calling Groq...');
          result = await diagnoseWithGroq(image);
          if (result) { aiProvider = 'groq'; console.log('[scan] Groq result:', result.disease); }
        } catch (err) {
          console.error('[scan] Groq error:', err.message);
        }
      }

      // 3. Try Gemini if Groq failed
      if (!result && process.env.GEMINI_API_KEY) {
        try {
          console.log('[scan] Calling Gemini...');
          result = await diagnoseWithGemini(image);
          if (result) { aiProvider = 'gemini'; console.log('[scan] Gemini result:', result.disease); }
        } catch (err) {
          console.error('[scan] Gemini error:', err.message);
        }
      }
    } else {
      console.warn('[scan] No image received — using stub');
    }

    if (!result) {
      console.warn('[scan] All AI providers failed — using stub');
      result = diagnoseStub(cropType);
    }

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
      aiProvider,
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

const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/database');

const authRoutes      = require('./routes/auth');
const communityRoutes = require('./routes/community');
const scanRoutes      = require('./routes/scans');
const weatherRoutes   = require('./routes/weather');

const app = express();

const ALLOWED_ORIGINS = [
  'https://agrishield-pro-henna.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'GreenGuild API' }));

app.use('/v1/auth',      authRoutes);
app.use('/v1/community', communityRoutes);
app.use('/v1/scans',     scanRoutes);
app.use('/v1/weather',   weatherRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error.' });
});

const PORT = process.env.PORT || 3001;

initDb()
  .then(() => app.listen(PORT, () => console.log(`GreenGuild API running on port ${PORT}`)))
  .catch(err => { console.error('DB init failed:', err); process.exit(1); });

const express = require('express');
const bcrypt = require('bcryptjs');
const { db, one } = require('../db/database');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const existing = one(await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email.toLowerCase()] }));
    if (existing)
      return res.status(409).json({ message: 'An account with this email already exists.' });

    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.execute({
      sql: 'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      args: [name.trim(), email.toLowerCase(), password_hash],
    });

    const user = { id: Number(result.lastInsertRowid), name: name.trim(), email: email.toLowerCase() };
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'email and password are required.' });

    const user = one(await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email.toLowerCase()] }));
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const safe = { id: user.id, name: user.name, email: user.email };
    res.json({ token: signToken(safe), user: safe });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /v1/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = one(await db.execute({
      sql: 'SELECT id, name, email, created_at FROM users WHERE id = ?',
      args: [req.user.id],
    }));
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /v1/auth/stats — scan count, post count, member since
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [scansRow, postsRow, userRow] = await Promise.all([
      db.execute({ sql: 'SELECT COUNT(*) AS n FROM scans WHERE user_id = ?',  args: [req.user.id] }),
      db.execute({ sql: 'SELECT COUNT(*) AS n FROM posts WHERE user_id = ?',  args: [req.user.id] }),
      db.execute({ sql: 'SELECT created_at FROM users WHERE id = ?',           args: [req.user.id] }),
    ]);
    res.json({
      scanCount:   one(scansRow)?.n  || 0,
      postCount:   one(postsRow)?.n  || 0,
      memberSince: one(userRow)?.created_at || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

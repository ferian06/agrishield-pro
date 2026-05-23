const express = require('express');
const { db, one, all } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /v1/community/posts?page=1&limit=20
router.get('/posts', requireAuth, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const posts = all(await db.execute({
      sql: `
        SELECT
          p.id, p.content, p.tag, p.scan_id, p.image_data, p.created_at,
          u.id   AS author_id,
          u.name AS author_name,
          (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes,
          (SELECT COUNT(*) FROM comments   WHERE post_id = p.id) AS comment_count,
          EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) AS liked_by_me
        FROM posts p
        JOIN users u ON u.id = p.user_id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [req.user.id, limit, offset],
    }));

    const totalRow = one(await db.execute({ sql: 'SELECT COUNT(*) AS n FROM posts', args: [] }));
    res.json({ posts, total: totalRow.n, page, limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /v1/community/posts
router.post('/posts', requireAuth, async (req, res) => {
  try {
    const { content, tag, scanId, imageData } = req.body;
    if (!content || !content.trim())
      return res.status(400).json({ message: 'content is required.' });

    const result = await db.execute({
      sql: 'INSERT INTO posts (user_id, content, tag, scan_id, image_data) VALUES (?, ?, ?, ?, ?)',
      args: [req.user.id, content.trim(), tag || null, scanId || null, imageData || null],
    });

    const post = one(await db.execute({
      sql: `
        SELECT p.id, p.content, p.tag, p.scan_id, p.image_data, p.created_at,
               u.id AS author_id, u.name AS author_name,
               0 AS likes, 0 AS comment_count, 0 AS liked_by_me
        FROM posts p JOIN users u ON u.id = p.user_id
        WHERE p.id = ?
      `,
      args: [Number(result.lastInsertRowid)],
    }));

    res.status(201).json({ post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /v1/community/posts/:id/like
router.post('/posts/:id/like', requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = one(await db.execute({ sql: 'SELECT id FROM posts WHERE id = ?', args: [postId] }));
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const existing = one(await db.execute({
      sql: 'SELECT 1 AS found FROM post_likes WHERE user_id = ? AND post_id = ?',
      args: [req.user.id, postId],
    }));

    if (existing) {
      await db.execute({ sql: 'DELETE FROM post_likes WHERE user_id = ? AND post_id = ?', args: [req.user.id, postId] });
    } else {
      await db.execute({ sql: 'INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)', args: [req.user.id, postId] });
    }

    const likesRow = one(await db.execute({ sql: 'SELECT COUNT(*) AS n FROM post_likes WHERE post_id = ?', args: [postId] }));
    res.json({ liked: !existing, likes: likesRow.n });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /v1/community/posts/:id/comments
router.get('/posts/:id/comments', requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const comments = all(await db.execute({
      sql: `SELECT c.id, c.text, c.created_at, u.id AS author_id, u.name AS author_name
            FROM comments c JOIN users u ON u.id = c.user_id
            WHERE c.post_id = ? ORDER BY c.created_at ASC`,
      args: [postId],
    }));
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /v1/community/posts/:id/comments
router.post('/posts/:id/comments', requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'text is required.' });

    const post = one(await db.execute({ sql: 'SELECT id FROM posts WHERE id = ?', args: [postId] }));
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const result = await db.execute({
      sql: 'INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)',
      args: [postId, req.user.id, text.trim()],
    });

    const comment = one(await db.execute({
      sql: `
        SELECT c.id, c.text, c.created_at, u.id AS author_id, u.name AS author_name
        FROM comments c JOIN users u ON u.id = c.user_id
        WHERE c.id = ?
      `,
      args: [Number(result.lastInsertRowid)],
    }));

    res.status(201).json({ comment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require('express');
const { db, all } = require('../db/database');

const router = express.Router();

// Simple secret check — uses your JWT_SECRET env var as the admin password
function checkSecret(req, res, next) {
  const secret = process.env.JWT_SECRET || 'greenguild-dev-secret-change-in-prod';
  if (req.query.secret !== secret) {
    return res.status(401).send('Unauthorized');
  }
  next();
}

// GET /v1/admin?secret=YOUR_JWT_SECRET
// Returns a simple HTML page showing all data
router.get('/', checkSecret, async (req, res) => {
  const users  = all(await db.execute({ sql: 'SELECT id, name, email, created_at FROM users ORDER BY id DESC', args: [] }));
  const posts  = all(await db.execute({ sql: 'SELECT p.id, p.content, p.tag, p.created_at, u.name AS author FROM posts p JOIN users u ON u.id = p.user_id ORDER BY p.id DESC', args: [] }));
  const scans  = all(await db.execute({ sql: 'SELECT s.id, s.crop_type, s.disease, s.confidence, s.severity, s.created_at, u.name AS author FROM scans s JOIN users u ON u.id = s.user_id ORDER BY s.id DESC', args: [] }));

  const table = (title, rows) => {
    if (!rows.length) return `<h2>${title}</h2><p style="color:#999">No records yet.</p>`;
    const cols = Object.keys(rows[0]);
    return `
      <h2>${title} (${rows.length})</h2>
      <table>
        <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}<th>action</th></tr></thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              ${cols.map(c => `<td>${r[c] ?? ''}</td>`).join('')}
              <td><a href="/v1/admin/delete/${title.toLowerCase()}/${r.id}?secret=${req.query.secret}"
                onclick="return confirm('Delete this record?')" style="color:red">delete</a></td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  };

  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>GreenGuild Admin</title>
  <style>
    body { font-family: sans-serif; padding: 24px; background: #f5f5f5; }
    h1 { color: #1a4a1a; }
    h2 { margin-top: 32px; color: #333; }
    table { border-collapse: collapse; width: 100%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
    th { background: #1a4a1a; color: white; padding: 10px 12px; text-align: left; font-size: 12px; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    tr:last-child td { border-bottom: none; }
    p { color: #666; }
  </style>
</head>
<body>
  <h1>GreenGuild Admin Panel</h1>
  <p>Bookmark this page (keep the secret in the URL safe).</p>
  ${table('Users', users)}
  ${table('Posts', posts)}
  ${table('Scans', scans)}
</body>
</html>`);
});

// GET /v1/admin/delete/:table/:id?secret=...
router.get('/delete/:tbl/:id', checkSecret, async (req, res) => {
  const { tbl, id } = req.params;
  const allowed = ['users', 'posts', 'scans', 'comments', 'post_likes'];
  if (!allowed.includes(tbl)) return res.status(400).send('Invalid table');
  await db.execute({ sql: `DELETE FROM ${tbl} WHERE id = ?`, args: [parseInt(id)] });
  res.redirect(`/v1/admin?secret=${req.query.secret}`);
});

module.exports = router;

const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = createClient({
  url: `file:${path.join(DB_DIR, 'greenguild.db')}`,
});

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    UNIQUE NOT NULL,
    password_hash TEXT    NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS posts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    content     TEXT    NOT NULL,
    tag         TEXT,
    scan_id     INTEGER,
    image_data  TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS post_likes (
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, post_id)
  );
  CREATE TABLE IF NOT EXISTS comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id    INTEGER NOT NULL,
    user_id    INTEGER NOT NULL,
    text       TEXT    NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS scans (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    crop_type       TEXT    NOT NULL,
    image_data      TEXT,
    disease         TEXT,
    confidence      REAL,
    severity        TEXT,
    recommendations TEXT,
    status          TEXT DEFAULT 'completed',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS scan_feedback (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id    INTEGER NOT NULL,
    user_id    INTEGER NOT NULL,
    rating     TEXT    NOT NULL,
    comment    TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

async function initDb() {
  // Execute each statement individually (libsql batch for DDL)
  const statements = SCHEMA
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => ({ sql: s, args: [] }));
  await db.batch(statements, 'write');
}

// Helper: first row or null
function one(result) {
  return result.rows.length > 0 ? Object.fromEntries(
    Object.entries(result.rows[0])
  ) : null;
}

// Helper: all rows as plain objects
function all(result) {
  return result.rows.map(row => Object.fromEntries(Object.entries(row)));
}

module.exports = { db, initDb, one, all };

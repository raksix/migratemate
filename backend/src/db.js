import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH
  ? process.env.DB_PATH
  : (() => {
      const dir = path.join(__dirname, '..', 'data');
      mkdirSync(dir, { recursive: true });
      return path.join(dir, 'app.db');
    })();

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    detail TEXT DEFAULT '',
    createdAt TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    createdAt TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
`);

const RESOURCE = 'migration-plans';
const SECRET = process.env.SECRET || 'dev-secret-change-me';

// ---------- items CRUD ----------

export function list({ q = '', page = 1, limit = 20, sort = 'desc' } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const order = String(sort).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const where = q ? 'WHERE title LIKE ? OR detail LIKE ?' : '';
  const params = q ? [`%${q}%`, `%${q}%`] : [];
  const total = db.prepare(`SELECT COUNT(*) AS c FROM items ${where}`).get(...params).c;
  const items = db
    .prepare(`SELECT * FROM items ${where} ORDER BY createdAt ${order} LIMIT ? OFFSET ?`)
    .all(...params, l, (p - 1) * l);
  return { items, page: p, limit: l, total, pages: Math.max(1, Math.ceil(total / l)) };
}

export function get(id) {
  return db.prepare('SELECT * FROM items WHERE id = ?').get(id) ?? null;
}

export function create(payload) {
  const id = randomUUID();
  db.prepare('INSERT INTO items (id, title, detail) VALUES (?, ?, ?)').run(
    id, payload.title, payload.detail ?? '');
  return get(id);
}

export function update(id, payload) {
  const cur = get(id);
  if (!cur) return null;
  db.prepare('UPDATE items SET title = ?, detail = ? WHERE id = ?').run(
    payload.title ?? cur.title, payload.detail ?? cur.detail, id);
  return get(id);
}

export function remove(id) {
  return db.prepare('DELETE FROM items WHERE id = ?').run(id).changes > 0;
}

// ---------- auth ----------

function hashPw(pw) {
  const salt = randomBytes(16).toString('hex');
  const h = scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${h}`;
}

function verifyPw(pw, stored) {
  const [salt, h] = String(stored).split(':');
  const a = scryptSync(pw, salt, 64);
  const b = Buffer.from(h, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

function signToken(payload) {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function verifyToken(token) {
  const [b64, sig] = String(token).split('.');
  if (!b64 || !sig) return null;
  const expected = createHmac('sha256', SECRET).update(b64).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function register(email, password) {
  email = String(email ?? '').trim().toLowerCase();
  if (!email.includes('@')) return { error: 'invalid email' };
  if (!password || String(password).length < 6) return { error: 'password must be at least 6 characters' };
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return { error: 'email already registered' };
  const id = randomUUID();
  db.prepare('INSERT INTO users (id, email, passwordHash) VALUES (?, ?, ?)')
    .run(id, email, hashPw(String(password)));
  return { token: signToken({ sub: id, email, exp: Date.now() + 7 * 24 * 3600 * 1000 }), user: { id, email } };
}

export function login(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?')
    .get(String(email ?? '').trim().toLowerCase());
  if (!user || !verifyPw(String(password), user.passwordHash)) return { error: 'invalid credentials' };
  return {
    token: signToken({ sub: user.id, email: user.email, exp: Date.now() + 7 * 24 * 3600 * 1000 }),
    user: { id: user.id, email: user.email },
  };
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ error: 'unauthorized' });
  req.auth = payload;
  next();
}

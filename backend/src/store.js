import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const RESOURCE = 'migration-plans';

function ensure() {
  mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DB_FILE)) {
    writeFileSync(DB_FILE, JSON.stringify({ [RESOURCE]: [] }, null, 2), 'utf8');
  }
}

function readAll() {
  ensure();
  return JSON.parse(readFileSync(DB_FILE, 'utf8'));
}

function writeAll(db) {
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

export function list() {
  return readAll()[RESOURCE];
}

export function get(id) {
  return readAll()[RESOURCE].find((r) => r.id === id) ?? null;
}

export function create(payload) {
  const db = readAll();
  const item = { id: randomUUID(), createdAt: new Date().toISOString(), ...payload };
  db[RESOURCE].push(item);
  writeAll(db);
  return item;
}

export function update(id, payload) {
  const db = readAll();
  const idx = db[RESOURCE].findIndex((r) => r.id === id);
  if (idx === -1) return null;
  db[RESOURCE][idx] = { ...db[RESOURCE][idx], ...payload, id };
  writeAll(db);
  return db[RESOURCE][idx];
}

export function remove(id) {
  const db = readAll();
  const before = db[RESOURCE].length;
  db[RESOURCE] = db[RESOURCE].filter((r) => r.id !== id);
  writeAll(db);
  return db[RESOURCE].length < before;
}

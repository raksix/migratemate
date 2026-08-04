import express from 'express';
import cors from 'cors';
import { create, get, list, login, register, remove, requireAuth, update } from './db.js';

const RESOURCE = 'migration-plans';
const BASE = `/api/${RESOURCE}`;

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'api', resource: RESOURCE, time: new Date().toISOString() });
  });

  app.post('/api/auth/register', (req, res) => {
    const out = register(req.body?.email, req.body?.password);
    if (out.error) return res.status(400).json({ error: out.error });
    res.status(201).json(out);
  });

  app.post('/api/auth/login', (req, res) => {
    const out = login(req.body?.email, req.body?.password);
    if (out.error) return res.status(401).json({ error: out.error });
    res.json(out);
  });

  app.get(BASE, requireAuth, (req, res) => res.json(list(req.query)));
  app.get(`${BASE}/:id`, requireAuth, (req, res) => {
    const item = get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });
  app.post(BASE, requireAuth, (req, res) => {
    const title = req.body?.title;
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'title is required' });
    res.status(201).json(create({ title, detail: req.body?.detail ?? '' }));
  });
  app.put(`${BASE}/:id`, requireAuth, (req, res) => {
    const item = update(req.params.id, req.body ?? {});
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });
  app.delete(`${BASE}/:id`, requireAuth, (req, res) => {
    const ok = remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  });

  app.use((req, res) => res.status(404).json({ error: `Unknown route: ${req.method} ${req.path}` }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

import express from 'express';
import cors from 'cors';
import { create, get, list, remove, update } from './store.js';

const RESOURCE = 'migration-plans';
const BASE = `/api/${RESOURCE}`;

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'api', resource: RESOURCE, time: new Date().toISOString() });
  });

  app.get(BASE, (_req, res) => {
    res.json(list());
  });

  app.get(`${BASE}/:id`, (req, res) => {
    const item = get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });

  app.post(BASE, (req, res) => {
    const payload = req.body ?? {};
    if (!payload.title) {
      return res.status(400).json({ error: 'title is required' });
    }
    res.status(201).json(create(payload));
  });

  app.put(`${BASE}/:id`, (req, res) => {
    const item = update(req.params.id, req.body ?? {});
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });

  app.delete(`${BASE}/:id`, (req, res) => {
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

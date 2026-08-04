import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

const server = createApp().listen(0);
const base = 'http://127.0.0.1:' + server.address().port + '/api/migration-plans';

test.after(() => server.close());

async function req(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

test('health check', async () => {
  const res = await req('GET', 'http://127.0.0.1:' + server.address().port + '/api/health');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
});

test('list is empty initially', async () => {
  const res = await req('GET', base);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), []);
});

test('create requires title', async () => {
  const res = await req('POST', base, {});
  assert.equal(res.status, 400);
});

test('full CRUD flow', async () => {
  const created = await req('POST', base, { title: 'Demo item', detail: 'first' });
  assert.equal(created.status, 201);
  const item = await created.json();
  assert.ok(item.id);

  const got = await req('GET', `${base}/${item.id}`);
  assert.equal(got.status, 200);

  const updated = await req('PUT', `${base}/${item.id}`, { detail: 'updated' });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).detail, 'updated');

  const del = await req('DELETE', `${base}/${item.id}`);
  assert.equal(del.status, 204);

  const missing = await req('GET', `${base}/${item.id}`);
  assert.equal(missing.status, 404);
});

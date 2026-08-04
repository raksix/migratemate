process.env.DB_PATH = ':memory:';
import test from 'node:test';
import assert from 'node:assert/strict';

const { createApp } = await import('../src/app.js');

const server = createApp().listen(0);
const port = server.address().port;
const base = `http://127.0.0.1:${port}/api/migration-plans`;
const authBase = `http://127.0.0.1:${port}/api/auth`;

test.after(() => server.close());

let token = '';

async function req(method, url, body, tok) {
  const headers = body ? { 'content-type': 'application/json' } : {};
  if (tok) headers.authorization = `Bearer ${tok}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

test('health check is public', async () => {
  const res = await req('GET', `http://127.0.0.1:${port}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
});

test('register + login issues a token', async () => {
  const reg = await req('POST', `${authBase}/register`, { email: 'demo@example.com', password: 'secret123' });
  assert.equal(reg.status, 201);
  const loginRes = await req('POST', `${authBase}/login`, { email: 'demo@example.com', password: 'secret123' });
  assert.equal(loginRes.status, 200);
  const data = await loginRes.json();
  assert.ok(data.token);
  token = data.token;
});

test('protected routes reject missing token', async () => {
  const res = await req('GET', base);
  assert.equal(res.status, 401);
});

test('full CRUD + search + pagination', async () => {
  const created = await req('POST', base, { title: 'Demo item', detail: 'first' }, token);
  assert.equal(created.status, 201);
  const item = await created.json();
  assert.ok(item.id);

  const listed = await req('GET', `${base}?q=Demo&page=1&limit=5`, null, token);
  assert.equal(listed.status, 200);
  const page = await listed.json();
  assert.equal(page.total, 1);
  assert.ok(Array.isArray(page.items));

  const updated = await req('PUT', `${base}/${item.id}`, { detail: 'updated' }, token);
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).detail, 'updated');

  const del = await req('DELETE', `${base}/${item.id}`, null, token);
  assert.equal(del.status, 204);

  const missing = await req('GET', `${base}/${item.id}`, null, token);
  assert.equal(missing.status, 404);
});

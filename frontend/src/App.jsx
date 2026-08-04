import { useCallback, useEffect, useState } from 'react';
import './app.css';

const API = '/api/migration-plans';
const AUTH = '/api/auth';

function App() {
  const [auth, setAuth] = useState({ email: '', password: '' });
  const [logged, setLogged] = useState(() => !!localStorage.getItem('token'));
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', detail: '' });
  const [editingId, setEditingId] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState(null);

  const headers = (json) => ({
    ...(json ? { 'content-type': 'application/json' } : {}),
    authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const load = useCallback(() => {
    const params = new URLSearchParams({ q, page, limit: 10 });
    fetch(`${API}?${params}`, { headers: headers() })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || 'load failed');
        return r.json();
      })
      .then((d) => {
        setItems(d.items || []);
        setTotal(d.total || 0);
        setPages(d.pages || 1);
      })
      .catch((e) => setError(String(e)));
  }, [q, page]);

  useEffect(() => {
    if (logged) load();
  }, [logged, load]);

  const doAuth = (mode) => (e) => {
    e.preventDefault();
    setError(null);
    fetch(`${AUTH}/${mode}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(auth),
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'auth failed');
        localStorage.setItem('token', d.token);
        setLogged(true);
      })
      .catch((err) => setError(String(err)));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API}/${editingId}` : API;
    fetch(url, {
      method,
      headers: headers(true),
      body: JSON.stringify(form),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || 'save failed');
        setForm({ title: '', detail: '' });
        setEditingId(null);
        load();
      })
      .catch((err) => setError(String(err)));
  };

  const startEdit = (it) => {
    setEditingId(it.id);
    setForm({ title: it.title, detail: it.detail });
  };

  const remove = (id) => {
    fetch(`${API}/${id}`, { method: 'DELETE', headers: headers() })
      .then((r) => {
        if (!r.ok && r.status !== 204) throw new Error('delete failed');
        load();
      })
      .catch((err) => setError(String(err)));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setLogged(false);
  };

  if (!logged) {
    return (
      <main className="wrap">
        <h1>MigrateMate</h1>
        <form className="card" onSubmit={doAuth('login')}>
          <h2>Login</h2>
          {error && <p className="err">{error}</p>}
          <input
            type="email" placeholder="Email" value={auth.email}
            onChange={(e) => setAuth({ ...auth, email: e.target.value })}
          />
          <input
            type="password" placeholder="Password (min 6 chars)" value={auth.password}
            onChange={(e) => setAuth({ ...auth, password: e.target.value })}
          />
          <button type="submit">Login</button>
          <button type="button" className="ghost" onClick={doAuth('register')}>
            Register
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="wrap">
      <header className="bar">
        <h1>MigrateMate</h1>
        <button className="ghost" onClick={logout}>Logout</button>
      </header>
      <p className="sub">CRUD + auth demo for /api/migration-plans</p>
      {error && <p className="err">{error}</p>}

      <form className="row" onSubmit={submit}>
        <input
          placeholder={editingId ? 'Edit title…' : 'Title'}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Detail"
          value={form.detail}
          onChange={(e) => setForm({ ...form, detail: e.target.value })}
        />
        <button type="submit">{editingId ? 'Save' : 'Add'}</button>
        {editingId && (
          <button type="button" className="ghost" onClick={() => { setEditingId(null); setForm({ title: '', detail: '' }); }}>
            Cancel
          </button>
        )}
      </form>

      <input
        className="search" placeholder="Search…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setPage(1); }}
      />

      <ul className="list">
        {items.map((it) => (
          <li key={it.id}>
            <div>
              <strong>{it.title}</strong>
              {it.detail && <span>{it.detail}</span>}
            </div>
            <div className="actions">
              <button className="ghost" onClick={() => startEdit(it)}>Edit</button>
              <button className="ghost" onClick={() => remove(it.id)}>Delete</button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="empty">No items yet — add one above.</li>}
      </ul>

      <footer className="pager">
        <button className="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span>{page} / {pages} · {total} total</span>
        <button className="ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
      </footer>
    </main>
  );
}

export default App;

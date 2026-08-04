import { useCallback, useEffect, useState } from 'react';
import './app.css';

const API = '/api/migration-plans';

function App() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', detail: '' });
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    fetch(API)
      .then((r) => r.json())
      .then(setItems)
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(load, [load]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('create failed'))))
      .then(() => {
        setForm({ title: '', detail: '' });
        load();
      })
      .catch((err) => setError(String(err)));
  };

  const remove = (id) => {
    fetch(`${API}/${id}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok && r.status !== 204) throw new Error('delete failed');
        load();
      })
      .catch((err) => setError(String(err)));
  };

  return (
    <main className="wrap">
      <h1>MigrateMate</h1>
      <p className="sub">CRUD demo for /api/migration-plans</p>
      {error && <p className="err">Backend error: {error}</p>}
      <form className="row" onSubmit={submit}>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Detail"
          value={form.detail}
          onChange={(e) => setForm({ ...form, detail: e.target.value })}
        />
        <button type="submit">Add</button>
      </form>
      <ul className="list">
        {items.map((it) => (
          <li key={it.id}>
            <div>
              <strong>{it.title}</strong>
              {it.detail && <span>{it.detail}</span>}
            </div>
            <button className="ghost" onClick={() => remove(it.id)}>
              Delete
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="empty">No items yet — add one above.</li>}
      </ul>
    </main>
  );
}

export default App;

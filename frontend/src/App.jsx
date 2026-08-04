import { useEffect, useState } from 'react';
import './app.css';

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setData)
      .catch(setError);
  }, []);

  return (
    <main className="wrap">
      <h1>Scaffold App</h1>
      {error && <p className="err">Backend not reachable: {String(error)}</p>}
      {data && (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </main>
  );
}

export default App;
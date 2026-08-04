import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api', time: new Date().toISOString() });
});

app.get('/api/data', (_req, res) => {
  res.json({ message: 'Hello from the default scaffold', items: [] });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
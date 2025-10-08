import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

const PORT = process.env.PORT || 3000;
const STATION_URL = process.env.STATION_URL || 'https://charge.virtaglobal.com/stations/6224';

app.use(express.static(publicDir));

app.get('/api/status', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(STATION_URL, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'user-agent': 'EV-Station-Monitor/1.0 (+https://example.com)'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text();
      return res.status(response.status).json({
        ok: false,
        status: response.status,
        statusText: response.statusText,
        body
      });
    }

    const data = await response.json();
    res.json({ ok: true, fetchedAt: new Date().toISOString(), data });
  } catch (error) {
    const status = error.name === 'AbortError' ? 504 : 500;
    res.status(status).json({ ok: false, error: error.message, name: error.name });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`EV Station monitor listening on port ${PORT}`);
});

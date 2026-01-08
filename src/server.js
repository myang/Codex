import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

const PORT = process.env.PORT || 3000;
const STATION_URL = process.env.STATION_URL || 'https://charge.virtaglobal.com/stations/6224';
const POLL_INTERVAL_MINUTES = Number(process.env.POLL_INTERVAL_MINUTES) || 15;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

const subscriptions = new Map();
let lastAvailability = null;

app.use(express.json());
app.use(express.static(publicDir));

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn('VAPID keys are not configured. Push notifications are disabled.');
}

async function fetchStationStatus() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(STATION_URL, {
      headers: {
        accept: 'application/json, text/plain, */*',
        'user-agent': 'EV-Station-Monitor/1.0 (+https://example.com)'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text();
      const error = new Error(`Station fetch failed: ${response.status} ${response.statusText}`);
      error.status = response.status;
      error.body = body;
      throw error;
    }

    const data = await response.json();
    return { fetchedAt: new Date().toISOString(), data };
  } finally {
    clearTimeout(timeout);
  }
}

function extractStatus(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }
  return (
    data.status ??
    data.state ??
    data.stationStatus ??
    data.availability ??
    data.currentStatus ??
    data.operationalStatus ??
    null
  );
}

function isAvailable(status) {
  if (!status) {
    return false;
  }
  return status.toString().toLowerCase() !== 'occupied';
}

async function notifySubscribers(status) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return;
  }

  const payload = JSON.stringify({
    title: 'EV Station available',
    body: `Station status changed to "${status}".`,
    url: '/'
  });

  const staleEndpoints = [];
  await Promise.all(
    Array.from(subscriptions.entries()).map(async ([endpoint, subscription]) => {
      try {
        await webpush.sendNotification(subscription, payload);
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          staleEndpoints.push(endpoint);
        } else {
          console.error('Failed to send push notification:', error);
        }
      }
    })
  );

  staleEndpoints.forEach((endpoint) => subscriptions.delete(endpoint));
}

async function pollStationAndNotify() {
  try {
    const { data } = await fetchStationStatus();
    const status = extractStatus(data);
    const available = isAvailable(status);

    if (available && lastAvailability !== true) {
      await notifySubscribers(status ?? 'available');
    }

    if (available) {
      lastAvailability = true;
    } else if (status) {
      lastAvailability = false;
    }
  } catch (error) {
    console.error('Station polling failed:', error.message);
  }
}

app.get('/api/status', async (req, res) => {
  try {
    const result = await fetchStationStatus();
    res.json({ ok: true, ...result });
  } catch (error) {
    const status = error.name === 'AbortError' ? 504 : error.status || 500;
    res.status(status).json({
      ok: false,
      error: error.message,
      name: error.name,
      body: error.body
    });
  }
});

app.get('/api/push-config', (req, res) => {
  res.json({
    enabled: Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
    publicKey: VAPID_PUBLIC_KEY
  });
});

app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ ok: false, error: 'Invalid subscription payload.' });
  }

  subscriptions.set(subscription.endpoint, subscription);
  res.json({ ok: true });
});

app.post('/api/unsubscribe', (req, res) => {
  const { endpoint } = req.body || {};
  if (endpoint) {
    subscriptions.delete(endpoint);
  }
  res.json({ ok: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`EV Station monitor listening on port ${PORT}`);
  console.log(`Polling station every ${POLL_INTERVAL_MINUTES} minute(s).`);
  pollStationAndNotify();
  setInterval(pollStationAndNotify, POLL_INTERVAL_MINUTES * 60 * 1000);
});

const DEFAULT_INTERVAL_MINUTES = 15;
const STORAGE_KEY = 'ev-monitor-interval-minutes';

const stationStatusEl = document.getElementById('station-status');
const lastCheckedEl = document.getElementById('last-checked');
const connectorsEl = document.getElementById('connectors');
const nextCheckEl = document.getElementById('next-check');
const statusMessageEl = document.getElementById('status-message');
const intervalInput = document.getElementById('interval');
const settingsForm = document.getElementById('settings-form');
const logList = document.getElementById('log-list');
const logTemplate = document.getElementById('log-item-template');
const permissionButton = document.getElementById('request-permission');
const pushStatusEl = document.getElementById('push-status');

const state = {
  intervalMinutes: loadInterval(),
  timer: null,
  nextCheck: null,
  lastStatus: null,
  lastNotificationStatus: null,
  pushSubscription: null,
  pushSupported: false
};

intervalInput.value = state.intervalMinutes;

settingsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const minutes = Number(intervalInput.value);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    alert('Please provide an interval greater than zero.');
    return;
  }

  state.intervalMinutes = minutes;
  saveInterval(minutes);
  appendLog(`Updated polling interval to ${minutes} minute${minutes === 1 ? '' : 's'}.`);
  schedulePolling(true);
});

permissionButton.addEventListener('click', () => {
  enablePushNotifications();
});

function loadInterval() {
  const stored = localStorage.getItem(STORAGE_KEY);
  const parsed = Number(stored);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_INTERVAL_MINUTES;
}

function saveInterval(minutes) {
  localStorage.setItem(STORAGE_KEY, String(minutes));
}

function schedulePolling(restart = false) {
  if (restart && state.timer) {
    clearInterval(state.timer);
  }

  const intervalMs = state.intervalMinutes * 60 * 1000;
  state.nextCheck = new Date(Date.now() + intervalMs);
  updateNextCheckLabel();

  if (!state.timer || restart) {
    state.timer = setInterval(fetchStationStatus, intervalMs);
  }
}

function updateNextCheckLabel() {
  if (!state.nextCheck) {
    nextCheckEl.textContent = '—';
    return;
  }
  nextCheckEl.textContent = formatDate(state.nextCheck);
}

async function fetchStationStatus() {
  statusMessageEl.textContent = 'Checking…';
  try {
    const response = await fetch('/api/status');
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || payload.statusText || 'Unable to fetch station status');
    }

    const info = extractStationInfo(payload.data);
    updateStatus(info);
    appendLog(`Status is "${info.status || 'unknown'}".`);
    maybeNotify(info);
  } catch (error) {
    statusMessageEl.textContent = `Error: ${error.message}`;
    appendLog(`Error fetching status: ${error.message}`);
  } finally {
    lastCheckedEl.textContent = formatDate(new Date());
    state.nextCheck = new Date(Date.now() + state.intervalMinutes * 60 * 1000);
    updateNextCheckLabel();
  }
}

function extractStationInfo(data) {
  if (!data || typeof data !== 'object') {
    return { status: 'unknown', connectorsText: '—', raw: data };
  }

  const statusCandidate =
    data.status?.toString() ??
    data.state?.toString() ??
    data.stationStatus?.toString() ??
    data.availability?.toString() ??
    data.currentStatus?.toString() ??
    data.operationalStatus?.toString();

  const connectors =
    data.connectors ??
    data.connector ??
    data.evses ??
    data.ports ??
    data.outlets;

  const connectorsText = Array.isArray(connectors)
    ? connectors
        .map((connector, index) => {
          if (typeof connector === 'string') {
            return connector;
          }

          if (connector && typeof connector === 'object') {
            const connectorStatus =
              connector.status ?? connector.state ?? connector.availability ?? connector.currentStatus;
            const connectorName = connector.name ?? connector.id ?? connector.connectorId ?? `Connector ${index + 1}`;
            return `${connectorName}: ${connectorStatus ?? 'unknown'}`;
          }

          return `Connector ${index + 1}`;
        })
        .join(', ')
    : typeof connectors === 'object' && connectors
    ? JSON.stringify(connectors)
    : connectors ?? '—';

  return {
    status: statusCandidate ?? 'unknown',
    connectorsText,
    raw: data
  };
}

function updateStatus(info) {
  const statusText = info.status ?? 'unknown';
  stationStatusEl.textContent = statusText;
  connectorsEl.textContent = info.connectorsText ?? '—';
  statusMessageEl.textContent = statusText.toLowerCase() === 'occupied'
    ? 'The station is currently occupied.'
    : 'Good news! The station is available.';
  state.lastStatus = statusText;
}

function maybeNotify(info) {
  if (!('Notification' in window)) {
    return;
  }

  const permission = Notification.permission;
  if (permission !== 'granted') {
    return;
  }

  const currentStatus = (info.status || '').toString().toLowerCase();
  if (!currentStatus) {
    return;
  }

  if (currentStatus === 'occupied') {
    state.lastNotificationStatus = 'occupied';
    return;
  }

  if (state.lastNotificationStatus === currentStatus) {
    return; // avoid repeat notifications for the same status
  }

  const title = 'EV Station available';
  const body = `Station status changed to "${info.status}".`;
  const notification = new Notification(title, {
    body,
    tag: 'ev-station-availability',
    icon: 'https://img.icons8.com/color/96/electric-plug.png'
  });

  notification.onclick = () => window.focus();
  state.lastNotificationStatus = currentStatus;
}

function appendLog(message) {
  const entry = logTemplate.content.cloneNode(true);
  entry.querySelector('.log-time').textContent = formatDate(new Date());
  entry.querySelector('.log-message').textContent = message;
  logList.prepend(entry);

  const items = logList.querySelectorAll('li');
  if (items.length > 20) {
    items[items.length - 1].remove();
  }
}

function formatDate(date) {
  if (!(date instanceof Date)) {
    return '—';
  }
  return date.toLocaleString();
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert('Notifications are not supported in this browser.');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    appendLog('Notifications already enabled.');
    return Notification.permission;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      appendLog('Notifications enabled.');
      maybeNotify({ status: state.lastStatus, connectorsText: connectorsEl.textContent });
    } else {
      appendLog('Notifications were denied.');
    }
    return permission;
  } catch (error) {
    appendLog(`Notification request failed: ${error.message}`);
    return 'error';
  }
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    setPushStatus('Service workers are not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (error) {
    setPushStatus(`Service worker registration failed: ${error.message}`);
    return null;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function enablePushNotifications() {
  const registration = await registerServiceWorker();
  if (!registration) {
    return;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    setPushStatus('Notifications are disabled. Enable permissions to receive alerts.');
    return;
  }

  try {
    const configResponse = await fetch('/api/push-config');
    const config = await configResponse.json();

    if (!config.enabled || !config.publicKey) {
      setPushStatus('Push notifications are not configured on the server yet.');
      appendLog('Push notifications are disabled. Add VAPID keys to enable.');
      return;
    }

    const applicationServerKey = urlBase64ToUint8Array(config.publicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    state.pushSubscription = subscription;
    state.pushSupported = true;
    setPushStatus('Push notifications enabled. You will be alerted when the station is free.');
    appendLog('Push notifications enabled for this device.');
  } catch (error) {
    setPushStatus(`Unable to enable push notifications: ${error.message}`);
    appendLog(`Push setup failed: ${error.message}`);
  }
}

function setPushStatus(message) {
  if (!pushStatusEl) {
    return;
  }
  pushStatusEl.textContent = message;
}

function init() {
  appendLog('Starting EV station monitor.');
  schedulePolling(true);
  fetchStationStatus();
  registerServiceWorker();
}

init();

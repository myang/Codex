# EV Charging Station Monitor

A minimal web application that polls the Virta Global charging station API and notifies you when station **#6224** is no longer occupied. The polling cadence defaults to every 15 minutes and can be adjusted directly from the UI.

The app is built with Node.js, Express, and a small client-side script. It is suitable for hosting on free Node-friendly platforms such as [Render](https://render.com/) or [Fly.io](https://fly.io/).

## Scout Skills Repo

The `scout` project is maintained as a separate local git repository at `/workspace/scout` with its skills stored under `.agent/skills`.

## Features

- Server-side proxy for the Virta Global station endpoint to avoid CORS issues.
- Configurable polling interval (defaults to 15 minutes) persisted in the browser.
- Push notifications via Web Push when the station status changes from `occupied` to any other state.
- Friendly dashboard with current status, next scheduled check, and recent activity log.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- [npm](https://www.npmjs.com/) (usually installed with Node.js)

### Installation

```bash
npm install
```

### Local Development

```bash
npm run dev
```

This starts the Express server on [http://localhost:3000](http://localhost:3000) and watches for file changes.

### Production Build / Deployment

There is no separate build step. Deploy the repository to your preferred Node.js host and configure it to run:

```bash
npm start
```

Set the `PORT` environment variable if your host requires a specific port. You can also override the Virta endpoint with `STATION_URL` if you want to monitor a different station.

### Browser Notifications

1. Open the app in your browser.
2. Click **Enable notifications** and allow the permission prompt.
3. The app sends a notification whenever the station status is anything other than `occupied`.
4. For iOS, add the site to your home screen (iOS 16.4+) so push notifications can reach your device.

### Web Push Configuration

The server sends push notifications even when the page is not open, but it requires VAPID keys. Generate a key pair and set the environment variables below:

```bash
npx web-push generate-vapid-keys
```

```bash
export VAPID_PUBLIC_KEY="..."
export VAPID_PRIVATE_KEY="..."
export VAPID_SUBJECT="mailto:you@example.com"
```

You can also configure the server polling cadence via `POLL_INTERVAL_MINUTES` (defaults to 15).

> Notifications require the page to stay open in the background. For mobile devices, consider adding the site to the home screen and keeping the browser tab active.

## Deployment Tips (Recommended: Render)

Render offers a dependable free tier for Node services. The free plan will sleep on inactivity, but it avoids the one-deploy-per-day limitation you hit on Vercel.

### Render (free tier)

1. Create a new **Web Service** in Render and point it at this GitHub repo.
2. Choose the **Free** instance type.
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. **Environment variables** (Render dashboard → *Environment*):
   - `PORT`: provided automatically by Render (no action required).
   - `STATION_URL`: optional override if you want to monitor a different station endpoint.
6. Deploy. The app will be available at the Render URL, and it will wake on incoming requests.

If you prefer configuration-as-code, this repo includes a `render.yaml` you can use when creating the service.

### Fly.io (alternative)

If you want more control over regions or an always-on option, Fly.io is a good alternative. Initialize with `fly launch`, set the internal port to `3000`, and deploy with `fly deploy`.

## License

MIT

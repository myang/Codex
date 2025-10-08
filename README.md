# EV Charging Station Monitor

A minimal web application that polls the Virta Global charging station API and notifies you when station **#6224** is no longer occupied. The polling cadence defaults to every 10 minutes and can be adjusted directly from the UI.

The app is built with Node.js, Express, and a small client-side script. It is suitable for hosting on free Node-friendly platforms such as [Render](https://render.com/), [Railway](https://railway.app/), or [Fly.io](https://fly.io/).

## Features

- Server-side proxy for the Virta Global station endpoint to avoid CORS issues.
- Configurable polling interval (defaults to 10 minutes) persisted in the browser.
- Browser notifications when the station status changes from `occupied` to any other state.
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

> Notifications require the page to stay open in the background. For mobile devices, consider adding the site to the home screen and keeping the browser tab active.

## Deployment Tips

- For Render, create a new **Web Service** from this repo, choose the free instance type, and set the start command to `npm start`.
- For Railway, create a **Node.js** project, connect the repo, and keep the default start command.
- For Fly.io, initialize with `fly launch`, set the internal port to `3000`, and deploy with `fly deploy`.

## License

MIT

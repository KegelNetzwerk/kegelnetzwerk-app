# Web Deployment

This guide covers building the app as a static web bundle and deploying it to a web server (e.g., Nginx on a VPS or any static hosting service).

## Prerequisites

- [Node.js](https://nodejs.org/) installed on the build machine
- A `.env` file in the project root (see **Environment Setup** below)
- A web server or static hosting service to serve the output

No Expo account or EAS CLI is required for web builds — everything runs locally.

## Environment Setup

Create a `.env` file in the project root (it is git-ignored by `.env*.local` rules, so use `.env` directly):

```bash
EXPO_PUBLIC_API_URL=https://kegelnetzwerk.de
```

> **Note:** Variables prefixed with `EXPO_PUBLIC_` are inlined into the bundle at build time. They are visible in the compiled output, so only put non-secret values here.

## Building the Web Bundle

From the project root, run:

```bash
npx expo export --platform web
```

This produces a `dist/` folder containing a fully static single-page application (HTML + JS + assets). The build typically takes 30–60 seconds.

> **Alternative:** `npx expo export -p web` is a shorthand for the same command.

## Testing Locally Before Deploying

Serve the `dist/` folder locally to verify the build before uploading:

```bash
npx serve dist
```

If `serve` is not installed: `npm install -g serve`.

Open `http://localhost:3000` in a browser. Log in and exercise the main features to confirm the API URL was baked in correctly.

> **CORS note:** When testing at `localhost`, all requests to `https://kegelnetzwerk.de` are cross-origin. The browser will block requests to any API endpoint that does not respond with the appropriate `Access-Control-Allow-Origin` header. This is expected in the local test environment — it does not affect the production deployment as long as the app is served from the same domain as the API, or the webservice has CORS configured for the app's production domain.

## Deploying to a Server

### 1. Upload the `dist/` folder

Copy the contents of `dist/` to the web root on the server. Using `rsync`:

```bash
rsync -av --delete dist/ user@your-server.example.com:/var/www/kegelnetzwerk-app/
```

### 2. Configure Nginx

The app uses client-side routing (Expo Router). The server must return `index.html` for every path that does not match a static file, otherwise navigating to a deep link directly (e.g., `/slotmachine`) returns 404.

Minimal Nginx site configuration:

```nginx
server {
    listen 80;
    server_name app.kegelnetzwerk.de;

    root /var/www/kegelnetzwerk-app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Reload Nginx after saving:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 3. Enable HTTPS (recommended)

Use Certbot to obtain a free Let's Encrypt certificate:

```bash
sudo certbot --nginx -d app.kegelnetzwerk.de
```

Certbot patches the Nginx config automatically and sets up auto-renewal.

### 4. Configure CORS on the webservice

The webservice at `https://kegelnetzwerk.de` must allow requests from the app's domain. Add the following header to all API responses (adjust the origin to match your actual deployment domain):

```
Access-Control-Allow-Origin: https://app.kegelnetzwerk.de
```

Without this, the browser will block all API calls made from the web app.

## Updating the App

To release a new version:

1. Make and commit your changes.
2. Re-run the export: `npx expo export --platform web`
3. Re-upload `dist/` to the server (the `rsync --delete` flag removes stale files automatically).

There is no versioning requirement for web — users always load the latest bundle on the next page refresh.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank page or app crashes on load | Open browser DevTools console; look for missing asset errors or JS exceptions |
| API calls blocked by CORS | Add `Access-Control-Allow-Origin` for the app's domain to the webservice |
| Deep links return 404 | Ensure the Nginx `try_files $uri $uri/ /index.html` rule is in place |
| Old version still loading | Hard-refresh the browser (`Ctrl+Shift+R`); Expo bundles include content hashes so caching is not usually an issue |
| `EXPO_PUBLIC_API_URL` points to wrong server | Check `.env` and rebuild — the value is baked in at build time and cannot be changed without a new build |
| Push notifications not working | `expo-notifications` does not support the web platform; push notifications are only available on Android and iOS |
| SecureStore / background fetch unavailable | `expo-secure-store` and `expo-background-fetch` are native-only; the app falls back gracefully on web but those features are inactive |

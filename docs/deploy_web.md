# Web Deployment

This guide covers building the app as a static web bundle directly on the server and serving it with Apache2.

## Prerequisites

On the server:

- [Node.js](https://nodejs.org/) installed (`node --version` to verify)
- The repository cloned on the server
- Apache2 installed and running (`sudo systemctl status apache2`)
- `mod_rewrite` enabled (required for SPA routing — see step 3)

No Expo account or EAS CLI is required for web builds — everything runs locally on the server.

## Environment Setup

Create a `.env` file in the project root on the server (it is git-ignored by `.env*.local` rules, so use `.env` directly):

```bash
EXPO_PUBLIC_API_URL=https://kegelnetzwerk.de
```

> **Note:** Variables prefixed with `EXPO_PUBLIC_` are inlined into the bundle at build time. They are visible in the compiled output, so only put non-secret values here.

## Deploying to the Server

### 1. Pull the latest code

SSH into the server and update the repository:

```bash
cd /path/to/kegelnetzwerk-app
git pull
```

### 2. Install dependencies and build

```bash
npm install
npx expo export --platform web
```

This produces a `dist/` folder containing a fully static single-page application (HTML + JS + assets). The build typically takes 30–60 seconds.

### 3. Enable `mod_rewrite`

The app uses client-side routing (Expo Router). Apache must return `index.html` for every path that does not match a static file, otherwise navigating to a deep link directly (e.g., `/slotmachine`) returns 404. This requires `mod_rewrite`:

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### 4. Configure Apache2

Create a virtual host config, e.g., `/etc/apache2/sites-available/kegelnetzwerk-app.conf`:

```apache
<VirtualHost *:80>
    ServerName app.kegelnetzwerk.de

    DocumentRoot /path/to/kegelnetzwerk-app/dist

    <Directory /path/to/kegelnetzwerk-app/dist>
        Options -Indexes
        AllowOverride None
        Require all granted

        RewriteEngine On
        RewriteBase /
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.html [L]
    </Directory>
</VirtualHost>
```

Enable the site and reload Apache:

```bash
sudo a2ensite kegelnetzwerk-app
sudo systemctl reload apache2
```

### 5. Enable HTTPS (recommended)

Use Certbot to obtain a free Let's Encrypt certificate:

```bash
sudo certbot --apache -d app.kegelnetzwerk.de
```

Certbot patches the virtual host config automatically and sets up auto-renewal.

### 6. Configure CORS on the webservice

The webservice at `https://kegelnetzwerk.de` must allow requests from the app's domain. Add the following header to all API responses (adjust the origin to match your actual deployment domain):

```
Access-Control-Allow-Origin: https://app.kegelnetzwerk.de
```

Without this, the browser will block all API calls made from the web app.

## Testing Locally Before Deploying

To verify a build on the server before switching Apache to serve it, use `npx serve`:

```bash
npx serve dist --listen 3001
```

If `serve` is not installed: `npm install -g serve`.

Open `http://your-server-ip:3001` in a browser (ensure port 3001 is open in the firewall). Log in and exercise the main features to confirm the API URL was baked in correctly.

> **CORS note:** When testing at a non-production origin, all requests to `https://kegelnetzwerk.de` are cross-origin. The browser will block requests to any API endpoint that does not respond with the appropriate `Access-Control-Allow-Origin` header. This is expected in the test environment — it does not affect the production deployment once the app is served from the domain configured in the CORS headers.

## Updating the App

To release a new version, SSH into the server and run:

```bash
cd /path/to/kegelnetzwerk-app
git pull
npm install
npx expo export --platform web
```

Apache serves the `dist/` folder directly, so the new build is live as soon as the export finishes. No server restart is needed.

There is no versioning requirement for web — users always load the latest bundle on the next page refresh.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank page or app crashes on load | Open browser DevTools console; look for missing asset errors or JS exceptions |
| API calls blocked by CORS | Add `Access-Control-Allow-Origin` for the app's domain to the webservice |
| Deep links return 404 | Ensure `mod_rewrite` is enabled and the `RewriteRule` is present in the virtual host config |
| `AllowOverride None` blocks `.htaccess` | The rewrite rules are in the `<Directory>` block directly — no `.htaccess` file is needed |
| Old version still loading | Hard-refresh the browser (`Ctrl+Shift+R`); Expo bundles include content hashes so caching is not usually an issue |
| `EXPO_PUBLIC_API_URL` points to wrong server | Check `.env` on the server and rebuild — the value is baked in at build time and cannot be changed without a new build |
| Push notifications not working | `expo-notifications` does not support the web platform; push notifications are only available on Android and iOS |
| SecureStore / background fetch unavailable | `expo-secure-store` and `expo-background-fetch` are native-only; the app falls back gracefully on web but those features are inactive |

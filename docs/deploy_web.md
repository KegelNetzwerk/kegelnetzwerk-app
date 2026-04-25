# Web Deployment

This guide covers building the app as a static web bundle directly on the server and serving it with Apache2. Two serving strategies are described:

- **Option A — Apache2 direct**: Apache serves the `dist/` folder directly. Simple, no extra process manager needed.
- **Option B — pm2 + Apache2 reverse proxy**: pm2 runs `serve` as a managed background service; Apache proxies to it. Use this when you want process supervision, automatic restart on crash, and startup-on-boot management via pm2.

## Prerequisites

On the server:

- [Node.js](https://nodejs.org/) installed (`node --version` to verify)
- The repository cloned on the server
- Apache2 installed and running (`sudo systemctl status apache2`)

No Expo account or EAS CLI is required for web builds — everything runs locally on the server.

## Environment Setup

Create a `.env` file in the project root on the server (it is git-ignored by `.env*.local` rules, so use `.env` directly):

```bash
EXPO_PUBLIC_API_URL=https://kegelnetzwerk.de
```

> **Note:** Variables prefixed with `EXPO_PUBLIC_` are inlined into the bundle at build time. They are visible in the compiled output, so only put non-secret values here.

## Building the Web Bundle

SSH into the server, pull the latest code, and build:

```bash
cd /path/to/kegelnetzwerk-app
git pull
npm install
npx expo export --platform web
```

This produces a `dist/` folder containing a fully static single-page application (HTML + JS + assets). The build typically takes 30–60 seconds.

---

## Option A — Apache2 Direct

### 1. Enable `mod_rewrite`

The app uses client-side routing (Expo Router). Apache must return `index.html` for every path that does not match a static file, otherwise navigating to a deep link directly (e.g., `/slotmachine`) returns 404. This requires `mod_rewrite`:

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### 2. Configure Apache2

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

### 3. Enable HTTPS (recommended)

```bash
sudo certbot --apache -d app.kegelnetzwerk.de
```

Certbot patches the virtual host config automatically and sets up auto-renewal.

### Updating (Option A)

```bash
cd /path/to/kegelnetzwerk-app
git pull
npm install
npx expo export --platform web
```

Apache serves `dist/` directly, so the new build is live as soon as the export finishes. No server restart is needed.

---

## Option B — pm2 + Apache2 Reverse Proxy

### 1. Install pm2 and `serve`

```bash
npm install -g pm2 serve
```

### 2. Start the app under pm2

```bash
cd /path/to/kegelnetzwerk-app
pm2 start "serve dist --listen 3001" --name kegelnetzwerk-app
```

Verify it is running:

```bash
pm2 status
```

Open `http://your-server-ip:3001` to do a quick smoke test (ensure port 3001 is reachable or temporarily open it in the firewall).

### 3. Persist the pm2 process list across reboots

```bash
pm2 save
pm2 startup
```

`pm2 startup` prints a command to run (with `sudo`) that installs the pm2 init script for your OS. Copy and run that command.

### 4. Enable `mod_proxy` modules

```bash
sudo a2enmod proxy proxy_http
sudo systemctl restart apache2
```

### 5. Configure Apache2 as a reverse proxy

Create `/etc/apache2/sites-available/kegelnetzwerk-app.conf`:

```apache
<VirtualHost *:80>
    ServerName app.kegelnetzwerk.de

    ProxyPreserveHost On
    ProxyPass        / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
</VirtualHost>
```

Enable the site and reload Apache:

```bash
sudo a2ensite kegelnetzwerk-app
sudo systemctl reload apache2
```

> **Note:** SPA routing (returning `index.html` for unknown paths) is handled by `serve` itself — no `mod_rewrite` rules are needed in the proxy config.

### 6. Enable HTTPS (recommended)

```bash
sudo certbot --apache -d app.kegelnetzwerk.de
```

### Updating (Option B)

```bash
cd /path/to/kegelnetzwerk-app
git pull
npm install
npx expo export --platform web
pm2 restart kegelnetzwerk-app
```

pm2 restarts `serve`, which picks up the new `dist/` folder immediately.

---

## Configure CORS on the Webservice

Regardless of which option you use, the webservice at `https://kegelnetzwerk.de` must allow requests from the app's domain. Add the following header to all API responses:

```
Access-Control-Allow-Origin: https://app.kegelnetzwerk.de
```

Without this, the browser will block all API calls made from the web app.

## Testing Locally Before Deploying

To verify a build on the server before switching Apache to serve it, use `npx serve` on a temporary port:

```bash
npx serve dist --listen 3001
```

Open `http://your-server-ip:3001` in a browser. Log in and exercise the main features to confirm the API URL was baked in correctly.

> **CORS note:** When testing at a non-production origin, all requests to `https://kegelnetzwerk.de` are cross-origin. The browser will block requests to any API endpoint that does not respond with the appropriate `Access-Control-Allow-Origin` header. This is expected in the test environment — it does not affect the production deployment once the app is served from the domain configured in the CORS headers.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank page or app crashes on load | Open browser DevTools console; look for missing asset errors or JS exceptions |
| API calls blocked by CORS | Add `Access-Control-Allow-Origin` for the app's domain to the webservice |
| Deep links return 404 (Option A) | Ensure `mod_rewrite` is enabled and the `RewriteRule` is present in the virtual host config |
| Deep links return 404 (Option B) | `serve` handles this automatically; check that the proxy is forwarding to the correct port |
| `AllowOverride None` blocks `.htaccess` | The rewrite rules are in the `<Directory>` block directly — no `.htaccess` file is needed |
| pm2 process not running after reboot | Run `pm2 startup` again and execute the printed command; then `pm2 save` |
| Apache proxy returns 502 Bad Gateway | The pm2 process is not running; check `pm2 status` and `pm2 logs kegelnetzwerk-app` |
| Old version still loading after update | Hard-refresh the browser (`Ctrl+Shift+R`); Expo bundles include content hashes so caching is not usually an issue |
| `EXPO_PUBLIC_API_URL` points to wrong server | Check `.env` on the server and rebuild — the value is baked in at build time and cannot be changed without a new build |
| Push notifications not working | `expo-notifications` does not support the web platform; push notifications are only available on Android and iOS |
| SecureStore / background fetch unavailable | `expo-secure-store` and `expo-background-fetch` are native-only; the app falls back gracefully on web but those features are inactive |

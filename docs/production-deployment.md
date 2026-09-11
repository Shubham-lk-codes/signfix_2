# SignFix production deployment

This deployment keeps one Node process on `127.0.0.1:5000`. Express serves the
API at `/api/*`, the Vite admin application at `/admin/*`, and, when
`MARKETING_WEB_ROOT` is configured or the sibling `signfix_web/out` build is
present, a separate Next.js static export at `/`.
The public web server terminates the existing TLS certificate and proxies
requests to Node.

## Production environment

Create `.env` on the server (never commit it) with at least:

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
JWT_SECRET=GENERATE_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
JWT_ISSUER=signfix-api
JWT_AUDIENCE=signfix-web
CORS_ORIGIN=https://signfix.me
VITE_API_URL=
MARKETING_WEB_ROOT=/home/signfixm/signfix_web/out
APP_URL=https://signfix.me/admin
PUBLIC_APP_URL=https://signfix.me
```

Add provider variables from `.env.example` only for enabled features. An origin
never includes a path, so `/admin` is covered by `https://signfix.me`; do not put
`https://signfix.me/admin` in `CORS_ORIGIN`. Native mobile requests without an
`Origin` header remain supported.

## Install, build, and PM2

Run in `/home/signfixm/repositories/signfix_2`:

```bash
npm ci
npm run build
pm2 startOrReload ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup` with the privileges requested by PM2,
then run `pm2 save` once more. The process name is `signfix-api`. Diagnose it with
`pm2 status`, `pm2 logs signfix-api --lines 200`, and `pm2 describe signfix-api`.

The production process deliberately refuses to start when `DATABASE_URL`, a
32-character `JWT_SECRET`, or `dist/index.html` is missing. Check
`pm2 logs signfix-api --lines 200` (or the cPanel application log) when the
public web server reports 503.

## Reverse proxy

First identify the active server (`ps aux | grep -E 'nginx|apache|httpd|lshttpd'`)
and edit its existing TLS virtual host. Preserve all existing certificate,
protocol, and redirect directives. Add only the applicable proxy rules.

Nginx, inside the existing `server` block for `signfix.me`:

```nginx
location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

Validate with `nginx -t` before `systemctl reload nginx`.

Apache, inside the existing HTTPS `VirtualHost` (requires `proxy`, `proxy_http`,
and `proxy_wstunnel`):

```apache
ProxyPreserveHost On
RequestHeader set X-Forwarded-Proto "https"
ProxyPass        /socket.io/ ws://127.0.0.1:5000/socket.io/
ProxyPassReverse /socket.io/ ws://127.0.0.1:5000/socket.io/
ProxyPass        / http://127.0.0.1:5000/
ProxyPassReverse / http://127.0.0.1:5000/
```

Validate with `apachectl configtest` before reloading Apache. On LiteSpeed/shared
hosting where virtual-host changes are unavailable, use cPanel's **Setup Node.js
App** / Passenger integration. Keep the repositories checked out separately,
build the Next.js site in `/home/signfixm/signfix_web` to create `out`, and build
the admin/API repository in `/home/signfixm/signfix` to create `dist`. Register
only `/home/signfixm/signfix` as the Node application for `https://signfix.me/`,
use `app.js` as its startup file, and set `MARKETING_WEB_ROOT` to
`/home/signfixm/signfix_web/out`. Do not register both repositories at the same
application URL. Passenger owns the listener in this mode, so `HOST`, `PORT`,
PM2, and a reverse-proxy rule are not used. Use either Passenger or PM2 for the
public application, never both. Configure PM2 only when the host provides SSH
and an editable LiteSpeed external-app/proxy mapping to `127.0.0.1:5000`.

The `app.js` entry point exports the Express application for Passenger and
replaces the generated cPanel page that says `It works! NodeJS ...`. Run
`npm run build` after every frontend source change and deploy the resulting
`dist` directory with the release. Do not add an `.htaccess` proxy until the
provider confirms that proxy directives are allowed.

If `POST /api/*` returns `405 Method Not Allowed` with `Allow: GET, HEAD`, the
marketing repository's static `server.js` is still registered at the public
application URL. Stop that Node application and register only
`/home/signfixm/signfix` at the root URL with `app.js` as its startup file. Set
`MARKETING_WEB_ROOT=/home/signfixm/signfix_web/out`; the Express application
will then serve the marketing export at `/`, the admin SPA at `/admin`, and the
API at `/api`.

## Render and Vercel

Render uses `render.yaml`: `npm ci` runs the project's `postinstall` build and
creates `dist`, then the Node service exposes the SPA and API together. The same
hook also protects existing Render/cPanel setups whose build command is still
only `npm install`. The hook uses npm's original working directory because
CloudLinux runs lifecycle scripts from its `nodevenv` library directory. Keep
the Render environment values for `DATABASE_URL` and `JWT_SECRET` configured in
the dashboard.

Vercel publishes `dist`. Its rewrites keep `/`, `/admin`, and nested browser
routes on the SPA, while `/api/*` and `/socket.io/*` are proxied to
`https://signfix-2.onrender.com`. Deploy Render before Vercel when both are
being updated so the frontend never targets an older API.

## Validation

```bash
curl -fsSI http://127.0.0.1:5000/
curl -fsS http://127.0.0.1:5000/api/health
curl -fsSI http://127.0.0.1:5000/admin
curl -fsSI http://127.0.0.1:5000/admin/dashboard
curl -fsSI https://signfix.me/
curl -fsS https://signfix.me/api/health
curl -fsSI https://signfix.me/admin
curl -fsSI https://signfix.me/admin/dashboard
curl -i -H 'Origin: https://signfix.me' https://signfix.me/api/health
curl -i -H 'Origin: https://untrusted.example' https://signfix.me/api/health
curl -fsSI https://signfix-2.vercel.app/
curl -fsSI https://signfix-2.vercel.app/admin
curl -fsS https://signfix-2.vercel.app/api/health
curl -fsSI https://signfix-2.onrender.com/
curl -fsSI https://signfix-2.onrender.com/admin
curl -fsS https://signfix-2.onrender.com/api/health
openssl s_client -connect signfix.me:443 -servername signfix.me </dev/null
pm2 restart signfix-api && curl -fsS http://127.0.0.1:5000/api/health
```

Confirm `database.connected` in the health response, then test admin login and
an authenticated admin request in browser developer tools. The production API
base URL for admin, customer, and technician clients is `https://signfix.me`.
No DNS change is required if `signfix.me` already resolves to this hosting server.

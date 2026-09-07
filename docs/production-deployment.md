# SignFix production deployment

This deployment keeps one Node process on `127.0.0.1:5000`. Express serves the
API at `/` and `/api/*`, plus the Vite admin build at `/admin/*`. The public web
server terminates the existing TLS certificate and proxies requests to Node.

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

Validate with `apachectl configtest` before reloading Apache. On shared hosting
where virtual-host changes are unavailable, configure the equivalent proxy in
cPanel's Node.js Application/Passenger UI and use `app.js` as the entry point.
It exports the Express application for Passenger and replaces the generated
cPanel page that says `It works! NodeJS ...`. Run `npm run build` after every
upload because `dist/admin` is generated and intentionally not committed. Do not
add an `.htaccess` proxy until the provider confirms `mod_proxy` is allowed.

## Validation

```bash
curl -fsS http://127.0.0.1:5000/
curl -fsS http://127.0.0.1:5000/api/health
curl -fsSI http://127.0.0.1:5000/admin
curl -fsSI http://127.0.0.1:5000/admin/dashboard
curl -fsS https://signfix.me/
curl -fsS https://signfix.me/api/health
curl -fsSI https://signfix.me/admin
curl -fsSI https://signfix.me/admin/dashboard
curl -i -H 'Origin: https://signfix.me' https://signfix.me/api/health
curl -i -H 'Origin: https://untrusted.example' https://signfix.me/api/health
openssl s_client -connect signfix.me:443 -servername signfix.me </dev/null
pm2 restart signfix-api && curl -fsS http://127.0.0.1:5000/api/health
```

Confirm `database.connected` in the health response, then test admin login and
an authenticated admin request in browser developer tools. The production API
base URL for admin, customer, and technician clients is `https://signfix.me`.
No DNS change is required if `signfix.me` already resolves to this hosting server.

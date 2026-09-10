const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { isCorsOriginAllowed, uploadDir } = require('./config');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const rateLimit = require('./middleware/rateLimit');

fs.mkdirSync(uploadDir, { recursive: true });
const app = express();
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'https:', 'wss:'],
      workerSrc: ["'self'", 'blob:'],
    },
  },
}));

app.use(cors({
  origin(origin, callback) {
    if (isCorsOriginAllowed(origin)) return callback(null, true);
    callback(Object.assign(new Error('Origin is not allowed by CORS'), { status: 403 }));
  },
}));

app.use(express.json({
  limit: '2mb',
  verify: (req, _res, buffer) => {
    if (req.originalUrl.startsWith('/api/payments/webhook')) req.rawBody = buffer;
  },
}));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));
app.use('/api', routes);
// Never let an unknown API request fall through to the SPA HTML response.
app.use('/api', notFound);

const webBuild = path.resolve(__dirname, '../dist');
const webIndex = path.join(webBuild, 'index.html');

// CloudLinux/cPanel Passenger does not always run build steps automatically.
// Auto-build the SPA with Vite if dist/index.html is missing on server start.
if (!fs.existsSync(webIndex)) {
  try {
    const viteCli = path.join(__dirname, '../node_modules/vite/bin/vite.js');
    if (fs.existsSync(viteCli)) {
      console.log('dist/index.html missing; building frontend SPA with Vite...');
      spawnSync(process.execPath, [viteCli, 'build'], {
        cwd: path.resolve(__dirname, '..'),
        env: process.env,
        stdio: 'inherit',
      });
    }
  } catch (err) {
    console.error('Failed to auto-build frontend SPA:', err.message);
  }
}

if (fs.existsSync(webIndex)) {
  app.use('/assets', express.static(path.join(webBuild, 'assets'), { maxAge: '1y', immutable: true }));
  app.use(express.static(webBuild, { index: false, maxAge: '1h' }));
  // The React router deliberately supports both the canonical root URL and
  // the legacy `/admin` prefix. Catch-all sends index.html for all non-API paths.
  app.get(/.*/, (_req, res, next) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(webIndex, (error) => error && next(error));
  });
} else if (process.env.NODE_ENV === 'production') {
  throw new Error(`Production build is missing at ${webIndex}; run npm run build before starting the server`);
} else {
  app.get('/', (_req, res) => res.json({ name: 'SignFix API', status: 'ok', health: '/api/health' }));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;

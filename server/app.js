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

const adminBuild = path.resolve(__dirname, '../dist');
const adminIndex = path.join(adminBuild, 'index.html');
const configuredMarketingBuild = process.env.MARKETING_WEB_ROOT?.trim();
const marketingBuild = path.resolve(configuredMarketingBuild || path.resolve(__dirname, '../../signfix_web/out'));
const marketingIndex = path.join(marketingBuild, 'index.html');

// CloudLinux/cPanel Passenger does not always run build steps automatically.
// Auto-build the SPA with Vite if dist/index.html is missing on server start.
if (!fs.existsSync(adminIndex)) {
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

const hasAdminBuild = fs.existsSync(adminIndex);
const hasMarketingBuild = fs.existsSync(marketingIndex);

if (!hasAdminBuild && process.env.NODE_ENV === 'production') {
  throw new Error(`Admin production build is missing at ${adminIndex}; run npm run build before starting the server`);
}

if (configuredMarketingBuild && !hasMarketingBuild && process.env.NODE_ENV === 'production') {
  throw new Error(`Marketing production build is missing at ${marketingIndex}; build signfix_web before starting the server`);
}

if (hasAdminBuild) {
  // Vite currently emits root-based asset URLs. Next.js uses /_next, so the
  // two generated asset namespaces do not collide.
  app.use('/assets', express.static(path.join(adminBuild, 'assets'), { maxAge: '1y', immutable: true }));

  const firebaseWorker = path.join(adminBuild, 'firebase-messaging-sw.js');
  if (fs.existsSync(firebaseWorker)) {
    app.get('/firebase-messaging-sw.js', (_req, res, next) => {
      res.set('Cache-Control', 'no-cache');
      res.sendFile(firebaseWorker, (error) => error && next(error));
    });
  }
}

if (hasMarketingBuild) {
  // The admin SPA owns only /admin and its nested browser routes.
  app.get(/^\/admin(?:\/.*)?$/, (_req, res, next) => {
    if (!hasAdminBuild) return next();
    res.set('Cache-Control', 'no-cache');
    return res.sendFile(adminIndex, (error) => error && next(error));
  });

  // Serve hashed Next.js files aggressively, while keeping generated HTML
  // fresh. `extensions` supports clean exported URLs such as /about.
  app.use('/_next/static', express.static(path.join(marketingBuild, '_next/static'), { maxAge: '1y', immutable: true }));

  // A Next.js export can contain both `about.html` and an `about/` directory
  // containing RSC data. Resolve the HTML file before express.static sees the
  // directory, otherwise it redirects to /about/ and misses the page.
  app.get(/.*/, (req, res, next) => {
    let route;
    try {
      route = decodeURIComponent(req.path).replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    } catch (_) {
      return next();
    }
    if (!route || route.includes('\0') || path.posix.extname(route)) return next();

    const htmlFile = path.resolve(marketingBuild, `${route}.html`);
    const relativeFile = path.relative(marketingBuild, htmlFile);
    const isInsideBuild = relativeFile && relativeFile !== '..' && !relativeFile.startsWith(`..${path.sep}`) && !path.isAbsolute(relativeFile);
    if (!isInsideBuild || !fs.existsSync(htmlFile) || !fs.statSync(htmlFile).isFile()) return next();

    res.set('Cache-Control', 'no-cache');
    return res.sendFile(htmlFile, (error) => error && next(error));
  });

  app.use(express.static(marketingBuild, {
    extensions: ['html'],
    maxAge: '1h',
    setHeaders(res, filePath) {
      if (path.extname(filePath).toLowerCase() === '.html') res.set('Cache-Control', 'no-cache');
    },
  }));

  const marketingNotFound = path.join(marketingBuild, '404.html');
  app.get(/.*/, (_req, res, next) => {
    if (!fs.existsSync(marketingNotFound)) return next();
    res.status(404).set('Cache-Control', 'no-cache');
    return res.sendFile(marketingNotFound, (error) => error && next(error));
  });
} else if (hasAdminBuild) {
  // Backward-compatible fallback for deployments that contain only this
  // repository: serve the admin SPA at both / and /admin.
  app.get(/.*/, (_req, res, next) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(adminIndex, (error) => error && next(error));
  });
} else {
  app.get('/', (_req, res) => res.json({ name: 'SignFix API', status: 'ok', health: '/api/health' }));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;

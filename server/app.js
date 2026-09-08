const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const { isCorsOriginAllowed, uploadDir } = require('./config');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const rateLimit=require('./middleware/rateLimit');
const path = require('path');
fs.mkdirSync(uploadDir, { recursive: true });
const app = express();
app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      // Uploaded files and generated concepts can be returned as HTTPS or blob
      // URLs, while realtime updates may connect to a separately hosted API.
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
app.use(express.json({limit:'2mb',verify:(req,_res,buffer)=>{if(req.originalUrl.startsWith('/api/payments/webhook'))req.rawBody=buffer;}}));
app.use('/api',rateLimit({windowMs:15*60*1000,max:1000}));
app.use('/api', routes);
// Never let an unknown API request fall through to the SPA HTML response.
app.use('/api', notFound);
if (process.env.NODE_ENV === 'production') {
  const webBuild = path.resolve(__dirname, '../dist');
  const webIndex = path.join(webBuild, 'index.html');
  if (!fs.existsSync(webIndex)) {
    throw new Error(`Production build is missing at ${webIndex}; run npm run build before starting the server`);
  }
  app.use('/assets', express.static(path.join(webBuild, 'assets'), { maxAge: '1y', immutable: true }));
  app.use(express.static(webBuild, { index: false, maxAge: '1h' }));
  // The React router deliberately supports both the canonical root URL and
  // the legacy `/admin` prefix. The fallback also preserves deep links and QR
  // verification URLs on Render, Passenger/cPanel, and reverse proxies.
  app.get(['/', '/*path'], (_req, res, next) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(webIndex, (error) => error && next(error));
  });
} else {
  app.get('/', (_req, res) => res.json({ name: 'SignFix API', status: 'ok', health: '/api/health' }));
}
app.use(notFound);
app.use(errorHandler);
module.exports = app;

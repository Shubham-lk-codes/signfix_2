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
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (isCorsOriginAllowed(origin)) return callback(null, true);
    callback(Object.assign(new Error('Origin is not allowed by CORS'), { status: 403 }));
  },
}));
app.use(express.json({limit:'2mb',verify:(req,_res,buffer)=>{if(req.originalUrl.startsWith('/api/payments/webhook'))req.rawBody=buffer;}}));
app.use('/api',rateLimit({windowMs:15*60*1000,max:1000}));
app.use('/api', routes);
app.get('/', (_req, res) => res.json({ name: 'SignFix API', status: 'ok', health: '/api/health' }));
if (process.env.NODE_ENV === 'production') {
  const adminBuild = path.resolve(__dirname, '../dist/admin');
  app.use('/admin', express.static(adminBuild, { index: false, maxAge: '1y', immutable: true }));
  app.get(['/admin', '/admin/*path'], (_req, res, next) => {
    res.sendFile(path.join(adminBuild, 'index.html'), (error) => error && next(error));
  });
  // Preserve existing public QR links while the admin bundle is hosted below /admin.
  app.get('/asset/scan/:token', (_req, res, next) => {
    res.sendFile(path.join(adminBuild, 'index.html'), (error) => error && next(error));
  });
}
app.use(notFound);
app.use(errorHandler);
module.exports = app;

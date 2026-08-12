const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  uploadDir: path.resolve(__dirname, '../uploads'),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean),
};

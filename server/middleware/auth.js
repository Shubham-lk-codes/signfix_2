const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

async function authenticate(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    req.user = jwt.verify(token, jwtSecret);
    if (req.user.jti) { const database=require('../database'); const revoked=await database.getPool().query('SELECT 1 FROM revoked_tokens WHERE jti=$1 AND expires_at>NOW()',[req.user.jti]); if(revoked.rowCount) return res.status(401).json({error:'Token has been revoked'}); }
    next();
  } catch (_) {
    res.status(401).json({ error: 'Authentication required' });
  }
}

const authorize = (...roles) => (req, res, next) => roles.includes(req.user.role)
  ? next()
  : res.status(403).json({ error: 'Insufficient permission' });

module.exports = { authenticate, authorize };

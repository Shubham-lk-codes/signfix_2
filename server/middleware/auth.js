const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function authenticate(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch (_) {
    res.status(401).json({ error: 'Authentication required' });
  }
}

const authorize = (...roles) => (req, res, next) => roles.includes(req.user.role)
  ? next()
  : res.status(403).json({ error: 'Insufficient permission' });

module.exports = { authenticate, authorize };

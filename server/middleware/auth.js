const jwt = require('jsonwebtoken');
const { jwtSecret,jwtIssuer,jwtAudience } = require('../config');

async function authenticate(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    req.user = jwt.verify(token, jwtSecret,{algorithms:['HS256'],issuer:jwtIssuer,audience:jwtAudience});
    if (req.user.jti) { const database=require('../database'); const revoked=await database.getPool().query('SELECT 1 FROM revoked_tokens WHERE jti=$1 AND expires_at>NOW()',[req.user.jti]); if(revoked.rowCount) return res.status(401).json({error:'Token has been revoked'}); }
    next();
  } catch (_) {
    res.status(401).json({ error: 'Authentication required' });
  }
}

const authorize = (...roles) => (req, res, next) => roles.includes(req.user.role)
  ? next()
  : res.status(403).json({ error: 'Insufficient permission' });

const permit = (permissionOrResolver) => async (req, res, next) => {
  try {
    if (req.user.role === 'super_admin') return next();
    const permission = typeof permissionOrResolver === 'function' ? permissionOrResolver(req) : permissionOrResolver;
    const database = require('../database');
    const { rowCount } = await database.getPool().query(`SELECT 1 FROM users u JOIN role_permissions rp ON rp.role_id=u.role_id JOIN permissions p ON p.id=rp.permission_id WHERE u.id=$1 AND p.name=$2`, [req.user.id, permission]);
    return rowCount ? next() : res.status(403).json({ error: 'Insufficient permission', errorCode: 'PERMISSION_DENIED' });
  } catch (error) { next(error); }
};

module.exports = { authenticate, authorize, permit };

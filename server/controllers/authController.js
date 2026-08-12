const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../database');
const { jwtSecret } = require('../config');

async function login(req, res) {
  const email = req.body.email.trim().toLowerCase();
  const user = await database.findUserByEmail(email);
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
  const adminRoles = ['super_admin', 'admin', 'sales_manager', 'service_manager', 'technician_manager', 'support_agent'];
  if (req.body.portal === 'admin' && !adminRoles.includes(user.role)) return res.status(403).json({ error: 'Admin access required' });
  if (req.body.portal && req.body.portal !== 'admin' && req.body.portal !== user.role) return res.status(403).json({ error: `${req.body.portal} access required` });
  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ token: jwt.sign(safeUser, jwtSecret, { expiresIn: '8h' }), user: safeUser });
}
function me(req, res) { res.json({ user: req.user }); }
module.exports = { login, me };

const database = require('../../database');
const firebase = require('../../services/firebaseService');

async function register(req, res) {
  await database.registerDeviceToken(req.user.id, req.body.token, req.body.platform || 'web');
  res.status(201).json({ registered: true });
}

async function send(req, res) {
  const { title, body, audience = 'all', data = {} } = req.body;
  const recipients = await database.notificationRecipients(audience);
  const result = await firebase.sendToTokens(recipients.map(row => row.token), { title, body }, data);
  await database.createBulkNotifications(recipients, { title, body, channel: 'push' }, req.user);
  res.status(201).json({ audience, recipients: recipients.length, ...result });
}

async function status(req, res) { res.json({ configured: firebase.isConfigured() }); }
module.exports = { register, send, status };

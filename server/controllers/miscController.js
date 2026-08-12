const database = require('../database');
async function health(req, res) { res.json({ status: 'ok', service: 'signfix-api', database: await database.health() }); }
async function report(req, res) { res.json(await database.report(req.params.type, req.query)); }
async function aiChat(req, res) { const text = String(req.body.message || ''); res.json({ reply: /shop|front|sign/i.test(text) ? 'What are the approximate width and height, preferred lighting, location, and installation requirement?' : 'Please share the sign type, dimensions, material, lighting and location.', actions: ['Calculate Price', 'Request Design', 'Talk to Support'], disclaimer: 'Concept and guidance only. Final feasibility, price and delivery require Admin approval.' }); }
module.exports = { health, report, aiChat };

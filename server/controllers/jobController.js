const database = require('../database');
async function list(req, res) { res.json({ data: await database.listJobs(req.user, req.query) }); }
async function updateStatus(req, res) { res.json(await database.updateJobStatus(req.params.id, req.body, req.user)); }
module.exports = { list, updateStatus };

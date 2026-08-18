const database = require('../../database');
async function dashboard(req, res) { res.json(await database.dashboard()); }
module.exports = { dashboard };

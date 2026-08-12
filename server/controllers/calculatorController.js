const database = require('../database');
async function calculate(req, res) { res.json(await database.calculatePrice(req.body)); }
module.exports = { calculate };

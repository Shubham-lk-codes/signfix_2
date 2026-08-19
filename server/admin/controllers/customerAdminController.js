const database = require('../../database');

async function list(req, res) { res.json(await database.listAdminCustomers(req.query)); }
async function create(req, res) { res.status(201).json(await database.createAdminCustomer(req.body, req.user)); }
async function detail(req, res) { res.json(await database.getAdminCustomer(req.params.id)); }
async function update(req, res) { res.json(await database.updateAdminCustomer(req.params.id, req.body, req.user)); }
async function disable(req, res) { res.json(await database.disableAdminCustomer(req.params.id, req.user)); }

module.exports = { list, create, detail, update, disable };

const database = require('../../database');
async function list(req, res) { res.json(await database.listCatalog(req.params.resource, req.query)); }
async function create(req, res) { res.status(201).json(await database.createCatalog(req.params.resource, req.body, req.user)); }
async function update(req, res) { res.json(await database.updateCatalog(req.params.resource, req.params.id, req.body, req.user)); }
async function remove(req, res) { await database.deleteCatalog(req.params.resource, req.params.id, req.user); res.status(204).end(); }
module.exports = { list, create, update, remove };

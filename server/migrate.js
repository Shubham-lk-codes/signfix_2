const fs = require('fs/promises');
const path = require('path');
const database = require('./database');

async function migrate() {
  if (!database.isConfigured()) return;

  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');
  await database.getPool().query(schema);
}

module.exports = migrate;

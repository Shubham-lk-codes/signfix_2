const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const database = require('./database');

async function migrate() {
  if (!database.isConfigured()) return;

  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');
  const checksum = crypto.createHash('sha256').update(schema).digest('hex');
  const client = await database.getPool().connect();
  try {
    // Only one instance migrates, and an unchanged schema does no DDL work on
    // subsequent starts. This matters for cold starts on hosted Postgres.
    await client.query('SELECT pg_advisory_lock($1)', [739142]);
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, checksum CHAR(64) NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    const current = await client.query('SELECT checksum FROM schema_migrations WHERE name=$1', ['schema.sql']);
    if (current.rows[0]?.checksum !== checksum) {
      await client.query(schema);
      await client.query(`INSERT INTO schema_migrations(name,checksum,applied_at) VALUES($1,$2,NOW()) ON CONFLICT(name) DO UPDATE SET checksum=EXCLUDED.checksum,applied_at=NOW()`, ['schema.sql', checksum]);
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [739142]).catch(() => {});
    client.release();
  }
}

module.exports = migrate;

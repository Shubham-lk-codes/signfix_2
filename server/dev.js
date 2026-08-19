const app = require('./app');
const { port } = require('./config');
const migrate = require('./migrate');

async function start() {
  await migrate();
  const api = app.listen(port, () => console.log(`SignFix API: http://localhost:${port}`));
  const {corsOrigins}=require('./config');
  await require('./services/realtimeService').initialize(api,corsOrigins);
  require('./services/aiQueue').startWorker();
  api.on('error', (error) => {
    if (error.code === 'EADDRINUSE') console.error(`Port ${port} is already in use. Stop the existing API process and retry.`);
    else console.error(error);
    process.exit(1);
  });

  const { createServer } = await import('vite');
  const vite = await createServer({ configFile: 'vite.config.mjs' });
  await vite.listen();
  vite.printUrls();

  async function shutdown() {
    await vite.close();
    api.close(() => process.exit(0));
  }
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

start().catch((error) => { console.error(error); process.exit(1); });

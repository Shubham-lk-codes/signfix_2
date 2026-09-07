const app = require('./app');
const { host, port } = require('./config');
const migrate = require('./migrate');

async function start() {
  await migrate();
  const server=app.listen(port, host, () => console.log(`SignFix API listening on http://${host}:${port}`));
  const {isCorsOriginAllowed}=require('./config');
  await require('./services/realtimeService').initialize(server,isCorsOriginAllowed);
  require('./services/aiQueue').startWorker();
  const shutdown = (signal) => {
    console.log(`${signal} received; closing SignFix API`);
    server.close(() => process.exit(0));
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  return server;
}

if (require.main === module) {
  start().catch((error) => {
    console.error('SignFix API failed to start:', error);
    process.exit(1);
  });
}

module.exports = app;
module.exports.start = start;

const app = require('./app');
const { port } = require('./config');
const migrate = require('./migrate');

async function start() {
  await migrate();
  const server=app.listen(port, () => console.log(`SignFix API listening on port ${port}`));
  const {corsOrigins}=require('./config');
  await require('./services/realtimeService').initialize(server,corsOrigins);
  require('./services/aiQueue').startWorker();
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

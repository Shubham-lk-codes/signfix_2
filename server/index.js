const app = require('./app');
const { port } = require('./config');
const migrate = require('./migrate');

async function start() {
  await migrate();
  return app.listen(port, () => console.log(`SignFix API listening on port ${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error('SignFix API failed to start:', error);
    process.exit(1);
  });
}

module.exports = app;
module.exports.start = start;

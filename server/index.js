const app = require('./app');
const { port } = require('./config');
if (require.main === module) app.listen(port, () => console.log(`SignFix API listening on port ${port}`));
module.exports = app;

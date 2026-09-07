// cPanel/CloudLinux Passenger entry point.
// Passenger owns the HTTP listener, so export the Express application rather
// than calling app.listen() here. Standalone and PM2 deployments use
// server/index.js instead.
module.exports = require('./server/app');

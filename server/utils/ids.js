const crypto = require('crypto');
function businessId(prefix) { return `${prefix}-${new Date().getFullYear()}-${crypto.randomInt(1, 999999).toString().padStart(6, '0')}`; }
module.exports = { businessId };

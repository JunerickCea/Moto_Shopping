const path = require('path');
const config = require('../config');
const { connectionFor } = require('./connection');

module.exports = {
  client: 'pg',
  connection: connectionFor(config.databaseUrl),
  pool: { min: 0, max: 5 },
  migrations: { directory: path.join(__dirname, 'migrations') },
};

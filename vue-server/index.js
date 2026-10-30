const config = require('./config');
const { createDb } = require('./db');
const { createGoogleVerifier } = require('./lib/google');
const { createApp } = require('./app');

const { db, pool } = createDb(config.databaseUrl);
const app = createApp({
  config,
  db,
  pool,
  verifyGoogleToken: createGoogleVerifier(config.googleClientId),
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function sslFor(databaseUrl) {
  const { hostname } = new URL(databaseUrl);
  return LOCAL_HOSTS.has(hostname) ? false : { rejectUnauthorized: true };
}

function connectionFor(databaseUrl) {
  return { connectionString: databaseUrl, ssl: sslFor(databaseUrl) };
}

module.exports = { connectionFor };

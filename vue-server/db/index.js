const knex = require('knex');
const { Pool } = require('pg');
const { connectionFor } = require('./connection');

function createDb(databaseUrl) {
  const connection = connectionFor(databaseUrl);
  const db = knex({ client: 'pg', connection, pool: { min: 0, max: 5 } });
  const pool = new Pool({ ...connection, max: 3 });
  return { db, pool, close: () => Promise.all([db.destroy(), pool.end()]) };
}

module.exports = { createDb };

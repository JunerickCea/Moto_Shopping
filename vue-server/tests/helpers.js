const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

const testUrl = process.env.TEST_DATABASE_URL;
const envFile = path.join(__dirname, '..', '.env');
const realUrl = fs.existsSync(envFile) ? dotenv.parse(fs.readFileSync(envFile)).DATABASE_URL : undefined;

if (testUrl && testUrl === realUrl) {
  throw new Error('TEST_DATABASE_URL must not be the same as DATABASE_URL: tests wipe every table.');
}

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-test-secret-test-secret';
process.env.DATABASE_URL = testUrl || 'postgres://localhost/unused';
process.env.ADMIN_EMAILS = 'boss@example.com';

const request = require('supertest');
const config = require('../config');
const { createDb } = require('../db');
const { createApp } = require('../app');
const { hashPassword } = require('../lib/passwords');

const enabled = Boolean(testUrl);

async function setup() {
  const handle = createDb(testUrl);
  await handle.db.migrate.latest({ directory: path.join(__dirname, '..', 'db', 'migrations') });
  return handle;
}

async function reset(db) {
  await db.raw('truncate table order_items, orders, motorcycles, session, users restart identity cascade');
}

function build(handle, overrides = {}) {
  return createApp({ config, db: handle.db, pool: handle.pool, ...overrides });
}

const agent = (app) => request.agent(app);

async function createUser(db, { email, name = 'Test User', password = 'correct horse battery', role = 'User' }) {
  const [user] = await db('users')
    .insert({ email, name, role, password_hash: await hashPassword(password) })
    .returning('*');
  return user;
}

async function loggedIn(app, db, { email, password = 'correct horse battery', role = 'User' }) {
  await createUser(db, { email, password, role });
  const a = agent(app);
  await a.post('/api/auth/login').send({ email, password }).expect(200);
  return a;
}

const bike = (overrides = {}) => ({
  Brand: 'Honda',
  MotorcycleName: 'CBR500R',
  ReleaseDate: '2024-03-01',
  Price: 7000,
  Stock: 5,
  Quantity: 5,
  Image: 'https://example.com/cbr.jpg',
  ...overrides,
});

const customerInfo = (overrides = {}) => ({
  fullName: 'Juan Dela Cruz',
  email: 'juan@example.com',
  contactNo: '09171234567',
  address: 'Manila',
  paymentMethod: 'Cash-on-Delivery',
  ...overrides,
});

module.exports = { enabled, setup, reset, build, agent, createUser, loggedIn, bike, customerInfo, request };

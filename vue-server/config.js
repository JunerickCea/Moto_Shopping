const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. See vue-server/.env.example.`);
  }
  return value;
}

const sessionSecret = required('SESSION_SECRET');
if (isProduction && sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters in production.');
}

module.exports = {
  env,
  isProduction,
  port: Number(process.env.PORT) || 4444,
  databaseUrl: required('DATABASE_URL'),
  sessionSecret,
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  adminEmails: (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
};

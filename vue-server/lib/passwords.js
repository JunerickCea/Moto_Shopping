const bcrypt = require('bcryptjs');
const { z } = require('zod');

const COST = process.env.NODE_ENV === 'test' ? 4 : 12;
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', COST);

// Rules for any new password (registration and password change). bcrypt ignores bytes past 72.
const newPasswordRule = z.string()
  .min(8, 'Password must be at least 8 characters')
  .refine((p) => Buffer.byteLength(p) <= 72, 'Password is too long');

const hashPassword = (password) => bcrypt.hash(password, COST);

// Always runs a bcrypt compare so response time doesn't reveal whether an account exists.
async function verifyPassword(password, hash) {
  const matches = await bcrypt.compare(password, hash || DUMMY_HASH);
  return Boolean(hash) && matches;
}

module.exports = { hashPassword, verifyPassword, newPasswordRule };

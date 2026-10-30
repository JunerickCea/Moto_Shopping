const bcrypt = require('bcryptjs');

const COST = process.env.NODE_ENV === 'test' ? 4 : 12;
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', COST);

const hashPassword = (password) => bcrypt.hash(password, COST);

// Always runs a bcrypt compare so response time doesn't reveal whether an account exists.
async function verifyPassword(password, hash) {
  const matches = await bcrypt.compare(password, hash || DUMMY_HASH);
  return Boolean(hash) && matches;
}

module.exports = { hashPassword, verifyPassword };

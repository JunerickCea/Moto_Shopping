const { sessionUser } = require('../lib/serializers');
const { destroy } = require('../lib/session');

async function loadUser(req, res, next) {
  req.user = null;
  const userId = req.session?.userId;
  if (!userId) return next();

  const user = await req.app.locals.db('users').where({ id: userId }).first();
  if (user && user.is_active) {
    req.user = sessionUser(user);
  } else {
    await destroy(req);
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in.' });
  next();
}

const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Please log in.' });
  if (req.user.role !== role) return res.status(403).json({ error: 'You do not have permission to do that.' });
  next();
};

module.exports = { loadUser, requireAuth, requireAdmin: requireRole('Admin') };

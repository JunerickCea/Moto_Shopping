const { promisify } = require('util');

function regenerate(req) {
  return promisify(req.session.regenerate.bind(req.session))();
}

function destroy(req) {
  return promisify(req.session.destroy.bind(req.session))();
}

async function logIn(req, userId) {
  await regenerate(req);
  req.session.userId = userId;
}

function destroyUserSessions(db, userId) {
  return db('session').whereRaw("sess->>'userId' = ?", [String(userId)]).del();
}

module.exports = { logIn, destroy, destroyUserSessions };

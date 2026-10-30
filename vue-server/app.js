const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const { ZodError } = require('zod');
const { securityHeaders, sameOriginOnly } = require('./middleware/security');
const { loadUser } = require('./middleware/auth');
const { authRoutes } = require('./routes/auth');
const usersRoutes = require('./routes/users');
const motorcycleRoutes = require('./routes/motorcycles');
const orderRoutes = require('./routes/orders');
const feedbackRoutes = require('./routes/feedback');
const shopRoutes = require('./routes/shop');

const CLIENT_DIST = path.join(__dirname, '..', 'vue-client', 'dist');
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function createApp({ config, db, pool, verifyGoogleToken = null, limits = {}, clientDist = CLIENT_DIST }) {
  const app = express();
  app.locals.db = db;
  app.set('trust proxy', 1);
  app.use(securityHeaders(config));

  const api = express.Router();
  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  api.get('/health', async (req, res) => {
    await db.raw('select 1');
    res.json({ ok: true });
  });

  const PgStore = connectPgSimple(session);
  api.use(express.json({ limit: '100kb' }));
  api.use(sameOriginOnly);
  api.use(session({
    name: 'sid',
    secret: config.sessionSecret,
    store: new PgStore({ pool, tableName: 'session', createTableIfMissing: false }),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
    },
  }));
  api.use(loadUser);

  api.use('/auth', authRoutes({
    config,
    verifyGoogleToken,
    limits: { login: 10, register: 10, google: 30, ...limits },
  }));
  api.use('/users', usersRoutes);
  api.use('/motorcycles', motorcycleRoutes);
  api.use('/orders', orderRoutes);
  api.use('/feedback', feedbackRoutes);
  api.use('/shop', shopRoutes);
  api.use((req, res) => res.status(404).json({ error: 'Not found.' }));
  app.use('/api', api);

  if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || path.extname(req.path) || !req.accepts('html')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: err.issues[0]?.message || 'Invalid request.',
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    const status = err.status || err.statusCode;
    if (status && status < 500) {
      return res.status(status).json({ error: err.expose ? err.message : 'Bad request.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  });

  return app;
}

module.exports = { createApp };

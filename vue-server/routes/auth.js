const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { z } = require('zod');
const { hashPassword, verifyPassword } = require('../lib/passwords');
const { logIn, destroy, destroyUserSessions } = require('../lib/session');
const { sessionUser } = require('../lib/serializers');
const { requireAuth } = require('../middleware/auth');

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine((p) => Buffer.byteLength(p) <= 72, 'Password is too long'),
});
const loginSchema = z.object({ email, password: z.string().min(1).max(200) });
const googleSchema = z.object({ credential: z.string().min(1).max(4096) });

const limiter = (limit, windowMs, options = {}) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
  ...options,
});

function authRoutes({ config, verifyGoogleToken, limits }) {
  const router = express.Router();
  const WINDOW = 15 * 60 * 1000;
  const loginByIp = limiter(limits.login, WINDOW, { skipSuccessfulRequests: true });
  const loginByEmail = limiter(limits.login, WINDOW, {
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `email:${String(req.body?.email || '').trim().toLowerCase()}`,
  });
  const registerLimit = limiter(limits.register, 60 * 60 * 1000);
  const googleLimit = limiter(limits.google, WINDOW);

  router.post('/register', registerLimit, async (req, res) => {
    const data = registerSchema.parse(req.body);
    const db = req.app.locals.db;

    const taken = () => res.status(409).json({ error: 'An account with this email already exists.' });
    if (await db('users').where({ email: data.email }).first()) return taken();

    // Never auto-promote here: the email is unverified, so ADMIN_EMAILS only applies via Google sign-in.
    let user;
    try {
      [user] = await db('users')
        .insert({
          email: data.email,
          name: data.name,
          password_hash: await hashPassword(data.password),
          last_login_at: db.fn.now(),
        })
        .returning('*');
    } catch (err) {
      if (err.code === '23505') return taken();
      throw err;
    }

    await logIn(req, user.id);
    res.status(201).json({ user: sessionUser(user) });
  });

  router.post('/login', loginByIp, loginByEmail, async (req, res) => {
    const { email: address, password } = loginSchema.parse(req.body);
    const db = req.app.locals.db;

    const user = await db('users').where({ email: address }).first();
    const valid = await verifyPassword(password, user?.password_hash);
    if (!user || !valid) return res.status(401).json({ error: 'Invalid email or password.' });
    if (!user.is_active) return res.status(403).json({ error: 'This account has been disabled.' });

    await db('users').where({ id: user.id }).update({ last_login_at: db.fn.now() });
    await logIn(req, user.id);
    res.json({ user: sessionUser(user) });
  });

  router.post('/google', googleLimit, async (req, res) => {
    if (!verifyGoogleToken) return res.status(503).json({ error: 'Google sign-in is not configured.' });
    const { credential } = googleSchema.parse(req.body);
    const db = req.app.locals.db;

    let profile;
    try {
      profile = await verifyGoogleToken(credential);
    } catch {
      return res.status(401).json({ error: 'Google sign-in failed.' });
    }
    if (!profile.emailVerified) return res.status(401).json({ error: 'Your Google email address is not verified.' });

    const address = profile.email.toLowerCase();
    const isAdminEmail = config.adminEmails.includes(address);
    let user = await db('users').where({ google_sub: profile.sub }).first();

    if (!user) {
      const existing = await db('users').where({ email: address }).first();
      if (existing?.google_sub) {
        return res.status(409).json({ error: 'This email is linked to a different Google account.' });
      }
      if (existing) {
        // An unverified password account may have been registered by someone other than the
        // mailbox owner, so drop its password and sessions when the real owner links Google.
        const unverified = !existing.email_verified;
        [user] = await db('users').where({ id: existing.id }).update({
          google_sub: profile.sub,
          email_verified: true,
          avatar_url: existing.avatar_url || profile.picture,
          ...(unverified && { password_hash: null }),
        }).returning('*');
        if (unverified) await destroyUserSessions(db, user.id);
      } else {
        [user] = await db('users').insert({
          email: address,
          name: profile.name.slice(0, 100),
          google_sub: profile.sub,
          email_verified: true,
          avatar_url: profile.picture,
        }).returning('*');
      }
    }

    if (!user.is_active) return res.status(403).json({ error: 'This account has been disabled.' });

    const [fresh] = await db('users').where({ id: user.id }).update({
      last_login_at: db.fn.now(),
      ...(isAdminEmail && { role: 'Admin' }),
    }).returning('*');

    await logIn(req, fresh.id);
    res.json({ user: sessionUser(fresh) });
  });

  router.post('/logout', async (req, res) => {
    await destroy(req);
    res.clearCookie('sid');
    res.json({ ok: true });
  });

  router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}

module.exports = { authRoutes };

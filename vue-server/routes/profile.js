const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const { hashPassword, verifyPassword, newPasswordRule } = require('../lib/passwords');
const { logIn, destroyUserSessions } = require('../lib/session');
const { sessionUser } = require('../lib/serializers');
const { PAYMENT_METHODS } = require('../lib/paymentMethods');
const { HttpError } = require('../lib/httpError');

// Email and role are deliberately not editable here: email is the login (and links Google sign-in).
const detailsSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  contactNo: z.string().trim().max(30, 'Contact number can be at most 30 characters').optional().default(''),
  address: z.string().trim().max(300, 'Address can be at most 300 characters').optional().default(''),
  paymentMethod: z.enum(PAYMENT_METHODS).nullish(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password').max(200),
  newPassword: newPasswordRule,
});

// Built per app (like authRoutes) so each test app gets fresh rate-limit counters.
function profileRoutes({ limits }) {
  const router = express.Router();
  router.use(requireAuth);

  const passwordLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: limits.password,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `user:${req.user.id}`,
    message: { error: 'Too many attempts. Please try again later.' },
  });

  router.put('/', async (req, res) => {
    const data = detailsSchema.parse(req.body);
    const [row] = await req.app.locals.db('users').where({ id: req.user.id }).update({
      name: data.name,
      contact_no: data.contactNo,
      address: data.address,
      payment_method: data.paymentMethod || null,
    }).returning('*');
    res.json({ user: sessionUser(row) });
  });

  router.put('/password', passwordLimit, async (req, res) => {
    const { currentPassword, newPassword } = passwordSchema.parse(req.body);
    const db = req.app.locals.db;
    const user = await db('users').where({ id: req.user.id }).first();

    if (!user.password_hash) {
      throw new HttpError(400, 'Your account signs in with Google, so there is no password to change.');
    }
    if (!(await verifyPassword(currentPassword, user.password_hash))) {
      throw new HttpError(400, 'Your current password is incorrect.');
    }

    await db('users').where({ id: user.id }).update({ password_hash: await hashPassword(newPassword) });
    // Sign the account out everywhere else, then give this browser a fresh session.
    await destroyUserSessions(db, user.id);
    await logIn(req, user.id);
    res.json({ ok: true });
  });

  return router;
}

module.exports = { profileRoutes };

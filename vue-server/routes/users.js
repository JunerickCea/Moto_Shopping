const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../middleware/auth');
const { adminUser } = require('../lib/serializers');
const { destroyUserSessions } = require('../lib/session');

const router = express.Router();
router.use(requireAdmin);

const patchSchema = z.object({
  role: z.enum(['Admin', 'User']).optional(),
  isActive: z.boolean().optional(),
}).refine((v) => v.role !== undefined || v.isActive !== undefined, 'Nothing to update');

router.get('/', async (req, res) => {
  const users = await req.app.locals.db('users').orderBy('created_at', 'desc');
  res.json(users.map(adminUser));
});

router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid user id.' });
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot change your own role or status.' });

  const { role, isActive } = patchSchema.parse(req.body);
  const db = req.app.locals.db;
  const [user] = await db('users').where({ id }).update({
    ...(role !== undefined && { role }),
    ...(isActive !== undefined && { is_active: isActive }),
  }).returning('*');
  if (!user) return res.status(404).json({ error: 'User not found.' });

  // Force re-login so the new role or disabled state applies immediately.
  await destroyUserSessions(db, id);
  res.json(adminUser(user));
});

module.exports = router;

const express = require('express');
const { z } = require('zod');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { publicFeedback, adminFeedback } = require('../lib/serializers');
const { HttpError } = require('../lib/httpError');

const router = express.Router();

const PUBLIC_LIMIT = 30;
const UNIQUE_VIOLATION = '23505';

const createSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  rating: z.number().int().min(1, 'Rating must be 1 to 5 stars').max(5, 'Rating must be 1 to 5 stars'),
  comment: z.string().trim().max(1000, 'Feedback can be at most 1000 characters').optional().default(''),
});

const updateSchema = z.object({ isHidden: z.boolean() });

const feedbackId = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid feedback id.');
  return id;
};

// Feedback rows joined with the order's customer name/email, plus each order's items.
async function withOrderDetails(db, query) {
  const rows = await query
    .join('orders', 'orders.id', 'feedback.order_id')
    .select('feedback.*', 'orders.full_name', 'orders.email')
    .orderBy('feedback.created_at', 'desc')
    .orderBy('feedback.id', 'desc');
  const items = rows.length
    ? await db('order_items').whereIn('order_id', rows.map((r) => r.order_id)).orderBy('id')
    : [];
  return rows.map((r) => [r, items.filter((i) => i.order_id === r.order_id)]);
}

router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  const visible = () => db('feedback').where({ is_hidden: false });
  const summary = await visible().avg({ average: 'rating' }).count({ count: '*' }).first();
  const rows = await withOrderDetails(db, visible().limit(PUBLIC_LIMIT));
  res.json({
    average: summary.average === null ? 0 : Math.round(Number(summary.average) * 10) / 10,
    count: Number(summary.count),
    items: rows.map(([f, items]) => publicFeedback(f, items)),
  });
});

router.post('/', requireAuth, async (req, res) => {
  const { orderId, rating, comment } = createSchema.parse(req.body);
  const db = req.app.locals.db;

  const order = await db('orders').where({ id: orderId, user_id: req.user.id }).first();
  if (!order) throw new HttpError(404, 'Order not found.');
  if (order.status !== 'Shipped') throw new HttpError(409, 'You can leave feedback once your order has been shipped.');

  try {
    const [row] = await db('feedback')
      .insert({ order_id: orderId, user_id: req.user.id, rating, comment })
      .returning('*');
    const items = await db('order_items').where({ order_id: orderId }).orderBy('id');
    res.status(201).json(publicFeedback({ ...row, full_name: order.full_name }, items));
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) throw new HttpError(409, 'You already left feedback for this order.');
    throw err;
  }
});

router.get('/all', requireAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const rows = await withOrderDetails(db, db('feedback'));
  res.json(rows.map(([f, items]) => adminFeedback(f, items)));
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const id = feedbackId(req);
  const { isHidden } = updateSchema.parse(req.body);
  const db = req.app.locals.db;
  const updated = await db('feedback').where({ id }).update({ is_hidden: isHidden });
  if (!updated) throw new HttpError(404, 'Feedback not found.');
  const [[row, items]] = await withOrderDetails(db, db('feedback').where('feedback.id', id));
  res.json(adminFeedback(row, items));
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = feedbackId(req);
  const removed = await req.app.locals.db('feedback').where({ id }).del();
  if (!removed) throw new HttpError(404, 'Feedback not found.');
  res.json({ ok: true });
});

module.exports = router;

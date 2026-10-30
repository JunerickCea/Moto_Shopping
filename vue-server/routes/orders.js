const express = require('express');
const { z } = require('zod');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { order: serializeOrder } = require('../lib/serializers');
const { HttpError } = require('../lib/httpError');

const router = express.Router();

const orderSchema = z.object({
  items: z.array(z.object({
    _id: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().min(1).max(1000),
  })).min(1, 'Your order has no items').max(50),
  customerInfo: z.object({
    fullName: z.string().trim().min(1).max(100),
    email: z.string().trim().max(254).pipe(z.email()),
    contactNo: z.string().trim().min(5).max(30),
    address: z.string().trim().max(300).optional().default(''),
    paymentMethod: z.enum(['Cash-on-Delivery', 'Credit Card', 'Debit Card']),
  }),
});

const statusSchema = z.object({ status: z.enum(['Shipped', 'Cancelled']) });

async function withItems(db, orders) {
  if (!orders.length) return [];
  const ids = orders.map((o) => o.id);
  const items = await db('order_items').whereIn('order_id', ids).orderBy('id');
  const reviews = await db('feedback').whereIn('order_id', ids);
  return orders.map((o) => serializeOrder(
    o,
    items.filter((i) => i.order_id === o.id),
    reviews.find((r) => r.order_id === o.id),
  ));
}

router.post('/', requireAuth, async (req, res) => {
  const { items, customerInfo } = orderSchema.parse(req.body);
  const db = req.app.locals.db;

  const quantities = new Map();
  for (const item of items) quantities.set(item._id, (quantities.get(item._id) || 0) + item.quantity);
  const ids = [...quantities.keys()].sort((a, b) => a - b);

  const created = await db.transaction(async (trx) => {
    const bikes = await trx('motorcycles').whereIn('id', ids).orderBy('id').forUpdate();
    if (bikes.length !== ids.length) throw new HttpError(400, 'One of the motorcycles in your order is no longer available.');

    let totalCents = 0;
    for (const bike of bikes) {
      const qty = quantities.get(bike.id);
      if (bike.stock < qty) throw new HttpError(409, `Not enough stock for ${bike.brand} ${bike.name}.`);
      totalCents += Math.round(Number(bike.price) * 100) * qty;
    }

    for (const bike of bikes) {
      await trx('motorcycles').where({ id: bike.id }).update({
        stock: bike.stock - quantities.get(bike.id),
        updated_at: trx.fn.now(),
      });
    }

    const [row] = await trx('orders').insert({
      user_id: req.user.id,
      total: (totalCents / 100).toFixed(2),
      full_name: customerInfo.fullName,
      email: customerInfo.email,
      contact_no: customerInfo.contactNo,
      address: customerInfo.address,
      payment_method: customerInfo.paymentMethod,
    }).returning('*');

    const rows = await trx('order_items').insert(bikes.map((bike) => ({
      order_id: row.id,
      motorcycle_id: bike.id,
      brand: bike.brand,
      name: bike.name,
      image_url: bike.image_url,
      unit_price: bike.price,
      quantity: quantities.get(bike.id),
    }))).returning('*');

    return serializeOrder(row, rows);
  });

  res.status(201).json(created);
});

router.get('/mine', requireAuth, async (req, res) => {
  const db = req.app.locals.db;
  const orders = await db('orders').where({ user_id: req.user.id }).orderBy('created_at', 'desc');
  res.json(await withItems(db, orders));
});

router.get('/', requireAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const orders = await db('orders').orderBy('created_at', 'desc');
  res.json(await withItems(db, orders));
});

router.patch('/:id/status', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid order id.' });
  const { status } = statusSchema.parse(req.body);
  const db = req.app.locals.db;

  const updated = await db.transaction(async (trx) => {
    const current = await trx('orders').where({ id }).forUpdate().first();
    if (!current) throw new HttpError(404, 'Order not found.');
    if (current.status !== 'Pending') throw new HttpError(409, `This order is already ${current.status.toLowerCase()}.`);

    if (status === 'Cancelled') {
      const items = await trx('order_items').where({ order_id: id }).whereNotNull('motorcycle_id');
      for (const item of items) {
        await trx('motorcycles').where({ id: item.motorcycle_id }).increment('stock', item.quantity);
      }
    }
    const [row] = await trx('orders').where({ id }).update({ status, updated_at: trx.fn.now() }).returning('*');
    return row;
  });

  const [result] = await withItems(db, [updated]);
  res.json(result);
});

module.exports = router;

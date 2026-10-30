const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../middleware/auth');
const { shopInfo } = require('../lib/serializers');

const router = express.Router();

const shopSchema = z.object({
  name: z.string().trim().min(1, 'Shop name is required').max(100),
  address: z.string().trim().max(300, 'Address can be at most 300 characters'),
  contactNo: z.string().trim().max(30).optional().default(''),
  openingHours: z.string().trim().max(100).optional().default(''),
});

router.get('/', async (req, res) => {
  const row = await req.app.locals.db('shop_info').where({ id: 1 }).first();
  res.json(shopInfo(row));
});

router.put('/', requireAdmin, async (req, res) => {
  const data = shopSchema.parse(req.body);
  const db = req.app.locals.db;
  const [row] = await db('shop_info').where({ id: 1 }).update({
    name: data.name,
    address: data.address,
    contact_no: data.contactNo,
    opening_hours: data.openingHours,
    updated_at: db.fn.now(),
  }).returning('*');
  res.json(shopInfo(row));
});

module.exports = router;

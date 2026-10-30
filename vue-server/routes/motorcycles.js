const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../middleware/auth');
const { motorcycle } = require('../lib/serializers');

const router = express.Router();

const httpUrl = z.string().trim().max(2000).refine((value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}, 'Image must be an http(s) link');

const motorcycleSchema = z.object({
  Brand: z.string().trim().min(1).max(100),
  MotorcycleName: z.string().trim().min(1).max(150),
  ReleaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Use YYYY-MM-DD').transform((s) => s.slice(0, 10)).nullish(),
  Price: z.coerce.number().min(0).max(9999999999),
  Stock: z.coerce.number().int().min(0).max(1000000),
  Quantity: z.coerce.number().int().min(0).max(1000000),
  Image: httpUrl,
});

const toRow = (d) => ({
  brand: d.Brand,
  name: d.MotorcycleName,
  release_date: d.ReleaseDate || null,
  price: d.Price,
  stock: d.Stock,
  quantity: d.Quantity,
  image_url: d.Image,
});

// Public: guests browse the catalog on the dashboard and log in only to buy.
router.get('/', async (req, res) => {
  const rows = await req.app.locals.db('motorcycles').orderBy('name');
  res.json(rows.map(motorcycle));
});

router.post('/', requireAdmin, async (req, res) => {
  const data = motorcycleSchema.parse(req.body);
  const [row] = await req.app.locals.db('motorcycles').insert(toRow(data)).returning('*');
  res.status(201).json(motorcycle(row));
});

router.put('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid motorcycle id.' });
  const data = motorcycleSchema.parse(req.body);
  const db = req.app.locals.db;
  const [row] = await db('motorcycles').where({ id }).update({ ...toRow(data), updated_at: db.fn.now() }).returning('*');
  if (!row) return res.status(404).json({ error: 'Motorcycle not found.' });
  res.json(motorcycle(row));
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid motorcycle id.' });
  const removed = await req.app.locals.db('motorcycles').where({ id }).del();
  if (!removed) return res.status(404).json({ error: 'Motorcycle not found.' });
  res.json({ ok: true });
});

module.exports = router;

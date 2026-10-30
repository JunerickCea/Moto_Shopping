const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

describe('shop', { skip: !h.enabled && 'set TEST_DATABASE_URL to run' }, () => {
  let handle;
  let app;
  let admin;
  let user;

  before(async () => {
    handle = await h.setup();
    app = h.build(handle);
  });
  after(() => handle.close());
  beforeEach(async () => {
    await h.reset(handle.db);
    admin = await h.loggedIn(app, handle.db, { email: 'admin@example.com', role: 'Admin' });
    user = await h.loggedIn(app, handle.db, { email: 'user@example.com' });
  });

  const addBike = async (overrides) => (await admin.post('/api/motorcycles').send(h.bike(overrides)).expect(201)).body;
  const stockOf = async (id) => (await handle.db('motorcycles').where({ id }).first()).stock;
  const order = (a, items, info = h.customerInfo()) => a.post('/api/orders').send({ items, customerInfo: info });

  describe('motorcycles', () => {
    it('lists publicly with the field names the client uses, but only admins can write', async () => {
      const created = await addBike();
      const list = (await h.request(app).get('/api/motorcycles').expect(200)).body;
      assert.deepEqual(list, [created]);
      await h.request(app).post('/api/motorcycles').send(h.bike()).expect(401);
      await user.post('/api/motorcycles').send(h.bike()).expect(403);
      assert.deepEqual(Object.keys(created).sort(), ['Brand', 'Image', 'MotorcycleName', 'Price', 'Quantity', 'ReleaseDate', 'Stock', '_id']);
      assert.equal(created.ReleaseDate, '2024-03-01');
      assert.equal(created.Price, 7000);
    });

    it('updates and deletes as admin', async () => {
      const { _id } = await addBike();
      const updated = (await admin.put(`/api/motorcycles/${_id}`).send(h.bike({ Price: '7500.50', Stock: '9' })).expect(200)).body;
      assert.equal(updated.Price, 7500.5);
      assert.equal(updated.Stock, 9);
      await admin.delete(`/api/motorcycles/${_id}`).expect(200);
      await admin.delete(`/api/motorcycles/${_id}`).expect(404);
    });

    it('validates input', async () => {
      await admin.post('/api/motorcycles').send(h.bike({ Image: 'javascript:alert(1)' })).expect(400);
      await admin.post('/api/motorcycles').send(h.bike({ Price: -1 })).expect(400);
      await admin.post('/api/motorcycles').send(h.bike({ Stock: 1.5 })).expect(400);
      await admin.post('/api/motorcycles').send(h.bike({ Brand: '' })).expect(400);
    });
  });

  describe('orders', () => {
    it('prices the order from the database, ignoring client-sent prices and totals', async () => {
      const a = await addBike({ Price: 100 });
      const b = await addBike({ MotorcycleName: 'Other', Price: 250.25 });
      const res = await user.post('/api/orders').send({
        items: [{ _id: a._id, quantity: 2, Price: 1 }, { _id: b._id, quantity: 1, Price: 1 }],
        total: 1,
        status: 'Shipped',
        customerInfo: h.customerInfo(),
      }).expect(201);

      assert.equal(res.body.total, 450.25);
      assert.equal(res.body.status, 'Pending');
      assert.equal(res.body.items.length, 2);
      assert.equal(await stockOf(a._id), 3);
      assert.equal(await stockOf(b._id), 4);
    });

    it('links the order to the logged-in user and shows it only in their My Orders', async () => {
      const { _id } = await addBike();
      await order(user, [{ _id, quantity: 1 }]).expect(201);
      const other = await h.loggedIn(app, handle.db, { email: 'other@example.com' });

      const mine = (await user.get('/api/orders/mine').expect(200)).body;
      assert.equal(mine.length, 1);
      assert.equal(mine[0].items[0].MotorcycleName, 'CBR500R');
      assert.deepEqual((await other.get('/api/orders/mine').expect(200)).body, []);
      assert.equal((await admin.get('/api/orders').expect(200)).body.length, 1);
    });

    it('rejects an order larger than stock and leaves stock and orders untouched', async () => {
      const a = await addBike({ Stock: 2 });
      const b = await addBike({ MotorcycleName: 'Other', Stock: 10 });
      const res = await order(user, [{ _id: b._id, quantity: 3 }, { _id: a._id, quantity: 3 }]);
      assert.equal(res.status, 409);
      assert.equal(await stockOf(a._id), 2);
      assert.equal(await stockOf(b._id), 10);
      assert.equal((await handle.db('orders').count({ n: '*' }).first()).n, '0');
    });

    it('cannot oversell the last unit under concurrent orders', async () => {
      const { _id } = await addBike({ Stock: 1 });
      const other = await h.loggedIn(app, handle.db, { email: 'other@example.com' });
      const results = await Promise.all([
        order(user, [{ _id, quantity: 1 }]),
        order(other, [{ _id, quantity: 1 }]),
      ]);
      assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
      assert.equal(await stockOf(_id), 0);
    });

    it('merges duplicate lines and rejects unknown motorcycles and bad input', async () => {
      const { _id } = await addBike({ Stock: 5 });
      const res = await order(user, [{ _id, quantity: 2 }, { _id, quantity: 2 }]).expect(201);
      assert.equal(res.body.items[0].quantity, 4);
      await order(user, [{ _id: '99999', quantity: 1 }]).expect(400);
      await order(user, []).expect(400);
      await order(user, [{ _id, quantity: 0 }]).expect(400);
      await order(user, [{ _id, quantity: 1 }], h.customerInfo({ paymentMethod: 'Bitcoin' })).expect(400);
      await h.request(app).post('/api/orders').send({}).expect(401);
    });

    it('lets an admin ship a pending order, but only once', async () => {
      const { _id } = await addBike();
      const placed = (await order(user, [{ _id, quantity: 1 }]).expect(201)).body;
      await user.patch(`/api/orders/${placed._id}/status`).send({ status: 'Shipped' }).expect(403);
      const shipped = (await admin.patch(`/api/orders/${placed._id}/status`).send({ status: 'Shipped' }).expect(200)).body;
      assert.equal(shipped.status, 'Shipped');
      await admin.patch(`/api/orders/${placed._id}/status`).send({ status: 'Cancelled' }).expect(409);
    });

    it('restocks when an admin cancels an order', async () => {
      const { _id } = await addBike({ Stock: 5 });
      const placed = (await order(user, [{ _id, quantity: 3 }]).expect(201)).body;
      assert.equal(await stockOf(_id), 2);
      await admin.patch(`/api/orders/${placed._id}/status`).send({ status: 'Cancelled' }).expect(200);
      assert.equal(await stockOf(_id), 5);
      await admin.patch(`/api/orders/${placed._id}/status`).send({ status: 'Cancelled' }).expect(409);
      assert.equal(await stockOf(_id), 5);
    });

    it('keeps order history readable after the motorcycle is deleted', async () => {
      const { _id } = await addBike();
      await order(user, [{ _id, quantity: 1 }]).expect(201);
      await admin.delete(`/api/motorcycles/${_id}`).expect(200);
      const mine = (await user.get('/api/orders/mine').expect(200)).body;
      assert.equal(mine[0].items[0].MotorcycleName, 'CBR500R');
      assert.equal(mine[0].items[0].motorcycleId, null);
    });
  });
});

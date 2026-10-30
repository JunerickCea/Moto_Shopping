const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

describe('feedback and shop info', { skip: !h.enabled && 'set TEST_DATABASE_URL to run' }, () => {
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

  const leave = (a, orderId, body = {}) => a.post('/api/feedback').send({ orderId, rating: 5, comment: 'Great bike!', ...body });

  describe('feedback', () => {
    it('is only accepted once, after the order has shipped', async () => {
      const { _id: bikeId } = (await admin.post('/api/motorcycles').send(h.bike()).expect(201)).body;
      const pending = (await user.post('/api/orders').send({ items: [{ _id: bikeId, quantity: 1 }], customerInfo: h.customerInfo() }).expect(201)).body;
      await leave(user, pending._id).expect(409);

      const shipped = await h.shippedOrder(admin, user);
      const created = (await leave(user, shipped._id).expect(201)).body;
      assert.equal(created.rating, 5);
      await leave(user, shipped._id, { rating: 1 }).expect(409);

      const mine = (await user.get('/api/orders/mine').expect(200)).body;
      assert.deepEqual(mine.find((o) => o._id === shipped._id).feedback, { rating: 5, comment: 'Great bike!' });
      assert.equal(mine.find((o) => o._id === pending._id).feedback, null);
    });

    it("rejects someone else's order, bad ratings and anonymous requests", async () => {
      const shipped = await h.shippedOrder(admin, user);
      const other = await h.loggedIn(app, handle.db, { email: 'other@example.com' });
      await leave(other, shipped._id).expect(404);
      await leave(user, shipped._id, { rating: 0 }).expect(400);
      await leave(user, shipped._id, { rating: 6 }).expect(400);
      await leave(user, shipped._id, { rating: 4.5 }).expect(400);
      await leave(user, shipped._id, { comment: 'x'.repeat(1001) }).expect(400);
      await leave(h.request(app), shipped._id).expect(401);
    });

    it('shows a public list with shortened names and no emails', async () => {
      const a = await h.shippedOrder(admin, user, h.customerInfo({ fullName: 'Juan Dela Cruz' }));
      const b = await h.shippedOrder(admin, user, h.customerInfo({ fullName: 'Maria' }));
      await leave(user, a._id, { rating: 5 }).expect(201);
      await leave(user, b._id, { rating: 2, comment: '' }).expect(201);

      const pub = (await h.request(app).get('/api/feedback').expect(200)).body;
      assert.equal(pub.count, 2);
      assert.equal(pub.average, 3.5);
      assert.deepEqual(pub.items.map((i) => i.customer).sort(), ['Juan C.', 'Maria']);
      assert.deepEqual(pub.items[0].motorcycles, ['Honda CBR500R']);
      const text = JSON.stringify(pub);
      assert.ok(!text.includes('@'), 'public feedback must not expose emails');
      assert.ok(!text.includes('userId'));
    });

    it('lets an admin hide, show and delete feedback', async () => {
      const shipped = await h.shippedOrder(admin, user);
      const { _id } = (await leave(user, shipped._id).expect(201)).body;

      await admin.patch(`/api/feedback/${_id}`).send({ isHidden: true }).expect(200);
      assert.equal((await h.request(app).get('/api/feedback').expect(200)).body.count, 0);
      const all = (await admin.get('/api/feedback/all').expect(200)).body;
      assert.equal(all.length, 1);
      assert.equal(all[0].isHidden, true);
      assert.equal(all[0].email, 'juan@example.com');
      assert.equal(all[0].orderId, shipped._id);

      await admin.patch(`/api/feedback/${_id}`).send({ isHidden: false }).expect(200);
      assert.equal((await h.request(app).get('/api/feedback').expect(200)).body.count, 1);

      await admin.delete(`/api/feedback/${_id}`).expect(200);
      await admin.delete(`/api/feedback/${_id}`).expect(404);
      assert.equal((await h.request(app).get('/api/feedback').expect(200)).body.count, 0);
    });

    it('keeps the admin endpoints admin-only', async () => {
      const shipped = await h.shippedOrder(admin, user);
      const { _id } = (await leave(user, shipped._id).expect(201)).body;
      await user.get('/api/feedback/all').expect(403);
      await user.patch(`/api/feedback/${_id}`).send({ isHidden: true }).expect(403);
      await user.delete(`/api/feedback/${_id}`).expect(403);
      await h.request(app).get('/api/feedback/all').expect(401);
    });
  });

  describe('shop info', () => {
    const info = { name: 'Premiumbikes Manila', address: '123 Rizal Ave, Manila', contactNo: '0917 123 4567', openingHours: 'Mon-Sat 9am-6pm' };

    it('is public to read and admin-only to change', async () => {
      const initial = (await h.request(app).get('/api/shop').expect(200)).body;
      assert.deepEqual(initial, { name: 'Premiumbikes', address: '', contactNo: '', openingHours: '' });

      await user.put('/api/shop').send(info).expect(403);
      await h.request(app).put('/api/shop').send(info).expect(401);
      assert.deepEqual((await admin.put('/api/shop').send(info).expect(200)).body, info);
      assert.deepEqual((await h.request(app).get('/api/shop').expect(200)).body, info);
    });

    it('validates input', async () => {
      await admin.put('/api/shop').send({ ...info, address: 'x'.repeat(301) }).expect(400);
      await admin.put('/api/shop').send({ ...info, name: '' }).expect(400);
    });
  });
});

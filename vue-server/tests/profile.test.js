const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

describe('profile', { skip: !h.enabled && 'set TEST_DATABASE_URL to run' }, () => {
  let handle;
  let app;

  before(async () => {
    handle = await h.setup();
  });
  after(() => handle.close());
  beforeEach(async () => {
    await h.reset(handle.db);
    // Fresh app per test so the password-change rate limit starts at zero.
    app = h.build(handle, { limits: { password: 3 } });
  });

  const details = { name: 'Juan Dela Cruz', contactNo: '0917 123 4567', address: '12 Rizal St, Manila', paymentMethod: 'Cash-on-Delivery' };

  describe('details', () => {
    it('starts empty, saves, and is returned by /me', async () => {
      const user = await h.loggedIn(app, handle.db, { email: 'juan@example.com' });
      const before = (await user.get('/api/auth/me').expect(200)).body.user;
      assert.equal(before.contactNo, '');
      assert.equal(before.address, '');
      assert.equal(before.paymentMethod, null);
      assert.equal(before.hasPassword, true);

      const saved = (await user.put('/api/profile').send(details).expect(200)).body.user;
      assert.equal(saved.name, 'Juan Dela Cruz');
      assert.equal(saved.contactNo, '0917 123 4567');
      assert.equal(saved.address, '12 Rizal St, Manila');
      assert.equal(saved.paymentMethod, 'Cash-on-Delivery');
      assert.equal(saved.email, 'juan@example.com');

      assert.deepEqual((await user.get('/api/auth/me').expect(200)).body.user, saved);
    });

    it('allows clearing optional fields but validates input', async () => {
      const user = await h.loggedIn(app, handle.db, { email: 'juan@example.com' });
      await user.put('/api/profile').send(details).expect(200);
      const cleared = (await user.put('/api/profile').send({ name: 'Juan', contactNo: '', address: '', paymentMethod: null }).expect(200)).body.user;
      assert.equal(cleared.contactNo, '');
      assert.equal(cleared.paymentMethod, null);

      await user.put('/api/profile').send({ ...details, name: '  ' }).expect(400);
      await user.put('/api/profile').send({ ...details, address: 'x'.repeat(301) }).expect(400);
      await user.put('/api/profile').send({ ...details, contactNo: 'x'.repeat(31) }).expect(400);
      await user.put('/api/profile').send({ ...details, paymentMethod: 'Bitcoin' }).expect(400);
    });

    it('cannot change email, role or other users', async () => {
      const user = await h.loggedIn(app, handle.db, { email: 'juan@example.com' });
      const other = await h.createUser(handle.db, { email: 'other@example.com', name: 'Other' });
      const saved = (await user.put('/api/profile').send({ ...details, email: 'evil@example.com', role: 'Admin', id: other.id }).expect(200)).body.user;
      assert.equal(saved.email, 'juan@example.com');
      assert.equal(saved.role, 'User');
      assert.equal((await handle.db('users').where({ id: other.id }).first()).name, 'Other');
    });

    it('requires login', async () => {
      await h.request(app).put('/api/profile').send(details).expect(401);
      await h.request(app).put('/api/profile/password').send({ currentPassword: 'x', newPassword: 'y'.repeat(8) }).expect(401);
    });
  });

  describe('password', () => {
    const change = (a, currentPassword, newPassword) => a.put('/api/profile/password').send({ currentPassword, newPassword });

    it('changes the password after checking the current one', async () => {
      const user = await h.loggedIn(app, handle.db, { email: 'juan@example.com' });
      await change(user, 'wrong password!', 'brand new secret').expect(400);
      await change(user, 'correct horse battery', 'short').expect(400);
      await change(user, 'correct horse battery', 'brand new secret').expect(200);

      // The current browser stays logged in; old password no longer works.
      await user.get('/api/auth/me').expect(200);
      await h.request(app).post('/api/auth/login').send({ email: 'juan@example.com', password: 'correct horse battery' }).expect(401);
      await h.request(app).post('/api/auth/login').send({ email: 'juan@example.com', password: 'brand new secret' }).expect(200);
    });

    it('logs out the account everywhere else', async () => {
      const here = await h.loggedIn(app, handle.db, { email: 'juan@example.com' });
      const elsewhere = h.agent(app);
      await elsewhere.post('/api/auth/login').send({ email: 'juan@example.com', password: 'correct horse battery' }).expect(200);

      await change(here, 'correct horse battery', 'brand new secret').expect(200);
      await here.get('/api/auth/me').expect(200);
      await elsewhere.get('/api/auth/me').expect(401);
    });

    it('is refused for Google-only accounts', async () => {
      const [g] = await handle.db('users').insert({ email: 'g@example.com', name: 'G', google_sub: 'sub-1', email_verified: true }).returning('*');
      const a = h.agent(app);
      // Log the Google-only user in by planting a session through a password login on a twin account is not possible,
      // so give it a temporary password, log in, then remove the password.
      await handle.db('users').where({ id: g.id }).update({ password_hash: (await h.createUser(handle.db, { email: 'tmp@example.com' })).password_hash });
      await a.post('/api/auth/login').send({ email: 'g@example.com', password: 'correct horse battery' }).expect(200);
      await handle.db('users').where({ id: g.id }).update({ password_hash: null });

      const me = (await a.get('/api/auth/me').expect(200)).body.user;
      assert.equal(me.hasPassword, false);
      assert.equal(me.hasGoogle, true);
      const res = await change(a, 'anything', 'brand new secret').expect(400);
      assert.match(res.body.error, /Google/);
    });

    it('rate limits wrong current passwords', async () => {
      const user = await h.loggedIn(app, handle.db, { email: 'juan@example.com' });
      for (let i = 0; i < 3; i += 1) await change(user, 'wrong password!', 'brand new secret').expect(400);
      await change(user, 'correct horse battery', 'brand new secret').expect(429);
    });
  });
});

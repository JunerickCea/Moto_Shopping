const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

describe('auth', { skip: !h.enabled && 'set TEST_DATABASE_URL to run' }, () => {
  let handle;
  let app;
  const googleProfiles = new Map();
  const verifyGoogleToken = async (credential) => {
    const profile = googleProfiles.get(credential);
    if (!profile) throw new Error('bad token');
    return profile;
  };

  before(async () => {
    handle = await h.setup();
  });
  after(() => handle.close());
  beforeEach(async () => {
    await h.reset(handle.db);
    // A fresh app per test gives each one empty rate-limit counters.
    app = h.build(handle, { verifyGoogleToken, limits: { login: 3 } });
  });

  const register = (a, body = {}) => a.post('/api/auth/register').send({
    name: 'Ana', email: 'ana@example.com', password: 'a-long-password', ...body,
  });

  it('registers, sets an httpOnly lax cookie, and logs out', async () => {
    const a = h.agent(app);
    const res = await register(a).expect(201);
    assert.equal(res.body.user.email, 'ana@example.com');
    assert.equal(res.body.user.role, 'User');
    assert.equal(JSON.stringify(res.body).includes('password'), false);

    const cookie = res.headers['set-cookie'].find((c) => c.startsWith('sid='));
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);

    await a.get('/api/auth/me').expect(200);
    await a.post('/api/auth/logout').expect(200);
    await a.get('/api/auth/me').expect(401);
  });

  it('stores only a bcrypt hash of the password', async () => {
    await register(h.agent(app)).expect(201);
    const row = await handle.db('users').first();
    assert.match(row.password_hash, /^\$2[aby]\$/);
    assert.notEqual(row.password_hash, 'a-long-password');
  });

  it('rejects duplicate emails (case-insensitive) and weak passwords', async () => {
    await register(h.agent(app)).expect(201);
    await register(h.agent(app), { email: 'ANA@example.com' }).expect(409);
    await register(h.agent(app), { email: 'b@example.com', password: 'short' }).expect(400);
    await register(h.agent(app), { email: 'not-an-email' }).expect(400);
  });

  it('never makes a password registrant an admin, even with an ADMIN_EMAILS address', async () => {
    const res = await register(h.agent(app), { email: 'boss@example.com' }).expect(201);
    assert.equal(res.body.user.role, 'User');
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    await register(h.agent(app)).expect(201);
    const wrong = await h.agent(app).post('/api/auth/login').send({ email: 'ana@example.com', password: 'nope-nope-nope' }).expect(401);
    const unknown = await h.agent(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'nope-nope-nope' }).expect(401);
    assert.deepEqual(wrong.body, unknown.body);
  });

  it('issues a fresh session id on login', async () => {
    await register(h.agent(app)).expect(201);
    const a = h.agent(app);
    const first = await a.get('/api/motorcycles'); // anonymous: 401, no cookie expected
    assert.equal(first.status, 401);
    const login = await a.post('/api/auth/login').send({ email: 'ana@example.com', password: 'a-long-password' }).expect(200);
    const again = await a.post('/api/auth/login').send({ email: 'ana@example.com', password: 'a-long-password' }).expect(200);
    const sid = (r) => r.headers['set-cookie'].find((c) => c.startsWith('sid=')).split(';')[0];
    assert.notEqual(sid(login), sid(again));
  });

  it('rate limits repeated failed logins', async () => {
    await register(h.agent(app)).expect(201);
    const attempt = () => h.agent(app).post('/api/auth/login').send({ email: 'ana@example.com', password: 'wrong-wrong' });
    for (let i = 0; i < 3; i += 1) await attempt().expect(401);
    await attempt().expect(429);
    // even the right password is blocked while the limit is active
    await h.agent(app).post('/api/auth/login').send({ email: 'ana@example.com', password: 'a-long-password' }).expect(429);
  });

  it('blocks cross-site state-changing requests', async () => {
    await h.request(app).post('/api/auth/login').set('Origin', 'https://evil.example')
      .send({ email: 'ana@example.com', password: 'x' }).expect(403);
    await h.request(app).post('/api/auth/login').set('Sec-Fetch-Site', 'cross-site')
      .send({ email: 'ana@example.com', password: 'x' }).expect(403);
  });

  it('rejects oversized request bodies', async () => {
    const res = await h.request(app).post('/api/auth/register').send({ name: 'x'.repeat(200 * 1024) });
    assert.equal(res.status, 413);
  });

  describe('roles', () => {
    it('returns 401 to anonymous visitors and 403 to normal users on admin routes', async () => {
      await h.request(app).get('/api/users').expect(401);
      const user = await h.loggedIn(app, handle.db, { email: 'u@example.com' });
      await user.get('/api/users').expect(403);
      await user.post('/api/motorcycles').send(h.bike()).expect(403);
      await user.get('/api/orders').expect(403);
    });

    it('lets an admin disable a user, which ends that user\'s session', async () => {
      const admin = await h.loggedIn(app, handle.db, { email: 'a@example.com', role: 'Admin' });
      const user = await h.loggedIn(app, handle.db, { email: 'u@example.com' });
      await user.get('/api/auth/me').expect(200);

      const { id } = await handle.db('users').where({ email: 'u@example.com' }).first();
      await admin.patch(`/api/users/${id}`).send({ isActive: false }).expect(200);

      await user.get('/api/auth/me').expect(401);
      const login = await h.agent(app).post('/api/auth/login').send({ email: 'u@example.com', password: 'correct horse battery' });
      assert.equal(login.status, 403);
    });

    it('lets an admin promote a user, who must log in again to get the role', async () => {
      const admin = await h.loggedIn(app, handle.db, { email: 'a@example.com', role: 'Admin' });
      const user = await h.loggedIn(app, handle.db, { email: 'u@example.com' });
      const { id } = await handle.db('users').where({ email: 'u@example.com' }).first();
      const res = await admin.patch(`/api/users/${id}`).send({ role: 'Admin' }).expect(200);
      assert.equal(res.body.role, 'Admin');
      await user.get('/api/auth/me').expect(401);
    });

    it('stops admins changing their own role or status', async () => {
      const admin = await h.loggedIn(app, handle.db, { email: 'a@example.com', role: 'Admin' });
      const { id } = await handle.db('users').where({ email: 'a@example.com' }).first();
      await admin.patch(`/api/users/${id}`).send({ isActive: false }).expect(400);
      await admin.patch(`/api/users/${id}`).send({ role: 'User' }).expect(400);
    });

    it('never exposes password hashes in the users list', async () => {
      const admin = await h.loggedIn(app, handle.db, { email: 'a@example.com', role: 'Admin' });
      const res = await admin.get('/api/users').expect(200);
      assert.equal(JSON.stringify(res.body).includes('$2'), false);
      assert.equal(res.body[0].hasPassword, true);
    });
  });

  describe('google sign-in', () => {
    const profile = (overrides = {}) => ({
      sub: 'g-1', email: 'gina@example.com', emailVerified: true, name: 'Gina', picture: 'https://example.com/g.png', ...overrides,
    });
    const google = (a, credential) => a.post('/api/auth/google').send({ credential });

    it('creates a verified account and logs in', async () => {
      googleProfiles.set('tok', profile());
      const a = h.agent(app);
      const res = await google(a, 'tok').expect(200);
      assert.equal(res.body.user.email, 'gina@example.com');
      assert.equal(res.body.user.role, 'User');
      await a.get('/api/auth/me').expect(200);
      assert.equal((await handle.db('users').first()).email_verified, true);
    });

    it('rejects an invalid token and an unverified Google email', async () => {
      await google(h.agent(app), 'garbage').expect(401);
      googleProfiles.set('unverified', profile({ emailVerified: false }));
      await google(h.agent(app), 'unverified').expect(401);
    });

    it('promotes ADMIN_EMAILS addresses on Google sign-in', async () => {
      googleProfiles.set('boss', profile({ sub: 'g-boss', email: 'Boss@Example.com' }));
      const res = await google(h.agent(app), 'boss').expect(200);
      assert.equal(res.body.user.role, 'Admin');
    });

    it('signs the same Google account into the same user each time', async () => {
      googleProfiles.set('tok', profile());
      await google(h.agent(app), 'tok').expect(200);
      await google(h.agent(app), 'tok').expect(200);
      assert.equal((await handle.db('users').count({ n: '*' }).first()).n, '1');
    });

    it('wipes the password and sessions of an unverified account when the real owner links Google', async () => {
      const attacker = h.agent(app);
      await register(attacker, { email: 'gina@example.com', password: 'attacker-password' }).expect(201);
      await attacker.get('/api/auth/me').expect(200);

      googleProfiles.set('tok', profile());
      await google(h.agent(app), 'tok').expect(200);

      await attacker.get('/api/auth/me').expect(401);
      await h.agent(app).post('/api/auth/login').send({ email: 'gina@example.com', password: 'attacker-password' }).expect(401);
      assert.equal((await handle.db('users').count({ n: '*' }).first()).n, '1');
    });

    it('refuses to sign in a disabled account', async () => {
      googleProfiles.set('tok', profile());
      await google(h.agent(app), 'tok').expect(200);
      await handle.db('users').update({ is_active: false });
      await google(h.agent(app), 'tok').expect(403);
    });

    it('reports when Google sign-in is not configured', async () => {
      const bare = h.build(handle, { verifyGoogleToken: null });
      await google(h.agent(bare), 'tok').expect(503);
    });
  });
});

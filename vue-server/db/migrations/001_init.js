exports.up = async (knex) => {
  await knex.schema.createTable('users', (t) => {
    t.increments('id');
    t.string('email', 254).notNullable().unique();
    t.string('name', 100).notNullable();
    t.string('password_hash'); // null for Google-only accounts
    t.string('google_sub').unique();
    t.boolean('email_verified').notNullable().defaultTo(false);
    t.text('avatar_url');
    t.string('role', 10).notNullable().defaultTo('User');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('last_login_at', { useTz: true });
    t.check('?? in (\'Admin\', \'User\')', ['role']);
  });

  // Schema required by connect-pg-simple
  await knex.schema.createTable('session', (t) => {
    t.string('sid').primary();
    t.json('sess').notNullable();
    t.timestamp('expire', { useTz: false, precision: 6 }).notNullable().index();
  });

  await knex.schema.createTable('motorcycles', (t) => {
    t.increments('id');
    t.string('brand', 100).notNullable();
    t.string('name', 150).notNullable();
    t.date('release_date');
    t.decimal('price', 12, 2).notNullable();
    t.integer('stock').notNullable().defaultTo(0);
    t.integer('quantity').notNullable().defaultTo(0);
    t.text('image_url').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.check('?? >= 0', ['stock']);
    t.check('?? >= 0', ['quantity']);
    t.check('?? >= 0', ['price']);
  });

  await knex.schema.createTable('orders', (t) => {
    t.increments('id');
    t.integer('user_id').notNullable().references('id').inTable('users');
    t.string('status', 20).notNullable().defaultTo('Pending');
    t.decimal('total', 12, 2).notNullable();
    t.string('full_name', 100).notNullable();
    t.string('email', 254).notNullable();
    t.string('contact_no', 30).notNullable();
    t.string('address', 300);
    t.string('payment_method', 30).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('user_id');
    t.check('?? in (\'Pending\', \'Shipped\', \'Cancelled\')', ['status']);
  });

  await knex.schema.createTable('order_items', (t) => {
    t.increments('id');
    t.integer('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    t.integer('motorcycle_id').references('id').inTable('motorcycles').onDelete('SET NULL');
    t.string('brand', 100).notNullable();
    t.string('name', 150).notNullable();
    t.text('image_url');
    t.decimal('unit_price', 12, 2).notNullable();
    t.integer('quantity').notNullable();
    t.index('order_id');
    t.check('?? > 0', ['quantity']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('order_items');
  await knex.schema.dropTableIfExists('orders');
  await knex.schema.dropTableIfExists('motorcycles');
  await knex.schema.dropTableIfExists('session');
  await knex.schema.dropTableIfExists('users');
};

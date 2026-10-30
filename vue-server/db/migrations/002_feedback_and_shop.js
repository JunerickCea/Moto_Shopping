exports.up = async (knex) => {
  // One review per order; orders can only be reviewed once shipped (enforced in routes/feedback.js).
  await knex.schema.createTable('feedback', (t) => {
    t.increments('id');
    t.integer('order_id').notNullable().unique().references('id').inTable('orders').onDelete('CASCADE');
    t.integer('user_id').notNullable().references('id').inTable('users');
    t.integer('rating').notNullable();
    t.text('comment').notNullable().defaultTo('');
    t.boolean('is_hidden').notNullable().defaultTo(false);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.check('?? between 1 and 5', ['rating']);
  });

  // Single row holding the shop details shown on the dashboard map.
  await knex.schema.createTable('shop_info', (t) => {
    t.integer('id').primary();
    t.string('name', 100).notNullable();
    t.string('address', 300).notNullable().defaultTo('');
    t.string('contact_no', 30).notNullable().defaultTo('');
    t.string('opening_hours', 100).notNullable().defaultTo('');
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.check('?? = 1', ['id']);
  });
  await knex('shop_info').insert({ id: 1, name: 'Premiumbikes' });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('shop_info');
  await knex.schema.dropTableIfExists('feedback');
};

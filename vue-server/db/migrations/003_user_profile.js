// Saved delivery details, so checkout can be pre-filled from the customer's profile.
exports.up = async (knex) => {
  await knex.schema.alterTable('users', (t) => {
    t.string('contact_no', 30).notNullable().defaultTo('');
    t.string('address', 300).notNullable().defaultTo('');
    t.string('payment_method', 30);
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('contact_no');
    t.dropColumn('address');
    t.dropColumn('payment_method');
  });
};

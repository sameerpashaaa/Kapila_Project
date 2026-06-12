exports.up = async function(knex) {
  // 1. Add updated_at to departments
  await knex.schema.alterTable("departments", (table) => {
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // 2. Add created_by to business tables
  const tables = ["stock", "indents", "issuances", "production", "leftovers"];
  for (const t of tables) {
    await knex.schema.alterTable(t, (table) => {
      table.integer("created_by").unsigned().references("id").inTable("users").onDelete("SET NULL");
    });
  }

  // 3. Add unit_price to issuance_items
  await knex.schema.alterTable("issuance_items", (table) => {
    table.decimal("unit_price", 10, 2).defaultTo(0.00);
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable("issuance_items", (table) => {
    table.dropColumn("unit_price");
  });

  const tables = ["stock", "indents", "issuances", "production", "leftovers"];
  for (const t of tables) {
    await knex.schema.alterTable(t, (table) => {
      table.dropColumn("created_by");
    });
  }

  await knex.schema.alterTable("departments", (table) => {
    table.dropColumn("updated_at");
  });
};

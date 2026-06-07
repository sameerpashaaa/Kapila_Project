exports.up = async (knex) => {
  // Recipes Table
  await knex.schema.createTable("recipes", (t) => {
    t.increments("id");
    t.string("name", 100).notNullable().unique();
    t.string("category", 50).notNullable(); // TIFFINS, NORTH INDIAN, CHINESE, etc.
    t.string("description", 255);
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // Recipe Items Table (ingredients needed per base number of plates)
  await knex.schema.createTable("recipe_items", (t) => {
    t.increments("id");
    t.integer("recipe_id").references("id").inTable("recipes").onDelete("CASCADE");
    t.string("item_name", 100).notNullable();
    t.float("base_qty").notNullable();
    t.integer("base_plates").notNullable().defaultTo(100);
    t.string("unit", 20).notNullable().defaultTo("kg");
  });

  // Menu Plans Table (schedule of what is being made on which date/dept)
  await knex.schema.createTable("menu_plans", (t) => {
    t.increments("id");
    t.string("dept", 100).notNullable();
    t.date("date").notNullable();
    t.integer("recipe_id").references("id").inTable("recipes").onDelete("CASCADE");
    t.integer("target_plates").notNullable().defaultTo(100);
    t.string("status", 20).notNullable().defaultTo("planned"); // planned, indented, completed
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // Seed default recipes and ingredients matching our stock names
  const [recipe1] = await knex("recipes").insert({
    name: "Classic Basmati Biryani",
    category: "NORTH INDIAN",
    description: "Premium basmati rice biryani cooked with oil, spices and butter."
  }).returning("id");

  await knex("recipe_items").insert([
    { recipe_id: recipe1.id, item_name: "Premium Basmati Rice", base_qty: 10.0, base_plates: 100, unit: "kg" },
    { recipe_id: recipe1.id, item_name: "Refined Sunflower Oil", base_qty: 2.0, base_plates: 100, unit: "L" },
    { recipe_id: recipe1.id, item_name: "Butter (500g)", base_qty: 2.0, base_plates: 100, unit: "pcs" }
  ]);

  const [recipe2] = await knex("recipes").insert({
    name: "Schezwan Fried Rice",
    category: "CHINESE & DOSA",
    description: "Spicy Schezwan style fried rice with basmati rice and oil."
  }).returning("id");

  await knex("recipe_items").insert([
    { recipe_id: recipe2.id, item_name: "Premium Basmati Rice", base_qty: 8.0, base_plates: 100, unit: "kg" },
    { recipe_id: recipe2.id, item_name: "Refined Sunflower Oil", base_qty: 3.5, base_plates: 100, unit: "L" }
  ]);

  const [recipe3] = await knex("recipes").insert({
    name: "Special Tiffin Idly & Dosa",
    category: "TIFFINS",
    description: "Steamed rice idlies and crispy thin dosas."
  }).returning("id");

  await knex("recipe_items").insert([
    { recipe_id: recipe3.id, item_name: "Premium Basmati Rice", base_qty: 6.0, base_plates: 100, unit: "kg" }
  ]);
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("menu_plans");
  await knex.schema.dropTableIfExists("recipe_items");
  await knex.schema.dropTableIfExists("recipes");
};

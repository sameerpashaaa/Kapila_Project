const db = require("../db");
const { applyDepartmentScope, assertDepartmentAccess } = require("../services/permissionService");

function normalizeRecipeItems(items = []) {
  return items
    .map((item) => ({
      item_name: String(item.item_name || item.name || "").trim(),
      base_qty: parseFloat(item.base_qty ?? item.qty ?? 0),
      base_plates: parseInt(item.base_plates || 100),
      unit: String(item.unit || "kg").trim(),
    }))
    .filter((item) => item.item_name && Number.isFinite(item.base_qty) && item.base_qty > 0);
}

async function getRecipeWithItems(id) {
  const recipe = await db("recipes").where("id", id).first();
  if (!recipe) return null;
  const items = await db("recipe_items").where("recipe_id", recipe.id).orderBy("id", "asc").select("*");
  return { ...recipe, items };
}

// GET /api/recipes
async function listRecipes(req, res, next) {
  try {
    const recipes = await db("recipes").select("*").orderBy("name", "asc");
    const withItems = await Promise.all(recipes.map(async (r) => {
      const items = await db("recipe_items").where("recipe_id", r.id).select("*");
      return { ...r, items };
    }));
    res.json({ success: true, data: withItems });
  } catch (err) {
    next(err);
  }
}

async function createRecipe(req, res, next) {
  try {
    const { name, category, description } = req.body;
    const items = normalizeRecipeItems(req.body.items);

    if (!String(name || "").trim()) {
      return res.status(400).json({ success: false, error: "Recipe name is required." });
    }
    if (!items.length) {
      return res.status(400).json({ success: false, error: "At least one ingredient is required." });
    }

    const recipe = await db.transaction(async (trx) => {
      const [row] = await trx("recipes")
        .insert({
          name: String(name).trim(),
          category: String(category || "GENERAL").trim(),
          description: String(description || "").trim() || null,
        })
        .returning("*");

      await trx("recipe_items").insert(items.map((item) => ({ ...item, recipe_id: row.id })));
      const savedItems = await trx("recipe_items").where("recipe_id", row.id).orderBy("id", "asc").select("*");
      return { ...row, items: savedItems };
    });

    res.status(201).json({ success: true, data: recipe });
  } catch (err) {
    next(err);
  }
}

async function updateRecipe(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await db("recipes").where("id", id).first();
    if (!existing) return res.status(404).json({ success: false, error: "Recipe not found." });

    const items = normalizeRecipeItems(req.body.items);
    if (!String(req.body.name || "").trim()) {
      return res.status(400).json({ success: false, error: "Recipe name is required." });
    }
    if (!items.length) {
      return res.status(400).json({ success: false, error: "At least one ingredient is required." });
    }

    await db.transaction(async (trx) => {
      await trx("recipes")
        .where("id", id)
        .update({
          name: String(req.body.name).trim(),
          category: String(req.body.category || "GENERAL").trim(),
          description: String(req.body.description || "").trim() || null,
        });

      await trx("recipe_items").where("recipe_id", id).del();
      await trx("recipe_items").insert(items.map((item) => ({ ...item, recipe_id: id })));
    });

    const recipe = await getRecipeWithItems(id);
    res.json({ success: true, data: recipe });
  } catch (err) {
    next(err);
  }
}

async function removeRecipe(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await db("recipes").where("id", id).first();
    if (!existing) return res.status(404).json({ success: false, error: "Recipe not found." });

    await db("recipes").where("id", id).del();
    res.json({ success: true, message: "Recipe deleted successfully." });
  } catch (err) {
    next(err);
  }
}

// GET /api/menu
async function listMenu(req, res, next) {
  try {
    const { dept, date } = req.query;
    if (dept) {
      await assertDepartmentAccess(req.user, dept);
    }

    const qb = db("menu_plans as m")
      .join("recipes as r", "m.recipe_id", "r.id")
      .select("m.*", "r.name as recipe_name", "r.category as recipe_category")
      .orderBy("m.date", "desc");

    if (dept) qb.where("m.dept", dept);
    if (date) qb.where("m.date", date);

    await applyDepartmentScope(qb, req.user, "m.dept");

    const rows = await qb;
    // Attach scaled items for each menu plan
    const withItems = await Promise.all(rows.map(async (row) => {
      const ingredients = await db("recipe_items").where("recipe_id", row.recipe_id).select("*");
      const scaled = ingredients.map(ing => {
        const scaledQty = (ing.base_qty / ing.base_plates) * row.target_plates;
        return {
          name: ing.item_name,
          qty: Math.round(scaledQty * 100) / 100,
          unit: ing.unit
        };
      });
      return { ...row, items: scaled };
    }));

    res.json({ success: true, data: withItems });
  } catch (err) {
    next(err);
  }
}

// POST /api/menu
async function createMenu(req, res, next) {
  try {
    const { dept, date, recipe_id, target_plates } = req.body;
    await assertDepartmentAccess(req.user, dept);

    const [row] = await db("menu_plans")
      .insert({
        dept,
        date,
        recipe_id,
        target_plates: parseInt(target_plates || 100),
        status: "planned"
      })
      .returning("*");

    // Retrieve details to return with recipe name
    const recipe = await db("recipes").where("id", recipe_id).first();
    res.status(201).json({ success: true, data: { ...row, recipe_name: recipe.name } });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/menu/:id
async function updateMenu(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await db("menu_plans").where("id", id).first();
    if (!existing) return res.status(404).json({ success: false, error: "Menu plan not found." });

    await assertDepartmentAccess(req.user, existing.dept);

    const { status, target_plates } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (target_plates !== undefined) updateData.target_plates = parseInt(target_plates);

    const [row] = await db("menu_plans")
      .where("id", id)
      .update(updateData)
      .returning("*");

    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/menu/:id
async function removeMenu(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await db("menu_plans").where("id", id).first();
    if (!existing) return res.status(404).json({ success: false, error: "Menu plan not found." });

    await assertDepartmentAccess(req.user, existing.dept);

    await db("menu_plans").where("id", id).del();
    res.json({ success: true, message: "Menu plan deleted successfully." });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRecipes,
  createRecipe,
  updateRecipe,
  removeRecipe,
  listMenu,
  createMenu,
  updateMenu,
  removeMenu
};

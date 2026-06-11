const router = require("express").Router();
const ctrl = require("../controllers/recipeController");
const { requirePermission } = require("../middleware/authorize");

// Recipe routes
router.get("/recipes", requirePermission("recipes.view"), ctrl.listRecipes);

// Menu plan routes
router.get("/menu", requirePermission("menu.view"), ctrl.listMenu);
router.post("/menu", requirePermission("menu.create"), ctrl.createMenu);
router.patch("/menu/:id", requirePermission("menu.edit"), ctrl.updateMenu);
router.delete("/menu/:id", requirePermission("menu.delete"), ctrl.removeMenu);

module.exports = router;

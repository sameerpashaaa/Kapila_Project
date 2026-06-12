const router = require("express").Router();
const ctrl = require("../controllers/recipeController");
const { requirePermission } = require("../middleware/authorize");

// Recipe routes
router.get("/recipes", requirePermission("recipes.view"), ctrl.listRecipes);
router.post("/recipes", requirePermission("recipes.create"), ctrl.createRecipe);
router.patch("/recipes/:id", requirePermission("recipes.edit"), ctrl.updateRecipe);
router.delete("/recipes/:id", requirePermission("recipes.delete"), ctrl.removeRecipe);

// Menu plan routes
router.get("/menu", requirePermission("menu.view"), ctrl.listMenu);
router.post("/menu", requirePermission("menu.create"), ctrl.createMenu);
router.patch("/menu/:id", requirePermission("menu.edit"), ctrl.updateMenu);
router.delete("/menu/:id", requirePermission("menu.delete"), ctrl.removeMenu);

module.exports = router;

const router = require("express").Router();
const ctrl = require("../controllers/recipeController");

// Recipe routes
router.get("/recipes", ctrl.listRecipes);

// Menu plan routes
router.get("/menu", ctrl.listMenu);
router.post("/menu", ctrl.createMenu);
router.patch("/menu/:id", ctrl.updateMenu);
router.delete("/menu/:id", ctrl.removeMenu);

module.exports = router;

const router = require("express").Router();
const ctrl   = require("../controllers/stockController");
const { validate } = require("../middleware/validate");
const paginate = require("../middleware/paginate");
const { requirePermission, requireAnyPermission } = require("../middleware/authorize");

const sorts = ["name", "date", "remaining", "qty", "created_at"];

router.get("/ledger", requirePermission("stock.view"), paginate(["date", "created_at"]), ctrl.getLedger);
router.get("/insights", requirePermission("stock.view"), ctrl.getInsights);
router.get("/available", requireAnyPermission(["stock.view", "indents.create", "issuances.create"]), ctrl.getAvailableStock);
router.get("/",      requireAnyPermission(["stock.view", "recipes.view", "indents.view", "production.view"]), paginate(sorts), ctrl.list);
router.post("/",     requirePermission("stock.create"), validate("stock"), ctrl.create);
router.post("/reconcile", requirePermission("stock.reconcile"), ctrl.reconcile);
router.patch("/:id", requirePermission("stock.edit"), ctrl.update);
router.delete("/:id", requirePermission("stock.delete"), ctrl.remove);

module.exports = router;

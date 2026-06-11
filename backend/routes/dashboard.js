const router = require("express").Router();
const ctrl   = require("../controllers/dashboardController");
const { requirePermission } = require("../middleware/authorize");

router.get("/",          requirePermission("dashboard.view"), ctrl.summary);
router.get("/analytics", requirePermission("dashboard.view"), ctrl.analytics);
router.get("/procurement", requirePermission("purchase_orders.view"), ctrl.procurement);

module.exports = router;

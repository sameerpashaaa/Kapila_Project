const router = require("express").Router();
const ctrl   = require("../controllers/dashboardController");

router.get("/",          ctrl.summary);
router.get("/analytics", ctrl.analytics);
router.get("/procurement", ctrl.procurement);

module.exports = router;

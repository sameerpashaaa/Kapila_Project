const router = require("express").Router();
const ctrl   = require("../controllers/scanController");

router.post("/indent", ctrl.scanIndent);
router.post("/purchase", ctrl.scanPurchase);
router.post("/text", ctrl.scanText);

module.exports = router;

const router = require("express").Router();
const ctrl   = require("../controllers/stockController");
const { validate } = require("../middleware/validate");
const paginate = require("../middleware/paginate");

const sorts = ["name", "date", "remaining", "qty", "created_at"];

router.get("/ledger", ctrl.getLedger);
router.get("/insights", ctrl.getInsights);
router.get("/available", ctrl.getAvailableStock);
router.get("/",      paginate(sorts), ctrl.list);
router.post("/",     validate("stock"), ctrl.create);
router.post("/reconcile", ctrl.reconcile);
router.patch("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;

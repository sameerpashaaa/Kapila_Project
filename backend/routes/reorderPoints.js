const router = require("express").Router();
const ctrl   = require("../controllers/reorderController");
const paginate = require("../middleware/paginate");

const sorts = ["name", "item_code", "min_qty", "created_at"];

router.get("/alerts", ctrl.alerts);
router.get("/",       paginate(sorts), ctrl.list);
router.post("/",      ctrl.create);
router.patch("/:id",  ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;

const router = require("express").Router();
const ctrl = require("../controllers/supplierController");
const { validate } = require("../middleware/validate");
const paginate = require("../middleware/paginate");

const sorts = ["name", "contact_name", "created_at"];

router.get("/", paginate(sorts), ctrl.list);
router.get("/:id/performance", ctrl.getPerformance);
router.post("/", validate("supplier"), ctrl.create);
router.patch("/:id", validate("supplier"), ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;

const router = require("express").Router();
const ctrl = require("../controllers/purchaseOrderController");
const { validate } = require("../middleware/validate");
const paginate = require("../middleware/paginate");

const sorts = ["po_number", "date", "status", "total_amount", "created_at"];

router.get("/", paginate(sorts), ctrl.list);
router.get("/:id", ctrl.getOne);
router.post("/", validate("purchase_order"), ctrl.create);
router.post("/auto-draft", ctrl.createAutoDraft);
router.patch("/:id", validate("purchase_order"), ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;

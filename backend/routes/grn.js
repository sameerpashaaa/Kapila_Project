const router = require("express").Router();
const ctrl = require("../controllers/grnController");
const { validate } = require("../middleware/validate");
const paginate = require("../middleware/paginate");

const sorts = ["grn_number", "date", "total_amount", "created_at"];

router.get("/", paginate(sorts), ctrl.list);
router.get("/:id", ctrl.getOne);
router.post("/", validate("grn"), ctrl.create);
router.delete("/:id", ctrl.remove);

module.exports = router;

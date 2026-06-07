const router = require("express").Router();
const ctrl   = require("../controllers/transferController");
const paginate = require("../middleware/paginate");

const sorts = ["date", "status", "transfer_number", "created_at"];

router.get("/",             paginate(sorts), ctrl.list);
router.get("/:id",          ctrl.getOne);
router.post("/",            ctrl.create);
router.patch("/:id/accept", ctrl.accept);
router.patch("/:id/reject", ctrl.reject);
router.delete("/:id",       ctrl.remove);

module.exports = router;

const router = require("express").Router();
const ctrl   = require("../controllers/issuanceController");
const { validate } = require("../middleware/validate");
const paginate = require("../middleware/paginate");
const { requirePermission } = require("../middleware/authorize");

router.get("/",  requirePermission("issuances.view"), paginate(["date", "created_at", "dept"]), ctrl.list);
router.post("/", requirePermission("issuances.create"), validate("issuance"), ctrl.create);
router.delete("/:id", requirePermission("issuances.delete"), ctrl.remove);

module.exports = router;

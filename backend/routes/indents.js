const router = require("express").Router();
const ctrl   = require("../controllers/indentController");
const { validate } = require("../middleware/validate");
const paginate = require("../middleware/paginate");
const { requirePermission, requireAnyPermission } = require("../middleware/authorize");

router.get("/",      requirePermission("indents.view"), paginate(["date", "created_at", "dept", "status"]), ctrl.list);
router.post("/",     requirePermission("indents.create"), validate("indent"), ctrl.create);
router.patch("/:id", requirePermission("indents.approve"), ctrl.updateStatus);
router.patch("/:id/items", requirePermission("indents.edit"), ctrl.updateItems);
router.delete("/:id", requirePermission("indents.delete"), ctrl.remove);

module.exports = router;

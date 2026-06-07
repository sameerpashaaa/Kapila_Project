const router = require("express").Router();
const ctrl = require("../controllers/departmentController");
const { validate } = require("../middleware/validate");

router.get("/", ctrl.list);
router.get("/items", ctrl.getDepartmentItems);
router.post("/", validate("department"), ctrl.create);
router.patch("/:id", validate("department"), ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;

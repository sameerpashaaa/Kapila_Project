const router = require("express").Router();
const ctrl   = require("../controllers/indentController");
const { validate } = require("../middleware/validate");
const paginate = require("../middleware/paginate");

router.get("/",      paginate(["date", "created_at", "dept", "status"]), ctrl.list);
router.post("/",     validate("indent"), ctrl.create);
router.patch("/:id", ctrl.updateStatus);

module.exports = router;

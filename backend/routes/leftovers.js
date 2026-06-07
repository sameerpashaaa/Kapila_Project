const router = require("express").Router();
const ctrl   = require("../controllers/leftoverController");
const { validate } = require("../middleware/validate");
const paginate = require("../middleware/paginate");

router.get("/",  paginate(["date", "created_at", "dept", "qty"]), ctrl.list);
router.post("/", validate("leftover"), ctrl.create);

module.exports = router;

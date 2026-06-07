const router = require("express").Router();
const ctrl   = require("../controllers/productionController");
const { validate } = require("../middleware/validate");
const paginate = require("../middleware/paginate");

router.get("/",  paginate(["date", "created_at", "dept", "plates"]), ctrl.list);
router.post("/", validate("production"), ctrl.create);

module.exports = router;

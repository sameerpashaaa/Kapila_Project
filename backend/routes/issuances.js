const router = require("express").Router();
const ctrl   = require("../controllers/issuanceController");
const { validate } = require("../middleware/validate");
const paginate = require("../middleware/paginate");

router.get("/",  paginate(["date", "created_at", "dept"]), ctrl.list);
router.post("/", validate("issuance"), ctrl.create);

module.exports = router;

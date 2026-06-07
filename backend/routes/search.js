const router = require("express").Router();
const ctrl   = require("../controllers/searchController");

router.get("/", ctrl.globalSearch);

module.exports = router;

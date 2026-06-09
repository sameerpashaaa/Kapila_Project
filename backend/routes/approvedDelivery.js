const express = require("express");
const router  = express.Router();
const { upload, scan, commit } = require("../controllers/approvedDeliveryController");

// POST /api/approved-delivery/scan
// multipart/form-data: { file, supplier_id }
router.post("/scan", upload.single("file"), scan);

// POST /api/approved-delivery/commit
// application/json: { supplier_id, date, invoice_no, received_by, remarks, items }
router.post("/commit", commit);

module.exports = router;

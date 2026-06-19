const { z } = require("zod");

const UNITS = ["kg", "g", "L", "ml", "pcs", "dozen", "box", "plates", "portions"];

const STATUSES = ["pending", "issued", "cancelled"];

const schemas = {
  stock: z.object({
    name: z.string().min(1).max(100),
    qty: z.number().positive(),
    unit: z.enum(UNITS),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    price: z.number().positive().optional().nullable(),
    supplier: z.string().max(100).optional().nullable(),
    expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    min_alert_qty: z.number().positive().optional().nullable(),
    item_code: z.string().min(1).max(20).optional().nullable(),
  }),
  indent: z.object({
    dept: z.string().min(1).max(100),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    indent_type: z.enum(["routine", "adhoc"]).optional().default("routine"),
    items: z.array(z.object({ name: z.string().min(1), qty: z.number().positive(), unit: z.enum(UNITS), item_code: z.string().min(1).max(20) })).min(1),
  }),
  issuance: z.object({
    indent_id: z.number().int().nullable().optional(),
    dept: z.string().min(1).max(100),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    scanned: z.boolean().optional(),
    items: z.array(z.object({
      name: z.string().min(1),
      qty: z.number().positive(),
      issued: z.number().positive(),
      unit: z.enum(UNITS),
      item_code: z.string().min(1).max(20),
      unit_price: z.number().nonnegative().optional().nullable(),
    })).min(1),
  }),
  production: z.object({
    dept: z.string().min(1).max(100),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    plates: z.number().int().positive(),
    notes: z.string().max(500).optional(),
  }),
  leftover: z.object({
    dept: z.string().min(1).max(100),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    item: z.string().min(1).max(100),
    qty: z.number().positive(),
    unit: z.enum(UNITS),
  }),
  supplier: z.object({
    name: z.string().min(1).max(100),
    contact_name: z.string().max(100).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email().or(z.string().length(0)).optional().nullable(),
    gstin: z.string().max(20).optional().nullable(),
    address: z.string().optional().nullable(),
  }),
  department: z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(1).max(20),
    chef_name: z.string().max(100).optional().nullable(),
  }),
  purchase_order: z.object({
    supplier_id: z.number().int().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(["Draft", "Sent", "Received", "Cancelled"]).optional(),
    notes: z.string().optional().nullable(),
    items: z.array(z.object({
      item_code: z.string().min(1).max(20),
      name: z.string().min(1).max(100),
      qty: z.number().positive(),
      unit: z.enum(UNITS),
      unit_price: z.number().nonnegative(),
    })).min(1),
  }),
  grn: z.object({
    po_id: z.number().int().positive().optional().nullable(),
    supplier_id: z.number().int().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    invoice_no: z.string().max(50).optional().nullable(),
    received_by: z.string().max(100).optional().nullable(),
    remarks: z.string().optional().nullable(),
    items: z.array(z.object({
      item_code: z.string().min(1).max(20),
      name: z.string().min(1).max(100),
      qty_ordered: z.number().optional().nullable(),
      qty_received: z.number().nonnegative(),
      qty_accepted: z.number().nonnegative(),
      qty_rejected: z.number().nonnegative(),
      unit: z.enum(UNITS),
      unit_price: z.number().nonnegative(),
      landed_cost: z.number().nonnegative(),
      batch_no: z.string().max(50).optional().nullable(),
      expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    })).min(1),
  }),
  audit: z.object({
    reference: z.string().min(1).max(100),
    auditor_name: z.string().min(1).max(100),
    department_id: z.number().int().nullable().optional(),
    notes: z.string().max(1000).optional().nullable(),
  }),
  auditItemUpdate: z.object({
    physical_qty: z.number().nonnegative(),
  }),
  auditFinalise: z.object({
    items: z.array(z.object({
      audit_item_id: z.number().int().positive(),
      discrepancy_reason: z.string().max(500).optional().nullable(),
      action: z.enum(["adjust_db", "recount", "investigate"]).nullable().optional(),
    })).min(1),
  }),
};

const validate = (schemaName) => (req, res, next) => {
  try {
    req.body = schemas[schemaName].parse(req.body);
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { validate, UNITS };

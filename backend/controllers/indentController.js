const db = require("../db");
const { applyDepartmentScope, assertDepartmentAccess } = require("../services/permissionService");

// GET /api/indents
// Query params: dept, status, date_from, date_to, q (search items), page, limit, sort, order
async function list(req, res, next) {
  try {
    const { dept, status, date_from, date_to, q } = req.query;
    const { offset, limit, sort, order } = req.pagination;

    let baseQuery = db("indents").modify((qb) => {
      if (dept)      qb.where("dept", dept);
      if (status)    qb.where("status", status);
      if (date_from) qb.where("date", ">=", date_from);
      if (date_to)   qb.where("date", "<=", date_to);
      if (q) {
        qb.whereIn("id", db("indent_items")
          .select("indent_id")
          .whereRaw("search_vec @@ plainto_tsquery('english', ?)", [q]));
      }
    });
    await applyDepartmentScope(baseQuery, req.user, "dept");

    const [{ count }] = await baseQuery.clone().count("indents.id as count");
    const indents = await baseQuery.clone()
      .select("indents.*")
      .orderBy(`indents.${sort}`, order)
      .offset(offset).limit(limit);

    const ids = indents.map((i) => i.id);
    const items = ids.length ? await db("indent_items").whereIn("indent_id", ids) : [];

    const data = indents.map((ind) => ({
      ...ind,
      items: items.filter((it) => it.indent_id === ind.id),
    }));

    res.json({ success: true, data, total: parseInt(count), page: req.pagination.page, limit });
  } catch (err) { next(err); }
}

// POST /api/indents
async function create(req, res, next) {
  try {
    const { dept, date, items } = req.body;
    
    const deptExists = await db("departments").whereRaw("LOWER(name) = LOWER(?)", [dept.trim()]).first();
    if (!deptExists) {
      return res.status(400).json({ success: false, error: `Department '${dept}' does not exist.` });
    }
    await assertDepartmentAccess(req.user, deptExists.name);

    const [indent] = await db("indents").insert({ dept: deptExists.name, date, status: "pending" }).returning("*");
    const rows = items.map((it) => ({ indent_id: indent.id, name: it.name, qty: it.qty, unit: it.unit, item_code: it.item_code }));
    const savedItems = await db("indent_items").insert(rows).returning("*");
    res.status(201).json({ success: true, data: { ...indent, items: savedItems } });
  } catch (err) { next(err); }
}

// PATCH /api/indents/:id  — update status
async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const existing = await db("indents").where("id", req.params.id).first();
    if (!existing) return res.status(404).json({ success: false, error: "Not found" });
    await assertDepartmentAccess(req.user, existing.dept);
    
    // Status transition validation
    const validTransitions = {
      pending: ["issued", "cancelled"],
      issued: ["pending"], // e.g. via delete issuance
      cancelled: ["pending"]
    };
    if (existing.status !== status && !validTransitions[existing.status]?.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status transition from ${existing.status} to ${status}` });
    }

    const [row] = await db("indents").where("id", req.params.id).update({ status }).returning("*");
    if (!row) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
}

// DELETE /api/indents/:id
async function remove(req, res, next) {
  try {
    const existing = await db("indents").where("id", req.params.id).first();
    if (!existing) return res.status(404).json({ success: false, error: "Not found" });
    await assertDepartmentAccess(req.user, existing.dept);
    
    if (existing.status !== "pending") {
      return res.status(400).json({ success: false, error: "Only pending indents can be deleted" });
    }

    await db.transaction(async (trx) => {
      await trx("indent_items").where("indent_id", existing.id).delete();
      await trx("indents").where("id", existing.id).delete();
    });

    res.json({ success: true, message: "Indent deleted successfully" });
  } catch (err) { next(err); }
}

// PATCH /api/indents/:id/items
async function updateItems(req, res, next) {
  try {
    const { items } = req.body;
    const existing = await db("indents").where("id", req.params.id).first();
    if (!existing) return res.status(404).json({ success: false, error: "Not found" });
    await assertDepartmentAccess(req.user, existing.dept);

    if (existing.status !== "pending") {
      return res.status(400).json({ success: false, error: "Cannot edit items of a non-pending indent" });
    }

    const updatedItems = await db.transaction(async (trx) => {
      await trx("indent_items").where("indent_id", existing.id).delete();
      const rows = items.map((it) => ({ indent_id: existing.id, name: it.name, qty: it.qty, unit: it.unit, item_code: it.item_code }));
      return await trx("indent_items").insert(rows).returning("*");
    });

    res.json({ success: true, data: { ...existing, items: updatedItems } });
  } catch (err) { next(err); }
}

module.exports = { list, create, updateStatus, remove, updateItems };

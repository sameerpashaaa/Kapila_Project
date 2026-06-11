const db = require("../db");
const { applyDepartmentScope, assertDepartmentAccess } = require("../services/permissionService");

// GET /api/issuances
// Query params: dept, date_from, date_to, scanned, q, page, limit, sort, order
async function list(req, res, next) {
  try {
    const { dept, date_from, date_to, scanned, q } = req.query;
    const { offset, limit, sort, order } = req.pagination;

    const filter = (qb) => {
      if (dept)      qb.where("issuances.dept", dept);
      if (date_from) qb.where("issuances.date", ">=", date_from);
      if (date_to)   qb.where("issuances.date", "<=", date_to);
      if (scanned !== undefined) qb.where("issuances.scanned", scanned === "true");
      if (q) {
        qb.whereIn("issuances.id", db("issuance_items")
          .select("issuance_id")
          .whereRaw("search_vec @@ plainto_tsquery('english', ?)", [q]));
      }
    };

    const countQuery = db("issuances").modify(filter);
    await applyDepartmentScope(countQuery, req.user, "issuances.dept");
    const [{ count }] = await countQuery.count("issuances.id as count");
    const listQuery = db("issuances").modify(filter);
    await applyDepartmentScope(listQuery, req.user, "issuances.dept");
    const issuances = await listQuery
      .select("issuances.*")
      .orderBy(`issuances.${sort}`, order)
      .offset(offset).limit(limit);

    const ids = issuances.map((i) => i.id);
    const items = ids.length ? await db("issuance_items").whereIn("issuance_id", ids) : [];

    const data = issuances.map((iss) => ({
      ...iss,
      items: items.filter((it) => it.issuance_id === iss.id),
    }));

    res.json({ success: true, data, total: parseInt(count), page: req.pagination.page, limit });
  } catch (err) { next(err); }
}

// POST /api/issuances  — atomic: create issuance + deduct stock + mark indent issued
async function create(req, res, next) {
  try {
    const { indent_id, dept, date, scanned = false, items } = req.body;

    const deptExists = await db("departments").whereRaw("LOWER(name) = LOWER(?)", [dept.trim()]).first();
    if (!deptExists) {
      return res.status(400).json({ success: false, error: `Department '${dept}' does not exist.` });
    }
    await assertDepartmentAccess(req.user, deptExists.name);

    const issuance = await db.transaction(async (trx) => {
      const [iss] = await trx("issuances")
        .insert({ indent_id: indent_id || null, dept: deptExists.name, date, scanned })
        .returning("*");

      const issItems = items.map((it) => ({
        issuance_id: iss.id,
        name: it.name,
        qty: it.qty,
        issued: it.issued,
        unit: it.unit,
        item_code: it.item_code,
      }));
      const savedItems = await trx("issuance_items").insert(issItems).returning("*");

      // Deduct stock using FIFO logic
      for (const it of items) {
        let toDeduct = parseFloat(it.issued);
        if (toDeduct <= 0) continue;

        // Fetch all active stock batches for this item, sorted by date asc (oldest first), then id asc
        const batches = await trx("stock")
          .whereRaw("LOWER(name) = LOWER(?)", [it.name])
          .andWhere("remaining", ">", 0)
          .orderBy("date", "asc")
          .orderBy("id", "asc");

        const totalAvailable = batches.reduce((sum, b) => sum + parseFloat(b.remaining), 0);
        if (totalAvailable < toDeduct) {
          throw new Error(`Insufficient stock for '${it.name}'. Requested: ${toDeduct} ${it.unit}, Available: ${totalAvailable} ${it.unit}`);
        }

        for (const batch of batches) {
          if (toDeduct <= 0) break;
          const rem = parseFloat(batch.remaining);
          if (rem >= toDeduct) {
            // Deplete this batch and finish
            await trx("stock")
              .where("id", batch.id)
              .update({ remaining: rem - toDeduct });
            toDeduct = 0;
          } else {
            // Fully consume this batch and continue
            await trx("stock")
              .where("id", batch.id)
              .update({ remaining: 0 });
            toDeduct -= rem;
          }
        }
      }

      // Mark linked indent as issued
      if (indent_id) {
        await trx("indents").where("id", indent_id).update({ status: "issued" });
      }

      return { ...iss, items: savedItems };
    });

    res.status(201).json({ success: true, data: issuance });
  } catch (err) { next(err); }
}

module.exports = { list, create };

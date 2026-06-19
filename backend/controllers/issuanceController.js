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
      .select("issuances.*", db.raw("COALESCE(indents.indent_type, 'routine') as indent_type"))
      .leftJoin("indents", "issuances.indent_id", "indents.id")
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
        unit_price: parseFloat(it.unit_price) || 0.00,
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

      // Update linked indent logic for partial issuances
      if (indent_id) {
        for (const it of items) {
          const issuedQty = parseFloat(it.issued);
          if (issuedQty > 0) {
            const indentItem = await trx("indent_items")
              .where({ indent_id, name: it.name })
              .first();
            if (indentItem) {
              const remainingQty = parseFloat(indentItem.qty) - issuedQty;
              if (remainingQty <= 0) {
                await trx("indent_items").where("id", indentItem.id).delete();
              } else {
                await trx("indent_items").where("id", indentItem.id).update({ qty: remainingQty });
              }
            }
          }
        }

        const remainingItems = await trx("indent_items").where("indent_id", indent_id);
        if (remainingItems.length === 0) {
          await trx("indents").where("id", indent_id).update({ status: "issued" });
        }
      }

      return { ...iss, items: savedItems };
    });

    res.status(201).json({ success: true, data: issuance });
  } catch (err) { next(err); }
}

// DELETE /api/issuances/:id
async function remove(req, res, next) {
  try {
    const iss = await db("issuances").where("id", req.params.id).first();
    if (!iss) return res.status(404).json({ success: false, error: "Not found" });

    await assertDepartmentAccess(req.user, iss.dept);

    await db.transaction(async (trx) => {
      const items = await trx("issuance_items").where("issuance_id", iss.id);

      // Revert stock
      for (const it of items) {
        let toRevert = parseFloat(it.issued);
        if (toRevert <= 0) continue;

        // Try to find the newest batch for this item to add back the stock
        const lastBatch = await trx("stock")
          .whereRaw("LOWER(name) = LOWER(?)", [it.name])
          .orderBy("date", "desc")
          .orderBy("id", "desc")
          .first();

        if (lastBatch) {
          await trx("stock")
            .where("id", lastBatch.id)
            .update({ remaining: parseFloat(lastBatch.remaining) + toRevert });
        } else {
          // If no batch exists, we should recreate one, but ideally they exist.
          // Let's create a generic batch
          const todayStr = new Date().toISOString().slice(0, 10);
          await trx("stock").insert({
            name: it.name,
            qty: toRevert,
            remaining: toRevert,
            unit: it.unit,
            date: todayStr,
            item_code: it.item_code || "KPL-NEW",
          });
        }
      }

      // Revert indent if linked
      if (iss.indent_id) {
        await trx("indents").where("id", iss.indent_id).update({ status: "pending" });

        for (const it of items) {
          const toRevert = parseFloat(it.issued);
          if (toRevert <= 0) continue;

          const existingIndentItem = await trx("indent_items")
            .where({ indent_id: iss.indent_id, name: it.name })
            .first();

          if (existingIndentItem) {
            await trx("indent_items")
              .where("id", existingIndentItem.id)
              .update({ qty: parseFloat(existingIndentItem.qty) + toRevert });
          } else {
            await trx("indent_items").insert({
              indent_id: iss.indent_id,
              name: it.name,
              qty: toRevert,
              unit: it.unit,
              item_code: it.item_code
            });
          }
        }
      }

      await trx("issuance_items").where("issuance_id", iss.id).delete();
      await trx("issuances").where("id", iss.id).delete();
    });

    res.json({ success: true, message: "Issuance deleted and stock reverted." });
  } catch (err) { next(err); }
}

module.exports = { list, create, remove };

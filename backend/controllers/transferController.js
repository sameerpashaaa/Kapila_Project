const db = require("../db");

async function generateTransferNumber(dateStr) {
  const formatted = dateStr.replace(/-/g, "");
  const [{ count }] = await db("stock_transfers").where("date", dateStr).count("id as count");
  const seq = String(parseInt(count || 0) + 1).padStart(4, "0");
  return `TRF-${formatted}-${seq}`;
}

// GET /api/transfers
async function list(req, res, next) {
  try {
    const { status, from_location, to_location, q } = req.query;
    const { offset, limit, sort, order } = req.pagination;

    const filter = (qb) => {
      if (status)        qb.where("status", status);
      if (from_location) qb.where("from_location", from_location);
      if (to_location)   qb.where("to_location", to_location);
      if (q)             qb.whereILike("transfer_number", `%${q}%`);
    };

    const [{ count }] = await db("stock_transfers").modify(filter).count("id as count");
    const rows = await db("stock_transfers")
      .modify(filter)
      .select("*")
      .orderBy(sort || "date", order || "desc")
      .offset(offset).limit(limit);

    res.json({ success: true, data: rows, total: parseInt(count), page: req.pagination.page, limit });
  } catch (err) { next(err); }
}

// GET /api/transfers/:id
async function getOne(req, res, next) {
  try {
    const transfer = await db("stock_transfers").where("id", req.params.id).first();
    if (!transfer) return res.status(404).json({ success: false, error: "Transfer not found." });

    const items = await db("stock_transfer_items").where("transfer_id", req.params.id).orderBy("id");
    res.json({ success: true, data: { ...transfer, items } });
  } catch (err) { next(err); }
}

// POST /api/transfers
async function create(req, res, next) {
  try {
    const { date, from_location, to_location, items, initiated_by, remarks } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ success: false, error: "At least one item required." });

    const transfer_number = await generateTransferNumber(date);

    const result = await db.transaction(async (trx) => {
      const [transfer] = await trx("stock_transfers")
        .insert({ transfer_number, date, from_location: from_location || "Store", to_location, status: "Pending", initiated_by: initiated_by || null, remarks: remarks || null })
        .returning("*");

      const saved = await trx("stock_transfer_items")
        .insert(items.map((it) => ({
          transfer_id: transfer.id,
          item_code: it.item_code,
          name: it.name,
          qty: it.qty,
          unit: it.unit,
          batch_no: it.batch_no || null,
        })))
        .returning("*");

      return { ...transfer, items: saved };
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

// PATCH /api/transfers/:id/accept
async function accept(req, res, next) {
  try {
    const { accepted_by } = req.body;
    const transfer = await db("stock_transfers").where("id", req.params.id).first();
    if (!transfer) return res.status(404).json({ success: false, error: "Transfer not found." });
    if (transfer.status !== "Pending")
      return res.status(400).json({ success: false, error: `Transfer is already ${transfer.status}.` });

    const items = await db("stock_transfer_items").where("transfer_id", req.params.id);

    await db.transaction(async (trx) => {
      // Deduct from source (FIFO across batches of same item_code)
      for (const it of items) {
        const batches = await trx("stock")
          .where("item_code", it.item_code)
          .where("remaining", ">", 0)
          .orderBy("date", "asc").orderBy("id", "asc");

        let toDeduct = parseFloat(it.qty);
        for (const batch of batches) {
          if (toDeduct <= 0) break;
          const deduction = Math.min(parseFloat(batch.remaining), toDeduct);
          await trx("stock").where("id", batch.id).update({ remaining: parseFloat(batch.remaining) - deduction });
          toDeduct -= deduction;
        }

        // Audit trail for the deduction
        const latestBatch = batches[0];
        if (latestBatch) {
          await trx("stock_adjustments").insert({
            stock_id: latestBatch.id,
            qty: -parseFloat(it.qty),
            reason: "Transfer",
            date: transfer.date,
            notes: `Transfer ${transfer.transfer_number} → ${transfer.to_location}`,
          });
        }
      }

      await trx("stock_transfers")
        .where("id", req.params.id)
        .update({ status: "Accepted", accepted_by: accepted_by || null, updated_at: trx.fn.now() });
    });

    const updated = await db("stock_transfers").where("id", req.params.id).first();
    const updatedItems = await db("stock_transfer_items").where("transfer_id", req.params.id);
    res.json({ success: true, data: { ...updated, items: updatedItems } });
  } catch (err) { next(err); }
}

// PATCH /api/transfers/:id/reject
async function reject(req, res, next) {
  try {
    const { accepted_by, remarks } = req.body;
    const transfer = await db("stock_transfers").where("id", req.params.id).first();
    if (!transfer) return res.status(404).json({ success: false, error: "Transfer not found." });
    if (transfer.status !== "Pending")
      return res.status(400).json({ success: false, error: `Transfer is already ${transfer.status}.` });

    await db("stock_transfers").where("id", req.params.id)
      .update({ status: "Rejected", accepted_by: accepted_by || null, remarks: remarks || transfer.remarks, updated_at: db.fn.now() });

    const updated = await db("stock_transfers").where("id", req.params.id).first();
    const items = await db("stock_transfer_items").where("transfer_id", req.params.id);
    res.json({ success: true, data: { ...updated, items } });
  } catch (err) { next(err); }
}

// DELETE /api/transfers/:id  (only pending)
async function remove(req, res, next) {
  try {
    const transfer = await db("stock_transfers").where("id", req.params.id).first();
    if (!transfer) return res.status(404).json({ success: false, error: "Transfer not found." });
    if (transfer.status !== "Pending")
      return res.status(400).json({ success: false, error: "Only pending transfers can be deleted." });

    await db("stock_transfers").where("id", req.params.id).del();
    res.json({ success: true, message: "Transfer deleted." });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, accept, reject, remove };

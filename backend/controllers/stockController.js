const db = require("../db");

// GET /api/stock
// Query params: name, unit, date_from, date_to, low_stock, q (full-text), page, limit, sort, order
async function list(req, res, next) {
  try {
    const { name, unit, date_from, date_to, low_stock, q, supplier, expiry_status, active_only } = req.query;
    const { offset, limit, sort, order } = req.pagination;

    let query = db("stock").select(
      "id", "name", "qty", "remaining", "unit", "date", "created_at", "price", "supplier", "expiry_date", "min_alert_qty", "item_code",
      db.raw("ROUND((remaining / NULLIF(qty, 0) * 100)::numeric, 1) AS pct_remaining")
    );

    if (name) {
      query.where((qb) => {
        qb.whereILike("name", `%${name}%`).orWhereILike("supplier", `%${name}%`);
      });
    }
    if (unit)      query.where("unit", unit);
    if (date_from) query.where("date", ">=", date_from);
    if (date_to)   query.where("date", "<=", date_to);
    if (low_stock === "true") query.whereRaw("remaining <= COALESCE(min_alert_qty, qty * 0.25)");
    if (active_only === "true") query.where("remaining", ">", 0);
    if (supplier)  query.where("supplier", supplier);
    
    if (expiry_status) {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (expiry_status === "expired") {
        query.where("expiry_date", "<", todayStr);
      } else if (expiry_status === "expiring") {
        const soon = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
        query.whereBetween("expiry_date", [todayStr, soon]);
      } else if (expiry_status === "fresh") {
        query.where("expiry_date", ">", new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
      }
    }

    if (q) {
      query.whereRaw("search_vec @@ plainto_tsquery('english', ?)", [q]);
      query.orderByRaw("ts_rank(search_vec, plainto_tsquery('english', ?)) DESC", [q]);
    } else {
      query.orderBy(sort, order);
    }

    const [{ count }] = await db("stock").count("id as count")
      .modify((qb) => {
        if (name) {
          qb.where((inner) => {
            inner.whereILike("name", `%${name}%`).orWhereILike("supplier", `%${name}%`);
          });
        }
        if (unit)      qb.where("unit", unit);
        if (date_from) qb.where("date", ">=", date_from);
        if (date_to)   qb.where("date", "<=", date_to);
        if (low_stock === "true") qb.whereRaw("remaining <= COALESCE(min_alert_qty, qty * 0.25)");
        if (active_only === "true") qb.where("remaining", ">", 0);
        if (supplier)  qb.where("supplier", supplier);
        if (expiry_status) {
          const todayStr = new Date().toISOString().slice(0, 10);
          if (expiry_status === "expired") {
            qb.where("expiry_date", "<", todayStr);
          } else if (expiry_status === "expiring") {
            const soon = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
            qb.whereBetween("expiry_date", [todayStr, soon]);
          } else if (expiry_status === "fresh") {
            qb.where("expiry_date", ">", new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
          }
        }
        if (q)         qb.whereRaw("search_vec @@ plainto_tsquery('english', ?)", [q]);
      });

    const [stats] = await db("stock").select(
      db.raw("COALESCE(SUM(qty * price), 0) AS total_spend"),
      db.raw("COALESCE(SUM(remaining * price), 0) AS store_value"),
      db.raw("COALESCE(SUM(remaining * price) FILTER (WHERE remaining <= COALESCE(min_alert_qty, qty * 0.25)), 0) AS low_stock_value")
    );

    const rows = await query.offset(offset).limit(limit);
    res.json({
      success: true,
      data: rows,
      total: parseInt(count),
      page: req.pagination.page,
      limit,
      stats: {
        total_spend: parseFloat(stats.total_spend),
        store_value: parseFloat(stats.store_value),
        low_stock_value: parseFloat(stats.low_stock_value)
      }
    });
  } catch (err) { next(err); }
}

// POST /api/stock
async function create(req, res, next) {
  try {
    const { name, qty, unit, date, price, supplier, expiry_date, min_alert_qty } = req.body;
    
    // Check if item name already has an item_code
    let item_code;
    const existing = await db("stock")
      .whereRaw("LOWER(name) = LOWER(?)", [name.trim()])
      .select("item_code")
      .first();
      
    if (existing) {
      item_code = existing.item_code;
    } else {
      // Find maximum item code in database to generate the next one
      const maxRow = await db("stock")
        .whereILike("item_code", "KPL-%")
        .select("item_code")
        .orderByRaw("CAST(SUBSTRING(item_code FROM 5) AS INTEGER) DESC")
        .first();
        
      if (maxRow) {
        const lastNum = parseInt(maxRow.item_code.split("-")[1], 10);
        item_code = `KPL-${lastNum + 1}`;
      } else {
        item_code = "KPL-101";
      }
    }

    const [row] = await db("stock").insert({
      name, qty, remaining: qty, unit, date, price, supplier, expiry_date, min_alert_qty, item_code
    }).returning("*");
    
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
}

// PATCH /api/stock/:id
async function update(req, res, next) {
  try {
    const { remaining, min_alert_qty, reason, notes } = req.body;
    
    const current = await db("stock").where("id", req.params.id).first();
    if (!current) return res.status(404).json({ success: false, error: "Not found" });

    const updates = {};
    if (min_alert_qty !== undefined) updates.min_alert_qty = min_alert_qty === null ? null : Math.max(0, parseFloat(min_alert_qty));
    
    let delta = 0;
    if (remaining !== undefined) {
      const targetRem = Math.max(0, parseFloat(remaining));
      updates.remaining = targetRem;
      delta = targetRem - current.remaining;
    }

    const row = await db.transaction(async (trx) => {
      const [updatedRow] = await trx("stock").where("id", req.params.id)
        .update(updates).returning("*");

      if (remaining !== undefined && delta !== 0) {
        const todayStr = new Date().toISOString().slice(0, 10);
        await trx("stock_adjustments").insert({
          stock_id: req.params.id,
          qty: delta,
          reason: reason || "Audit Correction",
          date: todayStr,
          notes: notes || null
        });
      }
      return updatedRow;
    });

    res.json({ success: true, data: row });
  } catch (err) { next(err); }
}

// DELETE /api/stock/:id
async function remove(req, res, next) {
  try {
    const deleted = await db("stock").where("id", req.params.id).delete();
    if (!deleted) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true });
  } catch (err) { next(err); }
}

// GET /api/stock/ledger
async function getLedger(req, res, next) {
  try {
    const { offset = 0, limit = 50 } = req.pagination || { offset: 0, limit: 50 };

    const purchases = db("stock")
      .select("date", "name", db.raw("'Purchase' as type"), "qty", "price", "supplier as detail", "created_at", "item_code");
      
    const issuances = db("issuance_items")
      .join("issuances", "issuances.id", "issuance_items.issuance_id")
      .select("issuances.date", "issuance_items.name", db.raw("'Issue' as type"), "issuance_items.issued as qty", db.raw("NULL::numeric as price"), "issuances.dept as detail", "issuances.created_at", "issuance_items.item_code");
      
    const distinctStock = db("stock").select("name", "item_code").distinctOn("name").as("ds");

    const leftovers = db("leftovers")
      .leftJoin(distinctStock, db.raw("LOWER(leftovers.item)"), db.raw("LOWER(ds.name)"))
      .select("leftovers.date", "leftovers.item as name", db.raw("'Leftover' as type"), "leftovers.qty", db.raw("NULL::numeric as price"), "leftovers.dept as detail", "leftovers.created_at", "ds.item_code");

    const adjustments = db("stock_adjustments")
      .join("stock", "stock.id", "stock_adjustments.stock_id")
      .select(
        "stock_adjustments.date",
        "stock.name",
        db.raw("'Adjustment' as type"),
        "stock_adjustments.qty",
        db.raw("NULL::numeric as price"),
        db.raw("CONCAT(stock_adjustments.reason, ' (', COALESCE(stock_adjustments.notes, 'No details'), ')') as detail"),
        "stock_adjustments.created_at",
        "stock.item_code"
      );

    const [pList, iList, lList, aList] = await Promise.all([purchases, issuances, leftovers, adjustments]);

    const ledger = [...pList, ...iList, ...lList, ...aList]
      .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

    const total = ledger.length;
    const paginated = ledger.slice(offset, offset + limit);

    res.json({ success: true, data: paginated, total, page: req.pagination?.page || 1, limit });
  } catch (err) { next(err); }
}

// GET /api/stock/insights
async function getInsights(req, res, next) {
  try {
    const supplierSpend = await db("stock")
      .select("supplier", db.raw("SUM(remaining * price) as active_value"), db.raw("COUNT(*) as batch_count"))
      .whereNotNull("supplier")
      .groupBy("supplier")
      .orderBy("active_value", "desc");

    const priceTrends = await db("stock")
      .select("name", "price", "date", "supplier")
      .whereNotNull("price")
      .orderBy("name")
      .orderBy("date", "desc");

    res.json({ success: true, data: { supplierSpend, priceTrends } });
  } catch (err) { next(err); }
}

// POST /api/stock/reconcile
async function reconcile(req, res, next) {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: "Items array is required." });
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    await db.transaction(async (trx) => {
      for (const item of items) {
        const { item_code, physical_qty, reason, notes } = item;
        const targetPhysical = Math.max(0, parseFloat(physical_qty));

        // Get active stock batches for this item code
        const activeBatches = await trx("stock")
          .where("item_code", item_code)
          .where("remaining", ">", 0)
          .orderBy("date", "asc")
          .orderBy("id", "asc");

        const totalSystem = activeBatches.reduce((sum, b) => sum + parseFloat(b.remaining), 0);
        const discrepancy = targetPhysical - totalSystem;

        if (discrepancy === 0) continue;

        if (discrepancy < 0) {
          // Shrinkage: Deduct from oldest batches first (FIFO)
          let toDeduct = Math.abs(discrepancy);
          for (const batch of activeBatches) {
            if (toDeduct <= 0) break;
            const deduction = Math.min(parseFloat(batch.remaining), toDeduct);
            
            await trx("stock")
              .where("id", batch.id)
              .update({
                remaining: parseFloat(batch.remaining) - deduction
              });

            await trx("stock_adjustments").insert({
              stock_id: batch.id,
              qty: -deduction,
              reason: reason || "Audit Correction",
              date: todayStr,
              notes: notes || `FIFO deduction of ${deduction} units during physical reconciliation.`
            });

            toDeduct -= deduction;
          }
        } else {
          // Surplus: Add to the newest batch
          if (activeBatches.length > 0) {
            const latestBatch = activeBatches[activeBatches.length - 1];
            await trx("stock")
              .where("id", latestBatch.id)
              .update({
                remaining: parseFloat(latestBatch.remaining) + discrepancy
              });

            await trx("stock_adjustments").insert({
              stock_id: latestBatch.id,
              qty: discrepancy,
              reason: reason || "Audit Correction",
              date: todayStr,
              notes: notes || `Surplus of ${discrepancy} units added during physical reconciliation.`
            });
          } else {
            // No active batches exist. Let's find the last purchase of this item_code to clone details
            const lastBatch = await trx("stock")
              .where("item_code", item_code)
              .orderBy("date", "desc")
              .first();

            if (lastBatch) {
              const [newBatch] = await trx("stock").insert({
                name: lastBatch.name,
                qty: discrepancy,
                remaining: discrepancy,
                unit: lastBatch.unit,
                date: todayStr,
                price: lastBatch.price || 0,
                supplier: lastBatch.supplier || "Unknown",
                supplier_id: lastBatch.supplier_id || null,
                expiry_date: null,
                min_alert_qty: lastBatch.min_alert_qty,
                item_code: item_code
              }).returning("*");

              await trx("stock_adjustments").insert({
                stock_id: newBatch.id,
                qty: discrepancy,
                reason: reason || "Audit Correction",
                date: todayStr,
                notes: notes || `Created new batch of ${discrepancy} units during physical reconciliation.`
              });
            }
          }
        }
      }
    });

    res.json({ success: true, message: "Reconciliation complete." });
  } catch (err) {
    next(err);
  }
}

// GET /api/stock/available
async function getAvailableStock(req, res, next) {
  try {
    const { names } = req.query;
    let namesList = null;
    if (names) {
      namesList = Array.isArray(names)
        ? names
        : names.split(",").map((n) => n.trim());
    }

    // Sum remaining qty per item name
    let qtyQuery = db("stock").select("name").sum("remaining as available").groupBy("name");
    if (namesList) {
      qtyQuery = qtyQuery.whereIn(db.raw("LOWER(name)"), namesList.map((n) => n.toLowerCase()));
    }
    const qtyRows = await qtyQuery;

    // Get latest price for each item (most recent batch with remaining > 0, else any)
    let priceQuery = db("stock")
      .select("name", "price", "date", "created_at", "remaining")
      .orderBy("date", "desc")
      .orderBy("created_at", "desc");
    if (namesList) {
      priceQuery = priceQuery.whereIn(db.raw("LOWER(name)"), namesList.map((n) => n.toLowerCase()));
    }
    const priceRows = await priceQuery;

    // For each item name, pick best price: prefer active batches, then most recent
    const priceMap = {};
    priceRows.forEach((r) => {
      const key = r.name.toLowerCase();
      if (!priceMap[key]) {
        priceMap[key] = { price: parseFloat(r.price) || 0, hasActive: parseFloat(r.remaining) > 0 };
      } else {
        const currentHasActive = priceMap[key].hasActive;
        const rowHasActive = parseFloat(r.remaining) > 0;
        // Replace if: new row is active and current isn't, OR both same activity and new has price
        if ((!currentHasActive && rowHasActive) || (currentHasActive === rowHasActive && parseFloat(r.price) > 0 && priceMap[key].price === 0)) {
          priceMap[key] = { price: parseFloat(r.price) || 0, hasActive: rowHasActive };
        }
      }
    });

    const formatted = {};
    qtyRows.forEach((r) => {
      const key = r.name.toLowerCase();
      formatted[key] = {
        available: parseFloat(r.available || 0),
        price: priceMap[key]?.price || 0,
        name: r.name,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}


module.exports = { list, create, update, remove, getLedger, getInsights, reconcile, getAvailableStock };

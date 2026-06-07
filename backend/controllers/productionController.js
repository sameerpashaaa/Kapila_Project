const db = require("../db");

// GET /api/production
// Query params: dept, date_from, date_to, q (searches notes+dept), page, limit, sort, order
async function list(req, res, next) {
  try {
    const { dept, date_from, date_to, q } = req.query;
    const { offset, limit, sort, order } = req.pagination;

    const filter = (qb) => {
      if (dept)      qb.where("dept", dept);
      if (date_from) qb.where("date", ">=", date_from);
      if (date_to)   qb.where("date", "<=", date_to);
      if (q)         qb.whereRaw("search_vec @@ plainto_tsquery('english', ?)", [q]);
    };

    const [{ count }] = await db("production").modify(filter).count("id as count");
    const rows = await db("production").modify(filter)
      .select("id", "dept", "date", "plates", "notes", "created_at")
      .orderBy(sort, order).offset(offset).limit(limit);

    res.json({ success: true, data: rows, total: parseInt(count), page: req.pagination.page, limit });
  } catch (err) { next(err); }
}

// POST /api/production
async function create(req, res, next) {
  try {
    const [row] = await db("production").insert(req.body).returning("*");
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
}

module.exports = { list, create };

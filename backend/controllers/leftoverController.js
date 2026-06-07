const db = require("../db");

// GET /api/leftovers
// Query params: dept, date_from, date_to, q, page, limit, sort, order
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

    const [{ count }] = await db("leftovers").modify(filter).count("id as count");
    const rows = await db("leftovers").modify(filter)
      .select("*").orderBy(sort, order).offset(offset).limit(limit);

    res.json({ success: true, data: rows, total: parseInt(count), page: req.pagination.page, limit });
  } catch (err) { next(err); }
}

// POST /api/leftovers
async function create(req, res, next) {
  try {
    const [row] = await db("leftovers")
      .insert({ ...req.body, carried_forward: true }).returning("*");
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
}

module.exports = { list, create };

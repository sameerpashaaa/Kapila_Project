// Parses ?page, ?limit, ?sort, ?order from query string
// Attaches { offset, limit, sort, order } to req.pagination
module.exports = (allowedSorts = ["created_at"]) => (req, res, next) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
  const sort  = allowedSorts.includes(req.query.sort) ? req.query.sort : allowedSorts[0];
  const order = req.query.order === "asc" ? "asc" : "desc";
  req.pagination = { offset: (page - 1) * limit, limit, sort, order, page };
  next();
};

module.exports = (err, req, res, next) => {
  console.error(err);
  if (err.name === "ZodError") {
    return res.status(400).json({ success: false, error: err.errors });
  }
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
};

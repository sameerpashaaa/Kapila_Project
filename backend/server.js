require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/stock",      require("./routes/stock"));
app.use("/api/indents",    require("./routes/indents"));
app.use("/api/issuances",  require("./routes/issuances"));
app.use("/api/production", require("./routes/production"));
app.use("/api/leftovers",  require("./routes/leftovers"));
app.use("/api/dashboard",  require("./routes/dashboard"));
app.use("/api/search",     require("./routes/search"));
app.use("/api/scan",       require("./routes/scan"));
app.use("/api/suppliers",       require("./routes/suppliers"));
app.use("/api/departments",     require("./routes/departments"));
app.use("/api/purchase-orders", require("./routes/purchaseOrders"));
app.use("/api/grn",             require("./routes/grn"));
app.use("/api/transfers",       require("./routes/transfers"));
app.use("/api/reorder-points",  require("./routes/reorderPoints"));
app.use("/api",                 require("./routes/recipes"));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Kapila backend running on http://localhost:${PORT}`));

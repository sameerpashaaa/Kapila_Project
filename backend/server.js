require("dotenv").config();

if (!process.env.JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET environment variable is missing.");
  process.exit(1);
}
const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const helmet       = require("helmet");
const compression  = require("compression");
const errorHandler = require("./middleware/errorHandler");
const { authenticate } = require("./middleware/auth");
const { checkAIHealth } = require("./services/localAI");

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

app.use("/api/auth", require("./routes/auth"));
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api", authenticate);

app.use("/api/users",     require("./routes/users"));
app.use("/api/roles",     require("./routes/roles"));
app.use("/api/permissions", require("./routes/permissions"));
app.use("/api/audit-logs", require("./routes/auditLogs"));
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
app.use("/api/approved-delivery", require("./routes/approvedDelivery"));
app.use("/api/chef-stats",  require("./routes/chefStats"));
app.use("/api",                 require("./routes/recipes"));

// AI health check — tells the frontend if Gemini API is configured
app.get("/api/ai-health", authenticate, async (req, res) => {
  const status = await checkAIHealth();
  res.status(status.ok ? 200 : 503).json(status);
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Kapila backend running on http://localhost:${PORT}`);
  // Check AI health on startup
  const aiHealth = await checkAIHealth();
  if (aiHealth.ok) {
    console.log(`✅ Gemini API ready (model: gemini-2.5-flash)`);
  } else {
    console.warn(`⚠️  Gemini API not ready: ${aiHealth.reason}`);
    console.warn(`   Scan and text-parse features will be unavailable until a key is provided.`);
  }
});

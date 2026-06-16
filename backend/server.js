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

const { verifyAccessToken } = require("./services/authService");
const { getUserAuthContext } = require("./services/permissionService");
const db = require("./db");
const issuanceController = require("./controllers/issuanceController");

app.post("/api/store-issuance/auto-issue", async (req, res, next) => {
  try {
    let data = req.body;
    if (typeof data === "string") {
      try { data = JSON.parse(data); } catch (e) {}
    }
    const { token, indentId, items } = data;
    if (!token) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }
    const payload = verifyAccessToken(token);
    const user = await getUserAuthContext(parseInt(payload.sub, 10));
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, error: "User inactive or not found" });
    }
    
    req.user = { ...user, permissions: new Set(user.permissions || []) };
    
    if (!req.user.permissions.has("issuances.create")) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const indent = await db("indents").where("id", indentId).first();
    if (!indent) {
      return res.status(404).json({ success: false, error: "Indent not found" });
    }
    
    // Idempotency check: 15-second window for duplicate indent issuance
    const fifteenSecondsAgo = new Date(Date.now() - 15000).toISOString();
    const existing = await db("issuances")
      .where("indent_id", indentId)
      .andWhere("created_at", ">=", fifteenSecondsAgo)
      .first();
    if (existing) {
      return res.status(200).json({ success: true, message: "Duplicate request ignored", data: existing });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    req.body = {
      indent_id: indentId,
      dept: indent.dept,
      date: todayStr,
      scanned: false,
      items
    };

    return issuanceController.create(req, res, next);
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid token or session expired" });
  }
});

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
app.use("/api/production-plans", require("./routes/productionPlans"));
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

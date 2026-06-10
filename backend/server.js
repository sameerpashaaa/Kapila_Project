require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const errorHandler = require("./middleware/errorHandler");
const { checkOllamaHealth } = require("./services/localAI");

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
app.use("/api/approved-delivery", require("./routes/approvedDelivery"));
app.use("/api",                 require("./routes/recipes"));

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Local AI health check — tells the frontend if Ollama is up and model loaded
app.get("/api/ai-health", async (req, res) => {
  const status = await checkOllamaHealth();
  res.status(status.ok ? 200 : 503).json(status);
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Kapila backend running on http://localhost:${PORT}`);
  // Check Ollama on startup
  const aiHealth = await checkOllamaHealth();
  if (aiHealth.ok) {
    console.log(`✅ Ollama ready (model: ${process.env.OLLAMA_MODEL || "gemma3:1b"})`);
  } else {
    console.warn(`⚠️  Ollama not ready: ${aiHealth.reason}`);
    console.warn(`   Scan and text-parse features will be unavailable until Ollama is running.`);
  }
});

const db = require("../db");
const { ocrImage, structureWithOllama } = require("../services/localAI");

// ── POST /api/scan/indent ──────────────────────────────────────────────────
// Accepts: { image: base64string, mime_type: string }
// Runs:    Tesseract OCR → Ollama Gemma structuring → DB insert
async function scanIndent(req, res, next) {
  try {
    const { image, mime_type } = req.body;
    if (!image || !mime_type) {
      return res.status(400).json({ success: false, error: "image and mime_type are required." });
    }

    // 1. OCR the image locally
    const rawText = await ocrImage(image, mime_type);
    if (!rawText || rawText.trim().length < 5) {
      return res.status(422).json({ success: false, error: "Could not extract text from image. Please use a clearer photo." });
    }

    // 2. Structure the raw text with local LLM
    const parsed = await structureWithOllama(rawText, "indent");

    if (!parsed.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return res.status(422).json({ success: false, error: "No items could be extracted. Please check the image quality." });
    }

    // 3. Enrich with item codes from stock
    const names = parsed.items.map((it) => it.name.trim());
    const stockMatches = await db("stock")
      .select("name", "item_code")
      .whereIn(db.raw("LOWER(name)"), names.map((n) => n.toLowerCase()));

    const nameToCodeMap = {};
    stockMatches.forEach((m) => { nameToCodeMap[m.name.toLowerCase()] = m.item_code; });

    const enrichedItems = parsed.items.map((it) => ({
      ...it,
      item_code: nameToCodeMap[it.name.trim().toLowerCase()] || "KPL-NEW",
    }));

    // 3.5 Validate department
    let finalDept = "SI-MEALS"; // Default safe fallback
    if (parsed.dept) {
      const deptExists = await db("departments").whereRaw("LOWER(name) = LOWER(?)", [parsed.dept.trim()]).first();
      if (deptExists) {
        finalDept = deptExists.name;
      }
    }

    // 4. Save as pending indent
    const todayStr = new Date().toISOString().slice(0, 10);
    const [indent] = await db("indents")
      .insert({ dept: finalDept, date: todayStr, status: "pending" })
      .returning("*");

    const rows = enrichedItems.map((it) => ({
      indent_id: indent.id,
      name: it.name,
      qty: it.qty,
      unit: it.unit,
      item_code: it.item_code,
    }));

    const savedItems = await db("indent_items").insert(rows).returning("*");

    res.json({ success: true, data: { ...indent, items: savedItems } });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/scan/purchase ────────────────────────────────────────────────
// Accepts: { image: base64string, mime_type: string }
async function scanPurchase(req, res, next) {
  try {
    const { image, mime_type } = req.body;
    if (!image || !mime_type) {
      return res.status(400).json({ success: false, error: "image and mime_type are required." });
    }

    // 1. OCR
    const rawText = await ocrImage(image, mime_type);
    if (!rawText || rawText.trim().length < 5) {
      return res.status(422).json({ success: false, error: "Could not extract text from image. Please use a clearer photo." });
    }

    // 2. Structure
    const parsed = await structureWithOllama(rawText, "purchase");

    if (!parsed.items || !Array.isArray(parsed.items)) {
      return res.status(422).json({ success: false, error: "No items could be extracted from the receipt." });
    }

    // 3. Enrich with item codes
    const names = parsed.items.map((it) => it.name.trim());
    const stockMatches = await db("stock")
      .select("name", "item_code")
      .whereIn(db.raw("LOWER(name)"), names.map((n) => n.toLowerCase()));

    const nameToCodeMap = {};
    stockMatches.forEach((m) => { nameToCodeMap[m.name.toLowerCase()] = m.item_code; });

    const enrichedItems = parsed.items.map((it) => ({
      ...it,
      item_code: nameToCodeMap[it.name.trim().toLowerCase()] || "",
    }));

    res.json({ success: true, data: { supplier: parsed.supplier || null, items: enrichedItems } });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/scan/text ────────────────────────────────────────────────────
// Accepts: { text: string }  (voice transcript or pasted text)
async function scanText(req, res, next) {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: "text is required." });
    }

    // No OCR step needed — go straight to LLM structuring
    const parsed = await structureWithOllama(text, "text");

    if (!parsed.items || !Array.isArray(parsed.items)) {
      return res.status(422).json({ success: false, error: "Could not parse the text. Please try again with clearer formatting." });
    }

    // Enrich with item codes
    const names = (parsed.items || []).map((it) => it.name.trim());
    const stockMatches = await db("stock")
      .select("name", "item_code")
      .whereIn(db.raw("LOWER(name)"), names.map((n) => n.toLowerCase()));

    const nameToCodeMap = {};
    stockMatches.forEach((m) => { nameToCodeMap[m.name.toLowerCase()] = m.item_code; });

    const enrichedItems = (parsed.items || []).map((it) => ({
      ...it,
      item_code: nameToCodeMap[it.name.trim().toLowerCase()] || "",
    }));

    res.json({ success: true, data: { supplier: parsed.supplier || null, items: enrichedItems } });
  } catch (err) {
    next(err);
  }
}

module.exports = { scanIndent, scanPurchase, scanText };

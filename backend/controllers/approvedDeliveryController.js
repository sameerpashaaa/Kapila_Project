const db = require("../db");
const multer = require("multer");
const pdfParse = require("pdf-parse");

// ── Multer setup: accept PDF and images into memory ────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB max
  fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, WEBP images and PDF files are accepted."));
  },
});

// ── Anthropic helper ───────────────────────────────────────────────────────
async function callClaudeVision(base64Image, mimeType, prompt) {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes("sk-ant-...")) {
    throw new Error("Anthropic API key is not configured in backend .env");
  }
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2500,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64Image } },
          { type: "text", text: prompt },
        ],
      }],
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err.slice(0, 200)}`);
  }
  const result = await response.json();
  const raw = result.content[0].text.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  return JSON.parse(raw);
}

async function callClaudeText(textContent, prompt) {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes("sk-ant-...")) {
    throw new Error("Anthropic API key is not configured in backend .env");
  }
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2500,
      messages: [{
        role: "user",
        content: [{ type: "text", text: `${prompt}\n\n--- DOCUMENT TEXT ---\n${textContent}` }],
      }],
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err.slice(0, 200)}`);
  }
  const result = await response.json();
  const raw = result.content[0].text.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  return JSON.parse(raw);
}

// ── POST /api/approved-delivery/scan ─────────────────────────────────────
// Accepts: multipart/form-data  { file: <PDF or image>, supplier_id: <number> }
// Returns: preview of extracted items (not saved yet)
async function scan(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded. Please attach a PDF or image." });
    }

    const supplier_id = req.body.supplier_id;
    if (!supplier_id) {
      return res.status(400).json({ success: false, error: "supplier_id is required." });
    }

    const supplier = await db("suppliers").where("id", supplier_id).first();
    if (!supplier) {
      return res.status(400).json({ success: false, error: "Supplier not found." });
    }

    const DELIVERY_PROMPT = `You are an expert OCR parser for hotel kitchen inventory systems.
The user has uploaded a supplier delivery challan, approved indent, or goods delivery document.

Extract every line item from this document. For each item determine:
- name: (string) The item/product name. Translate any regional language names to standard English (e.g. "Aloo" → "Potato", "Tamatar" → "Tomato", "Biyyam" → "Rice").
- qty: (number) The quantity delivered/supplied.
- unit: (string) Must be exactly one of: kg, g, L, ml, pcs, dozen, box, plates, portions. Default to "kg" if unclear.
- unit_price: (number) Price per unit if visible, otherwise 0.

Also extract:
- date: (string) Delivery date in YYYY-MM-DD format. Use today's date if not found.
- invoice_no: (string or null) Invoice / challan / bill number if visible.

Return ONLY a valid JSON object — no markdown, no explanations:
{
  "date": "YYYY-MM-DD",
  "invoice_no": "string or null",
  "items": [
    { "name": "string", "qty": number, "unit": "string", "unit_price": number }
  ]
}`;

    let extracted;

    if (req.file.mimetype === "application/pdf") {
      // PDF: extract text then send to Claude text API
      const pdfData = await pdfParse(req.file.buffer);
      const textContent = pdfData.text;
      if (!textContent || textContent.trim().length < 10) {
        return res.status(422).json({
          success: false,
          error: "PDF appears to be image-based (scanned). Please upload a photo/image of the document instead.",
        });
      }
      extracted = await callClaudeText(textContent, DELIVERY_PROMPT);
    } else {
      // Image: send as base64 to Claude Vision
      const base64 = req.file.buffer.toString("base64");
      extracted = await callClaudeVision(base64, req.file.mimetype, DELIVERY_PROMPT);
    }

    if (!extracted.items || !Array.isArray(extracted.items)) {
      return res.status(422).json({ success: false, error: "AI could not extract items from this document. Please try a clearer image." });
    }

    // Match item names against existing stock to get item_codes
    const names = extracted.items.map(it => (it.name || "").trim().toLowerCase()).filter(Boolean);
    const stockMatches = names.length
      ? await db("stock").select("name", "item_code", "unit").whereIn(db.raw("LOWER(name)"), names)
      : [];

    const nameMap = {};
    stockMatches.forEach(m => { nameMap[m.name.toLowerCase()] = m; });

    const enrichedItems = extracted.items.map(it => {
      const key = (it.name || "").trim().toLowerCase();
      const match = nameMap[key];
      return {
        name: it.name,
        qty: it.qty || 0,
        unit: it.unit || "kg",
        unit_price: it.unit_price || 0,
        landed_cost: ((it.qty || 0) * (it.unit_price || 0)).toFixed(2),
        item_code: match ? match.item_code : "",
        stock_match: !!match,
      };
    });

    res.json({
      success: true,
      data: {
        supplier: { id: supplier.id, name: supplier.name },
        date: extracted.date || new Date().toISOString().slice(0, 10),
        invoice_no: extracted.invoice_no || null,
        items: enrichedItems,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/approved-delivery/commit ────────────────────────────────────
// Accepts: JSON { supplier_id, date, invoice_no, received_by, items: [...] }
// Creates a GRN record + inserts stock entries — mirrors grnController.create
async function commit(req, res, next) {
  try {
    const { supplier_id, date, invoice_no, received_by, remarks, items } = req.body;

    if (!supplier_id) return res.status(400).json({ success: false, error: "supplier_id is required." });
    if (!items || items.length === 0) return res.status(400).json({ success: false, error: "No items to save." });

    const supplier = await db("suppliers").where("id", supplier_id).first();
    if (!supplier) return res.status(400).json({ success: false, error: "Supplier not found." });

    // Generate GRN number (same logic as grnController)
    const dateObj = new Date(date);
    const formattedDate = dateObj.toISOString().slice(0, 10).replace(/-/g, "");
    const [{ count }] = await db("goods_receipt_notes").where("date", date).count("id as count");
    const seq = parseInt(count || 0) + 1;
    const grn_number = `GRN-${formattedDate}-${String(seq).padStart(4, "0")}`;

    const total_amount = items.reduce((s, it) => s + (parseFloat(it.landed_cost) || 0), 0);

    const result = await db.transaction(async (trx) => {
      // 1. Insert GRN header
      const [grn] = await trx("goods_receipt_notes")
        .insert({
          grn_number,
          po_id: null,
          supplier_id,
          date,
          invoice_no: invoice_no || null,
          received_by: received_by || null,
          remarks: remarks || "Created via AI document scan",
          total_amount,
        })
        .returning("*");

      // 2. Insert GRN items + stock batches
      const savedItems = [];
      for (const it of items) {
        const qty_received = parseFloat(it.qty) || 0;
        const qty_accepted = qty_received; // All accepted for supplier-confirmed delivery
        const unit_price   = parseFloat(it.unit_price) || 0;
        const landed_cost  = parseFloat(it.landed_cost) || qty_accepted * unit_price;
        const item_code    = it.item_code || it.name.toUpperCase().replace(/\s+/g, "-").slice(0, 20);

        const [savedItem] = await trx("goods_receipt_items")
          .insert({
            grn_id: grn.id,
            item_code,
            name: it.name,
            qty_ordered: null,
            qty_received,
            qty_accepted,
            qty_rejected: 0,
            unit: it.unit,
            unit_price,
            landed_cost,
            batch_no: null,
            expiry_date: null,
          })
          .returning("*");

        savedItems.push(savedItem);

        if (qty_accepted > 0) {
          const batch = `BAT-${formattedDate}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          await trx("stock").insert({
            name: it.name,
            qty: qty_accepted,
            remaining: qty_accepted,
            unit: it.unit,
            date,
            price: unit_price || (landed_cost / qty_accepted),
            supplier: supplier.name,
            supplier_id: supplier.id,
            expiry_date: null,
            min_alert_qty: null,
            item_code,
            batch_no: batch,
            grn_item_id: savedItem.id,
          });
        }
      }

      return { ...grn, items: savedItems };
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, scan, commit };

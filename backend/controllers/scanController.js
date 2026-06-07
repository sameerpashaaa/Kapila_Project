const db = require("../db");

// Helper to send image payload to Anthropic API
async function callClaudeVision(base64Image, mimeType, prompt) {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes("sk-ant-...")) {
    throw new Error("Anthropic API key is not configured in the backend .env file.");
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
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API request failed: ${response.status} - ${errorBody}`);
  }

  const result = await response.json();
  const rawText = result.content[0].text.trim();
  
  // Clean potential JSON markdown wrapper
  const cleanJsonText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleanJsonText);
}

// POST /api/scan/indent
async function scanIndent(req, res, next) {
  try {
    const { image, mime_type } = req.body;
    if (!image || !mime_type) {
      return res.status(400).json({ success: false, error: "Image data and mime_type are required." });
    }

    const prompt = `You are an expert OCR parser for a kitchen store database. 
The user has uploaded a handwritten or printed indent slip list.
Extract all requested items.
For each item, determine:
- name (string)
- qty (number)
- unit (string, must be one of: kg, g, L, ml, pcs, dozen, box, plates, portions. Defaults to 'kg')

Also determine the kitchen department requesting these goods (one of: South Indian, North Indian, Continental, Juices, Bakery, Chinese. Defaults to 'South Indian').

Return ONLY a valid JSON object with keys "dept" (string) and "items" (array of objects with keys "name", "qty", "unit").
Do not write markdown block ticks, do not write explanations. Just return raw JSON.`;

    const parsed = await callClaudeVision(image, mime_type, prompt);

    // Look up or assign item codes for each parsed item
    const names = parsed.items.map(it => it.name.trim());
    const stockMatches = await db("stock")
      .select("name", "item_code")
      .whereIn(db.raw("LOWER(name)"), names.map(n => n.toLowerCase()));

    const nameToCodeMap = {};
    stockMatches.forEach(m => {
      nameToCodeMap[m.name.toLowerCase()] = m.item_code;
    });

    const enrichedItems = parsed.items.map(it => ({
      ...it,
      item_code: nameToCodeMap[it.name.trim().toLowerCase()] || "KPL-NEW"
    }));

    // Create a pending indent request automatically in the database
    const todayStr = new Date().toISOString().slice(0, 10);
    const [indent] = await db("indents").insert({
      dept: parsed.dept || "South Indian",
      date: todayStr,
      status: "pending"
    }).returning("*");

    const rows = enrichedItems.map((it) => ({
      indent_id: indent.id,
      name: it.name,
      qty: it.qty,
      unit: it.unit,
      item_code: it.item_code
    }));

    const savedItems = await db("indent_items").insert(rows).returning("*");

    res.json({
      success: true,
      data: {
        ...indent,
        items: savedItems
      }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/scan/purchase
async function scanPurchase(req, res, next) {
  try {
    const { image, mime_type } = req.body;
    if (!image || !mime_type) {
      return res.status(400).json({ success: false, error: "Image data and mime_type are required." });
    }

    const prompt = `You are an expert OCR parser for store invoices. 
The user has uploaded a handwritten purchase bill or receipt.
Extract all purchased items.
For each item, determine:
- name (string)
- qty (number)
- price (number, price per single unit)
- unit (string, must be one of: kg, g, L, ml, pcs, dozen, box, plates, portions. Defaults to 'kg')

Also extract the supplier/vendor name if visible (as string, or null).

Return ONLY a valid JSON object with keys "supplier" (string or null) and "items" (array of objects with keys "name", "qty", "price", "unit").
Do not write markdown block ticks, do not write explanations. Just return raw JSON.`;

    const parsed = await callClaudeVision(image, mime_type, prompt);

    // Look up existing item codes for parsed item names to pre-fill them
    const names = parsed.items.map(it => it.name.trim());
    const stockMatches = await db("stock")
      .select("name", "item_code")
      .whereIn(db.raw("LOWER(name)"), names.map(n => n.toLowerCase()));

    const nameToCodeMap = {};
    stockMatches.forEach(m => {
      nameToCodeMap[m.name.toLowerCase()] = m.item_code;
    });

    const enrichedItems = parsed.items.map(it => ({
      ...it,
      item_code: nameToCodeMap[it.name.trim().toLowerCase()] || ""
    }));

    res.json({
      success: true,
      data: {
        supplier: parsed.supplier,
        items: enrichedItems
      }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/scan/text
async function scanText(req, res, next) {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: "Text content is required." });
    }

    const prompt = `You are an expert multilingual text parser for store deliveries.
The user has provided a dictated voice transcript or a pasted text message list.
The text may be in English, Hindi, Telugu, Tamil, Kannada, or Romanized/code-mixed forms (e.g. Hinglish, Telgish, like "Aloo 10 kilo at 20 rate", "Tamatalu 5 kgs 40 rate").

Extract all purchased items.
For each item, determine:
- name (Translate to standard English names, e.g. "Alugadda"/"Aloo" -> "Potato", "Tamata"/"Tamatar" -> "Tomato", "Chinthapandu" -> "Tamarind", "Biyyam" -> "Rice", "Ullipayalu" -> "Onion")
- qty (number)
- price (number, price per unit)
- unit (string, must be one of: kg, g, L, ml, pcs, dozen, box, plates, portions. Defaults to 'kg')

Also extract the supplier/vendor name if mentioned (as string, or null).

Return ONLY a valid JSON object with keys "supplier" (string or null) and "items" (array of objects with keys "name", "qty", "price", "unit").
Do not write markdown block ticks, do not write explanations. Just return raw JSON.`;

    // Re-use Anthropic vision call as simple text call by passing dummy image source or text message
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes("sk-ant-...")) {
      throw new Error("Anthropic API key is not configured in the backend .env file.");
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
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${prompt}\n\nInput Text to parse:\n${text}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic API request failed: ${response.status} - ${errorBody}`);
    }

    const result = await response.json();
    const rawText = result.content[0].text.trim();
    const cleanJsonText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleanJsonText);

    // Look up existing item codes for parsed item names to pre-fill them
    const names = (parsed.items || []).map(it => it.name.trim());
    const stockMatches = await db("stock")
      .select("name", "item_code")
      .whereIn(db.raw("LOWER(name)"), names.map(n => n.toLowerCase()));

    const nameToCodeMap = {};
    stockMatches.forEach(m => {
      nameToCodeMap[m.name.toLowerCase()] = m.item_code;
    });

    const enrichedItems = (parsed.items || []).map(it => ({
      ...it,
      item_code: nameToCodeMap[it.name.trim().toLowerCase()] || ""
    }));

    res.json({
      success: true,
      data: {
        supplier: parsed.supplier,
        items: enrichedItems
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { scanIndent, scanPurchase, scanText };

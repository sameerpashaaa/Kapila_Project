/**
 * localAI.js — Shared service for fully-local AI processing.
 *
 * OCR:        Tesseract.js  (runs in process, no network)
 * Structuring: Ollama       (localhost:11434, model: gemma3:1b)
 */

const { createWorker } = require("tesseract.js");

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:1b";

// ── Tesseract OCR ──────────────────────────────────────────────────────────
/**
 * Run OCR on a base64-encoded image. Returns raw extracted text string.
 * Supports multilingual: eng+hin+tel (English, Hindi, Telugu).
 */
async function ocrImage(base64Data, mimeType) {
  const worker = await createWorker("eng+hin+tel", 1, {
    logger: () => {}, // suppress progress logs
  });

  try {
    // Convert base64 to Buffer for Tesseract
    const imageBuffer = Buffer.from(base64Data, "base64");
    const { data } = await worker.recognize(imageBuffer);
    return data.text || "";
  } finally {
    await worker.terminate();
  }
}

// ── Ollama LLM ─────────────────────────────────────────────────────────────
/**
 * Send raw OCR text to a local Ollama model and get back a structured JSON.
 * @param {string} rawText  - The OCR-extracted text or voice transcript
 * @param {string} task     - "indent" | "purchase" | "text" | "delivery"
 * @returns {object} Parsed JSON object
 */
async function structureWithOllama(rawText, task) {
  const prompt = buildPrompt(task, rawText);

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: "json",
      options: {
        temperature: 0,     // deterministic output
        num_predict: 1024,  // cap output length
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama request failed (${response.status}): ${errText.slice(0, 200)}`);
  }

  const result = await response.json();
  const raw = (result.response || "").trim();

  // Ollama with format:"json" usually returns clean JSON, but strip fences just in case
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

// ── Prompt builder ─────────────────────────────────────────────────────────
function buildPrompt(task, rawText) {
  const VALID_UNITS = "kg, g, L, ml, pcs, dozen, box, plates, portions";
  const VALID_DEPTS = "TIFFINS, STAFF, SI-MEALS, NORTH INDIAN, CHAT & SOFTY, CHINESE & DOSA, MOCKTAILS & CONTINENTAL, RESTAURANT, ROOM SERVICE";

  const prompts = {
    indent: `You are an OCR parser for a hotel kitchen inventory system.
Extract all indent/requisition items from the text below.
For each item: name (string), qty (number), unit (one of: ${VALID_UNITS}, default kg).
Determine the requesting department (one of: ${VALID_DEPTS}, default SI-MEALS).
Return ONLY valid JSON with keys "dept" (string) and "items" (array of {name, qty, unit}).
No markdown, no explanation. Just JSON.

Text:
${rawText}`,

    purchase: `You are an OCR parser for hotel kitchen purchase receipts.
Extract all purchased items from the text below.
For each item: name (string), qty (number), price (number, per unit), unit (one of: ${VALID_UNITS}, default kg).
Extract supplier/vendor name if present (string or null).
Return ONLY valid JSON with keys "supplier" (string|null) and "items" (array of {name, qty, price, unit}).
No markdown, no explanation. Just JSON.

Text:
${rawText}`,

    text: `You are a multilingual text parser for hotel kitchen inventory.
The text may be English, Hindi, Telugu, Tamil, Kannada or code-mixed (e.g. "Aloo 10 kilo 20 rate", "Tamatalu 5 kgs 40").
Translate regional names to English: Aloo/Alugadda→Potato, Tamata/Tamatar→Tomato, Biyyam→Rice, Ullipayalu→Onion, Chinthapandu→Tamarind.
For each item: name (English), qty (number), price (number, per unit), unit (one of: ${VALID_UNITS}, default kg).
Extract supplier if mentioned (string or null).
Return ONLY valid JSON with keys "supplier" (string|null) and "items" (array of {name, qty, price, unit}).
No markdown, no explanation. Just JSON.

Text:
${rawText}`,

    delivery: `You are an OCR parser for hotel kitchen supplier delivery documents.
Extract all delivered items from the text below.
For each item: name (English — translate regional names), qty (number), unit (one of: ${VALID_UNITS}, default kg), unit_price (number, 0 if not found).
Extract delivery date as YYYY-MM-DD (today if not found) and invoice number (string or null).
Return ONLY valid JSON: {"date":"YYYY-MM-DD","invoice_no":string|null,"items":[{name,qty,unit,unit_price}]}.
No markdown, no explanation. Just JSON.

Text:
${rawText}`,
  };

  return prompts[task] || prompts.text;
}

// ── Health check ───────────────────────────────────────────────────────────
/**
 * Returns true if Ollama is running and the required model is available.
 */
async function checkOllamaHealth() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { ok: false, reason: `Ollama responded with ${res.status}` };
    const data = await res.json();
    const models = (data.models || []).map((m) => m.name);
    const hasModel = models.some((m) => m.startsWith(OLLAMA_MODEL.split(":")[0]));
    if (!hasModel) {
      return {
        ok: false,
        reason: `Model "${OLLAMA_MODEL}" not found. Run: ollama pull ${OLLAMA_MODEL}`,
        available: models,
      };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: `Ollama not reachable at ${OLLAMA_URL}. Install from https://ollama.com and run: ollama pull ${OLLAMA_MODEL}`,
    };
  }
}

module.exports = { ocrImage, structureWithOllama, checkOllamaHealth };

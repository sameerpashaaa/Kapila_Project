/**
 * localAI.js — Service for AI processing using the Gemini API.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function callGemini(contents, responseMimeType = "text/plain") {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in the .env file.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const body = {
    contents,
    generationConfig: {}
  };
  
  if (responseMimeType === "application/json") {
    body.generationConfig.responseMimeType = "application/json";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API request failed (${response.status}): ${errText.slice(0, 200)}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response from Gemini API.");
  }
  return text.trim();
}

/**
 * Perform OCR using Gemini.
 */
async function ocrImage(base64Data, mimeType) {
  const contents = [
    {
      parts: [
        {
          text: "Perform OCR on this image. Extract all text, numbers, and words clearly. Important rules:\n- If a table cell contains a tick mark, checkmark, or check symbol (✓ √ ✗ or any handwritten tick), write the word TICK in that cell.\n- If a table cell is completely blank or empty, write the word BLANK in that cell.\n- Do NOT interpret or convert values — transcribe exactly what is visible.\nReturn only the raw text extracted, without any introduction, headings, or markdown."
        },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        }
      ]
    }
  ];
  return await callGemini(contents);
}

/**
 * Structure extracted text using Gemini.
 */
async function structureWithOllama(rawText, task) {
  const prompt = buildPrompt(task, rawText);
  const contents = [
    {
      parts: [
        {
          text: prompt
        }
      ]
    }
  ];
  const responseText = await callGemini(contents, "application/json");
  return JSON.parse(responseText);
}

/**
 * Transcribe spoken audio using Gemini.
 */
async function transcribeAudio(base64Data, mimeType) {
  const contents = [
    {
      parts: [
        {
          text: "You are a speech-to-text transcriber for a kitchen inventory system. Transcribe the spoken audio clip. If it is in an Indian language like Hindi or Telugu, or code-mixed with English (e.g. 'Aloo 5 kg', 'Tamatar 10 portions'), transcribe it phonetically or translate/transcribe it clearly to English text so it can be parsed. Return ONLY the transcribed text. Do not include any other commentary."
        },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        }
      ]
    }
  ];
  return await callGemini(contents);
}

// ── Prompt builder ─────────────────────────────────────────────────────────
function buildPrompt(task, rawText) {
  const VALID_UNITS = "kg, g, L, ml, pcs, dozen, box, plates, portions";
  const VALID_DEPTS = "TIFFINS, STAFF, SI-MEALS, NORTH INDIAN, CHAT & SOFTY, CHINESE & DOSA, MOCKTAILS & CONTINENTAL, RESTAURANT, ROOM SERVICE";

  const prompts = {
    indent: `You are an OCR parser for a hotel kitchen indent/requisition form.
Extract all items from the text below and return them as structured JSON.

QUANTITY RULES (strictly follow these):
- If the quantity cell contains the word TICK (meaning a handwritten tick/checkmark was present), set qty to 1.
- If the quantity cell contains the word BLANK, is empty, missing, or illegible, set qty to null — do NOT guess or default to 1.
- If a numeric quantity is clearly written (e.g. 5, 10, 2), parse it as a number.
- Items with qty null should still be included in the output; do not drop them.

For each item: name (string), qty (number | null), unit (one of: ${VALID_UNITS}, default pcs for room/housekeeping items, kg for food items).
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

/**
 * Returns true if Gemini API key is configured.
 */
async function checkAIHealth() {
  if (GEMINI_API_KEY) {
    return { ok: true };
  } else {
    return {
      ok: false,
      reason: "GEMINI_API_KEY is not defined in the .env file. Please add it to start using OCR and voice parsing."
    };
  }
}

module.exports = { ocrImage, structureWithOllama, checkAIHealth, transcribeAudio };

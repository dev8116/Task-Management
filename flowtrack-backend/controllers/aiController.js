// flowtrack-backend/controllers/aiController.js

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Sanitize text: allow only letters, numbers, spaces, period, comma and apostrophe
const sanitizeAndLimit = (text, maxWords = 100) => {
  if (!text) return "";
  let s = String(text);
  // normalize whitespace
  s = s.replace(/\r?\n|\r|\t/g, " ");
  // remove any character that is not a letter, number, space, period, comma or apostrophe
  s = s.replace(/[^A-Za-z0-9\s\.,']/g, "");
  // collapse multiple spaces
  s = s.replace(/\s+/g, " ").trim();
  if (!s) return "";
  const parts = s.split(" ");
  if (parts.length <= maxWords) return s;
  return parts.slice(0, maxWords).join(" ");
};

const callGemini = async (prompt, { retries = 2 } = {}) => {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY in environment");

  apiKey = String(apiKey).trim();

  // common .env mistake: key + comment on same line
  if (apiKey.includes("#")) {
    throw new Error(
      "GEMINI_API_KEY contains '#'. Fix your .env: keep only the key on that line (no comments)."
    );
  }

  let lastText = "";

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    }

    lastText = await response.text();

    if ((response.status === 503 || response.status === 429) && attempt < retries) {
      await sleep(500 * Math.pow(2, attempt));
      continue;
    }

    if (response.status === 503) {
      throw new Error("AI is busy right now (Gemini 503). Please try again in 1–2 minutes.");
    }
    if (response.status === 429) {
      throw new Error("AI rate limit reached (Gemini 429). Please try again later.");
    }

    if (response.status === 400 && lastText.includes("API key not valid")) {
      throw new Error(
        "Gemini error (400): API key not valid. Your GEMINI_API_KEY is wrong/disabled/restricted. Fix .env and restart backend."
      );
    }

    throw new Error(`Gemini error (${response.status}): ${lastText}`);
  }

  throw new Error(`Gemini error: ${lastText}`);
};

exports.generateProjectDescription = async (req, res) => {
  try {
    const { name, description = "" } = req.body;
    if (!name) return res.status(400).json({ message: "Project name is required." });

    const prompt = `
  You improve project descriptions. Produce exactly 100 words. Use only letters, numbers, spaces and the punctuation characters: period (.), comma (,) and apostrophe ('). Do not use any other special characters. Return a concise, professional description (2-4 sentences). Do not include headers, lists, or code blocks.

  Project name: ${name}
  Notes: ${description}
    `.trim();

    const content = await callGemini(prompt);
    const sanitized = sanitizeAndLimit(content, 100);
    res.json({ description: sanitized });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateTaskSuggestion = async (req, res) => {
  try {
    const { title, description = "", projectName = "" } = req.body;
    if (!title) return res.status(400).json({ message: "Task title is required." });

    const prompt = `
  You write task details. Produce exactly 100 words. Use only letters, numbers, spaces and the punctuation characters: period (.), comma (,) and apostrophe ('). Do not use any other special characters. Return 2-5 short steps as separate sentences (not bullet points). Each sentence should be concise and actionable. Do not include headers or code blocks.

  Task title: ${title}
  Project: ${projectName}
  Notes: ${description}
    `.trim();

    const content = await callGemini(prompt);
    const sanitized = sanitizeAndLimit(content, 100);
    res.json({ suggestion: sanitized });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const callGemini = async (prompt, { retries = 3 } = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY in environment");

  let lastText = "";

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 },
      }),
    });

    // Success
    if (response.ok) {
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    }

    // Read response text once for logging/context
    lastText = await response.text();

    // Retry only on temporary overload/rate-limit
    if ((response.status === 503 || response.status === 429) && attempt < retries) {
      // 0.5s, 1s, 2s, 4s...
      const backoff = 500 * Math.pow(2, attempt);
      await sleep(backoff);
      continue;
    }

    // Non-retryable or out of retries
    if (response.status === 503) {
      throw new Error("AI is busy right now (Gemini 503). Please try again in 1–2 minutes.");
    }
    if (response.status === 429) {
      throw new Error("AI rate limit reached (Gemini 429). Please try again later.");
    }

    throw new Error(`Gemini error (${response.status}): ${lastText}`);
  }

  // Fallback (shouldn't happen)
  throw new Error(`Gemini error: ${lastText}`);
};
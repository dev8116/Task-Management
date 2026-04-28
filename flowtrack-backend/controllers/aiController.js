const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment");
  }

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3 },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini error: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
};

exports.generateProjectDescription = async (req, res) => {
  try {
    const { name, description = "" } = req.body;
    if (!name) return res.status(400).json({ message: "Project name is required." });

    const prompt = `
You improve project descriptions. Return a concise, professional description (2-4 sentences).

Project name: ${name}
Notes: ${description}
    `.trim();

    const content = await callGemini(prompt);
    res.json({ description: content });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateTaskSuggestion = async (req, res) => {
  try {
    const { title, description = "", projectName = "" } = req.body;
    if (!title) return res.status(400).json({ message: "Task title is required." });

    const prompt = `
You write task details. Return a helpful task description with clear steps. 2-5 bullet points max.

Task title: ${title}
Project: ${projectName}
Notes: ${description}
    `.trim();

    const content = await callGemini(prompt);
    res.json({ suggestion: content });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
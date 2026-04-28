const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const callOpenAI = async (messages) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in environment");
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
};

exports.generateProjectDescription = async (req, res) => {
  try {
    const { name, description = "" } = req.body;
    if (!name) return res.status(400).json({ message: "Project name is required." });

    const content = await callOpenAI([
      {
        role: "system",
        content:
          "You improve project descriptions. Return a concise, professional description (2-4 sentences).",
      },
      {
        role: "user",
        content: `Project name: ${name}\nNotes: ${description}`,
      },
    ]);

    res.json({ description: content });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateTaskSuggestion = async (req, res) => {
  try {
    const { title, description = "", projectName = "" } = req.body;
    if (!title) return res.status(400).json({ message: "Task title is required." });

    const content = await callOpenAI([
      {
        role: "system",
        content:
          "You write task details. Return a helpful task description with clear steps. 2-5 bullet points max.",
      },
      {
        role: "user",
        content: `Task title: ${title}\nProject: ${projectName}\nNotes: ${description}`,
      },
    ]);

    res.json({ suggestion: content });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
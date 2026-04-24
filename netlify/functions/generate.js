const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are an expert n8n workflow architect. Your ONLY output is valid n8n workflow JSON — no explanations, no markdown, no backticks, just raw JSON.

Generate complete, importable n8n workflow JSON based on the user's description. The JSON must follow n8n's exact schema.

Rules:
1. Output ONLY valid JSON, nothing else
2. Use real n8n node types (n8n-nodes-base.gmail, n8n-nodes-base.slack, etc.)
3. Include proper connections between all nodes
4. Set reasonable default parameters
5. Always start with a trigger node (webhook, schedule, emailTrigger, etc.)
6. Include error handling where appropriate
7. Use descriptive node names in the user's language

Example structure:
{
  "name": "Workflow Name",
  "nodes": [
    {
      "parameters": {},
      "id": "uuid-here",
      "name": "Node Name",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    }
  ],
  "connections": {
    "Node Name": {
      "main": [[{"node": "Next Node", "type": "main", "index": 0}]]
    }
  },
  "active": false,
  "settings": {"executionOrder": "v1"},
  "versionId": "1",
  "meta": {"templateCredsSetupCompleted": true},
  "id": "workflow-id",
  "tags": []
}`;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Rate limiting via simple token check
  const authHeader = event.headers["x-session-token"];
  if (!authHeader) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { prompt, language = "fr" } = body;

  if (!prompt || typeof prompt !== "string" || prompt.length < 10 || prompt.length > 2000) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid prompt" }) };
  }

  const userMessage = language === "fr"
    ? `Génère un workflow n8n pour: ${prompt}`
    : `Generate an n8n workflow for: ${prompt}`;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Anthropic error:", err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: "AI service error" }) };
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || "";

    // Validate it's JSON
    let workflowJson;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      workflowJson = JSON.parse(cleaned);
    } catch {
      return { statusCode: 422, headers, body: JSON.stringify({ error: "Failed to parse workflow JSON", raw: rawText }) };
    }

    // Generate human summary
    const summaryResp = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [{
          role: "user",
          content: language === "fr"
            ? `En 2-3 phrases simples en français, explique ce que fait ce workflow n8n à un utilisateur non-technique. JSON: ${JSON.stringify(workflowJson).slice(0, 1000)}`
            : `In 2-3 simple sentences in English, explain what this n8n workflow does for a non-technical user. JSON: ${JSON.stringify(workflowJson).slice(0, 1000)}`
        }],
      }),
    });

    const summaryData = await summaryResp.json();
    const summary = summaryData.content?.[0]?.text || "";

    // Extract apps needed
    const apps = [...new Set(
      (workflowJson.nodes || [])
        .map(n => n.type?.replace("n8n-nodes-base.", "").replace("@n8n/n8n-nodes-langchain.", "AI: "))
        .filter(t => t && t !== "start" && t !== "set" && t !== "code")
    )];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ workflow: workflowJson, summary, apps, name: workflowJson.name || "My Workflow" }),
    };

  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal server error" }) };
  }
};

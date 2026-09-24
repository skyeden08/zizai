import { createModule } from "./contract.js";

/**
 * Gemini provider module.
 * The Auth module owns credential storage; Gemini only reads the current key
 * through its contract and never caches a readiness result.
 */
export function createGeminiModule({ auth, config } = {}) {
  if (!auth || !config?.geminiModel) throw new Error("Gemini requires auth and config.geminiModel");

  const getKey = () => auth.call("getGeminiKey");
  const toContents = history => [
    {
      role: "user",
      parts: [{ text: "（ZIZAI 模組能力）需要操作 repository 時，僅輸出 [github_call]{\"action\":\"read\",\"path\":\"README.md\"}[/github_call]。" }]
    },
    ...(Array.isArray(history) ? history : [])
  ].map(item => ({
    role: ["model", "ai", "assistant"].includes(item.role) ? "model" : "user",
    parts: [{ text: item.text || "" }]
  }));

  const generate = async history => {
    const key = await getKey();
    if (!key) return "尚未設定 Gemini API Key，請先登入並連接密鑰";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: toContents(history) })
      }
    );

    if (!response.ok) return `Gemini 錯誤：${(await response.text()).slice(0, 200)}`;
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "（無回應）";
  };

  return createModule({
    id: "gemini",
    capabilities: ["generate", "chat"],
    lifecycle: {},
    ready: async () => Boolean(await getKey()),
    initialize: async () => {
      // Credentials are initialized by Auth/Drive. Readiness is evaluated
      // dynamically after initialization and after credential restoration.
      await getKey();
    },
    actions: {
      generate,
      chat: generate
    }
  });
}

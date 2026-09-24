import { createModule } from "./contract.js";

export function createGeminiModule({ auth, config } = {}) {
  return createModule({
    id: "gemini",
    capabilities: ["generate"],
    ready: async () => Boolean(await auth.call("getGeminiKey")),
    actions: {
      generate: async history => {
        const key = await auth.call("getGeminiKey");
        if (!key) return "尚未設定 Gemini API Key，請先登入並連接密鑰";
        const contents = [{ role: "user", parts: [{ text: "（ZIZAI 模組能力）需要操作 repository 時，僅輸出 [github_call]{\"action\":\"read\",\"path\":\"README.md\"}[/github_call]。" }] }, ...history]
          .map(item => ({ role: ["model", "ai", "assistant"].includes(item.role) ? "model" : "user", parts: [{ text: item.text || "" }] }));
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${encodeURIComponent(key)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents })
        });
        if (!response.ok) return `Gemini 錯誤：${(await response.text()).slice(0, 200)}`;
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "（無回應）";
      }
    }
  });
}

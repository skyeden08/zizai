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
        const contents = [{
          role: "user",
          parts: [{ text: "（ZIZAI 模組能力）若需要操作 repository，請依使用者實際需求輸出合法的 [github_call] JSON 呼叫，格式為 [github_call]{\"module\":\"github\",\"action\":\"read 或 write\",\"path\":\"目標路徑\",\"content\":\"寫入內容（僅 write 需要）\",\"message\":\"commit 訊息（僅 write 需要）\"}[/github_call]。不要固定指定 README.md；若不需要操作 module，直接正常回答。" }]
        }, ...history]
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

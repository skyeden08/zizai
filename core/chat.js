import { createModule } from "./contract.js";

export function createChatModule({ registry, ui, state } = {}) {
  return createModule({
    id: "chat",
    capabilities: ["send", "history"],
    ready: async () => Boolean(await registry.get("gemini")?.ready),
    actions: {
      send: async text => {
        if (!text?.trim()) return null;
        const history = [{ role: "user", text: text.trim() }];
        for (let i = 0; i < 3; i++) {
          const reply = await registry.call("gemini", "generate", history);
          const request = await registry.call("bridge", "parse", reply);
          if (!request) return reply;
          try {
            const result = await registry.call("bridge", "dispatch", request);
            await ui.call("renderResult", `ZIZAI · ${request.module || "GitHub"} 模組`, JSON.stringify(result).slice(0, 500));
            history.push(
              { role: "model", text: reply },
              { role: "user", text: `（ZIZAI 模組執行結果）${JSON.stringify(result)}` }
            );
          } catch (error) {
            await ui.call("renderResult", "ZIZAI · 模組錯誤", error.message);
            history.push(
              { role: "model", text: reply },
              { role: "user", text: `（ZIZAI 模組執行錯誤）${error.message}` }
            );
          }
        }
        return "模組調用已達本次循環上限，請繼續下達指令。";
      }
    }
  });
}

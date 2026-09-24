import { createModule } from "./contract.js";

export function createChatModule({ registry, ui, state } = {}) {
  return createModule({
    id: "chat",
    capabilities: ["send", "history"],
    ready: async () => Boolean(await registry.get("gemini")?.ready),
    actions: {
      send: async text => {
        if (!text.trim()) return;
        const history = [{ role: "user", text }];
        for (let i = 0; i < 3; i++) {
          const reply = await registry.call("gemini", "generate", history);
          const result = reply?.trim?.() || reply;
          if (result) return result;
        }
        return "（無回應）";
      }
    }
  });
}

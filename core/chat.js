import { createModule } from "./contract.js";

export function createChatModule({ registry, ui, state } = {}) {
  return createModule({ id: "chat", capabilities: ["send", "history"], ready: () => registry.get("gemini")?.ready, actions: {
    send: async text => { if (!text.trim()) return; const history = [{ role: "user", text }]; for (let i = 0; i < 3; i++) { const reply = await registry.call("gemini", "generate", history); const request = await registry.call("bridge", "parse", reply); if (!request) { ui.call("renderState", await state.call("get")); return reply; } const result = await registry.call("bridge", "dispatch", request); history.push({ role: "model", text: reply }, { role: "user", text: `（模組結果）${JSON.stringify(result)}` }); } return "模組調用已達本次循環上限，請繼續下達指令。"; }
  }});
}

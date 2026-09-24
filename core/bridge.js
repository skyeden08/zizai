import { createModule } from "./contract.js";

export function createBridgeModule({ registry } = {}) {
  const parse = text => { const start = text.indexOf("[github_call]"), end = text.indexOf("[/github_call]"); if (start < 0 || end < start) return null; try { return JSON.parse(text.slice(start + 13, end).trim()); } catch { return { error: "GitHub 請求格式錯誤" }; } };
  return createModule({ id: "bridge", capabilities: ["dispatch"], ready: () => true, actions: { parse, dispatch: async request => { if (!request) return null; if (request.error) throw new Error(request.error); return registry.call(request.module || "github", request.action, request.path, request.content || "", request.message || "ZIZAI 模組寫入"); } } });
}

import { createModule } from "./contract.js";

export function createBridgeModule({ registry } = {}) {
  const parse = text => {
    const start = text.indexOf("[github_call]"), end = text.indexOf("[/github_call]");
    if (start < 0 || end < start) return null;
    try { return JSON.parse(text.slice(start + 14, end).trim()); }
    catch (error) { return null; }
  };

  return createModule({
    id: "bridge",
    capabilities: ["dispatch"],
    ready: () => true,
    actions: {
      parse,
      dispatch: async request => {
        if (!request) return null;
        if (request.error) throw new Error(request.error);
        const module = registry.get(request.module || "github");
        if (!module) throw new Error(`找不到可調用模組：${request.module || "github"}`);
        const action = request.action || "read";
        const args = request.args || [];
        return module.call(action, ...args);
      }
    }
  });
}

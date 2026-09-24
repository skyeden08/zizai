import { createModule } from "./contract.js";

export function createBridgeModule({ registry } = {}) {
  const parse = text => {
    const value = String(text || "");
    const start = value.indexOf("[github_call]");
    const end = value.indexOf("[/github_call]", start + 13);
    if (start < 0 || end < 0) return null;
    try { return JSON.parse(value.slice(start + 13, end).trim()); }
    catch (error) { return { error: "模組呼叫格式錯誤" }; }
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
        const moduleId = request.module || "github";
        const action = request.action || "read";
        if (!registry.get(moduleId)) throw new Error(`找不到可調用模組：${moduleId}`);
        const args = Array.isArray(request.args)
          ? request.args
          : action === "read"
            ? [request.path]
            : [request.path, request.content || "", request.message || "ZIZAI 模組寫入"];
        return registry.call(moduleId, action, ...args);
      }
    }
  });
}

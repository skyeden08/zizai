import { createModule } from "./contract.js";

export function createStateModule({ github, drive, config } = {}) {
  let state = { 現況: { 定位AI: null, 最後更新: null }, 歷程: [], 主題: { 目前: "", 歷史: [] }, 檔案: [] };
  let sha = null;
  const normalize = value => ({ ...state, ...value, 現況: { ...state.現況, ...(value?.現況 || {}) }, 主題: { ...state.主題, ...(value?.主題 || {}) }, 檔案: value?.檔案 || state.檔案 || [], 歷程: value?.歷程 || state.歷程 || [] });
  const module = createModule({ id: "state", capabilities: ["read", "write", "subscribe"], ready: () => github.ready, actions: {
    get: () => structuredClone(state),
    set: value => { state = normalize(value); return module.call("get"); },
    update: patch => { state = normalize(patch); return module.call("get"); },
    load: async () => { const data = await github.call("read", config.statePath); sha = data.sha; state = normalize(JSON.parse(data.content)); return module.call("get"); },
    save: async () => { const result = await github.call("write", config.statePath, JSON.stringify(state, null, 2), "update zizai state"); sha = result.sha || sha; if (drive.ready) await drive.call("writeJson", config.statePath, state); return module.call("get"); }
  }});
  return module;
}

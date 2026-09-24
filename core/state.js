import { createModule } from "./contract.js";

export function createStateModule({ github, drive, config } = {}) {
  let state = { 現況: { 定位AI: null, 最後更新: null }, 歷程: [], 主題: { 目前: "", 歷史: [] }, 檔案: [] };
  const clone = value => typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  const normalize = value => ({ ...state, ...value, 現況: { ...state.現況, ...(value?.現況 || {}) }, 主題: { ...state.主題, ...(value?.主題 || {}) }, 檔案: value?.檔案 || state.檔案 || [], 歷程: value?.歷程 || state.歷程 || [] });
  const module = createModule({
    id: "state", capabilities: ["read", "write", "subscribe"],
    ready: async () => await github.ready,
    actions: {
      get: () => clone(state),
      set: value => { state = normalize(value); return clone(state); },
      update: patch => { state = normalize(patch); return clone(state); },
      load: async () => { const data = await github.call("read", config.statePath); state = normalize(JSON.parse(data.content)); return clone(state); },
      save: async () => { await github.call("write", config.statePath, JSON.stringify(state, null, 2), "update zizai state"); if (await drive.ready) await drive.call("writeJson", config.statePath, state); return clone(state); }
    }
  });
  return module;
}

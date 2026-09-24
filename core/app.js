import { ModuleRegistry } from "./registry.js";
import { CONFIG } from "./config.js";
import { waitForGoogle } from "./google-ready.js";
import { createAuthModule } from "./auth.js";
import { createDriveModule } from "./drive.js";
import { createGitHubModule } from "./github.js";
import { createGeminiModule } from "./gemini.js";
import { createStateModule } from "./state.js";
import { createBridgeModule } from "./bridge.js";
import { createUIModule } from "./ui.js";
import { createChatModule } from "./chat.js";

export async function bootstrap() {
  const google = await waitForGoogle();
  const registry = new ModuleRegistry({ config: CONFIG });
  const ui = createUIModule();
  let drive;
  const refreshState = async () => { try { const current = await state.call("get"); await ui.call("renderState", current); } catch (error) { console.error("State render failed", error); } };
  let state;
  const auth = createAuthModule({ google, clientId: CONFIG.googleClientId, onStatus: (ok, text) => ui.call("setStatus", "githubStatus", text, ok), onUser: async user => { await ui.call("setUser", user); await drive.call("authorize"); await auth.call("restoreFromDrive", drive); await state.call("load"); await refreshState(); await ui.call("setStatus", "geminiStatus", "已接入", true); }, onSignedOut: () => ui.call("setSignedOut") });
  drive = createDriveModule({ auth, config: CONFIG, onStatus: (ok, text) => ui.call("setStatus", "driveStatus", text, ok) });
  const github = createGitHubModule({ auth, config: CONFIG });
  const gemini = createGeminiModule({ auth, config: CONFIG });
  state = createStateModule({ github, drive, config: CONFIG });
  const bridge = createBridgeModule({ registry });
  const chat = createChatModule({ registry, ui, state });
  [ui, auth, drive, github, gemini, state, bridge, chat].forEach(module => registry.register(module));
  await ui.call("mount", {
    signOut: () => auth.call("signOut"), connectDrive: () => drive.call("authorize"),
    sendMessage: async text => { try { const reply = await chat.call("send", text); if (reply) { await ui.call("addBubble", "ai", reply); await ui.call("renderResult", "Gemini 回應", reply.slice(0, 200)); } } catch (error) { console.error(error); await ui.call("addBubble", "ai", `錯誤：${error.message}`); } },
    setTopic: async text => { const value = text.trim(); if (!value) return; const current = await state.call("get"); current.主題.目前 = value; if (!current.主題.歷史.includes(value)) current.主題.歷史.unshift(value); current.主題.歷史 = current.主題.歷史.slice(0, 20); await state.call("set", current); await state.call("save"); await refreshState(); },
    fileSelected: async file => { if (!file) return; try { const result = await drive.call("upload", file); const current = await state.call("get"); current.檔案.unshift({ id: `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, 名稱: file.name, 類型: file.type || "未知", 大小: file.size, 上傳時間: new Date().toISOString(), 狀態: "可用", driveId: result.id }); await state.call("set", current); await state.call("save"); await refreshState(); } catch (error) { console.error(error); await ui.call("addBubble", "ai", `檔案上傳失敗：${error.message}`); } },
    fileRemoved: async file => { try { if (file.driveId) await drive.call("remove", file.driveId); const current = await state.call("get"); current.檔案 = current.檔案.filter(item => item.id !== file.id); await state.call("set", current); await state.call("save"); await refreshState(); } catch (error) { console.error("File removal failed", error); } }
  });
  const results = await registry.initializeAll();
  globalThis.ZIZAI = Object.freeze({ registry, ready: results });
  return globalThis.ZIZAI;
}

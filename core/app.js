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
  const registry = new ModuleRegistry({ config: CONFIG });
  const ui = createUIModule();
  let auth;
  let drive;
  let state;

  const safe = (label, fn) => Promise.resolve().then(fn).catch(async error => {
    console.error(label, error);
    try { await ui.call("setStatus", "githubStatus", `${label} 失敗`, false); } catch {}
  });
  const refreshState = () => safe("State render", async () => ui.call("renderState", await state.call("get")));

  await ui.call("mount", {
    signOut: () => safe("Sign out", () => auth?.call("signOut")),
    connectDrive: () => safe("Drive authorize", () => registry.call("drive", "authorize")),
    sendMessage: async text => {
      try {
        const reply = await registry.call("chat", "send", text);
        if (reply) {
          await ui.call("addBubble", "ai", reply);
          await ui.call("renderResult", "Gemini 回應", reply.slice(0, 200));
        }
      } catch (error) {
        await ui.call("addBubble", "ai", `錯誤：${error.message}`);
      }
    },
    setTopic: async text => {
      const value = text.trim();
      if (!value || !state) return;
      const current = await state.call("get");
      current.主題.目前 = value;
      if (!current.主題.歷史.includes(value)) current.主題.歷史.unshift(value);
      current.主題.歷史 = current.主題.歷史.slice(0, 20);
      await state.call("set", current);
      await state.call("save");
      await refreshState();
    },
    fileSelected: async file => {
      if (!file) return;
      try {
        const result = await registry.call("drive", "upload", file);
        const current = await state.call("get");
        current.檔案.unshift({
          id: `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
          名稱: file.name,
          類型: file.type || "未知",
          大小: file.size,
          上傳時間: new Date().toISOString(),
          狀態: "可用",
          driveId: result.id
        });
        await state.call("set", current);
        await state.call("save");
        await refreshState();
      } catch (error) {
        await ui.call("addBubble", "ai", `檔案上傳失敗：${error.message}`);
      }
    },
    fileRemoved: async file => {
      try {
        if (file.driveId) await registry.call("drive", "remove", file.driveId);
        const current = await state.call("get");
        current.檔案 = current.檔案.filter(item => item.id !== file.id);
        await state.call("set", current);
        await state.call("save");
        await refreshState();
      } catch (error) {
        await ui.call("addBubble", "ai", `檔案移除失敗：${error.message}`);
      }
    }
  });

  let google;
  try {
    google = await waitForGoogle();
  } catch (error) {
    await ui.call("setStatus", "githubStatus", "Google 未就緒：登入功能不可用", false);
    console.error("Google Identity Services unavailable", error);
  }

  auth = createAuthModule({
    google,
    clientId: CONFIG.googleClientId,
    onStatus: (ok, text) => ui.call("setStatus", "githubStatus", text, ok),
    onUser: async user => {
      await ui.call("setUser", user);
      try {
        await registry.call("drive", "authorize");
        await auth.call("restoreFromDrive", drive);
        if (await registry.isReady("github")) await state.call("load");
        await refreshState();
        const githubReady = await registry.isReady("github");
        const geminiReady = await registry.isReady("gemini");
        await ui.call("setStatus", "githubStatus", githubReady ? "GitHub 密鑰已載入" : "GitHub 未接入", githubReady);
        await ui.call("setStatus", "geminiStatus", geminiReady ? "Gemini 已接入" : "Gemini 未接入", geminiReady);
      } catch (error) {
        console.error("Post-login restore failed", error);
        await ui.call("setStatus", "driveStatus", `Drive：${error.message}`, false);
      }
    },
    onSignedOut: () => ui.call("setSignedOut")
  });

  drive = createDriveModule({ auth, config: CONFIG, onStatus: (ok, text) => ui.call("setStatus", "driveStatus", text, ok) });
  const github = createGitHubModule({ auth, config: CONFIG });
  const gemini = createGeminiModule({ auth, config: CONFIG });
  state = createStateModule({ github, drive, config: CONFIG });
  const bridge = createBridgeModule({ registry });
  const chat = createChatModule({ registry, ui, state });

  [auth, drive, github, gemini, state, bridge, chat].forEach(module => registry.register(module));
  const results = await registry.initializeAll();
  globalThis.ZIZAI = Object.freeze({ registry, ready: results });
  return globalThis.ZIZAI;
}

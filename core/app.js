import { ModuleRegistry } from "./registry.js";
import { CONFIG } from "./config.js";
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

  const safe = (label, fn) => Promise.resolve().then(fn).catch(error => {
    console.error(label, error);
    ui.call("setStatus", "githubStatus", label + " 失敗", false).catch(() => {});
  });

  const refreshState = () => safe("State render", async () => {
    if (state) await ui.call("renderState", await state.call("get"));
  });

  // UI first. Nothing external is allowed to block the page shell.
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
        await ui.call("addBubble", "ai", "錯誤：" + error.message);
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
      if (!file || !state) return;
      try {
        const result = await registry.call("drive", "upload", file);
        const current = await state.call("get");
        current.檔案.unshift({
          id: "f" + Date.now().toString(36),
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
        await ui.call("addBubble", "ai", "檔案上傳失敗：" + error.message);
      }
    },
    fileRemoved: async file => {
      try {
        if (file?.driveId) await registry.call("drive", "remove", file.driveId);
        const current = await state.call("get");
        current.檔案 = current.檔案.filter(item => item.id !== file.id);
        await state.call("set", current);
        await state.call("save");
        await refreshState();
      } catch (error) {
        await ui.call("addBubble", "ai", "檔案移除失敗：" + error.message);
      }
    }
  });

  // Create and register every module independently.
  const google = globalThis.google;
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
        await ui.call("setStatus", "githubStatus",
          await registry.isReady("github") ? "GitHub 密鑰已載入" : "GitHub 未接入",
          await registry.isReady("github"));
        await ui.call("setStatus", "geminiStatus",
          await registry.isReady("gemini") ? "Gemini 已接入" : "Gemini 未接入",
          await registry.isReady("gemini"));
      } catch (error) {
        console.error("Post-login restore failed", error);
        await ui.call("setStatus", "driveStatus", "Drive：" + error.message, false);
      }
    },
    onSignedOut: () => ui.call("setSignedOut")
  });

  drive = createDriveModule({
    auth,
    config: CONFIG,
    onStatus: (ok, text) => ui.call("setStatus", "driveStatus", text, ok)
  });
  const github = createGitHubModule({ auth, config: CONFIG });
  const gemini = createGeminiModule({ auth, config: CONFIG });
  state = createStateModule({ github, drive, config: CONFIG });
  const bridge = createBridgeModule({ registry });
  const chat = createChatModule({ registry, ui, state });

  [auth, drive, github, gemini, state, bridge, chat].forEach(module => registry.register(module));

  // Initialization is isolated: one module failing cannot prevent the others.
  const results = await registry.initializeAll();
  globalThis.ZIZAI = Object.freeze({ registry, ready: results });

  // Google GIS is optional at startup. Attach it later if it arrives late.
  if (!google?.accounts?.id) {
    const started = Date.now();
    const waitForGoogle = async () => {
      while (!globalThis.google?.accounts?.id && Date.now() - started < 10000) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (!globalThis.google?.accounts?.id) {
        await ui.call("setStatus", "githubStatus", "Google 未就緒：登入功能不可用", false);
        return;
      }
      try {
        await registry.call("auth", "attachGoogle", globalThis.google);
        await auth.initialize();
      } catch (error) {
        console.error("Google 登入初始化失敗", error);
        await ui.call("setStatus", "githubStatus", "Google 登入初始化失敗", false);
      }
    };
    waitForGoogle();
  }

  return globalThis.ZIZAI;
}

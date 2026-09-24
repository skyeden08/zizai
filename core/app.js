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

export async function bootstrap({ google = globalThis.google } = {}) {
  const registry = new ModuleRegistry({ config: CONFIG });
  const auth = createAuthModule({ google, clientId: CONFIG.googleClientId, onStatus: (ok, text) => document.getElementById("githubStatus") && (document.getElementById("githubStatus").textContent = text) });
  const drive = createDriveModule({ auth, config: CONFIG, onStatus: (ok, text) => document.getElementById("driveStatus") && (document.getElementById("driveStatus").textContent = text) });
  const github = createGitHubModule({ auth, config: CONFIG });
  const gemini = createGeminiModule({ auth, config: CONFIG });
  const state = createStateModule({ github, drive, config: CONFIG });
  const ui = createUIModule({ config: CONFIG });
  registry.register(auth).register(drive).register(github).register(gemini).register(state).register(ui);
  const bridge = createBridgeModule({ registry }); registry.register(bridge);
  const chat = createChatModule({ registry, ui, state }); registry.register(chat);
  await ui.call("mount", { signOut: () => auth.call("signOut"), sendMessage: async text => { try { const reply = await chat.call("send", text); if (reply) alert(reply); } catch (error) { console.error(error); } }, fileSelected: async file => { if (!file) return; try { const result = await drive.call("upload", file); const current = await state.call("get"); current.檔案.unshift({ 名稱: file.name, 大小: file.size, 狀態: "可用", driveId: result.id }); await state.call("set", current); await state.call("save"); } catch (error) { console.error(error); } } });
  await auth.initialize();
  const initialized = await registry.initializeAll();
  globalThis.ZIZAI = Object.freeze({ registry, ready: initialized });
  return globalThis.ZIZAI;
}

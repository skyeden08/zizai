import { createModule } from "./contract.js";

export function createAuthModule({ google = globalThis.google, clientId, onUser, onStatus } = {}) {
  let user = null;
  let driveToken = null;
  let githubToken = null;
  let geminiKey = null;

  const notify = (ok, text) => onStatus?.(ok, text);
  const module = createModule({
    id: "auth",
    capabilities: ["signin", "signout", "credentials"],
    ready: () => Boolean(google?.accounts?.id),
    actions: {
      getUser: () => user,
      getGithubToken: () => githubToken,
      getGeminiKey: () => geminiKey,
      getDriveToken: () => driveToken,
      setGithubToken: token => { githubToken = token; },
      setGeminiKey: key => { geminiKey = key; },
      setDriveToken: token => { driveToken = token; },
      signOut: () => {
        user = null;
        driveToken = githubToken = geminiKey = null;
        google?.accounts?.id?.disableAutoSelect?.();
        notify(false, "尚未登入");
      }
    },
    initialize: async () => {
      if (!google?.accounts?.id) throw new Error("Google Identity Services is unavailable");
      google.accounts.id.initialize({
        client_id: clientId,
        auto_select: true,
        callback: credential => {
          try {
            const part = credential.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(part + "=".repeat((4 - part.length % 4) % 4)), c => c.charCodeAt(0))));
            user = payload;
            notify(true, "已登入");
            onUser?.(payload);
          } catch (error) {
            notify(false, "登入資料無效");
            console.error(error);
          }
        }
      });
      const target = document.getElementById("signinBtn");
      if (target) google.accounts.id.renderButton(target, { theme: "outline", size: "medium", text: "signin", shape: "pill" });
      google.accounts.id.prompt();
    }
  });
  return module;
}

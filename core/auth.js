import { createModule } from "./contract.js";

export function createAuthModule({ google = globalThis.google, clientId, onUser, onStatus, onSignedOut } = {}) {
  let user = null;
  let driveToken = null;
  let githubToken = null;
  let geminiKey = null;
  const notify = (ok, text) => onStatus?.(ok, text);
  const parseCredential = credential => {
    const part = credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = part + "=".repeat((4 - part.length % 4) % 4);
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded), c => c.charCodeAt(0))));
  };
  return createModule({
    id: "auth",
    capabilities: ["signin", "signout", "credentials", "restore"],
    ready: () => Boolean(google?.accounts?.id),
    actions: {
      getUser: () => user,
      getGithubToken: () => githubToken,
      getGeminiKey: () => geminiKey,
      getDriveToken: () => driveToken,
      setGithubToken: token => { githubToken = token; return token; },
      setGeminiKey: key => { geminiKey = key; return key; },
      setDriveToken: token => { driveToken = token; return token; },
      restoreFromDrive: async drive => {
        const [github, gemini] = await Promise.all([
          drive.call("readJson", "zizai_github_token.json"),
          drive.call("readJson", "zizai_gemini_key.json")
        ]);
        if (github?.token) githubToken = github.token;
        if (gemini?.key) geminiKey = gemini.key;
        return { github: Boolean(github?.token), gemini: Boolean(gemini?.key) };
      },
      signOut: () => {
        user = null;
        driveToken = githubToken = geminiKey = null;
        google?.accounts?.id?.disableAutoSelect?.();
        notify(false, "尚未登入");
        onSignedOut?.();
      }
    },
    initialize: async () => {
      if (!google?.accounts?.id) throw new Error("Google Identity Services is unavailable");
      google.accounts.id.initialize({ client_id: clientId, auto_select: true, callback: credential => {
        try {
          user = parseCredential(credential.credential);
          notify(true, "已登入");
          Promise.resolve(onUser?.(user)).catch(error => { console.error("Login restore failed", error); notify(true, "已登入（等待雲端資料）"); });
        } catch (error) {
          notify(false, "登入資料無效");
          console.error(error);
        }
      }});
      const target = document.getElementById("signinBtn");
      if (target) google.accounts.id.renderButton(target, { theme: "outline", size: "medium", text: "signin", shape: "pill" });
      google.accounts.id.prompt();
    }
  });
}

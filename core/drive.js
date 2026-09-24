import { createModule } from "./contract.js";

export function createDriveModule({ auth, config, onStatus } = {}) {
  let fileId = null; let tokenClient = null; let expiryTimer = null;
  const token = () => auth.call("getDriveToken");
  const request = async () => {
    if (!globalThis.google?.accounts?.oauth2) throw new Error("Google OAuth is unavailable");
    tokenClient ||= google.accounts.oauth2.initTokenClient({ client_id: config.googleClientId, scope: config.driveScope, callback: () => {} });
    return new Promise((resolve, reject) => {
      tokenClient.callback = response => {
        if (response.error) { onStatus?.(false, "授權失敗"); reject(new Error(response.error)); return; }
        auth.call("setDriveToken", response.access_token); clearTimeout(expiryTimer);
        expiryTimer = setTimeout(() => { auth.call("setDriveToken", null); onStatus?.(false, "備份逾時"); }, ((response.expires_in || 3600) - 60) * 1000);
        onStatus?.(true, "備份已連線"); resolve(response.access_token);
      };
      tokenClient.requestAccessToken({ prompt: "" });
    });
  };
  const api = async (url, options = {}) => { const t = token(); if (!t) throw new Error("Drive 尚未連線"); const response = await fetch(url, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${t}` } }); if (!response.ok) throw new Error(`Drive ${response.status}`); return response; };
  return createModule({
    id: "drive", capabilities: ["authorize", "read", "write", "upload", "delete"],
    ready: () => Boolean(token()),
    actions: {
      authorize: request,
      find: async name => (await (await api(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${name}' and trashed=false`)}&fields=files(id,name)`)).json()).files || [],
      readJson: async name => { const files = await module.call("find", name); if (!files[0]) return null; return (await (await api(`https://www.googleapis.com/drive/v3/files/${files[0].id}?alt=media`)).json()); },
      writeJson: async (name, value) => { const form = new FormData(); form.append("metadata", new Blob([JSON.stringify({ name, mimeType: "application/json" })], { type: "application/json" })); form.append("file", new Blob([JSON.stringify(value)], { type: "application/json" })); return (await api("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", { method: "POST", body: form })).json(); },
      upload: async file => { const form = new FormData(); form.append("metadata", new Blob([JSON.stringify({ name: file.name, mimeType: file.type || "application/octet-stream" })], { type: "application/json" })); form.append("file", file); return (await api("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", { method: "POST", body: form })).json(); },
      remove: async id => api(`https://www.googleapis.com/drive/v3/files/${id}`, { method: "DELETE" })
    },
    initialize: async () => {}
  });
  function noop() {}
}

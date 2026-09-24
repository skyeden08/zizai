import { createModule } from "./contract.js";

export function createGitHubModule({ auth, config } = {}) {
  const base = `https://api.github.com/repos/${config.repo}/contents/`;
  const request = async (path, options = {}) => { const token = await auth.call("getGithubToken"); if (!token) throw new Error("GitHub 尚未接入"); const response = await fetch(base + path, { ...options, headers: { Authorization: `token ${token}`, ...(options.headers || {}) } }); if (!response.ok) throw new Error(`GitHub ${response.status}`); return response.json(); };
  const utf8ToBase64 = text => btoa(String.fromCharCode(...new TextEncoder().encode(text)));
  const base64ToUtf8 = text => new TextDecoder().decode(Uint8Array.from(atob(text), c => c.charCodeAt(0)));
  return createModule({ id: "github", capabilities: ["read", "write"], ready: () => Boolean(auth.ready && auth.call("getGithubToken")), actions: {
    read: async path => { const data = await request(path); return { path, sha: data.sha, content: base64ToUtf8(data.content.replace(/\n/g, "")) }; },
    write: async (path, content, message = "ZIZAI 更新 GitHub") => { let sha; try { sha = (await request(path)).sha; } catch {} const body = { message, content: utf8ToBase64(content), ...(sha ? { sha } : {}) }; const data = await request(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return { path, sha: data.content?.sha }; }
  }});
}

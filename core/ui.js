import { createModule } from "./contract.js";

export function createUIModule({ config } = {}) {
  let callbacks = {};
  const load = async (id, path) => { const response = await fetch(path, { cache: "no-store" }); if (!response.ok) throw new Error(`UI module load failed: ${path}`); const html = await response.text(); const target = document.getElementById(id); if (!target) throw new Error(`UI mount missing: ${id}`); target.innerHTML = html; return target; };
  return createModule({ id: "ui", capabilities: ["mount", "events"], ready: () => Boolean(document), actions: {
    mount: async events => { callbacks = events || {}; const header = await load("uiHeader", "ui/modules/header.html"); const layout = document.getElementById("uiLayout"); const fragments = await Promise.all([["aux", "ui/modules/aux.html"], ["chat", "ui/modules/chat.html"], ["view", "ui/modules/view.html"]].map(([id, path]) => fetch(path).then(r => r.text()).then(html => [id, html]))); fragments.forEach(([id, html]) => layout.insertAdjacentHTML("beforeend", html)); layout.insertAdjacentHTML("afterbegin", '<div class="resizer" data-left="aux" data-right="chat"></div>'); layout.insertAdjacentHTML("beforeend", '<div class="resizer" data-left="chat" data-right="view"></div>'); header.querySelector("#signoutAction")?.addEventListener("click", () => callbacks.signOut?.()); document.querySelector("#chatSend")?.addEventListener("click", () => callbacks.sendMessage?.(document.querySelector("#chatInput")?.value || "")); document.querySelector("#fileInput")?.addEventListener("change", e => callbacks.fileSelected?.(e.target.files?.[0])); return true; },
    setStatus: (id, text, on = false) => { const element = document.getElementById(id); if (element) { element.textContent = text; element.classList.toggle("on", on); } },
    renderState: state => { const topic = document.getElementById("topicBadge"); if (topic && state.主題?.目前) topic.textContent = state.主題.目前; const status = document.getElementById("coreStatusText"); if (status) status.textContent = state.現況?.定位AI ? `定位AI：${state.現況.定位AI}` : "尚無現況資料"; }
  }});
}

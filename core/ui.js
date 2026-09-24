import { createModule } from "./contract.js";

export function createUIModule() {
  let callbacks = {};
  const byId = id => document.getElementById(id);
  const on = (id, event, handler) => byId(id)?.addEventListener(event, handler);
  const toggle = id => byId(id)?.classList.toggle("open");
  const load = async (mountId, path) => { const response = await fetch(path, { cache: "no-store" }); if (!response.ok) throw new Error(`UI module load failed: ${path}`); const target = byId(mountId); if (!target) throw new Error(`UI mount missing: ${mountId}`); target.innerHTML = await response.text(); return target; };
  return createModule({ id: "ui", capabilities: ["mount", "events", "render"], ready: () => Boolean(globalThis.document), actions: {
    mount: async events => {
      callbacks = events || {};
      const header = await load("uiHeader", "ui/modules/header.html");
      const layout = byId("uiLayout");
      if (!layout) throw new Error("UI layout mount missing");
      const fragments = await Promise.all([["ui/modules/aux.html"], ["ui/modules/chat.html"], ["ui/modules/view.html"]].map(([path]) => fetch(path, { cache: "no-store" }).then(async response => { if (!response.ok) throw new Error(`UI module load failed: ${path}`); return response.text(); })));
      fragments.forEach(html => layout.insertAdjacentHTML("beforeend", html));
      layout.insertAdjacentHTML("afterbegin", '<div class="resizer" data-left="aux" data-right="chat"></div>');
      layout.insertAdjacentHTML("beforeend", '<div class="resizer" data-left="chat" data-right="view"></div>');
      on("settingsToggle", "click", () => toggle("settingsWidget"));
      on("topicToggle", "click", () => toggle("topicWidget"));
      on("fileToggle", "click", () => toggle("fileWidget"));
      on("signoutAction", "click", () => callbacks.signOut?.());
      on("connectDriveBtn", "click", () => callbacks.connectDrive?.());
      on("chatSend", "click", () => callbacks.sendMessage?.(byId("chatInput")?.value || ""));
      on("chatInput", "keydown", event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); callbacks.sendMessage?.(event.target.value || ""); } });
      on("fileInput", "change", event => callbacks.fileSelected?.(event.target.files?.[0]));
      on("topicInput", "keydown", event => { if (event.key === "Enter") { event.preventDefault(); callbacks.setTopic?.(event.target.value || ""); } });
      document.addEventListener("click", event => ["topicWidget", "settingsWidget", "fileWidget"].forEach(id => { const widget = byId(id); if (widget?.classList.contains("open") && !widget.contains(event.target)) widget.classList.remove("open"); }));
      document.querySelectorAll(".fold-btn").forEach(button => button.addEventListener("click", () => byId(button.dataset.target)?.classList.toggle("collapsed")));
      return true;
    },
    setStatus: (id, text, onState = false) => { const element = byId(id); if (element) { element.textContent = text; element.classList.toggle("on", onState); } },
    setUser: user => { byId("signinBtn")?.style.setProperty("display", "none"); byId("userChip")?.style.setProperty("display", "flex"); if (byId("userAvatar")) byId("userAvatar").src = user.picture || ""; if (byId("userName")) byId("userName").textContent = user.name || user.email || ""; },
    renderState: state => { const topic = byId("topicBadge"); if (topic) topic.textContent = state.主題?.目前 || "設定主題"; const status = byId("coreStatusText"); if (status) status.textContent = state.現況?.定位AI ? `定位AI：${state.現況.定位AI}` : "尚無現況資料"; const badge = byId("fileBadge"); if (badge) badge.textContent = state.檔案?.length ? `檔案 (${state.檔案.length})` : "檔案"; },
    addBubble: (role, text) => { const scroll = byId("chatScroll"); if (!scroll) return; const div = document.createElement("div"); div.className = `bubble ${role}`; div.textContent = text; scroll.appendChild(div); scroll.scrollTop = scroll.scrollHeight; },
    renderResult: (title, detail) => { const body = byId("resultBody"); if (!body) return; body.querySelector(".empty-hint")?.remove(); const card = document.createElement("div"); card.className = "result-card"; card.innerHTML = `<h3>${title}</h3><p>${detail}</p>`; body.prepend(card); }
  }});
}

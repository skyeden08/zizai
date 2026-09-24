import { createModule } from "./contract.js";

export function createUIModule() {
  let callbacks = {};
  const byId = id => document.getElementById(id);
  const on = (id, event, handler) => byId(id)?.addEventListener(event, handler);
  const toggle = id => byId(id)?.classList.toggle("open");
  const load = async (mountId, path) => { const response = await fetch(path, { cache: "no-store" }); if (!response.ok) throw new Error(`UI module load failed: ${path}`); const target = byId(mountId); if (!target) throw new Error(`UI mount missing: ${mountId}`); target.innerHTML = await response.text(); return target; };
  const setStatus = (id, text, onState = false) => { const element = byId(id); if (!element) return; element.innerHTML = `<span class="dot ${onState ? "on" : ""}"></span>${text}`; };
  return createModule({ id: "ui", capabilities: ["mount", "events", "render"], ready: () => Boolean(globalThis.document), actions: {
    mount: async events => {
      callbacks = events || {};
      await load("uiHeader", "ui/modules/header.html");
      const layout = byId("uiLayout"); if (!layout) throw new Error("UI layout mount missing");
      const fragments = await Promise.all(["ui/modules/aux.html", "ui/modules/chat.html", "ui/modules/view.html"].map(async path => { const response = await fetch(path, { cache: "no-store" }); if (!response.ok) throw new Error(`UI module load failed: ${path}`); return response.text(); }));
      fragments.forEach(html => layout.insertAdjacentHTML("beforeend", html));
      layout.insertAdjacentHTML("afterbegin", '<div class="resizer" data-left="aux" data-right="chat"></div>');
      layout.insertAdjacentHTML("beforeend", '<div class="resizer" data-left="chat" data-right="view"></div>');
      on("settingsToggle", "click", () => toggle("settingsWidget")); on("topicToggle", "click", () => toggle("topicWidget")); on("fileToggle", "click", () => toggle("fileWidget"));
      on("signoutAction", "click", () => callbacks.signOut?.()); on("connectDriveBtn", "click", () => callbacks.connectDrive?.());
      on("chatSend", "click", () => { const input = byId("chatInput"); const value = input?.value || ""; if (input) input.value = ""; callbacks.sendMessage?.(value); });
      on("chatInput", "keydown", event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); const value = event.target.value || ""; event.target.value = ""; callbacks.sendMessage?.(value); } });
      on("fileUploadButton", "click", () => byId("fileInput")?.click()); on("fileInput", "change", event => { callbacks.fileSelected?.(event.target.files?.[0]); event.target.value = ""; });
      on("topicInput", "keydown", event => { if (event.key === "Enter") { event.preventDefault(); callbacks.setTopic?.(event.target.value || ""); event.target.value = ""; } });
      document.addEventListener("click", event => ["topicWidget", "settingsWidget", "fileWidget"].forEach(id => { const widget = byId(id); if (widget?.classList.contains("open") && !widget.contains(event.target)) widget.classList.remove("open"); }));
      document.querySelectorAll(".fold-btn").forEach(button => button.addEventListener("click", () => byId(button.dataset.target)?.classList.toggle("collapsed")));
      document.querySelectorAll(".aux-option-head").forEach(head => head.addEventListener("click", () => head.parentElement.classList.toggle("open")));
      document.querySelectorAll(".resizer").forEach(bar => bar.addEventListener("mousedown", event => { event.preventDefault(); const left = byId(bar.dataset.left), right = byId(bar.dataset.right), start = event.clientX, lw = left.getBoundingClientRect().width, rw = right.getBoundingClientRect().width; const move = e => { const dx = e.clientX - start; left.style.flex = `0 0 ${Math.max(40, lw + dx)}px`; if (right.id !== "chat") right.style.flex = `0 0 ${Math.max(40, rw - dx)}px`; }; const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); }; document.addEventListener("mousemove", move); document.addEventListener("mouseup", up); }));
      return true;
    },
    setStatus,
    setUser: user => { byId("signinBtn")?.style.setProperty("display", "none"); byId("userChip")?.style.setProperty("display", "flex"); if (byId("userAvatar")) byId("userAvatar").src = user?.picture || ""; if (byId("userName")) byId("userName").textContent = user?.name || user?.email || ""; byId("connectDriveBtn")?.style.setProperty("display", "inline-block"); },
    setSignedOut: () => { byId("signinBtn")?.style.setProperty("display", "flex"); byId("userChip")?.style.setProperty("display", "none"); },
    renderState: state => { const topic = byId("topicBadge"); if (topic) topic.textContent = state.主題?.目前 || "設定主題"; const status = byId("coreStatusText"); if (status) status.textContent = state.現況?.定位AI ? `定位AI：${state.現況.定位AI}` : "尚無現況資料"; const badge = byId("fileBadge"); if (badge) badge.textContent = state.檔案?.length ? `檔案 (${state.檔案.length})` : "檔案"; const list = byId("fileList"); if (list) { list.innerHTML = ""; (state.檔案 || []).filter(file => file.狀態 !== "已移除").forEach(file => { const item = document.createElement("div"); item.className = "file-item"; item.innerHTML = `<div class="file-info"><span class="file-name" title="${file.名稱}">${file.名稱}</span><span class="file-meta">${file.狀態 || "可用"}${file.大小 ? ` · ${file.大小} B` : ""}</span></div><button class="file-remove" data-id="${file.id || ""}" title="移除">✕</button>`; item.querySelector(".file-remove").addEventListener("click", () => callbacks.fileRemoved?.(file)); list.appendChild(item); }); if (!list.children.length) list.innerHTML = '<p class="empty-hint">尚無檔案</p>'; } },
    addBubble: (role, text) => { const scroll = byId("chatScroll"); if (!scroll) return; const div = document.createElement("div"); div.className = `bubble ${role}`; div.textContent = text; scroll.appendChild(div); scroll.scrollTop = scroll.scrollHeight; },
    renderResult: (title, detail) => { const body = byId("resultBody"); if (!body) return; body.querySelector(".empty-hint")?.remove(); const card = document.createElement("div"); card.className = "result-card"; card.innerHTML = `<h3>${title}</h3><p>${detail}</p>`; body.prepend(card); }
  }});
}

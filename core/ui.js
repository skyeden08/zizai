import { createModule } from "./contract.js";

export function createUIModule() {
  let callbacks = {};
  const byId = id => document.getElementById(id);
  const on = (id, event, handler) => byId(id)?.addEventListener(event, handler);
  const toggle = id => byId(id)?.classList.toggle("open");
  const load = async (mountId, path) => {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`UI module load failed: ${path}`);
    const target = byId(mountId);
    if (!target) throw new Error(`UI mount missing: ${mountId}`);
    target.innerHTML = await response.text();
  };
  const setStatus = (id, text, active = false) => {
    const element = byId(id);
    if (!element) return;
    element.innerHTML = `<span class="dot ${active ? "on" : ""}"></span>${text}`;
  };
  const renderFiles = files => {
    const list = byId("fileList");
    if (!list) return;
    list.replaceChildren();
    for (const file of (files || []).filter(item => item.狀態 !== "已移除")) {
      const item = document.createElement("div");
      item.className = "file-item";
      item.innerHTML = `<div class="file-info"><span class="file-name"></span><span class="file-meta"></span></div><button class="file-remove" title="移除">✕</button>`;
      item.querySelector(".file-name").textContent = file.名稱 || file.name || "未命名檔案";
      item.querySelector(".file-meta").textContent = file.狀態 || "可用";
      item.querySelector(".file-remove").addEventListener("click", () => callbacks.fileRemoved?.(file));
      list.appendChild(item);
    }
    if (!list.children.length) list.innerHTML = '<p class="empty-hint">尚無檔案</p>';
  };
  return createModule({
    id: "ui",
    capabilities: ["mount", "events", "render"],
    ready: () => Boolean(globalThis.document),
    actions: {
      mount: async events => {
        callbacks = events || {};
        await load("uiHeader", "ui/modules/header.html");
        const layout = byId("uiLayout");
        if (!layout) throw new Error("UI layout mount missing");
        const fragments = await Promise.all(["aux", "chat", "view"].map(id => load(`ui-${id}`, `ui/modules/${id}.html`)));
        layout.insertAdjacentHTML("afterbegin", '<div class="resizer" data-left="aux" data-right="chat"></div>');
        layout.insertAdjacentHTML("beforeend", '<div class="resizer" data-left="chat" data-right="view"></div>');
        on("settingsToggle", "click", () => toggle("settingsWidget"));
        on("topicToggle", "click", () => toggle("topicWidget"));
        on("fileToggle", "click", () => toggle("fileWidget"));
        on("signoutAction", "click", () => callbacks.signOut?.());
        on("connectDriveBtn", "click", () => callbacks.connectDrive?.());
        on("chatSend", "click", () => { const input = byId("chatInput"); const value = input?.value || ""; if (input) input.value = ""; callbacks.sendMessage?.(value); });
        on("chatInput", "keydown", event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); const value = event.target.value; event.target.value = ""; callbacks.sendMessage?.(value); } });
        on("fileUploadButton", "click", () => byId("fileInput")?.click());
        on("fileInput", "change", event => { callbacks.fileSelected?.(event.target.files?.[0]); event.target.value = ""; });
        on("topicInput", "keydown", event => { if (event.key === "Enter") { event.preventDefault(); callbacks.setTopic?.(event.target.value); event.target.value = ""; } });
        document.addEventListener("click", event => ["topicWidget", "settingsWidget", "fileWidget"].forEach(id => { const widget = byId(id); if (widget?.classList.contains("open") && !widget.contains(event.target)) widget.classList.remove("open"); }));
        document.querySelectorAll(".fold-btn").forEach(button => button.addEventListener("click", () => byId(button.dataset.target)?.classList.toggle("collapsed")));
        document.querySelectorAll(".aux-option-head").forEach(head => head.addEventListener("click", () => head.parentElement.classList.toggle("open")));
        document.querySelectorAll(".resizer").forEach(bar => bar.addEventListener("mousedown", event => {
          event.preventDefault(); bar.classList.add("active");
          const left = byId(bar.dataset.left), right = byId(bar.dataset.right), start = event.clientX, leftWidth = left.offsetWidth, rightWidth = right.offsetWidth;
          const move = e => { const delta = e.clientX - start; left.style.flex = `0 0 ${Math.max(40, leftWidth + delta)}px`; if (right.id !== "chat") right.style.flex = `0 0 ${Math.max(40, rightWidth - delta)}px`; };
          const up = () => { bar.classList.remove("active"); document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
          document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
        }));
        return true;
      },
      setStatus,
      setUser: user => { byId("signinBtn")?.style.setProperty("display", "none"); byId("userChip")?.style.setProperty("display", "flex"); if (byId("userAvatar")) byId("userAvatar").src = user?.picture || ""; if (byId("userName")) byId("userName").textContent = user?.name || user?.email || ""; byId("connectDriveBtn")?.style.setProperty("display", "inline-block"); },
      setSignedOut: () => { byId("signinBtn")?.style.setProperty("display", "flex"); byId("userChip")?.style.setProperty("display", "none"); setStatus("githubStatus", "尚未登入"); setStatus("driveStatus", "備份未連線"); },
      renderState: state => { const topic = byId("topicBadge"); if (topic) topic.textContent = state.主題?.目前 || "設定主題"; const status = byId("coreStatusText"); if (status) status.textContent = state.現況?.定位AI ? `定位AI：${state.現況.定位AI}` : "尚無現況資料"; const badge = byId("fileBadge"); if (badge) badge.textContent = state.檔案?.length ? `檔案 (${state.檔案.length})` : "檔案"; renderFiles(state.檔案); },
      addBubble: (role, text) => { const scroll = byId("chatScroll"); if (!scroll) return; const bubble = document.createElement("div"); bubble.className = `bubble ${role}`; bubble.textContent = text; scroll.appendChild(bubble); scroll.scrollTop = scroll.scrollHeight; },
      renderResult: (title, detail) => { const body = byId("resultBody"); if (!body) return; body.querySelector(".empty-hint")?.remove(); const card = document.createElement("div"); card.className = "result-card"; card.innerHTML = `<h3></h3><p></p>`; card.querySelector("h3").textContent = title; card.querySelector("p").textContent = detail; body.prepend(card); }
    }
  });
}

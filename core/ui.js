import { createModule } from "./contract.js";

export function createUIModule({ config } = {}) {
  let callbacks = {};
  const load = async (id, path) => {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`UI module load failed: ${path}`);
    const html = await response.text();
    return { id, html };
  };
  return createModule({
    id: "ui",
    capabilities: ["mount", "events"],
    ready: () => Boolean(document),
    actions: {
      mount: async events => {
        callbacks = events || {};
        const header = await load("uiHeader", "ui/modules/header.html");
        const layout = document.getElementById("uiLayout");
        const fragments = await Promise.all([
          load("uiAux", "ui/modules/aux.html"),
          load("uiChat", "ui/modules/chat.html"),
          load("uiView", "ui/modules/view.html")
        ]);
        if (header && layout) {
          const container = document.getElementById("uiHeader");
          if (container) container.innerHTML = header.html;
        }
        for (const fragment of fragments) {
          if (layout) layout.insertAdjacentHTML("beforeend", fragment.html);
        }
        return callbacks;
      },
      setStatus: (id, text, on = false) => {
        const element = document.getElementById(id);
        if (element) {
          element.textContent = text;
          element.classList.toggle("on", on);
        }
      },
      renderState: state => {
        const topic = document.getElementById("topicBadge");
        if (topic && state.主題?.目前) topic.textContent = state.主題.目前;
        const status = document.getElementById("statusText");
        if (status && state.現況?.最後更新) status.textContent = state.現況.最後更新;
      }
    }
  });
}

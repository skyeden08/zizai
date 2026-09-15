const CACHE_NAME = "zizai-shell-v3";
const SHELL_FILES = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 僅快取外殼（HTML/CSS/JS/manifest），不快取 Google API 或 Drive 資料請求，
// 確保現況／歷程永遠讀取雲端最新版本，不產生本地鏡像（呼應4.1.6）
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (url.includes("googleapis.com") || url.includes("accounts.google.com") || url.includes("api.github.com")) {
    return; // 不攔截，直接放行給網路
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

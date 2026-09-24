let geminiKey = null;
window.ZIZAI_MODULES=window.ZIZAI_MODULES||{};
window.ZIZAI_AUTH={getGithubToken:()=>githubToken,getGeminiKey:()=>geminiKey};
window.ZIZAI_UTILS={utf8ToBase64,base64ToUtf8};
let isSilentDriveCheck = false;
let tokenExpiryTimer = null;
let zizaiState = { 現況: { 定位AI: null, 最後更新: null }, 歷程: [], 主題: { 目前: "", 歷史: [] }, 檔案: [] };
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}
function base64ToUtf8(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
window.onload = () => {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  setGithubStatus(false, "請登入以讀取密鑰");
  google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredential, auto_select: true });
  google.accounts.id.renderButton(document.getElementById("signinBtn"), { theme: "outline", size: "medium", text: "signin", shape: "pill" });
  google.accounts.id.prompt();
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: (resp) => {
      if (resp.error) { setDriveStatus(false, "授權失敗"); return; }
      accessToken = resp.access_token;
      setDriveStatus(true, "備份已連線");
      if (tokenExpiryTimer) clearTimeout(tokenExpiryTimer);
      tokenExpiryTimer = setTimeout(() => { accessToken = null; setDriveStatus(false, "備份逾時"); }, (resp.expires_in || 3600) * 1000 - 60000);
      loadDriveFileId().then(() => backupToDrive());
    }
  });
  makeResizable();
  loadStateFromGitHub().then(() => {
    renderCoreStatus();
    renderTopicHistory();
    renderFileList();
  });
};
function setGithubStatus(ok, text) {
  const dot = document.getElementById("githubDot");
  const el = document.getElementById("githubStatus");
  if (dot) { dot.className = "dot " + (ok ? "on" : ""); }
  if (el) el.innerHTML = `<span class="dot ${ok ? "on" : ""}" id="githubDot"></span>${text}`;
}
function setDriveStatus(ok, text) {
  const el = document.getElementById("driveStatus");
  if (el) el.innerHTML = `<span class="dot ${ok ? "on" : ""}" id="driveDot"></span>${text}`;
}
function handleCredential(resp) {
  const payload = JSON.parse(atob(resp.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  document.getElementById("signinBtn").style.display = "none";
  document.getElementById("userChip").style.display = "flex";
  document.getElementById("userAvatar").src = payload.picture || "";
  document.getElementById("userName").textContent = payload.name || payload.email || "";
  document.getElementById("connectDriveBtn").style.display = "inline-block";
  setGithubStatus(true, "已登入");
  loadGithubTokenFromDrive().then(() => loadStateFromGitHub()).then(() => { renderCoreStatus(); renderTopicHistory(); renderFileList(); }).then(() => loadGeminiKeyFromDrive());
}
function signOut() {
  accessToken = null; stateFileId = null; githubToken = null; geminiKey = null;
  document.getElementById("signinBtn").style.display = "flex";
  document.getElementById("userChip").style.display = "none";
  setGithubStatus(false, "尚未登入");
  setDriveStatus(false, "備份未連線");
  google.accounts.id.disableAutoSelect();
}
function connectDrive() {
  if (tokenClient) tokenClient.requestAccessToken({ prompt: "" });
}
async function loadDriveFileId() {
  if (!accessToken) return;
  const q = encodeURIComponent(`name='${STATE_FILENAME}' and trashed=false`);
  const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const listData = await listRes.json();
  if (listData.files && listData.files.length > 0) {
    stateFileId = listData.files[0].id;
  }
}
async function loadGithubTokenFromDrive() {
  if (!accessToken) return;
  const q = encodeURIComponent(`name='${TOKEN_FILENAME}' and trashed=false`);
  const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const listData = await listRes.json();
  if (listData.files && listData.files.length > 0) {
    const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${listData.files[0].id}?alt=media`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = await fileRes.json();
    if (data && data.token) { githubToken = data.token; setGithubStatus(true, "GitHub 密鑰已載入"); }
  }
}
async function loadGeminiKeyFromDrive() {
  if (!accessToken) return;
  const q = encodeURIComponent(`name='${GEMINI_KEY_FILENAME}' and trashed=false`);
  const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const listData = await listRes.json();
  if (listData.files && listData.files.length > 0) {
    const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${listData.files[0].id}?alt=media`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = await fileRes.json();
    if (data && data.key) { geminiKey = data.key; document.getElementById("geminiStatus").textContent = "已接入"; document.getElementById("geminiStatus").className = "ai-state on"; }
  }
}
async function saveGithubTokenToDrive(token) {
  if (!accessToken) return;
  const metadata = { name: TOKEN_FILENAME, mimeType: "application/json" };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", new Blob([JSON.stringify({ token })], { type: "application/json" }));
  await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form });
}
async function saveGeminiKeyToDrive(key) {
  if (!accessToken) return;
  const metadata = { name: GEMINI_KEY_FILENAME, mimeType: "application/json" };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", new Blob([JSON.stringify({ key })], { type: "application/json" }));
  await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form });
}
async function loadStateFromGitHub(){try{const m=window.ZIZAI_MODULES.github;if(!m||!m.ready)return;const d=await m.read(STATE_FILENAME);githubSha=d.sha;zizaiState=JSON.parse(d.content);if(!zizaiState.檔案)zizaiState.檔案=[];if(!zizaiState.主題)zizaiState.主題={目前:"",歷史:[]};if(!zizaiState.現況)zizaiState.現況={定位AI:null,最後更新:null};if(!zizaiState.歷程)zizaiState.歷程=[]}catch(e){}}
async function saveStateToGitHub(){try{const m=window.ZIZAI_MODULES.github;if(!m||!m.ready)return;const d=await m.write(STATE_FILENAME,JSON.stringify(zizaiState,null,2),"update zizai state");githubSha=d.sha||githubSha}catch(e){}}
async function backupToDrive() {
  if (!accessToken) return;
  try {
    if (!stateFileId) {
      const metadata = { name: STATE_FILENAME, mimeType: "application/json" };
      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", new Blob([JSON.stringify(zizaiState)], { type: "application/json" }));
      const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form });
      const data = await res.json();
      if (data.id) stateFileId = data.id;
    } else {
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${stateFileId}?uploadType=media`, { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(zizaiState) });
    }
  } catch (e) {}
}
function toggleSettingsDropdown(e) {
  if (e) e.stopPropagation();
  document.getElementById("settingsWidget").classList.toggle("open");
}
function toggleTopicDropdown(e) {
  if (e) e.stopPropagation();
  document.getElementById("topicWidget").classList.toggle("open");
}
function toggleFileDropdown(e) {
  if (e) e.stopPropagation();
  document.getElementById("fileWidget").classList.toggle("open");
}
document.addEventListener("click", (e) => {
  [document.getElementById("topicWidget"), document.getElementById("settingsWidget"), document.getElementById("fileWidget")].forEach(widget => {
    if (widget && widget.classList.contains("open") && !widget.contains(e.target)) {
      widget.classList.remove("open");
    }
  });
});
document.getElementById("topicInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); setTopic(e.target.value); }
  e.stopPropagation();
});
function renderCoreStatus() {
  const el = document.getElementById("coreStatusText");
  if (!el) return;
  const cur = zizaiState.現況 || {};
  if (!cur.定位AI) { el.textContent = "尚無現況資料"; return; }
  const t = cur.最後更新 ? new Date(cur.最後更新).toLocaleString("zh-TW", { hour12: false }) : "－";
  el.innerHTML = `定位AI：<strong>${cur.定位AI}</strong><br>最後更新：${t}`;
}
function genFileId() {
  return "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
async function handleFileSelect(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!file) return;
  if (!accessToken) { alert("請先登入並連接雲端硬碟，才能上傳檔案。"); return; }
  const id = genFileId();
  const entry = { id, 名稱: file.name, 類型: file.type || "未知", 大小: file.size, 上傳時間: new Date().toISOString(), 狀態: "上傳中", driveId: null };
  if (!zizaiState.檔案) zizaiState.檔案 = [];
  zizaiState.檔案.unshift(entry);
  renderFileList();
  try {
    const driveId = await uploadFileToDrive(file, id);
    entry.狀態 = "可用";
    entry.driveId = driveId;
  } catch (err) {
    entry.狀態 = "失敗";
  }
  renderFileList();
  saveStateToGitHub().then(() => backupToDrive());
}
async function uploadFileToDrive(file, id) {
  const metadata = { name: `zizai_file_${id}_${file.name}`, mimeType: file.type || "application/octet-stream" };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", file);
  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form });
  const data = await res.json();
  if (!data.id) throw new Error("上傳失敗");
  return data.id;
}
function renderFileList() {
  const listEl = document.getElementById("fileList");
  const badgeEl = document.getElementById("fileBadge");
  if (!listEl) return;
  const files = (zizaiState.檔案 || []).filter(f => f.狀態 !== "已移除");
  if (badgeEl) badgeEl.textContent = files.length ? `檔案 (${files.length})` : "檔案";
  listEl.innerHTML = "";
  if (!files.length) { listEl.innerHTML = '<p class="empty-hint">尚無檔案</p>'; return; }
  files.forEach(f => {
    const item = document.createElement("div");
    item.className = "file-item";
    const statusClass = f.狀態 === "上傳中" ? "uploading" : (f.狀態 === "失敗" ? "failed" : "");
    item.innerHTML = `
      <div class="file-info">
        <span class="file-name" title="${f.名稱}">${f.名稱}</span>
        <span class="file-meta ${statusClass}">${f.狀態}${f.狀態 === "可用" ? " · " + formatFileSize(f.大小) : ""}</span>
      </div>
      <button class="file-remove" title="移除">✕</button>`;
    item.querySelector(".file-remove").onclick = () => removeFile(f.id);
    listEl.appendChild(item);
  });
}
async function removeFile(id) {
  const entry = (zizaiState.檔案 || []).find(f => f.id === id);
  if (!entry) return;
  if (entry.driveId && accessToken) {
    try { await fetch(`https://www.googleapis.com/drive/v3/files/${entry.driveId}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }); } catch (e) {}
  }
  zizaiState.檔案 = (zizaiState.檔案 || []).filter(f => f.id !== id);
  renderFileList();
  saveStateToGitHub().then(() => backupToDrive());
}
function toggleAuxOption(id) { document.getElementById(id).classList.toggle("open"); }
function toggleFold(id) { document.getElementById(id).classList.toggle("collapsed"); }
function makeResizable() {
  document.querySelectorAll(".resizer").forEach(bar => {
    bar.addEventListener("mousedown", e => {
      e.preventDefault();
      bar.classList.add("active");
      const leftEl = document.getElementById(bar.dataset.left);
      const rightEl = document.getElementById(bar.dataset.right);
      const startX = e.clientX;
      const startLeft = leftEl.getBoundingClientRect().width;
      const startRight = rightEl.getBoundingClientRect().width;
      function onMove(ev) {
        const dx = ev.clientX - startX;
        leftEl.style.flex = `0 0 ${Math.max(40, startLeft + dx)}px`;
        rightEl.style.flex = rightEl.id === "chat" ? "1 1 auto" : `0 0 ${Math.max(40, startRight - dx)}px`;
      }
      function onUp() {
        bar.classList.remove("active");
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
  });
}
async function callGemini(conversationHistory){const m=window.ZIZAI_MODULES.gemini;if(!m)return"Gemini 模組尚未載入";return m.generate(conversationHistory)}
function setTopic(text) {
  text = (text || "").trim();
  if (!text) return;
  if (!zizaiState.主題) zizaiState.主題 = { 目前: "", 歷史: [] };
  zizaiState.主題.目前 = text;
  if (!zizaiState.主題.歷史.includes(text)) zizaiState.主題.歷史.unshift(text);
  if (zizaiState.主題.歷史.length > 20) zizaiState.主題.歷史 = zizaiState.主題.歷史.slice(0, 20);
  document.getElementById("topicBadge").textContent = text;
  document.getElementById("topicInput").value = "";
  document.getElementById("topicWidget").classList.remove("open");
  renderTopicHistory();
  saveStateToGitHub().then(() => backupToDrive());
}
function renderTopicHistory() {
  const list = document.getElementById("topicHistoryList");
  if (!list) return;
  const hist = (zizaiState.主題 && zizaiState.主題.歷史) || [];
  const cur = (zizaiState.主題 && zizaiState.主題.目前) || "";
  list.innerHTML = "";
  if (cur) document.getElementById("topicBadge").textContent = cur;
  hist.forEach(t => {
    const chip = document.createElement("div");
    chip.className = "topic-chip" + (t === cur ? " current" : "");
    chip.textContent = t;
    chip.onclick = () => setTopic(t);
    list.appendChild(chip);
  });
}
function parseGithubCall(text){const start=text.indexOf("[github_call]"),end=text.indexOf("[/github_call]");if(start<0||end<start)return null;try{return JSON.parse(text.slice(start+13,end).trim())}catch(e){return{error:"GitHub 請求格式錯誤"}}}
async function executeModuleCall(req){if(!req)return null;if(req.error)return req.error;const m=window.ZIZAI_MODULES[req.module||"github"];if(!m)throw Error("找不到可調用模組："+(req.module||"github"));if(req.action==="read")return await m.read(req.path);if(req.action==="write")return await m.write(req.path,req.content||"",req.message||"ZIZAI 模組寫入");throw Error("不支援的模組動作："+req.action)}
async function sendMessage(){
  const input=document.getElementById("chatInput");const text=(input.value||"").trim();if(!text)return;input.value="";addBubble("user",text);
  let history=[];document.querySelectorAll("#chatScroll .bubble").forEach(b=>history.push({role:b.classList.contains("user")?"user":"model",text:b.textContent}));
  for(let i=0;i<3;i++){
    const reply=await callGemini(history);const req=parseGithubCall(reply);
    if(!req){addBubble("ai",reply);addResultCard("Gemini 回應",reply.slice(0,200)+(reply.length>200?"…":""));return}
    try{
      const result=await executeModuleCall(req);
      history.push({role:"model",text:reply},{role:"user",text:"（ZIZAI 模組執行結果）"+JSON.stringify(result)});
      addResultCard("ZIZAI · "+(req.module||"GitHub")+" 模組",JSON.stringify(result).slice(0,500));
    }catch(e){
      history.push({role:"model",text:reply},{role:"user",text:"（ZIZAI 模組執行錯誤）"+e.message});
      addResultCard("ZIZAI · 模組錯誤",e.message);
    }
  }
  addBubble("ai","模組調用已達本次循環上限，請繼續下達指令。");
}
function addBubble(role, text) {
  const scroll = document.getElementById("chatScroll");
  const div = document.createElement("div");
  div.className = "bubble " + role;
  div.textContent = text;
  scroll.appendChild(div);
  scroll.parentElement.scrollTop = scroll.parentElement.scrollHeight;
}
function addResultCard(title, detail) {
  const body = document.getElementById("resultBody");
  const hint = body.querySelector(".empty-hint");
  if (hint) hint.remove();
  const card = document.createElement("div");
  card.className = "result-card";
  card.innerHTML = `<h3>${title}</h3><p>${detail}</p>`;
  body.prepend(card);
}

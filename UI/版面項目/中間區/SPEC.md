# 中間區 `<zizai-center-panel>` — SPEC（V1）

## 職責與定位

「中間區」是 ZIZAI 版面中位於上方區與左側區之間的對話工作區。
V1 提供：主題選擇（下拉）、依主題隔離的訊息歷史、訊息輸入與送出、以及一個靜態的 Next 按鈕。

- 標籤名：`zizai-center-panel`
- 以一般 `<script src>` 載入，非 ES module。
- 內部使用 Shadow DOM（`mode: 'open'`）。

## 不負責事項

- 不負責上方區、左側區的任何職責。
- 不重用 `zizai-dropdown`；V1 主題下拉使用原生 `<select>`。
- Next 按鈕為靜態按鈕；「動態顯示目前可執行的下一步」不在 V1 範圍。
- 不處理跨主題合併、訊息持久化或與後端同步；歷史僅存在於元件實例記憶體中。
- 不提供氣泡編輯、刪除、複製等互動。
- 不負責整體頁面的版面配置；由外層容器決定元件大小。

## 事件

所有事件經 `window.ZizaiEvents.dispatchCustomEvent` 發送；工具不可用時降級為原生 `CustomEvent`（`bubbles: true`、`composed: true`、`cancelable: true`，`detail = { source, data, timestamp }`）。`source` 固定為 `'zizai-center-panel'`。

| 事件 | 觸發 | `detail.data` |
|---|---|---|
| `zizai-topic-change` | 切換到不同的有效主題 | `{ topic }` |
| `zizai-message-sent` | 成功送出非空白訊息 | `{ text, topic }` |
| `zizai-next-click` | 點擊 Next | `{ topic }` |

- `topic` 僅接受 `default`、`architecture`、`trading`。
- 切到相同主題不觸發 `zizai-topic-change`。
- `text` 保留原始字串（不 trim）。

## 使用方式

```html
<!-- 載入順序（從 UI/版面項目/中間區/ 出發） -->
<script src="../../通用框架項目/事件處理/zizai-events.js"></script>
<script src="./zizai-center-panel.js"></script>

<!-- 建議：以固定高度的外層容器包住元件，不對元件本身設 display -->
<div style="height: 600px;">
  <zizai-center-panel></zizai-center-panel>
</div>
```

測試頁須經 HTTP 伺服器開啟（例如 `python -m http.server`）。

## 版面規格

- `:host` 為 `display: block; width: 100%; height: 100%; min-height: 0; box-sizing: border-box;`，不依賴 `:host` 的 `display: flex`，避免外部文件層對元件設定 display 時覆蓋 `:host` 規則。
- 內層 `.panel` 為 `display: flex; flex-direction: column; height: 100%; min-height: 0;`。
- 工具列、輸入區 `flex: 0 0 auto`；訊息區 `flex: 1 1 0; min-height: 0; overflow-y: auto`。
- 外部不論對元件設 `display: block` 或 `display: flex`，訊息區都獨立垂直捲動，輸入區始終完整可見。

## IME 說明

Enter 送出、Shift+Enter 換行。為避免 IME 組字期間誤送出，採三重判斷，任一成立即不送出、也不 `preventDefault`、不清內容：

1. `e.isComposing === true`
2. 內部旗標（`compositionstart` 設 true、`compositionend` 設 false）
3. `e.keyCode === 229`（涵蓋 Safari 的 compositionend 早於確認用 Enter 的 keydown 的情況）

判斷順序：`key !== 'Enter'` 直接返回 → 上述三重判斷 → `shiftKey` → `preventDefault()` 後送出。

Safari 項目僅以合成 `KeyboardEvent` 模擬 `compositionstart → compositionend → keydown(keyCode 229)` 順序，驗證程式的保護分支；這不等同 Safari 原生輸入法實測，實際 Safari／iOS Safari 行為仍標示未實測。

## 限制

- 不使用 TypeScript、ES module、建置流程、外部依賴或 CDN。
- 動態內容一律使用 `textContent`，不以 `innerHTML` 插入使用者輸入。
- 歷史只存在於記憶體；同一實例移除後再插入會保留歷史與目前主題，重新載入頁面則清空。
- `disconnectedCallback` 以 `AbortController` 清理內部監聽器並重置組字旗標；移除期間對元件內部的操作不會觸發對外事件。

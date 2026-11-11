# 中間區 `<zizai-center-panel>`

ZIZAI 版面「中間區」V1：主題工具列、依主題隔離的訊息區、訊息輸入與送出、靜態 Next 按鈕。

## 檔案

| 檔案 | 說明 |
|---|---|
| `zizai-center-panel.js` | 自訂元素實作 |
| `SPEC.md` | 規格（職責、事件、版面、IME、限制） |
| `test-center-panel.html` | 測試頁（12 組，含子測試） |
| `README.md` | 本檔 |

## 快速開始

從 `UI/版面項目/中間區/` 出發，載入順序為：

```html
<script src="../../通用框架項目/事件處理/zizai-events.js"></script>
<script src="./zizai-center-panel.js"></script>

<div style="height: 600px;">
  <zizai-center-panel></zizai-center-panel>
</div>
```

測試頁須經 HTTP 伺服器開啟，例如在本目錄執行：

```bash
python -m http.server 8000
```

再開啟 http://localhost:8000/test-center-panel.html。

## 對外事件

| 事件 | `detail.data` |
|---|---|
| `zizai-topic-change` | `{ topic }` |
| `zizai-message-sent` | `{ text, topic }` |
| `zizai-next-click` | `{ topic }` |

`source` 固定為 `zizai-center-panel`。詳細規格見 `SPEC.md`。

## 限制

- 不使用 ES module、TypeScript、建置流程、外部依賴。
- 歷史僅存在於元件實例記憶體。
- V1 不重用 `zizai-dropdown`，主題下拉使用原生 `<select>`。

## 測試狀態

測試頁包含 12 組測試（含子測試）。Safari IME 項目使用合成事件驗證 `keyCode === 229` 的保護分支，不代表已在 Safari 原生輸入法環境實測。瀏覽器測試尚未在此環境完成，未實際執行的項目不得標示為通過。

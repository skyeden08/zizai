# ZIZAI 通用框架項目：拖曳調整 V1 (`<zizai-drag-resizer>`)

## 1. 單元定位與職責邊界

### 1.1 單元職責
`<zizai-drag-resizer>` 為 ZIZAI 系統平台之獨立通用操作單元，僅負責以下四項核心任務：
1. 提供可供使用者進行指標拖曳或鍵盤微調的控制把手介面。
2. 精準偵測單一作用中指標的拖曳起始、位移變化、結束與取消狀態。
3. 將拖曳方向（`direction`）、單次位移（`deltaX` / `deltaY`）與累計位移（`totalDeltaX` / `totalDeltaY`）透過標準 `CustomEvent` 回報給外部組裝層。
4. 原生支援滑鼠（Mouse）、觸控（Touch）及觸控筆（Pen）操作。

### 1.2 職責限制（本單元明確不負責之項目）
- **不建立區域結構**：不建立左側、中間、右側或上方等任何內容區塊。
- **不決定整體版面配置**：不控制 Flexbox、Grid 或絕對定位版面。
- **不直接修改外部尺寸**：絕對不會寫入或修改相鄰 DOM 元素的 `width`、`height`、`flex-basis` 等樣式屬性；所有尺寸計算、最小/最大寬度限制與版面重繪，完全交由外部組裝層監聽事件後自行決定。
- **不管理區域收合**：不處理區塊折疊或展開邏輯。
- **不管理垂直捲動**：各區域的 `overflow-y` 捲動行為與本單元無關。
- **不跨實例耦合**：各 `<zizai-drag-resizer>` 實例內部狀態完全封閉，互不控制或干擾。

---

## 2. 元件介面規格（Attributes / Properties / Events）

### 2.1 HTML Attributes & DOM Properties

| Attribute | Property | 類型 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- | :--- |
| `orientation` | `orientation` | `horizontal` 或 `vertical` | `'horizontal'` | 拖曳調整軸向。`horizontal` 為左右拖曳調整寬度；`vertical` 為上下拖曳調整高度。 |
| `disabled` | `disabled` | `boolean` | `false` | 是否停用拖曳控制。設為 `true` 時將立即中止進行中的拖曳並移除 `tabindex`。 |
| `step` | `step` | `number` | `10` | 鍵盤方向鍵每次觸發的位移像素值（px）。搭配 `Shift` 鍵時自動乘以 5 倍。 |
| `aria-label` | — | `string` | `'左右拖曳調整'` / `'上下拖曳調整'` | 無障礙輔助標籤，未指定時依 `orientation` 自動補齊。 |
| — | `isDragging` *(唯讀)* | `boolean` | `false` | 回傳目前是否有作用中的指標正在拖曳此實例。 |

### 2.2 自訂事件（Events）

所有事件皆設定 `bubbles: true` 與 `composed: true`，可穿透 Shadow DOM 供外部組裝層統一監聽。

| 事件名稱 | 觸發時機 |
| :--- | :--- |
| `zizai-resize-start` | 作用中指標按下（`pointerdown`）或鍵盤方向鍵觸發開始時。 |
| `zizai-resize-move` | 作用中指標移動且產生非零位移（`pointermove`），或鍵盤觸發位移時。 |
| `zizai-resize-end` | 作用中指標正常放開（`pointerup`），或鍵盤單次微調完成時。 |
| `zizai-resize-cancel` | 作用中指標被系統中斷（`pointercancel`）、元件於拖曳中途停用或被移出 DOM 時。 |

### 2.3 事件資料格式（`event.detail`）與位移語意說明

`event.detail` 為不可變物件（`Object.freeze`），結構如下：

```json
{
  "targetId": "resizer-left-mid",
  "orientation": "horizontal",
  "pointerId": 1,
  "pointerType": "mouse",
  "deltaX": 0,
  "deltaY": 0,
  "totalDeltaX": -28,
  "totalDeltaY": 0,
  "direction": "left",
  "source": "pointer"
}

```

* `targetId` (`string | null`)：觸發事件之元件 `id` 屬性值，便於外部組裝層區分多個拖曳實例。
* `orientation` (`'horizontal' | 'vertical'`)：元件當前調整軸向。
* `pointerId` (`number | null`)：當前作用中指標的唯一識別碼；鍵盤操作時為 `null`。
* `pointerType` (`'mouse' | 'touch' | 'pen' | 'keyboard' | 'unknown'`)：輸入裝置類型。
* `deltaX` / `deltaY` (`number`)：相對於上一次事件的單步位移量（px）。向左/向上為負值，向右/向下為正值。
* `totalDeltaX` / `totalDeltaY` (`number`)：相對於本次拖曳起點的累計總位移量（px）。
* **結束／取消事件位移語意明確說明**：
* 在 `zizai-resize-end` 及 `zizai-resize-cancel` 事件中，`deltaX` 與 `deltaY` 僅代表最後一步（放開或取消瞬間）的位移量，在多數情況下可能為 `0`。
* 外部組裝層在計算最終拖曳總量、更新面板寬高或進行邊界校正時，一律應以 `totalDeltaX` 與 `totalDeltaY` 為準，切勿直接累加結束事件當下的 `deltaX` / `deltaY`。


* `direction` (`'left' | 'right' | 'up' | 'down' | 'none'`)：本次位移方向。
* `source` (`'pointer' | 'keyboard' | 'system'`)：觸發來源。

---

## 3. 共用外觀 CSS Variables 介面與寬高互換規則

本元件內部不定義全域樣式、不使用 `@import`，全數透過 `var(--zizai-*, fallback)` 承接外部共用外觀變數。

### 3.1 CSS 變數清單與軸向寬高互換規則

* `--zizai-resizer-width`：
* **水平模式 (`orientation="horizontal"`)**：代表控制把手的熱區寬度（預設 `8px`）。
* **垂直模式 (`orientation="vertical"`)**：代表控制把手的熱區高度。透過 CSS `:host([orientation="vertical"])` 選擇器與 `width`/`height` 互換規則，此變數在垂直模式下會套用至外框高度（預設 fallback 為 `8px`）。


* `--zizai-resizer-height`：
* **水平模式 (`orientation="horizontal"`)**：代表控制把手的熱區高度（預設 `100%`）。
* **垂直模式 (`orientation="vertical"`)**：代表控制把手的熱區寬度。在垂直模式下會套用至外框寬度（預設 fallback 為 `100%`）。


* `--zizai-resizer-bar-thickness`（預設 `2px`）：中央視覺指示線的粗細（垂直模式下自動對應調整方向之長度與厚度軸向）。
* `--zizai-resizer-bar-length`（預設 `24px`）：中央視覺指示線長度。
* `--zizai-resizer-bg`（預設 `transparent`）：把手背景色。
* `--zizai-border-color`（預設 `#cbd5e1`）：預設狀態指示線顏色。
* `--zizai-accent-color`（預設 `#3b82f6`）：Hover 與 Focus 狀態指示線顏色。
* `--zizai-accent-active-color`（預設 `#2563eb`）：拖曳進行中指示線顏色。
* `--zizai-focus-ring-color`（預設 `rgba(59, 130, 246, 0.5)`）：鍵盤聚焦外框色。
* `--zizai-transition-fast`（預設 `0.15s ease`）：狀態過渡動畫。
* `--zizai-radius-sm`（預設 `2px`）：指示線圓角。
* `--zizai-disabled-opacity`（預設 `0.4`）：停用狀態透明度。

---

## 4. 操作方式與無障礙（ARIA）說明

### 4.1 指標操作

* **滑鼠**：左鍵按住把手並左右（或上下）移動，放開左鍵結束。右鍵與中鍵不會觸發拖曳。
* **觸控與觸控筆**：單指或觸控筆按住把手滑動。元件透過 `setPointerCapture` 鎖定該 `pointerId`，即使手指滑出把手邊界仍可持續追蹤；拖曳期間若第二根手指觸碰螢幕或放開，將被嚴格忽略，不會干擾當前位移或提前中斷拖曳。

### 4.2 鍵盤操作

* 透過 `Tab` 鍵聚焦於把手（`tabindex="0"`）。
* `orientation="horizontal"` 時：按 `ArrowLeft` 向左發出負位移事件，`ArrowRight` 向右發出正位移事件。
* `orientation="vertical"` 時：按 `ArrowUp` 向上發出負位移事件，`ArrowDown` 向下發出正位移事件。
* 按住 `Shift` 搭配方向鍵，位移量為 `step * 5`。

### 4.3 無障礙支援邊界聲明

* 本元件提供 `role="separator"`、`aria-orientation`、`aria-label`、`aria-disabled` 及 `tabindex="0"`，使其具備標準可聚焦分隔線語意與鍵盤操作能力。
* **明確限制**：因本單元職責嚴格限定為「純位移偵測與事件回報」，不持有亦不知曉外部面板的實際像素尺寸、最小寬度或最大寬度，故本元件未內建 `aria-valuenow`、`aria-valuemin`、`aria-valuemax`。若外部組裝層之無障礙規範要求完整的數值型 `separator` 屬性，應由外部組裝層在計算出實際寬度百分比或像素後，自行同步更新至外部容器或元件屬性上。

---

## 5. 測試範圍與驗證限制說明

### 5.1 `verify.html` 自動化測試涵蓋範圍

`verify.html` 內建之自動化測試腳本透過模擬標準 `PointerEvent` 與 `KeyboardEvent`，完整驗證了以下邏輯與狀態機行為：

1. 單一指標正常拖曳生命週期（start -> move -> end）。
2. 第二個觸控點加入時的過濾與防干擾機制。
3. 非作用中指標放開時不結束拖曳。
4. 作用中指標取消時的正確狀態清理（`zizai-resize-cancel`）。
5. 元素卸載與重新插入 DOM 後的生命週期防護（無重複 Shadow DOM 渲染與無重複事件綁定）。
6. 多實例並存時互不干擾。
7. 鍵盤方向鍵與 Shift 組合鍵微調運作。
8. 確保元件本身未直接修改外部版面尺寸。

### 5.2 真實環境驗證限制宣告

* **重要聲明**：`verify.html` 的自動化測試乃透過 JavaScript 模擬事件驗證內部狀態機與 `pointerId` 過濾邏輯，不等於已實際驗證真實瀏覽器底層的 Pointer Capture 原生行為及實機多點觸控硬體反應。
* 上述真實瀏覽器層級的 Pointer Capture 行為、跨瀏覽器相容性以及行動裝置實機多點觸控情境，仍須在實際目標瀏覽器與實體觸控裝置上進行最終人工驗證。
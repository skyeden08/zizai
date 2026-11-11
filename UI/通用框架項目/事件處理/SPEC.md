# ZIZAI 通用框架項目：事件處理 V1

## 1. 職責與定位

本單元提供純粹、無業務依賴的瀏覽器原生事件處理工具：

- **統一發送規格**：`dispatchCustomEvent` 強制預設 `bubbles: true` 與 `composed: true`，確保事件能穿透 Shadow DOM 向上傳遞。
- **統一結構約定**：所有事件的 `detail` 必須包含 `data`、`timestamp`，並可選填 `source`。
- **安全監聽與清理**：`addEventListenerWithCleanup` 在綁定的同時回傳解除綁定的函式。

## 2. 不負責事項

- 不負責全域狀態管理
- 不負責中央事件匯流排（Event Bus）
- 不負責畫面渲染與業務邏輯
- 不強迫既有單元立即改寫

## 3. 事件結構

```js
{
  source?: string;   // 發送來源識別
  data: any;         // 實際傳遞的資料
  timestamp: number; // Date.now()
}
```

## 4. 使用方式

### 發送事件（在自定義元件內部）

```js
ZizaiEvents.dispatchCustomEvent(
  this,
  'zizai-item-selected',
  { id: 'item-1', label: '選項一' },
  'my-dropdown-component'
);
```

### 監聽事件（在上層容器）

```js
const cleanup = ZizaiEvents.addEventListenerWithCleanup(
  container,
  'zizai-item-selected',
  (event) => {
    const { source, data, timestamp } = event.detail;
    console.log('收到來自', source, '的事件', data);
  }
);

// 元件銷毀時
cleanup();
```

## 5. 與既有單元的關係

既有開合、拖曳調整等單元目前自行 dispatch CustomEvent。本單元提供統一約定與工具，不要求立即改寫既有單元。新單元建議使用本工具。

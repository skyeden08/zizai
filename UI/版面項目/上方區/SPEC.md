# ZIZAI 版面項目：上方區 V1 (`<zizai-header-bar>`)

## 1. 職責與定位

- 左側展示 ZIZAI 平台名稱（logo）與簡易版本標籤。
- 右側提供橫幅預留位（純視覺佔位，不接入實際廣告）。
- 點擊 Logo 時對外發送 `zizai-header-click` 事件。
- 固定高度、不提供收合。
- 僅限電腦網頁形態。

## 2. 不負責事項

- 不負責登入、連線狀態、對話主題、任務。
- 不負責其他版面區（左側／中間／右側）。
- 不負責實際廣告投放邏輯。
- 不負責手機或 APP 形態。

## 3. 事件

| 事件名稱 | 觸發時機 | detail 結構 |
| :--- | :--- | :--- |
| `zizai-header-click` | 點擊左側 ZIZAI 名稱 | `{ source, data: { action: 'brand-logo-clicked' }, timestamp }` |

事件使用已完成的事件處理工具發送（若可用），否則降級為原生 CustomEvent（bubbles + composed）。

## 4. 使用方式

```html
<script src="../通用框架項目/事件處理/zizai-events.js"></script>
<script src="./zizai-header-bar.js"></script>

<zizai-header-bar></zizai-header-bar>
```

監聽範例：

```js
const header = document.querySelector('zizai-header-bar');
header.addEventListener('zizai-header-click', (e) => {
  console.log(e.detail);
});
```

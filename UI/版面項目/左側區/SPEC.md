# ZIZAI 版面項目：左側區 V1 (`<zizai-left-sidebar>`)

## 1. 職責與定位

- 提供獨立左側導覽面板，支援整體收合（Collapsed / Expanded）。
- 內含五個可獨立開合項目：
  1. 連線狀態
  2. 登入／帳號
  3. 任務清單／任務切換
  4. 認知現況
  5. 導覽／說明入口
- 透過事件處理工具對外報告狀態變化。
- 純桌面設計。

## 2. 不負責事項

- 不負責中間區、右側區、上方區。
- 不負責真實登入驗證、後端連線、任務資料邏輯（目前僅結構與開合佔位）。
- 不修改已完成的通用框架或上方區。

## 3. 公開方法

- `toggleSidebar()`：切換左側區整體收合／展開，同步更新按鈕文字與 DOM。

## 4. 事件

| 事件名稱 | payload |
| :--- | :--- |
| `zizai-sidebar-toggle` | `{ collapsed: boolean }` |
| `zizai-sidebar-section-toggle` | `{ section: string, isOpen: boolean }` |

## 5. 使用方式

```html
<script src="../../通用框架項目/事件處理/zizai-events.js"></script>
<script src="./zizai-left-sidebar.js"></script>

<zizai-left-sidebar id="my-sidebar"></zizai-left-sidebar>
```

```js
const sidebar = document.querySelector('zizai-left-sidebar');
sidebar.toggleSidebar(); // 外部控制收合

sidebar.addEventListener('zizai-sidebar-toggle', (e) => {
  console.log(e.detail);
});
```

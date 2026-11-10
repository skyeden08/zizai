# ZIZAI UI－下拉選單 V1 交付文件

## 1. 檔案與確切路徑

- **程式檔案：** `UI/通用框架項目/下拉選單/dropdown-menu.js`

## 2. 元件名稱與外部輸入（Props／Attributes）

- **自訂元素標籤：** `<zizai-dropdown>`
- **外部輸入規格：**

| Attribute 名稱 | 對應 Property | 型別 | 預設值 | 說明 |
| --- | --- | --- | --- | --- |
| `label` | `label` | `String` | `"請選擇"` | 尚未選取任何選項時，按鈕上顯示的預設提示文字。 |
| `open` | `open` | `Boolean` | `false` | 控制選單展開或收合。採標準布林屬性語意（存在即為 `true`）。 |
| `value` | `value` | `String` | `""` | 目前被選取的選項值，可由外部賦值以同步狀態。 |
| *(無對應 Attribute)* | `options` | `Array` | `[]` | 透過 JS 賦值的選項陣列，格式：`[{ value: 'v1', text: '選項一' }, ...]`。 |

## 3. 對外事件（Events）及資料格式

### 3.1 `toggle` 事件

- **觸發時機：** 任何使用者互動（滑鼠點擊 toggle、鍵盤操作、選取選項自動關閉、點擊外部自動關閉）導致 `open` 狀態實際改變時派發。
- **事件特性：** `bubbles: true`, `composed: true`
- **資料格式（`detail`）：**

```javascript
{ open: true } // boolean，代表變更後的最新展開狀態
```

### 3.2 `change` 事件

- **觸發時機：** 使用者點擊或透過鍵盤確認選取特定選項時派發。
- **事件特性：** `bubbles: true`, `composed: true`
- **資料格式（`detail`）：**

```javascript
{
  value: "opt1",   // 被選取選項的值
  text: "選項一"   // 被選取選項的顯示文字
}
```

## 4. 選項選取時的實際事件派發順序

當使用者在展開的選單中點擊或按下鍵盤確認選取某個選項時，程式的實際執行與事件派發順序為：

1. **更新目前選取值**（將組件的 `value` 更新為所選選項之值，並同步標籤與 `.selected` 樣式）。
2. **收合選單，派發 `toggle` 事件**（將 `open` 狀態設為 `false`，並派發 `detail: { open: false }`）。
3. **派發 `change` 事件**（回報選取結果，包含 `detail: { value, text }`）。

## 5. 多實例行為說明與事件傳播機制

- 每個下拉選單實例**獨立管理自己的展開與收合狀態**。
- **多個下拉選單可以同時展開**。
- **點擊另一個下拉選單的 toggle 按鈕：** 該 `click` 事件在該元件內部透過 `stopPropagation()` 進行了攔截，不會冒泡至 `document`，因此其他實例的 `document` 監聽器不會被觸發，也不會因此收合。
- **點擊下拉選單以外的頁面區域：** 各實例的 `_boundOutsideClickListener` 會分別判斷點擊位置是否在自身範圍外；若在外部且自身處於展開狀態，就各自收合。
- 「多實例互不干擾」是指各實例的狀態與操作互相獨立、不共享全域狀態，**不代表**具有互斥展開（Accordion 式一次只能展開一個）的機制。

## 6. 標準 ES Module 使用範例

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <title>ZIZAI 下拉選單 V1 範例</title>
  <link rel="stylesheet" href="../共用外觀/shared-theme.css">
  <script type="module" src="./dropdown-menu.js"></script>
</head>
<body>

  <zizai-dropdown id="statusDropdown" label="請選擇狀態"></zizai-dropdown>

  <script type="module">
    const dropdown = document.getElementById('statusDropdown');

    dropdown.options = [
      { value: 'todo', text: '待處理' },
      { value: 'doing', text: '進行中' },
      { value: 'done', text: '已完成' }
    ];

    dropdown.addEventListener('toggle', (e) => {
      console.log('選單狀態變更 (toggle):', e.detail.open);
    });

    dropdown.addEventListener('change', (e) => {
      console.log('選取結果 (change):', e.detail.value, e.detail.text);
    });
  </script>

</body>
</html>
```

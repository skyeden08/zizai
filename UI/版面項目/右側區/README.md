# ZIZAI Platform - Right Panel V1 (共視區) - 整合指南與狀態 (V4 Difference Fix 2)

## 1. 模組簡介
\`zizai-right-panel\` 為 ZIZAI 平台右側「共視區」的獨立 Web Component 模組。本版本（**Rebuild V4 Difference Fix 2**）完成 B1 Minimal Mock \`previousId\` 斷言修正、N1/N2 active-id 回滾事件語意分流（情境 A 與情境 B）及未執行項目統一宣告。

---

## 2. 目錄結構
所有模組檔案皆存放於 GitHub 既有專案結構中：
\`\`\`text
UI/版面項目/右側區/
├── zizai-right-panel.js
├── SPEC.md
├── test-right-panel.html
└── README.md
\`\`\`

---

## 3. 介接與使用方式

### 步驟一：引入模組

\`\`\`javascript
import './zizai-right-panel.js';
\`\`\`

### 步驟二：於版面中掛載

\`\`\`html
<zizai-right-panel id="right-panel-instance"></zizai-right-panel>
\`\`\`

### 步驟三：初始化與事件監聽（對接 ZizaiEvents 框架）

\`\`\`javascript
const rightPanel = document.getElementById('right-panel-instance');

rightPanel.setWorkspaces([
  { id: 'dash', label: '個人化協作看板', content: '...' },
  { id: 'quad', label: '四象分析矩陣', content: '...' }
]);

rightPanel.setFavorites(['dash']);

rightPanel.addEventListener('zizai-workspace-changed', (e) => {
  const { source, data, timestamp } = e.detail;
  console.log(\`切換至: \${data.activeId}, 來源: \${source}, 時間: \${timestamp}\`);
});
\`\`\`

---

## 4. 架構防禦與驗證狀態 (統一 NOT RUN 宣告)

1. **回滾事件語意控制 (N1/N2)**：當外部將 \`active-id\` 設為 \`""\` 或移除時：
   - **情境 A (本來已是第一個 workspace)**：僅恢復屬性與同步 UI，**不派發**無謂事件。
   - **情境 B (本來在其他 workspace)**：切換回第一個 workspace，並派發一次 \`attribute_sync\` 事件（\`previousId\` 為原項目，\`activeId\` 為第一個項目）。

2. **共用事件統一格式與 Options**：優先偵測 \`window.ZizaiEvents.dispatchCustomEvent\`；原生 Fallback 完整帶入 \`bubbles: true, composed: true, cancelable: true\`。
3. **未執行項目宣告 (NOT RUN)**：
   - 真實 Center Panel 與 Right Panel 雙元件共存整合：**NOT RUN**
   - 跨元件 Shadow DOM 樣式隔離：**NOT RUN**
   - Right Panel 與其他元件之間的事件互通：**NOT RUN**
   - 真實 zizai-events.js 實體載入驗證：**NOT RUN**

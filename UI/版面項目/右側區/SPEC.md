# ZIZAI Platform - Right Panel V1 Technical Specification (Rebuild V4 Difference Fix 2)

## 1. 模組定位與架構原則
`zizai-right-panel` 為 ZIZAI 平台右側「共視區」的獨立 Web Component 模組。
- **零外部依賴**：採用純原生 Web Components (Custom Elements v1 + Shadow DOM v1)。
- **共用事件框架整合**：優先對接 `window.ZizaiEvents.dispatchCustomEvent()`，無此框架時自動採用相同統一結構與選項 (`bubbles: true, composed: true, cancelable: true`) 之原生 CustomEvent Fallback。
- **統一事件 Detail 結構**：所有自訂事件遵循 `{ source, data, timestamp }` 標準。
- **初始化不派發變更事件**：模組在掛載及初次透過 `setWorkspaces()` 建立預設選取項目時，屬於初始化狀態，**不**主動派發 `zizai-workspace-changed` 事件。
- **HTMLElement 內容擁有權語意**：當外部傳入 `HTMLElement` 實例作為 `content` 時，模組將其移入對應的 `workspace-pane` 容器中管理。

---

## 2. Public API 與介面規格

### Properties / Attributes
| 名稱 | 型態 | 屬性對應 | 說明 |
| :--- | :--- | :--- | :--- |
| `activeId` | `string` | `active-id` | 目前啟用的共視項目 ID。當賦予外部無效 ID 時自動回滾；若外部直接移除 `active-id` 屬性（或設為空字串 `""`），則自動回滾回復至第一個可用 workspace 的合法狀態。若回滾前之項目與第一個 workspace 不同，會派發 `attribute_sync` 事件；若本來就已是第一個 workspace，則只恢復屬性而不派發事件。 |

### Methods
- `setWorkspaces(items: Array<{id: string, label: string, content: HTMLElement|string}>): void`
- `getWorkspaces(): Array<Object>`
- `setFavorites(favIds: Array<string>): void`
- `getFavorites(): Array<string>`
- `setActiveWorkspace(id: string, source: string): void`
- `getActiveWorkspace(): string`

### Custom Events (Outputs - ZizaiEvents Framework Format)
1. `zizai-workspace-changed`
   - **Trigger**: 當使用者透過下拉選單、常用晶片切換項目，透過程式碼呼叫 `setActiveWorkspace()`，或透過 `attribute_sync` 觸發狀態回滾且前一個項目不同時觸發。
   - **Detail Structure**:
     - `source`: `'user_action'` | `'programmatic'` | `'attribute_sync'`
     - `data`: `{ activeId: string, previousId: string | null }`
     - `timestamp`: number
2. `zizai-favorites-edit-requested`
   - **Trigger**: 點擊常用工具列的編輯按鈕時觸發。
   - **Detail Structure**:
     - `source`: `'user_action'`
     - `data`: `{ currentFavorites: Array<string>, availableWorkspaces: Array<{id: string, label: string}> }` (不包含 content)
     - `timestamp`: number

---

## 3. 邊際條件與防禦機制處理
1. **空資料處理**：當 `workspaces` 為空陣列時，清空 `_activeId`，自動移除 `active-id` attribute，下拉選單顯示 `-- 無可用項目 --` 並禁能。
2. **外部移除 Attribute 回滾語意 (N1)**：當外部 `active-id` 屬性被移除 (`newValue === null` 或 `""`)，若目前不在第一個 workspace，會切換並派發 `attribute_sync` 事件；若本來就在第一個 workspace，僅確保屬性同步且不派發無謂事件。
3. **安全同步旗標**：`_syncAttributeAndSelect` 採用 `try...finally` 保護，防止例外時短路。

---

## 4. 未執行整合項目聲明 (NOT RUN)
- **真實 Center Panel 與 Right Panel 雙元件共存整合**：NOT RUN
- **跨元件 Shadow DOM 樣式隔離**：NOT RUN
- **Right Panel 與其他元件之間的事件互通**：NOT RUN
- **真實 zizai-events.js 實體載入驗證**：NOT RUN

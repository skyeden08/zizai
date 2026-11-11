/**
 * ZIZAI Right Panel V1 (共視區) - Rebuild V4 (Difference Fix 2)
 * Standard: Native Web Components (Custom Elements v1, Shadow DOM v1)
 * Integration: Compatible with ZizaiEvents shared event framework & fallback (with cancelable: true).
 */

const template = document.createElement('template');
template.innerHTML = \`
  <style>
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      box-sizing: border-box;
      background: var(--zizai-bg-secondary, #f8f9fa);
      border-left: 1px solid var(--zizai-border-color, #e0e0e0);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      position: relative;
    }

    *, *::before, *::after { box-sizing: border-box; }

    .right-header {
      padding: 12px;
      border-bottom: 1px solid var(--zizai-border-color, #e0e0e0);
      background-color: var(--zizai-bg-primary, #ffffff);
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex-shrink: 0;
    }

    .selector-container { width: 100%; }

    select.workspace-selector {
      width: 100%;
      padding: 8px 12px;
      font-size: 14px;
      font-weight: 500;
      color: var(--zizai-text-primary, #333333);
      background-color: var(--zizai-input-bg, #ffffff);
      border: 1px solid var(--zizai-border-color, #cccccc);
      border-radius: 6px;
      outline: none;
      cursor: pointer;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    select.workspace-selector:disabled {
      background-color: var(--zizai-input-disabled-bg, #f1f5f9);
      color: var(--zizai-text-tertiary, #9ca3af);
      cursor: not-allowed;
    }

    select.workspace-selector:focus {
      border-color: var(--zizai-focus-color, #2563eb);
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }

    .favorites-toolbar {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      padding-top: 2px;
    }

    .favorites-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--zizai-text-secondary, #666666);
      margin-right: 4px;
      user-select: none;
    }

    .favorites-list {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      align-items: center;
      flex: 1;
      min-width: 0;
    }

    .favorite-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 4px;
      border: 1px solid var(--zizai-border-color, #d1d5db);
      background-color: var(--zizai-chip-bg, #f3f4f6);
      color: var(--zizai-text-primary, #1f2937);
      cursor: pointer;
      user-select: none;
      transition: background-color 0.15s ease, border-color 0.15s ease;
      white-space: nowrap;
    }

    .favorite-chip:hover {
      background-color: var(--zizai-chip-hover-bg, #e5e7eb);
      border-color: var(--zizai-chip-hover-border, #9ca3af);
    }

    .favorite-chip.active {
      background-color: var(--zizai-primary-light, #eff6ff);
      border-color: var(--zizai-primary, #2563eb);
      color: var(--zizai-primary, #2563eb);
      font-weight: 600;
    }

    .edit-fav-btn {
      padding: 2px 6px;
      font-size: 11px;
      border: 1px dashed var(--zizai-border-color, #9ca3af);
      border-radius: 4px;
      background: transparent;
      color: var(--zizai-text-secondary, #666666);
      cursor: pointer;
      margin-left: auto;
      white-space: nowrap;
    }

    .edit-fav-btn:hover {
      border-color: var(--zizai-primary, #2563eb);
      color: var(--zizai-primary, #2563eb);
    }

    .workspace-content {
      flex: 1;
      position: relative;
      overflow: hidden;
      background-color: var(--zizai-content-bg, #ffffff);
    }

    .workspace-pane {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      padding: 16px;
      overflow-y: auto;
      display: none;
      box-sizing: border-box;
    }

    .workspace-pane.active { display: block; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--zizai-text-tertiary, #9ca3af);
      font-size: 14px;
      text-align: center;
      padding: 20px;
    }
  </style>

  <header class="right-header">
    <div class="selector-container">
      <select id="workspace-select" class="workspace-selector" aria-label="共視區項目選單"></select>
    </div>
    <div class="favorites-toolbar">
      <span class="favorites-label">常用：</span>
      <div id="favorites-list" class="favorites-list"></div>
      <button id="btn-edit-favorites" class="edit-fav-btn" title="自訂常用工具">編輯</button>
    </div>
  </header>

  <main class="workspace-content" id="content-container">
    <div id="empty-view" class="empty-state">
      <p>目前尚無可用項目或未選擇檢視內容</p>
    </div>
  </main>
\`;

export class ZizaiRightPanel extends HTMLElement {
  static get observedAttributes() { return ['active-id']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._workspaces = [];
    this._favorites = [];
    this._activeId = null;
    this._isInternalSync = false;

    this._selectEl = this.shadowRoot.querySelector('#workspace-select');
    this._favContainer = this.shadowRoot.querySelector('#favorites-list');
    this._btnEditFav = this.shadowRoot.querySelector('#btn-edit-favorites');
    this._contentContainer = this.shadowRoot.querySelector('#content-container');
    this._emptyView = this.shadowRoot.querySelector('#empty-view');

    this._onSelectChange = this._onSelectChange.bind(this);
    this._onEditFavorites = this._onEditFavorites.bind(this);
  }

  connectedCallback() {
    this._selectEl.addEventListener('change', this._onSelectChange);
    this._btnEditFav.addEventListener('click', this._onEditFavorites);
    this._renderAll();
  }

  disconnectedCallback() {
    this._selectEl.removeEventListener('change', this._onSelectChange);
    this._btnEditFav.removeEventListener('click', this._onEditFavorites);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'active-id' && oldValue !== newValue && !this._isInternalSync) {
      if (newValue === null || newValue === undefined || newValue === '') {
        const fallbackId = this._workspaces.length > 0 ? this._workspaces[0].id : null;
        if (fallbackId) {
          const previousId = this._activeId;
          this._activeId = fallbackId;
          this._syncAttributeAndSelect(fallbackId);
          this._updatePanesActiveState();
          this._renderFavorites();

          if (previousId !== fallbackId) {
            this._dispatchZizaiEvent('zizai-workspace-changed', {
              activeId: this._activeId,
              previousId: previousId
            }, 'attribute_sync');
          }
        } else {
          this._activeId = null;
          this._syncAttributeAndSelect(null);
          this._updatePanesActiveState();
          this._renderFavorites();
        }
        return;
      }

      const exists = this._workspaces.some(w => w.id === newValue);
      if (exists) {
        this.setActiveWorkspace(newValue, 'attribute_sync');
      } else {
        this._syncAttributeAndSelect(this._activeId);
      }
    }
  }

  setWorkspaces(items = []) {
    this._workspaces = Array.isArray(items) ? [...items] : [];

    const exists = this._workspaces.some(w => w.id === this._activeId);
    if (!exists) {
      this._activeId = this._workspaces.length > 0 ? this._workspaces[0].id : null;
    }

    this._renderAll();
    this._syncAttributeAndSelect(this._activeId);
  }

  getWorkspaces() { return this._workspaces.map(w => ({ ...w })); }

  setFavorites(favIds = []) {
    this._favorites = Array.isArray(favIds) ? [...favIds] : [];
    this._renderFavorites();
  }

  getFavorites() { return [...this._favorites]; }

  setActiveWorkspace(id, source = 'programmatic') {
    if (!id) {
      if (this._workspaces.length === 0) {
        this._activeId = null;
        this._syncAttributeAndSelect(null);
        this._updatePanesActiveState();
        this._renderFavorites();
      }
      return;
    }

    const targetExists = this._workspaces.some(w => w.id === id);
    if (!targetExists) return;

    const previousId = this._activeId;

    if (previousId === id && this._contentContainer.querySelector(\`.workspace-pane[data-id="\${id}"]\`)) {
      return;
    }

    this._activeId = id;
    this._syncAttributeAndSelect(id);
    this._updatePanesActiveState();
    this._renderFavorites();

    this._dispatchZizaiEvent('zizai-workspace-changed', {
      activeId: this._activeId,
      previousId: previousId
    }, source);
  }

  getActiveWorkspace() { return this._activeId; }

  _syncAttributeAndSelect(id) {
    this._isInternalSync = true;
    try {
      const validId = id || '';
      if (this.getAttribute('active-id') !== validId) {
        if (validId) this.setAttribute('active-id', validId);
        else this.removeAttribute('active-id');
      }
      if (this._selectEl.value !== validId) this._selectEl.value = validId;
    } finally {
      this._isInternalSync = false;
    }
  }

  _onSelectChange(e) {
    const selectedId = e.target.value;
    if (selectedId) this.setActiveWorkspace(selectedId, 'user_action');
  }

  _onEditFavorites() {
    const availableClean = this._workspaces.map(w => ({ id: w.id, label: w.label }));
    this._dispatchZizaiEvent('zizai-favorites-edit-requested', {
      currentFavorites: [...this._favorites],
      availableWorkspaces: availableClean
    }, 'user_action');
  }

  _dispatchZizaiEvent(eventName, data, source) {
    if (window.ZizaiEvents && typeof window.ZizaiEvents.dispatchCustomEvent === 'function') {
      window.ZizaiEvents.dispatchCustomEvent(this, eventName, data, source, {
        bubbles: true,
        composed: true,
        cancelable: true
      });
    } else {
      const eventDetail = {
        source: source || 'programmatic',
        data: data || {},
        timestamp: Date.now()
      };
      this.dispatchEvent(new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: eventDetail
      }));
    }
  }

  _renderAll() {
    this._renderSelectOptions();
    this._renderWorkspacesContent();
    this._renderFavorites();
  }

  _renderSelectOptions() {
    this._selectEl.innerHTML = '';
    if (this._workspaces.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '-- 無可用項目 --';
      this._selectEl.appendChild(opt);
      this._selectEl.disabled = true;
      return;
    }

    this._selectEl.disabled = false;
    this._workspaces.forEach(ws => {
      const opt = document.createElement('option');
      opt.value = ws.id;
      opt.textContent = ws.label;
      if (ws.id === this._activeId) opt.selected = true;
      this._selectEl.appendChild(opt);
    });
  }

  _renderWorkspacesContent() {
    const oldPanes = this._contentContainer.querySelectorAll('.workspace-pane');
    oldPanes.forEach(pane => pane.remove());

    if (this._workspaces.length === 0) {
      this._emptyView.style.display = 'flex';
      this._emptyView.textContent = '目前無可用共視項目';
      return;
    }

    this._emptyView.style.display = 'none';

    this._workspaces.forEach(ws => {
      const pane = document.createElement('div');
      pane.className = \`workspace-pane \${ws.id === this._activeId ? 'active' : ''}\`;
      pane.dataset.id = ws.id;

      if (ws.content instanceof HTMLElement) {
        pane.appendChild(ws.content);
      } else if (typeof ws.content === 'string') {
        pane.innerHTML = ws.content;
      } else {
        pane.textContent = \`[模組內容: \${ws.label}]\`;
      }

      this._contentContainer.appendChild(pane);
    });
  }

  _updatePanesActiveState() {
    const panes = this._contentContainer.querySelectorAll('.workspace-pane');
    panes.forEach(pane => {
      if (pane.dataset.id === this._activeId) pane.classList.add('active');
      else pane.classList.remove('active');
    });
  }

  _renderFavorites() {
    this._favContainer.innerHTML = '';
    const activeFavs = this._workspaces.filter(ws => this._favorites.includes(ws.id));

    if (activeFavs.length === 0) {
      const placeholder = document.createElement('span');
      placeholder.style.fontSize = '12px';
      placeholder.style.color = '#9ca3af';
      placeholder.textContent = '（無常用工具）';
      this._favContainer.appendChild(placeholder);
      return;
    }

    activeFavs.forEach(ws => {
      const chip = document.createElement('button');
      chip.className = \`favorite-chip \${ws.id === this._activeId ? 'active' : ''}\`;
      chip.textContent = ws.label;
      chip.title = \`切換至 \${ws.label}\`;
      chip.addEventListener('click', () => this.setActiveWorkspace(ws.id, 'user_action'));
      this._favContainer.appendChild(chip);
    });
  }
}

if (!customElements.get('zizai-right-panel')) {
  customElements.define('zizai-right-panel', ZizaiRightPanel);
}

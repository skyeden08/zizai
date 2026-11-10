/**
 * ZIZAI UI - 下拉選單 V1（統一狀態變更與事件派發重建版）
 * 路徑：UI/通用框架項目/下拉選單/dropdown-menu.js
 */
if (!customElements.get('zizai-dropdown')) {
  class ZizaiDropdown extends HTMLElement {
    static get observedAttributes() {
      return ['open', 'label', 'value'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._isOpen = false;
      this._label = '';
      this._value = '';
      this._options = [];
      this._rendered = false;

      // 綁定全域點擊監聽器，確保卸載時可精準移除
      this._boundOutsideClickListener = this._handleOutsideClick.bind(this);
    }

    connectedCallback() {
      if (!this._rendered) {
        this.render();
        this._rendered = true;
      } else {
        this._syncState();
      }

      document.addEventListener('click', this._boundOutsideClickListener);
    }

    disconnectedCallback() {
      document.removeEventListener('click', this._boundOutsideClickListener);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (!this._rendered) return;

      if (name === 'open') {
        this._isOpen = this.hasAttribute('open');
        this._syncState();
      } else if (name === 'label') {
        this._label = newValue || '';
        this._syncLabel();
      } else if (name === 'value') {
        this._value = newValue || '';
        this._syncSelection();
      }
    }

    // --- Props / Attributes Getters & Setters ---

    get open() {
      return this.hasAttribute('open');
    }

    set open(value) {
      if (Boolean(value)) {
        this.setAttribute('open', '');
      } else {
        this.removeAttribute('open');
      }
    }

    get label() {
      return this.getAttribute('label') || '';
    }

    set label(value) {
      if (value !== null && value !== undefined) {
        this.setAttribute('label', value);
      } else {
        this.removeAttribute('label');
      }
    }

    get value() {
      return this.getAttribute('value') || '';
    }

    set value(val) {
      if (val !== null && val !== undefined) {
        this.setAttribute('value', val);
      } else {
        this.removeAttribute('value');
      }
    }

    get options() {
      return this._options;
    }

    set options(arr) {
      this._options = Array.isArray(arr) ? arr : [];
      if (this._rendered) {
        this._renderOptions();
        this._syncSelection();
      }
    }

    // --- Render & DOM ---

    render() {
      this._isOpen = this.hasAttribute('open');
      this._label = this.getAttribute('label') || '請選擇';
      this._value = this.getAttribute('value') || '';

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            position: relative;
            font-family: var(--zizai-font-family, system-ui, -apple-system, sans-serif);
            color: var(--zizai-color-text, #1e293b);
            font-size: 0.95rem;
          }

          .dropdown-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--zizai-color-surface, #f8fafc);
            border: 1px solid var(--zizai-color-border, #e2e8f0);
            border-radius: var(--zizai-radius-md, 8px);
            padding: var(--zizai-spacing-sm, 8px) var(--zizai-spacing-md, 16px);
            cursor: pointer;
            user-select: none;
            min-width: 140px;
            box-shadow: var(--zizai-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }

          .dropdown-toggle:hover {
            border-color: var(--zizai-color-primary, #2563eb);
          }

          .dropdown-toggle:focus {
            outline: none;
            border-color: var(--zizai-color-primary, #2563eb);
            box-shadow: var(--zizai-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
          }

          .toggle-text {
            flex: 1;
            text-align: left;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .toggle-arrow {
            margin-left: var(--zizai-spacing-sm, 8px);
            font-size: 0.75rem;
            color: var(--zizai-color-text-muted, #64748b);
            transition: transform 0.2s ease;
          }

          :host([open]) .toggle-arrow {
            transform: rotate(180deg);
          }

          .dropdown-menu {
            display: none;
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            width: 100%;
            min-width: 160px;
            background-color: var(--zizai-color-background, #ffffff);
            border: 1px solid var(--zizai-color-border, #e2e8f0);
            border-radius: var(--zizai-radius-md, 8px);
            box-shadow: var(--zizai-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
            z-index: 100;
            box-sizing: border-box;
            max-height: 240px;
            overflow-y: auto;
            padding: var(--zizai-spacing-xs, 4px) 0;
          }

          :host([open]) .dropdown-menu {
            display: block;
          }

          .dropdown-item {
            padding: var(--zizai-spacing-sm, 8px) var(--zizai-spacing-md, 16px);
            cursor: pointer;
            user-select: none;
            transition: background-color 0.15s ease;
          }

          .dropdown-item:hover,
          .dropdown-item:focus {
            background-color: var(--zizai-color-surface, #f8fafc);
            color: var(--zizai-color-primary, #2563eb);
            outline: none;
          }

          .dropdown-item.selected {
            font-weight: 600;
            color: var(--zizai-color-primary, #2563eb);
            background-color: var(--zizai-color-surface, #f8fafc);
          }
        </style>

        <div class="dropdown-toggle" part="toggle" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="${this._isOpen}">
          <span class="toggle-text" part="label"></span>
          <span class="toggle-arrow" part="arrow">&#9662;</span>
        </div>
        <div class="dropdown-menu" part="menu" role="listbox"></div>
      `;

      this._renderOptions();
      this._syncLabel();
      this._syncSelection();
      this._bindEvents();
    }

    _renderOptions() {
      const menu = this.shadowRoot.querySelector('.dropdown-menu');
      if (!menu) return;

      menu.innerHTML = '';
      if (!this._options || this._options.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'dropdown-item';
        emptyItem.style.color = 'var(--zizai-color-text-muted, #64748b)';
        emptyItem.textContent = '無可用選項';
        menu.appendChild(emptyItem);
        return;
      }

      this._options.forEach((opt, index) => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.setAttribute('role', 'option');
        item.setAttribute('data-index', index);
        item.setAttribute('data-value', opt.value);
        item.setAttribute('tabindex', '-1');
        item.textContent = opt.text;

        if (opt.value === this._value) {
          item.classList.add('selected');
          item.setAttribute('aria-selected', 'true');
        } else {
          item.setAttribute('aria-selected', 'false');
        }

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          this._selectOption(opt);
        });

        item.addEventListener('keydown', (e) => {
          this._handleItemKeydown(e, index);
        });

        menu.appendChild(item);
      });
    }

    _bindEvents() {
      const toggle = this.shadowRoot.querySelector('.dropdown-toggle');
      if (!toggle) return;

      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this._setOpen(!this.open, { focusPosition: this.open ? 'none' : 'first' });
      });

      toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const willOpen = !this.open;
          this._setOpen(willOpen, { focusPosition: willOpen ? 'first' : 'toggle' });
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (!this.open) {
            this._setOpen(true, { focusPosition: 'first' });
          } else {
            this._focusFirstItem();
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (!this.open) {
            this._setOpen(true, { focusPosition: 'last' });
          } else {
            this._focusLastItem();
          }
        } else if (e.key === 'Escape') {
          if (this.open) {
            e.preventDefault();
            this._setOpen(false, { focusPosition: 'toggle' });
          }
        }
      });
    }

    _setOpen(nextState, { focusPosition = 'none' } = {}) {
      const targetState = Boolean(nextState);
      if (this.open === targetState) {
        return;
      }

      this.open = targetState;

      this.dispatchEvent(new CustomEvent('toggle', {
        detail: { open: targetState },
        bubbles: true,
        composed: true
      }));

      if (focusPosition === 'first' && targetState) {
        requestAnimationFrame(() => this._focusFirstItem());
      } else if (focusPosition === 'last' && targetState) {
        requestAnimationFrame(() => this._focusLastItem());
      } else if (focusPosition === 'toggle') {
        const toggle = this.shadowRoot.querySelector('.dropdown-toggle');
        if (toggle) toggle.focus();
      }
    }

    _handleOutsideClick(e) {
      if (this.open && !this.contains(e.target)) {
        this._setOpen(false, { focusPosition: 'none' });
      }
    }

    _syncState() {
      const toggle = this.shadowRoot.querySelector('.dropdown-toggle');
      if (toggle) {
        toggle.setAttribute('aria-expanded', this.open);
      }
    }

    _syncLabel() {
      const toggleText = this.shadowRoot.querySelector('.toggle-text');
      if (!toggleText) return;

      if (this._value) {
        const found = this._options.find(o => o.value === this._value);
        if (found) {
          toggleText.textContent = found.text;
          return;
        }
      }
      toggleText.textContent = this._label;
    }

    _syncSelection() {
      this._syncLabel();
      const items = this.shadowRoot.querySelectorAll('.dropdown-item');
      items.forEach(item => {
        const val = item.getAttribute('data-value');
        if (val === this._value) {
          item.classList.add('selected');
          item.setAttribute('aria-selected', 'true');
        } else {
          item.classList.remove('selected');
          item.setAttribute('aria-selected', 'false');
        }
      });
    }

    _selectOption(opt) {
      this.value = opt.value;
      this._setOpen(false, { focusPosition: 'toggle' });

      this.dispatchEvent(new CustomEvent('change', {
        detail: { value: opt.value, text: opt.text },
        bubbles: true,
        composed: true
      }));
    }

    _focusFirstItem() {
      const first = this.shadowRoot.querySelector('.dropdown-item[data-index]');
      if (first) first.focus();
    }

    _focusLastItem() {
      const items = this.shadowRoot.querySelectorAll('.dropdown-item[data-index]');
      if (items.length > 0) {
        items[items.length - 1].focus();
      }
    }

    _handleItemKeydown(e, currentIndex) {
      const items = this.shadowRoot.querySelectorAll('.dropdown-item[data-index]');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        items[prevIndex].focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this._options[currentIndex]) {
          this._selectOption(this._options[currentIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this._setOpen(false, { focusPosition: 'toggle' });
      }
    }
  }

  customElements.define('zizai-dropdown', ZizaiDropdown);
}

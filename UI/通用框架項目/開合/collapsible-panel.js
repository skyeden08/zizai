/**
 * ZIZAI UI - 開合框架 V1（通過驗證定稿版）
 * 路徑：UI/通用框架項目/開合/collapsible-panel.js
 */
(function () {
  if (customElements.get('zizai-collapsible')) {
    return;
  }

  class ZizaiCollapsible extends HTMLElement {
    static get observedAttributes() {
      return ['open', 'title-text'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._rendered = false;
    }

    connectedCallback() {
      if (!this._rendered) {
        this.render();
        this._rendered = true;
      } else {
        this._syncState();
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (!this._rendered) return;

      if (name === 'open') {
        this._syncState();
      } else if (name === 'title-text') {
        this._syncTitle();
      }
    }

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

    get titleText() {
      return this.getAttribute('title-text') || '';
    }

    set titleText(value) {
      if (value !== null && value !== undefined) {
        this.setAttribute('title-text', value);
      } else {
        this.removeAttribute('title-text');
      }
    }

    render() {
      const isOpen = this.open;

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: var(--zizai-font-family, system-ui, -apple-system, sans-serif);
            color: var(--zizai-color-text, #1e293b);
            background-color: var(--zizai-color-surface, #f8fafc);
            border: 1px solid var(--zizai-color-border, #e2e8f0);
            border-radius: var(--zizai-radius-md, 8px);
            margin-bottom: var(--zizai-spacing-sm, 8px);
            box-shadow: var(--zizai-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
            overflow: hidden;
          }

          .collapsible-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--zizai-spacing-md, 16px);
            background-color: var(--zizai-color-surface, #f8fafc);
            cursor: pointer;
            user-select: none;
            font-weight: 600;
          }

          .collapsible-header:hover {
            background-color: var(--zizai-color-border, #e2e8f0);
          }

          .title-text {
            flex: 1;
            margin: 0;
            font-size: 1rem;
          }

          .toggle-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            font-size: 0.85rem;
            color: var(--zizai-color-text-muted, #64748b);
            transition: transform 0.2s ease;
          }

          :host([open]) .toggle-icon {
            transform: rotate(90deg);
          }

          .collapsible-content {
            display: none;
            padding: var(--zizai-spacing-md, 16px);
            background-color: var(--zizai-color-background, #ffffff);
            border-top: 1px solid var(--zizai-color-border, #e2e8f0);
          }

          :host([open]) .collapsible-content {
            display: block;
          }
        </style>
        <div class="collapsible-header" part="header" role="button" tabindex="0" aria-expanded="${isOpen}">
          <span class="title-text" part="title"></span>
          <span class="toggle-icon" part="icon" aria-hidden="true">&#9654;</span>
        </div>
        <div class="collapsible-content" part="content">
          <slot></slot>
        </div>
      `;

      this._syncTitle();
      this._bindEvents();
    }

    _bindEvents() {
      const header = this.shadowRoot.querySelector('.collapsible-header');
      if (!header) return;

      header.addEventListener('click', () => {
        this._toggleState();
      });

      header.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this._toggleState();
        }
      });
    }

    _toggleState() {
      const newState = !this.open;
      this.open = newState;

      this.dispatchEvent(new CustomEvent('toggle', {
        detail: { open: newState },
        bubbles: true,
        composed: true
      }));
    }

    _syncState() {
      const header = this.shadowRoot.querySelector('.collapsible-header');
      if (header) {
        header.setAttribute('aria-expanded', this.open);
      }
    }

    _syncTitle() {
      const titleSpan = this.shadowRoot.querySelector('.title-text');
      if (titleSpan) {
        titleSpan.textContent = this.titleText;
      }
    }
  }

  customElements.define('zizai-collapsible', ZizaiCollapsible);
})();

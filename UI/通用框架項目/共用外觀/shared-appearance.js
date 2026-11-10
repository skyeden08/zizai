/**
 * ZIZAI UI - 共用外觀第一版：Web Component 實作（最終定稿版）
 * 路徑：UI/通用框架項目/共用外觀/shared-appearance.js
 */
class SharedAppearance extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._rendered = false;
  }

  connectedCallback() {
    // 避免元件移出 DOM 再插入時重複渲染，防止 Slot 內容與互動狀態遺失
    if (!this._rendered) {
      this.render();
      this._rendered = true;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          /* 使用 var() 搭配 fallback 讀取全域變數，確保主題連動且能獨立運作 */
          display: block;
          font-family: var(--zizai-font-family, system-ui, sans-serif);
          color: var(--zizai-color-text, #1e293b);
          background-color: var(--zizai-color-surface, #f8fafc);
          border: 1px solid var(--zizai-color-border, #e2e8f0);
          border-radius: var(--zizai-radius-md, 8px);
          padding: var(--zizai-spacing-md, 16px);
          box-shadow: var(--zizai-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .appearance-container {
          width: 100%;
          box-sizing: border-box;
        }
      </style>
      <div class="appearance-container">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('shared-appearance', SharedAppearance);

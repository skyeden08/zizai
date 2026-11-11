/**
 * ZIZAI UI 版面項目 - 上方區 V1
 * 路徑：UI/版面項目/上方區/zizai-header-bar.js
 *
 * 職責：顯示平台層級固定資訊（左側 ZIZAI 名稱、右側橫幅預留位）
 * 不負責：登入、連線狀態、對話主題、任務、廣告接入、其他版面區、手機/APP 形態
 */
(function () {
  'use strict';

  if (customElements.get('zizai-header-bar')) {
    return;
  }

  class ZizaiHeaderBar extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._rendered = false;
    }

    connectedCallback() {
      if (!this._rendered) {
        this.render();
        this.setupEventListeners();
        this._rendered = true;
      }
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
            height: 60px;
            background-color: var(--zizai-color-surface, #ffffff);
            border-bottom: 1px solid var(--zizai-color-border, #e5e7eb);
            box-sizing: border-box;
            font-family: var(--zizai-font-family, system-ui, -apple-system, sans-serif);
            user-select: none;
          }

          .header-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 100%;
            padding: 0 24px;
          }

          .brand-section {
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
          }

          .brand-logo {
            font-weight: 700;
            font-size: 1.25rem;
            color: var(--zizai-color-text, #111827);
            letter-spacing: -0.025em;
          }

          .brand-tag {
            font-size: 0.75rem;
            background-color: #f3f4f6;
            color: #4b5563;
            padding: 2px 8px;
            border-radius: 9999px;
            border: 1px solid #e5e7eb;
          }

          .banner-slot {
            flex: 0 1 400px;
            height: 36px;
            background-color: #f9fafb;
            border: 1px dashed #d1d5db;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            font-size: 0.8125rem;
          }

          .banner-slot:hover {
            background-color: #f3f4f6;
          }
        </style>

        <header class="header-container">
          <div class="brand-section" id="brand-area" title="ZIZAI 平台">
            <span class="brand-logo">ZIZAI</span>
            <span class="brand-tag">V1 Desktop</span>
          </div>
          <div class="banner-slot" id="banner-area">
            <span>Banner Placeholder (Reserved)</span>
          </div>
        </header>
      `;
    }

    setupEventListeners() {
      var brandArea = this.shadowRoot.getElementById('brand-area');
      if (!brandArea) return;

      brandArea.addEventListener('click', () => {
        // 優先使用已完成的事件處理工具；若尚未載入則降級為原生 CustomEvent
        if (window.ZizaiEvents && typeof window.ZizaiEvents.dispatchCustomEvent === 'function') {
          window.ZizaiEvents.dispatchCustomEvent(
            this,
            'zizai-header-click',
            { action: 'brand-logo-clicked' },
            'zizai-header-bar'
          );
        } else {
          this.dispatchEvent(new CustomEvent('zizai-header-click', {
            bubbles: true,
            composed: true,
            detail: {
              source: 'zizai-header-bar',
              data: { action: 'brand-logo-clicked' },
              timestamp: Date.now()
            }
          }));
        }
      });
    }
  }

  customElements.define('zizai-header-bar', ZizaiHeaderBar);
})();

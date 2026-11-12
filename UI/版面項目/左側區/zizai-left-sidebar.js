/**
 * ZIZAI UI 版面項目 - 左側區 V1
 * 路徑：UI/版面項目/左側區/zizai-left-sidebar.js
 *
 * 職責：
 * - 獨立左側導覽面板，支援整體收合
 * - 內含五個可獨立開合項目（連線狀態、登入／帳號、任務清單、認知現況、導覽入口）
 * - 透過事件處理工具對外報告狀態變化
 *
 * 不負責：中間／右側／上方區、真實登入／連線／任務邏輯、手機／APP 形態
 */
(function () {
  'use strict';

  if (customElements.get('zizai-left-sidebar')) {
    return;
  }

  class ZizaiLeftSidebar extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._rendered = false;
      this.isCollapsed = false;
      this.sectionStates = {
        connection: true,
        account: true,
        tasks: true,
        cognition: true,
        navigation: true
      };
    }

    connectedCallback() {
      if (!this._rendered) {
        this.render();
        this.bindEvents();
        this._rendered = true;
      }
    }

    /**
     * 公開方法：切換整條左側區收合狀態
     * 同步更新 DOM class 與按鈕文字，外部呼叫與內部點擊行為一致
     */
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
      this.classList.toggle('collapsed', this.isCollapsed);

      var container = this.shadowRoot.getElementById('sidebar-container');
      if (container) {
        if (this.isCollapsed) {
          container.classList.add('collapsed');
        } else {
          container.classList.remove('collapsed');
        }
      }

      var mainBtn = this.shadowRoot.getElementById('main-collapse-btn');
      if (mainBtn) {
        mainBtn.textContent = this.isCollapsed ? '▶' : '◀';
      }

      this._dispatch('zizai-sidebar-toggle', { collapsed: this.isCollapsed });
    }

    render() {
      var collapsedClass = this.isCollapsed ? 'collapsed' : '';
      var btnText = this.isCollapsed ? '▶' : '◀';

      function itemClass(key, states) {
        return states[key] ? '' : 'closed';
      }

      this.shadowRoot.innerHTML =
        '<style>' +
        ':host { display: block; width: 280px; height: 100%; box-sizing: border-box; font-family: var(--zizai-font-family, system-ui, -apple-system, sans-serif); user-select: none; transition: width 0.3s ease; }' +
        ':host(.collapsed) { width: 60px; }' +
        '.sidebar-container { width: 100%; height: 100%; background-color: #fdfdfd; border-right: 1px solid var(--zizai-color-border, #e5e7eb); display: flex; flex-direction: column; transition: width 0.3s ease; overflow: hidden; box-sizing: border-box; }' +
        '.sidebar-container.collapsed { width: 60px; }' +
        '.sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #e5e7eb; background-color: #f9fafb; min-height: 57px; box-sizing: border-box; }' +
        '.sidebar-title { font-weight: 600; font-size: 0.9rem; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }' +
        '.collapsed .sidebar-title { display: none; }' +
        '.collapse-btn { background: #fff; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.75rem; color: #4b5563; }' +
        '.collapse-btn:hover { background-color: #f3f4f6; }' +
        '.sidebar-content { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 12px; }' +
        '.collapsed .sidebar-content { padding: 12px 6px; }' +
        '.accordion-item { border: 1px solid #e5e7eb; border-radius: 6px; background-color: #fff; overflow: hidden; }' +
        '.accordion-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background-color: #f9fafb; cursor: pointer; font-size: 0.85rem; font-weight: 500; color: #1f2937; }' +
        '.accordion-header:hover { background-color: #f3f4f6; }' +
        '.collapsed .accordion-header span.item-text { display: none; }' +
        '.accordion-arrow { font-size: 0.75rem; color: #6b7280; transition: transform 0.2s ease; }' +
        '.accordion-item.closed .accordion-arrow { transform: rotate(-90deg); }' +
        '.accordion-body { padding: 12px; font-size: 0.8rem; color: #4b5563; background-color: #fff; border-top: 1px solid #e5e7eb; display: block; }' +
        '.collapsed .accordion-body, .accordion-item.closed .accordion-body { display: none; }' +
        '.placeholder-text { color: #9ca3af; font-style: italic; margin: 0; }' +
        '</style>' +

        '<div class="sidebar-container ' + collapsedClass + '" id="sidebar-container">' +
          '<div class="sidebar-header">' +
            '<span class="sidebar-title">個人化協作導覽</span>' +
            '<button class="collapse-btn" id="main-collapse-btn" title="收合/展開左側區">' + btnText + '</button>' +
          '</div>' +
          '<div class="sidebar-content">' +
            this._buildItem('connection', '連線狀態', '[佔位] 連線狀態監控中...') +
            this._buildItem('account', '登入／帳號', '[佔位] 尚未登入 / 訪客模式') +
            this._buildItem('tasks', '任務清單／任務切換', '[佔位] 目前尚無執行中任務') +
            this._buildItem('cognition', '認知現況', '[佔位] 系統認知狀態同步中...') +
            this._buildItem('navigation', '導覽／說明入口', '[佔位] 說明文件與快捷導覽') +
          '</div>' +
        '</div>';
    }

    _buildItem(key, title, placeholder) {
      var closedClass = this.sectionStates[key] ? '' : 'closed';
      return '<div class="accordion-item ' + closedClass + '" id="item-' + key + '">' +
        '<div class="accordion-header" data-target="' + key + '">' +
          '<span class="item-text">' + title + '</span>' +
          '<span class="accordion-arrow">▼</span>' +
        '</div>' +
        '<div class="accordion-body">' +
          '<p class="placeholder-text">' + placeholder + '</p>' +
        '</div>' +
      '</div>';
    }

    bindEvents() {
      var self = this;
      var mainBtn = this.shadowRoot.getElementById('main-collapse-btn');
      if (mainBtn) {
        mainBtn.addEventListener('click', function () {
          self.toggleSidebar();
        });
      }

      var headers = this.shadowRoot.querySelectorAll('.accordion-header');
      headers.forEach(function (header) {
        header.addEventListener('click', function (e) {
          var targetKey = header.getAttribute('data-target');
          if (targetKey && self.sectionStates[targetKey] !== undefined) {
            self.sectionStates[targetKey] = !self.sectionStates[targetKey];
            var parentItem = header.closest('.accordion-item');
            if (parentItem) {
              if (self.sectionStates[targetKey]) {
                parentItem.classList.remove('closed');
              } else {
                parentItem.classList.add('closed');
              }
            }
            self._dispatch('zizai-sidebar-section-toggle', {
              section: targetKey,
              isOpen: self.sectionStates[targetKey]
            });
          }
        });
      });
    }

    _dispatch(eventName, data) {
      if (window.ZizaiEvents && typeof window.ZizaiEvents.dispatchCustomEvent === 'function') {
        window.ZizaiEvents.dispatchCustomEvent(this, eventName, data, 'zizai-left-sidebar');
      } else {
        this.dispatchEvent(new CustomEvent(eventName, {
          bubbles: true,
          composed: true,
          detail: {
            source: 'zizai-left-sidebar',
            data: data,
            timestamp: Date.now()
          }
        }));
      }
    }
  }

  customElements.define('zizai-left-sidebar', ZizaiLeftSidebar);
})();

/**
 * ZIZAI 中間區 V1
 * 自訂元素：<zizai-center-panel>
 *
 * 載入順序（從 UI/版面項目/中間區/ 出發）：
 *   ../../通用框架項目/事件處理/zizai-events.js
 *   ./zizai-center-panel.js
 */
(function () {
  'use strict';

  if (customElements.get('zizai-center-panel')) {
    return;
  }

  var TOPIC_VALUES = ['default', 'architecture', 'trading'];
  var SOURCE = 'zizai-center-panel';

  var TEMPLATE_HTML = [
    '<div class="panel">',
    '  <div class="toolbar">',
    '    <label class="toolbar__label" for="topic-select">主題</label>',
    '    <select id="topic-select" class="toolbar__select" aria-label="選擇主題">',
    '      <option value="default">預設主題</option>',
    '      <option value="architecture">架構設計</option>',
    '      <option value="trading">市場交易</option>',
    '    </select>',
    '  </div>',
    '  <div class="messages" role="log" aria-live="polite">',
    '    <div class="messages__empty">尚無訊息</div>',
    '    <div class="messages__list"></div>',
    '  </div>',
    '  <div class="composer">',
    '    <textarea class="composer__input" rows="3" placeholder="輸入訊息…" aria-label="訊息輸入"></textarea>',
    '    <div class="composer__actions">',
    '      <button type="button" class="btn btn--secondary composer__next">Next</button>',
    '      <button type="button" class="btn btn--primary composer__send">送出</button>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('');

  var STYLE_TEXT = [
    ':host {',
    '  display: block;',
    '  width: 100%;',
    '  height: 100%;',
    '  min-height: 0;',
    '  box-sizing: border-box;',
    '  font-family: var(--zizai-font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);',
    '  color: var(--zizai-color-text, #1e293b);',
    '  background: var(--zizai-color-background, #ffffff);',
    '}',
    '.panel {',
    '  display: flex;',
    '  flex-direction: column;',
    '  height: 100%;',
    '  min-height: 0;',
    '  box-sizing: border-box;',
    '}',
    '.toolbar {',
    '  flex: 0 0 auto;',
    '  display: flex;',
    '  align-items: center;',
    '  gap: var(--zizai-spacing-sm, 8px);',
    '  padding: var(--zizai-spacing-sm, 8px) var(--zizai-spacing-md, 16px);',
    '  border-bottom: 1px solid var(--zizai-color-border, #e2e8f0);',
    '  background: var(--zizai-color-surface, #f8fafc);',
    '}',
    '.toolbar__label {',
    '  font-size: 13px;',
    '  color: var(--zizai-color-text-muted, #64748b);',
    '}',
    '.toolbar__select {',
    '  font: inherit;',
    '  font-size: 13px;',
    '  padding: 4px 8px;',
    '  border: 1px solid var(--zizai-color-border, #e2e8f0);',
    '  border-radius: var(--zizai-radius-sm, 4px);',
    '  background: var(--zizai-color-background, #ffffff);',
    '  color: inherit;',
    '}',
    '.messages {',
    '  flex: 1 1 0;',
    '  min-height: 0;',
    '  overflow-y: auto;',
    '  padding: var(--zizai-spacing-md, 16px);',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: var(--zizai-spacing-sm, 8px);',
    '}',
    '.messages__empty {',
    '  display: none;',
    '  color: var(--zizai-color-text-muted, #64748b);',
    '  font-size: 13px;',
    '  text-align: center;',
    '  padding: var(--zizai-spacing-lg, 24px) 0;',
    '}',
    '.messages--empty .messages__empty {',
    '  display: block;',
    '}',
    '.messages__list {',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: var(--zizai-spacing-sm, 8px);',
    '}',
    '.bubble {',
    '  align-self: flex-end;',
    '  max-width: 80%;',
    '  padding: var(--zizai-spacing-sm, 8px) var(--zizai-spacing-md, 16px);',
    '  border-radius: var(--zizai-radius-md, 8px);',
    '  background: var(--zizai-color-primary, #2563eb);',
    '  color: #ffffff;',
    '  white-space: pre-wrap;',
    '  word-break: break-word;',
    '  font-size: 14px;',
    '  line-height: 1.5;',
    '}',
    '.composer {',
    '  flex: 0 0 auto;',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: var(--zizai-spacing-sm, 8px);',
    '  padding: var(--zizai-spacing-sm, 8px) var(--zizai-spacing-md, 16px) var(--zizai-spacing-md, 16px);',
    '  border-top: 1px solid var(--zizai-color-border, #e2e8f0);',
    '}',
    '.composer__input {',
    '  width: 100%;',
    '  box-sizing: border-box;',
    '  font: inherit;',
    '  font-size: 14px;',
    '  padding: var(--zizai-spacing-sm, 8px);',
    '  border: 1px solid var(--zizai-color-border, #e2e8f0);',
    '  border-radius: var(--zizai-radius-sm, 4px);',
    '  resize: none;',
    '  color: inherit;',
    '  background: var(--zizai-color-background, #ffffff);',
    '}',
    '.composer__actions {',
    '  display: flex;',
    '  justify-content: flex-end;',
    '  gap: var(--zizai-spacing-sm, 8px);',
    '}',
    '.btn {',
    '  font: inherit;',
    '  font-size: 13px;',
    '  padding: 6px 14px;',
    '  border-radius: var(--zizai-radius-sm, 4px);',
    '  border: 1px solid transparent;',
    '  cursor: pointer;',
    '}',
    '.btn--primary {',
    '  background: var(--zizai-color-primary, #2563eb);',
    '  color: #ffffff;',
    '}',
    '.btn--primary:hover {',
    '  background: var(--zizai-color-primary-hover, #1d4ed8);',
    '}',
    '.btn--secondary {',
    '  background: var(--zizai-color-surface, #f8fafc);',
    '  color: var(--zizai-color-text, #1e293b);',
    '  border-color: var(--zizai-color-border, #e2e8f0);',
    '}',
    '.btn--secondary:hover {',
    '  background: var(--zizai-color-background, #ffffff);',
    '}'
  ].join('\n');

  function emitEvent(target, name, data) {
    if (window.ZizaiEvents && typeof window.ZizaiEvents.dispatchCustomEvent === 'function') {
      return window.ZizaiEvents.dispatchCustomEvent(target, name, data, SOURCE);
    }
    var evt = new CustomEvent(name, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { source: SOURCE, data: data, timestamp: Date.now() }
    });
    return target.dispatchEvent(evt);
  }

  class ZizaiCenterPanel extends HTMLElement {
    constructor() {
      super();
      this._history = {
        'default': [],
        'architecture': [],
        'trading': []
      };
      this._topic = 'default';
      this._initialized = false;
      this._abort = null;
      this._composing = false;
      this._refs = null;

      this._handleSelectChange = this._handleSelectChange.bind(this);
      this._handleKeydown = this._handleKeydown.bind(this);
      this._handleCompositionStart = this._handleCompositionStart.bind(this);
      this._handleCompositionEnd = this._handleCompositionEnd.bind(this);
      this._handleSendClick = this._handleSendClick.bind(this);
      this._handleNextClick = this._handleNextClick.bind(this);
    }

    connectedCallback() {
      if (!this._initialized) {
        this._build();
        this._initialized = true;
      }
      this._bindListeners();
      this._syncSelect();
      this._renderHistory();
      this._scrollToBottom();
    }

    disconnectedCallback() {
      if (this._abort) {
        this._abort.abort();
        this._abort = null;
      }
      this._composing = false;
    }

    _build() {
      var shadow = this.attachShadow({ mode: 'open' });
      var style = document.createElement('style');
      style.textContent = STYLE_TEXT;
      shadow.appendChild(style);

      var host = document.createElement('div');
      host.innerHTML = TEMPLATE_HTML;
      while (host.firstChild) {
        shadow.appendChild(host.firstChild);
      }

      this._refs = {
        select: shadow.querySelector('.toolbar__select'),
        messages: shadow.querySelector('.messages'),
        list: shadow.querySelector('.messages__list'),
        input: shadow.querySelector('.composer__input'),
        nextBtn: shadow.querySelector('.composer__next'),
        sendBtn: shadow.querySelector('.composer__send')
      };
    }

    _bindListeners() {
      if (this._abort) {
        this._abort.abort();
      }
      this._abort = new AbortController();
      var signal = this._abort.signal;

      this._refs.select.addEventListener('change', this._handleSelectChange, { signal: signal });
      this._refs.input.addEventListener('keydown', this._handleKeydown, { signal: signal });
      this._refs.input.addEventListener('compositionstart', this._handleCompositionStart, { signal: signal });
      this._refs.input.addEventListener('compositionend', this._handleCompositionEnd, { signal: signal });
      this._refs.sendBtn.addEventListener('click', this._handleSendClick, { signal: signal });
      this._refs.nextBtn.addEventListener('click', this._handleNextClick, { signal: signal });
    }

    _handleSelectChange() {
      var value = this._refs.select.value;
      if (TOPIC_VALUES.indexOf(value) === -1) {
        this._syncSelect();
        return;
      }
      if (value === this._topic) {
        return;
      }
      this._topic = value;
      this._renderHistory();
      this._scrollToBottom();
      emitEvent(this, 'zizai-topic-change', { topic: value });
    }

    _handleCompositionStart() {
      this._composing = true;
    }

    _handleCompositionEnd() {
      this._composing = false;
    }

    _isComposingKey(e) {
      if (e.isComposing === true) {
        return true;
      }
      if (this._composing === true) {
        return true;
      }
      if (e.keyCode === 229) {
        return true;
      }
      return false;
    }

    _handleKeydown(e) {
      if (e.key !== 'Enter') {
        return;
      }
      if (this._isComposingKey(e)) {
        return;
      }
      if (e.shiftKey) {
        return;
      }
      e.preventDefault();
      this._send();
    }

    _handleSendClick() {
      this._send();
    }

    _handleNextClick() {
      emitEvent(this, 'zizai-next-click', { topic: this._topic });
    }

    _send() {
      var input = this._refs.input;
      var raw = input.value;
      if (raw.trim() === '') {
        return;
      }
      this._history[this._topic].push(raw);
      this._appendBubble(raw);
      input.value = '';
      this._scrollToBottom();
      emitEvent(this, 'zizai-message-sent', { text: raw, topic: this._topic });
    }

    _appendBubble(text) {
      var bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.textContent = text;
      this._refs.list.appendChild(bubble);
      this._refs.messages.classList.remove('messages--empty');
    }

    _renderHistory() {
      var list = this._refs.list;
      while (list.firstChild) {
        list.removeChild(list.firstChild);
      }
      var history = this._history[this._topic] || [];
      for (var i = 0; i < history.length; i++) {
        var bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = history[i];
        list.appendChild(bubble);
      }
      if (history.length === 0) {
        this._refs.messages.classList.add('messages--empty');
      } else {
        this._refs.messages.classList.remove('messages--empty');
      }
    }

    _syncSelect() {
      this._refs.select.value = this._topic;
    }

    _scrollToBottom() {
      var el = this._refs.messages;
      el.scrollTop = el.scrollHeight - el.clientHeight;
    }
  }

  customElements.define('zizai-center-panel', ZizaiCenterPanel);
})();
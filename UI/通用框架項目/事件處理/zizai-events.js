/**
 * ZIZAI UI 通用框架 - 事件處理 V1
 * 路徑：UI/通用框架項目/事件處理/zizai-events.js
 *
 * 職責：
 * - 提供標準化 dispatchCustomEvent，預設 bubbles: true + composed: true，確保穿透 Shadow DOM
 * - 提供 addEventListenerWithCleanup，回傳清理函式避免記憶體洩漏
 * - 定義統一的 detail 結構（source / data / timestamp）
 *
 * 不負責：畫面、業務邏輯、全域狀態、中央事件匯流排
 */
(function (global) {
  'use strict';

  /**
   * 統一發送標準 CustomEvent
   * @param {EventTarget} target 發送目標
   * @param {string} eventName 事件名稱
   * @param {*} data 傳遞資料
   * @param {string} [source] 來源識別
   * @param {Object} [options] { bubbles, composed, cancelable }
   * @returns {boolean} dispatchEvent 回傳值
   */
  function dispatchCustomEvent(target, eventName, data, source, options) {
    var detail = {
      source: source,
      data: data,
      timestamp: Date.now()
    };

    var customEvent = new CustomEvent(eventName, {
      bubbles: (options && options.bubbles !== undefined) ? options.bubbles : true,
      composed: (options && options.composed !== undefined) ? options.composed : true,
      cancelable: (options && options.cancelable !== undefined) ? options.cancelable : true,
      detail: detail
    });

    return target.dispatchEvent(customEvent);
  }

  /**
   * 安全事件監聽（回傳 cleanup）
   * @param {EventTarget} target
   * @param {string} eventName
   * @param {Function} handler
   * @param {Object|boolean} [options]
   * @returns {Function} cleanup 函式
   */
  function addEventListenerWithCleanup(target, eventName, handler, options) {
    target.addEventListener(eventName, handler, options);
    return function cleanup() {
      target.removeEventListener(eventName, handler, options);
    };
  }

  // 掛到全域，方便其他單元直接使用（也可改為 ES module export）
  global.ZizaiEvents = {
    dispatchCustomEvent: dispatchCustomEvent,
    addEventListenerWithCleanup: addEventListenerWithCleanup
  };

  // 若在 module 環境也可支援
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.ZizaiEvents;
  }
})(typeof window !== 'undefined' ? window : this);

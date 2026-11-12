/**
 * ZIZAI 通用框架項目 - 拖曳調整 V1 (zizai-drag-resizer)
 * 純原生 Web Components + Shadow DOM 實作
 * 職責：僅負責提供拖曳控制介面、追蹤單一作用中指標位移並派發事件，不介入外部版面尺寸控制。
 */

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      position: relative;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
      cursor: col-resize;
      width: var(--zizai-resizer-width, 8px);
      height: var(--zizai-resizer-height, 100%);
      background-color: var(--zizai-color-background);
      transition: background-color var(--zizai-transition-fast, 0.15s ease);
      outline: none;
    }

    :host([orientation="vertical"]) {
      cursor: row-resize;
      width: var(--zizai-resizer-height, 100%);
      height: var(--zizai-resizer-width, 8px);
    }

    :host([disabled]) {
      cursor: not-allowed;
      opacity: var(--zizai-disabled-opacity, 0.4);
      pointer-events: none;
    }

    .handle-track {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .handle-bar {
      width: var(--zizai-resizer-bar-thickness, 2px);
      height: var(--zizai-resizer-bar-length, 24px);
      border-radius: var(--zizai-radius-sm, 2px);
      background-color: var(--zizai-color-border);
      transition: background-color var(--zizai-transition-fast, 0.15s ease),
                  transform var(--zizai-transition-fast, 0.15s ease);
    }

    :host([orientation="vertical"]) .handle-bar {
      width: var(--zizai-resizer-bar-length, 24px);
      height: var(--zizai-resizer-bar-thickness, 2px);
    }

    :host(:hover:not([disabled])) .handle-bar,
    :host(:focus-visible:not([disabled])) .handle-bar {
      background-color: var(--zizai-color-primary);
    }

    :host([data-dragging="true"]) .handle-bar {
      background-color: var(--zizai-color-primary);
      transform: scaleY(1.2);
    }

    :host([orientation="vertical"][data-dragging="true"]) .handle-bar {
      transform: scaleX(1.2);
    }

    :host(:focus-visible) {
      box-shadow: inset 0 0 0 2px var(--zizai-color-primary);
    }
  </style>
  <div class="handle-track" part="track">
    <div class="handle-bar" part="bar"></div>
  </div>
`;

export class ZizaiDragResizer extends HTMLElement {
  static get observedAttributes() {
    return ['orientation', 'disabled', 'step', 'aria-label'];
  }

  constructor() {
    super();
    this._rendered = false;
    this._activePointerId = null;
    this._startX = 0;
    this._startY = 0;
    this._lastX = 0;
    this._lastY = 0;

    this._onPointerDown = this._handlePointerDown.bind(this);
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
    this._onPointerCancel = this._handlePointerCancel.bind(this);
    this._onKeyDown = this._handleKeyDown.bind(this);
  }

  get orientation() {
    return this.getAttribute('orientation') === 'vertical' ? 'vertical' : 'horizontal';
  }

  set orientation(value) {
    if (value === 'vertical') {
      this.setAttribute('orientation', 'vertical');
    } else {
      this.removeAttribute('orientation');
    }
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (Boolean(value)) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  get step() {
    const raw = Number(this.getAttribute('step'));
    return Number.isFinite(raw) && raw > 0 ? raw : 10;
  }

  set step(value) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) {
      this.setAttribute('step', String(num));
    } else {
      this.removeAttribute('step');
    }
  }

  get isDragging() {
    return this._activePointerId !== null;
  }

  connectedCallback() {
    if (!this._rendered) {
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._rendered = true;
    }

    this._syncAccessibilityAttributes();
    this._bindEvents();
  }

  disconnectedCallback() {
    this._resetDragState(true);
    this._unbindEvents();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'disabled' && this.disabled) {
      this._resetDragState(true);
    }

    if (this._rendered) {
      this._syncAccessibilityAttributes();
    }
  }

  _bindEvents() {
    this._unbindEvents();
    this.addEventListener('pointerdown', this._onPointerDown);
    this.addEventListener('pointermove', this._onPointerMove);
    this.addEventListener('pointerup', this._onPointerUp);
    this.addEventListener('pointercancel', this._onPointerCancel);
    this.addEventListener('keydown', this._onKeyDown);
  }

  _unbindEvents() {
    this.removeEventListener('pointerdown', this._onPointerDown);
    this.removeEventListener('pointermove', this._onPointerMove);
    this.removeEventListener('pointerup', this._onPointerUp);
    this.removeEventListener('pointercancel', this._onPointerCancel);
    this.removeEventListener('keydown', this._onKeyDown);
  }

  _syncAccessibilityAttributes() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'separator');
    }

    const ariaOrientation = this.orientation === 'vertical' ? 'horizontal' : 'vertical';
    this.setAttribute('aria-orientation', ariaOrientation);

    if (this.disabled) {
      this.setAttribute('aria-disabled', 'true');
      this.removeAttribute('tabindex');
    } else {
      this.removeAttribute('aria-disabled');
      if (!this.hasAttribute('tabindex')) {
        this.setAttribute('tabindex', '0');
      }
    }

    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', this.orientation === 'vertical' ? '上下拖曳調整' : '左右拖曳調整');
    }
  }

  _resetDragState(emitCancel = false) {
    if (this._activePointerId === null) return;

    const pointerId = this._activePointerId;
    try {
      if (this.hasPointerCapture && this.hasPointerCapture(pointerId)) {
        this.releasePointerCapture(pointerId);
      }
    } catch (_) {}

    this._activePointerId = null;
    this.removeAttribute('data-dragging');

    if (emitCancel) {
      this._emitResizeEvent('zizai-resize-cancel', {
        pointerId,
        pointerType: 'unknown',
        deltaX: 0,
        deltaY: 0,
        totalDeltaX: this._lastX - this._startX,
        totalDeltaY: this._lastY - this._startY,
        direction: 'none',
        source: 'system'
      });
    }
  }

  _handlePointerDown(event) {
    if (this.disabled) return;
    if (this._activePointerId !== null) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.preventDefault();

    this._activePointerId = event.pointerId;
    this._startX = event.clientX;
    this._startY = event.clientY;
    this._lastX = event.clientX;
    this._lastY = event.clientY;

    this.setAttribute('data-dragging', 'true');

    try {
      this.setPointerCapture(event.pointerId);
    } catch (_) {}

    this._emitResizeEvent('zizai-resize-start', {
      pointerId: event.pointerId,
      pointerType: event.pointerType || 'mouse',
      deltaX: 0,
      deltaY: 0,
      totalDeltaX: 0,
      totalDeltaY: 0,
      direction: 'none',
      source: 'pointer'
    });
  }

  _handlePointerMove(event) {
    if (this._activePointerId === null || event.pointerId !== this._activePointerId) {
      return;
    }

    const deltaX = event.clientX - this._lastX;
    const deltaY = event.clientY - this._lastY;
    const totalDeltaX = event.clientX - this._startX;
    const totalDeltaY = event.clientY - this._startY;

    this._lastX = event.clientX;
    this._lastY = event.clientY;

    if (deltaX === 0 && deltaY === 0) return;

    const direction = this._resolveDirection(deltaX, deltaY);

    this._emitResizeEvent('zizai-resize-move', {
      pointerId: event.pointerId,
      pointerType: event.pointerType || 'mouse',
      deltaX,
      deltaY,
      totalDeltaX,
      totalDeltaY,
      direction,
      source: 'pointer'
    });
  }

  _handlePointerUp(event) {
    if (this._activePointerId === null || event.pointerId !== this._activePointerId) {
      return;
    }

    const deltaX = event.clientX - this._lastX;
    const deltaY = event.clientY - this._lastY;
    const totalDeltaX = event.clientX - this._startX;
    const totalDeltaY = event.clientY - this._startY;
    const direction = this._resolveDirection(deltaX, deltaY);

    this._activePointerId = null;
    this.removeAttribute('data-dragging');

    try {
      if (this.hasPointerCapture && this.hasPointerCapture(event.pointerId)) {
        this.releasePointerCapture(event.pointerId);
      }
    } catch (_) {}

    this._emitResizeEvent('zizai-resize-end', {
      pointerId: event.pointerId,
      pointerType: event.pointerType || 'mouse',
      deltaX,
      deltaY,
      totalDeltaX,
      totalDeltaY,
      direction,
      source: 'pointer'
    });
  }

  _handlePointerCancel(event) {
    if (this._activePointerId === null || event.pointerId !== this._activePointerId) {
      return;
    }

    const totalDeltaX = this._lastX - this._startX;
    const totalDeltaY = this._lastY - this._startY;

    this._activePointerId = null;
    this.removeAttribute('data-dragging');

    try {
      if (this.hasPointerCapture && this.hasPointerCapture(event.pointerId)) {
        this.releasePointerCapture(event.pointerId);
      }
    } catch (_) {}

    this._emitResizeEvent('zizai-resize-cancel', {
      pointerId: event.pointerId,
      pointerType: event.pointerType || 'mouse',
      deltaX: 0,
      deltaY: 0,
      totalDeltaX,
      totalDeltaY,
      direction: 'none',
      source: 'pointer'
    });
  }

  _handleKeyDown(event) {
    if (this.disabled) return;

    const baseStep = this.step;
    const multiplier = event.shiftKey ? 5 : 1;
    const distance = baseStep * multiplier;

    let deltaX = 0;
    let deltaY = 0;

    if (this.orientation === 'horizontal') {
      if (event.key === 'ArrowLeft') {
        deltaX = -distance;
      } else if (event.key === 'ArrowRight') {
        deltaX = distance;
      } else {
        return;
      }
    } else {
      if (event.key === 'ArrowUp') {
        deltaY = -distance;
      } else if (event.key === 'ArrowDown') {
        deltaY = distance;
      } else {
        return;
      }
    }

    event.preventDefault();

    const direction = this._resolveDirection(deltaX, deltaY);

    const basePayload = {
      pointerId: null,
      pointerType: 'keyboard',
      source: 'keyboard'
    };

    this._emitResizeEvent('zizai-resize-start', {
      ...basePayload,
      deltaX: 0,
      deltaY: 0,
      totalDeltaX: 0,
      totalDeltaY: 0,
      direction: 'none'
    });

    this._emitResizeEvent('zizai-resize-move', {
      ...basePayload,
      deltaX,
      deltaY,
      totalDeltaX: deltaX,
      totalDeltaY: deltaY,
      direction
    });

    this._emitResizeEvent('zizai-resize-end', {
      ...basePayload,
      deltaX: 0,
      deltaY: 0,
      totalDeltaX: deltaX,
      totalDeltaY: deltaY,
      direction
    });
  }

  _resolveDirection(deltaX, deltaY) {
    if (this.orientation === 'horizontal') {
      if (deltaX < 0) return 'left';
      if (deltaX > 0) return 'right';
      return 'none';
    } else {
      if (deltaY < 0) return 'up';
      if (deltaY > 0) return 'down';
      return 'none';
    }
  }

  _emitResizeEvent(eventName, detail) {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
        detail: Object.freeze({
          targetId: this.id || null,
          orientation: this.orientation,
          ...detail
        })
      })
    );
  }
}

if (!customElements.get('zizai-drag-resizer')) {
  customElements.define('zizai-drag-resizer', ZizaiDragResizer);
}

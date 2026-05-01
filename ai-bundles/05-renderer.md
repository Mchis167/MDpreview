# Module: RENDERER


<file path="renderer/css/design-system/atoms/button.css">
```css
/* ============================================================
   design-system/atoms/button.css
   Uses --_ local variables so variants override props, not rules.
   ============================================================ */

.ds-btn {
  /* ── Local Variables (overridable per variant) ── */
  --_radius: var(--ds-radius-widget);
  --_pad-x: var(--ds-space-md);
  --_gap: 0;
  --_height: var(--ds-space-2xl);
  --_bg: transparent;
  --_color: var(--ds-text-primary);
  --_bg-hover: var(--ds-layer-subtle-hover);
  --_transform-hover: translateY(-1px);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--_height);
  padding: 0 var(--_pad-x);
  border-radius: var(--_radius);
  gap: var(--ds-space-2xs);
  background: var(--_bg);
  color: var(--_color);
  font-family: var(--ds-font-family-text);
  font-size: var(--ds-font-md);
  font-weight: 600;
  letter-spacing: -0.02em;
  white-space: nowrap;
  user-select: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--ds-transition-fast);
  position: relative;
}

.ds-btn.is-loading {
  pointer-events: none;
  opacity: 0.9;
}

/* We no longer hide children as JS now swaps/appends the loader icon */

.ds-icon-spin {
  animation: ds-spin 1s linear infinite;
  display: block;
}

@keyframes ds-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ds-btn-icon-leading,
.ds-btn-icon-trailing {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-space-md);
  height: var(--ds-space-md);
  flex-shrink: 0;
}

.ds-btn svg,
.ds-btn i {
  width: 100%;
  height: 100%;
  display: block;
}

/* ── Spacing logic (margin on label instead of gap) ───── */
.ds-btn-text {
  margin: 0 var(--ds-space-2xs);
}

.ds-btn-text:only-child {
  margin: 0;
}

.ds-btn:hover {
  background: var(--_bg-hover);
  color: var(--_color-hover, var(--_color));
  transform: var(--_transform-hover);
}

.ds-btn:active {
  transform: translateY(0);
}

.ds-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none !important;
}

/* ── Variants (only override changed properties) ───────── */
.ds-btn-primary {
  --_bg: var(--ds-layer-accent-default);
  --_color: var(--ds-text-on-accent);
  --_bg-hover: var(--ds-layer-accent-hover);
}

.ds-btn-ghost,
.ds-btn-subtle-light {
  --_bg: var(--ds-layer-subtle-default);
  --_color: var(--ds-text-primary);
  --_bg-hover: var(--ds-layer-subtle-hover);
  --_transform-hover: none;
}

.ds-btn-subtle-dark {
  --_bg: var(--ds-layer-subtle-dark-default);
  --_color: var(--ds-text-primary);
  --_bg-hover: var(--ds-layer-subtle-dark-hover);
  --_transform-hover: none;
}

.ds-btn-subtitle {
  --_bg: var(--ds-layer-surface-default);
  --_color: var(--ds-text-secondary);
  --_bg-hover: var(--ds-layer-surface-hover);
  --_color-hover: var(--ds-text-primary);
}

.ds-btn-off-label {
  --_pad-x: 0;
  --_gap: 0;
  width: var(--_height);
  justify-content: center;
}


.ds-btn.is-active {
  --_bg: var(--ds-layer-subtle-active);
  --_color: var(--ds-text-primary);
  --_bg-hover: var(--ds-layer-subtle-active-hover);
  border: 1px solid var(--ds-border-selected-subtle);
}

.ds-btn-danger {
  --_bg: var(--ds-status-danger);
  --_color: var(--ds-text-on-accent);
  --_bg-hover: var(--ds-status-danger-hover, var(--ds-red-800));
}

.ds-btn-danger-ghost {
  --_bg: transparent;
  --_color: var(--ds-status-danger);
  --_bg-hover: var(--ds-red-a08);
  --_transform-hover: none;
}
```
</file>

<file path="renderer/css/design-system/atoms/icon-action-button.css">
```css
/* ============================================================
   design-system/atoms/icon-action-button.css
   Uses --_ local variables so variants override props, not rules.
   ============================================================ */

.ds-icon-action-btn {
  /* ── Local Variables ── */
  --_size: 24px;
  --_radius: var(--ds-radius-widget);
  --_bg: transparent;
  --_color: var(--ds-text-tertiary);
  --_bg-hover: var(--ds-layer-subtle-hover);
  --_color-hover: var(--ds-text-secondary);

  width: var(--_size);
  height: var(--_size);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--_radius);
  background: var(--_bg);
  color: var(--_color);
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: all var(--ds-transition-fast);
}

.ds-icon-action-btn:hover {
  background: var(--_bg-hover);
  color: var(--_color-hover);
}

.ds-icon-action-btn svg {
  width: 16px !important;
  height: 16px !important;
  stroke-width: 2.2px;
}

/* ── Variants (only override changed props) ─────────────── */
.ds-icon-action-btn.is-danger {
  --_bg-hover: var(--ds-layer-danger-hover);
  --_color-hover: var(--ds-accent-red);
}

.ds-icon-action-btn.is-primary {
  --_bg: var(--ds-layer-accent-default);
  --_color: var(--ds-text-on-accent);
  --_bg-hover: var(--ds-layer-accent-hover);
  --_color-hover: var(--ds-text-on-accent);
}

.ds-icon-action-btn.is-primary:hover {
  transform: scale(1.1);
}

.ds-icon-action-btn.is-large {
  --_size: 32px;
  --_radius: var(--ds-radius-widget);
}

.ds-icon-action-btn.is-large svg {
  width: 18px !important;
  height: 18px !important;
}
```
</file>

<file path="renderer/css/design-system/atoms/input.css">
```css
/* ── Design System: Input (Atom) ── */

/* ── Form Field & Label ── */
.ds-form-field {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.ds-form-field-label {
    font-family: var(--ds-font-family-code);
    font-size: var(--ds-font-xs);
    font-weight: 700;
    color: var(--ds-text-disabled);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    display: block;
    margin: 0 0 var(--ds-space-sm) var(--ds-space-lg);
    transition: color var(--ds-transition-fast);
}

.ds-form-field-label.has-tooltip {
    cursor: help;
}

.ds-form-field-label.has-tooltip:hover {
    color: var(--ds-accent-blue);
}

/* ── Standard Input ── */

.ds-input {
    width: 100%;
    height: 44px;
    background: var(--ds-layer-control-default);
    border: 1px solid var(--ds-border-default);
    border-radius: var(--ds-radius-panel);
    padding: 0 var(--ds-space-lg);
    color: var(--ds-text-primary);
    font-size: var(--ds-font-md);
    font-family: inherit;
    outline: none;
    transition: all var(--ds-transition-fast);
    user-select: text;
}

.ds-input::placeholder {
    color: var(--ds-text-disabled);
    opacity: 0.7;
}

.ds-input:hover {
    background: var(--ds-layer-control-hover);
    border-color: var(--ds-border-strong);
}

.ds-input:focus {
    background: var(--ds-layer-control-focus);
    border-color: var(--ds-border-xstrong);
}

/* Variants */
.ds-input.ds-input--error {
    border-color: var(--ds-status-danger);
    background: var(--ds-status-danger-bg);
}

.ds-input.ds-input--error:focus {
    box-shadow: 0 0 0 var(--ds-space-2xs) var(--ds-red-a08);
}

.ds-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--ds-layer-subtle-default);
}

/* ── Input Group (with Action) ── */
.ds-input-group {
    display: flex;
    align-items: stretch;
    background: var(--ds-layer-control-default);
    border: 1px solid var(--ds-border-default);
    border-radius: var(--ds-radius-panel);
    overflow: hidden;
    transition: all var(--ds-transition-fast);
}

.ds-input-group .ds-input {
    border: none;
    background: transparent;
    flex: 1;
}

.ds-input-group:hover {
    background: var(--ds-layer-control-hover);
    border-color: var(--ds-border-strong);
}

.ds-input-group:focus-within {
    background: var(--ds-layer-control-focus);
    border-color: var(--ds-border-xstrong);
}

.ds-input-group-action.ds-btn {
    --_height: 42px;
    --_radius: 0 !important;
    border: none !important;
    border-left: 1px solid var(--ds-border-subtle) !important;
    color: var(--ds-text-tertiary);
}

.ds-input-group-action.ds-btn:hover {
    color: var(--ds-text-primary);
    background: var(--ds-white-a05);
}

/* ── Status Indicator ── */
.ds-form-field-status {
    display: none;
    align-items: center;
    gap: var(--ds-space-xs);
    font-size: var(--ds-font-xs);
    line-height: 1.4;
    padding-left: var(--ds-space-lg);
    color: var(--ds-text-tertiary);
    transition: all var(--ds-transition-main);
    opacity: 0;
    transform: translateY(-4px);
    pointer-events: none;
}

.ds-form-field-status.show {
    display: flex;
    margin-top: var(--ds-space-xs);
    min-height: var(--ds-space-lg);
    opacity: 1;
    transform: translateY(0);
}

.ds-form-field-status--success {
    color: var(--ds-status-success);
}

.ds-form-field-status--warning {
    color: var(--ds-status-warning);
}

.ds-form-field-status--error {
    color: var(--ds-status-danger);
}

.ds-form-field-status--info {
    color: var(--ds-text-tertiary);
}

/* Loading state for status */
.ds-form-field-status.is-loading {
    color: var(--ds-text-tertiary);
    font-style: italic;
}

/* Status Indicator Layout with Icon */

.ds-form-field-status-icon svg {
    width: var(--ds-font-base);
    height: var(--ds-font-base);
    display: block;
}

/* Specific icon adjustments if needed */
.ds-form-field-status--success .ds-form-field-status-icon {
    color: var(--ds-status-success);
}

.ds-form-field-status--error .ds-form-field-status-icon {
    color: var(--ds-status-danger);
}

.ds-form-field-status--warning .ds-form-field-status-icon {
    color: var(--ds-status-warning);
}

/* ── URL / Link Variant (Reusable) ── */
.ds-input--link .ds-input {
    color: var(--ds-accent-blue);
    font-family: var(--ds-font-family-code);
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    cursor: pointer;
}

.ds-input--link .ds-input:hover {
    text-decoration: underline;
}

```
</file>

<file path="renderer/css/design-system/atoms/kbd.css">
```css
/* ── Design System: KBD (Atoms) ── */

.ds-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 20px;
  height: 20px;
  padding: 0 6px;

  font-family: var(--ds-font-family-code);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;

  color: var(--ds-text-secondary);
  background: var(--ds-white-a05);
  border: 1px solid var(--ds-border-subtle);
  border-radius: var(--ds-radius-chip);

  transition: all var(--ds-transition-fast);
  user-select: none;
  pointer-events: none;
}

/* Variant: Raised (Physical key look) */
.ds-kbd--raised {
  background: var(--ds-white-a10);
  border-bottom-width: 2px;
  border-bottom-color: var(--ds-black-a50);
  box-shadow: 0 1px 2px var(--ds-black-a30);
}

/* Variant: Inverse (For light backgrounds or active states) */
.ds-kbd--inverse {
  background: var(--ds-layer-subtle-selected);
  color: var(--ds-text-inverse);
  border-color: var(--ds-border-strong);
}

/* Alignment tweak for common symbols */
.ds-kbd svg {
  width: 12px;
  height: 12px;
}
```
</file>

<file path="renderer/css/design-system/atoms/status-badge.css">
```css
/* ── Design System: Status Badge (Atom) ── */

.ds-status-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-sm);
    padding: var(--ds-space-3xs) 0;
    line-height: 1.4;
}

.ds-status-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--ds-radius-pill);
    background: var(--_dot-color, var(--ds-text-tertiary));
    box-shadow: 0 0 4px var(--_dot-color);
    flex-shrink: 0;
}

.ds-status-badge-label {
    font-size: var(--ds-font-sm);
    color: var(--ds-text-secondary);
    font-family: var(--ds-font-family-text);
}

/* Variants */
.ds-status-badge--success { --_dot-color: var(--ds-status-success); }
.ds-status-badge--warning { --_dot-color: var(--ds-status-warning); }
.ds-status-badge--error   { --_dot-color: var(--ds-status-danger); }
.ds-status-badge--danger  { --_dot-color: var(--ds-status-danger); }
.ds-status-badge--info    { --_dot-color: var(--ds-status-info); }

/* Sizes (Optional, defaults to small) */
.ds-status-badge--md .ds-status-badge-label { font-size: var(--ds-font-md); }
.ds-status-badge--md .ds-status-badge-dot { width: 8px; height: 8px; }

```
</file>

<file path="renderer/css/design-system/atoms/switch-toggle.css">
```css
/* ============================================================
   design-system/atoms/switch-toggle.css
   Uses --_ local variables so on/off states override cleanly.
   ============================================================ */

.switch-toggle {
  /* ── Local Variables ── */
  --_bg: var(--ds-white-a10);
  --_bg-hover: var(--ds-white-a15);
  --_border: var(--ds-border-default);
  --_indicator-bg: var(--ds-white-a40);
  --_indicator-x: 0;
  --_indicator-size: 24px;

  display: inline-flex;
  align-items: center;
  width: 52px;
  height: 32px;
  padding: var(--ds-space-2xs);
  background: var(--_bg);
  border: 1px solid var(--_border);
  border-radius: var(--ds-radius-pill);
  cursor: pointer;
  position: relative;
  transition: all var(--ds-transition-main);
  overflow: hidden;
  user-select: none;
  flex-shrink: 0;
}

.switch-toggle:hover {
  background: var(--_bg-hover);
}

/* ── On State ───────────────────────────────────────────── */
.switch-toggle.on {
  --_bg: var(--ds-accent);
  --_bg-hover: var(--ds-accent-hover);
  --_border: var(--ds-black-a20);
  --_indicator-bg: var(--ds-text-inverse);
  --_indicator-x: 20px;
}

.switch-toggle.on:hover {
  border-color: var(--ds-text-inverse);
}

/* ── Indicator (the knob) ───────────────────────────────── */
.switch-indicator {
  width: var(--_indicator-size);
  height: var(--_indicator-size);
  background: var(--_indicator-bg);
  border-radius: var(--ds-radius-pill);
  transition: all 0.3s var(--ds-ease-spring);
  transform: translateX(var(--_indicator-x));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--ds-shadow-sm);
}

.switch-toggle.on .switch-indicator {
  box-shadow: var(--ds-shadow-md);
}

.switch-toggle:hover .switch-indicator {
  background: var(--ds-border-strong);
}

.switch-toggle.on:hover .switch-indicator {
  background: var(--ds-text-inverse);
  box-shadow: 0 0 8px var(--ds-white-a30);
}

/* ── Active: stretch effect ─────────────────────────────── */
.switch-toggle:active .switch-indicator {
  width: 28px;
}

.switch-toggle.on:active .switch-indicator {
  transform: translateX(16px);
}

/* ── Disabled ───────────────────────────────────────────── */
.switch-toggle.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
```
</file>

<file path="renderer/css/design-system/atoms/textarea.css">
```css
/* ============================================================
   textarea.css — Reusable Text Area Component
   ============================================================ */

.textarea-component {
  display: flex;
  flex-direction: column;
}

.textarea-header {
  height: 32px;
  flex-shrink: 0;
  padding: 0 var(--ds-space-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.textarea-label {
  font-family: var(--ds-font-family-code);
  font-weight: 500;
  font-size: var(--ds-font-xs);
  text-transform: uppercase;
  color: var(--ds-text-disabled);
}

.textarea-expand-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--ds-radius-widget);
  color: var(--ds-text-disabled);
  transition: background var(--ds-transition-fast), color var(--ds-transition-fast);
  cursor: pointer;
}

.textarea-expand-btn:hover {
  background: var(--ds-layer-subtle-hover);
  color: var(--ds-text-primary);
}

.textarea-container {
  margin: 0 var(--ds-space-2xs);
  padding: 10px 14px;
  background: var(--ds-layer-control-default);
  border: 1px solid var(--ds-border-default);
  border-radius: var(--ds-radius-panel);
  min-height: 90px;
  transition: border-color var(--ds-transition-fast), background var(--ds-transition-fast);
}

.textarea-component.is-typing .textarea-container {
  border-color: var(--ds-border-strong);
  background: var(--ds-layer-control-hover);
}

.textarea-input {
  width: 100%;
  height: 70px;
  background: transparent;
  border: none;
  color: var(--ds-text-primary);
  font-family: var(--ds-font-family-text);
  font-size: var(--ds-font-lg);
  line-height: 22px;
  resize: none;
  outline: none;
  padding: 0;
  user-select: text;
}

.expanded-textarea-footer {
  padding: 0 var(--ds-space-xl) var(--ds-space-xl);
  display: flex;
  justify-content: flex-end;
  gap: var(--ds-space-md);
}

.textarea-input::placeholder {
  color: var(--ds-text-disabled);
  opacity: 1;
}

/* ── Expanded Textarea Modal ── */
.expanded-textarea-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3000;
  display: none;
  align-items: center;
  justify-content: center;
}

.expanded-textarea-modal.show {
  display: flex;
}

.expanded-textarea-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--ds-bg-backdrop);
  backdrop-filter: blur(var(--ds-blur-lg));
  -webkit-backdrop-filter: blur(var(--ds-blur-lg));
  animation: fadeIn var(--ds-transition-main) forwards;
}

.expanded-textarea-container {
  position: relative;
  width: 724px;
  height: 534px;
  background: var(--ds-surface-overlay);
  border: 1px solid var(--ds-border-default);
  border-radius: var(--ds-radius-shell);
  display: flex;
  flex-direction: column;
  box-shadow: var(--ds-shadow-lg);
  animation: modalScaleUp var(--ds-transition-main) forwards;
  overflow: clip;
}

@keyframes modalScaleUp {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }

  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.expanded-textarea-header {
  height: 48px;
  flex-shrink: 0;
  padding: var(--ds-space-md) var(--ds-space-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.expanded-textarea-header .textarea-label {
  font-family: var(--ds-font-family-code);
  font-weight: 500;
  font-size: var(--ds-font-xs);
  line-height: 16px;
  text-transform: uppercase;
  color: var(--ds-text-disabled);
}

.expanded-textarea-body {
  flex: 1;
  margin: 0 var(--ds-space-2xs) var(--ds-space-2xs) var(--ds-space-2xs);
  padding: var(--ds-space-xl);
  background: var(--ds-layer-control-default);
  border: 1px solid var(--ds-border-default);
  border-radius: max(0px, var(--ds-radius-shell) - var(--ds-space-2xs));
  display: flex;
  overflow: clip;
}

.expanded-textarea-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--ds-text-primary);
  font-family: var(--ds-font-family-text);
  font-size: var(--ds-font-lg);
  line-height: 22px;
  resize: none;
  outline: none;
  padding: 0;
  user-select: text;
}
```
</file>

<file path="renderer/css/design-system/atoms/tooltip.css">
```css
/* ============================================================
   design-system/atoms/tooltip.css
   Smart Singleton Tooltip — Controlled via JS
   ============================================================ */

.ds-tooltip {
  --_offset: 8px;
  position: fixed;
  z-index: 10000;
  pointer-events: none;
  background: var(--ds-bg-elevated);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  padding: 6px 12px;
  color: var(--ds-text-primary);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: var(--ds-shadow-lg);
  opacity: 0;
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
  left: 0;
  top: 0;
}

.ds-tooltip.is-visible {
  opacity: 1;
}

/* ── Position variants for JS calculation ──────────────── */
.ds-tooltip.pos-bottom {
  transform: translateY(var(--_offset));
}
.ds-tooltip.pos-bottom.is-visible {
  transform: translateY(0);
}

.ds-tooltip.pos-top {
  transform: translateY(calc(-1 * var(--_offset)));
}
.ds-tooltip.pos-top.is-visible {
  transform: translateY(0);
}


```
</file>

<file path="renderer/css/design-system/atoms/utilities.css">
```css
/* ============================================================
   design-system/atoms/utilities.css
   Global utility classes: visibility, animations, skeleton
   ============================================================ */

/* ── Visibility ────────────────────────────────────────────── */
.hidden { display: none !important; }

/* ── Animations ────────────────────────────────────────────── */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fade-in  { animation: fadeIn  0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

/* ── Skeleton Loading ──────────────────────────────────────── */
@keyframes skeleton-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--ds-white-a03) 25%,
    var(--ds-white-a08) 50%,
    var(--ds-white-a03) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 2s infinite linear;
  border-radius: var(--ds-radius-chip);
  display: inline-block;
}

.skeleton-text  { height: 14px; width: 100%; }
.skeleton-title { height: 18px; width: 60%; }
.skeleton-icon  { height: 16px; width: 16px; border-radius: var(--ds-radius-chip); }
.skeleton-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  opacity: 0.6;
}

.skeleton-map {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  opacity: 0.4;
  min-height: 400px;
}

```
</file>

<file path="renderer/css/design-system/molecules/combo-button.css">
```css
/* ── Design System: Combo Button (Molecule) ── */
/* Cloned from design-system/atoms/button.css local variable pattern */

.ds-combo-btn {
  /* ── Local Variables (overridable per variant) ── */
  --_radius: var(--ds-radius-widget);
  --_height: var(--ds-space-2xl);
  --_bg: transparent;
  --_color: var(--ds-text-primary);
  --_bg-hover: var(--ds-layer-subtle-hover);
  --_transform-hover: translateY(-1px);
  --_divider: var(--ds-border-subtle);
  --_opacity-toggle: 0.8;

  display: inline-flex;
  align-items: stretch;
  height: var(--_height);
  border-radius: var(--_radius);
  background: var(--_bg);
  color: var(--_color);
  font-family: var(--ds-font-family-text);
  font-size: var(--ds-font-md);
  font-weight: 600;
  transition: all var(--ds-transition-fast);
  overflow: hidden;
  user-select: none;
  cursor: pointer;
  border: 1px solid transparent;
  /* Removed the default/click border effect */
}

.ds-combo-btn:hover {
  background: var(--_bg-hover);
  color: var(--_color-hover, var(--_color));
  transform: var(--_transform-hover);
  box-shadow: var(--ds-shadow-md);
}

.ds-combo-btn:active {
  transform: translateY(0);
}

.ds-combo-btn svg,
.ds-combo-btn i {
  width: var(--ds-space-md);
  height: var(--ds-space-md);
  flex-shrink: 0;
}

/* ── Components ── */
.ds-combo-btn-main {
  display: flex;
  align-items: center;
  padding: 0 var(--ds-space-sm) 0 var(--ds-space-md);
  gap: var(--ds-space-2xs);
  color: inherit;
  border-right: 1px solid var(--_divider);
  transition: background var(--ds-transition-fast);
}

.ds-combo-btn-main .ds-btn-text {
  margin: 0 var(--ds-space-2xs);
}

.ds-combo-btn-main:hover {
  background: var(--ds-white-a05);
}

.ds-combo-btn-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-space-2xl);
  color: inherit;
  opacity: var(--_opacity-toggle);
  transition: all var(--ds-transition-fast);
}

.ds-combo-btn-toggle:hover {
  background: var(--ds-white-a05);
  opacity: 1;
}

.ds-combo-btn-toggle svg {
  transition: transform var(--ds-transition-main);
}

/* ── Variants (cloned from ds-btn) ── */
.ds-combo-btn-primary {
  --_bg: var(--ds-layer-accent-default);
  --_color: var(--ds-text-on-accent);
  --_bg-hover: var(--ds-layer-accent-hover);
  --_divider: rgba(255, 255, 255, 0.2);
}

.ds-combo-btn-ghost,
.ds-combo-btn-subtle-light {
  --_bg: var(--ds-layer-subtle-default);
  --_color: var(--ds-text-primary);
  --_bg-hover: var(--ds-layer-subtle-hover);
  --_transform-hover: none;
}

.ds-combo-btn-subtle-dark {
  --_bg: var(--ds-layer-subtle-dark-default);
  --_color: var(--ds-text-primary);
  --_bg-hover: var(--ds-layer-subtle-dark-hover);
  --_transform-hover: none;
}

.ds-combo-btn-subtitle {
  --_bg: var(--ds-layer-surface-default);
  --_color: var(--ds-text-secondary);
  --_bg-hover: var(--ds-layer-surface-hover);
  --_color-hover: var(--ds-text-primary);
  --_divider: var(--ds-border-subtle);
  backdrop-filter: blur(var(--ds-blur-md));
  -webkit-backdrop-filter: blur(var(--ds-blur-md));
}

.ds-combo-btn[disabled],
.ds-combo-btn.is-disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none !important;
  pointer-events: none;
}

/* ── Open/Active State ──────────────────────────────── */
.ds-combo-btn.is-open,
.ds-combo-btn.is-active {
  background: var(--_bg-hover) !important;
  color: var(--_color-hover, var(--_color));
  border: 1px solid var(--ds-border-selected-subtle);
  box-shadow: var(--ds-shadow-md);
  transform: translateY(0);
}

.ds-combo-btn.is-open .ds-combo-btn-toggle svg,
.ds-combo-btn.is-active .ds-combo-btn-toggle svg {
  transform: rotate(180deg);
}

.ds-combo-btn.is-open .ds-combo-btn-toggle,
.ds-combo-btn.is-active .ds-combo-btn-toggle {
  background: var(--ds-white-a05);
}
```
</file>

<file path="renderer/css/design-system/molecules/context-menu.css">
```css
/* ── Context Menu (Molecule) ────────────────────────── */
.ctx-menu-container {
  display: flex;
  flex-direction: column;
}

@keyframes ctxFade {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.ctx-item {
  padding: var(--ds-space-2xs) var(--ds-space-md);
  font-size: var(--ds-font-sm);
  font-weight: 500;
  color: var(--ds-text-secondary);
  border-radius: calc(var(--ds-radius-panel) - var(--ds-space-2xs));
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--ds-space-md);
  transition: background var(--ds-transition-fast), color var(--ds-transition-fast);
}

.ctx-item:hover {
  background: var(--ds-layer-subtle-hover);
  color: var(--ds-text-inverse);
}

.ctx-item.danger {
  color: var(--ds-accent-red);
}

.ctx-item.danger:hover {
  background: var(--ds-layer-danger-hover);
  color: var(--ds-accent-red);
}

.ctx-item.active {
  background: var(--ds-layer-subtle-active);
  color: var(--ds-accent);
  font-weight: 600;
}

.ctx-item.disabled {
  opacity: 0.4;
  cursor: default;
  pointer-events: none;
}

.ctx-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  flex-shrink: 0;
}

.ctx-item:hover .ctx-icon,
.ctx-item.active .ctx-icon,
.ctx-item.danger .ctx-icon {
  opacity: 1;
}

.ctx-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.ctx-item.active svg {
  color: var(--ds-accent);
}

.ctx-item.danger svg {
  color: var(--ds-accent-red);
}

.ctx-label {
  flex: 1;
  white-space: nowrap;
}

.ctx-shortcut {
  margin-left: var(--ds-space-xl);
  display: flex;
  gap: var(--ds-space-2xs);
  opacity: 0.9;
}

.ctx-item:hover .ds-kbd {
  background: var(--ds-layer-subtle-selected);
  color: var(--ds-text-inverse);
  border-color: var(--ds-border-strong);
}

.ctx-divider {
  height: 1px;
  background: var(--ds-border-strong);
  margin: var(--ds-space-2xs);
}
```
</file>

<file path="renderer/css/design-system/molecules/inline-message.css">
```css
/* ── Design System: Inline Message (Molecule) ── */

.ds-inline-message {
    display: flex;
    align-items: flex-start;
    gap: var(--ds-space-md);
    padding: var(--ds-space-md) var(--ds-space-lg);
    border-radius: var(--ds-radius-panel);
    font-size: var(--ds-font-sm);
    line-height: 1.5;
    margin: var(--ds-space-md) 0;
    border: 1px solid transparent;
}

.ds-inline-message-icon {
    width: 14px;
    height: 14px;
    margin-top: 2px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ds-inline-message-text {
    flex: 1;
}

/* Variants */
.ds-inline-message--info {
    background: var(--ds-white-a02);
    border-color: var(--ds-border-default);
    color: var(--ds-text-secondary);
}
.ds-inline-message--info .ds-inline-message-icon {
    color: var(--ds-accent-blue);
}

.ds-inline-message--success {
    background: var(--ds-status-success-bg);
    border-color: rgba(var(--ds-primitive-green-rgb), 0.1);
    color: var(--ds-status-success);
}

.ds-inline-message--warning {
    background: var(--ds-status-warning-bg);
    border-color: rgba(var(--ds-accent-rgb), 0.1);
    color: var(--ds-status-warning);
}

.ds-inline-message--error {
    background: var(--ds-status-danger-bg);
    border-color: rgba(var(--ds-primitive-red-rgb), 0.1);
    color: var(--ds-status-danger);
}

```
</file>

<file path="renderer/css/design-system/molecules/menu-shield.css">
```css
/* ── Design System: Menu Shield (Molecules) ── */

.ds-menu-shield {
  position: fixed;
  z-index: var(--ds-z-index-popover);
  min-width: 200px;
  max-width: 320px;
  background: var(--ds-bg-floating-glass);
  backdrop-filter: blur(var(--ds-blur-lg)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--ds-blur-lg)) saturate(180%);
  border: 1px solid var(--ds-border-subtle);
  border-radius: var(--ds-radius-panel);
  box-shadow: var(--ds-shadow-lift);
  padding: var(--ds-space-2xs);
  display: flex;
  flex-direction: column;
  animation: dsMenuFadeIn var(--ds-transition-main);
  overflow: hidden;
  pointer-events: auto;
}

@keyframes dsMenuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Header style within shield (optional) */
.ds-menu-shield-header {
  padding: var(--ds-space-sm) var(--ds-space-md) var(--ds-space-md) var(--ds-space-md);
  border-bottom: 1px solid var(--ds-border-subtle);
  margin-bottom: var(--ds-space-2xs);
}

.ds-menu-shield-title {
  font-size: var(--ds-font-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ds-text-tertiary);
  font-family: var(--ds-font-family-code);
}

/* Scrollable body if content is long */
.ds-menu-shield-content {
  overflow-y: auto;
  max-height: 80vh;
}
```
</file>

<file path="renderer/css/design-system/molecules/popover-shield.css">
```css
/* ============================================================
   popover-shield.css — Generic Popover Shield (Modal Backdrop)
   ============================================================ */

.ds-popover-shield,
.ds-popover-floating {
  position: absolute;
  inset: 0;
  z-index: 2500;
  pointer-events: none;
  opacity: 0;
  transition: all var(--ds-transition-main);
}

.ds-popover-shield {
  background: var(--ds-black-a40);
  backdrop-filter: blur(var(--ds-blur-lg));
  -webkit-backdrop-filter: blur(var(--ds-blur-lg));
}

.ds-popover-shield.show,
.ds-popover-floating.show {
  opacity: 1;
  pointer-events: auto;
}

/* ── Alignment Presets ── */
.ds-popover-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ds-popover-bottom-left {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 80px 32px;
}

.ds-popover-custom {
  display: block;
}

.ds-popover-floating .ds-popover-card {
  pointer-events: auto;
}

.ds-popover-card {
  width: 640px;
  background: var(--ds-surface-overlay);
  border: 1px solid var(--ds-border-default);
  border-radius: var(--ds-radius-shell);
  overflow: hidden;
  box-shadow: var(--ds-shadow-lg);
  transform: scale(0.96) translateY(12px);
  opacity: 0;
  transition:
    transform 0.25s var(--ds-ease-spring),
    opacity 0.25s var(--ds-ease-spring);
  display: flex;
  flex-direction: column;
}

.show .ds-popover-card {
  transform: scale(1) translateY(0);
  opacity: 1;
}

.ds-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ds-space-xl) var(--ds-space-lg) var(--ds-space-xl) var(--ds-space-xl);
}

.ds-popover-title {
  font-size: var(--ds-font-xl);
  font-weight: 700;
  color: var(--ds-text-primary);
}

.ds-popover-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--ds-radius-widget);
  color: var(--ds-text-secondary);
  transition: all var(--ds-transition-fast);
  background: transparent;
  border: none;
  cursor: pointer;
}

.ds-popover-close:hover {
  background: var(--ds-layer-subtle-hover);
  color: var(--ds-text-primary);
}

.ds-popover-body {
  padding: 0 0 var(--ds-space-sm) 0;
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.ds-popover-body::-webkit-scrollbar {
  display: none;
}

/* ── Reusable Group Card ── */
.ds-popover-group {
  background: var(--ds-white-a02);
  margin: 0 var(--ds-space-sm) var(--ds-space-sm) var(--ds-space-sm);
  padding: var(--ds-space-xl) var(--ds-space-xl) var(--ds-space-sm) var(--ds-space-xl);
  border-radius: var(--ds-radius-shell-inset);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ds-popover-group:last-child {
  margin-bottom: 0;
}

.ds-popover-group-title {
  font-family: var(--ds-font-family-code);
  font-size: var(--ds-font-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ds-accent);
  margin-bottom: var(--ds-space-md);
  opacity: 0.8;
}

.ds-popover-footer {
  padding: var(--ds-space-lg) var(--ds-space-xl);
  border-top: 1px solid var(--ds-border-default);
  background: var(--ds-white-a02);
  display: flex;
  justify-content: flex-end;
  gap: var(--ds-space-md);
}

/* ── Confirm / Prompt Modal ── */
.ds-confirm-content,
.ds-prompt-content {
  padding: var(--ds-space-sm) var(--ds-space-xl) var(--ds-space-xl) var(--ds-space-xl);
}

.ds-confirm-message {
  font-size: var(--ds-font-base);
  line-height: 1.6;
  color: var(--ds-text-secondary);
}

.ds-prompt-content .ds-field-label {
  display: block;
  font-size: var(--ds-font-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ds-text-tertiary);
  margin-bottom: var(--ds-space-sm);
}

.ds-prompt-content .ds-input {
  width: 100%;
  height: 44px;
  background: var(--ds-layer-control-default);
  border: 1px solid var(--ds-border-default);
  border-radius: var(--ds-radius-widget);
  padding: 0 var(--ds-space-lg);
  color: var(--ds-text-primary);
  font-family: var(--ds-font-family-text);
  font-size: var(--ds-font-base);
  transition: all var(--ds-transition-fast);
}

.ds-prompt-content .ds-input:focus {
  outline: none;
  border-color: var(--ds-accent);
  background: var(--ds-layer-control-hover);
}

.ds-prompt-content .ds-input.ds-input-error {
  border-color: var(--ds-accent-red);
  background: var(--ds-status-danger-bg);
}
```
</file>

<file path="renderer/css/design-system/molecules/project-map.css">
```css
/* ── Design System: Project Map (Molecule) ── */

.ds-project-map {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.ds-project-map__body {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  cursor: crosshair;
  position: relative;
}

.ds-project-map__body::-webkit-scrollbar {
  display: none;
}

/* Track: The total scrollable height area */
.ds-project-map__track {
  position: relative;
  width: 100%;
  min-height: 100%;
}

/* Mirror Container: The actual scaled content */
.ds-project-map__mirror {
  position: absolute;
  top: 0;
  left: 50%;
  /* Center horizontally */
  transform: translateX(-50%) scale(var(--_scale, 0.15));
  transform-origin: top center;
  pointer-events: none;
  user-select: none;
  opacity: 1;
  will-change: transform;
}

/* Viewport Indicator: The highlighted box on the map */
.ds-project-map__viewport {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: color-mix(in sRGB, var(--ds-accent) 5%, transparent);
  border-top: 1px solid color-mix(in sRGB, var(--ds-accent) 10%, transparent);
  border-bottom: 1px solid color-mix(in sRGB, var(--ds-accent) 10%, transparent);
  z-index: 10;
  pointer-events: none;
  transition: all var(--ds-transition-fast);
}

/* Interactive Layer: For catching clicks and drags */
.ds-project-map__overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 20;
}

/* Zoom Footer Bar */
.ds-project-map__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2xs);
  padding: var(--ds-space-2xs) var(--ds-space-sm);
  background: var(--ds-bg-popover-glass);
  border-top: 1px solid var(--ds-border-subtle);
  z-index: 30;
}

.ds-project-map__zoom-label {
  font-size: var(--ds-font-xs);
  font-weight: 700;
  color: var(--ds-text-tertiary);
  min-width: 40px;
  text-align: center;
  font-family: var(--ds-font-family-code);
}

/* High-fidelity rendering optimization */
.ds-project-map__mirror .md-render-body {
  width: 800px !important;
  /* Match CONFIG.baseWidth in JS */
  max-width: 800px !important;
  min-width: 800px !important;
  margin: 0 !important;
  background: transparent !important;
}

/* Maintain padding parity with main viewer to ensure scroll sync accuracy */
.ds-project-map__mirror .md-content-inner {
  padding: 120px 0 !important;
}
```
</file>

<file path="renderer/css/design-system/molecules/scroll-container.css">
```css
/* ── Design System: ScrollContainer (Molecule) ── */

.ds-scroll-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  position: relative;
  
  /* Standard Scrollbar UI */
  scrollbar-width: none;
  -ms-overflow-style: none;
  width: 100%;
}

.ds-scroll-container.is-scrollable {
  /* ── Mask Fading Logic ── */
  --_fade-top: 0;
  --_fade-bottom: 24px;

  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black var(--_fade-top),
    black calc(100% - var(--_fade-bottom)),
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black var(--_fade-top),
    black calc(100% - var(--_fade-bottom)),
    transparent 100%
  );
}

.ds-scroll-container::-webkit-scrollbar {
  display: none;
}

/* ── Scroll Safe Zone ── */
.ds-scroll-safe-zone {
  display: none; /* Hidden by default */
  flex-shrink: 0;
  height: var(--ds-scroll-safe-height, 100px);
  pointer-events: none;
  width: 100%;
}

.ds-scroll-container.is-scrollable .ds-scroll-safe-zone {
  display: block; /* Show only when content overflows */
}

/* ── Scroll Content Wrapper ── */
.ds-scroll-content {
  display: block;
  flex-shrink: 0;
  min-height: 0;
}

```
</file>

<file path="renderer/css/design-system/molecules/segmented-control.css">
```css
/* ============================================================
   design-system/molecules/segmented-control.css
   ============================================================ */

.ds-segmented-control {
  --_radius: var(--ds-segmented-radius, var(--ds-radius-panel));
  --_padding: var(--ds-segmented-padding, var(--ds-space-3xs));

  display: flex;
  background: var(--ds-glass-hover);
  padding: var(--_padding);
  border-radius: var(--_radius);
  gap: var(--ds-space-3xs);
  position: relative;
}

.ds-segment-indicator {
  position: absolute;
  background: var(--ds-white-a08);
  border-radius: calc(var(--_radius) - var(--_padding));
  box-shadow: var(--ds-shadow-xs);
  transition: all var(--ds-transition-main);
  pointer-events: none;
  z-index: 0;
}

.ds-segment-item {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: calc(var(--_radius) - var(--_padding));
  color: var(--ds-text-secondary);
  cursor: pointer;
  transition: all var(--ds-transition-fast);
  position: relative;
  z-index: 1;
}

.ds-segment-item:hover {
  background: var(--ds-white-a05);
  color: var(--ds-text-primary);
}

.ds-segment-item.active {
  color: var(--ds-text-primary);
}

.ds-segment-item svg {
  width: 14px;
  height: 14px;
}
```
</file>

<file path="renderer/css/design-system/molecules/setting-row.css">
```css
/* ── Design System: Setting Row (Molecules) ── */

.ds-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  width: 100%;
  gap: var(--ds-space-md);
}

.ds-setting-row-label-col {
  display: flex;
  flex-direction: column;
}

.ds-setting-row-label {
  font-size: var(--ds-font-lg);
  font-weight: 600;
  color: var(--ds-text-primary);
}

.ds-setting-row-control-col {
  display: flex;
  align-items: center;
  gap: var(--ds-space-md);
  flex: 1;
  max-width: 240px;
  justify-content: flex-end;
}

```
</file>

<file path="renderer/css/design-system/molecules/setting-toggle-item.css">
```css
/* ── Design System: Setting Toggle Item (Molecules) ── */

.ds-setting-toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ds-space-md) var(--ds-space-lg);
  gap: var(--ds-space-md);
  cursor: pointer;
  border-radius: calc(var(--ds-radius-panel) - var(--ds-space-2xs));
  transition: background var(--ds-transition-fast), transform var(--ds-transition-fast);
  min-height: 48px;
  user-select: none;
}

.ds-setting-toggle-item:hover {
  background: var(--ds-layer-subtle-hover);
}

.ds-setting-toggle-item:active {
  transform: scale(0.99);
}

.ds-setting-toggle-label {
  font-size: var(--ds-font-md);
  font-weight: 500;
  color: var(--ds-text-secondary);
  flex: 1;
  transition: color var(--ds-transition-fast);
}

.ds-setting-toggle-item:hover .ds-setting-toggle-label {
  color: var(--ds-text-primary);
}

.ds-setting-toggle-control {
  flex-shrink: 0;
  pointer-events: none;
  /* Let the row handle the click */
}

/* Variant for Menu Context style */
.ds-setting-toggle-item--menu {
  padding: var(--ds-space-sm) var(--ds-space-md);
  min-height: 40px;
  border-radius: var(--ds-radius-panel);
}

.ds-setting-toggle-item--menu .ds-setting-toggle-label {
  font-size: var(--ds-font-md);
}

/* ── Settings Menu Panel (Floating context style) ── */
.ds-settings-menu-panel {
  display: flex;
  flex-direction: column;
  min-width: 220px;
}
```
</file>

<file path="renderer/css/design-system/molecules/sidebar-base.css">
```css
/* ══════════════════════════════════════════════════
   sidebar-base.css — Molecule
   Common structural styles for all side panels
   ══════════════════════════════════════════════════ */

.ds-sidebar-base {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--ds-surface-sidebar);
  backdrop-filter: blur(var(--ds-blur-sidebar));
  -webkit-backdrop-filter: blur(var(--ds-blur-sidebar));
  border: 1px solid var(--ds-border-subtle);
  border-radius: var(--ds-radius-surface);
  position: relative;
  overflow: hidden;
}
```
</file>

<file path="renderer/css/design-system/molecules/sidebar-section-header.css">
```css
/* ══════════════════════════════════════════════════
   sidebar-section-header.css — Molecule
   ══════════════════════════════════════════════════ */

.sidebar-section-header {
  display: flex;
  align-items: center;
  gap: 0;
  height: 32px;
  padding: 0 var(--ds-space-sm) 0 var(--ds-space-2xs);
  flex-shrink: 0;
  margin-top: var(--ds-space-2xs);
  margin-bottom: var(--ds-space-2xs);
  transition: background var(--ds-transition-fast);
  border-radius: var(--ds-radius-sm);
}

.sidebar-section-header[style*="cursor: pointer"]:hover .section-label,
.sidebar-section-header[style*="cursor: pointer"]:hover .section-toggle-btn {
  opacity: 0.9;
  color: var(--ds-text-secondary);
}

.section-toggle-btn {
  width: 24px !important;
  height: 24px !important;
  background: none !important;
  border: none !important;
  opacity: 0.4;
}

.sidebar-section.allow-transition .section-toggle-btn {
  transition: transform var(--ds-transition-main), opacity var(--ds-transition-fast) !important;
}

.section-toggle-btn:hover {
  opacity: 0.8;
}

.sidebar-section.collapsed .section-toggle-btn {
  transform: rotate(-90deg);
}

.sidebar-section-header .section-label {
  flex: 1;
  font-family: var(--ds-font-family-code);
  font-weight: 500;
  font-size: var(--ds-font-xs);
  text-transform: uppercase;
  color: var(--ds-text-secondary);
  opacity: 0.6;
  margin-bottom: 0;
  padding: 0 var(--ds-space-2xs);
  letter-spacing: 0.05em;
  pointer-events: none;
  transition: all var(--ds-transition-fast);
}

.header-actions-group {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2xs);
}

.sidebar-section.allow-transition .header-actions-group {
  transition: opacity var(--ds-transition-fast);
}

.sidebar-section.collapsed .header-actions-group {
  opacity: 0;
  pointer-events: none;
}

.header-action-divider {
  width: 1px;
  height: 14px;
  background: var(--ds-border-strong);
  margin: 0 var(--ds-space-2xs);
  flex-shrink: 0;
}

.sidebar-section-header.drag-hover-header .section-label {
  opacity: 1;
  color: var(--ds-accent-main);
  text-shadow: 0 0 10px var(--ds-accent-a20);
}

```
</file>

<file path="renderer/css/design-system/molecules/tab-preview.css">
```css
/* ── Design System: Tab Preview (Molecules) ── */

.ds-tab-preview {
  position: fixed;
  width: 352px;
  height: 272px;
  background: var(--ds-bg-popover-glass);
  backdrop-filter: blur(var(--ds-blur-lg));
  -webkit-backdrop-filter: blur(var(--ds-blur-lg));
  border: 1px solid var(--ds-border-default);
  border-radius: var(--ds-radius-surface);
  box-shadow: var(--ds-shadow-lg);
  z-index: 2000;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transform: translateY(4px) scale(0.98);
  transition: opacity 0.2s ease, transform 0.2s ease;
  display: flex;
  flex-direction: column;
}

.ds-tab-preview.ds-tab-preview--visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.ds-tab-preview__content-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  justify-content: center;
}

/* The Mirror Viewport: Matches main canvas dimensions before scaling */
.ds-tab-preview__mirror {
  width: 800px;
  /* height set via JS to match main viewer clientHeight */
  flex-shrink: 0;
  transform: scale(0.38);
  transform-origin: top center;
  overflow: hidden;
  /* Scrolled via JS */
  pointer-events: none;
}

.ds-tab-preview__content {
  width: 100%;
}

.ds-tab-preview__mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to bottom, transparent, var(--ds-bg-popover-glass));
  pointer-events: none;
}
.ds-tab-preview__footer {
  height: 32px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid var(--ds-border-default);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--ds-space-md);
  font-size: 11px;
  color: var(--ds-text-tertiary);
  z-index: 10;
  flex-shrink: 0;
}

.ds-tab-preview__filename {
  color: var(--ds-text-secondary);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}

.ds-tab-preview__stats {
  font-size: 10px;
  opacity: 0.8;
}

```
</file>

<file path="renderer/css/design-system/molecules/workspace-switcher.css">
```css
/* ══════════════════════════════════════════════════
   workspace-switcher.css — Molecule
   Sidebar Workspace Selection Trigger
   ══════════════════════════════════════════════════ */

.ds-workspace-switcher-mount {
  padding: var(--ds-space-2xs);
  flex-shrink: 0;
}

.ds-workspace-switcher-outer {
  width: 100%;
}

.ds-workspace-switcher {
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ds-space-2xs) var(--ds-space-md) var(--ds-space-2xs) var(--ds-space-xl);
  background: var(--ds-layer-surface-default);
  border: none;
  cursor: pointer;
  transition: all var(--ds-transition-fast);
  border-radius: calc(var(--ds-radius-surface) - 4px);
}

.ds-workspace-switcher:hover {
  background: var(--ds-layer-surface-hover);
}

.ds-workspace-switcher .ws-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.ds-workspace-switcher .ws-label {
  font-family: var(--ds-font-family-text);
  font-weight: 500;
  font-size: var(--ds-font-xs);
  line-height: 16px;
  text-transform: uppercase;
  color: var(--ds-text-disabled);
  letter-spacing: 0.05em;
}

.ds-workspace-switcher .ds-workspace-name {
  font-family: var(--ds-font-family-text);
  font-weight: 600;
  font-size: var(--ds-font-lg);
  line-height: 20px;
  color: var(--ds-text-primary);
}

/* Skeleton state */
.ds-workspace-switcher .ds-workspace-name.skeleton {
  width: 80px;
  height: 20px;
}

.ds-workspace-switcher .ws-chevron {
  color: var(--ds-text-disabled);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ds-workspace-switcher .ws-chevron svg {
  width: 16px;
  height: 16px;
}
```
</file>

<file path="renderer/css/design-system/organisms/base-form-modal.css">
```css
/* ── Design System: Base Form Modal (Organism) ── */

.ds-form-modal {
    --_modal-px: var(--ds-space-xl);
    display: block;
    padding: 0;
    text-align: center;
}

/* ── Groups ─────────────────────────────────────────────── */

.ds-form-header {
    padding: 56px var(--_modal-px) var(--ds-space-xl) var(--_modal-px);
    margin-bottom: 0;
}

.ds-form-body {
    padding: var(--ds-space-xl) var(--_modal-px);
    text-align: left;
}

.ds-form-footer {
    padding: var(--ds-space-xl);
    margin-top: 0;
}

/* ── Components ─────────────────────────────────────────── */

.ds-form-icon-wrapper {
    width: 64px;
    height: 64px;
    background: var(--ds-layer-surface-default);
    border: 1px solid var(--ds-border-xstrong);
    border-radius: var(--ds-radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--ds-space-xl);
    color: var(--ds-accent);
}

.ds-form-title {
    font-size: var(--ds-space-xl);
    font-weight: 800;
    color: var(--ds-text-primary);
    margin-bottom: var(--ds-space-sm);
    letter-spacing: -0.02em;
    text-align: center;
}

.ds-form-subtitle {
    color: var(--ds-text-tertiary);
    font-size: var(--ds-font-lg);
    margin-bottom: 0;
    line-height: 1.5;
    text-align: center;
}

.ds-form-fields {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-bottom: 0;
}


.ds-form-actions {
    display: flex;
    justify-content: right;
    gap: var(--ds-space-md);
}

/* Helper for divider within modal */
.ds-form-divider {
    height: 1px;
    background: var(--ds-border-default);
    width: 100%;
}
```
</file>

<file path="renderer/css/design-system/organisms/change-action-view-bar.css">
```css
/* ============================================================
   design-system/organisms/change-action-view-bar.css
   ============================================================ */

.ds-change-action-view-bar-container {
  position: absolute;
  bottom: var(--ds-space-lg);
  left: 0;
  right: 0;
  width: 100%;
  z-index: var(--ds-z-index-overlay);
  display: none;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.ds-change-action-view-bar {
  --_bar-radius: var(--ds-radius-surface);
  --_bar-padding: var(--ds-space-2xs);
  display: flex;
  align-items: center;
  background: var(--ds-bg-toolbar);
  -webkit-backdrop-filter: blur(var(--ds-blur-lg));
  backdrop-filter: blur(var(--ds-blur-lg));
  border-radius: var(--_bar-radius);
  border: 1px solid var(--ds-border-xstrong);
  box-shadow: var(--ds-shadow-md);
  pointer-events: auto;
  animation: toolbarSlideUp var(--ds-transition-slow) var(--ds-ease-spring);
}

.ds-toolbar-section-left {
  --_section-radius: calc(var(--_bar-radius) - var(--_bar-padding));
  display: flex;
  align-items: stretch;
  align-self: stretch;
  margin: var(--_bar-padding);
}

.ds-toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--ds-border-strong);
}

.ds-toolbar-buttons {
  --_btn-radius: calc(var(--_bar-radius) - var(--_bar-padding));
  display: flex;
  align-items: stretch;
  align-self: stretch;
  gap: var(--ds-space-2xs);
  padding: var(--_bar-padding);
}

.ds-toolbar-buttons>* {
  height: 100%;
}


@keyframes toolbarSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```
</file>

<file path="renderer/css/design-system/organisms/comment-form.css">
```css
/* ============================================================
   comment-form.css — Design System Component (Organism)
   Floating popup for creating, editing, and viewing comments.
   ============================================================ */

.ds-comment-form {
  position: fixed;
  z-index: 2000;
  width: 360px;
  background: var(--ds-surface-overlay);
  border: 1px solid var(--ds-border-strong);
  border-radius: var(--ds-radius-panel);
  /* Figma Multi-layered Shadow (Node 25:161) */
  box-shadow:
    132px 97px 46px 0 rgba(0, 0, 0, 0),
    85px 62px 42px 0 rgba(0, 0, 0, 0.04),
    48px 35px 35px 0 rgba(0, 0, 0, 0.13),
    21px 16px 26px 0 rgba(0, 0, 0, 0.23),
    5px 4px 14px 0 rgba(0, 0, 0, 0.26);
  display: none;
  overflow: hidden;
  transition: opacity 0.2s, transform 0.2s;
  flex-direction: column;
  cursor: grab;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

.ds-comment-form.show {
  display: flex;
  animation: dsFormPop 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes dsFormPop {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }

  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.ds-comment-form__inner {
  display: flex;
  flex-direction: column;
}

/* ── Edit View ─────────────────────────────────────────── */
.ds-comment-form__edit-view {
  flex-direction: column;
}


.ds-comment-form__input-wrap {
  padding: 20px;
  border-bottom: 1px solid var(--ds-border-default);
  flex: 1;
}

.ds-comment-form__input {
  width: 100%;
  min-height: 40px;
  max-height: 240px;
  background: transparent !important;
  border: none !important;
  padding: 0;
  color: var(--ds-text-primary);
  font-family: inherit;
  font-size: var(--ds-font-base);
  line-height: 20px;
  resize: none !important;
  outline: none !important;
  field-sizing: content;
}

.ds-comment-form__actions {
  display: flex;
  height: auto;
  min-height: 48px;
  justify-content: flex-end;
  align-items: center;
  background: var(--ds-layer-control-default);
  border-top: 1px solid var(--ds-border-default);
  padding: var(--ds-space-md);
}

.ds-comment-form__btn-stack {
  display: flex;
  gap: var(--ds-space-sm);
}


/* ── Read View ─────────────────────────────────────────── */
.ds-comment-form__read-view {
  flex-direction: column;
}


.ds-comment-form__read-header {
  display: flex;
  height: 48px;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 0 16px;
  border-bottom: 1px solid var(--ds-border-default);
}

.ds-comment-form__secondary-action {
  height: 100%;
  display: flex;
  align-items: center;
  padding-right: var(--ds-space-md);
}


.ds-comment-form__header-label {
  font-family: 'Roboto Mono', monospace;
  font-size: var(--ds-font-xs);
  font-weight: 600;
  color: var(--ds-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.ds-comment-form__read-body {
  padding: var(--ds-space-lg) 20px 20px;
}

.ds-comment-form__display {
  font-size: var(--ds-font-base);
  line-height: 20px;
  color: var(--ds-text-primary);
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

/* ── Mode Transitions ──────────────────────────────────── */
/* Mặc định ẩn cả 2 */
.ds-comment-form__edit-view,
.ds-comment-form__read-view {
  display: none;
  flex-direction: column;
}

/* Hiện Edit View khi KHÔNG PHẢI mode view */
.ds-comment-form:not([data-mode="view"]) .ds-comment-form__edit-view {
  display: flex;
}

/* Hiện Read View khi LÀ mode view */
.ds-comment-form[data-mode="view"] .ds-comment-form__read-view {
  display: flex;
}
```
</file>

<file path="renderer/css/design-system/organisms/edit-toolbar.css">
```css
/* ── Design System: Edit Toolbar (Organism) ── */

.ds-edit-toolbar-container {
  position: relative;
  width: 100%;
  z-index: var(--ds-z-index-toolbar);
}

.ds-edit-toolbar {
  pointer-events: auto;
  border-bottom: 1px solid var(--ds-border-subtle);
  border-radius: 0;
  height: 44px;
  padding: 0 var(--ds-space-md) 0 44px;
  display: flex;
  align-items: center;
  gap: var(--ds-space-md);
}

.ds-edit-toolbar-spacer {
  flex: 1;
}

.ds-edit-action-group {
  display: flex;
  align-items: center;
  gap: var(--ds-space-md);
}

.ds-edit-toolbar-divider {
  width: 1px;
  height: 22px;
  background: var(--ds-border-strong);
}

.ds-edit-button-group {
  display: flex;
  align-items: center;
  gap: var(--ds-space-sm);
  margin-left: var(--ds-space-2xs);
}
```
</file>

<file path="renderer/css/design-system/organisms/editor.css">
```css
/* ── Edit Mode Editor & Toolbar ────────────────────────── */

#edit-viewer {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
}

#edit-textarea {
  flex: 1;
  width: 100%;
  background: transparent;
  border: none;
  color: var(--ds-text-primary);
  font-family: var(--ds-font-family-code);
  font-size: var(--ds-font-base);
  padding: 80px 160px;
  resize: none;
  outline: none;
  line-height: 1.6;
}



.edit-help-popover {
  position: fixed;
  /* Fixed position to not affect parent scroll */
  top: 80px;
  /* 20px margin + 48px toolbar + 12px spacing = 80px */
  left: 50%;
  transform: translateX(-50%);
  width: 640px;
  height: 80%;
  min-height: 600px;
  max-height: calc(100vh - 120px);
  /* Safety with respect to viewport */
  background: var(--ds-surface-overlay);
  border: 1px solid var(--ds-white-a08);
  border-radius: var(--ds-radius-shell);
  display: none;
  flex-direction: column;
  z-index: var(--ds-z-index-overlay);
  /* High z-index for fixed menu */
  box-shadow: var(--ds-shadow-xl);
  overflow: clip;
  animation: popoverFadeIn var(--ds-transition-main);
  pointer-events: auto;
}

.edit-help-popover.open {
  display: flex;
}

@keyframes popoverFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, 20px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

/* Sticky Header */
.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: var(--ds-white-a03);
  border-bottom: 1px solid var(--ds-white-a05);
  flex-shrink: 0;
}

.help-header-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--ds-text-primary);
}

.help-close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--ds-radius-widget);
  cursor: pointer;
  color: var(--ds-text-tertiary);
  transition: background 0.2s, color 0.2s;
}

.help-close-btn:hover {
  background: var(--ds-white-a10);
  color: var(--ds-text-inverse);
}

/* Scrollable Content */
.help-content-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px 24px;
}

.help-content-scroll::-webkit-scrollbar {
  width: 6px;
}

.help-content-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.help-content-scroll::-webkit-scrollbar-thumb {
  background: var(--ds-white-a10);
  border-radius: var(--ds-radius-widget);
}

/* Category Groups */
.help-group {
  margin-top: 0;
}

.help-group-title {
  position: sticky;
  top: 0;
  background: var(--ds-surface-overlay);
  padding: 24px 0 16px 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--ds-text-primary);
  border-bottom: 1px solid var(--ds-white-a05);
  margin-bottom: 8px;
  z-index: 1;
}

/* Grid Layout */
.help-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 32px;
}

.help-item-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px;
  margin: 0 -12px;
  /* Every row divider */
  border-bottom: 1px solid var(--ds-white-a03);
  cursor: pointer;
  transition: background 0.15s;
}

.help-item-btn:hover {
  background: var(--ds-white-a04);
}

/* Remove divider on the last row (2 columns) */
.help-item-btn:nth-last-child(-n+2),
.help-empty {
  border-bottom: none;
}

.help-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--ds-text-primary);
}

.help-syntax {
  font-family: 'Roboto Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--ds-accent-green);
  background: var(--ds-green-a15);
  padding: 6px 10px;
  border-radius: var(--ds-radius-sm);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
```
</file>

<file path="renderer/css/design-system/organisms/markdown-blocks.css">
```css
/* ============================================================
   markdown-blocks.css — Complex blocks (Code, Tables, Charts)
   ============================================================ */

/* ── Premium Block System (Shared) ─────────────────────── */
/* Unified style for Code Blocks, Tables, and Charts */
.premium-block-container,
.premium-code-block,
.md-table-wrapper,
.mermaid {
  background: var(--ds-white-a05) !important;
  /* Slightly more opaque for visibility */
  backdrop-filter: blur(40px) !important;
  /* Stable blur value */
  -webkit-backdrop-filter: blur(40px) !important;
  border: 1px solid var(--ds-white-a08) !important;
  border-radius: var(--ds-radius-panel) !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
  margin: 1.5rem 0 !important;
  overflow: hidden !important;
  transition: none !important;
  /* Force hardware acceleration */
  isolation: isolate;
  /* Create new stacking context */
  max-width: 100%;
  box-sizing: border-box;
}

/* No hover state for these blocks per user request */
.premium-block-container:hover,
.premium-code-block:hover,
.md-table-wrapper:hover,
.mermaid:hover {
  border-color: var(--ds-white-a08) !important;
  /* Same as static */
  transform: none !important;
  box-shadow: 0 10px 40px var(--ds-black-a20) !important;
}

/* ── Premium Code Block ────────────────────────────────── */
/* Specific compact margins when inside details */
.md-render-body details .premium-code-block {
  margin-top: 1rem !important;
  margin-bottom: 1rem !important;
}

.md-render-body details>.premium-code-block:first-child,
.md-render-body details>.md-block:first-child .premium-code-block {
  margin-top: 0.5rem !important;
}

/* Ensure pre inside premium block is seamless */
.premium-code-block pre {
  margin: 0 !important;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  overflow-x: auto !important;
  max-width: 100%;
}

/* Premium Scrollbar for Code Blocks */
.premium-code-block pre::-webkit-scrollbar {
  height: 6px;
}

.premium-code-block pre::-webkit-scrollbar-track {
  background: transparent;
}

.premium-code-block pre::-webkit-scrollbar-thumb {
  background: var(--ds-white-a10);
  border-radius: var(--ds-radius-widget);
}

.premium-code-block pre::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--ds-accent-rgb), 0.4);
}

.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 8px 8px 16px;
  background: var(--ds-black-a30);
  border-bottom: 1px solid var(--ds-white-a10);
  user-select: none;
}

.code-block-lang {
  font-size: 10px;
  font-weight: 800;
  color: var(--ds-text-secondary);
  /* Increased visibility */
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: var(--ds-font-family-code);
}

.code-block-copy {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--ds-layer-surface-default);
  border: 1px solid var(--ds-white-a10);
  color: var(--ds-text-secondary);
  padding: 4px 10px;
  border-radius: var(--ds-radius-sm);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.code-block-copy:hover {
  background: var(--ds-layer-surface-hover);
  color: var(--ds-text-inverse);
}

.code-block-copy.copied {
  background: rgba(var(--ds-accent-rgb), 0.15);
  color: var(--ds-accent);
}

.code-block-copy .hidden {
  display: none;
}

.md-render-body pre {
  margin: 2rem 0;
  padding: 20px;
  background: #1f1f24;
  border: 1px solid var(--ds-white-a10);
  border-radius: var(--ds-radius-panel);
  overflow-x: auto;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  line-height: 0;
  /* Fix for pre spacing */
}

.md-render-body pre code {
  display: block;
  background: none;
  padding: 0;
  color: #fff;
  font-size: calc(13.5px * (var(--code-zoom, 100) / 100));
  line-height: 1.6;
  border: none;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  font-family: var(--ds-font-family-code);
}

/* ── Syntax Highlighting (Xcode Exact Palette) ─────────── */
.hljs-comment,
.hljs-quote,
.hljs-doctag {
  color: #a1c659;
  font-style: italic;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-literal,
.hljs-section,
.hljs-link {
  color: #d0a8ff;
}

.hljs-string,
.hljs-regexp,
.hljs-addition,
.hljs-attribute,
.hljs-meta .hljs-string {
  color: #ff8170;
}

.hljs-built_in,
.hljs-class .hljs-title,
.hljs-title.class_,
.hljs-title,
.hljs-name,
.hljs-type,
.hljs-selector-class,
.hljs-selector-attr,
.hljs-selector-pseudo {
  color: #6bdfff;
}

.hljs-number,
.hljs-variable,
.hljs-template-variable,
.hljs-attr {
  color: #d0a8ff;
}

.hljs-symbol,
.hljs-bullet,
.hljs-meta {
  color: #ffa14f;
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-strong {
  font-weight: bold;
}

.hljs-link {
  text-decoration: underline;
}

.hljs-deletion {
  color: #ff8170;
}

/* ── Premium Tables ───────────────────────────────────── */
.md-table-wrapper {
  width: 100%;
  overflow-x: auto;
  margin: 3rem 0;
  border-radius: var(--ds-radius-panel);
  border: 1px solid var(--ds-white-a10);
  background: #0d1117;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.md-render-body table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.95em;
  min-width: 600px;
}

.md-render-body th {
  background: var(--ds-white-a04);
  color: var(--ds-accent);
  padding: 16px 24px;
  text-align: left;
  font-weight: 700;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  border-bottom: 1px solid var(--ds-white-a08);
  white-space: nowrap;
  font-family: var(--ds-font-family-code);
}

.md-render-body td {
  padding: 16px 24px;
  border-bottom: 1px solid var(--ds-white-a05);
  border-right: 1px solid var(--ds-white-a02);
  color: var(--ds-text-secondary);
  line-height: 1.6;
}

.md-render-body td:last-child {
  border-right: none;
}

.md-render-body tr:last-child td {
  border-bottom: none;
}

/* Scrollbar for table wrapper */
.md-table-wrapper::-webkit-scrollbar {
  height: 6px;
}

.md-table-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.md-table-wrapper::-webkit-scrollbar-thumb {
  background: var(--ds-white-a10);
  border-radius: var(--ds-radius-widget);
}

.md-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--ds-accent-rgb), 0.4);
}

/* ── Mermaid Diagrams ──────────────────────────────────── */
.mermaid {
  background: var(--ds-black-a40);
  border: 1px solid var(--ds-border-default);
  border-radius: var(--ds-radius-panel);
  padding: 32px;
  margin: 1.5rem 0;
  cursor: zoom-in;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.mermaid:hover {
  border-color: rgba(var(--ds-accent-rgb), 0.4);
  box-shadow: 0 0 20px rgba(var(--ds-accent-rgb), 0.08);
}

/* ── Mermaid Diagram Overrides (Fix Text Readability) ───── */
.mermaid svg {
  color: var(--ds-text-inverse) !important;
  display: block;
  max-width: 100%;
  height: auto;
}

.mermaid .node rect,
.mermaid .node circle,
.mermaid .node polygon,
.mermaid .node path,
.mermaid .node ellipse,
.mermaid .classGroup rect {
  fill: var(--ds-white-a05) !important;
  stroke: var(--ds-white-a40) !important;
  stroke-width: 1px !important;
}

/* Force all text elements to white */
.mermaid .label,
.mermaid .label text,
.mermaid text,
.mermaid tspan,
.mermaid .classTitle,
.mermaid .classTitle text,
.mermaid .method text,
.mermaid .attribute text,
.mermaid .note text {
  fill: var(--ds-primitive-white) !important;
  color: var(--ds-text-inverse) !important;
  font-family: var(--ds-font-family-text) !important;
  font-weight: 500 !important;
}

.mermaid .edgePath .path,
.mermaid .relation,
.mermaid .relationLine {
  stroke: var(--ds-white-a40) !important;
}

.mermaid .marker,
.mermaid .arrowheadPath {
  fill: var(--ds-white-a40) !important;
  stroke: var(--ds-white-a40) !important;
}

/* Class Diagram Specifics */
.mermaid .classGroup line {
  stroke: var(--ds-white-a30) !important;
}

.mermaid .classTitle text {
  font-weight: 700 !important;
}
```
</file>

<file path="renderer/css/design-system/organisms/markdown-content.css">
```css
/* ============================================================
   markdown-content.css — Markdown typography and core styles
   ============================================================ */

.md-render-body {
  max-width: 800px;
  margin: 0 auto;
  color: var(--ds-text-secondary);
  line-height: 1.8;
  font-size: calc(15px * (var(--preview-zoom, 100) / 100));
}

.md-render-body h1 {
  font-size: calc(32px * (var(--preview-zoom, 100) / 100));
  font-weight: 700;
  color: var(--ds-text-inverse);
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--ds-white-a20);
  letter-spacing: -0.05em;
}

.md-render-body h2 {
  font-size: calc(24px * (var(--preview-zoom, 100) / 100));
  font-weight: 700;
  color: var(--ds-text-inverse);
  margin-top: 3rem;
  margin-bottom: 1.25rem;
  position: relative;
  padding-left: 20px;
  line-height: 1.4;
}

.md-render-body h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.6em;
  width: 8px;
  height: 8px;
  background: var(--ds-accent);
  border-radius: 2px;
}

.md-render-body h3 {
  font-size: calc(18px * (var(--preview-zoom, 100) / 100));
  font-weight: 600;
  color: var(--ds-accent);
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

.md-render-body h4 {
  font-size: calc(16px * (var(--preview-zoom, 100) / 100));
  font-weight: 600;
  color: var(--ds-text-inverse);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.md-render-body h5 {
  font-size: calc(14px * (var(--preview-zoom, 100) / 100));
  font-weight: 600;
  color: var(--ds-text-primary);
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}

.md-render-body h6 {
  font-size: calc(12px * (var(--preview-zoom, 100) / 100));
  font-weight: 600;
  color: var(--ds-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.md-render-body p {
  margin-bottom: 1.25rem;
}

.md-render-body a {
  color: var(--ds-accent);
  text-decoration: none;
  font-weight: 600;
}

.md-render-body a:hover {
  text-decoration: underline;
}

.md-render-body blockquote {
  border-left: 2px solid var(--ds-accent);
  padding: 16px 24px;
  margin: 2rem 0;
  background: var(--ds-white-a02);
  border-radius: 0 12px 12px 0;
  color: var(--ds-text-secondary);
  line-height: 1.7;
}

.md-render-body blockquote p {
  margin-bottom: 0;
}

.md-render-body ul,
.md-render-body ol {
  padding-left: 1.5rem;
  margin-bottom: 1.25rem;
}

.md-render-body li {
  margin-bottom: 0.5rem;
}

.md-render-body hr {
  border: none;
  border-bottom: 1px solid var(--ds-border-default);
  margin: 2rem 0;
}

.md-render-body img {
  max-width: 100%;
  border-radius: var(--ds-radius-panel);
  margin: 1rem 0;
}

.md-render-body code {
  font-family: var(--ds-font-family-code);
  font-size: 0.85em;
  background: rgba(var(--ds-accent-rgb), 0.1);
  padding: 0.15em 0.6em;
  border-radius: var(--ds-radius-sm);
  color: var(--ds-accent);
  border: 1px solid rgba(var(--ds-accent-rgb), 0.25);
  display: inline-block;
  max-width: 100%;
  vertical-align: middle;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  margin: 2px 0;
  line-height: 1.5;
  transition: all 0.2s;
}

.md-render-body h1 code,
.md-render-body h2 code,
.md-render-body h3 code,
.md-render-body h4 code {
  font-size: 0.8em;
  vertical-align: middle;
  border-width: 2px;
  background: rgba(var(--ds-accent-rgb), 0.15);
}

```
</file>

<file path="renderer/css/design-system/organisms/markdown-interactions.css">
```css
/* ============================================================
   markdown-interactions.css — Interaction modes and floating UI
   ============================================================ */

/* ── Interaction Highlights ────────────────────────────── */
.highlight-temp {
  background: rgba(168, 85, 247, 0.12) !important;
}

.pulse-highlight {
  animation: pulse-bg 2s cubic-bezier(0.4, 0, 0.6, 1);
}

@keyframes ds-fade-in-subtle {
  0% {
    opacity: 0;
    transform: translateY(4px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.ds-sync-fade-in {
  animation: ds-fade-in-subtle 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes pulse-bg {

  0%,
  100% {
    background: transparent;
  }

  50% {
    background: rgba(var(--ds-accent-rgb), 0.2);
    box-shadow: 0 0 15px rgba(var(--ds-accent-rgb), 0.1);
  }
}

/* ── Line Comment Targets (comment mode) ───────────────── */
.md-line {
  position: relative;
  padding: 2px 0;
  border-radius: var(--ds-radius-chip);
}

.md-line.has-comment {
  border-left: 2px solid transparent;
  padding-left: 12px;
  margin-left: -12px;
  transition: border-color 0.2s;
}

#md-viewer-mount[data-active-mode="comment"] .md-line.has-comment {
  border-left-color: var(--ds-accent);
}

.comment-range {
  background: transparent;
  border-bottom: 2px solid transparent;
  border-radius: 2px;
  color: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

#md-viewer-mount[data-active-mode="comment"] .comment-range {
  background: rgba(var(--ds-accent-rgb), 0.12);
  border-bottom-color: rgba(var(--ds-accent-rgb), 0.4);
}

#md-viewer-mount[data-active-mode="comment"] .comment-range:hover {
  background: var(--ds-layer-subtle-active-hover);
  border-bottom-color: var(--ds-accent);
}

.idea-range {
  background: transparent;
  border-bottom: 2px solid transparent;
  border-radius: 2px;
  color: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

#md-viewer-mount[data-active-mode="collect"] .idea-range {
  background: rgba(var(--ds-accent-rgb), 0.15);
  border-bottom: 2px solid rgba(var(--ds-accent-rgb), 0.3);
}

#md-viewer-mount[data-active-mode="collect"] .idea-range:hover {
  background: var(--ds-layer-subtle-active-hover);
  border-bottom-color: var(--ds-accent);
}

.pulse-highlight-collect {
  animation: pulseCollect 1.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes pulseCollect {
  0% {
    background: rgba(var(--ds-accent-rgb), 0.4);
  }

  100% {
    background: transparent;
  }
}

/* Floating Triggers (Comment & Collect) */
.comment-trigger,
.collect-trigger {
  --_color: var(--ds-text-primary);
  --_color-hover: var(--ds-text-primary) !important;
  color: var(--ds-text-primary) !important;
  position: fixed;
  opacity: 0;
  pointer-events: none;
  z-index: 1000;
  background: var(--ds-white-a10) !important;
  backdrop-filter: blur(var(--ds-blur-md)) !important;
  -webkit-backdrop-filter: blur(var(--ds-blur-md)) !important;
  border: 1px solid var(--ds-white-a20) !important;
  box-shadow: 0 8px 32px var(--ds-black-a30) !important;
}

.comment-trigger.show,
.collect-trigger.show {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}

.comment-item-snippet .highlight-selection {
  background: rgba(var(--ds-accent-rgb), 0.2);
  color: var(--ds-accent);
  padding: 0 4px;
  border-radius: var(--ds-radius-chip);
  font-weight: 700;
}

/* ── Scroll to Top ─────────────────────────────────────── */
.floating-scroll-top {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 44px;
  height: 44px;
  border-radius: var(--ds-radius-full);
  background: var(--ds-layer-surface);
  border: 1px solid var(--ds-border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-text-primary);
  cursor: pointer;
  z-index: 100;
  opacity: 0;
  transform: translateY(20px) scale(0.8);
  pointer-events: none;
  transition: all var(--ds-transition-normal) var(--ds-ease-spring);
  box-shadow: var(--ds-shadow-lg);
}

.floating-scroll-top.is-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.floating-scroll-top:hover {
  background: var(--ds-layer-surface-hover);
  color: var(--ds-accent);
  transform: translateY(-2px) scale(1.05);
}

.floating-scroll-top:active {
  transform: translateY(0) scale(0.95);
}

.floating-scroll-top svg {
  width: 20px;
  height: 20px;
}
```
</file>

<file path="renderer/css/design-system/organisms/markdown-viewer.css">
```css
/* ============================================================
   markdown-viewer.css — Markdown viewer shell and core layout
   ============================================================ */

/* ── Viewer Container ──────────────────────────────────── */
#md-viewer-mount {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  min-height: 0;
  user-select: text;
  isolation: isolate; /* Create a clean stacking context for floating UI */
}

.md-preview-container,
.md-editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

.md-viewer-viewport {
  flex: 1;
  overflow-y: auto;
  position: relative;
  width: 100%;
  transition: padding var(--ds-transition-slow);

  /* Premium Scroll Mask moved here */
  --mask-top: 40px;
  --mask-bottom: 80px;
  --mask-bottom-stop: 96%;
  --_scroll-mask: linear-gradient(to bottom,
      transparent 0%,
      black var(--mask-top),
      black calc(var(--mask-bottom-stop) - var(--mask-bottom)),
      transparent var(--mask-bottom-stop));
  mask-image: var(--_scroll-mask);
  -webkit-mask-image: var(--_scroll-mask);
}

#md-viewer-mount.has-toc .md-viewer-viewport {
  padding-right: var(--ds-toc-offset);
}

/* Disable scroll mask in edit mode to prevent UI clipping/fading */
#md-viewer-mount[data-mode="edit"] .md-viewer-viewport {
  mask-image: none !important;
  -webkit-mask-image: none !important;
}

.md-content-inner {
  padding: 120px 0;
  transition: opacity var(--ds-transition-main);
}

/* ── Content Skeleton ──────────────────────────────────── */
.md-content-inner.is-loading {
  pointer-events: none;
}

.md-content-inner.is-loading::before {
  content: '';
  display: block;
  height: 40px;
  width: 60%;
  margin-bottom: 40px;
  background: linear-gradient(90deg, var(--ds-white-a03) 25%, var(--ds-white-a08) 50%, var(--ds-white-a03) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 2s infinite linear;
  border-radius: var(--ds-radius-widget);
}

.md-content-inner.is-loading::after {
  content: '';
  display: block;
  height: 300px;
  width: 100%;
  background: linear-gradient(90deg, var(--ds-white-a03) 25%, var(--ds-white-a08) 50%, var(--ds-white-a03) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 2s infinite linear;
  border-radius: var(--ds-radius-panel);
  mask-image: linear-gradient(to bottom,
      black 0%,
      black 10%, transparent 12%,
      transparent 15%, black 17%,
      black 25%, transparent 27%,
      transparent 30%, black 32%,
      black 100%);
  -webkit-mask-image: linear-gradient(to bottom,
      black 0%,
      black 10%, transparent 12%,
      transparent 15%, black 17%,
      black 25%, transparent 27%,
      transparent 30%, black 32%,
      black 100%);
}

/* ── Empty State ───────────────────────────────────────── */
#empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 33px;
}

.illus-wrap {
  width: 240px;
  height: 240px;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.center-illus {
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.5;
  filter: drop-shadow(0 20px 40px var(--ds-black-a50));
}

.empty-state-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

#empty-state h2 {
  font-size: 30px;
  font-weight: 700;
  color: var(--ds-text-secondary);
  letter-spacing: -0.75px;
  line-height: 36px;
}

#empty-state p {
  font-size: 16px;
  font-weight: 500;
  color: var(--ds-text-secondary);
  line-height: 26px;
}

```
</file>

<file path="renderer/css/design-system/organisms/modals-misc.css">
```css
/* ============================================================
   modals-misc.css — Toast Notifications & Keyboard Shortcuts
   ============================================================ */

/* ── App Background Layer ── */
#app-background {
  position: fixed;
  inset: 0;
  z-index: -2;
  background-size: cover;
  background-position: center;
  opacity: 0.1;
  pointer-events: none;
  display: none;
}

/* ── Toast Notification ── */
.toast-container {
  position: fixed;
  top: var(--ds-space-lg);
  right: var(--ds-space-lg);
  z-index: 9999;
  opacity: 0;
  pointer-events: none;
  transition: all 0.4s var(--ds-ease-spring);
  transform: translateX(20px);
}

.toast-container.show {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.toast-content {
  background: var(--ds-surface-overlay);
  border: 1px solid var(--ds-border-strong);
  border-radius: var(--ds-radius-panel);
  padding: var(--ds-space-md) var(--ds-space-md) var(--ds-space-md) var(--ds-space-lg);
  display: flex;
  align-items: center;
  gap: var(--ds-space-sm);
  box-shadow: var(--ds-shadow-lg);
  min-width: 240px;
  position: relative;
  overflow: hidden;
}

.toast-icon {
  width: 16px;
  height: 16px;
  color: var(--ds-accent-green);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-message {
  font-size: var(--ds-font-md);
  font-weight: 600;
  color: var(--ds-accent-green);
  flex: 1;
}

.toast-content.error {
  border-color: var(--ds-red-a30);
}

.toast-content.error .toast-icon,
.toast-content.error .toast-message {
  color: var(--ds-accent-red);
}

.toast-close {
  width: 12px;
  height: 12px;
  color: var(--ds-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: color var(--ds-transition-fast);
}

.toast-close:hover {
  color: var(--ds-text-inverse);
}

/* ── Toast Progress ── */

.toast-progress-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--ds-border-subtle);
  display: none;
}

.toast-content.has-progress .toast-progress-container {
  display: block;
}

.toast-progress-bar {
  height: 100%;
  background: var(--ds-accent-green);
  width: 0%;
  transition: width 0.3s ease;
}

.toast-content.error .toast-progress-bar {
  background: var(--ds-accent-red);
}


```
</file>

<file path="renderer/css/design-system/organisms/publish-config.css">
```css
/* ============================================================
   publish-config.css — Organism
   Purpose: Styles for Publish Success Modal and Config Popover
   ============================================================ */

/* ── Floating Publish Button State ── */
.floating-publish-btn.is-published {
  border-color: var(--ds-blue-a30);
}

.floating-publish-btn.is-published .ds-btn-icon-leading {
  color: var(--ds-accent-blue);
}

/* ── Publish Configuration Popover ── */
.ds-publish-config-shield.ds-menu-shield {
  --_panel-px: var(--ds-space-lg);
  width: 360px;
  max-width: 360px;
  padding: var(--ds-space-md);
}

.ds-publish-config-shield .ds-menu-shield-header {
  border-bottom: none;
  padding: var(--ds-space-sm) var(--_panel-px) var(--ds-space-xs) var(--_panel-px);
}

.ds-publish-config-shield .ds-menu-shield-title {
  font-size: var(--ds-font-lg);
  font-weight: 700;
  text-transform: none;
  letter-spacing: normal;
  color: var(--ds-text-primary);
  font-family: var(--ds-font-family-text);
}

.ds-publish-config-panel {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-lg);
  width: 100%;
}

.ds-publish-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--ds-space-sm);
}

.ds-publish-actions-right {
  display: flex;
  gap: var(--ds-space-sm);
}

.ds-publish-status-info {
  margin-bottom: var(--ds-space-xs);
}

.ds-publish-input {
  width: 100%;
}

.ds-publish-config-shield .ds-menu-shield-content {
  padding: 0;
}


/* Status Badge spacing in Publish Panel */
.ds-publish-status-badge,
.ds-publish-engine-badge {
  padding-left: var(--_panel-px);
  padding-right: var(--_panel-px);
}
```
</file>

<file path="renderer/css/design-system/organisms/right-sidebar.css">
```css
/* ============================================================
   ds-right-sidebar.css — Organism
   ============================================================ */

.ds-right-sidebar-wrap {
  width: 0;
  min-width: 0;
  overflow: hidden;
  flex-shrink: 0;
  margin-left: -4px;
  position: relative;
  transition:
    width 0.4s var(--ds-ease-spring),
    min-width 0.4s var(--ds-ease-spring),
    margin-left 0.4s var(--ds-ease-spring);
}

.ds-right-sidebar-wrap.open {
  width: var(--sidebar-right-width, 256px);
  min-width: 256px;
  margin-left: 0;
}

/* ── Resizer ── */
.ds-right-sidebar-resizer {
  position: absolute;
  top: 0;
  left: -2px;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
  transition: background var(--ds-transition-fast);
}

.ds-right-sidebar-resizer:hover,
.ds-right-sidebar-resizer.is-resizing {
  background: rgba(var(--ds-accent-rgb), 0.3);
}

/* ── Main Sidebar Container ── */
.ds-right-sidebar {
  border: 1px solid var(--ds-border-strong);
}

/* ── Header ── */
.ds-sidebar-header {
  height: 40px;
  flex-shrink: 0;
  padding: 0 0 0 var(--ds-space-lg);
  border-bottom: 1px solid var(--ds-border-default);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ds-sidebar-title {
  font-size: var(--ds-font-lg);
  font-weight: 700;
  color: var(--ds-text-primary);
  flex: 1;
  text-transform: capitalize;
}

.ds-sidebar-actions {
  display: flex;
  height: 100%;
  align-items: center;
}

/* ── Content List ── */
.ds-sidebar-content-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  position: relative;
}

.ds-sidebar-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* ── Empty State ── */
.ds-sidebar-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-lg);
  width: 100%;
  color: var(--ds-text-disabled);
  text-align: center;
  padding: 40px;
  pointer-events: none;
}

.ds-sidebar-empty p {
  font-family: var(--ds-font-family-code);
  font-size: var(--ds-font-sm);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.ds-sidebar-empty svg,
.ds-sidebar-empty img {
  opacity: 0.2;
}

/* ── Item Styles ── */
.ds-sidebar-item {
  display: flex;
  flex-direction: column;
  padding: var(--ds-space-lg);
  border-bottom: 1px solid var(--ds-border-default);
  transition: all var(--ds-transition-fast);
  position: relative;
  cursor: pointer;
}

.ds-sidebar-item:hover {
  background: var(--ds-layer-subtle-hover);
}

.ds-sidebar-item.is-selected {
  background: var(--ds-layer-subtle-selected);
  border-left: 2px solid var(--ds-accent);
}

.ds-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--ds-space-sm);
}

.ds-item-label {
  font-family: var(--ds-font-family-code);
  font-weight: 600;
  font-size: var(--ds-font-xs);
  text-transform: uppercase;
  color: var(--ds-text-secondary);
  letter-spacing: 0.05em;
}

.ds-item-delete-btn {
  opacity: 0;
}

.ds-sidebar-item:hover .ds-item-delete-btn {
  opacity: 1;
}

.ds-item-header-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2xs);
  min-width: 0;
}

.ds-item-snippet {
  font-family: var(--ds-font-family-code);
  font-size: var(--ds-font-xs);
  color: var(--ds-text-disabled);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 16px;
}

.ds-item-snippet .highlight-selection {
  background: rgba(var(--ds-accent-rgb), 0.2);
  color: var(--ds-accent);
  padding: 0 2px;
  border-radius: var(--ds-radius-chip);
}

.ds-item-body {
  font-size: var(--ds-font-base);
  color: var(--ds-text-secondary);
  line-height: 20px;
  overflow-wrap: break-word;
}

.ds-text-clamp-5 {
  display: -webkit-box;
  line-clamp: 5;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: var(--ds-font-md);
}
```
</file>

<file path="renderer/css/design-system/organisms/search-palette.css">
```css
/* ── Design System: Search Palette (Organism) ── */

.ds-search-palette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--ds-black-a20);
  z-index: 10000;
  display: flex;
  /* Keep layout active for transitions */
  justify-content: center;
  align-items: flex-start;
  padding-top: 10vh;
  visibility: hidden;
  pointer-events: none;
}

.ds-search-palette-overlay.open {
  visibility: visible;
  pointer-events: auto;
}

.ds-search-palette-box {
  width: 600px;
  /* Start as search bar */
  background: var(--ds-white-a10);
  backdrop-filter: blur(var(--ds-blur-searchbox));
  -webkit-backdrop-filter: blur(var(--ds-blur-searchbox));
  border: 1px solid var(--ds-border-strong);
  border-radius: var(--ds-radius-surface);
  box-shadow: var(--ds-shadow-lift);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transition:
    opacity 0.3s ease,
    width 0.3s var(--ds-ease-out),
    max-height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  --_target-h: 58px;
  max-height: var(--_target-h);
}

.ds-search-palette-overlay.open .ds-search-palette-box {
  opacity: 1;
}

/* Removed ds-palette-expand-full in favor of JS-driven dynamic height transition */

/* ── Header ── */
.palette-header {
  display: flex;
  align-items: center;
  padding: var(--ds-space-lg);
  gap: var(--ds-space-md);
  border-bottom: 1px solid var(--ds-border-subtle);
}

.palette-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-text-tertiary);
  flex-shrink: 0;
}

.palette-icon svg {
  width: 100%;
  height: 100%;
}

.palette-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--ds-text-primary);
  font-size: var(--ds-font-xl);
  font-family: var(--ds-font-family-text);
}

/* ── Filter Badge ── */
.palette-badge-container:empty {
  display: none;
}

.palette-badge {
  display: flex;
  align-items: center;
  padding: 0;
  background: none;
  border: none;
  color: var(--ds-accent);
  font-size: var(--ds-font-xl);
  font-family: var(--ds-font-family-text);
  animation: ds-badge-pop 0.2s var(--ds-ease-out);
  flex-shrink: 0;
}

.palette-badge::after {
  content: ":";
  margin-left: 2px;
  opacity: 0.5;
}

@keyframes ds-badge-pop {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ── Options Bar ── */
.palette-options {
  display: flex;
  padding: var(--ds-space-md) var(--ds-space-lg) var(--ds-space-2xs);
  gap: var(--ds-space-2xs);
}

.palette-options .ds-btn {
  font-size: 12px;
  font-weight: 500;
  height: 24px;
}

.palette-options .ds-btn.is-active {
  background: var(--ds-layer-surface-active);
  border: 1px solid var(--ds-border-strong);
  color: var(--ds-text-primary);
}

.palette-input::placeholder {
  color: var(--ds-text-tertiary);
  opacity: 0.5;
}

/* ── Results ── */
.palette-results {
  max-height: 500px;
  /* Static limit for content, independent of morph variable */
  overflow-y: auto;
  padding-bottom: 24px;
  position: relative;
  scrollbar-width: none;
  /* Hide scrollbar in MDpreview style */
}

.palette-results.is-empty {
  padding-bottom: 0;
}

.ds-search-palette-box.is-shortcut-mode .palette-results {
  max-height: 700px;
  /* Larger limit for shortcuts */
}

.palette-results::-webkit-scrollbar {
  display: none;
}

.palette-results.is-scrollable {
  /* Smart Mask Fading */
  --_fade-top: 0;
  --_fade-bottom: 24px;

  -webkit-mask-image: linear-gradient(to bottom,
      transparent 0%,
      black var(--_fade-top),
      black calc(100% - var(--_fade-bottom)),
      transparent 100%);
  mask-image: linear-gradient(to bottom,
      transparent 0%,
      black var(--_fade-top),
      black calc(100% - var(--_fade-bottom)),
      transparent 100%);
}

.palette-item {
  display: flex;
  align-items: center;
  padding: var(--ds-space-md) var(--ds-space-lg);
  gap: var(--ds-space-md);
  cursor: pointer;
}

.palette-item:hover {
  background: var(--ds-layer-subtle-hover);
}

.palette-item.selected {
  background: var(--ds-layer-subtle-selected);
}

.palette-section-header {
  padding: var(--ds-space-lg) var(--ds-space-lg) var(--ds-space-sm) var(--ds-space-lg);
  font-size: var(--ds-font-xs);
  font-weight: 700;
  color: var(--ds-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.palette-divider {
  height: 1px;
  background: var(--ds-border-subtle);
  margin: var(--ds-space-sm) var(--ds-space-lg);
  opacity: 0.5;
}

.palette-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--ds-space-4xl);
  text-align: center;
}

.empty-state-icon {
  color: var(--ds-text-tertiary);
  opacity: 0.2;
  margin-bottom: var(--ds-space-md);
}

.empty-state-icon svg {
  width: 48px;
  height: 48px;
}

.empty-state-title {
  color: var(--ds-text-primary);
  font-size: var(--ds-font-lg);
  font-weight: 600;
  margin-bottom: var(--ds-space-2xs);
}

.empty-state-desc {
  color: var(--ds-text-tertiary);
  font-size: var(--ds-font-md);
  max-width: 280px;
  line-height: 1.5;
}

.palette-item-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.palette-item-name {
  color: var(--ds-text-primary);
  font-weight: 500;
  font-size: var(--ds-font-md);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.palette-item-path {
  color: var(--ds-text-tertiary);
  font-size: var(--ds-font-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.palette-item b {
  color: var(--ds-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* ── Footer ── */
.palette-footer {
  padding: var(--ds-space-md) var(--ds-space-lg);
  background: var(--ds-layer-control-default);
  border-top: 1px solid var(--ds-border-subtle);
  display: flex;
  align-items: center;
  gap: var(--ds-space-lg);
  color: var(--ds-text-tertiary);
  font-size: var(--ds-font-xs);
}

.palette-footer .ds-kbd {
  margin: 0 2px;
}

/* ── Hide Floating Bars when searching ── */
body.is-searching .ds-change-action-view-bar,
body.is-searching .edit-toolbar-container {
  opacity: 0 !important;
  pointer-events: none !important;
}

body.is-searching .ds-change-action-view-bar {
  transform: translateY(20px) !important;
}

body.is-searching .edit-toolbar-container {
  transform: translate(-50%, 20px) !important;
}

/* ── Shortcuts Styling ── */
.palette-item.shortcut-item .palette-item-info {
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.palette-item-keys {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.palette-item-keys .ds-kbd {
  font-size: 10px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
}
```
</file>

<file path="renderer/css/design-system/organisms/settings-panel.css">
```css
/* ============================================================
   settings-panel.css
   ============================================================ */

.settings-container {
  display: flex;
  flex-direction: column;
}


.color-selector {
  display: flex;
  gap: var(--ds-space-sm);
}

.color-item {
  width: 28px;
  height: 28px;
  border-radius: var(--ds-radius-pill);
  border: 4px solid transparent;
  cursor: pointer;
  transition: all var(--ds-transition-fast);
  background-clip: padding-box;
}

.color-item:hover {
  transform: scale(1.1);
}

.color-item.active {
  border-color: var(--ds-border-strong);
  box-shadow: 0 0 0 1px var(--ds-accent), 0 0 4px var(--ds-accent);
}

.setting-divider {
  width: 100%;
  height: 1px;
  background: var(--ds-border-subtle);
  flex-shrink: 0;
}

.setting-control-col {
  display: flex;
  align-items: center;
  gap: var(--ds-space-md);
  flex: 1;
  max-width: 240px;
}

.zoom-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: var(--ds-border-strong);
  border-radius: var(--ds-radius-chip);
  outline: none;
  cursor: pointer;
}

.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--ds-accent);
  border-radius: var(--ds-radius-pill);
  box-shadow: 0 0 10px rgba(var(--ds-accent-rgb), 0.4);
  transition: transform 0.1s;
}

.zoom-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.zoom-val-label {
  min-width: 40px;
  text-align: right;
  font-size: var(--ds-font-base);
  font-weight: 600;
  color: var(--ds-accent);
  font-family: var(--ds-font-family-code);
}

.ds-select {
  background: transparent;
  border: none;
  outline: none;
  color: var(--ds-accent);
  font-family: var(--ds-font-family-code);
  font-size: var(--ds-font-base);
  font-weight: 600;
  cursor: pointer;
  padding: var(--ds-space-2xs) 26px var(--ds-space-2xs) var(--ds-space-sm);
  border-radius: var(--ds-radius-widget);
  transition: all var(--ds-transition-fast);
  text-align: right;
  -webkit-appearance: none;
  appearance: none;
  background-image: var(--select-arrow);
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 14px;
}

.ds-select:hover {
  opacity: 0.8;
}

.bg-image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--ds-space-lg);
  width: 100%;
  padding: var(--ds-space-md) 0;
}

.bg-image-item {
  aspect-ratio: 16 / 9;
  border-radius: var(--ds-radius-panel);
  overflow: hidden;
  border: 1px solid var(--ds-border-default);
  background: var(--ds-layer-control-default);
  cursor: pointer;
  position: relative;
  transition: all var(--ds-transition-fast);
}

.bg-image-item:hover {
  border-color: var(--ds-accent);
}

.bg-image-item.active {
  border-color: var(--ds-accent);
  box-shadow: 0 0 0 2px var(--ds-accent);
}

.bg-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.1;
  transition: opacity var(--ds-transition-main);
}

.bg-image-item.active img {
  opacity: 0.3;
}

.bg-new-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-sm);
  color: var(--ds-text-secondary);
  font-family: var(--ds-font-family-code);
  font-size: var(--ds-font-xs);
  text-transform: uppercase;
}

.bg-new-image:hover {
  color: var(--ds-accent);
}
```
</file>

<file path="renderer/css/design-system/organisms/sidebar-left.css">
```css
/* ══════════════════════════════════════════════════
   sidebar-left.css — Organism
   Unified structure for Explorer, Search and Footer
   ══════════════════════════════════════════════════ */

#sidebar-left {
  border: 1px solid var(--ds-border-subtle);
  overflow: visible;
  position: relative;
}

/* ── Collapse Logic ── */
.sidebar-section-content {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  min-height: 0;
  flex: 1;
}

.sidebar-section.allow-transition .sidebar-section-content {
  transition: grid-template-rows var(--ds-transition-main), 
              opacity var(--ds-transition-main);
}

.sidebar-section.collapsed .sidebar-section-content {
  grid-template-rows: 0fr;
  opacity: 0;
  pointer-events: none;
}

.sidebar-section-content-inner {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-section.collapsed {
  flex: 0 0 auto !important;
  margin-bottom: 0;
}

/* ── Resizer ── */
.sidebar-resizer {
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 20;
  transition: background var(--ds-transition-fast);
}

.sidebar-resizer:hover,
.sidebar-resizer.is-resizing {
  background: rgba(var(--ds-accent-rgb), 0.2);
  box-shadow: 0 0 10px rgba(var(--ds-accent-rgb), 0.1);
}

/* ── Sidebar Divider ── */
.sidebar-divider {
  height: 1px;
  width: 100%;
  background: var(--ds-border-subtle);
  flex-shrink: 0;
  margin: var(--ds-space-2xs) 0;
}

/* ── Views Structure ── */
#sidebar-explorer-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  flex-shrink: 0;
  min-height: 0;
}

#recently-viewed-section {
  flex: 0 0 auto;
  /* Only takes needed space at the top */
}

#sidebar-main-trees {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

#file-explorer-section {
  flex: 1;
  /* Takes all remaining space */
  min-height: 0;
}

#hidden-items-section {
  flex: 0 1 auto;
  /* Fit content by default, but allow shrinking */
  max-height: 50%;
  /* Cap at 50% of the main trees container */
  display: flex;
  flex-direction: column;
  transition: background 0.2s ease, border-color 0.2s ease;
  border: 1px solid transparent;
  border-radius: var(--ds-radius-md);
  position: relative; /* Essential for safe zone positioning */
}

/* Release max-height limit if Explorer is collapsed */
#file-explorer-section.collapsed ~ #hidden-items-section {
  max-height: 100%;
}

/* Invisible Shield for Drop Sensitivity */
.ds-drop-safe-zone {
  position: absolute;
  inset: 0;
  z-index: 9999;
  background: transparent;
  pointer-events: auto;
}


#file-tree-mount,
#hidden-items-mount {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}


/* ── Footer: Status Badge ── */
.sidebar-footer {
  padding: var(--ds-space-2xs) var(--ds-space-sm) var(--ds-space-sm) var(--ds-space-sm);
  flex-shrink: 0;
  display: flex;
  gap: var(--ds-space-2xs);
  align-items: center;
}

.sidebar-footer-spacer {
  flex: 1;
}

.sidebar-footer .ds-btn {
  justify-content: flex-start;
}

.sidebar-footer .ds-btn-off-label {
  justify-content: center;
}
```
</file>

<file path="renderer/css/design-system/organisms/tab-bar.css">
```css
/* ══════════════════════════════════════════════════
   tab-bar.css — Organism
   ══════════════════════════════════════════════════ */

.tab-bar-container {
  height: var(--header-height, 40px);
  display: flex;
  align-items: center;
  background: transparent;
  border-bottom: 1px solid var(--ds-border-default);
  user-select: none;
  min-width: 0;
  position: relative;
  z-index: 1100;
}

/* Vertical Divider */
.tab-bar__divider-v {
  width: 1px;
  height: 100%;
  background: var(--ds-border-default);
  flex-shrink: 0;
}

/* Sidebar Toggle */
.tab-bar__sidebar-toggle-wrapper {
  width: 40px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Tab List */
.tab-bar__list {
  display: flex;
  height: 100%;
  align-items: center;
  flex: 0 1 auto;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  min-width: 0;
}

.tab-bar__list::-webkit-scrollbar {
  display: none;
}

.tab-item {
  flex: 0 1 auto;
  min-width: 100px;
  max-width: 280px;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 var(--ds-space-sm);
  gap: var(--ds-space-2xs);
  color: var(--ds-text-secondary);
  font-size: var(--ds-font-sm);
  font-weight: 400;
  cursor: pointer;
  position: relative;
  border-left: 1px solid var(--ds-border-default);
  transition: all var(--ds-transition-fast);
}

.tab-item:first-child {
  border-left: none;
}

.tab-item:hover {
  background: var(--ds-layer-subtle-hover);
  color: var(--ds-text-secondary);
}

.tab-item.active {
  background: var(--ds-layer-subtle-active);
  color: var(--ds-text-inverse);
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--ds-border-selected);
}

.tab-item.selected {
  background: var(--ds-layer-subtle-selected);
  color: var(--ds-text-inverse);
}

.tab-bar__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 var(--ds-space-2xs);
  mask-image: none;
  -webkit-mask-image: none;
  transition: mask-image var(--ds-transition-fast), -webkit-mask-image var(--ds-transition-fast);
}

/* Only show mask on hover to accommodate the close button without cutting off text prematurely */
.tab-item:hover:not(.active) .tab-bar__name {
  mask-image: linear-gradient(to right, black calc(100% - 120px), transparent 100%);
  -webkit-mask-image: linear-gradient(to right, black calc(100% - 120px), transparent 100%);
}

/* Disable mask for the active tab to show full content clearly */
.tab-item.active .tab-bar__name {
  mask-image: none !important;
  -webkit-mask-image: none !important;
}

.tab-bar__close {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  display: none;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: var(--ds-radius-sm);
  color: var(--ds-text-secondary);
  transition: all var(--ds-transition-fast);
  z-index: 5;
}

/* Active tab uses normal flex flow for the close button (no overlap) */
.tab-item.active .tab-bar__close {
  position: static;
  transform: none;
  display: flex;
  opacity: 1;
  margin-left: var(--ds-space-2xs);
}

.tab-bar__close:hover {
  background: var(--ds-layer-subtle-hover);
  color: var(--ds-text-inverse);
  opacity: 1 !important;
}

.tab-item:hover .tab-bar__close {
  display: flex;
  opacity: 0.6;
}

/* Add Tab */
.tab-bar__add-btn-container {
  width: 40px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid var(--ds-border-default);
  border-right: 1px solid var(--ds-border-default);
  cursor: pointer;
  transition: all var(--ds-transition-fast);
  flex-shrink: 0;
  position: relative;
  background: transparent;
  z-index: 1;
}

.tab-bar__add-btn-container:hover {
  background: var(--ds-layer-subtle-hover);
}

.tab-bar__add-btn {
  color: var(--ds-text-disabled);
  transition: all var(--ds-transition-fast);
  display: flex;
}

.tab-bar__add-btn-container:hover .tab-bar__add-btn {
  color: var(--ds-text-inverse);
}

.tab-bar__add-btn-container.is-disabled {
  opacity: 0.4;
  filter: grayscale(0.5);
  cursor: not-allowed;
}

.tab-bar__add-btn-container.is-disabled:hover {
  background: var(--ds-status-danger-bg);
}

/* Right Actions */
.tab-bar__actions-right {
  margin-left: auto;
  display: flex;
  height: 100%;
  align-items: center;
  border-left: 1px solid var(--ds-border-default);
  flex-shrink: 0;
}

.ds-header-action {
  width: 40px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-text-tertiary);
  cursor: pointer;
  transition: all var(--ds-transition-fast);
}

.ds-header-action:hover {
  background: var(--ds-layer-subtle-hover);
  color: var(--ds-text-inverse);
}

.ds-header-action svg,
.ds-header-action svg *,
.tab-bar__add-btn svg,
.tab-bar__add-btn svg * {
  pointer-events: none !important;
  width: var(--ds-space-md);
  height: var(--ds-space-md);
}

.tab-bar__action-divider {
  width: 1px;
  height: 20px;
  background: var(--ds-border-strong);
}

/* Draft Indicator */
.tab-bar__draft-dot {
  width: 6px;
  height: 6px;
  background: var(--ds-accent);
  border-radius: var(--ds-radius-pill);
  flex-shrink: 0;
  box-shadow: var(--ds-shadow-glow);
}

.tab-item:not(.active) .tab-bar__draft-dot {
  opacity: 0.5;
  box-shadow: none;
}

/* Pinned Tab */
.tab-bar__pin-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-accent);
  flex-shrink: 0;
  transition: all var(--ds-transition-fast);
}

.tab-bar__pin-icon svg {
  width: 14px;
  height: 14px;
  stroke-width: 2.5;
}

.tab-item.is-pinned:not(.active) .tab-bar__pin-icon {
  opacity: 0.7;
}

.tab-item.is-pinned {
  border-bottom: 1px solid rgba(var(--ds-accent-rgb), 0.2);
  min-width: 44px;
  max-width: 80px;
  flex: 0 0 auto;
}

.tab-item.is-pinned.active {
  border-bottom: none;
}

.tab-item.is-pinned:hover .tab-bar__name {
  mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%);
  -webkit-mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%);
}

/* Status Indicator (Dirty/Draft) */
.tab-bar__status-dot {
  --_dot-color: var(--ds-status-warning);

  width: 6px;
  height: 6px;
  margin-left: var(--ds-space-2xs);
  background: var(--_dot-color);
  border-radius: var(--ds-radius-pill);
  flex-shrink: 0;
  box-shadow: 0 0 4px var(--_dot-color);
  transition: all var(--ds-transition-fast);
}

/* Color override for Draft state (Subtle White Alpha) */
.tab-item.is-draft .tab-bar__status-dot {
  --_dot-color: var(--ds-white-a60);
  box-shadow: none;
  /* Remove glow for a cleaner look */
}

.tab-item:not(.active) .tab-bar__status-dot {
  opacity: 0.8;
  box-shadow: none;
}

/* ── Drag & Drop ── */
.tab-bar__list.is-dragging-active .tab-item {
  transition: transform 0.4s var(--ds-ease-spring);
  pointer-events: none;
}

.tab-item-placeholder {
  opacity: 0 !important;
  pointer-events: none;
}

.is-dragging-vip {
  position: fixed !important;
  z-index: 9999 !important;
  pointer-events: none !important;
  background: var(--ds-layer-subtle-hover) !important;
  border: 1px solid var(--ds-border-subtle) !important;
  border-radius: var(--ds-radius-sm);
  display: flex;
  align-items: center;
  padding: 0 var(--ds-space-lg);
  gap: var(--ds-space-sm);
  color: var(--ds-text-inverse);
  font-size: var(--ds-font-md);
  white-space: nowrap;
}

.tab-bar__list.is-handing-off .tab-item {
  transition: none !important;
}
```
</file>

<file path="renderer/css/design-system/organisms/toc-panel.css">
```css
#md-viewer-mount {
  --_toc-right: var(--ds-space-lg);
  --_toc-top: var(--ds-space-lg);
  --_toc-btn-h: var(--ds-space-2xl);
  --_toc-panel-offset: var(--ds-space-sm);
}


.ds-toc-panel {
  position: absolute;
  top: calc(var(--_toc-top) + var(--_toc-btn-h) + var(--_toc-panel-offset));
  right: var(--_toc-right);
  width: var(--ds-toc-width);
  max-height: 85vh;
  background: var(--ds-bg-floating-glass);
  backdrop-filter: blur(var(--ds-blur-xl)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--ds-blur-xl)) saturate(180%);
  border: 1px solid var(--ds-border-strong);
  border-radius: var(--ds-radius-surface);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: var(--ds-z-index-popover);
  opacity: 0;
  transform: translateX(calc(100% + var(--ds-space-4xl))) translateZ(0);
  pointer-events: none;
  transition:
    opacity var(--ds-transition-main),
    transform var(--ds-transition-slow);
  will-change: transform, opacity;
}

.ds-toc-panel.show {
  opacity: 1;
  transform: translateX(0) translateZ(0);
  pointer-events: auto;
}

/* ── TOC Header ── */
.toc-header {
  padding: var(--ds-space-sm) var(--ds-space-sm);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--ds-border-subtle);
  position: relative;
  min-height: 48px; /* Ensure enough height for absolute title */
}

.toc-header h3 {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: var(--ds-font-md);
  font-weight: 700;
  color: var(--ds-text-primary);
  margin: 0;
  white-space: nowrap;
  pointer-events: none; /* Allow clicks to pass through to underlying elements if any */
}

.toc-header .ds-spacer {
  flex: 1;
}

.toc-header .ds-segmented-control {
  transform: scale(0.9);
}


/* ── TOC Body ── */
.toc-body {
  padding: var(--ds-space-md) var(--ds-space-sm);
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 0; /* CRITICAL: Prevents flex child from expanding to fit content */
  scrollbar-width: none;
  /* Hide standard scrollbar */
  scroll-snap-type: y proximity;
  scroll-behavior: smooth;
}

.toc-body::before {
  content: "";
  display: block;
  height: 1px;
  margin-top: -1px;
  scroll-snap-align: start;
}

.toc-body::-webkit-scrollbar {
  display: none;
}

.toc-body.is-map {
  overflow: hidden;
  padding: 0;
}

.toc-body.is-scrollable {
  /* Smart Mask Fading */
  --_fade-top: 0;
  --_fade-bottom: 24px;

  -webkit-mask-image: linear-gradient(to bottom,
      transparent 0%,
      black var(--_fade-top),
      black calc(100% - var(--_fade-bottom)),
      transparent 100%);
  mask-image: linear-gradient(to bottom,
      transparent 0%,
      black var(--_fade-top),
      black calc(100% - var(--_fade-bottom)),
      transparent 100%);
}

/* ── TOC Empty State ── */
.toc-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--ds-space-2xl) var(--ds-space-lg);
  text-align: center;
  color: var(--ds-text-tertiary);
  gap: var(--ds-space-sm);
}

.toc-empty-state .empty-icon {
  width: var(--ds-space-2xl);
  height: var(--ds-space-2xl);
  opacity: 0.4;
  color: var(--ds-text-tertiary);
}

.toc-empty-state p {
  font-size: var(--ds-font-md);
  font-weight: 600;
  color: var(--ds-text-secondary);
  margin: 0;
}

.toc-empty-state span {
  font-size: var(--ds-font-xs);
  line-height: 1.5;
  max-width: 200px;
}

/* ── TOC Items ── */
.ds-toc-item {
  display: flex;
  flex-direction: column;
}

.item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ds-space-xs) var(--ds-space-xs) var(--ds-space-xs) var(--ds-space-md);
  border-radius: var(--ds-radius-widget);
  cursor: pointer;
  transition: all var(--ds-transition-fast);
  gap: var(--ds-space-sm);
}

.item-content:hover {
  background: var(--ds-layer-subtle-hover);
}

.item-label {
  flex: 1;
  font-size: var(--ds-font-md);
  color: var(--ds-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--ds-transition-fast);
}

.item-content:hover .item-label {
  color: var(--ds-text-primary);
}

.ds-toc-item.is-active>.item-content .item-label {
  color: var(--ds-text-accent);
  font-weight: 700;
}

.ds-toc-item.is-active>.item-content {
  background: var(--ds-layer-subtle-active-hover);
}

.item-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-space-lg);
  height: var(--ds-space-lg);
  color: var(--ds-text-tertiary);
  transition: transform var(--ds-transition-fast);
}

.item-toggle svg {
  width: 14px;
  height: 14px;
}

/* ── Levels & Indentation ── */
.ds-toc-item.level-2 {
  padding-left: 0;
}

.ds-toc-item.level-2:not(:first-child) {
  border-top: 1px solid var(--ds-border-subtle);
  margin-top: var(--ds-space-sm);
  padding-top: var(--ds-space-sm);
}

.ds-toc-item.level-3 {
  padding-left: var(--ds-space-md);
}

.ds-toc-item.level-4 {
  padding-left: var(--ds-space-xl);
}

.ds-toc-item.level-5 {
  padding-left: calc(var(--ds-space-xl) + var(--ds-space-md));
}

.ds-toc-item.level-6 {
  padding-left: var(--ds-space-4xl);
}

/* ── Expansion Logic ── */
.item-children {
  display: none;
  overflow: hidden;
}

.ds-toc-item.is-expanded>.item-children {
  display: block;
}

/* ── Floating TOC Button ── */
.floating-action-group {
  position: absolute;
  top: var(--_toc-top);
  right: var(--_toc-right);
  display: flex;
  align-items: center;
  gap: var(--ds-space-sm);
  z-index: 9999; /* Ensure it's above everything including toolbars and masks */
  pointer-events: none;
}

.floating-action-group > * {
  pointer-events: auto;
}

.floating-toc-btn {
  transition: all var(--ds-transition-normal) var(--ds-ease-spring);
  box-shadow: var(--ds-shadow-lg);
}

.floating-combo-btn {
  box-shadow: var(--ds-shadow-lg);
}

.floating-toc-btn.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
```
</file>

<file path="renderer/css/design-system/organisms/tree-view.css">
```css
/* ══════════════════════════════════════════════════
   tree-view.css — Organism
   Explorer sidebar tree: items, folders, drag & drop.
   ══════════════════════════════════════════════════ */

.v2-tree-container,
.ds-tree-view {
  display: flex;
  flex-direction: column;
  padding: 0 var(--ds-space-sm);
  gap: 2px;
  min-height: 0;
  transition: background var(--ds-transition-fast);
}

/* ── Tree Item ── */
.tree-item {
  height: 30px;
  padding: 0 var(--ds-space-sm);
  gap: var(--ds-space-sm);
  font-size: var(--ds-font-md);
  border-radius: var(--ds-radius-widget);
  background: transparent;
  transition: all var(--ds-transition-fast);
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--ds-text-secondary);
  position: relative;
  user-select: none;
}

.tree-item.is-hidden {
  opacity: 0.5;
}

.tree-item .item-icon-wrap {
  width: 14px;
  height: 14px;
  opacity: 0.6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tree-item .item-icon-wrap svg {
  width: 100%;
  height: 100%;
}

.tree-item:hover {
  background: var(--ds-layer-subtle-hover);
  color: var(--ds-text-secondary);
}

.tree-item.active {
  background: var(--ds-layer-subtle-active);
  color: var(--ds-text-primary);
}

.tree-item.selected {
  background: var(--ds-layer-subtle-selected);
}

/* ── Indent Guides ── */
.folder-children {
  position: relative;
  margin-left: 13px;
  padding-left: var(--ds-space-md);
  border-left: 1px solid var(--ds-layer-subtle-selected);
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: all var(--ds-transition-main);
}

.ds-tree-view.is-dragging-active .folder-children {
  border-left-color: transparent !important;
}

.folder-children.is-effectively-empty {
  border-left-color: transparent !important;
}

.tree-node-wrapper:hover>.folder-children {
  border-left-color: var(--ds-border-strong);
}

/* ── Chevron ── */
.item-chevron-wrap {
  width: 10px;
  height: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-chevron {
  width: 10px;
  height: 10px;
  opacity: 0.3;
  transition: transform var(--ds-transition-fast);
}

.tree-item-spacer {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
}

/* ── Delete Button ── */
.item-delete-btn {
  width: 0;
  height: 22px;
  padding: 0;
  opacity: 0;
  margin-left: 0;
  border-radius: var(--ds-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  visibility: hidden;
  flex-shrink: 0;
  transition: all var(--ds-transition-fast);
}

.tree-item:hover .item-delete-btn {
  width: 22px;
  padding: var(--ds-space-2xs);
  opacity: 0.4;
  margin-left: auto;
  visibility: visible;
}

.item-delete-btn:hover {
  opacity: 1;
  background: var(--ds-layer-danger-hover);
  color: var(--ds-accent-red);
}

.item-label {
  flex: 1;
  margin-bottom: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Drag Styles ── */
.ds-tree-view.is-dragging-active .tree-item,
.folder-children.is-dragging-active .tree-item {
  animation: none !important;
  transition: transform 0.45s cubic-bezier(0.2, 0, 0, 1) !important;
}

.ds-tree-view.is-handing-off .tree-item,
.folder-children.is-handing-off .tree-item {
  animation: none !important;
  transition: transform 0s !important;
}

/* Standard Drag Proxy */
.standard-drag-proxy {
  position: fixed;
  pointer-events: none;
  z-index: 10000;
  background: var(--ds-surface-overlay);
  color: var(--ds-text-primary);
  padding: 10px;
  height: 24px;
  border-radius: var(--ds-radius-panel);
  font-size: var(--ds-font-sm);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2xs);
  box-shadow: var(--ds-shadow-md);
  border: 1px solid var(--ds-border-default);
  transform: translate(-50%, -50%);
  will-change: transform, left, top;
}

.standard-drag-proxy .drag-badge {
  background: var(--ds-accent-red);
  color: var(--ds-text-inverse);
  font-size: 9px;
  font-weight: 800;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--ds-radius-pill);
  position: absolute;
  top: -8px;
  right: -8px;
  box-shadow: var(--ds-shadow-sm);
  border: 1px solid var(--ds-border-subtle);
}

.tree-item.is-dragging-source {
  opacity: 0.2 !important;
  transition: opacity var(--ds-transition-fast);
  pointer-events: none;
}

.tree-node-wrapper.tree-item-placeholder .tree-item {
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none;
}

/* Tree Bottom Spacer */
.tree-bottom-spacer {
  height: 80px;
  width: 100%;
  flex-shrink: 0;
  display: block;
  pointer-events: none;
}

/* ── Inline Rename ── */
.inline-rename-input {
  background: var(--ds-surface-overlay);
  border: 1.5px solid var(--ds-accent);
  color: var(--ds-text-primary);
  border-radius: var(--ds-radius-sm);
  padding: 4px 8px;
  font-size: 13px;
  width: calc(100% - 20px);
  outline: none;
  font-family: inherit;
  margin-left: 2px;
  box-shadow: 0 0 0 4px rgba(var(--ds-accent-rgb), 0.1);
}
```
</file>

<file path="renderer/css/design-system/organisms/workspace-panel.css">
```css
/* ============================================================
   workspace-panel.css — Workspace panel & Add Workspace Modal
   ============================================================ */

/* ── Workspace Picker Component ── */
.workspace-picker-container {
  display: flex;
  flex-direction: column;
}

.workspace-picker-popover .ds-popover-group {
  padding: 0;
}

.ws-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 var(--ds-space-xl);
  cursor: pointer;
  transition: background var(--ds-transition-fast);
  position: relative;
}

.ws-list-item:hover {
  background: var(--ds-layer-subtle-hover);
}

.ws-list-item.active {
  background: var(--ds-layer-subtle-active);
}

.ws-list-item-left {
  display: flex;
  align-items: center;
  gap: var(--ds-space-md);
  width: 45%;
  min-width: 0;
}

.ws-list-item-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-text-disabled);
  flex-shrink: 0;
}

.ws-list-item-name-wrap {
  display: flex;
  align-items: center;
  gap: var(--ds-space-md);
  min-width: 0;
}

.ws-list-item-name {
  font-size: var(--ds-font-lg);
  font-weight: 600;
  color: var(--ds-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.ws-list-item-path-col {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.ws-list-item-path {
  font-size: var(--ds-font-sm);
  color: var(--ds-text-disabled);
  font-family: var(--ds-font-family-code);
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ws-list-item-right {
  display: flex;
  align-items: center;
  gap: var(--ds-space-md);
  flex-shrink: 0;
  width: 80px;
  justify-content: flex-end;
}

.ws-badge {
  font-size: 9px;
  font-weight: 800;
  color: var(--ds-accent);
  background: rgba(var(--ds-accent-rgb), 0.1);
  padding: 2px var(--ds-space-2xs);
  border-radius: var(--ds-radius-sm);
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.ws-inline-edit-input {
  background: var(--ds-layer-control-hover);
  border: 1px solid var(--ds-accent);
  border-radius: var(--ds-radius-sm);
  color: var(--ds-text-inverse);
  font-size: var(--ds-font-lg);
  font-weight: 600;
  padding: var(--ds-space-2xs) var(--ds-space-sm);
  width: 100%;
  outline: none;
  font-family: inherit;
}

.ws-list-item-actions {
  display: flex;
  gap: var(--ds-space-sm);
}

.ws-list-item:hover .ds-item-delete-btn {
  opacity: 1;
}

/* ── Add Action Button ── */
.ws-add-action-btn {
  display: flex;
  align-items: center;
  gap: var(--ds-space-md);
  padding: var(--ds-space-xl);
  margin: 0 var(--ds-space-sm);
  cursor: pointer;
  color: var(--ds-accent);
  font-weight: 700;
  font-size: var(--ds-font-lg);
  transition: background var(--ds-transition-fast);
  border-radius: var(--ds-radius-widget);
  margin-top: -4px;
}

.ws-add-action-btn:hover {
  background: rgba(var(--ds-accent-rgb), 0.08);
}

.ws-add-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--ds-accent-rgb), 0.1);
  border-radius: var(--ds-radius-pill);
  font-size: var(--ds-font-xl);
}

/* ── Add Workspace Modal ── */
#add-workspace-modal {
  position: fixed;
  inset: 0;
  z-index: 2100;
  background: var(--ds-black-a80);
  backdrop-filter: blur(var(--ds-blur-lg));
  display: none;
  align-items: center;
  justify-content: center;
}

#add-workspace-modal.show {
  display: flex;
}

.aws-popover-shield .ds-popover-card {
  width: 480px;
  background: var(--ds-surface-overlay);
  border: 1px solid var(--ds-border-default);
  border-radius: var(--ds-radius-shell);
  padding: var(--ds-space-3xl);
  text-align: center;
  box-shadow: var(--ds-shadow-lg);
  backdrop-filter: blur(var(--ds-blur-xl));
  -webkit-backdrop-filter: blur(var(--ds-blur-xl));
}

.aws-popover-shield .ds-popover-body {
  padding: 0;
  overflow: visible;
}

.aws-form-content {
  display: block;
  padding: 56px var(--ds-space-xl) var(--ds-space-xl) var(--ds-space-xl);
}

.aws-icon-wrapper {
  width: 64px;
  height: 64px;
  background: rgba(var(--ds-accent-rgb), 0.1);
  border: 1px solid rgba(var(--ds-accent-rgb), 0.2);
  border-radius: var(--ds-radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--ds-space-xl);
  color: var(--ds-accent);
  box-shadow: 0 12px 24px rgba(var(--ds-accent-rgb), 0.15);
}

.aws-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--ds-text-inverse);
  margin-bottom: var(--ds-space-sm);
  letter-spacing: -0.02em;
  text-align: center;
}

.aws-subtitle {
  color: var(--ds-text-tertiary);
  font-size: var(--ds-font-lg);
  margin-bottom: var(--ds-space-3xl);
  line-height: 1.5;
  text-align: center;
}

.aws-fields {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 0;
}

.aws-field-label {
  font-family: var(--ds-font-family-code);
  font-size: var(--ds-font-sm);
  font-weight: 700;
  color: var(--ds-text-disabled);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: block;
  text-align: left;
  margin: 0 0 var(--ds-space-sm) var(--ds-space-lg);
}

.aws-input {
  width: 100%;
  height: 44px;
  background: var(--ds-layer-control-default);
  border: 1px solid var(--ds-border-default);
  border-radius: var(--ds-radius-pill);
  padding: 0 var(--ds-space-xl);
  color: var(--ds-text-inverse);
  font-size: var(--ds-font-lg);
  font-family: inherit;
  outline: none;
  margin-bottom: var(--ds-space-xl);
  user-select: text;
}

.aws-browse-row {
  display: flex;
  gap: var(--ds-space-sm);
  margin-bottom: var(--ds-space-3xl);
}

.aws-browse-row .aws-input {
  margin-bottom: 0;
}

#browse-btn {
  height: 44px;
  padding: 0 var(--ds-space-xl);
  flex-shrink: 0;
  background: var(--ds-layer-subtle-hover);
  border: 1px solid var(--ds-border-default);
  border-radius: var(--ds-radius-pill);
  color: var(--ds-text-inverse);
  font-size: var(--ds-font-base);
  font-weight: 600;
  transition: background var(--ds-transition-fast);
}

#browse-btn:hover {
  background: var(--ds-layer-subtle-selected);
}

.aws-actions {
  display: flex;
  gap: var(--ds-space-md);
}

#confirm-workspace-btn {
  flex: 1;
  height: 48px;
  background: var(--ds-accent);
  border: none;
  border-radius: var(--ds-radius-pill);
  color: var(--ds-text-on-accent);
  font-weight: 700;
  box-shadow: 0 8px 20px rgba(var(--ds-accent-rgb), 0.3);
  transition: opacity var(--ds-transition-fast);
}

#confirm-workspace-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

#cancel-workspace-btn {
  flex: 1;
  height: 48px;
  color: var(--ds-text-secondary);
  font-weight: 600;
}

/* ── Zoom Modal ── */
#zoom-modal {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(var(--ds-blur-lg));
  display: none;
  overflow: hidden;
  cursor: grab;
}

#zoom-modal.show {
  display: block;
}

#zoom-modal:active {
  cursor: grabbing;
}

#zoom-container {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}

#zoom-close {
  position: absolute;
  top: var(--ds-space-xl);
  right: var(--ds-space-xl);
  z-index: 10;
  width: 40px;
  height: 40px;
  background: var(--ds-layer-subtle-selected);
  border: 1px solid var(--ds-border-strong);
  border-radius: var(--ds-radius-pill);
  color: var(--ds-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--ds-transition-fast), color var(--ds-transition-fast);
}

#zoom-close:hover {
  background: var(--ds-layer-subtle-hover);
  color: var(--ds-text-inverse);
}

#zoom-controls-bar {
  position: absolute;
  bottom: var(--ds-space-xl);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(var(--ds-blur-md));
  -webkit-backdrop-filter: blur(var(--ds-blur-md));
  border: 1px solid var(--ds-border-strong);
  border-radius: var(--ds-radius-pill);
  padding: var(--ds-space-2xs) 10px;
  z-index: 10;
  cursor: default;
}

.zoom-ctrl-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--ds-radius-pill);
  color: var(--ds-text-secondary);
  transition: background var(--ds-transition-fast), color var(--ds-transition-fast);
  cursor: pointer;
}

.zoom-ctrl-btn:hover {
  background: var(--ds-layer-subtle-hover);
  color: var(--ds-text-inverse);
}

#zoom-pct {
  font-family: var(--ds-font-family-code);
  font-size: var(--ds-font-sm);
  font-weight: 600;
  color: var(--ds-text-secondary);
  min-width: 44px;
  text-align: center;
  padding: 0 var(--ds-space-2xs);
  cursor: default;
}

.zoom-ctrl-divider {
  width: 1px;
  height: 18px;
  background: var(--ds-border-strong);
  margin: 0 var(--ds-space-2xs);
}

```
</file>

<file path="renderer/css/design-system/tokens.css">
```css
/* ============================================================
   design-system/tokens.css — Single source of truth.

   3-tier architecture:
     Tier 1 — Primitives  : Raw values (colors, sizes, easing)
     Tier 2 — Alpha       : Pre-built opacity variants
     Tier 3 — Semantic    : Named by purpose, references Tier 1-2
   ============================================================ */

:root {

   /* ════════════════════════════════════════════════════════
     TIER 1 — PRIMITIVES
     ════════════════════════════════════════════════════════ */

   /* ── Brand Colors ──────────────────────────────────────── */
   --ds-primitive-orange: #ffbf48;
   --ds-primitive-green: #22c55e;
   --ds-primitive-red: #ff453a;
   --ds-primitive-blue: #1E90FF;

   /* RGB channels for alpha composition */
   --ds-primitive-orange-rgb: 255, 191, 72;
   --ds-primitive-green-rgb: 34, 197, 94;
   --ds-primitive-red-rgb: 255, 69, 58;
   --ds-primitive-blue-rgb: 30, 144, 255;

   /* ── Base Backgrounds ──────────────────────────────────── */
   --ds-primitive-base: #151515;
   --ds-primitive-surface: #1a1a1a;
   --ds-primitive-deep: #111;
   --ds-primitive-white: #fff;
   --ds-primitive-black: #000;

   /* ── Spacing Scale ─────────────────────────────────────── */
   --ds-space-3xs: 2px;
   --ds-space-2xs: 4px;
   --ds-space-xs: 6px;
   --ds-space-sm: 8px;
   --ds-space-md: 12px;
   --ds-space-lg: 16px;
   --ds-space-xl: 24px;
   --ds-space-2xl: 28px;
   --ds-space-3xl: 32px;
   --ds-space-4xl: 48px;

   /* ── Radius Scale (Primitives) ─────────────────────────── */
   --ds-radius-xs: 4px;
   --ds-radius-sm: 6px;
   --ds-radius-md: 8px;
   --ds-radius-lg: 12px;
   --ds-radius-xl: 16px;
   --ds-radius-2xl: 24px;
   --ds-radius-3xl: 32px;
   --ds-radius-full: 999px;

   /* ── Typography ────────────────────────────────────────── */
   --ds-font-family-text: var(--font-text, 'Inter'), -apple-system, BlinkMacSystemFont, sans-serif;
   --ds-font-family-code: var(--font-code, 'Roboto Mono'), ui-monospace, SFMono-Regular, monospace;

   --ds-font-xs: 11px;
   --ds-font-sm: 12px;
   --ds-font-md: 13px;
   --ds-font-base: 14px;
   --ds-font-lg: 15px;
   --ds-font-xl: 18px;

   /* ── Easing ────────────────────────────────────────────── */
   --ds-ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
   --ds-ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
   --ds-ease-out: cubic-bezier(0.4, 0, 0.2, 1);

   /* ── Blur Scale ────────────────────────────────────────── */
   --ds-blur-xs: 6px;
   --ds-blur-sm: 8px;
   --ds-blur-md: 12px;
   --ds-blur-lg: 20px;
   --ds-blur-xl: 32px;


   /* ════════════════════════════════════════════════════════
     TIER 2 — ALPHA PALETTE
     Pre-built opacity variants. Use these everywhere instead
     of writing rgba() by hand.
     ════════════════════════════════════════════════════════ */

   /* ── White alpha (for borders, layers, text tints) ─────── */
   --ds-white-a01: rgba(255, 255, 255, 0.01);
   --ds-white-a02: rgba(255, 255, 255, 0.02);
   --ds-white-a03: rgba(255, 255, 255, 0.03);
   --ds-white-a04: rgba(255, 255, 255, 0.04);
   --ds-white-a05: rgba(255, 255, 255, 0.05);
   --ds-white-a08: rgba(255, 255, 255, 0.08);
   --ds-white-a10: rgba(255, 255, 255, 0.10);
   --ds-white-a12: rgba(255, 255, 255, 0.12);
   --ds-white-a20: rgba(255, 255, 255, 0.20);
   --ds-white-a30: rgba(255, 255, 255, 0.30);
   --ds-white-a40: rgba(255, 255, 255, 0.40);
   --ds-white-a60: rgba(255, 255, 255, 0.60);
   --ds-white-a90: rgba(255, 255, 255, 0.90);

   /* ── Black alpha (for overlays, shadows) ───────────────── */
   --ds-black-a05: rgba(0, 0, 0, 0.05);
   --ds-black-a15: rgba(0, 0, 0, 0.15);
   --ds-black-a20: rgba(0, 0, 0, 0.20);
   --ds-black-a30: rgba(0, 0, 0, 0.30);
   --ds-black-a35: rgba(0, 0, 0, 0.35);
   --ds-black-a40: rgba(0, 0, 0, 0.40);
   --ds-black-a50: rgba(0, 0, 0, 0.50);
   --ds-black-a80: rgba(0, 0, 0, 0.80);
   --ds-black-a90: rgba(0, 0, 0, 0.90);

   /* ── Accent alpha (for status backgrounds, highlights) ─── */
   --ds-orange-a08: rgba(var(--ds-primitive-orange-rgb), 0.08);
   --ds-orange-a15: rgba(var(--ds-primitive-orange-rgb), 0.15);
   --ds-orange-a30: rgba(var(--ds-primitive-orange-rgb), 0.30);

   --ds-green-a15: rgba(var(--ds-primitive-green-rgb), 0.15);
   --ds-green-a20: rgba(var(--ds-primitive-green-rgb), 0.20);
   --ds-green-a40: rgba(var(--ds-primitive-green-rgb), 0.40);

   --ds-red-a08: rgba(var(--ds-primitive-red-rgb), 0.08);
   --ds-red-a10: rgba(var(--ds-primitive-red-rgb), 0.10);
   --ds-red-a15: rgba(var(--ds-primitive-red-rgb), 0.15);
   --ds-red-a30: rgba(var(--ds-primitive-red-rgb), 0.30);


   /* ════════════════════════════════════════════════════════
     TIER 3 — SEMANTIC
     Named by purpose. Always references Tier 1 or Tier 2.
     ════════════════════════════════════════════════════════ */

   /* ── Surface Layers (Static Backgrounds) ────────── */
   --ds-surface-main: var(--ds-glass-main);
   --ds-surface-sidebar: var(--ds-glass-sidebar);
   --ds-surface-overlay: var(--ds-primitive-deep);
   --ds-surface-card: var(--ds-white-a02);

   /* ── Interactive Layer Systems (Final Colors) ─── */

   /* 1. Subtle System (Tree, List, Ghost Buttons) */
   --ds-layer-subtle-default: transparent;
   --ds-layer-subtle-hover: var(--ds-white-a02);
   --ds-layer-subtle-selected: var(--ds-white-a03);
   --ds-layer-subtle-active: var(--ds-white-a05);
   --ds-layer-subtle-active-hover: var(--ds-white-a08);

   /* 2. Subtle Dark System (Alternative lists, dark ghost buttons) */
   --ds-layer-subtle-dark-default: transparent;
   --ds-layer-subtle-dark-hover: var(--ds-black-a05);
   --ds-layer-subtle-dark-selected: var(--ds-black-a15);
   --ds-layer-subtle-dark-active: var(--ds-black-a20);

   /* 3. Accent System (Primary Buttons, Active States) */
   --ds-layer-accent-default: var(--ds-accent);
   --ds-layer-accent-hover: var(--ds-accent-hover);
   --ds-layer-accent-active: linear-gradient(var(--ds-black-a10), var(--ds-black-a10)), var(--ds-accent);

   /* 4. Surface System (Cards, Workspace Switcher) */
   --ds-layer-surface-default: var(--ds-surface-card);
   --ds-layer-surface-hover: var(--ds-white-a08);
   --ds-layer-surface-active: var(--ds-white-a12);

   /* 5. Surface Dark System (Inverse/Dark interactive surfaces) */
   --ds-layer-surface-dark-default: var(--ds-black-a05);
   --ds-layer-surface-dark-hover: var(--ds-black-a15);
   --ds-layer-surface-dark-active: var(--ds-black-a20);

   /* 6. Control System (Form Inputs) */
   --ds-layer-control-default: var(--ds-black-a20);
   --ds-layer-control-hover: var(--ds-black-a30);
   --ds-layer-control-focus: var(--ds-black-a40);

   /* 7. Danger System (Delete Actions) */
   --ds-layer-danger-default: transparent;
   --ds-layer-danger-hover: var(--ds-red-a15);
   --ds-layer-danger-active: var(--ds-red-a30);

   /* ── Backgrounds ────────────────────────────────────────── */
   --ds-bg-base: var(--ds-primitive-base);
   --ds-bg-backdrop: var(--ds-black-a40);
   --ds-bg-popover-glass: var(--ds-white-a01);
   --ds-bg-floating-glass: linear-gradient(135deg, var(--ds-white-a01) 0%, var(--ds-white-a03) 100%);

   --ds-bg-toolbar: var(--ds-black-a50);
   --ds-bg-toolbar-inner: var(--ds-white-a03);

   --ds-glass-sidebar: linear-gradient(166deg, var(--ds-black-a05) 0%, var(--ds-black-a20) 100%);
   --ds-glass-main: linear-gradient(168deg, var(--ds-black-a20) 0%, var(--ds-black-a30) 100%);
   --ds-glass-hover: var(--ds-white-a05);

   /* ── Borders ───────────────────────────────────────────── */
   --ds-border-xsubtle: var(--ds-white-a01);
   --ds-border-subtle: var(--ds-white-a04);
   --ds-border-default: var(--ds-white-a05);
   --ds-border-strong: var(--ds-white-a08);
   --ds-border-xstrong: var(--ds-white-a12);
   --ds-border-selected-subtle: var(--ds-white-a10);
   --ds-border-selected: var(--ds-white-a30);

   /* ── Borders Dark ───────────────────────────────────────────── */
   --ds-border-dark-xsubtle: var(--ds-black-a05);


   /* ── Radius — Semantic Context Levels ──────────────────── */
   /*
   * 4 nesting levels. Use the level matching the component's
   * visual depth — not a fixed pixel size.
   *
   *  shell   → outermost glass panels, sidebars,  modals
   *  panel   → dropdowns, cards, sections
   *  widget  → buttons, inputs, toolbars, list rows
   *  chip    → tags, badges, syntax highlights, indicators
   *  pill    → toggles, avatars, fully-rounded elements
   */

   --ds-radius-shell: var(--ds-radius-2xl);
   --ds-radius-surface: var(--ds-radius-xl);
   --ds-radius-panel: var(--ds-radius-lg);
   --ds-radius-widget: var(--ds-radius-md);
   --ds-radius-chip: var(--ds-radius-xs);
   --ds-radius-pill: var(--ds-radius-full);

   /* ── Radius — Inset Formula ────────────────────────────── */
   --ds-radius-shell-inset: max(0px, var(--ds-radius-shell) - var(--ds-space-sm));
   --ds-radius-surface-inset: max(0px, var(--ds-radius-surface) - var(--ds-space-md));
   --ds-radius-panel-inset: max(0px, var(--ds-radius-panel) - var(--ds-space-sm));
   --ds-radius-widget-inset: max(0px, var(--ds-radius-widget) - var(--ds-space-2xs));

   /* ── Text ──────────────────────────────────────────────── */
   --ds-text-primary: var(--ds-white-a90);
   --ds-text-secondary: var(--ds-white-a60);
   --ds-text-tertiary: var(--ds-white-a40);
   --ds-text-disabled: var(--ds-white-a20);
   --ds-text-inverse: var(--ds-primitive-white);
   --ds-text-on-accent: var(--ds-black-a90);

   /* ── Accent ────────────────────────────────────────────── */
   --ds-accent: var(--accent-color, var(--ds-primitive-orange));
   --ds-accent-rgb: var(--accent-rgb, var(--ds-primitive-orange-rgb));
   --ds-accent-hover: linear-gradient(var(--ds-white-a10), var(--ds-white-a10)), var(--ds-accent);

   --ds-accent-green: var(--ds-primitive-green);
   --ds-accent-red: var(--ds-primitive-red);
   --ds-accent-blue: var(--ds-primitive-blue);

   /* ── Status ────────────────────────────────────────────── */
   --ds-status-success: var(--ds-primitive-green);
   --ds-status-success-bg: var(--ds-green-a15);
   --ds-status-danger: var(--ds-primitive-red);
   --ds-status-danger-bg: var(--ds-red-a10);
   --ds-status-warning: var(--ds-primitive-orange);
   --ds-status-warning-bg: var(--ds-orange-a08);
   --ds-status-info: var(--ds-primitive-blue);

   /* ── Shadows ───────────────────────────────────────────── */
   --ds-shadow-xs: 0 1px 2px var(--ds-black-a20);
   --ds-shadow-sm: 0 2px 8px var(--ds-black-a20);
   --ds-shadow-md: 0 8px 24px var(--ds-black-a35);
   --ds-shadow-lg: 0 20px 40px var(--ds-black-a50);
   --ds-shadow-xl: 0 32px 64px var(--ds-black-a80);
   --ds-shadow-lift: 0 20px 40px var(--ds-black-a30), 0 0 0 1px var(--ds-white-a10);
   --ds-shadow-glow: 0 0 20px rgba(var(--ds-accent-rgb), 0.3);

   /* ── Blur ───────────────────────────────────────────── */
   --ds-blur-sidebar: var(--ds-blur-xl);
   --ds-blur-searchbox: var(--ds-blur-xl);

   /* ── Z-Index Scale ─────────────────────────────────────── */
   --ds-z-index-base: 1;
   --ds-z-index-toolbar: 100;
   --ds-z-index-overlay: 1000;
   --ds-z-index-popover: 1100;
   --ds-z-index-max: 9999;

   /* ── Transitions & Animations ────────────────────── */
   --ds-transition-fast: 0.1s var(--ds-ease-spring);
   --ds-transition-main: 0.2s var(--ds-ease-spring);
   --ds-transition-normal: 0.3s var(--ds-ease-spring);
   --ds-transition-slow: 0.5s var(--ds-ease-spring);

   /* ── Layout & Sizing ────────────────────────────── */
   --ds-toc-width: 280px;
   --ds-toc-offset: 240px;
}
```
</file>

<file path="renderer/css/design-system.css">
```css
/* ============================================================
   design-system.css — Single entry point for all DS components.
   Import order: tokens → atoms → molecules → organisms
   ============================================================ */

/* ── Tokens ─────────────────────────────────────────────── */
@import 'design-system/tokens.css';

/* ── Atoms ──────────────────────────────────────────────── */
@import 'design-system/atoms/utilities.css';
@import 'design-system/atoms/button.css';
@import 'design-system/atoms/input.css';
@import 'design-system/atoms/icon-action-button.css';
@import 'design-system/atoms/tooltip.css';
@import 'design-system/atoms/switch-toggle.css';
@import 'design-system/atoms/textarea.css';
@import 'design-system/atoms/kbd.css';
@import 'design-system/atoms/status-badge.css';

/* ── Molecules ──────────────────────────────────────────── */
@import 'design-system/molecules/workspace-switcher.css';
@import 'design-system/molecules/segmented-control.css';
@import 'design-system/molecules/sidebar-section-header.css';
@import 'design-system/molecules/context-menu.css';
@import 'design-system/molecules/inline-message.css';
@import 'design-system/molecules/popover-shield.css';
@import 'design-system/molecules/sidebar-base.css';
@import 'design-system/molecules/setting-toggle-item.css';
@import 'design-system/molecules/menu-shield.css';
@import 'design-system/molecules/setting-row.css';
@import 'design-system/molecules/scroll-container.css';
@import 'design-system/molecules/tab-preview.css';
@import 'design-system/molecules/project-map.css';
@import 'design-system/molecules/combo-button.css';

/* ── Organisms ──────────────────────────────────────────── */
@import 'design-system/organisms/sidebar-left.css';
@import 'design-system/organisms/tree-view.css';
@import 'design-system/organisms/tab-bar.css';
@import 'design-system/organisms/right-sidebar.css';
@import 'design-system/organisms/comment-form.css';
@import 'design-system/organisms/change-action-view-bar.css';
@import 'design-system/organisms/edit-toolbar.css';
@import 'design-system/organisms/workspace-panel.css';
@import 'design-system/organisms/toc-panel.css';
@import 'design-system/organisms/settings-panel.css';
@import 'design-system/organisms/modals-misc.css';
@import 'design-system/organisms/publish-config.css';
@import 'design-system/organisms/editor.css';
@import 'design-system/organisms/markdown-viewer.css';
@import 'design-system/organisms/markdown-content.css';
@import 'design-system/organisms/markdown-blocks.css';
@import 'design-system/organisms/markdown-interactions.css';
@import 'design-system/organisms/base-form-modal.css';
@import 'design-system/organisms/search-palette.css';
```
</file>

<file path="renderer/css/layout.css">
```css
/* ============================================================
   layout.css — Top-level app layout: 3-column flex structure
   ============================================================ */

/* ── Global Reset ─────────────────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

button {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

body {
  height: 100vh;
  width: 100vw;
  background-color: var(--ds-bg-base);
  color: var(--ds-text-primary);
  font-family: var(--ds-font-family-text);
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  -webkit-user-select: none;
}

input, textarea, [contenteditable="true"] {
  user-select: text !important;
  -webkit-user-select: text !important;
}

/* ── Scrollbar ─────────────────────────────────────────────── */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--ds-white-a10);
  border-radius: 99px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--ds-white-a20);
}

#app-layout {
  display: flex;
  height: 100%;
  width: 100%;
  padding: var(--ds-space-xl);
  gap: var(--ds-space-2xs);
  transition: padding var(--ds-transition-main);
}

#sidebar-left-wrap {
  width: 256px;
  min-width: 256px;
  overflow: hidden;
  flex-shrink: 0;
  margin-right: 0;
  transition:
    width 0.4s var(--ds-ease-spring),
    min-width 0.4s var(--ds-ease-spring),
    margin-right 0.4s var(--ds-ease-spring);
  position: relative;
  height: 100%;
}

#sidebar-left-wrap.sidebar-collapsed {
  width: 0 !important;
  min-width: 0 !important;
  margin-right: -4px;
}

body.is-fullscreen #app-layout {
  padding: var(--ds-space-sm);
}

main {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.glass-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--ds-surface-main);
  border: 1px solid var(--ds-border-default);
  border-radius: var(--ds-radius-surface);
  overflow: hidden;
  position: relative;
}
```
</file>

<file path="renderer/css/styles.css">
```css
/* ============================================================
   styles.css — App entry point.
   design-system.css → tokens → atoms (reset, utilities) → molecules → organisms
   layout.css        → global reset (uses tokens), 3-column skeleton
   ============================================================ */

@import 'design-system.css';
@import 'layout.css';

```
</file>

<file path="renderer/index.html">
```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title>MDpreview</title>

  <!-- ── Google Fonts ────────────────────────────────── -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Be+Vietnam+Pro:wght@400;600;700&family=Roboto:wght@400;700&family=Open+Sans:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Lato:wght@400;700&family=Source+Sans+3:wght@400;600;700&family=Noto+Sans:wght@400;600;700&family=Nunito:wght@400;600;700&family=Raleway:wght@400;600;700&family=Work+Sans:wght@400;600;700&family=Quicksand:wght@400;600;700&family=Barlow:wght@400;600;700&family=Jost:wght@400;600;700&family=Public+Sans:wght@400;600;700&family=Rubik:wght@400;600;700&family=Kanit:wght@400;700&family=Outfit:wght@400;600;700&family=Urbanist:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;600;700&family=Lexend:wght@400;600;700&family=Syne:wght@400;700&family=Figtree:wght@400;600;700&family=Manrope:wght@400;600;700&family=DM+Sans:wght@400;600;700&family=Sora:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&family=Mulish:wght@400;600;700&family=Cabin:wght@400;600;700&family=Titillium+Web:wght@400;600;700&family=Heebo:wght@400;700&family=Karla:wght@400;600;700&family=Libre+Franklin:wght@400;600;700&family=Arimo:wght@400;700&family=Varela+Round&family=Commissioner:wght@400;600;700&family=Epilogue:wght@400;600;700&family=Archivo:wght@400;600;700&family=Chivo:wght@400;600;700&family=Bricolage+Grotesk:wght@400;600;700&family=Roboto+Mono:wght@400;500;700&family=Fira+Code:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&family=Source+Code+Pro:wght@400;500;700&family=Inconsolata:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;700&family=Ubuntu+Mono:wght@400;700&family=Space+Mono:wght@400;700&family=Share+Tech+Mono&family=Victor+Mono:wght@400;500;700&family=Anonymous+Pro:wght@400;700&family=DM+Mono:wght@400;500&family=PT+Mono&family=Red+Hat+Mono:wght@400;500;700&family=Sono:wght@400;500;700&family=Spline+Sans+Mono:wght@400;500;700&family=Xanh+Mono&family=Cousine:wght@400;700&family=Nova+Mono&family=Major+Mono+Display&display=swap"
    rel="stylesheet">

  <!-- ── Libraries ───────────────────────────────────── -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js" defer></script>
  <script src="/socket.io/socket.io.js" defer></script>

  <!-- ── Application Styles ─────────────────────────── -->
  <link rel="stylesheet" href="css/styles.css">
</head>

<body>

  <!-- Background layer for global aesthetics -->
  <div id="app-background"></div>

  <!-- ══════════════════════════════════════════════════
       APP LAYOUT
       Structure: Sidebar Left | Main | Sidebar Right
       ══════════════════════════════════════════════════ -->
  <div id="app-layout">

    <!-- Sidebar Left: Mounted by SidebarLeftComponent -->
    <div id="sidebar-left-mount"></div>

    <!-- Main Content Area -->
    <main>
      <div class="glass-main">
        <!-- Tab Bar: Mounted by TabBarComponent -->
        <div id="tab-bar-container"></div>

        <!-- Secondary Toolbar: Mounted by EditToolbarComponent -->
        <div id="edit-toolbar-mount"></div>

        <!-- Markdown Viewer: Mounted by MarkdownViewerComponent -->
        <div id="md-viewer-mount"></div>
      </div>
    </main>

    <!-- Sidebar Right: Mounted by RightSidebarComponent -->
    <div id="right-sidebar-wrap" class="ds-right-sidebar-wrap"></div>

  </div>

  <!-- ══════════════════════════════════════════════════
       SCRIPTS PIPELINE
       Load Order = Dependency Order
       ══════════════════════════════════════════════════ -->

  <!-- ── 1. Core & Bridge ── -->
  <script src="js/core/electron-bridge.js" defer></script>

  <!-- ── 2. Design System Components ── -->
  <!-- Foundations -->
  <script src="js/components/design-system.js" defer></script>
  <script src="js/components/design-system-icons.js" defer></script>

  <!-- Atoms (Base Elements) -->
  <script src="js/components/atoms/button.js" defer></script>
  <script src="js/components/atoms/modal.js" defer></script>
  <script src="js/components/atoms/inline-message.js" defer></script>
  <script src="js/components/atoms/segmented-control.js" defer></script>
  <script src="js/components/atoms/select.js" defer></script>
  <script src="js/components/atoms/icon-action-button.js" defer></script>
  <script src="js/components/atoms/textarea.js" defer></script>
  <script src="js/components/atoms/switch-toggle.js" defer></script>
  <script src="js/components/atoms/input-component.js" defer></script>
  <script src="js/components/atoms/status-badge.js" defer></script>

  <!-- Molecules (Compound Elements) -->
  <script src="js/components/molecules/workspace-switcher.js" defer></script>
  <script src="js/components/molecules/context-menu.js" defer></script>
  <script src="js/components/molecules/sidebar-section-header.js" defer></script>
  <script src="js/components/molecules/tree-item.js" defer></script>
  <script src="js/components/molecules/search-component.js" defer></script>
  <script src="js/components/molecules/setting-toggle-item.js" defer></script>
  <script src="js/components/molecules/setting-row.js" defer></script>
  <script src="js/components/molecules/menu-shield.js" defer></script>
  <script src="js/components/molecules/scroll-container.js" defer></script>
  <script src="js/components/molecules/tab-preview.js" defer></script>
  <script src="js/components/molecules/project-map.js" defer></script>

  <!-- Organisms (Complex Components) -->
  <script src="js/components/organisms/tree-view.js" defer></script>
  <script src="js/components/organisms/change-action-view-bar.js" defer></script>
  <script src="js/components/organisms/sidebar-left.js" defer></script>
  <script src="js/components/organisms/tab-bar.js" defer></script>
  <script src="js/components/organisms/edit-toolbar-component.js" defer></script>
  <script src="js/components/organisms/markdown-viewer-component.js" defer></script>
  <script src="js/components/organisms/right-sidebar.js" defer></script>
  <script src="js/components/organisms/comment-form-component.js" defer></script>
  <script src="js/components/organisms/workspace-picker-component.js" defer></script>
  <script src="js/components/organisms/workspace-form-component.js" defer></script>
  <script src="js/components/organisms/settings-component.js" defer></script>
  <script src="js/components/organisms/markdown-helper-component.js" defer></script>
  <script src="js/components/organisms/shortcuts-component.js" defer></script>
  <script src="js/components/organisms/toc-component.js" defer></script>
  <script src="js/components/organisms/base-form-modal.js" defer></script>
  <script src="js/components/organisms/publish-settings-form-component.js" defer></script>
  <script src="js/components/organisms/publish-manager-component.js" defer></script>
  <script src="js/components/organisms/publish-config-component.js" defer></script>
  <script src="js/components/organisms/explorer-settings-component.js" defer></script>
  <script src="js/components/organisms/search-palette.js" defer></script>

  <!-- ── 3. Services ── -->
  <script src="js/services/ui-utils.js" defer></script>
  <script src="js/services/settings-service.js" defer></script>
  <script src="js/services/file-service.js" defer></script>
  <script src="js/services/markdown-logic-service.js" defer></script>
  <script src="js/services/tree-drag-manager.js" defer></script>
  <script src="js/services/recently-viewed-service.js" defer></script>
  <script src="js/services/search-service.js" defer></script>
  <script src="js/services/shortcut-service.js" defer></script>
  <script src="js/services/sync-service.js" defer></script>
  <script src="js/services/publish-service.js" defer></script>

  <!-- ── 4. Utilities ── -->
  <script src="js/utils/zoom.js" defer></script>
  <script src="js/utils/mermaid.js" defer></script>
  <script src="js/utils/gdoc-util.js" defer></script>
  <script src="js/utils/code-blocks.js" defer></script>
  <script src="js/utils/scroll.js" defer></script>

  <!-- ── 5. Business Logic Modules ── -->
  <script src="js/modules/tree.js" defer></script>
  <script src="js/modules/workspace.js" defer></script>
  <script src="js/modules/comments.js" defer></script>
  <script src="js/modules/collect.js" defer></script>
  <script src="js/modules/draft.js" defer></script>
  <script src="js/modules/editor.js" defer></script>
  <script src="js/modules/tabs.js" defer></script>

  <!-- ── 6. Application Entry ── -->
  <script src="js/core/app.js" defer></script>

</body>

</html>
```
</file>

<file path="renderer/js/components/atoms/button.js">
```js
/* global DesignSystem */
/**
 * ButtonComponent (Atom)
 * Purpose: Provides standardized button and combo-button elements.
 */
const ButtonComponent = (() => {
  'use strict';

  /**
   * Create a standardized button
   */
  function create(options = {}) {
    const {
      label,
      variant = 'primary',
      onClick,
      disabled = false,
      className = '',
      leadingIcon = null,
      trailingIcon = null,
      offLabel = false,
      title = null,
      radius = 'var(--ds-radius-widget)'
    } = options;

    // Enforce single icon for off-label buttons
    let activeLeadingIcon = leadingIcon;
    let activeTrailingIcon = trailingIcon;
    if (offLabel && activeLeadingIcon && activeTrailingIcon) {
      activeTrailingIcon = null;
    }

    const btn = DesignSystem.createElement('button', [
      `ds-btn`,
      `ds-btn-${variant}`,
      offLabel ? 'ds-btn-off-label' : '',
      className
    ]);

    if (options.id) btn.id = options.id;

    btn.style.setProperty('--_radius', radius);

    if (activeLeadingIcon) {
      const iconHtml = DesignSystem.getIcon(activeLeadingIcon) || activeLeadingIcon;
      const span = DesignSystem.createElement('span', 'ds-btn-icon-leading', { html: iconHtml });
      btn.appendChild(span);
    }

    if (label && !offLabel) {
      const textSpan = DesignSystem.createElement('span', 'ds-btn-text', { text: label });
      btn.appendChild(textSpan);
    }

    if (activeTrailingIcon) {
      const iconHtml = DesignSystem.getIcon(activeTrailingIcon) || activeTrailingIcon;
      const span = DesignSystem.createElement('span', 'ds-btn-icon-trailing', { html: iconHtml });
      btn.appendChild(span);
    }

    if (disabled) btn.disabled = true;
    if (onClick) btn.onclick = onClick;

    if (title || (offLabel && label)) {
      DesignSystem.applyTooltip(btn, title || label, options.tooltipPos || 'bottom');
    }

    // Add loading state helper
    btn.setLoading = (isLoading) => {
      if (isLoading) {
        btn.classList.add('is-loading');
        btn.disabled = true;

        // Handle icon swapping/appending
        const iconLeading = btn.querySelector('.ds-btn-icon-leading');
        if (iconLeading) {
          // Save original icon HTML to restore later
          iconLeading.dataset.originalIcon = iconLeading.innerHTML;
          iconLeading.innerHTML = DesignSystem.getIcon('loader') || '';
        } else {
          // Create a temporary leading icon for the loader
          const loaderSpan = DesignSystem.createElement('span', ['ds-btn-icon-leading', 'ds-btn-loader-temp'], {
            html: DesignSystem.getIcon('loader') || ''
          });
          btn.prepend(loaderSpan);
        }
      } else {
        btn.classList.remove('is-loading');
        btn.disabled = disabled;

        // Restore original state
        const loaderTemp = btn.querySelector('.ds-btn-loader-temp');
        if (loaderTemp) {
          loaderTemp.remove();
        } else {
          const iconLeading = btn.querySelector('.ds-btn-icon-leading');
          if (iconLeading && iconLeading.dataset.originalIcon) {
            iconLeading.innerHTML = iconLeading.dataset.originalIcon;
            delete iconLeading.dataset.originalIcon;
          }
        }
      }
    };

    // Add icon update helper
    btn.setIcon = (iconName) => {
      const span = btn.querySelector('.ds-btn-icon-leading');
      if (span) {
        span.innerHTML = DesignSystem.getIcon(iconName) || '';
      }
    };

    // Add label update helper
    btn.setLabel = (newLabel) => {
      const span = btn.querySelector('.ds-btn-text');
      if (span) {
        span.textContent = newLabel;
      }
    };

    return btn;
  }

  /**
   * Create a combo button (Main + Toggle)
   */
  function createCombo(options = {}) {
    const {
      label,
      variant = 'subtitle',
      leadingIcon = null,
      mainAction,
      toggleAction,
      disabled = false,
      className = '',
      tooltip = null,
      radius = 'var(--ds-radius-widget)'
    } = options;

    const container = DesignSystem.createElement('div', [
      'ds-combo-btn',
      `ds-combo-btn-${variant}`,
      className
    ]);

    if (options.id) container.id = options.id;

    container.style.setProperty('--_radius', radius);
    if (disabled) {
      container.classList.add('is-disabled');
      container.setAttribute('disabled', 'true'); 
    }

    // Main Part
    const main = DesignSystem.createElement('div', 'ds-combo-btn-main');
    if (leadingIcon) {
      const iconHtml = DesignSystem.getIcon(leadingIcon) || leadingIcon;
      main.appendChild(DesignSystem.createElement('span', 'ds-btn-icon-leading', { html: iconHtml }));
    }
    if (label) {
      main.appendChild(DesignSystem.createElement('span', 'ds-btn-text', { text: label }));
    }
    
    if (!disabled && mainAction) {
      main.onclick = (e) => {
        e.stopPropagation();
        mainAction(e);
      };
    }

    // Toggle Part
    const toggle = DesignSystem.createElement('div', 'ds-combo-btn-toggle', {
      html: DesignSystem.getIcon('chevron-down') || '▼'
    });
    
    if (options.toggleTooltip) {
      DesignSystem.applyTooltip(toggle, options.toggleTooltip, 'bottom');
    }
    
    if (!disabled && toggleAction) {
      toggle.onclick = (e) => {
        e.stopPropagation();
        if (container.classList.contains('is-open')) {
          if (typeof window.MenuShield !== 'undefined') window.MenuShield.close();
          return;
        }
        toggleAction(e);
      };
    }

    container.appendChild(main);
    container.appendChild(toggle);

    if (tooltip) {
      DesignSystem.applyTooltip(container, tooltip, 'bottom');
    }

    return container;
  }

  return { create, createCombo };
})();

window.ButtonComponent = ButtonComponent;

```
</file>

<file path="renderer/js/components/atoms/icon-action-button.js">
```js
/**
 * IconActionButton.js — Atomic Design (Atom)
 * Unified action button with icon for various headers and toolbars.
 */

class IconActionButton {
    constructor(options = {}) {
        this.id = options.id;
        this.title = options.title || '';
        this.iconName = options.iconName;
        this.onClick = options.onClick;
        this.className = options.className || '';
        this.iconSize = options.iconSize || (options.isLarge ? 20 : 16);
        this.isDanger = options.isDanger || false;
        this.isPrimary = options.isPrimary || false;
        this.isLarge = options.isLarge || false;
    }

    render() {
        const btn = document.createElement('button');
        if (this.id) btn.id = this.id;
        
        const classes = ['ds-icon-action-btn'];
        if (this.isDanger) classes.push('is-danger');
        if (this.isPrimary) classes.push('is-primary');
        if (this.isLarge) classes.push('is-large');
        if (this.className) classes.push(this.className);
        
        btn.className = classes.join(' ');
        
        if (this.title) {
            DesignSystem.applyTooltip(btn, this.title, 'bottom');
        }

        // Get icon from DesignSystem
        const iconHtml = DesignSystem.getIcon(this.iconName);
        btn.innerHTML = iconHtml;

        // Set icon size (since DesignSystem icons are 24x24 by default)
        const svg = btn.querySelector('svg');
        if (svg) {
            svg.setAttribute('width', this.iconSize);
            svg.setAttribute('height', this.iconSize);
        }

        if (this.onClick) {
            btn.onclick = (e) => {
                e.stopPropagation();
                this.onClick(e, btn);
            };
        }

        return btn;
    }
}

window.IconActionButton = IconActionButton;

```
</file>

<file path="renderer/js/components/atoms/inline-message.js">
```js
/* global DesignSystem */
/**
 * InlineMessageComponent (Atom)
 * Purpose: Provides standardized inline callouts/messages.
 */
const InlineMessageComponent = (() => {
  'use strict';

  /**
   * Create an inline message (callout)
   */
  function create(options = {}) {
    const {
      text = '',
      variant = 'info', // 'info', 'success', 'warning', 'error'
      icon = 'info',
      className = ''
    } = options;

    const container = DesignSystem.createElement('div', [
      `ds-inline-message`, 
      `ds-inline-message--${variant}`, 
      className
    ]);
    
    const iconHtml = DesignSystem.getIcon(icon) || DesignSystem.getIcon('info') || '';
    if (iconHtml) {
      const iconWrapper = DesignSystem.createElement('div', 'ds-inline-message-icon', { html: iconHtml });
      container.appendChild(iconWrapper);
    }

    const textEl = DesignSystem.createElement('div', 'ds-inline-message-text', { text });
    container.appendChild(textEl);

    return container;
  }

  return { create };
})();

window.InlineMessageComponent = InlineMessageComponent;

```
</file>

<file path="renderer/js/components/atoms/input-component.js">
```js
/* global DesignSystem */
/**
 * InputComponent
 * Purpose: A robust, reusable input atom with support for labels, actions, and status indicators.
 * Follows the Design System's Atomic design principles.
 */
const InputComponent = (() => {
  'use strict';

  /**
   * Create a standardized input component
   * @param {Object} options
   * @returns {HTMLElement} The enhanced container element
   */
  function create(options = {}) {
    const {
      type = 'text',
      placeholder = '',
      value = '',
      className = '',
      id = '',
      label = null,
      variant = 'default', // 'default', 'error', 'success', 'warning'
      status = null, // { text, variant }
      action = null, // { icon, onClick, title }
      onInput = null,
      onChange = null,
      disabled = false,
      readOnly = false,
      description = null
    } = options;

    // 1. Create Container (Form Field)
    const container = DesignSystem.createElement('div', ['ds-form-field', className]);
    if (id) container.id = id;

    // 2. Label & Tooltip Description
    if (label) {
      const labelEl = DesignSystem.createElement('label', 'ds-form-field-label', { text: label });
      if (description) {
        DesignSystem.applyTooltip(labelEl, description, 'top');
        labelEl.classList.add('has-tooltip');
      }
      container.appendChild(labelEl);
    }

    // 3. Input Wrapper (Group if action exists)
    const wrapperClass = action ? 'ds-input-group' : 'ds-input-wrapper';
    const wrapper = DesignSystem.createElement('div', [wrapperClass]);
    if (variant && variant !== 'default') {
      wrapper.classList.add(`ds-input--${variant}`);
    }
    container.appendChild(wrapper);

    // 4. Actual Input
    const input = DesignSystem.createElement('input', 'ds-input');
    input.type = type;
    input.placeholder = placeholder;
    input.value = value;
    if (disabled) input.disabled = true;
    if (readOnly) input.readOnly = true;
    if (className) input.classList.add(className);
    wrapper.appendChild(input);

    // 5. Action Button
    let actionBtn = null;
    if (action) {
      actionBtn = DesignSystem.createButton({
        variant: 'ghost',
        leadingIcon: action.icon,
        onClick: action.onClick,
        title: action.title,
        offLabel: true,
        className: 'ds-input-group-action'
      });
      wrapper.appendChild(actionBtn);
    }

    // 6. Status Indicator
    const statusEl = DesignSystem.createElement('div', 'ds-form-field-status');
    container.appendChild(statusEl);

    // ── Instance API (Attached to container) ─────────────────────
    
    /**
     * Update the status message and variant
     * @param {Object} data - { text, variant, isLoading }
     */
    container.setStatus = (data) => {
      if (!data || (!data.text && !data.icon)) {
        statusEl.innerHTML = '';
        statusEl.className = 'ds-form-field-status';
        statusEl.classList.remove('show');
        return;
      }

      statusEl.className = 'ds-form-field-status show';
      
      let html = '';
      if (data.icon) {
        const iconHtml = DesignSystem.getIcon(data.icon);
        html += `<span class="ds-form-field-status-icon">${iconHtml}</span>`;
      }
      if (data.text) {
        html += `<span class="ds-form-field-status-text">${data.text}</span>`;
      }
      
      statusEl.innerHTML = html;
      
      if (data.variant) {
        statusEl.classList.add(`ds-form-field-status--${data.variant}`);
      }
      
      if (data.isLoading) {
        statusEl.classList.add('is-loading');
      }
    };

    /**
     * Update the input variant (border/bg)
     * @param {string} newVariant - 'default', 'error', 'success', 'warning'
     */
    container.setVariant = (newVariant) => {
      // Clean old variants
      ['error', 'success', 'warning'].forEach(v => {
        wrapper.classList.remove(`ds-input--${v}`);
      });
      
      if (newVariant && newVariant !== 'default') {
        wrapper.classList.add(`ds-input--${newVariant}`);
      }
    };

    /**
     * Set loading state for the status indicator
     * @param {boolean} isLoading
     * @param {string} loadingText
     */
    container.setLoading = (isLoading, loadingText = 'Processing...') => {
      if (isLoading) {
        container.setStatus({ text: loadingText, variant: 'info', isLoading: true });
      } else {
        container.setStatus(null);
      }
    };

    // Proxy standard properties
    Object.defineProperty(container, 'value', {
      get: () => input.value,
      set: (v) => { input.value = v; },
      configurable: true
    });

    container.focus = () => input.focus();
    container.input = input;
    if (actionBtn) container.actionBtn = actionBtn;

    // Events
    if (onInput) input.addEventListener('input', (e) => onInput(e, input.value));
    if (onChange) input.addEventListener('change', (e) => onChange(e, input.value));

    // Initial status
    if (status) container.setStatus(status);

    return container;
  }

  return { create };
})();

window.InputComponent = InputComponent;

```
</file>

<file path="renderer/js/components/atoms/modal.js">
```js
/* global DesignSystem */
/**
 * ModalComponent (Atom)
 * Purpose: Provides standardized popover shields, confirmation dialogs, and prompts.
 */
const ModalComponent = (() => {
  'use strict';

  /**
   * Create a Popover Shield
   */
  function create(options = {}) {
    const {
      title = 'Modal',
      content = '',
      footer = null,
      className = '',
      width = null,
      hasBackdrop = true,
      showHeader = true,
      position = null,
      alignment = 'center', // 'center', 'bottom-left', or 'custom'
      container = document.body,
      onClose = null
    } = options;

    const shieldClass = hasBackdrop ? 'ds-popover-shield' : 'ds-popover-floating';
    const shield = DesignSystem.createElement('div', [shieldClass, `ds-popover-${alignment}`]);
    const isBody = container === document.body;
    shield.style.position = isBody ? 'fixed' : 'absolute';

    const card = DesignSystem.createElement('div', ['ds-popover-card', className]);
    if (width) card.style.width = width;
    if (position) {
      if (position.top) card.style.top = position.top;
      if (position.right) card.style.right = position.right;
      if (position.bottom) card.style.bottom = position.bottom;
      if (position.left) card.style.left = position.left;
      card.style.position = 'fixed';
      card.style.margin = '0';
    }

    const header = DesignSystem.createElement('div', 'ds-popover-header');
    const titleEl = DesignSystem.createElement('h2', 'ds-popover-title', { text: title });
    const closeBtn = DesignSystem.createElement('button', 'ds-popover-close', { 
      html: DesignSystem.getIcon('x') || '✕' 
    });

    const body = DesignSystem.createElement('div', 'ds-popover-body');
    if (content instanceof HTMLElement) {
      body.appendChild(content);
    } else if (typeof content === 'string') {
      body.innerHTML = content;
    }

    if (showHeader) {
      header.appendChild(titleEl);
      header.appendChild(closeBtn);
      card.appendChild(header);
    }
    card.appendChild(body);

    if (footer) {
      const footerEl = DesignSystem.createElement('div', 'ds-popover-footer');
      if (footer instanceof HTMLElement) {
        footerEl.appendChild(footer);
      } else {
        footerEl.innerHTML = footer;
      }
      card.appendChild(footerEl);
    }

    shield.appendChild(card);

    const closeAction = () => {
      shield.classList.remove('show');
      setTimeout(() => {
        shield.remove();
        if (onClose) onClose();
      }, 250);
    };

    closeBtn.onclick = closeAction;
    shield.onclick = (e) => {
      if (hasBackdrop && e.target === shield) closeAction();
    };

    container.appendChild(shield);
    setTimeout(() => shield.classList.add('show'), 10);

    if (!hasBackdrop) {
      const clickAway = (e) => {
        if (e.target.closest('.ds-popover-card')) return;
        if (!card.contains(e.target)) {
          closeAction();
          document.removeEventListener('click', clickAway, true);
        }
      };
      setTimeout(() => document.addEventListener('click', clickAway, true), 100);
    }

    const popoverInstance = { shield, card, body, close: closeAction };
    shield.__popover = popoverInstance;
    return popoverInstance;
  }

  /**
   * Show a confirmation dialog
   */
  function confirm({ title, message, onConfirm, onCancel }) {
    const content = DesignSystem.createElement('div', 'ds-confirm-content');
    content.innerHTML = `<p class="ds-confirm-message">${message}</p>`;

    const footer = DesignSystem.createElement('div', 'ds-confirm-footer');
    const cancelBtn = DesignSystem.createButton({ label: 'Cancel', variant: 'ghost' });
    const confirmBtn = DesignSystem.createButton({ label: 'Confirm', variant: 'primary' });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    const popover = create({
      title,
      content,
      footer,
      width: '400px',
      className: 'ds-modal-confirm'
    });

    confirmBtn.onclick = async () => {
      try {
        if (onConfirm) await onConfirm();
      } finally {
        popover.close();
      }
    };
    cancelBtn.onclick = () => {
      if (onCancel) onCancel();
      popover.close();
    };
  }

  /**
   * Show a prompt dialog
   */
  function prompt(options) {
    const { title, message, placeholder, defaultValue = '', onConfirm, onCancel } = options;
    const content = DesignSystem.createElement('div', 'ds-prompt-content');
    const label = DesignSystem.createElement('label', 'ds-field-label', { text: message });
    const input = DesignSystem.createInput({ 
      type: 'text', 
      placeholder: placeholder, 
      value: defaultValue 
    });

    content.appendChild(label);
    content.appendChild(input);

    const footer = DesignSystem.createElement('div', 'ds-confirm-footer');
    const cancelBtn = DesignSystem.createButton({ label: 'Cancel', variant: 'ghost' });
    const confirmBtn = DesignSystem.createButton({ label: 'Continue', variant: 'primary' });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    const popover = create({
      title,
      content,
      footer,
      width: '440px',
      className: 'ds-modal-prompt'
    });

    setTimeout(() => input.focus(), 150);

    confirmBtn.onclick = async () => {
      const val = input.value.trim();
      if (!val) {
        input.classList.add('ds-input-error');
        input.focus();
        return;
      }
      if (onConfirm) await onConfirm(val);
      popover.close();
    };

    input.oninput = () => input.classList.remove('ds-input-error');
    input.onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); confirmBtn.click(); }
      if (e.key === 'Escape') { e.preventDefault(); cancelBtn.click(); }
    };

    cancelBtn.onclick = () => {
      if (onCancel) onCancel();
      popover.close();
    };
  }

  return { create, confirm, prompt };
})();

window.ModalComponent = ModalComponent;

```
</file>

<file path="renderer/js/components/atoms/segmented-control.js">
```js
/* global DesignSystem */
/**
 * SegmentedControlComponent (Atom)
 * Purpose: Provides a standardized segmented control with a sliding indicator.
 */
const SegmentedControlComponent = (() => {
  'use strict';

  /**
   * Create a segmented control
   */
  function create(options = {}) {
    const {
      items = [],
      activeId = null,
      onChange = null,
      radius = 'var(--ds-radius-panel)',
      className = ''
    } = options;

    const control = DesignSystem.createElement('div', ['ds-segmented-control', className]);
    control.style.setProperty('--_radius', radius);

    const indicator = DesignSystem.createElement('div', 'ds-segment-indicator');
    control.appendChild(indicator);

    items.forEach(itemData => {
      const item = DesignSystem.createElement('div', 'ds-segment-item', {
        'data-id': itemData.id,
        'html': DesignSystem.getIcon(itemData.icon)
      });

      if (itemData.title) {
        DesignSystem.applyTooltip(item, itemData.title, options.tooltipPos || 'bottom');
      }

      if (itemData.id === activeId) item.classList.add('active');

      item.addEventListener('mousedown', (e) => e.preventDefault());
      item.addEventListener('click', () => {
        if (onChange) onChange(itemData.id);
      });

      control.appendChild(item);
    });

    const instance = {
      el: control,
      indicator,
      updateActive: (id) => {
        const allItems = control.querySelectorAll('.ds-segment-item');
        let activeItem = null;
        allItems.forEach(item => {
          const isActive = item.getAttribute('data-id') === id;
          item.classList.toggle('active', isActive);
          if (isActive) activeItem = item;
        });

        if (indicator && activeItem) {
          requestAnimationFrame(() => {
            indicator.style.width = `${activeItem.offsetWidth}px`;
            indicator.style.height = `${activeItem.offsetHeight}px`;
            indicator.style.left = `${activeItem.offsetLeft}px`;
            indicator.style.top = `${activeItem.offsetTop}px`;
          });
        }
      }
    };

    if (activeId) {
      setTimeout(() => instance.updateActive(activeId), 0);
    }

    return instance;
  }

  return { create };
})();

window.SegmentedControlComponent = SegmentedControlComponent;

```
</file>

<file path="renderer/js/components/atoms/select.js">
```js
/* global DesignSystem */
/**
 * SelectComponent (Atom)
 * Purpose: Provides a standardized styled select element.
 */
const SelectComponent = (() => {
  'use strict';

  /**
   * Create a standardized select element
   */
  function create(options = [], currentVal, onChange) {
    const select = DesignSystem.createElement('select', 'ds-select');
    options.forEach(opt => {
      const value = typeof opt === 'string' ? opt : opt.value;
      const label = typeof opt === 'string' ? opt : opt.label;
      const el = DesignSystem.createElement('option', '', { value, text: label });
      if (value === currentVal) el.selected = true;
      select.appendChild(el);
    });
    if (onChange) select.onchange = (e) => onChange(e.target.value);
    return select;
  }

  return { create };
})();

window.SelectComponent = SelectComponent;

```
</file>

<file path="renderer/js/components/atoms/status-badge.js">
```js
/**
 * StatusBadge Component (Atom)
 * Purpose: A subtle status indicator consisting of a dot and a label.
 */
const StatusBadge = (() => {
  'use strict';

  /**
   * Create a StatusBadge element
   * @param {Object} options - { text, variant, className }
   * @returns {HTMLElement}
   */
  function create(options = {}) {
    const {
      text = '',
      variant = 'info',
      className = ''
    } = options;

    const container = document.createElement('div');
    container.className = `ds-status-badge ds-status-badge--${variant} ${className}`;

    const dot = document.createElement('span');
    dot.className = 'ds-status-badge-dot';

    const label = document.createElement('span');
    label.className = 'ds-status-badge-label';
    label.textContent = text;

    container.appendChild(dot);
    container.appendChild(label);

    // Dynamic API
    container.setText = (newText) => {
      label.textContent = newText;
    };

    container.setVariant = (newVariant) => {
      container.className = `ds-status-badge ds-status-badge--${newVariant} ${className}`;
    };

    return container;
  }

  return {
    create
  };
})();

window.StatusBadge = StatusBadge;

```
</file>

<file path="renderer/js/components/atoms/switch-toggle.js">
```js
/* ============================================================
   switch-toggle.js — Reusable Toggle Component Logic
   ============================================================ */

const SwitchToggleModule = (() => {

  /**
   * Initialize a switch toggle component
   * @param {Object} options 
   * @param {string} options.containerId - ID of the element to turn into a toggle
   * @param {boolean} options.isOn - Initial state (default: false)
   * @param {boolean} options.disabled - Initial disabled state (default: false)
   * @param {Function} options.onChange - Optional callback on change(isOn)
   */
  function init(options) {
    const el = options.element || document.getElementById(options.containerId);
    if (!el) {
      console.warn(`[SwitchToggleModule] Element not found: ${options.containerId}`);
      return null;
    }

    // ── Setup HTML if needed ───────────────────────────────────
    // If the element is empty, we inject the indicator
    if (el.children.length === 0) {
      el.classList.add('switch-toggle');
      const indicator = document.createElement('div');
      indicator.className = 'switch-indicator';
      el.appendChild(indicator);
    }

    // ── State Management ───────────────────────────────────────
    let isOn = !!options.isOn;
    let isDisabled = !!options.disabled;

    const updateUI = () => {
      el.classList.toggle('on', isOn);
      el.classList.toggle('disabled', isDisabled);
    };

    const toggle = (force) => {
      if (isDisabled) return;
      isOn = (typeof force === 'boolean') ? force : !isOn;
      updateUI();
      if (options.onChange) options.onChange(isOn);
    };

    const setDisabled = (val) => {
      isDisabled = !!val;
      updateUI();
    };

    // ── Interaction ──────────────────────────────────────────
    el.addEventListener('click', (e) => {
      e.preventDefault();
      toggle();
    });

    // Handle spacebar/enter if focused (if we make it focusable)
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'switch');
    el.setAttribute('aria-checked', isOn);

    el.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggle();
      }
    });

    // Initial sync
    updateUI();

    // ── Exposed Public API ────────────────────────────────────
    return {
      toggle,
      setDisabled,
      get isOn() { return isOn; }
    };
  }

  return { init };
})();
window.SwitchToggleModule = SwitchToggleModule;

```
</file>

<file path="renderer/js/components/atoms/textarea.js">
```js
/* ============================================================
   textarea.js — Reusable Text Area Component Logic
   ============================================================ */

const TextAreaModule = (() => {

  /**
   * Initialize a textarea component
   * @param {Object} options 
   * @param {string} options.containerId - ID of the textarea-component container
   * @param {string} options.inputId - ID of the main textarea
   * @param {string} options.expandBtnId - ID of the expand button
   * @param {string} options.modalId - ID of the expanded modal
   * @param {string} options.modalInputId - ID of the textarea inside the modal
   * @param {string} options.minimizeBtnId - ID of the minimize button in modal
   * @param {string} options.label - Optional text to sync across all .textarea-label elements
   * @param {Function} options.onInput - Optional callback on input change
   */
  function init(options) {
    const container = document.getElementById(options.containerId);
    const input = document.getElementById(options.inputId);
    const expandBtn = document.getElementById(options.expandBtnId);
    const modal = document.getElementById(options.modalId);
    const modalInput = document.getElementById(options.modalInputId);
    const minimizeBtn = document.getElementById(options.minimizeBtnId);

    if (!input || !container) return;

    // ── Label Synchronization ────────────────────────────────
    if (options.label) {
      const allLabels = [
        ...container.querySelectorAll('.textarea-label'),
        ...(modal ? modal.querySelectorAll('.textarea-label') : [])
      ];
      allLabels.forEach(lbl => lbl.textContent = options.label);
    }

    // ── State Transitions ──────────────────────────────────────
    input.addEventListener('focus', () => container.classList.add('is-typing'));
    input.addEventListener('blur', () => container.classList.remove('is-typing'));

    const updateFilledState = (val) => {
      const isFilled = !!(val && val.trim());
      container.classList.toggle('is-filled', isFilled);
    };

    // ── Input Syncing & Callbacks ──────────────────────────────
    input.addEventListener('input', () => {
      const val = input.value;
      updateFilledState(val);
      if (modalInput && modal.classList.contains('show')) {
        modalInput.value = val;
      }
      if (options.onInput) options.onInput(val);
    });

    // ── Expansion / Minimization ──────────────────────────────
    if (expandBtn && modal && modalInput) {
      expandBtn.addEventListener('click', () => {
        modalInput.value = input.value;
        modal.classList.add('show');
        setTimeout(() => modalInput.focus(), 50);
      });

      const closeModal = () => {
        input.value = modalInput.value;
        updateFilledState(input.value);
        modal.classList.remove('show');
        input.focus();
        if (options.onInput) options.onInput(input.value);
      };

      if (minimizeBtn) {
        minimizeBtn.addEventListener('click', closeModal);
      }

      // Backdrop click to close
      const backdrop = modal.querySelector('.expanded-textarea-backdrop');
      if (backdrop) {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) closeModal();
        });
      }

      modalInput.addEventListener('input', () => {
        const val = modalInput.value;
        input.value = val;
        updateFilledState(val);
        if (options.onInput) options.onInput(val);
      });

      // Escape key to close modal
      modalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      });
    }

    // Initial state check
    updateFilledState(input.value);
  }

  return { init };
})();
window.TextAreaModule = TextAreaModule;

```
</file>

<file path="renderer/js/components/design-system-icons.js">
```js
/* ============================================================
   design-system-icons.js — Icon Registry Extension
   ============================================================ */

(() => {
  'use strict';

  if (typeof DesignSystem === 'undefined') {
    console.error('DesignSystemIcons: DesignSystem not found. Make sure design-system.js is loaded first.');
    return;
  }

  const ICONS = {
    'share-2': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
    'share': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>`,
    'trash': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    'trash-2': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    'copy': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>`,
    'message': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    'message-square': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    'message-circle': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>`,
    'message-circle-plus': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`,
    'bookmark': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
    'book-open': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    'pen-line': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    'x': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    'maximize-2': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,
    'minimize-2': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,
    'folder': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
    'file': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    'edit': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    'plus': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>`,
    'file-plus': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
    'folder-plus': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="9" y1="13" x2="15" y2="13"/></svg>`,
    'copy-plus': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="15" x2="15" y1="12" y2="18"/><line x1="12" x2="18" y1="15" y2="15"/><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    'folder-input': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"/><path d="M2 13h10"/><path d="m9 10 3 3-3 3"/></svg>`,
    'external-link': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    'clipboard': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`,
    'search': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>`,
    'search-x': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    'sort': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-3-3-3 3" /><path d="m9 12 3 3 3-3" /><circle cx="12" cy="12" r="10" /></svg>`,
    'chevron-down': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
    'chevron-right': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    'sort-alpha-asc': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 13h6"/><path d="m2 16 4.5-9 4.5 9"/><path d="M18 16V7"/><path d="m14 11 4-4 4 4"/></svg>`,
    'sort-alpha-desc': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 13h6"/><path d="m2 16 4.5-9 4.5 9"/><path d="M18 7v9"/><path d="m14 12 4 4 4-4"/></svg>`,
    'sort-time-asc': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 18 4-4 4 4"/><path d="M16 2v4"/><path d="M18 22v-8"/><path d="M21 11.3V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.3"/><path d="M3 10h18"/><path d="M8 2v4"/></svg>`,
    'sort-time-desc': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 18 4 4 4-4"/><path d="M16 2v4"/><path d="M18 14v8"/><path d="M21 11.3V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.3"/><path d="M3 10h18"/><path d="M8 2v4"/></svg>`,
    'sort-custom': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.1 6.27a2 2 0 0 0 0 3.46l9.07 4.09a2 2 0 0 0 1.66 0l9.07-4.09a2 2 0 0 0 0-3.46z"/><path d="m2.1 14.73 9.07 4.09a2 2 0 0 0 1.66 0l9.07-4.09"/><path d="m2.1 10.54 9.07 4.09a2 2 0 0 0 1.66 0l9.07-4.09"/></svg>`,
    'heading': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h12"/><path d="M6 20V4"/><path d="M18 20V4"/></svg>`,
    'bold': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 12a4 4 0 0 0 0-8H6v8"/><path d="M15 20a4 4 0 0 0 0-8H6v8"/></svg>`,
    'italic': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>`,
    'strikethrough': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" x2="20" y1="12" y2="12"/></svg>`,
    'quote': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 6H3"/><path d="M21 12H8"/><path d="M21 18H8"/><path d="M3 12v6"/></svg>`,
    'link': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    'image': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    'minus': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" x2="19" y1="12" y2="12"/></svg>`,
    'list': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>`,
    'list-ordered': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>`,
    'check-square': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`,
    'code': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    'terminal': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>`,
    'table': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>`,
    'help-circle': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    'settings': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>`,
    'keyboard': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" ry="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/></svg>`,
    'sliders': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="10" y1="21" y2="21"/><line x1="4" x2="14" y1="14" y2="14"/><line x1="4" x2="8" y1="7" y2="7"/><line x1="14" x2="20" y1="21" y2="21"/><line x1="18" x2="20" y1="14" y2="14"/><line x1="12" x2="20" y1="7" y2="7"/><line x1="10" x2="10" y1="18" y2="24"/><line x1="14" x2="14" y1="11" y2="17"/><line x1="8" x2="8" y1="4" y2="10"/></svg>`,
    'check': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
    'chevron-up': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`,
    'eye': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>`,
    'eye-off': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`,
    'file-search-corner': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M20 12V8l-6-6H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h4"/><circle cx="17" cy="17" r="3"/><path d="m21 21-1.5-1.5"/></svg>`,
    'settings-2': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>`,
    'folder-minus': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><line x1="9" y1="13" x2="15" y2="13"/></svg>`,
    'chevrons-down-up': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/></svg>`,
    'file-text': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="10" y2="9"/></svg>`,
    'pin-off': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M15 4.5V4a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5v3"/><path d="M9 9a2 2 0 0 0-1.11 1.76l-1.78.9c-.39.2-.1.8.34.8h6.55"/><path d="m2 2 20 20"/><path d="M12.43 6.81A2 2 0 0 1 13 4.5"/><path d="M18.11 12.55a2 2 0 0 0-1.11-1.79V9.5"/><path d="M18.34 13h.56a.5.5 0 0 0 .34-.8l-1.78-.9"/></svg>`,
    'save': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
    'undo': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>`,
    'redo': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"/></svg>`,
    'sidebar-collapse': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6-6 6 6 6"/><path d="M3 12h12"/><path d="M21 19V5"/></svg>`,
    'sidebar-expand': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5v14"/><path d="M21 12H9"/><path d="m15 18 6-6-6-6"/></svg>`,
    'maximize': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`,
    'mouse-pointer': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>`,
    'arrow-up': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>`,
    'arrow-down': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>`,
    'briefcase': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    'heading': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h12"/><path d="M6 20V4"/><path d="M18 20V4"/></svg>`,
    'heading-1': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/></svg>`,
    'heading-2': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>`,
    'heading-3': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5s-1.5 2-3 2c1.5 0 3 .5 3 2s-1.5 3-3.5 2"/></svg>`,
    'heading-4': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17 10v4h4"/><path d="M21 10v8"/></svg>`,
    'heading-5': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17 13v-3h4"/><path d="M17 17.7c.4.2.8.3 1.3.3 1.5 0 2.7-1.1 2.7-2.5S19.8 13 18.3 13H17"/></svg>`,
    'heading-6': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><circle cx="19" cy="16" r="2"/><path d="M20 10c-2 0-3 1.7-3 3.5V16"/></svg>`,
    'pin': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9c-.39.2-.1.8.34.8h11.1a.5.5 0 0 0 .34-.8l-1.78-.9a2 2 0 0 1-1.11-1.79V4.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5v6.26Z"/></svg>`,
    'list-tree': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12h-8"/><path d="M21 6h-8"/><path d="M21 18h-8"/><path d="M3 6v4c0 1.1.9 2 2 2h3"/><path d="M3 10v6c0 1.1.9 2 2 2h3"/></svg>`,
    'map': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg>`,
    'panel-left': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>`,
    'file-stack': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1"/><path d="M16 16a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1"/><path d="M21 6a2 2 0 0 0-.586-1.414l-2-2A2 2 0 0 0 17 2h-3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1z"/></svg>`,
    'globe': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    'check-circle': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    'circle-x': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
    'circle-check': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
    'loader': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ds-icon-spin"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>`
  };

  DesignSystem.registerIcons(ICONS);

  window.DesignSystemIcons = {};
})();

```
</file>

<file path="renderer/js/components/design-system.js">
```js
/* global InputComponent, ContextMenuComponent, StatusBadge, ButtonComponent, ModalComponent, InlineMessageComponent, SegmentedControlComponent, SelectComponent */
/* ============================================================
   design-system.js — Core Design System Module
   ============================================================ */

const DesignSystem = (() => {
  const ICONS = {};

  /**
   * Private: Helper to create a DOM element
   */
  function createElement(tag, className, attributes = {}) {
    const el = document.createElement(tag);
    if (className) {
      if (Array.isArray(className)) {
        const validClasses = className
          .flatMap(c => (typeof c === 'string' ? c.trim().split(/\s+/) : [c]))
          .filter(c => c && typeof c === 'string' && c.trim() !== '');
        if (validClasses.length > 0) el.classList.add(...validClasses);
      } else if (typeof className === 'string' && className.trim() !== '') {
        const tokens = className.trim().split(/\s+/);
        el.classList.add(...tokens);
      }
    }
    if (attributes) {
      Object.keys(attributes).forEach(key => {
        if (key === 'text') {
          el.textContent = attributes[key];
        } else if (key === 'html') {
          el.innerHTML = attributes[key];
        } else {
          el.setAttribute(key, attributes[key]);
        }
      });
    }
    return el;
  }


  /**
   * Public API
   */
  return {
    createElement,
    createPopoverShield: (options) => {
      if (typeof ModalComponent !== 'undefined') {
        return ModalComponent.create(options);
      }
      return null;
    },

    /**
     * Registers a set of icons into the DesignSystem registry
     * @param {Object} icons - Dictionary of icon names and SVG strings
     */
    registerIcons: (icons) => {
      Object.assign(ICONS, icons);
    },

    createContextMenu: (e, items) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (typeof ContextMenuComponent !== 'undefined') {
        return ContextMenuComponent.open({ event: e, items });
      }
      return null;
    },

    /**
     * Create an anchored menu (dropdown style)
     * @param {HTMLElement} anchor - The element to attach to
     * @param {Array} items - Menu items
     * @param {Object} options - Additional options
     */
    createMenu: (anchor, items, options = {}) => {
      if (typeof ContextMenuComponent !== 'undefined') {
        const { onClose, ...rest } = options;

        // Auto-manage is-open state for combo buttons
        if (anchor && anchor.classList.contains('ds-combo-btn')) {
          anchor.classList.add('is-open');
        }

        const wrappedOnClose = () => {
          if (anchor && anchor.classList.contains('ds-combo-btn')) {
            anchor.classList.remove('is-open');
          }
          if (onClose) onClose();
        };

        return ContextMenuComponent.open({ 
          anchor, 
          items, 
          onClose: wrappedOnClose,
          ...rest 
        });
      }
      return null;
    },

    getIcon: (name) => ICONS[name] || '',

    createHeaderAction: (iconName, title, onClick, id, tooltipPos = 'bottom') => {
      const iconHtml = ICONS[iconName] || iconName;
      const btn = createElement('button', 'ds-header-action', { 'html': iconHtml, 'id': id });
      if (id) btn.dataset.actionId = id;
      if (title) DesignSystem.applyTooltip(btn, title, tooltipPos);
      if (onClick) {
        btn.addEventListener('click', (e) => {
          onClick(e);
        });
      }
      return btn;
    },

    applyTooltip: (element, text, position = 'bottom') => {
      if (!element || !text) return;
      element.setAttribute('data-ds-tooltip', text);
      element.setAttribute('data-ds-tooltip-pos', position);
      element.removeAttribute('title');
    },

    createTooltip: (text, position = 'bottom') => {
      return createElement('div', ['ds-tooltip', `ds-tooltip-${position}`], { text });
    },

    createSelect: (options = [], currentVal, onChange) => {
      if (typeof SelectComponent !== 'undefined') {
        return SelectComponent.create(options, currentVal, onChange);
      }
      return null;
    },

    createComboButton: (options = {}) => {
      if (typeof ButtonComponent !== 'undefined') {
        return ButtonComponent.createCombo(options);
      }
      return null;
    },

    createButton: (options = {}) => {
      if (typeof ButtonComponent !== 'undefined') {
        return ButtonComponent.create(options);
      }
      return null;
    },

    /**
     * Creates a standardized input element
     */
    /**
     * Creates a standardized input element using InputComponent
     */
    createInput: (options = {}) => {
      if (typeof InputComponent !== 'undefined') {
        return InputComponent.create(options);
      }
      
      // Fallback if InputComponent is not yet loaded (unlikely)
      const { type = 'text', placeholder = '', value = '', className = '' } = options;
      const input = createElement('input', [`ds-input`, className]);
      input.type = type;
      input.placeholder = placeholder;
      input.value = value;
      return input;
    },

    /**
     * Creates an input with an attached action button using InputComponent
     */
    createInputGroup: (options = {}) => {
      if (typeof InputComponent !== 'undefined') {
        const { inputOptions = {}, ...rest } = options;
        return InputComponent.create({ ...inputOptions, ...rest });
      }

      // Fallback
      const group = createElement('div', ['ds-input-group']);
      const input = createElement('input', 'ds-input');
      group.appendChild(input);
      return group;
    },

    /**
     * Creates an inline message (callout)
     */
    createInlineMessage: (options = {}) => {
      if (typeof InlineMessageComponent !== 'undefined') {
        return InlineMessageComponent.create(options);
      }
      return null;
    },

    /**
     * Creates a subtle status indicator (Dot + Label)
     */
    createStatusBadge: (options = {}) => {
      if (typeof StatusBadge !== 'undefined') {
        return StatusBadge.create(options);
      }
      return createElement('div', 'ds-status-badge-fallback', { text: options.text });
    },

    createSegmentedControl: (options = {}) => {
      if (typeof SegmentedControlComponent !== 'undefined') {
        return SegmentedControlComponent.create(options);
      }
      return null;
    },

    showConfirm: (options) => {
      if (typeof ModalComponent !== 'undefined') {
        return ModalComponent.confirm(options);
      }
    },

    showPrompt: (options) => {
      if (typeof ModalComponent !== 'undefined') {
        return ModalComponent.prompt(options);
      }
    },

    showCustomModal: (options) => {
      if (typeof ModalComponent !== 'undefined') {
        return ModalComponent.create(options);
      }
      return null;
    },

    initSmartTooltips: function () {
      let tooltipEl = document.getElementById('ds-global-tooltip');
      if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'ds-global-tooltip';
        tooltipEl.className = 'ds-tooltip';
        document.body.appendChild(tooltipEl);
      }

      let currentTarget = null;
      let hideTimer = null;
      let showTimer = null;

      document.addEventListener('mouseover', (e) => {
        const target = e.target.closest && e.target.closest('[data-ds-tooltip]');
        if (!target) return;

        // If we are already showing tooltip for this target, don't re-trigger
        if (target === currentTarget) {
          if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
          }
          return;
        }

        if (hideTimer) clearTimeout(hideTimer);
        if (showTimer) clearTimeout(showTimer);

        showTimer = setTimeout(() => {
          currentTarget = target;
          const text = target.getAttribute('data-ds-tooltip');
          const preferredPos = target.getAttribute('data-ds-tooltip-pos') || 'bottom';

          tooltipEl.textContent = text;

          // Measure tooltip
          tooltipEl.style.opacity = '0';
          tooltipEl.style.display = 'block';
          tooltipEl.classList.add('is-visible');
          const tw = tooltipEl.offsetWidth;
          const th = tooltipEl.offsetHeight;
          tooltipEl.classList.remove('is-visible');
          tooltipEl.style.opacity = '';

          const rect = target.getBoundingClientRect();
          let top, left, finalPos = preferredPos;

          if (preferredPos === 'bottom') {
            top = rect.bottom + 8;
            if (top + th > window.innerHeight) {
              top = rect.top - th - 8;
              finalPos = 'top';
            }
          } else {
            top = rect.top - th - 8;
            if (top < 0) {
              top = rect.bottom + 8;
              finalPos = 'bottom';
            }
          }

          left = rect.left + (rect.width / 2) - (tw / 2);

          // horizontal bounds
          if (left < 8) left = 8;
          if (left + tw > window.innerWidth - 8) left = window.innerWidth - tw - 8;

          tooltipEl.style.left = `${left}px`;
          tooltipEl.style.top = `${top}px`;
          tooltipEl.className = `ds-tooltip pos-${finalPos} is-visible`;
          showTimer = null;
        }, 150); // Reduced delay to 150ms for snappier feel
      }, true);

      document.addEventListener('mouseout', (e) => {
        const target = e.target.closest && e.target.closest('[data-ds-tooltip]');
        if (!target) return;

        // If we are moving to a child of the same target, don't hide
        const related = e.relatedTarget;
        if (related && target.contains(related)) return;

        if (showTimer) {
          clearTimeout(showTimer);
          showTimer = null;
        }

        hideTimer = setTimeout(() => {
          tooltipEl.classList.remove('is-visible');
          currentTarget = null;
        }, 100);
      }, true);

      // Hide tooltip on click/tap to avoid overlapping during interactions
      document.addEventListener('click', () => {
        if (showTimer) {
          clearTimeout(showTimer);
          showTimer = null;
        }
        tooltipEl.classList.remove('is-visible');
        currentTarget = null;
      }, true);
    }
  };
})();

// Auto-initialize tooltips
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DesignSystem.initSmartTooltips());
  } else {
    DesignSystem.initSmartTooltips();
  }
}

window.DesignSystem = DesignSystem;

```
</file>

<file path="renderer/js/components/molecules/context-menu.js">
```js
/* global DesignSystem, MenuShield */
/* ══════════════════════════════════════════════════
   ContextMenuComponent.js — Atomic Design (Molecule)
   Dùng để render danh sách items cho MenuShield.
   ══════════════════════════════════════════════════ */

class ContextMenuComponent {
  /**
   * Static helper to open a context menu
   * @param {Object} options
   */
  static open(options) {
    const { event, anchor, items, onClose, className, ...rest } = options;
    
    const component = new ContextMenuComponent(items);
    const content = component.render();

    return MenuShield.open({
      event,
      anchor,
      content,
      onClose,
      className: className || 'ds-context-menu-shield',
      ...rest
    });
  }

  constructor(items = []) {
    this.items = items;
  }

  /**
   * Render items container
   */
  render() {
    const container = DesignSystem.createElement('div', 'ds-context-menu-container');

    this.items.forEach(item => {
      if (item.divider) {
        container.appendChild(DesignSystem.createElement('div', 'ctx-divider'));
        return;
      }

      const itemEl = DesignSystem.createElement('div', 'ctx-item');
      if (item.danger) itemEl.classList.add('danger');
      if (item.active) itemEl.classList.add('active');
      if (item.disabled) itemEl.classList.add('disabled');
      if (item.className) itemEl.classList.add(item.className);

      // Icon
      const iconWrap = DesignSystem.createElement('div', 'ctx-icon');
      iconWrap.innerHTML = DesignSystem.getIcon(item.icon);
      itemEl.appendChild(iconWrap);

      // Label
      itemEl.appendChild(DesignSystem.createElement('span', 'ctx-label', { text: item.label }));

      // Shortcut
      if (item.shortcut) {
        const shortcutWrap = DesignSystem.createElement('span', 'ctx-shortcut');
        const specialKeys = ['Enter', 'Tab', 'Space', 'Shift', 'Alt', 'Ctrl', 'Cmd', 'Delete', 'Backspace'];
        const keys = specialKeys.includes(item.shortcut) ? [item.shortcut] : item.shortcut.split('');
        
        keys.forEach(key => {
          shortcutWrap.appendChild(DesignSystem.createElement('kbd', 'ds-kbd', { text: key }));
        });
        itemEl.appendChild(shortcutWrap);
      }

      // Click Event
      itemEl.onclick = (e) => {
        e.stopPropagation();
        if (item.disabled) return;
        
        MenuShield.close();
        if (item.onClick) item.onClick(e);
      };

      container.appendChild(itemEl);
    });

    return container;
  }
}

// Export for window
window.ContextMenuComponent = ContextMenuComponent;

```
</file>

<file path="renderer/js/components/molecules/menu-shield.js">
```js
/* global DesignSystem */
/**
 * MenuShield Molecule
 * Purpose: A generic glass shell for menus, popovers, and context menus.
 * Handles: Positioning, Blur effect, Close on click-outside/Escape.
 */
const MenuShield = (() => {
  'use strict';

  let _activeInstance = null;

  /**
   * Open a new menu shield
   * @param {Object} options 
   * @param {HTMLElement} options.content - The DOM element to put inside
   * @param {string} options.title - Optional header title
   * @param {MouseEvent} options.event - Event for cursor positioning
   * @param {HTMLElement} options.anchor - Element for anchor positioning
   * @param {string} options.className - Extra class
   * @param {Function} options.onClose - Callback when closed
   */
  function open(options) {
    // 1. Close existing
    close();

    // 2. Create Shield
    const shield = DesignSystem.createElement('div', ['ds-menu-shield', options.className]);

    // 3. Add Header if title exists
    if (options.title) {
      const header = DesignSystem.createElement('div', 'ds-menu-shield-header');
      header.appendChild(DesignSystem.createElement('div', 'ds-menu-shield-title', { text: options.title }));
      shield.appendChild(header);
    }

    // 4. Add Content
    const contentWrapper = DesignSystem.createElement('div', 'ds-menu-shield-content');
    contentWrapper.appendChild(options.content);
    shield.appendChild(contentWrapper);

    document.body.appendChild(shield);

    // 5. Positioning
    requestAnimationFrame(() => {
      _calculatePosition(shield, options);
    });

    // 6. Event Listeners
    const _handleOutsideClick = (e) => {
      // Don't close if clicking inside the shield
      if (shield.contains(e.target)) return;

      // Don't close if clicking on another active modal shield (e.g. Confirm Modal)
      if (e.target.closest('.ds-popover-shield')) return;

      // Don't close if clicking inside the anchor (let the toggle logic handle it)
      if (options.anchor && (options.anchor === e.target || options.anchor.contains(e.target))) {
        return;
      }

      close();
    };

    const _handleEscape = (e) => {
      if (e.key === 'Escape') close();
    };

    // Use a small timeout to avoid immediate closure from the trigger click
    setTimeout(() => {
      window.addEventListener('mousedown', _handleOutsideClick);
      window.addEventListener('keydown', _handleEscape);
    }, 10);

    // 7. Track Instance
    _activeInstance = {
      element: shield,
      close: () => {
        window.removeEventListener('mousedown', _handleOutsideClick);
        window.removeEventListener('keydown', _handleEscape);
        if (shield.parentNode) shield.parentNode.removeChild(shield);
        if (options.onClose) options.onClose();
        _activeInstance = null;
      }
    };

    return _activeInstance;
  }

  function close() {
    if (_activeInstance) {
      _activeInstance.close();
    }
  }

  /**
   * Private: Position calculation logic
   */
  function _calculatePosition(el, options) {
    const { event, anchor, position } = options;
    const rect = el.getBoundingClientRect();

    const style = getComputedStyle(document.documentElement);
    const margin = parseInt(style.getPropertyValue('--ds-space-xs')) || 4;
    const safePadding = parseInt(style.getPropertyValue('--ds-space-md')) || 12;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let x = 0, y = 0;
    let useRight = false;
    let useBottom = false;
    const align = options.align || 'auto';

    if (position) {
      x = position.x;
      y = position.y;
    } else if (anchor) {
      const anchorRect = anchor.getBoundingClientRect();

      // Horizontal Alignment
      if (align === 'right') {
        useRight = true;
        x = screenWidth - anchorRect.right;
      } else if (align === 'left') {
        x = anchorRect.left;
      } else {
        if (anchorRect.left + rect.width > screenWidth - margin) {
          useRight = true;
          x = screenWidth - anchorRect.right;
        } else {
          x = anchorRect.left;
        }
      }

      // Vertical Alignment
      const spaceBelow = screenHeight - anchorRect.bottom;
      if (spaceBelow < rect.height + margin && anchorRect.top > rect.height + margin) {
        useBottom = true;
        y = screenHeight - anchorRect.top + margin;
      } else {
        y = anchorRect.bottom + margin;
      }
    } else if (event) {
      x = event.clientX;
      y = event.clientY;
    }

    // Safety bounds for X
    if (useRight) {
      if (x < safePadding) x = safePadding;
      el.style.right = `${x}px`;
      el.style.left = 'auto';
    } else {
      if (x < safePadding) x = safePadding;
      if (x + rect.width > screenWidth - safePadding) x = screenWidth - rect.width - safePadding;
      el.style.left = `${x}px`;
      el.style.right = 'auto';
    }

    // Safety bounds for Y
    if (useBottom) {
      if (y < safePadding) y = safePadding;
      el.style.bottom = `${y}px`;
      el.style.top = 'auto';
    } else {
      if (y < safePadding) y = safePadding;
      if (y + rect.height > screenHeight - safePadding) y = screenHeight - rect.height - safePadding;
      el.style.top = `${y}px`;
      el.style.bottom = 'auto';
    }
  }

  return {
    open,
    close,
    get active() { return _activeInstance; }
  };
})();

// Export
window.MenuShield = MenuShield;

```
</file>

<file path="renderer/js/components/molecules/project-map.js">
```js
/* global UIUtils, DesignSystem, AppState */
/**
 * ProjectMap Component (Molecule)
 * Purpose: Renders a high-fidelity mini-map preview using the project's official "Mirror Strategy" (SSR).
 * 
 * Logic:
 *  - Uses Server-Side Rendering (/api/render-raw) to ensure 100% fidelity.
 *  - Mirrors the layout 1:1 by matching viewer width and using transform: scale().
 *  - Synchronizes scroll position and viewport highlights with mathematical precision.
 * 
 * @global UIUtils
 */
const ProjectMap = (() => {
  'use strict';

  const SELECTORS = {
    track: '.ds-project-map__track',
    mirror: '.ds-project-map__mirror',
    viewport: '.ds-project-map__viewport',
    overlay: '.ds-project-map__overlay',
    content: '.md-content-inner'
  };

  const CONFIG = {
    updateDebounce: 600,
    baseWidth: 800
  };

  let _mainViewer = null;
  let _scale = 0.15;
  let _zoomFactor = 0.7;
  let _updateTimer = null;
  let _currentContent = '';
  let _lastRequestId = 0;
  let _abortController = null;
  let _resizeObserver = null;

  // ============================================
  // Private Functions
  // ============================================

  /**
   * Fetches rendered HTML from the server for the current content
   */
  async function _fetchRenderedHTML(content, signal) {
    try {
      const res = await fetch('/api/render-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        signal // Attach the abort signal
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.html;
    } catch (err) {
      console.error('ProjectMap Render Error:', err);
      return null;
    }
  }

  function _updateViewportIndicator(mapEl) {
    if (!_mainViewer || !mapEl) return;

    // The scrollable area is now the body, not the root
    const body = mapEl.querySelector('.ds-project-map__body') || mapEl;
    const viewport = mapEl.querySelector(SELECTORS.viewport);
    if (!viewport) return;

    const clientHeight = _mainViewer.clientHeight;
    const scrollTop = _mainViewer.scrollTop;

    const vHeight = clientHeight * _scale;
    const vTop = scrollTop * _scale;

    viewport.style.height = `${vHeight}px`;
    viewport.style.top = `${vTop}px`;

    // Smart Auto-scroll the map panel to keep indicator centered
    // We use the parent's height (TOC body) to determine the actual visible space
    // REQUIRED BY ADR: 20260428-project-map-scroll-stabilization
    const visibleHeight = mapEl.parentElement ? mapEl.parentElement.clientHeight : mapEl.clientHeight;
    const footer = mapEl.querySelector('.ds-project-map__footer');
    const footerHeight = footer ? footer.offsetHeight : 0;
    const scrollAreaHeight = visibleHeight - footerHeight;
    
    // JS HACK: Force the root and scroll body to stay within bounds to enable scrolling
    mapEl.style.height = `${visibleHeight}px`;
    body.style.height = `${scrollAreaHeight}px`;
    body.style.overflowY = 'auto';

    const targetMapScroll = vTop - (scrollAreaHeight / 2) + (vHeight / 2);
    body.scrollTop = targetMapScroll;
  }

  /**
   * Applies current zoom and scale settings to the map DOM elements without a full re-render
   */
  function _applyZoom(mapEl) {
    const mirror = mapEl.querySelector(SELECTORS.mirror);
    const track = mapEl.querySelector(SELECTORS.track);
    const innerEl = mirror?.querySelector(SELECTORS.content);
    
    if (mirror && track && innerEl) {
      const body = mapEl.querySelector('.ds-project-map__body') || mapEl;
      const internalWidth = CONFIG.baseWidth;
      const panelWidth = Math.max(120, body.clientWidth || 280);
      
      const baseScale = Math.max(0.05, (panelWidth - 24) / internalWidth);
      _scale = baseScale * _zoomFactor;
      
      mirror.style.setProperty('--_scale', _scale);
      
      const scrollH = innerEl.scrollHeight;
      
      // Update track and mirror height. 
      // We always set it, even if 0, to ensure it doesn't get stuck at an old height.
      track.style.height = `${scrollH * _scale}px`;
      mirror.style.height = `${scrollH}px`;

      // Update Zoom Percentage Label
      const zoomLabel = mapEl.querySelector('.ds-project-map__zoom-label');
      if (zoomLabel) {
        zoomLabel.textContent = `${Math.round(_zoomFactor * 100)}%`;
      }

      // Disable buttons at limits
      const btnIn = mapEl.querySelector('.ds-project-map__btn-in');
      const btnOut = mapEl.querySelector('.ds-project-map__btn-out');
      if (btnIn) btnIn.disabled = (_zoomFactor >= 1.0);
      if (btnOut) btnOut.disabled = (_zoomFactor <= 0.2);
      
      _updateViewportIndicator(mapEl);
    }
  }

  function _handleInteraction(e, mapEl, isSmooth) {
    if (!_mainViewer) return;
    const rect = mapEl.getBoundingClientRect();
    const mapScroll = mapEl.scrollTop;
    
    // Calculate click Y relative to the start of the content (after padding)
    const paddingTop = parseInt(window.getComputedStyle(mapEl).paddingTop) || 0;
    const clickY = e.clientY - rect.top + mapScroll - paddingTop;
    
    const targetScroll = (clickY / _scale) - (_mainViewer.clientHeight / 2);
    _mainViewer.scrollTo({ top: targetScroll, behavior: isSmooth ? 'smooth' : 'auto' });
  }

  // ============================================
  // Public API
  // ============================================
  return {
    render: function(mount, viewerEl) {
      if (!mount || !viewerEl) return null;
      _mainViewer = viewerEl;

      const root = DesignSystem.createElement('div', 'ds-project-map');
      const body = DesignSystem.createElement('div', 'ds-project-map__body');
      const track = DesignSystem.createElement('div', 'ds-project-map__track');
      const mirror = DesignSystem.createElement('div', 'ds-project-map__mirror');
      const viewport = DesignSystem.createElement('div', 'ds-project-map__viewport');
      const overlay = DesignSystem.createElement('div', 'ds-project-map__overlay');

      track.appendChild(mirror);
      track.appendChild(viewport);
      track.appendChild(overlay);
      body.appendChild(track);
      root.appendChild(body);

      // Zoom Footer Bar
      const footer = DesignSystem.createElement('div', 'ds-project-map__footer');
      
      const btnOut = DesignSystem.createButton({
        leadingIcon: 'minus',
        variant: 'ghost',
        offLabel: true,
        title: 'Zoom Out',
        className: 'ds-project-map__btn-out',
        onClick: (e) => {
          e.stopPropagation();
          _zoomFactor = Math.max(0.2, _zoomFactor - 0.1);
          _applyZoom(root);
        }
      });

      const zoomLabel = DesignSystem.createElement('span', 'ds-project-map__zoom-label', { text: '70%' });
      
      const btnIn = DesignSystem.createButton({
        leadingIcon: 'plus',
        variant: 'ghost',
        offLabel: true,
        title: 'Zoom In',
        className: 'ds-project-map__btn-in',
        disabled: false, // Initial 70%
        onClick: (e) => {
          e.stopPropagation();
          _zoomFactor = Math.min(1.0, _zoomFactor + 0.1);
          _applyZoom(root);
        }
      });
      
      footer.appendChild(btnOut);
      footer.appendChild(zoomLabel);
      footer.appendChild(btnIn);
      root.appendChild(footer);

      mount.appendChild(root);

      // Interaction listeners
      let isDragging = false;
      let hasMoved = false;

      overlay.onmousedown = () => { 
        isDragging = true; 
        hasMoved = false; 
      };

      overlay.addEventListener('mousemove', (e) => { 
        if (isDragging) {
          hasMoved = true;
          _handleInteraction(e, body, false); // Interaction is relative to scroll body
        }
      });

      overlay.onclick = (e) => {
        if (!hasMoved) {
          _handleInteraction(e, body, true);
        }
      };

      window.addEventListener('mouseup', () => { 
        isDragging = false; 
      });

      // Initial load
      this.update(root, viewerEl);

      return root;
    },

    update: function(mapEl, viewerEl) {
      if (!mapEl || !viewerEl) return;
      _mainViewer = viewerEl;

      // Robust content retrieval
      let content = '';
      const viewer = window.MarkdownViewer ? window.MarkdownViewer.getInstance() : null;
      if (viewer && viewer.state) {
        content = viewer.state.content || '';
      }

      // If in edit mode, the latest content is in the textarea
      const textarea = document.getElementById('edit-textarea');
      if (textarea && viewer && viewer.state.mode === 'edit') {
        content = textarea.value;
      }

      if (_updateTimer) clearTimeout(_updateTimer);
      
      // Cancel previous fetch if still running
      if (_abortController) {
        _abortController.abort();
      }
      _abortController = new AbortController();
      const { signal } = _abortController;
      
      const requestId = ++_lastRequestId;
      
      // If content is empty or significantly different, show skeleton immediately
      if (!content || _currentContent === '') {
        const mirror = mapEl.querySelector(SELECTORS.mirror);
        if (mirror) {
          mirror.innerHTML = '';
          mirror.appendChild(UIUtils.renderSkeleton('map'));
        }
      }

      _updateTimer = setTimeout(async () => {
        // Fallback: If content is still empty, fetch it directly inside the async block
        if (!content && window.AppState && AppState.currentFile) {
          try {
            const res = await fetch(`/api/file/raw?path=${encodeURIComponent(AppState.currentFile)}`, { signal });
            if (res.ok) {
              const data = await res.json();
              content = data.content || '';
            }
          } catch (_err) { 
            if (_err.name === 'AbortError') return;
          }
        }

        // Validate again before network call
        if (requestId !== _lastRequestId) return;

        const html = await _fetchRenderedHTML(content, signal);
        
        // Final validation after network call
        if (requestId !== _lastRequestId || html === null) return;

        // Only lock the content state after a successful fetch
        _currentContent = content;

        const mirror = mapEl.querySelector(SELECTORS.mirror);
        const track = mapEl.querySelector(SELECTORS.track);

        if (mirror && track) {
          // Ensure base structure exists
          mirror.innerHTML = `<div class="md-render-body"><div class="md-content-inner">${html || ''}</div></div>`;
          
          // Sync Design Tokens (Zoom, etc.) from AppState/Global Styles
          const zoom = window.AppState?.settings?.textZoom || 100;
          mirror.style.setProperty('--preview-zoom', zoom);

          // Apply initial zoom and measurements through a shared logic
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              _applyZoom(mapEl);
            });
          });

          // Get the inner content element for post-processing
          const innerEl = mirror.querySelector(SELECTORS.content);
          if (innerEl) {
            // 1. Attach ResizeObserver for high-fidelity height sync
            if (_resizeObserver) _resizeObserver.disconnect();
            
            if (window.ResizeObserver) {
              _resizeObserver = new ResizeObserver(() => {
                requestAnimationFrame(() => _applyZoom(mapEl));
              });
              _resizeObserver.observe(innerEl);
            }

            // ── 4. Post-process (Delayed to ensure mirror is in DOM) ──
            requestAnimationFrame(() => {
              if (innerEl.isConnected) {
                if (html && window.processMermaid) window.processMermaid(innerEl);
                if (html && window.CodeBlockModule) window.CodeBlockModule.process(innerEl);
              }
            });
            
            // 3. Initial layout pass
            requestAnimationFrame(() => _applyZoom(mapEl));
          }
        }
      }, CONFIG.updateDebounce);
    },

    syncScroll: function(mapEl) {
      if (!mapEl) return;
      requestAnimationFrame(() => _updateViewportIndicator(mapEl));
    },

    destroy: function() {
      if (_updateTimer) clearTimeout(_updateTimer);
      if (_abortController) _abortController.abort();
      if (_resizeObserver) _resizeObserver.disconnect();
      _currentContent = '';
    },

    reset: function(mapEl) {
      if (_updateTimer) clearTimeout(_updateTimer);
      if (_resizeObserver) {
        _resizeObserver.disconnect();
        _resizeObserver = null;
      }
      if (_abortController) {
        _abortController.abort();
        _abortController = null;
      }
      _lastRequestId++; // Invalidate any pending timeouts
      _currentContent = '';
      if (!mapEl) return;
      const mirror = mapEl.querySelector(SELECTORS.mirror);
      const track = mapEl.querySelector(SELECTORS.track);
      if (mirror) {
        mirror.innerHTML = '';
        mirror.appendChild(UIUtils.renderSkeleton('map'));
        mirror.style.height = 'auto';
      }
      if (track) {
        track.style.height = '100%';
      }
    }
  };
})();

window.ProjectMap = ProjectMap;

```
</file>

<file path="renderer/js/components/molecules/scroll-container.js">
```js
/**
 * ScrollContainer Molecule
 * Purpose: Provides a standard scrollable container with mask-fading and an automatic safe zone.
 * Dependencies: DesignSystem
 */
const ScrollContainer = (() => {
  'use strict';

  /**
   * Create a scrollable container
   * @param {HTMLElement} contentEl - The content to be scrolled
   * @param {Object} options - Configuration options
   * @param {string} options.id - Optional ID for the container
   * @param {string} options.className - Optional additional class
   * @param {number} options.safeHeight - Custom safe zone height (px)
   * @param {boolean} options.enableFade - Enable/disable mask fade (default: true)
   * @param {boolean} options.enableSafeZone - Enable/disable safe zone spacer (default: true)
   */
  function create(contentEl, options = {}) {
    const { id, className, safeHeight, enableFade = true, _enableSafeZone = true } = options;

    // 1. Create Main Container
    const container = document.createElement('div');
    container.className = `ds-scroll-container ${className || ''}`.trim();
    if (id) container.id = id;

    // 2. Create Content Wrapper (to ensure children are handled correctly)
    const wrapper = document.createElement('div');
    wrapper.className = 'ds-scroll-content';
    wrapper.appendChild(contentEl);
    container.appendChild(wrapper);

    // 3. Create Safe Zone (Always create, but visibility controlled by CSS)
    const safeZone = document.createElement('div');
    safeZone.className = 'ds-scroll-safe-zone';
    if (safeHeight) {
      safeZone.style.setProperty('--ds-scroll-safe-height', `${safeHeight}px`);
    }
    container.appendChild(safeZone);

    // 4. Handle Mask Fade Logic
    if (enableFade) {
      _initFadeLogic(container);
    }

    // 5. Automatic Scrollable Detection (Dynamic Safe Zone)
    _initScrollableDetection(container);

    return container;
  }

  /**
   * Private: Initialize ResizeObserver to detect if container is scrollable
   */
  function _initScrollableDetection(container) {
    const checkScrollable = () => {
      const isScrollable = container.scrollHeight > container.clientHeight + 2; // +2 for buffer
      container.classList.toggle('is-scrollable', isScrollable);
    };

    if (window.ResizeObserver) {
      const observer = new ResizeObserver(() => {
        requestAnimationFrame(checkScrollable);
      });
      observer.observe(container);
      // Also observe the content wrapper for better accuracy
      const wrapper = container.querySelector('.ds-scroll-content');
      if (wrapper) observer.observe(wrapper);
    } else {
      // Fallback
      window.addEventListener('resize', checkScrollable);
      setTimeout(checkScrollable, 100);
    }
  }

  /**
   * Private: Initialize scroll listener to update mask fade
   */
  function _initFadeLogic(container) {
    const updateFade = () => {
      const scrollTop = container.scrollTop;
      const topFade = Math.min(scrollTop, 16);
      container.style.setProperty('--_fade-top', `${topFade}px`);
    };

    container.addEventListener('scroll', updateFade, { passive: true });
    requestAnimationFrame(updateFade);
  }

  return {
    create
  };
})();

// Explicit export to global scope
window.ScrollContainer = ScrollContainer;

```
</file>

<file path="renderer/js/components/molecules/search-component.js">
```js
/* ============================================================
   search-component.js — Reusable Search Bar Component
   ============================================================ */

const SearchComponent = (() => {
  /**
   * Creates a new search bar instance
   * @param {Object} options 
   * @param {string} options.placeholder
   * @param {Function} options.onInput - Called on value change
   * @param {Function} options.onExit - Called on 'X' button click
   * @returns {HTMLElement} The root element of the component
   */
  function create({ placeholder = 'Search...', onInput, onExit }) {
    const group = document.createElement('div');
    group.className = 'sidebar-search-input-group';
    
    group.innerHTML = `
      <div class="sidebar-search-inner">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="${placeholder}" autocomplete="off">
      </div>
      <button class="exit-search-btn" title="Exit search">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    const input = group.querySelector('input');
    const exitBtn = group.querySelector('.exit-search-btn');

    // Prevent input from causing parent overflow
    input.style.minWidth = '0';

    if (onInput) {
      input.addEventListener('input', (e) => onInput(e.target.value));
    }

    if (onExit) {
      exitBtn.addEventListener('click', () => {
        input.value = '';
        onExit();
      });
    }

    // Expose methods via the element
    group.focus = () => {
      if (input) input.focus();
    };
    group.clear = () => {
      if (input) input.value = '';
    };
    group.getValue = () => input ? input.value : '';

    return group;
  }

  return { create };
})();
window.SearchComponent = SearchComponent;

```
</file>

<file path="renderer/js/components/molecules/setting-row.js">
```js
/* global DesignSystem */
/**
 * SettingRow Molecule
 * Purpose: A standard row for the settings panel with a label and a control element.
 */
const SettingRow = (() => {
  'use strict';

  /**
   * Create a new SettingRow element
   * @param {Object} options 
   * @param {string} options.label - The label text
   * @param {HTMLElement} options.control - The control element (slider, select, etc.)
   * @returns {HTMLElement}
   */
  function create(options) {
    const { label, control } = options;

    const row = DesignSystem.createElement('div', 'ds-setting-row');
    
    const labelCol = DesignSystem.createElement('div', 'ds-setting-row-label-col');
    labelCol.appendChild(DesignSystem.createElement('span', 'ds-setting-row-label', { text: label }));
    
    const controlCol = DesignSystem.createElement('div', 'ds-setting-row-control-col');
    if (control) {
      controlCol.appendChild(control);
    }

    row.appendChild(labelCol);
    row.appendChild(controlCol);

    return row;
  }

  return {
    create: create
  };
})();

window.SettingRow = SettingRow;

```
</file>

<file path="renderer/js/components/molecules/setting-toggle-item.js">
```js
/* global DesignSystem, SwitchToggleModule */
/**
 * SettingToggleItem Molecule
 * Purpose: A reusable row containing a label and a toggle switch
 * Dependencies: SwitchToggleModule (Atom)
 */
const SettingToggleItem = (() => {
  'use strict';

  /**
   * Create a new SettingToggleItem element
   * @param {Object} options 
   * @param {string} options.label - The label text
   * @param {boolean} options.isOn - Initial state
   * @param {Function} options.onChange - Callback(isOn)
   * @param {string} options.variant - 'menu' or 'panel' (default: 'panel')
   * @returns {HTMLElement}
   */
  function create(options) {
    const { label, isOn, onChange, variant = 'panel' } = options;

    // 1. Create Container
    const container = DesignSystem.createElement('div', [
      'ds-setting-toggle-item',
      `ds-setting-toggle-item--${variant}`
    ]);

    // 2. Create Label
    const labelEl = DesignSystem.createElement('span', 'ds-setting-toggle-label', { text: label });

    // 3. Create Toggle Wrapper
    const toggleWrapper = DesignSystem.createElement('div', 'ds-setting-toggle-control');

    container.appendChild(labelEl);
    container.appendChild(toggleWrapper);

    // 4. Initialize Toggle Logic
    const toggleApi = SwitchToggleModule.init({
      element: toggleWrapper, // Note: SwitchToggleModule update required to support 'element'
      isOn: isOn,
      onChange: onChange
    });

    // 5. Allow clicking the whole row to toggle
    container.addEventListener('click', (e) => {
      // Avoid double toggle if clicking the switch directly 
      // (though switch is pointer-events: none in CSS)
      if (e.target === toggleWrapper || toggleWrapper.contains(e.target)) return;
      
      if (toggleApi && toggleApi.toggle) {
        toggleApi.toggle();
      }
    });

    return container;
  }

  return {
    create: create
  };
})();

// Export to global scope
window.SettingToggleItem = SettingToggleItem;

```
</file>

<file path="renderer/js/components/molecules/sidebar-section-header.js">
```js
/**
 * SidebarSectionHeader.js — Atomic Design (Molecule)
 * Unified header for sidebar sections (Recently Viewed, All Files, etc.)
 */

class SidebarSectionHeader {
    constructor(options = {}) {
        this.title = options.title || '';
        this.actions = options.actions || []; // Array or nested array of IconActionButton
        this.className = options.className || '';
        this.collapsible = options.collapsible || null; // { sectionId, storageKey, appStateKey }
        this.defaultCollapsed = options.defaultCollapsed || false;
    }

    render() {
        const header = document.createElement('div');
        header.className = `sidebar-section-header ${this.className}`.trim();

        // ── Handle Collapsible logic ──
        if (this.collapsible) {
            const { sectionId, storageKey, appStateKey } = this.collapsible;
            
            // Determine initial state
            const isCollapsed = (appStateKey && AppState.settings && AppState.settings[appStateKey]) || 
                                (storageKey && localStorage.getItem(storageKey) === 'true') ||
                                (this.defaultCollapsed && (!storageKey || localStorage.getItem(storageKey) === null));
            
            const toggleBtn = new IconActionButton({
                className: 'section-toggle-btn',
                iconName: 'chevron-down',
                onClick: null // We'll handle it on the header level
            });
            header.appendChild(toggleBtn.render());

            // Make entire header clickable
            header.style.cursor = 'pointer';
            header.onclick = (e) => {
                // BUG FIX: Bỏ qua nếu người dùng click vào các nút Action hoặc bên trong Action
                if (e.target.closest('.header-actions-group') || e.target.closest('.ds-btn')) {
                    return;
                }

                const section = document.getElementById(sectionId);
                if (!section) return;

                // BLOCK: If user is currently renaming a file, don't allow toggling layout
                if (window.TreeModule && window.TreeModule.getState) {
                    const treeState = window.TreeModule.getState();
                    if (treeState.renamingPath) {
                        console.warn('SidebarSectionHeader: Toggle blocked while renaming.');
                        return;
                    }
                }

                // Enable transitions only on user interaction
                section.classList.add('allow-transition');

                const collapsed = section.classList.toggle('collapsed');
                localStorage.setItem(storageKey, collapsed);
                if (appStateKey && typeof AppState !== 'undefined') {
                    AppState.settings[appStateKey] = collapsed;
                    if (AppState.savePersistentState) AppState.savePersistentState();
                }
            };

            // Set initial class on mount (using a small timeout to ensure DOM presence)
            setTimeout(() => {
                const section = document.getElementById(sectionId);
                if (section && isCollapsed) section.classList.add('collapsed');
            }, 0);
        }

        // Title/Label
        const label = document.createElement('div');
        label.className = 'section-label';
        label.textContent = this.title;
        header.appendChild(label);

        // Actions Group
        if (this.actions.length > 0) {
            const actionsGroup = document.createElement('div');
            actionsGroup.className = 'header-actions-group';
            
            // Normalize to grouped structure: [[a, b], [c]]
            const groups = Array.isArray(this.actions[0]) ? this.actions : [this.actions];

            groups.forEach((group, groupIdx) => {
                // Add divider between groups
                if (groupIdx > 0) {
                    const divider = document.createElement('div');
                    divider.className = 'header-action-divider';
                    actionsGroup.appendChild(divider);
                }

                group.forEach(action => {
                    if (action instanceof IconActionButton) {
                        actionsGroup.appendChild(action.render());
                    }
                });
            });
            
            header.appendChild(actionsGroup);
        }

        return header;
    }
}

window.SidebarSectionHeader = SidebarSectionHeader;

```
</file>

<file path="renderer/js/components/molecules/tab-preview.js">
```js
/**
 * TabPreview Component (Molecules)
 * Purpose: Provides a debounced hover preview of tab content with scroll awareness.
 * Dependencies: DesignSystem, ScrollModule, TabsModule, DraftModule
 */
const TabPreview = (() => {
  'use strict';

  const SELECTORS = {
    tab: '.tab-item',
    preview: '.ds-tab-preview'
  };

  const CONFIG = {
    debounceTime: 300,
    width: 352,
    height: 272,
    scale: 0.38, // Matched to user's manual CSS update (304/800)
    windowSize: 2000, // Optimized window for performance vs layout accuracy
    cacheTTL: 60000 // 1 minute
  };

  let _previewEl = null;
  let _hoverTimer = null;
  let _activePath = null;
  const _renderCache = new Map(); // path -> { html, timestamp, scrollTop }

  // ============================================
  // Private Functions
  // ============================================

  function _createPreviewElement() {
    if (_previewEl) return _previewEl;

    _previewEl = DesignSystem.createElement('div', 'ds-tab-preview');
    _previewEl.innerHTML = `
      <div class="ds-tab-preview__content-wrapper">
        <div class="ds-tab-preview__mirror">
          <div class="ds-tab-preview__content md-render-body">
            <div class="md-content-inner"></div>
          </div>
        </div>
        <div class="ds-tab-preview__mask"></div>
      </div>
      <div class="ds-tab-preview__footer">
        <div class="ds-tab-preview__filename"></div>
        <div class="ds-tab-preview__stats"></div>
      </div>
    `;

    document.body.appendChild(_previewEl);
    return _previewEl;
  }

  async function _showPreview(path, targetRect) {
    _activePath = path;
    const preview = _createPreviewElement();

    // 1. Position it below the tab
    const x = Math.max(10, Math.min(window.innerWidth - CONFIG.width - 10, targetRect.left + (targetRect.width / 2) - (CONFIG.width / 2)));
    const y = targetRect.bottom + 8;

    preview.style.left = `${x}px`;
    preview.style.top = `${y}px`;

    // 3. Show loading state
    const mirror = preview.querySelector('.ds-tab-preview__mirror');
    const contentEl = preview.querySelector('.md-content-inner');
    const filenameEl = preview.querySelector('.ds-tab-preview__filename');
    const statsEl = preview.querySelector('.ds-tab-preview__stats');
    
    contentEl.innerHTML = '<div class="skeleton-text" style="height: 100px; opacity: 0.5;"></div>';
    filenameEl.textContent = path.split('/').pop();
    statsEl.textContent = 'Loading stats...';
    
    if (mirror) mirror.scrollTop = 0;
    preview.classList.add('ds-tab-preview--visible');

    // Fetch Metadata in parallel
    _fetchMetadata(path).then(meta => {
      if (_activePath !== path) return;
      if (meta) {
        filenameEl.textContent = meta.name;
        statsEl.textContent = `Last edited: ${meta.relativeTime}`;
      } else {
        statsEl.textContent = '';
      }
    });

    try {
      // 4. Get content slice and scroll info
      const rawData = await _getContentSlice(path);
      if (_activePath !== path) return;

      // 5. Check Cache first
      const cached = _renderCache.get(path);
      const isCacheValid = cached && (Date.now() - cached.timestamp < CONFIG.cacheTTL) && (cached.scrollTop === rawData.scrollTop);
      
      let html = '';
      if (isCacheValid) {
        html = cached.html;
      } else {
        html = await _renderSlice(rawData.content);
        if (_activePath !== path) return;
        
        // Update cache
        _renderCache.set(path, {
          html,
          timestamp: Date.now(),
          scrollTop: rawData.scrollTop
        });
      }

      contentEl.innerHTML = html;
      
      // 6. Perfect Scroll Sync via Mirror Viewport
      const viewer = document.getElementById('md-viewer-mount');
      const viewerHeight = viewer ? viewer.clientHeight : 600;
      
      const mirror = preview.querySelector('.ds-tab-preview__mirror');
      if (mirror) {
        // MATCH HEIGHT to ensure identical scroll range
        mirror.style.height = `${viewerHeight}px`;

        // Calculate the actual offset if we are using a slice
        const zoom = window.AppState?.settings?.textZoom || 100;
        const lineHeight = 27 * (zoom / 100);
        const scrollOffset = rawData.scrollTop - (rawData.startLine * lineHeight);
        
        // Use requestAnimationFrame to ensure DOM layout is updated before scrolling
        requestAnimationFrame(() => {
          mirror.scrollTop = scrollOffset;
        });
      }

      // 7. Mermaid/CodeBlock processing if needed
      if (window.processMermaid) window.processMermaid(contentEl);
      if (window.CodeBlockModule) window.CodeBlockModule.process(contentEl);

    } catch (err) {
      console.error('TabPreview error:', err);
      contentEl.innerHTML = '<div style="padding: 20px; font-size: 11px; opacity: 0.5;">Preview unavailable</div>';
    }
  }

  async function _getContentSlice(path) {
    let fullContent = '';
    
    // Check DraftModule first
    if (path.startsWith('__DRAFT_') && window.DraftModule) {
      fullContent = window.DraftModule.getDraftContent(path);
    } else {
      // Fetch from API
      try {
        const res = await fetch(`/api/file/raw?path=${encodeURIComponent(path)}`);
        if (res.ok) {
          fullContent = await res.text();
        }
      } catch (_e) { /* fallback to empty */ }
    }

    if (!fullContent) return { content: '', startLine: 0, scrollTop: 0 };

    // Get scroll position
    const positions = JSON.parse(localStorage.getItem('md-scroll-positions') || '{}');
    const wsId = window.AppState?.currentWorkspace?.id;
    const scrollKey = wsId ? `${wsId}:${path}` : path;
    const scrollTop = positions[scrollKey] || 0;

    // For absolute accuracy, we render the full content for most files.
    // Slicing is only a fallback for extremely large files (> 10000 lines).
    const lines = fullContent.split('\n');
    const isHuge = lines.length > CONFIG.windowSize;
    
    let content = fullContent;
    let startLine = 0;

    if (isHuge) {
      const zoom = window.AppState?.settings?.textZoom || 100;
      const lineHeight = 27 * (zoom / 100);
      const approxLineIndex = Math.max(0, Math.floor((scrollTop - 160) / lineHeight));
      // Buffer of 1000 lines before/after for layout stability
      startLine = Math.max(0, approxLineIndex - 1000);
      content = lines.slice(startLine, startLine + CONFIG.windowSize).join('\n');
    }
    
    return {
      content,
      startLine,
      scrollTop
    };
  }

  async function _renderSlice(content) {
    const res = await fetch('/api/render-raw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (!res.ok) throw new Error('Render failed');
    const data = await res.json();
    return data.html;
  }

  async function _fetchMetadata(path) {
    if (path.startsWith('__DRAFT_')) return null;
    try {
      const res = await fetch(`/api/file/meta?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const meta = await res.json();
        return {
          ...meta,
          relativeTime: _getRelativeTime(meta.mtime)
        };
      }
    } catch (_e) { }
    return null;
  }

  function _getRelativeTime(mtime) {
    const now = Date.now();
    const diff = now - mtime;
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const days = Math.floor(hr / 24);

    if (sec < 60) return 'Just now';
    if (min < 60) return `${min}m ago`;
    if (hr < 24) return `${hr}h ago`;
    return `${days}d ago`;
  }

  function _hidePreview() {
    _activePath = null;
    if (_previewEl) {
      _previewEl.classList.remove('ds-tab-preview--visible');
    }
  }

  // ============================================
  // Public API
  // ============================================
  return {
    init: function() {
      // Listen for tab hover events (delegated)
      document.addEventListener('mouseover', (e) => {
        const tabItem = e.target.closest(SELECTORS.tab);
        const inPreview = e.target.closest(SELECTORS.preview);

        if (tabItem) {
          // Do not show preview for the active tab (already visible)
          if (tabItem.classList.contains('active')) {
            _hidePreview();
            if (_hoverTimer) clearTimeout(_hoverTimer);
            return;
          }

          const path = tabItem.getAttribute('data-path');
          if (!path) return;

          if (path === _activePath) {
            clearTimeout(_hoverTimer); // Stay open
            return;
          }

          clearTimeout(_hoverTimer);
          _hoverTimer = setTimeout(() => {
            _showPreview(path, tabItem.getBoundingClientRect());
          }, CONFIG.debounceTime);
        } else if (inPreview) {
          clearTimeout(_hoverTimer); // Stay open if mouse moves into the preview box
        } else {
          // Leaving tab area
          if (_hoverTimer) clearTimeout(_hoverTimer);
          _hoverTimer = setTimeout(() => {
            _hidePreview();
          }, 150);
        }
      });
    },

    hide: function() {
      _hidePreview();
    }
  };
})();

// Explicit export to global scope
window.TabPreview = TabPreview;

```
</file>

<file path="renderer/js/components/molecules/tree-item.js">
```js
/* ══════════════════════════════════════════════════
   TreeItemComponent.js — Atomic Design (Molecule)
   Dùng để render một node (file/folder) trong Tree View.
   ══════════════════════════════════════════════════ */

class TreeItemComponent {
    /**
     * @param {Object} node - Dữ liệu node từ server
     * @param {Object} options - Các callback (onSelect, onOpen, onDelete, onRename, onContextMenu)
     * @param {Object} state - Trạng thái từ TreeModule (selectedPaths, currentFile)
     */
    constructor(node, options = {}, state = {}) {
        this.node = node;
        this.options = options;
        this.state = state;

        // Các SVG icons được lấy từ Design System
        this.svgs = {
            chevron: DesignSystem.getIcon('chevron-down').replace('<svg', '<svg class="item-chevron"'),
            folder: DesignSystem.getIcon('folder'),
            file: DesignSystem.getIcon('file')
        };
    }

    /**
     * Render item và trả về DOM element
     */
    render(idx) {
        const node = this.node;
        const wrapper = document.createElement('div');
        wrapper.dataset.nodeId = Math.random().toString(36).substring(2, 9);
        wrapper.className = 'tree-node-wrapper';

        const isActive = node.path === this.state.currentFile;
        const isSelected = this.state.selectedPaths.includes(node.path) && !isActive;
        const isRenaming = node.path === this.state.renamingPath;

        const itemEl = document.createElement('div');
        itemEl.className = `tree-item ${node.type === 'directory' ? 'tree-item-directory' : ''} ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${isRenaming ? 'renaming' : ''} ${node.isHidden ? 'is-hidden' : ''}`.trim();
        itemEl.style.setProperty('--stagger', idx);
        itemEl.dataset.path = node.path;

        const icon = node.type === 'directory' ? this.svgs.folder : this.svgs.file;
        const chevron = node.type === 'directory' ? this.svgs.chevron : '<div class="tree-item-spacer"></div>';

        if (isRenaming) {
            const displayValue = this._formatName(node.name, node.type);
            itemEl.innerHTML = `
                <div class="item-chevron-wrap">${chevron}</div>
                <div class="item-icon-wrap">${icon}</div>
                <input type="text" class="inline-rename-input" value="${this._esc(displayValue)}" />
            `;

            const input = itemEl.querySelector('.inline-rename-input');

            setTimeout(() => {
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 50);

            const finish = (save) => {
                if (input._done) return;
                input._done = true;
                let newName = input.value.trim();

                // Automatically append .md for files if missing
                if (save && node.type === 'file' && newName && !newName.toLowerCase().endsWith('.md')) {
                    newName += '.md';
                }

                this.options.onFinishRename(node, newName, save);
            };

            input.onblur = () => {
                if (document.contains(input)) {
                    finish(true);
                }
            };
            input.onkeydown = (e) => {
                if (e.key === 'Enter') finish(true);
                if (e.key === 'Escape') finish(false);
                e.stopPropagation();
            };

            // Prevent other clicks while renaming
            itemEl.onclick = (e) => e.stopPropagation();
        } else {
            // Render static item
            const chevronEl = document.createElement('div');
            chevronEl.className = 'item-chevron-wrap';
            chevronEl.innerHTML = chevron;

            const iconWrap = document.createElement('div');
            iconWrap.className = 'item-icon-wrap';
            iconWrap.innerHTML = icon;

            const label = document.createElement('span');
            label.className = 'item-label';
            label.textContent = this._formatName(node.name, node.type);

            itemEl.appendChild(chevronEl);
            itemEl.appendChild(iconWrap);
            itemEl.appendChild(label);

            if (this.options.onDelete) {
                const deleteBtn = new IconActionButton({
                    iconName: this.options.deleteIcon || 'trash',
                    title: this.options.deleteTitle || `Delete ${node.type}`,
                    isDanger: true,
                    className: 'item-delete-btn',
                    onClick: (e) => this.options.onDelete(e, node)
                });
                itemEl.appendChild(deleteBtn.render());
            }

            // ── Event Listeners (Restored) ──
            if (this.options.onClick) itemEl.onclick = (e) => this.options.onClick(e, node, itemEl);
            if (this.options.onMouseDown) itemEl.onmousedown = (e) => this.options.onMouseDown(e, node, itemEl);
            itemEl.onmouseleave = (e) => {
                if (this.options.onMouseLeave) this.options.onMouseLeave(e, node, itemEl);
            };
            itemEl.oncontextmenu = (e) => {
                if (this.options.onContextMenu) this.options.onContextMenu(e, node, itemEl);
            };
        }

        // Render Children nếu là directory và đang expanded
        if (node.type === 'directory') {
            const childrenCont = document.createElement('div');
            childrenCont.className = 'folder-children' + (node.expanded ? '' : ' hidden');

            if (node.expanded && node.children) {
                node.children.forEach((child, childIdx) => {
                    const childComp = new TreeItemComponent(child, this.options, this.state);
                    childrenCont.appendChild(childComp.render(idx + childIdx + 1));
                });
            }

            // Sync chevron rotation
            const c = itemEl.querySelector('.item-chevron');
            if (c) c.style.transform = node.expanded ? 'rotate(0)' : 'rotate(-90deg)';

            wrapper.appendChild(itemEl);
            wrapper.appendChild(childrenCont);
        } else {
            wrapper.appendChild(itemEl);
        }

        return wrapper;
    }

    _formatName(name, type) {
        if (!name) return '';
        if (type === 'file' && name.toLowerCase().endsWith('.md')) {
            return name.substring(0, name.length - 3);
        }
        return name;
    }

    _esc(t) {
        const div = document.createElement('div');
        div.textContent = t;
        return div.innerHTML;
    }
}

// Export cho window
window.TreeItemComponent = TreeItemComponent;

```
</file>

<file path="renderer/js/components/molecules/workspace-switcher.js">
```js
/* ══════════════════════════════════════════════════
   WorkspaceSwitcherComponent.js — Workspace Switcher Molecule
   Atomic Design System (Molecule)
   ════════════════════════════════════════════════════ */

const WorkspaceSwitcherComponent = (() => {
  'use strict';

  class WorkspaceSwitcher {
    /**
     * @param {Object} options
     * @param {Function} options.onClick - Callback when switcher is clicked
     */
    constructor(options = {}) {
      this.onClick = options.onClick || (() => {});
      this.element = null;
      this.nameLabel = null;
    }

    /**
     * Render the component
     * @returns {HTMLElement}
     */
    render() {
      // 1. Create Container
      const container = DesignSystem.createElement('div', 'ds-workspace-switcher-outer');
      
      // 2. Create Button
      const button = DesignSystem.createElement('button', 'ds-workspace-switcher');
      button.id = 'workspace-switcher'; // Keep ID for legacy logic if needed, but we prefer instance
      
      const info = DesignSystem.createElement('div', 'ws-info');
      const label = DesignSystem.createElement('span', 'ws-label', { text: 'WORKSPACE' });
      
      this.nameLabel = DesignSystem.createElement('div', ['ds-workspace-name', 'skeleton', 'skeleton-text'], {
        id: 'workspace-name' // Keep ID for legacy logic
      });
      
      info.appendChild(label);
      info.appendChild(this.nameLabel);
      
      const chevron = DesignSystem.createElement('div', 'ws-chevron', {
        html: DesignSystem.getIcon('chevron-right')
      });
      
      button.appendChild(info);
      button.appendChild(chevron);
      
      button.addEventListener('click', (e) => {
        this.onClick(e);
      });
      
      container.appendChild(button);
      this.element = container;
      return container;
    }

    /**
     * Update the workspace name
     * @param {string} name 
     */
    update(name) {
      if (!this.nameLabel) return;
      this.nameLabel.textContent = name || 'Add Workspace';
      this.nameLabel.classList.remove('skeleton', 'skeleton-text');
    }

    /**
     * Show loading state
     */
    setLoading() {
      if (!this.nameLabel) return;
      this.nameLabel.textContent = '';
      this.nameLabel.classList.add('skeleton', 'skeleton-text');
    }
  }

  return WorkspaceSwitcher;
})();

window.WorkspaceSwitcherComponent = WorkspaceSwitcherComponent;

```
</file>

<file path="renderer/js/components/organisms/base-form-modal.js">
```js
/**
 * BaseFormModal Component (Organism)
 * Purpose: Standard template for all form modals (Workspace, API Config, etc.)
 * Dependencies: DesignSystem
 */
const BaseFormModal = (() => {
  'use strict';

  /**
   * Creates the form container with standard layout
   */
  function create(options = {}) {
    const {
      iconHtml = '',
      title = '',
      subtitle = '',
      bodyContent = null,
      actions = [] // Array of buttons
    } = options;

    const container = DesignSystem.createElement('div', 'ds-form-modal');

    // 1. Header Group
    const header = DesignSystem.createElement('div', 'ds-form-header');
    if (iconHtml) {
      const iconWrapper = DesignSystem.createElement('div', 'ds-form-icon-wrapper', {
        html: iconHtml
      });
      header.appendChild(iconWrapper);
    }
    if (title) {
      header.appendChild(DesignSystem.createElement('h3', 'ds-form-title', { text: title }));
    }
    if (subtitle) {
      header.appendChild(DesignSystem.createElement('p', 'ds-form-subtitle', { text: subtitle }));
    }
    container.appendChild(header);

    // Divider Top
    container.appendChild(DesignSystem.createElement('div', 'ds-form-divider'));

    // 2. Body Group
    const body = DesignSystem.createElement('div', 'ds-form-body');
    const fieldsContainer = DesignSystem.createElement('div', 'ds-form-fields');
    if (bodyContent instanceof HTMLElement) {
      fieldsContainer.appendChild(bodyContent);
    } else if (typeof bodyContent === 'string') {
      fieldsContainer.innerHTML = bodyContent;
    }
    body.appendChild(fieldsContainer);
    container.appendChild(body);

    // Divider Bottom
    container.appendChild(DesignSystem.createElement('div', 'ds-form-divider'));

    // 3. Footer Group (Actions)
    if (actions && actions.length > 0) {
      const footer = DesignSystem.createElement('div', 'ds-form-footer');
      const actionsContainer = DesignSystem.createElement('div', 'ds-form-actions');
      actions.forEach(btn => {
        if (btn instanceof HTMLElement) {
          actionsContainer.appendChild(btn);
        }
      });
      footer.appendChild(actionsContainer);
      container.appendChild(footer);
    }

    return container;
  }

  /**
   * Static helper to open the modal
   */
  function open(options = {}) {
    const { width = '480px', ...formOptions } = options;
    const content = create(formOptions);

    const popover = DesignSystem.createPopoverShield({
      content: content,
      width: width,
      showHeader: false,
      className: 'ds-base-form-popover'
    });

    return popover;
  }

  return {
    create,
    open
  };
})();

// Explicit export
window.BaseFormModal = BaseFormModal;

```
</file>

<file path="renderer/js/components/organisms/change-action-view-bar.js">
```js
/* global AppState, DesignSystem, MarkdownViewer, CommentsModule, CollectModule, EditorModule, TabsModule, loadFile, SyncService */
/* ============================================================
   organisms/change-action-view-bar.js — Design System Component
   ============================================================ */

class ChangeActionViewBarComponent {
  constructor(options = {}) {
    this.targetContainer = options.targetContainer || document.querySelector('.glass-main') || document.body;
    this.isStandalone = !!options.isStandalone; // If true, doesn't hook into global AppState
    
    this.container = null;
    this.toolbarEl = null;
    this.segmentedControl = null;
    this.draftActions = null;
    this.indicator = null;

    this.modes = [
      { id: 'read', icon: 'book-open', title: 'Read Mode' },
      { id: 'edit', icon: 'pen-line', title: 'Edit Mode' },
      { id: 'comment', icon: 'message-circle', title: 'Comment Mode' },
      { id: 'collect', icon: 'bookmark', title: 'Collect Mode' }
    ];

    this.init();
  }

  init() {
    // 1. Create Main Container
    const className = ['ds-change-action-view-bar-container', this.isStandalone ? 'preview-mode' : ''].join(' ');
    this.container = DesignSystem.createElement('div', className);

    this.toolbarEl = DesignSystem.createElement('div', 'ds-change-action-view-bar');
    
    // 2. Segmented Control Group (Adaptive & Concentric)
    const leftSection = DesignSystem.createElement('div', 'ds-toolbar-section-left');
    
    this.segmentedControlComponent = DesignSystem.createSegmentedControl({
      items: this.modes,
      activeId: AppState.currentMode || 'read',
      onChange: (modeId) => this.handleModeClick(modeId),
      // Use inherited variable from CSS
      radius: 'var(--_section-radius)',
      tooltipPos: 'top'
    });

    this.segmentedControl = this.segmentedControlComponent.el;
    this.indicator = this.segmentedControlComponent.indicator;

    leftSection.appendChild(this.segmentedControl);

    // 3. Divider
    this.divider = DesignSystem.createElement('div', 'ds-toolbar-divider');

    // 4. Draft Actions (Button Group)
    this.draftActions = DesignSystem.createElement('div', 'ds-toolbar-buttons');
    
    const discardBtn = DesignSystem.createButton({
      label: 'Discard Draft',
      variant: 'ghost',
      radius: 'var(--_btn-radius)',
      onClick: () => this.handleDiscard(),
      tooltipPos: 'top'
    });
    
    const saveBtn = DesignSystem.createButton({
      label: 'Save to Workspace',
      variant: 'primary',
      radius: 'var(--_btn-radius)',
      onClick: () => this.handleSave(),
      tooltipPos: 'top'
    });

    this.draftActions.appendChild(discardBtn);
    this.draftActions.appendChild(saveBtn);

    // Assemble
    this.toolbarEl.appendChild(leftSection);
    this.toolbarEl.appendChild(this.divider);
    this.toolbarEl.appendChild(this.draftActions);
    this.container.appendChild(this.toolbarEl);

    this.targetContainer.appendChild(this.container);

    // Hook into AppState if not standalone
    if (!this.isStandalone && window.AppState) {
        AppState.updateToolbarUI = async (mode) => {
            await this.updateUI(mode);
        };

        // Trigger initial state
        this.updateUI(AppState.currentMode || 'read');
    }
  }

  handleModeClick(modeId) {
    if (this.isStandalone) {
        this.updateUI(modeId);
        return;
    }
    
    // Trigger global update (which hits our updateUI)
    if (window.AppState && AppState.updateToolbarUI) {
      AppState.updateToolbarUI(modeId);
    }
  }

  // ── Mode Switch Logic (Migrated from toolbar.js) ────────────
  
  async updateUI(modeId) {
    if (!this.toolbarEl) return;
    if (typeof AppState === 'undefined') return;
    
    if (!this.isStandalone) {
        const hasFile = !!AppState.currentFile;
        this.container.style.display = hasFile ? 'flex' : 'none';
        if (!hasFile) return; // Safe: _isSyncing not yet set
    }

    // Strict Sync Guard to prevent loops
    if (this._isSyncing) return;
    this._isSyncing = true;
    window._isGlobalSyncing = true; // Global flag for other modules to honor

    const targetMode = modeId || AppState.currentMode || 'read';

    // ── Visibility Check ──────────────────────────────────
    const viewer = document.getElementById('md-viewer-mount');

    if (viewer) {
      viewer.setAttribute('data-active-mode', targetMode);
    }

    // ── Sync Logic (Capture while still visible) ──────────
    const prevMode = AppState.currentMode;
    let syncData = AppState.forceSyncContext || null;
    
    // Clear forced context after use
    if (AppState.forceSyncContext) delete AppState.forceSyncContext;

    if (!syncData) {
      syncData = (prevMode === 'edit')
        ? this.captureEditorSyncData()
        : (prevMode === 'read' || prevMode === 'comment' || prevMode === 'collect' ? this.captureReadViewSyncData() : null);
    }

    // ── Dirty Check ───────────────────────────────────────
    if (prevMode === 'edit' && targetMode !== 'edit' && typeof EditorModule !== 'undefined' && EditorModule.isDirty()) {
        const isDraft = AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_');
        const isFirstEdit = EditorModule.getOriginalContent() === '';

        if (isDraft || isFirstEdit) {
            await EditorModule.save();
        } else {
            DesignSystem.showConfirm({
                title: 'Unsaved Changes',
                message: 'You have unsaved changes. Save them before switching?',
                onConfirm: async () => {
                    this._isSyncing = false;
                    window._isGlobalSyncing = false;
                    const saved = await EditorModule.save();
                    if (saved) {
                        this._proceedUpdateUI(targetMode, syncData, prevMode);
                    }
                },
                onCancel: () => {
                    this._isSyncing = false;
                    window._isGlobalSyncing = false;
                    this.updateUI('edit');
                }
            });
            return;
        }
    }

    try {
      await this._proceedUpdateUI(targetMode, syncData, prevMode);
    } finally {
      // Small delay to let DOM settle after mode switch
      setTimeout(() => {
        this._isSyncing = false;
        window._isGlobalSyncing = false;
      }, 400);
    }

    // Save mode preference
    if (AppState.currentFile && typeof AppState.setFileViewMode === 'function') {
        AppState.setFileViewMode(AppState.currentFile, targetMode);
    }
  }

  async _proceedUpdateUI(targetMode, syncData, prevMode) {

    // ── Update AppState ───────────────────────────────────
    AppState.commentMode = (targetMode === 'comment');
    AppState.currentMode = targetMode;

    // ── Update Component UI ───────────────────────────────
    if (this.segmentedControlComponent) {
      this.segmentedControlComponent.updateActive(targetMode);
    }

    if (targetMode === 'read' || targetMode === 'comment' || targetMode === 'collect') {
      const viewerComp = MarkdownViewer.getInstance();
      if (viewerComp) {
        viewerComp.setState({ 
          mode: targetMode,
          file: AppState.currentFile
        });
      } else {
        const mdContent   = document.getElementById('md-content');
        const emptyState  = document.getElementById('empty-state');
        if (mdContent) mdContent.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
      }

      if (typeof CommentsModule !== 'undefined') CommentsModule.removeCommentMode();
      if (typeof CollectModule !== 'undefined') CollectModule.removeCollectMode();

      if (targetMode === 'comment') {
        if (typeof CommentsModule !== 'undefined') CommentsModule.applyCommentMode();
      } else if (targetMode === 'collect') {
        if (typeof CollectModule !== 'undefined') {
          CollectModule.loadForFile(AppState.currentFile);
          CollectModule.applyCollectMode();
        }
      }

      if (AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_')) {
        if (typeof DraftModule !== 'undefined') DraftModule.syncPreview();
      }

      if (prevMode === 'edit' && syncData) {
        requestAnimationFrame(() => {
          this.scrollReadViewToLine(syncData.line, syncData.selectionText, syncData.isRealSelection);
        });
      }
    } else if (targetMode === 'edit') {
      const viewerComp = MarkdownViewer.getInstance();
      const _currentSelection = window.getSelection().toString().trim();
      const mdContentMount = document.getElementById('md-content'); // Might not exist if we just switched
      
      const viewerMount = document.getElementById('md-viewer-mount');
      const _currentScrollPct = (mdContentMount && viewerMount) ? (viewerMount.scrollTop / (viewerMount.scrollHeight - viewerMount.clientHeight || 1)) : 0;

      if (AppState.currentFile) {
        if (viewerComp) {
          // Set sync context for the editor component to consume on mount
          if (syncData) AppState.lastSyncContext = syncData;

          viewerComp.setState({ 
            mode: 'edit',
            file: AppState.currentFile
          });
        }
        
        await this.loadRawContent();
        
        // Secondary sync after content is loaded to ensure accuracy
        if (typeof EditorModule !== 'undefined' && syncData) {
          EditorModule.focusWithContext({ ...syncData, _fileKey: AppState.currentFile || 'default' });
        }
      }
      
      if (typeof CommentsModule !== 'undefined') CommentsModule.removeCommentMode();
      if (typeof CollectModule !== 'undefined') CollectModule.removeCollectMode();
    }

    // ── Apply Subtle Fade-In Animation (Only for Major Mode Swaps) ──
    const isMajorChange = (prevMode === 'edit' || targetMode === 'edit');
    const activeView = (targetMode === 'edit') ? document.getElementById('edit-viewer') : document.getElementById('md-content');
    
    if (isMajorChange && activeView) {
      activeView.classList.remove('ds-sync-fade-in');
      void activeView.offsetWidth; // Force reflow
      activeView.classList.add('ds-sync-fade-in');
    }

    // ── Draft Actions ─────────────────────────────────────
    const isDraft = this.isStandalone ? this.showDraftActions : (window.AppState && AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_'));
    if (this.divider) this.divider.style.display = isDraft ? 'block' : 'none';
    if (this.draftActions) this.draftActions.style.display = isDraft ? 'flex' : 'none';
  }

  // ── Helper Methods (Migrated from toolbar.js) ─────────────

  /**
   * Captures a sync context snapshot from the Read View.
   *
   * Used when switching Read → Edit so the editor can open at the same
   * content position the user was reading. Returns an object consumed by
   * MarkdownLogicService.syncCursor().
   *
   * Priority order:
   *   1. User selection (isRealSelection: true)
   *      If the user has text highlighted in the Read view, captures the
   *      selection text, its data-line number, and char offset within the
   *      element. This is the most accurate anchor.
   *
   *   2. Center-visible line (isRealSelection: false)
   *      Finds the element at the visual center of the viewport using
   *      elementFromPoint(), extracts its plain text (filtering out UI
   *      chrome like code-block headers, SVG, aria-hidden nodes).
   *      The text is capped at 200 chars to keep fuzzy matching fast.
   *
   *   3. Proportional scroll fallback (isRealSelection: false)
   *      Returns scrollPct (0–1) when no data-line element is found.
   *      Consumed by syncCursor's scroll-only fallback path.
   *
   * NOTE on data-line vs raw line offset:
   *   The HTML renderer assigns data-line numbers from the markdown token
   *   stream, which may differ from raw file line numbers by 10–20 lines
   *   in long files (due to YAML frontmatter, blank-line collapsing, etc.).
   *   This is expected — MarkdownLogicService.syncCursor handles the offset
   *   via its Fuzzy Match + Delta Cache mechanism.
   *
   * @returns {{ line, offset, selectionText, isRealSelection, length? }
   *          | { line, selectionText, isRealSelection }
   *          | { scrollPct, isRealSelection }}
   */
  captureReadViewSyncData() {
    return window.SyncService ? SyncService.captureReadViewSyncData() : { scrollPct: 0 };
  }

  captureReadViewLine() {
    const data = this.captureReadViewSyncData();
    return data.line || null;
  }

  captureEditorSyncData() {
    return window.SyncService ? SyncService.captureEditorSyncData() : {};
  }

  scrollEditorToLine(lineNum, offset = 0, length = 0) {
    if (window.SyncService) SyncService.scrollEditorToLine(lineNum, offset, length);
  }

  scrollReadViewToLine(line, selectionText = '', isRealSelection = false) {
    if (window.SyncService) SyncService.scrollReadViewToLine(line, selectionText, isRealSelection);
  }

  async loadRawContent() {
    if (!AppState.currentFile) return;

    if (AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_')) {
        if (typeof DraftModule !== 'undefined' && typeof EditorModule !== 'undefined') {
            const content = DraftModule.getDraftContent();
            EditorModule.setOriginalContent(content);
        }
        return;
    }

    const res = await fetch(`/api/file/raw?path=${encodeURIComponent(AppState.currentFile)}`);
    if (res.ok) {
        const text = await res.text();
        if (typeof EditorModule !== 'undefined') {
            EditorModule.setOriginalContent(text);
        } else {
            const textarea = document.getElementById('edit-textarea');
            if (textarea) textarea.value = text;
        }
    }
  }

  async handleSave() {
    if (!window.AppState) return;

    let content = '';
    if (AppState.currentMode === 'edit' && typeof EditorModule !== 'undefined') {
      content = document.getElementById('edit-textarea')?.value || '';
    } else if (typeof DraftModule !== 'undefined') {
      content = DraftModule.getDraftContent();
    }

    if (!content) {
      if (typeof showToast === 'function') showToast('Draft is empty.', 'error');
      return;
    }

    // Helper to check if file exists
    const checkExists = async (name) => {
      try {
        const res = await fetch(`/api/file/exists?path=${encodeURIComponent(name)}`);
        const data = await res.json();
        return !!data.exists;
      } catch { return false; }
    };

    // 1. Find the first available "untitled X.md" name
    let suggestedName = 'untitled.md';
    let exists = await checkExists(suggestedName);
    let counter = 1;
    while (exists) {
      suggestedName = `untitled ${counter}.md`;
      exists = await checkExists(suggestedName);
      counter++;
    }

    DesignSystem.showPrompt({
      title: 'Save Draft to Workspace',
      message: 'Enter filename (with .md extension):',
      placeholder: 'untitled.md',
      defaultValue: suggestedName,
      onConfirm: async (fileName) => {
        if (!fileName) return;

        const cleanName = fileName.endsWith('.md') ? fileName : fileName + '.md';
        const filePath = `${AppState.currentWorkspace.path}/${cleanName}`;

        // 2. Check if user manually entered an existing name
        const userExists = await checkExists(cleanName);
        if (userExists) {
          DesignSystem.showConfirm({
            title: 'File Already Exists',
            message: `"${cleanName}" already exists. Do you want to replace it?`,
            onConfirm: () => this._doActualSave(cleanName, filePath, content)
          });
        } else {
          await this._doActualSave(cleanName, filePath, content);
        }
      }
    });
  }

  async _doActualSave(cleanName, filePath, content) {
    try {
      const res = await fetch('/api/file/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content })
      });

      if (res.ok) {
        if (typeof showToast === 'function') showToast('Draft saved as file!');
        if (typeof EditorModule !== 'undefined') EditorModule.setDirty(false);
        if (typeof DraftModule !== 'undefined') DraftModule.clear();
        
        if (typeof TabsModule !== 'undefined') {
          TabsModule.remove(AppState.currentFile, true);
          if (typeof loadFile === 'function') {
            await loadFile(cleanName, { silent: true });
            // Force UI update to hide draft buttons
            await this.updateUI('read');
          }
        }
      } else {
        const errData = await res.json();
        if (typeof showToast === 'function') showToast('Failed to save file: ' + (errData.error || 'Unknown error'), 'error');
      }
    } catch (_err) {
      if (typeof showToast === 'function') showToast('Error saving file.', 'error');
    }
  }

  handleDiscard() {
    // Skip confirmation if draft is empty
    let content = "";
    if (AppState.currentMode === "edit" && typeof EditorModule !== "undefined") {
      content = document.getElementById("edit-textarea")?.value || "";
    } else if (typeof DraftModule !== "undefined") {
      content = DraftModule.getDraftContent();
    }

    const isEffectivelyEmpty = !content || content.trim() === "";

    const proceedDiscard = () => {
      if (typeof TabsModule !== "undefined") {
        const fileToRemove = AppState.currentFile;
        TabsModule.remove(fileToRemove, true); // skipConfirm = true
        if (typeof DraftModule !== "undefined") {
          DraftModule.clear(fileToRemove);
        }
      }
    };

    if (isEffectivelyEmpty) {
      proceedDiscard();
    } else {
      DesignSystem.showConfirm({
        title: "Discard Draft",
        message:
          "Are you sure you want to discard this draft? This cannot be undone.",
        onConfirm: proceedDiscard,
      });
    }
  }
}

// Singleton bridge for existing app logic
const ChangeActionViewBar = (() => {
    let instance = null;
    return {
        init: () => {
            if (!instance) instance = new ChangeActionViewBarComponent();
            return instance;
        },
        getInstance: () => instance
    };
})();
// Export to window
window.ChangeActionViewBar = ChangeActionViewBar;

```
</file>

<file path="renderer/js/components/organisms/comment-form-component.js">
```js
/* ============================================================
   comment-form-component.js — Comment Form (Organism)
   Floating popup for creating, editing, and viewing comments.
   ============================================================ */

const CommentFormComponent = (() => {
  let instance = null;

  class CommentForm {
    constructor() {
      this.el = null;
      this.mode = 'empty'; // 'empty', 'filled', 'view'
      this.onSaveCallback = null;
      this.onCancelCallback = null;
      this.onEditCallback = null;
      this.onExpandCallback = null;

      this._initDOM();
    }

    _initDOM() {
      this.el = DesignSystem.createElement('div', 'ds-comment-form');

      this.el.innerHTML = `
        <div class="ds-comment-form__inner">
          <!-- Edit View -->
          <div class="ds-comment-form__edit-view">
            <div class="ds-comment-form__input-wrap">
              <textarea class="ds-comment-form__input" placeholder="What’s your feedback"></textarea>
            </div>
            <div class="ds-comment-form__actions">
              <div class="ds-comment-form__secondary-action"></div>
              <div style="flex:1"></div>
              <div class="ds-comment-form__btn-stack">
                <button class="ds-comment-form__cancel-btn ds-btn ds-btn-ghost">Cancel</button>
                <button class="ds-comment-form__save-btn ds-btn ds-btn-primary" disabled>Save</button>
              </div>
            </div>

          </div>

          <!-- View View -->
          <div class="ds-comment-form__read-view">
            <div class="ds-comment-form__read-header">
              <div class="ds-comment-form__header-label">COMMENT</div>
              <div class="ds-comment-form__secondary-action"></div>
            </div>
            <div class="ds-comment-form__read-body">
              <div class="ds-comment-form__display"></div>
            </div>
          </div>
        </div>
      `;

      this.input = this.el.querySelector('.ds-comment-form__input');
      this.display = this.el.querySelector('.ds-comment-form__display');
      this.saveBtn = this.el.querySelector('.ds-comment-form__save-btn');
      this.cancelBtn = this.el.querySelector('.ds-comment-form__cancel-btn');

      this._bindEvents();
      document.body.appendChild(this.el);
    }

    _bindEvents() {
      this.input.addEventListener('input', () => {
        const val = this.input.value.trim();
        this.saveBtn.disabled = !val;
        this.el.classList.toggle('is-filled', !!val);
        if (this.mode !== 'view') {
          this.setMode(val ? 'filled' : 'empty');
        }
        this._autoResize();
      });

      this.input.addEventListener('focus', () => this.el.classList.add('is-typing'));
      this.input.addEventListener('blur', () => this.el.classList.remove('is-typing'));

      this.input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey && !this.saveBtn.disabled) {
          e.preventDefault();
          if (this.onSaveCallback) this.onSaveCallback(this.input.value.trim());
        }
        if (e.key === 'Escape') this.hide();
      });

      this.saveBtn.onclick = () => {
        if (this.onSaveCallback) this.onSaveCallback(this.input.value.trim());
      };

      this.cancelBtn.onclick = () => {
        if (this.onCancelCallback) this.onCancelCallback();
        this.hide();
      };

      this._initDrag();

      document.addEventListener('mousedown', (e) => {
        if (this.el.classList.contains('show')) {
          if (!this.el.contains(e.target) && !e.target.closest('.ds-sidebar-item') && !e.target.closest('.comment-trigger')) {
            this.hide();
          }
        }
      });
    }

    _initDrag() {
      let isDragging = false;
      let startX, startY, initialX, initialY;
      this.el.addEventListener('mousedown', (e) => {
        const interactive = ['BUTTON', 'TEXTAREA', 'INPUT', 'SVG', 'PATH'];
        if (interactive.includes(e.target.tagName) || e.target.closest('button')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = this.el.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        this.el.style.zIndex = '3000';
      });
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        this.el.style.left = (initialX + (e.clientX - startX)) + 'px';
        this.el.style.top = (initialY + (e.clientY - startY)) + 'px';
        this.el.style.transform = 'none';
      });
      window.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        this.el.style.zIndex = '2000';
      });
    }

    _autoResize() {
      this.input.style.height = 'auto';
      this.input.style.height = Math.min(this.input.scrollHeight, 240) + 'px';
    }

    _renderSecondaryAction(container, icon, title, callback) {
      container.innerHTML = '';
      const btn = new IconActionButton({
        iconName: icon,
        title: title,
        onClick: callback
      });
      container.appendChild(btn.render());
    }

    setMode(mode) {
      this.mode = mode;
      this.el.setAttribute('data-mode', mode);

      const editAction = this.el.querySelector('.ds-comment-form__edit-view .ds-comment-form__secondary-action');

      const viewAction = this.el.querySelector('.ds-comment-form__read-view .ds-comment-form__secondary-action');

      if (mode === 'view') {
        this._renderSecondaryAction(viewAction, 'pen-line', 'Edit comment', () => {
          if (this.onEditCallback) this.onEditCallback(this.display.textContent);
        });
        this.el.classList.remove('is-typing');
      } else {
        this._renderSecondaryAction(editAction, 'maximize-2', 'Expand to full editor', () => {
          if (this.onExpandCallback) this.onExpandCallback(this.input.value);
        });
      }
    }

    show(anchorBtn, mode = 'empty', text = '') {
      this.setMode(mode);
      if (mode === 'view') {
        this.display.textContent = text;
      } else {
        this.input.value = text;
        this.saveBtn.disabled = !text.trim();
        this.el.classList.toggle('is-filled', !!text.trim());
        this._autoResize();
        setTimeout(() => this.input.focus(), 50);
      }
      const rect = anchorBtn.getBoundingClientRect();
      let left = rect.right + 10;
      if (left + 360 > window.innerWidth - 10) left = rect.left - 370;
      this.el.style.left = `${left}px`;
      requestAnimationFrame(() => {
        const top = Math.max(10, Math.min(rect.top, window.innerHeight - this.el.offsetHeight - 10));
        this.el.style.top = `${top}px`;
      });
      this.el.classList.add('show');
    }

    hide() { this.el.classList.remove('show'); }
    setText(text) {
      this.input.value = text;
      this.saveBtn.disabled = !text.trim();
      this.el.classList.toggle('is-filled', !!text.trim());
      this._autoResize();
    }
    getText() { return this.input.value.trim(); }
    onSave(cb) { this.onSaveCallback = cb; }
    onCancel(cb) { this.onCancelCallback = cb; }
    onEdit(cb) { this.onEditCallback = cb; }
    onExpand(cb) { this.onExpandCallback = cb; }
  }

  return { getInstance: () => { if (!instance) instance = new CommentForm(); return instance; } };
})();
window.CommentFormComponent = CommentFormComponent;

```
</file>

<file path="renderer/js/components/organisms/edit-toolbar-component.js">
```js
/**
 * EditToolbarComponent (Organism)
 * Purpose: Provides a standardized toolbar for Markdown editing tools.
 * Dependencies: IconActionButton (Atom), DesignSystem (Core)
 */
const EditToolbarComponent = (() => {
  'use strict';

  class EditToolbarComponent {
    constructor(mount) {
      this.mount = mount || document.getElementById('edit-toolbar-mount');

      this.onAction = null;
      this.onSave = null;
      this.onCancel = null;
      this.onHelp = null;

      this.el = null;
      this.config = [
        {
          id: 'headings',
          items: [
            { action: 'h1', icon: 'heading-1', title: 'Heading 1' },
            { action: 'h2', icon: 'heading-2', title: 'Heading 2' },
            { action: 'h3', icon: 'heading-3', title: 'Heading 3' },
            { action: 'h4', icon: 'heading-4', title: 'Heading 4' },
            { action: 'h5', icon: 'heading-5', title: 'Heading 5' },
            { action: 'h6', icon: 'heading-6', title: 'Heading 6' }
          ]
        },
        {
          id: 'typography',
          items: [
            { action: 'b', icon: 'bold', title: 'Bold' },
            { action: 'i', icon: 'italic', title: 'Italic' },
            { action: 's', icon: 'strikethrough', title: 'Strikethrough' }
          ]
        },
        {
          id: 'content',
          items: [
            { action: 'q', icon: 'quote', title: 'Quote' },
            { action: 'l', icon: 'link', title: 'Link' },
            { action: 'img', icon: 'image', title: 'Image' },
            { action: 'hr', icon: 'minus', title: 'Divider' }
          ]
        },
        {
          id: 'lists',
          items: [
            { action: 'ul', icon: 'list', title: 'Unordered List' },
            { action: 'ol', icon: 'list-ordered', title: 'Numbered List' },
            { action: 'tl', icon: 'check-square', title: 'Task List' }
          ]
        },
        {
          id: 'advanced',
          items: [
            { action: 'c', icon: 'code', title: 'Inline Code' },
            { action: 'cb', icon: 'terminal', title: 'Code Block' },
            { action: 'tb', icon: 'table', title: 'Table' }
          ]
        },
        {
          id: 'help',
          items: [
            { id: 'edit-help-btn', icon: 'help-circle', title: 'Markdown Help', onClick: () => this.onHelp?.() }
          ]
        }
      ];

      this.init();
    }

    init() {
      if (!this.mount) return;
      this.render();
    }

    show(options = {}) {
      this.onAction = options.onAction;
      this.onSave = options.onSave;
      this.onCancel = options.onCancel;
      this.onHelp = options.onHelp;

      if (this.el) {
        this.el.style.display = 'block';
      }
    }

    hide() {
      if (this.el) {
        this.el.style.display = 'none';
      }
      this.onAction = null;
      this.onSave = null;
      this.onCancel = null;
      this.onHelp = null;
    }

    render() {
      const wrap = DesignSystem.createElement('div', 'ds-edit-toolbar-container');
      wrap.style.display = 'none'; // Hidden by default

      const toolbar = DesignSystem.createElement('div', 'ds-edit-toolbar');

      // 1. Tool Groups
      this.config.forEach((group, idx) => {
        const groupEl = this._createGroup(group.items);
        toolbar.appendChild(groupEl);

        // Add divider between tool groups
        if (idx < this.config.length - 1) {
          toolbar.appendChild(DesignSystem.createElement('div', 'ds-edit-toolbar-divider'));
        }
      });

      // 2. Spacer to push action group to the right
      toolbar.appendChild(DesignSystem.createElement('div', 'ds-edit-toolbar-spacer'));

      // 2. Action Group (Cancel/Save)
      const actionGroup = DesignSystem.createElement('div', 'ds-edit-button-group');
      const cancelBtn = DesignSystem.createButton({
        label: 'Discard',
        variant: 'ghost',
        onClick: () => this.onCancel?.()
      });
      const saveBtn = DesignSystem.createButton({
        label: 'Save Changes',
        variant: 'primary',
        onClick: () => this.onSave?.()
      });

      actionGroup.appendChild(cancelBtn);
      actionGroup.appendChild(saveBtn);
      toolbar.appendChild(actionGroup);

      wrap.appendChild(toolbar);
      this.mount.appendChild(wrap);
      this.el = wrap;
    }

    _createGroup(items) {
      const group = DesignSystem.createElement('div', 'ds-edit-action-group');
      items.forEach(item => {
        const btn = new window.IconActionButton({
          id: item.id,
          title: item.title,
          iconName: item.icon,
          isLarge: false,
          onClick: item.onClick || (() => this.onAction?.(item.action))
        }).render();

        // UX: Prevent focus theft from editor
        btn.onmousedown = (e) => e.preventDefault();

        group.appendChild(btn);
      });
      return group;
    }
  }

  // Singleton Bridge
  let instance = null;
  return {
    init: (mount) => {
      if (!instance) instance = new EditToolbarComponent(mount);
      return instance;
    },
    getInstance: () => instance
  };
})();

window.EditToolbarComponent = EditToolbarComponent;

```
</file>

<file path="renderer/js/components/organisms/explorer-settings-component.js">
```js
/* global DesignSystem, AppState, SettingsService, SettingToggleItem, MenuShield */
/* ══════════════════════════════════════════════════
   ExplorerSettingsComponent.js — Explorer Preferences
   Sử dụng MenuShield để đồng nhất giao diện menu nổi.
   ════════════════════════════════════════════════════ */

class ExplorerSettingsComponent {
  /**
   * Main render function that returns the content element
   */
  render() {
    const container = DesignSystem.createElement('div', 'ds-settings-menu-panel');
    const settings = AppState.settings;

    const items = [
      { 
        label: 'Show Hidden Files', 
        isOn: settings.showHidden,
        onChange: (val) => SettingsService.update('showHidden', val)
      },
      { 
        label: 'Hide Empty Folders', 
        isOn: settings.hideEmptyFolders,
        onChange: (val) => SettingsService.update('hideEmptyFolders', val)
      },
      { 
        label: 'Flat View', 
        isOn: settings.flatView,
        onChange: (val) => SettingsService.update('flatView', val)
      },
      { 
        label: 'Show Hidden in Search', 
        isOn: settings.showHiddenInSearch,
        onChange: (val) => SettingsService.update('showHiddenInSearch', val)
      }
    ];

    items.forEach(item => {
      const row = SettingToggleItem.create({
        label: item.label,
        isOn: item.isOn,
        onChange: item.onChange,
        variant: 'menu'
      });
      container.appendChild(row);
    });

    return container;
  }

  /**
   * Toggle the Explorer Settings UI
   * @param {Object} options
   * @param {MouseEvent} options.event - (Optional)
   * @param {HTMLElement} options.anchor - (Optional) Trigger element
   */
  static toggle(options = {}) {
    const { event, anchor } = options;
    
    if (MenuShield.active && MenuShield.active.element.classList.contains('ds-explorer-settings-shield')) {
      MenuShield.close();
      return;
    }

    const component = new ExplorerSettingsComponent();
    const content = component.render();

    MenuShield.open({
      event: event,
      anchor: anchor,
      title: 'Explorer Preferences',
      content: content,
      className: 'ds-explorer-settings-shield'
    });
  }
}

// Export for Design System
window.ExplorerSettingsComponent = ExplorerSettingsComponent;

```
</file>

<file path="renderer/js/components/organisms/handoff-token-form-component.js">
```js
/* global DesignSystem, BaseFormModal */
/* ══════════════════════════════════════════════════
   HandoffTokenFormComponent.js — Configure Handoff API Token
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class HandoffTokenFormComponent {
  constructor(options = {}) {
    this.onConfirm = options.onConfirm || (() => { });
    this.onCancel = options.onCancel || (() => { });
    this.initialToken = window.AppState.settings.handoffToken || '';
  }

  render() {
    // 1. Prepare Body (Fields)
    const bodyContent = DesignSystem.createElement('div', 'handoff-form-body');
    
    const tokenLabel = DesignSystem.createElement('label', 'ds-form-field-label', { text: 'API TOKEN' });
    this.tokenInput = DesignSystem.createInput({
      type: 'password',
      placeholder: 'Enter your Bearer token...',
      id: 'handoff-token-input',
      value: this.initialToken
    });
    
    const helpText = DesignSystem.createInlineMessage({
      text: 'You can find your token in your Handoff dashboard settings.',
      variant: 'info'
    });
    
    bodyContent.appendChild(tokenLabel);
    bodyContent.appendChild(this.tokenInput);
    bodyContent.appendChild(helpText);

    // 2. Prepare Actions
    const cancelBtn = DesignSystem.createButton({
      variant: 'ghost',
      label: 'Cancel',
      onClick: () => {
        this.closeAction();
        this.onCancel();
      }
    });

    this.confirmBtn = DesignSystem.createButton({
      variant: 'primary',
      label: 'Save Token',
      onClick: () => {
        const token = this.tokenInput.value.trim();
        this.onConfirm(token);
        this.closeAction();
      }
    });

    // 3. Create Form using Template
    const form = BaseFormModal.create({
      iconHtml: `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
        </svg>
      `,
      title: 'Handoff API Configuration',
      subtitle: 'Enter your API token from handoff.host to enable document publishing.',
      bodyContent: bodyContent,
      actions: [cancelBtn, this.confirmBtn]
    });

    // Initial validation & focus
    setTimeout(() => this.tokenInput.focus(), 100);

    return form;
  }

  static open(options = {}) {
    const component = new HandoffTokenFormComponent(options);
    const content = component.render();

    const popover = DesignSystem.createPopoverShield({
      content: content,
      width: '480px',
      showHeader: false,
      className: 'aws-popover-shield'
    });

    component.closeAction = () => popover.close();
    return popover;
  }
}

window.HandoffTokenFormComponent = HandoffTokenFormComponent;

```
</file>

<file path="renderer/js/components/organisms/markdown-helper-component.js">
```js
/* ══════════════════════════════════════════════════
   MarkdownHelperComponent.js — Markdown Guide Organism
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class MarkdownHelperComponent {
  constructor() {
    this.popover = null;
  }

  /**
   * Main render function that returns the content element
   */
  render() {
    const container = DesignSystem.createElement('div', 'markdown-helper-organism');

    const sections = [
      {
        title: 'Format',
        items: [
          { label: 'In đậm', syntax: '**text**', action: 'b' },
          { label: 'In nghiêng', syntax: '*text*', action: 'i' },
          { label: 'Đậm + Nghiêng', syntax: '***text***', action: 'bi' },
          { label: 'Gạch ngang', syntax: '~~text~~', action: 's' },
          { label: 'Inline code', syntax: '`text`', action: 'c' }
        ]
      },
      {
        title: 'Tiêu đề',
        items: [
          { label: 'H1', syntax: '# H1', action: 'h1' },
          { label: 'H2', syntax: '## H2', action: 'h2' },
          { label: 'H3', syntax: '### H3', action: 'h3' },
          { label: 'H4', syntax: '#### H4', action: 'h' },
          { label: 'H5', syntax: '##### H5', action: 'h5' },
          { label: 'H6', syntax: '###### H6', action: 'h6' }
        ]
      },
      {
        title: 'Danh sách',
        items: [
          { label: 'Bullet list', syntax: '- ITEM', action: 'ul' },
          { label: 'Numbered list', syntax: '1. ITEM', action: 'ol' },
          { label: 'Checkbox', syntax: '- [ ] ITEM', action: 'tl' },
          { label: 'Checked', syntax: '- [x] ITEM', action: 'tl-checked' }
        ]
      },
      {
        title: 'Khác',
        items: [
          { label: 'Blockquote', syntax: '> TEXT', action: 'q' },
          { label: 'Link', syntax: '[NAME](URL)', action: 'l' },
          { label: 'Image', syntax: '![ALT](URL)', action: 'img' },
          { label: 'Code block', syntax: '```lang ```', action: 'cb' },
          { label: 'Table', syntax: '| A | B |', action: 'tb' },
          { label: 'Đường kẻ', syntax: '---', action: 'hr' },
          { label: 'Footnote', syntax: 'TEXT[^1]', action: 'fn' }
        ]
      }
    ];

    sections.forEach(sec => {
      const group = DesignSystem.createElement('div', 'ds-popover-group');
      const title = DesignSystem.createElement('div', 'ds-popover-group-title', { text: sec.title });
      const grid = DesignSystem.createElement('div', 'help-grid');

      sec.items.forEach(item => {
        const btn = DesignSystem.createElement('div', 'help-item-btn', {
          'data-action': item.action,
          'html': `
            <span class="help-label">${item.label}</span>
            <span class="help-syntax">${item.syntax}</span>
          `
        });

        btn.onmousedown = (e) => {
          e.preventDefault(); // CRITICAL: Prevent focus loss from editor
          e.stopPropagation();
          if (window.EditorModule) {
            // Mapping actions to tags for insertText
            const map = {
              'b': ['**', '**'], 'i': ['*', '*'], 'bi': ['***', '***'], 's': ['~~', '~~'], 'c': ['`', '`'],
              'h1': ['# ', ''], 'h2': ['## ', ''], 'h3': ['### ', ''], 'h': ['#### ', ''], 'h5': ['##### ', ''], 'h6': ['###### ', ''],
              'ul': ['- ', ''], 'ol': ['1. ', ''], 'tl': ['- [ ] ', ''], 'tl-checked': ['- [x] ', ''],
              'q': ['> ', ''], 'l': ['[', '](url)'], 'img': ['![', '](url)'], 'cb': ['```\n', '\n```'],
              'tb': ['| Col 1 | Col 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |', ''], 'hr': ['---\n', ''], 'fn': ['[^1]', '']
            };
            const tags = map[item.action] || ['', ''];
            window.EditorModule.insertText(tags[0], tags[1]);
          }
        };

        grid.appendChild(btn);
      });

      // Add empty spacer for grid balance if needed
      if (sec.items.length % 2 !== 0) {
        grid.appendChild(DesignSystem.createElement('div', 'help-empty'));
      }

      group.appendChild(title);
      group.appendChild(grid);
      container.appendChild(group);
    });

    return container;
  }

  /**
   * Open the Help UI in a Popover Shield
   */
  static open() {
    const component = new MarkdownHelperComponent();
    const content = component.render();

    const mainCanvas = document.querySelector('.glass-main');
    const popover = DesignSystem.createPopoverShield({
      title: 'Markdown Helper',
      content: content,
      width: '560px',
      hasBackdrop: false,
      container: mainCanvas || document.body,
      className: 'markdown-helper-popover'
    });

    // Add Y offset as requested
    popover.card.style.marginTop = '-32px';


    return popover;
  }
}

// Export for Design System
window.MarkdownHelperComponent = MarkdownHelperComponent;

```
</file>

<file path="renderer/js/components/organisms/markdown-viewer-component.js">
```js
/* global AppState, TOCComponent, EditToolbarComponent, EditorModule, MarkdownHelperComponent, MarkdownLogicService, ScrollModule, DesignSystem */

class MarkdownViewerComponent {
  constructor(options = {}) {
    this.mount = options.mount || document.getElementById('md-viewer-mount');
    this.state = {
      mode: 'empty', // 'empty', 'read', 'edit'
      file: null,
      content: '',
      html: ''
    };
    this.previewComp = null;
    this.editorComp = null;
    this.viewport = null;
    this._scrollTopBtn = null;
    this._tocBtn = null;
    this._comboBtn = null;
    this._editImportBtn = null;
    this._editAppendBtn = null;
    this._publishBtn = null;
    this._floatingGroup = null;
    this._tocUpdateTimeout = null;
    this.init();
  }

  init() {
    if (!this.mount) return;
    this.render();
  }

  /**
   * Main update entry point
   * @param {Object} newState 
   */
  setState(newState) {
    const fileChanged = newState.file !== undefined && newState.file !== this.state.file;
    const modeChanged = newState.mode !== undefined && newState.mode !== this.state.mode;
    
    // 1. Save scroll position before switching file OR mode
    if ((fileChanged || modeChanged) && this.state.file && ScrollModule) {
      ScrollModule.save(this.state.file);
    }
    
    const oldMode = this.state.mode;
    this.state = { ...this.state, ...newState };

    if (fileChanged) {
      this.render();
    } else if (modeChanged) {
      this._handleModeSwitch(oldMode, newState.mode);
      // Ensure hidden components are updated with latest state even on mode switch
      if (this.previewComp) this.previewComp.update(this.state);
      if (this.editorComp) this.editorComp.update(this.state);
    } else if (this.state.mode === 'edit' && this.editorComp) {
      this.editorComp.update(this.state);
    } else if (this.previewComp) {
      this.previewComp.update(this.state);
    }

    // Update TOC with debounce
    this._updateTOC();
  }

  render() {
    if (!this.mount) return;
    
    window._isMDViewerRendering = true;
    
    try {
      if (this.previewComp && this.previewComp.destroy) this.previewComp.destroy();
      if (this.editorComp && this.editorComp.destroy) this.editorComp.destroy();
      
      this.mount.innerHTML = '';
      this._tocBtn = null;
      this._comboBtn = null;
      this._editImportBtn = null;
      this._editAppendBtn = null;
      this._publishBtn = null;
      this._floatingGroup = null;
      this._scrollTopBtn = null;
      
      // Reset TOC internal state to clear old content and show skeleton
      if (TOCComponent) TOCComponent.reset();
      
      if (this.state.mode === 'empty') {
        new MarkdownEmptyState({ mount: this.mount });
        return;
      }

      this.viewport = DesignSystem.createElement('div', 'md-viewer-viewport');
      this.mount.appendChild(this.viewport);

      // Add context menu listener
      this.viewport.oncontextmenu = (e) => this._handleContextMenu(e);

      // Render both but they control their own initial visibility
      this.previewComp = new MarkdownPreview({ 
        mount: this.viewport, 
        html: this.state.html,
        file: this.state.file
      });

      this.editorComp = new MarkdownEditor({ 
        mount: this.viewport, 
        content: this.state.content,
        file: this.state.file
      });

      this._handleModeSwitch(null, this.state.mode);

    } catch (_err) {
      // Error handled during individual component renders
    } finally {
      setTimeout(() => {
        window._isMDViewerRendering = false;
      }, 300);
    }
  }

  _handleModeSwitch(oldMode, newMode) {
    if (!this.mount || !this.viewport) return;

    this.mount.setAttribute('data-mode', newMode);

    const previewEl = this.viewport.querySelector('#md-content');
    const editorEl = this.viewport.querySelector('#edit-viewer');

    if (newMode === 'edit') {
      if (previewEl) previewEl.style.display = 'none';
      if (editorEl) editorEl.style.display = 'flex';
      if (this.editorComp) this.editorComp.activate();
    } else {
      if (previewEl) previewEl.style.display = 'flex';
      if (editorEl) editorEl.style.display = 'none';
      if (this.editorComp) this.editorComp.deactivate();
    }

    if (EditToolbarComponent) {
      const toolbar = EditToolbarComponent.getInstance();
      if (newMode === 'edit') {
        toolbar.show({
          onAction: (action) => EditorModule && EditorModule.applyAction(action),
          onSave: () => this.editorComp && this.editorComp._save(),
          onCancel: () => this.editorComp && this.editorComp._handleCancel(),
          onHelp: () => MarkdownHelperComponent && MarkdownHelperComponent.open()
        });
      } else {
        toolbar.hide();
      }
    }

    if (oldMode === 'comment' && window.CommentsModule) window.CommentsModule.removeCommentMode();
    if (oldMode === 'collect' && window.CollectModule) window.CollectModule.removeCollectMode();

    if (newMode === 'comment' && window.CommentsModule) window.CommentsModule.applyCommentMode();
    if (newMode === 'collect' && window.CollectModule) window.CollectModule.applyCollectMode();

    this._updateFloatingButtons();
    this._refreshScrollTopListener();
  }

  _updateFloatingButtons() {
    const mode = this.state.mode;
    if (!this._scrollTopBtn) this._renderFloatingScrollTop();
    
    // Ensure group exists
    if (!this._floatingGroup) {
      this._floatingGroup = DesignSystem.createElement('div', 'floating-action-group');
      this._floatingGroup.id = 'floating-action-group';
      this.mount.appendChild(this._floatingGroup);
    }

    const isReadGroup = ['read', 'comment', 'collect'].includes(mode);
    const isEditGroup = mode === 'edit';

    // Toggle visibility
    if (isReadGroup && !this._tocBtn) this._renderReadFloatingActions();
    if (this._tocBtn) this._tocBtn.style.display = isReadGroup ? 'flex' : 'none';
    if (this._comboBtn) this._comboBtn.style.display = isReadGroup ? 'flex' : 'none';
    if (this._publishBtn) this._publishBtn.style.display = isReadGroup ? 'flex' : 'none';
    
    if (isReadGroup) this._updatePublishButtonState();
    
    if (isEditGroup && !this._editImportBtn) this._renderEditFloatingActions();
    
    if (this._editImportBtn) this._editImportBtn.style.display = isEditGroup ? 'flex' : 'none';
    if (this._editAppendBtn) this._editAppendBtn.style.display = isEditGroup ? 'flex' : 'none';

    if (isReadGroup) {
      if (TOCComponent && TOCComponent.isVisible()) {
        TOCComponent.show(this.mount);
      }
      
      this.viewport.onscroll = () => {
        if (TOCComponent) TOCComponent.updateActiveHeading(this.viewport);
      };
    } else {
      if (TOCComponent) {
        TOCComponent.hide();
        this.mount.classList.remove('has-toc');
      }
    }
  }

  /**
   * Create and manage the floating 'Scroll to Top' button
   */
  _renderFloatingScrollTop() {
    this._scrollTopBtn = DesignSystem.createElement('div', 'floating-scroll-top', {
      id: 'floating-scroll-top',
      title: 'Scroll to top',
      html: DesignSystem.getIcon('chevron-up')
    });

    this._scrollTopBtn.onclick = () => {
      const scrollEl = this.getActiveScrollElement();
      if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
    };

    this.mount.prepend(this._scrollTopBtn);
    this._refreshScrollTopListener();
  }

  /**
   * Refreshes the scroll listener on the currently active container
   */
  _refreshScrollTopListener() {
    if (!this._scrollTopBtn) return;

    const scrollEl = this.getActiveScrollElement();
    if (!scrollEl) return;

    // Remove old listener if exists (via replacement of node or tracking)
    if (this._currentScrollEl === scrollEl) return;
    
    this._currentScrollEl = scrollEl;
    scrollEl.addEventListener('scroll', () => {
      if (scrollEl.scrollTop > 300) {
        this._scrollTopBtn.classList.add('is-visible');
      } else {
        this._scrollTopBtn.classList.remove('is-visible');
      }
    });
  }

  /**
   * Returns the currently active scrollable element
   */
  getActiveScrollElement() {
    if (this.state.mode === 'edit') {
      return this.mount.querySelector('#edit-textarea');
    }
    return this.viewport;
  }

  /**
   * Create and manage the floating action group (TOC + Combo)
   */
  _renderReadFloatingActions() {
    if (!this._floatingGroup) return;

    // 1. TOC Button
    this._tocBtn = DesignSystem.createButton({
      variant: 'subtitle',
      offLabel: true,
      leadingIcon: 'list',
      title: 'Table of Contents',
      className: 'floating-toc-btn'
    });
    this._tocBtn.id = 'floating-toc-btn';

    this._tocBtn.onclick = (e) => {
      e.stopPropagation();
      if (TOCComponent) TOCComponent.toggle(this.mount);
    };

    // 2. Combo Button (Smart Copy & Drag)
    this._comboBtn = DesignSystem.createComboButton({
      label: 'Copy',
      variant: 'subtitle',
      leadingIcon: 'copy',
      className: 'floating-combo-btn',
      tooltip: 'Copy Markdown',
      mainAction: () => {
        if (this.state.content) {
          navigator.clipboard.writeText(this.state.content);
          if (window.showToast) window.showToast('Markdown copied to clipboard');
        }
      },
      toggleTooltip: 'Advanced Copy',
      toggleAction: () => {
        DesignSystem.createMenu(this._comboBtn, [
          { 
            label: 'Copy as File', 
            icon: 'file-plus', 
            onClick: () => this._handleCopyAsFile()
          },
          { 
            label: 'Copy for Google Docs', 
            icon: 'file-text', 
            onClick: () => this._handleGDocCopy()
          },
          { divider: true },
          { 
            label: 'Copy File Path', 
            icon: 'link', 
            onClick: () => {
              if (this.state.file) {
                navigator.clipboard.writeText(this.state.file);
                if (window.showToast) window.showToast('File path copied');
              }
            }
          }
        ], { align: 'right' });
      }
    });

    // ── Drag to Export ──
    const leadingIcon = this._comboBtn.querySelector('.ds-btn-icon-leading');
    if (leadingIcon) {
      leadingIcon.setAttribute('draggable', 'true');
      leadingIcon.style.cursor = 'grab';
      leadingIcon.title = 'Drag to export file';
      leadingIcon.ondragstart = (e) => {
        if (window.electronAPI && this.state.file) {
          const isElectron = !!window.electronAPI.isElectron;
          const hasDragFunc = typeof window.electronAPI.startFileDrag === 'function';

          if (isElectron) {
            // Electron native drag logic
            if (!hasDragFunc) {
              e.preventDefault();
              if (window.showToast) window.showToast('Please restart the app to enable Drag & Drop', 'error');
              return;
            }
            e.preventDefault();
            window.electronAPI.startFileDrag(this.state.file);
          } else if (hasDragFunc) {
            // Browser fallback: Use the DownloadURL trick (don't preventDefault)
            window.electronAPI.startFileDrag(this.state.file, e);
          }
        }
      };
    }

    this._floatingGroup.appendChild(this._tocBtn);
    this._floatingGroup.appendChild(this._comboBtn);
    
    // 3. Publish Button State
    this._updatePublishButtonState();
    
    // Immediate initial sync
    this._updateTOC();
  }

  /**
   * Refreshes the publish button based on the file's current publication state
   */
  _updatePublishButtonState() {
    if (!this._floatingGroup) return;
    const file = this.state.file;
    const info = window.PublishService ? window.PublishService.getPublishInfo(file) : null;
    
    // Remove old button if it exists in DOM
    if (this._publishBtn && this._publishBtn.parentElement) {
      this._publishBtn.remove();
    }

    if (!info) {
      // Regular Button when not published
      this._publishBtn = DesignSystem.createButton({
        label: 'Publish',
        variant: 'subtitle',
        leadingIcon: 'globe',
        id: 'floating-publish-btn',
        tooltip: 'Publish to Web',
        onClick: (e) => {
          this._togglePublishConfig({ event: e, anchor: this._publishBtn });
        }
      });
    } else {
      // Published Combo Button (Re-publish / Unpublish)
      this._publishBtn = DesignSystem.createComboButton({
        label: 'Re-publish',
        variant: 'subtitle', // Light variant even when published
        leadingIcon: 'globe',
        id: 'floating-publish-btn',
        tooltip: `Last published: ${new Date(info.updatedAt).toLocaleDateString()}`,
        mainAction: (e) => {
          this._togglePublishConfig({ event: e, anchor: this._publishBtn });
        },
        toggleTooltip: 'Publication Options',
        toggleAction: () => {
          DesignSystem.createMenu(this._publishBtn, [
            { 
              label: 'View Live Page', 
              icon: 'external-link', 
              onClick: () => window.open(info.url, '_blank')
            },
            { 
              label: 'Copy Public Link', 
              icon: 'link', 
              onClick: () => {
                navigator.clipboard.writeText(info.url);
                if (window.showToast) window.showToast('Public link copied');
              }
            },
            { divider: true },
            { 
              label: 'Unpublish (Local state)', 
              icon: 'trash-2', 
              danger: true,
              onClick: () => {
                DesignSystem.showConfirm({
                  title: 'Clear Publish State?',
                  message: 'This only removes the state from MDpreview. The page on the Worker will remain active unless deleted manually.',
                  onConfirm: async () => {
                    await window.PublishService.unpublish(file);
                    this._updatePublishButtonState();
                  }
                });
              }
            }
          ], { align: 'right' });
        }
      });
    }

    if (this._floatingGroup) {
      this._floatingGroup.appendChild(this._publishBtn);
      // Ensure visibility
      this._publishBtn.style.display = 'flex';
    }
  }

  /**
   * Toggles the Publish Configuration popover (no backdrop)
   */
  _togglePublishConfig(options = {}) {
    const { event, anchor } = options;
    if (window.PublishConfigComponent) {
      window.PublishConfigComponent.toggle({
        event,
        anchor,
        file: this.state.file,
        onPublished: (_url) => {
          this._updatePublishButtonState();
        }
      });
    }
  }


  // ── Context Menu & Actions ───────────────────────────────

  _handleContextMenu(e) {
    if (this.state.mode === 'edit') return;

    const items = [];
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    const hasSelection = selectedText.length > 0;

    // IMPORTANT: Capture selection data NOW while it still exists.
    // Clicking on context menu items often clears the selection.
    let capturedData = null;
    if (hasSelection) {
      capturedData = window.SyncService ? window.SyncService.captureReadViewSyncData() : null;
    }

    // 1. Selection Actions
    if (hasSelection && capturedData) {

      items.push({
        label: 'Add Comment',
        icon: 'message-circle-plus',
        onClick: () => {

          if (window.CommentsModule) {

            this._switchToMode('comment');
            // Wait for DOM to switch and module to activate
            setTimeout(() => {

              window.CommentsModule.externalTrigger(capturedData);
            }, 150);
          }
        }
      });
      items.push({
        label: 'Add to Collect',
        icon: 'bookmark',
        onClick: () => {

          if (window.CollectModule) {

            this._switchToMode('collect');
            window.CollectModule.addIdea(
              capturedData.selectedText, 
              capturedData.lineStart, 
              capturedData.lineEnd, 
              capturedData.selectedText
            );
          }
        }
      });
      items.push({
        label: 'Edit Selection',
        icon: 'pen-line',
        onClick: () => {
          this._switchToMode('edit', capturedData);
        }
      });
      items.push({ divider: true });
    } else if (hasSelection) {
      items.push({
        label: 'Edit Selection',
        icon: 'pen-line',
        onClick: () => {
          this._switchToMode('edit', capturedData);
        }
      });
      items.push({ divider: true });
    }

    // 2. Advanced Copy
    items.push({
      label: 'Copy as Markdown',
      icon: 'copy',
      onClick: () => {
        if (this.state.content) {
          navigator.clipboard.writeText(this.state.content);
          if (window.showToast) window.showToast('Markdown copied');
        }
      }
    });

    items.push({
      label: 'Copy for Google Docs',
      icon: 'file-text',
      onClick: () => this._handleGDocCopy()
    });

    items.push({
      label: 'Copy as File',
      icon: 'file-plus',
      onClick: () => this._handleCopyAsFile()
    });

    // 3. Mode Specific
    if (this.state.mode === 'comment') {
      items.push({ divider: true });
      items.push({
        label: 'Copy Comments Report',
        icon: 'clipboard-list',
        onClick: () => window.CommentsModule && window.CommentsModule.copyAll()
      });
      items.push({
        label: 'Clear All Comments',
        icon: 'trash',
        danger: true,
        onClick: () => window.CommentsModule && window.CommentsModule.clear()
      });
    }

    if (this.state.mode === 'collect') {
      items.push({ divider: true });
      items.push({
        label: 'Copy All Ideas',
        icon: 'clipboard-list',
        onClick: () => window.CollectModule && window.CollectModule.copyAll()
      });
      items.push({
        label: 'Clear All Ideas',
        icon: 'trash',
        danger: true,
        onClick: () => window.CollectModule && window.CollectModule.clearAll()
      });
    }

    DesignSystem.createContextMenu(e, items);
  }

  _switchToMode(mode, context = null) {
    if (context && window.AppState) {
      AppState.forceSyncContext = context;
    }
    const btn = document.querySelector(`.ds-segment-item[data-id="${mode}"]`);
    if (btn) {
      btn.click();
    } else if (window.AppState && window.AppState.onModeChange) {
      window.AppState.onModeChange(mode);
    }
  }

  async _handleCopyAsFile() {
    if (!window.electronAPI) return;

    try {
      let res;
      if (this.state.file) {
        // Case 1: Physical file on disk
        res = await window.electronAPI.copyFileToClipboard(this.state.file);
      } else if (this.state.content) {
        // Case 2: Draft/Generated content -> Copy as temp file
        const fileName = (window.AppState && window.AppState.activeTabName) 
          ? `${window.AppState.activeTabName}.md` 
          : 'Untitled.md';
        
        // Convert string to Uint8Array for the buffer
        const buffer = new TextEncoder().encode(this.state.content);
        res = await window.electronAPI.copyFileFromBuffer(buffer, fileName);
      }

      if (res && res.success) {
        if (window.showToast) window.showToast('File copied to clipboard');
      } else if (res) {
        throw new Error(res.error);
      }
    } catch (err) {
      console.error('[DEBUG] Copy as File failed:', err);
      if (window.showToast) window.showToast(`Copy failed: ${err.message}`, 'error');
    }
  }

  async _handleGDocCopy() {
    if (!this.state.html) return;

    if (window.showToast) {
      window.showToast('Preparing smart copy...', 'info', { id: 'gdoc-copy', sticky: true, progress: 0 });
    }
    
    try {
       const previewInner = this.viewport.querySelector('.md-content-inner');
       const sourceHtml = previewInner ? previewInner.innerHTML : this.state.html;

       const result = await window.GDocUtil.transform(sourceHtml, this.mount);
       const transformedHtml = result.html;
       
       const html = `<div style="font-family: sans-serif; color: #24292e;">${transformedHtml}</div>`;
       
       if (window.electronAPI && typeof window.electronAPI.writeClipboardAdvanced === 'function') {
         const res = await window.electronAPI.writeClipboardAdvanced({
           html: html,
           text: this.state.content || ''
         });
         if (res.success) {
           if (window.showToast) {
             const msg = result.totalCount > 0 
               ? `Smart copy ready! (${result.successCount}/${result.totalCount} charts)`
               : 'Smart copy for GDocs ready!';
             const type = result.failCount > 0 ? 'warn' : 'success';
             window.showToast(msg, type, { id: 'gdoc-copy' });
           }
         } else {
           throw new Error(res.error);
         }
       } else {
         // Fallback to simple clipboard
         await navigator.clipboard.write([
            new ClipboardItem({
              "text/html": new Blob([html], { type: "text/html" }),
              "text/plain": new Blob([this.state.content || ''], { type: "text/plain" })
            })
         ]);
         if (window.showToast) window.showToast('Smart copy ready! (Browser)', 'success', { id: 'gdoc-copy' });
       }
    } catch (err) {
       console.error('[DEBUG] GDoc copy failed:', err);
       if (window.showToast) window.showToast('Failed to prepare smart copy', 'error', { id: 'gdoc-copy' });
    }
  }

  _renderEditFloatingActions() {
    if (!this._floatingGroup) return;

    // 1. Import (Replace) Button
    this._editImportBtn = DesignSystem.createButton({
      variant: 'subtitle',
      offLabel: true,
      leadingIcon: 'file-text',
      title: 'Import (Replace all)',
      className: 'floating-import-btn'
    });

    this._editImportBtn.onclick = async (e) => {
      e.stopPropagation();
      const paths = await window.FileService.openFiles({ 
        properties: ['openFile'],
        filters: [{ name: 'Markdown', extensions: ['md'] }]
      });

      if (paths && paths[0]) {
        try {
          const res = await window.electronAPI.readFile(paths[0]);
          if (!res.success) throw new Error(res.error || 'Failed to read file');
          
          if (res.content !== undefined) {
            const isDirty = EditorModule.isDirty();
            if (isDirty) {
              DesignSystem.showConfirm({
                title: 'Overwrite Content?',
                message: 'Your current changes will be replaced. Continue?',
                onConfirm: () => {
                  EditorModule.insertContent(res.content, 'replace');
                  if (window.showToast) window.showToast('Content imported');
                }
              });
            } else {
              EditorModule.insertContent(res.content, 'replace');
              if (window.showToast) window.showToast('Content imported');
            }
          }
        } catch (err) {
          if (window.showToast) window.showToast(`Import failed: ${err.message}`, 'error');
        }
      }
    };

    // 2. Append Button
    this._editAppendBtn = DesignSystem.createButton({
      variant: 'subtitle',
      offLabel: true,
      leadingIcon: 'file-plus',
      title: 'Import (Append to end)',
      className: 'floating-append-btn'
    });

    this._editAppendBtn.onclick = async (e) => {
      e.stopPropagation();
      const paths = await window.FileService.openFiles({ 
        properties: ['openFile'],
        filters: [{ name: 'Markdown', extensions: ['md'] }]
      });

      if (paths && paths[0]) {
        try {
          const res = await window.electronAPI.readFile(paths[0]);
          if (!res.success) throw new Error(res.error || 'Failed to read file');
          
          if (res.content !== undefined) {
            EditorModule.insertContent(res.content, 'append');
            if (window.showToast) window.showToast('Content appended to end');
          }
        } catch (err) {
          if (window.showToast) window.showToast(`Append failed: ${err.message}`, 'error');
        }
      }
    };

    this._floatingGroup.appendChild(this._editImportBtn);
    this._floatingGroup.appendChild(this._editAppendBtn);
  }

  _updateTOC() {
    if (this._tocUpdateTimeout) clearTimeout(this._tocUpdateTimeout);
    
    // Only update TOC in non-edit modes
    if (this.state.mode === 'edit') return;

    this._tocUpdateTimeout = setTimeout(() => {
      if (TOCComponent && this.viewport) {
        const isSkeleton = !!(this.state.html && this.state.html.includes('skeleton-text'));
        const input = this.viewport.querySelector('.md-render-body') || this.viewport;
          
        TOCComponent.update(input, { 
          mode: this.state.mode, 
          isSkeleton: isSkeleton 
        });
      }
      this._tocUpdateTimeout = null;
    }, 800);
  }

  // ── Public API for Shortcuts ─────────────────────────────

  copyMarkdown() {
    if (this.state.content) {
      navigator.clipboard.writeText(this.state.content);
      if (window.showToast) window.showToast('Full Markdown copied');
    }
  }

  copyAsFile() {
    this._handleCopyAsFile();
  }

  copyForGDocs() {
    this._handleGDocCopy();
  }

  toggleTOC() {
    if (TOCComponent) TOCComponent.toggle(this.mount);
  }

  toggleProjectMap() {
    if (TOCComponent) {
      if (!TOCComponent.isVisible()) {
        TOCComponent.show(this.mount);
        TOCComponent.switchView('map');
      } else {
        if (TOCComponent.getActiveView() === 'map') {
          TOCComponent.hide();
        } else {
          TOCComponent.switchView('map');
        }
      }
    }
  }
}

/* ── MarkdownEmptyState ── */
class MarkdownEmptyState {
  constructor({ mount }) {
    this.mount = mount;
    this.render();
  }

  render() {
    const container = DesignSystem.createElement('div', 'empty-state', { id: 'empty-state' });
    container.innerHTML = `
      <div class="illus-wrap">
        <img src="../assets/Central Illustration.png" alt="MDpreview Welcome" class="center-illus">
      </div>
      <div class="empty-state-text">
        <h2>MDpreview</h2>
        <p>Select a Markdown file from the sidebar or<br>click the workspace switcher to get started.</p>
      </div>
    `;
    this.mount.appendChild(container);
  }
}

/* ── MarkdownPreview ── */
class MarkdownPreview {
  constructor({ mount, html, file }) {
    this.mount = mount;
    this.html = html;
    this.file = file;
    this.render();
  }

  render() {
    const container = DesignSystem.createElement('div', 'md-content md-render-body', { id: 'md-content' });
    const inner = DesignSystem.createElement('div', 'md-content-inner');
    inner.innerHTML = this.html;
    
    container.appendChild(inner);
    this.mount.appendChild(container);

    // Post-render integration (Small delay to ensure DOM is ready for calculations)
    if (ScrollModule) {
      ScrollModule.setContainer(this.mount, this.file);
      ScrollModule.restore(this.file);
    }
    
    // Mermaid and CodeBlocks still benefit from a frame delay for layout
    requestAnimationFrame(() => {
      try {
        if (window.processMermaid) window.processMermaid(inner);
      } catch (_e) { /* Mermaid error - gracefully skip */ }
      try {
        if (window.CodeBlockModule) window.CodeBlockModule.process(inner);
      } catch (_e) { /* CodeBlock error - gracefully skip */ }
    });
  }

  update({ html }) {
    this.html = html;
    const inner = this.mount.querySelector('.md-content-inner');
    if (inner) {
      inner.innerHTML = html;
      
      // Re-process for live updates (e.g. Drafts)
      if (window.processMermaid) window.processMermaid(inner);
      if (window.CodeBlockModule) window.CodeBlockModule.process(inner);

      // Ensure scroll is maintained if content size changed
      if (ScrollModule) {
        ScrollModule.restore(this.file);
      }

      // Sync TOC on live update
      const viewer = MarkdownViewer.getInstance();
      if (viewer && viewer._updateTOC) viewer._updateTOC();
    }
  }
}

/* ── MarkdownEditor ── */
class MarkdownEditor {
  constructor({ mount, content, file }) {
    this.mount = mount;
    this.content = content;
    this.file = file;
    this.render();
  }

  render() {
    const container = DesignSystem.createElement('div', 'edit-viewer', { id: 'edit-viewer' });
    
    const textarea = DesignSystem.createElement('textarea', '', { 
      id: 'edit-textarea', 
      placeholder: 'Start writing...' 
    });
    textarea.value = this.content;
    
    container.appendChild(textarea);
    this.mount.appendChild(container);
  }

  activate() {
    const textarea = this.mount.querySelector('#edit-textarea');
    if (textarea) {
      // Initialize Editor Logic
      if (EditorModule) {
        EditorModule.bindToElement(textarea);
      }

      // Tell ScrollModule to watch the textarea
      if (ScrollModule) {
        ScrollModule.setContainer(textarea, this.file);
        ScrollModule.restore(this.file);
      }

      // Restore cursor if context exists in AppState
      const ctx = window.AppState && window.AppState.lastSyncContext;
      if (ctx && (ctx.line || ctx.scrollPct) && MarkdownLogicService) {
        MarkdownLogicService.syncCursor(textarea, ctx);
        window.AppState.lastSyncContext = null;
      }
    }
  }

  deactivate() {
    if (EditorModule) {
      EditorModule.unbind();
    }
  }

  _switchTo(mode) {
    if (window.AppState && AppState.updateToolbarUI) {
      AppState.updateToolbarUI(mode);
    } else {
      const seg = document.querySelector(`.ds-segment-item[data-mode="${mode}"]`);
      if (seg) seg.click();
    }
  }

  async _save() {
    if (EditorModule) {
      const success = await EditorModule.save();
      if (success) this._switchTo('read');
    }
  }

  _handleCancel() {
    if (EditorModule) {
      EditorModule.revert();
    }
    this._switchTo('read');
  }

  update({ content }) {
    this.content = content;
    const textarea = this.mount.querySelector('#edit-textarea');
    if (textarea && textarea.value !== content) {
      // Syncing original content will update textarea.value AND preserve selection
      if (EditorModule) {
        EditorModule.setOriginalContent(content);
      } else {
        textarea.value = content;
      }
    }
  }

  destroy() {
    if (EditorModule) EditorModule.unbind();
  }
}

// Singleton Bridge
window.MarkdownViewer = (() => {
  let instance = null;
  return {
    init: (options) => {
      if (!instance) instance = new MarkdownViewerComponent(options);
      return instance;
    },
    getInstance: () => instance
  };
})();

```
</file>

<file path="renderer/js/components/organisms/publish-config-component.js">
```js
/* global DesignSystem, MenuShield */
/**
 * PublishConfigComponent
 * Purpose: A dedicated popover for configuring document publication settings.
 * Uses MenuShield for the floating UI.
 */
const PublishConfigComponent = (() => {
  'use strict';

  class PublishConfigComponent {
    constructor(options = {}) {
      this.file = options.file;
      this.onPublished = options.onPublished;
      this.container = null;
      this.state = {
        isLoading: false,
        info: window.PublishService ? window.PublishService.getPublishInfo(this.file) : null
      };
    }

    render() {
      if (!this.file) return null;

      this.container = DesignSystem.createElement('div', 'ds-publish-config-panel');
      this._renderContent();
      return this.container;
    }

    _renderContent() {
      if (!this.container) return;
      this.container.innerHTML = '';

      const { info, isLoading } = this.state;
      const fileName = this.file.split('/').pop().replace(/\.[^/.]+$/, "");
      const defaultSlug = info ? info.slug : fileName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);


      // 0. Header / Status Section
      if (info) {
        const workerUrl = window.AppState.settings.publishWorkerUrl || '';
        const baseUrl = workerUrl.replace(/\/publish\/?$/, '');
        const fullUrl = `${baseUrl}/${info.slug}`;

        const statusBadge = DesignSystem.createStatusBadge({
          text: `Live on the web since ${new Date(info.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`,
          variant: 'success',
          className: 'ds-publish-status-badge'
        });
        this.container.appendChild(statusBadge);

        // Display Full URL
        const urlGroup = DesignSystem.createInput({
          label: 'Public Address',
          description: 'Share this link with your audience.',
          value: fullUrl,
          readOnly: true,
          className: 'ds-input--link',
          action: {
            icon: 'copy',
            title: 'Copy Link',
            onClick: (e) => {
              navigator.clipboard.writeText(fullUrl);
              if (window.showToast) window.showToast('Link copied');
              const btn = e.currentTarget;
              if (btn && typeof btn.setIcon === 'function') {
                btn.setIcon('check');
                setTimeout(() => btn.setIcon('copy'), 2000);
              }
            }
          }
        });
        
        const urlInputEl = urlGroup.querySelector('input');
        if (urlInputEl) {
          urlInputEl.style.cursor = 'pointer';
          urlInputEl.onclick = () => window.open(fullUrl, '_blank');
          urlInputEl.title = 'Click to open link';
        }
        this.container.appendChild(urlGroup);
      } else {
        const isWorker = !!(window.AppState.settings.publishWorkerUrl && window.AppState.settings.publishAdminSecret);
        

        const engineBadge = DesignSystem.createStatusBadge({
          text: isWorker ? 'Ready to publish via Edge Worker' : 'Ready to publish via Handoff',
          variant: isWorker ? 'info' : 'warning',
          className: 'ds-publish-engine-badge'
        });
        this.container.appendChild(engineBadge);
      }

      // 1. Slug (Link) Field
      const slugField = DesignSystem.createInputGroup({
        label: 'Customize Link',
        description: 'Choose a simple, readable name for your URL.',
        inputOptions: {
          placeholder: 'my-awesome-document',
          value: defaultSlug,
          className: 'ds-publish-input',
          disabled: isLoading
        },
        action: {
          icon: 'copy',
          title: 'Copy Slug',
          onClick: (e) => {
            const val = slugField.value;
            navigator.clipboard.writeText(val);
            const btn = e.currentTarget;
            if (btn && typeof btn.setIcon === 'function') {
              btn.setIcon('check');
              setTimeout(() => btn.setIcon('copy'), 2000);
            }
            if (window.showToast) window.showToast('Slug copied');
          }
        }
      });
      this.slugInput = slugField;
      this.container.appendChild(slugField);

      // Listen for changes
      const input = slugField.querySelector('input');
      this.slugInputEl = input;
      if (input) {
        input.addEventListener('input', () => {
          if (this.state.isLoading) return;
          const raw = input.value;
          const clean = raw.toLowerCase().replace(/[^a-z0-9_-]/g, '-').substring(0, 100);
          
          if (raw !== clean) input.value = clean;
          this._checkSlug(clean);
        });
      }

      // Initial Check - SKIP IF LOADING
      if (!isLoading) {
        setTimeout(async () => {
          if (this.state.isLoading) return;
          if (info && info.slug) {
            const isStillThere = await window.PublishService.checkSlugAvailability(info.slug);
            if (isStillThere) {
              await window.PublishService.unpublish(this.file);
              this.setState({ info: null });
              return;
            }
          }
          this._checkSlug(defaultSlug);
        }, 100);
      }

      // 2. Password Field
      const passField = DesignSystem.createInput({
        label: 'Protect with Password',
        description: 'Restrict access to only those with the password.',
        type: 'password',
        placeholder: 'Leave blank to keep public',
        className: 'ds-publish-input',
        disabled: isLoading
      });
      this.passInput = passField;
      this.container.appendChild(passField);

      // 3. Actions
      const actions = DesignSystem.createElement('div', 'ds-publish-actions');
      const leftActions = DesignSystem.createElement('div', 'ds-publish-actions-left');
      leftActions.style.display = 'flex';
      leftActions.style.gap = '8px';

      if (info) {
        const unpublishBtn = DesignSystem.createButton({
          label: 'Remove from Web',
          variant: 'danger-ghost',
          disabled: isLoading,
          onClick: () => {
            DesignSystem.showConfirm({
              title: 'Remove Document?',
              message: 'This will take the document offline. The link will no longer work.',
              onConfirm: async () => {
                this.setState({ isLoading: true });
                await window.PublishService.unpublish(this.file);
                this.setState({ info: null, isLoading: false });
                if (this.onPublished) this.onPublished(null);
              }
            });
          }
        });
        leftActions.appendChild(unpublishBtn);
      }

      actions.appendChild(leftActions);

      const rightActions = DesignSystem.createElement('div', 'ds-publish-actions-right');
      const cancelBtn = DesignSystem.createButton({
        label: 'Cancel',
        variant: 'ghost',
        disabled: isLoading,
        onClick: () => window.MenuShield.close()
      });
      const publishBtn = DesignSystem.createButton({
        label: info ? 'Update Link' : 'Go Live',
        variant: 'primary',
        disabled: isLoading,
        onClick: async () => {
          const slug = this.slugInput.value.trim();
          const password = this.passInput.value.trim();
          
          const startTime = Date.now();
          
          publishBtn.setLoading(true);
          this.setState({ isLoading: true });

          try {
            const url = await window.PublishService.publish({ slug, password });
            
            const elapsed = Date.now() - startTime;
            if (elapsed < 1000) {
              await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
            }

            if (url) {
              const newInfo = window.PublishService.getPublishInfo(this.file);
              this.setState({ info: newInfo, isLoading: false });
              
              if (this.onPublished) {
                this.onPublished(url);
              }
            } else {
              this.setState({ isLoading: false });
            }
          } catch (err) {
            console.error('[PublishConfig] ERROR Publish:', err);
            this.setState({ isLoading: false });
          }
        }
      });
      
      if (isLoading) {
        publishBtn.setLoading(true);
      }

      rightActions.appendChild(cancelBtn);
      this.publishBtn = publishBtn;
      rightActions.appendChild(publishBtn);
      actions.appendChild(rightActions);
      
      this.container.appendChild(actions);
    }

    _checkSlug(slug) {
      if (this.state.isLoading) return;
      if (this._checkTimer) clearTimeout(this._checkTimer);

      if (!slug || slug.length < 1) {
        if (this.slugInput) this.slugInput.setStatus(null);
        if (this.publishBtn) this.publishBtn.disabled = true;
        return;
      }
      
      // Debounce everything to prevent flicker and redundant calls
      this._checkTimer = setTimeout(async () => {
        if (this.state.isLoading) return;
        
        // Source of truth: current input value
        const currentVal = this.slugInputEl ? this.slugInputEl.value : slug;
        if (currentVal !== slug) return;

        if (this.slugInput) {
          this.slugInput.setStatus({ text: 'Checking availability...', variant: 'info', isLoading: true });
        }

        try {
          const isAvailable = await window.PublishService.checkSlugAvailability(slug);
          
          // Re-verify after async call to handle rapid typing
          const finalVal = this.slugInputEl ? this.slugInputEl.value : slug;
          if (finalVal !== slug) return;

          if (!this.slugInput) return;

          const info = this.state.info;
          if (isAvailable) {
            this.slugInput.setStatus({ text: 'Slug is available', variant: 'success', icon: 'circle-check' });
            this.slugInput.setVariant('default');
            if (this.publishBtn) {
              this.publishBtn.disabled = false;
              this.publishBtn.setLabel(info ? 'Update Link' : 'Go Live');
            }
          } else {
            // If it's already published to THIS slug, it's fine (it's an update)
            if (info && info.slug === slug) {
              this.slugInput.setStatus({ text: 'Current slug (update mode)', variant: 'success', icon: 'circle-check' });
              this.slugInput.setVariant('default');
              if (this.publishBtn) {
                this.publishBtn.disabled = false;
                this.publishBtn.setLabel('Update Link');
              }
            } else {
              this.slugInput.setStatus({ text: 'Taken. Clicking Go Live will OVERWRITE.', variant: 'warning', icon: 'circle-x' });
              this.slugInput.setVariant('warning');
              if (this.publishBtn) {
                this.publishBtn.disabled = false;
                this.publishBtn.setLabel(info ? 'Update Link' : 'Go Live');
              }
            }
          }
        } catch (e) {
          console.error('Slug check failed:', e);
          if (this.slugInput) {
            this.slugInput.setStatus({ text: 'Could not verify slug', variant: 'warning' });
          }
        }
      }, 500);
    }

    setState(newState) {
      this.state = { ...this.state, ...newState };
      this._renderContent();
    }

    /**
     * Toggle the Publish Configuration UI
     * @param {Object} options
     */
    static toggle(options = {}) {
      const { event, anchor, file, onPublished } = options;
      
      if (MenuShield.active && MenuShield.active.element.classList.contains('ds-publish-config-shield')) {
        MenuShield.close();
        return;
      }

      const component = new PublishConfigComponent({ file, onPublished });
      const content = component.render();

      if (anchor) anchor.classList.add('is-active');

      MenuShield.open({
        event: event,
        anchor: anchor,
        title: 'Publish Configuration',
        content: content,
        className: 'ds-publish-config-shield',
        align: 'right',
        onClose: () => {
          if (anchor) anchor.classList.remove('is-active');
        }
      });


    }
  }

  return PublishConfigComponent;
})();

window.PublishConfigComponent = PublishConfigComponent;

```
</file>

<file path="renderer/js/components/organisms/publish-manager-component.js">
```js
/* global DesignSystem, BaseFormModal, PublishService */
/**
 * PublishManagerComponent
 * Purpose: List and delete all published slugs directly from the Worker KV.
 * Atomic Design System (Organism)
 */

class PublishManagerComponent {
  constructor(options = {}) {
    this.onChanged = options.onChanged || (() => {});
    this.slugs = [];
    this.isLoading = true;
  }

  render() {
    this.bodyContent = DesignSystem.createElement('div', 'ds-publish-manager');
    this.bodyContent.style.minHeight = '300px';
    this._loadAndRender();
    
    const closeBtn = DesignSystem.createButton({
      variant: 'primary',
      label: 'Close',
      onClick: () => this.closeAction()
    });

    const form = BaseFormModal.create({
      iconHtml: `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" 
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2H2v10" /><path d="M12 22H2V12" /><path d="M22 22H12V12" /><path d="M22 2h-10v10" />
        </svg>
      `,
      title: 'Global Publish Manager',
      subtitle: 'View and manage all active slugs on your Cloudflare Worker.',
      bodyContent: this.bodyContent,
      actions: [closeBtn]
    });

    return form;
  }

  async _loadAndRender() {
    this.bodyContent.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--ds-text-dim);">Loading published slugs...</div>';
    
    this.slugs = await PublishService.listAllPublished();
    this.isLoading = false;
    this._renderList();
  }

  _renderList() {
    this.bodyContent.innerHTML = '';
    
    if (this.slugs.length === 0) {
      this.bodyContent.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--ds-text-dim);">No published documents found on worker.</div>';
      return;
    }

    const list = DesignSystem.createElement('div', 'ds-publish-manager-list');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '8px';

    this.slugs.forEach(slug => {
      const row = DesignSystem.createElement('div', 'ds-publish-manager-item');
      row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--ds-white-a05); border-radius: var(--ds-radius-widget); border: 1px solid var(--ds-white-a10);';

      const info = DesignSystem.createElement('div');
      info.innerHTML = `
        <div style="font-weight: 600; color: var(--ds-text-primary); font-size: 13px;">${slug}</div>
        <div style="font-size: 11px; color: var(--ds-text-dim); margin-top: 2px;">Active on Edge</div>
      `;

      const actions = DesignSystem.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '8px';

      const renameBtn = DesignSystem.createButton({
        variant: 'ghost',
        leadingIcon: 'edit',
        title: 'Rename Slug',
        onClick: (e) => {
          if (e) e.stopPropagation();
          const newSlug = prompt('Enter new slug:', slug);
          if (newSlug && newSlug !== slug) {
            DesignSystem.showConfirm({
              title: 'Rename Slug?',
              message: `Change "/${slug}" to "/${newSlug.toLowerCase()}"? This will update the URL.`,
              onConfirm: async () => {
                const success = await PublishService.renameSlug(slug, newSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '-'));
                if (success) {
                  this._loadAndRender();
                  this.onChanged();
                } else {
                  if (window.showToast) window.showToast('Rename failed. Slug might be taken.', 'error');
                }
              }
            });
          }
        }
      });

      const deleteBtn = DesignSystem.createButton({
        variant: 'danger-ghost',
        leadingIcon: 'trash-2',
        title: 'Delete Slug',
        onClick: (e) => {
          if (e) e.stopPropagation();
          DesignSystem.showConfirm({
            title: 'Delete Slug?',
            message: `Are you sure you want to permanently delete "/${slug}" from the worker? This cannot be undone.`,
            onConfirm: async () => {
              const success = await PublishService.deleteSlug(slug);
              if (success) {
                this.slugs = this.slugs.filter(s => s !== slug);
                this._renderList();
                this.onChanged();
              }
            }
          });
        }
      });

      actions.appendChild(renameBtn);
      actions.appendChild(deleteBtn);
      row.appendChild(info);
      row.appendChild(actions);
      list.appendChild(row);
    });

    this.bodyContent.appendChild(list);
  }

  static open(options = {}) {
    const component = new PublishManagerComponent(options);
    const content = component.render();

    const popover = DesignSystem.createPopoverShield({
      content: content,
      width: '480px',
      showHeader: false
    });

    component.closeAction = () => popover.close();
    return popover;
  }
}

window.PublishManagerComponent = PublishManagerComponent;

```
</file>

<file path="renderer/js/components/organisms/publish-settings-form-component.js">
```js
/* global DesignSystem, BaseFormModal */
/**
 * PublishSettingsFormComponent
 * Purpose: Configure Cloudflare Worker and Handoff API settings
 * Atomic Design System (Organism)
 */

class PublishSettingsFormComponent {
  constructor(options = {}) {
    this.onConfirm = options.onConfirm || (() => { });
    this.onCancel = options.onCancel || (() => { });
    
    const s = window.AppState.settings;
    this.initialWorkerUrl = s.publishWorkerUrl || '';
    this.initialAdminSecret = s.publishAdminSecret || '';
    this.initialHandoffToken = s.handoffToken || '';
  }

  render() {
    const bodyContent = DesignSystem.createElement('div', 'ds-publish-settings-form');
    bodyContent.style.display = 'flex';
    bodyContent.style.flexDirection = 'column';
    bodyContent.style.gap = 'var(--ds-space-md)';

    // --- Section 1: Worker (Primary) ---
    const workerSection = DesignSystem.createElement('div', 'ds-form-section');
    workerSection.innerHTML = '<h3 style="margin: 0 0 12px 0; font-size: 14px; color: var(--ds-accent);">Self-Hosted Worker (Recommended)</h3>';
    
    const urlLabel = DesignSystem.createElement('label', 'ds-form-field-label', { text: 'WORKER URL' });
    this.urlInput = DesignSystem.createInput({
      placeholder: 'https://your-worker.yourdomain.workers.dev',
      value: this.initialWorkerUrl
    });

    const secretLabel = DesignSystem.createElement('label', 'ds-form-field-label', { text: 'ADMIN SECRET' });
    this.secretInput = DesignSystem.createInput({
      type: 'password',
      placeholder: 'Enter your worker admin secret...',
      value: this.initialAdminSecret
    });

    workerSection.appendChild(urlLabel);
    workerSection.appendChild(this.urlInput);
    workerSection.appendChild(secretLabel);
    workerSection.appendChild(this.secretInput);

    // Divider
    const divider = DesignSystem.createElement('div', 'ds-form-divider');
    divider.style.margin = '8px 0';

    // --- Section 2: Handoff (Legacy) ---
    const handoffSection = DesignSystem.createElement('div', 'ds-form-section');
    handoffSection.innerHTML = '<h3 style="margin: 0 0 12px 0; font-size: 14px; color: var(--ds-text-dim);">Legacy: Handoff.host</h3>';
    
    const tokenLabel = DesignSystem.createElement('label', 'ds-form-field-label', { text: 'HANDOFF API TOKEN' });
    this.tokenInput = DesignSystem.createInput({
      type: 'password',
      placeholder: 'Enter your Handoff Bearer token...',
      value: this.initialHandoffToken
    });

    handoffSection.appendChild(tokenLabel);
    handoffSection.appendChild(this.tokenInput);

    bodyContent.appendChild(workerSection);
    bodyContent.appendChild(divider);
    bodyContent.appendChild(handoffSection);

    // Actions
    const cancelBtn = DesignSystem.createButton({
      variant: 'ghost',
      label: 'Cancel',
      onClick: () => {
        this.closeAction();
        this.onCancel();
      }
    });

    this.confirmBtn = DesignSystem.createButton({
      variant: 'primary',
      label: 'Save Configuration',
      onClick: () => {
        const workerUrl = this.urlInput.value.trim();
        const adminSecret = this.secretInput.value.trim();
        const handoffToken = this.tokenInput.value.trim();
        
        window.SettingsService.update('publishWorkerUrl', workerUrl);
        window.SettingsService.update('publishAdminSecret', adminSecret);
        window.SettingsService.update('handoffToken', handoffToken);
        
        if (window.showToast) window.showToast('Publish settings updated');
        
        this.onConfirm();
        this.closeAction();
      }
    });

    const form = BaseFormModal.create({
      iconHtml: `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
        </svg>
      `,
      title: 'Publish Configuration',
      subtitle: 'Configure your self-hosted Cloudflare Worker or use legacy Handoff.host.',
      bodyContent: bodyContent,
      actions: [cancelBtn, this.confirmBtn]
    });

    setTimeout(() => this.urlInput.focus(), 100);

    return form;
  }

  static open(options = {}) {
    const component = new PublishSettingsFormComponent(options);
    const content = component.render();

    const popover = DesignSystem.createPopoverShield({
      content: content,
      width: '520px',
      showHeader: false,
      className: 'aws-popover-shield'
    });

    component.closeAction = () => popover.close();
    return popover;
  }
}

window.PublishSettingsFormComponent = PublishSettingsFormComponent;

```
</file>

<file path="renderer/js/components/organisms/right-sidebar.js">
```js
/* ============================================================
   organisms/right-sidebar.js — Unified Right Sidebar Organism
   Atomic Design System (Organism)
   ============================================================ */

class RightSidebarComponent {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.mount - Wrapper element
   * @param {string} options.storageKey - Key for localStorage width
   */
  constructor(options = {}) {
    this.mount = options.mount || document.getElementById('right-sidebar-wrap');
    this.storageKey = options.storageKey || 'mdpreview_sidebar_right_width';

    this.state = {
      isOpen: false,
      title: '',
      actions: [], // { id, icon, title, onClick }
      items: [],
      renderItem: null, // (item, index) => HTMLElement
      emptyState: { icon: '', text: '' },
      currentModuleId: null
    };

    this.isResizing = false;
    this.init();
  }

  init() {
    if (!this.mount) {
      console.warn('RightSidebarComponent: mount point not found.');
      return;
    }
    this._setupResizer();
  }

  /**
   * Configure and render a specific module
   */
  setupModule(config) {
    this.state = {
      isOpen: true,
      title: config.title || '',
      actions: config.actions || [],
      items: config.items || [],
      renderItem: config.renderItem || null,
      emptyState: config.emptyState || { icon: '', text: '' },
      currentModuleId: config.currentModuleId || null
    };
    this.render();
  }

  close() {
    this.state.isOpen = false;
    this.mount.classList.remove('open');
  }

  render() {
    if (!this.mount) return;

    // 1. Initial setup of static structure if not present
    if (!this.mount.querySelector('.ds-right-sidebar')) {
      this.mount.innerHTML = '';
      this.mount.className = 'ds-right-sidebar-wrap';

      const resizer = DesignSystem.createElement('div', 'ds-right-sidebar-resizer');
      this.mount.appendChild(resizer);
      this._attachResizerEvents(resizer);

      const sidebar = DesignSystem.createElement('aside', ['ds-right-sidebar', 'ds-sidebar-base']);
      sidebar.innerHTML = `
        <div class="ds-sidebar-header">
          <div class="ds-sidebar-title"></div>
          <div class="ds-sidebar-actions"></div>
        </div>
        <div class="ds-sidebar-content-wrap">
          <div class="ds-sidebar-list"></div>
        </div>
      `;
      this.mount.appendChild(sidebar);
    }

    const sidebarWrap = this.mount;
    const sidebar = sidebarWrap.querySelector('.ds-right-sidebar');
    const titleEl = sidebar.querySelector('.ds-sidebar-title');
    const actionsEl = sidebar.querySelector('.ds-sidebar-actions');
    const listEl = sidebar.querySelector('.ds-sidebar-list');
    const contentWrap = sidebar.querySelector('.ds-sidebar-content-wrap');

    // 2. Update Classes & Width
    sidebarWrap.classList.toggle('open', this.state.isOpen);
    if (this.state.isOpen) {
      const savedWidth = localStorage.getItem(this.storageKey);
      if (savedWidth) {
        sidebarWrap.style.setProperty('--sidebar-right-width', savedWidth + 'px');
      }
    }

    // 3. Update Header
    titleEl.textContent = this.state.title;
    actionsEl.innerHTML = '';
    this.state.actions.forEach(action => {
      const btn = DesignSystem.createHeaderAction(action.icon, action.title, (e) => {
        e.stopPropagation();
        action.onClick();
      }, action.id);
      actionsEl.appendChild(btn);
    });

    // 4. Update List Content
    listEl.innerHTML = '';
    // Clear previous empty state if any
    const existingEmpty = contentWrap.querySelector('.ds-sidebar-empty');
    if (existingEmpty) existingEmpty.remove();

    if (this.state.items.length === 0) {
      listEl.style.display = 'none';
      const empty = DesignSystem.createElement('div', 'ds-sidebar-empty');
      const iconHtml = DesignSystem.getIcon ? DesignSystem.getIcon(this.state.emptyState.icon) : this.state.emptyState.icon;

      empty.innerHTML = `
        <div class="ds-sidebar-empty-icon">${iconHtml}</div>
        <p>${this.state.emptyState.text}</p>
      `;
      contentWrap.appendChild(empty);
    } else {
      listEl.style.display = 'block';
      this.state.items.forEach((item, index) => {
        if (this.state.renderItem) {
          const itemEl = this.state.renderItem(item, index);
          listEl.appendChild(itemEl);
        }
      });
    }
  }

  // ── Private Helpers ──

  _setupResizer() {
    // Logic is handled in render and _attachResizerEvents
  }

  _attachResizerEvents(resizer) {
    resizer.addEventListener('mousedown', (_e) => {
      this.isResizing = true;
      resizer.classList.add('is-resizing');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    // We use window listeners to catch mouse move outside the sidebar
    const onMove = (e) => {
      if (!this.isResizing) return;
      const width = window.innerWidth - e.clientX;
      if (width >= 240 && width <= 600) {
        this.mount.style.setProperty('--sidebar-right-width', width + 'px');
      }
    };

    const onUp = () => {
      if (!this.isResizing) return;
      this.isResizing = false;
      resizer.classList.remove('is-resizing');
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';

      const currentWidth = parseInt(getComputedStyle(this.mount).getPropertyValue('--sidebar-right-width'));
      if (currentWidth) {
        localStorage.setItem(this.storageKey, currentWidth);
        if (typeof AppState !== 'undefined') {
          AppState.settings.rightSidebarWidth = currentWidth;
          if (AppState.savePersistentState) AppState.savePersistentState();
        }
      }

      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }
}

// Singleton bridge
window.RightSidebar = (() => {
  let instance = null;
  return {
    init: (options) => {
      if (!instance) instance = new RightSidebarComponent(options);
      return instance;
    },
    getInstance: () => instance
  };
})();

```
</file>

<file path="renderer/js/components/organisms/search-palette.js">
```js
/* global SearchService, DesignSystem */
/**
 * SearchPaletteComponent — Global Quick Open Palette (Organism)
 * Purpose: Provide a floating search interface for fast file navigation.
 * Dependencies: DesignSystem, SearchService, TreeModule
 */
const SearchPalette = (() => {
  'use strict';

  let _overlay = null;
  let _input = null;
  let _resultsContainer = null;
  let _isOpen = false;
  let _results = [];
  let _selectedIndex = -1;
  let _searchTimeout = null;
  let _searchMode = 'all'; // all, file, directory, shortcut

  /**
   * Initialize DOM structure
   */
  function _init() {
    if (_overlay) return;

    // Create Overlay and Box using DesignSystem
    _overlay = DesignSystem.createElement('div', 'ds-search-palette-overlay');
    const box = DesignSystem.createElement('div', 'ds-search-palette-box');

    // ── Header ──
    const header = DesignSystem.createElement('div', 'palette-header');
    const icon = DesignSystem.createElement('div', 'palette-icon', {
      html: DesignSystem.getIcon('search')
    });
    const badgeContainer = DesignSystem.createElement('div', 'palette-badge-container');

    _input = DesignSystem.createElement('input', 'palette-input', {
      type: 'text',
      placeholder: 'Search files and folders...',
      spellcheck: 'false',
      autocomplete: 'off'
    });

    header.append(icon, badgeContainer, _input);

    // ── Options Bar ──
    const options = DesignSystem.createElement('div', 'palette-options');

    const btnAll = DesignSystem.createButton({ label: '/1  Files & Folders', variant: 'subtitle', className: 'is-active' });
    btnAll.dataset.mode = 'all';

    const btnFiles = DesignSystem.createButton({ label: '/2  Files', variant: 'subtitle' });
    btnFiles.dataset.mode = 'file';

    const btnFolders = DesignSystem.createButton({ label: '/3  Folders', variant: 'subtitle' });
    btnFolders.dataset.mode = 'directory';

    const btnShortcuts = DesignSystem.createButton({ label: '/4  Shortcuts', variant: 'subtitle' });
    btnShortcuts.dataset.mode = 'shortcut';

    options.append(btnAll, btnFiles, btnFolders, btnShortcuts);

    // ── Results & Footer ──
    _resultsContainer = DesignSystem.createElement('div', 'palette-results');

    const footer = DesignSystem.createElement('div', 'palette-footer');
    footer.innerHTML = `
      <span><kbd class="ds-kbd ds-kbd--raised">↑</kbd><kbd class="ds-kbd ds-kbd--raised">↓</kbd> Navigate</span>
      <span><kbd class="ds-kbd ds-kbd--raised">↵</kbd> Open</span>
      <span><kbd class="ds-kbd ds-kbd--raised">esc</kbd> Close</span>
    `;

    // Assembly
    box.append(header, options, _resultsContainer, footer);
    _overlay.appendChild(box);
    document.body.appendChild(_overlay);

    // Apply smart scroll mask
    if (window.UIUtils) {
      window.UIUtils.applySmartScrollMask(_resultsContainer);
    }

    _attachListeners();
  }

  function _attachListeners() {
    // Close on backdrop click
    _overlay.addEventListener('mousedown', (e) => {
      if (e.target === _overlay) hide();
    });

    _input.addEventListener('input', (e) => {
      const value = e.target.value;

      // Slash Command Check
      const commands = { '/1 ': 'all', '/2 ': 'file', '/3 ': 'directory', '/4 ': 'shortcut' };
      for (const cmd in commands) {
        if (value.startsWith(cmd)) {
          _setSearchMode(commands[cmd]);
          _input.value = value.slice(cmd.length);
          _onSearch(_input.value);
          return;
        }
      }

      clearTimeout(_searchTimeout);
      _searchTimeout = setTimeout(() => {
        _onSearch(_input.value);
      }, 150);
    });

    _input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        hide();
      }

      // Backspace at the start to reset mode
      if (e.key === 'Backspace' && _input.selectionStart === 0 && _input.selectionEnd === 0 && _searchMode !== 'all') {
        e.preventDefault();
        _setSearchMode('all');
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        _moveSelection(1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        _moveSelection(-1);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        _openSelected();
      }
    });

    // Option button clicks
    _overlay.querySelectorAll('.ds-btn[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        _setSearchMode(btn.dataset.mode);
        _input.focus();
      });
    });
  }

  function _setSearchMode(mode) {
    if (_searchMode === mode) return;
    _searchMode = mode;

    // Update Badge UI
    const badgeContainer = _overlay.querySelector('.palette-badge-container');
    if (mode === 'all') {
      badgeContainer.innerHTML = '';
    } else {
      const labels = { 'file': 'Files', 'directory': 'Folders', 'shortcut': 'Shortcuts' };
      badgeContainer.innerHTML = `<div class="palette-badge">${labels[mode] || mode}</div>`;
    }

    // Toggle wide mode for shortcuts
    const box = _overlay.querySelector('.ds-search-palette-box');
    if (box) {
      box.classList.toggle('is-shortcut-mode', mode === 'shortcut');
    }

    // Update Options UI
    _overlay.querySelectorAll('.ds-btn[data-mode]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.mode === mode);
    });

    // Update Placeholder
    const placeholders = {
      'all': 'Search files and folders...',
      'file': 'Search files by name...',
      'directory': 'Search folders by name...',
      'shortcut': 'Search keyboard shortcuts...'
    };
    _input.placeholder = placeholders[mode] || 'Search...';

    _onSearch(_input.value);
  }

  /**
   * Handle searching logic
   */
  function _onSearch(query) {
    if (!query) {
      if (_searchMode === 'shortcut') {
        _results = SearchService.searchShortcuts('');
        _selectedIndex = -1;
        _renderResults('');
        return;
      }

      const recentPaths = window.RecentlyViewedModule ? window.RecentlyViewedModule.getRecentFiles() : [];
      const mapped = recentPaths.map(path => {
        const isFile = path.includes('.') || path.includes('README');
        return {
          path,
          name: path.split(/[/\\]/).pop(),
          isRecent: true,
          type: isFile ? 'file' : 'directory'
        };
      });

      if (_searchMode === 'file') {
        _results = mapped.filter(r => r.type === 'file');
      } else if (_searchMode === 'directory') {
        _results = mapped.filter(r => r.type === 'directory');
      } else {
        _results = mapped;
      }
      _selectedIndex = -1;
      _renderResults('');
      return;
    }

    const treeData = window.TreeModule ? window.TreeModule.getTreeData() : [];
    _results = _searchMode === 'shortcut' ? SearchService.searchShortcuts(query) : SearchService.search(query, treeData, _searchMode);
    _selectedIndex = _results.length > 0 ? 0 : -1;
    _renderResults(query);
  }

  function _moveSelection(dir) {
    if (_results.length === 0) return;
    _selectedIndex = (_selectedIndex + dir + _results.length) % _results.length;
    _updateSelectionUI();
  }

  function _updateSelectionUI() {
    const items = _resultsContainer.querySelectorAll('.palette-item');
    items.forEach((item, idx) => {
      item.classList.toggle('selected', idx === _selectedIndex);
      if (idx === _selectedIndex) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function _openSelected() {
    if (_selectedIndex >= 0 && _results[_selectedIndex]) {
      const item = _results[_selectedIndex];

      // Handle Shortcut Execution
      if (item.type === 'shortcut') {
        if (window.ShortcutsComponent && window.ShortcutsComponent.executeAction) {
          window.ShortcutsComponent.executeAction(item.id);
        }
        hide();
        return;
      }

      if (window.TreeModule) {
        // Reveal and Highlight behavior for both files and folders
        window.TreeModule.setActiveFile(item.path);
      }
      hide();
    }
  }

  /**
   * Render results with highlighting
   */
  function _renderResults(query) {
    _resultsContainer.innerHTML = '';
    _resultsContainer.classList.toggle('is-empty', _results.length === 0);

    if (_results.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'palette-empty-state';

      const labels = {
        'all': { item: 'items', recent: 'items' },
        'file': { item: 'files', recent: 'files' },
        'directory': { item: 'folders', recent: 'folders' },
        'shortcut': { item: 'shortcuts', recent: 'shortcuts' }
      };
      const ctx = labels[_searchMode] || { item: 'items', recent: 'items' };

      const icon = DesignSystem.getIcon('search-x');
      const title = query ? `No ${ctx.item} found` : `No recent ${ctx.recent}`;
      const desc = query
        ? `We couldn't find any ${ctx.item} matching "${query}"`
        : `Your recently accessed ${ctx.recent} will appear here.`;

      emptyState.innerHTML = `
        <div class="empty-state-icon">${icon}</div>
        <div class="empty-state-title">${title}</div>
        <div class="empty-state-desc">${desc}</div>
      `;
      _resultsContainer.appendChild(emptyState);
      _updateMorphHeight();
      return;
    }

    // ── Grouped Shortcuts Mode (No Query) ──
    if (_searchMode === 'shortcut' && !query) {
      const grouped = {};
      _results.forEach(item => {
        if (!grouped[item.group]) grouped[item.group] = [];
        grouped[item.group].push(item);
      });

      let itemIndex = 0;
      let sectionIndex = 0;
      for (const groupTitle in grouped) {
        if (sectionIndex > 0) {
          const divider = document.createElement('div');
          divider.className = 'palette-divider';
          _resultsContainer.appendChild(divider);
        }

        const header = document.createElement('div');
        header.className = 'palette-section-header';
        header.textContent = groupTitle;
        _resultsContainer.appendChild(header);

        grouped[groupTitle].forEach(itemData => {
          const itemEl = _createShortcutItem(itemData, itemIndex, query);
          _resultsContainer.appendChild(itemEl);
          itemIndex++;
        });
        sectionIndex++;
      }
      _updateMorphHeight();
      return;
    }

    // ── Flat List Render (Files or Searched Shortcuts) ──
    if (!query && _results.some(r => r.isRecent)) {
      const header = document.createElement('div');
      header.className = 'palette-section-header';
      const labels = { 'file': 'Recent Files', 'directory': 'Recent Folders', 'all': 'Recent Items' };
      header.textContent = labels[_searchMode] || 'Recent Items';
      _resultsContainer.appendChild(header);
    } else if (query) {
      const header = document.createElement('div');
      header.className = 'palette-section-header';
      header.textContent = `${_results.length} ${_results.length === 1 ? 'result' : 'results'}`;
      _resultsContainer.appendChild(header);
    }

    _results.forEach((itemData, idx) => {
      if (itemData.type === 'shortcut') {
        _resultsContainer.appendChild(_createShortcutItem(itemData, idx, query));
        return;
      }

      const item = document.createElement('div');
      item.className = 'palette-item';
      if (idx === _selectedIndex) item.classList.add('selected');

      const highlightedName = query ? _getHighlightedText(itemData.name, itemData.matchedIndices) : itemData.name;
      const icon = DesignSystem.getIcon(itemData.type === 'directory' ? 'folder' : 'file');
      const smartPath = _formatSmartPath(itemData.path);

      item.innerHTML = `
        <div class="palette-icon">${icon}</div>
        <div class="palette-item-info">
          <div class="palette-item-name">${highlightedName}</div>
          <div class="palette-item-path">${smartPath}</div>
        </div>
      `;

      item.onclick = () => {
        _selectedIndex = idx;
        _openSelected();
      };

      _resultsContainer.appendChild(item);
    });

    _updateMorphHeight();
  }

  /**
   * Updates the palette box height based on actual scroll content
   */
  function _updateMorphHeight() {
    requestAnimationFrame(() => {
      const box = _overlay.querySelector('.ds-search-palette-box');
      if (box) {
        const header = box.querySelector('.palette-header');
        const options = box.querySelector('.palette-options');
        const footer = box.querySelector('.palette-footer');
        const results = box.querySelector('.palette-results');
        
        // Sum of children is more reliable than box.scrollHeight (which shrinks due to borders)
        const headerH = header ? header.offsetHeight : 0;
        const optionsH = options ? options.offsetHeight : 0;
        const footerH = footer ? footer.offsetHeight : 0;
        const resultsH = results ? results.scrollHeight : 0;
        
        // Total = children + 2px border
        const contentHeight = headerH + optionsH + footerH + resultsH + 2;
        const maxLimit = _searchMode === 'shortcut' ? 800 : 600;
        const targetH = Math.min(contentHeight, maxLimit);
        
        box.style.setProperty('--_target-h', `${targetH}px`);
      }
    });
  }

  /**
   * Helper to create a shortcut result item
   */
  function _createShortcutItem(itemData, idx, query) {
    const item = document.createElement('div');
    item.className = 'palette-item shortcut-item';
    if (idx === _selectedIndex) item.classList.add('selected');

    const highlightedLabel = query ? _getHighlightedText(itemData.label, itemData.matchedIndices) : itemData.label;
    const icon = DesignSystem.getIcon(itemData.icon || 'keyboard');

    const keysHtml = itemData.keys.map(key => {
      let keyText = key;
      const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform) || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');
      if (isMac && key === 'Ctrl') keyText = '⌘';
      if (isMac && key === 'Shift') keyText = '⇧';
      if (isMac && key === 'Option') keyText = '⌥';
      if (isMac && key === 'Backspace') keyText = '⌫';
      return `<kbd class="ds-kbd">${keyText}</kbd>`;
    }).join('');

    item.innerHTML = `
      <div class="palette-icon">${icon}</div>
      <div class="palette-item-info">
        <div class="palette-item-name">${highlightedLabel}</div>
        <div class="palette-item-keys">${keysHtml}</div>
      </div>
    `;

    item.onclick = () => {
      _selectedIndex = idx;
      _openSelected();
    };

    return item;
  }

  /**
   * Format path to show only the last few parts if it's too long
   */
  function _formatSmartPath(path) {
    const parts = path.split('/');
    if (parts.length <= 3) return path;
    return `.../${parts.slice(-3).join('/')}`;
  }

  /**
   * Apply bold highlighting to matched characters
   */
  function _getHighlightedText(text, indices) {
    if (!indices || indices.length === 0) return text;

    const chars = text.split('');
    const indexSet = new Set(indices);

    return chars.map((c, i) => indexSet.has(i) ? `<b>${c}</b>` : c).join('');
  }

  // ============================================
  // Public API
  // ============================================
  function show(mode = 'all') {
    _init();
    _isOpen = true;
    _overlay.classList.add('open');
    document.body.classList.add('is-searching');
    _input.value = '';
    _results = [];
    _selectedIndex = -1;
    _setSearchMode(mode);
    _onSearch('');

    // Smooth focus
    setTimeout(() => _input.focus(), 50);
  }

  function hide() {
    _isOpen = false;
    if (_overlay) {
      _overlay.classList.remove('open');
      const box = _overlay.querySelector('.ds-search-palette-box');
      if (box) box.style.setProperty('--_target-h', '58px');
    }
    document.body.classList.remove('is-searching');
    if (_resultsContainer) _resultsContainer.scrollTop = 0;
    if (_input) _input.blur();
  }

  return {
    init: _init,
    show,
    hide,
    toggle: () => _isOpen ? hide() : show(),
    isOpen: () => _isOpen
  };
})();

// Explicit export to global scope
window.SearchPalette = SearchPalette;

```
</file>

<file path="renderer/js/components/organisms/settings-component.js">
```js
/* global DesignSystem, SettingRow, SettingsService, AppState, SwitchToggleModule, showToast, PublishSettingsFormComponent, PublishManagerComponent */
/* ══════════════════════════════════════════════════
   SettingsComponent.js — Settings View Organism
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class SettingsComponent {
  constructor(options = {}) {
    this.options = {
      onClose: options.onClose || (() => { })
    };
    this.mount = null;
    this.popover = null;
  }

  /**
   * Main render function that returns the content element
   */
  render() {
    const container = DesignSystem.createElement('div', ['settings-container', 'settings-organism']);

    // 1. Appearance Group
    container.appendChild(this._createGroup('Appearance', [
      SettingRow.create({
        label: 'Accent Color',
        control: this._createColorSelector()
      })
    ]));

    // 2. Typography & Zoom Group
    container.appendChild(this._createGroup('Typography & Zoom', [
      SettingRow.create({
        label: 'Interface Font',
        control: this._createFontSelect('text')
      }),
      SettingRow.create({
        label: 'Editor Font',
        control: this._createFontSelect('code')
      }),
      SettingRow.create({
        label: 'Text Zoom',
        control: this._createZoomControl('text')
      }),
      SettingRow.create({
        label: 'Code Zoom',
        control: this._createZoomControl('code')
      })
    ]));

    // 3. Background Group
    const toggleEl = DesignSystem.createElement('div', 'switch-toggle');
    SwitchToggleModule.init({
      element: toggleEl,
      isOn: AppState.settings.bgEnabled,
      onChange: (val) => {
        if (typeof SettingsService !== 'undefined') {
          SettingsService.update('bgEnabled', val);
          this._updateGridVisibility(container, val);
        }
      }
    });

    container.appendChild(this._createGroup('Background', [
      SettingRow.create({
        label: 'Custom Background',
        control: toggleEl
      }),
      this._createBackgroundGridWrapper()
    ]));

    // Sync initial visibility
    this._updateGridVisibility(container, AppState.settings.bgEnabled);
    
    // 4. Integrations Group
    container.appendChild(this._createGroup('Integrations', [
      SettingRow.create({
        label: 'Publish Configuration',
        control: this._createTokenConfigButton()
      }),
      SettingRow.create({
        label: 'Publish Management',
        control: this._createManagementButton()
      })
    ]));

    return container;
  }

  _createTokenConfigButton() {
    const btn = DesignSystem.createButton({
      variant: 'subtitle',
      label: 'Config Publish',
      leadingIcon: 'settings-2',
      onClick: () => {
        if (typeof PublishSettingsFormComponent !== 'undefined') {
          PublishSettingsFormComponent.open({
            onConfirm: () => {
              // Re-render settings to update button label
              SettingsComponent.hide();
              setTimeout(() => SettingsComponent.open(), 50);
            }
          });
        }
      }
    });
    
    btn.style.height = '28px';
    btn.style.padding = '0 12px';
    btn.style.fontSize = '11px';

    return btn;
  }

  _createManagementButton() {
    const btn = DesignSystem.createButton({
      variant: 'subtitle',
      label: 'Manage Slugs',
      leadingIcon: 'layers',
      onClick: () => {
        if (typeof PublishManagerComponent !== 'undefined') {
          PublishManagerComponent.open();
        }
      }
    });
    
    btn.style.height = '28px';
    btn.style.padding = '0 12px';
    btn.style.fontSize = '11px';

    return btn;
  }

  // ── Helper Methods ──────────────────────────────────────

  _createGroup(title, children) {
    const group = DesignSystem.createElement('div', 'ds-popover-group');
    if (title) {
      group.appendChild(this._createSectionTitle(title));
    }

    children.forEach((child, index) => {
      group.appendChild(child);
      // Auto-insert divider between items, but not after the last item
      if (index < children.length - 1) {
        group.appendChild(this._createDivider());
      }
    });

    return group;
  }

  _createSectionTitle(text) {
    return DesignSystem.createElement('div', 'ds-popover-group-title', { text });
  }

  _createDivider() {
    return DesignSystem.createElement('div', 'setting-divider');
  }

  _createColorSelector() {
    const container = DesignSystem.createElement('div', 'color-selector');
    const accentColors = [
      { name: 'Orange', value: '#ffbf48' },
      { name: 'Red',    value: '#FF4500' },
      { name: 'Pink',   value: '#FF69B4' },
      { name: 'Purple', value: '#9370DB' },
      { name: 'Blue',   value: '#1E90FF' },
      { name: 'Teal',   value: '#40E0D0' },
      { name: 'Cyan',   value: '#00FFFF' },
      { name: 'Lime',   value: '#00FF00' },
      { name: 'Green',  value: '#ADFF2F' }
    ];

    accentColors.forEach(color => {
      const item = DesignSystem.createElement('div', 'color-item', {
        title: color.name
      });
      item.style.backgroundColor = color.value;
      if (color.value === AppState.settings.accentColor) item.classList.add('active');

      item.addEventListener('click', () => {
        if (typeof SettingsService !== 'undefined') {
          SettingsService.update('accentColor', color.value);
          container.querySelectorAll('.color-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
        }
      });

      container.appendChild(item);
    });

    return container;
  }

  _createFontSelect(type) {
    const fonts = type === 'text' ? [
      'System Default', 'Inter', 'Be Vietnam Pro', 'Roboto', 'Open Sans', 'Montserrat', 'Lato',
      'Source Sans 3', 'Noto Sans', 'Nunito', 'Raleway', 'Work Sans',
      'Quicksand', 'Barlow', 'Jost', 'Public Sans', 'Rubik', 'Kanit',
      'Outfit', 'Urbanist', 'Plus Jakarta Sans', 'Lexend', 'Syne',
      'Figtree', 'Manrope', 'DM Sans', 'Sora', 'Space Grotesk', 'Mulish',
      'Cabin', 'Titillium Web', 'Heebo', 'Karla', 'Libre Franklin', 'Arimo',
      'Varela Round', 'Commissioner', 'Epilogue', 'Archivo', 'Chivo', 'Bricolage Grotesk'
    ] : [
      'System Mono', 'Roboto Mono', 'Fira Code', 'JetBrains Mono', 'Source Code Pro',
      'Inconsolata', 'IBM Plex Mono', 'Ubuntu Mono', 'Space Mono',
      'Share Tech Mono', 'Victor Mono', 'Anonymous Pro', 'DM Mono',
      'PT Mono', 'Red Hat Mono', 'Sono', 'Spline Sans Mono', 'Xanh Mono',
      'Cousine', 'Nova Mono', 'Major Mono Display'
    ];

    let currentVal = type === 'text' ? AppState.settings.fontText : AppState.settings.fontCode;

    // Normalize display value if it's the system default
    if (type === 'text' && currentVal === 'var(--font-text-system)') currentVal = 'System Default';
    if (type === 'code' && currentVal === 'var(--font-code-system)') currentVal = 'System Mono';

    return DesignSystem.createSelect(fonts, currentVal, (val) => {
      if (typeof SettingsService !== 'undefined') {
        let fontVal = val;
        if (val === 'System Default') fontVal = 'var(--font-text-system)';
        if (val === 'System Mono') fontVal = 'var(--font-code-system)';
        SettingsService.update(type === 'text' ? 'fontText' : 'fontCode', fontVal);
      }
    });
  }

  _createZoomControl(type) {
    const ctrl = DesignSystem.createElement('div', 'setting-control-col');
    const currentVal = type === 'text' ? AppState.settings.textZoom : AppState.settings.codeZoom;

    const slider = DesignSystem.createElement('input', 'zoom-slider', {
      type: 'range',
      min: '50',
      max: '200',
      step: '5'
    });
    slider.value = currentVal || 100;

    const label = DesignSystem.createElement('span', 'zoom-val-label', {
      text: `${slider.value}%`
    });

    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      label.innerText = `${val}%`;
      if (typeof SettingsService !== 'undefined') {
        SettingsService.update(type === 'text' ? 'textZoom' : 'codeZoom', val);
      }
    });

    ctrl.appendChild(slider);
    ctrl.appendChild(label);
    return ctrl;
  }

  _createBackgroundGridWrapper() {
    const wrapper = DesignSystem.createElement('div', 'bg-grid-wrapper');
    wrapper.appendChild(this._createBackgroundGrid());
    return wrapper;
  }

  _createBackgroundGrid() {
    const bgGrid = DesignSystem.createElement('div', 'bg-image-grid');
    
    // 1. Upload Trigger
    const uploadItem = DesignSystem.createElement('div', ['bg-image-item', 'bg-new-image']);
    uploadItem.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span>New Image</span>
    `;
    const fileInput = DesignSystem.createElement('input', null, {
      type: 'file',
      accept: 'image/*',
      style: 'display: none;',
      multiple: true
    });
    uploadItem.appendChild(fileInput);

    uploadItem.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      
      for (const file of files) {
        const base64 = await this._toBase64(file);
        const added = SettingsService.addCustomBackground(base64);
        if (!added && typeof showToast === 'function') {
          showToast('Maximum 5 custom images allowed.', 'error');
          break;
        }
      }
      this._refreshGrid(bgGrid);
    });

    bgGrid.appendChild(uploadItem);

    // 2. Custom & Preset Images
    this._renderImageItems(bgGrid);

    return bgGrid;
  }

  _renderImageItems(container) {
    const customBgs = this._getCustomBgs();
    const presets = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop'
    ];

    [...customBgs, ...presets].forEach(src => {
      const item = DesignSystem.createElement('div', 'bg-image-item');
      if (src === AppState.settings.bgImage) item.classList.add('active');
      item.innerHTML = `<img src="${src}" alt="Background">`;

      item.addEventListener('click', () => {
        if (typeof SettingsService !== 'undefined') {
          SettingsService.update('bgImage', src);
          container.querySelectorAll('.bg-image-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
        }
      });
      container.appendChild(item);
    });
  }

  _refreshGrid(container) {
    // Keep only the first item (upload trigger)
    const trigger = container.querySelector('.bg-new-image');
    container.innerHTML = '';
    container.appendChild(trigger);
    this._renderImageItems(container);
  }

  _getCustomBgs() {
    return SettingsService.getCustomBackgrounds();
  }

  _toBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  _updateGridVisibility(container, enabled) {
    const wrapper = container.querySelector('.bg-grid-wrapper');
    if (wrapper) {
      wrapper.style.display = enabled ? 'block' : 'none';
    }
  }

  /**
   * Static instance to track open popover
   */
  static activeInstance = null;

  /**
   * Toggle the Settings UI (Singleton)
   */
  static toggle() {
    if (this.activeInstance) {
      this.activeInstance.close();
    } else {
      this.activeInstance = this.open();
    }
  }

  /**
   * Explicitly hide the Settings UI
   */
  static hide() {
    if (this.activeInstance) {
      this.activeInstance.close();
    }
  }

  /**
   * Open the Settings UI in a floating popover (No backdrop)
   */
  static open() {
    if (this.activeInstance) return this.activeInstance;

    const component = new SettingsComponent();
    const content = component.render();

    const popover = DesignSystem.createPopoverShield({
      title: 'Settings',
      content: content,
      hasBackdrop: false,
      alignment: 'bottom-left',
      className: 'settings-dynamic-popover',
      onClose: () => {
        SettingsComponent.activeInstance = null;
      }
    });

    this.activeInstance = popover;
    return popover;
  }
}

// Export for Design System
window.SettingsComponent = SettingsComponent;

```
</file>

<file path="renderer/js/components/organisms/shortcuts-component.js">
```js
/* ══════════════════════════════════════════════════
   ShortcutsComponent.js — Keyboard Guide Organism
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class ShortcutsComponent {
  constructor() {
    this.isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform) || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');
  }

  /**
   * Main render function that returns the content element
   */
  /**
   * Static source of truth for all shortcuts
   */
  /**
   * Static source of truth for all shortcuts
   */
  static getShortcutData(isMac) {
    const data = [
      {
        title: 'Navigation',
        items: [
          { id: 'mode-read', label: 'Switch to Read mode', keys: ['1'], icon: 'book-open', tags: ['view', 'preview', 'display', 'xem'] },
          { id: 'mode-edit', label: 'Switch to Edit mode', keys: ['2'], icon: 'pen-line', tags: ['write', 'editor', 'sửa'] },
          { id: 'mode-comment', label: 'Switch to Comment mode', keys: ['3'], icon: 'message-circle', tags: ['feedback', 'review', 'chú thích', 'góp ý'] },
          { id: 'mode-collect', label: 'Switch to Collect mode', keys: ['4'], icon: 'bookmark', tags: ['save', 'bookmark', 'favorite', 'thu thập'] },
          { id: 'toggle-sidebar', label: 'Toggle Sidebar', keys: ['Mod', 'B'], icon: 'panel-left', tags: ['navigation', 'panel', 'thanh bên'] },
          { id: 'focus-search', label: 'Focus Search', keys: ['Mod', 'P'], icon: 'search', tags: ['find', 'palette', 'tìm kiếm'] },
          { id: 'scroll-top', label: 'Scroll to Top', keys: ['Mod', '↑'], icon: 'arrow-up', tags: ['up', 'start', 'lên đầu'] },
          { id: 'scroll-bottom', label: 'Scroll to Bottom', keys: ['Mod', '↓'], icon: 'arrow-down', tags: ['down', 'end', 'xuống cuối'] },
          { id: 'toggle-fullscreen', label: 'Toggle Fullscreen', keys: isMac ? ['Mod', 'Shift', 'F'] : ['F11'], icon: 'maximize', tags: ['window', 'expand', 'toàn màn hình'] },
          { id: 'toggle-toc', label: 'Toggle Table of Contents', keys: ['Mod', 'Alt', 'T'], icon: 'list-tree', tags: ['outline', 'navigation', 'mục lục'] },
          { id: 'toggle-map', label: 'Toggle Project Map', keys: ['Mod', 'Alt', 'M'], icon: 'map', tags: ['mini-map', 'overview', 'bản đồ'] }
        ]
      },
      {
        title: 'Smart Copy',
        items: [
          { id: 'copy-markdown', label: 'Copy Markdown (Entire File)', keys: ['Mod', 'Shift', 'C'], icon: 'copy', tags: ['markdown', 'raw', 'sao chép'] },
          { id: 'copy-as-file', label: 'Copy as File', keys: ['Mod', 'Alt', 'C'], icon: 'file-stack', tags: ['export', 'clip', 'sao chép file'] },
          { id: 'copy-gdocs', label: 'Copy for Google Docs', keys: ['Mod', 'Alt', 'G'], icon: 'file-text', tags: ['gdoc', 'rich text', 'sao chép gdoc'] }
        ]
      },
      {
        title: 'Editor Actions',
        items: [
          { id: 'import-markdown', label: 'Import Markdown', keys: ['Mod', 'Alt', 'I'], icon: 'folder-input', tags: ['import', 'load', 'nhập file'] },
          { id: 'append-markdown', label: 'Append Markdown', keys: ['Mod', 'Alt', 'A'], icon: 'plus', tags: ['append', 'add', 'thêm file'] }
        ]
      },
      {
        title: 'Editor',
        items: [
          { id: 'save-file', label: 'Save File', keys: ['Mod', 'S'], icon: 'save', tags: ['persist', 'store', 'write', 'lưu'] },
          { id: 'undo', label: 'Undo', keys: ['Mod', 'Z'], icon: 'undo', tags: ['back', 'reverse', 'quay lại'] },
          { id: 'redo', label: 'Redo', keys: ['Mod', 'Y'], icon: 'redo', tags: ['forward', 'làm lại'] },
          { id: 'markdown-helper', label: 'Markdown Helper', keys: ['Mod', 'H'], icon: 'help-circle', tags: ['guide', 'syntax', 'trợ giúp'] }
        ]
      },
      {
        title: 'Tab Management',
        items: [
           { id: 'select-all-tabs', label: 'Select All Tabs', keys: ['Mod', 'A'], icon: 'check-square', tags: ['everything', 'chọn tất cả'] },
           { id: 'close-active-tab', label: 'Close Active Tab', keys: ['Mod', 'W'], icon: 'x', tags: ['exit', 'remove', 'đóng tab'] },
           { id: 'close-all-tabs', label: 'Close All Tabs', keys: ['Mod', 'Shift', 'W'], icon: 'x', tags: ['exit all', 'clear', 'đóng tất cả'] },
           { id: 'toggle-pin-tab', label: 'Toggle Pin Tab', keys: ['Mod', 'Shift', 'P'], icon: 'pin', tags: ['sticky', 'keep', 'ghim tab'] },
           { id: 'deselect-tabs', label: 'Deselect Tabs', keys: ['Esc'], icon: 'x', tags: ['clear selection', 'bỏ chọn'] },
           { id: 'range-selection', label: 'Range Selection', keys: ['Shift', 'Click'], isInformative: true, icon: 'mouse-pointer', tags: ['multi', 'bulk'] },
           { id: 'multi-selection', label: 'Multi-selection', keys: ['Mod', 'Click'], isInformative: true, icon: 'mouse-pointer', tags: ['individual', 'bulk'] }
         ]
       },
      {
        title: 'Sidebar & Workspace',
        items: [
          { id: 'new-file', label: 'New File', keys: ['Mod', 'N'], icon: 'file-plus', tags: ['create', 'add', 'tạo file'] },
          { id: 'new-folder', label: 'New Folder', keys: ['Mod', 'Shift', 'N'], icon: 'folder-plus', tags: ['create directory', 'tạo thư mục'] },
          { id: 'rename-selected', label: 'Rename Selected', keys: ['Enter'], icon: 'edit', tags: ['change name', 'đổi tên'] },
          { id: 'duplicate-file', label: 'Duplicate File', keys: ['Mod', 'D'], icon: 'copy', tags: ['clone', 'copy', 'nhân bản'] },
          { id: 'delete-selected', label: 'Delete Selected', keys: isMac ? ['Mod', 'Backspace'] : ['Delete'], icon: 'trash', tags: ['remove', 'bin', 'trash', 'xóa'] },
           { id: 'workspace-picker', label: 'Workspace Picker', keys: ['Mod', 'O'], icon: 'briefcase', tags: ['project', 'folder', 'dự án'] },
           { id: 'hide-unhide', label: 'Hide / Unhide', keys: ['Mod', 'Shift', 'H'], icon: 'eye-off', tags: ['dotfiles', 'hidden files', 'ẩn hiện file'] },
           { id: 'collapse-all', label: 'Collapse All Folders', keys: ['Mod', '['], icon: 'chevrons-down-up', tags: ['tidy', 'close all', 'thu gọn'] },
           { id: 'collapse-others', label: 'Collapse Other Folders', keys: ['Mod', 'Shift', '['], icon: 'chevrons-down-up', tags: ['focus', 'thu gọn khác'] }
         ]
       },
      {
        title: 'General',
        items: [
          { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', keys: ['Mod', '/'], icon: 'keyboard', tags: ['help', 'commands', 'phím tắt'] },
          { id: 'open-settings', label: 'Open Settings', keys: ['Mod', ','], icon: 'settings', tags: ['preferences', 'config', 'cài đặt'] },
          { id: 'close-cancel', label: 'Close / Cancel', keys: ['Esc'], icon: 'x', tags: ['exit', 'hide', 'thoát'] }
        ]
      }
    ];

    // Map 'Mod' to 'Ctrl' or 'Cmd' for display if needed
    // Actually, ShortcutService handles the mapping.
    return data;
  }

  /**
   * Execute a command by ID
   * Delegates to ShortcutService
   */
  static executeAction(id) {
    if (window.ShortcutService) {
      return window.ShortcutService.execute(id);
    }
    return false;
  }

}

// Export for Design System
window.ShortcutsComponent = ShortcutsComponent;

```
</file>

<file path="renderer/js/components/organisms/sidebar-left.js">
```js
/* global WorkspaceSwitcherComponent, WorkspaceModule, AppState, DesignSystem */
/* ══════════════════════════════════════════════════
   SidebarLeftComponent.js — Navigation Organism
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class SidebarLeftComponent {
  /**
   * @param {Object} options 
   * @param {HTMLElement} options.mount - Mounting point
   */
  constructor(options = {}) {
    this.mount = options.mount || document.getElementById('sidebar-left-mount');
    
    this.VIEWS = {
      EXPLORER: 'explorer'
    };

    this.state = {
      currentView: this.VIEWS.EXPLORER,
      width: 256
    };

    this.isResizing = false;
    this.init();
  }

  init() {
    if (!this.mount) {
      console.warn('SidebarLeftComponent: mount point not found.');
      return;
    }
    
    // Load saved width
    const savedWidth = localStorage.getItem('mdpreview_sidebar_left_width');
    if (savedWidth) {
      this.state.width = parseInt(savedWidth);
    }

    this.render();
    this._initResizer();
  }

  /**
   * Main render function - Creates the entire shell
   */
  render() {
    this.mount.innerHTML = '';
    this.mount.className = 'sidebar-left-container';

    // 1. Create Wrapper
    const wrap = document.createElement('div');
    wrap.id = 'sidebar-left-wrap';
    const isCollapsed = localStorage.getItem('mdpreview_sidebar_left_collapsed') === 'true';
    if (isCollapsed) {
      wrap.classList.add('sidebar-collapsed');
    }
    wrap.style.width = `${this.state.width}px`;

    // 2. Create Aside
    const aside = document.createElement('aside');
    aside.id = 'sidebar-left';
    aside.classList.add('ds-sidebar-base');
    
    aside.innerHTML = `
      <!-- Workspace Picker -->
      <div class="ds-workspace-switcher-mount" id="workspace-switcher-mount"></div>

      <!-- ── Explorer View ── -->
      <div id="sidebar-explorer-view">
        <!-- Recently Viewed Section -->
        <div id="recently-viewed-section" class="sidebar-section">
          <div id="recently-viewed-header-mount"></div>
          <div class="sidebar-section-content">
            <div class="sidebar-section-content-inner">
              <div id="recently-viewed-list"></div>
            </div>
          </div>
        </div>

        <div class="sidebar-divider"></div>

        <!-- Main Trees Container (Always fills remaining space) -->
        <div id="sidebar-main-trees">
          <!-- File Explorer Section -->
          <div id="file-explorer-section" class="sidebar-section">
            <div id="file-explorer-header-mount"></div>
            <div class="sidebar-section-content">
              <div class="sidebar-section-content-inner">
                <div id="file-tree-mount"></div>
              </div>
            </div>
          </div>

          <div class="sidebar-divider"></div>

          <!-- Hidden Items Section -->
          <div id="hidden-items-section" class="sidebar-section">
            <div id="hidden-items-header-mount"></div>
            <div class="sidebar-section-content">
              <div class="sidebar-section-content-inner">
                <div id="hidden-items-mount"></div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <!-- Footer Status -->
      <div class="sidebar-divider"></div>
      <div class="sidebar-footer" id="sidebar-footer-mount"></div>
    `;

    wrap.appendChild(aside);

    // 3. Create Resizer
    const resizer = document.createElement('div');
    resizer.className = 'sidebar-resizer';
    resizer.id = 'sidebar-resizer';
    wrap.appendChild(resizer);

    this.mount.appendChild(wrap);

    // 4. Initialize Workspace Switcher
    this._initWorkspaceSwitcher();
    this._initFooterActions();
  }

  /**
   * Initialize Footer Actions (Settings & Shortcuts)
   */
  _initFooterActions() {
    const mount = document.getElementById('sidebar-footer-mount');
    if (!mount) return;

    const settingsBtn = DesignSystem.createButton({
      label: 'Settings',
      variant: 'subtitle',
      leadingIcon: 'settings',
      onClick: () => {
        if (window.SettingsComponent) {
          window.SettingsComponent.toggle();
        }
      }
    });

    const explorerSettingsBtn = DesignSystem.createButton({
      label: 'Explorer Settings',
      variant: 'subtitle',
      leadingIcon: 'settings-2',
      offLabel: true,
      onClick: (e) => {
        if (window.ExplorerSettingsComponent) {
          window.ExplorerSettingsComponent.toggle({ anchor: e.currentTarget });
        }
      }
    });

    const shortcutsBtn = DesignSystem.createButton({
      label: 'Shortcuts',
      variant: 'subtitle',
      leadingIcon: 'keyboard',
      offLabel: true,
      onClick: () => {
        if (window.SearchPalette) {
          window.SearchPalette.show('shortcut');
        }
      }
    });

    mount.appendChild(settingsBtn);
    mount.appendChild(shortcutsBtn);
    mount.appendChild(DesignSystem.createElement('div', 'sidebar-footer-spacer'));
    mount.appendChild(explorerSettingsBtn);
  }

  /**
   * Initialize the Workspace Switcher molecule
   */
  _initWorkspaceSwitcher() {
    const mount = document.getElementById('workspace-switcher-mount');
    if (!mount) return;

    this.workspaceSwitcher = new WorkspaceSwitcherComponent({
      onClick: () => {
        if (typeof WorkspaceModule !== 'undefined') {
          WorkspaceModule.openPanel();
        }
      }
    });

    mount.appendChild(this.workspaceSwitcher.render());
    
    // Register switcher instance in AppState for global access if needed
    if (typeof AppState !== 'undefined') {
      AppState.components = AppState.components || {};
      AppState.components.workspaceSwitcher = this.workspaceSwitcher;
    }
  }

  /**
   * Switch the active sidebar view (Replaces SidebarController logic)
   * @param {string} viewName 
   */
  switchView(viewName) {
    const mdHeader = document.getElementById('sidebar-md-header');
    const expView = document.getElementById('sidebar-explorer-view');
    const searchView = document.getElementById('sidebar-search-view');
    const dividers = this.mount.querySelectorAll('.sidebar-divider');

    if (mdHeader) mdHeader.style.display = 'block';
    if (expView) expView.style.display = 'none';
    if (searchView) searchView.style.display = 'none';

    switch (viewName) {
      case this.VIEWS.EXPLORER:
        if (expView) expView.style.display = 'flex';
        dividers.forEach(d => d.style.display = 'block');
        break;
    }
    this.state.currentView = viewName;
  }

  /**
   * Initialize Resizer logic (Replaces SidebarModule logic)
   */
  _initResizer() {
    const wrap = document.getElementById('sidebar-left-wrap');
    const resizer = document.getElementById('sidebar-resizer');
    if (!wrap || !resizer) return;

    resizer.addEventListener('mousedown', () => {
      this.isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      resizer.classList.add('is-resizing');
    });

    window.addEventListener('mousemove', e => {
      if (!this.isResizing) return;
      const rect = wrap.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      if (newWidth >= 256 && newWidth <= 600) {
        wrap.style.width = `${newWidth}px`;
        this.state.width = newWidth;
      }
    });

    window.addEventListener('mouseup', () => {
      if (!this.isResizing) return;
      this.isResizing = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      resizer.classList.remove('is-resizing');

      // Save width
      localStorage.setItem('mdpreview_sidebar_left_width', this.state.width);
      if (typeof AppState !== 'undefined') {
        AppState.settings.sidebarWidth = this.state.width;
        if (AppState.savePersistentState) AppState.savePersistentState();
      }
    });
  }
}

// Singleton Bridge
window.SidebarLeft = (() => {
  let instance = null;
  return {
    init: (options) => {
      if (!instance) instance = new SidebarLeftComponent(options);
      return instance;
    },
    getInstance: () => instance
  };
})();

```
</file>

<file path="renderer/js/components/organisms/tab-bar.js">
```js
/* ══════════════════════════════════════════════════
   TabBarComponent.js — Scalable Header Organism
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class TabBarComponent {
  /**
   * @param {Object} options 
   * @param {HTMLElement} options.mount - Container element
   * @param {Function} options.onTabSwitch - Callback(path)
   * @param {Function} options.onTabClose - Callback(path)
   * @param {Function} options.onAddTab - Callback()
   * @param {Function} options.onToggleSidebar - Callback()
   * @param {Array} options.rightActions - Array of { id, icon, title, onClick, type }
   */
  constructor(options = {}) {
    this.mount = options.mount || document.getElementById('tab-bar-container');
    this.options = {
      onTabSwitch: options.onTabSwitch || (() => { }),
      onTabClose: options.onTabClose || (() => { }),
      onAddTab: options.onAddTab || (() => { }),
      onToggleSidebar: options.onToggleSidebar || (() => { }),
      onCloseOthers: options.onCloseOthers || (() => { }),
      onCloseAll: options.onCloseAll || (() => { }),
      onCloseSelected: options.onCloseSelected || (() => { }),
      onPinTab: options.onPinTab || (() => { }),
      onUnpinTab: options.onUnpinTab || (() => { }),
      rightActions: options.rightActions || []
    };

    this.state = {
      openFiles: [],
      pinnedFiles: [],
      dirtyFiles: [],
      activeFile: null,
      selectedFiles: []
    };

    this.init();
  }

  init() {
    if (!this.mount) {
      console.warn('TabBarComponent: mount point not found.');
      return;
    }
    this.render();
  }

  /**
   * Update the internal state and re-render
   * @param {Object} newState 
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  /**
   * Main render function
   */
  render() {
    if (!this.mount) return;

    // Clear and set base class
    this.mount.innerHTML = '';
    this.mount.className = 'tab-bar-container';

    // ── 1. Left Section: Sidebar Toggle ──────────────────
    const toggleWrapper = document.createElement('div');
    toggleWrapper.className = 'tab-bar__sidebar-toggle-wrapper';

    const isCollapsed = localStorage.getItem('mdpreview_sidebar_left_collapsed') === 'true';
    const initialIcon = isCollapsed ? 'sidebar-expand' : 'sidebar-collapse';
    const sidebarToggle = DesignSystem.createHeaderAction(initialIcon, 'Toggle Sidebar (Mod+B)', () => this.options.onToggleSidebar(), 'sidebar-toggle-btn');
    toggleWrapper.appendChild(sidebarToggle);

    this.mount.appendChild(toggleWrapper);

    this.mount.appendChild(this._createDivider());

    // ── 2. Middle Section: Tab List ─────────────────────
    const tabList = document.createElement('div');
    tabList.className = 'tab-bar__list';

    // Separate pinned and unpinned tabs, maintaining pin order
    const pinned = this.state.pinnedFiles.filter(f => this.state.openFiles.includes(f));
    const unpinned = this.state.openFiles.filter(f => !this.state.pinnedFiles.includes(f));
    const displayOrder = [...pinned, ...unpinned];

    displayOrder.forEach(path => {
      tabList.appendChild(this._createTabItem(path));
    });
    this.mount.appendChild(tabList);

    // ── 3. Add Tab Section (Next to List) ────────────────
    const addTabWrapper = document.createElement('div');
    const draftCount = this.state.openFiles.filter(p => p && p.startsWith('__DRAFT_')).length;
    const isLimitReached = draftCount >= 20;

    addTabWrapper.className = `tab-bar__add-btn-container ds-tooltip-trigger ds-tooltip-container ${isLimitReached ? 'is-disabled' : ''}`;
    addTabWrapper.innerHTML = `
      <div class="tab-bar__add-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
    `;

    if (isLimitReached) {
      addTabWrapper.setAttribute('data-ds-tooltip', 'Draft limit reached (max 20)');
    } else {
      addTabWrapper.setAttribute('data-ds-tooltip', 'New Draft');
    }

    addTabWrapper.onclick = () => {
      if (!isLimitReached) this.options.onAddTab();
    };
    this.mount.appendChild(addTabWrapper);

    // ── 4. Right Section: Action Group ──────────────────
    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'tab-bar__actions-right';

    this.options.rightActions.forEach(action => {
      if (action.type === 'divider') {
        actionsWrapper.appendChild(this._createActionDivider());
      } else {
        actionsWrapper.appendChild(this._createActionBtn(action));
      }
    });
    this.mount.appendChild(actionsWrapper);

    // Ensure active tab is visible
    requestAnimationFrame(() => this._scrollToActive());
  }

  /**
   * Scroll the active tab into view if it's overflowing
   */
  _scrollToActive() {
    const list = this.mount.querySelector('.tab-bar__list');
    const active = this.mount.querySelector('.tab-item.active');
    if (!list || !active) return;

    active.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
  }

  /**
   * Internal helper to create a tab item molecule
   */
  _createTabItem(path) {
    const isDraft = path && path.startsWith('__DRAFT_');
    let fileName = path.split('/').pop();

    if (isDraft) {
      fileName = (typeof DraftModule !== 'undefined') ? DraftModule.getDisplayName(path) : 'Draft';
    }

    const isActive = path === this.state.activeFile;
    const isSelected = this.state.selectedFiles.includes(path) && !isActive;
    const isPinned = this.state.pinnedFiles.includes(path);
    const isDirty = this.state.dirtyFiles.includes(path);

    const item = document.createElement('div');
    item.className = `tab-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${isPinned ? 'is-pinned' : ''} ${isDirty ? 'is-dirty' : ''} ${isDraft ? 'is-draft' : ''}`;
    item.setAttribute('data-path', path);

    const statusDot = (isDirty || isDraft) ? '<span class="tab-bar__status-dot"></span>' : '';
    const pinIconHtml = isPinned ? `<div class="tab-bar__pin-icon">${DesignSystem.getIcon('pin')}</div>` : '';

    let displayLabel = fileName;
    if (!isDraft && displayLabel.toLowerCase().endsWith('.md')) {
      displayLabel = displayLabel.substring(0, displayLabel.length - 3);
    }

    item.innerHTML = `
      ${statusDot}
      ${pinIconHtml}
      <span class="tab-bar__name">${displayLabel}</span>
      <div class="tab-bar__close" title="Close tab">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </div>
    `;

    item.onmousedown = (e) => {
      // Middle click to close
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        this.options.onTabClose(path);
        return;
      }

      if (e.button !== 0) return; // Left click only for drag
      if (e.target.closest('.tab-bar__close')) return;
      this._initTabDrag(e, item, path);
    };

    item.onclick = (e) => {
      if (e.target.closest('.tab-bar__close')) return;
      this.options.onTabSwitch(path, {
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey
      });
    };

    item.ondblclick = (e) => {
      e.preventDefault();
      const isPinned = this.state.pinnedFiles.includes(path);
      if (isPinned) {
        this.options.onUnpinTab(path);
      } else {
        this.options.onPinTab(path);
      }
    };

    item.oncontextmenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._showContextMenu(e, path);
    };

    item.querySelector('.tab-bar__close').onclick = (e) => {
      e.stopPropagation();
      this.options.onTabClose(path);
    };

    return item;
  }

  /**
   * VIP Drag & Drop Engine for Tabs (Horizontal)
   */
  _initTabDrag(e, itemEl, _path) {
    const tabList = itemEl.closest('.tab-bar__list');
    if (!tabList) return;

    const rect = itemEl.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const itemWidth = rect.width;
    const siblings = Array.from(tabList.querySelectorAll('.tab-item'));
    const itemIdx = siblings.indexOf(itemEl);

    let currentIdx = itemIdx;
    let dragProxy = null;
    let isDraggingStarted = false;
    let animationFrameId = null;
    let currentX = e.clientX;
    let currentY = e.clientY;
    const isPinnedDrag = itemEl.classList.contains('is-pinned');

    // Pre-calculate sibling centers
    const sibCenters = siblings.map(sib => {
      const r = sib.getBoundingClientRect();
      return r.left + r.width / 2;
    });

    const updateUI = () => {
      if (!dragProxy) return;

      const deltaX = currentX - startX;
      dragProxy.style.transform = `translate(${deltaX}px, 0px) scale(0.9)`;

      let newIdx = itemIdx;
      let minDist = Infinity;
      sibCenters.forEach((center, i) => {
        // TC: Restrict dragging to same group (Pinned vs Unpinned)
        const targetIsPinned = siblings[i].classList.contains('is-pinned');
        if (targetIsPinned !== isPinnedDrag) return;

        const dist = Math.abs(currentX - center);
        if (dist < minDist) {
          minDist = dist;
          newIdx = i;
        }
      });

      siblings.forEach((sib, idx) => {
        if (sib === itemEl) return;

        // TC: Only animate siblings in the same group
        const sibIsPinned = sib.classList.contains('is-pinned');
        if (sibIsPinned !== isPinnedDrag) {
          sib.style.transform = '';
          return;
        }

        if (idx > itemIdx && idx <= newIdx) {
          sib.style.transform = `translateX(-${itemWidth}px)`;
        } else if (idx < itemIdx && idx >= newIdx) {
          sib.style.transform = `translateX(${itemWidth}px)`;
        } else {
          sib.style.transform = '';
        }
      });

      currentIdx = newIdx;

      // Auto-scroll logic
      const listRect = tabList.getBoundingClientRect();
      const threshold = 50;
      if (currentX < listRect.left + threshold) tabList.scrollLeft -= 5;
      if (currentX > listRect.right - threshold) tabList.scrollLeft += 5;

      animationFrameId = requestAnimationFrame(updateUI);
    };

    const onMouseMove = (moveEvent) => {
      currentX = moveEvent.clientX;
      currentY = moveEvent.clientY;
      const dist = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));

      if (!isDraggingStarted && dist > 5) {
        isDraggingStarted = true;

        // Create Proxy
        const originalStyle = window.getComputedStyle(itemEl);
        dragProxy = itemEl.cloneNode(true);
        dragProxy.classList.add('is-dragging-vip');
        dragProxy.style.width = `${rect.width}px`;
        dragProxy.style.height = `${rect.height}px`;
        dragProxy.style.left = `${rect.left}px`;
        dragProxy.style.top = `${rect.top}px`;
        dragProxy.style.background = originalStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'
          ? originalStyle.backgroundColor
          : 'rgba(255, 255, 255, 0.08)';

        document.body.appendChild(dragProxy);
        itemEl.classList.add('tab-item-placeholder');
        tabList.classList.add('is-dragging-active');
        animationFrameId = requestAnimationFrame(updateUI);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      if (!isDraggingStarted) return;

      if (dragProxy) {
        // Snap proxy to final position
        dragProxy.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        const targetCenter = sibCenters[currentIdx];
        const finalX = targetCenter - (rect.left + rect.width / 2);
        dragProxy.style.transform = `translateX(${finalX}px) scale(1)`;

        setTimeout(() => {
          // Perform surgical DOM move
          tabList.classList.add('is-handing-off');

          if (currentIdx !== itemIdx) {
            const target = siblings[currentIdx];
            if (currentIdx < itemIdx) {
              tabList.insertBefore(itemEl, target);
            } else {
              tabList.insertBefore(itemEl, target.nextSibling);
            }
            // Update state in TabsModule
            if (typeof TabsModule !== 'undefined') {
              TabsModule.reorder(itemIdx, currentIdx);
            }
          }

          itemEl.classList.remove('tab-item-placeholder');
          tabList.classList.remove('is-dragging-active');
          siblings.forEach(s => s.style.transform = '');

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              tabList.classList.remove('is-handing-off');
              if (dragProxy) {
                dragProxy.style.opacity = '0';
                setTimeout(() => {
                  if (dragProxy) dragProxy.remove();
                  dragProxy = null;
                }, 200);
              }
            });
          });
        }, 200);
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Custom context menu for tabs
   */
  _showContextMenu(e, path) {
    const isPinned = this.state.pinnedFiles.includes(path);
    const items = [
      { label: isPinned ? 'Unpin Tab' : 'Pin Tab', icon: isPinned ? 'pin-off' : 'pin', onClick: () => isPinned ? this.options.onUnpinTab(path) : this.options.onPinTab(path) },
      { divider: true },
      { label: 'Close Tab', icon: 'x', shortcut: '⌘W', onClick: () => this.options.onTabClose(path) },
      { label: 'Close Others', icon: 'minus', onClick: () => this.options.onCloseOthers(path) },
      { label: 'Close All', icon: 'layers', onClick: () => this.options.onCloseAll() }
    ];

    // Only show "Close Selected" if more than 1 selected
    if (this.state.selectedFiles.length > 1) {
      items.push({ divider: true });
      items.push({
        label: `Close Selected (${this.state.selectedFiles.length})`,
        icon: 'check-square',
        onClick: () => this.options.onCloseSelected()
      });
    }

    DesignSystem.createContextMenu(e, items);
  }


  /**
   * Internal helper to create an action button
   */
  _createActionBtn(action) {
    const btn = DesignSystem.createHeaderAction(action.icon, action.title || '', (e) => {
      if (e) e.stopPropagation();
      if (typeof action.onClick === 'function') {
        action.onClick();
      }
    });
    return btn;
  }

  _createDivider() {
    const d = document.createElement('div');
    d.className = 'tab-bar__divider-v';
    return d;
  }

  _createActionDivider() {
    const d = document.createElement('div');
    d.className = 'tab-bar__action-divider';
    return d;
  }
}

// Export for Design System
window.TabBar = (() => {
  let instance = null;
  return {
    init: (options) => {
      if (!instance) instance = new TabBarComponent(options);
      return instance;
    },
    getInstance: () => instance
  };
})();

```
</file>

<file path="renderer/js/components/organisms/toc-component.js">
```js
/* global DesignSystem, UIUtils */
/**
 * TOCComponent — Table of Contents (Organism)
 * Purpose: Scans headings in the document and renders a navigable tree view.
 * Dependencies: DesignSystem, ScrollModule
 * 
 * @global DesignSystem, UIUtils
 */
const TOCComponent = (() => {
  'use strict';

  // ============================================
  // Private State
  // ============================================
  let _isVisible = false;
  let _currentMode = 'read';
  let _expandedState = new Set();
  let _collapsedState = new Set();
  let _tree = [];
  let _hideTimeout = null;
  let _isScanning = false;
  let _activeView = 'outline'; // 'outline' or 'map'
  let _viewSwitcher = null;
  let _lastUpdateId = 0;
  let _mapEl = null;
  const SCROLL_OFFSET = 240; // PX from top to trigger section change and scroll destination

  const SELECTORS = {
    panel: 'ds-toc-panel',
    item: 'ds-toc-item',
    btn: 'floating-toc-btn'
  };

  // ============================================
  // Private Functions
  // ============================================

  /**
   * Scans headings in the container and builds a tree structure
   */
  function _scanHeadings(container) {
    if (!container) return [];

    const headingNodes = Array.from(container.querySelectorAll('h2, h3, h4, h5, h6'));
    const flatList = headingNodes.map(node => {
      const lineEl = node.closest('.md-line');
      return {
        text: node.textContent.trim(),
        level: parseInt(node.nodeName.substring(1)),
        line: lineEl ? parseInt(lineEl.getAttribute('data-line')) : 0,
        element: node
      };
    });

    // Build hierarchy
    const tree = [];
    const stack = [];

    flatList.forEach(item => {
      const node = { ...item, children: [] };

      while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        tree.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }

      stack.push(node);
    });

    return tree;
  }

  /**
   * Renders the empty state when no headings are found
   */
  function _renderEmpty() {
    const empty = DesignSystem.createElement('div', 'toc-empty-state');
    empty.innerHTML = `
      <div class="empty-icon">${DesignSystem.getIcon('list-tree')}</div>
      <p>No outline available</p>
      <span>This document has no H2–H6 headings to generate a Table of Contents.</span>
    `;
    return empty;
  }


  function _highlightItem(line) {
    const panel = document.getElementById(SELECTORS.panel);
    if (!panel) return;

    // Remove old active
    panel.querySelectorAll(`.${SELECTORS.item}.is-active`).forEach(el => el.classList.remove('is-active'));

    // Find matching TOC item
    const item = panel.querySelector(`.${SELECTORS.item}[data-line="${line}"]`);
    if (item) {
      item.classList.add('is-active');

      // Auto-expand parents of active item
      let parent = item.parentElement.closest(`.${SELECTORS.item}`);
      while (parent) {
        if (!parent.classList.contains('is-expanded')) {
          parent.classList.add('is-expanded');
          parent.classList.remove('is-collapsed');
          const toggle = parent.querySelector('.item-toggle');
          if (toggle) toggle.innerHTML = DesignSystem.getIcon('chevron-down');
        }
        parent = parent.parentElement.closest(`.${SELECTORS.item}`);
      }

      // Auto-scroll the TOC panel itself
      const body = panel.querySelector('.toc-body');
      if (body) {
        const itemTop = item.offsetTop;
        const bodyScroll = body.scrollTop;
        const bodyHeight = body.clientHeight;
        if (itemTop < bodyScroll || itemTop > bodyScroll + bodyHeight - 40) {
          body.scrollTo({ top: itemTop - 40, behavior: 'smooth' });
        }
      }
    }
  }

  /**
   * Renders a single tree node and its children
   */
  function _renderNode(node, _depth = 0) {
    const item = DesignSystem.createElement('div', [SELECTORS.item, `level-${node.level}`], {
      'data-line': node.line
    });

    const stateKey = `${node.level}-${node.text}`;

    if (_expandedState.has(stateKey)) {
      item.classList.add('is-expanded');
    } else if (_collapsedState.has(stateKey)) {
      item.classList.add('is-collapsed');
    } else if (node.level <= 4) {
      item.classList.add('is-expanded');
    } else {
      item.classList.add('is-collapsed');
    }

    const content = DesignSystem.createElement('div', 'item-content');

    const label = DesignSystem.createElement('span', 'item-label', { text: node.text });
    content.appendChild(label);

    if (node.children.length > 0) {
      const toggle = DesignSystem.createElement('span', 'item-toggle', {
        html: DesignSystem.getIcon('chevron-right')
      });
      toggle.onclick = (e) => {
        e.stopPropagation();
        item.classList.toggle('is-expanded');
        item.classList.toggle('is-collapsed');

        const isNowExpanded = item.classList.contains('is-expanded');
        if (isNowExpanded) {
          _expandedState.add(stateKey);
          _collapsedState.delete(stateKey);
        } else {
          _collapsedState.add(stateKey);
          _expandedState.delete(stateKey);
        }

        toggle.innerHTML = isNowExpanded
          ? DesignSystem.getIcon('chevron-down')
          : DesignSystem.getIcon('chevron-right');
      };
      content.appendChild(toggle);

      // Update toggle icon initially if expanded
      if (item.classList.contains('is-expanded')) {
        toggle.innerHTML = DesignSystem.getIcon('chevron-down');
      }
    }

    content.onclick = () => {
      if (node.element) {
        // Manual scroll to account for threshold/toolbar offset
        const container = document.querySelector('.md-viewer-viewport');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const elementRect = node.element.getBoundingClientRect();
          const relativeTop = elementRect.top - containerRect.top;
          // Target slightly above the threshold to ensure it's active
          const targetScroll = container.scrollTop + relativeTop - (SCROLL_OFFSET - 10);
          
          container.scrollTo({ top: targetScroll, behavior: 'smooth' });
        } else {
          node.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else if (node.line && window.EditorModule) {
        window.EditorModule.focusWithContext({ line: node.line });
      }
      // On mobile or small screens, we might want to close after click
      if (window.innerWidth < 768) TOCComponent.hide();
    };

    item.appendChild(content);

    if (node.children.length > 0) {
      const childrenContainer = DesignSystem.createElement('div', 'item-children');
      node.children.forEach(child => {
        childrenContainer.appendChild(_renderNode(child, _depth + 1));
      });
      item.appendChild(childrenContainer);
    }

    return item;
  }

  /**
   * Creates the TOC panel
   */
  function _createPanel() {
    const panel = DesignSystem.createElement('div', SELECTORS.panel, { id: SELECTORS.panel });
    const header = DesignSystem.createElement('div', 'toc-header');
    
    // View Switcher
    _viewSwitcher = DesignSystem.createSegmentedControl({
      items: [
        { id: 'outline', icon: 'list-tree', title: 'Outline' },
        { id: 'map', icon: 'map', title: 'Project Map' }
      ],
      activeId: _activeView,
      onChange: (id) => {
        // Destroy observer when leaving map view
        if (_activeView === 'map' && id !== 'map' && window.ProjectMap) {
          window.ProjectMap.destroy();
        }
        _activeView = id;
        _viewSwitcher.updateActive(id);
        const title = header.querySelector('h3');
        if (title) title.textContent = id === 'outline' ? 'Table of Contents' : 'Project Map';
        TOCComponent.renderBody();
      }
    });
    header.appendChild(_viewSwitcher.el);

    const title = DesignSystem.createElement('h3', '', { 
      text: _activeView === 'outline' ? 'Table of Contents' : 'Project Map' 
    });
    header.appendChild(title);

    const spacer = DesignSystem.createElement('div', 'ds-spacer');
    header.appendChild(spacer);

    const closeBtn = new IconActionButton({
      iconName: 'x',
      title: 'Close',
      className: 'toc-close',
      onClick: () => TOCComponent.hide()
    }).render();
    header.appendChild(closeBtn);

    const body = DesignSystem.createElement('div', 'toc-body');

    panel.appendChild(header);
    panel.appendChild(body);

    // Apply Smart Scroll Mask for premium feel
    if (window.UIUtils && window.UIUtils.applySmartScrollMask) {
      window.UIUtils.applySmartScrollMask(body, { fadeHeight: 24 });
    }

    return panel;
  }

  function _renderSkeleton() {
    return UIUtils.renderSkeleton('list', 6);
  }

  // ============================================
  // Public API
  // ============================================
  return {
    init: function () {
      // Global initialization if needed
    },

    update: function (container, options = {}) {
      const updateId = ++_lastUpdateId;
      _isScanning = options.isSkeleton || false;
      const { mode = 'read' } = options;
      _currentMode = mode;

      if (updateId !== _lastUpdateId) return;

      _tree = _scanHeadings(container);

      _isScanning = false;

      // Update button state in MarkdownViewer
      const btn = document.getElementById('floating-toc-btn');
      if (btn) {
        // We keep the button enabled but the panel will show the empty state
        btn.disabled = false;
        btn.classList.remove('is-disabled');
      }

      // If visible, re-render body
      if (_isVisible) {
        this.renderBody();
      }
    },

    updateMap: function() {
      if (!_isVisible || _activeView !== 'map' || !_mapEl) return;
      const mount = document.getElementById('md-viewer-mount');
      const viewport = mount ? mount.querySelector('.md-viewer-viewport') : null;
      if (viewport && window.ProjectMap) {
        window.ProjectMap.update(_mapEl, viewport);
      }
    },

    reset: function () {
      _lastUpdateId++; // Invalidate pending updates
      _tree = [];
      _isScanning = true;
      _expandedState.clear();
      _collapsedState.clear();
      
      if (_activeView === 'map' && _mapEl && window.ProjectMap) {
        window.ProjectMap.reset(_mapEl);
      }
      
      this.renderBody();
    },

    renderBody: function () {
      const panel = document.getElementById(SELECTORS.panel);
      if (!panel) return;

      const body = panel.querySelector('.toc-body');

      // Capture current expansion states before clearing
      panel.querySelectorAll('.ds-toc-item').forEach(item => {
        const level = Array.from(item.classList).find(c => c.startsWith('level-'));
        const label = item.querySelector('.item-label');
        if (level && label) {
          const key = `${level.replace('level-', '')}-${label.textContent}`;
          if (item.classList.contains('is-expanded')) {
            _expandedState.add(key);
            _collapsedState.delete(key);
          } else {
            _collapsedState.add(key);
            _expandedState.delete(key);
          }
        }
      });

      if (_activeView === 'map') {
        body.classList.add('is-map');
        const mount = document.getElementById('md-viewer-mount');
        const viewport = mount ? mount.querySelector('.md-viewer-viewport') : null;
        // Only mirror content if scanning is finished.
        // Project Map mirrors the entire document, so we don't care about _tree.length (headings).
        if (viewport && window.ProjectMap && !_isScanning) {
          if (_mapEl && body.contains(_mapEl)) {
            window.ProjectMap.update(_mapEl, viewport);
          } else {
            body.innerHTML = '';
            _mapEl = window.ProjectMap.render(body, viewport);
          }
        }
        return;
      }

      body.classList.remove('is-map');
      body.innerHTML = '';
      _mapEl = null;

      if (_tree.length === 0) {
        if (_isScanning) {
          body.appendChild(_renderSkeleton());
        } else {
          body.appendChild(_renderEmpty());
        }
        return;
      }

      _tree.forEach(node => {
        body.appendChild(_renderNode(node));
      });
    },

    toggle: function (anchor) {
      if (_isVisible) {
        this.hide();
      } else {
        this.show(anchor);
      }
    },

    show: function (anchor) {
      if (_hideTimeout) {
        clearTimeout(_hideTimeout);
        _hideTimeout = null;
      }

      let panel = document.getElementById(SELECTORS.panel);

      // If _isVisible is true but panel is missing from DOM, it means the parent re-rendered.
      // In this case, we allow show() to proceed to re-mount the panel.
      if (_isVisible && panel) return;

      if (!panel) {
        panel = _createPanel();
        anchor.appendChild(panel);
      }

      this.renderBody();

      // Small timeout to ensure transition triggers after DOM mount
      setTimeout(() => {
        panel.classList.add('show');
        if (_viewSwitcher) _viewSwitcher.updateActive(_activeView);
        const btn = document.getElementById(SELECTORS.btn);
        if (btn) btn.classList.add('is-active');
        anchor.classList.add('has-toc');
        _isVisible = true;
      }, 20);
    },

    hide: function () {
      const panel = document.getElementById(SELECTORS.panel);
      const btn = document.getElementById(SELECTORS.btn);
      const mount = document.getElementById('md-viewer-mount');

      if (panel) panel.classList.remove('show');
      if (btn) btn.classList.remove('is-active');
      if (mount) mount.classList.remove('has-toc');

      // Disconnect live observer to free resources
      if (window.ProjectMap) window.ProjectMap.destroy();
      _mapEl = null;

      if (_hideTimeout) clearTimeout(_hideTimeout);

      _hideTimeout = setTimeout(() => {
        _isVisible = false;
        _hideTimeout = null;
        // Optional: remove from DOM to keep it clean
        if (panel && panel.parentElement) {
          panel.remove();
        }
      }, 300);
    },

    isVisible: () => _isVisible,
    getActiveView: () => _activeView,

    switchView: function(viewId) {
      if (!_viewSwitcher) return;
      if (viewId === _activeView) return;
      
      // Destroy observer when leaving map view
      if (_activeView === 'map' && viewId !== 'map' && window.ProjectMap) {
        window.ProjectMap.destroy();
      }
      
      _activeView = viewId;
      _viewSwitcher.updateActive(viewId);
      
      const panel = document.getElementById(SELECTORS.panel);
      if (panel) {
        const title = panel.querySelector('.toc-header h3');
        if (title) title.textContent = viewId === 'outline' ? 'Table of Contents' : 'Project Map';
      }
      
      this.renderBody();
    },

    updateActiveHeading: function (container) {
      if (!_isVisible) return;

      const panel = document.getElementById(SELECTORS.panel);
      if (!panel) return;

      const headings = Array.from(container.querySelectorAll('h2, h3, h4, h5, h6'));
      const containerRect = container.getBoundingClientRect();
      const threshold = SCROLL_OFFSET; 

      let activeHeading = null;

      for (const h of headings) {
        const hRect = h.getBoundingClientRect();
        const relativeTop = hRect.top - containerRect.top;

        if (relativeTop <= threshold) {
          activeHeading = h;
        } else {
          break;
        }
      }

      if (activeHeading) {
        const lineEl = activeHeading.closest('.md-line');
        const activeLine = lineEl ? parseInt(lineEl.getAttribute('data-line'), 10) : null;

        if (activeLine !== null) {
          _highlightItem(activeLine);
        }
      }

      // Sync Project Map Viewport
      if (_activeView === 'map' && _mapEl && window.ProjectMap) {
        window.ProjectMap.syncScroll(_mapEl);
      }
    }
  };
})();

// Explicit export
window.TOCComponent = TOCComponent;

```
</file>

<file path="renderer/js/components/organisms/tree-view.js">
```js
/* ══════════════════════════════════════════════════
   TreeViewComponent.js — Atomic Design (Organism)
   Quản lý toàn bộ cây thư mục, render đệ quy và lọc tìm kiếm.
   ══════════════════════════════════════════════════ */

class TreeViewComponent {
    constructor(options = {}) {
        this.mount = options.mount || document.getElementById('file-tree');
        this.options = options; // Chứa các callback từ TreeModule
        this.state = {
            treeData: [],
            selectedPaths: [],
            currentQuery: '',
            sortMethod: 'alphabetical_asc'
        };
    }

    /**
     * Cập nhật dữ liệu và render lại
     */
    update(newData, selectedPaths, currentQuery, sortMethod, activePath, renamingPath) {
        this.state.treeData = newData;
        this.state.selectedPaths = selectedPaths;
        this.state.currentQuery = currentQuery;
        this.state.sortMethod = sortMethod;
        this.state.activePath = activePath;
        this.state.renamingPath = renamingPath;
        this.render();
    }

    /**
     * Render trạng thái chờ chuyên nghiệp với Skeleton
     */
    renderSkeleton(count = 8) {
        if (!this.mount) return;
        this.mount.classList.add('ds-tree-view');
        this.mount.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const row = document.createElement('div');
            row.className = 'skeleton-row';
            // Tạo độ dài ngẫu nhiên cho thanh text để trông tự nhiên hơn
            const randomWidth = Math.floor(Math.random() * 40) + 40; 
            row.innerHTML = `
                <div class="skeleton skeleton-icon" style="width: 14px; height: 14px; margin-left: ${i > 3 ? '12px' : '0'}"></div>
                <div class="skeleton skeleton-text" style="width: ${randomWidth}%; height: 12px;"></div>
            `;
            this.mount.appendChild(row);
        }
    }

    render() {
        if (!this.mount) return;

        // Thêm class chuẩn cho CSS
        this.mount.classList.add('ds-tree-view');
        this.mount.innerHTML = '';

        if (this.state.treeData.length === 0) {
            this.mount.innerHTML = '<div style="padding:40px 20px; color:rgba(255,255,255,0.15); font-size:12px; text-align:center; font-family:var(--font-code); text-transform:uppercase; letter-spacing:0.05em;">No items found</div>';
            return;
        }

        const fragment = document.createDocumentFragment();
        let globalIdx = 0;

        const renderNodes = (nodes, parentEl) => {
            nodes.forEach(node => {
                const itemComp = new TreeItemComponent(node, this.options, {
                    selectedPaths: this.state.selectedPaths,
                    currentFile: this.state.activePath,
                    renamingPath: this.state.renamingPath
                });
                const el = itemComp.render(globalIdx++);
                parentEl.appendChild(el);
            });
        };

        renderNodes(this.state.treeData, fragment);
        
        this.mount.appendChild(fragment);
    }
}

window.TreeViewComponent = TreeViewComponent;

```
</file>

<file path="renderer/js/components/organisms/workspace-form-component.js">
```js
/* ══════════════════════════════════════════════════
   WorkspaceFormComponent.js — Premium Create/Edit Workspace Form
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class WorkspaceFormComponent {
  constructor(options = {}) {
    this.editWs = options.editWs || null;
    this.onConfirm = options.onConfirm || (() => { });
    this.onBrowse = options.onBrowse || (async () => null);
    this.onCancel = options.onCancel || (() => { });

    this.pendingPath = this.editWs ? this.editWs.path : '';
  }

  render() {
    const container = DesignSystem.createElement('div', 'aws-form-content');

    // 1. Icon Wrapper
    const iconWrapper = DesignSystem.createElement('div', 'aws-icon-wrapper', {
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
          <line x1="12" y1="10" x2="12" y2="16" />
          <line x1="9" y1="13" x2="15" y2="13" />
        </svg>
      `
    });
    container.appendChild(iconWrapper);

    // 2. Title & Subtitle
    const title = DesignSystem.createElement('h3', 'aws-title', {
      text: this.editWs ? 'Rename Workspace' : 'New Workspace'
    });
    const subtitle = DesignSystem.createElement('p', 'aws-subtitle', {
      text: this.editWs ? 'Change the display name of your workspace.' : 'Connect a local folder to start previewing.'
    });
    container.appendChild(title);
    container.appendChild(subtitle);

    // Divider Top
    container.appendChild(DesignSystem.createElement('div', 'setting-divider', {}));

    // 3. Fields
    const fields = DesignSystem.createElement('div', 'aws-fields');
    fields.style.padding = '24px 0 0 0';

    // Name Field
    const nameLabel = DesignSystem.createElement('label', 'aws-field-label', { text: 'WORKSPACE NAME' });
    this.nameInput = DesignSystem.createElement('input', 'aws-input', {
      type: 'text',
      placeholder: 'Design Specs, API Docs...',
      id: 'workspace-name-input',
      value: this.editWs ? this.editWs.name : ''
    });
    fields.appendChild(nameLabel);
    fields.appendChild(this.nameInput);

    // Path Field (Only for new)
    if (!this.editWs) {
      const pathLabel = DesignSystem.createElement('label', 'aws-field-label', { text: 'FOLDER PATH' });
      const browseRow = DesignSystem.createElement('div', 'aws-browse-row');

      this.pathDisplay = DesignSystem.createElement('input', 'aws-input path', {
        type: 'text',
        placeholder: 'Select document folder...',
        value: this.pendingPath,
        readOnly: true
      });

      const browseBtn = DesignSystem.createElement('button', 'btn-secondary', {
        text: 'Browse',
        id: 'browse-btn'
      });
      browseBtn.style.height = '44px';
      browseBtn.style.borderRadius = '22px';
      browseBtn.style.padding = '0 20px';

      browseBtn.onclick = async () => {
        const path = await this.onBrowse();
        if (path) {
          this.pendingPath = path;
          this.pathDisplay.value = path;
          this._validate();
        }
      };

      browseRow.appendChild(this.pathDisplay);
      browseRow.appendChild(browseBtn);

      fields.appendChild(pathLabel);
      fields.appendChild(browseRow);
    }
    container.appendChild(fields);

    // Divider Bottom
    container.appendChild(DesignSystem.createElement('div', 'setting-divider', {}));

    // 4. Actions
    const actions = DesignSystem.createElement('div', 'aws-actions');
    actions.style.marginTop = '20px';

    const cancelBtn = DesignSystem.createElement('button', 'btn-ghost', {
      text: 'Cancel',
      id: 'cancel-workspace-btn'
    });
    cancelBtn.style.flex = '1';
    cancelBtn.style.height = '48px';
    cancelBtn.onclick = () => {
      this.closeAction();
      this.onCancel();
    };

    this.confirmBtn = DesignSystem.createElement('button', 'btn-primary', {
      text: this.editWs ? 'Update' : 'Create',
      id: 'confirm-workspace-btn'
    });
    this.confirmBtn.style.flex = '1';
    this.confirmBtn.style.height = '48px';
    this.confirmBtn.disabled = true;

    this.confirmBtn.onclick = () => {
      const name = this.nameInput.value.trim();
      if (this.editWs) {
        this.onConfirm(this.editWs.id, name);
      } else if (this.pendingPath) {
        this.onConfirm(name, this.pendingPath);
      }
      this.closeAction();
    };

    actions.appendChild(cancelBtn);
    actions.appendChild(this.confirmBtn);
    container.appendChild(actions);

    // Validation
    this.nameInput.oninput = () => this._validate();
    setTimeout(() => this.nameInput.focus(), 100);

    return container;
  }

  _validate() {
    const nameValid = this.nameInput.value.trim().length > 0;
    const pathValid = this.editWs ? true : this.pendingPath.length > 0;
    if (this.confirmBtn) {
      this.confirmBtn.disabled = !(nameValid && pathValid);
    }
  }

  static open(options) {
    const component = new WorkspaceFormComponent(options);
    const content = component.render();

    const popover = DesignSystem.createPopoverShield({
      content: content,
      width: '480px',
      showHeader: false, // Hide the generic header
      className: 'aws-popover-shield'
    });

    component.closeAction = () => popover.close();
    return popover;
  }
}

window.WorkspaceFormComponent = WorkspaceFormComponent;

```
</file>

<file path="renderer/js/components/organisms/workspace-picker-component.js">
```js
/* ══════════════════════════════════════════════════
   WorkspacePickerComponent.js — Workspace Selection Organism
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class WorkspacePickerComponent {
  constructor(options = {}) {
    this.workspaces = options.workspaces || [];
    this.activeId = options.activeId || null;
    this.onSelect = options.onSelect || (() => {});
    this.onAdd = options.onAdd || (() => {});
    this.onDelete = options.onDelete || (() => {});
    this.onRename = options.onRename || (() => {});
    
    this.editingId = null; // Track which workspace is being renamed inline
  }

  render() {
    const container = DesignSystem.createElement('div', 'workspace-picker-container');

    const listGroup = DesignSystem.createElement('div', 'ds-popover-group');

    if (this.workspaces.length === 0) {
      const empty = DesignSystem.createElement('div', 'ws-empty-state', {
        html: `
          <p>No workspaces found.</p>
        `
      });
      listGroup.appendChild(empty);
    } else {
      this.workspaces.forEach((ws, index) => {
        const isActive = ws.id === this.activeId;
        const isEditing = ws.id === this.editingId;
        const item = DesignSystem.createElement('div', ['ws-list-item', isActive ? 'active' : '']);
        
        // Column 1: Name & Icon
        const leftCol = DesignSystem.createElement('div', 'ws-list-item-left');
        const icon = DesignSystem.createElement('div', 'ws-list-item-icon', {
          html: (DesignSystem.ICONS && DesignSystem.ICONS['folder']) || '📁'
        });
        const nameWrap = DesignSystem.createElement('div', 'ws-list-item-name-wrap');
        
        if (isEditing) {
          // Inline Input for Renaming
          const input = DesignSystem.createElement('input', 'ws-inline-edit-input', {
            value: ws.name
          });
          
          const saveEdit = () => {
            const newName = input.value.trim();
            if (newName && newName !== ws.name) {
              this.onRename(ws.id, newName);
            }
            this.editingId = null;
            this.refreshPopover(item);
          };

          const cancelEdit = () => {
            this.editingId = null;
            this.refreshPopover(item);
          };

          input.onkeydown = (e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
          };
          
          input.onblur = saveEdit;
          nameWrap.appendChild(input);
          setTimeout(() => input.focus(), 50);
        } else {
          const name = DesignSystem.createElement('div', 'ws-list-item-name', { 
            text: ws.name,
            title: 'Double-click to rename'
          });
          
          // Trigger inline edit on double click
          name.ondblclick = (e) => {
            e.stopPropagation();
            this.editingId = ws.id;
            this.refreshPopover(item);
          };

          nameWrap.appendChild(name);
          
          if (isActive) {
            const badge = DesignSystem.createElement('span', 'ws-badge', { text: 'IN OPEN' });
            nameWrap.appendChild(badge);
          }
        }
        
        leftCol.appendChild(icon);
        leftCol.appendChild(nameWrap);

        // Column 2: Path
        const pathCol = DesignSystem.createElement('div', 'ws-list-item-path-col');
        const path = DesignSystem.createElement('div', 'ws-list-item-path', { text: ws.path.toUpperCase() });
        pathCol.appendChild(path);

        // Column 3: Actions
        const rightCol = DesignSystem.createElement('div', 'ws-list-item-right');
        const actions = DesignSystem.createElement('div', 'ws-list-item-actions');
        
        // Use global Design System delete button class
        const deleteBtn = new IconActionButton({
          iconName: 'x',
          title: 'Remove Workspace',
          isDanger: true,
          className: 'ds-item-delete-btn',
          onClick: () => this.onDelete(ws)
        });

        actions.appendChild(deleteBtn.render());
        rightCol.appendChild(actions);

        item.appendChild(leftCol);
        item.appendChild(pathCol);
        item.appendChild(rightCol);

        if (!isEditing) {
          item.onclick = () => this.onSelect(ws.id);
        }

        listGroup.appendChild(item);
        
        // Divider
        if (index < this.workspaces.length - 1) {
          listGroup.appendChild(this._createDivider());
        }
      });
    }
    container.appendChild(listGroup);

    // 2. Add New Workspace Button (Direct)
    const addIcon = (DesignSystem.ICONS && DesignSystem.ICONS['plus']) || '+';
    const addBtn = DesignSystem.createElement('div', 'ws-add-action-btn', {
      html: `
        <span class="ws-add-icon">${addIcon}</span>
        <span class="ws-add-text">Create New Workspace</span>
      `
    });
    addBtn.onclick = () => this.onAdd();
    container.appendChild(addBtn);

    return container;
  }

  refreshPopover(element) {
    const shield = element.closest('.ds-popover-shield, .ds-popover-floating');
    if (shield && shield.__popover) {
      const body = shield.querySelector('.ds-popover-body');
      if (body) {
        body.innerHTML = '';
        body.appendChild(this.render());
      }
    }
  }

  _createDivider() {
    return DesignSystem.createElement('div', 'setting-divider');
  }

  static open(data) {
    const component = new WorkspacePickerComponent(data);
    const content = component.render();

    return DesignSystem.createPopoverShield({
      title: 'Select Workspace',
      content: content,
      width: '960px',
      className: 'workspace-picker-popover'
    });
  }
}

window.WorkspacePickerComponent = WorkspacePickerComponent;

```
</file>

<file path="renderer/js/core/app.js">
```js
/* global AppState, SidebarLeft, MarkdownViewer, RightSidebar, 
   SettingsService, SearchPalette, ShortcutsComponent, ShortcutService,
   TreeModule, WorkspaceModule, CollectModule, 
   DraftModule, EditorModule, 
   EditToolbarComponent,
   TabsModule, TabPreview, io, initMermaid, initZoom, ScrollModule, RecentlyViewedModule, ChangeActionViewBar, CommentsModule */
/* ============================================================
   app.js — Core state, file loading, socket connection, boot
   Other responsibilities live in dedicated modules:
     zoom.js     — Zoom modal
     mermaid.js  — Diagram rendering
   ============================================================ */


window.AppState = {
  currentFile: null,
  currentWorkspace: null,
  currentMode: 'read',
  commentMode: false,
  socket: null,

  // Theme & Explorer settings (persisted in localStorage + Server)
  settings: {
    accentColor: localStorage.getItem('md-accent-color') || '#ffbf48',
    bgEnabled: localStorage.getItem('md-bg-enabled') === 'true',
    bgImage: localStorage.getItem('md-bg-image') || '',
    textZoom: parseInt(localStorage.getItem('md-text-zoom') || '100', 10),
    codeZoom: parseInt(localStorage.getItem('md-code-zoom') || '100', 10),
    showHidden: localStorage.getItem('md-show-hidden') === 'true',
    hideEmptyFolders: localStorage.getItem('md-hide-empty') === 'true',
    flatView: localStorage.getItem('md-flat-view') === 'true',
    hiddenPaths: (() => {
      try { return JSON.parse(localStorage.getItem('md-hidden-paths') || '[]'); } 
      catch (_e) { return []; }
    })(),
    showHiddenInSearch: localStorage.getItem('md-show-hidden-search') === 'true',
    fontText: localStorage.getItem('md-font-text') || 'Inter',
    fontCode: localStorage.getItem('md-font-code') || 'Roboto Mono',
    sortMethod: localStorage.getItem('mdpreview_sort_method') || 'alphabetical_asc',
    recentCollapsed: localStorage.getItem('mdpreview_recent_collapsed') === 'true',
    explorerCollapsed: localStorage.getItem('mdpreview_explorer_collapsed') === 'true',
    sidebarWidth: parseInt(localStorage.getItem('mdpreview_sidebar_left_width') || '260', 10),
    rightSidebarWidth: parseInt(localStorage.getItem('mdpreview_sidebar_right_width') || '300', 10),
    rightSidebarOpen: localStorage.getItem('md-right-sidebar-open') === 'true',
    rightSidebarTab: localStorage.getItem('md-right-sidebar-tab') || 'comments',
    handoffToken: localStorage.getItem('md-handoff-token') || '',
    publishWorkerUrl: localStorage.getItem('md-publish-worker-url') || '',
    publishAdminSecret: localStorage.getItem('md-publish-admin-secret') || '',
    publishData: (() => {
      try { return JSON.parse(localStorage.getItem('md-publish-data') || '{}'); }
      catch (_e) { return {}; }
    })()
  },

  /**
   * Loads the global state from the server and merges it with localStorage
   */
  async loadPersistentState() {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) return;
      const data = await res.json();

      const hasServerData = data && (data.settings || data.allTabs);

      // 1. Restore Settings
      if (data.settings) {
        Object.assign(this.settings, data.settings);
        Object.keys(data.settings).forEach(key => {
          const storageKey = this._getStorageKey(key);
          if (storageKey) localStorage.setItem(storageKey, data.settings[key]);
        });
      }

      // 2. Restore Tabs for all workspaces
      if (data.allTabs) {
        Object.keys(data.allTabs).forEach(wsId => {
          localStorage.setItem(`tabs_${wsId}`, JSON.stringify(data.allTabs[wsId]));
        });
      }

      // 2b. Restore Recently Viewed
      if (data.allRecent) {
        Object.keys(data.allRecent).forEach(wsId => {
          localStorage.setItem(`mdpreview_recent_${wsId}`, JSON.stringify(data.allRecent[wsId]));
        });
      }

      // 2c. Restore Globals
      if (data.sessionModes) localStorage.setItem('mdpreview_session_modes', JSON.stringify(data.sessionModes));
      if (data.customOrders) localStorage.setItem('mdpreview_custom_orders', JSON.stringify(data.customOrders));
      if (data.expandedPaths) localStorage.setItem('mdpreview_expanded_paths', JSON.stringify(data.expandedPaths));
      if (data.scrollPositions) localStorage.setItem('md-scroll-positions', JSON.stringify(data.scrollPositions));

      // 3. First-time sync: If server is empty but local has data, push to server
      if (!hasServerData) {
        const hasLocalData = Object.keys(localStorage).some(k =>
          k.startsWith('tabs_') ||
          k.startsWith('md-') ||
          k === 'mdpreview_custom_orders' ||
          k === 'mdpreview_expanded_paths'
        );
        if (hasLocalData) {
          console.warn('AppState: Initializing server state from local data...');
          this.savePersistentState();
        }
      }

      if (typeof SettingsService !== 'undefined') {
        SettingsService.applyTheme();
      }
    } catch (e) {
      console.warn('Failed to load persistent state from server:', e);
    }
  },

  /**
   * Saves the current state to the server (with debouncing)
   */
  async savePersistentState() {
    if (this._saveTimer) clearTimeout(this._saveTimer);

    this._saveTimer = setTimeout(async () => {
      try {
        const allTabs = {};
        const allRecent = {};

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (key.startsWith('tabs_')) {
            const wsId = key.replace('tabs_', '');
            try { allTabs[wsId] = JSON.parse(localStorage.getItem(key)); } catch (_e) { }
          }
          else if (key.startsWith('mdpreview_recent_')) {
            const wsId = key.replace('mdpreview_recent_', '');
            try { allRecent[wsId] = JSON.parse(localStorage.getItem(key)); } catch (_e) { }
          }
        }

        const state = {
          settings: this.settings,
          allTabs,
          allRecent,
          sessionModes: JSON.parse(localStorage.getItem('mdpreview_session_modes') || '{}'),
          customOrders: JSON.parse(localStorage.getItem('mdpreview_custom_orders') || '{}'),
          expandedPaths: JSON.parse(localStorage.getItem('mdpreview_expanded_paths') || '[]'),
          scrollPositions: JSON.parse(localStorage.getItem('md-scroll-positions') || '{}'),
          lastUpdated: new Date().toISOString()
        };

        await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state)
        });

        this._saveTimer = null;
      } catch (e) {
        console.warn('Failed to save state to server:', e);
      }
    }, 500);
  },

  _getStorageKey(settingsKey) {
    if (typeof SettingsService !== 'undefined') {
      return SettingsService.getStorageKey(settingsKey);
    }
    return null;
  },

  getFileViewMode(path) {
    if (path && path.startsWith('__DRAFT_')) {
      if (typeof DraftModule !== 'undefined') return DraftModule.getDraftViewMode(path) || 'edit';
    }
    try {
      const modes = JSON.parse(localStorage.getItem('mdpreview_session_modes') || '{}');
      return modes[path] || 'read';
    } catch (_e) {
      return 'read';
    }
  },

  setFileViewMode(path, mode) {
    if (path && path.startsWith('__DRAFT_')) {
      if (typeof DraftModule !== 'undefined') DraftModule.setDraftViewMode(path, mode);
    } else {
      try {
        const modes = JSON.parse(localStorage.getItem('mdpreview_session_modes') || '{}');
        modes[path] = mode;
        localStorage.setItem('mdpreview_session_modes', JSON.stringify(modes));
        if (AppState.savePersistentState) AppState.savePersistentState();
      } catch (_e) { }
    }
  },

  /**
   * Called when sidebar mode changes (Space <-> Draft)
   */
  async onModeChange(mode, targetId) {
    // ── Dirty check before switching ────────────
    if (AppState.currentMode === 'edit' && typeof EditorModule !== 'undefined' && EditorModule.isDirty()) {
      const isDraft = AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_');
      const isFirstEdit = EditorModule.getOriginalContent() === '';

      if (isDraft || isFirstEdit) {
        await EditorModule.save();
      } else {
        DesignSystem.showConfirm({
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Save them before switching?',
          onConfirm: async () => {
            await EditorModule.save();
            this.onModeChange(mode, targetId);
          }
        });
        return;
      }
    }

    if (mode === 'draft') {
      const isSwitching = !!targetId;
      const draftId = targetId || `__DRAFT_${Date.now()}__`;

      // 1. Initialize for NEW Draft
      if (!isSwitching && typeof DraftModule !== 'undefined') {
        DraftModule.createDraft(draftId);
        if (typeof EditorModule !== 'undefined') {
          EditorModule.setOriginalContent('');
        }
      }

      // 2. Switch to Draft virtual file
      if (AppState.currentFile !== draftId) {
        ScrollModule.save(AppState.currentFile);
        AppState.currentFile = draftId;
        ScrollModule.restore(draftId);
      }

      // 3. UI Updates
      if (typeof CommentsModule !== 'undefined') CommentsModule.loadForFile(draftId);
      if (AppState.commentMode && typeof CommentsModule !== 'undefined') CommentsModule.removeCommentMode();

      const viewer = document.getElementById('md-viewer-mount');
      if (viewer) viewer.setAttribute('data-active-mode', 'draft');

      if (typeof DraftModule !== 'undefined') DraftModule.syncPreview();
      if (typeof TabsModule !== 'undefined') TabsModule.open(draftId);

      // 4. Refresh toolbar UI state
      if (typeof AppState.updateToolbarUI === 'function') {
        let targetMode = AppState.getFileViewMode(draftId);
        if (!isSwitching || !DraftModule.getDraftContent(draftId)) targetMode = 'edit';
        AppState.updateToolbarUI(targetMode);
      }

      const mdContent = document.getElementById('md-content');
      if (mdContent) {
        mdContent.classList.add('fade-in');
        setTimeout(() => mdContent.classList.remove('fade-in'), 300);
      }
    }
  }
};

// ── Socket ───────────────────────────────────────────────────
function initSocket() {
  if (typeof io === 'undefined' || AppState.socket) return;
  AppState.socket = io();

  AppState.socket.on('file-changed', ({ file }) => {
    if (file === AppState.currentFile) {
      loadFile(AppState.currentFile, { silent: true }).catch(() => { });

      // ── UX-02 Polish: Sync original content if editor is clean ──
      if (AppState.currentMode === 'edit' && typeof EditorModule !== 'undefined') {
        if (!EditorModule.isDirty()) {
          // Fetch raw content silently and update originalContent to match disk
          fetch(`/api/file/raw?path=${encodeURIComponent(file)}`)
            .then(res => res.json())
            .then(data => {
              if (data && data.content) EditorModule.setOriginalContent(data.content);
            })
            .catch(() => { });
        }
      }
    }
  });

  AppState.socket.on('tree-changed', () => { TreeModule.load(); });

  AppState.socket.on('file-deleted', ({ file }) => {
    if (typeof TabsModule !== 'undefined') TabsModule.remove(file, true);
    if (typeof RecentlyViewedModule !== 'undefined') RecentlyViewedModule.remove(file);
    TreeModule.load();
  });

  AppState.socket.on('workspace-changed', () => {
    TreeModule.load();
    setNoFile();
    RecentlyViewedModule.render();
  });
}

// ── File Loading ─────────────────────────────────────────────
let loadTicket = 0;

async function loadFile(filePath, options = {}) {
  const silent = !!options.silent;
  if (!AppState.currentWorkspace) return;

  // 1. Dirty check (PRIORITY: Before showing skeleton)
  if (AppState.currentMode === 'edit' && typeof EditorModule !== 'undefined' && EditorModule.isDirty()) {
    const isDraft = AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_');
    const isFirstEdit = EditorModule.getOriginalContent() === '';

    if (isDraft || isFirstEdit) {
      // Auto-save and proceed silently
      await EditorModule.save();
    } else if (AppState.currentFile !== filePath) { // Only prompt if switching files
      DesignSystem.showConfirm({
        title: 'Unsaved Changes',
        message: `You have unsaved changes. Save them before switching to ${filePath.split('/').pop()}?`,
        onConfirm: async () => {
          const saved = await EditorModule.save();
          if (saved) loadFile(filePath, options).catch(() => { });
        }
      });
      return;
    }
  }

  const currentTicket = ++loadTicket;

  // ABSOLUTE FIRST PRIORITY: Save current scroll before ANY other logic fires
  if (AppState.currentFile && window.ScrollModule) {
    window.ScrollModule.save(AppState.currentFile);
  }

  // 0. Show skeleton only if NOT silent
  const viewer = MarkdownViewer.getInstance();
  const mdContent = document.getElementById('md-content');
  const inner = mdContent ? (mdContent.querySelector('.md-content-inner') || mdContent) : null;
  const emptyState = document.getElementById('empty-state');

  if (!silent) {
    if (emptyState) emptyState.style.display = 'none';
    if (mdContent && inner) {
      mdContent.style.display = 'block';
      inner.innerHTML = ''; 
      inner.classList.add('is-loading');
    }
    if (viewer) {
      viewer.setState({ mode: 'read', file: filePath, html: '<div class="skeleton-text" style="width: 100%; height: 200px;"></div>' });
    }
  }

  let data = { html: '' };
  if (filePath && filePath.startsWith('__DRAFT_')) {
    if (typeof DraftModule !== 'undefined') {
      data.html = DraftModule.getRenderedHtml ? DraftModule.getRenderedHtml(filePath) : '';
    }
  } else {
    try {
      const res = await fetch(`/api/render?file=${encodeURIComponent(filePath)}`);
      if (currentTicket !== loadTicket) return;

      if (!res.ok) {
        throw new Error(`Failed to load file: ${filePath} (Status: ${res.status})`);
      }
      data = await res.json();
    } catch (_err) {
      if (currentTicket === loadTicket && viewer) {
        viewer.setState({ mode: 'read', file: filePath, html: '<div class="ds-error-state">Failed to render markdown.</div>' });
      }
      return;
    }
  }

  if (currentTicket !== loadTicket) return;

  AppState.currentFile = filePath;
  TabsModule.open(filePath);

  if (viewer) {
    viewer.setState({ 
      mode: AppState.getFileViewMode(filePath), 
      file: filePath, 
      content: data.raw || '', 
      html: data.html 
    });
  } else if (mdContent && inner) {
    // Legacy fallback
    inner.innerHTML = data.html;
    inner.classList.remove('is-loading');
  }

  updateHeaderUI();

  try {
    if (typeof CommentsModule !== 'undefined') await CommentsModule.loadForFile(filePath);
  } catch (_e) { }

  try {
    if (typeof CollectModule !== 'undefined') CollectModule.loadForFile(filePath);
  } catch (_e) { }

  RecentlyViewedModule.add(filePath);

  if (typeof AppState.updateToolbarUI === 'function') {
    let targetMode = AppState.getFileViewMode(filePath);
    if (filePath && filePath.startsWith('__DRAFT_')) {
      const content = (typeof DraftModule !== 'undefined') ? DraftModule.getDraftContent(filePath) : '';
      if (!content || content.trim() === '') targetMode = 'edit';
    }
    AppState.updateToolbarUI(targetMode);
  }

  TreeModule.setActiveFile(filePath);
}

function setNoFile() {
  AppState.currentFile = null;
  AppState.currentMode = 'read';

  const viewer = MarkdownViewer.getInstance();
  if (viewer) {
    viewer.setState({ mode: 'empty', file: null, content: '', html: '' });
  } else {
    const emptyState = document.getElementById('empty-state');
    const mdContent = document.getElementById('md-content');
    const editViewer = document.getElementById('edit-viewer');

    if (emptyState) emptyState.style.display = 'flex';
    if (mdContent) mdContent.style.display = 'none';
    if (editViewer) editViewer.style.display = 'none';
  }

  updateHeaderUI();

  if (typeof CommentsModule !== 'undefined') CommentsModule.clearUI();
  if (typeof CollectModule !== 'undefined') CollectModule.loadForFile(null);

  if (typeof TreeModule !== 'undefined') TreeModule.setActiveFile(null);
  if (typeof RecentlyViewedModule !== 'undefined') RecentlyViewedModule.setActiveFile(null);

  // Hide secondary toolbar
  if (typeof AppState.updateToolbarUI === 'function') {
    AppState.updateToolbarUI(AppState.currentMode || 'read');
  }
}

/**
 * Global function to sync the toolbar header with AppState
 */
function updateHeaderUI() {
  const wsNameEl = document.getElementById('header-workspace-name');
  const fileNameEl = document.getElementById('header-file-name');

  if (!wsNameEl || !fileNameEl) return;

  // If in Draft Response tab (checked externally via sidebar state or handled by draft.js),
  // this function will be overridden or skipped.
  // But generally, show workspace and file:

  fileNameEl.style.display = ''; // Ensure visible

  if (AppState.currentFile) {
    wsNameEl.innerText = (AppState.currentWorkspace ? AppState.currentWorkspace.name.toUpperCase() : 'UNKNOWN') + '.';
    let displayName = AppState.currentFile.split('/').pop();
    if (displayName.toLowerCase().endsWith('.md')) {
      displayName = displayName.substring(0, displayName.length - 3);
    }
    fileNameEl.innerText = displayName;
  } else {
    wsNameEl.innerText = AppState.currentWorkspace ? AppState.currentWorkspace.name.toUpperCase() + '.' : 'TOUCH.';
    fileNameEl.innerText = 'Select a file';
  }
}


// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Load persistent state from server (priority over localStorage)
  await AppState.loadPersistentState();

  // 2. Initial UI setup
  if (typeof SettingsService !== 'undefined') {
    SettingsService.applyTheme();
  }

  // 1. Core UI Components First
  SidebarLeft.init();        // organisms/sidebar-left.js
  ChangeActionViewBar.init(); // organisms/change-action-view-bar.js
  RightSidebar.init();        // organisms/right-sidebar.js
  EditToolbarComponent.init(); // organisms/edit-toolbar-component.js

  // 2. Support Modules
  initSocket();
  initMermaid();          // mermaid.js
  initZoom();             // zoom.js

  // ── Shortcut Management ──
  if (typeof ShortcutService !== 'undefined' && typeof ShortcutsComponent !== 'undefined') {
    ShortcutService.init();
    
    // Register Default Groups from ShortcutsComponent
    const isMac = ShortcutService.isMac();
    const groups = ShortcutsComponent.getShortcutData(isMac);
    
    // Assign Handlers
    const handlers = {
      'mode-read': () => {
        const btn = document.querySelector('.ds-segment-item[data-id="read"]');
        if (btn) btn.click();
        else if (window.AppState?.onModeChange) AppState.onModeChange('read');
      },
      'mode-edit': () => {
        const btn = document.querySelector('.ds-segment-item[data-id="edit"]');
        if (btn) btn.click();
        else if (window.AppState?.onModeChange) AppState.onModeChange('edit');
      },
      'mode-comment': () => {
        const btn = document.querySelector('.ds-segment-item[data-id="comment"]');
        if (btn) btn.click();
        else if (window.AppState?.onModeChange) AppState.onModeChange('comment');
      },
      'mode-collect': () => {
        const btn = document.querySelector('.ds-segment-item[data-id="collect"]');
        if (btn) btn.click();
        else if (window.AppState?.onModeChange) AppState.onModeChange('collect');
      },
      'toggle-sidebar': () => {
        if (window.TabsModule?.toggleSidebar) window.TabsModule.toggleSidebar();
        else document.getElementById('sidebar-toggle-btn')?.click();
      },
      'focus-search': () => window.SearchPalette?.show(),
      'scroll-top': () => {
        const v = window.MarkdownViewer?.getInstance();
        const scrollEl = v ? v.getActiveScrollElement() : document.getElementById('md-viewer-mount');
        if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
      },
      'scroll-bottom': () => {
        const v = window.MarkdownViewer?.getInstance();
        const scrollEl = v ? v.getActiveScrollElement() : document.getElementById('md-viewer-mount');
        if (scrollEl) scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
      },
      'toggle-fullscreen': () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      },
      'save-file': () => window.EditorModule?.save(),
      'copy-markdown': () => {
        const v = window.MarkdownViewer?.getInstance();
        if (v) v.copyMarkdown();
      },
      'copy-as-file': () => {
        const v = window.MarkdownViewer?.getInstance();
        if (v) v.copyAsFile();
      },
      'copy-gdocs': () => {
        const v = window.MarkdownViewer?.getInstance();
        if (v) v.copyForGDocs();
      },
      'toggle-toc': () => {
        const v = window.MarkdownViewer?.getInstance();
        if (v) v.toggleTOC();
      },
      'toggle-map': () => {
        const v = window.MarkdownViewer?.getInstance();
        if (v) v.toggleProjectMap();
      },
      'import-markdown': async () => {
        if (!window.EditorModule || !window.electronAPI) return;
        const paths = await window.electronAPI.openFiles({
          properties: ['openFile'],
          filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }]
        });
        if (paths && paths.length > 0) {
          const res = await window.electronAPI.readFile(paths[0]);
          if (res.success) {
            window.EditorModule.insertContent(res.content, 'replace');
            if (window.showToast) window.showToast('Content imported');
          }
        }
      },
      'append-markdown': async () => {
        if (!window.EditorModule || !window.electronAPI) return;
        const paths = await window.electronAPI.openFiles({
          properties: ['openFile'],
          filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }]
        });
        if (paths && paths.length > 0) {
          const res = await window.electronAPI.readFile(paths[0]);
          if (res.success) {
            window.EditorModule.insertContent(res.content, 'append');
            if (window.showToast) window.showToast('Content appended');
          }
        }
      },
      'undo': () => document.execCommand('undo'),
      'redo': () => document.execCommand('redo'),
      'markdown-helper': () => window.MarkdownHelperComponent?.open(),
      'select-all-tabs': () => window.TabsModule?.selectAll(),
      'close-active-tab': () => {
        const active = window.TabsModule?.getActive();
        if (active) window.TabsModule.remove(active);
      },
      'close-all-tabs': () => window.TabsModule?.closeAll(),
      'toggle-pin-tab': () => {
        const active = window.TabsModule?.getActive();
        if (active) window.TabsModule.togglePin(active);
      },
      'deselect-tabs': () => {
        if (window.TabsModule) window.TabsModule.deselectAll();
        if (window.TreeModule) window.TreeModule.deselectAll();
      },
      'new-file': () => {
        const btn = document.querySelector('[data-action-id="new-file"]');
        if (btn) btn.click();
        else if (window.TreeModule) window.TreeModule.createNewFile();
      },
      'new-folder': () => {
         if (window.TreeModule) window.TreeModule.createNewFolder();
      },
      'rename-selected': () => {
         if (window.TreeModule) window.TreeModule.renameSelected();
      },
      'duplicate-file': () => {
         if (window.TreeModule) window.TreeModule.duplicateSelected();
      },
      'delete-selected': () => {
         if (window.TreeModule) window.TreeModule.deleteSelected();
      },
      'workspace-picker': () => document.getElementById('workspace-switcher')?.click(),
      'hide-unhide': () => {
         if (window.TreeModule) window.TreeModule.toggleHiddenItems();
      },
      'collapse-all': () => {
         if (window.TreeModule) window.TreeModule.collapseAll();
      },
      'collapse-others': () => {
         if (window.TreeModule) {
           const state = window.TreeModule.getState();
           const target = state.selectedPaths.length > 0 ? state.selectedPaths[0] : null;
           if (target) window.TreeModule.collapseOthers(target);
         }
      },
      'keyboard-shortcuts': () => window.SearchPalette?.show('shortcut'),
      'open-settings': () => window.SettingsComponent?.toggle(),
      'close-cancel': () => {
         // Close Search
         if (window.SearchPalette && window.SearchPalette.isOpen()) {
           window.SearchPalette.hide();
         }
         // Close Settings
         if (window.SettingsComponent && window.SettingsComponent.activeInstance) {
           window.SettingsComponent.hide();
         }
         // Global deselect
         if (window.TabsModule) window.TabsModule.deselectAll();
         if (window.TreeModule) window.TreeModule.deselectAll();
      }
    };

    // Inject handlers into groups
    groups.forEach(group => {
      group.items.forEach(item => {
        if (handlers[item.id]) {
          item.handler = handlers[item.id];
        }
      });
    });

    ShortcutService.registerGroups(groups);
  }

  if (typeof SearchPalette !== 'undefined') SearchPalette.init();

  // 3. Functional Modules
  if (typeof SettingsService !== 'undefined') {
    SettingsService.applyTheme();
  }
  DraftModule.init();        // draft.js
  MarkdownViewer.init();      // organisms/markdown-viewer-component.js
  ScrollModule.init();       // scroll.js
  TabPreview.init();         // molecules/tab-preview.js
  ScrollModule.setContainer(document.getElementById('md-viewer-mount'));

  // 4. Tab System (triggers initial loadFile)
  TabsModule.init();         // tabs.js

  if (typeof CollectModule !== 'undefined') CollectModule.init(); // collect.js
  if (typeof window.TOCComponent !== 'undefined') window.TOCComponent.init(); // organisms/toc-component.js
  if (typeof CommentsModule !== 'undefined') CommentsModule.init(); // comments.js

  setTimeout(() => {
    if (typeof TreeModule !== 'undefined') TreeModule.init();
    if (typeof WorkspaceModule !== 'undefined') WorkspaceModule.init();
    if (typeof RecentlyViewedModule !== 'undefined') {
      RecentlyViewedModule.init();
      RecentlyViewedModule.render();
    }
  }, 0);
});

/**
 * Global Toast Notification
 */
function showToast(message, type = 'success', options = {}) {
  const toastId = options.id || 'default-toast';
  let container = document.getElementById(`toast-${toastId}`);
  
  if (!container) {
    container = document.createElement('div');
    container.id = `toast-${toastId}`;
    container.className = 'toast-container';
    container.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon"></div>
        <div class="toast-message"></div>
        <div class="toast-close">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </div>
        <div class="toast-progress-container">
          <div class="toast-progress-bar"></div>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    container.querySelector('.toast-close').onclick = () => {
      container.classList.remove('show');
      setTimeout(() => container.remove(), 400);
    };
  }

  const content = container.querySelector('.toast-content');
  const icon = container.querySelector('.toast-icon');
  const messageEl = container.querySelector('.toast-message');
  const progressBar = container.querySelector('.toast-progress-bar');

  // Set Type
  content.className = `toast-content ${type}`;
  if (options.progress !== undefined) {
    content.classList.add('has-progress');
    progressBar.style.width = `${options.progress}%`;
  } else {
    content.classList.remove('has-progress');
  }

  messageEl.textContent = message;

  // Set Icon
  if (type === 'error') {
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else {
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`;
  }

  container.classList.add('show');

  // Auto hide (unless sticky)
  if (container._timer) clearTimeout(container._timer);
  if (!options.sticky) {
    container._timer = setTimeout(() => {
      container.classList.remove('show');
      setTimeout(() => container.remove(), 400);
    }, options.duration || 4000);
  }
}
window.showToast = showToast;

```
</file>

<file path="renderer/js/core/electron-bridge.js">
```js
/* ============================================================
   electron-bridge.js — Fallback for web browser environment
   ============================================================ */

(function() {
  // If window.electronAPI is already defined (by Electron preload), do nothing.
  if (window.electronAPI) return;

  // console.log('%c[Bridge] Electron not detected. Polyfilling window.electronAPI via Express APIs...', 'color: #ffbf48; font-weight: bold;');

  const FILE_CACHE = new Map();

  window.electronAPI = {
    // Folder picker (In browser, we'll just prompt for a string or return null)
    openFolder: () => {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        
        input.onchange = (e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            // On web, we can't get absolute path, but we can get the folder name 
            // from the relative path of the first file.
            const firstFile = files[0];
            const relativePath = firstFile.webkitRelativePath;
            const folderName = relativePath.split('/')[0];
            resolve(folderName || 'Selected Folder');
          } else {
            resolve(null);
          }
        };
        
        input.oncancel = () => resolve(null);
        input.click();
      });
    },

    // Server watch dir
    setWatchDir: async (dirPath) => {
      const res = await fetch('/api/set-watch-dir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dir: dirPath })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },

    // Workspaces
    getWorkspaces: async () => {
      const res = await fetch('/api/workspaces');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    saveWorkspace: async (ws) => {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ws)
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    deleteWorkspace: async (id) => {
      const res = await fetch(`/api/workspaces/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    setActiveWorkspace: async (id) => {
      const res = await fetch('/api/workspaces/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    renameWorkspace: async (id, name) => {
      const res = await fetch('/api/workspaces/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },

    // Comments
    getComments: async (wsId, file) => {
      const res = await fetch(`/api/comments?wsId=${encodeURIComponent(wsId)}&file=${encodeURIComponent(file)}`);
      if (!res.ok) return []; // Fallback to empty if fails
      return res.json();
    },
    saveComment: async (wsId, file, comment) => {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wsId, file, commentData: comment })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    deleteComment: async (wsId, file, commentId) => {
      const res = await fetch(`/api/comments?wsId=${encodeURIComponent(wsId)}&file=${encodeURIComponent(file)}&commentId=${encodeURIComponent(commentId)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    clearComments: async (wsId, file) => {
      const res = await fetch('/api/comments/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wsId, file })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    
    // File System
    readFile: async (filePath) => {
      // Check frontend cache first (for web version picked files)
      if (FILE_CACHE.has(filePath)) {
        const file = FILE_CACHE.get(filePath);
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ success: true, content: reader.result });
          reader.onerror = () => resolve({ success: false, error: 'Failed to read file' });
          reader.readAsText(file);
        });
      }

      // Fallback to server API (only works for workspace files)
      const res = await fetch(`/api/file/raw?path=${encodeURIComponent(filePath)}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const content = await res.text();
      return { success: true, content };
    },
    deleteFile: async (filePath) => {
      const res = await fetch(`/api/file-ops?path=${encodeURIComponent(filePath)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    duplicateFile: async (filePath) => {
      const res = await fetch('/api/file-ops/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    renameFile: async (oldPath, newPath) => {
      const res = await fetch('/api/file-ops/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    moveFile: async (oldPath, newPath) => {
      const res = await fetch('/api/file-ops/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    copyFile: async (srcPath, destPath) => {
      const res = await fetch('/api/file-ops/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ srcPath, destPath })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    createFile: async (filePath, content = '') => {
      const res = await fetch('/api/file-ops/create-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    createFolder: async (folderPath) => {
      const res = await fetch('/api/file-ops/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    revealInFinder: async (filePath) => {
      console.warn('Reveal in finder not supported in browser:', filePath);
      return { success: false, error: 'Not supported in browser' };
    },
    
    copyFileToClipboard: async (filePath) => {
      try {
        // Browser fallback: Since we can't truly copy a file to OS clipboard, we trigger a download
        const res = await fetch(`/api/file/raw?path=${encodeURIComponent(filePath)}`);
        if (!res.ok) throw new Error('Failed to fetch file content');
        const content = await res.text();
        
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath.split('/').pop() || 'document.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (typeof showToast === 'function') showToast('File download triggered (Copy-as-file not supported in browser)', 'info');
        return { success: true };
      } catch (error) {
        console.error('Browser copy error:', error);
        return { success: false, error: error.message };
      }
    },
    
    startFileDrag: async (filePath, event) => {
      try {
        // Browser fallback: Use the DownloadURL trick for dragging to desktop
        const res = await fetch(`/api/file/raw?path=${encodeURIComponent(filePath)}`);
        if (!res.ok) return;
        const content = await res.text();
        
        const fileName = filePath.split('/').pop() || 'document.md';
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        // This is a legacy but effective trick for web browsers to drag-and-download
        if (event && event.dataTransfer) {
          event.dataTransfer.setData('DownloadURL', `text/markdown:${fileName}:${url}`);
        }
      } catch (error) {
        console.error('Browser drag error:', error);
      }
    },

    getAbsolutePath: async (filePath) => filePath,
    
    openFiles: async (options = {}) => {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = options.properties && options.properties.includes('multiSelections');
        
        input.onchange = (e) => {
          const files = Array.from(e.target.files);
          const paths = files.map(f => {
            // Store the actual file object in cache using its name as key
            FILE_CACHE.set(f.name, f);
            return f.name;
          });
          resolve(paths);
        };
        
        input.oncancel = () => resolve([]);
        input.click();
      });
    },

    copyFileFromBuffer: async (buffer, filename) => {
      try {
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    rasterizeSVG: async (svg, w, h) => {
      // Browser-side SVG to PNG fallback
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        canvas.width = w * 2;
        canvas.height = h * 2;
        
        const encodedData = window.btoa(unescape(encodeURIComponent(svg)));
        const dataUrl = `data:image/svg+xml;base64,${encodedData}`;
        
        img.onload = () => {
          ctx.fillStyle = '#1e1e1e';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (e) => reject(new Error('SVG render failed: ' + e));
        img.src = dataUrl;
      });
    },

    writeClipboardAdvanced: async (data) => {
      try {
        if (data.html) {
          const blob = new Blob([data.html], { type: 'text/html' });
          const textBlob = new Blob([data.text || ''], { type: 'text/plain' });
          const item = new window.ClipboardItem({
            'text/html': blob,
            'text/plain': textBlob
          });
          await navigator.clipboard.write([item]);
        } else {
          await navigator.clipboard.writeText(data.text || '');
        }
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    publishToWorker: async (data) => {
      try {
        const { payload, workerUrl, secret } = data;
        
        // If web version, we proxy through our own server to keep secret safe
        const response = await fetch('/api/worker-publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload, workerUrl, secret })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('[Bridge] Worker Publish error:', error);
        return { success: false, error: error.message };
      }
    },

    publishToHandoff: async (data) => {
      try {
        const response = await fetch('/api/handoff/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with ${response.status}`);
        }

        const result = await response.json();
        
        if (typeof showToast === 'function') {
          showToast('Published via Proxy (Note: Local images are not supported in web mode)', 'info');
        }
        
        return { success: true, url: result.url };
      } catch (error) {
        console.error('[Bridge] Publish error:', error);
        return { success: false, error: error.message };
      }
    },
    
    isElectron: false,
    
    // Custom
    rebuildApp: () => {
      if (typeof showToast === 'function') showToast('Rebuild is only available in the desktop app.', 'error');
    }
  };
})();

```
</file>

<file path="renderer/js/modules/collect.js">
```js
const CollectModule = (() => {
  let ideas = [];
  let currentFilePath = null;

  // SVG constants removed in favor of Lucide icon names

  // ── Persistence ──────────────────────────────────────────
  function _getStorageKey(filePath) {
    return `mdpreview_ideas_${filePath}`;
  }

  function loadForFile(filePath) {
    if (!filePath) {
      ideas = [];
      _renderList();
      return;
    }
    currentFilePath = filePath;
    const stored = localStorage.getItem(_getStorageKey(filePath));
    ideas = stored ? JSON.parse(stored) : [];
    _renderList();
    _markLinesWithIdeas();
  }

  function _saveToStorage() {
    if (currentFilePath) {
      localStorage.setItem(_getStorageKey(currentFilePath), JSON.stringify(ideas));
    }
  }

  // ── CRUD ─────────────────────────────────────────────────
  function addIdea(text, lineStart = null, lineEnd = null, selectedText = null) {
    if (!text || text.trim() === '') return;
    
    const newIdea = {
      id: Date.now(),
      text: text.trim(),
      selectedText: selectedText || text.trim(), // Explicitly store selected text
      timestamp: new Date().toISOString(),
      lineStart,
      lineEnd
    };
    
    ideas.push(newIdea);
    _saveToStorage();
    _renderList();
    _markLinesWithIdeas();
    
    if (typeof showToast === 'function') {
      showToast('Idea bookmarked!');
    }
  }

  function removeIdea(id) {
    ideas = ideas.filter(i => i.id !== id);
    _saveToStorage();
    _renderList();
    _markLinesWithIdeas();
  }

  function clearAll() {
    if (!ideas.length) return;
    DesignSystem.showConfirm({
      title: 'Clear Collected Ideas',
      message: 'Are you sure you want to clear all collected ideas for this file?',
      onConfirm: () => {
        ideas = [];
        _saveToStorage();
        _renderList();
        _markLinesWithIdeas();
      }
    });
  }

  // ── Copy Functionality ───────────────────────────────────
  function copyAll() {
    if (!ideas.length) return;
    
    const lines = [];
    ideas.forEach((idea, index) => {
      lines.push(`idea ${index + 1}`);
      lines.push(idea.text);
      if (index < ideas.length - 1) {
        lines.push('');
        lines.push('----');
        lines.push('');
      }
    });
    
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      if (typeof showToast === 'function') {
        showToast(`Copied ${ideas.length} ideas to clipboard`);
      }
    });
  }

  // ── Rendering ────────────────────────────────────────────
  function _renderList() {
    const sidebar = RightSidebar.getInstance();
    if (!sidebar || AppState.currentMode !== 'collect') return;

    sidebar.setupModule({
      title: 'Collect',
      actions: [
        { id: 'clear', icon: 'trash', title: 'Clear all ideas', onClick: clearAll },
        { id: 'copy', icon: 'copy', title: 'Copy all ideas', onClick: copyAll }
      ],
      items: ideas,
      emptyState: {
        icon: 'bookmark',
        text: 'No ideas yet'
      },
      renderItem: (idea, index) => {
        const lineRef = idea.lineStart ? `LINE ${idea.lineStart}` : `IDEA ${index + 1}`;
        const item = DesignSystem.createElement('div', 'ds-sidebar-item');
        
        const header = DesignSystem.createElement('div', 'ds-item-header');
        const label = DesignSystem.createElement('span', 'ds-item-label', { text: lineRef });
        
        const deleteBtn = new IconActionButton({
          iconName: 'x',
          title: 'Remove',
          isDanger: true,
          className: 'ds-item-delete-btn',
          onClick: () => removeIdea(idea.id)
        });

        header.appendChild(label);
        header.appendChild(deleteBtn.render());

        const body = DesignSystem.createElement('div', 'ds-item-body ds-text-clamp-5', { html: _esc(idea.text) });

        item.appendChild(header);
        item.appendChild(body);
        
        item.onclick = () => _onItemClick(idea);
        
        return item;
      }
    });
  }

  function _onItemClick(idea) {
    if (!idea.lineStart) return;
    const targetLine = document.querySelector(`.md-line[data-line="${idea.lineStart}"]`);
    if (targetLine) {
      targetLine.scrollIntoView({ behavior: 'auto', block: 'center' });
      targetLine.classList.add('pulse-highlight-collect');
      setTimeout(() => targetLine.classList.remove('pulse-highlight-collect'), 2000);
    }
  }

  function _markLinesWithIdeas() {
    // 1. Clear old highlights
    document.querySelectorAll('.idea-range').forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      }
    });
    document.querySelectorAll('.md-line').forEach(el => el.classList.remove('has-idea'));
    
    // 2. Identify lines that need marking
    const lineMap = new Map();
    ideas.forEach(idea => {
      if (idea.lineStart) {
        const start = parseInt(idea.lineStart, 10);
        const end = idea.lineEnd ? parseInt(idea.lineEnd, 10) : start;
        for (let i = start; i <= end; i++) {
          if (!lineMap.has(i)) lineMap.set(i, []);
          lineMap.get(i).push(idea);
        }
      }
    });

    // 3. Apply highlights line by line
    lineMap.forEach((lineIdeas, lineNum) => {
      const lineEl = document.querySelector(`.md-line[data-line="${lineNum}"]`);
      if (!lineEl) return;
      _applyIdeaHighlights(lineEl, lineIdeas);
    });
  }

  function _applyIdeaHighlights(element, lineIdeas) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) textNodes.push(node);

    textNodes.forEach(textNode => {
      const content = textNode.textContent;
      const boundaries = new Set([0, content.length]);
      const nodeMap = new Map();

      lineIdeas.forEach(idea => {
        if (!idea.selectedText) return;
        let startIdx = 0;
        while ((startIdx = content.indexOf(idea.selectedText, startIdx)) !== -1) {
          const endIdx = startIdx + idea.selectedText.length;
          boundaries.add(startIdx);
          boundaries.add(endIdx);
          for (let i = startIdx; i < endIdx; i++) {
            if (!nodeMap.has(i)) nodeMap.set(i, idea);
          }
          startIdx = endIdx;
        }
      });

      if (nodeMap.size === 0) return;

      const sorted = Array.from(boundaries).sort((a, b) => a - b);
      const fragments = document.createDocumentFragment();
      for (let i = 0; i < sorted.length - 1; i++) {
        const start = sorted[i];
        const end = sorted[i+1];
        if (start === end) continue;
        const segmentText = content.substring(start, end);
        const idea = nodeMap.get(start);
        if (idea) {
          const mark = document.createElement('mark');
          mark.className = 'idea-range';
          mark.textContent = segmentText;
          mark.onclick = (e) => {
            e.stopPropagation();
            _onItemClick(idea);
          };
          fragments.appendChild(mark);
        } else {
          fragments.appendChild(document.createTextNode(segmentText));
        }
      }
      textNode.parentNode.replaceChild(fragments, textNode);
    });
  }

  function _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Selection Logic ──────────────────────────────────────
  let trigger = null;

  function applyCollectMode() {
    if (!trigger) {
      const triggerBtn = new IconActionButton({
        iconName: 'bookmark',
        title: 'Bookmark selection',
        isPrimary: true,
        isLarge: true,
        className: 'collect-trigger',
        onClick: (e) => _onTriggerClick(e)
      });
      trigger = triggerBtn.render();
      document.body.appendChild(trigger);
    }
    
    document.addEventListener('mouseup', _handleSelection);
    document.addEventListener('keyup', _handleSelection);
    _renderList(); // Initial render for sidebar
  }

  function removeCollectMode() {
    if (trigger) {
      trigger.classList.remove('show');
      trigger.style.display = 'none';
    }
    document.removeEventListener('mouseup', _handleSelection);
    document.removeEventListener('keyup', _handleSelection);
    
    // Clear selection to avoid re-triggering accidentally
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    
    const sidebar = RightSidebar.getInstance();
    if (sidebar) sidebar.close();
  }

  function _handleSelection() {
    const selection = window.getSelection();
    if (selection.isCollapsed || selection.toString().trim() === '') {
      if (trigger) trigger.classList.remove('show');
      return;
    }

    const range = selection.getRangeAt(0);
    const container = document.getElementById('md-content');
    
    if (!container.contains(range.commonAncestorContainer)) {
      if (trigger) trigger.classList.remove('show');
      return;
    }

    const rects = range.getClientRects();
    if (rects.length === 0) return;
    
    const lastRect = rects[rects.length - 1];
    
    if (trigger) {
      trigger.style.display = 'flex'; // Restore if hidden by removeCollectMode
      trigger.style.left = `${lastRect.right + 5}px`;
      trigger.style.top = `${lastRect.bottom + 5}px`;

      if (lastRect.right + 40 > window.innerWidth) {
        trigger.style.left = `${lastRect.left - 40}px`;
      }
      
      trigger.classList.add('show');
    }
  }

  function _onTriggerClick(e) {
    e.stopPropagation();
    const selection = window.getSelection();
    if (selection.isCollapsed) return;

    const text = selection.toString().trim();
    
    // Get line info
    const allLines = Array.from(document.querySelectorAll('.md-line'));
    const selectedLines = allLines.filter(el => selection.containsNode(el, true));
    let lineStart = null;
    let lineEnd = null;
    if (selectedLines.length > 0) {
      lineStart = parseInt(selectedLines[0].dataset.line, 10);
      lineEnd   = parseInt(selectedLines[selectedLines.length - 1].dataset.line, 10);
    }

    addIdea(text, lineStart, lineEnd, text); // Pass text as selectedText
    
    if (trigger) trigger.classList.remove('show');
    selection.removeAllRanges();
  }

  // ── Initialization ───────────────────────────────────────
  function init() {
    // UI is handled by RightSidebar organism
  }

  return {
    init,
    loadForFile,
    applyCollectMode,
    removeCollectMode,
    addIdea
  };
})();
window.CollectModule = CollectModule;

```
</file>

<file path="renderer/js/modules/comments.js">
```js
/* ============================================================
   comments.js — Comment mode, form, save/load/copy/clear
   Vanilla CSS version — no Tailwind / Lucide CDN needed
   ============================================================ */

const CommentsModule = (() => {
  let comments        = [];
  let formTarget      = null;
  let activeCommentId = null;

  // SVG constants removed in favor of Lucide icon names in RightSidebar setup

  // ── Load comments for a file ─────────────────────────────────
  async function loadForFile(filePath) {
    const ws = AppState.currentWorkspace;
    if (!ws || !filePath) { comments = []; _renderList(); return; }
    comments = await window.electronAPI.getComments(ws.id, filePath);
    _renderList();
    _markLinesWithComments();
  }

  // ── Save a new or existing comment ──────────────────────────
  async function save(lineStart, lineEnd, startLineContent, endLineContent, text, selectedText, context, id = null, headingPath = null) {
    const ws   = AppState.currentWorkspace;
    const file = AppState.currentFile;
    if (!ws || !file) return;
    const comment = await window.electronAPI.saveComment(ws.id, file, {
      id, lineStart, lineEnd, startLineContent, endLineContent, text, selectedText, context, headingPath
    });

    if (id) {
      // Update local list
      const idx = comments.findIndex(c => c.id === id);
      if (idx !== -1) {
        comments[idx] = comment;
      } else {
        // Fallback: search by new ID if the old one wasn't found
        const idxNew = comments.findIndex(c => c.id === comment.id);
        if (idxNew !== -1) comments[idxNew] = comment;
        else comments.push(comment);
      }
    } else {
      comments.push(comment);
    }

    comments.sort((a, b) => a.lineStart - b.lineStart);
    _renderList();
    _markLinesWithComments();
  }

  // ── Delete a comment ─────────────────────────────────────────
  async function remove(commentId) {
    const ws   = AppState.currentWorkspace;
    const file = AppState.currentFile;
    if (!ws || !file) return;

    comments = await window.electronAPI.deleteComment(ws.id, file, commentId);
    _clearHighlights();
    _renderList();
    _markLinesWithComments();
    if (typeof showToast === 'function') showToast('Comment removed');
  }

  // ── Clear all comments for current file ──────────────────────
  async function clear() {
    const ws   = AppState.currentWorkspace;
    const file = AppState.currentFile;
    if (!ws || !file) return;
    comments = await window.electronAPI.clearComments(ws.id, file);
    _clearHighlights();
    _renderList();
    _markLinesWithComments();
  }

  // ── Copy all comments to clipboard ───────────────────────────
  function copyAll() {
    if (!comments.length) return;
    const file  = AppState.currentFile || 'unknown';
    const count = comments.length;
    
    const lines = [
        `Dưới đây là [${count}] feedback cho tài liệu "${file}". Với mỗi block, hãy định vị ANCHOR bằng CONTEXT và POSITION, sau đó thực hiện FEEDBACK. Trả lời theo thứ tự comment.`,
        ``
    ];
    
    // Check for Additional Content if in AI mode
    if (file && file.startsWith('__DRAFT_')) {
      const extra = document.getElementById('ai-extra-input')?.value.trim();
      if (extra) {
        lines.push(`================================================================`);
        lines.push(`[ADDITIONAL CONTENT / USER CONTEXT]`);
        lines.push(`----------------------------------------------------------------`);
        lines.push(extra);
        lines.push(`================================================================`);
        lines.push(``);
      }
    }

    comments.forEach((c, index) => {
      // Normalize whitespace for cleaner report
      const anchor = (c.selectedText || c.startLineContent || 'N/A').trim().replace(/\s+/g, ' ');
      const lineRef = (c.lineStart === c.lineEnd) ? `L${c.lineStart}` : `L${c.lineStart} -> L${c.lineEnd}`;
      const before = (c.context?.before || '').trim().replace(/\s+/g, ' ');
      const after  = (c.context?.after || '').trim().replace(/\s+/g, ' ');

      const position = c.headingPath || "General";

      lines.push(`================================================================`);
      lines.push(`[COMMENT #${index + 1}]`);
      lines.push(`----------------------------------------------------------------`);
      lines.push(`ANCHOR: "${anchor}"`);
      lines.push(``);
      lines.push(`CONTEXT: "...${before} [${anchor}] ${after}..."`);
      lines.push(``);
      lines.push(`POSITION: ${position} (${lineRef})`);
      lines.push(``);
      lines.push(`FEEDBACK:`);
      lines.push(c.text);
      lines.push(`================================================================`);
      lines.push(``);
    });

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
        // Feedback logic
        if (typeof showToast === 'function') {
            const msg = `Copied ${count} comment${count !== 1 ? 's' : ''}`;
            showToast(msg);
        }
        
        // Icon animation
        const btn = document.querySelector('.ds-header-action[data-action-id="copy"]');
        if (btn) {
            const originalIcon = btn.innerHTML;
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>`;
            btn.style.color = 'var(--accent-color)';
            setTimeout(() => {
                btn.innerHTML = originalIcon;
                btn.style.color = '';
            }, 1000);
        }
    });
  }

  // ── Render comment list in right sidebar ─────────────────────
  function _renderList() {
    const sidebar = RightSidebar.getInstance();
    if (!sidebar || AppState.currentMode !== 'comment') return;

    sidebar.setupModule({
      title: 'Comment',
      actions: [
        { id: 'clear', icon: 'trash', title: 'Clear all comments', onClick: () => clear() },
        { id: 'copy', icon: 'copy', title: 'Copy all comments', onClick: copyAll }
      ],
      items: comments,
      emptyState: {
        icon: 'message',
        text: 'No Comment yet'
      },
      renderItem: (c, _index) => {
        const isRange = c.lineEnd && c.lineEnd > c.lineStart;
        const lineRef = isRange ? `L${c.lineStart}–L${c.lineEnd}` : `Line ${c.lineStart}`;
        const isSelected = activeCommentId && c.id && c.id === activeCommentId;
        
        const item = DesignSystem.createElement('div', 'ds-sidebar-item' + (isSelected ? ' is-selected' : ''));
        item.dataset.id = c.id;

        let snippet = '';
        if (c.selectedText) {
          const b = c.context?.before ? '...' + c.context.before.slice(-15) : '';
          const a = c.context?.after ? c.context.after.slice(0, 15) + '...' : '';
          snippet = `${b} <span class="highlight-selection">${_esc(c.selectedText)}</span> ${a}`;
        } else {
          snippet = isRange ? `${c.startLineContent} ... ${c.endLineContent}` : (c.startLineContent || '');
          snippet = _esc(snippet);
        }

        const header = DesignSystem.createElement('div', 'ds-item-header');
        const headerGroup = DesignSystem.createElement('div', 'ds-item-header-group');
        headerGroup.appendChild(DesignSystem.createElement('div', 'ds-item-label', { text: lineRef.toUpperCase() }));
        headerGroup.appendChild(DesignSystem.createElement('div', 'ds-item-snippet', { html: snippet }));

        const deleteBtn = new IconActionButton({
          iconName: 'x',
          title: 'Delete',
          isDanger: true,
          className: 'ds-item-delete-btn',
          onClick: () => remove(c.id)
        });

        header.appendChild(headerGroup);
        header.appendChild(deleteBtn.render());

        const body = DesignSystem.createElement('div', 'ds-item-body', { html: _esc(c.text) });

        item.appendChild(header);
        item.appendChild(body);

        item.onmouseenter = () => _highlightLines(c.lineStart, c.lineEnd);
        item.onmouseleave = () => _clearHighlights();
        item.onclick      = () => _onItemClick(c);
        
        return item;
      }
    });
  }

  function _highlightLines(start, end) {
    _clearHighlights();
    const targetEnd = end || start;
    for (let i = start; i <= targetEnd; i++) {
      const line = document.querySelector(`.md-line[data-line="${i}"]`);
      if (line) line.classList.add('highlight-temp');
    }
  }

  function _onItemClick(comment) {
    activeCommentId = comment.id;
    _renderList(); // Refresh list to show selected state

    const targetLine = document.querySelector(`.md-line[data-line="${comment.lineStart}"]`);
    if (targetLine) {
      targetLine.scrollIntoView({ behavior: 'auto', block: 'center' });
      targetLine.classList.add('pulse-highlight');
      setTimeout(() => targetLine.classList.remove('pulse-highlight'), 2000);

      formTarget = { 
        lineStart: comment.lineStart, 
        lineEnd: comment.lineEnd, 
        startLineContent: comment.startLineContent, 
        endLineContent: comment.endLineContent,
        selectedText: comment.selectedText,
        context: comment.context,
        headingPath: comment.headingPath,
        id: comment.id
      };
      _showForm(targetLine, 'view', comment.text);
    }
  }

  function _getHeadingPath(lineStart) {
    const container = document.getElementById('md-content');
    if (!container) return "General";
    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const relevantHeadings = headings.filter(h => {
      const lineEl = h.closest('.md-line');
      if (!lineEl) return false;
      const lineNum = parseInt(lineEl.dataset.line, 10);
      return lineNum <= lineStart;
    });
    if (relevantHeadings.length === 0) return "General";
    let current = relevantHeadings[relevantHeadings.length - 1];
    let level = parseInt(current.tagName[1], 10);
    const path = [current.textContent.trim()];
    for (let i = relevantHeadings.length - 2; i >= 0; i--) {
      const h = relevantHeadings[i];
      const hLevel = parseInt(h.tagName[1], 10);
      if (hLevel < level) {
        path.unshift(h.textContent.trim());
        level = hLevel;
      }
    }
    return path.join(' > ');
  }

  function _clearHighlights() {
    document.querySelectorAll('.md-line').forEach(l => { 
      l.classList.remove('highlight-temp');
    });
  }

  // ── Mark exact text ranges that have comments ───────────────────
  function _markLinesWithComments() {
    document.querySelectorAll('.comment-range').forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      }
    });
    document.querySelectorAll('.md-line').forEach(b => b.classList.remove('has-comment'));

    const linesWithComments = new Set(comments.map(c => c.lineStart));
    comments.forEach(c => {
        if (c.lineEnd) {
            for (let i = c.lineStart; i <= c.lineEnd; i++) linesWithComments.add(i);
        }
    });

    linesWithComments.forEach(lineNum => {
      const lineEl = document.querySelector(`.md-line[data-line="${lineNum}"]`);
      if (!lineEl) return;
      lineEl.classList.add('has-comment');
      const lineComments = comments.filter(c => 
        lineNum >= c.lineStart && lineNum <= (c.lineEnd || c.lineStart)
      );
      _applyRobustHighlights(lineEl, lineComments);
    });
  }

  function _applyRobustHighlights(element, lineComments) {
    const textComments = lineComments.filter(c => !!c.selectedText);
    if (textComments.length === 0) return;

    // 1. Lấy toàn bộ text của dòng và danh sách các text nodes cùng offset của chúng
    const fullContent = element.textContent;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let currentOffset = 0;
    let node;
    while (node = walker.nextNode()) {
      textNodes.push({
        node: node,
        start: currentOffset,
        end: currentOffset + node.textContent.length,
        content: node.textContent
      });
      currentOffset += node.textContent.length;
    }

    // 2. Tìm vị trí Global của từng comment
    const globalMatches = [];
    textComments.forEach(c => {
      let globalStartIdx = -1;
      
      // Search with Context
      if (c.context) {
        const cleanBefore = (c.context.before || '').replace(/^\.\.\./, '');
        const cleanAfter  = (c.context.after || '').replace(/\.\.\.$/, '');
        const fingerprint = cleanBefore + c.selectedText + cleanAfter;
        
        const matchIdx = fullContent.indexOf(fingerprint);
        if (matchIdx !== -1) {
          globalStartIdx = matchIdx + cleanBefore.length;
        }
      }

      // Fallback: Search for selected text alone if fingerprint fails
      if (globalStartIdx === -1) {
        const cleanText = c.selectedText.trim();
        // Try exact match first
        globalStartIdx = fullContent.indexOf(c.selectedText);
        
        // Try normalized whitespace match if exact fails
        if (globalStartIdx === -1) {
          const normalizedContent = fullContent.replace(/\s+/g, ' ');
          const normalizedSelected = cleanText.replace(/\s+/g, ' ');
          const normIdx = normalizedContent.indexOf(normalizedSelected);
          if (normIdx !== -1) {
             // This is a rough estimation, but better than no highlight
             globalStartIdx = normIdx; 
          }
        }
      }

      if (globalStartIdx !== -1) {
        globalMatches.push({
          comment: c,
          start: globalStartIdx,
          end: globalStartIdx + c.selectedText.length
        });
      }
    });

    // 3. Ánh xạ các Global Match ngược lại từng Text Node và thực hiện thay thế
    for (let i = textNodes.length - 1; i >= 0; i--) {
      const nodeInfo = textNodes[i];
      const boundaries = new Set([0, nodeInfo.content.length]);
      const nodeMap = new Map();

      globalMatches.forEach(m => {
        const intersectStart = Math.max(nodeInfo.start, m.start);
        const intersectEnd = Math.min(nodeInfo.end, m.end);

        if (intersectStart < intersectEnd) {
          const localStart = intersectStart - nodeInfo.start;
          const localEnd = intersectEnd - nodeInfo.start;
          
          boundaries.add(localStart);
          boundaries.add(localEnd);
          
          for (let j = localStart; j < localEnd; j++) {
            if (!nodeMap.has(j)) nodeMap.set(j, new Set());
            nodeMap.get(j).add(m.comment);
          }
        }
      });

      if (boundaries.size <= 2 && nodeMap.size === 0) continue;

      const sorted = Array.from(boundaries).sort((a, b) => a - b);
      const fragments = document.createDocumentFragment();
      
      for (let j = 0; j < sorted.length - 1; j++) {
        const start = sorted[j];
        const end = sorted[j+1];
        if (start === end) continue;
        
        const segmentText = nodeInfo.content.substring(start, end);
        const segmentComments = nodeMap.get(start);

        if (segmentComments && segmentComments.size > 0) {
          const mark = document.createElement('mark');
          mark.className = 'comment-range';
          mark.textContent = segmentText;
          const firstComment = Array.from(segmentComments)[0];
          mark.dataset.id = firstComment.id;
          mark.dataset.ids = Array.from(segmentComments).map(c => c.id).join(',');
          
          if (segmentComments.size > 1) {
            mark.classList.add('multiple-comments');
            mark.title = `${segmentComments.size} comments here`;
          }
          
          mark.onclick = (e) => {
            e.stopPropagation();
            _onItemClick(firstComment);
          };
          fragments.appendChild(mark);
        } else {
          fragments.appendChild(document.createTextNode(segmentText));
        }
      }
      nodeInfo.node.parentNode.replaceChild(fragments, nodeInfo.node);
    }
  }


  // ── Apply comment mode (floating trigger) ─────────────────────
  let floatingTrigger = null;

  function applyCommentMode() {
    if (!floatingTrigger) {
      const triggerBtn = new IconActionButton({
        iconName: 'message-circle-plus',
        title: 'Add comment to selection',
        isPrimary: true,
        isLarge: true,
        className: 'comment-trigger',
        onClick: (e) => _onTriggerClick(e)
      });
      
      floatingTrigger = triggerBtn.render();
      document.body.appendChild(floatingTrigger);
    }
    
    document.addEventListener('mouseup', _handleSelection);
    document.addEventListener('keyup', _handleSelection);
    _renderList();
    _markLinesWithComments();
  }

  function removeCommentMode() {
    if (floatingTrigger) {
      floatingTrigger.classList.remove('show');
      floatingTrigger.style.display = 'none';
    }
    document.removeEventListener('mouseup', _handleSelection);
    document.removeEventListener('keyup', _handleSelection);
    _clearHighlights();
    _hideForm();
    
    // Clear selection to avoid re-triggering accidentally
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    
    const sidebar = RightSidebar.getInstance();
    if (sidebar) sidebar.close();
  }

  function _handleSelection() {
    const selection = window.getSelection();
    if (selection.isCollapsed || selection.toString().trim() === '') {
      if (floatingTrigger) floatingTrigger.classList.remove('show');
      return;
    }
    const range = selection.getRangeAt(0);
    const container = document.getElementById('md-content');
    if (!container.contains(range.commonAncestorContainer)) {
      if (floatingTrigger) floatingTrigger.classList.remove('show');
      return;
    }
    const rects = range.getClientRects();
    if (rects.length === 0) {
      if (floatingTrigger) floatingTrigger.classList.remove('show');
      return;
    }
    const lastRect = rects[rects.length - 1];
    const firstRect = rects[0];
    if (floatingTrigger) {
      const isForward = (range.startContainer === selection.anchorNode && range.startOffset === selection.anchorOffset);
      let left = isForward ? lastRect.right + 5 : firstRect.left - 40;
      let top  = isForward ? lastRect.bottom + 5 : firstRect.top - 40;
      if (left + 40 > window.innerWidth) left = window.innerWidth - 45;
      if (left < 5) left = 5;
      if (top < 5) top = 5;
      if (top + 40 > window.innerHeight) top = window.innerHeight - 45;
      floatingTrigger.style.display = 'flex'; // Restore if hidden by removeCommentMode
      floatingTrigger.style.left = `${left}px`;
      floatingTrigger.style.top  = `${top}px`;
      floatingTrigger.classList.add('show');
    }
  }

  function _onTriggerClick(e) {
    e.stopPropagation();
    const selection = window.getSelection();
    if (selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    const allLines = Array.from(document.querySelectorAll('.md-line'));
    const selectedLines = allLines.filter(el => selection.containsNode(el, true));
    if (selectedLines.length === 0) return;
    const lineStart = parseInt(selectedLines[0].dataset.line, 10);
    const lineEnd   = parseInt(selectedLines[selectedLines.length - 1].dataset.line, 10);
    const context = _getSelectionContext(range);
    formTarget = { 
      lineStart, 
      lineEnd, 
      startLineContent: _getLineText(selectedLines[0]), 
      endLineContent: _getLineText(selectedLines[selectedLines.length - 1]),
      selectedText,
      context,
      headingPath: _getHeadingPath(lineStart)
    };
    _showForm(floatingTrigger);
  }

  function _getSelectionContext(range) {
    let container = range.commonAncestorContainer;
    if (container.nodeType === 3) container = container.parentElement;
    
    const lineEl = container.closest('.md-line');
    if (!lineEl) return { before: '', after: '' };


    const fullLineText = lineEl.textContent;
    
    // Tính toán offset của selection so với textContent của toàn bộ dòng
    const preRange = document.createRange();
    preRange.setStart(lineEl, 0);
    preRange.setEnd(range.startContainer, range.startOffset);
    const offsetStart = preRange.toString().length;
    const selectedText = range.toString();

    const RADIUS = 60;
    const before = fullLineText.substring(Math.max(0, offsetStart - RADIUS), offsetStart);
    const after  = fullLineText.substring(offsetStart + selectedText.length, offsetStart + selectedText.length + RADIUS);

    return { 
      before: before.length < RADIUS ? before : '...' + before, 
      after: after.length < RADIUS ? after : after + '...' 
    };


  }


  // ── Show / hide form ─────────────────────────────────────────

  function _showForm(anchorBtn, mode = 'empty', initialText = '') {
    const formComp = CommentFormComponent.getInstance();
    formComp.show(anchorBtn, mode, initialText);
  }

  function _hideForm() {
    const formComp = CommentFormComponent.getInstance();
    formComp.hide();
    formTarget = null;
    activeCommentId = null;
    _renderList();
  }

  async function _submitForm(text) {
    if (!text || !formTarget) return;
    await save(
      formTarget.lineStart, 
      formTarget.lineEnd, 
      formTarget.startLineContent, 
      formTarget.endLineContent, 
      text,
      formTarget.selectedText,
      formTarget.context,
      formTarget.id,
      formTarget.headingPath
    );
    _hideForm();
    window.getSelection().removeAllRanges();
  }

  function _getLineText(el) {
    if (!el) return '';
    const clone   = el.cloneNode(true);
    const trigger = clone.querySelector('.comment-trigger');
    if (trigger) trigger.remove();
    let text = clone.textContent.trim();
    if (text.length > 100) text = text.substring(0, 100) + '...';
    return text;
  }

  function _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function clearUI() {
    comments = [];
    _renderList();
    _clearHighlights();
  }

  function _renderExpandedModal() {
    if (document.getElementById('expanded-comment-modal')) return;
    const el = document.createElement('div');
    el.id = 'expanded-comment-modal';
    el.className = 'expanded-textarea-modal';
    el.innerHTML = `
      <div class="expanded-textarea-backdrop"></div>
      <div class="expanded-textarea-container">
        <div class="expanded-textarea-header">
          <div class="textarea-label">COMMENT FEEDBACK</div>
          <button id="minimize-comment-btn" class="textarea-expand-btn" title="Minimize">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
              <line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </button>
        </div>
        <div class="expanded-textarea-body">
          <textarea id="expanded-comment-input" class="expanded-textarea-input" placeholder="What's your feedback..."></textarea>
        </div>
        <div class="expanded-textarea-footer">
          <button id="expanded-save-comment" class="ds-btn ds-btn-primary">Save Comment</button>
        </div>
      </div>`;
    document.body.appendChild(el);
  }

  function _bindEvents() {
    const formComp = CommentFormComponent.getInstance();
    
    formComp.onSave((text) => _submitForm(text));
    formComp.onCancel(() => _hideForm());
    
    formComp.onEdit((text) => {
      formComp.setMode('filled');
      formComp.setText(text);
    });

    formComp.onExpand((text) => {
      const modal = document.getElementById('expanded-comment-modal');
      const modalInput = document.getElementById('expanded-comment-input');
      if (modal && modalInput) {
        modalInput.value = text;
        modal.classList.add('show');
        setTimeout(() => modalInput.focus(), 50);
      }
    });

    // Handle expanded modal buttons
    const modalSaveBtn = document.getElementById('expanded-save-comment');
    const minimizeBtn = document.getElementById('minimize-comment-btn');
    const modalInput = document.getElementById('expanded-comment-input');
    const modal = document.getElementById('expanded-comment-modal');

    if (modalSaveBtn) {
      modalSaveBtn.onclick = async () => {
        await _submitForm(modalInput.value.trim());
        modal.classList.remove('show');
      };
    }

    if (minimizeBtn) {
      minimizeBtn.onclick = () => {
        formComp.setText(modalInput.value);
        modal.classList.remove('show');
      };
    }

    if (modalInput) {
      modalInput.addEventListener('input', () => {
        formComp.setText(modalInput.value);
      });
    }
    
    // Backdrop click
    const backdrop = modal?.querySelector('.expanded-textarea-backdrop');
    if (backdrop) {
      backdrop.onclick = () => {
        formComp.setText(modalInput.value);
        modal.classList.remove('show');
      };
    }
  }

  function init() {
    _renderExpandedModal();
    _bindEvents();
  }


  function externalTrigger(data) {

    if (!data) return;
    formTarget = data;
    const targetLine = document.querySelector(`.md-line[data-line="${data.lineStart}"]`);

    _showForm(targetLine || document.body);
  }

  function captureSelectionData() {
    const selection = window.getSelection();

    if (selection.isCollapsed) {

      return null;
    }
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    const allLines = Array.from(document.querySelectorAll('.md-line'));

    
    const selectedLines = allLines.filter(el => selection.containsNode(el, true));

    
    if (selectedLines.length === 0) {

      return null;
    }
    
    const lineStart = parseInt(selectedLines[0].dataset.line, 10);
    const lineEnd   = parseInt(selectedLines[selectedLines.length - 1].dataset.line, 10);
    const context = _getSelectionContext(range);
    
    const data = { 
      lineStart, 
      lineEnd, 
      startLineContent: _getLineText(selectedLines[0]), 
      endLineContent: _getLineText(selectedLines[selectedLines.length - 1]),
      selectedText,
      context,
      headingPath: _getHeadingPath(lineStart)
    };
    

    return data;
  }


  return { init, loadForFile, applyCommentMode, removeCommentMode, clearUI, clear, getCommentCount: () => comments.length, externalTrigger, captureSelectionData };
})();
window.CommentsModule = CommentsModule;

```
</file>

<file path="renderer/js/modules/draft.js">
```js
/* ============================================================
   draft.js — Logic for Multiple Draft tabs
   ============================================================ */

const DraftModule = (() => {
  // Map of drafts: { [draftId]: { draftContent, renderedHtml, lastTouched } }
  let drafts = {};
  let renderTicket = 0;
  
  const elements = {
    variants: {
      placeholder: null,
      input:       null
    },
    footers: {
      markdown:    null,
      draft:       null
    }
  };

  function init() {
    elements.variants.placeholder = document.getElementById('draft-placeholder-variant');
    elements.variants.input       = document.getElementById('draft-input-variant');
    
    elements.footers.markdown = document.getElementById('markdown-footer');
    elements.footers.draft    = document.getElementById('draft-footer');

    const importBtn = document.getElementById('draft-quick-import');
    if (importBtn) {
      importBtn.addEventListener('click', () => handleFileImport());
    }

    _setupDragAndDrop();

    // Switch to input variant by default
    setVariant('input');
  }

  function setVariant(variantName) {
    if (elements.variants.placeholder) {
      elements.variants.placeholder.style.display = (variantName === 'placeholder' ? 'flex' : 'none');
    }
    if (elements.variants.input) {
      elements.variants.input.style.display = (variantName === 'input' ? 'flex' : 'none');
    }
  }

  async function renderPreview(content, id) {
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    if (!draftId || !draftId.startsWith('__DRAFT_')) return;

    if (!drafts[draftId]) drafts[draftId] = { lastTouched: Date.now() };
    
    const finalContent = content !== undefined ? content : (drafts[draftId].draftContent || '');
    
    // ── Ticket System for Race Conditions ──────────────────
    const currentTicket = ++renderTicket;

    if (!finalContent || finalContent.trim() === '') {
      if (mdContent) {
        const inner = mdContent.querySelector('.md-content-inner') || mdContent;
        if (inner) inner.innerHTML = '';
      }
      return;
    }

    try {
      const res = await fetch('/api/render-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: finalContent })
      });

      if (!res.ok) throw new Error('Render failed');
      const data = await res.json();

      // Cancel if a newer render request was started
      if (currentTicket !== renderTicket) return;

      // Update via MarkdownViewer
      const viewer = MarkdownViewer.getInstance();
      if (viewer) {
        viewer.setState({
          mode: AppState.currentMode === 'edit' ? 'edit' : 'read',
          file: draftId,
          content: finalContent,
          html: data.html
        });
      } else {
        // Legacy fallback
        const emptyState = document.getElementById('empty-state');
        const mdContent  = document.getElementById('md-content');

        if (emptyState) emptyState.style.display = 'none';
        if (mdContent) {
          const inner = mdContent.querySelector('.md-content-inner') || mdContent;
          inner.innerHTML = data.html;
          
          if (AppState.currentMode !== 'edit') {
              mdContent.style.display = 'block';
          }
          
          if (typeof processMermaid === 'function') processMermaid(inner);
          if (typeof CodeBlockModule !== 'undefined') CodeBlockModule.process(inner);
        }
      }

      // Update header
      updateHeader('draft');

      // Update local state
      drafts[draftId].renderedHtml = data.html;
      drafts[draftId].draftContent = finalContent;
      drafts[draftId].lastTouched = Date.now();
      
      saveToStorage(); // Persist rendered draft
      
      // If we are in edit mode, sync the editor with the new content
      if (AppState.currentMode === 'edit' && typeof EditorModule !== 'undefined') {
          EditorModule.setOriginalContent(finalContent);
      }
      
      // Reset scroll
      const scrollViewer = document.getElementById('md-viewer-mount');
      if (scrollViewer) scrollViewer.scrollTop = 0;

    } catch (err) {
      console.error(err);
    }
  }

  function toggleFooter(mode) {
    if (elements.footers.markdown) {
      elements.footers.markdown.style.display = (mode === 'markdown' ? 'flex' : 'none');
    }
    if (elements.footers.draft) {
      elements.footers.draft.style.display = (mode === 'draft' ? 'flex' : 'none');
    }
  }

  function updateHeader(mode) {
    const wsNameEl   = document.getElementById('header-workspace-name');
    const fileNameEl = document.getElementById('header-file-name');

    if (mode === 'draft') {
      const draftId = AppState.currentFile;
      displayName = getDisplayName(draftId).toUpperCase();

      if (wsNameEl) wsNameEl.innerText = displayName;
      if (fileNameEl) {
        fileNameEl.style.display = 'none';
      }
    } else {
      // Restore from AppState using the global function in app.js
      if (typeof updateHeaderUI === 'function') {
        updateHeaderUI();
      }
    }
  }

  // ── Helper ────────────────────────────────────────────────
  function getDraftContent(id) { 
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    if (!draftId || !drafts[draftId]) return '';
    return drafts[draftId].draftContent || ''; 
  }

  function getDraftViewMode(id) {
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    return drafts[draftId] ? (drafts[draftId].viewMode || null) : null;
  }

  function setDraftViewMode(id, mode) {
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    if (!draftId) return;
    ensureDraftMeta(draftId);
    drafts[draftId].viewMode = mode;
    saveToStorage();
  }

  function getDisplayName(id) {
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    if (!draftId) return 'New Draft';
    
    ensureDraftMeta(draftId);
    return drafts[draftId].displayName || 'Draft';
  }

  function ensureDraftMeta(id) {
    if (!drafts[id]) drafts[id] = {};
    if (!drafts[id].displayName) {
      // Find the smallest available positive integer not in use
      const usedNumbers = new Set(
        Object.values(drafts)
          .map(d => d.displayName)
          .filter(name => name && name.startsWith('Draft '))
          .map(name => parseInt(name.replace('Draft ', ''), 10))
          .filter(num => !isNaN(num))
      );

      let nextNum = 1;
      while (usedNumbers.has(nextNum)) {
        nextNum++;
      }

      drafts[id].displayName = `Draft ${nextNum}`;
      drafts[id].lastTouched = Date.now();
    }
  }
  
  function setDraftContent(val, id) { 
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    if (!draftId) return;
    ensureDraftMeta(draftId);
    drafts[draftId].draftContent = val; 
    drafts[draftId].lastTouched = Date.now();
    saveToStorage();
  }

  function getRenderedHtml(id) {
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    if (!draftId || !drafts[draftId]) return '';
    return drafts[draftId].renderedHtml || '';
  }

  // ── File Import & Drag-and-Drop ────────────────────────────
  async function handleFileImport() {
    try {
      if (window.electronAPI && window.electronAPI.pickAndReadFile) {
        const fileData = await window.electronAPI.pickAndReadFile();
        if (fileData && fileData.content) {
          _setChatInput(fileData.content);
        }
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            const content = await file.text();
            _setChatInput(content);
          }
        };
        input.click();
      }
    } catch (err) {
      console.error('File import failed:', err);
    }
  }

  function _setupDragAndDrop() {
    const container = elements.variants.input;
    if (!container) return;

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.classList.add('drag-over');
    });

    container.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.classList.remove('drag-over');
    });

    container.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.classList.remove('drag-over');

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.name.toLowerCase().endsWith('.md')) {
          const content = await file.text();
          _setChatInput(content);
        } else {
          if (typeof showToast === 'function') showToast('Please drop a Markdown (.md) file.', 'error');
        }
      }
    });
  }

  function _setChatInput(content) {
    const draftId = window.AppState ? AppState.currentFile : null;
    if (!draftId) return;
    
    if (!drafts[draftId]) drafts[draftId] = {};
    drafts[draftId].draftContent = content;
    drafts[draftId].lastTouched = Date.now();
    
    saveToStorage(); 
    renderPreview(content, draftId);
  }

  function saveToStorage() {
    if (typeof AppState === 'undefined' || !AppState.currentWorkspace) return;
    const key = `drafts_v2_${AppState.currentWorkspace.id}`;
    localStorage.setItem(key, JSON.stringify(drafts));
    
    // Trigger server sync
    if (AppState.savePersistentState) AppState.savePersistentState();
  }

  function loadFromStorage(workspaceId) {
    if (!workspaceId) {
      drafts = {};
      return;
    }

    const key = `drafts_v2_${workspaceId}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        const allDrafts = JSON.parse(saved);
        drafts = allDrafts || {};
        
        // 1. Migration fallback for legacy key (one-time)
        const oldKey = `draft_${workspaceId}`;
        const oldSaved = localStorage.getItem(oldKey);
        if (Object.keys(drafts).length === 0 && oldSaved) {
            const oldData = JSON.parse(oldSaved);
            const legacyId = `__DRAFT_LEGACY_${Date.now()}__`;
            drafts[legacyId] = {
              draftContent: oldData.draftContent || '',
              renderedHtml: oldData.renderedHtml || '',
              lastTouched: Date.now()
            };
            localStorage.removeItem(oldKey);
        }
        
        saveToStorage();
      } catch (e) {
        console.error('Error parsing draft data', e);
        drafts = {};
      }
    } else {
      drafts = {};
    }
  }

  /**
   * Explicitly initialize a new draft to prevent ghost content
   * and ensure correct numbering.
   */
  function createDraft(id) {
    if (!id) return;
    drafts[id] = {
      draftContent: '',
      renderedHtml: '',
      lastTouched: Date.now(),
      viewMode: 'edit'
    };
    ensureDraftMeta(id);
    saveToStorage();
    return drafts[id];
  }

  async function clear(id) {
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    if (!draftId) return;

    delete drafts[draftId];

    if (draftId === (window.AppState ? AppState.currentFile : null)) {
      if (typeof EditorModule !== 'undefined') {
        EditorModule.setOriginalContent('');
      }
    }

    saveToStorage();
    syncPreview();
  }

  // Sync the main viewer with Draft's content
  function syncPreview() {
    const draftId = window.AppState ? AppState.currentFile : null;
    const emptyState = document.getElementById('empty-state');
    const mdContent  = document.getElementById('md-content');
    
    const data = drafts[draftId];
    
    if (!data || !data.draftContent) {
      if (emptyState) {
        emptyState.style.display = 'flex';
        const h2 = emptyState.querySelector('h2');
        const p  = emptyState.querySelector('p');
        if (h2) h2.innerText = 'MDpreview';
        if (p)  p.innerText = 'Draft is empty or not found.';
      }
      if (mdContent) {
        mdContent.style.display = 'none';
        // ── Surgical Cleanup ─────────────────────────────────
        // Clear innerHTML to prevent "ghost content" from previous files
        const inner = mdContent.querySelector('.md-content-inner') || mdContent;
        if (inner) inner.innerHTML = '';
      }
      return;
    }

    if (!data.renderedHtml) {
      // If content exists but HTML is missing (e.g. rapid switch before save finished),
      // trigger a silent render to fill the gap.
      renderPreview(data.draftContent, draftId);
      return;
    }

    // Update via MarkdownViewer
    const viewer = MarkdownViewer.getInstance();
    if (viewer) {
      viewer.setState({
        mode: AppState.currentMode === 'edit' ? 'edit' : 'read',
        file: draftId,
        content: data.draftContent,
        html: data.renderedHtml
      });
      updateHeader('draft');
    } else {
      // Legacy fallback
      if (emptyState) emptyState.style.display = 'none';
      if (mdContent) {
        mdContent.style.display = 'block';
        const inner = mdContent.querySelector('.md-content-inner') || mdContent;
        inner.innerHTML = data.renderedHtml;
        
        if (typeof processMermaid === 'function') processMermaid(inner);
        if (typeof CodeBlockModule !== 'undefined') CodeBlockModule.process(inner);
        updateHeader('draft');
      }
    }
  }

  return { init, toggleFooter, updateHeader, syncPreview, renderPreview, clear, getDraftContent, setDraftContent, getRenderedHtml, saveToStorage, loadFromStorage, getDraftViewMode, setDraftViewMode, getDisplayName, createDraft };
})();

window.DraftModule = DraftModule;

```
</file>

<file path="renderer/js/modules/editor.js">
```js
/* ── Editor Toolbar Logic ─────────────────────────────── */

const EditorModule = (() => {
  let _originalContent = '';
  let _textarea = null;

  // ── Undo / Redo Stack ──────────────────────────────────
  /** @type {{ value: string, ss: number, se: number }[]} */
  let _undoStack = [];
  /** @type {{ value: string, ss: number, se: number }[]} */
  let _redoStack = [];
  let _debounceTimer = null;
  let _ignoreNextInput = false; // set to true when we're restoring a snapshot

  function _snapshot() {
    if (!_textarea) return;
    const snap = { value: _textarea.value, ss: _textarea.selectionStart, se: _textarea.selectionEnd };
    const last = _undoStack[_undoStack.length - 1];
    if (last && last.value === snap.value) return;
    _undoStack.push(snap);
    if (_undoStack.length > 200) _undoStack.shift(); 
    _redoStack = []; 
  }

  function _scheduleSnapshot() {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(_snapshot, 300);
  }

  function _restoreSnapshot(snap) {
    if (!_textarea || !snap) return;
    _ignoreNextInput = true;
    _textarea.value = snap.value;
    _textarea.setSelectionRange(snap.ss, snap.se);
    _textarea.focus();
  }

  function undo() {
    if (_undoStack.length <= 1) return; 
    _redoStack.push(_undoStack.pop());
    _restoreSnapshot(_undoStack[_undoStack.length - 1]);
  }

  function redo() {
    if (_redoStack.length === 0) return;
    const snap = _redoStack.pop();
    _undoStack.push(snap);
    _restoreSnapshot(snap);
  }

  /**
   * Binds the editor logic to a specific textarea element.
   * This is called by the MarkdownEditor component.
   */
  function bindToElement(el) {
    _textarea = el;
    if (!_textarea) return;

    // Reset stacks for new file/session
    _undoStack = [{ value: _textarea.value, ss: _textarea.selectionStart, se: _textarea.selectionEnd }];
    _redoStack = [];

    _textarea.addEventListener('input', () => {
      if (_ignoreNextInput) { _ignoreNextInput = false; return; }
      _scheduleSnapshot();
      
      // Update Tab Dirty State
      if (typeof TabsModule !== 'undefined' && AppState.currentFile) {
        TabsModule.setDirty(AppState.currentFile, isDirty());
      }
    });

    _textarea.addEventListener('keydown', (e) => {
      // Global Shortcut Interception (TC-10)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        save();
        return;
      }

      // Sync undo/redo stack
      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    });
  }

  /**
   * Clears the textarea reference to prevent memory leaks
   */
  function unbind() {
    _textarea = null;
    _undoStack = [];
    _redoStack = [];
  }

  async function save() {
    if (!AppState.currentFile || !_textarea) return false;
    const content = _textarea.value;

    if (AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_')) {
        if (typeof DraftModule !== 'undefined') {
            DraftModule.setDraftContent(content);
            await DraftModule.renderPreview(content, AppState.currentFile);
            _originalContent = content;
            if (typeof showToast === 'function') showToast('Draft updated');
            return true;
        }
        return false;
    }

    const res = await fetch('/api/file/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: AppState.currentFile, content })
    });
    
    if (res.ok) {
      if (typeof showToast === 'function') showToast('File saved successfully');
      _originalContent = content; 
      
      if (typeof TabsModule !== 'undefined' && AppState.currentFile) {
        TabsModule.setDirty(AppState.currentFile, false);
      }
      
      // Return to read mode after successful save
      if (window.AppState && AppState.updateToolbarUI) {
        AppState.updateToolbarUI('read');
      } else if (typeof loadFile === 'function') {
        loadFile(AppState.currentFile);
      }
      return true;
    } else {
      if (typeof showToast === 'function') showToast('Failed to save file', 'error');
      return false;
    }
  }

  function setOriginalContent(text) {
    _originalContent = text;
    if (_textarea && _textarea.value !== text) {
      const ss = _textarea.selectionStart;
      const se = _textarea.selectionEnd;
      _textarea.value = text;
      // Try to preserve selection if possible
      try { _textarea.setSelectionRange(ss, se); } catch(_e) {}
      _undoStack = [{ value: text, ss: 0, se: 0 }];
      _redoStack = [];
    }
  }

  function isDirty() {
    if (!_textarea) return false;
    return _textarea.value !== _originalContent;
  }

  function applyAction(action) {
    if (!_textarea) return;
    
    _snapshot(); // Save state before
    
    // Use the central logic service for transformations
    if (typeof MarkdownLogicService !== 'undefined') {
      MarkdownLogicService.applyAction(_textarea, action);
    }

    _snapshot(); // Save state after
  }

  function focusWithContext(context = {}) {
    if (!_textarea) return;
    
    _textarea.focus();

    // Use the central logic service for cursor & scroll synchronization
    if (typeof MarkdownLogicService !== 'undefined') {
      MarkdownLogicService.syncCursor(_textarea, context);
    }
  }

  function revert() {
    if (_textarea) {
      _textarea.value = _originalContent;
      // Reset undo/redo stacks to sync with the reverted state
      _undoStack = [{ value: _textarea.value, ss: 0, se: 0 }];
      _redoStack = [];

      if (typeof TabsModule !== 'undefined' && AppState.currentFile) {
        TabsModule.setDirty(AppState.currentFile, false);
      }
    }
  }

  function insertContent(text, mode = 'insert') {
    if (!_textarea) return;

    _snapshot();

    if (mode === 'replace') {
      _textarea.value = text;
    } else if (mode === 'append') {
      const current = _textarea.value;
      _textarea.value = current + (current && !current.endsWith('\n') ? '\n\n' : (current ? '\n' : '')) + text;
    } else {
      const start = _textarea.selectionStart;
      const end = _textarea.selectionEnd;
      _textarea.setRangeText(text, start, end, 'select');
    }

    _snapshot();
    _textarea.focus();

    // Trigger input event to update dirty state
    _textarea.dispatchEvent(new Event('input'));
  }

  return { 
      bindToElement, unbind, save, isDirty, setOriginalContent, undo, redo, 
      applyAction,
      setDirty: (isDirty) => {
        if (isDirty) {
          _originalContent = _originalContent + ' '; // Force dirty
        } else {
          if (_textarea) {
            _originalContent = _textarea.value;
          }
        }
      },
      focusWithContext,
      getOriginalContent: () => _originalContent,
      insertContent,
      revert
  };
})();

// Explicitly export to window
window.EditorModule = EditorModule;

```
</file>

<file path="renderer/js/modules/tabs.js">
```js

const TabsModule = (function () {
  const state = {
    openFiles: [], // Array of file paths
    pinnedFiles: [], // Array of pinned file paths
    dirtyFiles: [], // Array of files with unsaved changes
    activeFile: null,
    selectedFiles: [], // Array of selected file paths
    lastSelectedFile: null // For shift-range selection
  };

  let tabBar = null;

  function init() {
    // Initialize the TabBar component with MDpreview-specific logic
    tabBar = TabBar.init({
      mount: document.getElementById('tab-bar-container'),
      onTabSwitch: (path, modifiers = {}) => {
        const { shiftKey, metaKey, ctrlKey, altKey } = modifiers;
        const modKey = metaKey || ctrlKey || altKey;

        if (shiftKey) {
          selectRange(path);
        } else if (modKey) {
          toggleSelect(path);
        } else {
          deselectAll();

          // Focus shift: Clear sidebar selection when switching files via tabs
          if (typeof TreeModule !== 'undefined') {
            TreeModule.deselectAll(true);
          }

          if (path !== state.activeFile) {
            if (typeof window.loadFile === 'function') {
              window.loadFile(path).catch(_err => {
                remove(path);
              });
            }
          }
        }
      },
      onTabClose: (path) => {
        remove(path);
      },
      onAddTab: () => {
        // Create a new Draft tab
        if (typeof AppState !== 'undefined' && typeof AppState.onModeChange === 'function') {
          AppState.onModeChange('draft');
        }
      },
      onToggleSidebar: () => toggleSidebar(),
      // New: Context menu actions
      onCloseOthers: (path) => closeOthers(path),
      onCloseAll: () => closeAll(),
      onCloseSelected: () => closeSelected(),
      onPinTab: (path) => pin(path),
      onUnpinTab: (path) => unpin(path),

      rightActions: [
        {
          id: 'fullscreen',
          title: 'Fullscreen',
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
          onClick: () => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }
        }
      ]
    });

    // Initial load if workspace is already set
    if (typeof AppState !== 'undefined' && AppState.currentWorkspace) {
      switchWorkspace(AppState.currentWorkspace.id);
    }

    // Handle full-screen icon sync
    document.addEventListener('fullscreenchange', () => {
      const isFS = !!document.fullscreenElement;
      document.body.classList.toggle('is-fullscreen', isFS);
    });

    // Handle Sidebar toggle icon initial state
    const isCollapsed = localStorage.getItem('mdpreview_sidebar_left_collapsed') === 'true';
    updateSidebarToggleIcon(isCollapsed);

    // Global click to deselect tabs
    document.addEventListener('mousedown', (e) => {
      const isSafeZone = !!e.target.closest(
        '.tab-item, ' +               // Tab items themselves
        '.tab-bar-container, ' +      // Entire tab bar area
        '.ctx-menu, .modal'           // UI overlays
      );

      if (!isSafeZone) {
        deselectAll();
      }
    });

    // Global keyboard shortcuts for tabs
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        deselectAll();
      }
    });
  }

  function updateSidebarToggleIcon(isCollapsed) {
    const btn = document.getElementById('sidebar-toggle-btn');
    if (btn) {
      const iconName = isCollapsed ? 'sidebar-expand' : 'sidebar-collapse';
      btn.innerHTML = DesignSystem.getIcon(iconName);
      btn.title = isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar';
      // Sync premium tooltip
      DesignSystem.applyTooltip(btn, btn.title, 'bottom');
    }
  }

  function toggleSidebar() {
    const sidebarWrap = document.getElementById('sidebar-left-wrap');
    if (sidebarWrap) {
      const nowCollapsed = sidebarWrap.classList.toggle('sidebar-collapsed');
      localStorage.setItem('mdpreview_sidebar_left_collapsed', nowCollapsed);
      updateSidebarToggleIcon(nowCollapsed);
      return nowCollapsed;
    }
    return false;
  }

  // Exposed global for toolbar.js to call if needed (fallback)
  window.updateSidebarToggleIcon = updateSidebarToggleIcon;
  window.toggleSidebar = toggleSidebar;

  function saveToStorage() {
    if (typeof AppState === 'undefined' || !AppState.currentWorkspace) return;
    const key = `tabs_${AppState.currentWorkspace.id}`;
    const data = {
      openFiles: state.openFiles,
      pinnedFiles: state.pinnedFiles,
      activeFile: state.activeFile
    };
    localStorage.setItem(key, JSON.stringify(data));

    // Trigger global state sync if possible
    if (AppState.savePersistentState) {
      AppState.savePersistentState();
    }
  }

  function switchWorkspace(workspaceId) {
    if (!workspaceId) {
      state.openFiles = [];
      state.activeFile = null;
      state.selectedFiles = [];
      render();
      return;
    }

    const key = `tabs_${workspaceId}`;
    const saved = localStorage.getItem(key);

    if (typeof DraftModule !== 'undefined') {
      DraftModule.loadFromStorage(workspaceId);
    }

    if (saved) {
      try {
        const data = JSON.parse(saved);
        state.openFiles = data.openFiles || [];
        state.pinnedFiles = data.pinnedFiles || [];
        state.activeFile = data.activeFile || null;
      } catch (_e) {
        state.openFiles = [];
        state.activeFile = null;
      }
    } else {
      state.openFiles = [];
      state.activeFile = null;
    }

    state.selectedFiles = [];
    render();

    if (state.activeFile) {
      if (typeof window.loadFile === 'function') {
        window.loadFile(state.activeFile).catch(_err => {
          remove(state.activeFile);
        });
      }
    } else {
      if (typeof window.setNoFile === 'function') {
        window.setNoFile();
      }
    }
  }

  function open(filePath) {
    if (!filePath) return;
    if (!state.openFiles.includes(filePath)) {
      state.openFiles.push(filePath);
    }
    state.activeFile = filePath;
    state.lastSelectedFile = filePath;
    deselectAll();
    saveToStorage();
    render();
  }

  function setDirty(path, isDirty) {
    if (!path) return;
    const idx = state.dirtyFiles.indexOf(path);
    if (isDirty) {
      if (idx === -1) {
        state.dirtyFiles.push(path);
        render();
      }
    } else {
      if (idx > -1) {
        state.dirtyFiles.splice(idx, 1);
        render();
      }
    }
  }

  function pin(path) {
    if (!path) return;
    if (!state.pinnedFiles.includes(path)) {
      state.pinnedFiles.push(path);
      // Ensure it's in openFiles too
      if (!state.openFiles.includes(path)) {
        state.openFiles.push(path);
      }
      saveToStorage();
      render();
    }
  }

  function unpin(path) {
    if (!path) return;
    const idx = state.pinnedFiles.indexOf(path);
    if (idx > -1) {
      state.pinnedFiles.splice(idx, 1);
      saveToStorage();
      render();
    }
  }

  function togglePin(path) {
    if (!path) return;
    if (state.pinnedFiles.includes(path)) {
      unpin(path);
    } else {
      pin(path);
    }
  }

  // ── Private Helpers ─────────────────────────────────────
  function _getDisplayOrder() {
    const pinned = state.pinnedFiles.filter(f => state.openFiles.includes(f));
    const unpinned = state.openFiles.filter(f => !state.pinnedFiles.includes(f));
    return [...pinned, ...unpinned];
  }

  // ── Multi-selection Logic ───────────────────────────────
  function toggleSelect(path, _skipSync = false) {
    const idx = state.selectedFiles.indexOf(path);
    if (idx > -1) {
      state.selectedFiles.splice(idx, 1);
    } else {
      state.selectedFiles.push(path);
    }
    state.lastSelectedFile = path;
    render();
  }

  function selectRange(path, skipSync = false) {
    const displayOrder = _getDisplayOrder();
    if (!state.lastSelectedFile || !displayOrder.includes(state.lastSelectedFile)) {
      toggleSelect(path, skipSync);
      return;
    }

    const startIdx = displayOrder.indexOf(state.lastSelectedFile);
    const endIdx = displayOrder.indexOf(path);
    const min = Math.min(startIdx, endIdx);
    const max = Math.max(startIdx, endIdx);

    const currentSet = new Set(state.selectedFiles);
    for (let i = min; i <= max; i++) {
      currentSet.add(displayOrder[i]);
    }
    state.selectedFiles = Array.from(currentSet);
    render();
  }

  function selectAll(_skipSync = false) {
    state.selectedFiles = [...state.openFiles];
    render();
  }

  function deselectAll(_skipSync = false) {
    if (state.selectedFiles.length === 0) return; // Optimization: Already empty
    state.selectedFiles = [];
    render();
  }

  function syncSelectionFromTree(_paths) {
    // Disabled: Independent selection between Tabs and Tree
    /*
    const filtered = paths.filter(p => state.openFiles.includes(p));
    const current = state.selectedFiles;
    if (current.length === filtered.length && current.every((v, i) => v === filtered[i])) {
      return;
    }
    state.selectedFiles = filtered;
    render();
    */
  }

  // ── Batch Closing Logic ────────────────────────────────

  async function closeAll() {
    const files = state.openFiles.filter(f => !state.pinnedFiles.includes(f));
    const drafts = files.filter(f => f.startsWith("__DRAFT_"));

    if (drafts.length > 0) {
      DesignSystem.showConfirm({
        title: "Discard All Drafts",
        message: `Are you sure you want to discard all ${drafts.length} drafts? This cannot be undone.`,
        onConfirm: () => {
          files.forEach(f => _proceedRemove(f, true));
          saveToStorage();
          if (typeof DraftModule !== 'undefined' && AppState.currentWorkspace) {
            DraftModule.loadFromStorage(AppState.currentWorkspace.id);
          }
          render();
        }
      });
    } else {
      files.forEach(f => _proceedRemove(f, true));
      saveToStorage();
      if (typeof DraftModule !== 'undefined' && AppState.currentWorkspace) {
        DraftModule.loadFromStorage(AppState.currentWorkspace.id);
      }
      render();
    }
  }

  function closeOthers(path) {
    const files = state.openFiles.filter(f => f !== path && !state.pinnedFiles.includes(f));
    const drafts = files.filter(f => f.startsWith("__DRAFT_"));

    if (drafts.length > 0) {
      DesignSystem.showConfirm({
        title: "Discard Drafts",
        message: `This will discard ${drafts.length} unsaved drafts. Continue?`,
        onConfirm: () => {
          files.forEach(f => _proceedRemove(f, true));
          saveToStorage();
          if (typeof DraftModule !== 'undefined' && AppState.currentWorkspace) {
            DraftModule.loadFromStorage(AppState.currentWorkspace.id);
          }
          render();
        }
      });
    } else {
      files.forEach(f => _proceedRemove(f, true));
      saveToStorage();
      if (typeof DraftModule !== 'undefined' && AppState.currentWorkspace) {
        DraftModule.loadFromStorage(AppState.currentWorkspace.id);
      }
      render();
    }
  }

  function closeSelected() {
    const files = [...state.selectedFiles];
    if (files.length === 0) return;

    const drafts = files.filter(f => f.startsWith("__DRAFT_"));
    if (drafts.length > 0) {
      DesignSystem.showConfirm({
        title: "Discard Selected Drafts",
        message: `Discard ${drafts.length} selected drafts?`,
        onConfirm: () => {
          files.forEach(f => _proceedRemove(f, true));
          state.selectedFiles = [];
          saveToStorage();
          if (typeof DraftModule !== 'undefined' && AppState.currentWorkspace) {
            DraftModule.loadFromStorage(AppState.currentWorkspace.id);
          }
          render();
        }
      });
    } else {
      files.forEach(f => _proceedRemove(f, true));
      state.selectedFiles = [];
      saveToStorage();
      if (typeof DraftModule !== 'undefined' && AppState.currentWorkspace) {
        DraftModule.loadFromStorage(AppState.currentWorkspace.id);
      }
      render();
    }
  }

  function remove(filePath, skipConfirm = false) {
    if (filePath && filePath.startsWith("__DRAFT_") && !skipConfirm) {
      // Skip confirmation if draft is empty
      let content = "";
      if (
        window.AppState &&
        AppState.currentMode === "edit" &&
        filePath === AppState.currentFile
      ) {
        content = document.getElementById("edit-textarea")?.value || "";
      } else if (typeof DraftModule !== "undefined") {
        content = DraftModule.getDraftContent(filePath);
      }

      if (!content || content.trim() === "") {
        _proceedRemove(filePath);
        return;
      }

      DesignSystem.showConfirm({
        title: "Discard Draft",
        message:
          "Are you sure you want to discard this draft? This cannot be undone.",
        onConfirm: () => {
          remove(filePath, true); // Recursive call with skipConfirm = true
        },
      });
      return;
    }

    _proceedRemove(filePath);
  }

  function _proceedRemove(filePath, batch = false) {
    const index = state.openFiles.indexOf(filePath);
    if (index === -1) return;

    // Cleanup logic for Draft Mode
    if (filePath && filePath.startsWith("__DRAFT_")) {
      if (typeof DraftModule !== "undefined") DraftModule.clear(filePath);
      if (typeof EditorModule !== "undefined") EditorModule.setDirty(false);
    }

    state.openFiles.splice(index, 1);

    // Remove from selection if present
    const sIdx = state.selectedFiles.indexOf(filePath);
    if (sIdx > -1) state.selectedFiles.splice(sIdx, 1);

    // Remove from pinned if present
    const pIdx = state.pinnedFiles.indexOf(filePath);
    if (pIdx > -1) state.pinnedFiles.splice(pIdx, 1);

    if (state.activeFile === filePath) {
      state.activeFile = null;
      if (typeof window.AppState !== 'undefined') window.AppState.currentFile = null;
      if (typeof window.setNoFile === 'function') {
        window.setNoFile();
      }
    }

    // Cleanup logic for Scroll Position
    if (window.ScrollModule) {
      window.ScrollModule.remove(filePath);
    }

    if (!batch) {
      saveToStorage();
      render();
    }
  }

  function render() {
    if (tabBar) {
      tabBar.setState({
        openFiles: state.openFiles,
        pinnedFiles: state.pinnedFiles,
        dirtyFiles: state.dirtyFiles,
        activeFile: state.activeFile,
        selectedFiles: state.selectedFiles
      });
    }

    // Sync sidebar highlight
    if (typeof TreeModule !== 'undefined') {
      TreeModule.setActiveFile(state.activeFile);
    }
    if (typeof RecentlyViewedModule !== 'undefined') {
      RecentlyViewedModule.setActiveFile(state.activeFile);
    }
  }

  function reorder(oldIndex, newIndex) {
    if (oldIndex === newIndex) return;

    // Calculate display order to identify what was actually dragged
    const displayOrder = _getDisplayOrder();

    const draggedItem = displayOrder[oldIndex];
    if (!draggedItem) return;

    const isPinned = state.pinnedFiles.includes(draggedItem);

    if (isPinned) {
      // Reorder within pinnedFiles
      const pOldIdx = state.pinnedFiles.indexOf(draggedItem);
      // Pinned tabs are always at the start, so newIndex is relative to pinnedFiles
      // but we need to ensure it doesn't exceed pinned length
      const pinnedCount = state.pinnedFiles.filter(f => state.openFiles.includes(f)).length;
      const pNewIdx = Math.min(newIndex, pinnedCount - 1);

      state.pinnedFiles.splice(pOldIdx, 1);
      state.pinnedFiles.splice(pNewIdx, 0, draggedItem);
    } else {
      // Reorder within unpinned logic in openFiles
      // This is trickier because openFiles contains everything
      const [item] = state.openFiles.splice(state.openFiles.indexOf(draggedItem), 1);

      // Calculate where to insert in openFiles to match the intended newIndex in displayOrder
      // If newIndex is within pinned range, unpinned item moves to the very beginning of unpinned section
      const targetInDisplay = displayOrder[newIndex];
      let insertIdx = state.openFiles.indexOf(targetInDisplay);
      if (insertIdx === -1) {
        insertIdx = state.openFiles.length;
      } else if (newIndex > oldIndex) {
        insertIdx++;
      }

      state.openFiles.splice(insertIdx, 0, item);
    }

    saveToStorage();
    render();
  }

  function swap(oldPath, newPath) {
    const index = state.openFiles.indexOf(oldPath);
    if (index !== -1) {
      state.openFiles[index] = newPath;

      if (state.activeFile === oldPath) {
        state.activeFile = newPath;
        if (typeof window.AppState !== 'undefined') window.AppState.currentFile = newPath;
      }

      const sIdx = state.selectedFiles.indexOf(oldPath);
      if (sIdx !== -1) {
        state.selectedFiles[sIdx] = newPath;
      }

      if (state.lastSelectedFile === oldPath) {
        state.lastSelectedFile = newPath;
      }

      saveToStorage();
      render();
    }
  }

  return {
    init,
    open,
    remove,
    setDirty,
    swap,
    render,
    switchWorkspace,
    selectAll,
    deselectAll,
    closeAll,
    closeOthers,
    closeSelected,
    reorder,
    pin,
    unpin,
    togglePin,
    toggleSidebar,
    syncSelectionFromTree,
    getActive: () => state.activeFile,
    getOpenFiles: () => state.openFiles,
    getSelectedFiles: () => state.selectedFiles
  };
})();
window.TabsModule = TabsModule;

```
</file>

<file path="renderer/js/modules/tree.js">
```js
/* global AppState, SettingsService, DesignSystem, FileService, TreeDragManager, 
   TreeViewComponent, SidebarSectionHeader, SearchPalette, RecentlyViewedModule, showToast, ScrollContainer */
/* ============================================================
   tree.js — Sidebar File Tree logic with Sorting and DND
   ============================================================ */

const TreeModule = (() => {
  let treeData = [];
  let currentQuery = '';
  const state = {
    selectedPaths: [],
    lastSelectedPath: null,
    renamingPath: null,
    sortMethod: (typeof AppState !== 'undefined' && AppState.settings && AppState.settings.sortMethod) || localStorage.getItem('mdpreview_sort_method') || 'alphabetical_asc',
    expandedPaths: JSON.parse(localStorage.getItem('mdpreview_expanded_paths') || '[]'),
    customOrders: JSON.parse(localStorage.getItem('mdpreview_custom_orders') || '{}')
  };
  let hiddenItemsV2Component = null;

  let v2Component = null;

  const SORT_ICONS = {
    alphabetical_asc: DesignSystem.getIcon('sort-alpha-asc'),
    alphabetical_desc: DesignSystem.getIcon('sort-alpha-desc'),
    time_asc: DesignSystem.getIcon('sort-time-asc'),
    time_desc: DesignSystem.getIcon('sort-time-desc'),
    custom: DesignSystem.getIcon('sort-custom')
  };

  function init() {
    // 0. Refresh state from persistent storage
    if (typeof AppState !== 'undefined' && AppState.settings && AppState.settings.sortMethod) {
      state.sortMethod = AppState.settings.sortMethod;
    }

    // 1. Initialize Header Actions
    const addBtn = new IconActionButton({
      id: 'add-btn',
      title: 'Add new...',
      iconName: 'plus',
      onClick: (e) => {
        _hideContextMenu();
        const items = [
          { label: 'New File', icon: 'file-plus', shortcut: '⌘N', onClick: () => _createNewItem('root', 'file') },
          { label: 'New Folder', icon: 'folder-plus', shortcut: '⇧⌘N', onClick: () => _createNewItem('root', 'directory') },
          { divider: true },
          { label: 'Import from System', icon: 'copy-plus', onClick: () => _handleImportFromSystem('root', 'copy') },
          { label: 'Move into Workspace', icon: 'folder-input', onClick: () => _handleImportFromSystem('root', 'move') }
        ];
        if (typeof DesignSystem !== 'undefined') DesignSystem.createContextMenu(e, items);
      }
    });

    const sortBtn = new IconActionButton({
      id: 'sort-btn',
      title: 'Sort files',
      iconName: 'sort',
      onClick: (e) => _showSortMenu(e)
    });

    const searchBtn = new IconActionButton({
      id: 'enter-search-btn',
      title: 'Search files',
      iconName: 'search',
      onClick: () => {
        if (typeof SearchPalette !== 'undefined') SearchPalette.show();
      }
    });

    // 2. Initialize Section Header
    const header = new SidebarSectionHeader({
      title: 'ALL FILES',
      collapsible: {
        sectionId: 'file-explorer-section',
        storageKey: 'mdpreview_explorer_collapsed',
        appStateKey: 'explorerCollapsed'
      },
      actions: [
        [addBtn],
        [sortBtn, searchBtn]
      ]
    });

    const mount = document.getElementById('file-explorer-header-mount');
    if (mount) {
      mount.innerHTML = '';
      mount.appendChild(header.render());
    }

    const searchMount = document.getElementById('search-results-header-mount');
    if (searchMount) {
      const searchHeader = new SidebarSectionHeader({
        title: 'SEARCH RESULTS',
        collapsible: {
          sectionId: 'search-results-section',
          storageKey: 'mdpreview_search_collapsed'
        }
      });
      searchMount.innerHTML = '';
      searchMount.appendChild(searchHeader.render());
    }

    // 3. Initialize Hidden Items Header
    const hiddenHeader = new SidebarSectionHeader({
      title: 'HIDDEN FROM TREE',
      defaultCollapsed: true,
      collapsible: {
        sectionId: 'hidden-items-section'
      }
    });

    const hiddenMount = document.getElementById('hidden-items-header-mount');
    if (hiddenMount) {
      hiddenMount.innerHTML = '';
      hiddenMount.appendChild(hiddenHeader.render());
    }

    // Sync sort icon
    _updateSortBtnIcon();

    // Global click to deselect
    document.addEventListener('mousedown', (e) => {
      // Define "Safe Zones" where clicking should NOT trigger tree deselection
      const isSafeZone = !!e.target.closest(
        '.tree-item, ' +              // Tree items themselves
        '.tab-item, ' +               // Tab items
        '.tab-bar-container, ' +      // Entire tab bar area (including right actions)
        '.ds-change-action-view-bar, ' + // Floating mode switch bar
        '#right-sidebar-wrap, ' +     // Right sidebar (Comments/Collect)
        '.ctx-menu, .modal'           // UI overlays
      );

      if (!isSafeZone) {
        deselectAll();
      }
    });

    // Root Context Menu Handler for all scroll containers
    document.addEventListener('contextmenu', (e) => {
      const container = e.target.closest('.ds-scroll-container');
      if (container && !e.target.closest('.tree-item')) {
        e.preventDefault();
        const isHiddenArea = !!e.target.closest('#hidden-items-section');
        const targetPath = 'root';
        
        let items = [];
        if (!isHiddenArea) {
          items = [
            { label: 'New File', icon: 'file-plus', shortcut: '⌘N', onClick: () => _createNewItem(targetPath, 'file') },
            { label: 'New Folder', icon: 'folder-plus', shortcut: '⇧⌘N', onClick: () => _createNewItem(targetPath, 'directory') },
            { divider: true },
            { label: 'Import from System', icon: 'copy-plus', onClick: () => _handleImportFromSystem(targetPath, 'copy') },
            { label: 'Move into Workspace', icon: 'folder-input', onClick: () => _handleImportFromSystem(targetPath, 'move') },
            { divider: true },
            { label: 'Collapse All Folders', icon: 'folder-minus', shortcut: '⌘[', onClick: () => collapseAll() },
            { divider: true }
          ];
        }

        items.push(
          { label: 'Open Workspace in Finder', icon: 'external-link', onClick: () => {
            if (typeof AppState !== 'undefined' && AppState.currentWorkspace) {
              FileService.revealInFinder(AppState.currentWorkspace.path);
            }
          }},
          { label: 'Refresh Tree', icon: 'refresh-cw', onClick: () => load() }
        );

        if (typeof DesignSystem !== 'undefined') {
          DesignSystem.createContextMenu(e, items);
        }
      }
    });
  }

  function _handleNewItemShortcut(type) {
    let targetPath = 'root';
    const hiddenPaths = new Set(AppState.settings.hiddenPaths || []);

    if (state.selectedPaths.length > 0) {
      const lastPath = state.selectedPaths[state.selectedPaths.length - 1];
      
      // If the selected path itself is hidden, default to root to protect hidden section
      if (hiddenPaths.has(lastPath)) {
        targetPath = 'root';
      } else {
        const node = _findNodeByPath(treeData, lastPath);
        if (node) {
          targetPath = node.type === 'directory' 
            ? node.path 
            : (node.path.substring(0, node.path.lastIndexOf('/')) || 'root');
          
          // Final check: if calculated target parent is hidden, fallback to root
          if (hiddenPaths.has(targetPath)) targetPath = 'root';
        }
      }
    }
    _createNewItem(targetPath, type);
  }

  function _updateSortBtnIcon() {
    const btn = document.getElementById('sort-btn');
    if (btn) {
      btn.innerHTML = SORT_ICONS[state.sortMethod] || SORT_ICONS.alphabetical_asc;
      const svg = btn.querySelector('svg');
      if (svg) {
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
      }
    }
  }



  async function load() {
    if (TreeDragManager.getIsDragging()) return; // Block loading while dragging

    // Show professional skeleton state
    // Show professional skeleton state
    const mountPoint = document.getElementById('file-tree-mount');
    if (mountPoint) {
      let treeEl = document.getElementById('file-tree');
      if (!treeEl) {
        treeEl = document.createElement('div');
        treeEl.id = 'file-tree';
        const scrollContainer = ScrollContainer.create(treeEl, {
          className: 'ds-scrollbar-thin'
        });
        mountPoint.appendChild(scrollContainer);
      }

      if (!v2Component) {
        v2Component = new TreeViewComponent({
          mount: treeEl,
          onClick: _handleClick,
          onMouseDown: _handleMouseDown,
          onContextMenu: _handleContextMenu,
          onDelete: _handleDelete,
          onRename: _handleRename,
          onFinishRename: _finishRename,
          onMouseLeave: _handleMouseLeave
        });
      }
      v2Component.renderSkeleton(10);
    }

    const expandedPaths = new Set();
    const saveExpanded = (nodes) => {
      nodes.forEach(n => {
        if (n.type === 'directory' && n.expanded) {
          expandedPaths.add(n.path);
          if (n.children) saveExpanded(n.children);
        }
      });
    };
    saveExpanded(treeData);

    const { showHidden, hideEmptyFolders, flatView } = AppState.settings;
    const newData = await FileService.fetchFiles({
      showHidden,
      hideEmpty: hideEmptyFolders,
      flat: flatView
    });

    const restoreExpanded = (nodes) => {
      nodes.forEach(n => {
        if (n.type === 'directory') {
          if (expandedPaths.has(n.path)) n.expanded = true;
          if (n.children) restoreExpanded(n.children);
        }
      });
    };
    restoreExpanded(newData);

    // 3. APPLY PERSISTED STATE (Expanded folders)
    const applyPersistence = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 'directory') {
          if (state.expandedPaths.includes(node.path)) {
            node.expanded = true;
          }
          if (node.children) applyPersistence(node.children);
        }
      });
    };
    applyPersistence(newData);

    treeData = newData;
    render();
  }

  function render(isQuickRender = false, overrideActivePath = null) {
    if (TreeDragManager.getIsDragging() && !isQuickRender) return;

    _sortNodesRecursively(treeData, '');
    
    const hiddenPaths = new Set(AppState.settings.hiddenPaths || []);

    // 1. Filter Main Tree (Visible)
    const filterVisible = (nodes) => {
      return nodes.reduce((acc, node) => {
        if (hiddenPaths.has(node.path)) return acc;
        const newNode = { ...node };
        if (node.type === 'directory' && node.children) {
          newNode.children = filterVisible(node.children);
        }
        acc.push(newNode);
        return acc;
      }, []);
    };

    const visibleData = filterVisible(treeData);
    const filtered = filterTree(visibleData, currentQuery);

    // 2. Filter Hidden List
    const getHidden = (nodes) => {
      let out = [];
      nodes.forEach(n => {
        if (hiddenPaths.has(n.path)) {
          out.push(n);
        } else if (n.type === 'directory' && n.children) {
          out = out.concat(getHidden(n.children));
        }
      });
      return out;
    };
    const hiddenData = getHidden(treeData);

    // ── Main Explorer Re-mounting Logic ──
    const mountPoint = document.getElementById('file-tree-mount');
    if (mountPoint && (!v2Component || !document.body.contains(v2Component.mount))) {
      mountPoint.innerHTML = ''; // Ensure clean slate
      const treeEl = document.createElement('div');
      treeEl.id = 'file-tree';
      const scrollContainer = ScrollContainer.create(treeEl, { className: 'ds-scrollbar-thin' });
      mountPoint.appendChild(scrollContainer);

      v2Component = new TreeViewComponent({
        mount: treeEl,
        onClick: _handleClick,
        onMouseDown: _handleMouseDown,
        onContextMenu: _handleContextMenu,
        onDelete: _handleDelete,
        onRename: _handleRename,
        onFinishRename: _finishRename,
        onMouseLeave: _handleMouseLeave
      });
    }

    // ── Hidden Items Re-mounting Logic ──
    const hMountPoint = document.getElementById('hidden-items-mount');
    if (hMountPoint && (!hiddenItemsV2Component || !document.body.contains(hiddenItemsV2Component.mount))) {
      hMountPoint.innerHTML = '';
      const hListEl = document.createElement('div');
      hListEl.id = 'hidden-items-list';
      const hScrollContainer = ScrollContainer.create(hListEl, { 
        className: 'ds-scrollbar-thin'
      });
      hMountPoint.appendChild(hScrollContainer);

      hiddenItemsV2Component = new TreeViewComponent({
        mount: hListEl,
        onClick: _handleClick,
        onMouseDown: _handleMouseDown,
        onContextMenu: _handleContextMenu,
        onDelete: _handleDelete,
        onRename: _handleRename,
        onFinishRename: _finishRename,
        onMouseLeave: _handleMouseLeave
      });
    }

    // Update UI via Components
    if (v2Component) {
      v2Component.update(
        filtered,
        state.selectedPaths,
        currentQuery,
        state.sortMethod,
        overrideActivePath || AppState.currentFile,
        state.renamingPath
      );
    }

    if (hiddenItemsV2Component) {
      hiddenItemsV2Component.update(
        hiddenData,
        state.selectedPaths,
        '',
        state.sortMethod,
        overrideActivePath || AppState.currentFile,
        state.renamingPath
      );
    }

    // ── NEW: Auto-hide Hidden Section if empty ──
    const hiddenSection = document.getElementById('hidden-items-section');
    if (hiddenSection) {
      const hasHidden = hiddenData.length > 0;
      hiddenSection.style.display = hasHidden ? 'flex' : 'none';
      
      // Also hide the divider before it
      const divider = hiddenSection.previousElementSibling;
      if (divider && divider.classList.contains('sidebar-divider')) {
        divider.style.display = hasHidden ? 'block' : 'none';
      }
    }
  }

  function _sortNodesRecursively(nodes, parentPath) {
    if (!nodes) return;

    nodes.sort((a, b) => {
      // Directories always first (unless in Custom Mode)
      if (state.sortMethod !== 'custom' && a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }

      if (state.sortMethod.startsWith('alphabetical')) {
        const res = a.name.localeCompare(b.name);
        return state.sortMethod.endsWith('_desc') ? -res : res;
      } else if (state.sortMethod.startsWith('time')) {
        const res = (a.mtime || 0) - (b.mtime || 0);
        return state.sortMethod.endsWith('_desc') ? -res : res;
      } else if (state.sortMethod === 'custom') {
        const order = state.customOrders[parentPath || 'root'] || [];
        const idxA = order.indexOf(a.name);
        const idxB = order.indexOf(b.name);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    nodes.forEach(n => {
      if (n.type === 'directory' && n.children) {
        _sortNodesRecursively(n.children, n.path);
      }
    });
  }

  /**
   * ── NEW: INDEPENDENT HANDLERS ──
   * Các hàm này tách biệt logic nghiệp vụ khỏi UI
   */
  async function _handleToggle(node) {
    // Find the real node in the original treeData to avoid toggling clones
    const realNode = _findNodeByPath(treeData, node.path);
    if (!realNode || realNode.type !== 'directory') return;

    realNode.expanded = !realNode.expanded;

    // Persist expanded state
    if (realNode.expanded) {
      if (!state.expandedPaths.includes(realNode.path)) state.expandedPaths.push(realNode.path);
    } else {
      state.expandedPaths = state.expandedPaths.filter(p => p !== realNode.path);
    }
    localStorage.setItem('mdpreview_expanded_paths', JSON.stringify(state.expandedPaths));
    if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();

    render(true);
  }

  function _handleClick(e, node, itemEl) {
    const isMulti = e && (e.ctrlKey || e.metaKey);
    const isShift = e && e.shiftKey;
    const container = itemEl ? itemEl.closest('.ds-tree-view') : null;
    const isChevron = e && e.target && e.target.closest('.item-chevron-wrap');

    // 1. Handle Chevron Toggle (Independent of selection)
    if (isChevron && node.type === 'directory') {
      _handleToggle(node);
      return;
    }

    // 2. Handle Selection Logic
    if (isMulti) {
      const idx = state.selectedPaths.indexOf(node.path);
      if (idx > -1) state.selectedPaths.splice(idx, 1);
      else state.selectedPaths.push(node.path);
      render(true);
    } else if (isShift && container) {
      let lastPath = state.selectedPaths.length > 0 ? state.selectedPaths[state.selectedPaths.length - 1] : AppState.currentFile;
      const allItems = Array.from(container.querySelectorAll('.tree-item'));
      const startIdx = lastPath ? allItems.findIndex(el => el.dataset.path === lastPath) : -1;
      const endIdx = allItems.findIndex(el => el.dataset.path === node.path);

      if (startIdx > -1 && endIdx > -1) {
        const [min, max] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
        for (let i = min; i <= max; i++) {
          const path = allItems[i].dataset.path;
          if (!state.selectedPaths.includes(path)) state.selectedPaths.push(path);
        }
      } else {
        if (!state.selectedPaths.includes(node.path)) state.selectedPaths.push(node.path);
      }
      render(true);
    } else {
      const wasAlreadySelected = state.selectedPaths.length === 1 && state.selectedPaths[0] === node.path;
      const isLabelClick = e && e.target && e.target.classList.contains('item-label');

      state.selectedPaths = [node.path];

      // Smart Click to Rename: If already selected and clicking label again (FILES ONLY)
      if (node.type === 'file' && wasAlreadySelected && isLabelClick) {
        _handleRename(null, node, itemEl);
        return;
      }

      // If clicking a directory (not chevron), we still toggle it for convenience
      // but we ALSO select it.
      if (node.type === 'directory') {
        _handleToggle(node);
      } else {
        if (window.loadFile && AppState.currentFile !== node.path) {
          window.loadFile(node.path).catch(_err => {
            console.warn('Failed to load file from tree click:', node.path);
          });
        }
      }

      render(true, node.path);
    }
  }

  async function _handleRename(e, node, _itemEl) {
    if (e && e.stopPropagation) e.stopPropagation();
    state.renamingPath = node.path;
    render(true); // Re-render to show input
  }

  function _handleDelete(e, node) {
    e.stopPropagation();
    if (typeof DesignSystem !== 'undefined') {
      DesignSystem.showConfirm({
        title: 'Delete File',
        message: `Are you sure you want to delete "${node.name}"? This action cannot be undone.`,
        onConfirm: async () => {
          const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
          const absPath = (wsPath + '/' + node.path).replace(/\/\//g, '/');
          const res = await FileService.deleteFile(absPath);
          if (res.success) {
            if (AppState.currentFile === node.path) AppState.currentFile = null;
            load();
          }
        }
      });
    }
  }

  function _handleContextMenu(e, node, itemEl) {
    e.preventDefault();

    // Check if clicked item is part of existing selection
    if (!state.selectedPaths.includes(node.path)) {
      state.selectedPaths = [node.path];
      render(true);
    }

    if (typeof DesignSystem !== 'undefined') {
      const isMulti = state.selectedPaths.length > 1;
      const isFolder = node.type === 'directory';

      let items = [];

      if (!isMulti) {
        // Determine where to create new items: current folder or sibling of current file
        const targetPath = isFolder ? node.path : (node.path.substring(0, node.path.lastIndexOf('/')) || 'root');
        const hiddenPaths = AppState.settings.hiddenPaths || [];
        const isHidden = hiddenPaths.includes(node.path);

        items = [
          { label: 'Rename', icon: 'edit', shortcut: 'Enter', onClick: () => _handleRename(e, node, itemEl) }
        ];

        if (isFolder) {
          items.push({ label: 'Collapse Other Folders', icon: 'chevrons-down-up', shortcut: '⇧⌘[', onClick: () => collapseOthers(node.path) });
          items.push({ divider: true });
        }

        if (!isHidden) {
          items.push(
            { label: 'Duplicate', icon: 'copy', shortcut: '⌘D', onClick: () => _handleDuplicate(e, node) },
            { divider: true },
            { label: 'New File', icon: 'file-plus', shortcut: '⌘N', onClick: () => _createNewItem(targetPath, 'file') },
            { label: 'New Folder', icon: 'folder-plus', shortcut: '⇧⌘N', onClick: () => _createNewItem(targetPath, 'directory') },
            { divider: true },
            { label: 'Import from System', icon: 'copy-plus', onClick: () => _handleImportFromSystem(node, 'copy') },
            { label: 'Move into Workspace', icon: 'folder-input', onClick: () => _handleImportFromSystem(node, 'move') },
            { divider: true }
          );
        } else {
          items.push({ divider: true });
        }

        items.push(
          { label: 'Reveal in Finder', icon: 'external-link', onClick: () => _handleRevealInFinder(e, node) },
          { label: 'Copy Relative Path', icon: 'clipboard', onClick: () => _handleCopyPath(node, 'relative') },
          { divider: true },
          { 
            label: isHidden ? 'Unhide' : 'Hide from Tree', 
            icon: isHidden ? 'eye' : 'eye-off', 
            shortcut: '⇧⌘H',
            onClick: () => _handleToggleHidden(node) 
          },
          { divider: true },
          { label: 'Delete', icon: 'trash', danger: true, shortcut: '⌘⌫', onClick: () => _handleDelete(e, node) }
        );
      } else {
        const pathsForBatch = [...state.selectedPaths];
        const hiddenPaths = AppState.settings.hiddenPaths || [];
        const isCurrentlyHidden = hiddenPaths.includes(node.path);

        items = [
          { 
            label: isCurrentlyHidden ? `Show (${pathsForBatch.length} items) in Tree` : `Hide (${pathsForBatch.length} items) from Tree`, 
            icon: isCurrentlyHidden ? 'eye' : 'eye-off', 
            onClick: () => _handleBatchToggleHidden(!isCurrentlyHidden, pathsForBatch) 
          },
          { label: `Delete (${pathsForBatch.length} items)`, icon: 'trash', danger: true, onClick: () => _handleBatchOp('delete') },
          { label: 'Copy Paths', icon: 'clipboard', onClick: () => _handleBatchCopyPaths() }
        ];
      }

      DesignSystem.createContextMenu(e, items);
    }
  }

  function _handleBatchCopyPaths() {
    const text = state.selectedPaths.join('\n');
    navigator.clipboard.writeText(text);
    if (typeof showToast === 'function') showToast(`Paths for ${state.selectedPaths.length} items copied`);
  }

  async function _handleDuplicate(e, node) {
    const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
    const absPath = (wsPath.replace(/\/$/, '') + '/' + node.path).replace(/\/\//g, '/');
    const res = await FileService.duplicateFile(absPath);
    if (res.success) {
      load();
    }
  }

  async function _handleRevealInFinder(e, node) {
    const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
    const absPath = (wsPath.replace(/\/$/, '') + '/' + node.path).replace(/\/\//g, '/');
    FileService.revealInFinder(absPath);
  }

  async function _handleImportFromSystem(targetNodeOrPath, mode = 'copy') {
    const filePaths = await FileService.openFiles({
      title: mode === 'move' ? 'Move Files into Workspace' : 'Import Files from System'
    });
    if (!filePaths || filePaths.length === 0) return;

    let targetDir = 'root';
    if (typeof targetNodeOrPath === 'object') {
      targetDir = targetNodeOrPath.type === 'directory' 
        ? targetNodeOrPath.path 
        : (targetNodeOrPath.path.substring(0, targetNodeOrPath.path.lastIndexOf('/')) || 'root');
    }

    const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
    const destFolderAbs = (wsPath.replace(/\/$/, '') + '/' + (targetDir === 'root' ? '' : targetDir)).replace(/\/\//g, '/');

    let successCount = 0;
    for (const srcAbs of filePaths) {
      const fileName = srcAbs.split(/[\\/]/).pop();
      const destAbs = (destFolderAbs + '/' + fileName).replace(/\/\//g, '/');
      
      let res;
      if (mode === 'move') {
        res = await FileService.moveFile(srcAbs, destAbs);
      } else {
        res = await FileService.copyFile(srcAbs, destAbs);
      }
      if (res.success) successCount++;
    }

    if (successCount > 0) {
      if (typeof showToast === 'function') showToast(`${mode === 'move' ? 'Moved' : 'Imported'} ${successCount} files`);
      load();
    }
  }

  function _handleCopyPath(node, type = 'relative') {
    const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
    const path = type === 'relative' ? node.path : (wsPath + '/' + node.path).replace(/\/\//g, '/');
    navigator.clipboard.writeText(path);
    if (typeof showToast === 'function') showToast('Path copied to clipboard');
  }

  function _handleMouseDown(e, node, itemEl) {
    if (e.button !== 0) return; // Chỉ chuột trái
    const isCustomOrder = state.sortMethod === 'custom';
    const context = { state, treeData, load, _findNodeByPath, handleToggleHidden: _handleToggleHidden, handleBatchToggleHidden: _handleBatchToggleHidden };
    if (isCustomOrder) TreeDragManager.initVIPDrag(e, itemEl, node, context);
    else TreeDragManager.initStandardDrag(e, itemEl, node, context);
  }

  function _handleMouseLeave(e, node, _itemEl) {
    if (TreeDragManager.getIsDragging()) return;
    if (node.type !== 'directory') return;
    const idx = state.selectedPaths.indexOf(node.path);
    if (idx > -1) {
      state.selectedPaths.splice(idx, 1);
      render(true);
    }
  }

  function _handleToggleHidden(node) {
    const hiddenPaths = AppState.settings.hiddenPaths || [];
    const isHiding = !hiddenPaths.includes(node.path);
    _handleBatchToggleHidden(isHiding, [node.path]);
  }

  async function _handleBatchToggleHidden(hide, explicitPaths = null, keepSelection = false) {
    const currentHidden = new Set(AppState.settings.hiddenPaths || []);
    const pathsToProcess = explicitPaths || [...state.selectedPaths];
    
    if (pathsToProcess.length === 0) return;

    pathsToProcess.forEach(p => {
      if (hide) {
        currentHidden.add(p);
        
        // Tab Sync: Close tab if file/folder is hidden
        if (typeof TabsModule !== 'undefined') {
          // Use a spread copy to avoid index shifting bugs when removing from state.openFiles
          const openFiles = [...(TabsModule.getOpenFiles() || [])];
          openFiles.forEach(f => {
            // Close if exact match or if file is inside hidden folder
            if (f === p || f.startsWith(p + '/')) {
              TabsModule.remove(f, true);
            }
          });
        }
      } else {
        currentHidden.delete(p);
      }
    });
    
    if (!keepSelection) state.selectedPaths = []; 
    
    await SettingsService.update('hiddenPaths', Array.from(currentHidden));
    
    if (typeof showToast === 'function') {
      showToast(`${hide ? 'Hidden' : 'Unhidden'} ${pathsToProcess.length} items`);
    }
    
    render(true);
  }

  function _findNodeByPath(nodes, path) {
    if (!path) return null;
    for (const n of nodes) {
      if (n.path === path) return n;
      if (n.children) {
        const found = _findNodeByPath(n.children, path);
        if (found) return found;
      }
    }
    return null;
  }

  function _showSortMenu(e) {
    const methods = [
      { id: 'alphabetical', label: 'Name', icons: { asc: 'sort-alpha-asc', desc: 'sort-alpha-desc' } },
      { id: 'time', label: 'Last Updated', icons: { asc: 'sort-time-asc', desc: 'sort-time-desc' } },
      { id: 'custom', label: 'Custom Order', icon: 'sort-custom' }
    ];

    const items = methods.map(m => {
      const isCurrent = state.sortMethod.startsWith(m.id);
      let displayIcon = '';
      let targetMethod = '';

      if (m.id === 'custom') {
        displayIcon = m.icon;
        targetMethod = 'custom';
      } else {
        const isDesc = isCurrent && state.sortMethod.endsWith('_desc');
        displayIcon = isDesc ? m.icons.desc : m.icons.asc;
        targetMethod = isCurrent 
          ? (state.sortMethod.endsWith('_asc') ? m.id + '_desc' : m.id + '_asc')
          : m.id + '_asc';
      }

      return {
        label: m.label,
        icon: displayIcon,
        active: isCurrent,
        onClick: () => {
          state.sortMethod = targetMethod;
          localStorage.setItem('mdpreview_sort_method', targetMethod);
          if (typeof AppState !== 'undefined') {
            AppState.settings.sortMethod = targetMethod;
            if (AppState.savePersistentState) AppState.savePersistentState();
          }
          _updateSortBtnIcon();
          load();
        }
      };
    });

    DesignSystem.createContextMenu(e, items);
  }

  /**
   * Helper to expand all parent directories for a given path
   */
  function _revealPath(path) {
    if (!path) return false;
    const segments = path.split('/');
    if (segments.length <= 1) return false;

    let changed = false;
    let currentPath = '';

    for (let i = 0; i < segments.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${segments[i]}` : segments[i];
      if (!state.expandedPaths.includes(currentPath)) {
        state.expandedPaths.push(currentPath);
        const node = _findNodeByPath(treeData, currentPath);
        if (node) node.expanded = true;
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem('mdpreview_expanded_paths', JSON.stringify(state.expandedPaths));
    }
    return changed;
  }

  function setActiveFile(filePath) {
    if (!filePath) return;

    // 0. Auto-expand parent folders if collapsed
    const changed = _revealPath(filePath);
    if (changed) {
      render(true);
    }

    const trees = document.querySelectorAll('.ds-tree-view');
    if (!trees.length) return;

    trees.forEach(container => {
      // 1. Remove active class from previously active item in THIS container
      const prev = container.querySelector('.tree-item.active');
      if (prev) {
        if (prev.dataset.path === filePath) return; // Already active in this container
        prev.classList.remove('active');
      }

      // 2. Add active class to the new path if it exists in THIS container
      const current = container.querySelector(`.tree-item[data-path="${filePath.replace(/"/g, '\\"')}"]`);
      if (current) {
        current.classList.add('active');
        
        // 3. Ensure it's scrolled into view
        requestAnimationFrame(() => {
          current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
    });
  }

  function filterTree(nodes, q) {
    if (!q) return nodes;
    return nodes.reduce((acc, node) => {
      const matchSelf = node.name.toLowerCase().includes(q);
      if (node.type === 'directory') {
        const filteredChildren = filterTree(node.children, q);
        if (matchSelf || filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren, expanded: true });
        }
      } else if (matchSelf) {
        acc.push(node);
      }
      return acc;
    }, []);
  }

  function _hideContextMenu() {
    const existing = document.querySelector('.ctx-menu');
    if (existing) existing.remove();
  }

  // ── Multi-selection Helpers ─────────────────────────────
  function toggleSelect(path, _skipSync = false) {
    const idx = state.selectedPaths.indexOf(path);
    if (idx > -1) state.selectedPaths.splice(idx, 1);
    else state.selectedPaths.push(path);
    state.lastSelectedPath = path;
    _syncSelectionUI();
  }

  function _selectRange(path, skipSync = false) {
    const allVisible = Array.from(document.querySelectorAll('.tree-item'));
    const allPaths = allVisible.map(el => el.dataset.path);
    const startIdx = allPaths.indexOf(state.lastSelectedPath);
    const endIdx = allPaths.indexOf(path);
    if (startIdx === -1) { toggleSelect(path, skipSync); return; }
    const min = Math.min(startIdx, endIdx);
    const max = Math.max(startIdx, endIdx);
    const range = allPaths.slice(min, max + 1);
    state.selectedPaths = Array.from(new Set([...state.selectedPaths, ...range]));
    state.lastSelectedPath = path;
    _syncSelectionUI();
  }

  function deselectAll(_skipSync = false) {
    state.selectedPaths = [];
    state.lastSelectedPath = null;
    _syncSelectionUI();
  }

  function syncSelectionFromTabs(_paths) {
    // Disabled: Independent selection between Sidebar and TabBar
    /*
    state.selectedPaths = [...paths];
    _syncSelectionUI();
    */
  }

  function _syncSelectionUI() {
    document.querySelectorAll('.tree-item').forEach(el => {
      const path = el.dataset.path;
      const isActive = el.classList.contains('active');
      const isSelected = state.selectedPaths.includes(path) && !isActive;
      el.classList.toggle('selected', isSelected);
    });
  }

  async function _handleBatchOp(type) {
    const paths = [...state.selectedPaths];
    if (paths.length === 0) return;
    if (type === 'delete') {
      DesignSystem.showConfirm({
        title: 'Delete Items',
        message: `Delete ${paths.length} items?`,
        onConfirm: async () => {
          try {
            for (const p of paths) {
              const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
              const absPath = wsPath ? wsPath.replace(/\/$/, '') + '/' + p : p;
              await FileService.deleteFile(absPath);
            }
            state.selectedPaths = [];
            load();
          } catch (err) {
            if (typeof showToast === 'function') showToast(`Batch Error: ${err.message}`, 'error');
          }
        }
      });
      return;
    }
    const destFolder = await FileService.openFolder();
    if (!destFolder) return;
    for (const p of paths) {
      const fileName = p.split('/').pop();
      const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
      const srcAbs = wsPath ? wsPath.replace(/\/$/, '') + '/' + p : p;
      const destAbs = destFolder.replace(/\/$/, '') + '/' + fileName;
      if (type === 'move') await FileService.moveFile(srcAbs, destAbs);
      else await window.electronAPI.copyFile(srcAbs, destAbs);
    }
    state.selectedPaths = [];
    load();
  }



  async function _finishRename(node, newName, save) {
    const originalName = node.name;
    const oldPath = node.path;
    state.renamingPath = null; // Clear state

    if (save && newName && newName !== originalName) {
      if (!newName.toLowerCase().endsWith('.md') && node.type === 'file') newName += '.md';
      const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
      const oldAbs = (wsPath.replace(/\/$/, '') + '/' + oldPath).replace(/\/\//g, '/');
      const dir = oldPath.substring(0, oldPath.lastIndexOf('/') + 1);
      const newRelative = dir + newName;
      const newAbs = (wsPath.replace(/\/$/, '') + '/' + newRelative).replace(/\/\//g, '/');

      const res = await FileService.renameFile(oldAbs, newAbs);
      if (res.success) {
        TreeDragManager.syncCustomOrder(oldPath, newRelative, state);
        if (typeof RecentlyViewedModule !== 'undefined') RecentlyViewedModule.swap(oldPath, newRelative);
        if (AppState.currentFile === oldPath) AppState.currentFile = newRelative;
        load();
      } else {
        render(true);
      }
    } else {
      render(true);
    }
  }

  async function _createNewItem(parentPath, type) {
    const isRoot = parentPath === 'root';
    const parentData = isRoot ? treeData : _findNodeByPath(treeData, parentPath);

    if (!isRoot && parentData && parentData.type === 'directory') {
      parentData.expanded = true;
    }

    const siblings = isRoot ? treeData : (parentData ? parentData.children : []);
    let baseName = type === 'file' ? 'untitled.md' : 'New Folder';
    let newName = baseName;
    let counter = 1;

    const exists = (name) => siblings.some(s => s.name.toLowerCase() === name.toLowerCase());

    while (exists(newName)) {
      if (type === 'file') {
        newName = `untitled ${counter++}.md`;
      } else {
        newName = `New Folder ${counter++}`;
      }
    }

    const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
    const relativePath = isRoot ? newName : (parentPath.replace(/\/$/, '') + '/' + newName);
    const absPath = (wsPath.replace(/\/$/, '') + '/' + relativePath).replace(/\/\//g, '/');

    let res;
    if (type === 'file') {
      res = await FileService.createFile(absPath, '');
    } else {
      res = await FileService.createFolder(absPath);
    }

    if (res.success) {

      // Register in Custom Order if parent has one
      if (state.customOrders[parentPath]) {
        if (!state.customOrders[parentPath].includes(newName)) {
          state.customOrders[parentPath].push(newName);
          localStorage.setItem('mdpreview_custom_orders', JSON.stringify(state.customOrders));
          if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();
        }
      }

      await load();

      // Find the new element and start renaming it
      setTimeout(() => {
        const container = document.getElementById('file-tree');
        const newEl = container.querySelector(`.tree-item[data-path="${relativePath}"]`);
        if (newEl) {
          const newNode = _findNodeByPath(treeData, relativePath);
          if (newNode) _handleRename(null, newNode, newEl);
        }
      }, 100);
    } else {
      if (typeof showToast === 'function') showToast(`Error: ${res.error}`, 'error');
    }
  }

  function collapseAll() {
    const collapseNodes = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 'directory') {
          node.expanded = false;
          if (node.children) collapseNodes(node.children);
        }
      });
    };
    collapseNodes(treeData);
    state.expandedPaths = [];
    localStorage.setItem('mdpreview_expanded_paths', JSON.stringify(state.expandedPaths));
    if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();
    render(true);
  }

  function collapseOthers(targetPath) {
    if (!targetPath) return;
    
    // Calculate paths to keep expanded (all parent segments)
    const segments = targetPath.split('/');
    const pathsToKeep = new Set();
    let current = '';
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      pathsToKeep.add(current);
    }

    const collapseExcept = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 'directory') {
          if (!pathsToKeep.has(node.path)) {
            node.expanded = false;
          }
          if (node.children) collapseExcept(node.children);
        }
      });
    };
    
    collapseExcept(treeData);
    
    // Filter expandedPaths
    state.expandedPaths = state.expandedPaths.filter(p => pathsToKeep.has(p));
    localStorage.setItem('mdpreview_expanded_paths', JSON.stringify(state.expandedPaths));
    if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();
    render(true);
  }

  function _esc(t) {
    const div = document.createElement('div');
    div.textContent = t;
    return div.innerHTML;
  }


  function clear() {
    treeData = [];
    const container = document.getElementById('file-tree');
    if (container) container.innerHTML = '';
  }

  return {
    init,
    load,
    getTreeData: () => treeData,
    openFile: (path) => {
      const node = _findNodeByPath(treeData, path);
      if (node) _handleClick(null, node);
    },
    setActiveFile,
    clear,
    deselectAll,
    syncSelectionFromTabs,
    getState: () => state,
    // API for Components
    handleToggle: _handleToggle,
    handleClick: _handleClick,
    handleRename: _handleRename,
    finishRename: _finishRename,
    handleDelete: _handleDelete,
    handleContextMenu: _handleContextMenu,
    handleMouseDown: _handleMouseDown,
    handleBatchToggleHidden: _handleBatchToggleHidden, // Exported for multi-select
    collapseAll,
    collapseOthers,
    createNewFile: () => _handleNewItemShortcut('file'),
    createNewFolder: () => _handleNewItemShortcut('directory'),
    renameSelected: () => {
      if (state.selectedPaths.length === 1) {
        const path = state.selectedPaths[0];
        const el = document.querySelector(`.tree-item[data-path="${path}"]`);
        const node = _findNodeByPath(treeData, path);
        if (el && node) _handleRename(null, node, el);
      }
    },
    duplicateSelected: () => {
      if (state.selectedPaths.length === 1) {
        const path = state.selectedPaths[0];
        const node = _findNodeByPath(treeData, path);
        if (node) _handleDuplicate(null, node);
      }
    },
    deleteSelected: () => {
      if (state.selectedPaths.length > 0) _handleBatchOp('delete');
    },
    toggleHiddenItems: () => {
      if (state.selectedPaths.length > 0) {
        const firstPath = state.selectedPaths[0];
        const hiddenPaths = AppState.settings.hiddenPaths || [];
        const isHiding = !hiddenPaths.includes(firstPath);
        _handleBatchToggleHidden(isHiding, state.selectedPaths);
      }
    }
  };
})();

window.TreeModule = TreeModule;

```
</file>

<file path="renderer/js/modules/workspace.js">
```js
/* ============================================================
   workspace.js — Workspace CRUD + UI (Vanilla CSS version)
   ============================================================ */

const WorkspaceModule = (() => {
  let workspaces = [];
  let activeId = null;

  // ── Init ────────────────────────────────────────────────────
  async function init() {
    _bindPanelEvents();
    await load();
  }

  // ── Load from main process ──────────────────────────────────
  async function load() {
    if (!window.electronAPI) {
      console.warn('WorkspaceModule: window.electronAPI is undefined. Workspaces will not be loaded.');
      return;
    }
    const data = await window.electronAPI.getWorkspaces();
    workspaces = data.workspaces || [];
    activeId = data.activeWorkspaceId;
    _renderSwitcher();
    await _applyActive();
  }

  // ── Apply active workspace to server + tree ─────────────────
  async function _applyActive() {
    const ws = workspaces.find(w => w.id === activeId) || null;
    AppState.currentWorkspace = ws;

    const lbl = document.getElementById('workspace-name');
    const switcher = AppState.components && AppState.components.workspaceSwitcher;

    if (switcher) {
      switcher.update(ws ? ws.name : 'Add Workspace');
    } else if (lbl) {
      lbl.textContent = ws ? ws.name : 'Add Workspace';
      lbl.classList.remove('skeleton', 'skeleton-text');
      lbl.style.width = ''; 
    }

    if (ws) {
      if (window.electronAPI) {
        await window.electronAPI.setWatchDir(ws.path);
      }
      TreeModule.load();
      if (typeof TabsModule !== 'undefined') TabsModule.switchWorkspace(ws.id);
    } else {
      setNoFile();
      const tree = document.getElementById('file-tree');
      if (tree) tree.innerHTML = '';
      const empty = document.getElementById('tree-empty');
      if (empty) empty.classList.add('show');
      if (typeof TabsModule !== 'undefined') TabsModule.switchWorkspace(null);
    }
  }

  // ── Switch workspace ────────────────────────────────────────
  async function switchTo(id) {
    if (!window.electronAPI) return;

    // Dirty check before switching workspace
    if (AppState.currentMode === 'edit' && typeof EditorModule !== 'undefined' && EditorModule.isDirty()) {
      const isDraft = AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_');
      const isFirstEdit = EditorModule.getOriginalContent() === '';

      if (isDraft || isFirstEdit) {
        await EditorModule.save();
      } else {
        DesignSystem.showConfirm({
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Switch workspace anyway?',
          onConfirm: async () => {
            await _proceedSwitch(id);
          }
        });
        return;
      }
    }

    await _proceedSwitch(id);
  }

  async function _proceedSwitch(id) {
    const ws = workspaces.find(w => w.id === id);
    activeId = id;
    AppState.currentWorkspace = ws; // CRITICAL: Update AppState before context switches
    AppState.currentFile = null;
    await window.electronAPI.setActiveWorkspace(id);
    if (typeof CommentsModule !== 'undefined') CommentsModule.clearUI();
    setNoFile();

    // Switch tabs context
    if (typeof TabsModule !== 'undefined') TabsModule.switchWorkspace(id);

    await load();
    if (typeof showToast === 'function' && ws) {
      showToast(`Switched to ${ws.name}`);
    }
  }

  // ── Add workspace ────────────────────────────────────────────
  async function add(name, folderPath) {
    if (!window.electronAPI) return;
    const ws = await window.electronAPI.saveWorkspace({ name, path: folderPath });
    workspaces.push(ws);
    activeId = ws.id;
    await window.electronAPI.setActiveWorkspace(ws.id);
    await load();
    if (typeof showToast === 'function') {
      showToast(`Created workspace: ${name}`);
    }
  }

  // ── Rename workspace ─────────────────────────────────────────
  async function rename(id, newName) {
    if (!window.electronAPI) return;
    await window.electronAPI.renameWorkspace(id, newName);
    await load();
    if (typeof showToast === 'function') {
      showToast(`Renamed to ${newName}`);
    }
  }

  // ── Delete workspace ─────────────────────────────────────────
  async function remove(id) {
    if (!window.electronAPI) return;
    const ws = workspaces.find(w => w.id === id);
    const name = ws ? ws.name : '';
    const data = await window.electronAPI.deleteWorkspace(id);

    // Cleanup persistence
    localStorage.removeItem(`tabs_${id}`);
    localStorage.removeItem(`draft_${id}`);
    if (typeof ScrollModule !== 'undefined') {
      ScrollModule.clearForWorkspace(id);
    }

    workspaces = data.workspaces;
    activeId = data.activeWorkspaceId;

    // Immediately clear tree to avoid ghosting
    if (typeof TreeModule !== 'undefined') TreeModule.clear();

    _renderSwitcher();
    await _applyActive();

    if (typeof showToast === 'function' && name) {
      showToast(`Deleted workspace: ${name}`);
    }
  }

  // ── Render switcher label ────────────────────────────────────
  function _renderSwitcher() {
    const ws = workspaces.find(w => w.id === activeId);
    const lbl = document.getElementById('workspace-name');
    const switcher = AppState.components && AppState.components.workspaceSwitcher;

    if (switcher) {
      switcher.update(ws ? ws.name : 'Add Workspace');
    } else if (lbl) {
      lbl.textContent = ws ? ws.name : 'Add Workspace';
      lbl.classList.remove('skeleton', 'skeleton-text');
      lbl.style.width = '';
    }
  }

  function _openPanel() {
    let popover = null;

    const refreshContent = () => {
      if (!popover || !popover.body) return;
      
      popover.body.innerHTML = '';
      const component = new WorkspacePickerComponent({
        workspaces: workspaces,
        activeId: activeId,
        onSelect: (id) => {
          switchTo(id);
          popover.close();
        },
        onAdd: () => {
          _openModal(null, () => refreshContent());
        },
        onRename: async (id, newName) => {
          await rename(id, newName);
          refreshContent();
        },
        onDelete: async (ws) => {
          DesignSystem.showConfirm({
            title: 'Delete Workspace',
            message: `Are you sure you want to remove workspace "${ws.name}"? This action cannot be undone.`,
            onConfirm: async () => {
              await remove(ws.id);
              refreshContent();
            }
          });
        }
      });
      popover.body.appendChild(component.render());
    };

    popover = WorkspacePickerComponent.open({
      workspaces: workspaces,
      activeId: activeId,
      onSelect: (id) => {
        switchTo(id);
        popover.close();
      },
      onAdd: () => {
        _openModal(null, () => refreshContent());
      },
      onRename: async (id, newName) => {
        await rename(id, newName);
        refreshContent();
      },
      onDelete: async (ws) => {
        DesignSystem.showConfirm({
          title: 'Delete Workspace',
          message: `Are you sure you want to remove workspace "${ws.name}"? This action cannot be undone.`,
          onConfirm: async () => {
            await remove(ws.id);
            refreshContent();
          }
        });
      }
    });
  }

  // ── Modal open/close ─────────────────────────────────────────
  function _openModal(wsToEdit = null, onAfterConfirm = null) {
    WorkspaceFormComponent.open({
      editWs: wsToEdit,
      onConfirm: async (arg1, arg2) => {
        if (wsToEdit) {
          await rename(arg1, arg2);
        } else {
          await add(arg1, arg2);
        }
        if (onAfterConfirm) onAfterConfirm();
      },
      onBrowse: async () => {
        if (!window.electronAPI) return null;
        return await window.electronAPI.openFolder();
      },
      onCancel: () => {
        // Option to reopen picker if needed
      }
    });
  }

  function _bindPanelEvents() {
    // Switcher click is now handled internally by WorkspaceSwitcherComponent
  }

  return { init, load, openPanel: _openPanel, getActive: () => workspaces.find(w => w.id === activeId) };
})();

window.WorkspaceModule = WorkspaceModule;

```
</file>

<file path="renderer/js/services/file-service.js">
```js
/**
 * FileService.js — High-level file operations service.
 * Wraps Electron IPC calls and provides unified file management.
 */
const FileService = (() => {
    
    /**
     * Fetch file tree from server
     * @param {Object} options { showHidden, hideEmpty, flat }
     */
    async function fetchFiles(options = {}) {
        const query = new URLSearchParams({
            showHidden: !!options.showHidden,
            hideEmpty: !!options.hideEmpty,
            flat: !!options.flat
        });
        const res = await fetch(`/api/files?${query}`).catch(() => null);
        if (!res || !res.ok) return [];
        return await res.json();
    }

    /**
     * Create a new file
     */
    async function createFile(absPath, content = '') {
        const res = await window.electronAPI.createFile(absPath, content);
        if (res.success) {
            if (typeof showToast === 'function') showToast('File created successfully');
        } else {
            if (typeof showToast === 'function') showToast(`Error creating file: ${res.error}`, 'error');
        }
        return res;
    }

    /**
     * Create a new folder
     */
    async function createFolder(absPath) {
        const res = await window.electronAPI.createFolder(absPath);
        if (res.success) {
            if (typeof showToast === 'function') showToast('Folder created successfully');
        } else {
            if (typeof showToast === 'function') showToast(`Error creating folder: ${res.error}`, 'error');
        }
        return res;
    }

    /**
     * Delete a file or folder
     */
    async function deleteFile(absPath) {
        const res = await window.electronAPI.deleteFile(absPath);
        if (res.success) {
            if (typeof showToast === 'function') showToast('Item deleted');
        } else {
            if (typeof showToast === 'function') showToast(`Error deleting item: ${res.error}`, 'error');
        }
        return res;
    }

    /**
     * Rename a file or folder
     */
    async function renameFile(oldAbs, newAbs) {
        const res = await window.electronAPI.renameFile(oldAbs, newAbs);
        if (!res.success) {
            if (typeof showToast === 'function') showToast(`Error renaming: ${res.error}`, 'error');
        }
        return res;
    }

    /**
     * Duplicate a file or folder
     */
    async function duplicateFile(absPath) {
        const res = await window.electronAPI.duplicateFile(absPath);
        if (res.success) {
            if (typeof showToast === 'function') showToast('Item duplicated');
        } else {
            if (typeof showToast === 'function') showToast(`Error duplicating: ${res.error}`, 'error');
        }
        return res;
    }

    /**
     * Move a file or folder
     */
    async function moveFile(srcAbs, destAbs) {
        const res = await window.electronAPI.moveFile(srcAbs, destAbs);
        if (!res.success) {
            if (typeof showToast === 'function') showToast(`Error moving item: ${res.error}`, 'error');
        }
        return res;
    }

    /**
     * Reveal in OS Finder/Explorer
     */
    function revealInFinder(absPath) {
        window.electronAPI.revealInFinder(absPath);
    }

    /**
     * Open native file picker (multi-selection)
     */
    async function openFiles(options = {}) {
        return await window.electronAPI.openFiles(options);
    }

    /**
     * Copy a file or folder
     */
    async function copyFile(srcAbs, destAbs) {
        const res = await window.electronAPI.copyFile(srcAbs, destAbs);
        if (!res.success) {
            if (typeof showToast === 'function') showToast(`Error copying item: ${res.error}`, 'error');
        }
        return res;
    }

    /**
     * Open native folder picker
     */
    async function openFolder() {
        return await window.electronAPI.openFolder();
    }

    return {
        fetchFiles,
        createFile,
        createFolder,
        deleteFile,
        renameFile,
        duplicateFile,
        moveFile,
        copyFile,
        revealInFinder,
        openFolder,
        openFiles
    };
})();

window.FileService = FileService;

```
</file>

<file path="renderer/js/services/markdown-logic-service.js">
```js
/**
 * MarkdownLogicService
 * ─────────────────────────────────────────────────────────────────
 * Headless service for Markdown transformations and cursor synchronization.
 * Contains pure algorithms extracted from the legacy EditorModule.
 *
 * Public API:
 *   applyAction(textarea, action)  — Apply a formatting action to a textarea
 *   syncCursor(textarea, context)  — Sync cursor/scroll position in a textarea
 *
 * Design principle: No DOM side-effects outside the textarea passed in,
 * no global state except syncCursor._deltaCache (per-file line offset cache).
 */
const MarkdownLogicService = (() => {

  // ══════════════════════════════════════════════════════════════════
  //  applyAction
  // ══════════════════════════════════════════════════════════════════

  /**
   * Applies a Markdown formatting action to a textarea element.
   *
   * Actions are either "wrap" (surrounds selection with symbols) or
   * "line" (prepends/removes a prefix on the current line).
   * All actions are toggle — running the same action twice reverts.
   *
   * @param {HTMLTextAreaElement} textarea - Target textarea element
   * @param {string} action - One of:
   *   Headings : 'h1' 'h2' 'h3' 'h' (h4) 'h5' 'h6'
   *   Inline   : 'b' (bold) 'i' (italic) 'bi' (bold-italic) 's' (strikethrough) 'c' (inline code)
   *   Block    : 'q' (blockquote) 'ul' 'ol' 'tl' (task) 'tl-checked'
   *   Insert   : 'l' (link) 'img' 'hr' 'cb' (code block) 'tb' (table) 'fn' (footnote)
   */
  function applyAction(textarea, action) {
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    // ── Helper: Wrap Toggle (Bold, Italic, Code, etc.) ──
    // If selection already wrapped with symbol → unwrap; otherwise wrap.
    const wrapToggle = (symbol, placeholder) => {
      const isWrapped = selected.startsWith(symbol) && selected.endsWith(symbol);
      if (isWrapped) {
        textarea.setRangeText(selected.substring(symbol.length, selected.length - symbol.length), start, end, 'select');
      } else {
        const newText = selected || placeholder;
        textarea.setRangeText(`${symbol}${newText}${symbol}`, start, end, 'select');
        if (!selected) {
          textarea.setSelectionRange(start + symbol.length, start + symbol.length + placeholder.length);
        }
      }
    };

    // ── Helper: Line Toggle (Quote, List, Task) ──
    // If line already starts with prefix → remove; otherwise prepend.
    const lineToggle = (prefix, placeholder) => {
      let lineStart = text.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = text.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = text.length;
      const lineText = text.substring(lineStart, lineEnd);
      const hasPrefix = lineText.startsWith(prefix);

      if (hasPrefix) {
        textarea.setSelectionRange(lineStart, lineEnd);
        textarea.setRangeText(lineText.substring(prefix.length), lineStart, lineEnd, 'select');
      } else {
        textarea.setSelectionRange(lineStart, lineEnd);
        const newText = lineText || (selected || placeholder);
        textarea.setRangeText(`${prefix}${newText}`, lineStart, lineEnd, 'select');
      }
    };

    // ── Helper: Header Toggle (H1-H6) ──
    // Cycles to the new level; applying the same level again removes the heading.
    const headerToggle = (level) => {
      const prefix = '#'.repeat(level) + ' ';
      let lineStart = text.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = text.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = text.length;
      const lineText = text.substring(lineStart, lineEnd);
      const match = lineText.match(/^(#{1,6})\s/);

      if (match) {
        const existingLevel = match[1].length;
        textarea.setSelectionRange(lineStart, lineEnd);
        if (existingLevel === level) {
          // Same level → remove heading
          textarea.setRangeText(lineText.substring(match[0].length), lineStart, lineEnd, 'select');
        } else {
          // Different level → change to new level
          textarea.setRangeText(`${prefix}${lineText.substring(match[0].length)}`, lineStart, lineEnd, 'select');
        }
      } else {
        textarea.setSelectionRange(lineStart, lineEnd);
        textarea.setRangeText(`${prefix}${lineText || (selected || 'Heading')}`, lineStart, lineEnd, 'select');
      }
    };

    switch (action) {
      case 'h1': headerToggle(1); break;
      case 'h2': headerToggle(2); break;
      case 'h3': headerToggle(3); break;
      case 'h':  headerToggle(4); break;
      case 'h5': headerToggle(5); break;
      case 'h6': headerToggle(6); break;
      case 'b': wrapToggle('**', 'bold text'); break;
      case 'i': wrapToggle('*', 'italic text'); break;
      case 'bi': wrapToggle('***', 'bold italic'); break;
      case 's': wrapToggle('~~', 'strikethrough'); break;
      case 'c': wrapToggle('`', 'code'); break;
      case 'q': lineToggle('> ', 'Quote'); break;
      case 'ul': lineToggle('* ', 'List item'); break;
      case 'ol': lineToggle('1. ', 'List item'); break;
      case 'tl': lineToggle('- [ ] ', 'Task'); break;
      case 'tl-checked': lineToggle('- [x] ', 'Task done'); break;
      case 'l':
        textarea.setRangeText(`[${selected || 'link text'}](url)`, start, end, 'select');
        textarea.setSelectionRange(start + (selected ? selected.length : 9) + 2, start + (selected ? selected.length : 9) + 5);
        break;
      case 'img':
        textarea.setRangeText(`![${selected || 'alt text'}](image-url)`, start, end, 'select');
        textarea.setSelectionRange(start + (selected ? selected.length : 8) + 3, start + (selected ? selected.length : 8) + 12);
        break;
      case 'hr': textarea.setRangeText(`\n---\n`, start, end, 'select'); break;
      case 'cb': textarea.setRangeText(`\`\`\`\n${selected || 'code block'}\n\`\`\``, start, end, 'select'); break;
      case 'tb': textarea.setRangeText(`\n| col1 | col2 |\n|------|------|\n| cell | cell |\n`, start, end, 'select'); break;
      case 'fn': textarea.setRangeText(`${selected || 'text'}[^1]`, start, end, 'select'); break;
    }

    textarea.focus();
  }

  // ══════════════════════════════════════════════════════════════════
  //  _calculatePixelYWithMirror (internal)
  // ══════════════════════════════════════════════════════════════════

  /**
   * Measures the pixel Y position of a character index inside a textarea
   * using a hidden "mirror DIV" that replicates the textarea's layout styles.
   *
   * Why a mirror? Textarea does not expose per-character Y positions natively.
   * By cloning all layout styles into a plain DIV we can leverage the browser's
   * layout engine to give us an accurate offsetTop for any character.
   *
   * @param {HTMLTextAreaElement} textarea
   * @param {number} charIndex - Character index to measure
   * @returns {number} Pixel Y offset from the top of the textarea content
   */
  function _calculatePixelYWithMirror(textarea, charIndex) {
    if (!textarea) return 0;

    const style = getComputedStyle(textarea);
    const mirror = document.createElement('div');

    const stylesToCopy = [
      'fontFamily', 'fontSize', 'fontWeight', 'lineHeight',
      'paddingTop', 'paddingLeft', 'paddingRight', 'paddingBottom',
      'width', 'boxSizing', 'whiteSpace', 'wordWrap', 'wordBreak',
      'letterSpacing', 'textTransform'
    ];

    stylesToCopy.forEach(prop => mirror.style[prop] = style[prop]);

    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.height = 'auto';
    mirror.style.left = '-9999px';
    mirror.style.top = '0';

    // Use clientWidth (not offsetWidth) to account for scrollbar width
    mirror.style.width = textarea.clientWidth + 'px';

    // Text before charIndex fills the mirror; a zero-width span marks the target position
    mirror.textContent = textarea.value.substring(0, charIndex);

    const span = document.createElement('span');
    span.textContent = '​'; // zero-width space
    mirror.appendChild(span);

    document.body.appendChild(mirror);
    const y = span.offsetTop;
    document.body.removeChild(mirror);

    return y;
  }

  // ══════════════════════════════════════════════════════════════════
  //  syncCursor
  // ══════════════════════════════════════════════════════════════════

  /**
   * Synchronizes the textarea cursor and scroll position to a target location
   * described by `context`. Used when switching from Read view → Edit mode so
   * the editor opens at the same content the user was reading.
   *
   * ── Algorithm Overview (3 stages) ──────────────────────────────
   *
   * Stage 1 — Precise Selection Match
   *   Tries to find the exact character position for context.selectionText.
   *
   *   1a. Exact Match
   *       Jumps to (line, offset) and compares the text there directly.
   *       If it matches → done. O(1).
   *
   *   1b. Fuzzy Match — "Sandwich Strategy"
   *       Runs when exact match fails (e.g. the rendered HTML line numbers
   *       differ from raw markdown line numbers by a variable offset).
   *
   *       Steps:
   *       i.  Tokenize selectionText into significant words.
   *           - Strips punctuation delimiters but KEEPS digits (even single-char)
   *             so "SESSION 3" is never confused with "SESSION 2".
   *           - Keeps decimal numbers intact ("$0.001279" stays whole).
   *       ii. Build a regex pattern from the first 5 words (head anchor)
   *           and optionally the last 5 words (tail anchor for long selections).
   *           Pattern allows up to 100 non-newline chars between each word.
   *       iii.Among all regex matches, pick the one NEAREST to context.line
   *           (minimum line-distance). This ensures the correct instance wins
   *           when the same phrase appears multiple times in the document.
   *       iv. Fallback 1 — Triple-Word Anchor: if step ii found nothing,
   *           try every consecutive triple of words.
   *       v.  Fallback 2 — Best Single Word (≥4 chars): last resort literal search.
   *       vi. Prefix Recovery: after a fuzzy match, scan backward from the
   *           match start to include any short leading words the tokenizer
   *           skipped (e.g. a single-char emoji prefix stripped by filters).
   *       vii.End Extension: extend the match end to cover the last significant
   *           word, preventing right-truncation on long selections.
   *       viii.Sanity check: reject any match more than 150 lines from the hint.
   *
   *   Self-Correction (Delta Cache):
   *       After a fuzzy match, if the found line differs from context.line,
   *       the delta is stored in syncCursor._deltaCache[fileKey]. On the next
   *       call for the same file, this delta pre-adjusts the predicted position
   *       so exact match succeeds more often.
   *
   * Stage 2 — Simple Line Fallback
   *   If stage 1 found nothing (selectionText too short, or sanity check failed),
   *   falls back to placing the cursor at the start of context.line.
   *
   * Stage 3 — Scroll & Selection
   *   Uses _calculatePixelYWithMirror to compute the pixel Y of targetChar,
   *   then scrolls the textarea to center that position in the viewport.
   *   - If context.isRealSelection=true  → highlights [targetChar, targetChar+matchLen]
   *   - If context.isRealSelection=false → positions cursor only, no highlight
   *   - If no targetChar and context.scrollPct exists → proportional scroll fallback
   *
   * ── IMPORTANT: Known Line Offset ───────────────────────────────
   *   The rendered HTML assigns data-line numbers based on the markdown token
   *   stream, which can differ from raw line numbers in the textarea (e.g. YAML
   *   frontmatter, collapsed blank lines). This causes a systematic offset of
   *   ~10–20 lines that grows toward the end of long files.
   *   The Fuzzy Match handles this correctly because it ignores line numbers
   *   and relies on text content. The Delta Cache compensates for repeat calls.
   *
   * ── IMPORTANT: First-Call Timing ───────────────────────────────
   *   syncCursor is called twice on mode switch: once immediately (textarea may
   *   still be empty → 1 line) and once after content loads (full line count).
   *   The first call fails gracefully; the second call is authoritative.
   *
   * @param {HTMLTextAreaElement} textarea - The editor textarea
   * @param {Object}  context
   * @param {number}  context.line           - 1-based hint line number
   * @param {number}  [context.offset=0]     - Char offset within the line
   * @param {string}  [context.selectionText]- Text to search for (drives fuzzy match)
   * @param {boolean} [context.isRealSelection=false] - If true, highlight the match
   * @param {number}  [context.scrollPct]    - 0–1 fallback scroll ratio
   * @param {string}  [context._fileKey]     - Key for delta cache (use file path)
   */
  function syncCursor(textarea, context = {}) {
    if (!textarea) return;

    textarea.focus();
    const text = textarea.value;
    let targetChar = -1;
    let targetCharMatchLen = 0;

    // ── Stage 1: Precise Selection Match ──────────────────────────
    if (context.line && context.selectionText && context.selectionText.length > 2) {
      const lines = text.split('\n');

      // Apply accumulated delta from previous Self-Correction to pre-adjust prediction
      const fileKey = context._fileKey || 'default';
      const knownDelta = (syncCursor._deltaCache && syncCursor._deltaCache[fileKey]) || 0;
      const adjustedLine = Math.max(1, context.line - knownDelta);

      let startOfLine = 0;
      const maxLine = Math.min(adjustedLine - 1, lines.length);
      for (let i = 0; i < maxLine; i++) {
        startOfLine += (lines[i] ? lines[i].length : 0) + 1;
      }

      const predictedPos = startOfLine + (context.offset || 0);
      const sample = text.substring(predictedPos, predictedPos + context.selectionText.length);

      if (sample === context.selectionText) {
        // ── 1a. Exact Match ──
        targetChar = predictedPos;
        targetCharMatchLen = context.selectionText.length;
        context._matchLen = targetCharMatchLen;

      } else {
        // ── 1b. Fuzzy Match (Sandwich Strategy) ──

        // Normalize smart/curly quotes so they don't attach to adjacent words
        const normalizedSelection = context.selectionText.replace(/[""''«»]/g, ' ');

        // Tokenize: keep single-char tokens only if they are digits
        // (e.g. "SESSION 3" → ["SESSION","3"], NOT ["SESSION"])
        // Do NOT split on "." to preserve decimal numbers like "$0.001279"
        const allWords = normalizedSelection.trim()
          .split(/[\s,\-()""''«»\[\]{}:;!?\/\\]+/)
          .filter(w => w.length > 1 || /^\d+$/.test(w));

        if (allWords.length > 0) {
          const headWords = allWords.slice(0, 5);
          const tailWords = allWords.length > 10 ? allWords.slice(-5) : [];

          // Pattern allows up to 100 non-newline chars between each anchor word
          const buildPattern = (words) => words
            .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('[^\\n]{0,100}?');

          let fuzzyPattern = buildPattern(headWords);
          if (tailWords.length > 0) {
            fuzzyPattern += '.*?' + buildPattern(tailWords);
          }

          // Among all regex matches, pick the closest to context.line
          const findBestMatch = (pattern, isLiteral = false) => {
            try {
              const regex = new RegExp(pattern, (isLiteral ? 'g' : 'gi') + 'u');
              let match;
              let best = null;
              let minDistance = Infinity;

              while ((match = regex.exec(text)) !== null) {
                const matchIdx = match.index;
                const matchLine = text.substring(0, matchIdx).split('\n').length;
                const distance = Math.abs(matchLine - context.line);
                if (distance < minDistance) {
                  minDistance = distance;
                  best = { index: matchIdx, length: match[0].length, line: matchLine, distance };
                }
              }
              return best;
            } catch (_e) { return null; }
          };

          // Try 1: Sequence Fuzzy Match (primary path)
          let matchResult = findBestMatch(fuzzyPattern);

          // Try 2: Triple-Word Anchor (when sequence match fails)
          if (!matchResult && allWords.length >= 3) {
            for (let i = 0; i <= allWords.length - 3; i++) {
              const triple = allWords.slice(i, i + 3);
              const anchorPattern = buildPattern(triple);
              const result = findBestMatch(anchorPattern);
              if (result && result.distance < 100) {
                matchResult = result;
                break;
              }
            }
          }

          // Try 3: Best Single Word (last resort — word must be ≥4 chars)
          if (!matchResult && allWords.length > 0) {
            const bestWord = allWords.sort((a, b) => b.length - a.length)[0];
            if (bestWord.length >= 4) {
              matchResult = findBestMatch(bestWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), true);
            }
          }

          if (matchResult) {
            // Sanity check: reject matches more than 150 lines from the hint
            if (matchResult.distance > 150) {
              targetChar = -1;
            } else {
              targetChar = matchResult.index;
              targetCharMatchLen = matchResult.length;

              // Prefix Recovery: the first token in allWords may not be the true
              // start of the selection (e.g. a short leading word was filtered out).
              // Scan backward on the same line to recover leading chars.
              const trimmedNorm = normalizedSelection.trim();
              const firstWord = allWords[0];
              const prefixLen = trimmedNorm.indexOf(firstWord);
              if (prefixLen > 0 && targetChar >= prefixLen) {
                const candidateStart = targetChar - prefixLen;
                const lineAtCandidate = text.substring(0, candidateStart).split('\n').length;
                const lineAtMatch = text.substring(0, targetChar).split('\n').length;
                if (lineAtCandidate === lineAtMatch) {
                  targetChar = candidateStart;
                  targetCharMatchLen += prefixLen;
                }
              }

              // End Extension: extend rightward to include the last significant word,
              // preventing the match from being right-truncated on long selections.
              const endAnchorWord = allWords.filter(w => w.length > 3).slice(-1)[0];
              if (endAnchorWord) {
                const searchFrom = targetChar + Math.max(1, targetCharMatchLen - endAnchorWord.length - 5);
                const searchCap  = targetChar + trimmedNorm.length + 100;
                const endWordPos = text.indexOf(endAnchorWord, searchFrom);
                if (endWordPos !== -1 && endWordPos < searchCap) {
                  const trueEnd = endWordPos + endAnchorWord.length;
                  if (trueEnd > targetChar + targetCharMatchLen) {
                    targetCharMatchLen = trueEnd - targetChar;
                  }
                }
              }
            }
          }

          if (targetChar !== -1) {
            context._matchLen = targetCharMatchLen;

            // Self-Correction: record the delta between hint line and found line
            // so the next call pre-adjusts and hits the exact match path.
            const foundLine = text.substring(0, targetChar).split('\n').length;
            if (foundLine !== context.line) {
              const delta = context.line - foundLine;
              const fileKey2 = context._fileKey || 'default';
              if (!syncCursor._deltaCache) syncCursor._deltaCache = {};
              syncCursor._deltaCache[fileKey2] = delta;
              context.line = foundLine;
            }
          }
        }
      }
    }

    // ── Stage 2: Simple Line Fallback ─────────────────────────────
    // Activates when selectionText is absent/too short or the sanity check failed.
    if (targetChar === -1 && context.line) {
      const lines = text.split('\n');
      let absPos = 0;
      const targetLineIdx = Math.min(context.line - 1, lines.length - 1);
      for (let i = 0; i < targetLineIdx; i++) {
        absPos += lines[i].length + 1;
      }
      targetChar = absPos + (context.offset || 0);
    }

    // ── Stage 3: Scroll & Selection ───────────────────────────────
    requestAnimationFrame(() => {
      if (targetChar !== -1) {
        const pixelY = _calculatePixelYWithMirror(textarea, targetChar);
        const viewportHeight = textarea.clientHeight;
        const finalScroll = pixelY - (viewportHeight / 2);

        // Suppress scroll listener to avoid polluting saved scroll position
        window._suppressScrollSync = true;
        textarea.scrollTop = finalScroll;
        requestAnimationFrame(() => { window._suppressScrollSync = false; });

        if (context.isRealSelection) {
          // Highlight the matched text (only when user actively selected in Read view)
          const selectionLength = (context._matchLen !== undefined)
            ? context._matchLen
            : (context.selectionText ? context.selectionText.length : (context.length || 0));
          textarea.setSelectionRange(targetChar, targetChar + selectionLength);
        } else {
          // Position cursor only — no visual selection highlight
          textarea.setSelectionRange(targetChar, targetChar);
        }
      } else if (context.scrollPct) {
        // Last resort: proportional scroll
        textarea.scrollTop = context.scrollPct * (textarea.scrollHeight - textarea.clientHeight);
      }
    });
  }

  return {
    applyAction,
    syncCursor
  };
})();
window.MarkdownLogicService = MarkdownLogicService;

```
</file>

<file path="renderer/js/services/publish-service.js">
```js
/**
 * PublishService
 * Purpose: Coordinate document publishing to external hosts like Handoff.host
 * Dependencies: AppState, SettingsService, electronAPI
 */
const PublishService = (() => {
  'use strict';

  // ============================================
  // Private Functions
  // ============================================

  /**
   * Scans HTML for local image references and resolves them to absolute paths
   */
  async function _gatherAssets(html) {
    const assets = {};
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const imgs = tempDiv.querySelectorAll('img');
    for (const img of imgs) {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        // Resolve path via electronAPI (which handles relative to watch dir)
        const absolutePath = await window.electronAPI.getAbsolutePath(src);
        if (absolutePath) {
          assets[src] = {
            path: absolutePath,
            type: 'inline'
          };
        }
      }
    }
    
    return assets;
  }

  /**
   * Bundles all active design system CSS into a single style block
   * @deprecated Used for Handoff.host legacy bundling
   */
  function _bundleStyles() {
    let bundledCss = '';
    
    // We iterate through all stylesheets that are from our local domain
    for (const sheet of document.styleSheets) {
      try {
        // Only include our own design-system or component styles
        if (!sheet.href || sheet.href.includes('renderer/css/')) {
          for (const rule of sheet.cssRules) {
            bundledCss += rule.cssText + '\n';
          }
        }
      } catch (_e) {
        // Cross-origin sheets might throw security errors, ignore them
      }
    }
    
    return bundledCss;
  }

  /**
   * Wraps the rendered content in a standalone HTML template with styles
   */
  function _createStandaloneBundle(html, title) {
    const styles = _bundleStyles();
    const fileName = title || 'MDpreview Document';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --ds-bg-main: #131313;
            --ds-accent: #ffbf48;
            --ds-accent-rgb: 255, 191, 72;
            --ds-text-primary: rgba(255, 255, 255, 0.90);
            --ds-text-secondary: rgba(255, 255, 255, 0.60);
            --ds-text-inverse: #ffffff;
            --ds-white-a02: rgba(255, 255, 255, 0.02);
            --ds-white-a04: rgba(255, 255, 255, 0.04);
            --ds-white-a05: rgba(255, 255, 255, 0.05);
            --ds-white-a08: rgba(255, 255, 255, 0.08);
            --ds-white-a10: rgba(255, 255, 255, 0.10);
            --ds-white-a20: rgba(255, 255, 255, 0.20);
            --ds-black-a30: rgba(0, 0, 0, 0.30);
            --ds-border-default: rgba(255, 255, 255, 0.10);
            --ds-radius-panel: 12px;
            --ds-radius-sm: 6px;
            --ds-transition-smooth: 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        body {
            margin: 0;
            padding: 0;
            background: var(--ds-bg-main);
            color: var(--ds-text-secondary);
            font-family: 'Inter', sans-serif;
            line-height: 1.8;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }

        .md-publish-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 60px 24px;
        }

        .md-render-body { font-size: 15px; }

        ${styles}

        /* ── Parity Overrides ── */
        .md-viewer-viewport { background: transparent !important; height: auto !important; }
        .md-content-inner { padding: 0 !important; }
        .md-block { margin-bottom: 0.5rem; }
        .md-line { width: 100%; }

        .md-render-body hr {
            border: none;
            border-bottom: 1px solid var(--ds-border-default);
            margin: 3rem 0;
        }

        .premium-code-block, .md-table-wrapper, .mermaid {
            background: transparent !important;
            backdrop-filter: blur(40px) !important;
            -webkit-backdrop-filter: blur(40px) !important;
            border: 1px solid var(--ds-white-a08) !important;
            border-radius: var(--ds-radius-panel) !important;
            margin: 2rem 0 !important;
            overflow: hidden !important;
        }

        .md-table-wrapper { background: transparent !important; }

        .mermaid path, .mermaid rect, .mermaid circle, .mermaid polygon {
            stroke: var(--ds-white-a20) !important;
        }

        .mermaid text, .mermaid span, .mermaid .label {
            fill: #fff !important;
            color: #fff !important;
        }

        .code-block-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 16px;
            background: var(--ds-black-a30);
            border-bottom: 1px solid var(--ds-white-a10);
        }

        .code-block-lang {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--ds-text-secondary);
            font-family: 'Roboto Mono', monospace;
        }
    </style>
</head>
<body class="ds-theme-dark">
    <div class="md-publish-container">
        <div id="md-content" class="md-content md-render-body">
            <div class="md-content-inner">
                ${html}
            </div>
        </div>
    </div>
    <footer style="text-align: center; padding: 60px; color: #666; font-size: 12px; font-family: sans-serif;">
        Generated with <a href="https://github.com/Mchis167/MDpreview" style="color: #888; text-decoration: none;">MDpreview</a>
    </footer>
</body>
</html>`;
  }

  // ============================================
  // Public API
  // ============================================
  return {
    /**
     * Returns publication info for a specific file
     */
    getPublishInfo: function(filePath) {
      if (!filePath || !window.AppState.settings.publishData) return null;
      return window.AppState.settings.publishData[filePath] || null;
    },

    /**
     * Check if a slug is already taken on the worker
     * @param {string} slug 
     * @returns {Promise<boolean>} true if available
     */
    async checkSlugAvailability(slug) {
      const workerUrl = window.AppState.settings.publishWorkerUrl;
      if (!workerUrl) return true;

      try {
        // Clean the base URL (remove /publish if present)
        const baseUrl = workerUrl.replace(/\/publish\/?$/, '');
        const res = await fetch(`${baseUrl}/check-slug?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) return true;
        const data = await res.json();
        return !data.exists;
      } catch (_e) {
        return true; 
      }
    },

    /**
     * Saves publication info for a specific file
     */
    savePublishInfo: function(filePath, info) {
      if (!filePath) return;
      const data = window.AppState.settings.publishData || {};
      data[filePath] = {
        ...info,
        updatedAt: new Date().toISOString()
      };
      window.SettingsService.update('publishData', data);
    },

    /**
     * List all slugs currently on the worker
     */
    async listAllPublished() {
      const workerUrl = window.AppState.settings.publishWorkerUrl;
      const adminSecret = window.AppState.settings.publishAdminSecret;
      if (!workerUrl || !adminSecret) return [];

      try {
        const baseUrl = workerUrl.replace(/\/publish\/?$/, '');
        const res = await fetch(`${baseUrl}/list`, {
          headers: { 'X-Admin-Secret': adminSecret }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.slugs || [];
      } catch (_e) {
        return [];
      }
    },

    /**
     * Rename a slug on the worker and update local state
     */
    async renameSlug(oldSlug, newSlug) {
      const workerUrl = window.AppState.settings.publishWorkerUrl;
      const adminSecret = window.AppState.settings.publishAdminSecret;
      if (!workerUrl || !adminSecret || !oldSlug || !newSlug) return false;

      try {
        const baseUrl = workerUrl.replace(/\/publish\/?$/, '');
        const res = await fetch(`${baseUrl}/rename`, {
          method: 'POST',
          headers: { 
            'X-Admin-Secret': adminSecret,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ oldSlug, newSlug })
        });
        
        if (res.ok) {
          // Update local state if any file is linked to this slug
          const data = window.AppState.settings.publishData || {};
          let changed = false;
          Object.keys(data).forEach(filePath => {
            if (data[filePath].slug === oldSlug) {
              data[filePath].slug = newSlug;
              changed = true;
            }
          });
          if (changed) {
            window.SettingsService.update('publishData', data);
          }
          return true;
        }
        return false;
      } catch (_e) {
        return false;
      }
    },

    /**
     * Force delete a slug from the worker (without local state management)
     */
    async deleteSlug(slug) {
      const workerUrl = window.AppState.settings.publishWorkerUrl;
      const adminSecret = window.AppState.settings.publishAdminSecret;
      if (!workerUrl || !adminSecret || !slug) return false;

      try {
        const baseUrl = workerUrl.replace(/\/publish\/?$/, '');
        const res = await fetch(`${baseUrl}/publish/${slug}`, {
          method: 'DELETE',
          headers: { 'X-Admin-Secret': adminSecret }
        });
        return res.ok;
      } catch (_e) {
        return false;
      }
    },

    /**
     * Removes publication info for a specific file and deletes from Worker if applicable
     */
    unpublish: async function(filePath) {
      if (!filePath) return;
      
      const info = this.getPublishInfo(filePath);
      const workerUrl = window.AppState.settings.publishWorkerUrl;
      const adminSecret = window.AppState.settings.publishAdminSecret;

      if (info && info.slug && workerUrl && adminSecret) {
        try {
          // Clean the base URL (remove /publish if present)
          const baseUrl = workerUrl.replace(/\/publish\/?$/, '');
          const res = await fetch(`${baseUrl}/publish/${info.slug}`, {
            method: 'DELETE',
            headers: {
              'X-Admin-Secret': adminSecret
            }
          });
          
          if (!res.ok) {
            const err = await res.json();
            console.warn('Worker unpublish failed:', err.error);
          }
        } catch (e) {
          console.error('Failed to call worker unpublish:', e);
        }
      }

      const data = window.AppState.settings.publishData || {};
      delete data[filePath];
      window.SettingsService.update('publishData', data);
      
      if (window.showToast) window.showToast('Document unpublished and removed from edge', 'info');
    },

    /**
     * Publishes the current document
     * Supports both Legacy Handoff and New Worker Flow
     * @param {Object} options - { slug, password }
     */
    publish: async function(options = {}) {
      const { currentFile, settings } = window.AppState;
      if (!currentFile) return null;
      
      const workerUrl = settings.publishWorkerUrl;
      const adminSecret = settings.publishAdminSecret;
      const handoffToken = settings.handoffToken;

      // Determine mode: Worker has priority if configured
      const useWorker = !!(workerUrl && adminSecret);
      
      if (!useWorker && !handoffToken) {
        if (window.showToast) {
          window.showToast('Please configure Publish settings first', 'error');
        }
        return null;
      }

      // Get content from viewer
      const viewer = window.MarkdownViewer.getInstance();
      if (!viewer) return null;
      
      const fileName = currentFile.split('/').pop().replace(/\.[^/.]+$/, "");
      const slug = options.slug || fileName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
      const password = options.password || '';

      if (window.showToast) {
        window.showToast(useWorker ? 'Publishing to Worker...' : 'Preparing Handoff bundle...', 'info', { sticky: true, id: 'publish' });
      }

      try {
        if (useWorker) {
          // --- NEW WORKER FLOW ---
          // 1. Get current content
          let content = '';
          if (currentFile.startsWith('__DRAFT_')) {
            if (typeof window.DraftModule !== 'undefined') {
              content = window.DraftModule.getDraftContent(currentFile);
            }
          } else {
            const res = await window.electronAPI.readFile(currentFile);
            if (res.success) {
              content = res.content;
            } else {
              if (window.showToast) window.showToast('Failed to read file content', 'error');
              return null;
            }
          }

          if (!content) {
            if (window.showToast) window.showToast('Document is empty', 'error');
            return null;
          }
          
          const payload = {
            slug,
            content: content,
            password,
            title: fileName,
            filePath: currentFile,
            assets: await _gatherAssets(viewer.state.html)
          };

          const result = await window.electronAPI.publishToWorker({
            payload,
            workerUrl,
            secret: adminSecret
          });

          if (result.success) {
            const baseUrl = workerUrl.replace(/\/$/, '').replace('/publish', '');
            const fullUrl = `${baseUrl}/${result.slug}`;
            
            this.savePublishInfo(currentFile, {
              url: fullUrl,
              slug: result.slug,
              type: 'worker'
            });

            if (window.showToast) window.showToast('Published to Worker successfully!', 'success', { id: 'publish' });
            return fullUrl;
          } else {
            throw new Error(result.error);
          }
        } else {
          // --- LEGACY HANDOFF FLOW ---
          const { html } = viewer.state;
          const assets = await _gatherAssets(html);
          const assetPaths = Object.values(assets).map(a => a.path);
          const bundle = _createStandaloneBundle(html, fileName);
          
          const result = await window.electronAPI.publishToHandoff({
            html: bundle,
            slug,
            assets: assetPaths,
            token: handoffToken,
            password,
            note: `Published from MDpreview v${window.AppState.version || '1.0.0'}`
          });

          if (result.success) {
            const fullUrl = `https://handoff.host${result.url}`;
            this.savePublishInfo(currentFile, {
              url: fullUrl,
              slug: slug,
              version: result.version,
              type: 'handoff'
            });
            if (window.showToast) window.showToast('Published to Handoff successfully!', 'success', { id: 'publish' });
            return fullUrl;
          } else {
            throw new Error(result.error);
          }
        }
      } catch (error) {
        if (window.showToast) {
          window.showToast(`Publish failed: ${error.message}`, 'error', { id: 'publish' });
        }
        return null;
      }
    }
  };
})();

// Explicit export
window.PublishService = PublishService;

```
</file>

<file path="renderer/js/services/recently-viewed-service.js">
```js
/**
 * RecentlyViewedService.js — Logic for managing recently viewed files.
 * 
 * Target: Session persistence and quick access.
 * Standard: Atomic Design V2 (Service).
 */
const RecentlyViewedModule = (() => {
  const MAX_RECENT = 10;
  const STORAGE_KEY = 'mdpreview_recent_';
  let treeComp = null;

  function add(filePath) {
    if (filePath && filePath.startsWith('__DRAFT_')) return; // Ignore draft in recent
    const ws = AppState.currentWorkspace;
    if (!ws || !filePath) return;
    const key = STORAGE_KEY + ws.id;
    let recent = _getRaw(key);
    recent = recent.filter(p => p !== filePath);
    recent.unshift(filePath);
    recent = recent.slice(0, MAX_RECENT);
    localStorage.setItem(key, JSON.stringify(recent));
    if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();
    render();
  }

  function remove(filePath) {
    const ws = AppState.currentWorkspace;
    if (!ws || !filePath) return;
    const key = STORAGE_KEY + ws.id;
    let recent = _getRaw(key);
    recent = recent.filter(p => p !== filePath);
    localStorage.setItem(key, JSON.stringify(recent));
    if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();
    render();
  }

  function swap(oldPath, newPath) {
    const ws = AppState.currentWorkspace;
    if (!ws) return;
    const key = STORAGE_KEY + ws.id;
    let recent = _getRaw(key);
    const idx = recent.indexOf(oldPath);
    if (idx !== -1) {
      recent[idx] = newPath;
      localStorage.setItem(key, JSON.stringify(recent));
      if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();
      render();
    }
  }

  function _getRaw(key) {
    const data = localStorage.getItem(key);
    try { return data ? JSON.parse(data) : []; } catch (_e) { return []; }
  }

  function render() {
    const ws = AppState.currentWorkspace;
    if (!ws) return;
    const list = document.getElementById('recently-viewed-list');
    const section = document.getElementById('recently-viewed-section');
    if (!list || !section) return;

    let recentPaths = _getRaw(STORAGE_KEY + ws.id);
    
    // Filter out current active file and limit display to 5 items
    const activeFile = (typeof AppState !== 'undefined') ? AppState.currentFile : null;
    recentPaths = recentPaths.filter(path => path !== activeFile).slice(0, 5);

    if (recentPaths.length === 0) { 
      section.style.display = 'none'; 
      const divider = section.nextElementSibling;
      if (divider && divider.classList.contains('sidebar-divider')) {
        divider.style.display = 'none';
      }
      return; 
    }
    
    section.style.display = 'block';
    const divider = section.nextElementSibling;
    if (divider && divider.classList.contains('sidebar-divider')) {
      divider.style.display = 'block';
    }

    const hiddenPaths = new Set(AppState.settings.hiddenPaths || []);
    const nodes = recentPaths.map(path => ({
      path,
      name: path.split('/').pop(),
      type: 'file',
      isHidden: hiddenPaths.has(path)
    }));

    if (!treeComp) {
      treeComp = new TreeViewComponent({
        mount: list,
        deleteIcon: 'x',
        deleteTitle: 'Remove from history',
        onClick: async (e, node) => {
          e.stopPropagation();
          try { await loadFile(node.path); } catch (_err) { remove(node.path); }
        },
        onDelete: (e, node) => {
          e.stopPropagation();
          remove(node.path);
        },
        onMouseDown: () => { },
        onMouseLeave: () => { },
        onContextMenu: (e, node, itemEl) => {
          if (typeof TreeModule !== 'undefined') TreeModule.handleContextMenu(e, node, itemEl);
        },
        showSpacer: true,
        spacerHeight: '8px'
      });
    }

    treeComp.update(nodes, [], '', '', AppState.currentFile);
  }

  function setActiveFile(_filePath) {
    render();
  }

  function init() {
    const mount = document.getElementById('recently-viewed-header-mount');
    
    if (mount) {
      const header = new SidebarSectionHeader({
        title: 'RECENTLY VIEWED',
        collapsible: {
          sectionId: 'recently-viewed-section',
          storageKey: 'mdpreview_recent_collapsed',
          appStateKey: 'recentCollapsed'
        }
      });
      mount.innerHTML = '';
      mount.appendChild(header.render());
    }
  }

  function getRecentFiles() {
    const ws = AppState.currentWorkspace;
    if (!ws) return [];
    return _getRaw(STORAGE_KEY + ws.id);
  }

  return { add, remove, swap, render, setActiveFile, init, getRecentFiles };
})();

window.RecentlyViewedModule = RecentlyViewedModule;

```
</file>

<file path="renderer/js/services/search-service.js">
```js
/**
 * SearchService — Intelligent fuzzy search and scoring engine.
 * Purpose: Provide fast, relevant file search results with fuzzy matching.
 * Dependencies: None
 */
const SearchService = (() => {
  'use strict';

  /**
   * Scores a query against a target string.
   * @param {string} query 
   * @param {string} target 
   * @returns {Object|null} { score, matchedIndices }
   */
  function _score(query, target) {
    if (!query) return { score: 0, matchedIndices: [] };

    const q = query.toLowerCase();
    const t = target.toLowerCase();

    // 1. Exact match (highest)
    if (q === t) {
      return { score: 1000, matchedIndices: Array.from({ length: target.length }, (_, i) => i) };
    }

    // 2. Prefix match
    if (t.startsWith(q)) {
      return { score: 800, matchedIndices: Array.from({ length: q.length }, (_, i) => i) };
    }

    // 3. Substring match
    if (t.includes(q)) {
      const start = t.indexOf(q);
      return { score: 600, matchedIndices: Array.from({ length: q.length }, (_, i) => start + i) };
    }

    // 4. Fuzzy logic (character by character with gap penalties)
    let score = 0;
    let tIdx = 0;
    let qIdx = 0;
    const matchedIndices = [];

    while (qIdx < q.length && tIdx < t.length) {
      if (q[qIdx] === t[tIdx]) {
        matchedIndices.push(tIdx);
        // Bonus for consecutive matches
        if (matchedIndices.length > 1 && matchedIndices[matchedIndices.length - 2] === tIdx - 1) {
          score += 50;
        } else {
          score += 20;
        }
        // Bonus for matches at start of words or after separators
        if (tIdx === 0 || t[tIdx - 1] === '-' || t[tIdx - 1] === '_' || t[tIdx - 1] === ' ' || t[tIdx - 1] === '/') {
          score += 30;
        }
        qIdx++;
      } else {
        score -= 2; // Penalty for gaps
      }
      tIdx++;
    }

    // If all query characters were found in order
    if (qIdx === q.length) {
      // Scale score based on coverage
      score += (q.length / t.length) * 100;
      return { score, matchedIndices };
    }

    return null;
  }

  /**
   * Flatten tree data for searching
   * @param {Array} nodes 
   * @returns {Array} Flat list of file nodes
   */
  function _flatten(nodes, out = []) {
    nodes.forEach(node => {
      out.push(node);
      if (node.type === 'directory' && node.children) {
        _flatten(node.children, out);
      }
    });
    return out;
  }

  // ============================================
  // Public API
  // ============================================
  return {
    /**
     * Search across tree data
     * @param {string} query 
     * @param {Array} treeData 
     * @param {string} filterType 'all' | 'file' | 'directory'
     * @returns {Array} Sorted search results
     */
    search: function (query, treeData, filterType = 'all') {
      if (filterType === 'shortcut') {
        return this.searchShortcuts(query);
      }

      if (!query || !treeData) return [];

      const flatItems = _flatten(treeData);

      return flatItems
        .filter(node => {
          if (filterType === 'all') return true;
          return node.type === filterType;
        })
        .map(node => {
          // Check filename (higher weight)
          const nameMatch = _score(query, node.name);
          // Check path (lower weight)
          const pathMatch = _score(query, node.path);

          if (!nameMatch && !pathMatch) return null;

          // Calculate final score
          let finalScore = 0;
          let bestMatchedIndices = [];

          if (nameMatch) {
            finalScore += nameMatch.score * 2;
            bestMatchedIndices = nameMatch.matchedIndices;
          }

          if (pathMatch) {
            finalScore += pathMatch.score;
            // Only use path indices if name didn't match (for highlighting)
            if (!nameMatch) bestMatchedIndices = pathMatch.matchedIndices;
          }

          return {
            ...node,
            searchScore: finalScore,
            matchedIndices: bestMatchedIndices
          };
        })
        .filter(n => n !== null)
        .sort((a, b) => {
          if (b.searchScore !== a.searchScore) return b.searchScore - a.searchScore;
          // Priority: File > Directory
          if (a.type !== b.type) return a.type === 'file' ? -1 : 1;
          return 0;
        })
        .slice(0, 10); // Top 10 results for the palette
    },

    /**
     * Search specifically for shortcuts
     * @param {string} query
     * @returns {Array} List of matched shortcuts
     */
    searchShortcuts: function (query) {
      if (typeof window.ShortcutsComponent === 'undefined') return [];

      const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform) || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');
      const sections = window.ShortcutsComponent.getShortcutData(isMac);
      const allShortcuts = [];

      sections.forEach(sec => {
        sec.items.forEach(item => {
          allShortcuts.push({ ...item, group: sec.title, type: 'shortcut' });
        });
      });

      if (!query) return allShortcuts;

      return allShortcuts
        .map(item => {
          // 1. Check Label (Primary)
          const labelMatch = _score(query, item.label);
          
          // 2. Check Tags (Secondary)
          let bestTagMatch = null;
          if (item.tags) {
            item.tags.forEach(tag => {
              const tagMatch = _score(query, tag);
              if (tagMatch && (!bestTagMatch || tagMatch.score > bestTagMatch.score)) {
                bestTagMatch = tagMatch;
              }
            });
          }

          if (!labelMatch && !bestTagMatch) return null;

          // Scoring strategy: 
          // - Label match is heavily weighted (x2) to stay at the top.
          // - Tag match allows discovery when name is forgotten.
          let finalScore = 0;
          let matchedIndices = [];

          if (labelMatch) {
            finalScore = labelMatch.score * 2;
            matchedIndices = labelMatch.matchedIndices;
          } else if (bestTagMatch) {
            finalScore = bestTagMatch.score;
            // For tag matches, we don't highlight the label (as the query isn't in it)
            matchedIndices = [];
          }

          return {
            ...item,
            searchScore: finalScore,
            matchedIndices: matchedIndices
          };
        })
        .filter(n => n !== null)
        .sort((a, b) => b.searchScore - a.searchScore);
    }
  };
})();

// Explicit export to global scope
window.SearchService = SearchService;

```
</file>

<file path="renderer/js/services/settings-service.js">
```js
/* global AppState */
/**
 * SettingsService
 * Centralized logic for managing application settings, theme application,
 * and persistence (localStorage + Server).
 */
const SettingsService = (() => {
  'use strict';

  /**
   * Centralized Settings Configuration
   * Maps AppState keys to their storage keys and side-effect types.
   */
  const SETTINGS_CONFIG = {
    // Theme / Appearance
    accentColor: { storageKey: 'md-accent-color', type: 'theme' },
    textZoom: { storageKey: 'md-text-zoom', type: 'theme' },
    codeZoom: { storageKey: 'md-code-zoom', type: 'theme' },
    fontText: { storageKey: 'md-font-text', type: 'theme' },
    fontCode: { storageKey: 'md-font-code', type: 'theme' },
    bgEnabled: { storageKey: 'md-bg-enabled', type: 'theme' },
    bgImage: { storageKey: 'md-bg-image', type: 'theme' },
    
    // Explorer Preferences
    showHidden: { storageKey: 'md-show-hidden', type: 'explorer' },
    hideEmptyFolders: { storageKey: 'md-hide-empty', type: 'explorer' },
    flatView: { storageKey: 'md-flat-view', type: 'explorer' },
    hiddenPaths: { storageKey: 'md-hidden-paths', type: 'explorer' },
    showHiddenInSearch: { storageKey: 'md-show-hidden-search', type: 'explorer' },
    
    // Other Persistent States
    sortMethod: { storageKey: 'mdpreview_sort_method', type: 'explorer' },
    rightSidebarOpen: { storageKey: 'md-right-sidebar-open', type: 'none' },
    rightSidebarTab: { storageKey: 'md-right-sidebar-tab', type: 'none' },
    
    // API / Third Party
    handoffToken: { storageKey: 'md-handoff-token', type: 'none' },
    publishWorkerUrl: { storageKey: 'md-publish-worker-url', type: 'none' },
    publishAdminSecret: { storageKey: 'md-publish-admin-secret', type: 'none' },
    publishData: { storageKey: 'md-publish-data', type: 'none' }
  };

  /**
   * Helper: Convert Hex to RGB
   */
  function hexToRgb(hex) {
    if (!hex) return null;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Apply all current theme settings to the document root
   */
  function applyTheme() {
    const root = document.documentElement;
    const s = AppState.settings;
    if (!s) return;

    // 1. Zoom
    root.style.setProperty('--preview-zoom', s.textZoom || 100);
    root.style.setProperty('--code-zoom', s.codeZoom || 100);

    // 2. Accent Color
    root.style.setProperty('--accent-color', s.accentColor);
    const rgb = hexToRgb(s.accentColor);
    if (rgb) {
      root.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }

    // 3. Fonts
    root.style.setProperty('--font-text', s.fontText);
    root.style.setProperty('--font-code', s.fontCode);

    // 4. Select Arrow (Dynamic SVG)
    _updateSelectArrow(s.accentColor);

    // 5. Background Layer
    _updateBackgroundLayer(s.bgEnabled, s.bgImage);
  }

  /**
   * Unified Update Method
   * Updates state, persists to storage, triggers side effects, and syncs to server.
   */
  function update(key, value) {
    if (!AppState.settings || !(key in AppState.settings)) {
      console.warn(`SettingsService: Invalid setting key "${key}"`);
      return;
    }

    const config = SETTINGS_CONFIG[key] || {};
    
    // 1. Update AppState and Notify Listeners
    if (AppState.settings) {
      AppState.settings[key] = value;
    }
    // 2. Persist to LocalStorage
    if (config.storageKey) {
      const storageValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(config.storageKey, storageValue);
    }

    // 3. Trigger Side Effects
    if (config.type === 'theme') {
      applyTheme();
    } else if (config.type === 'explorer') {
      if (typeof TreeModule !== 'undefined') TreeModule.load();
    }

    // 4. Sync to Server
    if (AppState.savePersistentState) {
      AppState.savePersistentState();
    }
  }

  /**
   * Private: Update the dynamic SVG arrow for select elements
   */
  function _updateSelectArrow(color) {
    const arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
    document.documentElement.style.setProperty('--select-arrow', `url("data:image/svg+xml,${encodeURIComponent(arrowSvg)}")`);
  }

  /**
   * Private: Update the application background layer
   */
  function _updateBackgroundLayer(enabled, image) {
    const bgLayer = document.getElementById('app-background');
    if (!bgLayer) return;

    if (enabled && image) {
      bgLayer.style.backgroundImage = `url(${image})`;
      bgLayer.style.display = 'block';
    } else {
      bgLayer.style.display = 'none';
    }
  }

  // ── Public API ──────────────────────────────────────────

  return {
    applyTheme,
    update,

    // Helper for AppState initialization
    getStorageKey(key) {
      return SETTINGS_CONFIG[key] ? SETTINGS_CONFIG[key].storageKey : null;
    },

    // Background Image Management
    getCustomBackgrounds() {
      try {
        return JSON.parse(localStorage.getItem('mdpreview_custom_bg_images') || '[]');
      } catch (_e) { return []; }
    },

    addCustomBackground(base64) {
      const bgs = this.getCustomBackgrounds();
      if (bgs.length >= 5) return false;
      bgs.push(base64);
      localStorage.setItem('mdpreview_custom_bg_images', JSON.stringify(bgs));
      return true;
    },

    hexToRgb
  };
})();

window.SettingsService = SettingsService;

```
</file>

<file path="renderer/js/services/shortcut-service.js">
```js
/**
 * ShortcutService — Centralized Keyboard Shortcut Management
 * Purpose: Provide a single source of truth for all shortcuts and their handlers.
 * Dependencies: AppState, DesignSystem
 */
const ShortcutService = (() => {
  'use strict';

  let _registry = [];
  const isMac = (
    (typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform)) || 
    (typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent)) ||
    (navigator.userAgentData && navigator.userAgentData.platform === 'macOS')
  );

  /**
   * Initialize Global Listener
   */
  function init() {
    // Use capture: true to intercept events before they reach inputs/textareas
    document.addEventListener('keydown', _handleKeyDown, true);
  }

  /**
   * Register shortcuts
   * @param {Array} groups Array of shortcut groups
   */
  function registerGroups(groups) {
    _registry = groups;
  }

  /**
   * Get all registered shortcuts
   */
  function getShortcutData() {
    return _registry;
  }

  /**
   * Execute an action by ID
   * @param {string} id 
   */
  function execute(id) {
    if (!id) return false;

    // Flatten registry to find item
    let targetItem = null;
    for (const group of _registry) {
      targetItem = group.items.find(item => item.id === id);
      if (targetItem) break;
    }

    if (targetItem && typeof targetItem.handler === 'function') {
      targetItem.handler();
      return true;
    }

    console.warn(`ShortcutService: No handler found for action ID "${id}"`);
    return false;
  }

  /**
   * Main Keyboard Event Handler
   */
  function _handleKeyDown(e) {
    const mod = isMac ? e.metaKey : e.ctrlKey;
    const key = e.key.toLowerCase();
    const isShift = e.shiftKey;
    const isAlt = e.altKey;

    // 1. Global Blocking Logic (Typed in inputs)
    const activeTag = document.activeElement?.tagName;
    const inInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable;

    // 2. Iterate through registry to find a match
    let matchedItem = null;
    
    // Find the first matching shortcut
    for (const group of _registry) {
      for (const item of group.items) {
        if (item.isInformative) continue;

        if (_matches(e, mod, key, isShift, isAlt, item.keys, item.requireMod)) {
          // Check if this shortcut is allowed in inputs
          if (inInput && !item.allowInInput) {
             if (!mod && !isAlt) continue;
             const allowedInInput = ['s', 'z', 'y', 'x', 'c', 'v', 'a', 'b', 'f', 'p', '/', '[', ',', '1', '2', '3', '4'];
             if (!allowedInInput.includes(key)) continue;
          }

          if (/^[1-4]$/.test(key) && !mod && inInput) continue;

          matchedItem = item;
          break;
        }
      }
      if (matchedItem) break;
    }

    if (matchedItem) {
      // 3. Special handling for text editing keys in inputs
      // If we are in an input and the key is a standard editing key (a, c, v, x, z, y),
      // and the shortcut is NOT specifically marked to allowInInput,
      // we should skip preventing default to let the browser handle it.
      if (inInput) {
        const editingKeys = ['a', 'c', 'v', 'x', 'z', 'y'];
        if (editingKeys.includes(key) && mod && !matchedItem.allowInInput) {
          return; // Bubble to browser
        }
      }

      e.preventDefault();
      
      try {
        if (typeof matchedItem.handler === 'function') {
          matchedItem.handler();
        } else if (matchedItem.id) {
          execute(matchedItem.id);
        }
      } catch (err) {
        console.error(`[ShortcutService] Error executing handler for ${matchedItem.id}:`, err);
      }
    }
  }

  /**
   * Helper to check if event matches a shortcut key combo
   */
  function _matches(e, mod, key, isShift, isAlt, targetKeys, requireMod = true) {
    if (!targetKeys || targetKeys.length === 0) return false;

    const hasMod = targetKeys.includes('Ctrl') || targetKeys.includes('Cmd') || targetKeys.includes('Mod');
    const hasShift = targetKeys.includes('Shift');
    const hasAlt = targetKeys.includes('Alt');
    
    // Check Modifiers
    // Special exception for Mode Switching: Allow Mod+1/2/3/4 OR Alt+1/2/3/4 to match ['1'], ['2'] etc.
    // This ensures mode switching works reliably even when typing, as Cmd+Number is often blocked by browsers.
    const isNumericModeKey = /^[1-4]$/.test(key) && !hasMod;
    const isModifierPressed = mod || isAlt;
    
    if (isNumericModeKey && isModifierPressed && requireMod) {
       // Allow it to proceed
    } else if (hasMod !== !!mod && requireMod) {
       return false;
    }

    if (hasShift !== !!isShift) return false;
    if (hasAlt !== !!isAlt) return false;

    // Check specific Key
    // Normalize target key (e.g. '↑' to 'arrowup')
    const keyMap = {
      '↑': 'arrowup',
      '↓': 'arrowdown',
      '←': 'arrowleft',
      '→': 'arrowright',
      '[': '[',
      ']': ']',
      '/': '/',
      ',': ',',
      'esc': 'escape',
      'enter': 'enter',
      'backspace': 'backspace',
      'delete': 'delete',
      'f11': 'f11',
      'f2': 'f2'
    };

    const targetKey = targetKeys[targetKeys.length - 1].toLowerCase();
    const normalizedTarget = keyMap[targetKey] || targetKey;

    return key === normalizedTarget;
  }

  return {
    init,
    registerGroups,
    getShortcutData,
    execute,
    isMac: () => isMac
  };
})();

window.ShortcutService = ShortcutService;

```
</file>

<file path="renderer/js/services/sync-service.js">
```js
/**
 * SyncService.js
 * 
 * Handles position synchronization between different application modes 
 * (Read, Edit, Comment, Collect).
 */
const SyncService = (() => {
  'use strict';

  /**
   * Captures a sync context snapshot from the Read View.
   * Logic migrated from ChangeActionViewBar to centralize syncing responsibility.
   */
  function captureReadViewSyncData() {
    const sel = window.getSelection();
    const mdContent = document.getElementById('md-content');
    const viewer = document.getElementById('md-viewer-mount');

    if (!mdContent || !viewer) return { scrollPct: 0 };

    // 1. Check for Selection first
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      if (mdContent.contains(range.commonAncestorContainer)) {
        const node = range.startContainer;
        let el = node.nodeType === 1 ? node : node.parentElement;
        
        while (el && el !== mdContent && !el.hasAttribute('data-line') && !el.hasAttribute('data-source-line')) {
          el = el.parentElement;
        }

        if (el) {
          const line = parseInt(el.getAttribute('data-line') || el.getAttribute('data-source-line'), 10);
          const selectionText = sel.toString();
          
          let offset = 0;
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
          let n;
          while (n = walker.nextNode()) {
            if (n === range.startContainer) {
              offset += range.startOffset;
              break;
            }
            offset += n.textContent.length;
          }

          return { line, offset, length: selectionText.length, selectionText, isRealSelection: true };
        }
      }
    }

    // 2. Fallback: Center Visible Line
    const viewerRect = viewer.getBoundingClientRect();
    const centerX = viewerRect.left + (viewerRect.width / 2);
    const centerY = viewerRect.top + (viewerRect.height / 2);
    
    let centerEl = document.elementFromPoint(centerX, centerY);
    while (centerEl && centerEl !== mdContent && !centerEl.hasAttribute('data-line') && !centerEl.hasAttribute('data-source-line')) {
      centerEl = centerEl.parentElement;
    }
    
    if (centerEl) {
      const line = parseInt(centerEl.getAttribute('data-line') || centerEl.getAttribute('data-source-line'), 10);
      
      const extractCleanText = (node) => {
        let text = "";
        node.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            text += child.textContent;
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const tagName = child.tagName.toUpperCase();
            const style = window.getComputedStyle(child);
            const isTechnicalTag = ['STYLE', 'DEFS', 'SCRIPT', 'METADATA', 'BUTTON', 'SVG'].includes(tagName);
            const isUI = isTechnicalTag || 
                         style.userSelect === 'none' ||
                         child.classList.contains('code-block-header') ||
                         child.hasAttribute('aria-hidden');
            
            if (!isUI) {
              text += extractCleanText(child);
            }
          }
        });
        return text;
      };

      const selectionText = extractCleanText(centerEl).trim().substring(0, 200);
      return { line, selectionText, isRealSelection: false };
    }

    // 3. Final Fallback: Proportional Scroll
    const scrollPct = viewer.scrollTop / (viewer.scrollHeight - viewer.clientHeight || 1);
    return { scrollPct, isRealSelection: false };
  }

  /**
   * Captures a sync context snapshot from the Edit View (textarea).
   */
  function captureEditorSyncData() {
    const textarea = document.getElementById('edit-textarea');
    if (!textarea) return {};

    const posStart = textarea.selectionStart;
    const posEnd = textarea.selectionEnd;
    const text = textarea.value;
    const lines = text.split('\n');

    const textBefore = text.substring(0, posStart);
    const lineIndex = textBefore.split('\n').length - 1;
    const line = lineIndex + 1;

    let selectionText = text.substring(posStart, posEnd);
    let isRealSelection = selectionText.trim().length > 0;

    if (!isRealSelection) {
      const currentLineText = lines[lineIndex] || '';
      const prevLineText = lines[lineIndex - 1] || '';
      const nextLineText = lines[lineIndex + 1] || '';
      const isNoisy = (str) => !str.trim() || str.trim().match(/^[#*`_\-+=~> ]+$/);

      if (isNoisy(currentLineText)) {
        selectionText = (!isNoisy(prevLineText) ? prevLineText : nextLineText).replace(/[#*`_~\[\]()>\-+]/g, ' ').trim();
      } else {
        selectionText = currentLineText.replace(/[#*`_~\[\]()>\-+]/g, ' ').trim();
      }
    }

    const scrollPct = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight || 1);
    return { line, selectionText, scrollPct, isRealSelection, offset: 0 };
  }

  /**
   * Scrolls the Edit View to match a given line/offset.
   */
  function scrollEditorToLine(lineNum, offset = 0, length = 0) {
    const textarea = document.getElementById('edit-textarea');
    if (!textarea || !lineNum) return;

    if (window.MarkdownLogicService) {
        const fileKey = window.AppState?.currentFile || 'default';
        window.MarkdownLogicService.syncCursor(textarea, { line: lineNum, offset, length, _fileKey: fileKey });
    }
  }

  /**
   * Scrolls the Read View to the element that best matches (line, selectionText).
   */
  function scrollReadViewToLine(line, selectionText = '', isRealSelection = false) {
    const viewer = document.getElementById('md-viewer-mount');
    const mdContent = document.getElementById('md-content');
    if (!viewer || !mdContent) return;

    let attempts = 0;
    const maxAttempts = 5;
    let lastTop = -1;
    let stableCount = 0;

    const tryScroll = () => {
      let target = null;

      if (selectionText && selectionText.trim().length > 3) {
        const cleanSearchText = selectionText.replace(/[#*`_~\[\]()>\-+]/g, ' ').trim();
        const words = cleanSearchText.split(/\s+/).filter(w => w.length > 2);

        if (words.length > 0) {
          const allElements = Array.from(mdContent.querySelectorAll('[data-line], [data-source-line]'));
          let bestMatch = null;
          let maxScore = 0;
          let bestDistance = Infinity;
          const searchRange = 60;

          allElements.forEach(el => {
            const elLine = parseInt(el.getAttribute('data-line') || el.getAttribute('data-source-line'), 10);
            if (Math.abs(elLine - line) > searchRange) return;

            const content = el.textContent;
            let score = 0;
            words.forEach(word => {
              if (content.includes(word)) score++;
            });

            const distance = Math.abs(elLine - line);
            if (score > maxScore || (score === maxScore && score > 0 && distance < bestDistance)) {
              maxScore = score;
              bestMatch = el;
              bestDistance = distance;
            }
          });

          if (bestMatch && maxScore >= Math.min(words.length, 1)) {
            target = bestMatch;
          }
        }
      }

      if (!target) {
        target = mdContent.querySelector(`[data-line="${line}"], [data-source-line="${line}"]`);
      }
      
      if (target) {
        const currentTop = target.getBoundingClientRect().top + window.scrollY;
        if (Math.abs(currentTop - lastTop) < 1) stableCount++;
        else stableCount = 0;
        lastTop = currentTop;

        if (stableCount >= 3 || attempts >= maxAttempts - 1) {
          window._suppressScrollSync = true;
          target.scrollIntoView({ behavior: 'auto', block: 'center' });
          requestAnimationFrame(() => { window._suppressScrollSync = false; });

          if (viewer._scrollObserver) {
            viewer._scrollObserver.disconnect();
            viewer._scrollObserver = null;
          }

          if (isRealSelection && selectionText) {
            try {
              const selection = window.getSelection();
              selection.removeAllRanges();
              const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null, false);
              let found = false;
              let node;
              while ((node = walker.nextNode()) && !found) {
                const idx = node.textContent.indexOf(selectionText);
                if (idx !== -1) {
                  const range = document.createRange();
                  range.setStart(node, idx);
                  range.setEnd(node, idx + selectionText.length);
                  selection.addRange(range);
                  found = true;
                }
              }
              if (!found) {
                const range = document.createRange();
                range.selectNodeContents(target);
                selection.addRange(range);
              }
            } catch(_e) {}
          }
          return;
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        requestAnimationFrame(tryScroll);
      }
    };

    requestAnimationFrame(tryScroll);
  }

  return {
    captureReadViewSyncData,
    captureEditorSyncData,
    scrollEditorToLine,
    scrollReadViewToLine
  };
})();

window.SyncService = SyncService;

```
</file>

<file path="renderer/js/services/tree-drag-manager.js">
```js
/**
 * TreeDragManager.js — Extracted Drag & Drop Engine for Sidebar Tree.
 * 
 * Target: High-fidelity file reordering and movement.
 * Standard: Atomic Design V2 (Business Logic Service).
 */
const TreeDragManager = (() => {
  let isDragging = false;
  let autoExpandTimer = null;
  let lastHoveredHeader = null;

  let dragProxy = null;
  window.DRAG_DEBUG = false;
  let dragStartY = 0;
  let dragStartX = 0;
  let dragStartRect = null;
  let dragItemHeight = 0;
  let dragScrollCont = null;
  let dragInitialScroll = 0;

  /**
   * VIP Drag Engine Implementation
   * Handles manual reordering in "Custom Order" mode.
   */
  function initVIPDrag(e, itemEl, node, context) {
    const { state, treeData, load, _findNodeByPath } = context;
    
    isDragging = true;
    dragStartY = e.clientY;
    dragStartX = e.clientX;
    dragStartRect = itemEl.getBoundingClientRect();
    dragItemHeight = dragStartRect.height;
    // 1. BUILD VISUAL MAP (Flattened Tree)
    const treeViewport = document.getElementById('file-tree-mount');
    const treeContainer = document.getElementById('file-tree');
    if (!treeViewport || !treeContainer) {
      if (window.DRAG_DEBUG) console.warn('[VIP-Drag] Aborted: Missing viewports');
      isDragging = false;
      return;
    }

    // Correctly detect the scroll container for the main explorer
    dragScrollCont = treeContainer.closest('.ds-scroll-container');
    dragInitialScroll = dragScrollCont ? dragScrollCont.scrollTop : 0;
    const allWrappers = Array.from(treeContainer.querySelectorAll('.tree-node-wrapper'));
    const visualMap = allWrappers.map(wrapper => {
      const item = wrapper.querySelector('.tree-item');
      if (!item) return null;
      const path = item.dataset.path;
      const rect = item.getBoundingClientRect();
      const nodeData = _findNodeByPath(treeData, path);
      return { el: item, wrapper, path, level: (path.match(/\//g) || []).length, rect, type: nodeData ? nodeData.type : (item.classList.contains('tree-item-directory') ? 'directory' : 'file') };
    }).filter(Boolean);

    // Multi-selection
    const isItemSelected = state.selectedPaths.includes(node.path);
    const draggedItems = isItemSelected 
      ? state.selectedPaths.map(p => {
          // Find element anywhere in the sidebar (could be in All Files or Hidden)
          const el = document.querySelector(`.tree-item[data-path="${p.replace(/'/g, "\\'")}"]`);
          if (!el) return null;
          const nodeData = _findNodeByPath(treeData, p);
          return { 
            path: p, 
            name: p.split('/').pop(), 
            el, 
            wrapper: el.closest('.tree-node-wrapper'), 
            type: nodeData ? nodeData.type : (el.classList.contains('tree-item-directory') ? 'directory' : 'file')
          };
        }).filter(Boolean)
      : [{ path: node.path, name: node.name, el: itemEl, wrapper: itemEl.closest('.tree-node-wrapper'), type: node.type }];
    
    if (draggedItems.length === 0) {
      isDragging = false;
      return;
    }

    // 2. PRE-CALCULATE DRAGGED MAP & PREFIX SUMS (O(N))
    const draggedPathsMap = new Set(draggedItems.map(di => di.path));
    const draggedBeforeMap = new Array(visualMap.length).fill(0);
    let countSoFar = 0;
    visualMap.forEach((m, i) => {
      draggedBeforeMap[i] = countSoFar;
      if (draggedPathsMap.has(m.path)) countSoFar++;
    });

    let currentX = e.clientX;
    let isDraggingStarted = false;
    let animationFrameId = null;
    let currentY = e.clientY;

    // State of the current "Drop Target"
    let target = {
      parentPath: '', // '' means root
      index: 0,
      splitIdx: -1   // Index from last frame for stability
    };

    const updateUI = () => {
      if (!isDragging) return;

      const deltaY = currentY - dragStartY;
      const deltaX = currentX - dragStartX;
      const scrollDelta = dragScrollCont ? (dragScrollCont.scrollTop - dragInitialScroll) : 0;
      if (dragProxy) dragProxy.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.9)`;

      // 1. DYNAMIC TARGET SEARCH (Accounting for current offsets)
      let nearestIdx = -1;
      let minDistance = Infinity;
      let splitIdx = -1;

      // We do a more precise search by calculating the CURRENT top of each item
      for (let i = 0; i < visualMap.length; i++) {
        const m = visualMap[i];
        if (draggedPathsMap.has(m.path)) continue;

        // Calculate where this item is currently shifted
        let offset = -(dragItemHeight * draggedBeforeMap[i]);
        // If we are below the last frame's split point, we are shifted down by 1 item
        if (target.splitIdx !== -1 && i >= target.splitIdx) offset += dragItemHeight;

        const currentTop = m.rect.top + offset;
        const _currentBottom = currentTop + dragItemHeight;
        const currentCenter = currentTop + dragItemHeight / 2;

        const dist = Math.abs(currentY - (currentCenter - scrollDelta));
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      // ── DETACHED TARGET DETECTION ──
      const elsUnder = document.elementsFromPoint(currentX, currentY);
      
      // Check if we are inside the main tree viewport
      const _isInsideTree = treeViewport.getBoundingClientRect().top <= currentY && 
                            treeViewport.getBoundingClientRect().bottom >= currentY;

      const hiddenSection = elsUnder.find(el => 
        el.closest('#hidden-items-section') || 
        el.closest('.sidebar-footer') || 
        (el.classList.contains('sidebar-divider') && el.nextElementSibling?.id === 'hidden-items-section')
      );

      if (hiddenSection) {
        target = { type: 'hidden-section' };
        splitIdx = -1;

        // Visual Highlight for Hidden Section
        document.querySelectorAll('.drag-hover-section').forEach(el => el.classList.remove('drag-hover-section'));
        // No visual highlight here, just setting target
      } else if (nearestIdx !== -1) {
        const near = visualMap[nearestIdx];
        let spreadingOffset = -(dragItemHeight * draggedBeforeMap[nearestIdx]);
        // Re-apply split shift if necessary for this specific item's detection
        if (target.splitIdx !== -1 && nearestIdx >= target.splitIdx) spreadingOffset += dragItemHeight;
        
        const nearTop = near.rect.top - scrollDelta + spreadingOffset;
        const itemHeight = near.rect.height;
        const relativeY = currentY - nearTop;
        
        const elUnder = document.elementFromPoint(currentX, currentY);
        const folderAreaUnder = elUnder ? elUnder.closest('.folder-children') : null;
        const lastItem = visualMap[visualMap.length - 1];
        const isOverRootArea = lastItem ? (currentY > (lastItem.rect.bottom - scrollDelta + 5)) : false;

        const isFolder = near.type === 'directory';
        const edgeSize = isFolder ? 4 : (itemHeight * 0.5); 
        
        const isOverTop = relativeY < edgeSize;
        const isOverBottom = relativeY > (itemHeight - edgeSize);
        const nearBottom = nearTop + itemHeight;
        const isOverMiddle = isFolder && !isOverTop && !isOverBottom;

        splitIdx = nearestIdx; 
        
        if (isOverRootArea) {
          target = { parentPath: '', level: 0, type: 'between', y: -1, isRootDrop: true, splitIdx: visualMap.length };
          splitIdx = visualMap.length; 
        } else {
          if (near.type === 'directory' && isOverMiddle && !draggedItems.some(di => di.path === near.path)) {
            target = { parentPath: near.path, index: 0, level: near.level + 1, type: 'into', y: nearTop + itemHeight / 2, splitIdx: -1 };
            splitIdx = -1; 
          } else {
            const yPos = isOverTop ? nearTop : nearBottom;
            if (isOverBottom) splitIdx++; 
            
            let dropLevel = near.level;
            let dropParent = near.path.substring(0, near.path.lastIndexOf('/')) || '';

            if (folderAreaUnder) {
              const parentItem = folderAreaUnder.previousElementSibling;
              if (parentItem && parentItem.classList.contains('tree-item')) {
                dropParent = parentItem.getAttribute('data-path');
                dropLevel = (dropParent.match(/\//g) || []).length + 1;
              }
            } else {
              const xDelta = currentX - dragStartX;
              const levelShift = Math.round(xDelta / 20); 
              if (levelShift < 0) {
                for (let i = 0; i < Math.abs(levelShift); i++) {
                  if (dropParent) {
                    dropLevel--;
                    dropParent = dropParent.substring(0, dropParent.lastIndexOf('/')) || '';
                  }
                }
              }
            }
            
            target = { parentPath: dropParent, level: dropLevel, type: 'between', y: yPos, nearPath: near.path, isAfter: isOverBottom, splitIdx: splitIdx };
          }
        }

        // 2. OPTIMIZED SPREADING & HIGHLIGHTS
        // Toggle Root & Hidden Highlight (Minimalist Header-only)
        const explorerHeader = document.querySelector('#file-explorer-header-mount .sidebar-section-header');
        const hiddenHeader = document.querySelector('#hidden-items-header-mount .sidebar-section-header');
        
        if (explorerHeader) explorerHeader.classList.toggle('drag-hover-header', !!target.isRootDrop);
        if (hiddenHeader) hiddenHeader.classList.toggle('drag-hover-header', target.type === 'hidden-section');

        visualMap.forEach((m, idx) => {
          // Visual Highlight for "Into" target
          const isTargetFolder = (target.type === 'into' && target.parentPath === m.path);
          m.el.classList.toggle('drag-hover', isTargetFolder);

          const isBeingDragged = draggedPathsMap.has(m.path);
          if (isBeingDragged) {
            return;
          }
          
          let offset = -(dragItemHeight * draggedBeforeMap[idx]);
          if (splitIdx !== -1 && idx >= splitIdx) offset += dragItemHeight;
          
          const currentTransform = m.el.style.transform;
          const newTransform = offset !== 0 ? `translateY(${offset}px)` : '';
          if (currentTransform !== newTransform) {
            m.el.style.transform = newTransform;
          }
        });
      }

      if (dragScrollCont) {
        const rect = dragScrollCont.getBoundingClientRect();
        const threshold = 60;
        if (currentY < rect.top + threshold) dragScrollCont.scrollTop -= 5;
        if (currentY > rect.bottom - threshold) dragScrollCont.scrollTop += 5;
      }

      animationFrameId = requestAnimationFrame(updateUI);
    };

    const onMouseMove = (moveEvent) => {
      currentY = moveEvent.clientY;
      currentX = moveEvent.clientX;
      const dist = Math.sqrt(Math.pow(currentY - dragStartY, 2) + Math.pow(currentX - dragStartX, 2));

      if (!isDraggingStarted && dist > 5) {
        isDraggingStarted = true;
        document.body.classList.add('is-dragging');
        const treeContainer = document.getElementById('file-tree');
        if (treeContainer) treeContainer.classList.add('is-dragging-active');
        
        // Auto-collapse dragged folder ONLY when drag actually starts
        if (node.type === 'directory' && node.expanded) {
          node.expanded = false;
          const wrapper = itemEl.closest('.tree-node-wrapper');
          const childrenCont = wrapper.querySelector('.folder-children');
          if (childrenCont) childrenCont.style.display = 'none';
        }
        
        dragProxy = itemEl.cloneNode(true);
        dragProxy.classList.add('is-dragging-vip');
        dragProxy.style.width = `${dragStartRect.width}px`;
        dragProxy.style.height = `${dragStartRect.height}px`;
        dragProxy.style.left = `${dragStartRect.left}px`;
        dragProxy.style.top = `${dragStartRect.top}px`;
        
        if (draggedItems.length > 1) {
          const badge = document.createElement('div');
          badge.className = 'drag-badge';
          badge.innerText = draggedItems.length;
          dragProxy.appendChild(badge);
        }

        // Hide .md in drag proxy name
        const label = dragProxy.querySelector('.item-label');
        if (label && label.innerText.toLowerCase().endsWith('.md')) {
          label.innerText = label.innerText.substring(0, label.innerText.length - 3);
        }

        document.body.appendChild(dragProxy);

        draggedItems.forEach(di => di.wrapper.classList.add('tree-item-placeholder'));
        
        // Hide indentation lines for folders that become effectively empty
        const folderChildrenWrappers = new Set(draggedItems.map(di => di.wrapper.parentElement).filter(el => el && el.classList.contains('folder-children')));
        folderChildrenWrappers.forEach(container => {
          const totalChildren = container.querySelectorAll(':scope > .tree-node-wrapper').length;
          const draggedInThisFolder = container.querySelectorAll(':scope > .tree-node-wrapper.tree-item-placeholder').length;
          if (totalChildren === draggedInThisFolder) {
            container.classList.add('is-effectively-empty');
          }
        });

        animationFrameId = requestAnimationFrame(updateUI);
      }

      // ── Auto-expand logic for collapsed sections ──
      const elUnder = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const headerUnder = elUnder ? elUnder.closest('.sidebar-section-header') : null;
      if (headerUnder && headerUnder.closest('.sidebar-section.collapsed')) {
          if (lastHoveredHeader !== headerUnder) {
              if (autoExpandTimer) clearTimeout(autoExpandTimer);
              lastHoveredHeader = headerUnder;
              autoExpandTimer = setTimeout(() => {
                  if (isDragging && lastHoveredHeader === headerUnder) {
                      headerUnder.click();
                  }
              }, 600);
          }
      } else {
          if (autoExpandTimer) {
              clearTimeout(autoExpandTimer);
              autoExpandTimer = null;
          }
          lastHoveredHeader = null;
      }
    };

    const onMouseUp = async () => {
      const treeViewport = document.getElementById('file-tree-mount');
      if (treeViewport) {
        treeViewport.classList.remove('is-dragging-active');
        treeViewport.classList.remove('drag-hover-root');
      }
      const explorerHeader = document.querySelector('#file-explorer-header-mount .sidebar-section-header');
      if (explorerHeader) explorerHeader.classList.remove('drag-hover-header');
      const hiddenHeader = document.querySelector('#hidden-items-header-mount .sidebar-section-header');
      if (hiddenHeader) {
        hiddenHeader.classList.remove('drag-hover-header');
        const safeZone = hiddenHeader.closest('#hidden-items-section')?.querySelector('.ds-drop-safe-zone');
        if (safeZone) safeZone.remove();
      }

      visualMap.forEach(m => {
        m.el.style.transform = '';
        m.el.classList.remove('drag-hover');
        m.wrapper.classList.remove('tree-item-placeholder');
      });

      // Cleanup effectively empty folders
      document.querySelectorAll('.folder-children.is-effectively-empty').forEach(el => {
        el.classList.remove('is-effectively-empty');
      });

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.classList.remove('is-dragging');
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      
      if (!isDraggingStarted || draggedItems.length === 0) {
        isDragging = false;
        return;
      }

      if (dragProxy) {
        if (target.type === 'hidden-section') {
          const { handleBatchToggleHidden } = context;
          const draggedPaths = draggedItems.map(di => di.path);
          if (handleBatchToggleHidden) await handleBatchToggleHidden(true, draggedPaths, true);
          isDragging = false;
        } else {
          const destParentPath = target.parentPath;
          const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
          const hiddenPaths = new Set(AppState.settings.hiddenPaths || []);
          const toUnhide = [];
        
        // Calculate new index in target parent
        let orderKey = destParentPath || 'root';
        let currentOrder = [...(state.customOrders[orderKey] || [])];
        if (currentOrder.length === 0) {
          const pNode = destParentPath === '' ? treeData : _findNodeByPath(treeData, destParentPath);
          currentOrder = (pNode ? (destParentPath === '' ? pNode : pNode.children) : []).map(c => c.name);
        }

        // Calculate source folder for cleanup
        const sourceParentPath = draggedItems[0].path.substring(0, draggedItems[0].path.lastIndexOf('/')) || '';
        const _sourceOrderKey = sourceParentPath || 'root';

        let movedCount = 0;
        const draggedNames = draggedItems.map(di => di.path.split('/').pop());

        // 3. Perform actual move/reorder
        const newSelectedPaths = [];
        const oldSelectedPaths = [...state.selectedPaths];

        for (const item of draggedItems) {
          const fileName = item.path.split('/').pop();
          const srcRel = item.path;
          const destRel = destParentPath ? (destParentPath + '/' + fileName) : fileName;

          if (hiddenPaths.has(srcRel)) toUnhide.push(srcRel);

          if (srcRel !== destRel) {
            const srcAbs = (wsPath + '/' + srcRel).replace(/\/\//g, '/');
            const destAbs = (wsPath + '/' + destRel).replace(/\/\//g, '/');

            if (item.type === 'directory' && destRel.startsWith(item.path + '/')) continue;

            const res = await FileService.moveFile(srcAbs, destAbs);
            if (res.success) {
              movedCount++;

              // PERSISTENCE SYNC
              if (AppState.currentFile === srcRel) AppState.currentFile = destRel;
              if (typeof RecentlyViewedModule !== 'undefined') RecentlyViewedModule.swap(srcRel, destRel);
              if (typeof TabsModule !== 'undefined') TabsModule.swap(srcRel, destRel);

              // Update selection map
              if (oldSelectedPaths.includes(srcRel)) {
                newSelectedPaths.push(destRel);
              }
            } else {
              if (oldSelectedPaths.includes(srcRel)) newSelectedPaths.push(srcRel);
            }
          } else {
            if (oldSelectedPaths.includes(srcRel)) newSelectedPaths.push(srcRel);
          }
        }

        if (toUnhide.length > 0) {
          const { handleBatchToggleHidden } = context;
          if (handleBatchToggleHidden) await handleBatchToggleHidden(false, toUnhide, true);
        }

        // Update state selection (After unhide to ensure it persists)
        if (newSelectedPaths.length > 0) {
          state.selectedPaths = newSelectedPaths;
        }

        // Update Custom Orders: Remove from every unique SOURCE folder, then Insert into TARGET.
        // Build a per-source-folder map so multi-folder selections are all cleaned correctly.
        const sourceCleanupMap = new Map();
        draggedItems.forEach(di => {
          const parent = di.path.substring(0, di.path.lastIndexOf('/')) || '';
          const key = parent || 'root';
          if (!sourceCleanupMap.has(key)) sourceCleanupMap.set(key, new Set());
          sourceCleanupMap.get(key).add(di.path.split('/').pop());
        });
        sourceCleanupMap.forEach((names, srcKey) => {
          if (srcKey !== orderKey && state.customOrders[srcKey]) {
            state.customOrders[srcKey] = state.customOrders[srcKey].filter(n => !names.has(n));
          }
        });

        // Filter dragged items out FIRST, then find insertion index in the cleaned array.
        // This avoids off-by-one when the dragged item sits before the target in the original order.
        currentOrder = currentOrder.filter(name => !draggedNames.includes(name));
        let insertIdx;
        if (target.type === 'between' && !target.isRootDrop) {
          const nearName = target.nearPath.split('/').pop();
          insertIdx = currentOrder.indexOf(nearName);
          if (insertIdx === -1) {
            insertIdx = currentOrder.length;
          } else if (target.isAfter) {
            insertIdx++;
          }
        } else {
          // 'into' or rootDrop: always append at end of target folder
          insertIdx = currentOrder.length;
        }
        if (insertIdx > currentOrder.length) insertIdx = currentOrder.length;
        currentOrder.splice(insertIdx, 0, ...draggedNames);
        state.customOrders[orderKey] = currentOrder;
        
        localStorage.setItem('mdpreview_custom_orders', JSON.stringify(state.customOrders));
        if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();

        if (movedCount > 0 || target.index !== -1 || toUnhide.length > 0) {
          if (destParentPath) {
            const pNode = _findNodeByPath(treeData, destParentPath);
            if (pNode) pNode.expanded = true;
          }
          isDragging = false;
          load();
        }
      }

        dragProxy.style.opacity = '0';
        dragProxy.style.transform += ' scale(0.8)';
        setTimeout(() => {
          if (dragProxy) dragProxy.remove();
          dragProxy = null;
          isDragging = false;
        }, 300);
      } else {
        isDragging = false;
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Standard Drag Engine Implementation
   * Handles alphabetical movement between folders.
   */
  function initStandardDrag(e, itemEl, node, context) {
    const { state, treeData, load, _findNodeByPath } = context;

    if (isDragging) return;
    isDragging = true;

    const dragStartX = e.clientX;
    const dragStartY = e.clientY;
    let dragProxy = null;
    let isDraggingStarted = false;
    let currentTargetEl = null;
    let targetPath = null;
    let lastSecondaryTarget = null;

    const isItemSelected = state.selectedPaths.includes(node.path);
    const draggedPaths = isItemSelected ? [...state.selectedPaths] : [node.path];
    const treeViewport = document.getElementById('file-tree-mount');
    const container = itemEl.closest('.ds-tree-view'); // Dynamically detect container
    if (!treeViewport || !container) {
      if (window.DRAG_DEBUG) console.warn('[Standard-Drag] Aborted: Missing viewports');
      return;
    }
    const draggedItems = draggedPaths.map(p => {
      const el = container.querySelector(`.tree-item[data-path="${p.replace(/'/g, "\\'")}"]`);
      const nodeData = _findNodeByPath(treeData, p);
      return { path: p, el, type: nodeData ? nodeData.type : 'file', name: p.split('/').pop() };
    }).filter(di => di.el);

    if (draggedItems.length === 0) {
      isDragging = false;
      return;
    }

    // Correctly detect the scroll container for the main explorer
    const dragScrollCont = container.closest('.ds-scroll-container');
    const _dragInitialScroll = dragScrollCont ? dragScrollCont.scrollTop : 0;

    const onMouseMove = (moveEvent) => {
      const dist = Math.sqrt(Math.pow(moveEvent.clientX - dragStartX, 2) + Math.pow(moveEvent.clientY - dragStartY, 2));

      if (!isDraggingStarted && dist > 8) {
        isDraggingStarted = true;
        document.body.classList.add('is-dragging');
        if (treeViewport) treeViewport.classList.add('is-dragging-active');
        
        // 1. Create Proxy (Compact stack style)
        dragProxy = document.createElement('div');
        dragProxy.className = 'standard-drag-proxy';
        
        const icon = document.createElement('i');
        icon.className = draggedItems[0].type === 'directory' ? 'ri-folder-fill' : 'ri-file-text-line';
        dragProxy.appendChild(icon);

        const label = document.createElement('span');
        let displayName = draggedItems.length === 1 ? draggedItems[0].name : `${draggedItems.length} items`;
        if (draggedItems.length === 1 && displayName.toLowerCase().endsWith('.md')) {
          displayName = displayName.substring(0, displayName.length - 3);
        }
        label.innerText = displayName;
        dragProxy.appendChild(label);

        if (draggedItems.length > 1) {
          const badge = document.createElement('div');
          badge.className = 'drag-badge';
          badge.innerText = draggedItems.length;
          dragProxy.appendChild(badge);
        }

        document.body.appendChild(dragProxy);

        // 2. Dim sources
        draggedItems.forEach(di => di.el.classList.add('is-dragging-source'));

        // 3. Create Safe Zone for Hidden Section
        const hSection = document.getElementById('hidden-items-section');
        if (hSection && !hSection.querySelector('.ds-drop-safe-zone')) {
          const safeZone = document.createElement('div');
          safeZone.className = 'ds-drop-safe-zone';
          hSection.appendChild(safeZone);
        }
      }

      if (isDraggingStarted && dragProxy) {
        dragProxy.style.left = `${moveEvent.clientX}px`;
        dragProxy.style.top = `${moveEvent.clientY}px`;

        // 3. Target Detection (Using elementsFromPoint for deep detection)
        const elsUnder = document.elementsFromPoint(moveEvent.clientX, moveEvent.clientY);

        if (elsUnder.length === 0) return;
        
        const elUnder = elsUnder[0]; // Primary element
        const itemUnder = elUnder.closest('.tree-item');
        const wrapperUnder = elUnder.closest('.tree-node-wrapper');
        
        let primaryTarget = null;
        let secondaryTarget = null;
        let finalPath = null;

        // ── Prioritize Hidden Section detection (Deep scan) ──
        const hiddenSection = elsUnder.find(el => 
            el.closest('#hidden-items-section') || 
            el.closest('.sidebar-footer') || 
            (el.classList.contains('sidebar-divider') && el.nextElementSibling?.id === 'hidden-items-section')
        );

        if (hiddenSection) {
          primaryTarget = null;
          secondaryTarget = null;
          finalPath = null;
          targetPath = '__HIDDEN__';
        } else {
          if (itemUnder) {
            const path = itemUnder.getAttribute('data-path');
            const isDir = itemUnder.classList.contains('tree-item-directory');
            
            if (isDir) {
              primaryTarget = itemUnder;
              finalPath = path;
            } else {
              secondaryTarget = itemUnder;
              const parentPath = path.substring(0, path.lastIndexOf('/')) || '';
              primaryTarget = document.querySelector(`.tree-item[data-path="${parentPath.replace(/'/g, "\\'")}"]`);
              finalPath = parentPath;
            }
          } else if (wrapperUnder) {
            const mainItem = wrapperUnder.querySelector(':scope > .tree-item');
            if (mainItem && mainItem.classList.contains('tree-item-directory')) {
              primaryTarget = mainItem;
              finalPath = mainItem.getAttribute('data-path');
            }
          }
        }

        // ── NEW: CALCULATE FINAL TARGET PATH INDEPENDENTLY ──
        let newTargetPath = null;
        if (hiddenSection) {
          newTargetPath = '__HIDDEN__';
        } else if (finalPath !== null) {
          newTargetPath = finalPath;
        } else {
          const treeRect = treeViewport.getBoundingClientRect();
          const isInsideTree = moveEvent.clientX >= treeRect.left && moveEvent.clientX <= treeRect.right &&
                               moveEvent.clientY >= treeRect.top && moveEvent.clientY <= treeRect.bottom;
          if (isInsideTree) newTargetPath = ''; // Root
        }
        targetPath = newTargetPath;

        // ── Minimalist Header Highlights ──
        const explorerHeader = document.querySelector('#file-explorer-header-mount .sidebar-section-header');
        const hiddenHeader = document.querySelector('#hidden-items-header-mount .sidebar-section-header');
        
        if (explorerHeader) explorerHeader.classList.toggle('drag-hover-header', targetPath === '');
        if (hiddenHeader) hiddenHeader.classList.toggle('drag-hover-header', targetPath === '__HIDDEN__');

        // Apply Item Highlights
        if (currentTargetEl !== primaryTarget || lastSecondaryTarget !== secondaryTarget) {
          lastSecondaryTarget = secondaryTarget;
          
          const treeContainer = document.getElementById('file-tree');
          treeContainer.querySelectorAll('.drag-hover, .drag-hover-secondary').forEach(el => {
            el.classList.remove('drag-hover', 'drag-hover-secondary');
          });

          currentTargetEl = primaryTarget;
          
          if (targetPath === '__HIDDEN__') {
            // No item highlights for hidden
          } else if (primaryTarget) {
            const isInvalid = draggedItems.some(di => targetPath === di.path || targetPath.startsWith(di.path + '/'));
            if (!isInvalid) {
              primaryTarget.classList.add('drag-hover');
              if (secondaryTarget) secondaryTarget.classList.add('drag-hover-secondary');
            }
          } else if (targetPath === '') {
            currentTargetEl = treeViewport;
          }
        }

        // ── Auto-expand logic ──
        const headerUnder = elUnder ? elUnder.closest('.sidebar-section-header') : null;
        if (headerUnder && headerUnder.closest('.sidebar-section.collapsed')) {
            if (lastHoveredHeader !== headerUnder) {
                if (autoExpandTimer) clearTimeout(autoExpandTimer);
                lastHoveredHeader = headerUnder;
                autoExpandTimer = setTimeout(() => {
                    if (isDragging && lastHoveredHeader === headerUnder) {
                        headerUnder.click();
                    }
                }, 600);
            }
        } else {
            if (autoExpandTimer) {
                clearTimeout(autoExpandTimer);
                autoExpandTimer = null;
            }
            lastHoveredHeader = null;
        }
      }

      if (dragScrollCont) {
        const rect = dragScrollCont.getBoundingClientRect();
        const threshold = 60;
        if (moveEvent.clientY < rect.top + threshold) dragScrollCont.scrollTop -= 5;
        if (moveEvent.clientY > rect.bottom - threshold) dragScrollCont.scrollTop += 5;
      }
    };

    const onMouseUp = async () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.classList.remove('is-dragging');

      if (!isDraggingStarted || draggedItems.length === 0) {
        isDragging = false;
        return;
      }

      // 1. Cleanup UI
      if (dragProxy) dragProxy.remove();
      draggedItems.forEach(di => di.el.classList.remove('is-dragging-source'));
      
      const treeContainer = document.getElementById('file-tree');
      if (treeContainer) {
        treeContainer.querySelectorAll('.drag-hover, .drag-hover-secondary').forEach(el => {
          el.classList.remove('drag-hover', 'drag-hover-secondary');
        });
        treeContainer.classList.remove('drag-hover-root');
        treeContainer.classList.remove('is-dragging-active');
      }
      
      const explorerHeader = document.querySelector('#file-explorer-header-mount .sidebar-section-header');
      if (explorerHeader) explorerHeader.classList.remove('drag-hover-header');
      
      const hiddenHeader = document.querySelector('#hidden-items-header-mount .sidebar-section-header');
      if (hiddenHeader) {
        hiddenHeader.classList.remove('drag-hover-header');
        const hSection = hiddenHeader.closest('#hidden-items-section');
        if (hSection) {
          const safeZone = hSection.querySelector('.ds-drop-safe-zone');
          if (safeZone) safeZone.remove();
        }
      }

      // 2. Perform Move
      if (targetPath === '__HIDDEN__') {
        const { handleBatchToggleHidden } = context;
        if (handleBatchToggleHidden) await handleBatchToggleHidden(true, draggedPaths, true);
      } else if (targetPath !== null) {
        const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
        let movedCount = 0;
        const newSelectedPaths = [];
        const oldSelectedPaths = [...state.selectedPaths];
        const hiddenPaths = new Set(AppState.settings.hiddenPaths || []);
        const toUnhide = [];

        for (const item of draggedItems) {
          const srcRel = item.path;
          const destRel = targetPath ? (targetPath + '/' + item.name).replace(/\/\//g, '/') : item.name;

          if (hiddenPaths.has(srcRel)) toUnhide.push(srcRel);

          if (srcRel !== destRel) {
            const srcAbs = (wsPath + '/' + srcRel).replace(/\/\//g, '/');
            const destAbs = (wsPath + '/' + destRel).replace(/\/\//g, '/');
            
            const res = await FileService.moveFile(srcAbs, destAbs);
            if (res.success) {
              movedCount++;
              syncCustomOrder(srcRel, destRel, state);
              
              // PERSISTENCE SYNC
              if (AppState.currentFile === srcRel) AppState.currentFile = destRel;
              if (typeof RecentlyViewedModule !== 'undefined') RecentlyViewedModule.swap(srcRel, destRel);
              if (typeof TabsModule !== 'undefined') TabsModule.swap(srcRel, destRel);

              if (oldSelectedPaths.includes(srcRel)) {
                newSelectedPaths.push(destRel);
              }
            } else {
               if (oldSelectedPaths.includes(srcRel)) newSelectedPaths.push(srcRel);
            }
          } else {
            if (oldSelectedPaths.includes(srcRel)) newSelectedPaths.push(srcRel);
          }
        }

        if (toUnhide.length > 0) {
          const { handleBatchToggleHidden } = context;
          if (handleBatchToggleHidden) {
            await handleBatchToggleHidden(false, toUnhide, true);
          }
        }

        if (newSelectedPaths.length > 0) {
          state.selectedPaths = newSelectedPaths;
        }

        if (movedCount > 0 || toUnhide.length > 0) {
          const pNode = _findNodeByPath(treeData, targetPath);
          if (pNode) pNode.expanded = true;
          load();
        }
      }


      isDragging = false;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Proactively syncs custom order metadata when files are moved or renamed.
   */
  function syncCustomOrder(oldPath, newPath, state) {
    const oldParent = oldPath.substring(0, oldPath.lastIndexOf('/')) || 'root';
    const newParent = newPath.substring(0, newPath.lastIndexOf('/')) || 'root';
    const oldName = oldPath.split('/').pop();
    const newName = newPath.split('/').pop();

    if (oldParent === newParent) {
      if (state.customOrders[oldParent]) {
        state.customOrders[oldParent] = state.customOrders[oldParent].map(n => n === oldName ? newName : n);
      }
    } else {
      if (state.customOrders[oldParent]) {
        state.customOrders[oldParent] = state.customOrders[oldParent].filter(n => n !== oldName);
        if (state.customOrders[oldParent].length === 0) delete state.customOrders[oldParent];
      }
      if (state.customOrders[newParent]) {
        if (!state.customOrders[newParent].includes(newName)) {
          state.customOrders[newParent].push(newName);
        }
      }
    }
    localStorage.setItem('mdpreview_custom_orders', JSON.stringify(state.customOrders));
    if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();
  }

  return {
    getIsDragging: () => isDragging,
    setIsDragging: (val) => { isDragging = val; },
    initVIPDrag,
    initStandardDrag,
    syncCustomOrder
  };
})();

window.TreeDragManager = TreeDragManager;

```
</file>

<file path="renderer/js/services/ui-utils.js">
```js
/**
 * UIUtils — General UI helper functions
 * Purpose: Provide shared UI logic like smart masks, transitions, etc.
 */
const UIUtils = (() => {
  'use strict';

  /**
   * Applies a smart scroll mask to a container
   * @param {HTMLElement} container - The scrollable element
   * @param {Object} options - Configuration
   * @param {number} options.fadeHeight - Height of the fade effect (px)
   */
  function applySmartScrollMask(container, options = {}) {
    if (!container) return;
    const { fadeHeight = 16 } = options;

    const updateFade = () => {
      const scrollTop = container.scrollTop;
      const topFade = Math.min(scrollTop, fadeHeight);
      container.style.setProperty('--_fade-top', `${topFade}px`);
    };

    const checkScrollable = () => {
      const isScrollable = container.scrollHeight > container.clientHeight + 2;
      container.classList.toggle('is-scrollable', isScrollable);
      updateFade();
    };

    container.addEventListener('scroll', updateFade, { passive: true });

    if (window.ResizeObserver) {
      const observer = new ResizeObserver(() => {
        requestAnimationFrame(checkScrollable);
      });
      observer.observe(container);
    } else {
      window.addEventListener('resize', checkScrollable);
    }

    // Initial check
    requestAnimationFrame(checkScrollable);
  }

  /**
   * Renders a skeleton loading state
   * @param {string} type - 'list' or 'map'
   * @param {number} count - Number of rows (for list)
   */
  function renderSkeleton(type = 'list', count = 6) {
    const frag = document.createDocumentFragment();
    
    if (type === 'list') {
      const widths = ['70%', '85%', '60%', '75%', '90%', '65%', '80%', '55%'];
      for (let i = 0; i < count; i++) {
        const row = DesignSystem.createElement('div', 'skeleton-row');
        const icon = DesignSystem.createElement('div', ['skeleton', 'skeleton-icon']);
        const text = DesignSystem.createElement('div', ['skeleton', 'skeleton-text']);
        text.style.width = widths[i % widths.length];

        row.appendChild(icon);
        row.appendChild(text);
        frag.appendChild(row);
      }
    } else if (type === 'map') {
      // For map, we show a full-height shimmer block or multiple blocks
      const container = DesignSystem.createElement('div', 'skeleton-map');
      for (let i = 0; i < 12; i++) {
        const row = DesignSystem.createElement('div', ['skeleton', 'skeleton-text'], {
          style: `width: ${Math.random() * 40 + 60}%; height: 12px; margin-bottom: 12px;`
        });
        container.appendChild(row);
      }
      frag.appendChild(container);
    }
    
    return frag;
  }

  return {
    applySmartScrollMask,
    renderSkeleton
  };
})();

// Export to global scope
window.UIUtils = UIUtils;

```
</file>

<file path="renderer/js/utils/code-blocks.js">
```js
/* ============================================================
   code-blocks.js — Syntax highlighting enhancements, copy button, badges
   ============================================================ */

(() => {
'use strict';

const CodeBlockModule = {
  /**
   * Process all code blocks in a container to add UI enhancements
   */
  process(container) {
    if (!container) return;
    const codeBlocks = container.querySelectorAll('pre code');
    
    codeBlocks.forEach(codeEl => {
      // ── Defensive: Skip Mermaid blocks (they are handled by mermaid.js) ──
      if (codeEl.classList.contains('language-mermaid') || codeEl.classList.contains('mermaid')) return;

      const preEl = codeEl.parentElement;
      if (!preEl || preEl.tagName !== 'PRE') return;
      if (preEl.classList.contains('code-block-processed')) return;
      
      // 1. Identify language
      let lang = 'TEXT';
      const langMatch = codeEl.className.match(/language-([^\s]+)/);
      if (langMatch) {
        lang = langMatch[1].toUpperCase();
      }
      
      // 2. Create Wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'premium-code-block';
      
      // 3. Create Header
      const header = document.createElement('div');
      header.className = 'code-block-header';
      header.innerHTML = `
        <span class="code-block-lang">${lang}</span>
        <button class="code-block-copy" title="Copy code">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="icon-check hidden"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Copy</span>
        </button>
      `;
      
      // 4. Setup Copy Logic
      const copyBtn = header.querySelector('.code-block-copy');
      if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const text = codeEl.innerText;
          navigator.clipboard.writeText(text).then(() => {
            this.showCopiedState(copyBtn);
          });
        });
      }
      
      // 5. Rearrange DOM: Replace pre with wrapper containing header + pre
      preEl.classList.add('code-block-processed');
      preEl.replaceWith(wrapper);
      wrapper.appendChild(header);
      wrapper.appendChild(preEl);
    });
  },

  /**
   * Handle the "Copied!" feedback state
   */
  showCopiedState(btn) {
    const iconCopy = btn.querySelector('.icon-copy');
    const iconCheck = btn.querySelector('.icon-check');
    const textSpan = btn.querySelector('span');
    
    btn.classList.add('copied');
    iconCopy.classList.add('hidden');
    iconCheck.classList.remove('hidden');
    textSpan.innerText = 'Copied!';
    
    setTimeout(() => {
      btn.classList.remove('copied');
      iconCopy.classList.remove('hidden');
      iconCheck.classList.add('hidden');
      textSpan.innerText = 'Copy';
    }, 2000);
  }
};

window.CodeBlockModule = CodeBlockModule;

})();

```
</file>

<file path="renderer/js/utils/gdoc-util.js">
```js
/**
 * GDocUtil — Utility to transform HTML into a Google Docs-friendly format.
 * Purpose: Inlines essential CSS styles and converts SVGs (charts) to raster images.
 */
const GDocUtil = (() => {
  'use strict';

  /**
   * Transforms raw HTML into GDoc-friendly HTML by inlining styles and rasterizing SVGs.
   * @param {string} html - The raw HTML content.
   * @param {HTMLElement} sourceContainer - The DOM element where the HTML is currently rendered.
   * @returns {Promise<string>} - The transformed HTML.
   */
  async function transform(html, sourceContainer) {
    const logs = [`[GDoc Smart Copy] Started at ${new Date().toLocaleTimeString()}`];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // 1. Handle Tables
    const tables = tempDiv.querySelectorAll('table');
    tables.forEach(table => {
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.marginBottom = '16px';
      table.setAttribute('border', '1');

      table.querySelectorAll('th, td').forEach(cell => {
        cell.style.border = '1px solid #cccccc';
        cell.style.padding = '8px';
        if (cell.tagName === 'TH') {
          cell.style.backgroundColor = '#f3f3f3';
          cell.style.fontWeight = 'bold';
        }
      });
    });

    // 2. Handle Code Blocks
    const codeBlocks = tempDiv.querySelectorAll('pre, code');
    codeBlocks.forEach(block => {
      block.style.backgroundColor = '#f6f8fa';
      block.style.padding = '12px';
      block.style.borderRadius = '6px';
      block.style.fontFamily = 'monospace';
      block.style.fontSize = '14px';
      block.style.lineHeight = '1.45';
      block.style.color = '#24292e';
      block.style.display = block.tagName === 'PRE' ? 'block' : 'inline';
    });

    // Syntax highlighting inlining
    const syntaxSpans = tempDiv.querySelectorAll('span[class^="hljs-"]');
    syntaxSpans.forEach(span => {
      const colorMap = {
        'hljs-keyword': '#d73a49',
        'hljs-string': '#032f62',
        'hljs-comment': '#6a737d',
        'hljs-function': '#6f42c1',
        'hljs-number': '#005cc5',
        'hljs-operator': '#d73a49',
        'hljs-title': '#6f42c1',
        'hljs-params': '#24292e'
      };
      const className = Array.from(span.classList).find(c => c.startsWith('hljs-'));
      if (className && colorMap[className]) {
        span.style.color = colorMap[className];
      }
    });

    // 3. Handle Blockquotes
    const quotes = tempDiv.querySelectorAll('blockquote');
    quotes.forEach(quote => {
      quote.style.borderLeft = '4px solid #dfe2e5';
      quote.style.paddingLeft = '16px';
      quote.style.color = '#6a737d';
      quote.style.margin = '0 0 16px 0';
    });

    // 4. Handle Charts (SVG to Image) - Sequential processing to avoid memory/IPC overflow
    const svgWrappers = Array.from(tempDiv.querySelectorAll('.mermaid-svg-wrapper, .mermaid, svg[id^="mermaid-"], svg.mermaid-svg'));
    const realWrappers = sourceContainer ? Array.from(sourceContainer.querySelectorAll('.mermaid-svg-wrapper, .mermaid, svg[id^="mermaid-"], svg.mermaid-svg')) : [];
    
    logs.push(`- Found ${svgWrappers.length} charts to process`);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < svgWrappers.length; i++) {
      const progress = Math.round(((i + 1) / svgWrappers.length) * 100);
      const statusMsg = `Processing charts: ${i + 1}/${svgWrappers.length}...`;
      
      if (window.showToast) {
        window.showToast(statusMsg, 'info', { 
          id: 'gdoc-copy', 
          sticky: true,
          progress: progress
        });
      }

      const wrapper = svgWrappers[i];
      const realWrapper = realWrappers[i];
      
      const svgInTemp = wrapper.tagName === 'svg' ? wrapper : wrapper.querySelector('svg');
      const svgInReal = realWrapper ? (realWrapper.tagName === 'svg' ? realWrapper : realWrapper.querySelector('svg')) : null;
      const targetSvg = svgInReal || svgInTemp;
      
      if (targetSvg) {
        const start = Date.now();
        try {
          const imgData = await _svgToPng(targetSvg);
          const img = document.createElement('img');
          img.src = imgData;
          img.style.maxWidth = '100%';
          img.style.display = 'block';
          img.style.margin = '16px auto';
          
          wrapper.parentNode.replaceChild(img, wrapper);
          successCount++;
          const entry = `  [✓] Chart #${i + 1}: Success (${Date.now() - start}ms)`;
          logs.push(entry);
          console.warn(entry); // Real-time console feedback
        } catch (err) {
          failCount++;
          const entry = `  [✗] Chart #${i + 1}: Failed (${err.message})`;
          logs.push(entry);
          console.warn(entry); // Real-time console feedback
          console.warn(`[GDOC DEBUG] Detailed error for SVG #${i + 1}:`, err);
        }
      }
    }

    const finalHtml = tempDiv.innerHTML;
    logs.push(`- Final HTML Size: ${Math.round(finalHtml.length / 1024)} KB`);
    logs.push(`- Total Result: ${successCount} success, ${failCount} failed`);
    logs.push(`[GDoc Smart Copy] Finished at ${new Date().toLocaleTimeString()}`);
    
    // Final consolidated log
    console.warn(`\n=== GDOC COPY SUMMARY ===\n${logs.join('\n')}\n=========================`);

    return { 
      html: finalHtml, 
      successCount, 
      failCount, 
      totalCount: svgWrappers.length 
    };
  }

  /**
   * Converts an SVG element to a PNG Data URL.
   * @private
   */
  async function _svgToPng(svgElement) {
    // 1. Get dimensions from the ORIGINAL visible element
    const rect = svgElement.getBoundingClientRect();
    const width = rect.width || 100;
    const height = rect.height || 50;

    // 2. Clone and Inline Styles
    const clone = svgElement.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', width);
    clone.setAttribute('height', height);
    
    // Set rendering hints on the root
    clone.style.textRendering = 'geometricPrecision';

    const sourceElements = svgElement.querySelectorAll('*');
    const cloneElements = clone.querySelectorAll('*');
    for (let i = 0; i < sourceElements.length; i++) {
      const source = sourceElements[i];
      const target = cloneElements[i];
      const computed = window.getComputedStyle(source);
      
      // Safe style properties for SVG elements
      // IMPORTANT: Never include 'transform' here as it breaks SVG attribute-based positioning
      const styleProps = [
        'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 
        'font-size', 'font-weight', 'font-style',
        'opacity', 'color', 'display', 'text-anchor', 
        'dominant-baseline', 'alignment-baseline', 'letter-spacing'
      ];
      
      for (const prop of styleProps) {
        const val = computed.getPropertyValue(prop);
        if (val) target.style.setProperty(prop, val);
      }

      // Special handling for text to prevent clipping without breaking layout
      const isText = source.tagName === 'text' || source.tagName === 'tspan' || computed.display === 'inline' || source.closest('foreignObject');
      if (isText) {
        // Force a stable font and prevent wrapping
        target.style.fontFamily = 'Arial, sans-serif';
        target.style.whiteSpace = 'pre';
      } else {
        // For non-text elements, just sync the original font-family if it exists
        const font = computed.getPropertyValue('font-family');
        if (font) target.style.fontFamily = font;
      }
    }

    // 3. High-Quality Canvas Rasterization (Renderer-side)
    // We do this in the renderer because only the browser engine can correctly layout and render complex SVGs.
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('SVG rasterization timeout (5s)')), 5000);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Use 2.0 scale for Retina quality without bloating clipboard
      const scale = 2; 

      canvas.width = width * scale;
      canvas.height = height * scale;
      
      // Ensure SVG has correct dimensions and preserve original viewBox to prevent clipping
      const originalViewBox = svgElement.getAttribute('viewBox');
      if (originalViewBox) {
        clone.setAttribute('viewBox', originalViewBox);
      } else {
        clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
      
      clone.setAttribute('width', width * scale);
      clone.setAttribute('height', height * scale);
      
      const optimizedSvgData = new XMLSerializer().serializeToString(clone);
      
      // Use Base64 Data URL instead of Blob to avoid "Tainted Canvas" security errors
      // unescape(encodeURIComponent()) ensures Unicode characters are handled correctly
      const encodedData = window.btoa(unescape(encodeURIComponent(optimizedSvgData)));
      const dataUrl = `data:image/svg+xml;base64,${encodedData}`;

      img.onload = () => {
        clearTimeout(timeout);
        try {
          // Add dark background for consistent look in Google Docs
          ctx.fillStyle = '#1e1e1e';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const result = canvas.toDataURL('image/png');
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = (err) => {
        clearTimeout(timeout);
        reject(new Error(`SVG render failed: ${err.message || 'Check SVG syntax'}`));
      };
      
      img.src = dataUrl;
    });
  }

  return {
    transform
  };
})();

// Export to window
window.GDocUtil = GDocUtil;

```
</file>

<file path="renderer/js/utils/mermaid.js">
```js
/* ============================================================
   mermaid.js — Mermaid diagram init and rendering
   processMermaid() is called from app.js after file load.
   setupMermaidClicks() wires diagrams to openZoom() from zoom.js.
   ============================================================ */

(() => {
'use strict';

function initMermaid() {
  if (typeof mermaid === 'undefined') return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor:        '#ffbf48',
      primaryTextColor:    '#000000',
      primaryBorderColor:  '#e6a800',
      lineColor:           '#aaaaaa',
      secondaryColor:      '#2a2a3e',
      tertiaryColor:       '#1d1d2e',
      mainBkg:             '#2d2d42',
      nodeBorder:          '#5a5a7a',
      clusterBkg:          'rgba(255,255,255,0.04)',
      titleColor:          '#ffffff',
      edgeLabelBackground: '#1a1a2e',
      fontFamily:          'Inter, sans-serif'
    }
  });
}

async function processMermaid(container) {
  if (typeof mermaid === 'undefined') return;
  const nodes = [];
  container.querySelectorAll('pre > code.language-mermaid').forEach(el => {
    const content = el.textContent.trim();
    if (!content) return; // Skip empty blocks

    const wrapper = document.createElement('div');
    wrapper.className = 'mermaid';
    wrapper.textContent = content;
    
    // ── Defensive: Force stable width if inside Project Map ──
    // Mermaid's layout engine crashes if it detects the tiny scaled dimensions of the mini-map.
    if (container.closest('.ds-project-map__mirror') || container.classList.contains('ds-project-map__mirror')) {
      wrapper.style.width = '800px';
      wrapper.style.overflow = 'hidden';
    }

    el.closest('pre').replaceWith(wrapper);
    nodes.push(wrapper);
  });

  if (nodes.length > 0) {
    // ── Defensive: Wait for next frame to ensure DOM layout is ready ──
    await new Promise(resolve => requestAnimationFrame(resolve));

    try {
      // ── Defensive: Only process nodes that are actually in the document and have dimensions ──
      const activeNodes = nodes.filter(node => {
        if (!document.body.contains(node)) return false;
        
        // Use offsetWidth/Height to ensure the element is actually laid out and visible
        // If it's 0, Mermaid's layout engine (D3) will often produce NaN/undefined
        const style = window.getComputedStyle(node);
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && node.offsetWidth > 0;
        
        return isVisible;
      });

      if (activeNodes.length > 0) {
        await mermaid.run({ nodes: activeNodes });
        setupMermaidClicks(container);
      }
    } catch (err) {
      console.warn('Mermaid render error (prevented crash):', err);
    }
  }
}

function setupMermaidClicks(container) {
  container.querySelectorAll('.mermaid').forEach(div => {
    div.onclick = () => window.openZoom(div);
  });
}

window.initMermaid = initMermaid;
window.processMermaid = processMermaid;

})();

```
</file>

<file path="renderer/js/utils/scroll.js">
```js
/**
 * ScrollModule — Persists and restores scroll positions for files
 */
const ScrollModule = (() => {
  const STORAGE_KEY = 'md-scroll-positions';
  let positions = {};

  let scrollContainer = null;

  function init() {
    // Load from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        positions = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load scroll positions', e);
    }
    
    // Save on app close
    window.addEventListener('beforeunload', () => {
      const ws = AppState.currentWorkspace;
      if (AppState.currentFile && ws && scrollContainer) {
        const key = `${ws.id}:${AppState.currentFile}`;
        positions[key] = scrollContainer.scrollTop;
        _persist();
      }
    });
  }

  /**
   * Set the element to watch for scroll events
   * @param {HTMLElement} el 
   */

  let activeFileInContainer = null;

  function setContainer(el, filePath) {
    if (!el) return;
    
    scrollContainer = el;
    if (filePath) activeFileInContainer = filePath;

    // Use a robust way to ensure only one listener exists
    if (!el._scrollListenerAttached) {
      el.addEventListener('scroll', _debounce(() => {
        const ws = AppState.currentWorkspace;
        const currentFile = activeFileInContainer;
        
        if (currentFile && ws && el && !window._isMDViewerRendering && !window._isGlobalSyncing && !window._suppressScrollSync) {
          const currentScroll = el.scrollTop;
          const key = `${ws.id}:${currentFile}`;

          if (currentScroll === 0 && positions[key] > 0) {
             if (window._isMDViewerRendering) {
               return;
             }
             if (el.scrollHeight > 0 && el.scrollHeight <= el.clientHeight) {
               return;
             }
          }

          if (currentScroll > 0 || positions[key] !== undefined) {
             positions[key] = currentScroll;
             _persist();
          }
        }
      }, 150));
      el._scrollListenerAttached = true;
    }
  }

  /**
   * Manually save current scroll position for a specific file
   */
  function save(filePath) {
    const ws = AppState.currentWorkspace;
    const container = scrollContainer || document.getElementById('md-viewer-mount');
    
    if (container && filePath && ws) {
      const currentScroll = container.scrollTop;
      const key = `${ws.id}:${filePath}`;
      
      // SMART GUARD: If current is 0, but we have a saved position > 0, 
      // and we are currently in a rendering/transition state, PROTECT the saved value.
      if (currentScroll === 0 && positions[key] > 0) {
        if (window._isMDViewerRendering) {
          return;
        }
        
        if (container.scrollHeight > 0 && container.scrollHeight <= container.clientHeight) {
           return;
        }
      }

      positions[key] = currentScroll;
      _persist();
    }
  }

  /**
   * Restore scroll position for a file
   */
  function restore(filePath) {
    const ws = AppState.currentWorkspace;
    const container = scrollContainer || document.getElementById('md-viewer-mount');
    
    if (!container || !ws || !filePath) return;
    
    const key = `${ws.id}:${filePath}`;
    const pos = positions[key];
    
    if (pos !== undefined && pos > 0) {
      if (container._scrollObserver) {
        container._scrollObserver.disconnect();
      }

      let attempts = 0;
      const maxAttempts = 15;
      
      const tryScroll = () => {
        if (!container) return true;
        const canScrollToTarget = container.scrollHeight >= pos + container.clientHeight - 5;
        
        if (canScrollToTarget || attempts >= maxAttempts) {
          container.scrollTop = pos;
          if (container._scrollObserver) {
            container._scrollObserver.disconnect();
            container._scrollObserver = null;
          }
          return true;
        }
        attempts++;
        return false;
      };

      if (tryScroll()) return;

      container._scrollObserver = new ResizeObserver(() => {
        if (tryScroll()) return;
      });
      container._scrollObserver.observe(container);
      
      const fallback = () => {
         if (!tryScroll() && attempts < maxAttempts) {
           requestAnimationFrame(fallback);
         }
      };
      requestAnimationFrame(fallback);
    } else {
      if (container) container.scrollTop = 0;
    }
  }

  function _persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
      if (typeof AppState !== 'undefined' && AppState.savePersistentState) {
        AppState.savePersistentState();
      }
    } catch (e) {
      console.error('Failed to persist scroll positions', e);
    }
  }

  function _debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Remove scroll position for a specific file in current workspace
   */
  function remove(filePath) {
    const ws = AppState.currentWorkspace;
    const key = ws ? `${ws.id}:${filePath}` : filePath;
    
    if (positions[key] !== undefined) {
      delete positions[key];
      _persist();
    }
  }

  /**
   * Clear all scroll positions for a specific workspace
   */
  function clearForWorkspace(wsId) {
    const prefix = `${wsId}:`;
    Object.keys(positions).forEach(key => {
      if (key.startsWith(prefix)) {
        delete positions[key];
      }
    });
    _persist();
  }

  function clear() {
    positions = {};
    _persist();
  }

  return { init, setContainer, save, restore, remove, clear, clearForWorkspace };
})();

// Export to global scope
window.ScrollModule = ScrollModule;

```
</file>

<file path="renderer/js/utils/zoom.js">
```js
/* ============================================================
   zoom.js — Mermaid diagram zoom modal
   Handles pan, zoom, wheel zoom, and close interactions.
   openZoom() is a global called from mermaid.js
   ============================================================ */

(() => {
'use strict';

let zoomScale = 1, zoomX = 0, zoomY = 0;
let zoomMoving = false, zoomStartX = 0, zoomStartY = 0;
let _zoomNatW = 0, _zoomNatH = 0;

function renderZoomModal() {
  if (document.getElementById('zoom-modal')) return;
  const icon = (path) => `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  const el = document.createElement('div');
  el.id = 'zoom-modal';
  el.innerHTML = `
    <button id="zoom-close" title="Close (Esc)">
      ${icon('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>')}
    </button>
    <div id="zoom-container"></div>
    <div id="zoom-controls-bar">
      <button class="zoom-ctrl-btn" id="zoom-fit-btn" title="Fit to screen">
        ${icon('<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>')}
      </button>
      <div class="zoom-ctrl-divider"></div>
      <button class="zoom-ctrl-btn" id="zoom-out-btn" title="Zoom out">
        ${icon('<line x1="5" y1="12" x2="19" y2="12"/>')}
      </button>
      <span id="zoom-pct">100%</span>
      <button class="zoom-ctrl-btn" id="zoom-in-btn" title="Zoom in">
        ${icon('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>')}
      </button>
      <div class="zoom-ctrl-divider"></div>
      <button class="zoom-ctrl-btn" id="zoom-copy-btn" title="Copy SVG code">
        ${icon('<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>')}
      </button>
    </div>`;
  document.body.appendChild(el);
}

function updateZoomTransform() {
  const el = document.getElementById('zoom-container');
  if (el) el.style.transform = `translate(${zoomX}px, ${zoomY}px) scale(${zoomScale})`;
}

function updateZoomPercent() {
  const pct = document.getElementById('zoom-pct');
  if (pct) pct.textContent = Math.round(zoomScale * 100) + '%';
}

function fitZoom() {
  if (!_zoomNatW || !_zoomNatH) return;
  const padX = 80, padY = 130;
  const scaleX = (window.innerWidth  - padX * 2) / _zoomNatW;
  const scaleY = (window.innerHeight - padY * 2) / _zoomNatH;
  zoomScale = Math.min(scaleX, scaleY);
  zoomX = (window.innerWidth  - _zoomNatW * zoomScale) / 2;
  zoomY = (window.innerHeight - _zoomNatH * zoomScale) / 2;
  updateZoomTransform();
  updateZoomPercent();
}

function openZoom(mermaidDiv) {
  const svg = mermaidDiv.querySelector('svg');
  if (!svg) return;

  const modal     = document.getElementById('zoom-modal');
  const container = document.getElementById('zoom-container');
  container.innerHTML = '';

  const clone = svg.cloneNode(true);
  const rect  = svg.getBoundingClientRect();
  const vb    = svg.viewBox?.baseVal;

  _zoomNatW = (vb && vb.width  > 0) ? vb.width  : (rect.width  || 800);
  _zoomNatH = (vb && vb.height > 0) ? vb.height : (rect.height || 600);

  clone.setAttribute('width',  _zoomNatW);
  clone.setAttribute('height', _zoomNatH);
  clone.style.cssText = `width:${_zoomNatW}px;height:${_zoomNatH}px;display:block;`;

  container.appendChild(clone);
  modal.classList.add('show');

  // Fit after paint so viewport dimensions are accurate
  requestAnimationFrame(fitZoom);
}

function closeZoom() {
  document.getElementById('zoom-modal').classList.remove('show');
}

function initZoom() {
  renderZoomModal();
  document.getElementById('zoom-close')  ?.addEventListener('click', closeZoom);
  document.getElementById('zoom-fit-btn')?.addEventListener('click', fitZoom);

  document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
    zoomScale = Math.min(10, zoomScale * 1.3);
    zoomX = (window.innerWidth  - _zoomNatW * zoomScale) / 2;
    zoomY = (window.innerHeight - _zoomNatH * zoomScale) / 2;
    updateZoomTransform(); updateZoomPercent();
  });

  document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
    zoomScale = Math.max(0.05, zoomScale / 1.3);
    zoomX = (window.innerWidth  - _zoomNatW * zoomScale) / 2;
    zoomY = (window.innerHeight - _zoomNatH * zoomScale) / 2;
    updateZoomTransform(); updateZoomPercent();
  });

  document.getElementById('zoom-copy-btn')?.addEventListener('click', () => {
    const container = document.getElementById('zoom-container');
    const svg = container.querySelector('svg');
    if (svg) {
      const svgData = svg.outerHTML;
      navigator.clipboard.writeText(svgData).then(() => {
        if (typeof showToast === 'function') showToast('SVG copied to clipboard');
      });
    }
  });

  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeZoom(); });

  const modal = document.getElementById('zoom-modal');
  if (!modal) return;

  // Pan with mouse drag
  modal.addEventListener('mousedown', e => {
    if (e.target.closest('#zoom-close') || e.target.closest('#zoom-controls-bar')) return;
    zoomMoving = true;
    zoomStartX = e.clientX - zoomX;
    zoomStartY = e.clientY - zoomY;
  });
  window.addEventListener('mousemove', e => {
    if (!zoomMoving) return;
    zoomX = e.clientX - zoomStartX;
    zoomY = e.clientY - zoomStartY;
    updateZoomTransform();
  });
  window.addEventListener('mouseup', () => { zoomMoving = false; });

  // Comment sidebar resizer logic has been moved to comments.js

  // Wheel zoom toward cursor
  modal.addEventListener('wheel', e => {
    e.preventDefault();
    const factor   = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newScale = Math.min(10, Math.max(0.05, zoomScale * factor));
    const xs = (e.clientX - zoomX) / zoomScale;
    const ys = (e.clientY - zoomY) / zoomScale;
    zoomScale = newScale;
    zoomX = e.clientX - xs * zoomScale;
    zoomY = e.clientY - ys * zoomScale;
    updateZoomTransform();
    updateZoomPercent();
  }, { passive: false });
}

window.openZoom = openZoom;
window.initZoom = initZoom;

})();

```
</file>

<file path="renderer/testing/sync-unit-test.js">
```js
/**
 * High-Fidelity Sync Unit Test for MDpreview
 * Focuses on extreme scenarios for Selection & Click synchronization.
 */

(async function() {
  const results = [];
  const assert = (condition, message) => {
    results.push({ success: !!condition, message });
    console.log(`[SYNC-TEST] ${condition ? '✅' : '❌'} ${message}`);
  };

  console.log('--- Starting Sync Fidelity Tests ---');

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // Mock Editor State
  const mockMarkdown = `
# Title
Line 2
Line 3
## **Section 1: Special Characters (Parentheses)**
This is a test with (inventory) and [links](https://google.com).
Wait, **Bold Text** is here.
More content...

## Section 2: Duplicate Content
Item A: Target 1
Item B: Something else
Item A: Target 1

## Section 3: Large Drift Gap
${'\n'.repeat(50)}
Target Line far away
`;

  try {
    // PREPARE: Inject content into Editor and Read View
    if (typeof EditorModule !== 'undefined') {
       const textarea = document.getElementById('edit-textarea');
       if (textarea) {
         textarea.value = mockMarkdown;
       }
    }
    const mdContent = document.getElementById('md-content');
    if (mdContent) {
      mdContent.style.display = 'block'; // CRITICAL: Must be visible to measure rects
      mdContent.innerHTML = `
        <div data-line="1" style="height: 500px; display: block;">Title</div>
        <div data-line="5" style="height: 500px; display: block;">Section 1</div>
        <div data-line="60" style="height: 500px; display: block;">Target Line</div>
      `;
    }

    // TEST 1: Fuzzy Match with Markdown Syntax (Stars/Hashes)
    console.log('Running Test 1: Markdown Syntax Matching...');
    const syncData1 = {
      line: 5,
      selectionText: "Section 1: Special Characters (Parentheses)",
      offset: 0
    };
    if (typeof EditorModule !== 'undefined') {
      EditorModule.focusWithContext(syncData1);
      const textarea = document.getElementById('edit-textarea');
      const sel = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      // Check if we found the text and it's inside the expected header
      const contextBefore = textarea.value.substring(textarea.selectionStart - 10, textarea.selectionStart);
      assert(sel.includes("Section 1") && contextBefore.includes("##"), 
        "Matched header correctly despite Markdown bold/header syntax.");
    }

    // TEST 2: Multi-word Drift Match
    console.log('Running Test 2: Drift Match (Renderer line 500 -> Actual line 60)...');
    const syncData2 = {
      line: 500, // Massive drift
      selectionText: "Target Line far away",
      offset: 0
    };
    if (typeof EditorModule !== 'undefined') {
      EditorModule.focusWithContext(syncData2);
      const textarea = document.getElementById('edit-textarea');
      const sel = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      assert(sel === "Target Line far away", "Found target text despite 400+ line drift.");
    }

    // TEST 3: Duplicate Content Logic
    // Should prioritize the one near the line number
    console.log('Running Test 3: Duplicate Content Ambiguity...');
    const syncData3 = {
      line: 13, // Near the second "Item A: Target 1"
      selectionText: "Item A: Target 1"
    };
    if (typeof EditorModule !== 'undefined') {
      EditorModule.focusWithContext(syncData3);
      const textarea = document.getElementById('edit-textarea');
      // Line 13 is near the end
      assert(textarea.selectionStart > mockMarkdown.length / 2, "Found the correct instance of duplicate text based on line proximity.");
    }

    // TEST 4: Click Sync (Context Anchor)
    console.log('Running Test 4: Edit-to-Read Context Anchor...');
    const barInstance = (typeof ChangeActionViewBar !== 'undefined' && ChangeActionViewBar.getInstance) 
      ? ChangeActionViewBar.getInstance() 
      : null;

    if (barInstance) {
       // Mock a cursor position in Editor at "Bold Text"
       const textarea = document.getElementById('edit-textarea');
       const pos = mockMarkdown.indexOf('Bold Text');
       textarea.setSelectionRange(pos, pos); // No selection, just cursor
       
       const syncData = barInstance.captureEditorSyncData();
       assert(syncData.selectionText === "Wait, Bold Text is here.", "Captured line context correctly when no text is selected.");
    }

    // TEST 5: Real Selection Identification
    console.log('Running Test 5: Real Selection Verification...');
    if (barInstance) {
       const textarea = document.getElementById('edit-textarea');
       textarea.setSelectionRange(10, 20); // Select 10 characters
       const syncData = barInstance.captureEditorSyncData();
       assert(syncData.isRealSelection === true, "Correctly identified real text selection.");
    }

    // TEST 6: Cursor Only Identification
    console.log('Running Test 6: Cursor Only Verification...');
    if (barInstance) {
       const textarea = document.getElementById('edit-textarea');
       textarea.setSelectionRange(15, 15); // Cursor only
       const syncData = barInstance.captureEditorSyncData();
       assert(syncData.isRealSelection === false, "Correctly identified cursor-only (no selection).");
    }

    // TEST 7: Scroll-only Fallback (No selection, No click)
    console.log('Running Test 7: Scroll-only Fallback Verification...');
    if (barInstance) {
       // Reset state
       barInstance.lastClickedLine = null;
       window.getSelection().removeAllRanges();
       
       const syncData = barInstance.captureReadViewSyncData();
       // It should return the line number of the first visible element in the viewer
       assert(syncData.line > 0, `Correctly fell back to top visible line: ${syncData.line}`);
    }

    console.log('--- Sync Fidelity Tests Completed ---');
    console.table(results);

  } catch (err) {
    console.error('Test Suite Failed:', err);
  }
})();

```
</file>

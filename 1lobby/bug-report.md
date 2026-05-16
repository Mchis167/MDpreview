# Bug Report: Monaco Editor — Typing Blocked on Empty Model After Focus (Electron)

## Environment

- **Monaco Editor**: (check `node_modules/monaco-editor/package.json`)
- **Electron**: renderer process (Chromium-based)
- **Monaco init options**: `editContext: false, experimentalEditContextEnabled: false` (forced TextArea strategy)
- **Framework**: Vanilla JS (no framework wrapper)

---

## Summary

After calling `editor.focus()` on a Monaco instance that contains an **empty model** (`getValue() === ''`), typing produces no characters. The `input` and `beforeinput` DOM events never fire on the Monaco textarea despite the textarea being fully focused and editable. Paste works as a workaround.

---

## Repro Steps

1. Create a Monaco editor instance with an empty model (`value: ''`).
2. Call `editor.focus()` programmatically (e.g., inside a `requestAnimationFrame` after mounting the editor into the DOM).
3. Try typing any character.
4. **Nothing appears in the editor.**

### Consistent repro pattern

| Scenario | Result |
|---|---|
| New empty file → `focus()` → type | ❌ Blocked |
| File with content → `focus()` → type | ✅ Works |
| Blocked empty file → paste text | ✅ Unblocked |
| Blocked empty file → switch window & back → type | ✅ Unblocked |
| Blocked empty file → open another file → return | ❌ Still blocked |

---

## What We've Confirmed (Diagnostics)

Via DOM event spies added immediately after `focus()`:

```js
const _domNode = editor.getDomNode();
const _textarea = _domNode.querySelector('textarea');

// Spies attached right after editor.focus()
_textarea.addEventListener('keydown', (e) => {
  console.log('keydown bubbled', { key: e.key, defaultPrevented: e.defaultPrevented });
}, false);

_textarea.addEventListener('beforeinput', (e) => {
  console.log('beforeinput FIRED', { data: e.data });
}, true);

_textarea.addEventListener('input', (e) => {
  console.log('input FIRED', { value: _textarea.value });
}, true);
```

**Results after typing several keys:**

```
// keydown bubbles — OS/Electron IS delivering keys
keydown bubbled { key: 'm', defaultPrevented: false }
keydown bubbled { key: 'a', defaultPrevented: false }
keydown bubbled { key: 'r', defaultPrevented: false }

// beforeinput → NEVER FIRES
// input → NEVER FIRES
```

**textarea state right after `focus()`:**
```js
{
  activeElement: 'TEXTAREA',     // ✅ textarea IS the active element
  value: '',                     // ✅ empty string (not '\n')
  readOnly: false,               // ✅ not read-only
  disabled: false,               // ✅ not disabled
  selectionStart: 0,
  selectionEnd: 0
}
```

**Monaco `onKeyDown` fires** (confirmed via `editor.onKeyDown` listener):
```js
editor.onKeyDown((e) => {
  console.log('Monaco onKeyDown', { keyCode: e.keyCode, modelVersion: editor.getModel().getVersionId() });
});
// → fires for every key, but modelVersion stays frozen
```

**`onDidChangeContent` never fires** during typing — model version never increments.

---

## What Works as Workaround

1. **Paste** (`Cmd+V` / `Ctrl+V`): bypasses TextAreaHandler, calls `model.pushEditOperations()` directly → model changes → `writeScreenReaderContent()` re-syncs → typing works afterward.

2. **Window blur + focus** (Alt+Tab away and back): restores normal typing.

3. **`editor.trigger('keyboard', 'type', { text: 'x' })`** followed by **`editor.trigger('keyboard', 'deleteLeft', {})`**: temporarily unblocks (model version increments), but `deleteLeft` on empty model triggers another `writeScreenReaderContent()` call which re-introduces the broken state.

---

## Root Cause Hypothesis

The browser receives `keydown` (confirmed) but does NOT generate `beforeinput`/`input`. This means the browser's text input pipeline is not engaged for this textarea despite:

- `document.activeElement === textarea` ✅
- `textarea.readOnly === false` ✅
- `textarea.disabled === false` ✅
- `e.defaultPrevented === false` on keydown ✅

**Possible causes being investigated:**

### 1. Monaco IME composition stuck (`_isDoingComposition = true`)

Monaco's `TextAreaInput._isDoingComposition` flag, if `true`, suppresses `_onType()`. If a composition session was started during `setValue()` calls and never ended, the internal state would block processing. However, `beforeinput` not firing at all suggests the issue is at the browser level, not Monaco handler level.

### 2. `editContext: false` incompatibility with current Chromium

`editContext: false` + `experimentalEditContextEnabled: false` forces the legacy TextArea strategy. In Chromium 115+, the browser defaults to the `EditContext` API for text input. Forcing TextArea strategy while Chromium tries to use EditContext may break the input event pipeline silently.

### 3. `writeScreenReaderContent()` internal state mismatch

After `focus()` on an empty model, Monaco's `writeScreenReaderContent()` may write a placeholder into `_textAreaState.value` (internal, not DOM). When the user types, Monaco's `_onType()` diffs `_textAreaState.value` against `textarea.value` — an invalid diff on an empty model produces no edit operation, and the browser may suppress `input` if no actual DOM mutation occurs.

---

## Monaco Init Code

```js
this._editor = monaco.editor.create(containerEl, {
  value: '',
  language: 'markdown',
  theme: 'vs',
  readOnly: false,
  editContext: false,                      // forced TextArea strategy
  experimentalEditContextEnabled: false,   // forced TextArea strategy
});
```

---

## Focus Code (inside requestAnimationFrame, after editor mount)

```js
requestAnimationFrame(() => {
  const _domNode = editor.getDomNode();
  const _textarea = _domNode?.querySelector('textarea');

  if (_textarea) _textarea.blur();  // blur first to reset focus state
  editor.focus();                   // refocus via Monaco API

  // After this: textarea IS activeElement, but beforeinput/input never fire on typing
});
```

---

## Questions

1. **Is there a known issue with Monaco's TextArea strategy on empty models after programmatic focus in Electron/Chromium?**

2. **Does removing `editContext: false` (allowing EditContext API) fix this?** (Added as a workaround for a separate bug — we haven't tested removing it.)

3. **Is `_isDoingComposition` accessible and resettable?** e.g.:
   ```js
   editor._modelData?.view?._textAreaInput?._isDoingComposition = false;
   ```

4. **Is there a public Monaco API to force-sync the TextAreaState after focus?** (equivalent of calling `writeScreenReaderContent()` manually)

5. **Why would `beforeinput` not fire for a focused, editable, non-prevented textarea in Chromium?** This should not be possible outside of IME composition or EditContext conflicts.

---

## Tags (for Stack Overflow / GitHub Issues)

`monaco-editor` `electron` `textarea` `focus` `input-event` `beforeinput` `empty-model` `editcontext` `textatrea-input`

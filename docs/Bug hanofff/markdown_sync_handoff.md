# 🔄 MDpreview: Markdown Sync Handoff Document

## 1. Project Objective
Achieve pixel-perfect, drift-free synchronization between **Read Mode** (HTML) and **Edit Mode** (Textarea) in a Markdown editor, specifically handling complex elements like Mermaid diagrams and Vietnamese Unicode.

---

## 2. Current Status Summary

### ✅ Successes (Ready to Use)
1.  **Recursive Deep Sanitization**: Logic in `extractCleanText` effectively filters out UI artifacts (buttons, SVGs, internal `<style>`/`<defs>` tags) to provide a "pure" text seed for matching.
2.  **Triple-Word Anchor Strategy**: Replaced naive "longest word" fallback with a sequence of 3 consecutive words. This provides statistically unique anchors, preventing jumps to generic words (e.g., "trong", "session").
3.  **Self-Correction Engine**: The system identifies when the Renderer's `data-line` diverges from the Source's line number, logs the delta, and updates the "Ground Truth" for accurate Mirror-DIV measurements.
4.  **Vietnamese Unicode Support**: Regex patterns now use `\p{L}` (Unicode Letter) and the `u` flag, ensuring diacritics don't break word matching.

### ⚠️ Remaining Blockers (The "Pain Points")
1.  **Infinite Sync Loop**: There is an oscillation between `updateUI` (Read->Edit) and Editor events (Edit->Read). Even with `window._isGlobalSyncing` guards, event-driven updates are still triggering redundant captures.
2.  **Diagram Displacement**: Mermaid diagrams render asynchronously. They expand *after* the initial scroll, pushing the target element out of the viewport center. The current "Secondary Re-alignment" is a temporary patch but not a 100% fix.

---

## 3. Key Architecture

### `renderer/js/services/markdown-logic-service.js`
*   **Purpose**: Headless logic.
*   **Key Functions**:
    *   `syncCursor()`: The heart of the "Sandwich Strategy". It tries (1) Precise Match, (2) Triple-Word Anchor, (3) Global Fallback.
    *   `_calculatePixelYWithMirror()`: Uses a hidden "Mirror DIV" to calculate the exact pixel position of a character in the textarea for scrolling.

### `renderer/js/components/organisms/change-action-view-bar.js`
*   **Purpose**: Controller & UI.
*   **Key Logic**:
    *   `captureReadViewSyncData()`: Scans the DOM to find the element in the center of the screen and extracts its cleaned text context.
    *   `scrollReadViewToLine()`: Uses "Keyword Density Scoring" to find the target HTML element when switching from Edit to Read.

---

## 4. Recommended Next Steps for Successor

### Step 1: Kill the Sync Loop
*   The `requestAnimationFrame` in `syncCursor` might be triggering a scroll event that `MarkdownViewerComponent` is listening to.
*   **Action**: Implement a "Quiet Period" (e.g., 1000ms) where all scroll listeners are explicitly detached during mode transitions.

### Step 2: Handle "Mermaid Ready" Event
*   Don't just scroll twice. Listen for a custom event like `mermaid:rendered`.
*   **Action**: In `MarkdownLogicService`, defer the final `scrollIntoView` until all async elements in the target view have reported their final heights.

### Step 3: Refine Mirror-DIV Styles
*   The current Mirror-DIV copies standard styles, but doesn't always account for scrollbar width or dynamic line-heights.
*   **Action**: Log the `computedStyle` of the Textarea vs Mirror-DIV to ensure they are identical down to the sub-pixel.

---

## 5. Debugging Tools
All sync actions are tagged with `📸 Sync Tracer` and `🔄 Sync Tracer`. 
*   Look for `✨ Triple Anchor Found` to verify matching accuracy.
*   Look for `🛑 Match rejected` to see when the Sanity Check saved the view from a "hallucinated" jump.

---
*Document prepared by Antigravity AI — 2026-04-25*

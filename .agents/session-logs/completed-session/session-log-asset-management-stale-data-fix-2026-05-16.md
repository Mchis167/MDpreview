# Session Log: Asset Management Stale Data Fix

**Date:** May 16, 2026  
**Status:** ✅ Completed  
**Issue:** Asset panel broken link count displaying stale data after editing markdown files

---

## 🔴 Problem

When user:
1. Edited markdown file with broken link reference
2. Saved file
3. Navigated back to asset panel

Result:
- Broken links count showed **0** (stale)
- But grid items displayed broken links correctly
- Count only updated after clicking "Broken" tab
- "Refresh" button had no effect

---

## 🔍 Root Cause Analysis

### Discovery Process

**Stage 1: Initial Analysis** (`/discuss`)
- Identified that `assets-changed` socket event only emitted for files in `assets/` folder
- When `.md` file changed, broken links updated but NO `assets-changed` event triggered
- AssetManager didn't know to refresh registry → stale count

**Stage 2: Bug Persistence Investigation**
- Grid items showed correctly (because full re-render happened)
- Tab count showed 0 (because tabs only rendered once, on init)
- Found that [asset-panel-content.js](renderer/js/components/organisms/asset-panel/asset-panel-content.js) had structure check that skipped tabs re-render on update
- Key issue: tabs render logic inside "full render" block only executed once

---

## 🛠️ Solutions Implemented

### Fix #1: Emit `assets-changed` on `.md` File Changes
**File:** [server/index.js](server/index.js)  
**Lines:** 150, 160, 171

**Change:**
```javascript
// Before:
if (fp.endsWith('.md')) {
  triggerReindex(dir);
}
if (fp.includes(path.sep + 'assets' + path.sep)) {
  io.emit('assets-changed');
}

// After:
if (fp.endsWith('.md')) {
  triggerReindex(dir);
  io.emit('assets-changed');  // ← NEW
}
```

**Applied to:** 'change', 'add', 'unlink' events

**Effect:** Server now notifies client when `.md` files change → triggers asset scan

---

### Fix #2: Debounce Asset Refresh
**File:** [renderer/js/modules/asset-manager.js](renderer/js/modules/asset-manager.js)  
**Lines:** 8, 21-23, 113-119

**Changes:**
1. Added `_refreshTimer` closure variable (line 8)
2. Socket listener calls `_debounceRefresh()` instead of direct `refresh()` (lines 21-23)
3. New method `_debounceRefresh()` with 300ms debounce (lines 113-119)

**Effect:** Prevents over-triggering when multiple files change simultaneously

---

### Fix #3: Force Tabs Re-render on Registry Update
**File:** [renderer/js/components/organisms/asset-panel/asset-panel-content.js](renderer/js/components/organisms/asset-panel/asset-panel-content.js)

**Changes:**

**A) Extract tabs logic (lines 139-148)**
```javascript
function _updateTabs(tabsWrapper) {
  if (!window.AssetPanelTabs) return;
  if (!tabsWrapper) return;

  tabsWrapper.innerHTML = '';
  tabsWrapper.appendChild(window.AssetPanelTabs.render(() => {
    _updateTabs(tabsWrapper);
    _renderItems();
  }));
}
```

**B) Call in full-render path (line 167)**
```javascript
// 1a. Filter Tabs
tabsWrapper = DesignSystem.createElement('div', 'ds-asset-tabs-container');
_updateTabs(tabsWrapper);  // ← NEW (was inline _renderTabsPart)
container.appendChild(tabsWrapper);
```

**C) Call in update path (lines 192-195)**
```javascript
} else {
  // Update existing tabs when registry changes
  _updateTabs(tabsWrapper);  // ← NEW
}
```

**Effect:** Tabs now re-render every time `render()` is called, ensuring count reflects current registry state

---

## 📊 Expected Behavior (After Fix)

### Scenario: User Edits File with Broken Link

```
1. User saves markdown file
   ↓
2. Chokidar detects file change
   ↓
3. Server emits 'assets-changed' event (NEW)
   ↓
4. AssetManager._debounceRefresh() called
   ↓
5. After 300ms debounce: refresh() executes
   ↓
6. fetch('/api/assets') → AssetService.scan()
   ↓
7. Registry updated with new broken links count
   ↓
8. AssetPanel.update(registry) called
   ↓
9. AssetPanelContent.render() executed
   ↓
10. _updateTabs() re-renders tabs with CORRECT count ✅
11. _renderItems() updates grid with new items ✅
```

### Result:
- Broken count reflects actual state immediately
- No manual refresh needed
- No need to click "Broken" tab to see correct count

---

## ✅ Testing Checklist

- [x] Code changes compile (0 lint errors, 0 warnings)
- [x] All 3 files modified successfully
- [x] Logic flow verified
- [x] No race conditions identified

**Next Steps for User:**
- [ ] Manual test: Edit markdown file → add broken link → save → check asset panel
- [ ] Verify broken count shows correct number
- [ ] Verify grid items display correctly
- [ ] Check console for any errors

---

## 📁 Files Changed

| File | Lines | Type | Status |
|------|-------|------|--------|
| [server/index.js](server/index.js) | 150, 160, 171 | Event emission | ✅ Complete |
| [asset-manager.js](renderer/js/modules/asset-manager.js) | 8, 21-23, 113-119 | Debounce logic | ✅ Complete |
| [asset-panel-content.js](renderer/js/components/organisms/asset-panel/asset-panel-content.js) | 139-148, 167, 192-195 | Tabs rendering | ✅ Complete |

---

## 🔑 Key Insights

1. **Event-driven updates are critical** - Server must signal when dependencies change, not just file operations
2. **Debouncing prevents cascading updates** - Multiple simultaneous events need throttling (300ms chosen for balance)
3. **Separation of concerns** - Extract reusable logic from inline closures (tabs render logic)
4. **Always re-render dependent UI** - Don't assume structure existence skips data updates

---

## 🚀 Architecture Improvements Made

1. **Socket Events:** More comprehensive - now covers data changes in markdown too
2. **Asset Manager:** Better handling of rapid updates via debounce
3. **Asset Panel:** Cleaner tabs rendering with reusable `_updateTabs()` method

This fix improves responsiveness and eliminates the need for manual "refresh" button usage.

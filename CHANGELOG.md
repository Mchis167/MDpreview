# Changelog

All notable changes to this project will be documented in this file.


## [Not Commited] — 2026-04-23 05:43

### Added
- **Inline Workspace Renaming**: Implemented seamless renaming by double-clicking the workspace name within the picker, featuring a focused input state and keyboard support (Enter/Esc).
- **Modernized Folder Browsing**: Integrated a native-feel folder picker in `WorkspaceFormComponent` using `webkitdirectory` for web fallbacks, eliminating manual path entry.
- **Ghost Folder Prevention**: Added `TreeModule.clear()` to ensure the sidebar file tree is instantly wiped during workspace transitions.

### Changed
- **Popover Shield Migration**: Fully transitioned Workspace Management from legacy modals to the premium Popover Shield Design System.
- **Standardized Action Buttons**: Migrated workspace delete buttons to the global `ds-item-delete-btn` class for unified hover aesthetics across the app.
- **Stateful UI Refresh**: Refactored `workspace.js` to use a dynamic `refreshContent` logic, ensuring the UI stays in sync after adding, renaming, or deleting workspaces.

### Removed
- **Legacy UI Pruning**: Deleted ~150 lines of obsolete rendering logic (`_renderList`), old event bindings, and redundant variables from `workspace.js`.
- **Deprecated Style Rules**: Removed workspace-specific delete/edit button CSS in favor of global Design System tokens.

### Fixed
- **Module Reference Errors**: Resolved multiple `ReferenceError` bugs (`_closeModal`, `_closePanel`) caused by deprecated modal function calls.
- **UI Synchronization**: Fixed a bug where the workspace listing failed to update its content after data modifications without a manual reload.

## [Not Commited] — 2026-04-23 03:05


### Added
- **Context-Aware Highlighting**: Implemented a robust "Global Offset" search logic in `comments.js` that uses surrounding text fingerprints to accurately distinguish between identical keywords, especially within complex structures like Markdown tables.
- **Line-Wide Selection Context**: Upgraded `_getSelectionContext` to capture surrounding text from the entire `.md-line` instead of just the immediate text node, ensuring uniqueness for short, repeated words.

### Changed
- **Optimized Comment Export**: Updated the `copyAll` feature to normalize whitespace and newlines in exported reports, producing a cleaner, more professional output while maintaining raw data for internal highlighting.
- **Component Modernization**: Refactored the `RightSidebarComponent` empty state to utilize the centralized `DesignSystem.getIcon` registry, ensuring reliable icon rendering.
- **Sidebar Search UI**: Refined `.sidebar-search-container` padding in `sidebar.css` to improve visual balance.

### Fixed
- **Highlight Visibility Gating**: Resolved a regression where comment highlights were visible in all application modes by removing redundant, ungated CSS rules in `markdown.css`.
- **DOM Runtime Error**: Fixed a `TypeError` in `_getSelectionContext` by ensuring `.closest()` is only called on Element nodes, correctly handling selections that start within Text nodes.

## [1.1.0] — 2026-04-23 01:40


### Added
- **Design System Icon Registry**: Implemented a central `ICONS` registry in `design-system.js` for instant, reliable SVG rendering without DOM scanning delays.
- **Icon Aliasing**: Added support for standard Lucide names (e.g., `trash-2`, `message-square`, `book-open`, `pen-line`) within the registry for better developer experience and compatibility.

### Changed
- **Sidebar Action Architecture**: Fully migrated Right Sidebar module headers to use the `DesignSystem.createHeaderAction` component, ensuring unified 48x48 action buttons.
- **Component Modernization**: Refactored `TabBarComponent` and `ChangeActionViewBarComponent` to utilize the new Icon Registry, eliminating "text-as-icon" rendering bugs and improving performance.
- **Floating Selection Triggers**: Updated `CommentsModule` and `CollectModule` triggers to use the registry, ensuring visual consistency and 100% rendering reliability.
- **Standardized Delete Styling**: Updated `ds-item-delete-btn` with unified padding and SVG injection via `DesignSystem.getIcon('x')`.

### Removed
- **Legacy SVG Constants**: Deleted dozens of redundant SVG string constants across `comments.js` and `collect.js`, significantly cleaning up the codebase.

### Fixed
- **Icon Rendering Regressions**: Resolved issues where icons (specifically `trash-2`) were displaying as raw text due to improper manual gán `innerHTML`.
- **Sidebar Header Alignment**: Refined Right Sidebar header padding (`0 0 0 16px`) and action group alignment to ensure a perfectly balanced, premium UI.

## [1.1.0] — 2026-04-23 01:15

### Added
- **Word-Level Highlighting**: Implemented precise, robust text range highlighting for both **Comments** and **Collect** (Bookmark) modules using a `DocumentFragment` wrapping system.
- **Auto-Fix Legacy Data**: Added a server-side routine to automatically repair null IDs in existing comment/bookmark files, ensuring data integrity.
- **Mode-Aware UI Filtering**: Implemented a `data-active-mode` gating system to only show relevant highlights (Comment vs Collect) when the specific mode is active.
- **Interactive Navigation**: Added automatic scrolling and pulse-highlight feedback when clicking on items in the Right Sidebar.
- **Floating Design System Triggers**: Restored and upgraded the floating `comment-trigger` and `collect-trigger` with premium Glassmorphism and animation.

### Changed
- **Right Sidebar Architecture**: Fully migrated `CommentsModule` and `CollectModule` to the unified `RightSidebar` (Organism) component, reducing redundant UI logic.
- **Design System Compliance**: Updated sidebar list items with `Roboto Mono` labels, `ds-text-clamp-5` for snippets, and consistent multi-layered shadows.

### Fixed
- **Comment Duplication Bug**: Resolved a critical regression where editing a comment created a duplicate record due to missing ID preservation in the frontend.
- **Web Version API Parity**: Fixed a server-side spread operator bug in the Express routes that caused ID corruption (`null` IDs) in the web environment.
- **Functional Sidebar Regressions**: Fixed missing SVG constants (`svgTrash`, `svgMsg`) and event binding failures in the sidebar boot sequence.
- **Interactive "X" Button**: Fixed the delete button failure by resolving the underlying null-ID issue.

## [1.1.0] — 2026-04-23 00:26

### Added
- **Agent Rule: Mandatory Changelog Review**: Updated `.agents/rules/readchangelog.md` to force all AI agents to read `CHANGELOG.md` at the start of every session for better context retention.

## [1.1.0] — 2026-04-23 00:25

### Added
- **Atomic TabBar Component**: Implemented a fully modular `TabBarComponent` (Organism) with a dynamic "Right Action" configuration system.
- **Scalable Action System**: Added support for extensible header actions (Rebuild, Fullscreen, Settings) within the new TabBar architecture.

### Changed
- **Architectural Decoupling**: Refactored `TabsModule` to act as a pure state controller, syncing application state with the `TabBarComponent` via an observer-style pattern.
- **Keyboard Shortcut Unification**: Updated global listeners in `toolbar.js` to target new Design System class names, ensuring 100% functional parity for `Mod+1/2/3/4` and `Mod+B`.
- **Legacy Pruning**: Deleted `renderer/css/tabs.css` and removed obsolete event listeners from `renderer/js/toolbar.js`, reducing JS bloat by ~150 lines.

### Fixed
- **Sidebar Selection Persistence**: Resolved a bug in `sidebar.js` where the "Recently Viewed" highlight remained active even when the workspace had no open tabs.
- **Editor Mode Synchronization**: Updated `editor.js` to correctly switch back to Read Mode using the new component selectors after saving or canceling edits.

## [1.1.0] — 2026-04-23 00:20

### Added
- **Mutual Exclusion Sidebar Logic**: Implemented a "Single Sidebar" rule to ensure only one right-hand panel (Comment or Collect) is open at a time.

### Changed
- **Renamed Component**: Completed the migration from `SecondaryToolbar` to **`ChangeActionViewBar`**, updating all CSS, JS, and HTML references.
- **State Globalization**: Moved `AppState` to `window.AppState` to resolve cross-script visibility issues.
- **Boot Sequence Optimization**: Reordered the application initialization in `app.js` to guarantee UI components (like the Action Bar) are ready before the first workspace load.
- **Sidebar UI Reliability**: Added `!important` CSS overrides for sidebar widths to prevent manual resizer values from blocking the collapse transition.

### Fixed
- **Mode Switching Regression**: Resolved the issue where "New Draft" (`__DRAFT_MODE__`) failed to automatically trigger 'Edit' mode.
- **Ghost Toolbar Fix**: Ensured the `ChangeActionViewBar` strictly hides when no file is active or during `setNoFile` triggers.
- **Edge Browser Support**: Fixed "Invalid Property" warnings for `backdrop-filter` by refining CSS property ordering.
- **Overlapping Sidebar Bug**: Fixed a UI collision where both Comment and Collect sidebars could appear simultaneously.

## [1.1.0] — 2026-04-22

### Added
- **Premium Scroll Experience**: Implemented a smooth alpha-mask fade on the top and bottom edges of the Markdown viewer (`#md-viewer`).
- **Flexible Mask Configuration**: Added CSS variables for independent control of edge fading:
  - `--mask-top`: Controls the fade depth at the top edge (currently optimized at `240px`).
  - `--mask-bottom`: Controls the fade depth at the bottom edge (currently set to `80px`).
- **Edge Polish**: Eliminated "hard cuts" (chém cứng) where content meets the container boundaries, improving overall aesthetic fluidity.

### Changed
- Updated `renderer/css/markdown.css` to integrate the linear-gradient masking system.
- Adjusted `#md-viewer` layout properties to support hardware-accelerated masking.

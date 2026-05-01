# 🗺 PROJECT OVERVIEW & BUNDLE MAP

**Project:** MDpreview
**Description:** Local Markdown Previewer with Advanced Design System

## 📂 Reading Order & Bundle Guide
Vui lòng đọc các file theo thứ tự số thứ tự (00 -> 08) để hiểu dự án tốt nhất:

- `00-PROJECT-MAP.md`: Bản đồ tổng quan (File này).
- `01-core.md`: Module **CORE**.
- `02-docs.md`: Module **DOCS**.
- `03-electron.md`: Module **ELECTRON**.
- `04-server.md`: Module **SERVER**.
- `05-renderer.md`: Module **RENDERER**.
- `06-scripts.md`: Module **SCRIPTS**.
- `07-tests.md`: Module **TESTS**.
- `08-misc.md`: Module **MISC**.

## 🌲 Project Structure
```text
📦 Project Directory Tree:
├── .ai
│   ├── ai-docs
│   │   ├── CLAUDE.md
│   │   ├── GITHUB_WORKFLOW.md
│   │   └── OVERVIEW.md
│   └── tracking
│       ├── project_fields_full.json
│       ├── project_items.json
│       ├── project_items_check_recheck.json
│       ├── project_items_final.json
│       ├── project_items_final_check.json
│       ├── project_items_full.json
│       ├── project_items_latest.json
│       ├── project_items_latest_v2.json
│       ├── project_items_latest_v3.json
│       ├── project_items_new.json
│       ├── project_items_v4.json
│       └── project_items_v5.json
├── .aiignore
├── .antigravity_rules
├── .gitignore
├── .stylelintrc.json
├── AGENTS.md
├── ARCHITECTURE.md
├── CHANGELOG.md
├── GraphPreview
│   ├── Antigravity_Chart_Guide.md
│   └── Example_Audit_With_Charts.md
├── bundle.command
├── docs
│   ├── decisions
│   │   ├── 20260426-adaptive-sidebar-scrolling.md
│   │   ├── 20260426-centralized-settings-architecture.md
│   │   ├── 20260426-drag-sensitivity-shield.md
│   │   ├── 20260426-drag-visual-minimalism.md
│   │   ├── 20260426-hidden-paths-strategy.md
│   │   ├── 20260426-hidden-section-restrictions.md
│   │   ├── 20260426-settings-service-architecture.md
│   │   ├── 20260426-settings-ui-molecule.md
│   │   ├── 20260426-sidebar-hidden-behavior.md
│   │   ├── 20260426-sidebar-selection-behavior.md
│   │   ├── 20260426-singleton-ui-pattern.md
│   │   ├── 20260426-tab-space-optimization.md
│   │   ├── 20260426-unified-menu-shield.md
│   │   ├── 20260426-unified-sidebar-structure.md
│   │   ├── 20260427-command-palette-evolution.md
│   │   ├── 20260427-explicit-selection-closure.md
│   │   ├── 20260427-search-palette-height-logic.md
│   │   ├── 20260427-search-palette-strategy.md
│   │   ├── 20260427-server-payload-limit.md
│   │   ├── 20260427-smart-button-spacing-logic.md
│   │   ├── 20260427-systems-based-token-refactor.md
│   │   ├── 20260427-tab-logic-visual-sync.md
│   │   ├── 20260427-tab-management-strategy.md
│   │   ├── 20260427-tab-preview-mirror-strategy.md
│   │   ├── 20260427-tab-preview-rendering.md
│   │   ├── 20260428-adaptive-concentric-radius.md
│   │   ├── 20260428-architecture-polish-legacy-pruning.md
│   │   ├── 20260428-centralized-shortcut-strategy.md
│   │   ├── 20260428-edit-toolbar-layout-evolution.md
│   │   ├── 20260428-optimized-file-loading.md
│   │   ├── 20260428-project-map-mirror-fidelity.md
│   │   ├── 20260428-project-map-scroll-stabilization.md
│   │   ├── 20260428-project-map-zoom-interaction-strategy.md
│   │   ├── 20260428-toc-scroll-sync-strategy.md
│   │   ├── 20260428-toc-semantic-tokens.md
│   │   ├── 20260428-viewer-persistent-dom.md
│   │   ├── 20260429-gdoc-rasterization-strategy.md
│   │   ├── 20260429-menu-anchoring-strategy.md
│   │   ├── 20260429-stable-layout-border-pattern.md
│   │   └── README.md
│   ├── function-docs
│   │   ├── BASE_FORM_MODAL.md
│   │   ├── CORE_APP.md
│   │   ├── DESIGN_SYSTEM.md
│   │   ├── DESIGN_SYSTEM_ICONS.md
│   │   ├── EDITOR.md
│   │   ├── EDIT_TOOLBAR.md
│   │   ├── ELECTRON_BRIDGE.md
│   │   ├── EXPLORER_SETTINGS.md
│   │   ├── GDOC_UTIL.md
│   │   ├── MARKDOWN_VIEWER.md
│   │   ├── MENU_SHIELD.md
│   │   ├── PROJECT_MAP.md
│   │   ├── PUBLISH_HANDOFF.md
│   │   ├── README.md
│   │   ├── RECENTLY_VIEWED.md
│   │   ├── SCROLL_CONTAINER.md
│   │   ├── SEARCH_PALETTE.md
│   │   ├── SEARCH_SERVICE.md
│   │   ├── SETTINGS_COMPONENT.md
│   │   ├── SETTINGS_SERVICE.md
│   │   ├── SHORTCUTS.md
│   │   ├── SHORTCUTS_COMPONENT.md
│   │   ├── SHORTCUT_SERVICE.md
│   │   ├── SIDEBAR_LEFT.md
│   │   ├── SYNC_SERVICE.md
│   │   ├── TABS.md
│   │   ├── TAB_BAR_COMPONENT.md
│   │   ├── TAB_PREVIEW.md
│   │   ├── TOC_COMPONENT.md
│   │   ├── TREE.md
│   │   ├── TREE_DRAG_MANAGER.md
│   │   ├── WORKSPACE.md
│   │   └── WORKSPACE_SWITCHER.md
│   └── function-idea-docs
│       └── ElectronClipboardCopyAsFile.md
├── electron
│   ├── ipc
│   │   ├── comments.js
│   │   ├── files.js
│   │   ├── handoff.js
│   │   └── workspace.js
│   ├── main.js
│   └── preload.js
├── eslint.config.mjs
├── package.json
├── renderer
│   ├── css
│   │   ├── design-system
│   │   │   ├── atoms
│   │   │   │   ├── button.css
│   │   │   │   ├── icon-action-button.css
│   │   │   │   ├── input.css
│   │   │   │   ├── kbd.css
│   │   │   │   ├── switch-toggle.css
│   │   │   │   ├── textarea.css
│   │   │   │   ├── tooltip.css
│   │   │   │   └── utilities.css
│   │   │   ├── molecules
│   │   │   │   ├── combo-button.css
│   │   │   │   ├── context-menu.css
│   │   │   │   ├── inline-message.css
│   │   │   │   ├── menu-shield.css
│   │   │   │   ├── popover-shield.css
│   │   │   │   ├── project-map.css
│   │   │   │   ├── scroll-container.css
│   │   │   │   ├── segmented-control.css
│   │   │   │   ├── setting-row.css
│   │   │   │   ├── setting-toggle-item.css
│   │   │   │   ├── sidebar-base.css
│   │   │   │   ├── sidebar-section-header.css
│   │   │   │   ├── tab-preview.css
│   │   │   │   └── workspace-switcher.css
│   │   │   ├── organisms
│   │   │   │   ├── base-form-modal.css
│   │   │   │   ├── change-action-view-bar.css
│   │   │   │   ├── comment-form.css
│   │   │   │   ├── edit-toolbar.css
│   │   │   │   ├── editor.css
│   │   │   │   ├── markdown-blocks.css
│   │   │   │   ├── markdown-content.css
│   │   │   │   ├── markdown-interactions.css
│   │   │   │   ├── markdown-viewer.css
│   │   │   │   ├── modals-misc.css
│   │   │   │   ├── right-sidebar.css
│   │   │   │   ├── search-palette.css
│   │   │   │   ├── settings-panel.css
│   │   │   │   ├── sidebar-left.css
│   │   │   │   ├── tab-bar.css
│   │   │   │   ├── toc-panel.css
│   │   │   │   ├── tree-view.css
│   │   │   │   └── workspace-panel.css
│   │   │   └── tokens.css
│   │   ├── design-system.css
│   │   ├── layout.css
│   │   └── styles.css
│   ├── index.html
│   ├── js
│   │   ├── components
│   │   │   ├── atoms
│   │   │   │   ├── icon-action-button.js
│   │   │   │   ├── switch-toggle.js
│   │   │   │   └── textarea.js
│   │   │   ├── design-system-icons.js
│   │   │   ├── design-system.js
│   │   │   ├── molecules
│   │   │   │   ├── context-menu.js
│   │   │   │   ├── menu-shield.js
│   │   │   │   ├── project-map.js
│   │   │   │   ├── scroll-container.js
│   │   │   │   ├── search-component.js
│   │   │   │   ├── setting-row.js
│   │   │   │   ├── setting-toggle-item.js
│   │   │   │   ├── sidebar-section-header.js
│   │   │   │   ├── tab-preview.js
│   │   │   │   ├── tree-item.js
│   │   │   │   └── workspace-switcher.js
│   │   │   └── organisms
│   │   │       ├── base-form-modal.js
│   │   │       ├── change-action-view-bar.js
│   │   │       ├── comment-form-component.js
│   │   │       ├── edit-toolbar-component.js
│   │   │       ├── explorer-settings-component.js
│   │   │       ├── handoff-token-form-component.js
│   │   │       ├── markdown-helper-component.js
│   │   │       ├── markdown-viewer-component.js
│   │   │       ├── publish-config-component.js
│   │   │       ├── right-sidebar.js
│   │   │       ├── search-palette.js
│   │   │       ├── settings-component.js
│   │   │       ├── shortcuts-component.js
│   │   │       ├── sidebar-left.js
│   │   │       ├── tab-bar.js
│   │   │       ├── toc-component.js
│   │   │       ├── tree-view.js
│   │   │       ├── workspace-form-component.js
│   │   │       └── workspace-picker-component.js
│   │   ├── core
│   │   │   ├── app.js
│   │   │   └── electron-bridge.js
│   │   ├── modules
│   │   │   ├── collect.js
│   │   │   ├── comments.js
│   │   │   ├── draft.js
│   │   │   ├── editor.js
│   │   │   ├── tabs.js
│   │   │   ├── tree.js
│   │   │   └── workspace.js
│   │   ├── services
│   │   │   ├── file-service.js
│   │   │   ├── markdown-logic-service.js
│   │   │   ├── publish-service.js
│   │   │   ├── recently-viewed-service.js
│   │   │   ├── search-service.js
│   │   │   ├── settings-service.js
│   │   │   ├── shortcut-service.js
│   │   │   ├── sync-service.js
│   │   │   ├── tree-drag-manager.js
│   │   │   └── ui-utils.js
│   │   └── utils
│   │       ├── code-blocks.js
│   │       ├── gdoc-util.js
│   │       ├── mermaid.js
│   │       ├── scroll.js
│   │       └── zoom.js
│   └── testing
│       └── sync-unit-test.js
├── scratch
│   ├── audit_shortcuts_v2.js
│   ├── check_buffer.js
│   ├── check_global.js
│   ├── shortcut_stress_test.js
│   ├── test-mtime.js
│   ├── test_norm.js
│   ├── test_path.js
│   └── test_rel.js
├── scripts
│   ├── PreviewUI.command
│   ├── QuickRebuild.command
│   ├── bundle-for-ai.js
│   └── rebuild.sh
├── server
│   ├── index.js
│   ├── routes
│   │   ├── comments.js
│   │   ├── file-ops.js
│   │   ├── files.js
│   │   ├── handoff.js
│   │   ├── render.js
│   │   ├── state.js
│   │   └── workspaces.js
│   ├── start.js
│   └── test-server.js
├── tailwind.config.js
└── tests
    ├── TestContent
    │   └── rolling_summary_update_analysis.md
    ├── audit-security.js
    ├── audit-test-suite.md
    ├── editor-module.test.js
    ├── markdown-logic.test.js
    ├── markdown-viewer.test.js
    ├── sidebar-left.test.js
    └── sync-cursor.test.js

```


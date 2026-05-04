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
- `06-worker.md`: Module **WORKER**.
- `07-scripts.md`: Module **SCRIPTS**.
- `08-tests.md`: Module **TESTS**.
- `09-misc.md`: Module **MISC**.

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
├── ImplementPlan
│   └── Implementation Plan_ TOC Shared Module.md
├── README.md
├── bundle.command
├── cf-publish-worker
│   ├── .wrangler
│   │   └── state
│   │       └── v3
│   │           ├── cache
│   │           │   └── miniflare-CacheObject
│   │           │       ├── metadata.sqlite
│   │           │       ├── metadata.sqlite-shm
│   │           │       └── metadata.sqlite-wal
│   │           └── kv
│   │               └── miniflare-KVNamespaceObject
│   │                   ├── metadata.sqlite
│   │                   ├── metadata.sqlite-shm
│   │                   └── metadata.sqlite-wal
│   ├── package.json
│   ├── public
│   │   ├── code-blocks.js
│   │   ├── publish.css
│   │   ├── toc-publish.js
│   │   └── zoom.js
│   ├── src
│   │   ├── handlers
│   │   │   ├── auth.js
│   │   │   ├── delete.js
│   │   │   ├── publish.js
│   │   │   └── serve.js
│   │   ├── index.js
│   │   ├── publish-styles.css
│   │   ├── renderer.js
│   │   ├── shell.js
│   │   ├── toc-publish.css
│   │   ├── toc-publish.js
│   │   └── utils
│   │       └── slug.js
│   └── wrangler.toml
├── docs
│   ├── 00-START.md
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
│   │   ├── 20260502-content-padding-width-synchronization.md
│   │   ├── 20260502-publish-security-hardening.md
│   │   └── README.md
│   ├── features
│   │   ├── GUIDE.md
│   │   ├── README.md
│   │   ├── advanced
│   │   │   ├── README.md
│   │   │   ├── SEARCH_PALETTE.md
│   │   │   ├── SHORTCUTS.md
│   │   │   ├── SHORTCUTS_COMPONENT.md
│   │   │   ├── TAB_BAR_COMPONENT.md
│   │   │   ├── TAB_PREVIEW.md
│   │   │   └── TOC_COMPONENT.md
│   │   ├── components
│   │   │   ├── BASE_FORM_MODAL.md
│   │   │   ├── DESIGN_SYSTEM.md
│   │   │   ├── DESIGN_SYSTEM_ICONS.md
│   │   │   ├── EDIT_TOOLBAR.md
│   │   │   ├── EXPLORER_SETTINGS.md
│   │   │   ├── MENU_SHIELD.md
│   │   │   ├── PROJECT_MAP.md
│   │   │   ├── README.md
│   │   │   ├── SCROLL_CONTAINER.md
│   │   │   ├── SETTINGS_COMPONENT.md
│   │   │   └── SIDEBAR_LEFT.md
│   │   ├── core
│   │   │   ├── CORE_APP.md
│   │   │   ├── ELECTRON_BRIDGE.md
│   │   │   └── README.md
│   │   ├── editor
│   │   │   ├── EDITOR.md
│   │   │   ├── MARKDOWN_VIEWER.md
│   │   │   └── README.md
│   │   ├── file-management
│   │   │   ├── README.md
│   │   │   ├── TABS.md
│   │   │   ├── TREE.md
│   │   │   ├── TREE_DRAG_MANAGER.md
│   │   │   ├── WORKSPACE.md
│   │   │   └── WORKSPACE_SWITCHER.md
│   │   ├── publishing
│   │   │   ├── PUBLISH_COMPONENTS.md
│   │   │   ├── PUBLISH_HANDOFF.md
│   │   │   ├── PUBLISH_WORKER.md
│   │   │   └── README.md
│   │   ├── services
│   │   │   ├── GDOC_UTIL.md
│   │   │   ├── PUBLISH_SERVICE.md
│   │   │   ├── README.md
│   │   │   ├── SEARCH_SERVICE.md
│   │   │   ├── SETTINGS_SERVICE.md
│   │   │   ├── SHORTCUT_SERVICE.md
│   │   │   └── SYNC_SERVICE.md
│   │   └── utilities
│   │       ├── README.md
│   │       └── RECENTLY_VIEWED.md
│   ├── guides
│   │   ├── deployment
│   │   │   ├── README.md
│   │   │   └── scripts-reference.md
│   │   ├── development
│   │   │   ├── README.md
│   │   │   ├── architecture.md
│   │   │   └── design-tokens.md
│   │   └── getting-started
│   │       ├── README.md
│   │       ├── quickstart.md
│   │       ├── setup.md
│   │       └── user-guide.md
│   ├── reference
│   │   ├── README.md
│   │   ├── archive
│   │   │   ├── ElectronClipboardCopyAsFile.md
│   │   │   ├── README.md
│   │   │   └── cf-publish-implementation-plan.md
│   │   └── phase-reports
│   │       ├── README.md
│   │       ├── phase-1-1.md
│   │       └── phase-1-2.md
│   ├── security
│   │   ├── README.md
│   │   └── policy.md
│   └── testing
│       ├── README.md
│       └── manual-tests.md
├── electron
│   ├── ipc
│   │   ├── comments.js
│   │   ├── files.js
│   │   ├── handoff.js
│   │   ├── worker-publish.js
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
│   │   │   │   ├── status-badge.css
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
│   │   │   │   ├── publish-config.css
│   │   │   │   ├── right-sidebar.css
│   │   │   │   ├── search-palette.css
│   │   │   │   ├── settings-panel.css
│   │   │   │   ├── sidebar-left.css
│   │   │   │   ├── tab-bar.css
│   │   │   │   ├── toc-panel.css
│   │   │   │   ├── tree-view.css
│   │   │   │   ├── workspace-panel.css
│   │   │   │   └── zoom-modal.css
│   │   │   └── tokens.css
│   │   ├── design-system.css
│   │   ├── layout.css
│   │   ├── shared
│   │   │   ├── markdown-render.css
│   │   │   └── toc-core.css
│   │   └── styles.css
│   ├── index.html
│   ├── js
│   │   ├── components
│   │   │   ├── atoms
│   │   │   │   ├── button.js
│   │   │   │   ├── icon-action-button.js
│   │   │   │   ├── inline-message.js
│   │   │   │   ├── input-component.js
│   │   │   │   ├── modal.js
│   │   │   │   ├── segmented-control.js
│   │   │   │   ├── select.js
│   │   │   │   ├── status-badge.js
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
│   │   │       ├── publish-manager-component.js
│   │   │       ├── publish-settings-form-component.js
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
│   │   │   ├── __tests__
│   │   │   │   ├── md-renderer-core.test.js
│   │   │   │   └── mermaid-config.test.js
│   │   │   ├── design-token-provider.js
│   │   │   ├── file-service.js
│   │   │   ├── markdown-logic-service.js
│   │   │   ├── md-renderer-core.js
│   │   │   ├── mermaid-config.js
│   │   │   ├── publish-service.js
│   │   │   ├── publishing
│   │   │   │   ├── error-types.js
│   │   │   │   ├── legacy-handoff-adapter.js
│   │   │   │   ├── publish-orchestrator.js
│   │   │   │   ├── publish-utils.js
│   │   │   │   ├── retry-strategy.js
│   │   │   │   └── worker-publish-adapter.js
│   │   │   ├── recently-viewed-service.js
│   │   │   ├── search-service.js
│   │   │   ├── settings-service.js
│   │   │   ├── shortcut-service.js
│   │   │   ├── sync-service.js
│   │   │   ├── toc-service.js
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
├── scripts
│   ├── DeployWorker.command
│   ├── PreviewUI.command
│   ├── QuickRebuild.command
│   ├── build-publish-assets.js
│   ├── bundle-for-ai.js
│   ├── rebuild.sh
│   └── test-phase-1-1.sh
├── server
│   ├── index.js
│   ├── routes
│   │   ├── comments.js
│   │   ├── file-ops.js
│   │   ├── files.js
│   │   ├── handoff.js
│   │   ├── render.js
│   │   ├── state.js
│   │   ├── worker-publish.js
│   │   └── workspaces.js
│   ├── start.js
│   └── test-server.js
├── tailwind.config.js
├── tests
│   ├── TestContent
│   │   └── rolling_summary_update_analysis.md
│   ├── __tests__
│   │   └── publish-integration.test.js
│   ├── audit-security.js
│   ├── audit-test-suite.md
│   ├── editor-module.test.js
│   ├── markdown-logic.test.js
│   ├── markdown-viewer.test.js
│   ├── sidebar-left.test.js
│   └── sync-cursor.test.js
├── vitest.config.js
└── workspaces
    └── MDpreview
        └── Test Mermaid.md

```


/**
 * ESLint Configuration for MDPreview
 *
 * Rules:
 * - Renderer: Browser globals + IIFE modules (window.* is intentional)
 * - Electron/Server: Node.js globals + strict ES6+
 * - Unused vars prefixed with _ are allowed (e.g., _unused, _ignored)
 * - console.log forbidden (use console.warn/error instead)
 * - Always use === (strict equality), never ==
 * - No var (use let/const only)
 *
 * Reference: ARCHITECTURE.md § Development Workflow, § Linting Gates
 */

import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', 'dist/**'],
  },

  /**
   * RENDERER CONFIG
   * Browser-based code (React components, modules, utilities)
   *
   * Global variables from:
   * 1. Browser APIs (window, document, fetch, etc.)
   * 2. CDN-loaded libraries (mermaid, hljs, marked, socket.io)
   * 3. IIFE modules exported to window.* (AppState, TabsModule, etc.)
   */
  {
    files: ['renderer/js/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        /**
         * Third-party globals — loaded via CDN in index.html
         */
        mermaid: 'readonly',
        hljs: 'readonly',
        marked: 'readonly',
        io: 'readonly',
        /**
         * App-level globals — IIFE modules exported via window.*
         *
         * Naming convention:
         * - Components: [Name]Component or [Name] (e.g., IconActionButton, ContextMenu)
         * - Services: [Name]Service or [Name] (e.g., FileService, MarkdownLogicService)
         * - Modules: [Name]Module (e.g., EditorModule, TabsModule)
         * - Utilities: [Name]Util or [Name]Utils (e.g., ZoomUtil, CodeBlocksUtil)
         *
         * These are defined by the modules themselves at the end:
         *   window.ModuleName = ModuleName;
         */
        AppState: 'readonly',
        ChangeActionViewBar: 'readonly',
        CodeBlockModule: 'readonly',
        CollectModule: 'readonly',
        CommentFormComponent: 'readonly',
        CommentsModule: 'readonly',
        ContextMenuComponent: 'readonly',
        DesignSystem: 'readonly',
        DraftModule: 'readonly',
        EditorModule: 'readonly',
        FileService: 'readonly',
        IconActionButton: 'readonly',
        MarkdownLogicService: 'readonly',
        MarkdownViewer: 'readonly',
        RecentlyViewedModule: 'readonly',
        RightSidebar: 'readonly',
        ScrollModule: 'readonly',
        SearchComponent: 'readonly',
        SettingsComponent: 'readonly',
        SettingsModule: 'readonly',
        SidebarController: 'readonly',
        SidebarLeft: 'readonly',
        SidebarModule: 'readonly',
        SidebarSectionHeader: 'readonly',
        SwitchToggleModule: 'readonly',
        TabBar: 'readonly',
        TabsModule: 'readonly',
        TreeDragManager: 'readonly',
        TreeItemComponent: 'readonly',
        TreeModule: 'readonly',
        TreeViewComponent: 'readonly',
        WorkspaceFormComponent: 'readonly',
        WorkspaceModule: 'readonly',
        WorkspacePickerComponent: 'readonly',
        applyTheme: 'readonly',
        displayName: 'readonly',
        initGlobalShortcuts: 'readonly',
        initMermaid: 'readonly',
        initToolbarBtns: 'readonly',
        initZoom: 'readonly',
        loadFile: 'readonly',
        mdContent: 'readonly',
        processMermaid: 'readonly',
        setNoFile: 'readonly',
        showToast: 'readonly',
        toggleShortcutsPopover: 'readonly',
        updateHeaderUI: 'readonly',
      },
    },
    rules: {
      /**
       * Unused Variables
       * Allowed if prefixed with _ (e.g., _unused, _index, _error)
       * Pattern: ❌ `function(unused) {}` → ✅ `function(_unused) {}`
       */
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',        // Allow unused parameters: _param
          varsIgnorePattern: '^_',        // Allow unused variables: _var
          caughtErrorsIgnorePattern: '^_' // Allow unused catch: catch (_err)
        }
      ],

      /**
       * Undefined Variables
       * Variables must be defined before use (catches typos)
       * Exception: globals above are marked 'readonly'
       */
      'no-undef': 'error',

      /**
       * Console Methods
       * ❌ console.log (debug, info, debug, trace) — forbidden
       * ✅ console.warn, console.error — allowed (for production visibility)
       */
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      /**
       * Strict Equality
       * ❌ `x == y` or `x != y` (loose equality)
       * ✅ `x === y` or `x !== y` (strict equality)
       * Avoids type coercion bugs
       */
      eqeqeq: ['error', 'always'],

      /**
       * No var Keyword
       * ❌ `var x = 1;` (function-scoped, confusing)
       * ✅ `const x = 1;` or `let x = 1;` (block-scoped, clear)
       */
      'no-var': 'error',
    },
  },

  /**
   * ELECTRON / SERVER CONFIG
   * Node.js-based code (Electron main, server-side code)
   * Same rules as renderer, but with Node.js globals instead of browser
   */
  {
    files: ['electron/**/*.js', 'server/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'no-undef': 'error',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
    },
  },
];

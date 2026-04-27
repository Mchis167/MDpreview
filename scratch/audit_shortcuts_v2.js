/**
 * MDpreview Keyboard Shortcut Auditor V2
 * Purpose: Validate the centralized ShortcutService and its registered handlers.
 * Run this in the Browser DevTools console.
 */
(function auditShortcutsV2() {
    console.group('%c MDpreview Centralized Shortcut Audit ', 'background: #222; color: #00d4ff; font-size: 1.2em; font-weight: bold;');
    
    // 1. Basic Service Check
    if (!window.ShortcutService) {
        console.error('❌ ShortcutService NOT found! The service might not be registered in index.html or failed to load.');
        console.groupEnd();
        return;
    }

    const shortcuts = window.ShortcutService.getShortcutData();
    const results = [];
    const isMac = window.ShortcutService.isMac();
    const mod = isMac ? '⌘' : 'Ctrl';

    if (!shortcuts || shortcuts.length === 0) {
        console.warn('⚠️ No shortcuts registered in ShortcutService. Did you forget to call registerGroups in app.js?');
    }

    // 2. Validate each shortcut group
    shortcuts.forEach(group => {
        group.items.forEach(item => {
            const issues = [];
            
            // ── A. Handler Validation ──
            if (!item.isInformative && typeof item.handler !== 'function') {
                issues.push('Missing handler function (ID: ' + item.id + ')');
            }

            // ── B. Keys Validation ──
            if (!item.keys || item.keys.length === 0) {
                if (!item.isInformative) {
                    issues.push('No keys defined for interactive shortcut');
                }
            }

            // ── C. Dependency & API Validation ──
            // Checks if the modules and methods referenced in common handlers actually exist.
            const validatorMap = {
                'mode-read': () => document.querySelector('.ds-segment-item[data-id="read"]'),
                'mode-edit': () => document.querySelector('.ds-segment-item[data-id="edit"]'),
                'mode-comment': () => document.querySelector('.ds-segment-item[data-id="comment"]'),
                'mode-collect': () => document.querySelector('.ds-segment-item[data-id="collect"]'),
                'toggle-sidebar': () => document.getElementById('sidebar-toggle-btn'),
                'focus-search': () => window.SearchPalette,
                'scroll-top': () => document.getElementById('md-viewer-mount'),
                'scroll-bottom': () => document.getElementById('md-viewer-mount'),
                'save-file': () => window.EditorModule,
                'markdown-helper': () => window.MarkdownHelperComponent,
                'select-all-tabs': () => window.TabsModule,
                'close-active-tab': () => window.TabsModule,
                'close-all-tabs': () => window.TabsModule,
                'toggle-pin-tab': () => window.TabsModule,
                'deselect-tabs': () => window.TabsModule && window.TreeModule && typeof window.TreeModule.deselectAll === 'function',
                'new-file': () => window.TreeModule && typeof window.TreeModule.createNewFile === 'function',
                'new-folder': () => window.TreeModule && typeof window.TreeModule.createNewFolder === 'function',
                'rename-selected': () => window.TreeModule && typeof window.TreeModule.renameSelected === 'function',
                'duplicate-file': () => window.TreeModule && typeof window.TreeModule.duplicateSelected === 'function',
                'delete-selected': () => window.TreeModule && typeof window.TreeModule.deleteSelected === 'function',
                'workspace-picker': () => document.getElementById('workspace-switcher'),
                'hide-unhide': () => window.TreeModule && typeof window.TreeModule.toggleHiddenItems === 'function',
                'collapse-all': () => window.TreeModule && typeof window.TreeModule.collapseAll === 'function',
                'collapse-others': () => window.TreeModule && typeof window.TreeModule.collapseOthers === 'function',
                'keyboard-shortcuts': () => window.SearchPalette,
                'open-settings': () => window.SettingsComponent,
                'close-cancel': () => true
            };

            const validator = validatorMap[item.id];
            if (validator) {
                try {
                    const target = validator();
                    if (!target) {
                        issues.push('Target not found in DOM');
                    } else if (item.id.startsWith('mode-') && !target.offsetParent) {
                        // Element is in DOM but hidden (ChangeActionViewBar hidden when no file open)
                        issues.push('Element exists but is hidden (Open a file first)');
                    }
                } catch (e) {
                    issues.push('Validator error: ' + e.message);
                }
            }

            // ── D. Handler Code Check ──
            if (typeof item.handler === 'function') {
                const code = item.handler.toString();
                if (code.includes('click()') && item.id.startsWith('mode-')) {
                   const target = validatorMap[item.id]();
                   if (target && !target.click) issues.push('Target element is not clickable');
                }
            }

            results.push({
                Group: group.title,
                ID: item.id,
                Label: item.label,
                Keys: item.keys ? item.keys.join(' + ').replace('Mod', mod) : '-',
                Status: issues.length === 0 ? '✅ OK' : '❌ BROKEN',
                Details: issues.length > 0 ? issues.join(' | ') : 'Verified'
            });
        });
    });

    // 3. Final Report
    if (results.length > 0) {
        console.table(results);
        const brokenCount = results.filter(r => r.Status.includes('BROKEN')).length;
        
        if (brokenCount === 0) {
            console.log('%c ✨ ALL SHORTCUTS ARE VERIFIED & FUNCTIONAL ✨ ', 'color: #00ff00; font-weight: bold; font-size: 1.1em;');
            console.log('Shortcuts are properly mapped to existing DOM elements and Modules.');
        } else {
            console.error(`⚠️ Found ${brokenCount} shortcuts with potential issues. Check the "Details" column.`);
        }
    }

    console.groupEnd();
})();

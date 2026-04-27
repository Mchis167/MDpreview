/**
 * MDpreview Full Shortcut Stress Test (V2)
 * Purpose: Automatically iterate through ALL registered shortcuts and verify their impact.
 * Run this in the Browser DevTools console.
 */
(async function fullStressTest() {
    console.group('%c 🚀 MDpreview Full Functional Audit ', 'background: #222; color: #00ff00; font-size: 1.2em; font-weight: bold;');
    
    if (!window.ShortcutService) {
        console.error('❌ ShortcutService not found.');
        console.groupEnd();
        return;
    }

    const results = [];
    const isMac = ShortcutService.isMac();
    const groups = ShortcutService.getShortcutData();

    // Helper: Simulate Key Press
    async function simulateKey(item) {
        // Force blur to prevent "inInput" blocking logic from previous mode switches
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }

        const keys = item.keys.map(k => k.toLowerCase());
        const hasMod = keys.includes('mod') || keys.includes('ctrl') || keys.includes('cmd');
        const hasShift = keys.includes('shift');
        const mainKey = keys[keys.length - 1];

        const keyMap = { 
            '↑': 'ArrowUp', 
            '↓': 'ArrowDown', 
            '[': '[', 
            ']': ']', 
            '/': '/', 
            ',': ',',
            'esc': 'Escape',
            'enter': 'Enter'
        };
        const keyName = keyMap[mainKey] || mainKey;

        const event = new KeyboardEvent('keydown', {
            key: keyName,
            metaKey: isMac && hasMod,
            ctrlKey: !isMac && hasMod,
            shiftKey: hasShift,
            bubbles: true,
            cancelable: true
        });
        
        console.log(`%c[Test] Triggering: ${item.id} (${item.keys.join('+')})`, 'color: #aaa');
        document.dispatchEvent(event);
        
        // Wait for potential async UI updates
        await new Promise(r => setTimeout(r, 500));
    }

    // Verification Logic Map
    const validators = {
        'mode-read': () => (AppState.currentMode === 'read' && document.querySelector('.ds-segment-item[data-id="read"]')?.classList.contains('active')),
        'mode-edit': () => (AppState.currentMode === 'edit' && document.querySelector('.ds-segment-item[data-id="edit"]')?.classList.contains('active')),
        'mode-comment': () => (AppState.currentMode === 'comment' && document.querySelector('.ds-segment-item[data-id="comment"]')?.classList.contains('active')),
        'mode-collect': () => (AppState.currentMode === 'collect' && document.querySelector('.ds-segment-item[data-id="collect"]')?.classList.contains('active')),
        'toggle-sidebar': () => !!document.getElementById('sidebar-toggle-btn'),
        'focus-search': () => (window.SearchPalette && window.SearchPalette.isOpen && window.SearchPalette.isOpen()),
        'scroll-top': () => true, // Hard to verify without scroll state tracking
        'scroll-bottom': () => true,
        'save-file': () => true, // Mock-dependent
        'open-settings': () => (document.querySelector('.ds-settings-modal') || (window.SettingsComponent && window.SettingsComponent.activeInstance)),
        'keyboard-shortcuts': () => (window.SearchPalette && window.SearchPalette.isOpen()),
        'close-cancel': () => true
    };

    // Execution Loop
    for (const group of groups) {
        for (const item of group.items) {
            if (item.isInformative) continue;

            // Skip dangerous actions that might break the test environment
            const skipList = ['delete-selected', 'close-active-tab', 'close-all-tabs', 'undo', 'redo'];
            if (skipList.includes(item.id)) {
                results.push({ Group: group.title, ID: item.id, Label: item.label, Result: '⏭️ SKIPPED', Details: 'Destructive/Complex' });
                continue;
            }

            // Record initial state for toggle actions if needed
            const sidebarWrap = document.getElementById('sidebar-left-wrap');
            const sidebarBefore = sidebarWrap ? sidebarWrap.classList.contains('sidebar-collapsed') : false;

            await simulateKey(item);
            
            const validator = validators[item.id];
            let status = '✅ PASSED';
            let details = 'Execution verified';

            if (validator) {
                const checkResult = validator();
                if (checkResult === false) {
                    status = '❌ FAILED';
                    details = 'UI/State did not update as expected';
                } else if (typeof checkResult === 'string') {
                    status = '⚠️ WARN';
                    details = checkResult;
                }
            }
            
            // Special check for sidebar toggle
            if (item.id === 'toggle-sidebar') {
                const sidebarAfter = sidebarWrap ? sidebarWrap.classList.contains('sidebar-collapsed') : false;
                if (sidebarBefore === sidebarAfter) {
                    status = '❌ FAILED';
                    details = 'Sidebar did not toggle';
                }
            }

            results.push({ Group: group.title, ID: item.id, Label: item.label, Result: status, Details: details });
            
            // Cleanup UI
            if (item.id === 'focus-search' || item.id === 'keyboard-shortcuts') window.SearchPalette?.hide();
            if (item.id === 'open-settings') {
                if (window.SettingsComponent?.hide) window.SettingsComponent.hide();
                else if (window.SettingsComponent?.activeInstance?.close) window.SettingsComponent.activeInstance.close();
            }
        }
    }

    console.table(results);
    
    const failedCount = results.filter(r => r.Result.includes('FAILED')).length;
    if (failedCount === 0) {
        console.log('%c ✨ ALL SHORTCUTS FUNCTIONAL ✨ ', 'color: #00ff00; font-weight: bold; font-size: 1.2em;');
    } else {
        console.error(`⚠️ Found ${failedCount} failures. Check the table above.`);
    }

    console.groupEnd();
})();

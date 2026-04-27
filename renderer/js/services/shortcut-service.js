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

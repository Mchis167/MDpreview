/**
 * MonacoService
 * Purpose: Encapsulates Monaco Editor lifecycle and API.
 * Pattern: IIFE Singleton
 */

/* global monaco, require */

const MonacoService = (() => {
  'use strict';

  let _editor = null;
  let _model = null;
  let _isInitialized = false;
  let _mountCount = 0; // Guard against overlapping mount calls
  let _loadPromise = null;
  let _rejectionListenerAttached = false;

  /**
   * Configure Monaco Loader
   */
  if (typeof require !== 'undefined' && require.config) {
    require.config({ paths: { 'vs': '/monaco/min/vs' } });
  }

  /**
   * Configure Monaco Environment for Electron
   * This must be done before creating any editor.
   */
  window.MonacoEnvironment = {
    getWorkerUrl: function (_moduleId, _label) {
      // In MDpreview, we serve monaco via Express at /monaco
      return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
        self.MonacoEnvironment = { baseUrl: '/monaco/min/' };
        importScripts('/monaco/min/vs/base/worker/workerMain.js');
      `)}`;
    }
  };

  /**
   * Build Monaco Theme from Design System tokens
   */
  function _buildTheme() {
    const style = getComputedStyle(document.documentElement);
    const get = (v) => style.getPropertyValue(v).trim();

    /**
     * Converts rgb/rgba or hex to a #RRGGBB or #RRGGBBAA hex string.
     * Monaco rules require strict hex format.
     */
    const _toHex = (color) => {
      if (!color || color === 'transparent') return '#00000000';
      if (color.startsWith('#')) return color;

      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (match) {
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        let a = '';
        if (match[4]) {
          const alpha = Math.round(parseFloat(match[4]) * 255);
          a = alpha.toString(16).padStart(2, '0');
        }
        return `#${r}${g}${b}${a}`;
      }
      return color.startsWith('var') ? '#ffffff' : color;
    };

    monaco.editor.defineTheme('mdpreview-dark', {
      base: 'vs-dark',
      inherit: true, // Enable inheritance to use vs-dark as a solid base
      rules: [
        // ── Standard Syntax (One Dark Inspired) ──
        { token: 'keyword', foreground: 'C678DD' },          // Purple
        { token: 'string', foreground: '98C379' },           // Green
        { token: 'comment', foreground: '7F848E', fontStyle: 'italic' }, // Gray
        { token: 'number', foreground: 'D19A66' },           // Orange
        { token: 'type', foreground: 'E5C07B' },             // Yellow
        { token: 'function', foreground: '61AFEF' },         // Blue
        { token: 'tag', foreground: 'E06C75' },               // Red/Pink
        { token: 'attribute.name', foreground: 'D19A66' },   // Orange
        { token: 'attribute.value', foreground: '98C379' },  // Green
        { token: 'operator', foreground: '56B6C2' },         // Cyan
        { token: 'delimiter', foreground: 'ABB2BF' },        // Gray (Dots, commas, brackets)

        // ── Markdown Special Tokens ──
        { token: 'header', foreground: '56B6C2', fontStyle: 'bold' },
        { token: 'list.bullet', foreground: 'D19A66' },
        { token: 'keyword.md', foreground: 'D19A66' },       // Ensure Markdown bullets match
        { token: 'link', foreground: '61AFEF' },
        { token: 'link.target', foreground: '98C379' },
        { token: 'strong', fontStyle: 'bold' },
        { token: 'emphasis', fontStyle: 'italic' },
        { token: 'quote', foreground: '7F848E' },
        { token: 'metatag', foreground: 'C678DD' },
      ],
      colors: {
        'editor.background': '#00000000', // Transparent
        'editor.foreground': '#ABB2BF', // Standard One Dark gray foreground

        // Disable internal highlighting to use CSS
        'editor.lineHighlightBackground': '#00000000',
        'editor.lineHighlightBorder': _toHex(get('--ds-white-a10')), // Subtle border with alpha

        // UI Interaction colors
        'focusBorder': _toHex(get('--ds-white-a10')), // Subdue the harsh blue focus border
        'editor.selectionBackground': get('--ds-white-a20'),
        'editorCursor.foreground': _toHex(get('--ds-accent')),
        'editorIndentGuide.background': _toHex(get('--ds-white-a08')),
        'editorIndentGuide.activeBackground': _toHex(get('--ds-accent'))
      }
    });
  }

  /**
   * Resolve relative asset path → absolute server URL.
   */
  function _resolveUrl(raw) {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (trimmed.startsWith('http') || trimmed.startsWith('//') || trimmed.startsWith('data:')) {
      return trimmed;
    }

    let path = trimmed;
    if (path.startsWith('/assets/')) path = path.slice(8);
    else if (path.startsWith('assets/')) path = path.slice(7);
    else if (path.startsWith('/')) path = path.slice(1);

    path = path.split('?')[0].split('#')[0];

    const encoded = path.split('/').map(seg => encodeURIComponent(decodeURIComponent(seg))).join('/');
    return `/assets/${encoded}`;
  }

  function _registerLanguageProviders() {
    monaco.languages.registerCompletionItemProvider('markdown', {
      triggerCharacters: [':'],
      provideCompletionItems(model, position) {
        const line = model.getLineContent(position.lineNumber);
        const before = line.substring(0, position.column - 1);
if (!/(#browser|#phone):$/.test(before)) return { suggestions: [] };
        return {
          suggestions: [
            {
              label: 'scroll',
              kind: monaco.languages.CompletionItemKind.Value,
              detail: 'Scroll inside frame (16:10 browser / iPhone 16 phone)',
              insertText: 'scroll',
              range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            }
          ]
        };
      }
    });
  }

  return {
    /**
     * Ensure Monaco is loaded
     */
    init() {
      if (_loadPromise) return _loadPromise;
      _loadPromise = new Promise((resolve) => {
        if (typeof monaco !== 'undefined') {
          _registerLanguageProviders();
          resolve();
          return;
        }
        if (typeof require !== 'undefined') {
          require(['vs/editor/editor.main'], () => {
            _registerLanguageProviders();
            resolve();
          });
        } else {
          console.error('[MonacoService] AMD loader (require) not found.');
          resolve(); // Resolve anyway to not block forever, but mount will fail
        }
      });
      return _loadPromise;
    },

    /**
     * Mount Monaco Editor into a container
     * @param {HTMLElement} containerEl 
     * @param {Object} options 
     */
    async mount(containerEl, options = {}) {
      const currentMountID = ++_mountCount;

      await this.init();

      // If a newer mount request has started, abort this one
      if (currentMountID !== _mountCount) {
        return;
      }

      if (_editor) {
        this.dispose();
      }

      _buildTheme();

      const style = getComputedStyle(document.documentElement);
      const fontSize = parseInt(style.getPropertyValue('--ds-font-sm')) || 12;
      const fontFamily = style.getPropertyValue('--ds-font-family-code').trim() || "'Roboto Mono', monospace";

      const defaultOptions = {
        value: options.value || '',
        language: options.language || 'markdown',
        theme: 'mdpreview-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        contextmenu: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: false,

        fontSize: fontSize,
        fontFamily: fontFamily,
        lineHeight: 1.6,
        padding: { top: 20, bottom: 20 },
        scrollBeyondLastLine: true,
        smoothScrolling: true,
        renderLineHighlight: 'line',
        renderLineHighlightOnlyWhenFocus: true,
        cursorSmoothCaretAnimation: 'on',
        renderWhitespace: 'none',        // Disable dots for spaces
        renderIndentGuides: true,       // Enable vertical lines
        guides: {
          indentation: true,            // Enable indentation guides
          bracketPairs: true            // Enable bracket pair guides
        },
        scrollbar: {
          vertical: 'visible',
          horizontal: 'auto',
          verticalScrollbarSize: 4,
          horizontalScrollbarSize: 4,
          useShadows: false
        },
        fixedOverflowWidgets: false,

        // Disable suggestions/IntelliSense
        quickSuggestions: false,
        suggestOnTriggerCharacters: true,
        wordBasedSuggestions: false,
        parameterHints: { enabled: false },
        snippetSuggestions: 'none',
        tabCompletion: 'off',
        experimentalEditContextEnabled: false
      };

      _editor = monaco.editor.create(containerEl, { 
        ...defaultOptions, 
        ...options,
        // Force TextArea strategy
        editContext: false,
        experimentalEditContextEnabled: false
      });
      _model = _editor.getModel();
      
      // Force layout after a small delay
      setTimeout(() => {
        if (_editor) _editor.layout();
      }, 50);

      // 5. Xcode-style Navigation & Selection
      // ... (existing commands)
      _editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
        _editor.trigger('keyboard', 'cursorUp', {});
      });
      _editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
        _editor.trigger('keyboard', 'cursorDown', {});
      });

      _editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.UpArrow, () => {
        _editor.trigger('keyboard', 'cursorUpSelect', {});
      });
      _editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.DownArrow, () => {
        _editor.trigger('keyboard', 'cursorDownSelect', {});
      });

      // Relocate Toggle Comment to Cmd + Option + /
      _editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Slash, () => {
        _editor.trigger('keyboard', 'editor.action.commentLine', {});
      });

      // 6. Attachment Integration (Drop only, Paste handled globally in AttachmentService)
      const domNode = _editor.getDomNode();
      if (domNode) {
        // Handle Drag Events to prevent default indicators from getting stuck
        const container = document.getElementById('monaco-editor-container');
        const handleDrag = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (container && e.dataTransfer?.types?.includes('application/mdpreview-assets')) {
            e.dataTransfer.dropEffect = 'copy';
            container.classList.add('is-drop-target');
          }
        };

        domNode.addEventListener('dragenter', handleDrag, true);
        domNode.addEventListener('dragover', handleDrag, true);

        domNode.addEventListener('dragleave', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (container && !domNode.contains(e.relatedTarget)) {
            container.classList.remove('is-drop-target');
          }
        }, true);

        domNode.addEventListener('drop', (e) => {
          if (container) container.classList.remove('is-drop-target');
          if (window.AttachmentService && window.AppState?.currentWorkspace) {
            const target = _editor.getTargetAtClientPoint(e.clientX, e.clientY);
            if (target && target.position) {
              window.AttachmentService.handleDrop(e, target.position, window.AppState.currentWorkspace.path);
            } else {
              // Fallback to current cursor if target not found
              window.AttachmentService.handleDrop(e, _editor.getPosition(), window.AppState.currentWorkspace.path);
            }
          }
        }, true);

        // 7. Custom Context Menu for Images
        domNode.addEventListener('contextmenu', (e) => {
          const target = _editor.getTargetAtClientPoint(e.clientX, e.clientY);
          if (!target || !target.position) return;

          const pos = target.position;
          const model = _editor.getModel();
          if (!model) return;

          const lineContent = model.getLineContent(pos.lineNumber);
          const markdownRegex = /!\[(.*?)\]\((.*?)\)/g;
          const htmlRegex = /<img\s+[^>]*src=["'](.*?)["'][^>]*>/gi;
          
          let match;
          let foundImage = null;

          // 1. Try Markdown detection
          while ((match = markdownRegex.exec(lineContent)) !== null) {
            const startColumn = match.index + 1;
            const endColumn = startColumn + match[0].length;

            if (pos.column >= startColumn && pos.column <= endColumn) {
              const url = match[2];
              const urlStartColumn = startColumn + match[1].length + 4;
              const urlEndColumn = urlStartColumn + url.length;

              foundImage = {
                url: url,
                range: new monaco.Range(pos.lineNumber, urlStartColumn, pos.lineNumber, urlEndColumn),
                fullRange: new monaco.Range(pos.lineNumber, startColumn, pos.lineNumber, endColumn),
                isHTML: false
              };
              break;
            }
          }

          // 2. Try HTML detection if not found
          if (!foundImage) {
            while ((match = htmlRegex.exec(lineContent)) !== null) {
              const fullMatch = match[0];
              const url = match[1];
              const startColumn = match.index + 1;
              const endColumn = startColumn + fullMatch.length;

              if (pos.column >= startColumn && pos.column <= endColumn) {
                const srcMatch = /src=["']/.exec(fullMatch);
                if (srcMatch) {
                  const urlStartInFull = srcMatch.index + srcMatch[0].length;
                  const urlStartColumn = startColumn + urlStartInFull;
                  const urlEndColumn = urlStartColumn + url.length;

                  foundImage = {
                    url: url,
                    range: new monaco.Range(pos.lineNumber, urlStartColumn, pos.lineNumber, urlEndColumn),
                    fullRange: new monaco.Range(pos.lineNumber, startColumn, pos.lineNumber, endColumn),
                    isHTML: true
                  };
                }
                break;
              }
            }
          }

          // Check if selection spans one or more image links (for carousel wrap)
          const editorSel = _editor.getSelection();
          let carouselRange = null;
          let carouselImageCount = 0;
          if (editorSel && !editorSel.isEmpty()) {
            const sl = editorSel.startLineNumber;
            const el = editorSel.endLineNumber;
            carouselRange = new monaco.Range(sl, 1, el, model.getLineMaxColumn(el));
            const selText = model.getValueInRange(carouselRange);
            carouselImageCount = selText.split('\n').filter(l => /!\[[^\]]*\]\([^)]+\)/.test(l)).length;

            // If selection contains image links, skip single image actions by nullifying foundImage
            if (carouselImageCount >= 1) {
              foundImage = null;
            }
          }

          const shouldShowMenu = foundImage || carouselImageCount >= 1;

          if (shouldShowMenu && window.ContextMenuComponent && window.AttachmentService) {
            e.preventDefault();
            e.stopPropagation();

            const url = foundImage ? foundImage.url : '';
            const items = [];
            const isWeb = url.startsWith('http') || url.startsWith('//');
            const isEmpty = !url.trim();

            if (carouselImageCount >= 1) {
              const sl = editorSel.startLineNumber;
              const el = editorSel.endLineNumber;
              const selText = model.getValueInRange(carouselRange);
              const cleanText = selText.trim();
              const isWrappedInCarousel = cleanText.startsWith(':::carousel') && cleanText.endsWith(':::');

              let isCarouselWrapperOutside = false;
              if (sl > 1 && el < model.getLineCount()) {
                const prevLine = model.getLineContent(sl - 1).trim();
                const nextLine = model.getLineContent(el + 1).trim();
                if (prevLine === ':::carousel' && nextLine === ':::') {
                  isCarouselWrapperOutside = true;
                }
              }

              const hasCarousel = isWrappedInCarousel || isCarouselWrapperOutside;

              if (hasCarousel) {
                items.push({
                  label: 'Remove carousel',
                  icon: 'gallery-horizontal',
                  onClick: () => {
                    if (isWrappedInCarousel) {
                      const lines = cleanText.split('\n');
                      const innerLines = lines.slice(1, lines.length - 1).join('\n');
                      _editor.executeEdits('mdpreview', [{
                        range: carouselRange,
                        text: innerLines,
                        forceMoveMarkers: true
                      }]);
                    } else if (isCarouselWrapperOutside) {
                      const outerRange = new monaco.Range(sl - 1, 1, el + 1, model.getLineMaxColumn(el + 1));
                      _editor.executeEdits('mdpreview', [{
                        range: outerRange,
                        text: selText,
                        forceMoveMarkers: true
                      }]);
                    }
                  }
                });
              } else {
                items.push({
                  label: 'Wrap in carousel',
                  icon: 'gallery-horizontal',
                  onClick: () => {
                    _editor.executeEdits('mdpreview', [{
                      range: carouselRange,
                      text: `:::carousel\n${selText}\n:::`,
                      forceMoveMarkers: true
                    }]);
                  }
                });
              }

              items.push({ divider: true });

              items.push({
                label: 'Wrap all in Browser (Scroll)',
                icon: 'panel-top',
                onClick: () => {
                  const selText = model.getValueInRange(carouselRange);
                  const newText = selText.replace(/(!\[.*?\]\()([^)#]+)(?:#[^)]*)?(\))/g, '$1$2#browser:scroll$3');
                  _editor.executeEdits('mdpreview', [{
                    range: carouselRange,
                    text: newText,
                    forceMoveMarkers: true
                  }]);
                }
              });

              items.push({
                label: 'Wrap all in Phone (Scroll)',
                icon: 'phone',
                onClick: () => {
                  const selText = model.getValueInRange(carouselRange);
                  const newText = selText.replace(/(!\[.*?\]\()([^)#]+)(?:#[^)]*)?(\))/g, '$1$2#phone:scroll$3');
                  _editor.executeEdits('mdpreview', [{
                    range: carouselRange,
                    text: newText,
                    forceMoveMarkers: true
                  }]);
                }
              });

              items.push({
                label: 'Remove Mockup Frames',
                icon: 'frame',
                onClick: () => {
                  const selText = model.getValueInRange(carouselRange);
                  const newText = selText.replace(/(!\[.*?\]\()([^)#]+)(?:#[^)]*)?(\))/g, '$1$2$3');
                  _editor.executeEdits('mdpreview', [{
                    range: carouselRange,
                    text: newText,
                    forceMoveMarkers: true
                  }]);
                }
              });

              if (foundImage) items.push({ divider: true });
            }

            if (!foundImage) {
              window.ContextMenuComponent.open({ event: e, items });
              return;
            }

            const allMarkers = monaco.editor.getModelMarkers({ resource: model.uri });
            const isBroken = allMarkers.some(m =>
              m.source === 'Asset Validation' && monaco.Range.containsPosition(m, pos)
            );

            if (isEmpty) {
              // Case 1: Empty URL
              items.push({ 
                label: 'Upload from device', 
                icon: 'upload', 
                onClick: () => window.AttachmentService.pickAndReplaceImage(foundImage.range) 
              });
              if (window.AssetManager) {
                items.push({ 
                  label: 'Browse existing assets', 
                  icon: 'search', 
                  onClick: () => window.AssetManager.openPanel() 
                });
              }
            } else if (isWeb) {
              // Case 4: Web URL
              if (!isBroken) {
                items.push({
                  label: 'Zoom image',
                  icon: 'maximize-2',
                  onClick: () => {
                    const resolved = _resolveUrl(url);
                    if (resolved && window.ZoomSystem) {
                      window.ZoomSystem.open(resolved, 'image');
                    }
                  }
                });
                items.push({ divider: true });
              }
              items.push({
                label: 'Download to local image',
                icon: 'download',
                onClick: () => window.AttachmentService.downloadWebImage(url, foundImage.range)
              });
              items.push({ divider: true });
              items.push({
                label: isBroken ? 'Fix all broken with existing asset' : 'Replace link with another asset',
                icon: 'search',
                onClick: () => window.AttachmentService.openSmartReplace(foundImage, 'existing', isBroken)
              });
              items.push({
                label: isBroken ? 'Upload & fix all with new image' : 'Upload & replace with new image',
                icon: 'upload',
                onClick: () => window.AttachmentService.openSmartReplace(foundImage, 'upload', isBroken)
              });
            } else {
              // Case 2 & 3: Local Asset (Valid or Broken)
              if (!isBroken) {
                items.push({
                  label: 'Zoom image',
                  icon: 'maximize-2',
                  onClick: () => {
                    const resolved = _resolveUrl(url);
                    if (resolved && window.ZoomSystem) {
                      window.ZoomSystem.open(resolved, 'image');
                    }
                  }
                });
                items.push({
                  label: 'View asset detail',
                  icon: 'images',
                  onClick: () => window.AttachmentService.viewAssetDetail(url)
                });
                items.push({ divider: true });
              }

              items.push({
                label: isBroken ? 'Fix all broken with existing asset' : 'Replace link with another asset',
                icon: 'search',
                onClick: () => window.AttachmentService.openSmartReplace(foundImage, 'existing', isBroken)
              });
              items.push({
                label: isBroken ? 'Upload & fix all with new image' : 'Upload & replace with new image',
                icon: 'upload',
                onClick: () => window.AttachmentService.openSmartReplace(foundImage, 'upload', isBroken)
              });
              
              if (!isBroken && window.electronAPI.isElectron) {
                items.push({ divider: true });
                items.push({ 
                  label: 'Open in Finder', 
                  icon: 'external-link', 
                  onClick: () => window.AttachmentService.revealAsset(url) 
                });
              }
            }

            // Single image mockup options (for any foundImage)
            if (foundImage) {
              const hashIndex = url.indexOf('#');
              const hash = hashIndex !== -1 ? url.slice(hashIndex).toLowerCase() : '';
              const baseUrl = hashIndex !== -1 ? url.slice(0, hashIndex) : url;

              const isBrowserScroll = hash === '#browser:scroll';
              const isBrowserStatic = hash === '#browser';
              const isPhoneScroll = hash === '#phone:scroll';
              const isPhoneStatic = hash === '#phone';
              const hasMockup = isBrowserScroll || isBrowserStatic || isPhoneScroll || isPhoneStatic;

              items.push({ divider: true });

              items.push({
                label: 'Browser Frame (Scrollable)',
                icon: 'panel-top',
                active: isBrowserScroll,
                onClick: () => {
                  const newText = isBrowserScroll ? baseUrl : baseUrl + '#browser:scroll';
                  _editor.executeEdits('mdpreview', [{ range: foundImage.range, text: newText, forceMoveMarkers: true }]);
                }
              });

              items.push({
                label: 'Browser Frame (Static)',
                icon: 'panel-top',
                active: isBrowserStatic,
                onClick: () => {
                  const newText = isBrowserStatic ? baseUrl : baseUrl + '#browser';
                  _editor.executeEdits('mdpreview', [{ range: foundImage.range, text: newText, forceMoveMarkers: true }]);
                }
              });

              items.push({
                label: 'Phone Frame (Scrollable)',
                icon: 'phone',
                active: isPhoneScroll,
                onClick: () => {
                  const newText = isPhoneScroll ? baseUrl : baseUrl + '#phone:scroll';
                  _editor.executeEdits('mdpreview', [{ range: foundImage.range, text: newText, forceMoveMarkers: true }]);
                }
              });

              items.push({
                label: 'Phone Frame (Static)',
                icon: 'phone',
                active: isPhoneStatic,
                onClick: () => {
                  const newText = isPhoneStatic ? baseUrl : baseUrl + '#phone';
                  _editor.executeEdits('mdpreview', [{ range: foundImage.range, text: newText, forceMoveMarkers: true }]);
                }
              });

              if (hasMockup) {
                items.push({
                  label: 'Remove Mockup Frame',
                  icon: 'frame',
                  onClick: () => {
                    _editor.executeEdits('mdpreview', [{ range: foundImage.range, text: baseUrl, forceMoveMarkers: true }]);
                  }
                });
              }
            }

            window.ContextMenuComponent.open({
              event: e,
              items: items
            });
          }
        }, true);
      }

      // Also ensure Alt+Left/Right behaves like Xcode (Move by word) - Monaco does this by default on Mac
      // but we can enforce it if needed.

      _isInitialized = true;

      return _editor;
    },

    /**
     * Cleanup resources
     */
    dispose() {
      if (_editor) {
        const editorToDispose = _editor;
        _editor = null;
        _model = null;
        _isInitialized = false;

        // 1. Detach model immediately to stop internal async loops (decorations, etc.)
        try {
          if (editorToDispose.getModel()) {
            editorToDispose.setModel(null);
          }
        } catch (_e) { /* ignore */ }

        // 2. Attach a temporary global listener to swallow the "Canceled" rejection
        // that often fires asynchronously after dispose().
        if (!_rejectionListenerAttached) {
          const handler = (event) => {
            if (event.reason === 'Canceled' || (event.reason && event.reason.message === 'Canceled')) {
              event.preventDefault();
              event.stopPropagation();
            }
          };
          window.addEventListener('unhandledrejection', handler);
          _rejectionListenerAttached = true;
        }

        // 3. Dispose synchronously so Monaco's global focus registry is cleared
        // BEFORE the new editor is mounted and calls focus(). Previously, the rAF
        // delay caused the old editor's dispose to fire AFTER the new editor was
        // focused, clearing the new editor's _focused state and blocking input.
        try {
          editorToDispose.dispose();
        } catch (e) {
          if (e && e.message !== 'Canceled' && e.name !== 'Canceled') {
            console.warn('[MonacoService] Dispose error:', e);
          }
        }
      }
    },

    /**
     * Trigger layout recalculation
     */
    layout() {
      if (_editor) {
        _editor.layout();
      }
    },

    /**
     * Get full content
     */
    getValue() {
      return _model ? _model.getValue() : '';
    },

    /**
     * Set full content
     * @param {string} text 
     */
    setValue(text) {
      if (_model) _model.setValue(text);
    },

    /**
     * Get line count
     */
    getLineCount() {
      return _model ? _model.getLineCount() : 0;
    },

    /**
     * Get cursor position
     * @returns {Object} { lineNumber, column }
     */
    getCursorPosition() {
      return _editor ? _editor.getPosition() : { lineNumber: 1, column: 1 };
    },

    /**
     * Set cursor position
     * @param {Object} pos { lineNumber, column }
     */
    setCursorPosition(pos) {
      if (_editor) {
        _editor.setPosition(pos);
        _editor.revealPositionInCenter(pos, 1);
      }
    },

    /**
     * Get current selection
     */
    getSelection() {
      return _editor ? _editor.getSelection() : null;
    },

    /**
     * Set selection range by character offsets
     * @param {number} start 
     * @param {number} end 
     */
    setSelectionByOffsets(start, end) {
      if (!_editor || !_model) return;
      const startPos = _model.getPositionAt(start);
      const endPos = _model.getPositionAt(end);
      _editor.setSelection({
        startLineNumber: startPos.lineNumber,
        startColumn: startPos.column,
        endLineNumber: endPos.lineNumber,
        endColumn: endPos.column
      });
    },

    /**
     * Set selection range
     */
    setSelection(range) {
      if (_editor) _editor.setSelection(range);
    },

    /**
     * Execute a single edit operation
     */
    executeEdit(range, newText) {
      if (_editor) {
        _editor.executeEdits('mdpreview', [{
          range: range,
          text: newText,
          forceMoveMarkers: true
        }]);
      }
    },

    /**
     * Apply multiple edits
     */
    applyEdits(edits) {
      if (_editor) {
        _editor.executeEdits('mdpreview', edits.map(e => ({
          range: e.range,
          text: e.text,
          forceMoveMarkers: true
        })));
      }
    },

    /**
     * Undo
     */
    undo() {
      if (_editor) _editor.trigger('keyboard', 'undo', null);
    },

    /**
     * Redo
     */
    redo() {
      if (_editor) _editor.trigger('keyboard', 'redo', null);
    },

    /**
     * Scroll Management
     */
    getScrollTop() {
      return _editor ? _editor.getScrollTop() : 0;
    },

    setScrollTop(top) {
      if (_editor) _editor.setScrollTop(top);
    },

    revealLine(lineNumber) {
      if (_editor) _editor.revealLineInCenter(lineNumber);
    },

    getVisibleLineRange() {
      if (!_editor) return { startLine: 0, endLine: 0 };
      const ranges = _editor.getVisibleRanges();
      if (!ranges || ranges.length === 0) return { startLine: 0, endLine: 0 };
      return {
        startLine: ranges[0].startLineNumber,
        endLine: ranges[ranges.length - 1].endLineNumber
      };
    },

    /**
     * Get pixel position of cursor relative to viewport
     */
    getCursorPixelPosition() {
      if (!_editor) return { top: 0, left: 0 };
      const pos = _editor.getPosition();
      const pixelPos = _editor.getScrolledVisiblePosition(pos);
      return pixelPos;
    },

    /**
     * Content Widgets
     */
    addContentWidget(widget) {
      if (_editor) _editor.addContentWidget(widget);
    },

    layoutContentWidget(widget) {
      if (_editor) _editor.layoutContentWidget(widget);
    },

    removeContentWidget(widget) {
      if (_editor) _editor.removeContentWidget(widget);
    },

    /**
     * Event Listeners
     */
    onContentChange(callback) {
      if (_model) return _model.onDidChangeContent(callback);
    },

    onCursorChange(callback) {
      if (_editor) return _editor.onDidChangeCursorPosition(callback);
    },

    onScrollChange(callback) {
      if (_editor) return _editor.onDidScrollChange(callback);
    },

    /**
     * Helpers
     */
    getInstance() {
      return _editor;
    },

    focus() {
      if (_editor) _editor.focus();
    },

    isInitialized() {
      return _isInitialized;
    },

    getScrollContainer() {
      if (!_editor) return null;
      const container = _editor.getDomNode();
      return container ? container.querySelector('.lines-content') : null; // Monaco internal scroll container
    }
  };
})();

window.MonacoService = MonacoService;

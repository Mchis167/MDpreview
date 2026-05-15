/**
 * MonacoValidationService - Renderer Service
 * Chịu trách nhiệm kiểm tra tính hợp lệ của nội dung trong Monaco Editor.
 * Hiện tại: Kiểm tra broken links (tham chiếu asset không tồn tại).
 */
/* global MonacoService, monaco, AssetManager */
window.MonacoValidationService = (() => {
  'use strict';
  let _validationTimeout = null;
  let _decorationIds = [];
  let _currentErrors = []; // Track [{ range, decorationId, marker }] for surgical suppression
  let _currentMarkers = []; // Keep track of all current markers

  /**
   * Internal helper to clear all markers and decorations.
   */
  function _clearMarkers() {
    if (typeof monaco === 'undefined' || !MonacoService.isInitialized()) return;
    const editor = MonacoService.getInstance();
    const model = editor?.getModel();
    
    if (model) {
      monaco.editor.setModelMarkers(model, 'broken-links', []);
    }
    if (editor) {
      _decorationIds = editor.deltaDecorations(_decorationIds, []);
    }
    _currentErrors = [];
    _currentMarkers = [];
  }

  /**
   * Checks if a position is inside a code block, inline code, or comment.
   * This version uses pre-calculated full tokens for better accuracy.
   */
  function _isInsideSpecialContent(fullTokens, lineNumber, column) {
    if (!fullTokens || !fullTokens[lineNumber - 1]) return false;

    const lineTokens = fullTokens[lineNumber - 1];
    // The column in Monaco is 1-based, offset in tokens is 0-based.
    const offset = column - 1;
    
    for (let i = 0; i < lineTokens.length; i++) {
      const token = lineTokens[i];
      const nextTokenOffset = (i + 1 < lineTokens.length) ? lineTokens[i + 1].offset : 1000; // Large number if end of line
      
      if (offset >= token.offset && offset < nextTokenOffset) {
        const type = token.type.toLowerCase();
        // Exclude common technical scopes
        return type.includes('code') || 
               type.includes('comment') || 
               type.includes('block') || 
               type.includes('source') ||
               type.includes('pre') ||
               type.includes('script') ||
               type.includes('style') ||
               type.includes('metatag') ||
               type.includes('string.other.link.description.title.markdown');
      }
    }
    return false;
  }

  /**
   * Performs the actual validation logic.
   * Scans for assets/ links and checks against AssetManager registry.
   */
  function _validate() {
    if (typeof monaco === 'undefined' || !MonacoService.isInitialized()) return;

    const editor = MonacoService.getInstance();
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    // 1. Get all valid assets currently on disk
    const registry = (typeof AssetManager !== 'undefined' && typeof AssetManager.getRegistry === 'function') 
      ? AssetManager.getRegistry() 
      : { assets: [], orphans: [], broken: [] };
    
    // Combine active assets and orphans to get the complete list of files actually existing on disk
    const validNames = new Set([
      ...(registry.assets || []),
      ...(registry.orphans || [])
    ].map(a => a.name));
    
    // CRITICAL GUARD: If we have zero assets in registry, it might still be loading 
    // or the workspace is truly empty. To prevent "False Red" on every link,
    // we skip validation if the registry is empty.
    if (validNames.size === 0) {
      _clearMarkers();
      return;
    }
    
    // 2. Scan content for asset links
    const content = model.getValue();
    const languageId = model.getLanguageId();
    
    // Pre-calculate all tokens with full context to correctly identify multi-line blocks
    const fullTokens = monaco.editor.tokenize(content, languageId);
    
    const markers = [];
    const newDecorations = [];
    
    // Regex for Markdown links: ![alt](/assets/name.ext)
    // and HTML tags: <img src="/assets/name.ext">
    const ASSET_REGEX = /(!\[.*?\]\s*\((\/?assets\/([^)]+))\))|(<img\s+[^>]*src=["'](\/?assets\/([^"']+))["'])/g;
    
    let match;
    while ((match = ASSET_REGEX.exec(content)) !== null) {
      // match[3] is from Markdown, match[6] is from HTML
      const assetPath = match[3] || match[6];
      if (!assetPath) continue;

      // Clean up path (remove query params or hashes)
      const assetName = assetPath.split('?')[0].split('#')[0];
      const decodedName = decodeURIComponent(assetName);
      
      const startPos = model.getPositionAt(match.index);

      // Skip if inside code block, inline code, or comment
      if (_isInsideSpecialContent(fullTokens, startPos.lineNumber, startPos.column)) {
        continue;
      }

      // CRITICAL: If the asset name is NOT in the list of files existing on disk, it's broken.
      if (!validNames.has(decodedName)) {
        const endPos = model.getPositionAt(match.index + match[0].length);
        const range = new monaco.Range(
          startPos.lineNumber, 
          startPos.column, 
          endPos.lineNumber, 
          endPos.column
        );

        // A. Add Marker (for scrollbar/minimap/hover)
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: `Broken Image Link: The asset "${decodedName}" is missing from your workspace.`,
          startLineNumber: range.startLineNumber,
          startColumn: range.startColumn,
          endLineNumber: range.endLineNumber,
          endColumn: range.endColumn,
          source: 'Asset Validation'
        });

        // B. Add Decoration (for visual high-fidelity underline)
        newDecorations.push({
          range: range,
          options: {
            inlineClassName: 'ds-monaco-broken-link',
            hoverMessage: { value: `**Broken Image Link**\n\nThe asset "${decodedName}" could not be found in your workspace assets folder.` },
            overviewRuler: {
              color: 'rgba(255, 72, 72, 0.8)',
              position: 2 // monaco.editor.OverviewRulerLane.Right
            }
          }
        });
      }
    }

    // 3. Apply markers to Monaco
    monaco.editor.setModelMarkers(model, 'broken-links', markers);
    _currentMarkers = [...markers];

    // 4. Apply decorations
    const appliedIds = editor.deltaDecorations(_decorationIds, newDecorations);
    _decorationIds = appliedIds;
    
    // 5. Store detailed error data for surgical suppression
    _currentErrors = newDecorations.map((dec, i) => ({
      range: dec.range,
      decorationId: appliedIds[i],
      marker: markers[i]
    }));
  }

  return {
    /**
     * Initialize service (listeners etc.)
     */
    init() {
      // Service initialized
    },

    /**
     * Trigger a debounced validation pass.
     * Use this when content changes or registry updates.
     */
    trigger() {
      if (_validationTimeout) clearTimeout(_validationTimeout);
      
      // LOGIC: Surgical suppression if typing inside an existing error link
      const editor = MonacoService.getInstance();
      const pos = editor?.getPosition();
      const model = editor?.getModel();
      
      if (pos && model && _currentErrors.length > 0) {
        const errorIndex = _currentErrors.findIndex(err => monaco.Range.containsPosition(err.range, pos));
        
        if (errorIndex !== -1) {
          const error = _currentErrors[errorIndex];
          
          // 1. Remove only this decoration
          editor.deltaDecorations([error.decorationId], []);
          _decorationIds = _decorationIds.filter(id => id !== error.decorationId);
          
          // 2. Remove only this marker
          _currentMarkers = _currentMarkers.filter(m => m !== error.marker);
          monaco.editor.setModelMarkers(model, 'broken-links', _currentMarkers);
          
          // 3. Remove from tracking
          _currentErrors.splice(errorIndex, 1);
        }
      }

      _validationTimeout = setTimeout(() => {
        _validate();
        _validationTimeout = null;
      }, 500);
    },

    /**
     * Clear all markers and decorations from the current model.
     */
    clear() {
      _clearMarkers();
    }
  };
})();

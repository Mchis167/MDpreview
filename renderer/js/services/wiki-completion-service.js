/* global monaco */
/**
 * WikiCompletionService - Monaco completion provider for [[wikilinks]].
 * Suggests indexed paths, IDs and aliases from the wiki index (WikiService).
 */
(function () {
  const MAX_SUGGESTIONS = 100;

  /**
   * Extract the wikilink query from the text before the cursor.
   * Returns { query, startColumn } (1-based column right after `[[`),
   * or null if the cursor is not inside an open [[...
   */
  function parseWikilinkContext(textBeforeCursor) {
    const open = textBeforeCursor.lastIndexOf('[[');
    if (open === -1) return null;
    const afterOpen = textBeforeCursor.substring(open + 2);
    // Already closed, or newline-ish content — not inside a wikilink
    if (afterOpen.includes(']]')) return null;
    return { query: afterOpen, startColumn: open + 3 };
  }

  /**
   * Build plain suggestion descriptors from a wiki index.
   * Pure function — Monaco-agnostic for testability.
   * @returns {Array<{label:string, insertText:string, detail:string, sortText:string}>}
   */
  function buildSuggestions(query, index) {
    if (!index) return [];
    const q = (query || '').toLowerCase();
    const out = [];
    const seen = new Set();

    const push = (label, insertText, detail, rank) => {
      if (seen.has(insertText)) return;
      if (q && !label.toLowerCase().includes(q)) return;
      seen.add(insertText);
      out.push({ label, insertText, detail, sortText: rank + label });
    };

    for (const [id, p] of Object.entries(index.id_to_path || {})) {
      push(id, id, `ID → ${p}`, '0');
    }
    for (const [alias, p] of Object.entries(index.alias_to_path || {})) {
      push(alias, alias, `alias → ${p}`, '1');
    }
    for (const p of index.all_paths || []) {
      push(p, p, 'file', '2');
    }
    return out.slice(0, MAX_SUGGESTIONS);
  }

  const WikiCompletionService = {
    parseWikilinkContext,
    buildSuggestions,

    /**
     * Register the Monaco completion provider. Call once after Monaco loads.
     */
    register() {
      if (typeof monaco === 'undefined') return;
      monaco.languages.registerCompletionItemProvider('markdown', {
        triggerCharacters: ['['],
        async provideCompletionItems(model, position) {
          const line = model.getLineContent(position.lineNumber);
          const before = line.substring(0, position.column - 1);
          const ctx = parseWikilinkContext(before);
          if (!ctx) return { suggestions: [] };

          let index = window.WikiService ? window.WikiService.getIndex() : null;
          if (!index && window.WikiService) {
            await window.WikiService.init();
            index = window.WikiService.getIndex();
          }
          if (!index) return { suggestions: [] };

          const after = line.substring(position.column - 1);
          const closing = after.startsWith(']]') ? '' : ']]';
          const range = new monaco.Range(
            position.lineNumber, ctx.startColumn,
            position.lineNumber, position.column
          );
          return {
            suggestions: buildSuggestions(ctx.query, index).map(s => ({
              label: s.label,
              kind: monaco.languages.CompletionItemKind.File,
              detail: s.detail,
              insertText: s.insertText + closing,
              sortText: s.sortText,
              range,
            })),
          };
        },
      });
    },
  };

  window.WikiCompletionService = WikiCompletionService;
})();

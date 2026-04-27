/**
 * SearchService — Intelligent fuzzy search and scoring engine.
 * Purpose: Provide fast, relevant file search results with fuzzy matching.
 * Dependencies: None
 */
const SearchService = (() => {
  'use strict';

  /**
   * Scores a query against a target string.
   * @param {string} query 
   * @param {string} target 
   * @returns {Object|null} { score, matchedIndices }
   */
  function _score(query, target) {
    if (!query) return { score: 0, matchedIndices: [] };

    const q = query.toLowerCase();
    const t = target.toLowerCase();

    // 1. Exact match (highest)
    if (q === t) {
      return { score: 1000, matchedIndices: Array.from({ length: target.length }, (_, i) => i) };
    }

    // 2. Prefix match
    if (t.startsWith(q)) {
      return { score: 800, matchedIndices: Array.from({ length: q.length }, (_, i) => i) };
    }

    // 3. Substring match
    if (t.includes(q)) {
      const start = t.indexOf(q);
      return { score: 600, matchedIndices: Array.from({ length: q.length }, (_, i) => start + i) };
    }

    // 4. Fuzzy logic (character by character with gap penalties)
    let score = 0;
    let tIdx = 0;
    let qIdx = 0;
    const matchedIndices = [];

    while (qIdx < q.length && tIdx < t.length) {
      if (q[qIdx] === t[tIdx]) {
        matchedIndices.push(tIdx);
        // Bonus for consecutive matches
        if (matchedIndices.length > 1 && matchedIndices[matchedIndices.length - 2] === tIdx - 1) {
          score += 50;
        } else {
          score += 20;
        }
        // Bonus for matches at start of words or after separators
        if (tIdx === 0 || t[tIdx - 1] === '-' || t[tIdx - 1] === '_' || t[tIdx - 1] === ' ' || t[tIdx - 1] === '/') {
          score += 30;
        }
        qIdx++;
      } else {
        score -= 2; // Penalty for gaps
      }
      tIdx++;
    }

    // If all query characters were found in order
    if (qIdx === q.length) {
      // Scale score based on coverage
      score += (q.length / t.length) * 100;
      return { score, matchedIndices };
    }

    return null;
  }

  /**
   * Flatten tree data for searching
   * @param {Array} nodes 
   * @returns {Array} Flat list of file nodes
   */
  function _flatten(nodes, out = []) {
    nodes.forEach(node => {
      out.push(node);
      if (node.type === 'directory' && node.children) {
        _flatten(node.children, out);
      }
    });
    return out;
  }

  // ============================================
  // Public API
  // ============================================
  return {
    /**
     * Search across tree data
     * @param {string} query 
     * @param {Array} treeData 
     * @param {string} filterType 'all' | 'file' | 'directory'
     * @returns {Array} Sorted search results
     */
    search: function (query, treeData, filterType = 'all') {
      if (filterType === 'shortcut') {
        return this.searchShortcuts(query);
      }

      if (!query || !treeData) return [];

      const flatItems = _flatten(treeData);

      return flatItems
        .filter(node => {
          if (filterType === 'all') return true;
          return node.type === filterType;
        })
        .map(node => {
          // Check filename (higher weight)
          const nameMatch = _score(query, node.name);
          // Check path (lower weight)
          const pathMatch = _score(query, node.path);

          if (!nameMatch && !pathMatch) return null;

          // Calculate final score
          let finalScore = 0;
          let bestMatchedIndices = [];

          if (nameMatch) {
            finalScore += nameMatch.score * 2;
            bestMatchedIndices = nameMatch.matchedIndices;
          }

          if (pathMatch) {
            finalScore += pathMatch.score;
            // Only use path indices if name didn't match (for highlighting)
            if (!nameMatch) bestMatchedIndices = pathMatch.matchedIndices;
          }

          return {
            ...node,
            searchScore: finalScore,
            matchedIndices: bestMatchedIndices
          };
        })
        .filter(n => n !== null)
        .sort((a, b) => {
          if (b.searchScore !== a.searchScore) return b.searchScore - a.searchScore;
          // Priority: File > Directory
          if (a.type !== b.type) return a.type === 'file' ? -1 : 1;
          return 0;
        })
        .slice(0, 10); // Top 10 results for the palette
    },

    /**
     * Search specifically for shortcuts
     * @param {string} query
     * @returns {Array} List of matched shortcuts
     */
    searchShortcuts: function (query) {
      if (typeof window.ShortcutsComponent === 'undefined') return [];

      const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform) || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');
      const sections = window.ShortcutsComponent.getShortcutData(isMac);
      const allShortcuts = [];

      sections.forEach(sec => {
        sec.items.forEach(item => {
          allShortcuts.push({ ...item, group: sec.title, type: 'shortcut' });
        });
      });

      if (!query) return allShortcuts;

      return allShortcuts
        .map(item => {
          // 1. Check Label (Primary)
          const labelMatch = _score(query, item.label);
          
          // 2. Check Tags (Secondary)
          let bestTagMatch = null;
          if (item.tags) {
            item.tags.forEach(tag => {
              const tagMatch = _score(query, tag);
              if (tagMatch && (!bestTagMatch || tagMatch.score > bestTagMatch.score)) {
                bestTagMatch = tagMatch;
              }
            });
          }

          if (!labelMatch && !bestTagMatch) return null;

          // Scoring strategy: 
          // - Label match is heavily weighted (x2) to stay at the top.
          // - Tag match allows discovery when name is forgotten.
          let finalScore = 0;
          let matchedIndices = [];

          if (labelMatch) {
            finalScore = labelMatch.score * 2;
            matchedIndices = labelMatch.matchedIndices;
          } else if (bestTagMatch) {
            finalScore = bestTagMatch.score;
            // For tag matches, we don't highlight the label (as the query isn't in it)
            matchedIndices = [];
          }

          return {
            ...item,
            searchScore: finalScore,
            matchedIndices: matchedIndices
          };
        })
        .filter(n => n !== null)
        .sort((a, b) => b.searchScore - a.searchScore);
    }
  };
})();

// Explicit export to global scope
window.SearchService = SearchService;

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
      return { score: 1000, matchedIndices: Array.from(target.keys()) };
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
      if (node.type === 'file') {
        out.push(node);
      }
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
     * @returns {Array} Sorted search results
     */
    search: function(query, treeData) {
      if (!query || !treeData) return [];
      
      const flatFiles = _flatten(treeData);
      
      return flatFiles
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
        .sort((a, b) => b.searchScore - a.searchScore)
        .slice(0, 10); // Top 10 results for the palette
    }
  };
})();

// Explicit export to global scope
window.SearchService = SearchService;

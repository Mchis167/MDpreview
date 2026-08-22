/* ============================================================
   font-kit/catalog.js — the Google Fonts family list.

   Source: https://fonts.google.com/metadata/fonts — the same JSON
   fonts.google.com itself loads. No API key, no quota.

   Network access is injected as `fetchJson` so this module stays
   testable and host-agnostic (node fetch in the extension, window
   fetch elsewhere).
   ============================================================ */

(function () {

const METADATA_URL = 'https://fonts.google.com/metadata/fonts';

// Ba trục font của MDpreview map sang các category của Google.
// Font code phải là monospace; font tiêu đề được phép "có tính cách"
// hơn font thân bài, nên nhận cả Display lẫn Handwriting.
const ROLE_CATEGORIES = {
  body: ['Sans Serif', 'Serif'],
  title: ['Sans Serif', 'Serif', 'Display', 'Handwriting'],
  code: ['Monospace']
};

function normalizeFamily(entry) {
  return {
    family: entry.family,
    category: entry.category || null,
    subsets: Array.isArray(entry.subsets) ? entry.subsets : [],
    weights: entry.fonts ? Object.keys(entry.fonts) : []
  };
}

function createCatalog(deps = {}) {
  const fetchJson = deps.fetchJson;
  const url = deps.url || METADATA_URL;

  let families = null;
  let pending = null;

  async function load() {
    if (families) return families;
    if (!pending) {
      pending = Promise.resolve(fetchJson(url))
        .then((json) => {
          families = (json.familyMetadataList || []).map(normalizeFamily);
          return families;
        })
        .catch((err) => {
          pending = null;
          throw err;
        });
    }
    return pending;
  }

  function search(query, options = {}) {
    if (!families) return [];

    const allowed = options.role ? ROLE_CATEGORIES[options.role] : null;
    const q = (query || '').trim().toLowerCase();

    let matched = families.filter((f) => !allowed || allowed.includes(f.category));

    if (q) {
      // Xếp hạng: khớp từ đầu tên đứng trước khớp giữa tên. Người dùng
      // gõ "ca" hầu như luôn muốn "Caveat", không phải "Lexend Deca".
      matched = matched
        .map((f) => ({ font: f, idx: f.family.toLowerCase().indexOf(q) }))
        .filter((m) => m.idx !== -1)
        .sort((a, b) => a.idx - b.idx)
        .map((m) => m.font);
    }

    return options.limit ? matched.slice(0, options.limit) : matched;
  }

  /**
   * Giao giữa các weight mong muốn và các weight font thực sự có.
   * Không có giao → 400, vốn là weight mọi font đều ship.
   */
  function weightsFor(family, wanted) {
    const entry = families && families.find((f) => f.family === family);
    if (!entry || !entry.weights.length) return wanted.slice();

    const available = wanted.filter((w) => entry.weights.includes(String(w)));
    return available.length ? available : ['400'];
  }

  function get(family) {
    return (families && families.find((f) => f.family === family)) || null;
  }

  return { load, search, weightsFor, get };
}

const exportsObj = { createCatalog, ROLE_CATEGORIES, METADATA_URL };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportsObj;
}
if (typeof window !== 'undefined') {
  window.FontKitCatalog = exportsObj;
}

})();

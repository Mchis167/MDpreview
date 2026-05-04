/**
 * TOCService — Pure logic for scanning headings and building tree structures.
 * This service is shared between the local application and the Cloudflare Worker.
 * 
 * ADR 20260428-toc-scroll-sync-strategy: SCROLL_OFFSET must be consistent across environments.
 */

const SCROLL_OFFSET = 240;

/**
 * Scans headings (H2–H6) in a container or HTML string, returns a nested tree.
 * @param {HTMLElement|string} source - DOM element OR raw HTML string
 * @returns {Array} tree
 */
function scanHeadings(source) {
  let headingNodes;
  
  if (typeof source === 'string') {
    // SSR context: parse from HTML string (simulated DOM for extraction)
    // Note: In Cloudflare Worker, we use extractHeadingsSSR instead.
    const tmp = document.createElement('div');
    tmp.innerHTML = source;
    headingNodes = Array.from(tmp.querySelectorAll('h2,h3,h4,h5,h6'));
  } else {
    if (!source) return [];
    headingNodes = Array.from(source.querySelectorAll('h2,h3,h4,h5,h6'));
  }

  const flatList = headingNodes.map(node => {
    const lineEl = node.closest ? node.closest('.md-line') : null;
    return {
      text: node.textContent.trim(),
      level: parseInt(node.nodeName.substring(1)),
      line: lineEl ? parseInt(lineEl.getAttribute('data-line')) : 0,
      id: node.id || null,
      element: typeof source === 'string' ? null : node
    };
  });

  return buildTree(flatList);
}

/**
 * Converts flat heading list into nested tree structure.
 * @param {Array} flatList
 * @returns {Array} tree
 */
function buildTree(flatList) {
  const tree = [];
  const stack = [];
  
  flatList.forEach(item => {
    const node = { ...item, children: [] };
    
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }
    
    if (stack.length === 0) {
      tree.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    
    stack.push(node);
  });
  
  return tree;
}

/**
 * Renders a TOC item as a DOM element.
 * Used by web app. Publish uses SSR-injected HTML.
 * @param {Object} node - tree node
 * @param {Object} opts - { mode: 'app'|'publish', depth: number, DesignSystem: Object }
 * @returns {HTMLElement}
 */
function renderTocItem(node, opts = {}) {
  const { mode = 'app', depth = 0, DesignSystem = window.DesignSystem } = opts;
  
  if (!DesignSystem) {
    throw new Error('TOCService.renderTocItem requires DesignSystem');
  }

  const item = DesignSystem.createElement('div', ['ds-toc-item', `level-${node.level}`], {
    'data-line': node.line
  });
  
  if (node.id) item.setAttribute('data-heading-id', node.id);

  const content = DesignSystem.createElement('div', 'item-content');
  const label = DesignSystem.createElement('span', 'item-label', { text: node.text });
  content.appendChild(label);

  if (mode === 'publish' && node.id) {
    const link = document.createElement('a');
    link.href = `#${node.id}`;
    link.className = 'item-link';
    link.appendChild(content);
    item.appendChild(link);
  } else {
    item.appendChild(content);
  }

  if (node.children.length > 0) {
    const childrenContainer = DesignSystem.createElement('div', 'item-children');
    node.children.forEach(child => {
      childrenContainer.appendChild(renderTocItem(child, { ...opts, depth: depth + 1 }));
    });
    item.appendChild(childrenContainer);
  }

  return item;
}

// Export dual: CommonJS (Worker) + global (browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { scanHeadings, buildTree, renderTocItem, SCROLL_OFFSET };
} else {
  window.TocService = { scanHeadings, buildTree, renderTocItem, SCROLL_OFFSET };
}

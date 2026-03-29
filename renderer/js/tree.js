/* ============================================================
   tree.js — Sidebar File Tree logic
   ============================================================ */

const TreeModule = (() => {
  let treeData = [];
  let currentQuery = '';

  const svgChevronDown = `<svg class="item-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
  const svgFolder = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`;
  const svgFile = `<svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.33341 6L7.33341 4L5.33341 2M2.66675 2L0.666748 4L2.66675 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  async function load() {
    const res = await fetch('/api/files').catch(() => null);
    if (!res || !res.ok) return;
    treeData = await res.json();
    render();
  }

  function render() {
    currentStagger = 0;
    const container = document.getElementById('file-tree');
    if (!container) return;
    container.innerHTML = '';

    const filtered = filterTree(treeData, currentQuery);
    if (filtered.length === 0) {
      container.innerHTML = '<div style="padding:20px; color:rgba(255,255,255,0.2); font-size:12px; text-align:center;">No files found.</div>';
      return;
    }

    let globalIdx = 0;
    const renderNodes = (nodes, parentEl) => {
      nodes.forEach(node => {
        const el = createNodeEl(node, globalIdx++);
        parentEl.appendChild(el);
        if (node.type === 'directory' && node.expanded && node.children) {
          // Note: createNodeEl already handles children, but we need 
          // to ensure the index is correct if we were to recursivly render here.
          // In the current createNodeEl structure, it's already recursive.
        }
      });
    };

    renderNodes(filtered, container);
  }

  let currentStagger = 0;
  function createNodeEl(node) {
    const idx = currentStagger++;
    const wrapper = document.createElement('div');
    wrapper.className = 'tree-node-wrapper';

    const itemEl = document.createElement('div');
    itemEl.className = 'tree-item' + (node.path === AppState.currentFile ? ' active' : '');
    itemEl.style.setProperty('--stagger', idx);
    
    const icon = node.type === 'directory' ? svgFolder : svgFile;
    const chevron = node.type === 'directory' ? svgChevronDown : '<span style="width:12px;flex-shrink:0;"></span>';

    itemEl.innerHTML = `
      ${chevron}
      <div class="item-icon-wrap">${icon}</div>
      <span class="item-label" title="${_esc(node.name)}">${_esc(node.name)}</span>
    `;

    if (node.type === 'directory') {
      const childrenCont = document.createElement('div');
      childrenCont.className = 'folder-children' + (node.expanded ? '' : ' hidden');
      
      itemEl.onclick = (e) => {
        e.stopPropagation();
        node.expanded = !node.expanded;
        childrenCont.classList.toggle('hidden', !node.expanded);
        itemEl.querySelector('.item-chevron').style.transform = node.expanded ? 'rotate(0)' : 'rotate(-90deg)';
      };

      // Initial rotation
      itemEl.querySelector('.item-chevron').style.transform = node.expanded ? 'rotate(0)' : 'rotate(-90deg)';

      if (node.children) {
        node.children.forEach(child => {
          childrenCont.appendChild(createNodeEl(child));
        });
      }
      
      wrapper.appendChild(itemEl);
      wrapper.appendChild(childrenCont);
    } else {
      itemEl.onclick = () => {
        loadFile(node.path);
      };
      wrapper.appendChild(itemEl);
    }

    return wrapper;
  }

  function search(q) {
    currentQuery = (q || '').toLowerCase();
    const resultsCont = document.getElementById('search-results-list');
    if (resultsCont) {
      if (!currentQuery) {
        resultsCont.innerHTML = '';
      } else {
        const matches = _flattenAndFilter(treeData || [], currentQuery);
        resultsCont.innerHTML = '';
        if (matches.length === 0) {
          resultsCont.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:8px; padding:24px 0;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <div class="section-label" style="text-align:center; width:100%;">No File Founded</div>
            </div>`;
        } else {
          matches.forEach(m => {
            const el = createNodeEl(m);
            el.onclick = (e) => { e.stopPropagation(); loadFile(m.path); };
            resultsCont.appendChild(el);
          });
        }
      }
    }
    render(); 
  }

  function _flattenAndFilter(nodes, q) {
    let out = [];
    nodes.forEach(n => {
      if (n.type === 'file' && n.name.toLowerCase().includes(q)) out.push(n);
      if (n.type === 'directory' && n.children) out = out.concat(_flattenAndFilter(n.children, q));
    });
    return out;
  }

  function setActiveFile(filePath) {
    document.querySelectorAll('.tree-item').forEach(el => {
      el.classList.remove('active');
    });
    // This is imperfect because we render dynamically, 
    // but in a small app it's fine until next render().
    // Real logic: mark in treeData and re-render if needed.
    render(); 
  }

  function filterTree(nodes, q) {
    if (!q) return nodes;
    return nodes.reduce((acc, node) => {
      const matchSelf = node.name.toLowerCase().includes(q);
      if (node.type === 'directory') {
        const filteredChildren = filterTree(node.children, q);
        if (matchSelf || filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren, expanded: true });
        }
      } else if (matchSelf) {
        acc.push(node);
      }
      return acc;
    }, []);
  }

  function _esc(t) {
    const div = document.createElement('div');
    div.textContent = t;
    return div.innerHTML;
  }

  return { load, search, setActiveFile };
})();

const CollectModule = (() => {
  let ideas = [];
  let currentFilePath = null;

  // SVG constants removed in favor of Lucide icon names

  // ── Persistence ──────────────────────────────────────────
  function _getStorageKey(filePath) {
    return `mdpreview_ideas_${filePath}`;
  }

  function loadForFile(filePath) {
    if (!filePath) {
      ideas = [];
      _renderList();
      return;
    }
    currentFilePath = filePath;
    const stored = localStorage.getItem(_getStorageKey(filePath));
    ideas = stored ? JSON.parse(stored) : [];
    _renderList();
    _markLinesWithIdeas();
  }

  function _saveToStorage() {
    if (currentFilePath) {
      localStorage.setItem(_getStorageKey(currentFilePath), JSON.stringify(ideas));
    }
  }

  // ── CRUD ─────────────────────────────────────────────────
  function addIdea(text, lineStart = null, lineEnd = null, selectedText = null) {
    if (!text || text.trim() === '') return;
    
    const newIdea = {
      id: Date.now(),
      text: text.trim(),
      selectedText: selectedText || text.trim(), // Explicitly store selected text
      timestamp: new Date().toISOString(),
      lineStart,
      lineEnd
    };
    
    ideas.push(newIdea);
    _saveToStorage();
    _renderList();
    _markLinesWithIdeas();
    
    if (typeof showToast === 'function') {
      showToast('Idea bookmarked!');
    }
  }

  function removeIdea(id) {
    ideas = ideas.filter(i => i.id !== id);
    _saveToStorage();
    _renderList();
    _markLinesWithIdeas();
  }

  function clearAll() {
    if (!ideas.length) return;
    DesignSystem.showConfirm({
      title: 'Clear Collected Ideas',
      message: 'Are you sure you want to clear all collected ideas for this file?',
      onConfirm: () => {
        ideas = [];
        _saveToStorage();
        _renderList();
        _markLinesWithIdeas();
      }
    });
  }

  // ── Copy Functionality ───────────────────────────────────
  function copyAll() {
    if (!ideas.length) return;
    
    const lines = [];
    ideas.forEach((idea, index) => {
      lines.push(`idea ${index + 1}`);
      lines.push(idea.text);
      if (index < ideas.length - 1) {
        lines.push('');
        lines.push('----');
        lines.push('');
      }
    });
    
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      if (typeof showToast === 'function') {
        showToast(`Copied ${ideas.length} ideas to clipboard`);
      }
    });
  }

  // ── Rendering ────────────────────────────────────────────
  function _renderList() {
    const sidebar = RightSidebar.getInstance();
    if (!sidebar || AppState.currentMode !== 'collect') return;

    sidebar.setupModule({
      title: 'Collect',
      actions: [
        { id: 'clear', icon: 'trash', title: 'Clear all ideas', onClick: clearAll },
        { id: 'copy', icon: 'copy', title: 'Copy all ideas', onClick: copyAll }
      ],
      items: ideas,
      emptyState: {
        icon: 'bookmark',
        text: 'No ideas yet'
      },
      renderItem: (idea, index) => {
        const lineRef = idea.lineStart ? `LINE ${idea.lineStart}` : `IDEA ${index + 1}`;
        const item = DesignSystem.createElement('div', 'ds-sidebar-item');
        
        const header = DesignSystem.createElement('div', 'ds-item-header');
        const label = DesignSystem.createElement('span', 'ds-item-label', { text: lineRef });
        
        const deleteBtn = new IconActionButton({
          iconName: 'x',
          title: 'Remove',
          isDanger: true,
          className: 'ds-item-delete-btn',
          onClick: () => removeIdea(idea.id)
        });

        header.appendChild(label);
        header.appendChild(deleteBtn.render());

        const body = DesignSystem.createElement('div', 'ds-item-body ds-text-clamp-5', { html: _esc(idea.text) });

        item.appendChild(header);
        item.appendChild(body);
        
        item.onclick = () => _onItemClick(idea);
        
        return item;
      }
    });
  }

  function _onItemClick(idea) {
    if (!idea.lineStart) return;
    const targetLine = document.querySelector(`.md-line[data-line="${idea.lineStart}"]`);
    if (targetLine) {
      targetLine.scrollIntoView({ behavior: 'auto', block: 'center' });
      targetLine.classList.add('pulse-highlight-collect');
      setTimeout(() => targetLine.classList.remove('pulse-highlight-collect'), 2000);
    }
  }

  function _markLinesWithIdeas() {
    // 1. Clear old highlights
    document.querySelectorAll('.idea-range').forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      }
    });
    document.querySelectorAll('.md-line').forEach(el => el.classList.remove('has-idea'));
    
    // 2. Identify lines that need marking
    const lineMap = new Map();
    ideas.forEach(idea => {
      if (idea.lineStart) {
        const start = parseInt(idea.lineStart, 10);
        const end = idea.lineEnd ? parseInt(idea.lineEnd, 10) : start;
        for (let i = start; i <= end; i++) {
          if (!lineMap.has(i)) lineMap.set(i, []);
          lineMap.get(i).push(idea);
        }
      }
    });

    // 3. Apply highlights line by line
    lineMap.forEach((lineIdeas, lineNum) => {
      const lineEl = document.querySelector(`.md-line[data-line="${lineNum}"]`);
      if (!lineEl) return;
      _applyIdeaHighlights(lineEl, lineIdeas);
    });
  }

  function _applyIdeaHighlights(element, lineIdeas) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) textNodes.push(node);

    textNodes.forEach(textNode => {
      const content = textNode.textContent;
      const boundaries = new Set([0, content.length]);
      const nodeMap = new Map();

      lineIdeas.forEach(idea => {
        if (!idea.selectedText) return;
        let startIdx = 0;
        while ((startIdx = content.indexOf(idea.selectedText, startIdx)) !== -1) {
          const endIdx = startIdx + idea.selectedText.length;
          boundaries.add(startIdx);
          boundaries.add(endIdx);
          for (let i = startIdx; i < endIdx; i++) {
            if (!nodeMap.has(i)) nodeMap.set(i, idea);
          }
          startIdx = endIdx;
        }
      });

      if (nodeMap.size === 0) return;

      const sorted = Array.from(boundaries).sort((a, b) => a - b);
      const fragments = document.createDocumentFragment();
      for (let i = 0; i < sorted.length - 1; i++) {
        const start = sorted[i];
        const end = sorted[i+1];
        if (start === end) continue;
        const segmentText = content.substring(start, end);
        const idea = nodeMap.get(start);
        if (idea) {
          const mark = document.createElement('mark');
          mark.className = 'idea-range';
          mark.textContent = segmentText;
          mark.onclick = (e) => {
            e.stopPropagation();
            _onItemClick(idea);
          };
          fragments.appendChild(mark);
        } else {
          fragments.appendChild(document.createTextNode(segmentText));
        }
      }
      textNode.parentNode.replaceChild(fragments, textNode);
    });
  }

  function _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Selection Logic ──────────────────────────────────────
  let trigger = null;

  function applyCollectMode() {
    if (!trigger) {
      const triggerBtn = new IconActionButton({
        iconName: 'bookmark',
        title: 'Bookmark selection',
        isPrimary: true,
        isLarge: true,
        className: 'collect-trigger',
        onClick: (e) => _onTriggerClick(e)
      });
      trigger = triggerBtn.render();
      document.body.appendChild(trigger);
    }
    
    document.addEventListener('mouseup', _handleSelection);
    document.addEventListener('keyup', _handleSelection);
    _renderList(); // Initial render for sidebar
  }

  function removeCollectMode() {
    if (trigger) trigger.classList.remove('show');
    document.removeEventListener('mouseup', _handleSelection);
    document.removeEventListener('keyup', _handleSelection);
    
    const sidebar = RightSidebar.getInstance();
    if (sidebar) sidebar.close();
  }

  function _handleSelection() {
    const selection = window.getSelection();
    if (selection.isCollapsed || selection.toString().trim() === '') {
      if (trigger) trigger.classList.remove('show');
      return;
    }

    const range = selection.getRangeAt(0);
    const container = document.getElementById('md-content');
    
    if (!container.contains(range.commonAncestorContainer)) {
      if (trigger) trigger.classList.remove('show');
      return;
    }

    const rects = range.getClientRects();
    if (rects.length === 0) return;
    
    const lastRect = rects[rects.length - 1];
    
    if (trigger) {
      trigger.style.left = `${lastRect.right + 5}px`;
      trigger.style.top = `${lastRect.bottom + 5}px`;

      if (lastRect.right + 40 > window.innerWidth) {
        trigger.style.left = `${lastRect.left - 40}px`;
      }
      
      trigger.classList.add('show');
    }
  }

  function _onTriggerClick(e) {
    e.stopPropagation();
    const selection = window.getSelection();
    if (selection.isCollapsed) return;

    const text = selection.toString().trim();
    
    // Get line info
    const allLines = Array.from(document.querySelectorAll('.md-line'));
    const selectedLines = allLines.filter(el => selection.containsNode(el, true));
    let lineStart = null;
    let lineEnd = null;
    if (selectedLines.length > 0) {
      lineStart = parseInt(selectedLines[0].dataset.line, 10);
      lineEnd   = parseInt(selectedLines[selectedLines.length - 1].dataset.line, 10);
    }

    addIdea(text, lineStart, lineEnd, text); // Pass text as selectedText
    
    if (trigger) trigger.classList.remove('show');
    selection.removeAllRanges();
  }

  // ── Initialization ───────────────────────────────────────
  function init() {
    // UI is handled by RightSidebar organism
  }

  return {
    init,
    loadForFile,
    applyCollectMode,
    removeCollectMode,
    addIdea
  };
})();

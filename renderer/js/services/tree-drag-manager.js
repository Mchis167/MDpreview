/**
 * TreeDragManager.js — Extracted Drag & Drop Engine for Sidebar Tree.
 * 
 * Target: High-fidelity file reordering and movement.
 * Standard: Atomic Design V2 (Business Logic Service).
 */
const TreeDragManager = (() => {
  let isDragging = false;
  let autoExpandTimer = null;
  let lastHoveredHeader = null;

  let dragProxy = null;
  window.DRAG_DEBUG = false;
  let dragStartY = 0;
  let dragStartX = 0;
  let dragStartRect = null;
  let dragItemHeight = 0;
  let dragScrollCont = null;
  let dragInitialScroll = 0;

  /**
   * VIP Drag Engine Implementation
   * Handles manual reordering in "Custom Order" mode.
   */
  function initVIPDrag(e, itemEl, node, context) {
    const { state, treeData, load, _findNodeByPath } = context;
    
    isDragging = true;
    dragStartY = e.clientY;
    dragStartX = e.clientX;
    dragStartRect = itemEl.getBoundingClientRect();
    dragItemHeight = dragStartRect.height;
    // 1. BUILD VISUAL MAP (Flattened Tree)
    const treeViewport = document.getElementById('file-tree-mount');
    const treeContainer = document.getElementById('file-tree');
    if (!treeViewport || !treeContainer) {
      if (window.DRAG_DEBUG) console.warn('[VIP-Drag] Aborted: Missing viewports');
      isDragging = false;
      return;
    }

    // Correctly detect the scroll container for the main explorer
    dragScrollCont = treeContainer.closest('.ds-scroll-container');
    dragInitialScroll = dragScrollCont ? dragScrollCont.scrollTop : 0;
    const allWrappers = Array.from(treeContainer.querySelectorAll('.tree-node-wrapper'));
    const visualMap = allWrappers.map(wrapper => {
      const item = wrapper.querySelector('.tree-item');
      if (!item) return null;
      const path = item.dataset.path;
      const rect = item.getBoundingClientRect();
      const nodeData = _findNodeByPath(treeData, path);
      return { el: item, wrapper, path, level: (path.match(/\//g) || []).length, rect, type: nodeData ? nodeData.type : (item.classList.contains('tree-item-directory') ? 'directory' : 'file') };
    }).filter(Boolean);

    // Multi-selection
    const isItemSelected = state.selectedPaths.includes(node.path);
    const draggedItems = isItemSelected 
      ? state.selectedPaths.map(p => {
          // Find element anywhere in the sidebar (could be in All Files or Hidden)
          const el = document.querySelector(`.tree-item[data-path="${p.replace(/'/g, "\\'")}"]`);
          if (!el) return null;
          const nodeData = _findNodeByPath(treeData, p);
          return { 
            path: p, 
            name: p.split('/').pop(), 
            el, 
            wrapper: el.closest('.tree-node-wrapper'), 
            type: nodeData ? nodeData.type : (el.classList.contains('tree-item-directory') ? 'directory' : 'file')
          };
        }).filter(Boolean)
      : [{ path: node.path, name: node.name, el: itemEl, wrapper: itemEl.closest('.tree-node-wrapper'), type: node.type }];
    
    if (draggedItems.length === 0) {
      isDragging = false;
      return;
    }

    // 2. PRE-CALCULATE DRAGGED MAP & PREFIX SUMS (O(N))
    const draggedPathsMap = new Set(draggedItems.map(di => di.path));
    const draggedBeforeMap = new Array(visualMap.length).fill(0);
    let countSoFar = 0;
    visualMap.forEach((m, i) => {
      draggedBeforeMap[i] = countSoFar;
      if (draggedPathsMap.has(m.path)) countSoFar++;
    });

    let currentX = e.clientX;
    let isDraggingStarted = false;
    let animationFrameId = null;
    let currentY = e.clientY;

    // State of the current "Drop Target"
    let target = {
      parentPath: '', // '' means root
      index: 0,
      splitIdx: -1   // Index from last frame for stability
    };

    const updateUI = () => {
      if (!isDragging) return;

      const deltaY = currentY - dragStartY;
      const deltaX = currentX - dragStartX;
      const scrollDelta = dragScrollCont ? (dragScrollCont.scrollTop - dragInitialScroll) : 0;
      if (dragProxy) dragProxy.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.9)`;

      // 1. DYNAMIC TARGET SEARCH (Accounting for current offsets)
      let nearestIdx = -1;
      let minDistance = Infinity;
      let splitIdx = -1;

      // We do a more precise search by calculating the CURRENT top of each item
      for (let i = 0; i < visualMap.length; i++) {
        const m = visualMap[i];
        if (draggedPathsMap.has(m.path)) continue;

        // Calculate where this item is currently shifted
        let offset = -(dragItemHeight * draggedBeforeMap[i]);
        // If we are below the last frame's split point, we are shifted down by 1 item
        if (target.splitIdx !== -1 && i >= target.splitIdx) offset += dragItemHeight;

        const currentTop = m.rect.top + offset;
        const _currentBottom = currentTop + dragItemHeight;
        const currentCenter = currentTop + dragItemHeight / 2;

        const dist = Math.abs(currentY - (currentCenter - scrollDelta));
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      // ── DETACHED TARGET DETECTION ──
      const elsUnder = document.elementsFromPoint(currentX, currentY);
      
      // Check if we are inside the main tree viewport
      const _isInsideTree = treeViewport.getBoundingClientRect().top <= currentY && 
                            treeViewport.getBoundingClientRect().bottom >= currentY;

      const hiddenSection = elsUnder.find(el => 
        el.closest('#hidden-items-section') || 
        el.closest('.sidebar-footer') || 
        (el.classList.contains('sidebar-divider') && el.nextElementSibling?.id === 'hidden-items-section')
      );

      if (hiddenSection) {
        target = { type: 'hidden-section' };
        splitIdx = -1;

        // Visual Highlight for Hidden Section
        document.querySelectorAll('.drag-hover-section').forEach(el => el.classList.remove('drag-hover-section'));
        // No visual highlight here, just setting target
      } else if (nearestIdx !== -1) {
        const near = visualMap[nearestIdx];
        let spreadingOffset = -(dragItemHeight * draggedBeforeMap[nearestIdx]);
        // Re-apply split shift if necessary for this specific item's detection
        if (target.splitIdx !== -1 && nearestIdx >= target.splitIdx) spreadingOffset += dragItemHeight;
        
        const nearTop = near.rect.top - scrollDelta + spreadingOffset;
        const itemHeight = near.rect.height;
        const relativeY = currentY - nearTop;
        
        const elUnder = document.elementFromPoint(currentX, currentY);
        const folderAreaUnder = elUnder ? elUnder.closest('.folder-children') : null;
        const lastItem = visualMap[visualMap.length - 1];
        const isOverRootArea = lastItem ? (currentY > (lastItem.rect.bottom - scrollDelta + 5)) : false;

        const isFolder = near.type === 'directory';
        const edgeSize = isFolder ? 4 : (itemHeight * 0.5); 
        
        const isOverTop = relativeY < edgeSize;
        const isOverBottom = relativeY > (itemHeight - edgeSize);
        const nearBottom = nearTop + itemHeight;
        const isOverMiddle = isFolder && !isOverTop && !isOverBottom;

        splitIdx = nearestIdx; 
        
        if (isOverRootArea) {
          target = { parentPath: '', level: 0, type: 'between', y: -1, isRootDrop: true, splitIdx: visualMap.length };
          splitIdx = visualMap.length; 
        } else {
          if (near.type === 'directory' && isOverMiddle && !draggedItems.some(di => di.path === near.path)) {
            target = { parentPath: near.path, index: 0, level: near.level + 1, type: 'into', y: nearTop + itemHeight / 2, splitIdx: -1 };
            splitIdx = -1; 
          } else {
            const yPos = isOverTop ? nearTop : nearBottom;
            if (isOverBottom) splitIdx++; 
            
            let dropLevel = near.level;
            let dropParent = near.path.substring(0, near.path.lastIndexOf('/')) || '';

            if (folderAreaUnder) {
              const parentItem = folderAreaUnder.previousElementSibling;
              if (parentItem && parentItem.classList.contains('tree-item')) {
                dropParent = parentItem.getAttribute('data-path');
                dropLevel = (dropParent.match(/\//g) || []).length + 1;
              }
            } else {
              const xDelta = currentX - dragStartX;
              const levelShift = Math.round(xDelta / 20); 
              if (levelShift < 0) {
                for (let i = 0; i < Math.abs(levelShift); i++) {
                  if (dropParent) {
                    dropLevel--;
                    dropParent = dropParent.substring(0, dropParent.lastIndexOf('/')) || '';
                  }
                }
              }
            }
            
            target = { parentPath: dropParent, level: dropLevel, type: 'between', y: yPos, nearPath: near.path, isAfter: isOverBottom, splitIdx: splitIdx };
          }
        }

        // 2. OPTIMIZED SPREADING & HIGHLIGHTS
        // Toggle Root & Hidden Highlight (Minimalist Header-only)
        const explorerHeader = document.querySelector('#file-explorer-header-mount .sidebar-section-header');
        const hiddenHeader = document.querySelector('#hidden-items-header-mount .sidebar-section-header');
        
        if (explorerHeader) explorerHeader.classList.toggle('drag-hover-header', !!target.isRootDrop);
        if (hiddenHeader) hiddenHeader.classList.toggle('drag-hover-header', target.type === 'hidden-section');

        visualMap.forEach((m, idx) => {
          // Visual Highlight for "Into" target
          const isTargetFolder = (target.type === 'into' && target.parentPath === m.path);
          m.el.classList.toggle('drag-hover', isTargetFolder);

          const isBeingDragged = draggedPathsMap.has(m.path);
          if (isBeingDragged) {
            return;
          }
          
          let offset = -(dragItemHeight * draggedBeforeMap[idx]);
          if (splitIdx !== -1 && idx >= splitIdx) offset += dragItemHeight;
          
          const currentTransform = m.el.style.transform;
          const newTransform = offset !== 0 ? `translateY(${offset}px)` : '';
          if (currentTransform !== newTransform) {
            m.el.style.transform = newTransform;
          }
        });
      }

      if (dragScrollCont) {
        const rect = dragScrollCont.getBoundingClientRect();
        const threshold = 60;
        if (currentY < rect.top + threshold) dragScrollCont.scrollTop -= 5;
        if (currentY > rect.bottom - threshold) dragScrollCont.scrollTop += 5;
      }

      animationFrameId = requestAnimationFrame(updateUI);
    };

    const onMouseMove = (moveEvent) => {
      currentY = moveEvent.clientY;
      currentX = moveEvent.clientX;
      const dist = Math.sqrt(Math.pow(currentY - dragStartY, 2) + Math.pow(currentX - dragStartX, 2));

      if (!isDraggingStarted && dist > 5) {
        isDraggingStarted = true;
        document.body.classList.add('is-dragging');
        const treeContainer = document.getElementById('file-tree');
        if (treeContainer) treeContainer.classList.add('is-dragging-active');
        
        // Auto-collapse dragged folder ONLY when drag actually starts
        if (node.type === 'directory' && node.expanded) {
          node.expanded = false;
          const wrapper = itemEl.closest('.tree-node-wrapper');
          const childrenCont = wrapper.querySelector('.folder-children');
          if (childrenCont) childrenCont.style.display = 'none';
        }
        
        dragProxy = itemEl.cloneNode(true);
        dragProxy.classList.add('is-dragging-vip');
        dragProxy.style.width = `${dragStartRect.width}px`;
        dragProxy.style.height = `${dragStartRect.height}px`;
        dragProxy.style.left = `${dragStartRect.left}px`;
        dragProxy.style.top = `${dragStartRect.top}px`;
        
        if (draggedItems.length > 1) {
          const badge = document.createElement('div');
          badge.className = 'drag-badge';
          badge.innerText = draggedItems.length;
          dragProxy.appendChild(badge);
        }

        // Hide .md in drag proxy name
        const label = dragProxy.querySelector('.item-label');
        if (label && label.innerText.toLowerCase().endsWith('.md')) {
          label.innerText = label.innerText.substring(0, label.innerText.length - 3);
        }

        document.body.appendChild(dragProxy);

        draggedItems.forEach(di => di.wrapper.classList.add('tree-item-placeholder'));
        
        // Hide indentation lines for folders that become effectively empty
        const folderChildrenWrappers = new Set(draggedItems.map(di => di.wrapper.parentElement).filter(el => el && el.classList.contains('folder-children')));
        folderChildrenWrappers.forEach(container => {
          const totalChildren = container.querySelectorAll(':scope > .tree-node-wrapper').length;
          const draggedInThisFolder = container.querySelectorAll(':scope > .tree-node-wrapper.tree-item-placeholder').length;
          if (totalChildren === draggedInThisFolder) {
            container.classList.add('is-effectively-empty');
          }
        });

        animationFrameId = requestAnimationFrame(updateUI);
      }

      // ── Auto-expand logic for collapsed sections ──
      const elUnder = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const headerUnder = elUnder ? elUnder.closest('.sidebar-section-header') : null;
      if (headerUnder && headerUnder.closest('.sidebar-section.collapsed')) {
          if (lastHoveredHeader !== headerUnder) {
              if (autoExpandTimer) clearTimeout(autoExpandTimer);
              lastHoveredHeader = headerUnder;
              autoExpandTimer = setTimeout(() => {
                  if (isDragging && lastHoveredHeader === headerUnder) {
                      headerUnder.click();
                  }
              }, 600);
          }
      } else {
          if (autoExpandTimer) {
              clearTimeout(autoExpandTimer);
              autoExpandTimer = null;
          }
          lastHoveredHeader = null;
      }
    };

    const onMouseUp = async () => {
      const treeViewport = document.getElementById('file-tree-mount');
      if (treeViewport) {
        treeViewport.classList.remove('is-dragging-active');
        treeViewport.classList.remove('drag-hover-root');
      }
      const explorerHeader = document.querySelector('#file-explorer-header-mount .sidebar-section-header');
      if (explorerHeader) explorerHeader.classList.remove('drag-hover-header');
      const hiddenHeader = document.querySelector('#hidden-items-header-mount .sidebar-section-header');
      if (hiddenHeader) {
        hiddenHeader.classList.remove('drag-hover-header');
        const safeZone = hiddenHeader.closest('#hidden-items-section')?.querySelector('.ds-drop-safe-zone');
        if (safeZone) safeZone.remove();
      }

      visualMap.forEach(m => {
        m.el.style.transform = '';
        m.el.classList.remove('drag-hover');
        m.wrapper.classList.remove('tree-item-placeholder');
      });

      // Cleanup effectively empty folders
      document.querySelectorAll('.folder-children.is-effectively-empty').forEach(el => {
        el.classList.remove('is-effectively-empty');
      });

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.classList.remove('is-dragging');
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      
      if (!isDraggingStarted || draggedItems.length === 0) {
        isDragging = false;
        return;
      }

      if (dragProxy) {
        if (target.type === 'hidden-section') {
          const { handleBatchToggleHidden } = context;
          const draggedPaths = draggedItems.map(di => di.path);
          if (handleBatchToggleHidden) await handleBatchToggleHidden(true, draggedPaths, true);
          isDragging = false;
        } else {
          const destParentPath = target.parentPath;
          const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
          const hiddenPaths = new Set(AppState.settings.hiddenPaths || []);
          const toUnhide = [];
        
        // Calculate new index in target parent
        let orderKey = destParentPath || 'root';
        let currentOrder = [...(state.customOrders[orderKey] || [])];
        if (currentOrder.length === 0) {
          const pNode = destParentPath === '' ? treeData : _findNodeByPath(treeData, destParentPath);
          currentOrder = (pNode ? (destParentPath === '' ? pNode : pNode.children) : []).map(c => c.name);
        }

        // Calculate source folder for cleanup
        const sourceParentPath = draggedItems[0].path.substring(0, draggedItems[0].path.lastIndexOf('/')) || '';
        const _sourceOrderKey = sourceParentPath || 'root';

        let movedCount = 0;
        const draggedNames = draggedItems.map(di => di.path.split('/').pop());

        // 3. Perform actual move/reorder
        const newSelectedPaths = [];
        const oldSelectedPaths = [...state.selectedPaths];

        for (const item of draggedItems) {
          const fileName = item.path.split('/').pop();
          const srcRel = item.path;
          const destRel = destParentPath ? (destParentPath + '/' + fileName) : fileName;

          if (hiddenPaths.has(srcRel)) toUnhide.push(srcRel);

          if (srcRel !== destRel) {
            const srcAbs = (wsPath + '/' + srcRel).replace(/\/\//g, '/');
            const destAbs = (wsPath + '/' + destRel).replace(/\/\//g, '/');

            if (item.type === 'directory' && destRel.startsWith(item.path + '/')) continue;

            const res = await FileService.moveFile(srcAbs, destAbs);
            if (res.success) {
              movedCount++;

              // PERSISTENCE SYNC
              if (AppState.currentFile === srcRel) AppState.currentFile = destRel;
              if (typeof RecentlyViewedModule !== 'undefined') RecentlyViewedModule.swap(srcRel, destRel);
              if (typeof TabsModule !== 'undefined') TabsModule.swap(srcRel, destRel);

              // Update selection map
              if (oldSelectedPaths.includes(srcRel)) {
                newSelectedPaths.push(destRel);
              }
            } else {
              if (oldSelectedPaths.includes(srcRel)) newSelectedPaths.push(srcRel);
            }
          } else {
            if (oldSelectedPaths.includes(srcRel)) newSelectedPaths.push(srcRel);
          }
        }

        if (toUnhide.length > 0) {
          const { handleBatchToggleHidden } = context;
          if (handleBatchToggleHidden) await handleBatchToggleHidden(false, toUnhide, true);
        }

        // Update state selection (After unhide to ensure it persists)
        if (newSelectedPaths.length > 0) {
          state.selectedPaths = newSelectedPaths;
        }

        // Update Custom Orders: Remove from every unique SOURCE folder, then Insert into TARGET.
        // Build a per-source-folder map so multi-folder selections are all cleaned correctly.
        const sourceCleanupMap = new Map();
        draggedItems.forEach(di => {
          const parent = di.path.substring(0, di.path.lastIndexOf('/')) || '';
          const key = parent || 'root';
          if (!sourceCleanupMap.has(key)) sourceCleanupMap.set(key, new Set());
          sourceCleanupMap.get(key).add(di.path.split('/').pop());
        });
        sourceCleanupMap.forEach((names, srcKey) => {
          if (srcKey !== orderKey && state.customOrders[srcKey]) {
            state.customOrders[srcKey] = state.customOrders[srcKey].filter(n => !names.has(n));
          }
        });

        // Filter dragged items out FIRST, then find insertion index in the cleaned array.
        // This avoids off-by-one when the dragged item sits before the target in the original order.
        currentOrder = currentOrder.filter(name => !draggedNames.includes(name));
        let insertIdx;
        if (target.type === 'between' && !target.isRootDrop) {
          const nearName = target.nearPath.split('/').pop();
          insertIdx = currentOrder.indexOf(nearName);
          if (insertIdx === -1) {
            insertIdx = currentOrder.length;
          } else if (target.isAfter) {
            insertIdx++;
          }
        } else {
          // 'into' or rootDrop: always append at end of target folder
          insertIdx = currentOrder.length;
        }
        if (insertIdx > currentOrder.length) insertIdx = currentOrder.length;
        currentOrder.splice(insertIdx, 0, ...draggedNames);
        state.customOrders[orderKey] = currentOrder;
        
        localStorage.setItem('mdpreview_custom_orders', JSON.stringify(state.customOrders));
        if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();

        if (movedCount > 0 || target.index !== -1 || toUnhide.length > 0) {
          if (destParentPath) {
            const pNode = _findNodeByPath(treeData, destParentPath);
            if (pNode) pNode.expanded = true;
          }
          isDragging = false;
          load();
        }
      }

        dragProxy.style.opacity = '0';
        dragProxy.style.transform += ' scale(0.8)';
        setTimeout(() => {
          if (dragProxy) dragProxy.remove();
          dragProxy = null;
          isDragging = false;
        }, 300);
      } else {
        isDragging = false;
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Standard Drag Engine Implementation
   * Handles alphabetical movement between folders.
   */
  function initStandardDrag(e, itemEl, node, context) {
    const { state, treeData, load, _findNodeByPath } = context;

    if (isDragging) return;
    isDragging = true;

    const dragStartX = e.clientX;
    const dragStartY = e.clientY;
    let dragProxy = null;
    let isDraggingStarted = false;
    let currentTargetEl = null;
    let targetPath = null;
    let lastSecondaryTarget = null;

    const isItemSelected = state.selectedPaths.includes(node.path);
    const draggedPaths = isItemSelected ? [...state.selectedPaths] : [node.path];
    const treeViewport = document.getElementById('file-tree-mount');
    const container = itemEl.closest('.ds-tree-view'); // Dynamically detect container
    if (!treeViewport || !container) {
      if (window.DRAG_DEBUG) console.warn('[Standard-Drag] Aborted: Missing viewports');
      return;
    }
    const draggedItems = draggedPaths.map(p => {
      const el = container.querySelector(`.tree-item[data-path="${p.replace(/'/g, "\\'")}"]`);
      const nodeData = _findNodeByPath(treeData, p);
      return { path: p, el, type: nodeData ? nodeData.type : 'file', name: p.split('/').pop() };
    }).filter(di => di.el);

    if (draggedItems.length === 0) {
      isDragging = false;
      return;
    }

    // Correctly detect the scroll container for the main explorer
    const dragScrollCont = container.closest('.ds-scroll-container');
    const _dragInitialScroll = dragScrollCont ? dragScrollCont.scrollTop : 0;

    const onMouseMove = (moveEvent) => {
      const dist = Math.sqrt(Math.pow(moveEvent.clientX - dragStartX, 2) + Math.pow(moveEvent.clientY - dragStartY, 2));

      if (!isDraggingStarted && dist > 8) {
        isDraggingStarted = true;
        document.body.classList.add('is-dragging');
        if (treeViewport) treeViewport.classList.add('is-dragging-active');
        
        // 1. Create Proxy (Compact stack style)
        dragProxy = document.createElement('div');
        dragProxy.className = 'standard-drag-proxy';
        
        const icon = document.createElement('i');
        icon.className = draggedItems[0].type === 'directory' ? 'ri-folder-fill' : 'ri-file-text-line';
        dragProxy.appendChild(icon);

        const label = document.createElement('span');
        let displayName = draggedItems.length === 1 ? draggedItems[0].name : `${draggedItems.length} items`;
        if (draggedItems.length === 1 && displayName.toLowerCase().endsWith('.md')) {
          displayName = displayName.substring(0, displayName.length - 3);
        }
        label.innerText = displayName;
        dragProxy.appendChild(label);

        if (draggedItems.length > 1) {
          const badge = document.createElement('div');
          badge.className = 'drag-badge';
          badge.innerText = draggedItems.length;
          dragProxy.appendChild(badge);
        }

        document.body.appendChild(dragProxy);

        // 2. Dim sources
        draggedItems.forEach(di => di.el.classList.add('is-dragging-source'));

        // 3. Create Safe Zone for Hidden Section
        const hSection = document.getElementById('hidden-items-section');
        if (hSection && !hSection.querySelector('.ds-drop-safe-zone')) {
          const safeZone = document.createElement('div');
          safeZone.className = 'ds-drop-safe-zone';
          hSection.appendChild(safeZone);
        }
      }

      if (isDraggingStarted && dragProxy) {
        dragProxy.style.left = `${moveEvent.clientX}px`;
        dragProxy.style.top = `${moveEvent.clientY}px`;

        // 3. Target Detection (Using elementsFromPoint for deep detection)
        const elsUnder = document.elementsFromPoint(moveEvent.clientX, moveEvent.clientY);

        if (elsUnder.length === 0) return;
        
        const elUnder = elsUnder[0]; // Primary element
        const itemUnder = elUnder.closest('.tree-item');
        const wrapperUnder = elUnder.closest('.tree-node-wrapper');
        
        let primaryTarget = null;
        let secondaryTarget = null;
        let finalPath = null;

        // ── Prioritize Hidden Section detection (Deep scan) ──
        const hiddenSection = elsUnder.find(el => 
            el.closest('#hidden-items-section') || 
            el.closest('.sidebar-footer') || 
            (el.classList.contains('sidebar-divider') && el.nextElementSibling?.id === 'hidden-items-section')
        );

        if (hiddenSection) {
          primaryTarget = null;
          secondaryTarget = null;
          finalPath = null;
          targetPath = '__HIDDEN__';
        } else {
          if (itemUnder) {
            const path = itemUnder.getAttribute('data-path');
            const isDir = itemUnder.classList.contains('tree-item-directory');
            
            if (isDir) {
              primaryTarget = itemUnder;
              finalPath = path;
            } else {
              secondaryTarget = itemUnder;
              const parentPath = path.substring(0, path.lastIndexOf('/')) || '';
              primaryTarget = document.querySelector(`.tree-item[data-path="${parentPath.replace(/'/g, "\\'")}"]`);
              finalPath = parentPath;
            }
          } else if (wrapperUnder) {
            const mainItem = wrapperUnder.querySelector(':scope > .tree-item');
            if (mainItem && mainItem.classList.contains('tree-item-directory')) {
              primaryTarget = mainItem;
              finalPath = mainItem.getAttribute('data-path');
            }
          }
        }

        // ── NEW: CALCULATE FINAL TARGET PATH INDEPENDENTLY ──
        let newTargetPath = null;
        if (hiddenSection) {
          newTargetPath = '__HIDDEN__';
        } else if (finalPath !== null) {
          newTargetPath = finalPath;
        } else {
          const treeRect = treeViewport.getBoundingClientRect();
          const isInsideTree = moveEvent.clientX >= treeRect.left && moveEvent.clientX <= treeRect.right &&
                               moveEvent.clientY >= treeRect.top && moveEvent.clientY <= treeRect.bottom;
          if (isInsideTree) newTargetPath = ''; // Root
        }
        targetPath = newTargetPath;

        // ── Minimalist Header Highlights ──
        const explorerHeader = document.querySelector('#file-explorer-header-mount .sidebar-section-header');
        const hiddenHeader = document.querySelector('#hidden-items-header-mount .sidebar-section-header');
        
        if (explorerHeader) explorerHeader.classList.toggle('drag-hover-header', targetPath === '');
        if (hiddenHeader) hiddenHeader.classList.toggle('drag-hover-header', targetPath === '__HIDDEN__');

        // Apply Item Highlights
        if (currentTargetEl !== primaryTarget || lastSecondaryTarget !== secondaryTarget) {
          lastSecondaryTarget = secondaryTarget;
          
          const treeContainer = document.getElementById('file-tree');
          treeContainer.querySelectorAll('.drag-hover, .drag-hover-secondary').forEach(el => {
            el.classList.remove('drag-hover', 'drag-hover-secondary');
          });

          currentTargetEl = primaryTarget;
          
          if (targetPath === '__HIDDEN__') {
            // No item highlights for hidden
          } else if (primaryTarget) {
            const isInvalid = draggedItems.some(di => targetPath === di.path || targetPath.startsWith(di.path + '/'));
            if (!isInvalid) {
              primaryTarget.classList.add('drag-hover');
              if (secondaryTarget) secondaryTarget.classList.add('drag-hover-secondary');
            }
          } else if (targetPath === '') {
            currentTargetEl = treeViewport;
          }
        }

        // ── Auto-expand logic ──
        const headerUnder = elUnder ? elUnder.closest('.sidebar-section-header') : null;
        if (headerUnder && headerUnder.closest('.sidebar-section.collapsed')) {
            if (lastHoveredHeader !== headerUnder) {
                if (autoExpandTimer) clearTimeout(autoExpandTimer);
                lastHoveredHeader = headerUnder;
                autoExpandTimer = setTimeout(() => {
                    if (isDragging && lastHoveredHeader === headerUnder) {
                        headerUnder.click();
                    }
                }, 600);
            }
        } else {
            if (autoExpandTimer) {
                clearTimeout(autoExpandTimer);
                autoExpandTimer = null;
            }
            lastHoveredHeader = null;
        }
      }

      if (dragScrollCont) {
        const rect = dragScrollCont.getBoundingClientRect();
        const threshold = 60;
        if (moveEvent.clientY < rect.top + threshold) dragScrollCont.scrollTop -= 5;
        if (moveEvent.clientY > rect.bottom - threshold) dragScrollCont.scrollTop += 5;
      }
    };

    const onMouseUp = async () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.classList.remove('is-dragging');

      if (!isDraggingStarted || draggedItems.length === 0) {
        isDragging = false;
        return;
      }

      // 1. Cleanup UI
      if (dragProxy) dragProxy.remove();
      draggedItems.forEach(di => di.el.classList.remove('is-dragging-source'));
      
      const treeContainer = document.getElementById('file-tree');
      if (treeContainer) {
        treeContainer.querySelectorAll('.drag-hover, .drag-hover-secondary').forEach(el => {
          el.classList.remove('drag-hover', 'drag-hover-secondary');
        });
        treeContainer.classList.remove('drag-hover-root');
        treeContainer.classList.remove('is-dragging-active');
      }
      
      const explorerHeader = document.querySelector('#file-explorer-header-mount .sidebar-section-header');
      if (explorerHeader) explorerHeader.classList.remove('drag-hover-header');
      
      const hiddenHeader = document.querySelector('#hidden-items-header-mount .sidebar-section-header');
      if (hiddenHeader) {
        hiddenHeader.classList.remove('drag-hover-header');
        const hSection = hiddenHeader.closest('#hidden-items-section');
        if (hSection) {
          const safeZone = hSection.querySelector('.ds-drop-safe-zone');
          if (safeZone) safeZone.remove();
        }
      }

      // 2. Perform Move
      if (targetPath === '__HIDDEN__') {
        const { handleBatchToggleHidden } = context;
        if (handleBatchToggleHidden) await handleBatchToggleHidden(true, draggedPaths, true);
      } else if (targetPath !== null) {
        const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
        let movedCount = 0;
        const newSelectedPaths = [];
        const oldSelectedPaths = [...state.selectedPaths];
        const hiddenPaths = new Set(AppState.settings.hiddenPaths || []);
        const toUnhide = [];

        for (const item of draggedItems) {
          const srcRel = item.path;
          const destRel = targetPath ? (targetPath + '/' + item.name).replace(/\/\//g, '/') : item.name;

          if (hiddenPaths.has(srcRel)) toUnhide.push(srcRel);

          if (srcRel !== destRel) {
            const srcAbs = (wsPath + '/' + srcRel).replace(/\/\//g, '/');
            const destAbs = (wsPath + '/' + destRel).replace(/\/\//g, '/');
            
            const res = await FileService.moveFile(srcAbs, destAbs);
            if (res.success) {
              movedCount++;
              syncCustomOrder(srcRel, destRel, state);
              
              // PERSISTENCE SYNC
              if (AppState.currentFile === srcRel) AppState.currentFile = destRel;
              if (typeof RecentlyViewedModule !== 'undefined') RecentlyViewedModule.swap(srcRel, destRel);
              if (typeof TabsModule !== 'undefined') TabsModule.swap(srcRel, destRel);

              if (oldSelectedPaths.includes(srcRel)) {
                newSelectedPaths.push(destRel);
              }
            } else {
               if (oldSelectedPaths.includes(srcRel)) newSelectedPaths.push(srcRel);
            }
          } else {
            if (oldSelectedPaths.includes(srcRel)) newSelectedPaths.push(srcRel);
          }
        }

        if (toUnhide.length > 0) {
          const { handleBatchToggleHidden } = context;
          if (handleBatchToggleHidden) {
            await handleBatchToggleHidden(false, toUnhide, true);
          }
        }

        if (newSelectedPaths.length > 0) {
          state.selectedPaths = newSelectedPaths;
        }

        if (movedCount > 0 || toUnhide.length > 0) {
          const pNode = _findNodeByPath(treeData, targetPath);
          if (pNode) pNode.expanded = true;
          load();
        }
      }


      isDragging = false;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Proactively syncs custom order metadata when files are moved or renamed.
   */
  function syncCustomOrder(oldPath, newPath, state) {
    const oldParent = oldPath.substring(0, oldPath.lastIndexOf('/')) || 'root';
    const newParent = newPath.substring(0, newPath.lastIndexOf('/')) || 'root';
    const oldName = oldPath.split('/').pop();
    const newName = newPath.split('/').pop();

    if (oldParent === newParent) {
      if (state.customOrders[oldParent]) {
        state.customOrders[oldParent] = state.customOrders[oldParent].map(n => n === oldName ? newName : n);
      }
    } else {
      if (state.customOrders[oldParent]) {
        state.customOrders[oldParent] = state.customOrders[oldParent].filter(n => n !== oldName);
        if (state.customOrders[oldParent].length === 0) delete state.customOrders[oldParent];
      }
      if (state.customOrders[newParent]) {
        if (!state.customOrders[newParent].includes(newName)) {
          state.customOrders[newParent].push(newName);
        }
      }
    }
    localStorage.setItem('mdpreview_custom_orders', JSON.stringify(state.customOrders));
    if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();
  }

  return {
    getIsDragging: () => isDragging,
    setIsDragging: (val) => { isDragging = val; },
    initVIPDrag,
    initStandardDrag,
    syncCustomOrder
  };
})();

window.TreeDragManager = TreeDragManager;

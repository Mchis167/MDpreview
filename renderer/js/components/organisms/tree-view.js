/* ══════════════════════════════════════════════════
   TreeViewComponent.js — Atomic Design (Organism)
   Quản lý toàn bộ cây thư mục, render đệ quy và lọc tìm kiếm.
   ══════════════════════════════════════════════════ */

class TreeViewComponent {
    constructor(options = {}) {
        this.mount = options.mount || document.getElementById('file-tree');
        this.options = options; // Chứa các callback từ TreeModule
        this.state = {
            treeData: [],
            selectedPaths: [],
            currentQuery: '',
            sortMethod: 'alphabetical_asc'
        };
    }

    /**
     * Cập nhật dữ liệu và render lại
     */
    update(newData, selectedPaths, currentQuery, sortMethod, activePath, renamingPath) {
        this.state.treeData = newData;
        this.state.selectedPaths = selectedPaths;
        this.state.currentQuery = currentQuery;
        this.state.sortMethod = sortMethod;
        this.state.activePath = activePath;
        this.state.renamingPath = renamingPath;
        this.render();
    }

    /**
     * Render trạng thái chờ chuyên nghiệp với Skeleton
     */
    renderSkeleton(count = 8) {
        if (!this.mount) return;
        this.mount.classList.add('ds-tree-view');
        this.mount.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const row = document.createElement('div');
            row.className = 'skeleton-row';
            // Tạo độ dài ngẫu nhiên cho thanh text để trông tự nhiên hơn
            const randomWidth = Math.floor(Math.random() * 40) + 40; 
            row.innerHTML = `
                <div class="skeleton skeleton-icon" style="width: 14px; height: 14px; margin-left: ${i > 3 ? '12px' : '0'}"></div>
                <div class="skeleton skeleton-text" style="width: ${randomWidth}%; height: 12px;"></div>
            `;
            this.mount.appendChild(row);
        }
    }

    render() {
        if (!this.mount) return;

        // Thêm class chuẩn cho CSS
        this.mount.classList.add('ds-tree-view');
        this.mount.innerHTML = '';

        if (this.state.treeData.length === 0) {
            this.mount.innerHTML = '<div style="padding:40px 20px; color:rgba(255,255,255,0.15); font-size:12px; text-align:center; font-family:var(--font-code); text-transform:uppercase; letter-spacing:0.05em;">No items found</div>';
            return;
        }

        const fragment = document.createDocumentFragment();
        let globalIdx = 0;

        const checkDuplicate = (node, newName) => {
            if (!newName) return false;
            
            // Normalize name
            let checkName = newName.trim();
            if (node.type === 'file' && !checkName.toLowerCase().endsWith('.md')) {
                checkName += '.md';
            }
            
            if (checkName.toLowerCase() === node.name.toLowerCase()) return false;
            
            const oldPath = node.path;
            const lastSlashIdx = oldPath.lastIndexOf('/');
            const dirPrefix = lastSlashIdx !== -1 ? oldPath.substring(0, lastSlashIdx + 1) : '';
            
            const getSiblings = (nodes) => {
                if (lastSlashIdx === -1) {
                    return nodes;
                }
                
                const parentPath = dirPrefix.slice(0, -1);
                const findParent = (list) => {
                    for (const n of list) {
                        if (n.path === parentPath) return n.children || [];
                        if (n.children) {
                            const found = findParent(n.children);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                return findParent(nodes) || [];
            };
            
            const siblings = getSiblings(this.state.treeData);
            return siblings.some(s => s.path !== oldPath && s.name.toLowerCase() === checkName.toLowerCase());
        };

        const renderNodes = (nodes, parentEl) => {
            nodes.forEach(node => {
                const itemComp = new TreeItemComponent(node, this.options, {
                    selectedPaths: this.state.selectedPaths,
                    currentFile: this.state.activePath,
                    renamingPath: this.state.renamingPath,
                    checkDuplicate: (newName, targetNode) => checkDuplicate(targetNode || node, newName)
                });
                const el = itemComp.render(globalIdx++);
                parentEl.appendChild(el);
            });
        };

        renderNodes(this.state.treeData, fragment);
        
        this.mount.appendChild(fragment);
    }
}

window.TreeViewComponent = TreeViewComponent;

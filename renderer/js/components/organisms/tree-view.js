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

        const renderNodes = (nodes, parentEl) => {
            nodes.forEach(node => {
                const itemComp = new TreeItemComponent(node, this.options, {
                    selectedPaths: this.state.selectedPaths,
                    currentFile: this.state.activePath,
                    renamingPath: this.state.renamingPath
                });
                const el = itemComp.render(globalIdx++);
                parentEl.appendChild(el);
            });
        };

        renderNodes(this.state.treeData, fragment);
        
        // Thêm khoảng trống ở dưới cùng để scroll thoải mái hơn (nếu được yêu cầu)
        if (this.options.showSpacer !== false) {
            const spacer = document.createElement('div');
            spacer.className = 'tree-bottom-spacer';
            if (this.options.spacerHeight) {
                spacer.style.height = this.options.spacerHeight;
            }
            fragment.appendChild(spacer);
        }

        this.mount.appendChild(fragment);
    }
}

window.TreeViewComponent = TreeViewComponent;

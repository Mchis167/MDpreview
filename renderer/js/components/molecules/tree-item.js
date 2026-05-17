/* ══════════════════════════════════════════════════
   TreeItemComponent.js — Atomic Design (Molecule)
   Dùng để render một node (file/folder) trong Tree View.
   ══════════════════════════════════════════════════ */

class TreeItemComponent {
    /**
     * @param {Object} node - Dữ liệu node từ server
     * @param {Object} options - Các callback (onSelect, onOpen, onDelete, onRename, onContextMenu)
     * @param {Object} state - Trạng thái từ TreeModule (selectedPaths, currentFile)
     */
    constructor(node, options = {}, state = {}) {
        this.node = node;
        this.options = options;
        this.state = state;

        // Các SVG icons được lấy từ Design System
        this.svgs = {
            chevron: DesignSystem.getIcon('chevron-down').replace('<svg', '<svg class="item-chevron"'),
            folder: DesignSystem.getIcon('folder'),
            file: DesignSystem.getIcon('file')
        };
    }

    /**
     * Render item và trả về DOM element
     */
    render(idx) {
        const node = this.node;
        const wrapper = document.createElement('div');
        wrapper.dataset.nodeId = Math.random().toString(36).substring(2, 9);
        wrapper.className = 'tree-node-wrapper';

        const isActive = node.path === this.state.currentFile;
        const isSelected = this.state.selectedPaths.includes(node.path) && !isActive;
        const isRenaming = node.path === this.state.renamingPath;

        const itemEl = document.createElement('div');
        itemEl.className = `tree-item ${node.type === 'directory' ? 'tree-item-directory' : ''} ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${isRenaming ? 'renaming' : ''} ${node.isHidden ? 'is-hidden' : ''}`.trim();
        itemEl.style.setProperty('--stagger', idx);
        itemEl.dataset.path = node.path;

        const icon = node.type === 'directory' ? this.svgs.folder : this.svgs.file;
        const chevron = node.type === 'directory' ? this.svgs.chevron : '<div class="tree-item-spacer"></div>';

        if (isRenaming) {
            const displayValue = this._formatName(node.name, node.type);
            itemEl.innerHTML = `
                <div class="item-chevron-wrap">${chevron}</div>
                <div class="item-icon-wrap">${icon}</div>
                <input type="text" class="inline-rename-input" value="${this._esc(displayValue)}" />
            `;

            const input = itemEl.querySelector('.inline-rename-input');

            setTimeout(() => {
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 50);

            const checkDuplicate = (val) => {
                const name = val.trim();
                return this.state.checkDuplicate ? this.state.checkDuplicate(name, this.node) : false;
            };

            const finish = (save) => {
                if (input._done) return;
                let newName = input.value.trim();

                if (save) {
                    if (checkDuplicate(newName)) {
                        if (typeof showToast === 'function') {
                            showToast(`A file or folder named "${newName}" already exists.`, 'error');
                        }
                        input.classList.add('is-invalid');
                        input.classList.remove('shake');
                        void input.offsetWidth; // Trigger reflow to restart shake animation
                        input.classList.add('shake');
                        input.focus();
                        input.select();
                        return; // Block save, keep renaming active
                    }
                }

                input._done = true;

                // Automatically append .md for files if missing
                if (save && node.type === 'file' && newName && !newName.toLowerCase().endsWith('.md')) {
                    newName += '.md';
                }

                this.options.onFinishRename(node, newName, save);
            };

            input.oninput = () => {
                if (checkDuplicate(input.value)) {
                    input.classList.add('is-invalid');
                } else {
                    input.classList.remove('is-invalid');
                }
            };

            input.onblur = () => {
                if (document.contains(input)) {
                    if (checkDuplicate(input.value)) {
                        if (typeof showToast === 'function') {
                            showToast(`"${input.value.trim()}" already exists. Reverted.`, 'warning');
                        }
                        finish(false);
                    } else {
                        finish(true);
                    }
                }
            };
            input.onkeydown = (e) => {
                if (e.key === 'Enter') finish(true);
                if (e.key === 'Escape') finish(false);
                e.stopPropagation();
            };

            // Prevent other clicks while renaming
            itemEl.onclick = (e) => e.stopPropagation();
        } else {
            // Render static item
            const chevronEl = document.createElement('div');
            chevronEl.className = 'item-chevron-wrap';
            chevronEl.innerHTML = chevron;

            const iconWrap = document.createElement('div');
            iconWrap.className = 'item-icon-wrap';
            iconWrap.innerHTML = icon;

            const label = document.createElement('span');
            label.className = 'item-label';
            label.textContent = this._formatName(node.name, node.type);

            itemEl.appendChild(chevronEl);
            itemEl.appendChild(iconWrap);
            itemEl.appendChild(label);

            if (this.options.onDelete) {
                const deleteBtn = new IconActionButton({
                    iconName: this.options.deleteIcon || 'trash',
                    title: this.options.deleteTitle || `Delete ${node.type}`,
                    isDanger: true,
                    className: 'item-delete-btn',
                    onClick: (e) => this.options.onDelete(e, node)
                });
                itemEl.appendChild(deleteBtn.render());
            }

            // ── Event Listeners (Restored) ──
            if (this.options.onClick) itemEl.onclick = (e) => this.options.onClick(e, node, itemEl);
            if (this.options.onMouseDown) itemEl.onmousedown = (e) => this.options.onMouseDown(e, node, itemEl);
            itemEl.onmouseleave = (e) => {
                if (this.options.onMouseLeave) this.options.onMouseLeave(e, node, itemEl);
            };
            itemEl.oncontextmenu = (e) => {
                if (this.options.onContextMenu) this.options.onContextMenu(e, node, itemEl);
            };
        }

        // Render Children nếu là directory và đang expanded
        if (node.type === 'directory') {
            const childrenCont = document.createElement('div');
            childrenCont.className = 'folder-children' + (node.expanded ? '' : ' hidden');

            if (node.expanded && node.children) {
                node.children.forEach((child, childIdx) => {
                    const childComp = new TreeItemComponent(child, this.options, this.state);
                    childrenCont.appendChild(childComp.render(idx + childIdx + 1));
                });
            }

            // Sync chevron rotation
            const c = itemEl.querySelector('.item-chevron');
            if (c) c.style.transform = node.expanded ? 'rotate(0)' : 'rotate(-90deg)';

            wrapper.appendChild(itemEl);
            wrapper.appendChild(childrenCont);
        } else {
            wrapper.appendChild(itemEl);
        }

        return wrapper;
    }

    _formatName(name, type) {
        if (!name) return '';
        if (type === 'file' && name.toLowerCase().endsWith('.md')) {
            return name.substring(0, name.length - 3);
        }
        return name;
    }

    _esc(t) {
        const div = document.createElement('div');
        div.textContent = t;
        return div.innerHTML;
    }
}

// Export cho window
window.TreeItemComponent = TreeItemComponent;

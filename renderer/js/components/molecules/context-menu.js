/* ══════════════════════════════════════════════════
   ContextMenuComponent.js — Atomic Design (Molecule)
   Dùng để render một menu chuột phải chuẩn Design System.
   ══════════════════════════════════════════════════ */

class ContextMenuComponent {
    /**
     * @param {Object} options
     * @param {MouseEvent} options.event - Sự kiện chuột để xác định vị trí
     * @param {Array} options.items - Danh sách các mục trong menu
     * @param {Function} options.onClose - Callback khi menu bị đóng
     */
    constructor(options = {}) {
        this.event = options.event;
        this.items = options.items || [];
        this.onClose = options.onClose;
        this.menuEl = null;
    }

    /**
     * Render menu và gắn vào body
     */
    render() {
        // Xóa menu cũ nếu có
        const existing = document.querySelector('.ctx-menu');
        if (existing) existing.remove();

        // Tạo container chính
        const menu = document.createElement('div');
        menu.className = 'ctx-menu';
        this.menuEl = menu;

        // Ngăn chặn sự kiện nổi bọt để không làm phiền các thành phần bên dưới
        menu.onmousedown = (e) => e.stopPropagation();
        menu.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        // Render từng item
        this.items.forEach(item => {
            if (item.divider) {
                const divider = document.createElement('div');
                divider.className = 'ctx-divider';
                menu.appendChild(divider);
                return;
            }

            const itemEl = document.createElement('div');
            const classes = ['ctx-item'];
            if (item.danger) classes.push('danger');
            if (item.active) classes.push('active');
            if (item.disabled) classes.push('disabled');
            if (item.className) classes.push(item.className);
            itemEl.className = classes.join(' ');

            // Icon
            const iconHtml = DesignSystem.getIcon(item.icon);
            const iconWrap = document.createElement('div');
            iconWrap.className = 'ctx-icon';
            iconWrap.innerHTML = iconHtml;

            // Label
            const label = document.createElement('span');
            label.className = 'ctx-label';
            label.textContent = item.label;

            itemEl.appendChild(iconWrap);
            itemEl.appendChild(label);

            // Shortcut (nếu có) - Render theo phong cách KBD
            if (item.shortcut) {
                const shortcut = document.createElement('span');
                shortcut.className = 'ctx-shortcut';
                
                // Tách các phím thông minh: 
                // Nếu là phím đơn dài (Enter, Tab, F2) -> giữ nguyên
                // Nếu là tổ hợp (⌘N) -> tách từng ký tự
                const specialKeys = ['Enter', 'Tab', 'Space', 'Shift', 'Alt', 'Ctrl', 'Cmd', 'Delete', 'Backspace'];
                let keys = [];
                
                if (specialKeys.includes(item.shortcut)) {
                    keys = [item.shortcut];
                } else {
                    keys = item.shortcut.split('');
                }

                keys.forEach(key => {
                    const kbd = document.createElement('kbd');
                    kbd.textContent = key;
                    shortcut.appendChild(kbd);
                });
                
                itemEl.appendChild(shortcut);
            }

            // Click event
            itemEl.onclick = (e) => {
                e.stopPropagation();
                if (item.disabled) return;
                
                this.close();
                if (item.onClick) item.onClick(e);
            };

            menu.appendChild(itemEl);
        });

        // Gắn vào body trước để lấy kích thước
        document.body.appendChild(menu);

        // Tính toán vị trí
        this._calculatePosition();

        // Lắng nghe click bên ngoài để đóng
        this._setupOutsideClick();

        return menu;
    }

    /**
     * Tính toán vị trí hiển thị (tránh bị tràn màn hình)
     */
    _calculatePosition() {
        if (!this.event || !this.menuEl) return;

        const { clientX: x, clientY: y } = this.event;
        const { offsetWidth: menuWidth, offsetHeight: menuHeight } = this.menuEl;
        const { innerWidth: winWidth, innerHeight: winHeight } = window;

        let finalX = x;
        let finalY = y;

        // Kiểm tra tràn bên phải
        if (x + menuWidth > winWidth - 10) {
            finalX = x - menuWidth;
        }

        // Kiểm tra tràn bên dưới
        if (y + menuHeight > winHeight - 10) {
            finalY = y - menuHeight;
        }

        // Đảm bảo không bị tràn bên trái hoặc trên
        finalX = Math.max(10, finalX);
        finalY = Math.max(10, finalY);

        this.menuEl.style.left = `${finalX}px`;
        this.menuEl.style.top = `${finalY}px`;
    }

    /**
     * Thiết lập click-away
     */
    _setupOutsideClick() {
        this._outsideClickHandler = (e) => {
            if (this.menuEl && !this.menuEl.contains(e.target)) {
                this.close();
            }
        };
        // Delay một chút để không bắt ngay sự kiện hiện tại
        setTimeout(() => {
            document.addEventListener('mousedown', this._outsideClickHandler, true);
        }, 10);
    }

    /**
     * Đóng menu
     */
    close() {
        if (this._outsideClickHandler) {
            document.removeEventListener('mousedown', this._outsideClickHandler, true);
            this._outsideClickHandler = null;
        }

        if (this.menuEl) {
            this.menuEl.remove();
            this.menuEl = null;
            if (this.onClose) this.onClose();
        }
    }
}

// Export cho window
window.ContextMenuComponent = ContextMenuComponent;

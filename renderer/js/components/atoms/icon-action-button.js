/**
 * IconActionButton.js — Atomic Design (Atom)
 * Unified action button with icon for various headers and toolbars.
 */

class IconActionButton {
    constructor(options = {}) {
        this.id = options.id;
        this.title = options.title || '';
        this.iconName = options.iconName;
        this.onClick = options.onClick;
        this.className = options.className || '';
        this.iconSize = options.iconSize || (options.isLarge ? 20 : 16);
        this.isDanger = options.isDanger || false;
        this.isPrimary = options.isPrimary || false;
        this.isLarge = options.isLarge || false;
    }

    render() {
        const btn = document.createElement('button');
        if (this.id) btn.id = this.id;
        
        const classes = ['ds-icon-action-btn'];
        if (this.isDanger) classes.push('is-danger');
        if (this.isPrimary) classes.push('is-primary');
        if (this.isLarge) classes.push('is-large');
        if (this.className) classes.push(this.className);
        
        btn.className = classes.join(' ');
        if (this.title) btn.setAttribute('data-title', this.title);

        // Get icon from DesignSystem
        const iconHtml = DesignSystem.getIcon(this.iconName);
        btn.innerHTML = iconHtml;

        // Set icon size (since DesignSystem icons are 24x24 by default)
        const svg = btn.querySelector('svg');
        if (svg) {
            svg.setAttribute('width', this.iconSize);
            svg.setAttribute('height', this.iconSize);
        }

        if (this.onClick) {
            btn.onclick = (e) => {
                e.stopPropagation();
                this.onClick(e, btn);
            };
        }

        return btn;
    }
}

window.IconActionButton = IconActionButton;

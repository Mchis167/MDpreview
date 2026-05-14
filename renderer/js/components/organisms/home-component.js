/* global DesignSystem, RecentlyViewedModule, SearchPalette */
/* ══════════════════════════════════════════════════
   HomeComponent.js — Workspace Dashboard
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class HomeComponent {
  constructor(options = {}) {
    this.mount = options.mount || document.getElementById('home-mount');
    this.state = {
      recentFiles: []
    };
    this.init();
  }

  init() {
    if (!this.mount) return;
  }

  show() {
    if (!this.mount) return;
    this._isHiding = false;
    this.mount.style.display = 'flex';
    this.render();
  }

  hide() {
    if (!this.mount) return;
    this._isHiding = true;
    this.mount.style.display = 'none';
    this.mount.innerHTML = '';
  }

  async render() {
    if (!this.mount || this._isHiding) return;
    
    // Fetch recent files
    if (RecentlyViewedModule) {
      this.state.recentFiles = RecentlyViewedModule.getRecentFiles() || [];
    }

    if (this._isHiding) return;

    this.mount.innerHTML = '';
    const container = DesignSystem.createElement('div', 'ds-home-container');

    // 1. Search Section
    container.appendChild(this._renderSearchSection());

    // 2. Quick Actions
    container.appendChild(this._renderQuickActions());

    // 3. Recent Files
    if (this.state.recentFiles.length > 0) {
      container.appendChild(this._renderRecentSection());
    }

    if (this._isHiding) return;
    this.mount.appendChild(container);
  }

  _renderSearchSection() {
    const section = DesignSystem.createElement('div', 'ds-home-search-section');
    
    const box = DesignSystem.createElement('div', 'ds-home-search-box');
    box.onclick = () => {
      if (typeof SearchPalette !== 'undefined') SearchPalette.show('all');
    };

    const icon = DesignSystem.createElement('div', 'ds-home-search-icon', {
      html: DesignSystem.getIcon('search', { width: 20, height: 20 })
    });

    const placeholder = DesignSystem.createElement('div', 'ds-home-search-placeholder', {
      text: 'Find your action or file...'
    });

    box.appendChild(icon);
    box.appendChild(placeholder);
    section.appendChild(box);

    return section;
  }

  _renderQuickActions() {
    const group = DesignSystem.createElement('div', 'ds-home-quick-actions');

    const actions = [
      {
        label: 'New File',
        icon: 'file-plus',
        onClick: () => {
          if (window.Home) window.Home.getInstance().hide();
          const viewer = MarkdownViewer.getInstance();
          if (viewer) viewer.show();
          if (window.TreeModule) window.TreeModule.createNewFile();
        }
      },
      {
        label: 'New Draft',
        icon: 'plus',
        onClick: () => {
          const draftPath = '__DRAFT_' + Date.now();
          if (window.loadFile) window.loadFile(draftPath);
        }
      },
      {
        label: 'Shortcuts',
        icon: 'keyboard',
        onClick: () => {
          if (window.SearchPalette) window.SearchPalette.show('shortcut');
        }
      }
    ];

    actions.forEach(act => {
      const btn = DesignSystem.createButton({
        label: act.label,
        variant: 'subtitle',
        leadingIcon: act.icon,
        onClick: act.onClick
      });
      group.appendChild(btn);
    });

    return group;
  }

  _renderRecentSection() {
    const section = DesignSystem.createElement('div', 'ds-home-recent-section');
    
    const title = DesignSystem.createElement('div', 'ds-home-section-title', {
      text: 'Recently Viewed'
    });
    section.appendChild(title);

    const grid = DesignSystem.createElement('div', 'ds-home-recent-grid');
    
    this.state.recentFiles.slice(0, 10).forEach(path => {
      const item = DesignSystem.createElement('div', 'ds-home-recent-item');
      item.onclick = () => {
        if (window.loadFile) window.loadFile(path);
      };

      const name = DesignSystem.createElement('div', 'ds-home-recent-name');
      const nameText = DesignSystem.createElement('span', 'ds-home-recent-text', {
        text: path.split('/').pop().replace('.md', '')
      });
      const nameIcon = DesignSystem.createElement('span', 'ds-home-recent-icon', {
        html: DesignSystem.getIcon('square-arrow-out-up-right', { width: 16, height: 16 })
      });
      name.appendChild(nameText);
      name.appendChild(nameIcon);

      const meta = DesignSystem.createElement('div', 'ds-home-recent-meta', {
        text: path
      });

      item.appendChild(name);
      item.appendChild(meta);
      grid.appendChild(item);
    });

    section.appendChild(grid);
    return section;
  }
}

// Singleton Bridge
window.Home = (() => {
  let instance = null;
  return {
    init: (options) => {
      if (!instance) instance = new HomeComponent(options);
      return instance;
    },
    getInstance: () => instance
  };
})();

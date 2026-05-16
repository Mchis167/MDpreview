/* global DesignSystem, RecentlyViewedModule, SearchPalette, TabsModule, AppState, HomeSection, PinnedService, MarkdownViewer, ContextMenuComponent */
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
    this._refreshTimer = null;
    this._isRendering = false;
    this.init();
  }

  init() {
    if (!this.mount) return;
    // Update pinned section when state changes
    window.addEventListener('pinned-changed', () => {
      this._updatePinnedSection();
    });
    // Update recent section when state changes
    window.addEventListener('recent-changed', () => {
      this._updateRecentSection();
    });
  }

  show() {
    if (!this.mount) return;
    this._isHiding = false;
    this.mount.style.display = 'flex';
    this.render();
    this._startRefreshTimer();
  }

  hide() {
    this._stopRefreshTimer();
    if (!this.mount) return;
    this._isHiding = true;
    this.mount.style.display = 'none';
    this.mount.innerHTML = '';
  }

  async render() {
    if (!this.mount || this._isHiding) return;
    this._isRendering = true;
    
    // Fetch recent files
    if (RecentlyViewedModule) {
      this.state.recentFiles = RecentlyViewedModule.getRecentFiles() || [];
    }

    if (this._isHiding) {
      this._isRendering = false;
      return;
    }

    this.mount.innerHTML = '';
    const container = DesignSystem.createElement('div', 'ds-home-container');

    // 1. Search Section
    container.appendChild(this._renderSearchSection());

    // 2. Quick Actions
    container.appendChild(this._renderQuickActions());
    
    // 2.1 Pinned Documents
    const pinnedSection = this._renderPinnedSection();
    if (pinnedSection) container.appendChild(pinnedSection);
    
    // 2.2 Continue Edit
    const continueSection = this._renderContinueEditSection();
    if (continueSection) container.appendChild(continueSection);

    // 3. Recent Files
    if (this.state.recentFiles.length > 0) {
      container.appendChild(this._renderRecentSection());
    }

    if (this._isHiding) {
      this._isRendering = false;
      return;
    }
    this.mount.appendChild(container);
    this._isRendering = false;
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
      },
      {
        label: 'Assets',
        icon: 'images',
        onClick: () => {
          if (window.AssetManager) window.AssetManager.openPanel();
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

  _renderPinnedSection() {
    if (typeof PinnedService === 'undefined' || typeof HomeSection === 'undefined') return null;
    const pinnedFiles = PinnedService.getPinnedFiles() || [];
    if (pinnedFiles.length === 0) return null;

    const items = pinnedFiles.map(path => ({
      path,
      icon: 'pin',
      subtitle: path,
      onContextMenu: (e, p) => this._handleCardContextMenu(e, p)
    }));

    return HomeSection.create({
      title: 'Pinned Documents',
      items,
      className: 'ds-home-pinned-section'
    });
  }

  _renderContinueEditSection() {
    if (typeof TabsModule === 'undefined' || typeof AppState === 'undefined' || typeof HomeSection === 'undefined') return null;

    const openFiles = TabsModule.getOpenFiles() || [];
    const editTabs = openFiles.filter(path => AppState.getFileViewMode(path) === 'edit');

    if (editTabs.length === 0) return null;

    // Sort by last edit time
    const sorted = editTabs.sort((a, b) => {
      return (AppState.getLastEdit(b) || 0) - (AppState.getLastEdit(a) || 0);
    });

    const items = sorted.slice(0, 8).map(path => ({
      path,
      timestamp: AppState.getLastEdit(path),
      icon: 'file-edit',
      onContextMenu: (e, p) => this._handleCardContextMenu(e, p)
    }));

    return HomeSection.create({
      title: 'Continue Edit',
      items,
      className: 'ds-home-continue-section'
    });
  }

  _updatePinnedSection() {
    if (this._isRendering || this._isHiding) return;
    
    const existing = this.mount.querySelector('.ds-home-pinned-section');
    const newSection = this._renderPinnedSection();

    if (existing) {
      if (newSection) {
        existing.replaceWith(newSection);
      } else {
        existing.remove();
      }
    } else if (newSection) {
      const quickActions = this.mount.querySelector('.ds-home-quick-actions');
      if (quickActions) {
        quickActions.after(newSection);
      }
    }
  }

  /**
   * Partial re-render for Continue Edit section only.
   */
  _updateContinueEditSection() {
    if (this._isRendering || this._isHiding) return;
    
    const existingSection = this.mount.querySelector('.ds-home-continue-section');
    const newSection = this._renderContinueEditSection();

    if (existingSection) {
      if (newSection) {
        existingSection.replaceWith(newSection);
      } else {
        existingSection.remove();
      }
    } else if (newSection) {
      // Place after pinned section if it exists, otherwise after quick actions
      const pinnedSection = this.mount.querySelector('.ds-home-pinned-section');
      if (pinnedSection) {
        pinnedSection.after(newSection);
      } else {
        const quickActions = this.mount.querySelector('.ds-home-quick-actions');
        if (quickActions) {
          quickActions.after(newSection);
        }
      }
    }
  }

  _updateRecentSection() {
    if (this._isRendering || this._isHiding) return;
    
    if (RecentlyViewedModule) {
      this.state.recentFiles = RecentlyViewedModule.getRecentFiles() || [];
    }

    const existing = this.mount.querySelector('.ds-home-recent-section');
    const newSection = this._renderRecentSection();

    if (existing) {
      if (newSection) {
        existing.replaceWith(newSection);
      } else {
        existing.remove();
      }
    } else if (newSection) {
      const container = this.mount.querySelector('.ds-home-container');
      if (container) container.appendChild(newSection);
    }
  }

  _startRefreshTimer() {
    this._stopRefreshTimer();
    this._refreshTimer = setInterval(() => {
      this._updateContinueEditSection();
    }, 60000); // Auto refresh every 1 minute
  }

  _stopRefreshTimer() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
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
      item.oncontextmenu = (e) => {
        this._handleRecentContextMenu(e, path);
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

  _handleCardContextMenu(e, path) {
    if (typeof ContextMenuComponent === 'undefined') return;
    e.preventDefault();
    e.stopPropagation();

    const isPinned = window.PinnedService && window.PinnedService.isPinned(path);
    const items = [
      {
        label: isPinned ? 'Unpin from Home' : 'Pin to Home',
        icon: isPinned ? 'pin-off' : 'pin',
        onClick: () => {
          if (window.PinnedService) window.PinnedService.togglePin(path);
        }
      },
      { divider: true },
      {
        label: 'Reveal in Finder',
        icon: 'external-link',
        onClick: () => {
          if (window.electronBridge) window.electronBridge.revealInFinder(path);
        }
      },
      {
        label: 'Copy Path',
        icon: 'clipboard',
        onClick: () => {
          navigator.clipboard.writeText(path);
        }
      }
    ];

    ContextMenuComponent.open({
      event: e,
      items
    });
  }

  _handleRecentContextMenu(e, path) {
    if (typeof ContextMenuComponent === 'undefined') return;
    e.preventDefault();
    e.stopPropagation();

    const isPinned = window.PinnedService && window.PinnedService.isPinned(path);
    const items = [
      {
        label: 'Remove from History',
        icon: 'trash',
        danger: true,
        onClick: () => {
          if (window.RecentlyViewedModule) {
            window.RecentlyViewedModule.remove(path);
          }
        }
      },
      { divider: true },
      {
        label: isPinned ? 'Unpin from Home' : 'Pin to Home',
        icon: isPinned ? 'pin-off' : 'pin',
        onClick: () => {
          if (window.PinnedService) window.PinnedService.togglePin(path);
        }
      },
      {
        label: 'Reveal in Finder',
        icon: 'external-link',
        onClick: () => {
          if (window.electronBridge) window.electronBridge.revealInFinder(path);
        }
      },
      {
        label: 'Copy Path',
        icon: 'clipboard',
        onClick: () => {
          navigator.clipboard.writeText(path);
        }
      }
    ];

    ContextMenuComponent.open({
      event: e,
      items
    });
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

/* global DesignSystem, AppState, showToast */
/**
 * wiki-scanner-control.js
 * Manages the Wiki Scanner button in the sidebar footer and its interactions.
 */
const WikiScannerControl = (() => {
  let button = null;

  async function init() {
    // Listen for workspace changes to update the button state
    window.addEventListener('workspace-changed', () => {
      updateButtonState();
    });
  }

  /**
   * Creates the Wiki Scanner button for the sidebar footer.
   */
  function createButton() {
    button = DesignSystem.createButton({
      label: 'Wiki Scanner',
      variant: 'subtitle',
      leadingIcon: 'book-open',
      offLabel: true,
      onClick: (e) => {
        handleButtonClick(e);
      }
    });

    updateButtonState();
    return button;
  }

  /**
   * Updates the button visual state based on the current workspace's wikiScanner settings.
   */
  async function updateButtonState() {
    if (!button) return;

    const ws = AppState.currentWorkspace;
    if (!ws) {
      button.style.display = 'none';
      return;
    }

    button.style.display = 'flex';
    const config = ws.wikiScanner || { status: 'off', enabled: false };

    // Reset classes
    button.classList.remove('wiki-status-active', 'wiki-status-scanning', 'wiki-status-error', 'wiki-status-inactive');

    let statusLabel = 'Wiki Scanner';
    let icon = 'book-open';

    switch (config.status) {
      case 'active':
        statusLabel = 'Wiki Active';
        icon = 'book-open';
        button.classList.add('wiki-status-active');
        break;
      case 'scanning':
        statusLabel = 'Scanning...';
        icon = 'loader';
        button.classList.add('wiki-status-scanning');
        break;
      case 'error':
        statusLabel = 'Wiki Error';
        icon = 'alert-circle';
        button.classList.add('wiki-status-error');
        break;
      case 'inactive':
        statusLabel = 'Wiki Paused';
        icon = 'pause';
        button.classList.add('wiki-status-inactive');
        break;
      default:
        statusLabel = 'Wiki Scanner';
        icon = 'book-open';
        button.style.opacity = '0.5';
    }

    button.setIcon(icon);
    
    // Add spin animation if scanning
    const iconSpan = button.querySelector('.ds-btn-icon-leading');
    if (iconSpan) {
      if (config.status === 'scanning') {
        iconSpan.classList.add('ds-icon-spin');
      } else {
        iconSpan.classList.remove('ds-icon-spin');
      }
    }
    
    // Update tooltip since label is hidden in offLabel mode
    if (typeof DesignSystem.applyTooltip === 'function') {
      DesignSystem.applyTooltip(button, statusLabel, 'bottom');
    }

    if (config.status !== 'off') {
      button.style.opacity = '1';
    }
  }

  /**
   * Handles the click event on the Wiki Scanner button.
   */
  async function handleButtonClick(e) {
    const ws = AppState.currentWorkspace;
    if (!ws) return;

    const config = ws.wikiScanner || { status: 'off', enabled: false };

    if (config.status === 'off') {
      // Show Onboarding Modal instead of immediate enable
      showOnboardingModal(ws);
    } else {
      // Show context menu for all other states (including scanning)
      showContextMenu(e.currentTarget);
    }
  }

  function showOnboardingModal(ws) {
    const content = `
      <div class="ds-form-body">
        <div class="ds-wiki-onboarding">
          <p class="ds-wiki-onboarding-intro">Transform your workspace into a powerful <strong>Personal Wiki</strong> to connect your thoughts across files seamlessly.</p>
          
          <div class="ds-wiki-onboarding-grid">
            <div class="ds-wiki-onboarding-card">
              <div class="ds-wiki-onboarding-card-icon">${DesignSystem.getIcon('link')}</div>
              <strong>[[Wikilinks]]</strong>
              <span>Bi-directional links that connect your files instantly.</span>
            </div>
            <div class="ds-wiki-onboarding-card">
              <div class="ds-wiki-onboarding-card-icon">${DesignSystem.getIcon('list-tree')}</div>
              <strong>Backlinks</strong>
              <span>See every file that references your current document.</span>
            </div>
            <div class="ds-wiki-onboarding-card">
              <div class="ds-wiki-onboarding-card-icon">${DesignSystem.getIcon('map')}</div>
              <strong>Knowledge Graph</strong>
              <span>Visualize your documentation network in real-time.</span>
            </div>
          </div>
          
          <div class="ds-wiki-onboarding-privacy-bar">
            ${DesignSystem.getIcon('alert-circle')}
            <span>Scanning happens locally within this workspace only. No data leaves your machine.</span>
          </div>
        </div>
      </div>
    `;

    // Create footer buttons as HTMLElements
    const footer = document.createElement('div');
    footer.className = 'ds-modal-footer-actions';
    
    const cancelBtn = DesignSystem.createButton({
      label: 'Cancel',
      variant: 'subtitle'
    });
    
    const startBtn = DesignSystem.createButton({
      label: 'Start Scanning',
      variant: 'primary'
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(startBtn);

    const modal = DesignSystem.showCustomModal({
      title: 'Activate Wiki Reader',
      className: 'ds-wiki-onboarding-modal',
      width: '600px',
      content: content,
      footer: footer
    });

    cancelBtn.onclick = () => modal.close();
    startBtn.onclick = () => {
      modal.close();
      enableWiki(ws);
    };
  }

  async function enableWiki(ws) {
    try {
      showToast('Enabling Wiki Scanner...', 'info');
      const result = await window.electronAPI.wikiAPI.enable(ws.id, ws.path);
      if (result.success) {
        await window.electronAPI.updateWorkspaceWiki(ws.id, { 
          enabled: true, 
          status: result.status 
        });
        // Notify workspace module to reload data
        if (window.WorkspaceModule) await window.WorkspaceModule.load();
        showToast('Wiki Scanner enabled', 'success');

        // MOCK SIMULATION: Auto-complete scan after delay
        setTimeout(async () => {
          await window.electronAPI.updateWorkspaceWiki(ws.id, { 
            enabled: true, 
            status: 'active',
            lastScanned: new Date().toISOString()
          });
          if (window.WorkspaceModule) await window.WorkspaceModule.load();
        }, 3500);
      }
    } catch (error) {
      showToast('Failed to enable Wiki Scanner', 'error');
      console.error(error);
    }
  }

  function showContextMenu(anchor) {
    const ws = AppState.currentWorkspace;
    if (!ws) return;

    const items = [];
    const config = ws.wikiScanner;

    if (config.status === 'scanning') {
      items.push({
        label: 'Stop Scan',
        icon: 'x-circle',
        danger: true,
        onClick: () => stopScan(ws.id)
      });
    } else {
      items.push({
        label: 'Rescan',
        icon: 'refresh-cw',
        onClick: () => rescanWiki(ws)
      });
      items.push({
        label: config.enabled ? 'Disable' : 'Enable',
        icon: config.enabled ? 'pause' : 'play',
        onClick: () => toggleWiki(ws)
      });
    }

    items.push({ divider: true });
    items.push({
      label: 'Remove & Clean',
      icon: 'trash-2',
      danger: true,
      onClick: () => confirmRemove(ws)
    });

    DesignSystem.createMenu(anchor, items, {
      offset: { x: 0, y: -8 } // Open above the button
    });
  }

  async function stopScan(workspaceId) {
    showToast('Stopping scan...', 'info');
    // In Phase 1, this will kill the child process
    await window.electronAPI.wikiAPI.disable(workspaceId);
    await window.electronAPI.updateWorkspaceWiki(workspaceId, { 
      enabled: false, 
      status: 'inactive' 
    });
    if (window.WorkspaceModule) await window.WorkspaceModule.load();
    showToast('Scan stopped', 'warning');
  }

  async function rescanWiki(ws) {
    showToast('Rescanning...', 'info');
    const result = await window.electronAPI.wikiAPI.rescan(ws.id, ws.path);
    if (result.success) {
      await window.electronAPI.updateWorkspaceWiki(ws.id, { status: 'scanning' });
      if (window.WorkspaceModule) await window.WorkspaceModule.load();

      // MOCK SIMULATION: Auto-complete scan after delay
      setTimeout(async () => {
        await window.electronAPI.updateWorkspaceWiki(ws.id, { 
          status: 'active',
          lastScanned: new Date().toISOString()
        });
        if (window.WorkspaceModule) await window.WorkspaceModule.load();
        showToast('Scan complete', 'success');
      }, 3500);
    }
  }

  async function toggleWiki(ws) {
    const currentlyEnabled = ws.wikiScanner.enabled;
    const workspaceId = ws.id;
    
    if (currentlyEnabled) {
      const result = await window.electronAPI.wikiAPI.disable(workspaceId);
      if (result.success) {
        await window.electronAPI.updateWorkspaceWiki(workspaceId, { enabled: false, status: 'inactive' });
      }
    } else {
      const result = await window.electronAPI.wikiAPI.enable(ws.id, ws.path);
      if (result.success) {
        await window.electronAPI.updateWorkspaceWiki(workspaceId, { enabled: true, status: 'active' });
      }
    }
    if (window.WorkspaceModule) await window.WorkspaceModule.load();
  }

  function confirmRemove(ws) {
    DesignSystem.showConfirm({
      title: 'Remove Wiki Scanner?',
      message: `This will delete the wiki index for "${ws.name}". Links and backlinks will stop working.`,
      onConfirm: async () => {
        const result = await window.electronAPI.wikiAPI.remove(ws.id, ws.path);
        if (result.success) {
          await window.electronAPI.updateWorkspaceWiki(ws.id, { 
            enabled: false, 
            status: 'off',
            lastScanned: null 
          });
          if (window.WorkspaceModule) await window.WorkspaceModule.load();
          showToast('Wiki data removed', 'success');
        }
      }
    });
  }

  return { init, createButton };
})();

window.WikiScannerControl = WikiScannerControl;

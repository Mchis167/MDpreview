/* global DesignSystem, BaseFormModal, PublishService */
/**
 * PublishManagerComponent
 * Purpose: List and delete all published slugs directly from the Worker KV.
 * Atomic Design System (Organism)
 */

class PublishManagerComponent {
  constructor(options = {}) {
    this.onChanged = options.onChanged || (() => {});
    this.slugs = [];
    this.isLoading = true;
  }

  render() {
    this.bodyContent = DesignSystem.createElement('div', 'ds-publish-manager');
    this.bodyContent.style.minHeight = '300px';
    this._loadAndRender();
    
    const closeBtn = DesignSystem.createButton({
      variant: 'primary',
      label: 'Close',
      onClick: () => this.closeAction()
    });

    const form = BaseFormModal.create({
      iconHtml: `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" 
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2H2v10" /><path d="M12 22H2V12" /><path d="M22 22H12V12" /><path d="M22 2h-10v10" />
        </svg>
      `,
      title: 'Global Publish Manager',
      subtitle: 'View and manage all active slugs on your Cloudflare Worker.',
      bodyContent: this.bodyContent,
      actions: [closeBtn]
    });

    return form;
  }

  async _loadAndRender() {
    this.bodyContent.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--ds-text-dim);">Loading published slugs...</div>';
    
    this.slugs = await PublishService.listAllPublished();
    this.isLoading = false;
    this._renderList();
  }

  _renderList() {
    this.bodyContent.innerHTML = '';
    
    if (this.slugs.length === 0) {
      this.bodyContent.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--ds-text-dim);">No published documents found on worker.</div>';
      return;
    }

    const list = DesignSystem.createElement('div', 'ds-publish-manager-list');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '8px';

    this.slugs.forEach(slug => {
      const row = DesignSystem.createElement('div', 'ds-publish-manager-item');
      row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--ds-white-a05); border-radius: var(--ds-radius-widget); border: 1px solid var(--ds-white-a10);';

      const info = DesignSystem.createElement('div');
      info.innerHTML = `
        <div style="font-weight: 600; color: var(--ds-text-primary); font-size: 13px;">${slug}</div>
        <div style="font-size: 11px; color: var(--ds-text-dim); margin-top: 2px;">Active on Edge</div>
      `;

      const actions = DesignSystem.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '8px';

      const renameBtn = DesignSystem.createButton({
        variant: 'ghost',
        leadingIcon: 'edit',
        title: 'Rename Slug',
        onClick: (e) => {
          if (e) e.stopPropagation();
          const newSlug = prompt('Enter new slug:', slug);
          if (newSlug && newSlug !== slug) {
            DesignSystem.showConfirm({
              title: 'Rename Slug?',
              message: `Change "/${slug}" to "/${newSlug.toLowerCase()}"? This will update the URL.`,
              onConfirm: async () => {
                const success = await PublishService.renameSlug(slug, newSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '-'));
                if (success) {
                  this._loadAndRender();
                  this.onChanged();
                } else {
                  if (window.showToast) window.showToast('Rename failed. Slug might be taken.', 'error');
                }
              }
            });
          }
        }
      });

      const deleteBtn = DesignSystem.createButton({
        variant: 'danger-ghost',
        leadingIcon: 'trash-2',
        title: 'Delete Slug',
        onClick: (e) => {
          if (e) e.stopPropagation();
          DesignSystem.showConfirm({
            title: 'Delete Slug?',
            message: `Are you sure you want to permanently delete "/${slug}" from the worker? This cannot be undone.`,
            onConfirm: async () => {
              const success = await PublishService.deleteSlug(slug);
              if (success) {
                this.slugs = this.slugs.filter(s => s !== slug);
                this._renderList();
                this.onChanged();
              }
            }
          });
        }
      });

      actions.appendChild(renameBtn);
      actions.appendChild(deleteBtn);
      row.appendChild(info);
      row.appendChild(actions);
      list.appendChild(row);
    });

    this.bodyContent.appendChild(list);
  }

  static open(options = {}) {
    const component = new PublishManagerComponent(options);
    const content = component.render();

    const popover = DesignSystem.createPopoverShield({
      content: content,
      width: '480px',
      showHeader: false
    });

    component.closeAction = () => popover.close();
    return popover;
  }
}

window.PublishManagerComponent = PublishManagerComponent;

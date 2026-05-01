/* global DesignSystem, MenuShield */
/**
 * PublishConfigComponent
 * Purpose: A dedicated popover for configuring document publication settings.
 * Uses MenuShield for the floating UI.
 */
const PublishConfigComponent = (() => {
  'use strict';

  class PublishConfigComponent {
    constructor(options = {}) {
      this.file = options.file;
      this.onPublished = options.onPublished;
      this.container = null;
      this.state = {
        isLoading: false,
        info: window.PublishService ? window.PublishService.getPublishInfo(this.file) : null
      };
    }

    render() {
      if (!this.file) return null;

      this.container = DesignSystem.createElement('div', 'ds-publish-config-panel');
      this._renderContent();
      return this.container;
    }

    _renderContent() {
      if (!this.container) return;
      this.container.innerHTML = '';

      const { info, isLoading } = this.state;
      const fileName = this.file.split('/').pop().replace(/\.[^/.]+$/, "");
      const defaultSlug = info ? info.slug : fileName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);


      // 0. Header / Status Section
      if (info) {
        const workerUrl = window.AppState.settings.publishWorkerUrl || '';
        const baseUrl = workerUrl.replace(/\/publish\/?$/, '');
        const fullUrl = `${baseUrl}/${info.slug}`;

        const statusBadge = DesignSystem.createStatusBadge({
          text: `Live on the web since ${new Date(info.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`,
          variant: 'success',
          className: 'ds-publish-status-badge'
        });
        this.container.appendChild(statusBadge);

        // Display Full URL
        const urlGroup = DesignSystem.createInput({
          label: 'Public Address',
          description: 'Share this link with your audience.',
          value: fullUrl,
          readOnly: true,
          className: 'ds-input--link',
          action: {
            icon: 'copy',
            title: 'Copy Link',
            onClick: (e) => {
              navigator.clipboard.writeText(fullUrl);
              if (window.showToast) window.showToast('Link copied');
              const btn = e.currentTarget;
              if (btn && typeof btn.setIcon === 'function') {
                btn.setIcon('check');
                setTimeout(() => btn.setIcon('copy'), 2000);
              }
            }
          }
        });
        
        const urlInputEl = urlGroup.querySelector('input');
        if (urlInputEl) {
          urlInputEl.style.cursor = 'pointer';
          urlInputEl.onclick = () => window.open(fullUrl, '_blank');
          urlInputEl.title = 'Click to open link';
        }
        this.container.appendChild(urlGroup);
      } else {
        const isWorker = !!(window.AppState.settings.publishWorkerUrl && window.AppState.settings.publishAdminSecret);
        

        const engineBadge = DesignSystem.createStatusBadge({
          text: isWorker ? 'Ready to publish via Edge Worker' : 'Ready to publish via Handoff',
          variant: isWorker ? 'info' : 'warning',
          className: 'ds-publish-engine-badge'
        });
        this.container.appendChild(engineBadge);
      }

      // 1. Slug (Link) Field
      const slugField = DesignSystem.createInputGroup({
        label: 'Customize Link',
        description: 'Choose a simple, readable name for your URL.',
        inputOptions: {
          placeholder: 'my-awesome-document',
          value: defaultSlug,
          className: 'ds-publish-input',
          disabled: isLoading
        },
        action: {
          icon: 'copy',
          title: 'Copy Slug',
          onClick: (e) => {
            const val = slugField.value;
            navigator.clipboard.writeText(val);
            const btn = e.currentTarget;
            if (btn && typeof btn.setIcon === 'function') {
              btn.setIcon('check');
              setTimeout(() => btn.setIcon('copy'), 2000);
            }
            if (window.showToast) window.showToast('Slug copied');
          }
        }
      });
      this.slugInput = slugField;
      this.container.appendChild(slugField);

      // Listen for changes
      const input = slugField.querySelector('input');
      this.slugInputEl = input;
      if (input) {
        input.addEventListener('input', () => {
          if (this.state.isLoading) return;
          const raw = input.value;
          const clean = raw.toLowerCase().replace(/[^a-z0-9_-]/g, '-').substring(0, 100);
          
          if (raw !== clean) input.value = clean;
          this._checkSlug(clean);
        });
      }

      // Initial Check - SKIP IF LOADING
      if (!isLoading) {
        setTimeout(async () => {
          if (this.state.isLoading) return;
          if (info && info.slug) {
            const isStillThere = await window.PublishService.checkSlugAvailability(info.slug);
            if (isStillThere) {
              await window.PublishService.unpublish(this.file);
              this.setState({ info: null });
              return;
            }
          }
          this._checkSlug(defaultSlug);
        }, 100);
      }

      // 2. Password Field
      const passField = DesignSystem.createInput({
        label: 'Protect with Password',
        description: 'Restrict access to only those with the password.',
        type: 'password',
        placeholder: 'Leave blank to keep public',
        className: 'ds-publish-input',
        disabled: isLoading
      });
      this.passInput = passField;
      this.container.appendChild(passField);

      // 3. Actions
      const actions = DesignSystem.createElement('div', 'ds-publish-actions');
      const leftActions = DesignSystem.createElement('div', 'ds-publish-actions-left');
      leftActions.style.display = 'flex';
      leftActions.style.gap = '8px';

      if (info) {
        const unpublishBtn = DesignSystem.createButton({
          label: 'Remove from Web',
          variant: 'danger-ghost',
          disabled: isLoading,
          onClick: () => {
            DesignSystem.showConfirm({
              title: 'Remove Document?',
              message: 'This will take the document offline. The link will no longer work.',
              onConfirm: async () => {
                this.setState({ isLoading: true });
                await window.PublishService.unpublish(this.file);
                this.setState({ info: null, isLoading: false });
                if (this.onPublished) this.onPublished(null);
              }
            });
          }
        });
        leftActions.appendChild(unpublishBtn);
      }

      actions.appendChild(leftActions);

      const rightActions = DesignSystem.createElement('div', 'ds-publish-actions-right');
      const cancelBtn = DesignSystem.createButton({
        label: 'Cancel',
        variant: 'ghost',
        disabled: isLoading,
        onClick: () => window.MenuShield.close()
      });
      const publishBtn = DesignSystem.createButton({
        label: info ? 'Update Link' : 'Go Live',
        variant: 'primary',
        disabled: isLoading,
        onClick: async () => {
          const slug = this.slugInput.value.trim();
          const password = this.passInput.value.trim();
          
          const startTime = Date.now();
          
          publishBtn.setLoading(true);
          this.setState({ isLoading: true });

          try {
            const url = await window.PublishService.publish({ slug, password });
            
            const elapsed = Date.now() - startTime;
            if (elapsed < 1000) {
              await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
            }

            if (url) {
              const newInfo = window.PublishService.getPublishInfo(this.file);
              this.setState({ info: newInfo, isLoading: false });
              
              if (this.onPublished) {
                this.onPublished(url);
              }
            } else {
              this.setState({ isLoading: false });
            }
          } catch (err) {
            console.error('[PublishConfig] ERROR Publish:', err);
            this.setState({ isLoading: false });
          }
        }
      });
      
      if (isLoading) {
        publishBtn.setLoading(true);
      }

      rightActions.appendChild(cancelBtn);
      this.publishBtn = publishBtn;
      rightActions.appendChild(publishBtn);
      actions.appendChild(rightActions);
      
      this.container.appendChild(actions);
    }

    _checkSlug(slug) {
      if (this.state.isLoading) return;
      if (this._checkTimer) clearTimeout(this._checkTimer);

      if (!slug || slug.length < 1) {
        if (this.slugInput) this.slugInput.setStatus(null);
        if (this.publishBtn) this.publishBtn.disabled = true;
        return;
      }
      
      // Debounce everything to prevent flicker and redundant calls
      this._checkTimer = setTimeout(async () => {
        if (this.state.isLoading) return;
        
        // Source of truth: current input value
        const currentVal = this.slugInputEl ? this.slugInputEl.value : slug;
        if (currentVal !== slug) return;

        if (this.slugInput) {
          this.slugInput.setStatus({ text: 'Checking availability...', variant: 'info', isLoading: true });
        }

        try {
          const isAvailable = await window.PublishService.checkSlugAvailability(slug);
          
          // Re-verify after async call to handle rapid typing
          const finalVal = this.slugInputEl ? this.slugInputEl.value : slug;
          if (finalVal !== slug) return;

          if (!this.slugInput) return;

          const info = this.state.info;
          if (isAvailable) {
            this.slugInput.setStatus({ text: 'Slug is available', variant: 'success', icon: 'circle-check' });
            this.slugInput.setVariant('default');
            if (this.publishBtn) {
              this.publishBtn.disabled = false;
              this.publishBtn.setLabel(info ? 'Update Link' : 'Go Live');
            }
          } else {
            // If it's already published to THIS slug, it's fine (it's an update)
            if (info && info.slug === slug) {
              this.slugInput.setStatus({ text: 'Current slug (update mode)', variant: 'success', icon: 'circle-check' });
              this.slugInput.setVariant('default');
              if (this.publishBtn) {
                this.publishBtn.disabled = false;
                this.publishBtn.setLabel('Update Link');
              }
            } else {
              this.slugInput.setStatus({ text: 'Taken. Clicking Go Live will OVERWRITE.', variant: 'warning', icon: 'circle-x' });
              this.slugInput.setVariant('warning');
              if (this.publishBtn) {
                this.publishBtn.disabled = false;
                this.publishBtn.setLabel(info ? 'Update Link' : 'Go Live');
              }
            }
          }
        } catch (e) {
          console.error('Slug check failed:', e);
          if (this.slugInput) {
            this.slugInput.setStatus({ text: 'Could not verify slug', variant: 'warning' });
          }
        }
      }, 500);
    }

    setState(newState) {
      this.state = { ...this.state, ...newState };
      this._renderContent();
    }

    /**
     * Toggle the Publish Configuration UI
     * @param {Object} options
     */
    static toggle(options = {}) {
      const { event, anchor, file, onPublished } = options;
      
      if (MenuShield.active && MenuShield.active.element.classList.contains('ds-publish-config-shield')) {
        MenuShield.close();
        return;
      }

      const component = new PublishConfigComponent({ file, onPublished });
      const content = component.render();

      if (anchor) anchor.classList.add('is-active');

      MenuShield.open({
        event: event,
        anchor: anchor,
        title: 'Publish Configuration',
        content: content,
        className: 'ds-publish-config-shield',
        align: 'right',
        onClose: () => {
          if (anchor) anchor.classList.remove('is-active');
        }
      });


    }
  }

  return PublishConfigComponent;
})();

window.PublishConfigComponent = PublishConfigComponent;

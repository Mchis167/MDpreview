/* ============================================================
   comment-form-component.js — Comment Form (Organism)
   Floating popup for creating, editing, and viewing comments.
   ============================================================ */

const CommentFormComponent = (() => {
  let instance = null;

  class CommentForm {
    constructor() {
      this.el = null;
      this.mode = 'empty'; // 'empty', 'filled', 'view'
      this.onSaveCallback = null;
      this.onCancelCallback = null;
      this.onEditCallback = null;
      this.onExpandCallback = null;

      this._initDOM();
    }

    _initDOM() {
      this.el = DesignSystem.createElement('div', 'ds-comment-form');

      this.el.innerHTML = `
        <div class="ds-comment-form__inner">
          <!-- Edit View -->
          <div class="ds-comment-form__edit-view">
            <div class="ds-comment-form__input-wrap">
              <textarea class="ds-comment-form__input" placeholder="What’s your feedback"></textarea>
            </div>
            <div class="ds-comment-form__actions">
              <div class="ds-comment-form__secondary-action"></div>
              <div style="flex:1"></div>
              <div class="ds-comment-form__btn-stack">
                <button class="ds-comment-form__cancel-btn ds-btn ds-btn-ghost">Cancel</button>
                <button class="ds-comment-form__save-btn ds-btn ds-btn-primary" disabled>Save</button>
              </div>
            </div>

          </div>

          <!-- View View -->
          <div class="ds-comment-form__read-view">
            <div class="ds-comment-form__read-header">
              <div class="ds-comment-form__header-label">COMMENT</div>
              <div class="ds-comment-form__secondary-action"></div>
            </div>
            <div class="ds-comment-form__read-body">
              <div class="ds-comment-form__display"></div>
            </div>
          </div>
        </div>
      `;

      this.input = this.el.querySelector('.ds-comment-form__input');
      this.display = this.el.querySelector('.ds-comment-form__display');
      this.saveBtn = this.el.querySelector('.ds-comment-form__save-btn');
      this.cancelBtn = this.el.querySelector('.ds-comment-form__cancel-btn');

      this._bindEvents();
      document.body.appendChild(this.el);
    }

    _bindEvents() {
      this.input.addEventListener('input', () => {
        const val = this.input.value.trim();
        this.saveBtn.disabled = !val;
        this.el.classList.toggle('is-filled', !!val);
        if (this.mode !== 'view') {
          this.setMode(val ? 'filled' : 'empty');
        }
        this._autoResize();
      });

      this.input.addEventListener('focus', () => this.el.classList.add('is-typing'));
      this.input.addEventListener('blur', () => this.el.classList.remove('is-typing'));

      this.input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey && !this.saveBtn.disabled) {
          e.preventDefault();
          if (this.onSaveCallback) this.onSaveCallback(this.input.value.trim());
        }
        if (e.key === 'Escape') this.hide();
      });

      this.saveBtn.onclick = () => {
        if (this.onSaveCallback) this.onSaveCallback(this.input.value.trim());
      };

      this.cancelBtn.onclick = () => {
        if (this.onCancelCallback) this.onCancelCallback();
        this.hide();
      };

      this._initDrag();

      document.addEventListener('mousedown', (e) => {
        if (this.el.classList.contains('show')) {
          if (!this.el.contains(e.target) && !e.target.closest('.ds-sidebar-item') && !e.target.closest('.comment-trigger')) {
            this.hide();
          }
        }
      });
    }

    _initDrag() {
      let isDragging = false;
      let startX, startY, initialX, initialY;
      this.el.addEventListener('mousedown', (e) => {
        const interactive = ['BUTTON', 'TEXTAREA', 'INPUT', 'SVG', 'PATH'];
        if (interactive.includes(e.target.tagName) || e.target.closest('button')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = this.el.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        this.el.style.zIndex = '3000';
      });
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        this.el.style.left = (initialX + (e.clientX - startX)) + 'px';
        this.el.style.top = (initialY + (e.clientY - startY)) + 'px';
        this.el.style.transform = 'none';
      });
      window.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        this.el.style.zIndex = '2000';
      });
    }

    _autoResize() {
      this.input.style.height = 'auto';
      this.input.style.height = Math.min(this.input.scrollHeight, 240) + 'px';
    }

    _renderSecondaryAction(container, icon, title, callback) {
      container.innerHTML = '';
      const btn = new IconActionButton({
        iconName: icon,
        title: title,
        onClick: callback
      });
      container.appendChild(btn.render());
    }

    setMode(mode) {
      this.mode = mode;
      this.el.setAttribute('data-mode', mode);

      const editAction = this.el.querySelector('.ds-comment-form__edit-view .ds-comment-form__secondary-action');

      const viewAction = this.el.querySelector('.ds-comment-form__read-view .ds-comment-form__secondary-action');

      if (mode === 'view') {
        this._renderSecondaryAction(viewAction, 'pen-line', 'Edit comment', () => {
          if (this.onEditCallback) this.onEditCallback(this.display.textContent);
        });
        this.el.classList.remove('is-typing');
      } else {
        this._renderSecondaryAction(editAction, 'maximize-2', 'Expand to full editor', () => {
          if (this.onExpandCallback) this.onExpandCallback(this.input.value);
        });
      }
    }

    show(anchorBtn, mode = 'empty', text = '') {
      this.setMode(mode);
      if (mode === 'view') {
        this.display.textContent = text;
      } else {
        this.input.value = text;
        this.saveBtn.disabled = !text.trim();
        this.el.classList.toggle('is-filled', !!text.trim());
        this._autoResize();
        setTimeout(() => this.input.focus(), 50);
      }
      const rect = anchorBtn.getBoundingClientRect();
      let left = rect.right + 10;
      if (left + 360 > window.innerWidth - 10) left = rect.left - 370;
      this.el.style.left = `${left}px`;
      requestAnimationFrame(() => {
        const top = Math.max(10, Math.min(rect.top, window.innerHeight - this.el.offsetHeight - 10));
        this.el.style.top = `${top}px`;
      });
      this.el.classList.add('show');
    }

    hide() { this.el.classList.remove('show'); }
    setText(text) {
      this.input.value = text;
      this.saveBtn.disabled = !text.trim();
      this.el.classList.toggle('is-filled', !!text.trim());
      this._autoResize();
    }
    getText() { return this.input.value.trim(); }
    onSave(cb) { this.onSaveCallback = cb; }
    onCancel(cb) { this.onCancelCallback = cb; }
    onEdit(cb) { this.onEditCallback = cb; }
    onExpand(cb) { this.onExpandCallback = cb; }
  }

  return { getInstance: () => { if (!instance) instance = new CommentForm(); return instance; } };
})();

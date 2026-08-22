/* ============================================================
   commentCompose.js — tag chips and pasted-image attachments for
   the comment form.

   Bolted onto CommentFormComponent from the outside rather than
   built into it: that component is vendored from the desktop app
   by scripts/vendor-shared.js, so anything written into it here
   would be overwritten on the next `npm run vendor`. Same reason
   comments.js registers its extra icon through the public
   DesignSystem API instead of editing the vendored registry.

   Owns the composer state between show() and save: which tag is
   selected, which already-stored images are still attached, and
   which newly pasted ones are waiting to be written to disk.
   ============================================================ */

(function () {
  // Not in the app's icon set — the desktop comment form has no tag row.
  // Registered through the public API so re-vendoring never drops it.
  DesignSystem.registerIcons({
    tag: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>`
  });

  const TAGS = [
    { id: 'bug', label: 'Bug' },
    { id: 'enhancement', label: 'Enhancement' },
    { id: 'comment', label: 'Comment' },
    { id: 'question', label: 'Question' }
  ];

  let tag = null;
  /** Images already on disk, as {rel, uri} — `rel` is what gets saved back. */
  let kept = [];
  /** Newly pasted images, as {dataUrl} — the host turns these into files. */
  let pending = [];

  let form = null;
  let tagRow = null;
  let badgeEl = null;
  let strip = null;
  let closeTimer = null;

  /** The read-only counterpart shown while the form is in 'view' mode —
   *  the edit-view (and its tag row/attach strip) is hidden entirely then,
   *  so an existing comment's tag and images would otherwise vanish. */
  let readBadge = null;
  let readStrip = null;

  function isImageFile(file) {
    return !!file && typeof file.type === 'string' && file.type.startsWith('image/');
  }

  function readAsDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  // ── DOM ───────────────────────────────────────────────────

  function openDropdown(row) {
    clearTimeout(closeTimer);
    row.classList.add('is-open');
  }

  // A short grace period so the pointer can travel from the trigger down
  // into the dropdown without it closing under the cursor.
  function scheduleClose(row) {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => row.classList.remove('is-open'), 150);
  }

  function buildTagRow() {
    const row = document.createElement('div');
    row.className = 'mdp-tag-row';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'mdp-tag-trigger';
    trigger.innerHTML = DesignSystem.getIcon ? DesignSystem.getIcon('tag') || '' : '';
    row.appendChild(trigger);

    badgeEl = document.createElement('span');
    badgeEl.className = 'mdp-tag-badge mdp-tag-badge--inline';
    badgeEl.hidden = true;
    row.appendChild(badgeEl);

    const dropdown = document.createElement('div');
    dropdown.className = 'mdp-tag-dropdown';
    TAGS.forEach((t) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'mdp-tag-option';
      option.dataset.tag = t.id;
      option.innerHTML = `<span class="mdp-tag-option__dot"></span>${t.label}`;
      // A tag is optional, so picking the active one again clears it.
      option.addEventListener('click', () => {
        setTag(tag === t.id ? null : t.id);
        row.classList.remove('is-open');
      });
      dropdown.appendChild(option);
    });
    row.appendChild(dropdown);

    [trigger, dropdown].forEach((el) => {
      el.addEventListener('mouseenter', () => openDropdown(row));
      el.addEventListener('mouseleave', () => scheduleClose(row));
    });

    return row;
  }

  function buildStrip() {
    const el = document.createElement('div');
    el.className = 'mdp-attach-strip';
    return el;
  }

  function renderBadgeInto(el, tagId) {
    if (!el) return;
    const found = TAGS.find((t) => t.id === tagId);
    el.hidden = !found;
    el.textContent = found ? found.label : '';
    el.className = `mdp-tag-badge mdp-tag-badge--inline${found ? ` mdp-tag-badge--${found.id}` : ''}`;
  }

  function renderTagRow() {
    if (!tagRow) return;
    tagRow.querySelectorAll('.mdp-tag-option').forEach((option) => {
      option.classList.toggle('is-active', option.dataset.tag === tag);
    });
    tagRow.dataset.tag = tag || '';
    renderBadgeInto(badgeEl, tag);
  }

  /** Builds one thumbnail; `onRemove` omitted renders it read-only. */
  function buildThumb(src, onRemove) {
    const thumb = document.createElement('div');
    thumb.className = 'mdp-attach-thumb';

    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    thumb.appendChild(img);

    if (onRemove) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'mdp-attach-remove';
      remove.title = 'Remove image';
      remove.textContent = '✕';
      remove.addEventListener('click', (e) => {
        e.stopPropagation();
        onRemove();
      });
      thumb.appendChild(remove);
    }

    // Clicking a thumbnail opens it in the same pan/zoom overlay the
    // markdown images use, so a screenshot is readable at full size.
    if (window.ZoomSystem && typeof window.ZoomSystem.open === 'function') {
      img.addEventListener('click', () => window.ZoomSystem.open(src, 'image'));
    }

    return thumb;
  }

  function renderStrip() {
    if (!strip) return;
    strip.innerHTML = '';

    const entries = [
      ...kept.map((img, i) => ({ src: img.uri, remove: () => kept.splice(i, 1) })),
      ...pending.map((img, i) => ({ src: img.dataUrl, remove: () => pending.splice(i, 1) }))
    ];
    strip.classList.toggle('is-empty', entries.length === 0);

    entries.forEach((entry) => {
      strip.appendChild(
        buildThumb(entry.src, () => {
          entry.remove();
          renderStrip();
          syncSaveButton();
        })
      );
    });
  }

  /**
   * The vendored form enables Save from the textarea's input event alone.
   * An image with no text is a perfectly good comment, so keep the button in
   * step with the attachments too.
   */
  function syncSaveButton() {
    if (!form) return;
    const hasText = !!form.getText();
    const hasImages = kept.length + pending.length > 0;
    form.saveBtn.disabled = !hasText && !hasImages;
    form.el.classList.toggle('is-filled', hasText || hasImages);
  }

  function setTag(next) {
    tag = next;
    renderTagRow();
  }

  async function addFiles(files) {
    const images = Array.from(files).filter(isImageFile);
    if (!images.length) return false;

    for (const file of images) {
      const dataUrl = await readAsDataUrl(file);
      if (dataUrl) pending.push({ dataUrl });
    }
    renderStrip();
    syncSaveButton();
    return true;
  }

  function onPaste(event) {
    const data = event.clipboardData;
    if (!data) return;

    // clipboardData.items is the only clipboard read a VSCode webview is
    // allowed — navigator.clipboard is blocked in this context.
    const files = Array.from(data.items || [])
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter(isImageFile);
    if (!files.length) return;

    // Screenshot copies carry both a file and a placeholder text flavour;
    // taking the image means the text must not also land in the textarea.
    event.preventDefault();
    addFiles(files);
  }

  // ── Public API ────────────────────────────────────────────

  const MdpCompose = {
    /** Insert the tag row and attachment strip into the form, once. */
    attach(formInstance) {
      if (form) return MdpCompose;
      form = formInstance;

      const editView = form.el.querySelector('.ds-comment-form__edit-view');
      const inputWrap = form.el.querySelector('.ds-comment-form__input-wrap');
      if (!editView || !inputWrap) return MdpCompose;

      // Inside input-wrap, not as siblings before/after it: Figma's
      // InputContainer is one bordered/padded box holding the tag row, the
      // text, and the image row together — putting these two outside it
      // orphaned them without its 20px inset or 16px inter-row gap.
      tagRow = buildTagRow();
      strip = buildStrip();
      inputWrap.insertBefore(tagRow, form.input);
      inputWrap.insertBefore(strip, form.input.nextSibling);

      // The read-only counterpart: edit-view (and everything just inserted
      // into it) is hidden outright while the form is in 'view' mode, so an
      // existing comment's tag/images need their own home in read-view.
      const readHeaderLeft = form.el.querySelector('.ds-comment-form__read-header-left');
      const readBody = form.el.querySelector('.ds-comment-form__read-body');
      if (readHeaderLeft && readBody) {
        readBadge = document.createElement('span');
        readBadge.className = 'mdp-tag-badge mdp-tag-badge--inline';
        readBadge.hidden = true;
        readHeaderLeft.appendChild(readBadge);

        readStrip = buildStrip();
        readBody.appendChild(readStrip);
      }

      form.input.addEventListener('paste', onPaste);
      form.input.addEventListener('input', syncSaveButton);
      form.el.addEventListener('dragover', (e) => e.preventDefault());
      form.el.addEventListener('drop', (e) => {
        if (!e.dataTransfer || !e.dataTransfer.files.length) return;
        e.preventDefault();
        addFiles(e.dataTransfer.files);
      });

      this.reset();
      return MdpCompose;
    },

    /** Start a fresh composer, optionally seeded from an existing comment. */
    reset(comment) {
      tag = comment ? comment.tag || null : null;
      pending = [];
      kept = [];
      if (comment && Array.isArray(comment.images) && Array.isArray(comment.imageUris)) {
        kept = comment.images.map((rel, i) => ({ rel, uri: comment.imageUris[i] })).filter((x) => x.uri);
      }
      renderTagRow();
      renderStrip();
      syncSaveButton();
    },

    /** What the host needs to persist alongside the comment text. */
    getState() {
      return {
        tag,
        images: kept.map((img) => img.rel),
        pendingImages: pending.map((img) => img.dataUrl)
      };
    },

    hasAttachments() {
      return kept.length + pending.length > 0;
    },

    /** Raw DOM nodes — the expand-to-full-editor modal (comments.js) is
     *  built outside this module, and relocates these into itself rather
     *  than keeping a second, separately-synced copy of the same state. */
    elements() {
      return { tagRow, strip };
    },

    /** Puts the tag row/strip back in their home spot inside the small
     *  popup's input-wrap, e.g. after the expand modal is done borrowing them. */
    returnHome() {
      if (!form || !tagRow || !strip) return;
      const inputWrap = form.el.querySelector('.ds-comment-form__input-wrap');
      if (!inputWrap) return;
      inputWrap.insertBefore(tagRow, form.input);
      inputWrap.insertBefore(strip, form.input.nextSibling);
    },

    /** Populate the read-only tag badge + thumbnails for an existing
     *  comment shown in 'view' mode. Independent of reset()'s editable
     *  state — nothing here is ever saved back. */
    showView(comment) {
      renderBadgeInto(readBadge, comment && comment.tag);
      if (!readStrip) return;
      readStrip.innerHTML = '';
      const uris = (comment && comment.imageUris) || [];
      readStrip.classList.toggle('is-empty', uris.length === 0);
      uris.forEach((src) => readStrip.appendChild(buildThumb(src)));
    }
  };

  window.MdpCompose = MdpCompose;
})();

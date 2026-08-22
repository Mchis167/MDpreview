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
    { id: 'comment', label: 'Comment' }
  ];

  let tag = null;
  /** Images already on disk, as {rel, uri} — `rel` is what gets saved back. */
  let kept = [];
  /** Newly pasted images, as {dataUrl} — the host turns these into files. */
  let pending = [];

  let form = null;
  let tagRow = null;
  let strip = null;

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

  function buildTagRow() {
    const row = document.createElement('div');
    row.className = 'mdp-tag-row';

    const icon = document.createElement('span');
    icon.className = 'mdp-tag-row__icon';
    icon.innerHTML = DesignSystem.getIcon ? DesignSystem.getIcon('tag') || '' : '';
    row.appendChild(icon);

    TAGS.forEach((t) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'mdp-tag-chip';
      chip.dataset.tag = t.id;
      chip.textContent = t.label;
      // A tag is optional, so a second click on the active chip clears it.
      chip.addEventListener('click', () => setTag(tag === t.id ? null : t.id));
      row.appendChild(chip);
    });

    return row;
  }

  function buildStrip() {
    const el = document.createElement('div');
    el.className = 'mdp-attach-strip';
    return el;
  }

  function renderTagRow() {
    if (!tagRow) return;
    tagRow.querySelectorAll('.mdp-tag-chip').forEach((chip) => {
      chip.classList.toggle('is-active', chip.dataset.tag === tag);
    });
    tagRow.dataset.tag = tag || '';
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
      const thumb = document.createElement('div');
      thumb.className = 'mdp-attach-thumb';

      const img = document.createElement('img');
      img.src = entry.src;
      img.alt = '';
      thumb.appendChild(img);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'mdp-attach-remove';
      remove.title = 'Remove image';
      remove.textContent = '✕';
      remove.addEventListener('click', (e) => {
        e.stopPropagation();
        entry.remove();
        renderStrip();
        syncSaveButton();
      });
      thumb.appendChild(remove);

      // Clicking a thumbnail opens it in the same pan/zoom overlay the
      // markdown images use, so a screenshot is readable at full size.
      if (window.ZoomSystem && typeof window.ZoomSystem.open === 'function') {
        img.addEventListener('click', () => window.ZoomSystem.open(entry.src, 'image'));
      }

      strip.appendChild(thumb);
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

      tagRow = buildTagRow();
      strip = buildStrip();
      editView.insertBefore(tagRow, inputWrap);
      editView.insertBefore(strip, inputWrap.nextSibling);

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
    }
  };

  window.MdpCompose = MdpCompose;
})();

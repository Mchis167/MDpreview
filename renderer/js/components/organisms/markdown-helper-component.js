/* ══════════════════════════════════════════════════
   MarkdownHelperComponent.js — Markdown Guide Organism
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class MarkdownHelperComponent {
  constructor() {
    this.popover = null;
  }

  /**
   * Main render function that returns the content element
   */
  render() {
    const container = DesignSystem.createElement('div', 'markdown-helper-organism');

    const sections = [
      {
        title: 'Format',
        items: [
          { label: 'In đậm', syntax: '**text**', action: 'b' },
          { label: 'In nghiêng', syntax: '*text*', action: 'i' },
          { label: 'Đậm + Nghiêng', syntax: '***text***', action: 'bi' },
          { label: 'Gạch ngang', syntax: '~~text~~', action: 's' },
          { label: 'Inline code', syntax: '`text`', action: 'c' }
        ]
      },
      {
        title: 'Tiêu đề',
        items: [
          { label: 'H1', syntax: '# H1', action: 'h1' },
          { label: 'H2', syntax: '## H2', action: 'h2' },
          { label: 'H3', syntax: '### H3', action: 'h3' },
          { label: 'H4', syntax: '#### H4', action: 'h' },
          { label: 'H5', syntax: '##### H5', action: 'h5' },
          { label: 'H6', syntax: '###### H6', action: 'h6' }
        ]
      },
      {
        title: 'Danh sách',
        items: [
          { label: 'Bullet list', syntax: '- ITEM', action: 'ul' },
          { label: 'Numbered list', syntax: '1. ITEM', action: 'ol' },
          { label: 'Checkbox', syntax: '- [ ] ITEM', action: 'tl' },
          { label: 'Checked', syntax: '- [x] ITEM', action: 'tl-checked' }
        ]
      },
      {
        title: 'Khác',
        items: [
          { label: 'Blockquote', syntax: '> TEXT', action: 'q' },
          { label: 'Link', syntax: '[NAME](URL)', action: 'l' },
          { label: 'Image', syntax: '![ALT](URL)', action: 'img' },
          { label: 'Code block', syntax: '```lang ```', action: 'cb' },
          { label: 'Table', syntax: '| A | B |', action: 'tb' },
          { label: 'Đường kẻ', syntax: '---', action: 'hr' },
          { label: 'Footnote', syntax: 'TEXT[^1]', action: 'fn' }
        ]
      }
    ];

    sections.forEach(sec => {
      const group = DesignSystem.createElement('div', 'ds-popover-group');
      const title = DesignSystem.createElement('div', 'ds-popover-group-title', { text: sec.title });
      const grid = DesignSystem.createElement('div', 'help-grid');

      sec.items.forEach(item => {
        const btn = DesignSystem.createElement('div', 'help-item-btn', {
          'data-action': item.action,
          'html': `
            <span class="help-label">${item.label}</span>
            <span class="help-syntax">${item.syntax}</span>
          `
        });

        btn.onclick = () => {
          if (window.EditorModule) {
            window.EditorModule.applyAction(item.action);
          }
        };

        grid.appendChild(btn);
      });

      // Add empty spacer for grid balance if needed
      if (sec.items.length % 2 !== 0) {
        grid.appendChild(DesignSystem.createElement('div', 'help-empty'));
      }

      group.appendChild(title);
      group.appendChild(grid);
      container.appendChild(group);
    });

    return container;
  }

  /**
   * Open the Help UI in a Popover Shield
   */
  static open() {
    const component = new MarkdownHelperComponent();
    const content = component.render();

    const mainCanvas = document.querySelector('.glass-main');
    const popover = DesignSystem.createPopoverShield({
      title: 'Markdown Helper',
      content: content,
      width: '560px',
      hasBackdrop: false,
      container: mainCanvas || document.body,
      className: 'markdown-helper-popover'
    });

    // Add Y offset as requested
    popover.card.style.marginTop = '-32px';


    return popover;
  }
}

// Export for Design System
window.MarkdownHelperComponent = MarkdownHelperComponent;

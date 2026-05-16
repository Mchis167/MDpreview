/**
 * HomeCard.js — Individual document card for Home dashboard.
 * 
 * Target: Home screen sections (Pinned, Continue Edit).
 * Standard: Atomic Design V2 (Molecule).
 */
const HomeCard = (() => {
  'use strict';

  /**
   * Creates a card element for the home dashboard.
   * @param {Object} options 
   * @param {string} options.path
   * @param {number} [options.timestamp]
   * @param {string} [options.icon] - Icon name (default: file-text)
   * @param {string} [options.subtitle] - Custom subtitle text
   * @returns {HTMLElement}
   */
  function create(options = {}) {
    const { path, timestamp, icon, subtitle, onContextMenu } = options;
    if (!path) return null;

    const el = DesignSystem.createElement('div', 'ds-home-card');
    el.onclick = () => {
      if (window.loadFile) window.loadFile(path);
    };

    if (onContextMenu) {
      el.oncontextmenu = (e) => {
        onContextMenu(e, path);
      };
    }

    // Icon
    const isDraft = path.startsWith('__DRAFT_');
    const iconName = icon || (isDraft ? 'file-edit' : 'file-text');
    const iconEl = DesignSystem.createElement('div', 'ds-home-card-icon', {
      html: DesignSystem.getIcon(iconName, { width: 20, height: 20 })
    });

    // Content
    const content = DesignSystem.createElement('div', 'ds-home-card-content');

    // Title (File Name)
    let displayName = path.split('/').pop();
    if (isDraft && window.DraftModule) {
      displayName = window.DraftModule.getDisplayName(path);
    } else if (displayName.toLowerCase().endsWith('.md')) {
      displayName = displayName.substring(0, displayName.length - 3);
    }

    const titleEl = DesignSystem.createElement('div', 'ds-home-card-title', {
      text: displayName,
      title: displayName
    });

    // Subtitle
    let subText = subtitle;
    if (!subText && timestamp) {
      const timeText = window.TimeUtil ? window.TimeUtil.getRelativeTime(timestamp) : 'Recently';
      subText = `Last edit: ${timeText}`;
    } else if (!subText) {
      subText = path; // Default to path if nothing else provided
    }

    const subtitleEl = DesignSystem.createElement('div', 'ds-home-card-subtitle', {
      text: subText,
      title: path
    });

    content.appendChild(titleEl);
    content.appendChild(subtitleEl);

    el.appendChild(iconEl);
    el.appendChild(content);

    return el;
  }

  return {
    create
  };
})();

window.HomeCard = HomeCard;

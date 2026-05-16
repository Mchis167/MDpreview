/**
 * TimeUtil.js — Utility for time-related formatting.
 * 
 * Target: Formatting timestamps into relative strings.
 * Standard: Atomic Design V2 (Utility).
 */
const TimeUtil = (() => {
  'use strict';

  /**
   * Returns a relative time string (e.g., "5 minutes ago", "2 days ago")
   * @param {number|string|Date} timestamp 
   * @returns {string}
   */
  function getRelativeTime(timestamp) {
    if (!timestamp) return '';
    
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = now - then;

    // Future check
    if (diff < 0) return 'Just now';

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days < 30) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      // Fallback for very old dates
      return new Date(then).toLocaleDateString();
    }
  }

  return {
    getRelativeTime
  };
})();

window.TimeUtil = TimeUtil;

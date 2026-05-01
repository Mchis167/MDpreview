/**
 * mermaid-config.js
 * Centralized Mermaid diagram configuration for server and worker.
 * Source of truth for theme variables, initialization settings.
 *
 * Works in both browser (global) and Node.js (CommonJS) contexts.
 */

/* eslint-disable no-undef */
(function() {
  'use strict';

  const MERMAID_THEME_COLORS = {
    primaryColor: '#ffbf48',
    primaryTextColor: '#000000',
    primaryBorderColor: '#e6a800',
    lineColor: '#aaaaaa',
    secondaryColor: '#2a2a3e',
    tertiaryColor: '#1d1d2e',
    mainBkg: '#2d2d42',
    nodeBorder: '#5a5a7a',
    clusterBkg: 'rgba(255,255,255,0.04)',
    titleColor: '#ffffff',
    edgeLabelBackground: '#1a1a2e',
    fontFamily: 'Inter, sans-serif'
  };

  const BASE_CONFIG = {
    theme: 'dark'
  };

  const SERVER_CONFIG = Object.assign({}, BASE_CONFIG, {
    startOnLoad: false,
    themeVariables: MERMAID_THEME_COLORS
  });

  const WORKER_CONFIG = Object.assign({}, BASE_CONFIG, {
    startOnLoad: true,
    securityLevel: 'loose'
  });

  function getMermaidConfig(environment) {
    if (environment === 'server') {
      return SERVER_CONFIG;
    } else if (environment === 'worker') {
      return WORKER_CONFIG;
    } else {
      throw new Error(`Unknown environment: ${environment}. Use 'server' or 'worker'.`);
    }
  }

  const exports = {
    MERMAID_THEME_COLORS,
    BASE_CONFIG,
    SERVER_CONFIG,
    WORKER_CONFIG,
    getMermaidConfig
  };

  // Browser global
  if (typeof window !== 'undefined') {
    window.mermaidConfig = exports;
  }

  // CommonJS export for tests
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exports;
  }
})();
/* eslint-enable no-undef */

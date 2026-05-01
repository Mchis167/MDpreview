/**
 * mermaid-config.js
 * Centralized Mermaid diagram configuration for server and worker.
 * Source of truth for theme variables, initialization settings.
 *
 * Usage:
 *   Browser/ES modules: import { getMermaidConfig } from './mermaid-config.js';
 *   CommonJS (tests): const { getMermaidConfig } = require('./mermaid-config.js');
 */

export const MERMAID_THEME_COLORS = {
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

export const BASE_CONFIG = {
  theme: 'dark'
};

export const SERVER_CONFIG = {
  ...BASE_CONFIG,
  startOnLoad: false,
  themeVariables: MERMAID_THEME_COLORS
};

export const WORKER_CONFIG = {
  ...BASE_CONFIG,
  startOnLoad: true,
  securityLevel: 'loose'
};

/**
 * Get Mermaid configuration for the specified environment.
 *
 * @param {string} environment - 'server' or 'worker'
 * @returns {Object} Mermaid.initialize() config object
 */
export function getMermaidConfig(environment) {
  if (environment === 'server') {
    return SERVER_CONFIG;
  } else if (environment === 'worker') {
    return WORKER_CONFIG;
  } else {
    throw new Error(`Unknown environment: ${environment}. Use 'server' or 'worker'.`);
  }
}

// Export default for convenience
export default { MERMAID_THEME_COLORS, BASE_CONFIG, SERVER_CONFIG, WORKER_CONFIG, getMermaidConfig };

// For CommonJS compatibility in tests
/* eslint-disable no-undef */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MERMAID_THEME_COLORS,
    BASE_CONFIG,
    SERVER_CONFIG,
    WORKER_CONFIG,
    getMermaidConfig
  };
}
/* eslint-enable no-undef */

/* eslint-disable no-undef */
const {
  MERMAID_THEME_COLORS,
  BASE_CONFIG,
  SERVER_CONFIG,
  WORKER_CONFIG,
  getMermaidConfig
} = require('../mermaid-config.js');

describe('mermaid-config', () => {
  describe('MERMAID_THEME_COLORS', () => {
    it('should have all required color properties', () => {
      expect(MERMAID_THEME_COLORS).toHaveProperty('primaryColor');
      expect(MERMAID_THEME_COLORS).toHaveProperty('primaryTextColor');
      expect(MERMAID_THEME_COLORS).toHaveProperty('primaryBorderColor');
      expect(MERMAID_THEME_COLORS).toHaveProperty('lineColor');
      expect(MERMAID_THEME_COLORS).toHaveProperty('secondaryColor');
      expect(MERMAID_THEME_COLORS).toHaveProperty('tertiaryColor');
      expect(MERMAID_THEME_COLORS).toHaveProperty('mainBkg');
      expect(MERMAID_THEME_COLORS).toHaveProperty('nodeBorder');
      expect(MERMAID_THEME_COLORS).toHaveProperty('clusterBkg');
      expect(MERMAID_THEME_COLORS).toHaveProperty('titleColor');
      expect(MERMAID_THEME_COLORS).toHaveProperty('edgeLabelBackground');
      expect(MERMAID_THEME_COLORS).toHaveProperty('fontFamily');
    });

    it('should have valid color values', () => {
      Object.entries(MERMAID_THEME_COLORS).forEach(([_key, value]) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
        // Color should be hex, rgb, rgba, or a font family
        expect(/^(#|rgba?)/.test(value) || /^[A-Za-z]/.test(value)).toBe(true);
      });
    });

    it('should use golden and purple color scheme', () => {
      expect(MERMAID_THEME_COLORS.primaryColor).toBe('#ffbf48'); // golden
      expect(MERMAID_THEME_COLORS.secondaryColor).toContain('2a'); // purple
    });
  });

  describe('BASE_CONFIG', () => {
    it('should have theme set to dark', () => {
      expect(BASE_CONFIG.theme).toBe('dark');
    });

    it('should be shared by all configs', () => {
      expect(SERVER_CONFIG.theme).toBe(BASE_CONFIG.theme);
      expect(WORKER_CONFIG.theme).toBe(BASE_CONFIG.theme);
    });
  });

  describe('SERVER_CONFIG', () => {
    it('should have startOnLoad set to false', () => {
      expect(SERVER_CONFIG.startOnLoad).toBe(false);
    });

    it('should include all theme variables', () => {
      expect(SERVER_CONFIG.themeVariables).toEqual(MERMAID_THEME_COLORS);
    });

    it('should not have securityLevel', () => {
      expect(SERVER_CONFIG.securityLevel).toBeUndefined();
    });

    it('should inherit theme from BASE_CONFIG', () => {
      expect(SERVER_CONFIG.theme).toBe('dark');
    });
  });

  describe('WORKER_CONFIG', () => {
    it('should have startOnLoad set to true', () => {
      expect(WORKER_CONFIG.startOnLoad).toBe(true);
    });

    it('should have securityLevel set to loose', () => {
      expect(WORKER_CONFIG.securityLevel).toBe('loose');
    });

    it('should not have themeVariables', () => {
      expect(WORKER_CONFIG.themeVariables).toBeUndefined();
    });

    it('should inherit theme from BASE_CONFIG', () => {
      expect(WORKER_CONFIG.theme).toBe('dark');
    });
  });

  describe('getMermaidConfig()', () => {
    it('should return SERVER_CONFIG for "server" environment', () => {
      const config = getMermaidConfig('server');
      expect(config).toEqual(SERVER_CONFIG);
    });

    it('should return WORKER_CONFIG for "worker" environment', () => {
      const config = getMermaidConfig('worker');
      expect(config).toEqual(WORKER_CONFIG);
    });

    it('should throw error for unknown environment', () => {
      expect(() => {
        getMermaidConfig('unknown');
      }).toThrow('Unknown environment');
    });

    it('should throw error for undefined environment', () => {
      expect(() => {
        getMermaidConfig();
      }).toThrow('Unknown environment');
    });

    it('should return config with startOnLoad property', () => {
      const serverConfig = getMermaidConfig('server');
      const workerConfig = getMermaidConfig('worker');

      expect(serverConfig).toHaveProperty('startOnLoad');
      expect(workerConfig).toHaveProperty('startOnLoad');
      expect(serverConfig.startOnLoad).toBe(false);
      expect(workerConfig.startOnLoad).toBe(true);
    });
  });

  describe('Integration: Config Parity', () => {
    it('should have consistent theme across environments', () => {
      const serverConfig = getMermaidConfig('server');
      const workerConfig = getMermaidConfig('worker');

      expect(serverConfig.theme).toBe(workerConfig.theme);
      expect(serverConfig.theme).toBe('dark');
    });

    it('server should include theme variables while worker uses defaults', () => {
      const serverConfig = getMermaidConfig('server');
      const workerConfig = getMermaidConfig('worker');

      expect(serverConfig).toHaveProperty('themeVariables');
      expect(workerConfig).not.toHaveProperty('themeVariables');
    });

    it('should be valid for mermaid.initialize()', () => {
      const serverConfig = getMermaidConfig('server');
      const workerConfig = getMermaidConfig('worker');

      // Both should be objects
      expect(typeof serverConfig).toBe('object');
      expect(typeof workerConfig).toBe('object');

      // Both should have theme
      expect(serverConfig).toHaveProperty('theme');
      expect(workerConfig).toHaveProperty('theme');

      // Both should have startOnLoad
      expect(serverConfig).toHaveProperty('startOnLoad');
      expect(workerConfig).toHaveProperty('startOnLoad');
    });
  });
});

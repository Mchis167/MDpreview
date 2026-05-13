/**
 * BugLogger — Specialized utility for tracing Monaco/App lifecycle issues
 */
/* eslint-disable no-console */
const BugLogger = (() => {
  const ENABLED = true;
  const PREFIX = '🐛 [BugLogger]';

  function log(message, data = null) {
    if (!ENABLED) return;
    const timestamp = new Date().toISOString().split('T')[1].split('Z')[0];
    const color = '#ffbf48'; // Accent color
    
    if (data !== null) {
      console.log(`%c${PREFIX} [${timestamp}] ${message}`, `color: ${color}; font-weight: bold;`, data);
    } else {
      console.log(`%c${PREFIX} [${timestamp}] ${message}`, `color: ${color}; font-weight: bold;`);
    }
  }

  function trace(label) {
    if (!ENABLED) return;
    console.trace(`${PREFIX} TRACE: ${label}`);
  }

  function logWithStack(message, data = null) {
    if (!ENABLED) return;
    log(message, data);
    console.groupCollapsed(`${PREFIX} STACK TRACE for: ${message}`);
    console.trace();
    console.groupEnd();
  }

  return { log, trace, logWithStack };
})();

window.BugLogger = BugLogger;

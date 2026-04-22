/**
 * audit-security.js — Automated Security & Stress Test Suite
 * Run with: node tests/audit-security.js
 */

const path = require('path');
const fs = require('fs');

const COLORS = {
  RESET: "\x1b[0m",
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  CYAN: "\x1b[36m"
};

function log(msg, color = COLORS.RESET) {
  console.log(`${color}${msg}${COLORS.RESET}`);
}

// ── Mock resolvePath logic (copied from server for testing) ──────────
function resolvePath(watchDir, filePath) {
  const fullPath = path.isAbsolute(filePath) ? path.normalize(filePath) : path.resolve(watchDir, filePath);
  const normalizedWatchDir = path.normalize(watchDir);
  if (!fullPath.startsWith(normalizedWatchDir)) {
    throw new Error('Security Error: Path traversal detected.');
  }
  return fullPath;
}

// ── Test Runner ───────────────────────────────────────────────
async function runTests() {
  log("🚀 Starting MDpreview Security & Stress Audit...", COLORS.CYAN);

  let passed = 0;
  let failed = 0;

  const test = (name, fn) => {
    try {
      fn();
      log(`✅ PASS: ${name}`, COLORS.GREEN);
      passed++;
    } catch (e) {
      log(`❌ FAIL: ${name} -> ${e.message}`, COLORS.RED);
      failed++;
    }
  };

  const MOCK_WS = "/Users/mchisdo/MDpreview";

  // 1. Path Traversal Tests
  test("Should allow valid file in workspace", () => {
    const res = resolvePath(MOCK_WS, "README.md");
    if (!res.includes(MOCK_WS)) throw new Error("Path incorrect");
  });

  test("Should block relative traversal (../../etc/passwd)", () => {
    try {
      resolvePath(MOCK_WS, "../../etc/passwd");
      throw new Error("Traversed successfully! (VULNERABLE)");
    } catch (e) {
      if (e.message.includes("Path traversal detected")) return;
      throw e;
    }
  });

  test("Should block absolute traversal (/etc/passwd)", () => {
    try {
      resolvePath(MOCK_WS, "/etc/passwd");
      throw new Error("Traversed successfully! (VULNERABLE)");
    } catch (e) {
      if (e.message.includes("Path traversal detected")) return;
      throw e;
    }
  });

  test("Should block tricky traversal (./../MDpreview/../../etc/passwd)", () => {
    try {
      resolvePath(MOCK_WS, "./../MDpreview/../../etc/passwd");
      throw new Error("Traversed successfully! (VULNERABLE)");
    } catch (e) {
      if (e.message.includes("Path traversal detected")) return;
      throw e;
    }
  });

  // 2. Special Characters Test
  test("Should handle spaces and symbols in filenames", () => {
    const weirdName = "File # With & Spaces.md";
    const res = resolvePath(MOCK_WS, weirdName);
    if (!res.endsWith(weirdName)) throw new Error("Filename corrupted");
  });

  // 3. Stress Test Simulation (File Size)
  test("Large file path resolution performance", () => {
    const start = Date.now();
    for(let i=0; i<1000; i++) {
        resolvePath(MOCK_WS, "folder/sub/sub/sub/file_" + i + ".md");
    }
    const end = Date.now();
    if (end - start > 100) throw new Error("Path resolution too slow: " + (end-start) + "ms");
    log(`   (1000 paths resolved in ${end - start}ms)`, COLORS.YELLOW);
  });

  log("\n--- Audit Summary ---", COLORS.CYAN);
  log(`Total: ${passed + failed}`, COLORS.RESET);
  log(`Passed: ${passed}`, COLORS.GREEN);
  log(`Failed: ${failed}`, failed > 0 ? COLORS.RED : COLORS.GREEN);

  if (failed > 0) process.exit(1);
}

runTests();

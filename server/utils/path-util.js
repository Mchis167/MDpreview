const path = require('path');

/**
 * Resolves an absolute path safely within a watch directory.
 * Handles case-insensitivity on macOS and Windows to prevent security false-positives.
 * 
 * @param {string} watchDir - The base workspace directory (absolute).
 * @param {string} filePath - The relative or absolute path to resolve.
 * @returns {string} The resolved absolute path.
 * @throws {Error} Security error if path traversal is detected.
 */
function resolvePath(watchDir, filePath) {
  if (!watchDir) throw new Error('No workspace directory set.');
  
  // 1. Resolve to absolute path
  const fullPath = path.isAbsolute(filePath) ? path.normalize(filePath) : path.resolve(watchDir, filePath);
  const normalizedWatchDir = path.normalize(watchDir);

  // 2. Prepare case-insensitive check if applicable
  const isCaseInsensitive = process.platform === 'win32' || process.platform === 'darwin';
  const checkFullPath = isCaseInsensitive ? fullPath.toLowerCase() : fullPath;
  const checkWatchDir = isCaseInsensitive ? normalizedWatchDir.toLowerCase() : normalizedWatchDir;

  // 3. Security: Ensure the path is INSIDE watchDir
  // We append a trailing separator to avoid partial folder name matches (e.g. /work vs /work-files)
  const sep = path.sep;
  const checkWatchDirWithSep = checkWatchDir.endsWith(sep) ? checkWatchDir : checkWatchDir + sep;

  if (!checkFullPath.startsWith(checkWatchDirWithSep) && checkFullPath !== checkWatchDir) {
    throw new Error('Security Error: Path traversal detected.');
  }

  return fullPath;
}

module.exports = {
  resolvePath
};

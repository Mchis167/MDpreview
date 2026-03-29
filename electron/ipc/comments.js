const { app } = require('electron');
const path = require('path');
const fs   = require('fs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR     = app.getPath('userData');
const COMMENTS_DIR = path.join(DATA_DIR, 'comments');

// Ensure comments base directory exists
if (!fs.existsSync(COMMENTS_DIR)) {
  fs.mkdirSync(COMMENTS_DIR, { recursive: true });
}

function commentsFile(workspaceId, filePath) {
  // Encode file path to a safe filename
  const encoded = filePath.replace(/[/\\:.]/g, '_');
  const dir = path.join(COMMENTS_DIR, workspaceId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${encoded}.json`);
}

function loadComments(wsId, filePath) {
  try {
    return JSON.parse(fs.readFileSync(commentsFile(wsId, filePath), 'utf8'));
  } catch {
    return [];
  }
}

function saveComments(wsId, filePath, comments) {
  fs.writeFileSync(commentsFile(wsId, filePath), JSON.stringify(comments, null, 2), 'utf8');
}

function register(ipcMain) {
  ipcMain.handle('get-comments', (event, wsId, filePath) => {
    return loadComments(wsId, filePath);
  });

  ipcMain.handle('save-comment', (event, wsId, filePath, comment) => {
    const comments = loadComments(wsId, filePath);
    const newComment = { id: uuidv4(), ...comment, createdAt: new Date().toISOString() };
    comments.push(newComment);
    comments.sort((a, b) => a.lineStart - b.lineStart);
    saveComments(wsId, filePath, comments);
    return newComment;
  });

  ipcMain.handle('delete-comment', (event, wsId, filePath, commentId) => {
    const comments = loadComments(wsId, filePath).filter(c => c.id !== commentId);
    saveComments(wsId, filePath, comments);
    return comments;
  });

  ipcMain.handle('clear-comments', (event, wsId, filePath) => {
    saveComments(wsId, filePath, []);
    return [];
  });
}

module.exports = { register };

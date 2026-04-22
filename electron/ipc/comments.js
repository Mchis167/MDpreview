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
    const data = fs.readFileSync(commentsFile(wsId, filePath), 'utf8');
    const comments = JSON.parse(data);
    
    // Auto-fix: Ensure every comment has a unique ID
    let changed = false;
    comments.forEach(c => {
      if (!c.id) {
        c.id = uuidv4();
        changed = true;
      }
    });
    
    if (changed) {
      saveComments(wsId, filePath, comments);
    }
    
    return comments;
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

  ipcMain.handle('save-comment', (event, wsId, filePath, commentData) => {
    const comments = loadComments(wsId, filePath);
    let resultComment;

    // Destructure to avoid overwriting id with null/undefined from frontend
    const { id, createdAt, ...data } = commentData;

    if (id) {
      // Update existing
      const idx = comments.findIndex(c => c.id === id);
      if (idx !== -1) {
        comments[idx] = { ...comments[idx], ...data, updatedAt: new Date().toISOString() };
        resultComment = comments[idx];
      } else {
        // ID provided but not found, create new anyway
        resultComment = { ...data, id, createdAt: new Date().toISOString() };
        comments.push(resultComment);
      }
    } else {
      // Create new
      resultComment = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
      comments.push(resultComment);
    }

    comments.sort((a, b) => a.lineStart - b.lineStart);
    saveComments(wsId, filePath, comments);
    return resultComment;
  });

  ipcMain.handle('delete-comment', (event, wsId, filePath, commentId) => {
    if (!commentId) return loadComments(wsId, filePath);
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

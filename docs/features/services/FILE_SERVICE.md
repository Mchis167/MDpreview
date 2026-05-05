# File Service

The `FileService` is a high-level service that provides unified file operations for both Desktop (Electron) and Web environments. It abstracts the underlying IPC calls or Fetch API requests into a clean, promise-based interface.

## Public API

### `fetchFiles(options)`
Fetches the file tree from the workspace.
- **options**: `{ showHidden, hideEmpty, flat }`
- **Returns**: `Promise<Array>`

### `saveFile(absPath, content)`
Saves content to a specific file. This is used by both the Editor and the Interactive Task List.
- **absPath**: Absolute path to the file.
- **content**: The string content to save.
- **Returns**: `Promise<boolean>`

### `createFile(absPath, content)`
Creates a new file at the specified path.

### `createFolder(absPath)`
Creates a new directory.

### `deleteFile(absPath, options?)`
Deletes a file or folder.
- **options**: `{ silent }`. If `silent: true`, success/error toast notifications will be suppressed (useful for batch operations).

### `renameFile(oldAbs, newAbs)`
Renames or moves an item.

## Integration with Task Lists

The `FileService.saveFile` method is the bridge that allows View Mode checkboxes to persist their state. When a checkbox is toggled, the `MarkdownViewerComponent` updates its internal state and then calls `FileService.saveFile` to synchronize with the source `.md` file on disk.

```javascript
const success = await window.FileService.saveFile(this.state.file, newContent);
```

## Implementation Details

- **Desktop**: Routes through `window.electronAPI` for native file system access.
- **Web/Server**: Uses `POST /api/file/save` to persist changes via the Node.js backend.
---
*Document — 2026-05-05 (Updated deleteFile signature)*

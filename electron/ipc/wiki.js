function register(ipcMain) {
  // wiki:getStatus(workspaceId)
  ipcMain.handle('wiki:get-status', async (_event, _workspaceId) => {
    // This will be expanded when we have a global state manager for wiki scanners
    // For now, it's just a placeholder or it reads from the workspace config
    return { status: 'off' }; 
  });

  // wiki:enable(workspaceId)
  ipcMain.handle('wiki:enable', async (event, workspaceId) => {
    console.log(`[Wiki] Enabling for workspace: ${workspaceId}`);
    // In Phase 1, this will trigger the actual indexer
    return { success: true, status: 'active' };
  });

  // wiki:rescan(workspaceId)
  ipcMain.handle('wiki:rescan', async (_event, _workspaceId) => {
    console.log(`[IPC] Rescanning Wiki for workspace: ${_workspaceId}`);
    
    // Phase 0 Mock: Wait 3 seconds then notify UI to become active
    // In Phase 1, this will trigger the real indexer
    setTimeout(async () => {
      // In a real scenario, we would emit an event or update the DB
      // For now, let's just simulate the process
      console.log(`[IPC] Mock Scan Complete for ${_workspaceId}`);
    }, 3000);

    return { success: true, status: 'scanning' };
  });

  // wiki:disable(workspaceId)
  ipcMain.handle('wiki:disable', async (event, workspaceId) => {
    console.log(`[Wiki] Disabling for workspace: ${workspaceId}`);
    return { success: true, status: 'inactive' };
  });

  // wiki:remove(workspaceId)
  ipcMain.handle('wiki:remove', async (event, workspaceId) => {
    console.log(`[Wiki] Removing data for workspace: ${workspaceId}`);
    // In Phase 1, this will delete the .wiki-index.json file
    return { success: true, status: 'off' };
  });
}

module.exports = { register };

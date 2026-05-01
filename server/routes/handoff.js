const express = require('express');
const router = express.Router();


/**
 * Handoff Proxy Route
 * Purpose: Bypass CORS for web environment by proxying requests to handoff.host
 */
router.post('/handoff/publish', async (req, res) => {
  try {
    const { html, slug, token, note, password } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, error: 'Missing API Token' });
    }

    const formData = new FormData();
    
    // 1. Main file (HTML)
    const htmlBlob = new Blob([html], { type: 'text/html' });
    formData.append('file', htmlBlob, 'index.html');
    
    // 2. Metadata
    formData.append('slug', slug);
    if (note) formData.append('note', note);
    if (password) formData.append('password', password);
    
    // Perform server-to-server request (Bypasses CORS)
    const response = await fetch('https://handoff.host/api/upload/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false, 
        error: result.error || result.message || `Upload failed with status ${response.status}` 
      });
    }
    
    res.json({ 
      success: true, 
      url: result.url,
      version: result.version
    });
  } catch (error) {
    console.error('[SERVER HANDOFF] Proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

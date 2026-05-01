const express = require('express');
const router = express.Router();

/**
 * POST /api/worker-publish
 * Proxy request to Cloudflare Worker with Admin Secret
 * This prevents the secret from being exposed in the browser.
 */
router.post('/worker-publish', async (req, res) => {
  try {
    const { payload, workerUrl, secret } = req.body;

    if (!workerUrl || !secret) {
      return res.status(400).json({ error: 'Worker URL and Admin Secret are required' });
    }

    const response = await fetch(`${workerUrl}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': secret
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: result.error || `Worker responded with ${response.status}` 
      });
    }

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Server] Worker Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

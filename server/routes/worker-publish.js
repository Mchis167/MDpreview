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
      console.warn('[Server] Worker Proxy: Missing credentials');
      return res.status(400).json({ error: 'Worker URL and Admin Secret are required' });
    }

    // Ensure workerUrl has a protocol
    let targetUrl = workerUrl;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }
    
    // Ensure no double slashes when joining
    targetUrl = targetUrl.replace(/\/$/, '') + '/publish';

    const payloadSize = JSON.stringify(payload).length;
    console.log(`[Server] Proxying publish request:
      - Target: ${targetUrl}
      - Slug: ${payload?.slug}
      - Payload Size: ${(payloadSize / 1024).toFixed(2)} KB`);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': secret
      },
      body: JSON.stringify(payload)
    });

    const contentType = response.headers.get('content-type');
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      result = { error: text || `Worker responded with HTTP ${response.status}` };
    }

    if (!response.ok) {
      console.error(`[Server] Worker error (${response.status}):`, result.error);
      return res.status(response.status).json({ 
        error: result.error || `Worker responded with HTTP ${response.status}`,
        code: result.code || 'WORKER_ERROR'
      });
    }

    console.log(`[Server] Publish successful for slug: ${payload?.slug}`);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Server] Worker Proxy exception:', error);
    res.status(500).json({ 
      error: `Internal Proxy Error: ${error.message}`,
      stack: error.stack
    });
  }
});

module.exports = router;

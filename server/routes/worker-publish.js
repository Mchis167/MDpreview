const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const ImageProcessor = require('../utils/image-processor');

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

/**
 * POST /api/worker-publish-asset
 * Processes a local asset (compress/convert) and uploads it to the Worker's R2.
 */
router.post('/worker-publish-asset', async (req, res) => {
  try {
    const { assetName, slug, workerUrl, secret, base64Data, mimeType } = req.body;
    const watchDir = req.watchDir;

    if (!base64Data && !watchDir) return res.status(400).json({ error: 'Workspace not active and no data provided' });
    if (!assetName || !slug || !workerUrl || !secret) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let processedBuffer;
    let targetName = assetName;

    // 1. Nếu có dữ liệu từ Frontend gửi lên (đã nén), dùng luôn
    if (base64Data) {
      processedBuffer = Buffer.from(base64Data, 'base64');
      // Nếu là ảnh và đã đổi định dạng ở frontend
      if (mimeType === 'image/webp' && !assetName.toLowerCase().endsWith('.webp')) {
        targetName = assetName.substring(0, assetName.lastIndexOf('.')) + '.webp';
      } else if (mimeType === 'image/jpeg' && !assetName.toLowerCase().endsWith('.jpg')) {
        targetName = assetName.substring(0, assetName.lastIndexOf('.')) + '.jpg';
      }
    } else {
      // 2. Nếu không có dữ liệu, đọc từ disk (chế độ Electron truyền thống)
      const assetPath = path.join(watchDir, 'assets', assetName);
      if (!fs.existsSync(assetPath)) {
        return res.status(404).json({ error: `Asset not found: ${assetName}` });
      }

      const buffer = await fs.promises.readFile(assetPath);
      
      processedBuffer = buffer;
      if (ImageProcessor.isProcessable(assetName)) {
        const result = await ImageProcessor.processForPublish(buffer);
        processedBuffer = result.buffer;
        if (result.ext) {
          targetName = assetName.substring(0, assetName.lastIndexOf('.')) + '.' + result.ext;
        }
      }
    }

    // 3. Proxy tới Worker
    let uploadUrl = workerUrl;
    if (!uploadUrl.startsWith('http://') && !uploadUrl.startsWith('https://')) {
      uploadUrl = `https://${uploadUrl}`;
    }
    uploadUrl = uploadUrl.replace(/\/$/, '') + `/publish/assets?slug=${slug}&name=${encodeURIComponent(targetName)}`;

    console.log(`[Server] Uploading optimized asset: ${targetName} (${(processedBuffer.length / 1024).toFixed(1)} KB)`);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Admin-Secret': secret,
        'Content-Type': 'application/octet-stream'
      },
      body: processedBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText || 'Worker upload failed' });
    }

    const result = await response.json();
    res.json({ ...result, originalName: assetName, remoteName: targetName });

  } catch (error) {
    console.error('[Server] Asset upload proxy failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

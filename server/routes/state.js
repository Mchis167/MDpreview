const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

/**
 * GET /api/state
 * Loads the global application state (settings, open tabs, etc.)
 */
router.get('/state', (req, res) => {
  const stateFile = path.join(req.dataDir, 'app_state.json');
  try {
    if (fs.existsSync(stateFile)) {
      const data = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      return res.json(data);
    }
    return res.json({});
  } catch (err) {
    console.error('Error loading state:', err);
    res.status(500).json({ error: 'Failed to load state' });
  }
});

/**
 * POST /api/state
 * Saves the global application state
 */
router.post('/state', (req, res) => {
  const stateFile = path.join(req.dataDir, 'app_state.json');
  try {
    const state = req.body;
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving state:', err);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const store = require('../db/store');
const sheetsService = require('../services/sheetsService');

// Get all settings
router.get('/', (req, res) => {
  try {
    const settings = store.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update settings
router.put('/', (req, res) => {
  try {
    const updated = store.updateSettings(req.body);
    res.json({ success: true, data: updated, message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test Google Sheet connection
router.post('/google-sheets/test', async (req, res) => {
  try {
    const { sheetId, clientEmail, privateKey } = req.body;
    const result = await sheetsService.testConnection(sheetId, { clientEmail, privateKey });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sync / Export to Google Sheet
router.post('/google-sheets/export', async (req, res) => {
  try {
    const { sheetId, clientEmail, privateKey } = req.body;
    const result = await sheetsService.exportToSheets(sheetId, { clientEmail, privateKey });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

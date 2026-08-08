const express = require('express');
const router = express.Router();
const store = require('../db/store');

// Get summary metrics, KPI cards, charts, and recent activity
router.get('/stats', (req, res) => {
  try {
    const stats = store.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

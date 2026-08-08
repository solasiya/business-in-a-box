const express = require('express');
const router = express.Router();
const store = require('../db/store');

// Get all transactions with optional ?type=income|expense
router.get('/', (req, res) => {
  try {
    const { type } = req.query;
    const list = store.getTransactions(type);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new transaction (auto reconciles with orders)
router.post('/', (req, res) => {
  try {
    const newTx = store.createTransaction(req.body);
    res.status(201).json({ success: true, data: newTx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete transaction (reverts reconciled amounts)
router.delete('/:id', (req, res) => {
  try {
    const deleted = store.deleteTransaction(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction deleted and reconciliation adjusted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

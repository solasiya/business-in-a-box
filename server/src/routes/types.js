const express = require('express');
const router = express.Router();
const store = require('../db/store');

// Get all types
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        itemTypes: store.getItemTypes(),
        expenseTypes: store.getExpenseTypes(),
        incomeTypes: store.getIncomeTypes()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Item Types CRUD
router.post('/items', (req, res) => {
  try {
    const itemType = store.createItemType(req.body);
    res.status(201).json({ success: true, data: itemType });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/items/:id', (req, res) => {
  try {
    const updated = store.updateItemType(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Item type not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/items/:id', (req, res) => {
  try {
    const deleted = store.deleteItemType(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Item type not found' });
    res.json({ success: true, message: 'Item type deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Expense Types CRUD
router.post('/expenses', (req, res) => {
  try {
    const expType = store.createExpenseType(req.body);
    res.status(201).json({ success: true, data: expType });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/expenses/:id', (req, res) => {
  try {
    const updated = store.updateExpenseType(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Expense type not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/expenses/:id', (req, res) => {
  try {
    const deleted = store.deleteExpenseType(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Expense type not found' });
    res.json({ success: true, message: 'Expense type deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Income Types CRUD
router.post('/income', (req, res) => {
  try {
    const incType = store.createIncomeType(req.body);
    res.status(201).json({ success: true, data: incType });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/income/:id', (req, res) => {
  try {
    const updated = store.updateIncomeType(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Income type not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/income/:id', (req, res) => {
  try {
    const deleted = store.deleteIncomeType(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Income type not found' });
    res.json({ success: true, message: 'Income type deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const store = require('../db/store');

// Get all names with optional ?type=customer|vendor|employee
router.get('/', (req, res) => {
  try {
    const { type } = req.query;
    const names = store.getNames(type);
    res.json({ success: true, data: names });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single name by id
router.get('/:id', (req, res) => {
  try {
    const name = store.getNameById(req.params.id);
    if (!name) return res.status(404).json({ success: false, error: 'Contact not found' });
    res.json({ success: true, data: name });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new name record
router.post('/', (req, res) => {
  try {
    const newName = store.createName(req.body);
    res.status(201).json({ success: true, data: newName });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update name record
router.put('/:id', (req, res) => {
  try {
    const updated = store.updateName(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Contact not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete name record
router.delete('/:id', (req, res) => {
  try {
    const deleted = store.deleteName(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Contact not found' });
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const store = require('../db/store');

// Get all catalog items
router.get('/', (req, res) => {
  try {
    const items = store.getItems();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single item by id
router.get('/:id', (req, res) => {
  try {
    const item = store.getItemById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create item
router.post('/', (req, res) => {
  try {
    const newItem = store.createItem(req.body);
    res.status(201).json({ success: true, data: newItem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update item
router.put('/:id', (req, res) => {
  try {
    const updated = store.updateItem(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete item
router.delete('/:id', (req, res) => {
  try {
    const deleted = store.deleteItem(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

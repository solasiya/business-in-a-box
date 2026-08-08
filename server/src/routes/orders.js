const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { generateOrderPdf } = require('../services/pdfService');

// Get all orders with optional ?type=quote|invoice|purchase & ?status=
router.get('/', (req, res) => {
  try {
    const { type, status } = req.query;
    const orders = store.getOrders(type, status);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single order by ID
router.get('/:id', (req, res) => {
  try {
    const order = store.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new order
router.post('/', (req, res) => {
  try {
    const newOrder = store.createOrder(req.body);
    res.status(201).json({ success: true, data: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update order
router.put('/:id', (req, res) => {
  try {
    const updated = store.updateOrder(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete order
router.delete('/:id', (req, res) => {
  try {
    const deleted = store.deleteOrder(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generate and Stream PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const order = store.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const pdfBytes = await generateOrderPdf(order);
    const filename = `${order.orderNumber || 'Document'}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBytes.length);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('PDF Generation Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

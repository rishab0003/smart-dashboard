const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// TODO: Implement sales data endpoints
router.get('/', protect, (req, res) => {
  res.json({ sales: [] });
});

router.get('/:id', protect, (req, res) => {
  res.status(404).json({ error: 'Sale not found' });
});

module.exports = router;

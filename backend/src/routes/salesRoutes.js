const express = require('express');
const router = express.Router();
const { getSales, getSaleById, updateSale, deleteSale } = require('../controllers/salesController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getSales);
router.get('/:id', protect, getSaleById);
router.put('/:id', protect, updateSale);
router.delete('/:id', protect, deleteSale);

module.exports = router;

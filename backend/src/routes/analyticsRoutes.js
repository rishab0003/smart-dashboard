const express = require('express');
const {
getSummary, getSalesTrend, getByCategory, getByRegion, getTopProducts, getFields
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);  // All analytics routes require auth

router.get('/summary',     getSummary);
router.get('/trend',       getSalesTrend);
router.get('/by-category', getByCategory);
router.get('/by-region',   getByRegion);
router.get('/top-products',getTopProducts);
router.get('/fields',      getFields);

module.exports = router;
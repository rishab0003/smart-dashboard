const express = require('express');
const { predict, getMLStatus } = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');
   
const router = express.Router();
router.post('/', protect, predict);
router.get('/status', protect, getMLStatus);
   
module.exports = router;
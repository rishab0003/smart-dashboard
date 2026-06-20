const express = require('express');
const { predict, getMLStatus, trainModel } = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');
   
const router = express.Router();
router.post('/', protect, predict);
router.get('/status', protect, getMLStatus);
router.post('/train', protect, trainModel);
   
module.exports = router;
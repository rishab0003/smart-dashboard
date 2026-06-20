const mlService = require('../services/mlService');
const PredictionLog = require('../models/PredictionLog');

exports.predict = async (req, res) => {
  const startTime = Date.now();

  // Inject userId from authenticated user session
  const payload = {
    ...req.body,
    userId: req.user._id
  };

  // Call ML service
  const predictionResult = await mlService.getPrediction(payload);

  const elapsed = Date.now() - startTime;

  // Log the prediction (for analytics/audit)
  await PredictionLog.create({
    user: req.user._id,
    inputFeatures: req.body,
    predictedRevenue: predictionResult.predicted_sales,
    responseTimeMs: elapsed,
    modelVersion: predictionResult.model_version,
  });

  res.json({
    success: true,
    data: predictionResult,
    responseTimeMs: elapsed,
  });
};

exports.getMLStatus = async (req, res) => {
  const health = await mlService.checkMLHealth();
  const info = await mlService.getModelInfo(req.user._id).catch(() => null);

  res.json({
    health,
    modelInfo: info,
  });
};

exports.trainModel = async (req, res) => {
  try {
    const SalesRecord = require('../models/SalesRecord');
    const userId = req.user._id;
    const { hyperparameters } = req.body;

    const records = await SalesRecord.find({ uploadedBy: userId });
    if (records.length < 5) {
      return res.status(400).json({ error: 'At least 5 records are required to retrain the model. Please upload a CSV first.' });
    }

    // Format for python ml-service
    const trainingRecords = records.map(r => ({
      month: r.month,
      year: r.year,
      quantityordered: r.unitsSold,
      priceeach: r.unitPrice,
      productline: r.category,
      territory: r.region,
      sales: r.totalRevenue
    }));

    const trainResult = await mlService.trainModel(userId, trainingRecords, hyperparameters);

    res.json({
      success: true,
      data: trainResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
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
  const info = await mlService.getModelInfo().catch(() => null);

  res.json({
    health,
    modelInfo: info,
  });
};
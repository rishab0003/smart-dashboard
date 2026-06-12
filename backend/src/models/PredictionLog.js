  // Stores every prediction made through the dashboard
  
  const mongoose = require('mongoose');
   
  const PredictionLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    inputFeatures: {
      // The features we sent to ML model
      product: String,
      category: String,
      region: String,
      month: Number,
      year: Number,
      unitPrice: Number,
      discount: Number,
      unitsSold: Number,
    },
    predictedRevenue: { type: Number },
    confidence: { type: Number },          // model confidence score
    modelVersion: { type: String },
    responseTimeMs: { type: Number },      // how fast was the prediction?
  }, { timestamps: true });
   
  module.exports = mongoose.model('PredictionLog', PredictionLogSchema);

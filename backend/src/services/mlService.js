const axios = require('axios');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Create axios instance with default config
const mlClient = axios.create({
  baseURL: ML_URL,
  timeout: 30000, // 30 second timeout for predictions
  headers: { 'Content-Type': 'application/json' }
});

exports.getPrediction = async (inputData) => {
  try {
    const response = await mlClient.post('/predict', inputData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || error.message;
    throw new Error(`ML service error: ${message}`);
  }
};

exports.checkMLHealth = async () => {
  try {
    const response = await mlClient.get('/health');
    return response.data;
  } catch {
    return { status: 'unhealthy', model_loaded: false };
  }
};

exports.getModelInfo = async (userId) => {
  const params = userId ? { params: { userId } } : {};
  const response = await mlClient.get('/model-info', params);
  return response.data;
};

exports.trainModel = async (userId, records, hyperparameters = {}) => {
  try {
    const response = await mlClient.post('/train', { userId, records, hyperparameters });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || error.message;
    throw new Error(`ML train error: ${message}`);
  }
};
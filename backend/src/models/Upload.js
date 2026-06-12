  // Tracks every CSV file uploaded by users
  
  const mongoose = require('mongoose');
  const UploadSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    size: { type: Number },            // file size in bytes
    recordCount: { type: Number },     // how many rows were imported
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing'
    },
    errors: [{ row: Number, message: String }],  // any row-level errors
    batchId: { type: String, required: true }    // links to SalesRecord.batchId
  }, { timestamps: true });
   
  module.exports = mongoose.model('Upload', UploadSchema);


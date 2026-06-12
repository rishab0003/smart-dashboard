 // backend/src/models/SalesRecord.js
  const mongoose = require('mongoose');
   
  const SalesRecordSchema = new mongoose.Schema({
    // Reference to which user uploaded this data
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,  // MongoDB document ID
      ref: 'User',                            // refers to User collection
      required: true
    },
   
    // Core sales data fields
    date: { type: Date, required: true },
    product: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    salesperson: { type: String, trim: true },
   
    // Numerical metrics
    unitsSold: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalRevenue: { type: Number, required: true, min: 0 },
    profit: { type: Number, default: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },  // percentage
    cost: { type: Number, default: 0, min: 0 },
   
    // Derived fields (calculated from other fields)
    month: { type: Number },    // 1-12
    year: { type: Number },
    quarter: { type: String },  // Q1, Q2, Q3, Q4
   
    // Metadata
    batchId: { type: String },   // groups records from same upload
    isOutlier: { type: Boolean, default: false }
   
  }, { timestamps: true });
   
  // INDEX: Makes queries on these fields much faster
  // Without indexes, MongoDB scans every document (slow!)
  SalesRecordSchema.index({ date: 1 });
  SalesRecordSchema.index({ category: 1, region: 1 });
  SalesRecordSchema.index({ uploadedBy: 1, date: -1 });
  SalesRecordSchema.index({ year: 1, month: 1 });
   
  // PRE-SAVE: Auto-calculate derived fields
  SalesRecordSchema.pre('save', function(next) {
    if (this.date) {
      const d = new Date(this.date);
      this.month = d.getMonth() + 1;
      this.year = d.getFullYear();
      const q = Math.ceil(this.month / 3);
      this.quarter = 'Q' + q;
    }
    next();
  });
   
  module.exports = mongoose.model('SalesRecord', SalesRecordSchema);


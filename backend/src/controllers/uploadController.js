// backend/src/controllers/uploadController.js
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // npm install uuid
const SalesRecord = require('../models/SalesRecord');
const Upload = require('../models/Upload');

// ── MULTER CONFIGURATION ─────────────────────────────────
// Multer handles multipart/form-data (file uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true); // accept file
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ── PROCESS UPLOADED CSV ─────────────────────────────────
exports.processCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const batchId = uuidv4(); // unique ID for this upload batch
  const filePath = req.file.path;
  const overwrite = req.query.overwrite === 'true'; // parse query param

  // Create upload record (tracking)
  const uploadRecord = await Upload.create({
    user: req.user._id,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    batchId,
    status: 'processing'
  });

  // Return immediately — processing happens in background
  res.json({
    success: true,
    message: 'File uploaded and processing started',
    uploadId: uploadRecord._id,
    batchId
  });

  // Process CSV in background (don't await — fire and forget)
  processCSVBackground(filePath, req.user._id, batchId, uploadRecord._id, overwrite);
};

async function processCSVBackground(filePath, userId, batchId, uploadId, overwrite) {
  const records = [];
  const errors = [];
  let rowIndex = 0;
  let headerMapping = null;

  return new Promise((resolve) => {
    fs.createReadStream(filePath)
      .pipe(csv()) // parse CSV into objects
      .on('data', (row) => {
        rowIndex++;

        if (rowIndex === 1) {
          headerMapping = detectHeaderMapping(row);
        }

        const cleaned = validateAndCleanRow(row, rowIndex, headerMapping);

        if (cleaned.error) {
          errors.push({ row: rowIndex, message: cleaned.error });
        } else {
          records.push({ ...cleaned.data, uploadedBy: userId, batchId });
        }
      })
      .on('end', async () => {
        try {
          // If overwrite is selected, clear out user's previous records first
          if (overwrite) {
            await SalesRecord.deleteMany({ uploadedBy: userId });
          }

          // Batch insert all valid records
          if (records.length > 0) {
            await SalesRecord.insertMany(records, { ordered: false });
          }

          // Update upload status
          await Upload.findByIdAndUpdate(uploadId, {
            status: 'completed',
            recordCount: records.length,
            errors: errors.slice(0, 50) // save first 50 errors
          });

          console.log(`✅ CSV processed: ${records.length} records, ${errors.length} errors`);

          // Trigger ML retraining if we have enough records
          if (records.length >= 5) {
            console.log(`🧠 Triggering ML model retraining for user ${userId}...`);
            const mlService = require('../services/mlService');

            // Format records for Python ML training
            const trainingRecords = records.map(r => ({
              month: r.month,
              year: r.year,
              quantityordered: r.unitsSold,
              priceeach: r.unitPrice,
              productline: r.category,
              territory: r.region,
              sales: r.totalRevenue
            }));

            mlService.trainModel(userId, trainingRecords)
              .then(() => console.log(`✅ ML model trained successfully for user ${userId}`))
              .catch(err => console.error(`❌ ML model training failed for user ${userId}:`, err.message));
          }

        } catch (err) {
          await Upload.findByIdAndUpdate(uploadId, { status: 'failed' });
          console.error('CSV processing failed:', err);
        }

        // Clean up temp file
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (unlinkErr) {
          console.error('Error deleting temp file:', unlinkErr);
        }
        resolve();
      });
  });
}

function parseDate(dateStr) {
  if (!dateStr) return new Date(NaN);
  
  dateStr = String(dateStr).trim();
  
  // Try standard JS Date parsing first
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Try parsing DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed month
    const year = parseInt(dmyMatch[3], 10);
    const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
    const minute = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const second = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
    
    date = new Date(year, month, day, hour, minute, second);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return new Date(NaN);
}

function detectHeaderMapping(row) {
  const keys = Object.keys(row);
  const mapping = {
    dateKey: null,
    productKey: null,
    categoryKey: null,
    regionKey: null,
    salespersonKey: null,
    unitsSoldKey: null,
    unitPriceKey: null,
    totalRevenueKey: null,
    profitKey: null,
    discountKey: null
  };

  const regexes = {
    date: /^(order_?date|date|latest_?launch|launch_?date|created_?at|timestamp|transaction_?date|time|date_?id)$/i,
    product: /^(product_?code|product|model|item|product_?name|code)$/i,
    category: /^(product_?line|category|product_?category|vehicle_?type|type|class|genre|group)$/i,
    region: /^(territory|region|manufacturer|brand|country|state|city|location|area|zone)$/i,
    salesperson: /^(contact_?last_?name|contact_?name|sales_?person|representative|rep|agent|seller)$/i,
    unitsSold: /^(quantity_?ordered|quantity|qty|units_?sold|sales_?volume|volume|count|units)$/i,
    unitPrice: /^(price_?each|unit_?price|price_?in_thousands|price|rate)$/i,
    totalRevenue: /^(sales|revenue|total_?revenue|amount|sales_?amount|total_?sales|total_?price|total_?amount)$/i,
    profit: /^(profit|margin|earnings|gain)$/i,
    discount: /^(discount|reduction|rebate|promo)$/i
  };

  keys.forEach(key => {
    const k = key.trim().toLowerCase();
    for (const [field, regex] of Object.entries(regexes)) {
      if (regex.test(k)) {
        if (!mapping[field + 'Key']) {
          mapping[field + 'Key'] = key;
        }
      }
    }
  });

  // Fallbacks for special datasets (like Car_sales.csv)
  if (!mapping.unitsSoldKey) {
    const fallbackQtyKey = keys.find(k => /sales_?in_?thousands|sales_?in_?thousand/i.test(k));
    if (fallbackQtyKey) {
      mapping.unitsSoldKey = fallbackQtyKey;
    }
  }

  if (!mapping.totalRevenueKey) {
    const fallbackRevKey = keys.find(k => {
      const isAlreadyMapped = (k === mapping.unitsSoldKey || k === mapping.unitPriceKey);
      return !isAlreadyMapped && /sales|revenue|amount/i.test(k);
    });
    if (fallbackRevKey) {
      mapping.totalRevenueKey = fallbackRevKey;
    }
  }

  return mapping;
}

function validateAndCleanRow(row, rowIndex, headerMapping) {
  if (!headerMapping) {
    headerMapping = detectHeaderMapping(row);
  }

  // Extract date
  const dateStr = headerMapping.dateKey ? row[headerMapping.dateKey] : null;
  let date = parseDate(dateStr);
  if (!date || isNaN(date.getTime())) {
    // If no date column is present in the dataset at all, default to current date
    if (!headerMapping.dateKey) {
      date = new Date();
    } else {
      return { error: `Invalid date: "${dateStr || ''}"` };
    }
  }

  // Extract units sold (quantity)
  let unitsSold = 1;
  if (headerMapping.unitsSoldKey) {
    let valStr = String(row[headerMapping.unitsSoldKey] || '').replace(/,/g, '').trim();
    let val = parseFloat(valStr);
    if (!isNaN(val)) {
      if (/in_?thousands|in_?thousand/i.test(headerMapping.unitsSoldKey)) {
        val = val * 1000;
      }
      unitsSold = val;
    }
  }

  // Extract unit price
  let unitPrice = 0;
  if (headerMapping.unitPriceKey) {
    let valStr = String(row[headerMapping.unitPriceKey] || '').replace(/[\$\s]/g, '').replace(/,/g, '').trim();
    let val = parseFloat(valStr);
    if (!isNaN(val)) {
      if (/in_?thousands|in_?thousand/i.test(headerMapping.unitPriceKey)) {
        val = val * 1000;
      }
      unitPrice = val;
    }
  }

  // Extract total revenue
  let totalRevenue = 0;
  if (headerMapping.totalRevenueKey) {
    let valStr = String(row[headerMapping.totalRevenueKey] || '').replace(/[\$\s]/g, '').replace(/,/g, '').trim();
    let val = parseFloat(valStr);
    if (!isNaN(val)) {
      if (/in_?thousands|in_?thousand/i.test(headerMapping.totalRevenueKey)) {
        val = val * 1000;
      }
      totalRevenue = val;
    }
  }

  // Handle derived calculations if one is missing
  if (unitsSold > 0 && unitPrice === 0 && totalRevenue > 0) {
    unitPrice = totalRevenue / unitsSold;
  }
  if (totalRevenue === 0 && unitsSold > 0 && unitPrice > 0) {
    totalRevenue = unitsSold * unitPrice;
  }

  // Fallbacks for invalid sales
  if (isNaN(totalRevenue) || totalRevenue < 0) {
    return { error: `Invalid sales/revenue amount (calculated: ${totalRevenue})` };
  }

  // Categorical values
  const product = (headerMapping.productKey ? String(row[headerMapping.productKey]) : 'UNKNOWN').trim().toUpperCase();
  const category = (headerMapping.categoryKey ? String(row[headerMapping.categoryKey]) : 'UNKNOWN').trim().toUpperCase();
  const region = (headerMapping.regionKey ? String(row[headerMapping.regionKey]) : 'UNKNOWN').trim().toUpperCase();
  const salesperson = (headerMapping.salespersonKey ? String(row[headerMapping.salespersonKey]) : '').trim();

  // Profit & Discount
  let profit = 0;
  if (headerMapping.profitKey) {
    let valStr = String(row[headerMapping.profitKey] || '').replace(/[\$\s]/g, '').replace(/,/g, '').trim();
    let val = parseFloat(valStr);
    if (!isNaN(val)) profit = val;
  }

  let discount = 0;
  if (headerMapping.discountKey) {
    let valStr = String(row[headerMapping.discountKey] || '').replace(/%/g, '').trim();
    let val = parseFloat(valStr);
    if (!isNaN(val)) discount = val;
  }

  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const quarter = 'Q' + Math.ceil(month / 3);

  return {
    data: {
      date,
      product: product || 'UNKNOWN',
      category: category || 'UNKNOWN',
      region: region || 'UNKNOWN',
      salesperson,
      unitsSold: Math.round(unitsSold),
      unitPrice,
      totalRevenue,
      profit,
      discount,
      month,
      year,
      quarter
    }
  };
}

exports.getUploadHistory = async (req, res) => {
  const uploads = await Upload.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    success: true,
    data: uploads
  });
};

exports.getUploadStatus = async (req, res) => {
  const upload = await Upload.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!upload) {
    return res.status(404).json({ error: 'Upload not found' });
  }

  res.json({
    success: true,
    data: upload
  });
};
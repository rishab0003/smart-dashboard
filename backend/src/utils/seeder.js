const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const User = require('../models/User');
const SalesRecord = require('../models/SalesRecord');
const Upload = require('../models/Upload');
const mlService = require('../services/mlService');

async function seedDemoData() {
  try {
    const demoEmail = 'test@example.com';
    const demoPassword = 'password123';

    // 1. Check if demo user exists
    let demoUser = await User.findOne({ email: demoEmail });
    if (!demoUser) {
      console.log('🌱 Seeding: Creating demo user (test@example.com)...');
      demoUser = await User.create({
        name: 'Demo User',
        email: demoEmail,
        password: demoPassword // password is automatically hashed by the pre-save hook
      });
      console.log('🌱 Seeding: Demo user created successfully!');
    }

    // 2. Self-healing check: Seed if records count is not exactly 500
    const recordCount = await SalesRecord.countDocuments({ uploadedBy: demoUser._id });
    if (recordCount === 500) {
      console.log(`🌱 Seeding: Demo user already has exactly 500 sales records. Skipping seed.`);
      return;
    }

    console.log(`🌱 Seeding: Demo user has ${recordCount} sales records (expected 500). Purging old data and seeding fresh...`);
    await SalesRecord.deleteMany({ uploadedBy: demoUser._id });
    await Upload.deleteMany({ user: demoUser._id });

    // 3. Locate the CSV seed file
    const csvPath = path.join(__dirname, '../../data/sales_test_dataset.csv');
    if (!fs.existsSync(csvPath)) {
      console.error(`🌱 Seeding Error: Seed file not found at ${csvPath}`);
      return;
    }

    console.log(`🌱 Seeding: Reading sales data from ${csvPath}...`);
    const records = [];
    const batchId = 'demo-seed-batch-id';

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        const date = new Date(row.orderdate);
        const unitsSold = parseInt(row.quantityordered, 10);
        const unitPrice = parseFloat(row.priceeach);
        const totalRevenue = parseFloat(row.sales);
        const profit = parseFloat(row.profit);
        const discount = parseFloat(row.discount);

        records.push({
          uploadedBy: demoUser._id,
          batchId,
          date,
          product: String(row.product).toUpperCase(),
          category: String(row.productline).toUpperCase(),
          region: String(row.territory).toUpperCase(),
          salesperson: row.salesperson,
          unitsSold,
          unitPrice,
          totalRevenue,
          profit,
          discount,
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          quarter: 'Q' + Math.ceil((date.getMonth() + 1) / 3)
        });
      })
      .on('end', async () => {
        try {
          if (records.length === 0) {
            console.log('🌱 Seeding: No records found in CSV file.');
            return;
          }

          console.log(`🌱 Seeding: Inserting ${records.length} sales records...`);
          await SalesRecord.insertMany(records);

          // Create upload entry in Upload collection
          await Upload.create({
            user: demoUser._id,
            filename: 'sales_test_dataset.csv',
            originalName: 'sales_test_dataset.csv',
            size: fs.statSync(csvPath).size,
            batchId,
            status: 'completed',
            recordCount: records.length,
            errors: []
          });

          console.log('🌱 Seeding: Triggering ML retraining for demo user...');
          const trainingRecords = records.map(r => ({
            month: r.month,
            year: r.year,
            quantityordered: r.unitsSold,
            priceeach: r.unitPrice,
            productline: r.category,
            territory: r.region,
            sales: r.totalRevenue
          }));

          await mlService.trainModel(demoUser._id, trainingRecords);
          console.log('🌱 Seeding: Demo user seed process completed successfully!');
        } catch (err) {
          console.error('🌱 Seeding Error during insertion/training:', err);
        }
      });

  } catch (error) {
    console.error('🌱 Seeding Error:', error);
  }
}

module.exports = seedDemoData;

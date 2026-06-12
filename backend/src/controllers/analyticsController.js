const SalesRecord = require('../models/SalesRecord');

// @route   GET /api/analytics/summary
// @desc    Dashboard KPIs: total revenue, orders, avg order value
exports.getSummary = async (req, res) => {
  const { startDate, endDate } = req.query;

  const matchStage = { uploadedBy: req.user._id };

  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  const [result] = await SalesRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null, // group ALL records together
        totalRevenue: { $sum: '$totalRevenue' },
        totalOrders: { $count: {} },
        totalUnits: { $sum: '$unitsSold' },
        avgOrderValue: { $avg: '$totalRevenue' },
        totalProfit: { $sum: '$profit' },
        avgDiscount: { $avg: '$discount' }
      }
    }
  ]);

  res.json({
    success: true,
    data:
      result || {
        totalRevenue: 0,
        totalOrders: 0,
        totalUnits: 0,
        avgOrderValue: 0,
        totalProfit: 0,
        avgDiscount: 0
      }
  });
};

// @route   GET /api/analytics/sales-trend
// @desc    Monthly sales trend for line chart
exports.getSalesTrend = async (req, res) => {
  const { year } = req.query;
  let targetYear = parseInt(year);

  if (isNaN(targetYear)) {
    // Find the latest year in the dataset for this user
    const latestRecord = await SalesRecord.findOne({ uploadedBy: req.user._id })
      .sort({ year: -1 })
      .select('year');
    if (latestRecord && latestRecord.year) {
      targetYear = latestRecord.year;
    } else {
      targetYear = new Date().getFullYear();
    }
  }

  const trend = await SalesRecord.aggregate([
    {
      $match: {
        uploadedBy: req.user._id,
        year: targetYear
      }
    },
    {
      // Group by year + month
      $group: {
        _id: { year: '$year', month: '$month' },
        revenue: { $sum: '$totalRevenue' },
        orders: { $count: {} },
        units: { $sum: '$unitsSold' },
        avgRevenue: { $avg: '$totalRevenue' }
      }
    },
    {
      // Sort chronologically
      $sort: { '_id.year': 1, '_id.month': 1 }
    },
    {
      // Reshape output
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        revenue: { $round: ['$revenue', 2] },
        orders: 1,
        units: 1,
        avgRevenue: { $round: ['$avgRevenue', 2] },
        label: {
          $concat: [
            {
              $arrayElemAt: [
                ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                '$_id.month'
              ]
            },
            ' ',
            { $toString: '$_id.year' }
          ]
        }
      }
    }
  ]);

  res.json({ success: true, data: trend });
};

// @route   GET /api/analytics/by-category
// @desc    Revenue breakdown by product category (pie chart)
exports.getByCategory = async (req, res) => {
  const breakdown = await SalesRecord.aggregate([
    { $match: { uploadedBy: req.user._id } },
    {
      $group: {
        _id: '$category',
        revenue: { $sum: '$totalRevenue' },
        orders: { $count: {} },
        units: { $sum: '$unitsSold' },
        avgRevenue: { $avg: '$totalRevenue' }
      }
    },
    { $sort: { revenue: -1 } },
    {
      $project: {
        _id: 0,
        category: '$_id',
        revenue: { $round: ['$revenue', 2] },
        orders: 1,
        units: 1,
        avgRevenue: { $round: ['$avgRevenue', 2] }
      }
    }
  ]);

  // Calculate percentage of total for pie chart
  const totalRevenue = breakdown.reduce((sum, d) => sum + d.revenue, 0);

  const withPct = breakdown.map((d) => ({
    ...d,
    percentage:
      totalRevenue > 0
        ? Math.round((d.revenue / totalRevenue) * 100 * 10) / 10
        : 0
  }));

  res.json({ success: true, data: withPct });
};

// @route   GET /api/analytics/by-region
// @desc    Revenue breakdown by region (bar chart)
exports.getByRegion = async (req, res) => {
  const breakdown = await SalesRecord.aggregate([
    { $match: { uploadedBy: req.user._id } },
    {
      $group: {
        _id: '$region',
        revenue: { $sum: '$totalRevenue' },
        orders: { $count: {} },
        growth: { $avg: '$totalRevenue' }
      }
    },
    { $sort: { revenue: -1 } },
    {
      $project: {
        _id: 0,
        region: '$_id',
        revenue: { $round: ['$revenue', 2] },
        orders: 1
      }
    }
  ]);

  res.json({ success: true, data: breakdown });
};

// @route   GET /api/analytics/top-products
// @desc    Top 10 products by revenue
exports.getTopProducts = async (req, res) => {
  const products = await SalesRecord.aggregate([
    { $match: { uploadedBy: req.user._id } },
    {
      $group: {
        _id: '$product',
        revenue: { $sum: '$totalRevenue' },
        units: { $sum: '$unitsSold' },
        orders: { $count: {} },
        avgPrice: { $avg: '$unitPrice' },
        category: { $first: '$category' }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        product: '$_id',
        revenue: { $round: ['$revenue', 2] },
        units: 1,
        orders: 1,
        category: 1,
        avgPrice: { $round: ['$avgPrice', 2] }
      }
    }
  ]);

  res.json({ success: true, data: products });
};

// @route   GET /api/analytics/fields
// @desc    Get unique product categories, regions, and years for dropdowns
exports.getFields = async (req, res) => {
  try {
    const categories = await SalesRecord.distinct('category', { uploadedBy: req.user._id });
    const regions = await SalesRecord.distinct('region', { uploadedBy: req.user._id });
    const years = await SalesRecord.distinct('year', { uploadedBy: req.user._id });

    res.json({
      success: true,
      data: {
        categories: categories.map(c => c.toUpperCase()).sort(),
        regions: regions.map(r => r.toUpperCase()).sort(),
        years: years.sort((a, b) => b - a) // sort descending
      }
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};
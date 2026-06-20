const SalesRecord = require('../models/SalesRecord');

exports.getSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter = { uploadedBy: req.user._id };

    if (search) {
      filter.$or = [
        { product: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { region: { $regex: search, $options: 'i' } },
        { salesperson: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await SalesRecord.countDocuments(filter);
    const sales = await SalesRecord.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: sales,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const sale = await SalesRecord.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!sale) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSale = async (req, res) => {
  try {
    const sale = await SalesRecord.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!sale) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const fields = ['product', 'category', 'region', 'salesperson', 'unitsSold', 'unitPrice', 'profit', 'discount', 'date'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        sale[f] = req.body[f];
      }
    });

    // Re-calculate derived fields
    if (sale.unitsSold !== undefined && sale.unitPrice !== undefined) {
      sale.totalRevenue = sale.unitsSold * sale.unitPrice;
    }

    await sale.save();

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSale = async (req, res) => {
  try {
    const result = await SalesRecord.findOneAndDelete({ _id: req.params.id, uploadedBy: req.user._id });
    if (!result) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

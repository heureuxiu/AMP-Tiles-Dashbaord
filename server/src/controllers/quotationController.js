const Quotation = require('../models/Quotation');
const Product = require('../models/Product');

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
exports.getQuotations = async (req, res) => {
  try {
    const { search, status, startDate, endDate, sortBy = '-createdAt' } = req.query;
    
    // Build query
    const query = {};
    
    // Search by quotation number or customer name
    if (search) {
      query.$or = [
        { quotationNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.quotationDate = {};
      if (startDate) {
        query.quotationDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.quotationDate.$lte = new Date(endDate);
      }
    }
    
    const quotations = await Quotation.find(query)
      .populate('createdBy', 'name email')
      .populate('items.product', 'name sku')
      .sort(sortBy);

    // Calculate statistics
    const stats = {
      total: quotations.length,
      draft: quotations.filter(q => q.status === 'draft').length,
      sent: quotations.filter(q => q.status === 'sent').length,
      converted: quotations.filter(q => q.status === 'converted').length,
      expired: quotations.filter(q => q.status === 'expired').length,
      cancelled: quotations.filter(q => q.status === 'cancelled').length,
      totalValue: quotations.reduce((sum, q) => sum + q.grandTotal, 0),
    };

    res.status(200).json({
      success: true,
      count: quotations.length,
      stats,
      quotations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
exports.getQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('items.product', 'name sku image price unit')
      .populate('invoiceId', 'invoiceNumber');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found',
      });
    }

    res.status(200).json({
      success: true,
      quotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new quotation
// @route   POST /api/quotations
// @access  Private
exports.createQuotation = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      quotationDate,
      validUntil,
      items,
      discount,
      discountType,
      taxRate,
      notes,
      terms,
      status,
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one item',
      });
    }

    // Validate and populate items
    const populatedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      const lineTotal = item.quantity * item.rate;
      populatedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        rate: item.rate,
        lineTotal,
      });
    }

    // Calculate totals
    const subtotal = populatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    
    let discountAmount = 0;
    if (discount && discount > 0) {
      if (discountType === 'percentage') {
        discountAmount = (subtotal * discount) / 100;
      } else {
        discountAmount = discount;
      }
    }

    const afterDiscount = subtotal - discountAmount;
    const tax = (afterDiscount * (taxRate || 10)) / 100;
    const grandTotal = afterDiscount + tax;

    // Create quotation
    const quotation = await Quotation.create({
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      quotationDate: quotationDate || Date.now(),
      validUntil,
      items: populatedItems,
      subtotal,
      discount: discountAmount,
      discountType: discountType || 'fixed',
      tax,
      taxRate: taxRate || 10,
      grandTotal,
      notes,
      terms,
      status: status || 'draft',
      createdBy: req.user.id,
    });

    // Populate references
    await quotation.populate('createdBy', 'name email');
    await quotation.populate('items.product', 'name sku');

    res.status(201).json({
      success: true,
      quotation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private
exports.updateQuotation = async (req, res) => {
  try {
    let quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found',
      });
    }

    // Check if already converted
    if (quotation.status === 'converted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update converted quotation',
      });
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      quotationDate,
      validUntil,
      items,
      discount,
      discountType,
      taxRate,
      notes,
      terms,
      status,
    } = req.body;

    // If items are being updated, recalculate totals
    if (items && items.length > 0) {
      const populatedItems = [];
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product not found: ${item.product}`,
          });
        }

        const lineTotal = item.quantity * item.rate;
        populatedItems.push({
          product: product._id,
          productName: product.name,
          quantity: item.quantity,
          rate: item.rate,
          lineTotal,
        });
      }

      const subtotal = populatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
      
      let discountAmount = 0;
      if (discount && discount > 0) {
        if (discountType === 'percentage') {
          discountAmount = (subtotal * discount) / 100;
        } else {
          discountAmount = discount;
        }
      }

      const afterDiscount = subtotal - discountAmount;
      const tax = (afterDiscount * (taxRate || quotation.taxRate)) / 100;
      const grandTotal = afterDiscount + tax;

      quotation.items = populatedItems;
      quotation.subtotal = subtotal;
      quotation.discount = discountAmount;
      quotation.discountType = discountType || quotation.discountType;
      quotation.tax = tax;
      quotation.taxRate = taxRate || quotation.taxRate;
      quotation.grandTotal = grandTotal;
    }

    // Update other fields
    if (customerName) quotation.customerName = customerName;
    if (customerPhone !== undefined) quotation.customerPhone = customerPhone;
    if (customerEmail !== undefined) quotation.customerEmail = customerEmail;
    if (customerAddress !== undefined) quotation.customerAddress = customerAddress;
    if (quotationDate) quotation.quotationDate = quotationDate;
    if (validUntil !== undefined) quotation.validUntil = validUntil;
    if (notes !== undefined) quotation.notes = notes;
    if (terms !== undefined) quotation.terms = terms;
    if (status) quotation.status = status;

    await quotation.save();

    // Populate references
    await quotation.populate('createdBy', 'name email');
    await quotation.populate('items.product', 'name sku');

    res.status(200).json({
      success: true,
      quotation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private
exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found',
      });
    }

    // Check if converted
    if (quotation.status === 'converted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete converted quotation',
      });
    }

    await quotation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Quotation deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Convert quotation to invoice
// @route   POST /api/quotations/:id/convert
// @access  Private
exports.convertToInvoice = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found',
      });
    }

    if (quotation.status === 'converted') {
      return res.status(400).json({
        success: false,
        message: 'Quotation already converted to invoice',
      });
    }

    // TODO: Create Invoice (when Invoice model is ready)
    // For now, just mark as converted
    quotation.status = 'converted';
    quotation.convertedToInvoice = true;
    await quotation.save();

    res.status(200).json({
      success: true,
      message: 'Quotation converted to invoice successfully',
      quotation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get quotation statistics
// @route   GET /api/quotations/stats/summary
// @access  Private
exports.getQuotationStats = async (req, res) => {
  try {
    const totalQuotations = await Quotation.countDocuments();
    
    const stats = await Quotation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$grandTotal' },
        },
      },
    ]);

    const statusStats = {
      draft: { count: 0, totalValue: 0 },
      sent: { count: 0, totalValue: 0 },
      converted: { count: 0, totalValue: 0 },
      expired: { count: 0, totalValue: 0 },
      cancelled: { count: 0, totalValue: 0 },
    };

    stats.forEach((stat) => {
      if (statusStats[stat._id]) {
        statusStats[stat._id] = {
          count: stat.count,
          totalValue: stat.totalValue,
        };
      }
    });

    const totalValue = stats.reduce((sum, stat) => sum + stat.totalValue, 0);

    res.status(200).json({
      success: true,
      stats: {
        total: totalQuotations,
        totalValue,
        byStatus: statusStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

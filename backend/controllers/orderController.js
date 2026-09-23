const Order = require('../models/Order');
const Product = require('../models/Product');

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
};

exports.createOrder = async (req, res) => {
  try {
    const { customerName, items } = req.body;
    const normalizedCustomerName = typeof customerName === 'string' ? customerName.trim() : '';

    if (!normalizedCustomerName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Customer name and items required' });
    }

    const normalizedItems = items.map((item) => ({
      productId: String(item.productId || '').trim(),
      quantity: Number(item.quantity)
    }));

    const invalidItem = normalizedItems.find((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1);
    if (invalidItem) {
      return res.status(400).json({ message: 'Each order item requires a valid product and quantity >= 1' });
    }

    const mergedItemsMap = new Map();
    normalizedItems.forEach((item) => {
      mergedItemsMap.set(item.productId, (mergedItemsMap.get(item.productId) || 0) + item.quantity);
    });

    const productIds = [...mergedItemsMap.keys()];
    const products = await Product.find({ _id: { $in: productIds }, isActive: true });
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    if (products.length !== productIds.length) {
      return res.status(400).json({ message: 'One or more selected products are inactive or do not exist' });
    }

    let totalAmount = 0;
    const processedItems = productIds.map((productId) => {
      const product = productMap.get(productId);
      const quantity = mergedItemsMap.get(productId);
      totalAmount += product.price * quantity;
      return {
        productId: product._id,
        productName: product.name,
        price: product.price,
        quantity
      };
    });

    const order = new Order({
      customerName: normalizedCustomerName,
      items: processedItems,
      totalAmount
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 100);
    const search = (req.query.search || '').trim();
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.customerName = { $regex: search, $options: 'i' };
    }

    if ((dateFrom && !Number.isNaN(dateFrom.getTime())) || (dateTo && !Number.isNaN(dateTo.getTime()))) {
      filter.orderDate = {};
      if (dateFrom && !Number.isNaN(dateFrom.getTime())) {
        filter.orderDate.$gte = dateFrom;
      }
      if (dateTo && !Number.isNaN(dateTo.getTime())) {
        const inclusiveDateTo = new Date(dateTo);
        inclusiveDateTo.setHours(23, 59, 59, 999);
        filter.orderDate.$lte = inclusiveDateTo;
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ orderDate: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter)
    ]);

    res.json({
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

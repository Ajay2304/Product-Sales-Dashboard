const Product = require('../models/Product');

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
};

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const { name, sku, price } = req.body;
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedSku = typeof sku === 'string' ? sku.trim().toUpperCase() : '';
    const parsedPrice = Number(price);

    if (!normalizedName || !normalizedSku) {
      return res.status(400).json({ message: 'Name and SKU are required' });
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    const product = new Product({ name: normalizedName, sku: normalizedSku, price: parsedPrice });
    await product.save();

    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'SKU must be unique' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Get all active products
exports.getProducts = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 100);
    const search = (req.query.search || '').trim();
    const skip = (page - 1) * limit;

    const filter = { isActive: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ]);

    res.json({
      data: products,
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

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (typeof updates.name === 'string') {
      updates.name = updates.name.trim();
    }

    if (typeof updates.sku === 'string') {
      updates.sku = updates.sku.trim().toUpperCase();
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'price')) {
      updates.price = Number(updates.price);
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'price') && (!Number.isFinite(updates.price) || updates.price <= 0)) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    const product = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'SKU must be unique' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Soft delete (set isActive = false)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

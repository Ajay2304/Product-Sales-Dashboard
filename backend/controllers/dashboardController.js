const Product = require('../models/Product');
const Order = require('../models/Order');

exports.getSummary = async (req, res) => {
  try {
    const rangeDays = Number.parseInt(req.query.rangeDays, 10);
    const hasValidRange = Number.isInteger(rangeDays) && rangeDays > 0;
    const fromDate = hasValidRange ? new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000) : null;
    const orderMatch = fromDate ? { orderDate: { $gte: fromDate } } : {};

    const [totalProducts, totalOrders, revenueResult, uniqueCustomersResult, topProducts, monthlyRevenue, recentOrders] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(orderMatch),
      Order.aggregate([
        { $match: orderMatch },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: orderMatch },
        { $group: { _id: { $toLower: '$customerName' } } },
        { $count: 'count' }
      ]),
      Order.aggregate([
        { $match: orderMatch },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            productName: { $first: '$items.productName' },
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        { $sort: { totalQuantity: -1, totalRevenue: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            productId: '$_id',
            productName: 1,
            totalQuantity: 1,
            totalRevenue: { $round: ['$totalRevenue', 2] }
          }
        }
      ]),
      Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: {
              year: { $year: '$orderDate' },
              month: { $month: '$orderDate' }
            },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Order.find(orderMatch)
        .sort({ orderDate: -1 })
        .limit(5)
        .select('customerName totalAmount orderDate items')
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    const uniqueCustomers = uniqueCustomersResult.length > 0 ? uniqueCustomersResult[0].count : 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const monthlyRevenueFormatted = monthlyRevenue.map((entry) => ({
      label: `${String(entry._id.month).padStart(2, '0')}/${entry._id.year}`,
      revenue: Number(entry.revenue.toFixed(2)),
      orders: entry.orders
    }));

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      uniqueCustomers,
      topProducts,
      monthlyRevenue: monthlyRevenueFormatted,
      recentOrders,
      rangeDays: hasValidRange ? rangeDays : 'all'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

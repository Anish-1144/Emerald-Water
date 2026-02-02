const Order = require('../models/Order.model');
const Design = require('../models/Design.model');

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ order_status: 'pending_production' });
    
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => {
      if (order.payment_status === 'success') {
        return sum + order.total_price;
      }
      return sum;
    }, 0);

    res.json({
      totalOrders,
      totalRevenue,
      pendingOrders,
      supportTickets: 0 // Placeholder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('design_id')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { order_status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { order_status },
      { new: true }
    ).populate('design_id');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus
};


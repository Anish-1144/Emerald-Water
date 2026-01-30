const Order = require('../models/Order.model');
const User = require('../models/User.model');
const Design = require('../models/Design.model');

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
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
      totalUsers,
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
      .populate('user_id', 'name email phone company_name')
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
    ).populate('user_id', 'name email phone company_name')
     .populate('design_id');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user details with orders and designs
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const orders = await Order.find({ user_id: req.params.id })
      .populate('design_id')
      .sort({ createdAt: -1 });

    const designs = await Design.find({ user_id: req.params.id })
      .sort({ createdAt: -1 });

    res.json({
      user,
      orders,
      designs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  getUserDetails
};


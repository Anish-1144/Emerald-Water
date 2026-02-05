const Order = require('../models/Order.model');
const Design = require('../models/Design.model');
const jwt = require('jsonwebtoken');

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'anishmourya27@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '12345';

    // For simplicity, we'll use plain comparison. In production, use hashed passwords
    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        email: email,
        role: 'admin',
        type: 'admin_access'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        email: email,
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

// Get single order details
const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('design_id');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  adminLogin,
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  getOrderDetails
};


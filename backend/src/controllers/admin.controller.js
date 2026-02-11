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
    // Add timeouts to prevent hanging queries
    const totalOrders = await Order.countDocuments().maxTimeMS(15000);
    const pendingOrders = await Order.countDocuments({ order_status: 'pending_production' }).maxTimeMS(15000);
    
    // Use aggregation for better performance instead of fetching all orders
    const revenueResult = await Order.aggregate([
      {
        $match: { payment_status: 'success' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total_price' }
        }
      }
    ], { maxTimeMS: 15000 });
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.json({
      totalOrders,
      totalRevenue,
      pendingOrders,
      supportTickets: 0 // Placeholder
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    
    if (error.name === 'MongoNetworkTimeoutError' || error.name === 'MongoServerSelectionError') {
      return res.status(503).json({ 
        message: 'Database connection timeout. Please try again later.',
        error: 'Service Unavailable',
        retry: true
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('design_id')
      .sort({ createdAt: -1 })
      .maxTimeMS(25000) // Timeout after 25 seconds
      .limit(1000); // Limit results to prevent memory issues
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    
    if (error.name === 'MongoNetworkTimeoutError' || error.name === 'MongoServerSelectionError') {
      return res.status(503).json({ 
        message: 'Database connection timeout. Please try again later.',
        error: 'Service Unavailable',
        retry: true
      });
    }
    
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
      { new: true, maxTimeMS: 15000 }
    ).populate('design_id').maxTimeMS(15000);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    
    if (error.name === 'MongoNetworkTimeoutError' || error.name === 'MongoServerSelectionError') {
      return res.status(503).json({ 
        message: 'Database connection timeout. Please try again later.',
        error: 'Service Unavailable',
        retry: true
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

// Get single order details
const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('design_id')
      .maxTimeMS(15000);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    
    if (error.name === 'MongoNetworkTimeoutError' || error.name === 'MongoServerSelectionError') {
      return res.status(503).json({ 
        message: 'Database connection timeout. Please try again later.',
        error: 'Service Unavailable',
        retry: true
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

// Change admin password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 5) {
      return res.status(400).json({ message: 'New password must be at least 5 characters long' });
    }

    // Get current admin password from environment
    const adminPassword = process.env.ADMIN_PASSWORD || '12345';

    // Verify current password
    if (currentPassword !== adminPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update environment variable
    // Note: In production, you should store this in a database
    // For now, we'll update the .env file
    process.env.ADMIN_PASSWORD = newPassword;

    res.json({
      message: 'Password changed successfully',
      success: true
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  adminLogin,
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  getOrderDetails,
  changePassword
};


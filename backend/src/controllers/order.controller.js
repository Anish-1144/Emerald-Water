const Order = require('../models/Order.model');
const Design = require('../models/Design.model');
const User = require('../models/User.model');
const crypto = require('crypto');

// Create order
const createOrder = async (req, res) => {
  try {
    const { design_id, quantity, total_price, shipping_address } = req.body;

    // Get design
    const design = await Design.findById(design_id);
    if (!design || design.user_id.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Design not found' });
    }

    // Generate unique order ID
    const order_id = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create order
    const order = new Order({
      order_id,
      user_id: req.user._id,
      design_id,
      quantity,
      total_price,
      shipping_address,
      label_image: design.label_image,
      bottle_snapshot: design.bottle_snapshot,
      print_pdf: design.print_pdf,
      payment_status: 'success', // For now, we'll mark as success
      order_status: 'pending_production'
    });

    await order.save();

    // Populate user info for email
    const user = await User.findById(req.user._id);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user._id })
      .populate('design_id')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('design_id')
      .populate('user_id', 'name email phone company_name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order or is admin
    if (order.user_id._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, getUserOrders, getOrder };


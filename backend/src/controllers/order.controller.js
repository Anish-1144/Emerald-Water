const Order = require('../models/Order.model');
const Design = require('../models/Design.model');
const crypto = require('crypto');

// Create order
const createOrder = async (req, res) => {
  try {
    const { design_id, quantity, total_price, shipping_address } = req.body;

    // Get design
    const design = await Design.findById(design_id);
    if (!design) {
      return res.status(404).json({ message: 'Design not found' });
    }

    // Generate unique order ID
    const order_id = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create order
    const order = new Order({
      order_id,
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
    res.status(201).json(order);
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

// Get orders by authenticated email
const getOrdersByContact = async (req, res) => {
  try {
    // Get email from authenticated user (set by orderAuth middleware)
    const email = req.userEmail;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find orders by email
    const query = {
      'shipping_address.email': email.toLowerCase().trim()
    };

    const orders = await Order.find(query)
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
      .populate('design_id');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, getAllOrders, getOrder, getOrdersByContact };


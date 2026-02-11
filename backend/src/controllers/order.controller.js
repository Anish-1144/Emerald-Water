const Order = require('../models/Order.model');
const Design = require('../models/Design.model');
const { uploadDesignImages } = require('../services/s3.service');
const crypto = require('crypto');

// Create order
const createOrder = async (req, res) => {
  try {
    const { design_id, quantity, total_price, shipping_address, label_image, print_pdf, bottle_snapshot } = req.body;

    // Get design
    const design = await Design.findById(design_id).maxTimeMS(15000);
    if (!design) {
      return res.status(404).json({ message: 'Design not found' });
    }

    // Generate unique order ID
    const order_id = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Determine image sources - prefer images from request body (localStorage), fallback to design
    let finalImages = {
      label_image: label_image || design.label_image,
      print_pdf: print_pdf || design.print_pdf,
      bottle_snapshot: bottle_snapshot || design.bottle_snapshot,
    };

    // Upload images to S3 if they are base64 (from localStorage)
    // This happens when payment is confirmed
    const hasBase64Images = 
      (finalImages.label_image && finalImages.label_image.startsWith('data:')) ||
      (finalImages.print_pdf && finalImages.print_pdf.startsWith('data:')) ||
      (finalImages.bottle_snapshot && finalImages.bottle_snapshot.startsWith('data:'));

    if (hasBase64Images) {
      try {
        console.log('Uploading images to S3 for order:', order_id);
        const uploadedUrls = await uploadDesignImages({
          label_image: finalImages.label_image,
          print_pdf: finalImages.print_pdf,
          bottle_snapshot: finalImages.bottle_snapshot,
        });
        finalImages = { ...finalImages, ...uploadedUrls };
        console.log('Images uploaded to S3 successfully');
      } catch (uploadError) {
        console.error('S3 upload error during order creation:', uploadError);
        return res.status(500).json({ 
          message: 'Failed to upload images to S3', 
          error: uploadError.message 
        });
      }
    }

    // Create order with S3 URLs
    const order = new Order({
      order_id,
      design_id,
      quantity,
      total_price,
      shipping_address,
      label_image: finalImages.label_image,
      bottle_snapshot: finalImages.bottle_snapshot,
      print_pdf: finalImages.print_pdf,
      payment_status: 'success', // Payment is confirmed at this point
      order_status: 'pending_production'
    });

    await order.save();

    // Update design with S3 URLs if they were base64 before
    if (hasBase64Images) {
      try {
        await Design.findByIdAndUpdate(design_id, {
          label_image: finalImages.label_image,
          print_pdf: finalImages.print_pdf,
          bottle_snapshot: finalImages.bottle_snapshot,
        });
        console.log('Design updated with S3 URLs');
      } catch (updateError) {
        console.error('Error updating design with S3 URLs:', updateError);
        // Don't fail the order creation if design update fails
      }
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('design_id')
      .sort({ createdAt: -1 })
      .maxTimeMS(25000)
      .limit(1000);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    
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
      .sort({ createdAt: -1 })
      .maxTimeMS(25000)
      .limit(1000);
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by contact:', error);
    
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

// Get single order
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('design_id')
      .maxTimeMS(15000);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    
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

module.exports = { createOrder, getAllOrders, getOrder, getOrdersByContact };


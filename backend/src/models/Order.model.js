const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_id: {
    type: String,
    unique: true,
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  design_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Design',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 100
  },
  total_price: {
    type: Number,
    required: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  order_status: {
    type: String,
    enum: ['pending_production', 'printing', 'packed', 'shipped', 'cancelled'],
    default: 'pending_production'
  },
  shipping_address: {
    company_name: String,
    full_name: String,
    email: String,
    phone: String,
    address1: String,
    address2: String,
    zip: String,
    country: String,
    city: String
  },
  label_image: {
    type: String,
    required: true
  },
  bottle_snapshot: {
    type: String,
    required: true
  },
  print_pdf: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);


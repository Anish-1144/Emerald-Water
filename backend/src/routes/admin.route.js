const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth.middleware');
const {
  adminLogin,
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  getOrderDetails
} = require('../controllers/admin.controller');

// Public route - admin login
router.post('/login', adminLogin);

// Protected routes - require admin authentication
router.get('/dashboard', adminAuth, getDashboardStats);
router.get('/orders', adminAuth, getAllOrders);
router.get('/orders/:id', adminAuth, getOrderDetails);
router.put('/orders/:id/status', adminAuth, updateOrderStatus);

module.exports = router;


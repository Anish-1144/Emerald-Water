const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth.middleware');
const {
  adminLogin,
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  getOrderDetails,
  changePassword
} = require('../controllers/admin.controller');

// Public route - admin login
router.post('/login', adminLogin);

// Protected routes - require admin authentication
router.get('/dashboard', adminAuth, getDashboardStats);
router.get('/orders', adminAuth, getAllOrders);
router.get('/orders/:id', adminAuth, getOrderDetails);
router.put('/orders/:id/status', adminAuth, updateOrderStatus);
router.put('/change-password', adminAuth, changePassword);

module.exports = router;


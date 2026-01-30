const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  getUserDetails
} = require('../controllers/admin.controller');
const { adminAuth } = require('../middleware/auth.middleware');

router.get('/dashboard', adminAuth, getDashboardStats);
router.get('/orders', adminAuth, getAllOrders);
router.put('/orders/:id/status', adminAuth, updateOrderStatus);
router.get('/users', adminAuth, getAllUsers);
router.get('/users/:id', adminAuth, getUserDetails);

module.exports = router;


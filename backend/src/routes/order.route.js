const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders, getOrder } = require('../controllers/order.controller');
const { auth } = require('../middleware/auth.middleware');

router.post('/', auth, createOrder);
router.get('/', auth, getUserOrders);
router.get('/:id', auth, getOrder);

module.exports = router;


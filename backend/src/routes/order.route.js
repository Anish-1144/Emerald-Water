const express = require('express');
const router = express.Router();
const { createOrder, getAllOrders, getOrder, getOrdersByContact } = require('../controllers/order.controller');
const orderAuth = require('../middleware/orderAuth.middleware');

router.post('/', createOrder);
router.get('/search', orderAuth, getOrdersByContact); // Protected route - requires JWT
router.get('/', getAllOrders);
router.get('/:id', getOrder);

module.exports = router;


const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');

// Validation schemas
const createOrderSchema = {
  body: {
    products: { type: 'array', required: true, min: 1 },
    shippingAddress: { type: 'object', required: true }
  }
};

const updateOrderStatusSchema = {
  body: {
    status: {
      type: 'string',
      required: true,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    }
  }
};

// All Order routes require authentication
router.use(protect);

// Customer Routes
router.post('/', validate(createOrderSchema), createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);

// Admin Only Routes
router.get('/', adminOnly, getAllOrders);
router.put('/:id/status', adminOnly, validate(updateOrderStatusSchema), updateOrderStatus);

module.exports = router;

const Order = require('../models/Order');
const Product = require('../models/Product');

// @POST /api/orders
// Protected route - Places a new purchase order
const createOrder = async (req, res, next) => {
  try {
    const { products, shippingAddress } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ success: false, message: 'No products provided for order' });
    }

    const processedProducts = [];
    let totalAmount = 0;
    const itemsDeducted = []; // For rollback in case of subsequent failures

    try {
      for (const item of products) {
        const { product: productId, quantity } = item;

        // Atomically deduct stock using Mongoose findOneAndUpdate with condition to prevent over-purchasing (race conditions)
        const product = await Product.findOneAndUpdate(
          { _id: productId, stock: { $gte: quantity }, isAvailable: true },
          { $inc: { stock: -quantity } },
          { new: true }
        );

        if (!product) {
          throw new Error(`Insufficient stock or product unavailable for ID: ${productId}`);
        }

        // Track for rollback
        itemsDeducted.push({ productId, quantity });

        // If stock is now 0, mark product as unavailable (optional, but clean)
        if (product.stock === 0) {
          await Product.findByIdAndUpdate(productId, { isAvailable: false });
        }

        const priceAtPurchase = product.price;
        totalAmount += priceAtPurchase * quantity;

        processedProducts.push({
          product: productId,
          quantity,
          priceAtPurchase
        });
      }
    } catch (err) {
      // Rollback stock deductions if any product fails stock check
      console.warn('⚠️ Rollback initiated due to order processing error:', err.message);
      for (const item of itemsDeducted) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
          isAvailable: true
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    // Create the order
    const order = await Order.create({
      buyer: req.user._id,
      products: processedProducts,
      totalAmount,
      shippingAddress,
      paymentStatus: 'paid' // Simulating completed transaction
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/orders/my-orders
// Protected route - User's order history with pagination
const getMyOrders = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ buyer: req.user._id })
        .populate({
          path: 'products.product',
          select: 'title imageUrl category price'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ buyer: req.user._id })
    ]);

    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/orders/:id
// Protected route - Order details for buyer or admin
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'username email profileImage')
      .populate({
        path: 'products.product',
        select: 'title imageUrl category price artist'
      })
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization: Must be the buyer or an admin
    if (order.buyer._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/orders
// Protected route - Admin only - List all orders
const getAllOrders = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find()
        .populate('buyer', 'username email profileImage')
        .populate({
          path: 'products.product',
          select: 'title imageUrl category price'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments()
    ]);

    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/orders/:id/status
// Protected route - Admin only - Updates delivery status or cancels order with restocking
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Restock products if order status transitions to 'cancelled' from a non-cancelled state
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
          isAvailable: true
        });
      }
    }

    // Deduct stock again if transitioned back from cancelled (optional edge case handler)
    if (order.status === 'cancelled' && status !== 'cancelled') {
      for (const item of order.products) {
        const product = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Cannot uncancel order: product ${item.product} is out of stock!`
          });
        }
      }
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: `Order status updated to '${status}' successfully`,
      order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};

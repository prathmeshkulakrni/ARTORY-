const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// Validation schemas
const createProductSchema = {
  body: {
    title: { type: 'string', required: true, min: 2, max: 100 },
    description: { type: 'string', required: false, max: 1000 },
    price: { type: 'number', required: true, min: 0 },
    imageUrl: { type: 'string', required: true },
    category: { type: 'string', required: true, min: 2 },
    stock: { type: 'number', required: false, min: 0 },
    tags: { type: 'array', required: false }
  }
};

const updateProductSchema = {
  body: {
    title: { type: 'string', required: false, min: 2, max: 100 },
    description: { type: 'string', required: false, max: 1000 },
    price: { type: 'number', required: false, min: 0 },
    imageUrl: { type: 'string', required: false },
    category: { type: 'string', required: false },
    stock: { type: 'number', required: false, min: 0 },
    tags: { type: 'array', required: false }
  }
};

// Public Routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected Routes (User / Mentor / Admin)
router.post('/', protect, validate(createProductSchema), createProduct);
router.put('/:id', protect, validate(updateProductSchema), updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;

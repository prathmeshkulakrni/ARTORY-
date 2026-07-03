const Product = require('../models/Product');

// @GET /api/products
// Public route - supports pagination, search, category & price filters
const getProducts = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { isAvailable: true };

    // Search query using text index
    if (req.query.q) {
      filter.$text = { $search: req.query.q };
    }

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Price range filters
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    // Query builder
    let query = Product.find(filter)
      .populate('artist', 'username profileImage isVerified')
      .skip(skip)
      .limit(limit);

    // If text searching, sort by text score relevance
    if (req.query.q) {
      query = query.select({ score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    // Execute query with lean for maximum performance
    const [products, total] = await Promise.all([
      query.lean().exec(),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/products/:id
// Public route
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('artist', 'username profileImage bio isVerified followers following')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/products
// Protected route - User / Admin / Mentor can list a product
const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, imageUrl, category, stock, tags } = req.body;

    const product = await Product.create({
      title,
      description,
      price,
      imageUrl,
      category,
      stock: stock || 1,
      tags: tags || [],
      artist: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Product listed successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/products/:id
// Protected route - Owner or Admin only
const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check ownership or admin status
    if (product.artist.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product listing'
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/products/:id
// Protected route - Owner or Admin only
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check ownership or admin status
    if (product.artist.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product listing'
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: 'Product listing removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Order = require('../models/Order');

const seedDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Cluster...');
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not set in the environment variables!');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    // 1. Clean existing seed collections
    console.log('🧹 Purging seed collections (User, Admin, Product, Order)...');
    await Promise.all([
      User.deleteMany({ email: { $in: ['admin_seed@artory.com', 'vincent@artory.com', 'collector@artory.com'] } }),
      Product.deleteMany({ title: { $in: ['Starry Night Canvas', 'Sunflowers Sketch', 'Digital Aurora NFT'] } }),
      Order.deleteMany({}) // Safe purge since this is a seed script
    ]);
    // Delete orphan Admins
    await Admin.deleteMany({});
    console.log('🗑️ Legacy seed records cleared.');

    // 2. Hash passwords
    console.log('🔑 Generating password hashes...');
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin@123', salt);
    const artistPassword = await bcrypt.hash('Artist@123', salt);
    const buyerPassword = await bcrypt.hash('Buyer@123', salt);

    // 3. Seed Users
    console.log('👥 Seeding users...');
    
    // Admin User
    const adminUser = await User.create({
      username: 'admin_seed',
      email: 'admin_seed@artory.com',
      password: adminPassword,
      role: 'admin',
      age: 30,
      isVerified: true,
      bio: 'System Administrator for Artory Hub.'
    });
    
    // Admin Metadata Profile
    const adminProfile = await Admin.create({
      user: adminUser._id,
      securityLevel: 'super',
      departments: ['users', 'content', 'billing', 'marketplace'],
      permissions: ['delete_artwork', 'delete_user', 'review_reports', 'update_orders'],
      isActive: true
    });
    
    console.log(`🛡️ Admin User seeded: ${adminUser.email}`);
    console.log(`🛡️ Admin Profile linked: Security Level [${adminProfile.securityLevel}]`);

    // Artist User (Mentor role)
    const artistUser = await User.create({
      username: 'vincent_van',
      email: 'vincent@artory.com',
      password: artistPassword,
      role: 'mentor',
      age: 37,
      isVerified: true,
      bio: 'Passionate oil painter and traditional sketching mentor.',
      skills: ['Painting', 'Sketching', 'Oil Canvas'],
      artInterests: ['Impressionism', 'Post-Impressionism']
    });
    console.log(`🎨 Artist User seeded: ${artistUser.email}`);

    // Buyer User (Regular user role)
    const buyerUser = await User.create({
      username: 'art_collector',
      email: 'collector@artory.com',
      password: buyerPassword,
      role: 'user',
      age: 28,
      isVerified: false,
      bio: 'Enthusiast collecting classic canvas recreations and modern digital assets.'
    });
    console.log(`🛒 Buyer User seeded: ${buyerUser.email}`);

    // 4. Seed Products
    console.log('📦 Seeding products...');
    
    const product1 = await Product.create({
      title: 'Starry Night Canvas',
      description: 'Stunning museum-grade oil canvas reproduction of Vincent van Gogh\'s masterpiece.',
      price: 120.00,
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5',
      category: 'painting',
      stock: 5,
      tags: ['classic', 'canvas', 'oil', 'masterpiece'],
      artist: artistUser._id
    });

    const product2 = await Product.create({
      title: 'Sunflowers Sketch',
      description: 'Hand-drawn study of sunflowers, charcoal on thick parchment paper.',
      price: 45.00,
      imageUrl: 'https://images.unsplash.com/photo-1579783928621-7a13d66a6211',
      category: 'sketch',
      stock: 10,
      tags: ['sketch', 'charcoal', 'sunflower', 'study'],
      artist: artistUser._id
    });

    const product3 = await Product.create({
      title: 'Digital Aurora NFT',
      description: 'Vibrant, high-resolution original digital rendering depicting the neon northern lights.',
      price: 75.00,
      imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab',
      category: 'digital',
      stock: 25,
      tags: ['digital', 'aurora', 'modern', 'nft'],
      artist: artistUser._id
    });

    console.log('📦 Sample products seeded successfully.');

    // 5. Seed Order
    console.log('🛍️ Placing demo order...');
    
    // Order: Buyer purchases 1x Starry Night and 2x Sunflowers
    const orderQty1 = 1;
    const orderQty2 = 2;

    // Deduct stock manually in seed to simulate transaction
    await Product.findByIdAndUpdate(product1._id, { $inc: { stock: -orderQty1 } });
    await Product.findByIdAndUpdate(product2._id, { $inc: { stock: -orderQty2 } });

    const totalAmount = (product1.price * orderQty1) + (product2.price * orderQty2);

    const demoOrder = await Order.create({
      buyer: buyerUser._id,
      products: [
        { product: product1._id, quantity: orderQty1, priceAtPurchase: product1.price },
        { product: product2._id, quantity: orderQty2, priceAtPurchase: product2.price }
      ],
      totalAmount,
      shippingAddress: {
        street: '101 Art Gallery Way',
        city: 'Metropolis',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      paymentStatus: 'paid',
      status: 'processing'
    });

    console.log(`🎉 Demo Order placed successfully! Order ID: ${demoOrder._id}`);
    console.log(`💳 Total Amount: $${totalAmount.toFixed(2)} (Paid)`);
    console.log('📉 Product stocks successfully updated.');

    console.log('\n🌟 Seeding Completed Successfully! 🌟');
    console.log('====================================');
    console.log('Demo Credentials for Testing APIs:');
    console.log('1. Admin:    email: admin_seed@artory.com  | password: Admin@123');
    console.log('2. Artist:   email: vincent@artory.com     | password: Artist@123');
    console.log('3. Customer: email: collector@artory.com   | password: Buyer@123');
    console.log('====================================\n');

  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    console.log('🔌 Closing Mongoose connection...');
    await mongoose.disconnect();
    console.log('🔌 Mongoose disconnected.');
  }
};

seedDatabase();

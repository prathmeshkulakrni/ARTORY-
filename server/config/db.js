const mongoose = require('mongoose');

let connectionAttempts = 0;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI is not defined in the environment variables!');
      process.exit(1);
    }

    // Set connection options
    const options = {
      autoIndex: true, // Build indexes automatically in production
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    mongoose.set('strictQuery', false); // Align with Mongoose v7/v8 behavior

    const conn = await mongoose.connect(mongoUri, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    connectionAttempts = 0; // Reset attempts on successful connection
  } catch (error) {
    connectionAttempts++;
    console.error(`❌ MongoDB initial connection error (Attempt ${connectionAttempts}/${MAX_RETRIES}): ${error.message}`);
    
    if (connectionAttempts < MAX_RETRIES) {
      console.log(`🔄 Retrying database connection in ${RETRY_INTERVAL / 1000}s...`);
      setTimeout(connectDB, RETRY_INTERVAL);
    } else {
      console.error('💥 Max MongoDB connection retries reached. Shutting down application...');
      process.exit(1);
    }
  }
};

// Event Listeners for connection lifecycle
mongoose.connection.on('connected', () => {
  console.log('📶 Mongoose connected to DB Cluster');
});

mongoose.connection.on('error', (err) => {
  console.error(`⚠️ Mongoose connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('📶 Mongoose disconnected from DB Cluster');
});

mongoose.connection.on('reconnected', () => {
  console.log('📶 Mongoose reconnected to DB Cluster');
});

// Graceful shutdown on process termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed gracefully through application termination (SIGINT)');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed gracefully through application termination (SIGTERM)');
  process.exit(0);
});

module.exports = connectDB;

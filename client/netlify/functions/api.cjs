const serverless = require('serverless-http');
const mongoose = require('mongoose');
const app = require('../../../server/app');

const handler = serverless(app);

const options = {
  autoIndex: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

module.exports.handler = async (event, context) => {
  // Prevent Lambda from hanging due to open database connection sockets
  context.callbackWaitsForEmptyEventLoop = false;

  // Establish connection to MongoDB Atlas or reuse existing connection
  if (mongoose.connection.readyState !== 1) {
    try {
      console.log('🔄 Connecting to MongoDB Atlas (Serverless context)...');
      await mongoose.connect(process.env.MONGO_URI, options);
      console.log('✅ MongoDB connected successfully to Atlas.');
    } catch (err) {
      console.error('❌ Database connection error in serverless function:', err.message);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Database connection failed: ' + err.message
        })
      };
    }
  }

  // Handle the request using the Express app
  return await handler(event, context);
};

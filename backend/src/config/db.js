const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    // Get MongoDB URI from environment variable
    const mongoURI = process.env.MONGODB_URL_DEVELOPMENT || process.env.MONGODB_URI || 'mongodb://localhost:27017/bottle-ecommerce';
    
    // Log environment variable status (mask credentials for security)
    console.log('\n=== MongoDB Connection Configuration ===');
    console.log('Environment variable MONGODB_URL_DEVELOPMENT:', process.env.MONGODB_URL_DEVELOPMENT ? '✅ Found' : '❌ Not found');
    console.log('Environment variable MONGODB_URI:', process.env.MONGODB_URI ? '✅ Found' : '❌ Not found');
    
    // Mask credentials in connection string for logging
    const maskedURI = mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log('Connection string (masked):', maskedURI);
    console.log('Database name:', mongoURI.split('/').pop()?.split('?')[0] || 'N/A');
    console.log('==========================================\n');
    
    console.log('Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000, // Timeout after 30s (increased from 10s)
      socketTimeoutMS: 60000, // Close sockets after 60s of inactivity (increased from 45s)
      connectTimeoutMS: 30000, // Connection timeout 30s
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      retryWrites: true, // Retry write operations
      retryReads: true, // Retry read operations
      heartbeatFrequencyMS: 10000, // How often to check connection health
    });
    
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Ready State: ${conn.connection.readyState} (1 = connected)\n`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      if (err.name === 'MongoNetworkTimeoutError') {
        console.error('⚠️  Network timeout detected. This could be due to:');
        console.error('   - Slow network connection');
        console.error('   - Firewall blocking the connection');
        console.error('   - MongoDB server is overloaded');
        console.error('   - IP address not whitelisted (for MongoDB Atlas)');
      }
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected. Attempting to reconnect...');
      // Auto-reconnect is handled by mongoose by default
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });

    mongoose.connection.on('connecting', () => {
      console.log('🔄 Attempting to connect to MongoDB...');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if MONGODB_URL_DEVELOPMENT is set in .env file');
    console.error('2. Verify the connection string format');
    console.error('3. Check network connectivity (for Atlas)');
    console.error('4. Verify credentials are correct');
    console.error('5. Check if IP is whitelisted (for Atlas)\n');
    process.exit(1);
  }
};

module.exports = connectDB;


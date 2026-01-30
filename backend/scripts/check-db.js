const mongoose = require('mongoose');
require('dotenv').config();

const checkConnection = async () => {
  const mongoURI = process.env.MONGODB_URL_DEVELOPMENT || process.env.MONGODB_URI || 'mongodb://localhost:27017/bottle-ecommerce';
  
  console.log('\n=== MongoDB Connection Test ===');
  console.log('Environment variable MONGODB_URL_DEVELOPMENT:', process.env.MONGODB_URL_DEVELOPMENT ? '✅ Found' : '❌ Not found');
  console.log('Environment variable MONGODB_URI:', process.env.MONGODB_URI ? '✅ Found' : '❌ Not found');
  
  // Mask credentials in connection string for logging
  const maskedURI = mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  console.log('Connection string (masked):', maskedURI);
  console.log('Database name:', mongoURI.split('/').pop()?.split('?')[0] || 'N/A');
  console.log('===============================\n');
  
  console.log('Checking MongoDB connection...');
  
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Ready State: ${mongoose.connection.readyState} (1 = connected)\n`);
    
    await mongoose.connection.close();
    console.log('Connection closed. Test completed successfully.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MongoDB connection failed!');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if MONGODB_URL_DEVELOPMENT is set in .env file');
    console.error('2. Verify the connection string format');
    console.error('3. Check network connectivity (for Atlas)');
    console.error('4. Verify credentials are correct');
    console.error('5. Check if IP is whitelisted (for Atlas)');
    console.error('6. For local MongoDB: mongodb://localhost:27017/bottle-ecommerce');
    console.error('7. For Atlas: mongodb+srv://username:password@cluster.mongodb.net/dbname\n');
    process.exit(1);
  }
};

checkConnection();


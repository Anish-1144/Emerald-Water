/**
 * Script to create database indexes for better performance
 * Run this once after setting up the database
 * 
 * Usage: node scripts/create-indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Design = require('../src/models/Design.model');
const Order = require('../src/models/Order.model');

async function createIndexes() {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGODB_URL_DEVELOPMENT || process.env.MONGODB_URI;
    if (!mongoUrl) {
      console.error('MongoDB URL not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Create indexes for Design model
    console.log('Creating indexes for Design model...');
    await Design.collection.createIndex({ createdAt: -1 });
    await Design.collection.createIndex({ is_draft: 1 });
    console.log('✓ Design indexes created');

    // Create indexes for Order model
    console.log('Creating indexes for Order model...');
    await Order.collection.createIndex({ createdAt: -1 });
    await Order.collection.createIndex({ 'shipping_address.email': 1 });
    await Order.collection.createIndex({ order_id: 1 });
    console.log('✓ Order indexes created');

    console.log('\nAll indexes created successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createIndexes();












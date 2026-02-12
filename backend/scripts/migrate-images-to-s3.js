/**
 * Migration script to convert existing base64 images in MongoDB to S3 URLs
 * 
 * Usage: node scripts/migrate-images-to-s3.js
 * 
 * This script will:
 * 1. Find all designs with base64 images
 * 2. Upload them to S3
 * 3. Update the database with S3 URLs
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Design = require('../src/models/Design.model');
const Order = require('../src/models/Order.model');
const { uploadDesignImages } = require('../src/services/s3.service');

async function migrateDesigns() {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGODB_URL_DEVELOPMENT || process.env.MONGODB_URI;
    if (!mongoUrl) {
      console.error('MongoDB URL not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Check S3 configuration
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
      console.error('S3 configuration not found in environment variables');
      console.error('Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME');
      process.exit(1);
    }

    // Find all designs with base64 images
    const designs = await Design.find({
      $or: [
        { label_image: { $regex: /^data:image/ } },
        { print_pdf: { $regex: /^data:image/ } },
        { bottle_snapshot: { $regex: /^data:image/ } }
      ]
    });

    console.log(`Found ${designs.length} designs with base64 images to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const design of designs) {
      try {
        console.log(`\nMigrating design ${design._id}...`);

        const imagesToUpload = {};
        let needsUpload = false;

        // Check which images need to be uploaded
        if (design.label_image && design.label_image.startsWith('data:')) {
          imagesToUpload.label_image = design.label_image;
          needsUpload = true;
        }

        if (design.print_pdf && design.print_pdf.startsWith('data:')) {
          imagesToUpload.print_pdf = design.print_pdf;
          needsUpload = true;
        }

        if (design.bottle_snapshot && design.bottle_snapshot.startsWith('data:')) {
          imagesToUpload.bottle_snapshot = design.bottle_snapshot;
          needsUpload = true;
        }

        if (needsUpload) {
          // Upload to S3
          const s3Urls = await uploadDesignImages(imagesToUpload);

          // Update design with S3 URLs
          const updateData = {};
          if (s3Urls.label_image) updateData.label_image = s3Urls.label_image;
          if (s3Urls.print_pdf) updateData.print_pdf = s3Urls.print_pdf;
          if (s3Urls.bottle_snapshot) updateData.bottle_snapshot = s3Urls.bottle_snapshot;

          await Design.findByIdAndUpdate(design._id, updateData);

          console.log(`✓ Design ${design._id} migrated successfully`);
          console.log(`  - Label image: ${s3Urls.label_image ? 'Uploaded' : 'Skipped'}`);
          console.log(`  - Print PDF: ${s3Urls.print_pdf ? 'Uploaded' : 'Skipped'}`);
          console.log(`  - Bottle snapshot: ${s3Urls.bottle_snapshot ? 'Uploaded' : 'Skipped'}`);

          successCount++;
        } else {
          console.log(`- Design ${design._id} already has S3 URLs, skipping`);
        }
      } catch (error) {
        console.error(`✗ Error migrating design ${design._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n=== Migration Summary ===`);
    console.log(`Total designs processed: ${designs.length}`);
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

    // Also migrate orders if they have base64 images
    console.log(`\nChecking orders...`);
    const orders = await Order.find({
      $or: [
        { label_image: { $regex: /^data:image/ } },
        { print_pdf: { $regex: /^data:image/ } },
        { bottle_snapshot: { $regex: /^data:image/ } }
      ]
    });

    console.log(`Found ${orders.length} orders with base64 images`);

    let orderSuccessCount = 0;
    let orderErrorCount = 0;

    for (const order of orders) {
      try {
        const imagesToUpload = {};
        let needsUpload = false;

        if (order.label_image && order.label_image.startsWith('data:')) {
          imagesToUpload.label_image = order.label_image;
          needsUpload = true;
        }

        if (order.print_pdf && order.print_pdf.startsWith('data:')) {
          imagesToUpload.print_pdf = order.print_pdf;
          needsUpload = true;
        }

        if (order.bottle_snapshot && order.bottle_snapshot.startsWith('data:')) {
          imagesToUpload.bottle_snapshot = order.bottle_snapshot;
          needsUpload = true;
        }

        if (needsUpload) {
          const s3Urls = await uploadDesignImages(imagesToUpload);

          const updateData = {};
          if (s3Urls.label_image) updateData.label_image = s3Urls.label_image;
          if (s3Urls.print_pdf) updateData.print_pdf = s3Urls.print_pdf;
          if (s3Urls.bottle_snapshot) updateData.bottle_snapshot = s3Urls.bottle_snapshot;

          await Order.findByIdAndUpdate(order._id, updateData);

          console.log(`✓ Order ${order.order_id} migrated successfully`);
          orderSuccessCount++;
        }
      } catch (error) {
        console.error(`✗ Error migrating order ${order.order_id}:`, error.message);
        orderErrorCount++;
      }
    }

    console.log(`\n=== Order Migration Summary ===`);
    console.log(`Total orders processed: ${orders.length}`);
    console.log(`Successfully migrated: ${orderSuccessCount}`);
    console.log(`Errors: ${orderErrorCount}`);

    await mongoose.disconnect();
    console.log('\nMigration completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
migrateDesigns();












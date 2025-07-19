#!/usr/bin/env node

/**
 * Migration script to add status history to existing orders and payments
 * Run this script once after deploying the new status tracking models
 * 
 * Usage: node migrate-status-history.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { migrateOrderStatusHistory, migratePaymentStatusHistory } from "../utils/migrationHelpers.js";
import logger from "../utils/logger.js";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/golbot";

async function runMigration() {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB for migration', { uri: MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') });
    
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB successfully');

    // Run order migration
    logger.info('Starting order status history migration...');
    const orderResult = await migrateOrderStatusHistory();
    logger.info('Order migration completed', orderResult);

    // Run payment migration
    logger.info('Starting payment status history migration...');
    const paymentResult = await migratePaymentStatusHistory();
    logger.info('Payment migration completed', paymentResult);

    // Summary
    const totalMigrated = orderResult.migrationCount + paymentResult.migrationCount;
    logger.info('Migration completed successfully', {
      ordersMigrated: orderResult.migrationCount,
      paymentsMigrated: paymentResult.migrationCount,
      totalDocumentsMigrated: totalMigrated
    });

    console.log('\n✅ Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Orders migrated: ${orderResult.migrationCount}/${orderResult.totalOrders}`);
    console.log(`   • Payments migrated: ${paymentResult.migrationCount}/${paymentResult.totalPayments}`);
    console.log(`   • Total documents migrated: ${totalMigrated}`);

  } catch (error) {
    logger.error('Migration failed', { error: error.message, stack: error.stack });
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
    console.log('\n🔌 Database connection closed');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('Migration interrupted by user');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection during migration', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting status history migration...\n');
  runMigration();
}

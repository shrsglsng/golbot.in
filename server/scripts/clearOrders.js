/**
 * Clear All Orders Script
 *
 * ⚠️ WARNING: This script will DELETE ALL DOCUMENTS from:
 * - orders collection
 * - orderitems collection
 * - payments collection
 *
 * Use this ONLY in development/testing environments!
 * DO NOT run this in production!
 *
 * Usage:
 * node scripts/clearOrders.js
 * npm run clear:orders
 * npm run clear:orders:local
 */

import mongoose from 'mongoose';
// Note: dotenv is loaded via -r dotenv/config flag with dotenv_config_path
// No need to call dotenv.config() here to avoid overriding

const clearAllOrders = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');

    // Suppress mongoose strictQuery deprecation warning
    mongoose.set('strictQuery', false);

    // Connect to MongoDB
    const mongoUri = process.env.EXPAPP_MONGO_URL;
    if (!mongoUri) {
      throw new Error('EXPAPP_MONGO_URL not found in environment variables');
    }

    // Show which cluster we're connecting to (hide credentials)
    const clusterMatch = mongoUri.match(/@([^/]+)\//);
    const clusterHost = clusterMatch ? clusterMatch[1] : 'unknown';
    console.log('🌐 Cluster:', clusterHost);

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    console.log('📦 Database:', mongoose.connection.db.databaseName);
    console.log('');

    // Get collections
    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');
    const orderItemsCollection = db.collection('orderitems');
    const paymentsCollection = db.collection('payments');
    const countersCollection = db.collection('counters');

    // Count documents before deletion
    console.log('📊 Current document counts:');
    const ordersCount = await ordersCollection.countDocuments();
    const orderItemsCount = await orderItemsCollection.countDocuments();
    const paymentsCount = await paymentsCollection.countDocuments();
    const countersCount = await countersCollection.countDocuments();

    console.log(`   Orders: ${ordersCount}`);
    console.log(`   OrderItems: ${orderItemsCount}`);
    console.log(`   Payments: ${paymentsCount}`);
    console.log(`   Counters: ${countersCount}`);
    console.log('');

    if (ordersCount === 0 && orderItemsCount === 0 && paymentsCount === 0 && countersCount === 0) {
      console.log('ℹ️  All collections are already empty. Nothing to delete.');
      await mongoose.connection.close();
      return;
    }

    // Confirm deletion
    console.log('⚠️  WARNING: You are about to DELETE ALL documents from these collections!');
    console.log('');
    console.log('🗑️  Starting deletion in 3 seconds...');
    console.log('   Press Ctrl+C to cancel');
    console.log('');

    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete all documents
    console.log('🗑️  Deleting documents...');

    const ordersResult = await ordersCollection.deleteMany({});
    console.log(`   ✅ Deleted ${ordersResult.deletedCount} orders`);

    const orderItemsResult = await orderItemsCollection.deleteMany({});
    console.log(`   ✅ Deleted ${orderItemsResult.deletedCount} order items`);

    const paymentsResult = await paymentsCollection.deleteMany({});
    console.log(`   ✅ Deleted ${paymentsResult.deletedCount} payments`);

    const countersResult = await countersCollection.deleteMany({});
    console.log(`   ✅ Deleted ${countersResult.deletedCount} counters`);

    console.log('');
    console.log('✨ All order-related data has been cleared successfully!');
    console.log('');

    // Verify deletion
    const finalOrdersCount = await ordersCollection.countDocuments();
    const finalOrderItemsCount = await orderItemsCollection.countDocuments();
    const finalPaymentsCount = await paymentsCollection.countDocuments();
    const finalCountersCount = await countersCollection.countDocuments();

    console.log('📊 Final document counts:');
    console.log(`   Orders: ${finalOrdersCount}`);
    console.log(`   OrderItems: ${finalOrderItemsCount}`);
    console.log(`   Payments: ${finalPaymentsCount}`);
    console.log(`   Counters: ${finalCountersCount}`);

  } catch (error) {
    console.error('❌ Error clearing orders:', error);
    throw error;
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('');
    console.log('🔌 MongoDB connection closed');
  }
};

// Run the script
clearAllOrders()
  .then(() => {
    console.log('');
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });

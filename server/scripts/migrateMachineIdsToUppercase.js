/**
 * Database Migration Script: Uppercase Machine IDs
 *
 * This script updates all machine IDs (mid) to uppercase to ensure consistency
 * across the database and prevent case-sensitivity issues.
 *
 * Usage: node scripts/migrateMachineIdsToUppercase.js [--dry-run]
 *
 * Options:
 *   --dry-run    Show what would be changed without making actual changes
 */

import mongoose from 'mongoose';
import Machine from '../models/machineModel.js';
import Order from '../models/orderModel.js';
import dotenv from 'dotenv';

dotenv.config();

const isDryRun = process.argv.includes('--dry-run');

async function migrateMachineIds() {
  try {
    console.log('🔄 Starting machine ID migration to uppercase...');
    console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '✍️  LIVE MODE (changes will be applied)'}`);
    console.log('');

    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.EXPAPP_MONGO_URL);
    console.log('✅ Connected to database');
    console.log('');

    // Find all machines with lowercase characters in mid
    const machines = await Machine.find({});
    const machinesToUpdate = machines.filter(m => m.mid !== m.mid.toUpperCase());

    console.log(`📊 Found ${machines.length} total machines`);
    console.log(`📝 Found ${machinesToUpdate.length} machines with lowercase characters`);
    console.log('');

    if (machinesToUpdate.length === 0) {
      console.log('✅ All machine IDs are already uppercase. No migration needed!');
      process.exit(0);
    }

    // Display machines that will be updated
    console.log('Machines to be updated:');
    machinesToUpdate.forEach(machine => {
      console.log(`  ${machine.mid} → ${machine.mid.toUpperCase()} (${machine.location})`);
    });
    console.log('');

    if (isDryRun) {
      console.log('🔍 DRY RUN complete. No changes were made.');
      console.log('💡 Run without --dry-run to apply these changes.');
      process.exit(0);
    }

    // Proceed with migration
    console.log('🚀 Starting migration...');
    console.log('');

    let updatedCount = 0;
    let errorCount = 0;

    for (const machine of machinesToUpdate) {
      const oldMid = machine.mid;
      const newMid = machine.mid.toUpperCase();

      try {
        // Check if uppercase version already exists
        const existing = await Machine.findOne({ mid: newMid, _id: { $ne: machine._id } });
        if (existing) {
          console.error(`  ❌ Cannot update ${oldMid} → ${newMid}: Uppercase version already exists`);
          errorCount++;
          continue;
        }

        // Update the machine document
        machine.mid = newMid;

        // Disable password hashing for this update since we're not changing password
        await machine.save({ validateBeforeSave: true });

        console.log(`  ✅ Updated machine: ${oldMid} → ${newMid}`);
        updatedCount++;

        // Update related orders (if any exist with machineId reference)
        // Note: If machineId in orders is an ObjectId reference, this isn't needed
        // But if it's stored as a string mid, uncomment this:
        /*
        const orderUpdateResult = await Order.updateMany(
          { 'machineId.mid': oldMid },
          { $set: { 'machineId.mid': newMid } }
        );
        if (orderUpdateResult.modifiedCount > 0) {
          console.log(`    📦 Updated ${orderUpdateResult.modifiedCount} related orders`);
        }
        */

      } catch (error) {
        console.error(`  ❌ Error updating ${oldMid}:`, error.message);
        errorCount++;
      }
    }

    console.log('');
    console.log('📊 Migration Summary:');
    console.log(`  ✅ Successfully updated: ${updatedCount} machines`);
    console.log(`  ❌ Errors: ${errorCount} machines`);
    console.log('');

    if (updatedCount > 0) {
      console.log('✅ Migration completed successfully!');
      console.log('');
      console.log('⚠️  Important: You should now restart your server for changes to take effect.');
    } else {
      console.log('⚠️  No machines were updated. Please check the errors above.');
    }

    process.exit(errorCount > 0 ? 1 : 0);

  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run migration
migrateMachineIds();

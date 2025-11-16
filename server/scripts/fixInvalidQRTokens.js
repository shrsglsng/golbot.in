/**
 * Migration script to fix invalid QR tokens missing required fields
 * This script will remove QR tokens that are missing the required 'token' field
 */

import mongoose from 'mongoose';
import Machine from '../models/machineModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixInvalidQRTokens() {
  try {
    console.log('🔧 Fixing invalid QR tokens...\n');

    // Connect to database
    await mongoose.connect(process.env.EXPAPP_MONGO_URL);
    console.log('✅ Connected to database\n');

    // Get all machines
    const machines = await Machine.find({});

    console.log(`📊 Found ${machines.length} machines\n`);

    let totalFixed = 0;
    let totalInvalidTokens = 0;

    for (const machine of machines) {
      const invalidTokens = [];
      const validTokens = [];

      if (machine.qrTokens && machine.qrTokens.length > 0) {
        machine.qrTokens.forEach((token, index) => {
          // Check if token has all required fields
          if (!token.tokenId || !token.token) {
            invalidTokens.push({ index, tokenId: token.tokenId, reason: !token.tokenId ? 'Missing tokenId' : 'Missing token' });
          } else {
            validTokens.push(token);
          }
        });

        if (invalidTokens.length > 0) {
          console.log(`\n🔍 Machine: ${machine.mid}`);
          console.log(`   Found ${invalidTokens.length} invalid token(s):`);

          invalidTokens.forEach(invalid => {
            console.log(`   - Token #${invalid.index + 1}: ${invalid.reason}`);
            totalInvalidTokens++;
          });

          // Remove invalid tokens
          machine.qrTokens = validTokens;

          // Save without triggering validation on the entire document
          await Machine.updateOne(
            { _id: machine._id },
            { $set: { qrTokens: validTokens } }
          );

          console.log(`   ✅ Removed ${invalidTokens.length} invalid token(s)`);
          console.log(`   ℹ️  Remaining valid tokens: ${validTokens.length}`);
          totalFixed++;
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Migration complete!`);
    console.log(`   - Machines fixed: ${totalFixed}`);
    console.log(`   - Invalid tokens removed: ${totalInvalidTokens}`);
    console.log('\nℹ️  Note: These tokens were likely created before the token field was made required.');
    console.log('   You can regenerate new QR tokens for these machines from the admin panel.\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
fixInvalidQRTokens();

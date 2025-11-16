/**
 * Script to check QR token data validity
 */

import mongoose from 'mongoose';
import Machine from '../models/machineModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkQRTokens() {
  try {
    console.log('🔍 Checking QR token data...\n');

    // Connect to database
    await mongoose.connect(process.env.EXPAPP_MONGO_URL);
    console.log('✅ Connected to database\n');

    // Get all machines
    const machines = await Machine.find({}).lean();

    console.log(`📊 Found ${machines.length} machines\n`);
    console.log('QR Token Details:');
    console.log('='.repeat(80));

    for (const machine of machines) {
      console.log(`\nMachine ID: ${machine.mid}`);
      console.log(`  Total QR Tokens: ${machine.qrTokens?.length || 0}`);

      if (machine.qrTokens && machine.qrTokens.length > 0) {
        machine.qrTokens.forEach((token, index) => {
          console.log(`\n  Token #${index + 1}:`);
          console.log(`    - tokenId: ${token.tokenId || '❌ MISSING'}`);
          console.log(`    - token: ${token.token ? '✅ Present' : '❌ MISSING'}`);
          console.log(`    - label: ${token.label || 'N/A'}`);
          console.log(`    - createdAt: ${token.createdAt || 'N/A'}`);
          console.log(`    - createdBy: ${token.createdBy || 'N/A'}`);

          // Check for validation issues
          const issues = [];
          if (!token.tokenId) issues.push('Missing tokenId (REQUIRED)');
          if (!token.token) issues.push('Missing token (REQUIRED)');

          if (issues.length > 0) {
            console.log(`    ⚠️  VALIDATION ISSUES:`);
            issues.forEach(issue => console.log(`       - ${issue}`));
          } else {
            console.log(`    ✅ Valid token`);
          }
        });
      } else {
        console.log('  No QR tokens');
      }

      // Check revoked tokens
      if (machine.revokedTokens && machine.revokedTokens.length > 0) {
        console.log(`\n  Revoked Tokens: ${machine.revokedTokens.length}`);
        machine.revokedTokens.forEach((tokenId, index) => {
          console.log(`    ${index + 1}. ${tokenId}`);
        });
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Check complete\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run check
checkQRTokens();

/**
 * Script to check machine data and identify any validation issues
 */

import mongoose from 'mongoose';
import Machine from '../models/machineModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkMachineData() {
  try {
    console.log('🔍 Checking machine data...\n');

    // Connect to database
    await mongoose.connect(process.env.EXPAPP_MONGO_URL);
    console.log('✅ Connected to database\n');

    // Get all machines
    const machines = await Machine.find({}).lean();

    console.log(`📊 Found ${machines.length} machines\n`);
    console.log('Machine Details:');
    console.log('='.repeat(80));

    for (const machine of machines) {
      console.log(`\nMachine ID: ${machine.mid}`);
      console.log(`  Location: ${machine.location || 'N/A'}`);
      console.log(`  Status: ${machine.mstatus}`);
      console.log(`  Active: ${machine.isActive}`);
      console.log(`  Has Password: ${machine.password ? 'Yes' : 'No'}`);
      console.log(`  IP Address: ${machine.ipAddress || 'N/A'}`);
      console.log(`  Created: ${machine.createdAt}`);
      console.log(`  Last Pinged: ${machine.lastPingedAt || 'Never'}`);
      console.log(`  QR Tokens: ${machine.qrTokens?.length || 0}`);

      // Check for potential validation issues
      const issues = [];

      // Check mid format
      if (!/^[A-Z0-9]{3,20}$/.test(machine.mid)) {
        issues.push(`Invalid mid format: "${machine.mid}"`);
      }

      // Check mid length
      if (machine.mid.length < 3 || machine.mid.length > 20) {
        issues.push(`Invalid mid length: ${machine.mid.length} characters`);
      }

      // Check for whitespace
      if (machine.mid !== machine.mid.trim()) {
        issues.push('Mid has leading/trailing whitespace');
      }

      // Check status
      const validStatuses = ['CONNECTED', 'DISCONNECTED', 'PREPARING', 'READY_FOR_PICKUP'];
      if (!validStatuses.includes(machine.mstatus)) {
        issues.push(`Invalid status: ${machine.mstatus}`);
      }

      if (issues.length > 0) {
        console.log(`  ⚠️  ISSUES FOUND:`);
        issues.forEach(issue => console.log(`     - ${issue}`));
      } else {
        console.log(`  ✅ No validation issues`);
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
checkMachineData();

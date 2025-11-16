/**
 * Reset Machine Password Script
 * Usage: node scripts/resetMachinePassword.js M01 newpassword
 */

import mongoose from 'mongoose';
import Machine from '../models/machineModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function resetMachinePassword() {
  try {
    const machineId = process.argv[2];
    const newPassword = process.argv[3];

    if (!machineId || !newPassword) {
      console.error('❌ Usage: node scripts/resetMachinePassword.js <MACHINE_ID> <NEW_PASSWORD>');
      console.error('   Example: node scripts/resetMachinePassword.js M01 12345678');
      process.exit(1);
    }

    if (newPassword.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.EXPAPP_MONGO_URL);
    console.log('✅ Connected to database');

    // Find machine
    const machine = await Machine.findOne({ mid: machineId });
    if (!machine) {
      console.error(`❌ Machine ${machineId} not found`);
      process.exit(1);
    }

    console.log(`📍 Found machine: ${machine.mid} at ${machine.location}`);

    // Update password (will be auto-hashed by the model)
    machine.password = newPassword;
    await machine.save();

    console.log(`✅ Password updated successfully for machine ${machineId}`);
    console.log(`🔑 New password: ${newPassword}`);
    console.log(`📱 Update your Flutter app to use this password`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetMachinePassword();

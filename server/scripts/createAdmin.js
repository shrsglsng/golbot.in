/**
 * Script to create an admin user in the database
 * Usage:
 *   NODE_ENV=staging node scripts/createAdmin.js
 *   OR
 *   node scripts/createAdmin.js <email> <password>
 */

import mongoose from 'mongoose';
import Admin from '../models/adminModel.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment-specific .env file
const env = process.env.NODE_ENV || 'local';
const envFile = env === 'local' ? '.env' : `.env.${env}`;
const envPath = path.resolve(__dirname, '..', envFile);

console.log(`Loading environment from: ${envPath}`);
dotenv.config({ path: envPath });

// Default credentials (can be overridden by command line args)
const DEFAULT_EMAIL = 'admin@golbot.in';
const DEFAULT_PASSWORD = 'admin@123';

async function createAdmin() {
  try {
    // Get credentials from command line args or use defaults
    const email = process.argv[2] || DEFAULT_EMAIL;
    const password = process.argv[3] || DEFAULT_PASSWORD;
    const location = process.argv[4] || undefined;

    console.log('\n🔧 Creating Admin User...\n');
    console.log(`Environment: ${env}`);
    console.log(`Email: ${email}`);
    console.log(`Location: ${location || 'Not specified'}\n`);

    // Connect to database
    const mongoUrl = process.env.EXPAPP_MONGO_URL;
    if (!mongoUrl) {
      throw new Error('EXPAPP_MONGO_URL not found in environment variables');
    }

    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to database\n');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log('⚠️  Admin with this email already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Created: ${existingAdmin.createdAt}`);
      console.log('\nℹ️  If you want to update the password, delete the admin first.\n');
      process.exit(0);
    }

    // Create new admin
    const admin = new Admin({
      email,
      password,
      location
    });

    await admin.save();

    console.log('✅ Admin created successfully!\n');
    console.log(`   Email: ${admin.email}`);
    console.log(`   ID: ${admin._id}`);
    console.log(`   Created: ${admin.createdAt}`);
    if (admin.location) {
      console.log(`   Location: ${admin.location}`);
    }
    console.log('\nℹ️  Password has been hashed and stored securely.\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - Admin with this email already exists.');
    }
    console.error(error.stack);
    process.exit(1);
  }
}

// Run script
createAdmin();

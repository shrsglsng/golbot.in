import mongoose from "mongoose";
import Admin from "../models/adminModel.js";
import dotenv from "dotenv";
import readline from "readline";

// Load environment variables
dotenv.config();

// Suppress mongoose deprecation warning
mongoose.set('strictQuery', false);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdmin() {
  try {
    // Connect to database
    await mongoose.connect(process.env.EXPAPP_MONGO_URL);
    console.log('✓ Connected to database\n');

    // Check if any admins exist (with permission fallback)
    let adminCount = 0;
    let canCheckCount = true;

    try {
      adminCount = await Admin.countDocuments();
    } catch (countError) {
      // If we can't count (permission issue), continue but warn
      if (countError.message.includes('not authorized') || countError.message.includes('Unauthorized')) {
        console.log('⚠️  Warning: Cannot check existing admins (database permission issue).');
        console.log('ℹ️  Continuing with admin creation...\n');
        canCheckCount = false;
      } else {
        throw countError;
      }
    }

    if (canCheckCount && adminCount > 0) {
      const proceed = await question(
        `⚠️  Warning: ${adminCount} admin(s) already exist in the database.\nDo you want to create another admin? (yes/no): `
      );

      if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
        console.log('\n❌ Admin creation cancelled.');
        process.exit(0);
      }
    } else if (canCheckCount && adminCount === 0) {
      console.log('ℹ️  No admins found. Creating first admin account...\n');
    }

    // Get admin details from user
    const email = await question('Email: ');
    const password = await question('Password (min 8 characters): ');
    const name = await question('Name (optional): ');
    const location = await question('Location (optional): ');

    // Validate input
    if (!email || !password) {
      console.error('\n❌ Error: Email and password are required');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('\n❌ Error: Password must be at least 8 characters');
      process.exit(1);
    }

    // Check if email already exists
    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.error(`\n❌ Error: Admin with email "${email}" already exists`);
      process.exit(1);
    }

    // Create admin
    const admin = new Admin({
      email: email.toLowerCase(),
      password,
      name: name || '',
      location: location || '',
      createdAt: new Date(),
      isActive: true
    });

    await admin.save();

    console.log('\n✓ Admin created successfully!');
    console.log('─────────────────────────────');
    console.log(`Email: ${admin.email}`);
    console.log(`Name: ${admin.name || '(not set)'}`);
    console.log(`Location: ${admin.location || '(not set)'}`);
    console.log(`Created: ${admin.createdAt}`);
    console.log('─────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdmin();

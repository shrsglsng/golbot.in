import mongoose from "mongoose";
import Admin from "../models/adminModel.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function listAdmins() {
  try {
    // Connect to database
    await mongoose.connect(process.env.EXPAPP_MONGO_URL);
    console.log('Connected to database');

    // List all admins
    const admins = await Admin.find({}, 'email location createdAt');
    console.log(`Found ${admins.length} admin accounts:\n`);
    
    if (admins.length === 0) {
      console.log('No admin accounts found. You may need to register an admin first.');
    } else {
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}`);
        console.log(`   Location: ${admin.location || 'Not set'}`);
        console.log(`   Created: ${admin.createdAt}`);
        console.log('   Status: ACTIVE (Admin model does not have disable feature)\n');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error listing admins:', error);
    process.exit(1);
  }
}

listAdmins();

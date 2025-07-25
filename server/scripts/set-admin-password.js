import mongoose from "mongoose";
import Admin from "../models/adminModel.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function updateAdminPassword() {
  try {
    // Connect to database
    await mongoose.connect(process.env.EXPAPP_MONGO_URL);
    console.log('Connected to database');

    // Find the admin and update password
    const admin = await Admin.findOne({ email: 'admin@example.com' });
    
    if (!admin) {
      console.log('❌ Admin not found');
      process.exit(1);
    }

    console.log('Found admin:', admin.email);
    
    // Set a known password
    const newPassword = 'admin123';
    admin.password = newPassword;
    await admin.save(); // This will trigger the pre-save hook to hash the password

    console.log('✅ Admin password updated to: admin123');
    console.log('You can now login with:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin password:', error);
    process.exit(1);
  }
}

updateAdminPassword();

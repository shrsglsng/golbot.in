import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.EXPAPP_MONGO_URL);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

// Fix machine passwords that are not properly hashed
const fixMachinePasswords = async () => {
  try {
    await connectDB();
    
    // Get all machines
    const machines = await mongoose.connection.db.collection('machines').find({}).toArray();
    
    console.log(`Found ${machines.length} machines`);
    
    for (const machine of machines) {
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (machine.password && !machine.password.startsWith('$2')) {
        console.log(`Fixing password for machine: ${machine.mid}`);
        
        // Hash the plain text password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(machine.password, salt);
        
        // Update the machine record
        await mongoose.connection.db.collection('machines').updateOne(
          { _id: machine._id },
          { $set: { password: hashedPassword } }
        );
        
        console.log(`✅ Password updated for machine: ${machine.mid}`);
      } else {
        console.log(`✓ Password already hashed for machine: ${machine.mid}`);
      }
    }
    
    console.log("Password fixing completed!");
    process.exit(0);
    
  } catch (error) {
    console.error("Error fixing passwords:", error);
    process.exit(1);
  }
};

fixMachinePasswords();

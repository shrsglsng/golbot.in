import mongoose from "mongoose";
import Item from "../models/itemModel.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.EXPAPP_MONGO_URL);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Seed data
const seedItems = async () => {
  try {
    // Clear existing items
    const deleteResult = await Item.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} items from the database`);

    // Create new items
    const items = [
      {
        name: "golgappa",
        desc: "Crispy hollow puri filled with spicy tangy water",
        imgUrl: "",
        price: 150,
        gst: 0,
        isAvailable: true,
        puriPerPlate: 6, // 6 puris per plate
      },
      {
        name: "pani puri with onions",
        desc: "Delicious pani puri served with chopped onions",
        imgUrl: "",
        price: 200,
        gst: 0,
        isAvailable: true,
        puriPerPlate: 8, // 8 puris per plate
      },
      {
        name: "pani puri without onions",
        desc: "Classic pani puri without onions",
        imgUrl: "",
        price: 180,
        gst: 0,
        isAvailable: true,
        puriPerPlate: 8, // 8 puris per plate
      },
    ];

    const createdItems = await Item.insertMany(items);
    console.log(`Successfully created ${createdItems.length} items:`);
    createdItems.forEach((item) => {
      console.log(`  - ${item.name} (₹${item.price})`);
    });

    console.log("\nSeeding completed successfully!");
  } catch (error) {
    console.error("Error seeding items:", error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the seed script
const runSeed = async () => {
  await connectDB();
  await seedItems();
};

runSeed();

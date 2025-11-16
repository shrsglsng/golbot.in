import mongoose from "mongoose";
import ReportIssue from "../models/reportIssueModel.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Migration script to add 'seen: false' to existing reports
 * This ensures all existing reports show up as unseen notifications
 */
async function migrateReportsSeen() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully");

    // Find all reports that don't have the 'seen' field
    const reportsWithoutSeen = await ReportIssue.find({
      seen: { $exists: false }
    });

    console.log(`Found ${reportsWithoutSeen.length} reports without 'seen' field`);

    if (reportsWithoutSeen.length === 0) {
      console.log("No reports need migration. All reports already have 'seen' field.");
      await mongoose.connection.close();
      process.exit(0);
    }

    // Update all reports to set seen: false
    const result = await ReportIssue.updateMany(
      { seen: { $exists: false } },
      { $set: { seen: false } }
    );

    console.log(`Migration completed successfully!`);
    console.log(`Updated ${result.modifiedCount} reports`);
    console.log(`All existing reports are now marked as unseen (seen: false)`);

    // Close connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateReportsSeen();

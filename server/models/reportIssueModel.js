import mongoose from "mongoose";

const reportIssueSchema = new mongoose.Schema(
  {
    // Auto-incrementing report ID for easy reference
    reportId: {
      type: String,
      required: true,
      unique: true
    },

    // References (all optional - user might report without being logged in)
    uid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    oid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    },
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine"
    },

    // Status tracking
    status: {
      type: String,
      enum: ["initiated", "received", "in_review", "resolved"],
      default: "initiated"
    },

    // Seen status (for admin notifications)
    seen: {
      type: Boolean,
      default: false
    },

    // Email metadata (populated when email is received)
    emailMetadata: {
      from: String,
      subject: String,
      messageId: String,
      receivedAt: Date
    },

    // Legacy fields (for backward compatibility if needed)
    imgUrl: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("ReportIssue", reportIssueSchema);

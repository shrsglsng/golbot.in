import mongoose from "mongoose";

// Schema for order status history tracking
const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["PENDING", "PAID", "READY", "PREPARING", "COMPLETED", "CANCELLED"],
    required: true
  },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: String }, // user/system/machine/admin
  reason: { type: String }, // Optional reason for status change
  metadata: { type: mongoose.Schema.Types.Mixed } // Additional context data
}, { _id: false });

const orderSchema = new mongoose.Schema({
  uid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  machineId: { type: mongoose.Schema.Types.ObjectId, ref: "Machine" },
  amount: {
    price: { type: Number },
    gst: { type: Number },
    total: { type: Number },
  },
  orderStatus: {
    type: String,
    enum: ["PENDING", "PAID", "READY", "PREPARING", "COMPLETED", "CANCELLED"],
    default: "PENDING",
  },
  orderCompleted: { type: Boolean, default: false },
  // Order OTP for pickup
  orderOtp: { type: String },
  paidAt: { type: Date },
  // Status history tracking
  statusHistory: [statusHistorySchema],
  // Additional tracking fields
  estimatedCompletionTime: { type: Date },
  actualCompletionTime: { type: Date }
}, { timestamps: true });

// Pre-save middleware to track status changes
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    // For new orders, add initial status to history
    this.statusHistory = [{
      status: this.orderStatus,
      changedAt: new Date(),
      changedBy: 'system',
      reason: 'Order created'
    }];
  } else if (this.isModified('orderStatus')) {
    // For status updates, add to history
    this.statusHistory.push({
      status: this.orderStatus,
      changedAt: new Date(),
      changedBy: 'system', // This can be overridden by setting it before save
      reason: this._statusChangeReason || 'Status updated'
    });
  }
  next();
});

// Method to update status with history tracking
orderSchema.methods.updateStatus = function(newStatus, changedBy = 'system', reason = '', metadata = {}) {
  this._statusChangeReason = reason;
  this._statusChangedBy = changedBy;
  this._statusChangeMetadata = metadata;
  
  this.orderStatus = newStatus;
  
  // Add specific timestamps for important status changes
  if (newStatus === 'PAID') {
    this.paidAt = new Date();
  } else if (newStatus === 'COMPLETED') {
    this.actualCompletionTime = new Date();
    this.orderCompleted = true;
  }
  
  return this.save();
};

// Method to get current status info
orderSchema.methods.getCurrentStatusInfo = function() {
  const currentHistory = this.statusHistory[this.statusHistory.length - 1];
  return {
    status: this.orderStatus,
    changedAt: currentHistory?.changedAt,
    changedBy: currentHistory?.changedBy,
    reason: currentHistory?.reason
  };
};

// Method to get status history
orderSchema.methods.getStatusHistory = function() {
  return this.statusHistory.sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt));
};

export default mongoose.model("Order", orderSchema);

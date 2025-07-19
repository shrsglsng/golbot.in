import mongoose from "mongoose";

// Schema for payment status history tracking
const paymentStatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILURE", "CANCELLED", "REFUNDED"],
    required: true
  },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: String }, // user/system/webhook/admin
  reason: { type: String }, // Optional reason for status change
  metadata: { type: mongoose.Schema.Types.Mixed }, // Additional context data
  // Razorpay specific fields for this status change
  razorpayData: {
    paymentId: { type: String },
    orderId: { type: String },
    signature: { type: String },
    method: { type: String }, // card, netbanking, wallet, upi
    bank: { type: String },
    wallet: { type: String },
    vpa: { type: String },
    errorCode: { type: String },
    errorDescription: { type: String }
  }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  // Razorpay identifiers
  razorpayorderId: { type: String, required: true },
  razorpaypaymentId: { type: String }, // Set when payment is attempted
  signature: { type: String }, // Set when payment is verified
  // Payment details
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  // Current status
  status: { 
    type: String, 
    enum: ["PENDING", "SUCCESS", "FAILURE", "CANCELLED", "REFUNDED"],
    default: "PENDING"
  },
  verified: { type: Boolean, default: false },
  source: { type: String, required: true }, // server, webhook, manual
  // Payment history tracking
  statusHistory: [paymentStatusHistorySchema],
  // Additional tracking fields
  receipt: { type: String },
  verifiedAt: { type: Date },
  failedAt: { type: Date },
  refundedAt: { type: Date },
  // Payment method details (filled after successful payment)
  paymentMethod: { type: String }, // card, netbanking, wallet, upi
  paymentDetails: {
    bank: { type: String },
    wallet: { type: String },
    vpa: { type: String },
    last4: { type: String }, // Last 4 digits for card
    network: { type: String } // Visa, MasterCard, etc.
  },
  // Refund information
  refundInfo: {
    refundId: { type: String },
    refundAmount: { type: Number },
    refundReason: { type: String },
    refundedAt: { type: Date }
  }
}, { timestamps: true });

// Pre-save middleware to track status changes
paymentSchema.pre('save', function(next) {
  if (this.isNew) {
    // For new payments, add initial status to history
    this.statusHistory = [{
      status: this.status,
      changedAt: new Date(),
      changedBy: this.source || 'system',
      reason: 'Payment initiated',
      razorpayData: {
        orderId: this.razorpayorderId,
        paymentId: this.razorpaypaymentId
      }
    }];
  } else if (this.isModified('status')) {
    // For status updates, add to history
    const historyEntry = {
      status: this.status,
      changedAt: new Date(),
      changedBy: this._statusChangedBy || 'system',
      reason: this._statusChangeReason || 'Status updated',
      metadata: this._statusChangeMetadata || {},
      razorpayData: {}
    };
    
    // Add relevant Razorpay data based on status
    if (this.status === 'SUCCESS') {
      historyEntry.razorpayData = {
        paymentId: this.razorpaypaymentId,
        orderId: this.razorpayorderId,
        signature: this.signature,
        method: this.paymentMethod,
        bank: this.paymentDetails?.bank,
        wallet: this.paymentDetails?.wallet,
        vpa: this.paymentDetails?.vpa
      };
    } else if (this.status === 'FAILURE') {
      historyEntry.razorpayData = {
        paymentId: this.razorpaypaymentId,
        orderId: this.razorpayorderId,
        errorCode: this._errorCode,
        errorDescription: this._errorDescription
      };
    }
    
    this.statusHistory.push(historyEntry);
  }
  next();
});

// Method to update status with history tracking
paymentSchema.methods.updateStatus = function(newStatus, changedBy = 'system', reason = '', metadata = {}, razorpayData = {}) {
  this._statusChangeReason = reason;
  this._statusChangedBy = changedBy;
  this._statusChangeMetadata = metadata;
  
  // Set error info if it's a failure
  if (razorpayData.errorCode) {
    this._errorCode = razorpayData.errorCode;
    this._errorDescription = razorpayData.errorDescription;
  }
  
  this.status = newStatus;
  
  // Add specific timestamps for important status changes
  if (newStatus === 'SUCCESS') {
    this.verified = true;
    this.verifiedAt = new Date();
  } else if (newStatus === 'FAILURE') {
    this.failedAt = new Date();
  } else if (newStatus === 'REFUNDED') {
    this.refundedAt = new Date();
  }
  
  return this.save();
};

// Method to get current status info
paymentSchema.methods.getCurrentStatusInfo = function() {
  const currentHistory = this.statusHistory[this.statusHistory.length - 1];
  return {
    status: this.status,
    verified: this.verified,
    changedAt: currentHistory?.changedAt,
    changedBy: currentHistory?.changedBy,
    reason: currentHistory?.reason,
    paymentMethod: this.paymentMethod
  };
};

// Method to get payment history
paymentSchema.methods.getPaymentHistory = function() {
  return this.statusHistory.sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt));
};

// Method to check if payment can be refunded
paymentSchema.methods.canBeRefunded = function() {
  return this.status === 'SUCCESS' && this.verified && !this.refundInfo?.refundId;
};

export default mongoose.model("Payment", paymentSchema);

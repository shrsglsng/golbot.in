# Status History Tracking Implementation

## Overview

This implementation adds comprehensive status history tracking to both Orders and Payments, eliminating the need for creating multiple documents for different states. Now each order and payment document maintains a complete history of all status changes.

## Key Changes

### 1. Order Model Enhancements

**New Features:**
- `statusHistory` array: Tracks all status changes with timestamps, actors, and reasons
- `updateStatus()` method: Properly updates status with history tracking
- `getCurrentStatusInfo()` method: Gets current status information
- `getStatusHistory()` method: Returns chronologically sorted status history
- Additional tracking fields: `estimatedCompletionTime`, `actualCompletionTime`, `paidAt`

**Status History Schema:**
```javascript
{
  status: String, // Current status
  changedAt: Date, // When the change occurred
  changedBy: String, // Who made the change (user/system/machine/admin)
  reason: String, // Reason for the change
  metadata: Object // Additional context data
}
```

### 2. Payment Model Enhancements

**New Features:**
- `statusHistory` array: Tracks all payment state changes
- `updateStatus()` method: Updates status with Razorpay data tracking
- `getCurrentStatusInfo()` method: Gets current payment status
- `getPaymentHistory()` method: Returns payment history
- `canBeRefunded()` method: Checks if payment can be refunded
- Enhanced Razorpay data tracking in history
- Refund information tracking

**Payment Status History Schema:**
```javascript
{
  status: String, // Payment status
  changedAt: Date, // When the change occurred
  changedBy: String, // Who made the change
  reason: String, // Reason for the change
  metadata: Object, // Additional context
  razorpayData: { // Razorpay-specific data for this state
    paymentId: String,
    orderId: String,
    signature: String,
    method: String,
    bank: String,
    wallet: String,
    vpa: String,
    errorCode: String,
    errorDescription: String
  }
}
```

## Usage Examples

### Updating Order Status
```javascript
// Instead of: await Order.findByIdAndUpdate(orderId, { orderStatus: "READY" })
// Use:
const order = await Order.findById(orderId);
await order.updateStatus(
  "READY",
  "admin:12345",
  "Order preparation completed",
  { completedBy: "kitchen-staff", estimatedReady: new Date() }
);
```

### Updating Payment Status
```javascript
// Instead of creating new payment documents
// Update existing payment:
const payment = await Payment.findById(paymentId);
await payment.updateStatus(
  "SUCCESS",
  "razorpay_webhook",
  "Payment verified successfully",
  { webhookEvent: "payment.captured" },
  { paymentId: razorpayPaymentId, method: "card", bank: "HDFC" }
);
```

### Getting Status History
```javascript
// Get order timeline
const order = await Order.findById(orderId);
const timeline = order.getStatusHistory();

// Get payment history
const payment = await Payment.findById(paymentId);
const history = payment.getPaymentHistory();
```

## Controller Updates

### 1. Order Controller
- Uses `order.updateStatus()` instead of direct updates
- Maintains existing API compatibility
- Enhanced logging with status history context

### 2. Payment Controller
- Updates existing payment records instead of creating duplicates
- Proper status tracking for all payment state changes
- Maintains transaction integrity

### 3. Machine Controller
- Uses new status update methods for order progression
- Better tracking of machine-initiated status changes

### 4. Admin Controller (New)
- `PUT /admin/orders/:orderId/status` - Manual order status updates
- `GET /admin/orders/:orderId/history` - Get order status timeline
- `PUT /admin/payments/:paymentId/status` - Manual payment status updates
- `GET /admin/payments/:paymentId/history` - Get payment history

## Migration

### Automatic Migration
Run the migration script to add status history to existing documents:

```bash
cd server
node scripts/migrate-status-history.js
```

### Manual Migration
Use the helper functions:

```javascript
import { migrateOrderStatusHistory, migratePaymentStatusHistory } from './utils/migrationHelpers.js';

// Migrate all orders
await migrateOrderStatusHistory();

// Migrate all payments
await migratePaymentStatusHistory();
```

## Admin Dashboard Integration

### Order Management
```javascript
// Update order to READY status
PUT /admin/orders/60f7b3b3b3b3b3b3b3b3b3b3/status
{
  "status": "READY",
  "reason": "Food preparation completed"
}

// Get order timeline
GET /admin/orders/60f7b3b3b3b3b3b3b3b3b3b3/history
```

### Payment Management
```javascript
// Process refund
PUT /admin/payments/60f7b3b3b3b3b3b3b3b3b3b4/status
{
  "status": "REFUNDED",
  "reason": "Customer requested refund",
  "refundInfo": {
    "refundId": "rfnd_xyz123",
    "amount": 150.00,
    "reason": "Order cancelled by customer"
  }
}
```

## Benefits

1. **Single Source of Truth**: Each order/payment has one document with complete history
2. **Better Debugging**: Full audit trail of all status changes
3. **Enhanced Analytics**: Track status change patterns and timing
4. **Improved Admin Control**: Manual status management with proper tracking
5. **Better Error Handling**: Detailed context for each state change
6. **Compliance**: Full audit trail for financial transactions

## Database Indexes

Recommended indexes for optimal performance:

```javascript
// Orders
db.orders.createIndex({ "uid": 1, "orderStatus": 1 })
db.orders.createIndex({ "machineId": 1, "orderStatus": 1 })
db.orders.createIndex({ "statusHistory.changedAt": -1 })

// Payments
db.payments.createIndex({ "orderId": 1, "status": 1 })
db.payments.createIndex({ "razorpayorderId": 1 })
db.payments.createIndex({ "statusHistory.changedAt": -1 })
```

## Backward Compatibility

- All existing API endpoints remain unchanged
- Existing queries continue to work
- New history fields are added without affecting current functionality
- Migration script ensures existing data gets proper status history

## Monitoring and Logging

Enhanced logging now includes:
- Status change events with full context
- Actor identification (user/system/admin/machine)
- Reason tracking for all changes
- Metadata preservation for debugging

Example log entries:
```
Order status updated: orderId=123, oldStatus=PAID, newStatus=READY, changedBy=admin:456, reason="Food ready for pickup"
Payment verified: paymentId=789, status=SUCCESS, method=card, bank=HDFC, amount=150.00
```

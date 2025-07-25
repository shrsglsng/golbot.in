# New Order Flow Implementation

## Overview
This document outlines the new order status flow that provides more granular tracking from payment to food delivery.

## New Order States

### 1. PENDING
- **When**: Order created, payment not yet completed
- **User sees**: Payment page, needs to complete payment
- **Machine**: Not involved yet

### 2. PAID
- **When**: Payment successful, OTP generated
- **User sees**: QR code page with message "Payment Confirmed! Scan to start preparation"
- **Machine**: Waiting for OTP scan
- **API Endpoint**: Order gets `orderCounter` assigned via global serial number

### 3. OTP_VERIFIED
- **When**: OTP scanned/entered on machine
- **User sees**: "Order Verified! Machine is starting preparation..."
- **Machine**: Immediately transitions to PREPARING
- **Duration**: Very brief transition state

### 4. PREPARING
- **When**: Machine actively preparing food
- **User sees**: "Preparing your order" with cooking animation
- **Machine**: Shows preparation progress
- **Duration**: ~10 seconds (configurable)

### 5. READY_FOR_PICKUP
- **When**: Food preparation complete, ready for collection
- **User sees**: "Order Ready! Please collect from machine"
- **Machine**: Shows "Food Ready!" with "Dispense Food" button
- **API Endpoint**: `/machine/ready-for-pickup`

### 6. COMPLETED
- **When**: Food dispensed/collected
- **User sees**: Receipt page
- **Machine**: Returns to home screen
- **API Endpoint**: `/machine/plate-dispensed`

### 7. CANCELLED
- **When**: Order cancelled by user/admin/system
- **User sees**: Cancellation message
- **Machine**: Returns to idle state

## API Changes

### New Endpoints

#### 1. Mark Order Ready for Pickup
```
POST /machine/ready-for-pickup
Body: { "mid": "M123" }
```
- Transitions order from PREPARING → READY_FOR_PICKUP
- Updates machine status to indicate food is ready

#### 2. Plate Dispensed (Updated)
```
POST /machine/plate-dispensed
Body: { "oid": "order_id", "mid": "M123" }
```
- Transitions order from READY_FOR_PICKUP → COMPLETED
- Marks order as completed and machine as idle

### Updated Endpoints

#### 1. Payment Webhook
- Now sets status to `PAID` instead of `READY`
- Assigns global order counter (serial number)

#### 2. Machine Start
- Accepts orders with status `PAID` instead of `READY`
- Creates two status updates: `OTP_VERIFIED` → `PREPARING`

#### 3. Get Order OTP
- Only allows for orders with status `PAID`
- Updated error messages for all states

## Database Changes

### Order Model Updates
```javascript
// New enum values
orderStatus: {
  enum: ["PENDING", "PAID", "OTP_VERIFIED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED", "CANCELLED"]
}

// New timestamp fields
otpVerifiedAt: Date
preparingStartedAt: Date  
readyForPickupAt: Date
```

### Status History Tracking
- All status changes are automatically tracked with timestamps
- Includes metadata about who/what triggered the change

## User Experience Improvements

### Web Application
- **QR Page**: Updated to show "Payment Confirmed!" with clearer instructions
- **Preparing Page**: Dynamic status messages based on current order state
- **Color-coded indicators**: Blue for verified, Orange for preparing, Green for ready

### Mobile APK (Machine)
- **Three-state UI**: Preparing → Ready for Pickup → Completed
- **Manual dispense control**: Operator can trigger food dispensing
- **Proper API integration**: Calls backend for status updates

## Flow Diagram

```
Order Created (PENDING)
        ↓
Payment Completed (PAID) → QR Code Generated + Counter Assigned
        ↓
OTP Scanned (OTP_VERIFIED) → Brief transition state
        ↓
Machine Starts (PREPARING) → User sees preparation progress
        ↓
Food Ready (READY_FOR_PICKUP) → Machine shows "Dispense" button
        ↓
Food Dispensed (COMPLETED) → Order complete, machine idle
```

## Benefits

1. **Clear Status Tracking**: Each stage has a distinct state
2. **Better User Experience**: Users know exactly what's happening
3. **Machine Control**: Operators have clear action points
4. **Accurate Analytics**: Better data for order fulfillment metrics
5. **Error Handling**: More specific error messages for each state

## Migration Notes

- Existing orders with old states will continue to work
- New orders will use the enhanced flow
- All API responses include the new status values
- Frontend components handle both old and new states gracefully

## Testing Checklist

- [ ] Create order → Payment → PAID status
- [ ] QR code generation and display
- [ ] OTP scan → OTP_VERIFIED → PREPARING transition
- [ ] Machine preparation simulation
- [ ] Ready for pickup → Manual dispense
- [ ] Completed order → Machine returns to idle
- [ ] Status history tracking
- [ ] Error handling for invalid states

# QR Page Flow Implementation

## Overview
The QR page flow has been implemented to provide a seamless experience from order placement to completion. This document outlines the complete flow and all the components involved.

## Complete Flow

### 1. Order Placement (`checkout.tsx`)
- User adds items to cart and clicks "Confirm Order"
- `placeOrder()` function creates an order with status "PENDING"
- Order gets a 6-digit OTP generated at creation time
- Razorpay payment gateway is initialized

### 2. Payment Processing (`paymentController.js`)
- User completes payment via Razorpay
- Payment verification endpoint (`/api/v1/payment/verify`) is called
- Upon successful verification:
  - Order status is updated to "READY" (ready for pickup)
  - OTP is regenerated for security
  - Payment details are saved

### 3. Payment Success Redirect (`success.tsx`)
- After successful payment verification, user is redirected to payment success page
- After 2 seconds, automatically redirects to `/${mid}/qrPage`

### 4. QR Code Display (`qrPage.tsx`)
- **Initialization**: Calls `getOrderOtp()` to fetch order details
- **QR Code Generation**: Creates QR code containing:
  ```json
  {
    "otp": "123456",
    "orderId": "order_id",
    "timestamp": 1643723400000
  }
  ```
- **Visual Display**: Shows both QR code and 6-digit OTP for manual entry
- **Status Polling**: Every 3 seconds, calls `getIsOrderPreparing()` to check if order has started
- **Auto-redirect**: When order status changes to "PREPARING", redirects to receipt page

### 5. Machine Scanning (`scannerScreen.dart`)
- Machine's Flutter app scans the QR code
- Extracts OTP from JSON data
- Calls `/api/v1/machine/startmachine` endpoint with OTP and machine ID

### 6. Machine Processing (`machineController.js`)
- **Validation**: Verifies OTP, machine ID, and order status
- **Order Update**: Changes order status from "READY" to "PREPARING"
- **Machine Status**: Updates machine status to "PREPARING"
- **Response**: Sends confirmation back to Flutter app
- **OTP Clearing**: Clears the OTP after successful use

### 7. Order Preparation (`preparingOrder.tsx`)
- User is redirected here when QR is scanned and order starts preparing
- Shows cooking animation and status updates
- Polls `getIsOrderPreparing()` every 5 seconds
- When order is complete (status no longer "PREPARING"), redirects to receipt page

### 8. Order Completion (`receipt.tsx`)
- Shows final receipt with order summary
- Displays success message and order details
- Clears cart and order from Redux store
- Provides option to order again
- Auto-redirects to main page with success notification after 30 seconds

## API Endpoints

### User Endpoints
- `POST /api/v1/order` - Create new order
- `GET /api/v1/order/otp` - Get order with OTP (for QR page)
- `GET /api/v1/order/preparing` - Check if order is being prepared
- `POST /api/v1/payment/create-order` - Create Razorpay order
- `POST /api/v1/payment/verify` - Verify payment

### Machine Endpoints
- `POST /api/v1/machine/startmachine` - Start machine with OTP
- `POST /api/v1/machine/start` - Alternative endpoint (for compatibility)

## Order Status Flow
```
PENDING → READY → PREPARING → COMPLETED
    ↑        ↑         ↑          ↑
  Created  Payment   Machine   Order
          Verified   Started   Complete
```

## Key Features Implemented

### Error Handling
- Authentication errors redirect to login
- Invalid OTP shows error message
- Network errors show user-friendly messages
- Missing orders redirect to main page

### Security
- OTP is regenerated after payment for security
- OTP is cleared after machine use
- Timing-safe OTP comparison
- User ownership validation for orders

### User Experience
- Real-time status updates via polling
- Visual feedback with animations
- Clear error messages and recovery options
- Auto-redirects to prevent user confusion
- Mobile-responsive design

### Performance
- Efficient polling with cleanup
- Page visibility handling to pause/resume polling
- Proper memory cleanup in useEffect

## Files Modified/Created

### Frontend (user_web)
- `pages/[mid]/qrPage.tsx` - Enhanced QR page with better error handling
- `pages/[mid]/payment/[txnId]/success.tsx` - Updated redirect to QR page
- `pages/[mid]/preparingOrder.tsx` - Improved preparation tracking
- `pages/[mid]/receipt.tsx` - Enhanced receipt display

### Backend (server)
- `controllers/paymentController.js` - Updated to set READY status
- `controllers/machineController.js` - Fixed response format for Flutter
- `routes/machineRoutes.js` - Added /startmachine endpoint

### Mobile App (machine_apk)
- No changes needed - already properly implemented

## Testing the Flow

1. **Place Order**: Add items to cart and checkout
2. **Complete Payment**: Use test payment credentials
3. **View QR**: Should redirect to QR page with code
4. **Scan QR**: Use machine app to scan QR code
5. **Track Preparation**: Should redirect to preparation screen
6. **Complete Order**: Should show receipt and completion

## Error Scenarios Handled

- Payment failure → Redirect to failed page
- Invalid OTP → Show error message on machine
- Network issues → Show retry options
- Authentication issues → Redirect to login
- Missing orders → Redirect to main page
- Machine unavailable → Show error message

This implementation provides a robust, user-friendly QR code ordering system with proper error handling and security measures.

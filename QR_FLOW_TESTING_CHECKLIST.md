# QR Flow Testing Checklist

## End-to-End Flow Verification

### ✅ **Phase 1: Order Placement & Payment**
- [ ] User can add items to cart
- [ ] User can proceed to checkout
- [ ] Order is created with PENDING status
- [ ] Razorpay payment gateway opens
- [ ] Payment can be completed successfully
- [ ] Order status changes to READY after payment
- [ ] OTP is generated and stored

### ✅ **Phase 2: QR Code Display**
- [ ] User is redirected to QR page after payment success
- [ ] QR code is generated with correct OTP data
- [ ] 6-digit OTP is displayed visually
- [ ] Page polls for order status every 3 seconds
- [ ] Error handling works for missing orders
- [ ] Loading states are shown appropriately

### ✅ **Phase 3: Machine Integration**
- [ ] Machine can scan QR code successfully
- [ ] OTP is extracted from QR JSON correctly
- [ ] `/api/v1/machine/startmachine` endpoint responds
- [ ] Order status changes from READY to PREPARING
- [ ] Machine status is updated
- [ ] OTP is cleared after successful scan

### ✅ **Phase 4: Order Preparation**
- [ ] User is redirected to preparing page when scan occurs
- [ ] Cooking animation is displayed
- [ ] Page polls for preparation status
- [ ] User is redirected to receipt when preparation complete
- [ ] Error handling for network issues

### ✅ **Phase 5: Receipt & Completion**
- [ ] Receipt page shows order summary correctly
- [ ] All items and prices are displayed
- [ ] Order total matches payment amount
- [ ] Cart and order are cleared from Redux
- [ ] "Order Again" button works
- [ ] Auto-redirect to main page after 30 seconds
- [ ] Success notification appears on main page

## Security & Error Handling Tests

### 🔒 **Security**
- [ ] OTP regeneration after payment
- [ ] OTP clearing after machine use
- [ ] User authentication required for all endpoints
- [ ] Order ownership validation

### ⚠️ **Error Scenarios**
- [ ] Payment failure handling
- [ ] Invalid OTP on machine
- [ ] Network timeouts
- [ ] Missing order data
- [ ] Machine unavailable
- [ ] Authentication errors

## Performance & UX Tests

### ⚡ **Performance**
- [ ] Polling intervals are reasonable (3-5 seconds)
- [ ] Page visibility handling works
- [ ] Memory leaks are prevented with cleanup
- [ ] No infinite loops in polling

### 🎨 **User Experience**
- [ ] Loading states are informative
- [ ] Error messages are user-friendly
- [ ] Responsive design works on mobile
- [ ] Animations are smooth
- [ ] Navigation is intuitive

## API Endpoint Tests

### 📡 **User Endpoints**
- [ ] `POST /api/v1/order` - Creates order
- [ ] `GET /api/v1/order/otp` - Returns order with OTP
- [ ] `GET /api/v1/order/preparing` - Returns preparation status
- [ ] `POST /api/v1/payment/verify` - Verifies payment

### 🤖 **Machine Endpoints**
- [ ] `POST /api/v1/machine/startmachine` - Starts machine
- [ ] Proper response format for Flutter app
- [ ] Error handling for invalid OTP

## Status Flow Verification

```
PENDING → READY → PREPARING → COMPLETED
    ↑        ↑         ↑          ↑
  Created  Payment   Machine   Manual
          Verified   Started   Complete
```

### 📊 **Status Transitions**
- [ ] PENDING → READY (after payment)
- [ ] READY → PREPARING (after machine scan)
- [ ] PREPARING → COMPLETED (manual/automatic)

## Redux State Management

### 🗄️ **State Cleanup**
- [ ] Cart is cleared after order completion
- [ ] Order is cleared after receipt viewing
- [ ] No stale data remains between orders
- [ ] New orders start with clean state

## Mobile App Integration

### 📱 **Flutter App**
- [ ] QR scanning works correctly
- [ ] OTP extraction from JSON works
- [ ] API communication is successful
- [ ] Error messages are displayed
- [ ] Order data is received properly

---

## Ready for Production? ✨

When all checkboxes are complete, the QR flow is fully functional and ready for production use. The implementation provides:

- **Seamless user experience** from order to completion
- **Robust error handling** for all edge cases  
- **Secure OTP management** with regeneration and clearing
- **Clean state management** with proper Redux cleanup
- **Professional UI/UX** with loading states and animations
- **Mobile-first design** that works across devices

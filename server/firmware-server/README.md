# Firmware API

The Firmware API provides endpoints for ESP32/firmware devices to interact with the Golbot order management system. It runs integrated within the main server and provides a stateless, transaction-based API for order processing.

**Note**: This API is maintained by the firmware team and kept organizationally separate from the main API for code management purposes.

## Architecture

- **Location**: `/server/firmware-server` (integrated into main server)
- **Integration**: Routes are mounted at `/api/firmware` on the main Express app
- **Port**: Same as main server (5000 by default) - runs together
- **Database**: Shared MongoDB connection with main server
- **Dependencies**: Uses server's node_modules (no separate dependencies)
- **Authentication**: Machine credentials (mid + password)
- **Processing Mode**: One order per machine at a time
- **Disaster Recovery**: Supports state recovery through status polling

## Project Structure

```
golbot.in/
├── server/                    # Main API server (port 5000)
│   ├── firmware-server/       # Firmware API (integrated) ← THIS DIRECTORY
│   │   ├── controllers/
│   │   │   └── firmwareController.js
│   │   ├── middlewares/
│   │   │   └── firmwareAuth.js
│   │   ├── routes/
│   │   │   └── firmwareRoutes.js    # Mounted at /api/firmware
│   │   ├── package.json
│   │   └── README.md
│   ├── models/               # Shared models
│   ├── utils/                # Shared utilities
│   ├── middlewares/          # Shared middlewares
│   ├── server.js             # Main server (includes firmware routes)
│   └── ecosystem.config.cjs  # PM2 configuration
├── admin_web/
├── user_web/
└── flutter_application_1/
```

## Getting Started

### Installation

The firmware API is integrated into the main server. No separate installation needed.

```bash
# Install dependencies (from server directory)
cd server
npm install
```

### Development

The firmware API runs automatically when you start the main server:

```bash
# Start the main server (includes firmware API)
cd server
npm run dev

# The firmware API will be available at:
# http://localhost:5000/api/firmware
```

### Staging

```bash
cd server
pm2 start ecosystem.config.cjs --only golbot-api-stage
```

### Production

```bash
cd server
pm2 start ecosystem.config.cjs --only golbot-api-prod
```

## Authentication

All firmware API endpoints require machine authentication. Two methods are supported:

### Method 1: Headers (Recommended)

```http
X-Machine-ID: M01
X-Machine-Password: your_machine_password
```

### Method 2: Query Parameters

```http
GET /api/firmware/orders/next?mid=M01&password=your_machine_password
```

## API Endpoints

Base URL: `http://localhost:5000/api/firmware` (development)

### 1. Poll for Next Order

Get the next pending order for this machine.

**Endpoint**: `GET /orders/next`

**Query Parameters**:
- `mid` (optional): Machine ID (can be in headers instead)

**Response**:
```json
{
  "success": true,
  "data": {
    "hasOrder": true,
    "order": {
      "orderId": "64abc123...",
      "orderOtp": "1234",
      "orderCounter": 42,
      "items": [
        {
          "itemId": "...",
          "name": "Pani Puri",
          "quantity": 2,
          "puriPerPlate": 6
        }
      ],
      "amount": {
        "total": 40,
        "tax": 0,
        "subtotal": 40
      }
    }
  }
}
```

**No orders available**:
```json
{
  "success": true,
  "data": {
    "hasOrder": false
  }
}
```

---

### 2. Start Order Preparation

Begin preparing an order. This transitions the order from `PAID` → `PREPARING` and deducts puris from machine inventory.

**Endpoint**: `POST /orders/:orderId/start`

**Headers**: Authentication required

**Body**:
```json
{
  "mid": "M01"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Order preparation started",
  "data": {
    "orderId": "64abc123...",
    "status": "PREPARING",
    "purisDeducted": 12
  }
}
```

**Error Cases**:
- Order not found
- Order already started
- Insufficient puris
- Machine puri quantity validation failed

---

### 3. Mark Order Ready for Pickup

Mark order as ready. Transitions from `PREPARING` → `READY_FOR_PICKUP`.

**Endpoint**: `POST /orders/:orderId/ready`

**Headers**: Authentication required

**Body**:
```json
{
  "mid": "M01"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Order marked as ready for pickup",
  "data": {
    "orderId": "64abc123...",
    "status": "READY_FOR_PICKUP"
  }
}
```

---

### 4. Complete Order

Mark order as completed. Transitions from `READY_FOR_PICKUP` → `COMPLETED`.

**Endpoint**: `POST /orders/:orderId/complete`

**Headers**: Authentication required

**Body**:
```json
{
  "mid": "M01"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Order completed successfully",
  "data": {
    "orderId": "64abc123...",
    "status": "COMPLETED"
  }
}
```

---

### 5. Cancel Order

Cancel an order and refund puris if applicable.

**Endpoint**: `POST /orders/:orderId/cancel`

**Headers**: Authentication required

**Body**:
```json
{
  "mid": "M01",
  "reason": "Dispenser error - plate jam"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Order cancelled and puris refunded",
  "data": {
    "orderId": "64abc123...",
    "status": "CANCELLED",
    "purisRefunded": 12
  }
}
```

---

### 6. Get Machine Status

Get current machine status and active order (for disaster recovery).

**Endpoint**: `GET /machine/status`

**Query Parameters**:
- `mid` (optional): Machine ID

**Response**:
```json
{
  "success": true,
  "data": {
    "machineId": "M01",
    "status": "PREPARING",
    "currentOrder": {
      "orderId": "64abc123...",
      "orderOtp": "1234",
      "status": "PREPARING",
      "items": [...]
    },
    "puriQuantity": 88,
    "lowQuantityThreshold": 30,
    "isLowStock": false
  }
}
```

**No active order**:
```json
{
  "success": true,
  "data": {
    "machineId": "M01",
    "status": "CONNECTED",
    "currentOrder": null,
    "puriQuantity": 100,
    "lowQuantityThreshold": 30,
    "isLowStock": false
  }
}
```

---

### 7. Send Heartbeat

Send periodic heartbeat to update machine status.

**Endpoint**: `POST /heartbeat`

**Headers**: Authentication required

**Body**:
```json
{
  "mid": "M01",
  "status": "IDLE",
  "firmwareVersion": "1.0.0"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Heartbeat received",
  "data": {
    "received": true,
    "timestamp": "2025-01-23T10:30:00.000Z"
  }
}
```

---

### 8. Log Firmware Error

Log errors from firmware for debugging and monitoring.

**Endpoint**: `POST /error`

**Headers**: Authentication required

**Body**:
```json
{
  "mid": "M01",
  "errorCode": "DISPENSER_JAM",
  "errorMessage": "Motor stalled at position 3",
  "orderId": "64abc123...",
  "severity": "ERROR"
}
```

**Severity Levels**: `WARNING`, `ERROR`, `CRITICAL`

**Response**:
```json
{
  "success": true,
  "message": "Error logged successfully"
}
```

---

## Order Status Flow

```
PAID → PREPARING → READY_FOR_PICKUP → COMPLETED
  ↓         ↓              ↓
  └─────────┴──────────────┴────────→ CANCELLED
```

### Status Transitions

1. **PAID**: Order paid by customer, waiting in queue
2. **PREPARING**: Firmware has started preparation, puris deducted
3. **READY_FOR_PICKUP**: Food ready, waiting for pickup/dispensing
4. **COMPLETED**: Plate dispensed, order complete
5. **CANCELLED**: Order cancelled, puris refunded (if applicable)

## Puri Management

### Deduction Logic

When an order starts (`POST /orders/:orderId/start`):
1. Calculate total puris needed: `sum(item.quantity * item.puriPerPlate)`
2. Check machine has sufficient puris
3. Deduct puris atomically in transaction
4. If transaction fails, order is not started

### Refund Logic

When an order is cancelled (`POST /orders/:orderId/cancel`):
- If order status is `PREPARING` or `READY_FOR_PICKUP`: Refund puris
- If order status is `PAID`: No refund needed (puris not yet deducted)
- If order status is `COMPLETED`: Cannot cancel

## Disaster Recovery

The firmware API supports disaster recovery through the status endpoint:

### On APK/Firmware Startup:

1. Check local storage for pending order ID
2. Call `GET /machine/status` to verify with server
3. If server confirms active order:
   - Resume from current state
   - Continue auto-progression
4. If no active order on server:
   - Clear local storage
   - Start polling for new orders

### Implementation Example (Flutter/APK):

```dart
// On login/startup
final status = await firmwareService.getMachineStatus(machineId);

if (status['currentOrder'] != null) {
  // Resume order
  navigateToPreparingScreen(
    orderOtp: status['currentOrder']['orderOtp'],
    isAutoMode: true,
  );
} else {
  // Clear local storage and start polling
  await storageService.clearCurrentOrder();
  navigateToHomeScreen();
}
```

## Error Handling

### Common Error Responses

**Authentication Failed** (401):
```json
{
  "success": false,
  "message": "Invalid machine credentials"
}
```

**Insufficient Puris** (400):
```json
{
  "success": false,
  "message": "Insufficient puris. Required: 12, Available: 8"
}
```

**Invalid State Transition** (400):
```json
{
  "success": false,
  "message": "Cannot mark order ready. Current status: PAID (expected: PREPARING)"
}
```

**Order Not Found** (404):
```json
{
  "success": false,
  "message": "Order not found"
}
```

## Testing with cURL

### Poll for orders
```bash
curl -X GET "http://localhost:5000/api/firmware/orders/next?mid=M01" \
  -H "X-Machine-ID: M01" \
  -H "X-Machine-Password: your_password"
```

### Start preparation
```bash
curl -X POST "http://localhost:5000/api/firmware/orders/ORDER_ID/start" \
  -H "X-Machine-ID: M01" \
  -H "X-Machine-Password: your_password" \
  -H "Content-Type: application/json" \
  -d '{"mid": "M01"}'
```

### Mark ready
```bash
curl -X POST "http://localhost:5000/api/firmware/orders/ORDER_ID/ready" \
  -H "X-Machine-ID: M01" \
  -H "X-Machine-Password: your_password" \
  -H "Content-Type: application/json" \
  -d '{"mid": "M01"}'
```

### Complete order
```bash
curl -X POST "http://localhost:5000/api/firmware/orders/ORDER_ID/complete" \
  -H "X-Machine-ID: M01" \
  -H "X-Machine-Password: your_password" \
  -H "Content-Type: application/json" \
  -d '{"mid": "M01"}'
```

### Get machine status
```bash
curl -X GET "http://localhost:5000/api/firmware/machine/status?mid=M01" \
  -H "X-Machine-ID: M01" \
  -H "X-Machine-Password: your_password"
```

### Send heartbeat
```bash
curl -X POST "http://localhost:5000/api/firmware/heartbeat" \
  -H "X-Machine-ID: M01" \
  -H "X-Machine-Password: your_password" \
  -H "Content-Type: application/json" \
  -d '{
    "mid": "M01",
    "status": "IDLE",
    "firmwareVersion": "1.0.0"
  }'
```

## APK Mock Mode

The Flutter APK can be configured to act as firmware for testing:

### Configuration (`constants.dart`)

```dart
const bool FIRMWARE_MODE_ENABLED = true; // Enable firmware mock mode
const int ORDER_POLL_INTERVAL = 3; // Poll every 3 seconds
const int AUTO_READY_DELAY = 5; // Auto-ready after 5 seconds
const int AUTO_COMPLETE_DELAY = 3; // Auto-complete after 3 seconds
```

### Behavior in Firmware Mode

1. **HomeScreen**: Polls for orders every 3 seconds
2. **Auto-progression**:
   - Start → (5s) → Ready → (3s) → Complete
3. **Heartbeat**: Sends status every 30 seconds
4. **Disaster Recovery**: Resumes on login if order active
5. **Fallback Buttons**: Emergency controls if auto-progression fails

## Security Considerations

1. **Authentication**: All endpoints require valid machine credentials
2. **Transaction Safety**: Puri deductions use MongoDB transactions
3. **Idempotency**: State transitions validate current status before updating
4. **Rate Limiting**: Consider implementing rate limits for production
5. **HTTPS**: Use HTTPS in production environments

## Monitoring

### Health Check

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-01-23T10:30:00.000Z",
  "environment": "development"
}
```

### PM2 Monitoring

```bash
# View logs (firmware routes are in main server logs)
pm2 logs golbot-api-dev

# Monitor status
pm2 status

# Monitor metrics
pm2 monit
```

## Troubleshooting

### Firmware API not responding
- Ensure main server is running: `pm2 status`
- Check server logs: `pm2 logs golbot-api-dev`
- Verify MongoDB connection is successful
- Test with health endpoint: `curl http://localhost:5000/health`

### Authentication failures
- Verify machine credentials in database
- Check password is not hashed in request
- Ensure headers are properly set

### Puri deduction errors
- Verify item `puriPerPlate` values are set
- Check machine `puriQuantity` is sufficient
- Review transaction logs in MongoDB

### Order not found in poll
- Confirm order status is `PAID`
- Check order `mid` matches machine ID
- Verify order `deletedAt` is null

---

## Development Notes

- Server code: `server/firmware-server/`
- Routes: `server/firmware-server/routes/firmwareRoutes.js`
- Controllers: `server/firmware-server/controllers/firmwareController.js`
- Middleware: `server/firmware-server/middlewares/firmwareAuth.js`
- APK Service: `flutter_application_1/lib/services/firmwareService.dart`

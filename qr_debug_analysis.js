// QR Code Content Analysis
// When QR code is generated, it should contain JSON like this:

const qrCodeContent = {
  otp: "123456",           // 6-digit OTP from order
  orderId: "648d3061...",  // Order ID
  timestamp: 1753381304750 // Current timestamp
}

// When JSON.stringify() is applied:
const qrString = JSON.stringify(qrCodeContent);
// Result: {"otp":"123456","orderId":"648d3061...","timestamp":1753381304750}

// The timestamp 1753381304750 you saw suggests:
// 1. Either the QR code parsing failed and only timestamp was returned
// 2. Or the order.orderOtp was undefined/empty
// 3. Or there was an issue with the JSON structure

// DEBUGGING STEPS:
// 1. Check if orderOtp is actually present in the order object
// 2. Verify the complete JSON string in the QR code
// 3. Test QR parsing with known good data

// Expected QR Content for testing:
const testQR = JSON.stringify({
  otp: "123456",
  orderId: "test123",
  timestamp: Date.now()
});

console.log("Test QR Content:", testQR);

// If you're seeing only the timestamp (1753381304750), it means:
// - The OTP field is missing or undefined
// - JSON parsing in Flutter extracted only the timestamp
// - The QR generation had an issue with the order data

// SOLUTION: 
// 1. Add debug logging to see actual QR content
// 2. Ensure orderOtp is properly retrieved from API
// 3. Add validation before QR generation

// ADDITIONAL DEBUGGING TOOLS:

// 1. Test QR Parsing Function (for Flutter testing)
function parseQRCode(qrString) {
  try {
    console.log("Raw QR String:", qrString);
    const parsed = JSON.parse(qrString);
    console.log("Parsed QR Object:", parsed);
    console.log("Extracted OTP:", parsed.otp);
    console.log("Extracted Order ID:", parsed.orderId);
    console.log("Extracted Timestamp:", parsed.timestamp);
    return parsed;
  } catch (error) {
    console.error("QR Parsing Error:", error);
    return null;
  }
}

// 2. Generate Test QR Codes for testing
const validTestQR = JSON.stringify({
  otp: "123456",
  orderId: "test_order_123",
  timestamp: Date.now()
});

const invalidTestQR1 = JSON.stringify({
  // Missing OTP
  orderId: "test_order_123", 
  timestamp: Date.now()
});

const invalidTestQR2 = JSON.stringify({
  otp: "", // Empty OTP
  orderId: "test_order_123",
  timestamp: Date.now()
});

console.log("\n=== TEST QR CODES ===");
console.log("Valid QR:", validTestQR);
console.log("Invalid QR (missing OTP):", invalidTestQR1);
console.log("Invalid QR (empty OTP):", invalidTestQR2);

console.log("\n=== PARSING TESTS ===");
parseQRCode(validTestQR);
parseQRCode(invalidTestQR1);
parseQRCode(invalidTestQR2);
parseQRCode("1753381304750"); // Your scanned value

// 3. QR Code Validation Function
function validateQRContent(order) {
  console.log("\n=== QR VALIDATION ===");
  console.log("Order object:", order);
  console.log("Order OTP:", order?.orderOtp);
  console.log("Order ID:", order?.oid);
  
  if (!order) {
    console.error("❌ No order object provided");
    return false;
  }
  
  if (!order.orderOtp) {
    console.error("❌ Order OTP is missing or undefined");
    return false;
  }
  
  if (order.orderOtp.length !== 6) {
    console.error("❌ Order OTP is not 6 digits:", order.orderOtp);
    return false;
  }
  
  if (!order.oid) {
    console.error("❌ Order ID is missing");
    return false;
  }
  
  console.log("✅ QR content validation passed");
  return true;
}

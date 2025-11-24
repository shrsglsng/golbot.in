import 'package:flutter/material.dart';
import '../main.dart'; // Import to access appConfig

// ----------------------------------------------------------------
// Environment-based Configuration
// All values are now pulled from the active environment config
// ----------------------------------------------------------------

/// Base URL for main API endpoints
/// Source: appConfig.baseUrl
String get BASE_URL => appConfig.baseUrl;

/// Base URL for firmware-specific API endpoints
/// Source: appConfig.firmwareApiUrl
String get FIRMWARE_API_URL => appConfig.firmwareApiUrl;

/// API key for mobile app authentication
/// Source: appConfig.mobileApiKey
String get MOBILE_API_KEY => appConfig.mobileApiKey;

/// Enable firmware mock mode in APK
/// When true, APK acts like ESP32 firmware:
/// - Hides admin override buttons (except for fallback)
/// - Auto-polls for orders
/// - Auto-transitions through states
/// - Enables disaster recovery on startup
/// Source: appConfig.firmwareModeEnabled
bool get FIRMWARE_MODE_ENABLED => appConfig.firmwareModeEnabled;

/// Polling interval for checking new orders (in seconds)
/// Source: appConfig.orderPollInterval
int get ORDER_POLL_INTERVAL => appConfig.orderPollInterval;

/// Delay before marking order as READY_FOR_PICKUP after starting preparation
/// Simulates: Preparation time (cooking/dispensing)
/// Source: appConfig.autoReadyDelay
int get AUTO_READY_DELAY => appConfig.autoReadyDelay;

/// Delay before marking order as COMPLETED after ready for pickup
/// Simulates: Plate dispensing/pickup detection
/// Source: appConfig.autoCompleteDelay
int get AUTO_COMPLETE_DELAY => appConfig.autoCompleteDelay;

/// Heartbeat interval (in seconds)
/// How often to send status updates to firmware server
/// Source: appConfig.heartbeatInterval
int get HEARTBEAT_INTERVAL => appConfig.heartbeatInterval;

/// Firmware version identifier
/// Includes environment name for debugging
/// Source: appConfig.firmwareVersion
String get FIRMWARE_VERSION => appConfig.firmwareVersion;

// ----------------------------------------------------------------
// UI Constants (environment-independent)
// ----------------------------------------------------------------

const Color CPrimary = Colors.orange;
const Color CPrimaryLight = Color(0xFFFFCC80); // Orange.shade300 equivalent

// ----------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------

/// Debug logging utility
/// Only prints in environments with debug logs enabled
/// Use this instead of print() for development logs
void debugLog(String message) {
  if (appConfig.enableDebugLogs) {
    print('[${appConfig.environment}] $message');
  }
}

/// Security Headers for Mobile API Requests
/// Includes environment-specific API key
Map<String, String> getSecureHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Mobile-API-Key': MOBILE_API_KEY,
  };
}

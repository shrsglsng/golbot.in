/// Base configuration interface for environment-specific settings
/// Each environment (dev, staging, prod) implements this interface
abstract class EnvConfig {
  /// Display name of the application
  String get appName;

  /// Android application ID (package name)
  String get appId;

  /// Base URL for main API endpoints
  String get baseUrl;

  /// Base URL for firmware-specific API endpoints
  String get firmwareApiUrl;

  /// API key for mobile app authentication
  String get mobileApiKey;

  /// Enable firmware auto-mode (polling, auto-progression)
  bool get firmwareModeEnabled;

  /// Interval in seconds to poll for new orders
  int get orderPollInterval;

  /// Delay in seconds before auto-marking order as ready
  int get autoReadyDelay;

  /// Delay in seconds before auto-completing order
  int get autoCompleteDelay;

  /// Interval in seconds to send heartbeat to server
  int get heartbeatInterval;

  /// Firmware version identifier
  String get firmwareVersion;

  /// Enable debug print statements
  bool get enableDebugLogs;

  /// Environment identifier (DEV, STAGING, PROD)
  String get environment;

  /// Enable immersive full-screen mode
  bool get enableImmersiveMode;
}

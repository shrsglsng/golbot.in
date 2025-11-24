import 'env_config.dart';

/// Staging environment configuration TEMPLATE
///
/// ⚠️ IMPORTANT SETUP INSTRUCTIONS ⚠️
///
/// This is a TEMPLATE file. To use it:
/// 1. Copy this file to: staging_config.dart (in the same directory)
/// 2. Replace 'YOUR_STAGING_API_KEY_HERE' with the actual staging API key
/// 3. Do NOT commit staging_config.dart to GitHub
///
/// The actual staging_config.dart file is gitignored for security.
///
/// To get the staging API key:
/// - Ask your team lead
/// - Check your secure password manager
/// - Check the staging backend .env file: MOBILE_APP_API_KEY
///
/// Used for pre-production testing with staging backend
class StagingConfig implements EnvConfig {
  @override
  String get appName => 'Golbot Staging';

  @override
  String get appId => 'com.golbot.machine.staging';

  @override
  String get baseUrl => 'https://staging-api.golbot.in/api/v1/';

  @override
  String get firmwareApiUrl => 'https://staging-api.golbot.in/api/firmware/';

  @override
  String get mobileApiKey => 'YOUR_STAGING_API_KEY_HERE'; // ⚠️ REPLACE THIS

  @override
  bool get firmwareModeEnabled => true; // Test full auto mode

  @override
  int get orderPollInterval => 3;

  @override
  int get autoReadyDelay => 5;

  @override
  int get autoCompleteDelay => 3;

  @override
  int get heartbeatInterval => 30;

  @override
  String get firmwareVersion => 'APK_STAGING_v1.0.0';

  @override
  bool get enableDebugLogs => true; // Keep logs for debugging

  @override
  String get environment => 'STAGING';

  @override
  bool get enableImmersiveMode => true; // Test production-like behavior
}

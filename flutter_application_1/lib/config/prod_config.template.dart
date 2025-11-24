import 'env_config.dart';

/// Production environment configuration TEMPLATE
///
/// ⚠️ IMPORTANT SETUP INSTRUCTIONS ⚠️
///
/// This is a TEMPLATE file. To use it:
/// 1. Copy this file to: prod_config.dart (in the same directory)
/// 2. Replace 'YOUR_PRODUCTION_API_KEY_HERE' with the actual production API key
/// 3. Do NOT commit prod_config.dart to GitHub
///
/// The actual prod_config.dart file is gitignored for security.
///
/// To get the production API key:
/// - Ask your team lead
/// - Check your secure password manager
/// - Check the backend .env file: MOBILE_APP_API_KEY
///
/// Used for live deployment on physical machines
class ProdConfig implements EnvConfig {
  @override
  String get appName => 'Golbot Machine';

  @override
  String get appId => 'com.golbot.machine';

  @override
  String get baseUrl => 'https://api.golbot.in/api/v1/';

  @override
  String get firmwareApiUrl => 'https://api.golbot.in/api/firmware/';

  @override
  String get mobileApiKey => 'YOUR_PRODUCTION_API_KEY_HERE'; // ⚠️ REPLACE THIS

  @override
  bool get firmwareModeEnabled => true; // Full automation

  @override
  int get orderPollInterval => 3;

  @override
  int get autoReadyDelay => 5;

  @override
  int get autoCompleteDelay => 3;

  @override
  int get heartbeatInterval => 30;

  @override
  String get firmwareVersion => 'APK_PROD_v1.0.0';

  @override
  bool get enableDebugLogs => false; // No logs in production

  @override
  String get environment => 'PROD';

  @override
  bool get enableImmersiveMode => true; // Full screen in production
}

import 'env_config.dart';

/// Development environment configuration
/// Used for local testing with localhost backend
class DevConfig implements EnvConfig {
  @override
  String get appName => 'Golbot Dev';

  @override
  String get appId => 'com.golbot.machine.dev';

  @override
  String get baseUrl => 'http://localhost:5000/api/v1/';

  @override
  String get firmwareApiUrl => 'http://localhost:5000/api/firmware/';

  @override
  String get mobileApiKey => 'golbot_mobile_dev_2024_v1_api_key';

  @override
  bool get firmwareModeEnabled => false; // Manual testing in dev

  @override
  int get orderPollInterval => 5; // Slower polling for debugging

  @override
  int get autoReadyDelay => 10; // Longer delays to observe transitions

  @override
  int get autoCompleteDelay => 5;

  @override
  int get heartbeatInterval => 60; // Less frequent in dev

  @override
  String get firmwareVersion => 'APK_DEV_v1.0.0';

  @override
  bool get enableDebugLogs => true;

  @override
  String get environment => 'DEV';

  @override
  bool get enableImmersiveMode => false; // Easier debugging without immersive mode
}

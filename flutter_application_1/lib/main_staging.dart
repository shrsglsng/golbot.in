import 'package:flutter/widgets.dart';
import 'main.dart';
import 'config/staging_config.dart';

/// Staging environment entry point
/// Run with: flutter run -t lib/main_staging.dart --flavor staging
/// Build with: flutter build apk -t lib/main_staging.dart --flavor staging --release
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(MyApp(config: StagingConfig()));
}

import 'package:flutter/widgets.dart';
import 'main.dart';
import 'config/dev_config.dart';

/// Development environment entry point
/// Run with: flutter run -t lib/main_dev.dart --flavor dev
/// Build with: flutter build apk -t lib/main_dev.dart --flavor dev
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(MyApp(config: DevConfig()));
}

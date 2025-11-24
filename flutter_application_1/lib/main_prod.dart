import 'package:flutter/widgets.dart';
import 'main.dart';
import 'config/prod_config.dart';

/// Production environment entry point
/// Run with: flutter run -t lib/main_prod.dart --flavor prod
/// Build with: flutter build apk -t lib/main_prod.dart --flavor prod --release
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(MyApp(config: ProdConfig()));
}

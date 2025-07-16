import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:machine_apk/loginScreen.dart';
import 'package:machine_apk/provider/socketProvider.dart';
import 'package:provider/provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Full Screen Mode -- https://www.youtube.com/watch?v=SmELrlAIhVs
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(MultiProvider(
    providers: [
      ChangeNotifierProvider(
        create: (_) => SocketProvider(),
      ),
    ],
    child: const MyApp(),
  ));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        primarySwatch: Colors.red,
        appBarTheme: const AppBarTheme(
          iconTheme: IconThemeData(color: Colors.white),
        ),
      ),

      home: LoginScreen(),
      // home: TempScreen(),
    );
  }
}

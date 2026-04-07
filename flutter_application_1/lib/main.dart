import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_application_1/loginScreen.dart';
import 'package:flutter_application_1/HomeScreen.dart';
import 'package:flutter_application_1/preparingOrderScreen.dart';
import 'package:flutter_application_1/services/storageService.dart';
import 'package:flutter_application_1/models/orderModel.dart';
import 'package:flutter_application_1/utils/constants.dart';
import 'package:flutter_application_1/config/env_config.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

/// Global configuration instance
/// Accessible throughout the app via appConfig getter
late EnvConfig appConfig;

class MyApp extends StatelessWidget {
  final EnvConfig config;

  const MyApp({super.key, required this.config});

  @override
  Widget build(BuildContext context) {
    // Set global config instance
    appConfig = config;

    // Configure system UI based on environment
    if (config.enableImmersiveMode) {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    }
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

    return MaterialApp(
      title: config.appName,
      theme: ThemeData(
        primarySwatch: Colors.red,
        appBarTheme: const AppBarTheme(
          iconTheme: IconThemeData(color: Colors.white),
        ),
      ),
      home: const AuthCheckScreen(), // Check auth and pending orders first
      // Show environment banner in non-production builds
      builder: (context, child) {
        if (config.environment != 'PROD') {
          return Banner(
            message: config.environment,
            location: BannerLocation.topEnd,
            color: config.environment == 'DEV' ? Colors.blue : Colors.orange,
            child: child!,
          );
        }
        return child!;
      },
    );
  }
}

/// Splash screen that checks authentication and pending orders
class AuthCheckScreen extends StatefulWidget {
  const AuthCheckScreen({super.key});

  @override
  State<AuthCheckScreen> createState() => _AuthCheckScreenState();
}

class _AuthCheckScreenState extends State<AuthCheckScreen> {
  final StorageService _storageService = StorageService();

  @override
  void initState() {
    super.initState();
    _checkAuthAndNavigate();
  }

  /// Check authentication and pending orders, then navigate appropriately
  Future<void> _checkAuthAndNavigate() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("token");
      final machineData = prefs.getString("machine");

      // Check if user is logged in
      final isLoggedIn = token != null && token.isNotEmpty &&
                        machineData != null && machineData.isNotEmpty;

      if (!isLoggedIn) {
        // Not logged in → go to LoginScreen
        _navigateToLogin();
        return;
      }

      // Logged in - check backend for active order (source of truth)
      final machine = jsonDecode(machineData);
      final mid = machine["mid"] as String?;

      if (mid == null) {
        _navigateToLogin();
        return;
      }

      // Query backend to check if machine has an active order
      print('[AuthCheck] Checking backend for active order on machine: $mid');
      final activeOrderData = await _checkBackendForActiveOrder(mid, token);

      if (activeOrderData != null) {
        final order = Order.fromJson(activeOrderData);
        final status = order.ostatus;

        print(
            '[AuthCheck] Found active order on server: ${order.sId}, status: $status');

        // ONLY navigate to PreparingOrderScreen if the order is NOT already completed or cancelled
        if (status != 'COMPLETED' && status != 'CANCELLED') {
          _navigateToPreparing(order);
          return;
        } else {
          // It's a terminal state, clear local knowledge as the user doesn't need to resume
          print('[AuthCheck] Order already terminal ($status), clearing storage');
          await _storageService.clearCurrentOrder();
        }
      }

      // Logged in, no active order → go to HomeScreen
      print('[AuthCheck] No active order, going to HomeScreen');
      _navigateToHome();

    } catch (e) {
      print('[AuthCheck] Error during auth check: $e');
      // On error, go to login to be safe
      _navigateToLogin();
    }
  }

  /// Query backend to check if machine has an active order
  Future<Map<String, dynamic>?> _checkBackendForActiveOrder(String mid, String token) async {
    try {
      // Get machine password from secure storage
      final secureStorage = FlutterSecureStorage();
      final password = await secureStorage.read(key: 'password');

      if (password == null) {
        print('[AuthCheck] No password in secure storage');
        return null;
      }

      // Call the firmware API to get machine status (source of truth for currently active order)
      final url = Uri.parse('${FIRMWARE_API_URL}machine/status?mid=$mid');
      final response = await http.get(
        url,
        headers: {
          'X-Machine-ID': mid,
          'X-Machine-Password': password,
          'Content-Type': 'application/json',
        },
      );

      print('[AuthCheck] Backend response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('[AuthCheck] Backend data: ${response.body}');

        if (data['success'] == true &&
            data['data'] != null &&
            data['data']['currentOrder'] != null) {
          return data['data']['currentOrder'];
        }
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        // Invalid token or auth error - force login
        print('[AuthCheck] Authentication expired or invalid');
        _navigateToLogin();
      }

      return null;
    } catch (e) {
      print('[AuthCheck] Error checking backend: $e');
      return null;
    }
  }

  void _navigateToLogin() {
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  void _navigateToHome() {
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => HomeScreen()),
      );
    }
  }

  void _navigateToPreparing(Order order) {
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => PreparingOrderScreen(
            order: order,
            isAutoMode: false, // Resume in manual mode for safety
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Simple splash screen while checking
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.red),
            ),
            const SizedBox(height: 20),
            Text(
              'Loading...',
              style: TextStyle(fontSize: 16, color: Colors.grey[700]),
            ),
          ],
        ),
      ),
    );
  }
}

class TestScreen extends StatelessWidget {
  const TestScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Machine APK Latest'),
        backgroundColor: Colors.red,
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Welcome to Machine APK Latest',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 20),
            Text(
              'Flutter project successfully created with updated configurations!',
              style: TextStyle(fontSize: 16),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

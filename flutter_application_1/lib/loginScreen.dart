import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_application_1/connectingScreen.dart';
import 'package:flutter_application_1/services/auth.dart';
import 'package:flutter_application_1/utils/constants.dart';
import 'services/firmwareService.dart';
import 'services/storageService.dart';
import 'preparingOrderScreen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final FirmwareService _firmwareService = FirmwareService();
  final StorageService _storageService = StorageService();

  TextEditingController _mid = TextEditingController();
  TextEditingController _password = TextEditingController();

  bool isLoading = false;

  void handleLogin() async {
    setState(() {
      isLoading = true;
    });

    // Use the actual auth service
    if (await machineLogin(_mid.text, _password.text, context)) {
      // After successful login, check for disaster recovery if firmware mode enabled
      if (FIRMWARE_MODE_ENABLED) {
        await _checkDisasterRecovery();
      } else {
        // Normal flow
        Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => ConnectingScreen(),
            ));
      }
    }

    setState(() {
      isLoading = false;
    });
  }

  /// Check for active orders and resume if found (disaster recovery)
  Future<void> _checkDisasterRecovery() async {
    try {
      print('[Login] Checking for disaster recovery...');

      // Check local storage for pending order
      final hasPendingOrder = await _storageService.hasPendingOrder();

      if (hasPendingOrder) {
        final localState = await _storageService.getCurrentOrderState_Full();
        print('[Login] Found local order: ${localState?['orderId']}');

        // Verify with server
        final serverStatus =
            await _firmwareService.getMachineStatus(_mid.text);

        if (serverStatus != null && serverStatus['currentOrder'] != null) {
          final currentOrder = serverStatus['currentOrder'];
          print(
              '[Login] Server confirms active order: ${currentOrder['orderId']}');

          // Navigate to PreparingOrderScreen to resume
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => PreparingOrderScreen(
                  orderOtp: currentOrder['orderOtp'],
                  isAutoMode: true,
                ),
              ),
            );
          }
          return;
        } else {
          // No active order on server, clear local storage
          print('[Login] No active order on server, clearing local storage');
          await _storageService.clearCurrentOrder();
        }
      } else {
        print('[Login] No pending order in local storage');
      }

      // No disaster recovery needed, proceed normally
      if (mounted) {
        Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => ConnectingScreen(),
            ));
      }
    } catch (e) {
      print('[Login] Disaster recovery check failed: $e');

      // On error, proceed normally
      if (mounted) {
        Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => ConnectingScreen(),
            ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(64.0),
        child: AppBar(
          title: Column(
            children: [
              SizedBox(height: 12.0),
              Center(child: SvgPicture.asset("assets/logo.svg", height: 40)),
            ],
          ),
          backgroundColor: CPrimary,
        ),
      ),
      body: Center(
        child: Container(
          width: 350,
          height: 450,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                "Machine Login",
                style: TextStyle(fontSize: 32),
              ),
              SizedBox(height: 28),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _mid,
                      style: TextStyle(
                        color: Colors.black,
                      ),
                      inputFormatters: [
                        TextInputFormatter.withFunction(
                          (oldValue, newValue) => TextEditingValue(
                            text: newValue.text.toUpperCase(),
                            selection: newValue.selection,
                          ),
                        ),
                      ],
                      decoration: InputDecoration(
                        border: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: Colors.grey,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: CPrimary,
                            width: 2.0,
                          ),
                        ),
                        hintText: 'Enter Machine ID',
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      obscureText: true,
                      enableSuggestions: false,
                      autocorrect: false,
                      controller: _password,
                      style: TextStyle(
                        color: Colors.black,
                      ),
                      decoration: InputDecoration(
                        border: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: Colors.grey,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: CPrimary,
                            width: 2.0,
                          ),
                        ),
                        hintText: 'Enter password',
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                        onPressed: isLoading ? null : handleLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: CPrimary,
                          elevation: 0,
                          padding: EdgeInsets.symmetric(
                              vertical: 16.0, horizontal: 32.0),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                                8.0), // Make it fully rounded
                          ),
                        ),
                        child: Text(
                          isLoading ? "Loading..." : "Login",
                          style: TextStyle(fontSize: 20.0, color: Colors.white),
                        )),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

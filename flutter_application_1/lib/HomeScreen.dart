import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_application_1/manualOTPScreen.dart';
import 'package:flutter_application_1/scannerScreen.dart';
import 'package:flutter_application_1/utils/constants.dart';
import 'package:flutter_application_1/models/orderModel.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'services/firmwareService.dart';
import 'services/storageService.dart';
import 'preparingOrderScreen.dart';

class HomeScreen extends StatefulWidget {
  HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final FirmwareService _firmwareService = FirmwareService();
  final StorageService _storageService = StorageService();

  Timer? _pollTimer;
  bool _isPolling = false;
  String? _machineId;
  String? _statusMessage;

  @override
  void initState() {
    super.initState();
    _initializeFirmwareMode();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  /// Initialize firmware mode and start polling if enabled
  Future<void> _initializeFirmwareMode() async {
    if (!FIRMWARE_MODE_ENABLED) {
      print('[HomeScreen] Firmware mode disabled');
      return;
    }

    // Get machine ID from storage
    final prefs = await SharedPreferences.getInstance();
    final machineData = prefs.getString("machine");

    if (machineData == null) {
      print('[HomeScreen] No machine data found, firmware mode inactive');
      return;
    }

    final machine = jsonDecode(machineData);
    _machineId = machine["mid"] as String?;

    if (_machineId == null) {
      print('[HomeScreen] No machine ID in machine data, firmware mode inactive');
      return;
    }

    // DISASTER RECOVERY: Check backend for active order (source of truth)
    print('[HomeScreen] Checking backend for active order...');
    final machineStatus = await _firmwareService.getMachineStatus(_machineId!);

    if (machineStatus != null && machineStatus['currentOrder'] != null) {
      final activeOrder = machineStatus['currentOrder'];
      final status = activeOrder['orderStatus'] ?? activeOrder['status'];

      // Resume only if order is actively preparing or verifying
      if (status != 'COMPLETED' && status != 'CANCELLED') {
        print(
            '[HomeScreen] Found active order from backend: ${activeOrder['_id']}, status: $status');
        // Navigate to PreparingOrderScreen to resume order
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => PreparingOrderScreen(
                order: Order.fromJson(activeOrder), // Pass full order object
                isAutoMode: false, // Resume in manual mode for safety
              ),
            ),
          );
        }
        return; // Don't start polling, we have an active order
      } else {
        // Order is already finished. Ensure local storage is clear.
        await _storageService.clearCurrentOrder();
      }
    }

    print('[HomeScreen] Firmware mode enabled for machine: $_machineId');
    setState(() {
      _statusMessage = 'Firmware Mode: Waiting for orders...';
    });

    // Start polling for orders
    _startPolling();

    // Start heartbeat timer
    _startHeartbeat();
  }

  /// Start polling for new orders
  void _startPolling() {
    _pollTimer?.cancel();

    _pollTimer = Timer.periodic(
      Duration(seconds: ORDER_POLL_INTERVAL),
      (timer) async {
        if (_isPolling) return; // Prevent concurrent polls

        _isPolling = true;
        await _pollForOrder();
        _isPolling = false;
      },
    );

    // Also poll immediately
    _pollForOrder();
  }

  /// Poll for next order from firmware API
  Future<void> _pollForOrder() async {
    if (_machineId == null) return;

    try {
      print('[HomeScreen] Polling for order...');

      final order = await _firmwareService.pollForNextOrder(_machineId!);

      if (order != null) {
        print('[HomeScreen] Order found: ${order['_id']}');

        // Cancel polling timer
        _pollTimer?.cancel();

        // Navigate to PreparingOrderScreen
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => PreparingOrderScreen(
                order: Order.fromJson(order), // Pass full order object
                isAutoMode: true,
              ),
            ),
          );
        }
      } else {
        // No order, continue polling
        if (mounted) {
          setState(() {
            _statusMessage =
                'Firmware Mode: Waiting for orders... (Last check: ${DateTime.now().toString().substring(11, 19)})';
          });
        }
      }
    } catch (e) {
      print('[HomeScreen] Poll error: $e');
      if (mounted) {
        setState(() {
          _statusMessage = 'Firmware Mode: Error - $e';
        });
      }
    }
  }

  /// Send periodic heartbeat to server
  void _startHeartbeat() {
    Timer.periodic(
      Duration(seconds: HEARTBEAT_INTERVAL),
      (timer) async {
        if (_machineId == null) return;

        try {
          await _firmwareService.sendHeartbeat(
            _machineId!,
            'IDLE',
            firmwareVersion: FIRMWARE_VERSION,
          );
          print('[HomeScreen] Heartbeat sent');
        } catch (e) {
          print('[HomeScreen] Heartbeat failed: $e');
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(64.0),
        child: AppBar(
          title: Column(
            children: [
              const SizedBox(height: 12.0),
              Center(child: SvgPicture.asset("assets/logo.svg", height: 40)),
            ],
          ),
          backgroundColor: CPrimary,
          automaticallyImplyLeading: false, // Remove back button
        ),
      ),
      body: Stack(children: [
        // Background image (commented out for now)
        // Align(
        //     alignment: Alignment.center,
        //     child: Padding(
        //       padding:
        //           const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
        //       child: Image.asset(
        //         "assets/panipuribg.jpeg",
        //         fit: BoxFit.cover,
        //       ),
        //     )),
        Align(
            alignment: Alignment.bottomRight,
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
              child: Image.asset(
                "assets/Aibot_Logo.png",
                fit: BoxFit.fitWidth,
                height: 48.0,
              ),
            )),
        // Firmware mode status indicator
        if (FIRMWARE_MODE_ENABLED && _statusMessage != null)
          Positioned(
            bottom: 80,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.developer_board,
                    color: Colors.green,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _statusMessage!,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ),
        Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ElevatedButton(
                onPressed: () {
                  Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ScannerScreen(),
                      ));
                },
                style: ElevatedButton.styleFrom(
                  elevation: 0,
                  backgroundColor: CPrimary,
                  fixedSize: const Size(300, 205),
                  padding: const EdgeInsets.symmetric(
                      vertical: 16.0, horizontal: 32.0),
                  shape: RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.circular(8.0),
                  ),
                ),
                child: const Column(
                  children: [
                    Icon(
                      Icons.qr_code_scanner,
                      size: 140,
                      color: Colors.white,
                    ),
                    Text(
                      'Scan QR Code',
                      style: TextStyle(fontSize: 20.0, color: Colors.white),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24.0),
              FractionallySizedBox(
                widthFactor: 0.5,
                child: Container(
                  height: 1.0,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 24.0),
              ElevatedButton(
                onPressed: () {
                  Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ManualOTPScreen(),
                      ));
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  elevation: 0,
                  fixedSize: const Size(300, 185),
                  padding: const EdgeInsets.symmetric(
                      vertical: 16.0, horizontal: 32.0),
                  shape: RoundedRectangleBorder(
                    side: BorderSide(color: CPrimary),
                    borderRadius:
                        BorderRadius.circular(8.0),
                  ),
                ),
                child: Column(
                  children: [
                    Icon(Icons.numbers, size: 120, color: CPrimary),
                    Text(
                      'Enter OTP Manually',
                      style: TextStyle(fontSize: 20.0, color: CPrimary),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ]),
    );
  }
}

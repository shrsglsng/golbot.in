import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:machine_apk_latest/models/orderModel.dart';
import 'package:machine_apk_latest/preparingOrderScreen.dart';
import 'package:machine_apk_latest/HomeScreen.dart';
import 'package:machine_apk_latest/manualOTPScreen.dart';
import 'package:machine_apk_latest/services/startMachine.dart';
import 'package:machine_apk_latest/utils/constants.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ScannerScreen extends StatefulWidget {
  ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  MobileScannerController cameraController = MobileScannerController();
  bool isProcessing = false;
  String? mid;

  @override
  void initState() {
    super.initState();
    _getMachineId();
  }

  void _getMachineId() async {
    final prefs = await SharedPreferences.getInstance();
    final machineData = prefs.getString("machine");
    if (machineData != null) {
      setState(() {
        mid = jsonDecode(machineData)["mid"];
      });
    }
  }

  void _onDetect(BarcodeCapture capture) async {
    if (isProcessing) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? code = barcodes.first.rawValue;
      if (code != null && code.length == 4) {
        setState(() {
          isProcessing = true;
        });

        print('QR Code detected: $code');

        // Process the OTP
        Order? order = await startMachine(code, mid ?? "", context);

        if (order != null) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => PreparingOrderScreen(order: order),
            ),
          );
        } else {
          setState(() {
            isProcessing = false;
          });
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Invalid QR code format. Expected 4-digit OTP."),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
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
          leading: IconButton(
            icon: Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
        ),
      ),
      body: Stack(
        children: [
          // Camera preview
          MobileScanner(
            controller: cameraController,
            onDetect: _onDetect,
          ),
          
          // Overlay with instructions
          Column(
            children: [
              Expanded(
                flex: 1,
                child: Container(
                  color: Colors.black54,
                  child: Center(
                    child: Text(
                      'Scan QR Code for Order OTP',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
              
              // Scanner area
              Expanded(
                flex: 3,
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: CPrimary, width: 3),
                  ),
                ),
              ),
              
              Expanded(
                flex: 1,
                child: Container(
                  color: Colors.black54,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (isProcessing)
                        Column(
                          children: [
                            CircularProgressIndicator(color: Colors.white),
                            SizedBox(height: 8),
                            Text(
                              'Processing...',
                              style: TextStyle(color: Colors.white),
                            ),
                          ],
                        )
                      else
                        Text(
                          'Align QR code within the frame',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          
          // Bottom controls
          Positioned(
            bottom: 80,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Flash toggle
                FloatingActionButton(
                  heroTag: "flash",
                  onPressed: () {
                    cameraController.toggleTorch();
                  },
                  backgroundColor: Colors.white,
                  child: Icon(Icons.flash_on, color: CPrimary),
                ),
                
                // Manual entry button
                FloatingActionButton.extended(
                  heroTag: "manual",
                  onPressed: () {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ManualOTPScreen(),
                      ),
                    );
                  },
                  backgroundColor: CPrimary,
                  label: Text(
                    'Enter Manually',
                    style: TextStyle(color: Colors.white),
                  ),
                  icon: Icon(Icons.keyboard, color: Colors.white),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

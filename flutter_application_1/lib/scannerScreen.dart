import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_application_1/models/orderModel.dart';
import 'package:flutter_application_1/preparingOrderScreen.dart';
import 'package:flutter_application_1/HomeScreen.dart';
import 'package:flutter_application_1/manualOTPScreen.dart';
import 'package:flutter_application_1/services/startMachine.dart';
import 'package:flutter_application_1/utils/constants.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ScannerScreen extends StatefulWidget {
  ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  MobileScannerController cameraController = MobileScannerController(facing: CameraFacing.front);
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
      if (code != null) {
        // Clean the scanned code
        String cleanedCode = code.trim();
        
        String? otp;
        
        try {
          // First, try to parse as JSON (for order QR codes)
          final Map<String, dynamic> qrData = jsonDecode(cleanedCode);
          if (qrData.containsKey('otp')) {
            otp = qrData['otp'].toString();
            print('JSON QR detected - Order ID: ${qrData['orderId']}, OTP: $otp');
          }
        } catch (e) {
          // Not JSON, try to extract 4-digit number from plain text
          RegExp digitRegex = RegExp(r'\b\d{4}\b');
          Match? match = digitRegex.firstMatch(cleanedCode);
          
          if (match != null) {
            otp = match.group(0);
          } else if (cleanedCode.length == 4 && RegExp(r'^\d{4}$').hasMatch(cleanedCode)) {
            // If the cleaned code is exactly 4 digits
            otp = cleanedCode;
          }
        }
        
        // Validate that we have a 4-digit OTP
        if (otp != null && otp.length == 4 && RegExp(r'^\d{4}$').hasMatch(otp)) {
          setState(() {
            isProcessing = true;
          });

          print('QR Code detected: $cleanedCode');
          print('Extracted OTP: $otp');

          // Process the OTP
          Order? order = await startMachine(otp, mid ?? "", context);

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
              content: Text("QR code must contain a valid 4-digit OTP. Scanned: '${cleanedCode.length > 100 ? cleanedCode.substring(0, 100) + '...' : cleanedCode}'"),
              backgroundColor: Colors.orange,
              duration: Duration(seconds: 3),
            ),
          );
        }
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
      body: OrientationBuilder(
        builder: (context, orientation) {
          bool isLandscape = orientation == Orientation.landscape;

          return Stack(
            children: [
              // Camera preview
              Positioned.fill(
                child: MobileScanner(
                  key: ValueKey(orientation), // Force re-init on rotation
                  controller: cameraController,
                  onDetect: _onDetect,
                  fit: BoxFit.cover,
                ),
              ),

              // Responsive Overlay
              isLandscape
                  ? Row(
                      children: [
                        Expanded(
                          flex: 1,
                          child: Container(
                            color: Colors.black54,
                            child: const Center(
                              child: Padding(
                                padding: EdgeInsets.all(16.0),
                                child: Text(
                                  'Scan QR Code for Order OTP',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        // Horizontal Scanner area
                        Container(
                          width: MediaQuery.of(context).size.height * 0.7,
                          height: MediaQuery.of(context).size.height * 0.7,
                          decoration: BoxDecoration(
                            border: Border.all(color: CPrimary, width: 3),
                          ),
                        ),
                        Expanded(
                          flex: 1,
                          child: Container(
                            color: Colors.black54,
                            child: Center(
                              child: isProcessing
                                  ? const CircularProgressIndicator(color: Colors.white)
                                  : const Padding(
                                      padding: EdgeInsets.all(16.0),
                                      child: Text(
                                        'Align QR code within the frame',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(color: Colors.white, fontSize: 16),
                                      ),
                                    ),
                            ),
                          ),
                        ),
                      ],
                    )
                  : Column(
                      children: [
                        Expanded(
                          flex: 1,
                          child: Container(
                            color: Colors.black54,
                            child: const Center(
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
                        Container(
                          width: MediaQuery.of(context).size.width * 0.7,
                          height: MediaQuery.of(context).size.width * 0.7,
                          decoration: BoxDecoration(
                            border: Border.all(color: CPrimary, width: 3),
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
                                  const Column(
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
                                  const Text(
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
                bottom: isLandscape ? 40 : 80,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    FloatingActionButton(
                      heroTag: "flash",
                      onPressed: () => cameraController.toggleTorch(),
                      backgroundColor: Colors.white,
                      child: Icon(Icons.flash_on, color: CPrimary),
                    ),
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
                      label: const Text('Enter Manually', style: TextStyle(color: Colors.white)),
                      icon: const Icon(Icons.keyboard, color: Colors.white),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:machine_apk/manualOTPScreen.dart';
import 'package:machine_apk/models/orderModel.dart';
import 'package:machine_apk/preparingOrderScreen.dart';
import 'package:machine_apk/services/startMachine.dart';
import 'package:machine_apk/utils/appbar.dart';
import 'package:machine_apk/utils/constants.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ScannerScreen extends StatefulWidget {
  ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  // Barcode? qrResult;
  QRViewController? qrController;
  String QrCode = "";
  bool flashOn = false;
  bool isReqSent = false;

  String? mid;

  Future<void> _onQRViewCreated(QRViewController controller) async {
    this.qrController = controller;
    await controller.flipCamera();
    controller.scannedDataStream.listen((scanData) async {
      if (isReqSent) return;

      isReqSent = true;

      var QrData = jsonDecode(scanData.code ?? "{}");
      Order? order =
          await startMachine(QrData["otp"] ?? "", mid ?? "", context);

      if (order != null)
        Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => PreparingOrderScreen(
                order: order,
              ),
            ));

      isReqSent = false;
      // setState(() {
      //   result = scanData;
      // });
    });
  }

  @override
  void initState() {
    super.initState();
    // SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual,
    //     overlays: [SystemUiOverlay.bottom]);

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final prefs = await SharedPreferences.getInstance();
      mid = jsonDecode(prefs.getString("machine") ?? '')["mid"];
    });
  }

  @override
  void reassemble() {
    super.reassemble();
    if (Platform.isAndroid) {
      qrController!.pauseCamera();
    } else if (Platform.isIOS) {
      qrController!.resumeCamera();
    }
  }

  @override
  void dispose() {
    qrController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: customAppBar(context),
      body: Stack(
        children: [
          QRView(
            key: qrKey,
            onQRViewCreated: _onQRViewCreated,
            overlay: QrScannerOverlayShape(
              borderColor: CPrimary,
              borderRadius: 10,
              borderLength: 20,
              borderWidth: 10,
              cutOutSize: MediaQuery.of(context).size.width * 0.6,
            ),
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 200.0),
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ManualOTPScreen(),
                      ));
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: CPrimary,
                  padding: const EdgeInsets.symmetric(
                      vertical: 16.0, horizontal: 32.0),
                  shape: RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.circular(8.0), // Make it fully rounded
                  ),
                ),
                child: const Text(
                  'Enter OTP Manually',
                  style: TextStyle(fontSize: 16.0, color: Colors.white),
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:machine_apk/manualOTPScreen.dart';
import 'package:machine_apk/scannerScreen.dart';
import 'package:machine_apk/utils/constants.dart';
import 'package:flutter_svg/flutter_svg.dart';

class HomeScreen extends StatefulWidget {
  HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
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
        ),
      ),
      body: Stack(children: [
        // Align(
        //     alignment: Alignment.center,
        //     child: Padding(
        //       padding:
        //           const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
        //       child: Image.asset(
        //         "assets/panipuribg.jpeg",
        //         fit: BoxFit.cover,
        //         // height: 48.0,
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
                        BorderRadius.circular(8.0), // Make it fully rounded
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
                      'Scan Qr Code',
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
                  color: Colors.grey, // Customize the line color here
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
                        BorderRadius.circular(8.0), // Make it fully rounded
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

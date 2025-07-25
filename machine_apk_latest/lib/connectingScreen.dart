import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:machine_apk_latest/utils/constants.dart';
import 'package:machine_apk_latest/HomeScreen.dart';

class ConnectingScreen extends StatefulWidget {
  const ConnectingScreen({super.key});

  @override
  State<ConnectingScreen> createState() => _ConnectingScreenState();
}

class _ConnectingScreenState extends State<ConnectingScreen> {
  @override
  void initState() {
    super.initState();
    // Auto-navigate to HomeScreen after 3 seconds
    Future.delayed(Duration(seconds: 3), () {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => HomeScreen()),
        );
      }
    });
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
          automaticallyImplyLeading: false, // Remove back button
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              color: CPrimary,
              strokeWidth: 3,
            ),
            SizedBox(height: 24),
            Text(
              "Connecting to Machine...",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w500,
              ),
            ),
            SizedBox(height: 12),
            Text(
              "Please wait while we establish connection",
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:machine_apk_latest/utils/constants.dart';
import 'package:machine_apk_latest/models/orderModel.dart';
import 'package:machine_apk_latest/HomeScreen.dart';

class PreparingOrderScreen extends StatefulWidget {
  final Order order;
  
  PreparingOrderScreen({super.key, required this.order});

  @override
  State<PreparingOrderScreen> createState() => _PreparingOrderScreenState();
}

class _PreparingOrderScreenState extends State<PreparingOrderScreen> {
  int currentStep = 1;
  int totalSteps = 5;
  bool orderCompleted = false;

  @override
  void initState() {
    super.initState();
    // Simulate order preparation progress
    _startOrderPreparation();
  }

  void _startOrderPreparation() async {
    // Show preparation for 10 seconds
    await Future.delayed(Duration(seconds: 10));
    
    // Mark order as completed
    if (mounted) {
      setState(() {
        orderCompleted = true;
      });
      
      // Auto-navigate back to home after completion (2 seconds to see completion message)
      Future.delayed(Duration(seconds: 2), () {
        if (mounted) {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (context) => HomeScreen()),
            (route) => false,
          );
        }
      });
    }
  }

  String _getStepDescription(int step) {
    switch (step) {
      case 1:
        return "Initializing preparation...";
      case 2:
        return "Preparing ingredients...";
      case 3:
        return "Cooking in progress...";
      case 4:
        return "Adding final touches...";
      case 5:
        return "Order ready for pickup!";
      default:
        return "Processing...";
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
              const SizedBox(height: 12.0),
              Center(child: SvgPicture.asset("assets/logo.svg", height: 40)),
            ],
          ),
          backgroundColor: CPrimary,
          automaticallyImplyLeading: false,
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Order info
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Text(
                    "Order ID: ${widget.order.sId ?? 'N/A'}",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    "Status: ${orderCompleted ? 'COMPLETED' : 'PREPARING'}",
                    style: TextStyle(
                      fontSize: 16,
                      color: orderCompleted ? Colors.green : Colors.orange,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            
            SizedBox(height: 40),
            
            // Progress indicator
            if (!orderCompleted) ...[
              CircularProgressIndicator(
                value: currentStep / totalSteps,
                backgroundColor: Colors.grey[300],
                valueColor: AlwaysStoppedAnimation<Color>(CPrimary),
                strokeWidth: 8,
              ),
              SizedBox(height: 24),
              Text(
                "Step $currentStep of $totalSteps",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 16),
              Text(
                _getStepDescription(currentStep),
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
            ] else ...[
              Icon(
                Icons.check_circle,
                size: 100,
                color: Colors.green,
              ),
              SizedBox(height: 24),
              Text(
                "Order Completed!",
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.green,
                ),
              ),
              SizedBox(height: 16),
              Text(
                "Please collect your order",
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
              ),
              SizedBox(height: 24),
              Text(
                "Returning to home screen...",
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[500],
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
            
            SizedBox(height: 40),
            
            // Manual controls
            if (!orderCompleted)
              ElevatedButton(
                onPressed: () {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (context) => HomeScreen()),
                    (route) => false,
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey,
                  padding: EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
                child: Text(
                  "Cancel Order",
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

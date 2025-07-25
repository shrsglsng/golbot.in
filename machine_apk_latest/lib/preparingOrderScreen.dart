import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:machine_apk_latest/utils/constants.dart';
import 'package:machine_apk_latest/models/orderModel.dart';
import 'package:machine_apk_latest/HomeScreen.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class PreparingOrderScreen extends StatefulWidget {
  final Order order;
  
  PreparingOrderScreen({super.key, required this.order});

  @override
  State<PreparingOrderScreen> createState() => _PreparingOrderScreenState();
}

class _PreparingOrderScreenState extends State<PreparingOrderScreen> {
  bool orderCompleted = false;
  bool readyForPickup = false;
  String orderStatus = "PREPARING";

  @override
  void initState() {
    super.initState();
    // You can update this section with actual logic to update orderStatus if needed.
  }

  // Call machine endpoints for status updates
  Future<void> _markOrderReadyForPickup() async {
    final url = Uri.parse('${BASE_URL}machine/ready-for-pickup');
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString("token");
    try {
      final response = await http.post(
        url,
        headers: {
          ...getSecureHeaders(),
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          'orderId': widget.order.sId,
          'mid': widget.order.machineId ?? 'm01', // adjust as needed
        }),
      );
      if (response.statusCode == 200) {
        setState(() {
          readyForPickup = true;
          orderStatus = "READY FOR PICKUP";
        });
      } else {
        print('Failed to mark ready: ${response.body}');
      }
    } catch (e) {
      print('Error marking ready: $e');
    }
  }

  Future<void> _plateDispensed() async {
    final url = Uri.parse('${BASE_URL}machine/plate-dispensed');
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString("token");
    try {
      final response = await http.post(
        url,
        headers: {
          ...getSecureHeaders(),
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          'oid': widget.order.sId,
          'mid': widget.order.machineId ?? 'm01', // adjust as needed
        }),
      );
      if (response.statusCode == 200) {
        setState(() {
          orderCompleted = true;
          orderStatus = "COMPLETED";
        });
        // Optionally, navigate to home after a short delay
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (context) => HomeScreen()),
              (route) => false,
            );
          }
        });
      } else {
        print('Failed to mark plate dispensed: ${response.body}');
      }
    } catch (e) {
      print('Error marking plate dispensed: $e');
    }
  }

  void _dispenseOrder() async {
    await _plateDispensed();
  }

  void _markAsReadyForPickup() async {
    await _markOrderReadyForPickup();
  }
  // Add startMachine API call using machine token
  Future<void> _startMachine(String otp, String mid) async {
    final url = Uri.parse('${BASE_URL}machine/startmachine');
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString("token");
    print("Using machine_token: $token"); // Debug print
    try {
      final response = await http.post(
        url,
        headers: {
          ...getSecureHeaders(),
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          'orderOtp': otp,
          'mid': mid,
        }),
      );
      print('Start machine response status: \\${response.statusCode}');
      print('Start machine response body: \\${response.body}');
      if (response.statusCode == 200) {
        // handle success, e.g. update UI or state
      } else {
        print('Failed to start machine: \\${response.body}');
      }
    } catch (e) {
      print('Error starting machine: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFFCF6FF), // Soft background
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(64.0),
        child: AppBar(
          title: Center(child: SvgPicture.asset("assets/logo.svg", height: 40)),
          backgroundColor: CPrimary,
          automaticallyImplyLeading: false,
          elevation: 0,
        ),
      ),
      body: Center(
        child: SingleChildScrollView(
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Card for order info and status
                Card(
                  elevation: 4,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24.0, horizontal: 28.0),
                    child: Column(
                      children: [
                        Text(
                          "Order ID: ${widget.order.sId ?? 'N/A'}",
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        SizedBox(height: 8),
                        Text(
                          "Status: $orderStatus",
                          style: TextStyle(
                            fontSize: 16,
                            color: orderCompleted ? Colors.green : readyForPickup ? Colors.blue : Colors.orange,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          "Order Number: ${widget.order.orderCounter != null && widget.order.orderCounter! > 0 ? '#${widget.order.orderCounter}' : 'Processing...'}",
                          style: TextStyle(fontSize: 16, color: CPrimary, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                ),
                SizedBox(height: 32),

                // Status section
                if (orderCompleted) ...[
                  Icon(Icons.check_circle, size: 80, color: Colors.green),
                  SizedBox(height: 18),
                  Text("Order Completed!", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.green)),
                  SizedBox(height: 10),
                  Text("Food has been dispensed", style: TextStyle(fontSize: 16, color: Colors.grey[600])),
                  SizedBox(height: 18),
                  Text("Returning to home screen...", style: TextStyle(fontSize: 14, color: Colors.grey[500], fontStyle: FontStyle.italic)),
                ] else if (readyForPickup) ...[
                  Icon(Icons.restaurant_menu, size: 80, color: Colors.blue),
                  SizedBox(height: 18),
                  Text("Food Ready!", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.blue)),
                  SizedBox(height: 10),
                  Text("Food preparation is complete", style: TextStyle(fontSize: 16, color: Colors.grey[600])),
                  SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _dispenseOrder,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      padding: EdgeInsets.symmetric(horizontal: 36, vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    ),
                    child: Text("Dispense Food", style: TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ] else ...[
                  Icon(Icons.restaurant, size: 80, color: Colors.orange),
                  SizedBox(height: 18),
                  Text("Preparing Your Order", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.orange)),
                  SizedBox(height: 10),
                  Text("Please wait while the machine prepares your food...", style: TextStyle(fontSize: 16, color: Colors.grey[600]), textAlign: TextAlign.center),
                  SizedBox(height: 24),
                  CircularProgressIndicator(
                    backgroundColor: Colors.grey[300],
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.orange),
                    strokeWidth: 5,
                  ),
                ],

                SizedBox(height: 36),

                // Buttons
                if (!orderCompleted)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (!readyForPickup) ...[
                        ElevatedButton(
                          onPressed: () {
                            Navigator.pushAndRemoveUntil(
                              context,
                              MaterialPageRoute(builder: (context) => HomeScreen()),
                              (route) => false,
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.grey[400],
                            padding: EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                          ),
                          child: Text("Cancel Order", style: TextStyle(fontSize: 16, color: Colors.white)),
                        ),
                        SizedBox(width: 18),
                        ElevatedButton(
                          onPressed: _markAsReadyForPickup,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            padding: EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                          ),
                          child: Text("Admin: Mark Ready", style: TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

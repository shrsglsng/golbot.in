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
    // Start with the actual order status
    _initializeOrderStatus();
  }

  void _initializeOrderStatus() {
    // Use the real order data passed to this screen
    setState(() {
      orderStatus = "PREPARING";
    });
    print('Order initialized with real data - Order ID: ${widget.order.sId}');
  }

  // Function to manually mark as ready for pickup (admin control)
  Future<void> _markAsReadyForPickup() async {
    setState(() {
      readyForPickup = true;
      orderStatus = "READY_FOR_PICKUP";
    });
    
    // Show feedback to user
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Order marked as ready for pickup!"),
        backgroundColor: Colors.blue,
      ),
    );
    
    // Call API to mark order as ready for pickup
    await _markOrderReadyForPickup();
  }

  Future<void> _markOrderReadyForPickup() async {
    try {
      // Get the machine token from SharedPreferences (same as startMachine)
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("token");
      
      final response = await http.post(
        Uri.parse('${BASE_URL}machine/ready-for-pickup'),
        headers: {
          ...getSecureHeaders(),
          "Authorization": "Bearer $token",
        },
        body: json.encode({"mid": "m01"}),
      );
      
      print('Ready for pickup response: ${response.statusCode}');
      print('Ready for pickup body: ${response.body}');
      
      if (response.statusCode == 200) {
        print('Successfully marked order as ready for pickup');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Order marked as ready for pickup!"),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        print('Failed to mark ready for pickup: ${response.statusCode} - ${response.body}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Failed to mark ready for pickup"),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      print('Error marking ready for pickup: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error: $e"),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _dispenseOrder() async {
    try {
      // Get the machine token from SharedPreferences (same as startMachine)
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("token");
      
      final response = await http.post(
        Uri.parse('${BASE_URL}machine/plate-dispensed'),
        headers: {
          ...getSecureHeaders(),
          "Authorization": "Bearer $token",
        },
        body: json.encode({
          "oid": widget.order.sId,
          "mid": "m01"
        }),
      );
      
      print('Dispense response: ${response.statusCode}');
      print('Dispense body: ${response.body}');
      
      if (response.statusCode == 200) {
        setState(() {
          orderCompleted = true;
          orderStatus = "COMPLETED";
        });
        
        print('Order completed successfully, navigating to home...');
        
        // Auto-navigate back to home after completion
        Future.delayed(Duration(seconds: 2), () {
          if (mounted) {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (context) => HomeScreen()),
              (route) => false,
            );
          }
        });
      } else {
        print('Error dispensing order: ${response.statusCode} - ${response.body}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error dispensing order: ${response.statusCode}")),
        );
      }
    } catch (e) {
      print('Error dispensing order: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error dispensing order: $e")),
      );
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
                    "Status: $orderStatus",
                    style: TextStyle(
                      fontSize: 16,
                      color: orderCompleted ? Colors.green : 
                             readyForPickup ? Colors.blue : Colors.orange,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    "Order Number: ${widget.order.orderCounter != null && widget.order.orderCounter! > 0 ? '#${widget.order.orderCounter}' : 'Processing...'}",
                    style: TextStyle(
                      fontSize: 16,
                      color: CPrimary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            
            SizedBox(height: 40),
            
            // Different UI based on order status
            if (orderCompleted) ...[
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
                "Food has been dispensed",
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
            ] else if (readyForPickup) ...[
              Icon(
                Icons.restaurant_menu,
                size: 100,
                color: Colors.blue,
              ),
              SizedBox(height: 24),
              Text(
                "Food Ready!",
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue,
                ),
              ),
              SizedBox(height: 16),
              Text(
                "Food preparation is complete",
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
              ),
              SizedBox(height: 32),
              ElevatedButton(
                onPressed: _dispenseOrder,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  padding: EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
                child: Text(
                  "Dispense Food",
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ] else ...[
              Icon(
                Icons.restaurant,
                size: 100,
                color: Colors.orange,
              ),
              SizedBox(height: 24),
              Text(
                "Preparing Your Order",
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange,
                ),
              ),
              SizedBox(height: 16),
              Text(
                "Please wait while the machine prepares your food...",
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 32),
              CircularProgressIndicator(
                backgroundColor: Colors.grey[300],
                valueColor: AlwaysStoppedAnimation<Color>(Colors.orange),
                strokeWidth: 6,
              ),
            ],
            
            SizedBox(height: 40),
            
            // Manual controls
            if (!orderCompleted)
              Column(
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
                    SizedBox(height: 16),
                    // Admin control to manually mark as ready
                    ElevatedButton(
                      onPressed: _markAsReadyForPickup,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        padding: EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                      ),
                      child: Text(
                        "Admin: Mark Ready",
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
          ],
        ),
      ),
    );
  }
}

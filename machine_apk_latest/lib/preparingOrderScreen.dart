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
  }

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
          'mid': widget.order.machineId ?? 'm01',
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
          'mid': widget.order.machineId ?? 'm01',
        }),
      );
      if (response.statusCode == 200) {
        setState(() {
          orderCompleted = true;
          orderStatus = "COMPLETED";
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

  void _goHome() {
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => HomeScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F6FA),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(64.0),
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
            constraints: const BoxConstraints(maxWidth: 420),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Card(
                  elevation: 8,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  shadowColor: Colors.black12,
                  color: Colors.white,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 28.0, horizontal: 32.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Order ID:", style: TextStyle(fontSize: 14, color: Colors.grey[600], fontWeight: FontWeight.w500)),
                        const SizedBox(height: 2),
                        SelectableText(widget.order.sId ?? 'N/A', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Text("Status: ", style: TextStyle(fontSize: 15, color: Colors.grey[700], fontWeight: FontWeight.w500)),
                            Text(orderStatus, style: TextStyle(fontSize: 15, color: orderCompleted ? Colors.green[700] : readyForPickup ? Colors.blue[700] : Colors.orange[700], fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text("Order Number: ${widget.order.orderCounter != null && widget.order.orderCounter! > 0 ? '#${widget.order.orderCounter}' : 'Processing...'}", style: TextStyle(fontSize: 15, color: CPrimary, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 38),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 350),
                  child: orderCompleted
                      ? Column(
                          key: const ValueKey("completed"),
                          children: [
                            Icon(Icons.check_circle_rounded, size: 90, color: Colors.green[600]),
                            const SizedBox(height: 20),
                            Text("Order Completed!", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.green[700], letterSpacing: 0.2)),
                            const SizedBox(height: 12),
                            Text("Food has been dispensed", style: TextStyle(fontSize: 17, color: Colors.grey[700])),
                            const SizedBox(height: 18),
                            Text("Press 'Go to Home' to continue.", style: TextStyle(fontSize: 14, color: Colors.grey[500], fontStyle: FontStyle.italic)),
                            const SizedBox(height: 28),
                            ElevatedButton.icon(
                              onPressed: _goHome,
                              icon: const Icon(Icons.home, color: Colors.white),
                              label: const Text("Go to Home", style: TextStyle(fontSize: 18, color: Colors.white)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.blue[700],
                                padding: const EdgeInsets.symmetric(horizontal: 38, vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                                elevation: 2,
                              ),
                            ),
                          ],
                        )
                      : readyForPickup
                          ? Column(
                              key: const ValueKey("ready"),
                              children: [
                                Icon(Icons.restaurant_menu_rounded, size: 90, color: Colors.blue[600]),
                                const SizedBox(height: 20),
                                Text("Food Ready!", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.blue[700], letterSpacing: 0.2)),
                                const SizedBox(height: 12),
                                Text("Food preparation is complete", style: TextStyle(fontSize: 17, color: Colors.grey[700])),
                                const SizedBox(height: 28),
                                ElevatedButton.icon(
                                  onPressed: _dispenseOrder,
                                  icon: const Icon(Icons.check, color: Colors.white),
                                  label: const Text("Dispense Food", style: TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.green[600],
                                    padding: const EdgeInsets.symmetric(horizontal: 38, vertical: 16),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                                    elevation: 2,
                                  ),
                                ),
                              ],
                            )
                          : Column(
                              key: const ValueKey("preparing"),
                              children: [
                                Icon(Icons.restaurant_rounded, size: 90, color: Colors.orange[600]),
                                const SizedBox(height: 20),
                                Text("Preparing Your Order", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.orange[700], letterSpacing: 0.2)),
                                const SizedBox(height: 12),
                                Text("Please wait while the machine prepares your food...", style: TextStyle(fontSize: 17, color: Colors.grey[700]), textAlign: TextAlign.center),
                                const SizedBox(height: 28),
                                CircularProgressIndicator(
                                  backgroundColor: Colors.grey[300],
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.orange[600]!),
                                  strokeWidth: 5,
                                ),
                              ],
                            ),
                ),
                const SizedBox(height: 40),
                if (!orderCompleted && !readyForPickup)
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 16,
                    runSpacing: 12,
                    children: [
                      ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pushAndRemoveUntil(
                            context,
                            MaterialPageRoute(builder: (context) => HomeScreen()),
                            (route) => false,
                          );
                        },
                        icon: const Icon(Icons.cancel, color: Colors.white),
                        label: const Text("Cancel Order", style: TextStyle(fontSize: 16, color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey[500],
                          padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                          elevation: 1,
                        ),
                      ),
                      ElevatedButton.icon(
                        onPressed: _markAsReadyForPickup,
                        icon: const Icon(Icons.check_circle, color: Colors.white),
                        label: const Text("Admin: Mark Ready", style: TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue[700],
                          padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                          elevation: 1,
                        ),
                      ),
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

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_application_1/utils/constants.dart';
import 'package:flutter_application_1/models/orderModel.dart';
import 'package:flutter_application_1/HomeScreen.dart';
import 'package:flutter_application_1/services/cancelOrder.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'services/firmwareService.dart';
import 'services/storageService.dart';

class PreparingOrderScreen extends StatefulWidget {
  final Order? order;
  final String? orderOtp;
  final bool isAutoMode;

  PreparingOrderScreen({
    super.key,
    this.order,
    this.orderOtp,
    this.isAutoMode = false,
  }) : assert(order != null || orderOtp != null,
            'Either order or orderOtp must be provided');

  @override
  State<PreparingOrderScreen> createState() => _PreparingOrderScreenState();
}

class _PreparingOrderScreenState extends State<PreparingOrderScreen> {
  final FirmwareService _firmwareService = FirmwareService();
  final StorageService _storageService = StorageService();

  bool orderCompleted = false;
  bool readyForPickup = false;
  String orderStatus = "OTP_VERIFIED"; // Initial state after OTP verification
  Order? _order;
  Timer? _autoProgressTimer;
  Timer? _statusPollingTimer; // Poll backend for order status updates
  String? _machineId;
  bool _isLoading = true;
  bool _isCancelling = false; // Prevent multiple cancel requests

  // State transition lock to prevent race conditions
  bool _isTransitioning = false; // Prevents concurrent state changes or navigation

  @override
  void initState() {
    super.initState();
    _initializeOrder();
  }

  @override
  void dispose() {
    _autoProgressTimer?.cancel();
    _statusPollingTimer?.cancel();
    super.dispose();
  }

  /// Initialize order and start auto-progression if in firmware mode
  Future<void> _initializeOrder() async {
    final prefs = await SharedPreferences.getInstance();
    final machineData = prefs.getString("machine");
    _machineId = machineData != null ? jsonDecode(machineData)["mid"] : 'M01';

    if (widget.order != null) {
      // Manual mode: use provided order
      _order = widget.order;
      // Set initial status from order
      setState(() {
        orderStatus = _order!.ostatus ?? "OTP_VERIFIED";
        
        // Sync UI booleans with the restored order status
        if (orderStatus == "READY_FOR_PICKUP") {
          readyForPickup = true;
        } else if (orderStatus == "COMPLETED") {
          orderCompleted = true;
        }
        
        _isLoading = false;
      });

      // Save to storage for disaster recovery (even in manual mode)
      await _storageService.saveCurrentOrder(
        orderId: _order!.sId!,
        orderState: orderStatus,
        orderData: jsonEncode(_order!.toJson()),
      );
      print('[PreparingOrder] Saved initial order state: $orderStatus');
    } else if (widget.orderOtp != null) {
      // Auto mode: fetch order details using OTP
      await _fetchOrderByOtp(widget.orderOtp!);
    }

    // Start polling for order status updates (for all modes)
    if (_order != null) {
      print('[PreparingOrder] Starting status polling for order ${_order!.sId}');
      _startStatusPolling();
    }

    if (widget.isAutoMode && _order != null) {
      // Start preparation via firmware API
      await _startPreparation();

      // Save initial state for disaster recovery
      await _storageService.saveCurrentOrder(
        orderId: _order!.sId!,
        orderState: 'PREPARING',
        orderData: jsonEncode(_order!.toJson()),
      );

      // Start auto-progression
      _scheduleAutoReady();
    }
  }

  /// Start polling backend for order status updates
  void _startStatusPolling() {
    // Poll every 3 seconds to sync with backend
    _statusPollingTimer = Timer.periodic(Duration(seconds: 3), (timer) async {
      await _pollOrderStatus();
    });
  }

  /// Poll backend for latest order status using firmware endpoint
  Future<void> _pollOrderStatus() async {
    if (_order == null || orderCompleted) {
      return; // Stop polling if no order or already completed
    }

    try {
      // Use firmware endpoint to get machine status with current order
      final machineStatus = await _firmwareService.getMachineStatus(_machineId!);

      print('[StatusPoll] Machine status response: ${machineStatus != null}');

      if (machineStatus != null && machineStatus['currentOrder'] != null) {
        final currentOrder = machineStatus['currentOrder'];
        final latestStatus = currentOrder['orderStatus'] ?? currentOrder['status'];

        print('[StatusPoll] Latest status from backend: $latestStatus, current UI status: $orderStatus');

        // Update UI if status changed
        if (latestStatus != orderStatus && mounted) {
          print('[StatusPoll] ✅ Status changed: $orderStatus → $latestStatus');
          setState(() {
            orderStatus = latestStatus;

            // Update UI flags based on status
            if (latestStatus == "READY_FOR_PICKUP") {
              readyForPickup = true;
            } else if (latestStatus == "COMPLETED") {
              orderCompleted = true;
              _statusPollingTimer?.cancel(); // Stop polling when completed
            } else if (latestStatus == "CANCELLED") {
              _statusPollingTimer?.cancel(); // Stop polling when cancelled
              // Auto-navigate home after 3 seconds
              _autoProgressTimer?.cancel(); // Cancel any existing timer first
              _autoProgressTimer = Timer(Duration(seconds: 3), () {
                if (mounted) {
                  _goHome();
                }
              });
            }
          });

          // Update local storage
          await _storageService.saveCurrentOrder(
            orderId: _order!.sId!,
            orderState: latestStatus,
            orderData: jsonEncode(currentOrder),
          );

          // Clear storage if completed or cancelled
          if (orderCompleted || latestStatus == "CANCELLED") {
            await _storageService.clearCurrentOrder();
          }
        } else {
          print('[StatusPoll] No status change detected');
        }
      } else if (machineStatus != null && machineStatus['currentOrder'] == null) {
        // Backend says no current order - verify before clearing storage
        // Could be legitimate (cancelled/completed externally) or temporary backend issue
        print('[StatusPoll] Backend reports no current order - verifying order existence');

        if (_order != null && mounted) {
          try {
            // Verify order existence by fetching directly from backend
            final orderData = await _firmwareService.getOrderStatusById(_order!.sId!);

            if (orderData != null) {
              final latestStatus = orderData['orderStatus'];
              print('[StatusPoll] Order verified as existing: $latestStatus');

              // Check if order reached terminal state (COMPLETED or CANCELLED)
              if (latestStatus == 'COMPLETED' || latestStatus == 'CANCELLED') {
                print('[StatusPoll] Order reached terminal state: $latestStatus - updating UI');

                if (mounted) {
                  setState(() {
                    orderStatus = latestStatus;

                    if (latestStatus == 'COMPLETED') {
                      orderCompleted = true;
                    }
                  });

                  // Clear storage and stop polling
                  await _storageService.clearCurrentOrder();
                  _statusPollingTimer?.cancel();

                  // Auto-navigate home after 3 seconds
                  if (latestStatus == 'COMPLETED') {
                    _autoProgressTimer?.cancel();
                    _autoProgressTimer = Timer(Duration(seconds: 3), () {
                      if (mounted) _goHome();
                    });
                  } else if (latestStatus == 'CANCELLED') {
                    _autoProgressTimer?.cancel();
                    _autoProgressTimer = Timer(Duration(seconds: 2), () {
                      if (mounted) _goHome();
                    });
                  }
                }
              } else {
                // Order exists but not in terminal state - machine status might be temporarily out of sync
                print('[StatusPoll] Order in non-terminal state: $latestStatus - continue polling');
                // Keep polling, don't clear storage
              }
            } else {
              // Order does not exist (404) - safe to clear storage
              print('[StatusPoll] Order confirmed as non-existent - clearing storage');
              await _storageService.clearCurrentOrder();
              _statusPollingTimer?.cancel();

              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Order no longer exists. Returning to home.'),
                    backgroundColor: Colors.orange,
                  ),
                );

                _autoProgressTimer?.cancel();
                _autoProgressTimer = Timer(Duration(seconds: 2), () {
                  if (mounted) _goHome();
                });
              }
            }
          } catch (e) {
            // Network error or backend issue - do not clear storage, keep polling
            print('[StatusPoll] Could not verify order existence: $e - will keep polling');
            // Continue polling, don't clear storage
          }
        }
      } else {
        // Network error - retry
        print('[StatusPoll] Could not fetch machine status (network error) - will retry');
      }
    } catch (e) {
      print('[StatusPoll] Error polling order status: $e');
      // Don't show error to user, just log it
    }
  }

  /// Fetch order details using OTP
  Future<void> _fetchOrderByOtp(String otp) async {
    try {
      final url = Uri.parse('${BASE_URL}machine/verify-otp');
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("token");

      final response = await http.post(
        url,
        headers: {
          ...getSecureHeaders(),
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({'otp': otp, 'mid': _machineId}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _order = Order.fromJson(data['data']['order']);
        setState(() {
          _isLoading = false;
        });
      } else {
        print('Failed to fetch order: ${response.body}');
        _showError('Failed to load order details');
      }
    } catch (e) {
      print('Error fetching order: $e');
      _showError('Error loading order: $e');
    }
  }

  /// Start order preparation via firmware API
  Future<void> _startPreparation() async {
    if (_order == null || _machineId == null) return;

    try {
      final success = await _firmwareService.startOrderPreparation(
        _order!.sId!,
        _machineId!,
      );

      if (success) {
        // Update status to PREPARING after firmware starts
        setState(() {
          orderStatus = "PREPARING";
        });
      } else {
        print('[PreparingOrder] Failed to start preparation');
        _showError('Failed to start preparation');
      }
    } catch (e) {
      print('[PreparingOrder] Start preparation error: $e');
      _showError('Error starting preparation: $e');
    }
  }

  /// Schedule automatic transition to READY_FOR_PICKUP
  void _scheduleAutoReady() {
    _autoProgressTimer = Timer(
      Duration(seconds: AUTO_READY_DELAY),
      () async {
        await _autoMarkReady();
      },
    );
  }

  /// Automatically mark order as ready
  Future<void> _autoMarkReady() async {
    if (!widget.isAutoMode || _order == null || _machineId == null) return;

    try {
      final success = await _firmwareService.markOrderReady(
        _order!.sId!,
        _machineId!,
      );

      if (success) {
        setState(() {
          readyForPickup = true;
          orderStatus = "READY FOR PICKUP";
        });

        // Update storage
        await _storageService.updateOrderState('READY_FOR_PICKUP');

        // Schedule auto-complete
        _scheduleAutoComplete();
      } else {
        print('[PreparingOrder] Failed to mark ready');
      }
    } catch (e) {
      print('[PreparingOrder] Auto mark ready error: $e');
    }
  }

  /// Schedule automatic transition to COMPLETED
  void _scheduleAutoComplete() {
    _autoProgressTimer = Timer(
      Duration(seconds: AUTO_COMPLETE_DELAY),
      () async {
        await _autoCompleteOrder();
      },
    );
  }

  /// Automatically complete order
  Future<void> _autoCompleteOrder() async {
    if (!widget.isAutoMode || _order == null || _machineId == null) return;

    try {
      final success = await _firmwareService.completeOrder(
        _order!.sId!,
        _machineId!,
      );

      if (success) {
        setState(() {
          orderCompleted = true;
          orderStatus = "COMPLETED";
        });

        // Clear storage
        await _storageService.clearCurrentOrder();

        // Auto-navigate to home after 2 seconds
        Timer(Duration(seconds: 2), () {
          if (mounted) {
            _goHome();
          }
        });
      } else {
        print('[PreparingOrder] Failed to complete order');
      }
    } catch (e) {
      print('[PreparingOrder] Auto complete error: $e');
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  /// Manual fallback: Mark order ready for pickup
  Future<void> _markOrderReadyForPickup() async {
    if (_order == null) return;

    // Always use firmware API
    final success = await _firmwareService.markOrderReady(
      _order!.sId!,
      _machineId!,
    );
    if (success) {
      setState(() {
        readyForPickup = true;
        orderStatus = "READY FOR PICKUP";
      });
      await _storageService.updateOrderState('READY_FOR_PICKUP');
    } else {
      _showError('Failed to mark order ready');
    }
  }

  /// Manual fallback: Dispense plate (complete order)
  Future<void> _plateDispensed() async {
    if (_order == null) return;

    // Always use firmware API
    final success = await _firmwareService.completeOrder(
      _order!.sId!,
      _machineId!,
    );
    if (success) {
      setState(() {
        orderCompleted = true;
        orderStatus = "COMPLETED";
      });
      await _storageService.clearCurrentOrder();
    } else {
      _showError('Failed to complete order');
    }
  }

  void _dispenseOrder() async {
    await _plateDispensed();
  }

  void _markAsReadyForPickup() async {
    await _markOrderReadyForPickup();
  }

  void _goHome() {
    // Prevent multiple navigation attempts
    if (_isTransitioning) {
      print('[PreparingOrder] Navigation already in progress, ignoring duplicate call');
      return;
    }

    _isTransitioning = true;

    // Cancel all timers before navigating
    _autoProgressTimer?.cancel();
    _statusPollingTimer?.cancel();

    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => HomeScreen()),
        (route) => false,
      );
    }
  }

  Future<void> _cancelOrder() async {
    if (_order == null || _isCancelling) return;

    // Show confirmation dialog
    bool? shouldCancel = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Cancel Order?'),
          content: Text(
              'Are you sure you want to cancel this order? This action cannot be undone.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text('No'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: Text('Yes, Cancel'),
              style: TextButton.styleFrom(foregroundColor: Colors.red),
            ),
          ],
        );
      },
    );

    if (shouldCancel == true) {
      setState(() {
        _isCancelling = true;
      });

      try {
        // Always use firmware API
        final success = await _firmwareService.cancelOrder(
          _order!.sId!,
          _machineId!,
          'Order cancelled by machine operator',
        );

        if (!mounted) return; // Check if widget is still mounted

        if (success) {
          await _storageService.clearCurrentOrder();

          // Show success message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Order cancelled successfully'),
              backgroundColor: Colors.green,
            ),
          );
          // Navigate back to home
          _goHome();
        } else {
          // Show error message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to cancel order. Please try again.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _isCancelling = false;
          });
        }
      }
    }
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
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading order details...'),
                ],
              ),
            )
          : Center(
              child: SingleChildScrollView(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 420),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Firmware mode indicator
                      if (widget.isAutoMode)
                        Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.black87,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.settings_input_component,
                                color: Colors.orange,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Firmware Auto Mode Active',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      Card(
                        elevation: 8,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20)),
                        shadowColor: Colors.black12,
                        color: Colors.white,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              vertical: 28.0, horizontal: 32.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("Order ID:",
                                  style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey[600],
                                      fontWeight: FontWeight.w500)),
                              const SizedBox(height: 2),
                              SelectableText(_order?.sId ?? 'N/A',
                                  style: const TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5)),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  Text("Status: ",
                                      style: TextStyle(
                                          fontSize: 15,
                                          color: Colors.grey[700],
                                          fontWeight: FontWeight.w500)),
                                  Text(orderStatus,
                                      style: TextStyle(
                                          fontSize: 15,
                                          color: orderCompleted
                                              ? Colors.green[700]
                                              : readyForPickup
                                                  ? Colors.blue[700]
                                                  : Colors.orange[700],
                                          fontWeight: FontWeight.bold)),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                  "Order Number: ${_order?.orderCounter != null && _order!.orderCounter! > 0 ? '#${_order!.orderCounter}' : 'Processing...'}",
                                  style: TextStyle(
                                      fontSize: 15,
                                      color: CPrimary,
                                      fontWeight: FontWeight.w600)),
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
                      : orderStatus == "CANCELLED"
                          ? Column(
                              key: const ValueKey("cancelled"),
                              children: [
                                Icon(Icons.cancel_rounded, size: 90, color: Colors.red[600]),
                                const SizedBox(height: 20),
                                Text("Order Cancelled", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.red[700], letterSpacing: 0.2)),
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
                          : orderStatus == "OTP_VERIFIED"
                              ? Column(
                                  key: const ValueKey("otp_verified"),
                                  children: [
                                    Icon(Icons.verified_rounded, size: 90, color: Colors.blue[600]),
                                    const SizedBox(height: 20),
                                    Text("OTP Verified", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.blue[700], letterSpacing: 0.2)),
                                    const SizedBox(height: 12),
                                    Text("Waiting for machine to start preparation...", style: TextStyle(fontSize: 17, color: Colors.grey[700]), textAlign: TextAlign.center),
                                    const SizedBox(height: 28),
                                    CircularProgressIndicator(
                                      backgroundColor: Colors.grey[300],
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.blue[600]!),
                                      strokeWidth: 5,
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
                      // Control buttons (hide if completed, ready for pickup, or cancelled)
                      if (!orderCompleted && !readyForPickup && orderStatus != "CANCELLED")
                        Wrap(
                          alignment: WrapAlignment.center,
                          spacing: 16,
                          runSpacing: 12,
                          children: [
                            // Start Preparation button (only show if OTP_VERIFIED)
                            if (orderStatus == "OTP_VERIFIED")
                              ElevatedButton.icon(
                                onPressed: _startPreparation,
                                icon: const Icon(Icons.play_arrow,
                                    color: Colors.white),
                                label: Text(
                                  "Start Preparation",
                                  style: TextStyle(
                                      fontSize: 16,
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.green[700],
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 30, vertical: 16),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(24)),
                                  elevation: 1,
                                ),
                              ),
                            // Cancel button (always available)
                            ElevatedButton.icon(
                              onPressed: _isCancelling ? null : _cancelOrder,
                              icon: _isCancelling
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Icon(Icons.cancel, color: Colors.white),
                              label: Text(
                                _isCancelling
                                    ? "Cancelling..."
                                    : (widget.isAutoMode
                                        ? "Emergency Cancel"
                                        : "Cancel Order"),
                                style: TextStyle(
                                    fontSize: 16, color: Colors.white),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red[600],
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 30, vertical: 16),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(24)),
                                elevation: 1,
                              ),
                            ),
                            // Mark Ready button (only show if PREPARING)
                            if (orderStatus == "PREPARING")
                              ElevatedButton.icon(
                                onPressed: _markAsReadyForPickup,
                                icon: const Icon(Icons.check_circle,
                                    color: Colors.white),
                                label: Text(
                                  "Mark Ready",
                                  style: TextStyle(
                                      fontSize: 16,
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.blue[700],
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 30, vertical: 16),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(24)),
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

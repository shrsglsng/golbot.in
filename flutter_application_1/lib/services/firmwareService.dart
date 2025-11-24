import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../utils/constants.dart';

class FirmwareService {
  static const _secureStorage = FlutterSecureStorage();

  // Get stored machine credentials from secure storage
  Future<Map<String, String>?> _getMachineCredentials() async {
    final mid = await _secureStorage.read(key: 'mid');
    final password = await _secureStorage.read(key: 'password');

    if (mid == null || password == null) {
      return null;
    }

    return {'mid': mid, 'password': password};
  }

  // Get firmware API headers with machine credentials
  Future<Map<String, String>> _getFirmwareHeaders() async {
    final credentials = await _getMachineCredentials();

    if (credentials == null) {
      throw Exception('Machine not logged in');
    }

    return {
      'Content-Type': 'application/json',
      'X-Machine-ID': credentials['mid']!,
      'X-Machine-Password': credentials['password']!,
    };
  }

  /// Poll for next order
  /// Returns order object if available, null if no orders
  Future<Map<String, dynamic>?> pollForNextOrder(String mid) async {
    try {
      final headers = await _getFirmwareHeaders();

      final response = await http.get(
        Uri.parse('${FIRMWARE_API_URL}orders/next?mid=$mid'),
        headers: headers,
      );

      print('[Firmware] Poll response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        if (data['success'] && data['data']['hasOrder']) {
          print('[Firmware] Order found: ${data['data']['order']['orderId']}');
          return data['data']['order'];
        } else {
          print('[Firmware] No pending orders');
          return null;
        }
      } else {
        print('[Firmware] Poll failed: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('[Firmware] Poll error: $e');
      return null;
    }
  }

  /// Start order preparation
  /// Updates order status from PAID -> PREPARING
  Future<bool> startOrderPreparation(String orderId, String mid) async {
    try {
      final headers = await _getFirmwareHeaders();

      final response = await http.post(
        Uri.parse('${FIRMWARE_API_URL}orders/$orderId/start'),
        headers: headers,
        body: json.encode({'mid': mid}),
      );

      print('[Firmware] Start preparation response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('[Firmware] Preparation started: ${data['message']}');
        return data['success'];
      } else {
        print('[Firmware] Start preparation failed: ${response.body}');
        return false;
      }
    } catch (e) {
      print('[Firmware] Start preparation error: $e');
      return false;
    }
  }

  /// Mark order ready for pickup
  /// Updates order status from PREPARING -> READY_FOR_PICKUP
  Future<bool> markOrderReady(String orderId, String mid) async {
    try {
      final headers = await _getFirmwareHeaders();

      final response = await http.post(
        Uri.parse('${FIRMWARE_API_URL}orders/$orderId/ready'),
        headers: headers,
        body: json.encode({'mid': mid}),
      );

      print('[Firmware] Mark ready response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('[Firmware] Order ready: ${data['message']}');
        return data['success'];
      } else {
        print('[Firmware] Mark ready failed: ${response.body}');
        return false;
      }
    } catch (e) {
      print('[Firmware] Mark ready error: $e');
      return false;
    }
  }

  /// Complete order (plate dispensed)
  /// Updates order status from READY_FOR_PICKUP -> COMPLETED
  Future<bool> completeOrder(String orderId, String mid) async {
    try {
      final headers = await _getFirmwareHeaders();

      final response = await http.post(
        Uri.parse('${FIRMWARE_API_URL}orders/$orderId/complete'),
        headers: headers,
        body: json.encode({'mid': mid}),
      );

      print('[Firmware] Complete order response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('[Firmware] Order completed: ${data['message']}');
        return data['success'];
      } else {
        print('[Firmware] Complete order failed: ${response.body}');
        return false;
      }
    } catch (e) {
      print('[Firmware] Complete order error: $e');
      return false;
    }
  }

  /// Cancel order
  /// Updates order status to CANCELLED and refunds puris
  Future<bool> cancelOrder(String orderId, String mid, String reason) async {
    try {
      final headers = await _getFirmwareHeaders();

      final response = await http.post(
        Uri.parse('${FIRMWARE_API_URL}orders/$orderId/cancel'),
        headers: headers,
        body: json.encode({'mid': mid, 'reason': reason}),
      );

      print('[Firmware] Cancel order response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('[Firmware] Order cancelled: ${data['message']}');
        return data['success'];
      } else {
        print('[Firmware] Cancel order failed: ${response.body}');
        return false;
      }
    } catch (e) {
      print('[Firmware] Cancel order error: $e');
      return false;
    }
  }

  /// Get machine status and current active order
  /// Used for disaster recovery
  Future<Map<String, dynamic>?> getMachineStatus(String mid) async {
    try {
      final headers = await _getFirmwareHeaders();

      final response = await http.get(
        Uri.parse('${FIRMWARE_API_URL}machine/status?mid=$mid'),
        headers: headers,
      );

      print('[Firmware] Get status response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('[Firmware] Machine status: ${data['data']['status']}');
        return data['data'];
      } else {
        print('[Firmware] Get status failed: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('[Firmware] Get status error: $e');
      return null;
    }
  }

  /// Get specific order status by ID
  /// Used to verify if order truly exists before clearing local storage
  /// Returns:
  /// - Map with order data if order exists
  /// - null if order doesn't exist (404)
  /// - throws Exception for other errors (network, auth, etc.)
  Future<Map<String, dynamic>?> getOrderStatusById(String orderId) async {
    try {
      final headers = await _getFirmwareHeaders();

      final response = await http.get(
        Uri.parse('${FIRMWARE_API_URL}orders/$orderId/status'),
        headers: headers,
      );

      print('[Firmware] Get order status response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('[Firmware] Order status: ${data['data']['orderStatus']}');
        return data['data'];
      } else if (response.statusCode == 404) {
        print('[Firmware] Order not found: $orderId');
        return null; // Order doesn't exist
      } else {
        // Other errors (500, 403, etc.) - throw to indicate backend issue
        final errorBody = response.body;
        print('[Firmware] Get order status failed: ${response.statusCode} - $errorBody');
        throw Exception('Failed to fetch order status: ${response.statusCode}');
      }
    } catch (e) {
      // Network errors or other exceptions
      print('[Firmware] Get order status error: $e');
      rethrow; // Let caller handle this
    }
  }

  /// Send heartbeat to server
  /// Updates lastHeartbeatAt timestamp
  Future<bool> sendHeartbeat(String mid, String status,
      {String? firmwareVersion}) async {
    try {
      final headers = await _getFirmwareHeaders();

      final body = {
        'mid': mid,
        'status': status,
        if (firmwareVersion != null) 'firmwareVersion': firmwareVersion,
      };

      final response = await http.post(
        Uri.parse('${FIRMWARE_API_URL}heartbeat'),
        headers: headers,
        body: json.encode(body),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'];
      } else {
        print('[Firmware] Heartbeat failed: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      print('[Firmware] Heartbeat error: $e');
      return false;
    }
  }

  /// Log firmware error to server
  Future<void> logError(String mid, String errorCode, String errorMessage,
      {String? orderId, String? severity}) async {
    try {
      final headers = await _getFirmwareHeaders();

      final body = {
        'mid': mid,
        'errorCode': errorCode,
        'errorMessage': errorMessage,
        if (orderId != null) 'orderId': orderId,
        if (severity != null) 'severity': severity,
      };

      await http.post(
        Uri.parse('${FIRMWARE_API_URL}error'),
        headers: headers,
        body: json.encode(body),
      );
    } catch (e) {
      print('[Firmware] Log error failed: $e');
    }
  }
}

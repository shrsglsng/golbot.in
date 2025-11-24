import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';

/// Local storage service for firmware state persistence
/// Enables disaster recovery by storing current order state locally
class StorageService {
  // Mutex lock to prevent concurrent storage operations
  // Prevents race conditions when multiple operations try to save/clear simultaneously
  Future<void>? _lockFuture;

  /// Execute operation with mutex lock to prevent race conditions
  Future<T> _withLock<T>(Future<T> Function() operation) async {
    // Wait for any ongoing operation to complete
    while (_lockFuture != null) {
      await _lockFuture;
    }

    // Create new lock
    final completer = Completer<void>();
    _lockFuture = completer.future;

    try {
      // Execute the operation
      return await operation();
    } finally {
      // Release the lock
      completer.complete();
      _lockFuture = null;
    }
  }

  // Storage keys
  static const String _keyCurrentOrderId = 'current_order_id';
  static const String _keyCurrentOrderState = 'current_order_state';
  static const String _keyLastSyncTime = 'last_sync_time';
  static const String _keyOrderData = 'order_data';

  /// Save current order state for disaster recovery
  Future<void> saveCurrentOrder({
    required String orderId,
    required String orderState,
    String? orderData,
  }) async {
    return _withLock(() async {
      final prefs = await SharedPreferences.getInstance();

      await prefs.setString(_keyCurrentOrderId, orderId);
      await prefs.setString(_keyCurrentOrderState, orderState);
      await prefs.setString(_keyLastSyncTime, DateTime.now().toIso8601String());

      if (orderData != null) {
        await prefs.setString(_keyOrderData, orderData);
      }

      print('[Storage] Saved order state: $orderId - $orderState');
    });
  }

  /// Get current order ID
  Future<String?> getCurrentOrderId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyCurrentOrderId);
  }

  /// Get current order state
  Future<String?> getCurrentOrderState() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyCurrentOrderState);
  }

  /// Get last sync timestamp
  Future<DateTime?> getLastSyncTime() async {
    final prefs = await SharedPreferences.getInstance();
    final timeStr = prefs.getString(_keyLastSyncTime);

    if (timeStr == null) return null;

    try {
      return DateTime.parse(timeStr);
    } catch (e) {
      print('[Storage] Failed to parse last sync time: $e');
      return null;
    }
  }

  /// Get saved order data (JSON string)
  Future<String?> getOrderData() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyOrderData);
  }

  /// Get complete current order state
  Future<Map<String, dynamic>?> getCurrentOrderState_Full() async {
    final orderId = await getCurrentOrderId();
    final orderState = await getCurrentOrderState();
    final lastSync = await getLastSyncTime();
    final orderData = await getOrderData();

    if (orderId == null || orderState == null) {
      return null;
    }

    return {
      'orderId': orderId,
      'orderState': orderState,
      'lastSyncTime': lastSync?.toIso8601String(),
      'orderData': orderData,
    };
  }

  /// Clear current order state (when order is completed or cancelled)
  Future<void> clearCurrentOrder() async {
    return _withLock(() async {
      final prefs = await SharedPreferences.getInstance();

      await prefs.remove(_keyCurrentOrderId);
      await prefs.remove(_keyCurrentOrderState);
      await prefs.remove(_keyLastSyncTime);
      await prefs.remove(_keyOrderData);

      print('[Storage] Cleared current order state');
    });
  }

  /// Check if there's a pending order in local storage
  Future<bool> hasPendingOrder() async {
    final orderId = await getCurrentOrderId();
    return orderId != null && orderId.isNotEmpty;
  }

  /// Update only the order state (for state transitions)
  Future<void> updateOrderState(String newState) async {
    return _withLock(() async {
      final prefs = await SharedPreferences.getInstance();

      await prefs.setString(_keyCurrentOrderState, newState);
      await prefs.setString(_keyLastSyncTime, DateTime.now().toIso8601String());

      print('[Storage] Updated order state: $newState');
    });
  }

  /// Update last sync time
  Future<void> updateLastSyncTime() async {
    return _withLock(() async {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyLastSyncTime, DateTime.now().toIso8601String());
    });
  }
}

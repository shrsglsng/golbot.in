import 'dart:convert';
import 'package:flutter/material.dart';
import "package:http/http.dart" as http;
import 'package:flutter_application_1/utils/constants.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<bool> cancelOrder(String orderId, String mid, String reason, BuildContext context) async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString("token");

  try {
    print('Cancelling order with ID: $orderId, MID: $mid');
    print('API URL: ${BASE_URL}machine/cancel-order');
    
    var response = await http.post(
      Uri.parse('${BASE_URL}machine/cancel-order'),
      body: json.encode({
        "oid": orderId,
        "mid": mid,
        "reason": reason
      }),
      headers: {
        ...getSecureHeaders(),
        "Authorization": "Bearer $token",
      },
    );

    print('Cancel order response status: ${response.statusCode}');
    print('Cancel order response body: ${response.body}');

    if (response.statusCode == 200) {
      print('Order cancelled successfully');
      return true;
    } else {
      print('Failed to cancel order: ${response.body}');
      return false;
    }
  } catch (e) {
    print('Error cancelling order: $e');
    return false;
  }
}
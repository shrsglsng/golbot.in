import 'dart:convert';

import 'package:flutter/material.dart';
import "package:http/http.dart" as http;
import 'package:machine_apk_latest/models/orderModel.dart';
import 'package:machine_apk_latest/utils/constants.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<Order?> startMachine(
    String otp, String mid, BuildContext context) async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString("token");

  try {
    print('Starting machine with OTP: $otp, MID: $mid');
    print('API URL: ${BASE_URL}machine/startmachine');
    
    var response = await http.post(
      Uri.parse('${BASE_URL}machine/startmachine'),
      body: json.encode({"orderOtp": otp, "mid": mid}),
      headers: {
        ...getSecureHeaders(),
        "Authorization": "Bearer $token",
      },
    );

    print('Start machine response status: ${response.statusCode}');
    print('Start machine response body: ${response.body}');

    if (response.statusCode != 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Invalid OTP or error occurred"),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 3),
        ),
      );
      return null;
    }

    final jsonRes = jsonDecode(response.body);
    // Adjust based on your server response structure
    return Order.fromJson(jsonRes["result"]["order"]);

  } catch (e) {
    print('Start machine error: $e');
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Network error: ${e.toString()}"),
        backgroundColor: Colors.red,
        duration: Duration(seconds: 3),
      ),
    );
    return null;
  }
}

import 'dart:convert';

import 'package:flutter/material.dart';
import "package:http/http.dart" as http;
import 'package:machine_apk/models/orderModel.dart';
import 'package:machine_apk/utils/constants.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<Order?> startMachine(
    String otp, String mid, BuildContext context) async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString("token");

  try {
    var response = await http.post(
      Uri.parse(
        '${BASE_URL}machine/startmachine',
      ),
      body: json.encode({"orderOtp": otp, "mid": mid}),
      headers: {
        'Content-Type': 'application/json',
        "Authorization": "Bearer $token",
      },
    );
    if (response.statusCode != 200) {
      Fluttertoast.showToast(
        msg: "Invalid OTP",
        toastLength: Toast.LENGTH_SHORT,
      );
      return null;
    }

    return Order.fromJson(jsonDecode(response.body)["result"]["order"]);

    // print(jsonDecode(response.body)["result"]["order"]);
  } catch (e) {
    print(e);
    Fluttertoast.showToast(
      msg: "Something Went Wrong. Try again Later",
      toastLength: Toast.LENGTH_SHORT,
    );
    return null;
  }
}

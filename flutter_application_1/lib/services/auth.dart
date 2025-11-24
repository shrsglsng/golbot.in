import 'dart:convert';

import 'package:flutter/material.dart';
import "package:http/http.dart" as http;
import 'package:flutter_application_1/utils/constants.dart';
// import 'package:fluttertoast/fluttertoast.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

Future<bool> machineLogin(
    String mid, String password, BuildContext context) async {
  try {
    print('Attempting login with URL: ${BASE_URL}machine/login');
    print('Machine ID: $mid');
    
    var response = await http.post(
      Uri.parse(
        '${BASE_URL}machine/login',
      ),
      body: json.encode({"mid": mid, "password": password}),
      headers: getSecureHeaders(),
    );

    print('Response status: ${response.statusCode}');
    print('Response body: ${response.body}');

    final jsonRes = jsonDecode(response.body);

    if (response.statusCode != 200) {
      // Show error using SnackBar instead of fluttertoast for now
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(jsonRes["message"] ?? "Login failed - Status: ${response.statusCode}"),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 5),
        ),
      );
      return false;
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString("token", jsonRes["data"]["token"]);
    await prefs.setString("machine", jsonEncode(jsonRes["data"]["machine"]));

    // Store credentials securely for firmware API authentication
    const secureStorage = FlutterSecureStorage();
    await secureStorage.write(key: 'mid', value: mid);
    await secureStorage.write(key: 'password', value: password);

    // Show success message
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Login successful!"),
        backgroundColor: Colors.green,
      ),
    );

    return true;

    // print(jsonDecode(response.body)["result"]["order"]);
  } catch (e) {
    print('Login error: $e');
    // Show error using SnackBar instead of fluttertoast for now
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Network error: ${e.toString()}"),
        backgroundColor: Colors.red,
        duration: Duration(seconds: 5),
      ),
    );
    return false;
  }
}

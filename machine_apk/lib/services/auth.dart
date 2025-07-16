import 'dart:convert';

import 'package:flutter/material.dart';
import "package:http/http.dart" as http;
import 'package:machine_apk/utils/constants.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<bool> machineLogin(
    String mid, String password, BuildContext context) async {
  try {
    var response = await http.post(
      Uri.parse(
        '${BASE_URL}machine/login',
      ),
      body: json.encode({"mid": mid, "password": password}),
      headers: {
        'Content-Type': 'application/json',
      },
    );

    final jsonRes = jsonDecode(response.body);

    if (response.statusCode != 200) {
      Fluttertoast.showToast(
        msg: jsonRes["msg"],
        toastLength: Toast.LENGTH_SHORT,
      );
      return false;
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString("token", jsonEncode(jsonRes["result"]["token"]));
    await prefs.setString("machine", jsonEncode(jsonRes["result"]["machine"]));

    return true;

    // print(jsonDecode(response.body)["result"]["order"]);
  } catch (e) {
    print(e);
    Fluttertoast.showToast(
      msg: "Something Went Wrong. Try again Later",
      toastLength: Toast.LENGTH_SHORT,
    );
    return false;
  }
}

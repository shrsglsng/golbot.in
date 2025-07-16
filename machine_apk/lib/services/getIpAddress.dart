import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import "package:http/http.dart" as http;
import 'package:machine_apk/provider/socketProvider.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../utils/constants.dart';

Future<String?> getIpAddress(BuildContext context) async {
  final prefs = await SharedPreferences.getInstance();
  final machine = jsonDecode(prefs.getString("machine") ?? "{}");

  try {
    var response = await http.get(
      Uri.parse(
        '${BASE_URL}machine/getIpAddress/${machine["mid"]}',
      ),
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
      // print("hello");

      print(response.body);
      return null;
    }

    context.read<SocketProvider>().setIpAddress(jsonRes["result"]);

    return jsonRes["result"];

    // print(jsonDecode(response.body)["result"]["order"]);
  } catch (e) {
    print(e);
    // print("hello");
    // Fluttertoast.showToast(
    //   msg: "Something Went Wrong. Try again Later",
    //   toastLength: Toast.LENGTH_SHORT,
    // );
    return null;
  }
}

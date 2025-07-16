import 'dart:io';
import 'package:flutter/material.dart';

class SocketProvider with ChangeNotifier {
  String? ipAddress;

  void setIpAddress(String ipAdd) {
    ipAddress = ipAdd;
    notifyListeners();
  }
}

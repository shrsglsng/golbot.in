import 'dart:io';
import 'package:flutter/material.dart';
import 'package:machine_apk/HomeScreen.dart';
import 'package:machine_apk/services/getIpAddress.dart';

class ConnectingScreen extends StatefulWidget {
  const ConnectingScreen({super.key});

  @override
  State<ConnectingScreen> createState() => _ConnectingScreenState();
}

class _ConnectingScreenState extends State<ConnectingScreen> {
  String? machineIP;
  late Socket sock;

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      while (machineIP == null) {
        machineIP = await getIpAddress(context);

        if (machineIP != null) {
          try {
            sock = await Socket.connect(machineIP, 8888);
          } catch (e) {
            print(e);
            machineIP = null;
          }
        }

        await Future.delayed(const Duration(seconds: 1));
      }

      // context.read<SocketProvider>().setSocketConnection(sock);

      Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => HomeScreen(),
          ));
    });
  }

  @override
  Future<void> dispose() async {
    super.dispose();
    await sock.close();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("GOLBOT"),
      ),
      body: const Center(
          child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 32.00),
          Text("Connecting to machine...")
        ],
      )),
    );
  }
}

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:machine_apk/provider/socketProvider.dart';
import 'package:machine_apk/utils/appbar.dart';
import 'package:machine_apk/utils/constants.dart';
import 'package:provider/provider.dart';
import 'models/orderModel.dart';
import 'package:step_progress_indicator/step_progress_indicator.dart';

class PreparingOrderScreen extends StatefulWidget {
  Order order;
  PreparingOrderScreen({super.key, required this.order});

  @override
  State<PreparingOrderScreen> createState() => _PreparingOrderScreenState();
}

class _PreparingOrderScreenState extends State<PreparingOrderScreen> {
  List<String> orderQueue = [];
  String command = "";
  int currItemCount = 0;
  bool orderItemCompleted = false;
  late Socket sock;

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      sock =
          await Socket.connect(context.read<SocketProvider>().ipAddress, 8888);

      Map<String, int> itemQty = widget.order.itemQty!.toJson();
      itemQty.forEach((key, value) {
        for (var i = 0; i < value; i++) {
          orderQueue.add('[${key.toString()}]');
          // orderQueue.add("[GOL]");
        }
      });
      setState(() {});

      sock.write("[READY]");

      sock.listen((data) async {
        String dataStr = String.fromCharCodes(data).trim();
        print("Socket Listen : $dataStr");

        if (dataStr.contains('[') && dataStr.contains(']')) {
          command = dataStr;
        } else {
          command += dataStr;
        }

        if (command.contains("[READY]")) {
          if (currItemCount < orderQueue.length) {
            sock.write(orderQueue[currItemCount]);
            setState(() {
              orderItemCompleted = false;
            });
          } else {
            Navigator.pop(context);
          }

          command = "";
        } else if (command.contains("[COMPLETED]")) {
          setState(() {
            orderItemCompleted = true;
            currItemCount += 1;
          });
          command = "";
        }
      });
    });
  }

  @override
  Future<void> dispose() async {
    super.dispose();
    await sock.close();
  }

  @override
  Widget build(BuildContext context) {
    // widget.sock.write("[READY]");
    return Scaffold(
      appBar: customAppBar(context),
      body: Center(
          child: Column(
        children: [
          SizedBox(height: 136),
          Image.asset('assets/cooking.gif'),
          SizedBox(height: 90),
          Text(
            orderItemCompleted
                ? "Please take your order..."
                : "Preparing your Order please wait....",
            style: TextStyle(fontSize: 28, color: Colors.black),
          ),
          SizedBox(height: 32),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: StepProgressIndicator(
              totalSteps: orderQueue.isEmpty ? 1 : orderQueue.length,
              currentStep: currItemCount,
              size: 20,
              selectedColor: CPrimary,
              unselectedColor: Colors.grey.shade400,
              roundedEdges: const Radius.circular(10),
            ),
          ),
          SizedBox(height: 24),
          Text(
            "${currItemCount} / ${orderQueue.length} plates dispensed",
            style: TextStyle(fontSize: 28, color: Colors.black),
          ),
        ],
      )),
    );
  }
}

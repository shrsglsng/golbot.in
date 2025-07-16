import 'package:flutter/material.dart';
import 'package:machine_apk/utils/constants.dart';
import 'package:step_progress_indicator/step_progress_indicator.dart';

class TempScreen extends StatefulWidget {
  const TempScreen({super.key});

  @override
  State<TempScreen> createState() => _TempScreenState();
}

class _TempScreenState extends State<TempScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
          child: Column(
        children: [
          SizedBox(height: 136),
          Image.asset('assets/cooking.gif'),
          SizedBox(height: 90),
          Text(
            "Preparing your Order please wait....",
            style: TextStyle(fontSize: 28),
          ),
          SizedBox(height: 32),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: StepProgressIndicator(
              totalSteps: 10,
              currentStep: 2,
              size: 20,
              selectedColor: CPrimary,
              unselectedColor: Colors.grey.shade400,
              roundedEdges: const Radius.circular(10),
            ),
          ),
          SizedBox(height: 24),
          Text(
            "5 / 12 plates",
            style: TextStyle(fontSize: 28),
          ),
        ],
      )),
    );
  }
}

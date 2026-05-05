import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_application_1/models/orderModel.dart';
import 'package:flutter_application_1/preparingOrderScreen.dart';
import 'package:flutter_application_1/HomeScreen.dart';
import 'package:flutter_application_1/services/startMachine.dart';
import 'package:flutter_application_1/utils/constants.dart';
import 'package:pinput/pinput.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ManualOTPScreen extends StatefulWidget {
  ManualOTPScreen({super.key});

  @override
  State<ManualOTPScreen> createState() => _ManualOTPScreenState();
}

class _ManualOTPScreenState extends State<ManualOTPScreen> {
  final pinController = TextEditingController();
  bool isBtnDisabled = true;

  String? mid;

  final defaultPinTheme = PinTheme(
    width: 60,
    height: 60,
    textStyle: TextStyle(
        fontSize: 24,
        color: Color.fromRGBO(30, 60, 87, 1),
        fontWeight: FontWeight.w600),
    decoration: BoxDecoration(
      border: Border.all(color: CPrimary),
      borderRadius: BorderRadius.circular(10),
    ),
  );

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final prefs = await SharedPreferences.getInstance();
      final machineData = prefs.getString("machine");
      if (machineData != null) {
        mid = jsonDecode(machineData)["mid"];
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(64.0),
        child: AppBar(
          title: Column(
            children: [
              const SizedBox(height: 12.0),
              Center(child: SvgPicture.asset("assets/logo.svg", height: 40)),
            ],
          ),
          backgroundColor: CPrimary,
          leading: IconButton(
            icon: Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
        ),
      ),
      body: OrientationBuilder(
        builder: (context, orientation) {
          bool isLandscape = orientation == Orientation.landscape;

          if (isLandscape) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 48.0, vertical: 24.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Left Side: Keypad (Centered)
                  Expanded(
                    flex: 1,
                    child: Center(
                      child: SingleChildScrollView(
                        child: _keyPad(),
                      ),
                    ),
                  ),
                  const VerticalDivider(width: 64, thickness: 1, color: Colors.grey),
                  // Right Side: Title, OTP Display and Actions (Centered)
                  Expanded(
                    flex: 1,
                    child: Center(
                      child: SingleChildScrollView(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Enter OTP",
                              style: TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.bold,
                                fontSize: 32,
                              ),
                            ),
                            const SizedBox(height: 32.0),
                            Pinput(
                              length: 4,
                              defaultPinTheme: defaultPinTheme,
                              controller: pinController,
                              keyboardType: TextInputType.none,
                              onChanged: (value) {
                                if (value.length != 4)
                                  setState(() {
                                    isBtnDisabled = true;
                                  });
                              },
                              onCompleted: (value) => setState(() {
                                isBtnDisabled = false;
                              }),
                            ),
                            const SizedBox(height: 40.0),
                            _buildActionButtons(isLandscape: false), // Reverted to larger size
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          }

          // Portrait Layout
          return Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
              child: Container(
                constraints: const BoxConstraints(maxWidth: 400),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Enter OTP",
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.bold,
                        fontSize: 32,
                      ),
                    ),
                    const SizedBox(height: 40.0),
                    Pinput(
                      length: 4,
                      defaultPinTheme: defaultPinTheme,
                      controller: pinController,
                      keyboardType: TextInputType.none,
                      onChanged: (value) {
                        if (value.length != 4)
                          setState(() {
                            isBtnDisabled = true;
                          });
                      },
                      onCompleted: (value) => setState(() {
                        isBtnDisabled = false;
                      }),
                    ),
                    const SizedBox(height: 40.0),
                    _keyPad(),
                    const SizedBox(height: 32.0),
                    _buildActionButtons(isLandscape: false),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildActionButtons({bool isLandscape = false}) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
              onPressed: () async {
                if (!isBtnDisabled) {
                  Order? order = await startMachine(
                      pinController.text ?? "", mid ?? "", context);

                  if (order != null) {
                    Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(
                          builder: (context) => PreparingOrderScreen(
                            order: order,
                          ),
                        ));
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                elevation: 0,
                backgroundColor: isBtnDisabled ? CPrimaryLight : CPrimary,
                padding: EdgeInsets.symmetric(vertical: isLandscape ? 12.0 : 16.0),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8.0),
                ),
              ),
              child: Text(
                "Start Preparing",
                style: TextStyle(fontSize: isLandscape ? 18.0 : 20.0, color: Colors.white),
              )),
        ),
        SizedBox(height: isLandscape ? 12.0 : 16.0),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
              onPressed: () {
                Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (context) => HomeScreen(),
                    ));
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                elevation: 0,
                padding: EdgeInsets.symmetric(vertical: isLandscape ? 12.0 : 16.0),
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: Colors.black45),
                  borderRadius: BorderRadius.circular(8.0),
                ),
              ),
              child: Text(
                "Back to Home",
                style: TextStyle(fontSize: isLandscape ? 18.0 : 20.0, color: Colors.black),
              )),
        ),
      ],
    );
  }

  Widget _keyPad() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _keypadNumButtons("1"),
            SizedBox(width: 10),
            _keypadNumButtons("2"),
            SizedBox(width: 10),
            _keypadNumButtons("3"),
          ],
        ),
        SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _keypadNumButtons("4"),
            SizedBox(width: 10),
            _keypadNumButtons("5"),
            SizedBox(width: 10),
            _keypadNumButtons("6"),
          ],
        ),
        SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _keypadNumButtons("7"),
            SizedBox(width: 10),
            _keypadNumButtons("8"),
            SizedBox(width: 10),
            _keypadNumButtons("9"),
          ],
        ),
        SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _keypadClearBtn(),
            SizedBox(width: 10),
            _keypadNumButtons("0"),
            SizedBox(width: 10),
            _keypadDeleteBtn(),
          ],
        )
      ],
    );
  }

  Widget _keypadNumButtons(String num) {
    return ElevatedButton(
        onPressed: () {
          if (pinController.text.length < 4) {
            pinController.text = pinController.text + num;
            if (pinController.text.length == 4) {
              setState(() {
                isBtnDisabled = false;
              });
            }
          }
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          elevation: 0,
          padding: EdgeInsets.symmetric(vertical: 20.0, horizontal: 38.0),
          shape: RoundedRectangleBorder(
            side: BorderSide(color: Colors.black45),
            borderRadius: BorderRadius.circular(8.0),
          ),
        ),
        child: Text(
          num,
          style: TextStyle(fontSize: 20.0, color: Colors.black),
        ));
  }

  Widget _keypadDeleteBtn() {
    return ElevatedButton.icon(
      onPressed: () {
        if (pinController.text.isNotEmpty) {
          pinController.text = pinController.text.substring(0, pinController.text.length - 1);
          setState(() {
            isBtnDisabled = pinController.text.length != 4;
          });
        }
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.transparent,
        elevation: 0,
        padding: EdgeInsets.symmetric(vertical: 20.0, horizontal: 30.0),
        shape: RoundedRectangleBorder(
          side: BorderSide(color: Colors.black45),
          borderRadius: BorderRadius.circular(8.0),
        ),
      ),
      icon: Icon(
        Icons.backspace,
        color: Colors.black,
      ),
      label: Text(""),
    );
  }

  Widget _keypadClearBtn() {
    return ElevatedButton.icon(
      onPressed: () {
        pinController.clear();
        setState(() {
          isBtnDisabled = true;
        });
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.transparent,
        elevation: 0,
        padding: EdgeInsets.symmetric(vertical: 16.0, horizontal: 24.0),
        shape: RoundedRectangleBorder(
          side: BorderSide(color: Colors.black45),
          borderRadius: BorderRadius.circular(8.0),
        ),
      ),
      icon: Icon(
        Icons.clear_all,
        color: Colors.black,
        size: 32,
      ),
      label: Text(""),
    );
  }
}

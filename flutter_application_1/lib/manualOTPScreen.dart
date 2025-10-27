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
      body: Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            width: 400,
            height: 660,
            child: Column(
              children: [
                // title
                Text(
                  "Enter OTP",
                  style: TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.bold,
                    fontSize: 32,
                  ),
                ),

                SizedBox(height: 60.0),

                // OTP
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

                SizedBox(height: 20.0),
                Row(
                  children: [
                    Expanded(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _keyPad(),
                        ],
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 20.0),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                          onPressed: () async {
                            if (!isBtnDisabled) {
                              Order? order = await startMachine(
                                  pinController.text ?? "", mid ?? "", context);

                              if (order != null) {
                                Navigator.pushReplacement(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          PreparingOrderScreen(
                                        order: order,
                                      ),
                                    ));
                              }
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            elevation: 0,
                            backgroundColor:
                                isBtnDisabled ? CPrimaryLight : CPrimary,
                            padding: EdgeInsets.symmetric(
                                vertical: 16.0, horizontal: 32.0),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8.0),
                            ),
                          ),
                          child: Text(
                            "Start Preparing",
                            style:
                                TextStyle(fontSize: 20.0, color: Colors.white),
                          )),
                    ),
                  ],
                ),
                SizedBox(height: 20.0),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                          onPressed: () {
                            // Navigate back to HomeScreen
                            Navigator.pushReplacement(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => HomeScreen(),
                                ));
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            elevation: 0,
                            padding: EdgeInsets.symmetric(
                                vertical: 16.0, horizontal: 32.0),
                            shape: RoundedRectangleBorder(
                              side: BorderSide(color: Colors.black45),
                              borderRadius: BorderRadius.circular(8.0),
                            ),
                          ),
                          child: Text(
                            "Back to Home",
                            style:
                                TextStyle(fontSize: 20.0, color: Colors.black),
                          )),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _keyPad() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Row(
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

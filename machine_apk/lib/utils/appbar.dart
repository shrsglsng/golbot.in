import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:machine_apk/utils/constants.dart';

PreferredSize customAppBar(BuildContext context) {
  return PreferredSize(
    preferredSize: Size.fromHeight(64.0),
    child: AppBar(
      title: Column(
        children: [
          const SizedBox(height: 12.0),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SvgPicture.asset("assets/logo.svg", height: 40),
              const SizedBox(width: 40)
            ],
          ),
        ],
      ),
      backgroundColor: CPrimary,
    ),
  );
}

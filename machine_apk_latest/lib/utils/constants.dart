import 'package:flutter/material.dart';

const String BASE_URL = "http://192.168.31.158:5000/api/v1/";
// const String BASE_URL = "http://localhost:5000/api/v1/";
// const String BASE_URL = "https://letitdone.loca.lt/api/v1/";

// Mobile App Security
const String MOBILE_API_KEY = "golbot_mobile_secure_2024_v1_api_key";

const Color CPrimary = Colors.orange;
const Color CPrimaryLight = Color(0xFFFFCC80); // Orange.shade300 equivalent

// const Color CPrimary = Color(0xff8883F0);
// const Color CPrimaryLight = Color(0xffaca8f4);

// Security Headers for Mobile API Requests
Map<String, String> getSecureHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Mobile-API-Key': MOBILE_API_KEY,
  };
}

# GolBot Kiosk Firmware

This repository contains the firmware for the **GolBot Kiosk**, a multi-processor robotic system designed for automated food preparation. The project is built using the [PlatformIO](https://platformio.org/) ecosystem and supports multiple hardware targets including ESP8266, ESP32, and ATmega2560.

## 🚀 Project Overview

The system architecture follows a distributed model:
- **Network Processors (ESP8266/ESP32):** Handle cloud connectivity, API polling, SSL/TLS security, and order management.
- **Motion Controller (ATmega2560):** Manages complex kinematics, stepper motor control for axes (conveyor, barrel, catchers), and sensor integration.

## 🛠 Hardware Architecture

The project supports several environments defined in `platformio.ini`:

### 1. ESP8266 (Network Processor)
- **Target:** Robotdyn Arduino Mega WiFi (Integrated ESP8266) or standalone ESP-01.
- **Role:** Connects to `api.golbot.in`, polls for new orders, and communicates with the ATmega controller.
- **Key Features:** Memory-optimized JSON parsing (ArduinoJson 7), BearSSL for secure HTTPS.

### 2. ATmega2560 (Motion Controller)
- **Target:** Arduino Mega 2560.
- **Role:** Executes the physical preparation logic.
- **Capabilities:** 
  - Homing sequences for all axes.
  - Stepper control for puri catchers, barrel rotors, and conveyors.
  - Vacuum and blower control for plate handling.

### 3. NodeMCU ESP32 (Debug/Enhanced Network)
- **Target:** NodeMCU-32S Dev Board.
- **Role:** Enhanced version of the network processor with deeper traceability and debug logging.

## 📂 Project Structure

```text
.
├── include/            # Global header files
├── lib/                # Project-specific libraries
├── src/
│   ├── esp8266.cpp     # Network processor logic (ESP8266)
│   ├── nodemcu.cpp     # Network processor logic (ESP32)
│   ├── atmega2560.cpp  # Main robotic motion logic
│   └── atmega2560_logger.cpp # Logging utility for ATmega
├── platformio.ini      # Build configurations and dependencies
└── README.md           # This file
```

## ⚙️ Setup & Installation

1.  **Install PlatformIO:** We recommend using the [PlatformIO IDE for VS Code](https://platformio.org/install/ide?install=vscode).
2.  **Clone the Repository:**
    ```bash
    git clone <your-repo-url>
    cd kiosk-firmware
    ```
3.  **Configure WiFi (Optional):** Update `WIFI_SSID` and `WIFI_PASS` in `src/esp8266.cpp` or `src/nodemcu.cpp` if deploying network firmware.
4.  **Select Environment:** 
    Use the PlatformIO project task menu to select the desired environment:
    - `env:esp8266`
    - `env:atmega2560`
    - `env:nodemcu_esp32`
5.  **Build & Upload:** Click the **Build** (checkmark) or **Upload** (arrow) icons in the PlatformIO toolbar.


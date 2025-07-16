/*
 * Copyright (c) 2018, circuits4you.com
 * All rights reserved.
 * Create a TCP Server on ESP8266 NodeMCU.
 * TCP Socket Server Send Receive Demo
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>

#define SendKey 0 // Button to send data Flash BTN on NodeMCU

int port = 8888; // Port number
WiFiServer server(port);

// Server connect to WiFi Network
const char *ssid = "golbot";        // Enter your wifi SSID
const char *password = "golbot365"; // Enter your wifi Password

int count = 0;
String serverPath = "https://bknd.golbot.in/api/v1/machine/updateIpAddress/m01";
// String serverPath = "https://icanhazip.com";
//=======================================================================
//                     Power on setup
//=======================================================================
void setup()
{
    Serial.begin(115200);
    pinMode(SendKey, INPUT_PULLUP); // Btn to send data
    Serial.println();

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password); // Connect to wifi

    // Wait for connection
    Serial.println("Connecting to Wifi");
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
        delay(500);
    }

    Serial.println("");
    Serial.print("Connected to ");
    Serial.println(ssid);

    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    server.begin();
    Serial.print("Open Telnet and connect to IP:");
    Serial.print(WiFi.localIP());
    Serial.print(" on port ");
    Serial.println(port);

    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient http;

    http.begin(client, serverPath.c_str());
    http.addHeader("Content-Type", "application/json");

    int resCode = http.POST("{ \"ipAddress\" : \"" + WiFi.localIP().toString() + "\" }");
    // int resCode = http.GET();
    Serial.print(resCode);
    // Serial.print(http.getString());
}
//=======================================================================
//                    Loop
//=======================================================================

void loop()
{
    WiFiClient client = server.available();

    if (client)
    {
        if (client.connected())
        {
            Serial.println("Client Connected");
        }

        while (client.connected())
        {
            while (client.available() > 0)
            {
                // read data from the connected client
                Serial.write(client.read());
            }
            // Send Data to connected client
            while (Serial.available() > 0)
            {
                client.write(Serial.read());
            }
        }
        client.stop();
        Serial.println("Client disconnected");
    }
}
//=======================================================================
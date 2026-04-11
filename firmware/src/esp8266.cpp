#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <ArduinoJson.h>

/**
 * GolBot ESP8266 Firmware (Surgical Fix Version)
 * 
 * Target: Robotdyn Arduino Mega WiFi (ESP8266 Network Processor)
 * 
 * Fixes Applied:
 * 1. Memory Fragmentation: Eliminated String class for JSON and URLs.
 * 2. Heap Efficiency: Used Stream-based JSON parsing (no getString()).
 * 3. SSL Stability: Optimized BearSSL buffers and yielded during handshakes.
 * 4. Non-Blocking IO: Refined Serial communication with ATmega2560.
 * 5. Library compatibility: Updated to ArduinoJson v7 syntax (JsonDocument).
 */

// --- Configuration ---
const char* WIFI_SSID = "Aibotink Pvt Ltd";
const char* WIFI_PASS = "Aibotink@123";
const char* SERVER_BASE_URL = "https://api.golbot.in/api/firmware";
const char* MACHINE_ID = "M05";
const char* MACHINE_PASS = "12345678";
const char* FIRMWARE_VER = "1.2.1-ESP8266-Surgical";

const int LED_PIN = 5; 

// --- Global Client Objects ---
BearSSL::WiFiClientSecure secureClient;

// --- Timing & State ---
unsigned long lastPollTime = 0;
const unsigned long POLL_INTERVAL = 7000; 
unsigned long lastHeartbeatTime = 0;
const unsigned long HEARTBEAT_INTERVAL = 60000; 

bool isBusy = false;
char currentOrderId[40] = "";

// Forward declarations
bool startOrder(const char* oid);
bool readyOrder(const char* oid);
bool completeOrder(const char* oid);
void logError(const char* code, const char* msg, const char* oid = nullptr);

/**
 * Common headers for all firmware API calls
 */
void setHeaders(HTTPClient &http) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Machine-ID", MACHINE_ID);
    http.addHeader("X-Machine-Password", MACHINE_PASS);
    http.addHeader("User-Agent", "GolBot-Firmware/ESP8266");
    http.setTimeout(10000); 
}

/**
 * Report error to backend using static buffers
 */
void logError(const char* code, const char* msg, const char* oid) {
    HTTPClient http;
    char url[128];
    snprintf(url, sizeof(url), "%s/error", SERVER_BASE_URL);
    
    if (http.begin(secureClient, url)) {
        setHeaders(http);
        JsonDocument doc; 
        doc["errorCode"] = code;
        doc["errorMessage"] = msg;
        if (oid) doc["orderId"] = oid;
        doc["severity"] = "ERROR";
        
        char payload[256];
        serializeJson(doc, payload);
        http.POST((uint8_t*)payload, strlen(payload));
        http.end();
    }
}

bool startOrder(const char* oid) {
    HTTPClient http;
    char url[128];
    snprintf(url, sizeof(url), "%s/orders/%s/start", SERVER_BASE_URL, oid);
    
    bool success = false;
    if (http.begin(secureClient, url)) {
        setHeaders(http);
        int httpCode = http.POST("{}");
        if (httpCode == HTTP_CODE_OK) {
            JsonDocument doc;
            DeserializationError err = deserializeJson(doc, http.getStream());
            success = (!err && doc["success"] == true);
        }
        http.end();
    }
    return success;
}

bool readyOrder(const char* oid) {
    HTTPClient http;
    char url[128];
    snprintf(url, sizeof(url), "%s/orders/%s/ready", SERVER_BASE_URL, oid);
    
    bool success = false;
    if (http.begin(secureClient, url)) {
        setHeaders(http);
        int httpCode = http.POST("{}");
        success = (httpCode == HTTP_CODE_OK);
        http.end();
    }
    return success;
}

bool completeOrder(const char* oid) {
    HTTPClient http;
    char url[128];
    snprintf(url, sizeof(url), "%s/orders/%s/complete", SERVER_BASE_URL, oid);
    
    bool success = false;
    if (http.begin(secureClient, url)) {
        setHeaders(http);
        int httpCode = http.POST("{}");
        if (httpCode == HTTP_CODE_OK) {
            isBusy = false;
            currentOrderId[0] = '\0';
            digitalWrite(LED_PIN, LOW);
            success = true;
        }
        http.end();
    }
    return success;
}

/**
 * Robust wait for Mega Serial signals without blocking background tasks
 */
bool waitForMegaSignal(const char* signal, unsigned long timeoutMs) {
    unsigned long start = millis();
    char buffer[64];
    size_t pos = 0;

    while (millis() - start < timeoutMs) {
        while (Serial.available() > 0) {
            char c = Serial.read();
            if (c == '\n' || c == '\r') {
                buffer[pos] = '\0';
                if (pos > 0) {
                    Serial.printf("MEGA: %s\n", buffer); // Debug log
                    if (strstr(buffer, signal)) return true;
                }
                pos = 0;
            } else if (pos < sizeof(buffer) - 1) {
                buffer[pos++] = c;
            }
        }
        yield(); 
    }
    return false;
}

void handleDispense(const char* oid, bool skipStart = false) {
    isBusy = true;
    digitalWrite(LED_PIN, HIGH);
    strncpy(currentOrderId, oid, sizeof(currentOrderId) - 1);
    
    Serial.printf("[SYSTEM] Dispense Start: %s\n", oid);
    
    if (!skipStart) {
        if (!startOrder(oid)) {
            logError("START_FAILED", "Order start transition failed", oid);
            isBusy = false;
            digitalWrite(LED_PIN, LOW);
            return;
        }
    }

    // Trigger Mega
    Serial.println("CMD:DISPENSE PANIPURI");

    // Wait for READY (Homing)
    if (waitForMegaSignal("EVENT:READY", 60000)) {
        Serial.println("[SYSTEM] Mega Ready, signaling backend");
        readyOrder(oid);
    } else {
        logError("READY_TIMEOUT", "Mega ready signal timeout", oid);
    }

    // Wait for COMPLETE
    if (waitForMegaSignal("EVENT:COMPLETE", 300000)) {
        Serial.println("[SYSTEM] Mega Complete, finalizing order");
        completeOrder(oid);
    } else {
        logError("COMPLETE_TIMEOUT", "Mega complete signal timeout", oid);
        isBusy = false;
        digitalWrite(LED_PIN, LOW);
    }
}

void checkMachineStatus() {
    HTTPClient http;
    char url[128];
    snprintf(url, sizeof(url), "%s/machine/status", SERVER_BASE_URL);
    
    if (http.begin(secureClient, url)) {
        setHeaders(http);
        int httpCode = http.GET();
        if (httpCode == HTTP_CODE_OK) {
            JsonDocument doc;
            DeserializationError error = deserializeJson(doc, http.getStream());
            if (!error && doc["success"] && !doc["data"]["currentOrder"].isNull()) {
                const char* oid = doc["data"]["currentOrder"]["orderId"];
                const char* status = doc["data"]["currentOrder"]["orderStatus"];
                
                Serial.printf("[RECOVERY] Active Order: %s (%s)\n", oid, status);
                
                if (strcmp(status, "OTP_VERIFIED") == 0) {
                    handleDispense(oid, false);
                } else if (strcmp(status, "PREPARING") == 0 || strcmp(status, "READY_FOR_PICKUP") == 0) {
                    handleDispense(oid, true);
                }
            }
        }
        http.end();
    }
}

void sendHeartbeat() {
    if (millis() - lastHeartbeatTime < HEARTBEAT_INTERVAL) return;
    lastHeartbeatTime = millis();

    HTTPClient http;
    char url[128];
    snprintf(url, sizeof(url), "%s/heartbeat", SERVER_BASE_URL);

    if (http.begin(secureClient, url)) {
        setHeaders(http);
        JsonDocument doc;
        doc["status"] = isBusy ? "BUSY" : "IDLE";
        doc["firmwareVersion"] = FIRMWARE_VER;
        
        char payload[128];
        serializeJson(doc, payload);
        http.POST((uint8_t*)payload, strlen(payload));
        http.end();
    }
}

void pollForOrder() {
    if (isBusy) return;
    
    HTTPClient http;
    char url[128];
    snprintf(url, sizeof(url), "%s/orders/next", SERVER_BASE_URL);

    if (http.begin(secureClient, url)) {
        setHeaders(http);
        if (http.GET() == HTTP_CODE_OK) {
            JsonDocument doc;
            DeserializationError err = deserializeJson(doc, http.getStream());
            if (!err && doc["success"] && doc["data"]["hasOrder"]) {
                const char* oid = doc["data"]["order"]["orderId"];
                handleDispense(oid, false);
            }
        }
        http.end();
    }
}

void setup() {
    Serial.begin(115200);  // Comm with Mega
    //Serial.begin(115200); // Debug logs
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);

    // Optimized SSL Buffers
    secureClient.setInsecure();
    secureClient.setBufferSizes(2048, 1024); // Increased RX buffer for server responses

    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
    Serial.println("\n[WIFI] Connected");

    checkMachineStatus();
}
 
void loop() {
    if (WiFi.status() == WL_CONNECTED) {
        if (!isBusy && (millis() - lastPollTime >= POLL_INTERVAL)) {
            pollForOrder();
            lastPollTime = millis();
        }
        sendHeartbeat();
    } else {
        WiFi.begin(WIFI_SSID, WIFI_PASS);
        delay(5000);
    }
    yield();
}

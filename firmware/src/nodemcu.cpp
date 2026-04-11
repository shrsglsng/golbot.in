#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

/**
 * GolBot NodeMCU ESP32S Firmware (Debug Version)
 * 
 * Target: NodeMCU ESP32S Dev Board
 * 
 * Refactored for deep traceability:
 * 1. Added [DEBUG] logs for every network request and response.
 * 2. Instrumented state transitions and function results.
 * 3. Maintained ESP32 specific library compatibility.
 */

// --- Configuration ---
const char* WIFI_SSID = "Aibotink Pvt Ltd";
const char* WIFI_PASS = "Aibotink@123";
const char* SERVER_BASE_URL = "https://api.golbot.in/api/firmware";
const char* MACHINE_ID = "M05";
const char* MACHINE_PASS = "12345678";
const char* FIRMWARE_VER = "1.2.1-ESP32-DEBUG";

const int LED_PIN = 5; 

// --- Global Client Objects ---
WiFiClientSecure secureClient;

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
    http.addHeader("User-Agent", "GolBot-Firmware/ESP32-Debug");
    http.setTimeout(10000); 
}

/**
 * Report error to backend using static buffers
 */
void logError(const char* code, const char* msg, const char* oid) {
    Serial.printf("[DEBUG] logError triggered: %s - %s (Order: %s)\n", code, msg, oid ? oid : "NONE");
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
        int httpCode = http.POST((uint8_t*)payload, strlen(payload));
        Serial.printf("[DEBUG] Error log POST result: %d\n", httpCode);
        http.end();
    } else {
        Serial.println("[DEBUG] Failed to begin HTTP for logError");
    }
}

bool startOrder(const char* oid) {
    Serial.printf("[DEBUG] startOrder called for: %s\n", oid);
    HTTPClient http;
    char url[128];
    snprintf(url, sizeof(url), "%s/orders/%s/start", SERVER_BASE_URL, oid);
    
    bool success = false;
    if (http.begin(secureClient, url)) {
        setHeaders(http);
        int httpCode = http.POST("{}");
        Serial.printf("[DEBUG] startOrder HTTP Code: %d\n", httpCode);
        
        if (httpCode == HTTP_CODE_OK) {
            JsonDocument doc;
            DeserializationError err = deserializeJson(doc, http.getStream());
            if (!err) {
                success = (doc["success"] == true);
                Serial.printf("[DEBUG] startOrder success field: %s\n", success ? "true" : "false");
            } else {
                Serial.printf("[DEBUG] startOrder JSON Parse Error: %s\n", err.c_str());
            }
        }
        http.end();
    }
    return success;
}

bool readyOrder(const char* oid) {
    Serial.printf("[DEBUG] readyOrder called for: %s\n", oid);
    HTTPClient http;
    char url[128];
    snprintf(url, sizeof(url), "%s/orders/%s/ready", SERVER_BASE_URL, oid);
    
    bool success = false;
    if (http.begin(secureClient, url)) {
        setHeaders(http);
        int httpCode = http.POST("{}");
        Serial.printf("[DEBUG] readyOrder HTTP Code: %d\n", httpCode);
        success = (httpCode == HTTP_CODE_OK);
        http.end();
    }
    return success;
}

bool completeOrder(const char* oid) {
    Serial.printf("[DEBUG] completeOrder called for: %s\n", oid);
    HTTPClient http;
    char url[128];
    snprintf(url, sizeof(url), "%s/orders/%s/complete", SERVER_BASE_URL, oid);
    
    bool success = false;
    if (http.begin(secureClient, url)) {
        setHeaders(http);
        int httpCode = http.POST("{}");
        Serial.printf("[DEBUG] completeOrder HTTP Code: %d\n", httpCode);
        
        if (httpCode == HTTP_CODE_OK) {
            isBusy = false;
            currentOrderId[0] = '\0';
            digitalWrite(LED_PIN, LOW);
            success = true;
            Serial.println("[DEBUG] Order finalized, ESP32 now IDLE");
        }
        http.end();
    }
    return success;
}

/**
 * Robust wait for Mega Serial signals without blocking background tasks
 */
bool waitForMegaSignal(const char* signal, unsigned long timeoutMs) {
    Serial.printf("[DEBUG] Waiting for Mega signal: '%s' (Timeout: %lu ms)\n", signal, timeoutMs);
    unsigned long start = millis();
    char buffer[64];
    size_t pos = 0;

    while (millis() - start < timeoutMs) {
        while (Serial.available() > 0) {
            char c = Serial.read();
            if (c == '\n' || c == '\r') {
                buffer[pos] = '\0';
                if (pos > 0) {
                    Serial.printf("MEGA -> ESP32: %s\n", buffer); 
                    if (strstr(buffer, signal)) {
                        Serial.printf("[DEBUG] Found signal '%s' after %lu ms\n", signal, millis() - start);
                        return true;
                    }
                }
                pos = 0;
            } else if (pos < sizeof(buffer) - 1) {
                buffer[pos++] = c;
            }
        }
        yield(); 
    }
    Serial.printf("[DEBUG] TIMEOUT waiting for signal: '%s'\n", signal);
    return false;
}

void handleDispense(const char* oid, bool skipStart = false) {
    Serial.printf("[DEBUG] handleDispense Entry: %s (skipStart: %d)\n", oid, skipStart);
    isBusy = true;
    digitalWrite(LED_PIN, HIGH);
    strncpy(currentOrderId, oid, sizeof(currentOrderId) - 1);
    
    Serial.printf("[SYSTEM] Dispense Start: %s\n", oid);
    
    if (!skipStart) {
        if (!startOrder(oid)) {
            Serial.println("[DEBUG] Aborting dispense: startOrder failed");
            logError("START_FAILED", "Order start transition failed", oid);
            isBusy = false;
            digitalWrite(LED_PIN, LOW);
            return;
        }
    } else {
        Serial.println("[DEBUG] Skipping startOrder (Recovery Mode)");
    }

    // Trigger Mega
    Serial.println("[DEBUG] Sending CMD:DISPENSE PANIPURI to Mega");
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
    Serial.println("[DEBUG] checkMachineStatus: Syncing with backend...");
    HTTPClient http;
    char url[128];
    snprintf(url, sizeof(url), "%s/machine/status", SERVER_BASE_URL);
    
    if (http.begin(secureClient, url)) {
        setHeaders(http);
        int httpCode = http.GET();
        Serial.printf("[DEBUG] Machine status HTTP Code: %d\n", httpCode);
        
        if (httpCode == HTTP_CODE_OK) {
            JsonDocument doc;
            DeserializationError error = deserializeJson(doc, http.getStream());
            if (!error && doc["success"] && !doc["data"]["currentOrder"].isNull()) {
                const char* oid = doc["data"]["currentOrder"]["orderId"];
                const char* status = doc["data"]["currentOrder"]["orderStatus"];
                
                Serial.printf("[RECOVERY] Active Order Found: %s (%s)\n", oid, status);
                
                if (strcmp(status, "OTP_VERIFIED") == 0) {
                    handleDispense(oid, false);
                } else if (strcmp(status, "PREPARING") == 0 || strcmp(status, "READY_FOR_PICKUP") == 0) {
                    handleDispense(oid, true);
                }
            } else if (error) {
                Serial.printf("[DEBUG] Machine status JSON Parse Error: %s\n", error.c_str());
            } else {
                Serial.println("[DEBUG] No active orders found during recovery check.");
            }
        }
        http.end();
    }
}

void sendHeartbeat() {
    if (millis() - lastHeartbeatTime < HEARTBEAT_INTERVAL) return;
    lastHeartbeatTime = millis();

    Serial.printf("[DEBUG] Sending Heartbeat... (isBusy: %d)\n", isBusy);
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
        int httpCode = http.POST((uint8_t*)payload, strlen(payload));
        Serial.printf("[DEBUG] Heartbeat result HTTP Code: %d\n", httpCode);
        http.end();
    }
}

void pollForOrder() {
    if (isBusy) return;
    
    Serial.println("[DEBUG] Polling for next order...");
    HTTPClient http;
    char url[128];
    snprintf(url, sizeof(url), "%s/orders/next", SERVER_BASE_URL);

    if (http.begin(secureClient, url)) {
        setHeaders(http);
        int httpCode = http.GET();
        if (httpCode == HTTP_CODE_OK) {
            JsonDocument doc;
            DeserializationError err = deserializeJson(doc, http.getStream());
            if (!err && doc["success"] && doc["data"]["hasOrder"]) {
                const char* oid = doc["data"]["order"]["orderId"];
                Serial.printf("[DEBUG] New Order Detected: %s\n", oid);
                handleDispense(oid, false);
            } else if (err) {
                Serial.printf("[DEBUG] Poll JSON Parse Error: %s\n", err.c_str());
            } else {
                // No order, just silent debug
                // Serial.println("[DEBUG] No new orders.");
            }
        } else {
            Serial.printf("[DEBUG] Poll HTTP Code: %d\n", httpCode);
        }
        http.end();
    }
}

void setup() {
    Serial.begin(115200);  
    delay(1000); // Give serial monitor time to connect
    Serial.println("\n\n========================================");
    Serial.printf("  GOLBOT ESP32 FIRMWARE STARTING\n");
    Serial.printf("  Version: %s\n", FIRMWARE_VER);
    Serial.println("========================================\n");

    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);

    secureClient.setInsecure(); 

    Serial.printf("[DEBUG] Connecting to WiFi: %s ", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) { 
        delay(500); 
        Serial.print("."); 
    }
    Serial.printf("\n[WIFI] Connected! IP: %s\n", WiFi.localIP().toString().c_str());

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
        Serial.println("[DEBUG] WiFi Lost! Attempting reconnection...");
        WiFi.begin(WIFI_SSID, WIFI_PASS);
        delay(5000);
    }
    yield();
}

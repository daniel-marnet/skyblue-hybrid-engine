/*
 * Hybrid Aircraft Engine Simulation - ESP32 with WebSocket
 * Direct connection to web interface - NO BRIDGE SERVER NEEDED!
 * 
 * Target: ESP32 (Wokwi compatible)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";

WebSocketsServer webSocket = WebSocketsServer(8080);

// --- Pin Definitions ---
const int PIN_MASTER_SWITCH = 4;
const int PIN_START_BUTTON = 5;
const int PIN_MODE_TOGGLE = 18;
const int PIN_THROTTLE_UP = 19;
const int PIN_THROTTLE_DOWN = 21;
const int PIN_EMERGENCY_KILL = 22;

const int PIN_LED_MOTOR_ON = 2; 
const int PIN_LED_ICE_ON = 15;
const int PIN_LED_SOLAR_ACTIVE = 13;

// --- Physical Constants ---
const float BAT_CAP_WH = 50000.0;
const float SOLAR_MAX = 5000.0;
const float MOTOR_MAX = 100000.0;
const float ICE_MAX = 75000.0;
const float FUEL_CAP = 100.0;
const float CONS_RATE = 0.005;

// --- State Variables ---
bool master = false;
bool iceOn = false;
bool motorOn = false;
bool emergency = false;
int flightMode = 0;
float battery = 80.0;
float fuel = 100.0;
float throttle = 0.0;
float solarW = 0.0;
float thrust = 0.0;
unsigned long lastMs = 0;

// --- Metrics ---
float totalCO2_g = 0.0;
float totalFuelConsumed_L = 0.0;
float totalElectricEnergy_Wh = 0.0;
float totalSolarEnergy_Wh = 0.0;
float totalICEEnergy_Wh = 0.0;
float flightTime_s = 0.0;
float distanceTraveled_km = 0.0;

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_TEXT: {
            String cmd = String((char*)payload);
            cmd.trim();
            if (cmd == "MASTER_ON") master = true;
            else if (cmd == "MASTER_OFF") master = false;
            else if (cmd == "ICE_START") iceOn = !iceOn;
            else if (cmd == "EMERGENCY_ON") { emergency = true; }
            else if (cmd == "EMERGENCY_OFF") { emergency = false; }
            else if (cmd.startsWith("THROTTLE:")) {
                throttle = cmd.substring(9).toFloat() / 100.0;
            }
            else if (cmd.startsWith("MODE:")) {
                flightMode = cmd.substring(5).toInt();
            }
            break;
        }
    }
}

void setup() {
    Serial.begin(115200);
    pinMode(PIN_LED_MOTOR_ON, OUTPUT);
    pinMode(PIN_LED_ICE_ON, OUTPUT);
    pinMode(PIN_LED_SOLAR_ACTIVE, OUTPUT);
    
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) { delay(500); }
    
    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
    lastMs = millis();
}

void loop() {
    webSocket.loop();
    unsigned long now = millis();
    float dt = (now - lastMs) / 1000.0;
    lastMs = now;

    if (master && !emergency) {
        flightTime_s += dt;
        solarW = abs(sin(now / 8000.0)) * SOLAR_MAX;
        
        float demand = throttle * MOTOR_MAX;
        if (iceOn && fuel > 0) {
            float iceP = (flightMode == 1) ? throttle * ICE_MAX : (flightMode == 2 ? ICE_MAX * 0.8 : 0);
            fuel -= (iceP / 1000.0) * CONS_RATE * dt;
            if (flightMode == 1) demand -= iceP;
        }
        
        motorOn = (throttle > 0.02 && battery > 2.0);
        if (motorOn) battery -= (demand * dt / (BAT_CAP_WH * 36.0));
        battery = constrain(battery, 0, 100);
        thrust = motorOn ? (throttle * 5000.0) : 0;
    }

    digitalWrite(PIN_LED_MOTOR_ON, motorOn);
    digitalWrite(PIN_LED_ICE_ON, iceOn);
    
    // Telemetry send (abbreviated for brevity)
    static unsigned long lastReport = 0;
    if (millis() - lastReport > 500) {
        lastReport = millis();
        String json = "{\"type\":\"data\",\"data\":{";
        json += "\"mas\":" + String(master);
        json += ",\"bat\":" + String(battery, 1);
        json += ",\"fue\":" + String(fuel, 1);
        json += ",\"thr\":" + String(throttle * 100, 0);
        json += ",\"tst\":" + String(thrust, 0);
        json += "}}";
        webSocket.broadcastTXT(json);
    }
    delay(20);
}

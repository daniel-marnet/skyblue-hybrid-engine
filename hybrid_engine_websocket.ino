/*
 * Hybrid Aircraft Engine Simulation - ESP32 with WebSocket
 * Direct connection to web interface - NO BRIDGE SERVER NEEDED!
 * 
 * This version creates a WebSocket server on the ESP32
 * The web interface connects directly to ws://localhost:8080
 * 
 * Target: ESP32 (Wokwi compatible)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>

// WiFi credentials (Wokwi virtual WiFi)
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// WebSocket server on port 8080
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

// --- Emissions Constants (g/kWh) ---
const float CO2_PER_KWH = 2640.0;
const float NOX_PER_KWH = 12.5;
const float CO_PER_KWH = 8.3;
const float HC_PER_KWH = 2.1;

// --- Performance Constants ---
const float CRUISE_SPEED_KMH = 250.0;
const float AVIONICS_POWER = 2000.0;

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

// --- Environmental Tracking ---
float totalCO2_g = 0.0;
float totalNOx_g = 0.0;
float totalCO_g = 0.0;
float totalHC_g = 0.0;
float totalFuelConsumed_L = 0.0;
float totalElectricEnergy_Wh = 0.0;
float totalSolarEnergy_Wh = 0.0;
float totalICEEnergy_Wh = 0.0;

// --- Performance Tracking ---
float flightTime_s = 0.0;
float distanceTraveled_km = 0.0;
float totalThrust_Ns = 0.0;

// --- Comparison Variables ---
float conventionalCO2_g = 0.0;
float conventionalNOx_g = 0.0;
float conventionalCO_g = 0.0;
float conventionalHC_g = 0.0;
float conventionalFuel_L = 0.0;

// WebSocket event handler
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.printf("[%u] Disconnected!\n", num);
            break;
            
        case WStype_CONNECTED: {
            IPAddress ip = webSocket.remoteIP(num);
            Serial.printf("[%u] Connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
            
            // Send connection confirmation
            String msg = "{\"type\":\"status\",\"connected\":true}";
            webSocket.sendTXT(num, msg);
            break;
        }
            
        case WStype_TEXT: {
            String cmd = String((char*)payload);
            cmd.trim();
            
            Serial.printf("[%u] Command: %s\n", num, cmd.c_str());
            
            // Process commands
            if (cmd == "MASTER_ON") master = true;
            else if (cmd == "MASTER_OFF") master = false;
            else if (cmd == "ICE_START") iceOn = !iceOn;
            else if (cmd == "EMERGENCY_ON") emergency = true;
            else if (cmd == "EMERGENCY_OFF") emergency = false;
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
    Serial.println("\n🚀 SKYBLUE Hybrid Engine - WebSocket Edition");
    
    // Setup pins
    pinMode(PIN_MASTER_SWITCH, INPUT_PULLUP);
    pinMode(PIN_START_BUTTON, INPUT_PULLUP);
    pinMode(PIN_MODE_TOGGLE, INPUT_PULLUP);
    pinMode(PIN_THROTTLE_UP, INPUT_PULLUP);
    pinMode(PIN_THROTTLE_DOWN, INPUT_PULLUP);
    pinMode(PIN_EMERGENCY_KILL, INPUT_PULLUP);
    
    pinMode(PIN_LED_MOTOR_ON, OUTPUT);
    pinMode(PIN_LED_ICE_ON, OUTPUT);
    pinMode(PIN_LED_SOLAR_ACTIVE, OUTPUT);
    
    // Connect to WiFi
    Serial.print("📡 Connecting to WiFi");
    WiFi.begin(ssid, password);
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    
    Serial.println("\n✅ WiFi connected!");
    Serial.print("   IP address: ");
    Serial.println(WiFi.localIP());
    
    // Start WebSocket server
    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
    
    Serial.println("🌐 WebSocket server started on port 8080");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.println("👉 Connect your interface to:");
    Serial.print("   ws://");
    Serial.print(WiFi.localIP());
    Serial.println(":8080");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    lastMs = millis();
}

void updatePhysics() {
    unsigned long now = millis();
    float dt = (now - lastMs) / 1000.0;
    lastMs = now;

    if (!master || emergency) {
        thrust = 0;
        motorOn = false;
        iceOn = false;
        return;
    }

    flightTime_s += dt;
    
    solarW = abs(sin(now / 8000.0)) * SOLAR_MAX;
    float solarEnergy_Wh = (solarW * dt) / 3600.0;
    totalSolarEnergy_Wh += solarEnergy_Wh;
    
    float demand = throttle * MOTOR_MAX;
    float netBatPower = solarW;
    float iceP = 0.0;
    float fuelConsumed_L = 0.0;

    if (iceOn && fuel > 0) {
        if (flightMode == 1) {
            iceP = throttle * ICE_MAX;
        } else if (flightMode == 2) {
            iceP = ICE_MAX * 0.8;
        }
        
        fuelConsumed_L = (iceP / 1000.0) * CONS_RATE * dt;
        fuel -= (fuelConsumed_L / FUEL_CAP) * 100.0;
        totalFuelConsumed_L += fuelConsumed_L;
        
        float iceEnergy_Wh = (iceP * dt) / 3600.0;
        totalICEEnergy_Wh += iceEnergy_Wh;
        
        float iceEnergy_kWh = iceEnergy_Wh / 1000.0;
        totalCO2_g += iceEnergy_kWh * CO2_PER_KWH;
        totalNOx_g += iceEnergy_kWh * NOX_PER_KWH;
        totalCO_g += iceEnergy_kWh * CO_PER_KWH;
        totalHC_g += iceEnergy_kWh * HC_PER_KWH;
        
        if (flightMode == 1) {
            demand -= iceP;
        } else if (flightMode == 2) {
            netBatPower += iceP;
        }
        
        if (fuel <= 0) { 
            fuel = 0; 
            iceOn = false; 
        }
    }

    motorOn = (throttle > 0.02 && battery > 2.0);
    if (motorOn) {
        netBatPower -= demand;
        float electricEnergy_Wh = (demand * dt) / 3600.0;
        totalElectricEnergy_Wh += electricEnergy_Wh;
    }

    battery += (netBatPower * dt / (BAT_CAP_WH * 36.0));
    battery = constrain(battery, 0, 100);
    if (battery <= 0) motorOn = false;

    thrust = motorOn ? (throttle * 5000.0) : 0;
    totalThrust_Ns += thrust * dt;
    
    float speed_ms = (CRUISE_SPEED_KMH * 1000.0) / 3600.0;
    float distance_m = speed_ms * dt * (throttle * 0.8 + 0.2);
    distanceTraveled_km += distance_m / 1000.0;

    float totalPowerDemand = demand + AVIONICS_POWER;
    float conventionalEnergy_Wh = (totalPowerDemand * dt) / 3600.0;
    float conventionalEnergy_kWh = conventionalEnergy_Wh / 1000.0;
    
    conventionalCO2_g += conventionalEnergy_kWh * CO2_PER_KWH;
    conventionalNOx_g += conventionalEnergy_kWh * NOX_PER_KWH;
    conventionalCO_g += conventionalEnergy_kWh * CO_PER_KWH;
    conventionalHC_g += conventionalEnergy_kWh * HC_PER_KWH;
    conventionalFuel_L += (totalPowerDemand / 1000.0) * CONS_RATE * dt;
}

void updateHardware() {
    digitalWrite(PIN_LED_MOTOR_ON, motorOn);
    digitalWrite(PIN_LED_ICE_ON, iceOn);
    digitalWrite(PIN_LED_SOLAR_ACTIVE, solarW > 500);
}

void sendTelemetry() {
    static unsigned long lastReport = 0;
    if (millis() - lastReport < 500) return;
    lastReport = millis();
    
    float co2Avoided_g = conventionalCO2_g - totalCO2_g;
    float noxAvoided_g = conventionalNOx_g - totalNOx_g;
    float coAvoided_g = conventionalCO_g - totalCO_g;
    float hcAvoided_g = conventionalHC_g - totalHC_g;
    float fuelSaved_L = conventionalFuel_L - totalFuelConsumed_L;
    
    float electricRatio = 0.0;
    float totalEnergy_Wh = totalElectricEnergy_Wh + totalICEEnergy_Wh;
    if (totalEnergy_Wh > 0) {
        electricRatio = (totalElectricEnergy_Wh / totalEnergy_Wh) * 100.0;
    }
    
    float remainingEnergy_Wh = (battery / 100.0) * BAT_CAP_WH;
    float fuelEnergy_Wh = fuel * 10000.0;
    float totalRemainingEnergy_Wh = remainingEnergy_Wh + fuelEnergy_Wh;
    float avgPowerConsumption_W = (flightTime_s > 0) ? 
        ((totalElectricEnergy_Wh + totalICEEnergy_Wh) * 3600.0 / flightTime_s) : MOTOR_MAX * 0.5;
    float estimatedRemainingTime_h = (avgPowerConsumption_W > 0) ? 
        (totalRemainingEnergy_Wh / avgPowerConsumption_W) : 0;
    float estimatedRange_km = estimatedRemainingTime_h * CRUISE_SPEED_KMH;
    
    float co2Reduction = (conventionalCO2_g > 0) ? 
        ((co2Avoided_g / conventionalCO2_g) * 100.0) : 0;
    float fuelReduction = (conventionalFuel_L > 0) ? 
        ((fuelSaved_L / conventionalFuel_L) * 100.0) : 0;
    
    // Build JSON
    String json = "{\"type\":\"data\",\"data\":{";
    json += "\"mas\":" + String(master);
    json += ",\"ice\":" + String(iceOn);
    json += ",\"mot\":" + String(motorOn);
    json += ",\"mod\":" + String(flightMode);
    json += ",\"bat\":" + String(battery, 1);
    json += ",\"fue\":" + String(fuel, 1);
    json += ",\"thr\":" + String(throttle * 100, 0);
    json += ",\"sol\":" + String(solarW / 1000.0, 2);
    json += ",\"tst\":" + String(thrust, 0);
    json += ",\"flt_time\":" + String(flightTime_s, 1);
    json += ",\"dist_km\":" + String(distanceTraveled_km, 2);
    json += ",\"range_km\":" + String(estimatedRange_km, 1);
    json += ",\"elec_wh\":" + String(totalElectricEnergy_Wh, 1);
    json += ",\"ice_wh\":" + String(totalICEEnergy_Wh, 1);
    json += ",\"solar_wh\":" + String(totalSolarEnergy_Wh, 1);
    json += ",\"elec_pct\":" + String(electricRatio, 1);
    json += ",\"co2_g\":" + String(totalCO2_g, 1);
    json += ",\"nox_g\":" + String(totalNOx_g, 3);
    json += ",\"co_g\":" + String(totalCO_g, 3);
    json += ",\"hc_g\":" + String(totalHC_g, 3);
    json += ",\"fuel_l\":" + String(totalFuelConsumed_L, 3);
    json += ",\"co2_saved_g\":" + String(co2Avoided_g, 1);
    json += ",\"nox_saved_g\":" + String(noxAvoided_g, 3);
    json += ",\"co_saved_g\":" + String(coAvoided_g, 3);
    json += ",\"hc_saved_g\":" + String(hcAvoided_g, 3);
    json += ",\"fuel_saved_l\":" + String(fuelSaved_L, 3);
    json += ",\"conv_co2_g\":" + String(conventionalCO2_g, 1);
    json += ",\"conv_fuel_l\":" + String(conventionalFuel_L, 3);
    json += ",\"co2_reduction_pct\":" + String(co2Reduction, 1);
    json += ",\"fuel_reduction_pct\":" + String(fuelReduction, 1);
    json += "}}";
    
    // Send to all connected clients
    webSocket.broadcastTXT(json);
}

void loop() {
    webSocket.loop();
    
    if (digitalRead(PIN_EMERGENCY_KILL) == LOW) emergency = true;
    if (digitalRead(PIN_MASTER_SWITCH) == LOW) master = true;

    updatePhysics();
    updateHardware();
    sendTelemetry();
    
    delay(20);
}

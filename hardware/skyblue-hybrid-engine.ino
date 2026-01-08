/*
 * SKYBLUE Hybrid Aero Engine - v1.0 (Cloud Connected)
 * Connects to Vercel relay server for real-time control
 *
 * Target: ESP32 (Wokwi compatible)
 * Project: https://wokwi.com/projects/452473775385515009
 * Relay Server: https://skyblue-hybrid-engine.vercel.app/api/websocket-relay
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials (Wokwi)
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Relay server URL (SUBSTITUA pelo seu domínio Vercel)
const char* RELAY_SERVER = "https://skyblue-hybrid-engine.vercel.app";
const char* DATA_ENDPOINT = "/api/websocket-relay/wokwi";
const char* COMMAND_ENDPOINT = "/api/websocket-relay/command";

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
const float SOLAR_MAX_W = 5000.0;
const float MOTOR_MAX_W = 100000.0;
const float ICE_MAX_W = 75000.0;
const float FUEL_CAP_L = 100.0;
const float FUEL_DENSITY_KG_L = 0.8;
const float FUEL_ENERGY_WH_KG = 12000.0;
const float ICE_EFFICIENCY = 0.28;

// Emission factors (g/kWh)
const float CO2_FACTOR = 2640.0;
const float NOX_FACTOR = 12.5;
const float CO_FACTOR = 8.3;
const float HC_FACTOR = 2.1;

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

// --- Cumulative Metrics ---
float totalElectricEnergy_Wh = 0.0;
float totalICEEnergy_Wh = 0.0;
float totalSolarEnergy_Wh = 0.0;
float totalFuelConsumed_L = 0.0;
float totalCO2_g = 0.0;
float totalNOx_g = 0.0;
float totalCO_g = 0.0;
float totalHC_g = 0.0;

// --- Flight Metrics ---
float flightTime_s = 0.0;
float distanceTraveled_km = 0.0;
float speed_kt = 0.0;

unsigned long lastMs = 0;
unsigned long lastDataSend = 0;
unsigned long lastCommandCheck = 0;

HTTPClient http;

void setup() {
    Serial.begin(115200);

    pinMode(PIN_LED_MOTOR_ON, OUTPUT);
    pinMode(PIN_LED_ICE_ON, OUTPUT);
    pinMode(PIN_LED_SOLAR_ACTIVE, OUTPUT);

    pinMode(PIN_MASTER_SWITCH, INPUT_PULLUP);
    pinMode(PIN_START_BUTTON, INPUT_PULLUP);
    pinMode(PIN_MODE_TOGGLE, INPUT_PULLUP);
    pinMode(PIN_THROTTLE_UP, INPUT_PULLUP);
    pinMode(PIN_THROTTLE_DOWN, INPUT_PULLUP);
    pinMode(PIN_EMERGENCY_KILL, INPUT_PULLUP);

    Serial.println("\n\n=================================");
    Serial.println("SKYBLUE Hybrid Engine v1.0");
    Serial.println("Cloud-Connected Edition");
    Serial.println("=================================");
    Serial.println("Connecting to WiFi...");

    WiFi.begin(ssid, password, 6); // Canal 6 para Wokwi

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n✓ WiFi connected!");
        Serial.print("IP address: ");
        Serial.println(WiFi.localIP());
        Serial.print("Relay server: ");
        Serial.println(RELAY_SERVER);
        Serial.println("=================================\n");
    } else {
        Serial.println("\n✗ WiFi connection failed!");
        Serial.println("Running in offline mode...\n");
    }

    lastMs = millis();
    lastDataSend = millis();
    lastCommandCheck = millis();
}

void loop() {
    unsigned long now = millis();
    float dt = (now - lastMs) / 1000.0;
    lastMs = now;

    // Verifica comandos do servidor a cada 200ms
    if (WiFi.status() == WL_CONNECTED && now - lastCommandCheck > 200) {
        lastCommandCheck = now;
        checkCommands();
    }

    // Física da simulação
    if (master && !emergency) {
        flightTime_s += dt;

        // Solar power
        solarW = abs(sin(now / 8000.0)) * SOLAR_MAX_W;
        float solarEnergyThisTick_Wh = (solarW * dt) / 3600.0;
        totalSolarEnergy_Wh += solarEnergyThisTick_Wh;

        // Power demand
        float motorDemandW = throttle * MOTOR_MAX_W;
        float icePowerW = 0.0;

        // Mode logic
        if (iceOn && fuel > 0) {
            if (flightMode == 1) {
                icePowerW = throttle * ICE_MAX_W;
                motorDemandW = max(0.0, motorDemandW - icePowerW);
            }
            else if (flightMode == 2) {
                icePowerW = ICE_MAX_W * 0.8;
                float chargeToBattery = icePowerW * 0.9;
                battery += (chargeToBattery * dt) / (BAT_CAP_WH * 36.0);
                battery = constrain(battery, 0.0, 100.0);
            }

            // Fuel consumption
            float iceEnergyOutput_Wh = (icePowerW * dt) / 3600.0;
            float iceEnergyInput_Wh = iceEnergyOutput_Wh / ICE_EFFICIENCY;
            float fuelConsumed_kg = iceEnergyInput_Wh / FUEL_ENERGY_WH_KG;
            float fuelConsumed_L = fuelConsumed_kg / FUEL_DENSITY_KG_L;

            totalFuelConsumed_L += fuelConsumed_L;
            fuel -= (fuelConsumed_L / FUEL_CAP_L) * 100.0;
            fuel = constrain(fuel, 0.0, 100.0);

            totalICEEnergy_Wh += iceEnergyOutput_Wh;

            // Emissions
            totalCO2_g += (iceEnergyOutput_Wh * CO2_FACTOR) / 1000.0;
            totalNOx_g += (iceEnergyOutput_Wh * NOX_FACTOR) / 1000.0;
            totalCO_g += (iceEnergyOutput_Wh * CO_FACTOR) / 1000.0;
            totalHC_g += (iceEnergyOutput_Wh * HC_FACTOR) / 1000.0;

            if (fuel <= 0) {
                iceOn = false;
                fuel = 0;
            }
        }

        // Motor
        motorOn = (throttle > 0.02 && battery > 2.0);
        if (motorOn) {
            float motorEnergyThisTick_Wh = (motorDemandW * dt) / 3600.0;
            float netEnergyFromBattery_Wh = motorEnergyThisTick_Wh - solarEnergyThisTick_Wh;

            if (netEnergyFromBattery_Wh > 0) {
                battery -= (netEnergyFromBattery_Wh / BAT_CAP_WH) * 100.0;
                totalElectricEnergy_Wh += netEnergyFromBattery_Wh;
            }
            battery = constrain(battery, 0.0, 100.0);
        }

        // Thrust
        if (motorOn || (iceOn && flightMode == 1)) {
            thrust = throttle * 5000.0;
        } else {
            thrust = 0.0;
        }

        // Speed/Distance
        speed_kt = thrust / 50.0;
        distanceTraveled_km += (speed_kt * 1.852 * dt) / 3600.0;

    } else {
        motorOn = false;
        thrust = 0.0;
        speed_kt = 0.0;
    }

    // Update LEDs
    digitalWrite(PIN_LED_MOTOR_ON, motorOn);
    digitalWrite(PIN_LED_ICE_ON, iceOn);
    digitalWrite(PIN_LED_SOLAR_ACTIVE, solarW > 1000.0);

    // Send data to relay server every 500ms
    if (WiFi.status() == WL_CONNECTED && now - lastDataSend > 500) {
        lastDataSend = now;
        sendTelemetry();
    }

    delay(20);
}

void checkCommands() {
    http.begin(String(RELAY_SERVER) + COMMAND_ENDPOINT);
    int httpCode = http.GET();

    if (httpCode == 200) {
        String payload = http.getString();

        StaticJsonDocument<512> doc;
        DeserializationError error = deserializeJson(doc, payload);

        if (!error && doc.containsKey("command") && !doc["command"].isNull()) {
            JsonObject cmd = doc["command"];

            String type = cmd["type"] | "";

            if (type == "MASTER_ON") {
                master = true;
                Serial.println("→ Command: MASTER ON");
            }
            else if (type == "MASTER_OFF") {
                master = false;
                iceOn = false;
                motorOn = false;
                throttle = 0.0;
                Serial.println("→ Command: MASTER OFF");
            }
            else if (type == "ICE_START") {
                if (master && fuel > 0) {
                    iceOn = !iceOn;
                    Serial.printf("→ Command: ICE %s\n", iceOn ? "ON" : "OFF");
                }
            }
            else if (type == "EMERGENCY_ON") {
                emergency = true;
                master = false;
                iceOn = false;
                motorOn = false;
                throttle = 0.0;
                Serial.println("→ Command: EMERGENCY!");
            }
            else if (type == "THROTTLE") {
                if (master && !emergency) {
                    throttle = constrain((float)(cmd["value"] | 0) / 100.0, 0.0, 1.0);
                    Serial.printf("→ Command: THROTTLE %.0f%%\n", throttle * 100);
                }
            }
            else if (type == "MODE") {
                if (master && !emergency) {
                    flightMode = constrain((int)(cmd["value"] | 0), 0, 2);
                    Serial.printf("→ Command: MODE %d\n", flightMode);
                }
            }
        }
    }

    http.end();
}

void sendTelemetry() {
    // Calculate metrics
    float totalEnergy_Wh = totalElectricEnergy_Wh + totalICEEnergy_Wh;
    float electricPct = (totalEnergy_Wh > 0) ? (totalElectricEnergy_Wh / totalEnergy_Wh) * 100.0 : 0.0;
    float conventionalEnergy_Wh = totalEnergy_Wh;
    float conventionalFuel_L = (conventionalEnergy_Wh / ICE_EFFICIENCY) / (FUEL_ENERGY_WH_KG * FUEL_DENSITY_KG_L);
    float conventionalCO2_g = (conventionalEnergy_Wh * CO2_FACTOR) / 1000.0;
    float co2Saved_g = conventionalCO2_g - totalCO2_g;
    float fuelSaved_L = conventionalFuel_L - totalFuelConsumed_L;
    float co2ReductionPct = (conventionalCO2_g > 0) ? (co2Saved_g / conventionalCO2_g) * 100.0 : 0.0;
    float fuelReductionPct = (conventionalFuel_L > 0) ? (fuelSaved_L / conventionalFuel_L) * 100.0 : 0.0;
    float batteryEnergy_Wh = (battery / 100.0) * BAT_CAP_WH;
    float fuelEnergy_Wh = (fuel / 100.0) * FUEL_CAP_L * FUEL_DENSITY_KG_L * FUEL_ENERGY_WH_KG * ICE_EFFICIENCY;
    float totalAvailableEnergy_Wh = batteryEnergy_Wh + fuelEnergy_Wh;
    float avgPowerConsumption_W = (flightTime_s > 0) ? (totalEnergy_Wh / (flightTime_s / 3600.0)) : 1000.0;
    float rangeEstimate_km = (avgPowerConsumption_W > 0) ? (totalAvailableEnergy_Wh / avgPowerConsumption_W) * speed_kt * 1.852 : 0.0;

    // Build JSON
    StaticJsonDocument<1024> doc;

    doc["mas"] = master ? 1 : 0;
    doc["ice"] = iceOn ? 1 : 0;
    doc["mot"] = motorOn ? 1 : 0;
    doc["mod"] = flightMode;
    doc["bat"] = battery;
    doc["fue"] = fuel;
    doc["thr"] = throttle * 100.0;
    doc["sol"] = solarW / 1000.0;
    doc["tst"] = thrust;
    doc["flt_time"] = flightTime_s;
    doc["dist_km"] = distanceTraveled_km;
    doc["range_km"] = rangeEstimate_km;
    doc["elec_wh"] = totalElectricEnergy_Wh;
    doc["ice_wh"] = totalICEEnergy_Wh;
    doc["solar_wh"] = totalSolarEnergy_Wh;
    doc["elec_pct"] = electricPct;
    doc["co2_g"] = totalCO2_g;
    doc["nox_g"] = totalNOx_g;
    doc["co_g"] = totalCO_g;
    doc["hc_g"] = totalHC_g;
    doc["fuel_l"] = totalFuelConsumed_L;
    doc["co2_saved_g"] = co2Saved_g;
    doc["nox_saved_g"] = (conventionalCO2_g * NOX_FACTOR / CO2_FACTOR) - totalNOx_g;
    doc["co_saved_g"] = (conventionalCO2_g * CO_FACTOR / CO2_FACTOR) - totalCO_g;
    doc["hc_saved_g"] = (conventionalCO2_g * HC_FACTOR / CO2_FACTOR) - totalHC_g;
    doc["fuel_saved_l"] = fuelSaved_L;
    doc["conv_co2_g"] = conventionalCO2_g;
    doc["conv_fuel_l"] = conventionalFuel_L;
    doc["co2_reduction_pct"] = co2ReductionPct;
    doc["fuel_reduction_pct"] = fuelReductionPct;

    String jsonString;
    serializeJson(doc, jsonString);

    // Send to relay server
    http.begin(String(RELAY_SERVER) + DATA_ENDPOINT);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST(jsonString);

    if (httpCode > 0) {
        if (httpCode == 200) {
            // Success - periodic logging
            static unsigned long lastLog = 0;
            if (millis() - lastLog > 10000) {
                lastLog = millis();
                Serial.printf("✓ Data sent | Bat: %.1f%% | Fuel: %.1f%% | Thrust: %.0fN\n",
                              battery, fuel, thrust);
            }
        } else {
            Serial.printf("✗ HTTP Error: %d\n", httpCode);
        }
    } else {
        Serial.println("✗ Connection failed");
    }

    http.end();
}

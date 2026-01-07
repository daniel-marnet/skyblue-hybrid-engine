/*
 * Hybrid Aircraft Engine Simulation - ESP32
 * Integrated with Photovoltaic Generation and Cockpit Controls
 * 
 * Target: ESP32 (Wokwi compatible)
 */

#include <Arduino.h>

// --- Pin Definitions ---
const int PIN_MASTER_SWITCH = 4;
const int PIN_START_BUTTON = 5;
const int PIN_MODE_TOGGLE = 18;
const int PIN_THROTTLE_UP = 19;
const int PIN_THROTTLE_DOWN = 21;
const int PIN_EMERGENCY_KILL = 22;

const int PIN_LED_MOTOR_ON = 2; // Internal LED or external
const int PIN_LED_ICE_ON = 15;
const int PIN_LED_SOLAR_ACTIVE = 13;

// --- Simulation Constants ---
const float BATTERY_CAPACITY_WH = 50000.0; // 50kWh
const float SOLAR_MAX_POWER_W = 5000.0;    // 5kW peak
const float MOTOR_MAX_POWER_W = 100000.0;  // 100kW (134hp)
const float ICE_MAX_POWER_W = 75000.0;     // 75kW
const float FUEL_CAPACITY_L = 100.0;
const float FUEL_CONSUMPTION_RATE = 0.005; // L/s per kW

// --- State Variables ---
bool masterPower = false;
bool iceRunning = false;
bool motorRunning = false;
bool emergencyMode = false;
enum FlightMode { ELECTRIC, HYBRID, CHARGING };
FlightMode currentMode = ELECTRIC;

float batterySoC = 80.0; // Percentage
float fuelLevel = 100.0; // Percentage
float throttle = 0.0;    // 0.0 to 1.0
float currentPowerW = 0.0;
float solarPowerW = 0.0;
float thrustN = 0.0;

unsigned long lastUpdate = 0;

void setup() {
  Serial.begin(115200);
  
  pinMode(PIN_MASTER_SWITCH, INPUT_PULLUP);
  pinMode(PIN_START_BUTTON, INPUT_PULLUP);
  pinMode(PIN_MODE_TOGGLE, INPUT_PULLUP);
  pinMode(PIN_THROTTLE_UP, INPUT_PULLUP);
  pinMode(PIN_THROTTLE_DOWN, INPUT_PULLUP);
  pinMode(PIN_EMERGENCY_KILL, INPUT_PULLUP);

  pinMode(PIN_LED_MOTOR_ON, OUTPUT);
  pinMode(PIN_LED_ICE_ON, OUTPUT);
  pinMode(PIN_LED_SOLAR_ACTIVE, OUTPUT);

  Serial.println("--- Aircraft Hybrid Engine Simulator Initialized ---");
}

void processControls() {
  // Master Switch Logic
  masterPower = digitalRead(PIN_MASTER_SWITCH) == LOW;

  if (!masterPower) {
    iceRunning = false;
    motorRunning = false;
    throttle = 0;
    return;
  }

  // Emergency Kill
  if (digitalRead(PIN_EMERGENCY_KILL) == LOW) {
    emergencyMode = true;
    iceRunning = false;
    motorRunning = false;
    throttle = 0;
  } else {
    emergencyMode = false;
  }

  if (emergencyMode) return;

  // Engine Start
  if (digitalRead(PIN_START_BUTTON) == LOW && masterPower && fuelLevel > 0) {
    iceRunning = true;
  }

  // Throttle Controls
  if (digitalRead(PIN_THROTTLE_UP) == LOW) {
    throttle += 0.01;
    if (throttle > 1.0) throttle = 1.0;
    delay(50); // Debounce-like behavior for simulation
  }
  if (digitalRead(PIN_THROTTLE_DOWN) == LOW) {
    throttle -= 0.01;
    if (throttle < 0.0) throttle = 0.0;
    delay(50);
  }

  // Mode Toggle
  static bool lastToggleState = HIGH;
  bool currentToggleState = digitalRead(PIN_MODE_TOGGLE);
  if (currentToggleState == LOW && lastToggleState == HIGH) {
    currentMode = (FlightMode)((currentMode + 1) % 3);
    Serial.print("Mode Changed to: ");
    switch(currentMode) {
      case ELECTRIC: Serial.println("ELECTRIC ONLY"); break;
      case HYBRID: Serial.println("HYBRID"); break;
      case CHARGING: Serial.println("BATTERY CHARGING"); break;
    }
  }
  lastToggleState = currentToggleState;

  // Motor activation logic
  motorRunning = (throttle > 0.01 && batterySoC > 5.0);
}

void updatePhysics() {
  unsigned long now = millis();
  float dt = (now - lastUpdate) / 1000.0; // delta time in seconds
  lastUpdate = now;

  if (!masterPower || emergencyMode) return;

  // 1. Solar Generation
  // Simulate solar irradiance varying with time (very basic sine wave)
  float timeScale = now / 10000.0; 
  solarPowerW = abs(sin(timeScale)) * SOLAR_MAX_POWER_W;
  
  // 2. Power Consumption/Generation
  float powerDemandW = throttle * MOTOR_MAX_POWER_W;
  float netBatteryPowerW = solarPowerW;

  if (iceRunning) {
    if (currentMode == HYBRID) {
      // ICE provides part of the thrust directly or via generator
      float icePower = throttle * ICE_MAX_POWER_W;
      fuelLevel -= (icePower * FUEL_CONSUMPTION_RATE * dt) / FUEL_CAPACITY_L;
      powerDemandW -= icePower;
      if (powerDemandW < 0) powerDemandW = 0;
    } else if (currentMode == CHARGING) {
      // ICE charges battery
      float chargePower = ICE_MAX_POWER_W * 0.8; // 80% efficiency
      netBatteryPowerW += chargePower;
      fuelLevel -= (ICE_MAX_POWER_W * FUEL_CONSUMPTION_RATE * dt) / FUEL_CAPACITY_L;
    }
  }

  if (motorRunning) {
    netBatteryPowerW -= powerDemandW;
  }

  // 3. Update Battery SoC
  // Energy = Power * Time (Ws)
  float energyChangeWs = netBatteryPowerW * dt;
  batterySoC += (energyChangeWs / (BATTERY_CAPACITY_WH * 3600.0)) * 100.0;

  if (batterySoC > 100.0) batterySoC = 100.0;
  if (batterySoC < 0.0) {
    batterySoC = 0.0;
    motorRunning = false;
  }

  if (fuelLevel < 0.0) {
    fuelLevel = 0.0;
    iceRunning = false;
  }

  // 4. Calculate Thrust (Simplified)
  thrustN = throttle * 5000.0; // Max 5kN thrust
}

void updateLEDs() {
  digitalWrite(PIN_LED_MOTOR_ON, motorRunning ? HIGH : LOW);
  digitalWrite(PIN_LED_ICE_ON, iceRunning ? HIGH : LOW);
  digitalWrite(PIN_LED_SOLAR_ACTIVE, solarPowerW > 100.0 ? HIGH : LOW);
}

void reportTelemetry() {
  static unsigned long lastReport = 0;
  if (millis() - lastReport > 500) {
    lastReport = millis();
    Serial.print(">>> TELEMETRY | ");
    Serial.print("Mode: "); Serial.print(currentMode == ELECTRIC ? "ELE" : currentMode == HYBRID ? "HYB" : "CHG");
    Serial.print(" | Bat: "); Serial.print(batterySoC, 1); Serial.print("%");
    Serial.print(" | Fuel: "); Serial.print(fuelLevel, 1); Serial.print("%");
    Serial.print(" | Thr: "); Serial.print(throttle * 100, 0); Serial.print("%");
    Serial.print(" | Solar: "); Serial.print(solarPowerW / 1000.0, 2); Serial.print("kW");
    Serial.print(" | Thrust: "); Serial.print(thrustN, 0); Serial.println("N");
  }
}

void loop() {
  processControls();
  updatePhysics();
  updateLEDs();
  reportTelemetry();
  delay(10);
}

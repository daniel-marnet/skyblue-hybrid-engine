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

const int PIN_LED_MOTOR_ON = 2; 
const int PIN_LED_ICE_ON = 15;
const int PIN_LED_SOLAR_ACTIVE = 13;

// --- Constants ---
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
int flightMode = 0; // 0:ELE, 1:HYB, 2:CHG
float battery = 80.0;
float fuel = 100.0;
float throttle = 0.0;
float solarW = 0.0;
float thrust = 0.0;
unsigned long lastMs = 0;

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
}

void processSerialCommands() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "MASTER_ON") master = true;
    else if (cmd == "MASTER_OFF") master = false;
    else if (cmd == "ICE_START") iceOn = true;
    else if (cmd == "EMERGENCY_ON") emergency = true;
    else if (cmd == "EMERGENCY_OFF") emergency = false;
    else if (cmd.startsWith("THROTTLE:")) {
       throttle = cmd.substring(9).toFloat() / 100.0;
    }
    else if (cmd.startsWith("MODE:")) {
       flightMode = cmd.substring(5).toInt();
    }
  }
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

  // Solar simulation
  solarW = abs(sin(now / 8000.0)) * SOLAR_MAX;
  
  float demand = throttle * MOTOR_MAX;
  float netBatPower = solarW;

  if (iceOn) {
    float iceP = (flightMode == 1) ? (throttle * ICE_MAX) : (flightMode == 2 ? ICE_MAX * 0.8 : 0);
    fuel -= (iceP * CONS_RATE * dt) / FUEL_CAP;
    if (flightMode == 1) demand -= iceP;
    else if (flightMode == 2) netBatPower += iceP;
    if (fuel <= 0) { fuel = 0; iceOn = false; }
  }

  motorOn = (throttle > 0.02 && battery > 2.0);
  if (motorOn) netBatPower -= demand;

  battery += (netBatPower * dt / (BAT_CAP_WH * 36.0));
  battery = constrain(battery, 0, 100);
  if (battery <= 0) motorOn = false;

  thrust = motorOn ? (throttle * 5000.0) : 0;
}

void updateHardware() {
  digitalWrite(PIN_LED_MOTOR_ON, motorOn);
  digitalWrite(PIN_LED_ICE_ON, iceOn);
  digitalWrite(PIN_LED_SOLAR_ACTIVE, solarW > 500);
}

void reportTelemetry() {
  static unsigned long lastRep = 0;
  if (millis() - lastRep > 200) {
    lastRep = millis();
    // JSON compatible output for potential bridge apps
    Serial.print("DATA:{");
    Serial.print("\"mas\":"); Serial.print(master);
    Serial.print(",\"ice\":"); Serial.print(iceOn);
    Serial.print(",\"mot\":"); Serial.print(motorOn);
    Serial.print(",\"mod\":"); Serial.print(flightMode);
    Serial.print(",\"bat\":"); Serial.print(battery, 1);
    Serial.print(",\"fue\":"); Serial.print(fuel, 1);
    Serial.print(",\"thr\":"); Serial.print(throttle * 100, 0);
    Serial.print(",\"sol\":"); Serial.print(solarW / 1000.0, 2);
    Serial.print(",\"tst\":"); Serial.print(thrust, 0);
    Serial.println("}");
  }
}

void loop() {
  if (digitalRead(PIN_EMERGENCY_KILL) == LOW) emergency = true;
  if (digitalRead(PIN_MASTER_SWITCH) == LOW) master = true;

  processSerialCommands();
  updatePhysics();
  updateHardware();
  reportTelemetry();
  delay(20);
}


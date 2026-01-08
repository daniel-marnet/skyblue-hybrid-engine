/*
 * Hybrid Aircraft Engine Simulation - ESP32
 * Advanced Environmental & Performance Analysis
 * Integrated with Photovoltaic Generation and Cockpit Controls
 * 
 * Features:
 * - Real-time CO2 emissions tracking
 * - Pollutants monitoring (NOx, CO, HC)
 * - Emissions avoided calculation
 * - Performance and autonomy metrics
 * - Energy efficiency analysis
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

// --- Physical Constants ---
const float BAT_CAP_WH = 50000.0;      // Battery capacity (Wh)
const float SOLAR_MAX = 5000.0;        // Max solar power (W)
const float MOTOR_MAX = 100000.0;      // Max electric motor power (W)
const float ICE_MAX = 75000.0;         // Max ICE power (W)
const float FUEL_CAP = 100.0;          // Fuel tank capacity (L)
const float CONS_RATE = 0.005;         // Fuel consumption rate (L/s per kW)

// --- Emissions Constants (g/kWh) ---
const float CO2_PER_KWH = 2640.0;      // CO2 emissions from aviation fuel
const float NOX_PER_KWH = 12.5;        // NOx emissions
const float CO_PER_KWH = 8.3;          // CO emissions
const float HC_PER_KWH = 2.1;          // Unburned hydrocarbons

// --- Performance Constants ---
const float CRUISE_SPEED_KMH = 250.0;  // Cruise speed (km/h)
const float AVIONICS_POWER = 2000.0;   // Avionics power consumption (W)

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

// --- Environmental Tracking Variables ---
float totalCO2_g = 0.0;                // Total CO2 emitted (grams)
float totalNOx_g = 0.0;                // Total NOx emitted (grams)
float totalCO_g = 0.0;                 // Total CO emitted (grams)
float totalHC_g = 0.0;                 // Total HC emitted (grams)
float totalFuelConsumed_L = 0.0;       // Total fuel consumed (liters)
float totalElectricEnergy_Wh = 0.0;    // Total electric energy used (Wh)
float totalSolarEnergy_Wh = 0.0;       // Total solar energy harvested (Wh)
float totalICEEnergy_Wh = 0.0;         // Total ICE energy produced (Wh)

// --- Performance Tracking ---
float flightTime_s = 0.0;              // Total flight time (seconds)
float distanceTraveled_km = 0.0;       // Distance traveled (km)
float totalThrust_Ns = 0.0;            // Integrated thrust (N·s)

// --- Comparison Variables (what if 100% ICE) ---
float conventionalCO2_g = 0.0;         // CO2 if using only ICE
float conventionalNOx_g = 0.0;         // NOx if using only ICE
float conventionalCO_g = 0.0;          // CO if using only ICE
float conventionalHC_g = 0.0;          // HC if using only ICE
float conventionalFuel_L = 0.0;        // Fuel if using only ICE

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

  // Update flight time
  flightTime_s += dt;

  // Solar simulation (varies with time, simulating sun angle)
  solarW = abs(sin(now / 8000.0)) * SOLAR_MAX;
  float solarEnergy_Wh = (solarW * dt) / 3600.0;
  totalSolarEnergy_Wh += solarEnergy_Wh;
  
  float demand = throttle * MOTOR_MAX;
  float netBatPower = solarW;
  float iceP = 0.0;
  float fuelConsumed_L = 0.0;

  // ICE Operation
  if (iceOn && fuel > 0) {
    // Calculate ICE power based on mode
    if (flightMode == 1) {
      // HYBRID: ICE assists propulsion
      iceP = throttle * ICE_MAX;
    } else if (flightMode == 2) {
      // CHARGING: ICE runs at optimal efficiency point
      iceP = ICE_MAX * 0.8;
    }
    
    // Fuel consumption
    fuelConsumed_L = (iceP / 1000.0) * CONS_RATE * dt; // Convert W to kW
    fuel -= (fuelConsumed_L / FUEL_CAP) * 100.0;
    totalFuelConsumed_L += fuelConsumed_L;
    
    // ICE energy production
    float iceEnergy_Wh = (iceP * dt) / 3600.0;
    totalICEEnergy_Wh += iceEnergy_Wh;
    
    // Calculate emissions from ICE
    float iceEnergy_kWh = iceEnergy_Wh / 1000.0;
    totalCO2_g += iceEnergy_kWh * CO2_PER_KWH;
    totalNOx_g += iceEnergy_kWh * NOX_PER_KWH;
    totalCO_g += iceEnergy_kWh * CO_PER_KWH;
    totalHC_g += iceEnergy_kWh * HC_PER_KWH;
    
    // Power distribution
    if (flightMode == 1) {
      demand -= iceP; // ICE helps with propulsion
    } else if (flightMode == 2) {
      netBatPower += iceP; // ICE charges battery
    }
    
    if (fuel <= 0) { 
      fuel = 0; 
      iceOn = false; 
    }
  }

  // Electric Motor Operation
  motorOn = (throttle > 0.02 && battery > 2.0);
  if (motorOn) {
    netBatPower -= demand;
    float electricEnergy_Wh = (demand * dt) / 3600.0;
    totalElectricEnergy_Wh += electricEnergy_Wh;
  }

  // Battery state update
  battery += (netBatPower * dt / (BAT_CAP_WH * 36.0));
  battery = constrain(battery, 0, 100);
  if (battery <= 0) motorOn = false;

  // Thrust calculation
  thrust = motorOn ? (throttle * 5000.0) : 0;
  totalThrust_Ns += thrust * dt;
  
  // Distance calculation
  float speed_ms = (CRUISE_SPEED_KMH * 1000.0) / 3600.0; // km/h to m/s
  float distance_m = speed_ms * dt * (throttle * 0.8 + 0.2); // Speed varies with throttle
  distanceTraveled_km += distance_m / 1000.0;

  // === CONVENTIONAL ENGINE COMPARISON ===
  // Calculate what emissions would be if using 100% ICE
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

void reportTelemetry() {
  static unsigned long lastRep = 0;
  if (millis() - lastRep > 500) { // Report every 500ms for detailed data
    lastRep = millis();
    
    // Calculate emissions avoided
    float co2Avoided_g = conventionalCO2_g - totalCO2_g;
    float noxAvoided_g = conventionalNOx_g - totalNOx_g;
    float coAvoided_g = conventionalCO_g - totalCO_g;
    float hcAvoided_g = conventionalHC_g - totalHC_g;
    float fuelSaved_L = conventionalFuel_L - totalFuelConsumed_L;
    
    // Calculate efficiency metrics
    float electricRatio = 0.0;
    float totalEnergy_Wh = totalElectricEnergy_Wh + totalICEEnergy_Wh;
    if (totalEnergy_Wh > 0) {
      electricRatio = (totalElectricEnergy_Wh / totalEnergy_Wh) * 100.0;
    }
    
    // Estimate remaining range
    float remainingEnergy_Wh = (battery / 100.0) * BAT_CAP_WH;
    float fuelEnergy_Wh = fuel * 10000.0; // Approximate energy in fuel
    float totalRemainingEnergy_Wh = remainingEnergy_Wh + fuelEnergy_Wh;
    float avgPowerConsumption_W = (flightTime_s > 0) ? 
      ((totalElectricEnergy_Wh + totalICEEnergy_Wh) * 3600.0 / flightTime_s) : MOTOR_MAX * 0.5;
    float estimatedRemainingTime_h = (avgPowerConsumption_W > 0) ? 
      (totalRemainingEnergy_Wh / avgPowerConsumption_W) : 0;
    float estimatedRange_km = estimatedRemainingTime_h * CRUISE_SPEED_KMH;
    
    // === BASIC TELEMETRY ===
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
    
    // === PERFORMANCE METRICS ===
    Serial.print(",\"flt_time\":"); Serial.print(flightTime_s, 1);
    Serial.print(",\"dist_km\":"); Serial.print(distanceTraveled_km, 2);
    Serial.print(",\"range_km\":"); Serial.print(estimatedRange_km, 1);
    
    // === ENERGY METRICS ===
    Serial.print(",\"elec_wh\":"); Serial.print(totalElectricEnergy_Wh, 1);
    Serial.print(",\"ice_wh\":"); Serial.print(totalICEEnergy_Wh, 1);
    Serial.print(",\"solar_wh\":"); Serial.print(totalSolarEnergy_Wh, 1);
    Serial.print(",\"elec_pct\":"); Serial.print(electricRatio, 1);
    
    // === EMISSIONS (HYBRID ACTUAL) ===
    Serial.print(",\"co2_g\":"); Serial.print(totalCO2_g, 1);
    Serial.print(",\"nox_g\":"); Serial.print(totalNOx_g, 3);
    Serial.print(",\"co_g\":"); Serial.print(totalCO_g, 3);
    Serial.print(",\"hc_g\":"); Serial.print(totalHC_g, 3);
    Serial.print(",\"fuel_l\":"); Serial.print(totalFuelConsumed_L, 3);
    
    // === EMISSIONS AVOIDED (vs Conventional) ===
    Serial.print(",\"co2_saved_g\":"); Serial.print(co2Avoided_g, 1);
    Serial.print(",\"nox_saved_g\":"); Serial.print(noxAvoided_g, 3);
    Serial.print(",\"co_saved_g\":"); Serial.print(coAvoided_g, 3);
    Serial.print(",\"hc_saved_g\":"); Serial.print(hcAvoided_g, 3);
    Serial.print(",\"fuel_saved_l\":"); Serial.print(fuelSaved_L, 3);
    
    // === CONVENTIONAL COMPARISON ===
    Serial.print(",\"conv_co2_g\":"); Serial.print(conventionalCO2_g, 1);
    Serial.print(",\"conv_fuel_l\":"); Serial.print(conventionalFuel_L, 3);
    
    // === REDUCTION PERCENTAGES ===
    float co2Reduction = (conventionalCO2_g > 0) ? 
      ((co2Avoided_g / conventionalCO2_g) * 100.0) : 0;
    float fuelReduction = (conventionalFuel_L > 0) ? 
      ((fuelSaved_L / conventionalFuel_L) * 100.0) : 0;
    Serial.print(",\"co2_reduction_pct\":"); Serial.print(co2Reduction, 1);
    Serial.print(",\"fuel_reduction_pct\":"); Serial.print(fuelReduction, 1);
    
    Serial.println("}");
  }
}

void reportEnvironmentalSummary() {
  static unsigned long lastSummary = 0;
  if (millis() - lastSummary > 30000) { // Summary every 30 seconds
    lastSummary = millis();
    
    Serial.println("\n========================================");
    Serial.println("   ENVIRONMENTAL IMPACT SUMMARY");
    Serial.println("========================================");
    
    Serial.print("Flight Time: "); 
    Serial.print(flightTime_s / 60.0, 1); 
    Serial.println(" min");
    
    Serial.print("Distance: "); 
    Serial.print(distanceTraveled_km, 2); 
    Serial.println(" km");
    
    Serial.println("\n--- HYBRID ENGINE EMISSIONS ---");
    Serial.print("CO2: "); Serial.print(totalCO2_g / 1000.0, 2); Serial.println(" kg");
    Serial.print("NOx: "); Serial.print(totalNOx_g, 1); Serial.println(" g");
    Serial.print("CO: "); Serial.print(totalCO_g, 1); Serial.println(" g");
    Serial.print("HC: "); Serial.print(totalHC_g, 1); Serial.println(" g");
    Serial.print("Fuel: "); Serial.print(totalFuelConsumed_L, 2); Serial.println(" L");
    
    Serial.println("\n--- CONVENTIONAL ENGINE (COMPARISON) ---");
    Serial.print("CO2: "); Serial.print(conventionalCO2_g / 1000.0, 2); Serial.println(" kg");
    Serial.print("Fuel: "); Serial.print(conventionalFuel_L, 2); Serial.println(" L");
    
    Serial.println("\n--- EMISSIONS AVOIDED ---");
    float co2Saved = (conventionalCO2_g - totalCO2_g) / 1000.0;
    float noxSaved = conventionalNOx_g - totalNOx_g;
    float fuelSaved = conventionalFuel_L - totalFuelConsumed_L;
    
    Serial.print("CO2 Saved: "); Serial.print(co2Saved, 2); Serial.println(" kg");
    Serial.print("NOx Saved: "); Serial.print(noxSaved, 1); Serial.println(" g");
    Serial.print("Fuel Saved: "); Serial.print(fuelSaved, 2); Serial.println(" L");
    
    if (conventionalCO2_g > 0) {
      float reduction = (co2Saved / (conventionalCO2_g / 1000.0)) * 100.0;
      Serial.print("CO2 Reduction: "); Serial.print(reduction, 1); Serial.println("%");
    }
    
    Serial.println("\n--- ENERGY BREAKDOWN ---");
    Serial.print("Electric: "); Serial.print(totalElectricEnergy_Wh / 1000.0, 2); Serial.println(" kWh");
    Serial.print("ICE: "); Serial.print(totalICEEnergy_Wh / 1000.0, 2); Serial.println(" kWh");
    Serial.print("Solar: "); Serial.print(totalSolarEnergy_Wh / 1000.0, 2); Serial.println(" kWh");
    
    float totalEnergy = totalElectricEnergy_Wh + totalICEEnergy_Wh;
    if (totalEnergy > 0) {
      float electricPct = (totalElectricEnergy_Wh / totalEnergy) * 100.0;
      Serial.print("Electric Ratio: "); Serial.print(electricPct, 1); Serial.println("%");
    }
    
    Serial.println("========================================\n");
  }
}

void loop() {
  if (digitalRead(PIN_EMERGENCY_KILL) == LOW) emergency = true;
  if (digitalRead(PIN_MASTER_SWITCH) == LOW) master = true;

  processSerialCommands();
  updatePhysics();
  updateHardware();
  reportTelemetry();
  reportEnvironmentalSummary();
  delay(20);
}


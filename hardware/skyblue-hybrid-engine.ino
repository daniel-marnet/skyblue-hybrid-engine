#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- Configurações de Rede ---
const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* RELAY_SERVER = "https://skyblue.marnettech.com.br";
const char* DATA_ENDPOINT = "/api/websocket-relay/wokwi";
const char* COMMAND_ENDPOINT = "/api/websocket-relay/command";

// --- Pinos ---
#define PIN_LED_MOTOR_ON 2
#define PIN_LED_ICE_ON 4
#define PIN_LED_SOLAR_ACTIVE 5

// --- Constantes Físicas ---
const float BAT_CAP_WH = 50000.0;     
const float FUEL_CAP_L = 100.0;       
const float MOTOR_MAX_W = 45000.0;    
const float ICE_MAX_W = 35000.0;      
const float SOLAR_MAX_W = 5000.0;     
const float FUEL_ENERGY_WH_KG = 12000.0;
const float FUEL_DENSITY_KG_L = 0.75;
const float ICE_EFFICIENCY = 0.35;
const float CO2_FACTOR = 2310.0;      

// --- Variáveis de Estado ---
bool master = false;
bool iceOn = false;
bool motorOn = false;
bool emergency = false;
int flightMode = 1; 
float battery = 80.0;
float fuel = 100.0;
float throttle = 0.0;
float solarW = 0.0;
float thrust = 0.0;

// --- Métricas Acumuladas ---
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

    WiFi.begin(ssid, password);
    Serial.println("\nConnecting WiFi...");
    
    lastMs = millis();
}

void loop() {
    unsigned long now = millis();
    float dt = (now - lastMs) / 1000.0;
    if (dt <= 0 || dt > 1.0) dt = 0.1;
    lastMs = now;

    // 1. PROCESSAR COMANDOS CLOUD
    if (WiFi.status() == WL_CONNECTED && (now - lastCommandCheck > 500)) {
        lastCommandCheck = now;
        checkCommands();
    }

    // 2. MOTOR FÍSICO
    if (master && !emergency) {
        // Simulação Solar
        solarW = (1200.0 + random(-50, 50)) * (abs(sin(now / 10000.0)) + 0.2);
        totalSolarEnergy_Wh += (solarW * dt) / 3600.0;

        // Lógica de Potência
        motorOn = (throttle > 0.02 && battery > 2.0);
        float motorPowerW = motorOn ? (throttle * MOTOR_MAX_W) : 0.0;
        float icePowerW = 0.0;

        if (iceOn && fuel > 0) {
            if (flightMode == 1) { // HYBRID
                icePowerW = (throttle > 0.1) ? ICE_MAX_W * throttle : ICE_MAX_W * 0.2;
            } else if (flightMode == 2) { // CHARGING
                icePowerW = ICE_MAX_W * 0.8;
                float chargeW = icePowerW * 0.9;
                battery += (chargeW * dt) / (BAT_CAP_WH * 36.0);
            }

            // Consumo de Combustível
            float fuelFlow = (icePowerW / (ICE_EFFICIENCY * FUEL_ENERGY_WH_KG * FUEL_DENSITY_KG_L)) / 3600.0; 
            float consumedL = fuelFlow * dt;
            fuel -= (consumedL / FUEL_CAP_L) * 100.0;
            totalFuelConsumed_L += consumedL;
            totalCO2_g += consumedL * CO2_FACTOR;
            totalICEEnergy_Wh += (icePowerW * dt) / 3600.0;
            
            if (fuel <= 0) { fuel = 0; iceOn = false; }
        }

        if (motorOn) {
            float netFromBatteryW = motorPowerW - solarW;
            if (netFromBatteryW > 0) {
                battery -= (netFromBatteryW * dt) / (BAT_CAP_WH * 36.0);
                totalElectricEnergy_Wh += (netFromBatteryW * dt) / 3600.0;
            }
        }
        battery = constrain(battery, 0.0, 100.0);
        fuel = constrain(fuel, 0.0, 100.0);

        // Dinâmica de Vôo
        thrust = (motorOn ? throttle * 3500.0 : 0.0) + (iceOn && flightMode == 1 ? 1500.0 : 0.0);
        speed_kt = (thrust / 40.0) + (speed_kt * 0.95); // Velocidade baseada no empuxo
        distanceTraveled_km += (speed_kt * 1.852 * dt) / 3600.0;
        flightTime_s += dt;

    } else {
        motorOn = false;
        thrust = 0.0;
        speed_kt = max(0.0f, speed_kt - (5.0f * dt));
    }

    // 3. ATUALIZAR HARDWARE LOCAL
    digitalWrite(PIN_LED_MOTOR_ON, motorOn);
    digitalWrite(PIN_LED_ICE_ON, iceOn);
    digitalWrite(PIN_LED_SOLAR_ACTIVE, solarW > 500.0);

    // 4. TELEMETRIA
    if (WiFi.status() == WL_CONNECTED && (now - lastDataSend > 1000)) {
        lastDataSend = now;
        sendTelemetry();
    }

    if (WiFi.status() != WL_CONNECTED && (now % 15000 < 100)) WiFi.begin(ssid, password);
    
    delay(50);
}

void checkCommands() {
    http.begin(String(RELAY_SERVER) + COMMAND_ENDPOINT);
    int httpCode = http.GET();
    if (httpCode == 200) {
        String payload = http.getString();
        StaticJsonDocument<512> doc;
        if (deserializeJson(doc, payload) == DeserializationError::Ok) {
            JsonObject cmd = doc["command"];
            if (!cmd.isNull()) {
                String type = cmd["type"];
                if (type == "MASTER_ON") { master = true; emergency = false; }
                else if (type == "MASTER_OFF") { master = false; }
                else if (type == "ICE_START") { iceOn = true; }
                else if (type == "ICE_STOP") { iceOn = false; }
                else if (type == "THROTTLE") { 
                    throttle = (float)(cmd["value"] | 0) / 100.0; 
                    Serial.print("Set Throttle: "); Serial.println(throttle);
                }
                else if (type == "MODE") { flightMode = cmd["value"] | 1; }
                else if (type == "EMERGENCY_ON") { emergency = true; master = false; }
                Serial.print("→ Command: "); Serial.println(type);
            }
        }
    }
    http.end();
}

void sendTelemetry() {
    StaticJsonDocument<1536> doc;
    float totalWh = totalElectricEnergy_Wh + totalICEEnergy_Wh;
    float elecPct = (totalWh > 0) ? (totalElectricEnergy_Wh / totalWh) * 100.0 : 0.0;
    
    // Análise de Economia
    float convFuelRef = (totalWh / 0.30) / (12000.0 * 0.75); // Referência convencional
    float co2Saved = (convFuelRef - totalFuelConsumed_L) * CO2_FACTOR;

    doc["mas"] = master ? 1 : 0;
    doc["ice"] = iceOn ? 1 : 0;
    doc["mot"] = motorOn ? 1 : 0;
    doc["eme"] = emergency ? 1 : 0;
    doc["mod"] = flightMode;
    doc["bat"] = battery;
    doc["fue"] = fuel;
    doc["thr"] = throttle * 100.0;
    doc["sol"] = solarW / 1000.0;
    doc["tst"] = thrust;
    doc["spd"] = speed_kt;
    doc["alt"] = distanceTraveled_km * 3280.0;
    doc["flt_time"] = flightTime_s;
    doc["dist_km"] = distanceTraveled_km;
    doc["range_km"] = (fuel > 1) ? (fuel * 15.0) + (battery * 2.0) : (battery * 2.5);
    doc["elec_pct"] = elecPct;
    doc["co2_saved_g"] = co2Saved;
    doc["co2_reduction_pct"] = constrain(elecPct, 0, 100); 
    doc["fuel_saved_l"] = max(0.0f, convFuelRef - totalFuelConsumed_L);

    String target;
    serializeJson(doc, target);
    http.begin(String(RELAY_SERVER) + DATA_ENDPOINT);
    http.addHeader("Content-Type", "application/json");
    http.POST(target);
    http.end();
}

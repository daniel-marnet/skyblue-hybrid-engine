# 🚁 SKYBLUE | Hybrid Aero Engine v5.5 - Glass Cockpit & Cloud HIL

[![React](https://img.shields.io/badge/UI-React_v18-61dafb.svg)](https://reactjs.org/)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel-black.svg)](https://vercel.com/)
[![Redis](https://img.shields.io/badge/Database-Redis_Cloud-red.svg)](https://redis.io/)
[![Hardware](https://img.shields.io/badge/Hardware-ESP32_HIL-blue.svg)](https://www.espressif.com/)

**SKYBLUE** is a next-generation aerospace engineering ecosystem for the development and monitoring of hybrid engines. The system integrates real hardware (**ESP32**), advanced physics simulation, and a digital cockpit interface (**Glass Cockpit**) synchronized via the cloud in real-time.

---

## 🚀 Quick Access
- **🕹️ Digital Dashboard (Live):** [https://skyblue-hybrid-engine.vercel.app](https://skyblue-hybrid-engine.vercel.app)
- **📟 Online Simulation (Wokwi):** [Wokwi Simulation Project v5](https://wokwi.com/projects/452473775385515009)
- **🔗 Developer Portfolio:** [Daniel Marnet Tech](https://daniel.marnettech.com.br/)

---

## 🌟 Key Innovations (v5.5)

### ☁️ Cloud Architecture (Redis & Vercel)
Utilizing **Redis Cloud**, the system enables persistence of mission-critical data. The **"Go Cloud"** button enables global synchronization:
- **Remote Telemetry**: Monitor the engine's status from anywhere in the world.
- **Serverless Backend**: Lightweight data processing via Vercel Edge Functions.

### 🕹️ Hardware-in-the-Loop (HIL)
Direct integration via **Web Serial API**, allowing the browser to communicate bidirectionally with the ESP32.
- **Direct Control**: Send ignition and throttle commands via real hardware.
- **Real-time Stats**: Receive physical JSON telemetry at 10Hz.

### ⚡ Power Trifecta (Sustainable Energy)
- **Photovoltaic Array**: Dynamic solar generation model based on flight time.
- **High-Density Energy Storage**: 50kWh Li-ion battery bank simulation.
- **Hybrid Range Extender**: Internal Combustion Engine (ICE) for assisted propulsion and recharging.

---

## 🛠️ Technology Stack
- **Frontend**: React 18 (Vite), Chart.js (Telemetry Graphs), Lucide Icons.
- **Backend API**: Node.js Serverless on Vercel Infrastructure.
- **Persistence**: ioredis connected to Redis Cloud.
- **Firmware**: Embedded C++ (Arduino Framework) optimized for ESP32.

---

## 📁 Ecosystem Structure
```text
├── api/                    # Serverless API for Cloud Synchronization
├── src/                    # Cockpit UI (React + CSS Glassmorphism)
│   ├── App.jsx             # Interface Engine & Physics Logic
│   └── index.css           # Aerospace Design System
├── hybrid_engine.ino       # Engine Control System Firmware
├── diagram.json            # Wokwi Hardware Configuration
└── simulation_model.md     # Experimental Physics Documentation
```

---

## 📄 Operating Protocol
1. **Activation**: Turn on the **Master Switch** to energize the avionics buses.
2. **Link**: Use the **"HW Link"** button to connect the physical model via Serial port.
3. **Cloud**: Activate **"Go Cloud"** to mirror telemetry to the Redis server.
4. **Combustion**: Start **ICE Ignition** if you need extra power or fast charging.

---
*SKYBLUE - Engineering the Future of Sustainable Aero Propulsion.*  
*Developed by **Daniel Marnet**.*

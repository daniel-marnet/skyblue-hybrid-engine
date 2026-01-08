# SKYBLUE Hybrid Aero Engine Control System v1.0

SKYBLUE is a professional-grade telemetry and control system for hybrid-electric aircraft propulsion. It bridges high-fidelity hardware simulation (ESP32) with a real-time engineering dashboard to analyze performance and environmental impact.

[![Live Demo](https://img.shields.io/badge/Demo-Live-cyan)](https://skyblue.marnettech.com.br)
[![Hardware Simulation](https://img.shields.io/badge/Wokwi-ESP32-red)](https://wokwi.com/projects/452473775385515009)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🏗️ Architecture

The system utilizes a tri-layer architecture for seamless cloud-synchronized control:

1.  **Frontend (React/Vite):** A high-performance dashboard featuring 6 real-time charts, primary flight display (PFD), and emission analysis.
2.  **Relay Logic (Vercel Serverless):** A specialized SSE (Server-Sent Events) and Redis relay that synchronizes hardware states across worldwide instances.
3.  **Hardware Model (ESP32/C++):** A physics engine simulating battery discharge, combustion efficiency, and solar harvesting logic.

---

## ⚡ Core Specifications

| System | Capacity/Power | Role |
| :--- | :--- | :--- |
| **Electric Motor** | 100 kW | Primary propulsion (Zero Emissions) |
| **ICE Engine** | 75 kW | Range extender & battery charging |
| **Solar Array** | 5 kW | Continuous sustainable harvesting |
| **Energy Storage** | 50 kWh | High-density lithium-ion simulation |

---

## ✨ Features

*   **Real-time Telemetry:** Over 30 parameters tracked at 500ms intervals (Thrust, Battery, Fuel, Emissions).
*   **Environmental Suite:** Comparative analysis between hybrid and conventional propulsion (CO₂, NOx, HC).
*   **Operating Modes:** 
    *   `ELECTRIC`: Pure battery flight.
    *   `HYBRID`: Combined ICE and Electric power for maximum thrust.
    *   `CHARGING`: ICE prioritizes battery recovery while maintaining flight.
*   **Engineering Cockpit:** Professional-grade layout optimized for monitoring and manual control.
*   **One-Click Simulation:** Direct "RUN MODEL" integration to launch and synchronize the Wokwi hardware model.
*   **Adaptive UI:** High-fidelity animations and PFD (Primary Flight Display) that respond to hardware physics.

---

## 🚀 Quick Start

### 1. Web Interface
```bash
git clone https://github.com/daniel-marnet/skyblue-hybrid-engine.git
cd skyblue-hybrid-engine
npm install
npm run dev
```

### 2. Hardware Simulation
1.  Open the [Wokwi Project](https://wokwi.com/projects/452473775385515009).
2.  Ensure `RELAY_SERVER` in `skyblue-hybrid-engine.ino` points to your deployment.
3.  Click **Play** to start the telemetry stream.

---

## 📁 Project Structure

*   `/src`: React application source and UI components.
*   `/api`: Vercel serverless relay and state management.
*   `/hardware`: ESP32 source code and Wokwi circuit definitions.
*   `/docs`: Detailed physics models and integration checklists.

---

## 👨‍💻 Author & Support

**Daniel Marnet**
*   **Portfolio:** [daniel.marnettech.com.br](https://daniel.marnettech.com.br/)
*   **Contact:** [daniel.marnet.tech@gmail.com](mailto:daniel.marnet.tech@gmail.com)
*   **Issues:** [GitHub Issue Tracker](https://github.com/daniel-marnet/skyblue-hybrid-engine/issues)

---
<div align="center">
  <b>SKYBLUE v1.0</b> • <i>Advancing Hybrid Aerospace Technology</i>
</div>

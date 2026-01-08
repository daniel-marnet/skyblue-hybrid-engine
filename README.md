# ✈️ SKYBLUE Hybrid Aero Engine v1.0

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![ESP32](https://img.shields.io/badge/ESP32-Wokwi-red)

**Advanced Hybrid Aircraft Propulsion System Simulator**

Real-time environmental analysis & performance monitoring for hybrid electric-combustion propulsion.

[🚀 Live Demo](https://skyblue-hybrid-engine.vercel.app) • [🎮 Wokwi Simulation](https://wokwi.com/projects/452473775385515009) • [📖 Documentation](#-documentation) • [🐛 Report Bug](https://github.com/daniel-marnet/skyblue-hybrid-engine/issues)

</div>

---

## 🎯 Overview

**SKYBLUE Hybrid Aero Engine** is a comprehensive simulation combining:
- **🌐 Web Interface** (React + Chart.js) - Real-time data visualization & controls
- **⚡ ESP32 Simulation** (Wokwi) - Hardware-level physics & telemetry
- **📊 Environmental Analysis** - CO₂, NOx, emissions tracking & comparison

### System Components

```
┌──────────────────────────────────────────────────────┐
│        SKYBLUE v1.0 - CLOUD CONNECTED                │
├──────────────────────────────────────────────────────┤
│                                                        │
│  🌐 WEB INTERFACE (Vercel)                           │
│  https://skyblue-hybrid-engine.vercel.app            │
│  ├─ Interactive Charts & Real-time Metrics           │
│  ├─ Flight Controls (Throttle, Modes, Power)         │
│  └─ Environmental Impact Dashboard                   │
│           ↕ SSE (Server-Sent Events)                 │
│  ⚡ RELAY SERVER (Vercel Edge Function)              │
│  /api/websocket-relay                                │
│  ├─ Broadcasts Wokwi data to Interface               │
│  └─ Routes commands from Interface to Wokwi          │
│           ↕ HTTP POST/GET                            │
│  🎮 WOKWI SIMULATION (ESP32)                         │
│  https://wokwi.com/projects/452473775385515009       │
│  ├─ skyblue-hybrid-engine.ino                        │
│  ├─ Full Physics Engine (Battery, Fuel, Emissions)   │
│  ├─ LEDs (Motor, ICE, Solar)                         │
│  └─ Serial Monitor (Live Telemetry)                  │
│                                                        │
└──────────────────────────────────────────────────────┘
```

### Hybrid Propulsion Architecture

- **⚡ Electric Motor** - 100 kW maximum power
- **🔥 ICE Engine** - 75 kW combustion backup
- **☀️ Solar Panels** - 5 kW sustainable generation

---

## ✨ Features

### 🌐 Web Interface
- **6 Real-time Charts**: Thrust, Energy, Power, Flight Dynamics, Emissions, Breakdown
- **Flight Controls**: Master Power, ICE Start, Mode Selection, Throttle (0-100%)
- **Environmental Dashboard**: CO₂ reduction, fuel savings, electric ratio
- **Primary Flight Display**: Animated thrust visualization
- **Built-in Help System**: 8 comprehensive documentation sections

### ⚡ Wokwi ESP32 Simulation
- **Full Physics Engine**: Battery discharge, fuel consumption, solar generation
- **Realistic Emissions**: CO₂, NOx, CO, HC calculations based on actual factors
- **Visual Feedback**: LED indicators for Motor, ICE, Solar activity
- **Serial Telemetry**: Live data stream every 500ms
- **Interactive Hardware**: Physical buttons for all controls

### 🛠️ Three Operating Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **ELECTRIC** | Battery-only propulsion | Cruising, zero emissions |
| **HYBRID** | Electric + ICE combined | Maximum thrust, takeoff |
| **CHARGING** | ICE charges battery | Range extension |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Modern browser (Chrome 89+, Edge 89+, Firefox 88+)
- Internet connection (for Wokwi)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/daniel-marnet/skyblue-hybrid-engine.git
cd skyblue-hybrid-engine

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Using the Simulator

**Method 1: Web Interface Only (Recommended)**
1. Open http://localhost:5173 (or [Live Demo](https://skyblue-hybrid-engine.vercel.app))
2. Click **"MASTER POWER"** to activate
3. Use throttle slider to control power
4. Watch charts and metrics update in real-time!

**Method 2: With Wokwi Visualization**
1. Open [Wokwi Project](https://wokwi.com/projects/452473775385515009)
2. Click **Play ▶️** to start ESP32 simulation
3. See LEDs light up, check Serial Monitor for telemetry
4. Use web interface controls (they both run independently)

---

## 📊 Technical Specifications

### Physics Model
- **Battery**: 50 kWh capacity, real-time SoC tracking
- **Fuel**: 100L capacity, 0.8 kg/L density, 12000 Wh/kg energy
- **ICE Efficiency**: 28% (realistic combustion engine)
- **Solar Variance**: Dynamic generation based on time simulation
- **Thrust Range**: 0-5000 Newtons

### Emission Factors
| Pollutant | Factor | Unit |
|-----------|--------|------|
| CO₂ | 2640 | g/kWh |
| NOx | 12.5 | g/kWh |
| CO | 8.3 | g/kWh |
| HC | 2.1 | g/kWh |

### Telemetry Data
The simulation tracks **32 real-time parameters**:
- Power & Energy (battery, fuel, solar, thrust)
- Flight Metrics (time, distance, range, speed, altitude)
- Emissions (CO₂, NOx, CO, HC - hybrid vs conventional)
- Efficiency (electric ratio, savings percentages)

---

## 🌐 Deployment

### Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# Deploy via Vercel Dashboard
# 1. Import GitHub repository
# 2. Framework: Vite
# 3. Build Command: npm run build
# 4. Output Directory: dist
# 5. Deploy!
```

### Environment Variables

```env
# .env file
VITE_RELAY_URL=https://your-project.vercel.app  # Your Vercel URL
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX            # Google Analytics (optional)
```

### Connect Wokwi to Vercel

**📘 Complete Setup Guide:** [WOKWI_RELAY_SETUP.md](docs/WOKWI_RELAY_SETUP.md)

**Quick Steps:**
1. Relay server is already in `/api/websocket-relay.js` (auto-deployed with Vercel)
2. Edit `skyblue-hybrid-engine.ino` line 20: Set `RELAY_SERVER` to your Vercel URL
3. Open https://wokwi.com/projects/452473775385515009
4. Install ArduinoJson library in Wokwi
5. Click Play ▶️
6. In web interface, click **"Connect Wokwi"** (cloud icon) → Should show "Wokwi Connected"
7. ✅ Control Wokwi from Vercel in real-time!

---

## 📁 Project Structure

```
skyblue-hybrid-engine/
├── src/                                   # Frontend application
│   ├── components/
│   │   ├── HelpModal.jsx                  # Documentation system
│   │   └── HelpModal.css
│   ├── hooks/
│   │   └── useWebSocketConnection.js      # SSE connection hook
│   ├── utils/
│   │   └── analytics.js                   # Google Analytics
│   ├── App.jsx                            # Main application
│   └── main.jsx
│
├── api/
│   └── websocket-relay.js                 # Vercel relay server (Edge Function)
│
├── hardware/                              # Wokwi simulation files
│   ├── skyblue-hybrid-engine.ino          # ESP32 simulation code
│   ├── diagram.json                       # Wokwi circuit diagram
│   └── wokwi.toml                         # Wokwi configuration
│
├── docs/                                  # Documentation
│   ├── CHANGELOG.md                       # Version history
│   ├── CONTRIBUTING.md                    # Contribution guidelines
│   ├── DEPLOYMENT.md                      # Deployment guide
│   ├── DIAGRAM_GUIDE.md                   # Wokwi diagram documentation
│   ├── HELP_SYSTEM.md                     # Help system documentation
│   ├── INTEGRATION_CHECKLIST.md           # Integration verification
│   ├── simulation_model.md                # Physics model documentation
│   └── WOKWI_RELAY_SETUP.md              # Cloud connection setup
│
├── public/                                # Static assets
│   ├── skyblue.png                        # Logo
│   └── favicon.ico                        # Favicon
│
├── package.json                           # Dependencies
├── vite.config.js                         # Vite configuration
├── vercel.json                            # Vercel deployment config
├── index.html                             # HTML entry point
├── LICENSE                                # MIT License
└── README.md                              # This file
```

---

## 📖 Documentation

### Quick Links
- **[📘 Contributing Guide](docs/CONTRIBUTING.md)** - How to contribute
- **[🚀 Deployment Guide](docs/DEPLOYMENT.md)** - Deploy to production
- **[🔌 Wokwi Setup Guide](docs/WOKWI_RELAY_SETUP.md)** - Cloud connection setup
- **[📐 Diagram Guide](docs/DIAGRAM_GUIDE.md)** - Circuit diagram documentation
- **[✅ Integration Checklist](docs/INTEGRATION_CHECKLIST.md)** - Verification guide
- **[❓ Help System](docs/HELP_SYSTEM.md)** - Built-in help documentation
- **[🔬 Physics Model](docs/simulation_model.md)** - Simulation algorithms
- **[📝 Changelog](docs/CHANGELOG.md)** - Version history

### In-App Documentation
Click the **"Help"** button in the web interface for:
- System Overview
- Getting Started Guide
- Interface Layout
- Controls Reference
- Metrics Explanation
- Environmental Analysis
- Troubleshooting
- Connection Guide

---

## 🎮 Usage Examples

### Basic Flight Operations

```javascript
// 1. Power on the system
Click "MASTER POWER" → System activates

// 2. Start electric propulsion
Move throttle slider to 50% → Motor engages, thrust builds

// 3. Enable hybrid mode
Click "ICE ENGINE" → Combustion engine starts
Click "MODE" repeatedly → Cycle to HYBRID mode
→ ICE assists propulsion, more thrust available

// 4. Monitor environmental impact
Check "Environmental Impact" panel
→ See CO₂ savings vs conventional aircraft
→ Track fuel reduction percentage
→ Monitor electric energy ratio

// 5. Emergency shutdown
Click "EMERGENCY KILL" → All systems power down immediately
```

### Advanced: Mode Strategies

**🔋 Extended Range Flight**
1. Start in ELECTRIC mode for efficient cruising
2. When battery reaches ~30%, switch to CHARGING mode
3. ICE recharges battery while maintaining flight
4. Switch back to ELECTRIC when battery recovered
5. **Result**: 40-60% fuel savings vs conventional

**⚡ Maximum Performance**
1. Start with MASTER POWER ON
2. Set throttle to 100%
3. Enable ICE ENGINE
4. Select HYBRID mode
5. **Result**: Combined 175 kW total power (Electric 100 kW + ICE 75 kW)

---

## 🐛 Troubleshooting

### Common Issues

**Q: Charts are not updating**
- Ensure Master Power is ON
- Check throttle is above 0%
- Refresh page (Ctrl+R / Cmd+R)

**Q: Data seems frozen**
- Verify you set throttle above 0%
- Check browser console (F12) for errors
- Clear browser cache and reload

**Q: Want to see Wokwi simulation**
- Visit https://wokwi.com/projects/452473775385515009
- Click Play ▶️
- Check Serial Monitor for telemetry
- LEDs show real-time status

### Debug Mode

Open browser console (F12) and check for:
```javascript
// Look for these console messages:
"🔌 Connecting to WebSocket: ws://..."
"✅ WebSocket connected"
"📊 Status update: Connected"
"📨 Data received: {bat: 75.3, fue: 82.5, ...}"
```

---

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👨‍💻 Author

**Daniel Marnet**

- 🌐 Website: [daniel.marnettech.com.br](https://daniel.marnettech.com.br/)
- 💼 GitHub: [@daniel-marnet](https://github.com/daniel-marnet)
- 📧 Email: daniel@marnettech.com.br
- 🔗 Project: [SKYBLUE Hybrid Engine](https://github.com/daniel-marnet/skyblue-hybrid-engine)

---

## 🙏 Acknowledgments

- **[Wokwi](https://wokwi.com)** - ESP32 online simulator
- **[Vercel](https://vercel.com)** - Web hosting & deployment
- **[Chart.js](https://www.chartjs.org/)** - Data visualization
- **[Lucide](https://lucide.dev/)** - Icon library
- **[React](https://react.dev/)** - UI framework
- **[Vite](https://vitejs.dev/)** - Build tool

---

## 📊 Project Status

| Aspect | Status |
|--------|--------|
| **Version** | 1.0.0 - Environmental Analysis Edition |
| **Status** | ✅ Production Ready |
| **Last Updated** | January 2026 |
| **Maintenance** | 🟢 Active |
| **Live Demo** | [skyblue-hybrid-engine.vercel.app](https://skyblue-hybrid-engine.vercel.app) |
| **Wokwi** | [wokwi.com/projects/452473775385515009](https://wokwi.com/projects/452473775385515009) |

---

## 🔮 Roadmap

### v1.1 (Planned)
- [ ] Multi-language support (PT-BR, ES, FR)
- [ ] Historical data export (CSV, JSON)
- [ ] Flight plan presets
- [ ] Mobile-responsive improvements

### v1.2 (Future)
- [ ] Advanced autopilot modes
- [ ] Machine learning optimization
- [ ] Real ESP32 hardware support
- [ ] VR/AR visualization

### v2.0 (Vision)
- [ ] Mobile app (React Native)
- [ ] Multi-aircraft comparison
- [ ] Weather impact simulation
- [ ] Community flight database

---

## 💡 Use Cases

### Education
- 🎓 **Aerospace Engineering** - Study hybrid propulsion systems
- 🔬 **Environmental Science** - Analyze emission reduction strategies
- 💻 **Programming** - Learn React, embedded systems, WebSockets

### Research
- 📊 **Performance Analysis** - Compare different operating modes
- 🌍 **Sustainability** - Calculate environmental impact
- ⚡ **Energy Management** - Optimize power distribution

### Professional
- 🛫 **Aviation Industry** - Prototype hybrid aircraft concepts
- 🔋 **Battery Technology** - Model energy storage systems
- ☀️ **Solar Integration** - Study renewable energy in aviation

---

## 📞 Support

Need help? Here's how to get support:

1. **📖 Documentation**: Click "Help" button in the interface
2. **🐛 Issues**: [GitHub Issues](https://github.com/daniel-marnet/skyblue-hybrid-engine/issues)
3. **💬 Discussions**: [GitHub Discussions](https://github.com/daniel-marnet/skyblue-hybrid-engine/discussions)
4. **📧 Email**: daniel@marnettech.com.br

---

<div align="center">

### ⭐ Star this repo if you find it useful!

**SKYBLUE v1.0 - Making hybrid aerospace technology accessible to everyone**

[🚀 Live Demo](https://skyblue-hybrid-engine.vercel.app) • [🎮 Wokwi](https://wokwi.com/projects/452473775385515009) • [📖 Docs](#-documentation) • [🐛 Issues](https://github.com/daniel-marnet/skyblue-hybrid-engine/issues)

Made with ❤️ by [Daniel Marnet](https://daniel.marnettech.com.br/)

</div>

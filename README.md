# ✈️ SKYBLUE Hybrid Aero Engine Control System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![ESP32](https://img.shields.io/badge/ESP32-Compatible-red)
![Wokwi](https://img.shields.io/badge/Wokwi-Ready-orange)

**Advanced Hybrid Aircraft Propulsion System Simulator**

Real-time monitoring and control of hybrid electric-combustion propulsion with environmental impact analysis.

[Live Demo](https://skyblue-hybrid-engine.vercel.app) • [Wokwi Simulation](https://wokwi.com/projects/452473775385515009) • [GitHub Repository](https://github.com/daniel-marnet/skyblue-hybrid-engine) • [Report Bug](https://github.com/daniel-marnet/skyblue-hybrid-engine/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [Production Deployment](#-production-deployment)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

SKYBLUE is a comprehensive hybrid aircraft propulsion system simulator that combines:
- **Electric Motor** (100 kW) for efficient cruising
- **Internal Combustion Engine** (75 kW) for peak performance
- **Solar Panels** (5 kW) for sustainable energy generation

The system provides real-time telemetry, environmental impact analysis, and intelligent power management across three operating modes.

### Key Capabilities

- ⚡ **Real-time Telemetry** - Live data visualization with 6 interactive charts
- 🌍 **Environmental Tracking** - CO₂, NOx, CO, HC emissions monitoring
- 📊 **Performance Analysis** - Thrust, range, efficiency metrics
- 🔌 **Wokwi Integration** - Direct WebSocket connection to ESP32 simulation
- 🎮 **Interactive Controls** - Master power, ICE, mode selection, throttle
- 📱 **Responsive Design** - Professional aerospace-grade interface
- 📖 **Built-in Documentation** - Comprehensive help system

---

## ✨ Features

### Propulsion System
- **Hybrid Architecture**: Electric motor + ICE + Solar panels
- **Three Operating Modes**:
  - `ELECTRIC` - Pure battery power, zero emissions
  - `HYBRID` - Combined electric + ICE for maximum thrust
  - `CHARGING` - ICE charges battery at optimal efficiency
- **Intelligent Power Management**: Automatic energy distribution
- **Emergency Kill Switch**: Immediate system shutdown

### Monitoring & Analytics
- **Real-time Charts**:
  - Thrust force visualization
  - Energy levels (battery, fuel)
  - Power generation (solar, electric, ICE)
  - Flight dynamics (speed, altitude)
  - Emissions tracking
  - Energy breakdown
- **Performance Metrics**:
  - Flight time, distance, range estimation
  - Battery SoC, fuel level, solar power
  - Thrust output, speed, altitude
- **Environmental Impact**:
  - Emissions comparison (hybrid vs conventional)
  - CO₂ reduction percentage
  - Fuel savings calculation

### User Interface
- **Modern Design**: Dark theme with cyan accents
- **Three-column Layout**: Charts, main display, controls
- **Interactive Elements**: Buttons, sliders, real-time graphs
- **Status Indicators**: Connection, power, mode, emergency
- **Help System**: 8-section comprehensive documentation

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SKYBLUE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Wokwi      │ ◄─────► │  Interface   │                  │
│  │   ESP32      │ WebSocket│  React App   │                  │
│  │  Simulation  │         │  (Vercel)    │                  │
│  └──────────────┘         └──────────────┘                  │
│         │                        │                            │
│         │                        │                            │
│    ┌────▼────┐              ┌───▼────┐                       │
│    │ WiFi    │              │ Charts │                       │
│    │ Server  │              │ & Data │                       │
│    │ :8080   │              │ Viz    │                       │
│    └─────────┘              └────────┘                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18.x
- Chart.js with react-chartjs-2
- Lucide React icons
- Vite build tool
- CSS3 with animations

**Backend (ESP32):**
- Arduino framework
- WiFi library
- WebSocketsServer library
- Real-time telemetry generation

**Communication:**
- WebSocket protocol
- JSON data format
- 500ms update rate

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Modern browser (Chrome 89+, Edge 89+, Opera 75+)
- Wokwi account (free)

### 3-Step Setup

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

### Connect to Wokwi

1. Open [Wokwi Project](https://wokwi.com/projects/452473775385515009)
2. Click **Play** ▶️
3. Wait for "WiFi connected" in Serial Monitor
4. In SKYBLUE interface, click **"HW Link"**
5. ✅ Connected! Real-time data flowing.

---

## 📦 Installation

### Development Environment

```bash
# Install dependencies
npm install

# Install Wokwi CLI (optional, for advanced usage)
npm install -g @wokwi/cli

# Start development server
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# WebSocket URL (development)
VITE_WS_URL=ws://localhost:8080

# Google Analytics (optional)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

For production (Vercel):

```env
# WebSocket URL (production - use your ngrok/cloudflare URL)
VITE_WS_URL=wss://your-bridge-url.ngrok.io

# Google Analytics
VITE_GA_MEASUREMENT_ID=G-Y3XLT2MJFW
```

---

## 💻 Usage

### Basic Operation

1. **Power On**
   - Click **"HW Link"** to connect to Wokwi
   - Click **"MASTER POWER"** to activate system
   - System initializes with default values

2. **Control Throttle**
   - Use slider to set power (0-100%)
   - Thrust increases proportionally
   - Battery depletes based on power draw

3. **Manage Modes**
   - **ELECTRIC**: Battery-only, zero emissions
   - **HYBRID**: Click "ICE ENGINE" then select HYBRID mode
   - **CHARGING**: ICE charges battery while flying

4. **Monitor Performance**
   - Watch real-time charts for trends
   - Check environmental impact summary
   - Monitor range estimation

5. **Emergency Shutdown**
   - Click **"ABORT / KILL"** for immediate stop
   - All systems power down
   - Throttle resets to 0%

### Advanced Features

#### Cloud Sync (Optional)
```bash
# Enable Redis cloud sync
# Set environment variables:
REDIS_URL=your_redis_url
REDIS_TOKEN=your_redis_token

# Click "Cloud" button in interface
```

#### Custom WebSocket URL
```javascript
// In .env file
VITE_WS_URL=ws://custom-server:8080
```

#### Analytics Integration
```javascript
// Google Analytics is pre-configured
// Events tracked:
// - Page views
// - Button clicks
// - Connection status
// - Mode changes
// - Emergency activations
```

---

## 🌐 Production Deployment

### Deploy to Vercel (Recommended)

#### Step 1: Prepare Repository

```bash
# Ensure code is committed
git add .
git commit -m "Ready for production"
git push origin main
```

#### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Add Environment Variables:
   ```
   VITE_WS_URL=wss://your-websocket-url.com:8080
   VITE_GA_MEASUREMENT_ID=G-Y3XLT2MJFW
   ```

6. Click **"Deploy"**

#### Step 3: Set Up WebSocket Bridge (for production)

**Option A: ngrok (Quick & Easy)**

```bash
# On your local machine with Wokwi running
npm install -g ngrok

# Start ngrok tunnel
ngrok http 8080

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update Vercel environment variable:
VITE_WS_URL=wss://abc123.ngrok.io
```

**Option B: Cloudflare Tunnel (Permanent)**

```bash
# Install cloudflared
# Follow: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

# Create tunnel
cloudflared tunnel --url http://localhost:8080

# Get permanent URL and update Vercel
```

**Option C: Self-hosted Server**

Deploy `bridge-server.js` to a VPS:

```bash
# On your server
git clone https://github.com/daniel-marnet/skyblue-hybrid-engine.git
cd skyblue-hybrid-engine
npm install serialport ws express cors
node bridge-server.js

# Configure firewall to allow port 8080
# Update Vercel with your server URL
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build project
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Deploy to GitHub Pages

```bash
# Install gh-pages
npm install -D gh-pages

# Add to package.json scripts:
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

### Custom Domain Setup

1. In Vercel/Netlify dashboard, go to **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Enable HTTPS (automatic)
5. Update `VITE_WS_URL` if needed

---

## ⚙️ Configuration

### Wokwi Configuration

**File: `wokwi.toml`**

```toml
[wokwi]
version = 1
firmware = 'hybrid_engine_websocket.ino'

[[net.forward]]
from = "localhost:8080"
to = "target:8080"
```

**File: `diagram.json`**

Contains ESP32 pin mappings for:
- LEDs (Motor, ICE, Solar indicators)
- Buttons (Master, Start, Mode, Throttle, Emergency)
- Serial monitor connection

### Application Configuration

**File: `vite.config.js`**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
})
```

### Chart Configuration

**File: `src/App.jsx`**

```javascript
const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 0 },
  // ... more options
};
```

Customize:
- Update rates (default: 1000ms)
- History length (default: 60 points)
- Chart colors
- Axis ranges

---

## 📡 API Reference

### WebSocket Messages

#### From ESP32 → Interface

```json
{
  "type": "data",
  "data": {
    "mas": 1,              // Master switch (0/1)
    "ice": 1,              // ICE running (0/1)
    "mot": 1,              // Motor running (0/1)
    "mod": 1,              // Mode (0=ELE, 1=HYB, 2=CHG)
    "bat": 75.3,           // Battery % (0-100)
    "fue": 82.5,           // Fuel % (0-100)
    "thr": 65,             // Throttle % (0-100)
    "sol": 3.45,           // Solar power kW (0-5)
    "tst": 3250,           // Thrust N (0-5000)
    "flt_time": 1825.3,    // Flight time seconds
    "dist_km": 126.75,     // Distance km
    "range_km": 285.4,     // Range estimate km
    "elec_wh": 45230.5,    // Electric energy Wh
    "ice_wh": 28450.2,     // ICE energy Wh
    "solar_wh": 3250.8,    // Solar energy Wh
    "elec_pct": 61.4,      // Electric ratio %
    "co2_g": 75280.5,      // CO₂ emitted g
    "nox_g": 355.2,        // NOx emitted g
    "co_g": 236.1,         // CO emitted g
    "hc_g": 59.7,          // HC emitted g
    "fuel_l": 28.5,        // Fuel consumed L
    "co2_saved_g": 42150.8,    // CO₂ saved g
    "nox_saved_g": 198.5,      // NOx saved g
    "co_saved_g": 131.8,       // CO saved g
    "hc_saved_g": 33.4,        // HC saved g
    "fuel_saved_l": 15.96,     // Fuel saved L
    "conv_co2_g": 117431.3,    // Conventional CO₂ g
    "conv_fuel_l": 44.46,      // Conventional fuel L
    "co2_reduction_pct": 35.9, // CO₂ reduction %
    "fuel_reduction_pct": 35.9 // Fuel reduction %
  }
}
```

#### From Interface → ESP32

```javascript
// Plain text commands
"MASTER_ON"          // Turn on master power
"MASTER_OFF"         // Turn off master power
"ICE_START"          // Toggle ICE engine
"THROTTLE:65"        // Set throttle to 65%
"MODE:0"             // Set mode (0=ELE, 1=HYB, 2=CHG)
"EMERGENCY_ON"       // Activate emergency shutdown
"EMERGENCY_OFF"      // Deactivate emergency
```

### React Hooks

#### useWebSocketConnection

```javascript
import { useWebSocketConnection } from './hooks/useWebSocketConnection';

const {
  isConnected,      // boolean
  connectionError,  // string | null
  lastData,         // object | null
  connect,          // function
  disconnect,       // function
  sendCommand       // function(cmd: string)
} = useWebSocketConnection();
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "WebSocket connection failed"

**Symptoms:** HW Link button shows "Error"

**Solutions:**
```bash
# Check if Wokwi simulation is running
# Verify Serial Monitor shows "WiFi connected"
# Confirm WebSocket server started on port 8080
# Check browser console (F12) for errors
# Verify .env has correct VITE_WS_URL
```

#### 2. "No data appearing"

**Symptoms:** Charts are flat, metrics show 0

**Solutions:**
```bash
# Ensure HW Link shows "Connected" (green)
# Check Wokwi Serial Monitor for data output
# Verify Master Power is ON
# Open DevTools → Network → WS tab
# Look for WebSocket messages
```

#### 3. "Controls not responding"

**Symptoms:** Buttons don't work, throttle doesn't move

**Solutions:**
```bash
# Verify connection is active
# Ensure Master Power is ON
# Check if Emergency Kill was activated
# Verify battery > 2%
# Check browser console for errors
```

#### 4. "Build errors"

**Symptoms:** npm run build fails

**Solutions:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite

# Check Node.js version
node --version  # Should be 16+
```

#### 5. "Vercel deployment fails"

**Symptoms:** Build succeeds locally but fails on Vercel

**Solutions:**
```bash
# Check Vercel build logs
# Verify environment variables are set
# Ensure package.json has correct scripts
# Check Node.js version in Vercel settings
# Try deploying from CLI:
vercel --prod
```

### Debug Checklist

- [ ] Wokwi simulation is running
- [ ] WiFi connected message in Serial Monitor
- [ ] WebSocket server started on port 8080
- [ ] HW Link button shows "Connected"
- [ ] Master Power is ON
- [ ] Battery level > 2%
- [ ] Fuel level > 0%
- [ ] No browser console errors
- [ ] Correct WebSocket URL in .env
- [ ] Firewall allows port 8080

### Getting Help

1. **Check Documentation**: Click "Help" button in interface
2. **Review Logs**: Browser console (F12) and Wokwi Serial Monitor
3. **Test Connection**: Visit http://localhost:3001/status (if using bridge)
4. **Report Issues**: [GitHub Issues](https://github.com/daniel-marnet/skyblue-hybrid-engine/issues)

---

## 📁 Project Structure

```
skyblue-hybrid-engine/
├── src/
│   ├── components/
│   │   ├── HelpModal.jsx          # Help documentation component
│   │   └── HelpModal.css          # Help modal styles
│   ├── hooks/
│   │   └── useWebSocketConnection.js  # WebSocket hook
│   ├── utils/
│   │   └── analytics.js           # Google Analytics
│   ├── App.jsx                    # Main application
│   ├── App.css                    # Application styles
│   └── main.jsx                   # Entry point
├── public/                        # Static assets
├── api/
│   └── telemetry.js              # Vercel serverless function
├── hybrid_engine_websocket.ino   # ESP32 WebSocket code
├── hybrid_engine.ino             # ESP32 Serial code
├── diagram.json                  # Wokwi circuit diagram
├── diagram_websocket.json        # Wokwi WebSocket diagram
├── wokwi.toml                    # Wokwi configuration
├── bridge-server.js              # WebSocket bridge (optional)
├── package.json                  # Dependencies
├── vite.config.js                # Vite configuration
├── vercel.json                   # Vercel configuration
└── README.md                     # This file
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting
- Include screenshots for UI changes

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Daniel Marnet**

- Website: [daniel.marnettech.com.br](https://daniel.marnettech.com.br/)
- GitHub: [@daniel-marnet](https://github.com/daniel-marnet)
- Project: [SKYBLUE Hybrid Engine](https://github.com/daniel-marnet/skyblue-hybrid-engine)

---

## 🙏 Acknowledgments

- **Wokwi** - ESP32 simulation platform
- **Vercel** - Hosting and deployment
- **Chart.js** - Data visualization
- **Lucide** - Icon library
- **React** - UI framework

---

## 📊 Project Status

- **Version**: 1.0 (Environmental Analysis Edition)
- **Status**: ✅ Production Ready
- **Last Updated**: January 2026
- **Maintenance**: Active

---

## 🔮 Roadmap

- [ ] Multi-language support (PT-BR, ES, FR)
- [ ] Historical data export (CSV, JSON)
- [ ] Flight plan presets
- [ ] Advanced autopilot modes
- [ ] Mobile app (React Native)
- [ ] Hardware integration (real ESP32)
- [ ] Machine learning optimization
- [ ] VR/AR visualization

---

## 📞 Support

Need help? Here's how to get support:

1. **Documentation**: Click "Help" button in the interface
2. **Issues**: [GitHub Issues](https://github.com/daniel-marnet/skyblue-hybrid-engine/issues)
3. **Discussions**: [GitHub Discussions](https://github.com/daniel-marnet/skyblue-hybrid-engine/discussions)

---

<div align="center">

**SKYBLUE v1.0 - Hybrid Aero Engine Control System**

*Making hybrid aerospace technology accessible to everyone*

⭐ Star this repo if you find it useful!

[🚀 Live Demo](https://skyblue-hybrid-engine.vercel.app) • [📖 Documentation](https://github.com/daniel-marnet/skyblue-hybrid-engine/wiki) • [🐛 Report Bug](https://github.com/daniel-marnet/skyblue-hybrid-engine/issues)

</div>

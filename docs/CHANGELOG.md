# Changelog

All notable changes to SKYBLUE Hybrid Aero Engine project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-01-08

### 🎉 Initial Production Release - Cloud Connected Edition

### Added

#### Cloud Architecture
- **Relay Server** (`/api/websocket-relay.js`)
  - Vercel Edge Function acting as intermediary
  - SSE (Server-Sent Events) for real-time data streaming to interface
  - HTTP POST endpoint for Wokwi to send telemetry
  - HTTP GET/POST endpoints for bidirectional command routing
  - Status endpoint for monitoring connection health
  - Support for multiple simultaneous web clients

#### ESP32 Code
- **Complete Arduino Implementation** (`skyblue-hybrid-engine.ino`)
  - Full physics engine with 32 telemetry parameters
  - Battery discharge simulation (50 kWh capacity)
  - Fuel consumption calculation (100L tank)
  - Solar power generation (variable 0-5 kW)
  - Emissions tracking (CO₂, NOx, CO, HC)
  - Comparative analysis (hybrid vs conventional)
  - HTTP client for relay server communication
  - Command processing (Master, ICE, Throttle, Mode, Emergency)
  - ArduinoJson integration for data serialization
  - Polling mechanism (200ms commands, 500ms telemetry)

#### Web Interface
- **Cloud Connection Hook** (`useWebSocketConnection.js`)
  - SSE-based real-time data reception
  - Automatic reconnection handling
  - Wokwi status monitoring
  - Command transmission via fetch API

- **Updated UI Components**
  - Single "Connect Wokwi" button with cloud icon
  - Three connection states (Disconnected, Connected, Error)
  - Clear status messages and tooltips
  - English alert messages for better accessibility

#### Documentation
- **Setup Guide** (`WOKWI_RELAY_SETUP.md`)
  - Complete step-by-step configuration
  - Troubleshooting section
  - API endpoint documentation
  - Configuration checklist

- **Environment Template** (`.env.example`)
  - VITE_RELAY_URL configuration
  - Google Analytics optional setup

- **Updated Help System** (`HelpModal.jsx`)
  - Cloud Connected architecture explanation
  - Visual ASCII diagram
  - Connection instructions
  - Status indicator descriptions

### Changed

#### Architecture
- **Migrated from WebSocket direct to Relay Server pattern**
  - **Before:** Interface attempted direct WebSocket to Wokwi (impossible with online Wokwi)
  - **After:** Interface ↔ Relay Server (Vercel) ↔ Wokwi (HTTP polling)

- **Removed Redis Cloud Sync**
  - Eliminated redundant "Cloud" button
  - Consolidated to single connection method
  - Simplified user experience

#### UI/UX
- **Button Updates**
  - Replaced `Wifi`/`WifiOff` icons with `Cloud`/`CloudOff`
  - Text: "HW Link" → "Connect Wokwi" / "Wokwi Connected"
  - Removed confusing dual-button system

- **Alert Messages**
  - Changed from Portuguese to English
  - Updated to reference "Connect Wokwi" button
  - More descriptive error messages

#### Code Quality
- **Removed Unused Imports**
  - Cleaned up `Wifi` and `WifiOff` icon imports
  - Removed `cloudSync` state variable
  - Disabled legacy cloud sync code

- **Updated Comments**
  - Header: "Cloud Connected Edition"
  - Architecture description in code comments
  - Inline documentation improvements

### Fixed
- **Wokwi Integration**
  - Fixed missing telemetry parameters (was sending only 5, now sends all 32)
  - Corrected data format to match interface expectations
  - Aligned variable names between .ino and interface

- **Connection Logic**
  - Removed impossible direct WebSocket connections
  - Implemented working relay server pattern
  - Fixed reconnection handling

### Documentation
- **README.md** - Complete rewrite
  - Cloud Connected architecture diagram
  - Updated quick start guide
  - Environment variable documentation
  - Deployment instructions

- **HelpModal.jsx** - Complete overhaul
  - Removed outdated WebSocket tunnel references
  - Added Cloud Connected workflow
  - Visual architecture diagram
  - Connection status explanations

### Technical Details

#### File Changes
```
Modified:
- src/App.jsx (removed cloudSync, updated button, alerts in English)
- src/hooks/useWebSocketConnection.js (WebSocket → SSE migration)
- src/components/HelpModal.jsx (Cloud Connected documentation)
- skyblue-hybrid-engine.ino (complete rewrite with all 32 params)
- README.md (architecture update)
- package.json (v1.0.0, metadata)

Added:
- api/websocket-relay.js (Vercel Edge Function)
- WOKWI_RELAY_SETUP.md (setup guide)
- .env.example (configuration template)
- CHANGELOG.md (this file)

Removed:
- bridge-server.js (no longer needed)
- package-bridge.json (Redis dependencies)
```

#### Data Flow
```
User clicks "Connect Wokwi"
  ↓
Interface connects to /api/websocket-relay/stream (SSE)
  ↓
User interacts with controls (throttle, master power, etc.)
  ↓
Interface sends command to /api/websocket-relay/command
  ↓
Wokwi polls /api/websocket-relay/command every 200ms
  ↓
Wokwi executes command, updates physics simulation
  ↓
Wokwi sends telemetry to /api/websocket-relay/wokwi every 500ms
  ↓
Relay broadcasts data to all connected interfaces via SSE
  ↓
Charts and metrics update in real-time!
```

#### Performance
- **Latency:** ~200-700ms (polling + network)
- **Update Rate:** 500ms (2 Hz telemetry)
- **Bandwidth:** ~2KB/update
- **Concurrent Users:** Unlimited (read-only)
- **Concurrent Controllers:** 1 recommended (command conflicts possible)

---

## [0.0.0] - 2026-01-07

### Initial Development
- Basic React interface
- Local simulation mode
- Chart.js integration
- Wokwi diagram creation
- Initial Arduino code (incomplete)

---

## Roadmap

### [1.1.0] - Planned
- [ ] Persistent state storage (database)
- [ ] Session recording/playback
- [ ] Multi-language support (PT-BR, ES)
- [ ] Mobile responsive improvements
- [ ] Historical data export (CSV/JSON)

### [1.2.0] - Future
- [ ] Multiple Wokwi instances support
- [ ] Collaborative sessions
- [ ] Advanced autopilot modes
- [ ] Flight plan presets

### [2.0.0] - Vision
- [ ] Real ESP32 hardware support
- [ ] Mobile app (React Native)
- [ ] VR/AR visualization
- [ ] Machine learning optimization

---

## Migration Guide

### From Demo Mode to Cloud Connected

If you were using the demo mode interface:

1. **Update Environment Variables**
   ```env
   # Add to .env
   VITE_RELAY_URL=https://your-project.vercel.app
   ```

2. **Deploy Relay Server**
   ```bash
   git pull origin main
   git push  # Vercel auto-deploys /api folder
   ```

3. **Configure Wokwi**
   - Update `RELAY_SERVER` URL in `skyblue-hybrid-engine.ino`
   - Install ArduinoJson library
   - Click Play ▶️

4. **Connect Interface**
   - Click "Connect Wokwi" button
   - Wait for "Wokwi Connected" status

---

## Support

- **Documentation:** [README.md](README.md)
- **Setup Guide:** [WOKWI_RELAY_SETUP.md](WOKWI_RELAY_SETUP.md)
- **Issues:** [GitHub Issues](https://github.com/daniel-marnet/skyblue-hybrid-engine/issues)

---

Made with ❤️ by [Daniel Marnet](https://daniel.marnettech.com.br/)

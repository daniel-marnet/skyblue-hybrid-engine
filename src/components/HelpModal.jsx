import React, { useState } from 'react';
import {
    X,
    Book,
    Zap,
    Settings,
    BarChart3,
    Leaf,
    Wifi,
    Play,
    AlertCircle,
    CheckCircle,
    Info,
    Lightbulb,
    Target,
    TrendingUp,
    Activity,
    Battery,
    Fuel,
    Sun,
    Wind,
    Gauge
} from 'lucide-react';
import './HelpModal.css';

const HelpModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!isOpen) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Book },
        { id: 'getting-started', label: 'Getting Started', icon: Play },
        { id: 'interface', label: 'Interface Guide', icon: Settings },
        { id: 'controls', label: 'Controls', icon: Zap },
        { id: 'metrics', label: 'Metrics & Data', icon: BarChart3 },
        { id: 'environmental', label: 'Environmental', icon: Leaf },
        { id: 'connection', label: 'Connection', icon: Wifi },
        { id: 'troubleshooting', label: 'Troubleshooting', icon: AlertCircle }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="help-content">
                        <h2><Book size={24} /> System Overview</h2>

                        <div className="help-section">
                            <h3>Welcome to SKYBLUE Hybrid Aero Engine</h3>
                            <p>
                                SKYBLUE is an advanced hybrid aircraft propulsion system simulator that combines
                                electric motors, internal combustion engines (ICE), and solar power generation to
                                create an efficient and environmentally friendly propulsion solution.
                            </p>
                        </div>

                        <div className="help-section">
                            <h3><Target size={20} /> Key Features</h3>
                            <ul className="feature-list">
                                <li><CheckCircle size={16} /> <strong>Hybrid Propulsion:</strong> Electric motor + ICE for optimal efficiency</li>
                                <li><CheckCircle size={16} /> <strong>Solar Integration:</strong> Real-time solar power generation</li>
                                <li><CheckCircle size={16} /> <strong>Environmental Tracking:</strong> CO₂, NOx, CO, HC emissions monitoring</li>
                                <li><CheckCircle size={16} /> <strong>Performance Metrics:</strong> Thrust, range, efficiency analysis</li>
                                <li><CheckCircle size={16} /> <strong>Real-time Visualization:</strong> Live charts and telemetry</li>
                                <li><CheckCircle size={16} /> <strong>Wokwi Integration:</strong> Connect to ESP32 simulation</li>
                            </ul>
                        </div>

                        <div className="help-section">
                            <h3><Info size={20} /> System Architecture</h3>
                            <div className="architecture-diagram">
                                <div className="arch-box">
                                    <Zap size={20} />
                                    <span>Electric Motor</span>
                                    <small>100 kW max</small>
                                </div>
                                <div className="arch-plus">+</div>
                                <div className="arch-box">
                                    <Activity size={20} />
                                    <span>ICE Engine</span>
                                    <small>75 kW max</small>
                                </div>
                                <div className="arch-plus">+</div>
                                <div className="arch-box">
                                    <Sun size={20} />
                                    <span>Solar Panels</span>
                                    <small>5 kW max</small>
                                </div>
                            </div>
                        </div>

                        <div className="help-section">
                            <h3><TrendingUp size={20} /> Operating Modes</h3>
                            <div className="modes-grid">
                                <div className="mode-card">
                                    <h4>ELECTRIC Mode</h4>
                                    <p>Pure electric propulsion using battery power. Zero emissions, maximum efficiency for cruising.</p>
                                </div>
                                <div className="mode-card">
                                    <h4>HYBRID Mode</h4>
                                    <p>Combined electric + ICE power. ICE assists propulsion for maximum thrust and performance.</p>
                                </div>
                                <div className="mode-card">
                                    <h4>CHARGING Mode</h4>
                                    <p>ICE runs at optimal efficiency to recharge batteries while maintaining flight.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'getting-started':
                return (
                    <div className="help-content">
                        <h2><Play size={24} /> Getting Started</h2>

                        <div className="help-section">
                            <h3>Quick Start Guide</h3>
                            <div className="steps-container">
                                <div className="step">
                                    <div className="step-number">1</div>
                                    <div className="step-content">
                                        <h4>Open Wokwi Simulation</h4>
                                        <p>Visit <a href="https://wokwi.com/projects/452473775385515009" target="_blank" rel="noreferrer">Wokwi Project</a> and click Play ▶️</p>
                                        <div className="tip">
                                            <Lightbulb size={16} />
                                            <span>The simulation runs in your browser - no installation needed!</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">2</div>
                                    <div className="step-content">
                                        <h4>Power On the System</h4>
                                        <p>In the interface, click <strong>"MASTER POWER"</strong> to activate the hybrid engine.</p>
                                        <div className="warning">
                                            <AlertCircle size={16} />
                                            <span>All controls require Master Power to be ON</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">3</div>
                                    <div className="step-content">
                                        <h4>Control Throttle</h4>
                                        <p>Use the throttle slider to set engine power (0-100%). Watch thrust, speed, and altitude change in real-time!</p>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">4</div>
                                    <div className="step-content">
                                        <h4>Monitor & Analyze</h4>
                                        <p>Explore charts, environmental metrics, and energy breakdowns. Compare hybrid vs conventional emissions!</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="help-section">
                            <h3>Wokwi Simulation</h3>
                            <div className="code-block">
                                <h4>🎮 How It Works</h4>
                                <p>This project uses <strong>Wokwi</strong> - an online ESP32 simulator:</p>
                                <ol>
                                    <li>Open <a href="https://wokwi.com/projects/452473775385515009" target="_blank" rel="noreferrer">wokwi.com/projects/452473775385515009</a></li>
                                    <li>The simulation runs <code>skyblue-hybrid-engine.ino</code> code</li>
                                    <li>See visual LEDs and buttons in the circuit diagram</li>
                                    <li>Check Serial Monitor for real-time telemetry</li>
                                    <li>Control everything from this web interface! ✅</li>
                                </ol>
                                <div className="tip">
                                    <Lightbulb size={16} />
                                    <span><strong>Cloud Connected:</strong> Click "Connect Wokwi" button to link this interface with the online simulation via relay server!</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'interface':
                return (
                    <div className="help-content">
                        <h2><Settings size={24} /> Interface Guide</h2>

                        <div className="help-section">
                            <h3>Layout Overview</h3>
                            <div className="layout-diagram">
                                <div className="layout-section">
                                    <h4>📊 Left Column - Charts</h4>
                                    <ul>
                                        <li><strong>Thrust Force:</strong> Real-time thrust output (Newtons)</li>
                                        <li><strong>Energy Levels:</strong> Battery and fuel percentages</li>
                                        <li><strong>Power Generation:</strong> Solar, electric, and ICE power</li>
                                        <li><strong>Flight Dynamics:</strong> Speed and altitude</li>
                                    </ul>
                                </div>

                                <div className="layout-section">
                                    <h4>🎯 Center Column - Main Display</h4>
                                    <ul>
                                        <li><strong>Primary Flight Display:</strong> Animated thrust visualization</li>
                                        <li><strong>Energy Metrics:</strong> Battery, fuel, solar, range</li>
                                        <li><strong>Environmental Summary:</strong> CO₂ saved, fuel saved, electric ratio</li>
                                    </ul>
                                </div>

                                <div className="layout-section">
                                    <h4>🎮 Right Column - Controls</h4>
                                    <ul>
                                        <li><strong>Master Power:</strong> System on/off</li>
                                        <li><strong>ICE Control:</strong> Start/stop combustion engine</li>
                                        <li><strong>Mode Selection:</strong> Electric/Hybrid/Charging</li>
                                        <li><strong>Throttle:</strong> Power control (0-100%)</li>
                                        <li><strong>Emergency Kill:</strong> Immediate shutdown</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="help-section">
                            <h3>Header Information</h3>
                            <div className="header-info">
                                <div className="info-item">
                                    <Wind size={18} />
                                    <div>
                                        <strong>Speed (KT)</strong>
                                        <p>Current airspeed in knots</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <Gauge size={18} />
                                    <div>
                                        <strong>Altitude (FT)</strong>
                                        <p>Current altitude in feet</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <Activity size={18} />
                                    <div>
                                        <strong>Flight Time</strong>
                                        <p>Total flight duration in minutes</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'controls':
                return (
                    <div className="help-content">
                        <h2><Zap size={24} /> Controls Reference</h2>

                        <div className="help-section">
                            <h3>Primary Controls</h3>

                            <div className="control-item">
                                <div className="control-header">
                                    <Zap size={20} />
                                    <h4>MASTER POWER</h4>
                                </div>
                                <p><strong>Function:</strong> Activates/deactivates the entire system</p>
                                <p><strong>States:</strong> ON (green) / OFF (gray)</p>
                                <p><strong>Note:</strong> All other controls require Master Power to be ON</p>
                            </div>

                            <div className="control-item">
                                <div className="control-header">
                                    <Activity size={20} />
                                    <h4>ICE ENGINE</h4>
                                </div>
                                <p><strong>Function:</strong> Starts/stops the internal combustion engine</p>
                                <p><strong>States:</strong> RUNNING (orange) / STOPPED (gray)</p>
                                <p><strong>Note:</strong> Requires Master Power ON and fuel available</p>
                            </div>

                            <div className="control-item">
                                <div className="control-header">
                                    <Settings size={20} />
                                    <h4>MODE SELECTOR</h4>
                                </div>
                                <p><strong>Function:</strong> Cycles through operating modes</p>
                                <p><strong>Modes:</strong></p>
                                <ul>
                                    <li><strong>ELECTRIC:</strong> Battery-only propulsion (green)</li>
                                    <li><strong>HYBRID:</strong> Electric + ICE combined (blue)</li>
                                    <li><strong>CHARGING:</strong> ICE charges battery (purple)</li>
                                </ul>
                            </div>

                            <div className="control-item">
                                <div className="control-header">
                                    <Gauge size={20} />
                                    <h4>THROTTLE SLIDER</h4>
                                </div>
                                <p><strong>Function:</strong> Controls engine power output</p>
                                <p><strong>Range:</strong> 0% (idle) to 100% (maximum thrust)</p>
                                <p><strong>Effect:</strong> Directly affects thrust, speed, and energy consumption</p>
                            </div>

                            <div className="control-item emergency">
                                <div className="control-header">
                                    <AlertCircle size={20} />
                                    <h4>EMERGENCY KILL</h4>
                                </div>
                                <p><strong>Function:</strong> Immediate system shutdown</p>
                                <p><strong>Effect:</strong> Cuts all power, sets throttle to 0%, stops all engines</p>
                                <p className="warning-text">⚠️ Use only in emergency situations!</p>
                            </div>
                        </div>
                    </div>
                );

            case 'metrics':
                return (
                    <div className="help-content">
                        <h2><BarChart3 size={24} /> Metrics & Data</h2>

                        <div className="help-section">
                            <h3>Energy Metrics</h3>

                            <div className="metric-item">
                                <Battery size={20} />
                                <div>
                                    <h4>Battery State of Charge (SoC)</h4>
                                    <p><strong>Unit:</strong> Percentage (%)</p>
                                    <p><strong>Range:</strong> 0-100%</p>
                                    <p><strong>Description:</strong> Current battery charge level. Depletes during electric propulsion, recharges via solar or ICE in charging mode.</p>
                                </div>
                            </div>

                            <div className="metric-item">
                                <Fuel size={20} />
                                <div>
                                    <h4>Fuel Level</h4>
                                    <p><strong>Unit:</strong> Percentage (%)</p>
                                    <p><strong>Capacity:</strong> 100 liters</p>
                                    <p><strong>Description:</strong> Remaining fuel for ICE operation. Consumed when ICE is running.</p>
                                </div>
                            </div>

                            <div className="metric-item">
                                <Sun size={20} />
                                <div>
                                    <h4>Solar Power</h4>
                                    <p><strong>Unit:</strong> Kilowatts (kW)</p>
                                    <p><strong>Maximum:</strong> 5.0 kW</p>
                                    <p><strong>Description:</strong> Real-time solar power generation. Varies with sun angle simulation.</p>
                                </div>
                            </div>

                            <div className="metric-item">
                                <Zap size={20} />
                                <div>
                                    <h4>Thrust</h4>
                                    <p><strong>Unit:</strong> Newtons (N)</p>
                                    <p><strong>Maximum:</strong> 5000 N</p>
                                    <p><strong>Description:</strong> Total propulsive force generated by the system.</p>
                                </div>
                            </div>
                        </div>

                        <div className="help-section">
                            <h3>Performance Metrics</h3>

                            <div className="metrics-grid">
                                <div className="metric-card">
                                    <h4>Flight Time</h4>
                                    <p>Total duration of current flight session</p>
                                </div>
                                <div className="metric-card">
                                    <h4>Distance</h4>
                                    <p>Total distance traveled in kilometers</p>
                                </div>
                                <div className="metric-card">
                                    <h4>Range Estimate</h4>
                                    <p>Predicted remaining range based on current energy</p>
                                </div>
                                <div className="metric-card">
                                    <h4>Electric Ratio</h4>
                                    <p>Percentage of energy from electric vs ICE</p>
                                </div>
                            </div>
                        </div>

                        <div className="help-section">
                            <h3>Energy Breakdown</h3>
                            <p>The system tracks three energy sources:</p>
                            <ul>
                                <li><strong>Electric Energy (Wh):</strong> Total battery energy consumed</li>
                                <li><strong>ICE Energy (Wh):</strong> Total energy produced by combustion engine</li>
                                <li><strong>Solar Energy (Wh):</strong> Total energy harvested from solar panels</li>
                            </ul>
                        </div>
                    </div>
                );

            case 'environmental':
                return (
                    <div className="help-content">
                        <h2><Leaf size={24} /> Environmental Impact</h2>

                        <div className="help-section">
                            <h3>Emissions Tracking</h3>
                            <p>
                                SKYBLUE monitors and compares emissions between the hybrid system and a
                                conventional 100% ICE engine, demonstrating the environmental benefits of
                                hybrid propulsion.
                            </p>
                        </div>

                        <div className="help-section">
                            <h3>Tracked Pollutants</h3>

                            <div className="pollutant-item">
                                <h4>CO₂ (Carbon Dioxide)</h4>
                                <p><strong>Unit:</strong> Grams (g) or Kilograms (kg)</p>
                                <p><strong>Impact:</strong> Primary greenhouse gas contributing to climate change</p>
                                <p><strong>Emission Factor:</strong> 2640 g/kWh from aviation fuel</p>
                            </div>

                            <div className="pollutant-item">
                                <h4>NOx (Nitrogen Oxides)</h4>
                                <p><strong>Unit:</strong> Grams (g)</p>
                                <p><strong>Impact:</strong> Contributes to smog and acid rain</p>
                                <p><strong>Emission Factor:</strong> 12.5 g/kWh</p>
                            </div>

                            <div className="pollutant-item">
                                <h4>CO (Carbon Monoxide)</h4>
                                <p><strong>Unit:</strong> Grams (g)</p>
                                <p><strong>Impact:</strong> Toxic gas, air quality pollutant</p>
                                <p><strong>Emission Factor:</strong> 8.3 g/kWh</p>
                            </div>

                            <div className="pollutant-item">
                                <h4>HC (Hydrocarbons)</h4>
                                <p><strong>Unit:</strong> Grams (g)</p>
                                <p><strong>Impact:</strong> Unburned fuel, contributes to smog</p>
                                <p><strong>Emission Factor:</strong> 2.1 g/kWh</p>
                            </div>
                        </div>

                        <div className="help-section">
                            <h3>Comparison Metrics</h3>

                            <div className="comparison-box">
                                <h4>Emissions Avoided</h4>
                                <p>
                                    The system calculates what emissions <strong>would have been</strong> if using
                                    a conventional 100% ICE engine for the same flight, then subtracts actual
                                    hybrid emissions to show environmental savings.
                                </p>
                            </div>

                            <div className="comparison-box">
                                <h4>Reduction Percentage</h4>
                                <p>
                                    Shows the percentage reduction in CO₂ and fuel consumption compared to
                                    conventional propulsion. Higher percentages indicate better environmental performance.
                                </p>
                            </div>
                        </div>

                        <div className="help-section">
                            <h3>Optimization Tips</h3>
                            <ul className="tips-list">
                                <li>✅ Use <strong>ELECTRIC mode</strong> for cruising to minimize emissions</li>
                                <li>✅ Enable <strong>CHARGING mode</strong> when battery is low to maintain efficiency</li>
                                <li>✅ Monitor <strong>solar power</strong> and maximize flight during peak sun hours</li>
                                <li>✅ Avoid excessive throttle to reduce fuel consumption</li>
                                <li>✅ Check <strong>Electric Ratio</strong> - higher is better for environment</li>
                            </ul>
                        </div>
                    </div>
                );

            case 'connection':
                return (
                    <div className="help-content">
                        <h2><Wifi size={24} /> Connection & Architecture</h2>

                        <div className="help-section">
                            <h3>How SKYBLUE Works - Cloud Connected Architecture</h3>
                            <p>SKYBLUE v1.0 uses a relay server to connect the web interface with Wokwi simulation in real-time:</p>

                            <div className="code-block" style={{fontSize: '11px', lineHeight: '1.4'}}>
                                <pre style={{margin: 0}}>
┌────────────────────────────────────────┐
│  🌐 Web Interface (This Page)         │
│  Controls, Charts, Analytics           │
│          ↕ SSE Stream                  │
│  ⚡ Relay Server (Vercel)              │
│  /api/websocket-relay                  │
│          ↕ HTTP POST/GET               │
│  🎮 Wokwi ESP32 Simulation             │
│  Physics Engine + Hardware Viz         │
└────────────────────────────────────────┘
                                </pre>
                            </div>
                        </div>

                        <div className="help-section">
                            <div className="connection-method">
                                <h4>☁️ Cloud Connected Mode</h4>
                                <p><strong>Real-time synchronization between interface and Wokwi!</strong></p>

                                <h5>How to Connect:</h5>
                                <ol>
                                    <li>Open <a href="https://wokwi.com/projects/452473775385515009" target="_blank" rel="noreferrer">Wokwi Simulation</a> and click Play ▶️</li>
                                    <li>Wait for "WiFi connected" in Wokwi Serial Monitor</li>
                                    <li>Click <strong>"Connect Wokwi"</strong> button (cloud icon, top-right)</li>
                                    <li>Status changes to "Wokwi Connected" with green indicator</li>
                                    <li>Now you can control the Wokwi simulation from this interface!</li>
                                </ol>

                                <div className="tip">
                                    <Lightbulb size={16} />
                                    <span>All commands (throttle, master power, ICE, modes) are sent to Wokwi in real-time!</span>
                                </div>
                            </div>

                            <div className="connection-method">
                                <h4>🎮 What Happens in Wokwi</h4>
                                <p><strong>Location:</strong> <a href="https://wokwi.com/projects/452473775385515009" target="_blank" rel="noreferrer">wokwi.com/projects/452473775385515009</a></p>

                                <h5>Visual Feedback:</h5>
                                <ul>
                                    <li>🔴 LED indicators light up (Motor, ICE, Solar)</li>
                                    <li>📟 Serial Monitor shows live telemetry every 500ms</li>
                                    <li>⚡ ESP32 runs <code>skyblue-hybrid-engine.ino</code></li>
                                    <li>🔢 Full physics engine calculates 32 parameters</li>
                                    <li>📡 Data sent to relay server → your interface</li>
                                </ul>
                            </div>
                        </div>

                        <div className="help-section">
                            <h3>Connection Status</h3>
                            <div className="status-indicators">
                                <div className="status-item">
                                    <div className="status-badge connected">Wokwi Connected</div>
                                    <p><strong>Active:</strong> Interface receives real-time data from Wokwi. All controls work. Green cloud icon.</p>
                                </div>
                                <div className="status-item">
                                    <div className="status-badge disconnected">Connect Wokwi</div>
                                    <p><strong>Disconnected:</strong> Click to connect. Make sure Wokwi simulation is running first. Gray cloud icon.</p>
                                </div>
                                <div className="status-item">
                                    <div className="status-badge error">Connection Error</div>
                                    <p><strong>Error:</strong> Wokwi not responding. Check if simulation is running and connected to relay server.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'troubleshooting':
                return (
                    <div className="help-content">
                        <h2><AlertCircle size={24} /> Troubleshooting</h2>

                        <div className="help-section">
                            <h3>Common Issues & Solutions</h3>

                            <div className="troubleshoot-item">
                                <div className="issue">
                                    <AlertCircle size={18} />
                                    <h4>"WebSocket connection failed"</h4>
                                </div>
                                <div className="solutions">
                                    <h5>Solutions:</h5>
                                    <ul>
                                        <li>✅ Verify Wokwi simulation is running (green Play button)</li>
                                        <li>✅ Check Serial Monitor for "WiFi connected" message</li>
                                        <li>✅ Confirm WebSocket server started on port 8080</li>
                                        <li>✅ Check browser console (F12) for error details</li>
                                        <li>✅ Verify .env file has correct VITE_WS_URL</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="troubleshoot-item">
                                <div className="issue">
                                    <AlertCircle size={18} />
                                    <h4>"No data appearing in interface"</h4>
                                </div>
                                <div className="solutions">
                                    <h5>Solutions:</h5>
                                    <ul>
                                        <li>✅ Ensure "HW Link" button shows "Connected" (green)</li>
                                        <li>✅ Check Wokwi Serial Monitor for data output</li>
                                        <li>✅ Verify Master Power is ON in simulation</li>
                                        <li>✅ Open browser DevTools → Network → WS to see WebSocket messages</li>
                                        <li>✅ Restart both Wokwi simulation and interface</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="troubleshoot-item">
                                <div className="issue">
                                    <AlertCircle size={18} />
                                    <h4>"Controls not responding"</h4>
                                </div>
                                <div className="solutions">
                                    <h5>Solutions:</h5>
                                    <ul>
                                        <li>✅ Verify connection status is "Connected"</li>
                                        <li>✅ Ensure Master Power is ON</li>
                                        <li>✅ Check if Emergency Kill was activated</li>
                                        <li>✅ Verify battery level is above 2%</li>
                                        <li>✅ Check browser console for command send confirmations</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="troubleshoot-item">
                                <div className="issue">
                                    <AlertCircle size={18} />
                                    <h4>"Data seems frozen or not updating"</h4>
                                </div>
                                <div className="solutions">
                                    <h5>Solutions:</h5>
                                    <ul>
                                        <li>✅ Refresh the page (Ctrl+R / Cmd+R)</li>
                                        <li>✅ Ensure Master Power is ON</li>
                                        <li>✅ Check that throttle is above 0%</li>
                                        <li>✅ Clear browser cache if issues persist</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="troubleshoot-item">
                                <div className="issue">
                                    <AlertCircle size={18} />
                                    <h4>"Charts not updating"</h4>
                                </div>
                                <div className="solutions">
                                    <h5>Solutions:</h5>
                                    <ul>
                                        <li>✅ Verify data is being received (check console)</li>
                                        <li>✅ Refresh the page (Ctrl+R / Cmd+R)</li>
                                        <li>✅ Clear browser cache</li>
                                        <li>✅ Check if throttle is above 0%</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="help-section">
                            <h3>Debug Checklist</h3>
                            <div className="checklist">
                                <label>
                                    <input type="checkbox" />
                                    <span>Wokwi simulation is running</span>
                                </label>
                                <label>
                                    <input type="checkbox" />
                                    <span>WiFi connected message in Serial Monitor</span>
                                </label>
                                <label>
                                    <input type="checkbox" />
                                    <span>WebSocket server started on port 8080</span>
                                </label>
                                <label>
                                    <input type="checkbox" />
                                    <span>"HW Link" button shows "Connected"</span>
                                </label>
                                <label>
                                    <input type="checkbox" />
                                    <span>Master Power is ON</span>
                                </label>
                                <label>
                                    <input type="checkbox" />
                                    <span>Battery level above 2%</span>
                                </label>
                                <label>
                                    <input type="checkbox" />
                                    <span>Fuel level above 0%</span>
                                </label>
                                <label>
                                    <input type="checkbox" />
                                    <span>No browser console errors</span>
                                </label>
                            </div>
                        </div>

                        <div className="help-section">
                            <h3>Still Having Issues?</h3>
                            <div className="support-box">
                                <p>If problems persist after trying these solutions:</p>
                                <ul>
                                    <li>📖 Check the complete documentation in project README files</li>
                                    <li>🔍 Review browser console (F12) for detailed error messages</li>
                                    <li>🔄 Try restarting everything: Wokwi, interface, and browser</li>
                                    <li>💾 Ensure you're using the latest version of the code</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="help-modal-overlay" onClick={onClose}>
            <div className="help-modal" onClick={(e) => e.stopPropagation()}>
                <div className="help-modal-header">
                    <div className="help-modal-title">
                        <Book size={28} />
                        <div>
                            <h1>SKYBLUE Documentation</h1>
                            <p>Hybrid Aero Engine Control System v1.0</p>
                        </div>
                    </div>
                    <button className="help-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="help-modal-body">
                    <div className="help-sidebar">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    className={`help-tab ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <Icon size={18} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="help-main">
                        {renderContent()}
                    </div>
                </div>

                <div className="help-modal-footer">
                    <div className="help-footer-info">
                        <Info size={16} />
                        <span>SKYBLUE v1.0 Environmental Analysis Edition</span>
                    </div>
                    <div className="help-footer-credits">
                        <a href="https://daniel.marnettech.com.br/" target="_blank" rel="noreferrer" className="dev-credit">Developed by Daniel Marnet</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;

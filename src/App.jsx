import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Power,
    Activity,
    Battery,
    Fuel,
    Sun,
    AlertTriangle,
    RotateCcw,
    Skull,
    Wifi,
    WifiOff,
    Cloud,
    CloudOff,
    Zap,
    Leaf,
    TrendingDown,
    TrendingUp,
    MapPin,
    Clock,
    Gauge,
    Wind,
    Thermometer,
    BarChart3,
    LineChart as LineChartIcon,
    HelpCircle
} from 'lucide-react';
import { useWebSocketConnection } from './hooks/useWebSocketConnection';
import HelpModal from './components/HelpModal';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Filler,
    Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

// Constants
const MAX_SOLAR = 5.0;
const MAX_THRUST = 5000;
const TICK_RATE = 100;
const HISTORY_LENGTH = 60; // 60 points for history

// Chart options templates
const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            labels: { color: '#fff', font: { size: 10 } }
        }
    },
    scales: {
        y: {
            ticks: { color: '#8b949e', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.05)' }
        },
        x: {
            display: false
        }
    },
    animation: { duration: 0 },
    interaction: {
        intersect: false,
        mode: 'index'
    }
};

const App = () => {
    const [state, setState] = useState({
        masterPower: false,
        iceRunning: false,
        motorRunning: false,
        emergencyMode: false,
        mode: 0,
        batterySoC: 80.0,
        fuelLevel: 100.0,
        throttle: 0,
        solarPower: 0,
        thrust: 0,
        flightTime: 0,
        distanceKm: 0,
        rangeKm: 0,
        speed: 0,
        altitude: 0,
        electricWh: 0,
        iceWh: 0,
        solarWh: 0,
        electricPct: 0,
        co2_g: 0,
        nox_g: 0,
        co_g: 0,
        hc_g: 0,
        fuel_l: 0,
        co2_saved_g: 0,
        nox_saved_g: 0,
        co_saved_g: 0,
        hc_saved_g: 0,
        fuel_saved_l: 0,
        conv_co2_g: 0,
        conv_fuel_l: 0,
        co2_reduction_pct: 0,
        fuel_reduction_pct: 0,
        timestamp: 0
    });

    const [isConnected, setIsConnected] = useState(false);
    const [cloudSync, setCloudSync] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    // History data for charts
    const [history, setHistory] = useState({
        thrust: Array(HISTORY_LENGTH).fill(0),
        battery: Array(HISTORY_LENGTH).fill(80),
        fuel: Array(HISTORY_LENGTH).fill(100),
        solar: Array(HISTORY_LENGTH).fill(0),
        speed: Array(HISTORY_LENGTH).fill(0),
        altitude: Array(HISTORY_LENGTH).fill(0),
        co2Rate: Array(HISTORY_LENGTH).fill(0),
        electricPower: Array(HISTORY_LENGTH).fill(0),
        icePower: Array(HISTORY_LENGTH).fill(0),
        labels: Array(HISTORY_LENGTH).fill('')
    });

    // WebSocket connection hook
    const {
        isConnected: wsConnected,
        connectionError: wsError,
        lastData: wsData,
        connect: wsConnect,
        disconnect: wsDisconnect,
        sendCommand: wsSendCommand
    } = useWebSocketConnection();

    // Update connection status from WebSocket
    useEffect(() => {
        setIsConnected(wsConnected);
    }, [wsConnected]);

    // Update state from WebSocket data
    useEffect(() => {
        if (wsData) {
            setState(prev => ({
                ...prev,
                masterPower: !!wsData.mas,
                iceRunning: !!wsData.ice,
                motorRunning: !!wsData.mot,
                mode: wsData.mod || 0,
                batterySoC: wsData.bat || 0,
                fuelLevel: wsData.fue || 0,
                throttle: wsData.thr || 0,
                solarPower: (wsData.sol || 0) * 1000,
                thrust: wsData.tst || 0,
                flightTime: wsData.flt_time || 0,
                distanceKm: wsData.dist_km || 0,
                rangeKm: wsData.range_km || 0,
                electricWh: wsData.elec_wh || 0,
                iceWh: wsData.ice_wh || 0,
                solarWh: wsData.solar_wh || 0,
                electricPct: wsData.elec_pct || 0,
                co2_g: wsData.co2_g || 0,
                nox_g: wsData.nox_g || 0,
                co_g: wsData.co_g || 0,
                hc_g: wsData.hc_g || 0,
                fuel_l: wsData.fuel_l || 0,
                co2_saved_g: wsData.co2_saved_g || 0,
                nox_saved_g: wsData.nox_saved_g || 0,
                co_saved_g: wsData.co_saved_g || 0,
                hc_saved_g: wsData.hc_saved_g || 0,
                fuel_saved_l: wsData.fuel_saved_l || 0,
                conv_co2_g: wsData.conv_co2_g || 0,
                conv_fuel_l: wsData.conv_fuel_l || 0,
                co2_reduction_pct: wsData.co2_reduction_pct || 0,
                fuel_reduction_pct: wsData.fuel_reduction_pct || 0,
                timestamp: Date.now()
            }));
        }
    }, [wsData]);

    const sendCommand = useCallback((cmd) => {
        wsSendCommand(cmd);
    }, [wsSendCommand]);

    // Cloud Sync
    useEffect(() => {
        let cloudTimer;
        if (cloudSync && !isConnected) {
            cloudTimer = setInterval(async () => {
                try {
                    const res = await fetch('/api/telemetry');
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.timestamp) {
                            setState(prev => ({ ...prev, ...data }));
                        }
                    }
                } catch (e) { }
            }, 1000);
        }
        return () => clearInterval(cloudTimer);
    }, [cloudSync, isConnected]);

    // Update speed and altitude based on thrust (physics only, no fake data)
    useEffect(() => {
        const timer = setInterval(() => {
            setState(prev => {
                const newSpeed = (prev.speed * 0.995) + (prev.thrust / 2500);
                const newAlt = (newSpeed > 80) ? prev.altitude + (newSpeed - 80) / 10 : Math.max(0, prev.altitude - 1.5);

                // Only update speed and altitude, all other data comes from WebSocket or Cloud
                return { ...prev, speed: newSpeed, altitude: newAlt };
            });
        }, TICK_RATE);

        return () => clearInterval(timer);
    }, []);

    // Update history for charts
    useEffect(() => {
        const historyTimer = setInterval(() => {
            setHistory(prev => {
                const now = new Date();
                const timeLabel = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

                return {
                    thrust: [...prev.thrust.slice(1), state.thrust],
                    battery: [...prev.battery.slice(1), state.batterySoC],
                    fuel: [...prev.fuel.slice(1), state.fuelLevel],
                    solar: [...prev.solar.slice(1), state.solarPower / 1000],
                    speed: [...prev.speed.slice(1), state.speed],
                    altitude: [...prev.altitude.slice(1), state.altitude],
                    co2Rate: [...prev.co2Rate.slice(1), state.co2_g / Math.max(1, state.flightTime)],
                    electricPower: [...prev.electricPower.slice(1), state.electricWh / Math.max(1, state.flightTime / 3600)],
                    icePower: [...prev.icePower.slice(1), state.iceWh / Math.max(1, state.flightTime / 3600)],
                    labels: [...prev.labels.slice(1), timeLabel]
                };
            });
        }, 1000);

        return () => clearInterval(historyTimer);
    }, [state]);

    // Handlers - only work when connected
    const toggleMaster = () => {
        if (!isConnected && !cloudSync) {
            alert('⚠️ Conecte ao Wokwi primeiro! Clique em "HW Link" ou "Cloud"');
            return;
        }
        const next = !state.masterPower;
        setState(s => ({ ...s, masterPower: next }));
        if (isConnected) sendCommand(next ? "MASTER_ON" : "MASTER_OFF");
    };

    const toggleICE = () => {
        if (!isConnected && !cloudSync) {
            alert('⚠️ Conecte ao Wokwi primeiro! Clique em "HW Link" ou "Cloud"');
            return;
        }
        if (state.masterPower) {
            setState(s => ({ ...s, iceRunning: !s.iceRunning }));
            if (isConnected) sendCommand("ICE_START");
        }
    };

    const cycleMode = () => {
        if (!isConnected && !cloudSync) {
            alert('⚠️ Conecte ao Wokwi primeiro! Clique em "HW Link" ou "Cloud"');
            return;
        }
        const next = (state.mode + 1) % 3;
        setState(s => ({ ...s, mode: next }));
        if (isConnected) sendCommand(`MODE:${next}`);
    };

    const handleThrottleChange = (e) => {
        if (!isConnected && !cloudSync) return;
        const val = parseInt(e.target.value);
        if (state.masterPower && !state.emergencyMode) {
            setState(s => ({ ...s, throttle: val }));
            if (isConnected) sendCommand(`THROTTLE:${val}`);
        }
    };

    const handleEmergency = () => {
        if (!isConnected && !cloudSync) {
            alert('⚠️ Conecte ao Wokwi primeiro! Clique em "HW Link" ou "Cloud"');
            return;
        }
        setState(s => ({ ...s, emergencyMode: true, throttle: 0 }));
        if (isConnected) sendCommand("EMERGENCY_ON");
    };

    const getModeLabel = () => {
        const modes = ['ELECTRIC', 'HYBRID', 'CHARGING'];
        return modes[state.mode] || 'ELECTRIC';
    };

    // Chart data
    const thrustChartData = {
        labels: history.labels,
        datasets: [{
            label: 'Thrust (N)',
            data: history.thrust,
            borderColor: '#00f2ff',
            backgroundColor: 'rgba(0, 242, 255, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2
        }]
    };

    const energyChartData = {
        labels: history.labels,
        datasets: [
            {
                label: 'Battery (%)',
                data: history.battery,
                borderColor: '#39ff14',
                backgroundColor: 'rgba(57, 255, 20, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2,
                yAxisID: 'y'
            },
            {
                label: 'Fuel (%)',
                data: history.fuel,
                borderColor: '#ffcc00',
                backgroundColor: 'rgba(255, 204, 0, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2,
                yAxisID: 'y'
            }
        ]
    };

    const powerChartData = {
        labels: history.labels,
        datasets: [
            {
                label: 'Solar (kW)',
                data: history.solar,
                borderColor: '#fee140',
                backgroundColor: 'rgba(254, 225, 64, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2
            },
            {
                label: 'Electric (W)',
                data: history.electricPower,
                borderColor: '#00f2ff',
                backgroundColor: 'rgba(0, 242, 255, 0.1)',
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2
            },
            {
                label: 'ICE (W)',
                data: history.icePower,
                borderColor: '#ff6464',
                backgroundColor: 'rgba(255, 100, 100, 0.1)',
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2
            }
        ]
    };

    const flightChartData = {
        labels: history.labels,
        datasets: [
            {
                label: 'Speed (KT)',
                data: history.speed,
                borderColor: '#00f2ff',
                backgroundColor: 'rgba(0, 242, 255, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2,
                yAxisID: 'y'
            },
            {
                label: 'Altitude (FT)',
                data: history.altitude,
                borderColor: '#39ff14',
                backgroundColor: 'rgba(57, 255, 20, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2,
                yAxisID: 'y1'
            }
        ]
    };

    const emissionsChartData = {
        labels: ['CO₂ (kg)', 'NOx (g)', 'CO (g)', 'HC (g)', 'Fuel (L)'],
        datasets: [
            {
                label: 'Hybrid',
                backgroundColor: 'rgba(0, 242, 255, 0.7)',
                data: [
                    state.co2_g / 1000,
                    state.nox_g,
                    state.co_g,
                    state.hc_g,
                    state.fuel_l
                ]
            },
            {
                label: 'Conventional',
                backgroundColor: 'rgba(255, 100, 100, 0.7)',
                data: [
                    state.conv_co2_g / 1000,
                    state.conv_co2_g / 1000 * (12.5 / 2640),
                    state.conv_co2_g / 1000 * (8.3 / 2640),
                    state.conv_co2_g / 1000 * (2.1 / 2640),
                    state.conv_fuel_l
                ]
            }
        ]
    };

    const energyBreakdownData = {
        labels: ['Electric', 'ICE', 'Solar'],
        datasets: [{
            data: [
                state.electricWh,
                state.iceWh,
                state.solarWh
            ],
            backgroundColor: [
                'rgba(0, 242, 255, 0.8)',
                'rgba(255, 100, 100, 0.8)',
                'rgba(254, 225, 64, 0.8)'
            ],
            borderColor: [
                '#00f2ff',
                '#ff6464',
                '#fee140'
            ],
            borderWidth: 2
        }]
    };

    const multiAxisOptions = {
        ...lineChartOptions,
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                ticks: { color: '#8b949e', font: { size: 10 } },
                grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                ticks: { color: '#8b949e', font: { size: 10 } },
                grid: { drawOnChartArea: false }
            },
            x: { display: false }
        }
    };

    return (
        <div className="app-container-new">
            {/* HEADER */}
            <header className="header-bar">
                <div className="header-left">
                    <Zap size={28} className="logo-icon" />
                    <div>
                        <div className="system-title-new">SKYBLUE HYBRID ENGINE</div>
                        <div className="version-tag-new">v6.0 Environmental Analysis</div>
                    </div>
                </div>

                <div className="header-stats">
                    <div className="stat-pill">
                        <Wind size={16} />
                        <span>{state.speed.toFixed(0)} KT</span>
                    </div>
                    <div className="stat-pill">
                        <Gauge size={16} />
                        <span>{state.altitude.toFixed(0)} FT</span>
                    </div>
                    <div className="stat-pill">
                        <Clock size={16} />
                        <span>{(state.flightTime / 60).toFixed(1)} min</span>
                    </div>
                    <div className="stat-pill">
                        <MapPin size={16} />
                        <span>{state.distanceKm.toFixed(1)} km</span>
                    </div>
                    <div className="stat-pill">
                        <TrendingDown size={16} />
                        <span>{state.co2_reduction_pct.toFixed(1)}% CO₂↓</span>
                    </div>
                </div>

                <div className="header-actions">
                    <button
                        className="header-btn"
                        onClick={() => setShowHelp(true)}
                        title="Open Documentation & Help"
                    >
                        <HelpCircle size={18} />
                        <span>Help</span>
                    </button>

                    <button
                        className={`header-btn ${cloudSync ? 'active' : ''}`}
                        onClick={() => setCloudSync(!cloudSync)}
                        disabled={isConnected}
                    >
                        {cloudSync ? <Cloud size={18} /> : <CloudOff size={18} />}
                        <span>{cloudSync ? 'Cloud' : 'Cloud'}</span>
                    </button>

                    <button
                        className={`header-btn ${isConnected ? 'active' : ''}`}
                        onClick={isConnected ? wsDisconnect : wsConnect}
                        title={wsError ? `Error: ${wsError}` : isConnected ? 'Disconnect from Wokwi' : 'Connect to Wokwi Bridge'}
                    >
                        {isConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
                        <span>{isConnected ? 'Connected' : wsError ? 'Error' : 'HW Link'}</span>
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="main-content-new">
                {/* LEFT COLUMN - CHARTS */}
                <div className="charts-column">
                    <div className="chart-card">
                        <div className="chart-header">
                            <LineChartIcon size={16} />
                            <span>Thrust Force</span>
                        </div>
                        <div className="chart-body">
                            <Line data={thrustChartData} options={lineChartOptions} />
                        </div>
                    </div>

                    <div className="chart-card">
                        <div className="chart-header">
                            <Battery size={16} />
                            <span>Energy Levels</span>
                        </div>
                        <div className="chart-body">
                            <Line data={energyChartData} options={lineChartOptions} />
                        </div>
                    </div>

                    <div className="chart-card">
                        <div className="chart-header">
                            <Zap size={16} />
                            <span>Power Generation</span>
                        </div>
                        <div className="chart-body">
                            <Line data={powerChartData} options={lineChartOptions} />
                        </div>
                    </div>

                    <div className="chart-card">
                        <div className="chart-header">
                            <Wind size={16} />
                            <span>Flight Dynamics</span>
                        </div>
                        <div className="chart-body">
                            <Line data={flightChartData} options={multiAxisOptions} />
                        </div>
                    </div>
                </div>

                {/* CENTER COLUMN - MAIN DISPLAY */}
                <div className="center-column">
                    <div className="main-display">
                        <div className="display-header">PRIMARY FLIGHT DISPLAY</div>
                        <div className="pfd-viewport-new">
                            <div className="pfd-bg-new" style={{
                                transform: `rotate(${state.speed / 20}deg) translateY(${-(state.altitude / 100) % 50}px)`
                            }}></div>
                            <div className="pfd-overlay-grid-new"></div>
                            <div className="pfd-content-new">
                                <div className="thrust-display-new">
                                    <div className="thrust-label">THRUST</div>
                                    <div className="thrust-value">{state.thrust.toFixed(0)}</div>
                                    <div className="thrust-unit">NEWTONS</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="metrics-grid">
                        <div className="metric-card">
                            <div className="metric-icon"><Battery size={24} /></div>
                            <div className="metric-info">
                                <div className="metric-label">Battery</div>
                                <div className="metric-value">{state.batterySoC.toFixed(1)}%</div>
                            </div>
                            <div className="metric-bar">
                                <div className="metric-bar-fill" style={{
                                    width: `${state.batterySoC}%`,
                                    backgroundColor: '#39ff14'
                                }}></div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon"><Fuel size={24} /></div>
                            <div className="metric-info">
                                <div className="metric-label">Fuel</div>
                                <div className="metric-value">{state.fuelLevel.toFixed(1)}%</div>
                            </div>
                            <div className="metric-bar">
                                <div className="metric-bar-fill" style={{
                                    width: `${state.fuelLevel}%`,
                                    backgroundColor: '#ffcc00'
                                }}></div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon"><Sun size={24} /></div>
                            <div className="metric-info">
                                <div className="metric-label">Solar</div>
                                <div className="metric-value">{(state.solarPower / 1000).toFixed(2)} kW</div>
                            </div>
                            <div className="metric-bar">
                                <div className="metric-bar-fill" style={{
                                    width: `${(state.solarPower / 5000) * 100}%`,
                                    backgroundColor: '#fee140'
                                }}></div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon"><MapPin size={24} /></div>
                            <div className="metric-info">
                                <div className="metric-label">Range</div>
                                <div className="metric-value">{state.rangeKm.toFixed(0)} km</div>
                            </div>
                        </div>
                    </div>

                    <div className="environmental-summary">
                        <div className="env-summary-header">
                            <Leaf size={18} />
                            <span>Environmental Impact</span>
                        </div>
                        <div className="env-summary-grid">
                            <div className="env-summary-item">
                                <div className="env-summary-label">CO₂ Saved</div>
                                <div className="env-summary-value">{(state.co2_saved_g / 1000).toFixed(2)} kg</div>
                                <div className="env-summary-percent">-{state.co2_reduction_pct.toFixed(1)}%</div>
                            </div>
                            <div className="env-summary-item">
                                <div className="env-summary-label">Fuel Saved</div>
                                <div className="env-summary-value">{state.fuel_saved_l.toFixed(2)} L</div>
                                <div className="env-summary-percent">-{state.fuel_reduction_pct.toFixed(1)}%</div>
                            </div>
                            <div className="env-summary-item">
                                <div className="env-summary-label">Electric Ratio</div>
                                <div className="env-summary-value">{state.electricPct.toFixed(1)}%</div>
                                <div className="env-summary-percent">Clean Energy</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - CONTROLS & ANALYSIS */}
                <div className="right-column">
                    <div className="control-panel-new">
                        <div className="panel-header-new">
                            <Power size={16} />
                            <span>Engine Controls</span>
                        </div>

                        {/* PRIMARY POWER CONTROL */}
                        <div className="control-section">
                            <div className="control-section-label">Primary Power</div>
                            <button
                                className={`control-btn-enhanced master ${state.masterPower ? 'active' : ''}`}
                                onClick={toggleMaster}
                            >
                                <div className="control-icon-wrapper">
                                    <Power size={28} />
                                    {state.masterPower && <div className="icon-glow"></div>}
                                </div>
                                <div className="control-text">
                                    <div className="control-name">MASTER POWER</div>
                                    <div className="control-desc">
                                        {state.masterPower ? 'System Active' : 'System Offline'}
                                    </div>
                                </div>
                                <div className={`control-status ${state.masterPower ? 'on' : 'off'}`}>
                                    {state.masterPower ? 'ON' : 'OFF'}
                                </div>
                            </button>
                        </div>

                        {/* PROPULSION SYSTEMS */}
                        <div className="control-section">
                            <div className="control-section-label">
                                Propulsion Systems
                                {!state.masterPower && <span className="requires-tag">Requires Master Power</span>}
                            </div>

                            <button
                                className={`control-btn-enhanced ice ${state.iceRunning ? 'active' : ''}`}
                                onClick={toggleICE}
                                disabled={!state.masterPower}
                            >
                                <div className="control-icon-wrapper">
                                    <Activity size={24} />
                                    {state.iceRunning && <div className="icon-glow warning"></div>}
                                </div>
                                <div className="control-text">
                                    <div className="control-name">ICE ENGINE</div>
                                    <div className="control-desc">
                                        {state.iceRunning ? 'Combustion Active' : 'Internal Combustion Engine'}
                                    </div>
                                </div>
                                <div className={`control-status ${state.iceRunning ? 'on warning' : 'off'}`}>
                                    {state.iceRunning ? 'ON' : 'OFF'}
                                </div>
                            </button>

                            <button
                                className={`control-btn-enhanced mode ${state.masterPower ? 'active-mode-' + state.mode : ''}`}
                                onClick={cycleMode}
                                disabled={!state.masterPower}
                            >
                                <div className="control-icon-wrapper">
                                    <RotateCcw size={24} />
                                </div>
                                <div className="control-text">
                                    <div className="control-name">FLIGHT MODE</div>
                                    <div className="control-desc">
                                        {state.mode === 0 && 'Electric Only - Zero Emissions'}
                                        {state.mode === 1 && 'Hybrid - ICE Assists Propulsion'}
                                        {state.mode === 2 && 'Charging - ICE Recharges Battery'}
                                    </div>
                                </div>
                                <div className="control-mode-indicator">
                                    <div className={`mode-badge mode-${state.mode}`}>
                                        {getModeLabel()}
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* THROTTLE CONTROL */}
                        <div className="control-section">
                            <div className="control-section-label">
                                Thrust Control
                                {(!state.masterPower || state.emergencyMode) &&
                                    <span className="requires-tag">
                                        {state.emergencyMode ? 'Emergency Active' : 'Requires Master Power'}
                                    </span>
                                }
                            </div>
                            <div className="throttle-section-enhanced">
                                <div className="throttle-display">
                                    <div className="throttle-value-large">{state.throttle}</div>
                                    <div className="throttle-unit">%</div>
                                </div>
                                <div className="throttle-bar-container">
                                    <div
                                        className="throttle-bar-fill"
                                        style={{ width: `${state.throttle}%` }}
                                    >
                                        <div className="throttle-bar-glow"></div>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    className="throttle-slider-enhanced"
                                    min="0"
                                    max="100"
                                    value={state.throttle}
                                    onChange={handleThrottleChange}
                                    disabled={!state.masterPower || state.emergencyMode}
                                />
                                <div className="throttle-markers">
                                    <span>0</span>
                                    <span>25</span>
                                    <span>50</span>
                                    <span>75</span>
                                    <span>100</span>
                                </div>
                            </div>
                        </div>

                        {/* EMERGENCY KILL */}
                        <div className="control-section emergency-section">
                            <button
                                className={`control-btn-enhanced emergency ${state.emergencyMode ? 'active' : ''}`}
                                onClick={handleEmergency}
                            >
                                <div className="control-icon-wrapper">
                                    <AlertTriangle size={28} />
                                    {state.emergencyMode && <div className="icon-glow danger"></div>}
                                </div>
                                <div className="control-text">
                                    <div className="control-name">EMERGENCY KILL</div>
                                    <div className="control-desc">
                                        {state.emergencyMode ? '⚠️ ALL SYSTEMS SHUTDOWN' : 'Immediate System Shutdown'}
                                    </div>
                                </div>
                                <div className={`control-status ${state.emergencyMode ? 'on danger' : 'off'}`}>
                                    {state.emergencyMode ? 'ACTIVE' : 'STANDBY'}
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="chart-card">
                        <div className="chart-header">
                            <BarChart3 size={16} />
                            <span>Emissions Comparison</span>
                        </div>
                        <div className="chart-body">
                            <Bar data={emissionsChartData} options={{
                                ...lineChartOptions,
                                scales: {
                                    y: {
                                        ticks: { color: '#8b949e', font: { size: 10 } },
                                        grid: { color: 'rgba(255,255,255,0.05)' }
                                    },
                                    x: {
                                        display: true,
                                        ticks: { color: '#8b949e', font: { size: 9 } },
                                        grid: { display: false }
                                    }
                                }
                            }} />
                        </div>
                    </div>

                    <div className="chart-card">
                        <div className="chart-header">
                            <Zap size={16} />
                            <span>Energy Breakdown</span>
                        </div>
                        <div className="chart-body">
                            <Doughnut data={energyBreakdownData} options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: 'bottom',
                                        labels: { color: '#fff', font: { size: 10 } }
                                    }
                                }
                            }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="footer-bar">
                <div className="status-indicators">
                    <div className={`status-light ${state.motorRunning ? 'active green' : ''}`}>
                        <div className="status-dot"></div>
                        <span>MOTOR</span>
                    </div>
                    <div className={`status-light ${state.iceRunning ? 'active yellow' : ''}`}>
                        <div className="status-dot"></div>
                        <span>ICE</span>
                    </div>
                    <div className={`status-light ${cloudSync ? 'active blue' : ''}`}>
                        <div className="status-dot"></div>
                        <span>CLOUD</span>
                    </div>
                    <div className={`status-light ${isConnected ? 'active green' : ''}`}>
                        <div className="status-dot"></div>
                        <span>SERIAL</span>
                    </div>
                    <div className={`status-light ${state.emergencyMode ? 'active red' : ''}`}>
                        <div className="status-dot"></div>
                        <span>EMERGENCY</span>
                    </div>
                </div>

                <div className="footer-links-new">
                    <a href="https://wokwi.com/projects/452473775385515009" target="_blank" rel="noreferrer">WOKWI</a>
                    <span>•</span>
                    <a href="https://github.com/daniel-marnet/skyblue-hybrid-engine" target="_blank" rel="noreferrer">GITHUB</a>
                    <span>•</span>
                    <a href="https://daniel.marnettech.com.br/" target="_blank" rel="noreferrer" className="dev-credit">DANIEL MARNET</a>
                </div>
            </footer>

            {/* Help Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        </div>
    );
};

export default App;

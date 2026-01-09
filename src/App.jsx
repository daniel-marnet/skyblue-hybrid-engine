// SKYBLUE v1.0 - Cloud Connected Edition
// Architecture: Interface ↔ Relay Server (Vercel) ↔ Wokwi ESP32 Simulation
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
import { trackEngineControl, trackSystemStatus, trackInteraction, trackError } from './utils/analytics';
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
        if (wsConnected) {
            trackSystemStatus('connected', { device_type: 'Wokwi_ESP32' });
        } else {
            trackSystemStatus('disconnected', {});
        }
    }, [wsConnected]);

    // Track WebSocket errors
    useEffect(() => {
        if (wsError) {
            trackError('websocket_error', wsError, {
                connection_status: isConnected ? 'connected' : 'disconnected'
            });
        }
    }, [wsError, isConnected]);

    useEffect(() => {
        if (wsData) {
            // Check if we are currently interacting with the throttle to avoid "jumping"
            const isInteracting = Date.now() - (window.lastThrottleAt || 0) < 2000;

            setState(prev => ({
                ...prev,
                masterPower: wsData.mas !== undefined ? !!wsData.mas : prev.masterPower,
                iceRunning: wsData.ice !== undefined ? !!wsData.ice : prev.iceRunning,
                motorRunning: wsData.mot !== undefined ? !!wsData.mot : prev.motorRunning,
                emergencyMode: wsData.eme !== undefined ? !!wsData.eme : prev.emergencyMode,
                mode: wsData.mod !== undefined ? wsData.mod : prev.mode,
                batterySoC: wsData.bat !== undefined ? wsData.bat : prev.batterySoC,
                fuelLevel: wsData.fue !== undefined ? wsData.fue : prev.fuelLevel,
                throttle: (wsData.thr !== undefined && !isInteracting) ? wsData.thr : prev.throttle,
                solarPower: wsData.sol !== undefined ? wsData.sol * 1000 : prev.solarPower,
                thrust: wsData.tst !== undefined ? wsData.tst : prev.thrust,
                speed: wsData.spd !== undefined ? wsData.spd : prev.speed,
                altitude: wsData.alt !== undefined ? wsData.alt : prev.altitude,
                flightTime: wsData.flt_time !== undefined ? wsData.flt_time : prev.flightTime,
                distanceKm: wsData.dist_km !== undefined ? wsData.dist_km : prev.distanceKm,
                rangeKm: wsData.range_km !== undefined ? wsData.range_km : prev.rangeKm,
                electricWh: wsData.elec_wh !== undefined ? wsData.elec_wh : prev.electricWh,
                iceWh: wsData.ice_wh !== undefined ? wsData.ice_wh : prev.iceWh,
                solarWh: wsData.solar_wh !== undefined ? wsData.solar_wh : prev.solarWh,
                electricPct: wsData.elec_pct !== undefined ? wsData.elec_pct : prev.electricPct,
                co2_g: wsData.co2_g !== undefined ? wsData.co2_g : prev.co2_g,
                nox_g: wsData.nox_g !== undefined ? wsData.nox_g : prev.nox_g,
                co_g: wsData.co_g !== undefined ? wsData.co_g : prev.co_g,
                hc_g: wsData.hc_g !== undefined ? wsData.hc_g : prev.hc_g,
                fuel_l: wsData.fuel_l !== undefined ? wsData.fuel_l : prev.fuel_l,
                co2_saved_g: wsData.co2_saved_g !== undefined ? wsData.co2_saved_g : prev.co2_saved_g,
                co2_reduction_pct: wsData.co2_reduction_pct !== undefined ? wsData.co2_reduction_pct : prev.co2_reduction_pct,
                fuel_saved_l: wsData.fuel_saved_l !== undefined ? wsData.fuel_saved_l : prev.fuel_saved_l,
                fuel_reduction_pct: wsData.fuel_reduction_pct !== undefined ? wsData.fuel_reduction_pct : prev.fuel_reduction_pct,
                conv_co2_g: wsData.conv_co2_g !== undefined ? wsData.conv_co2_g : prev.conv_co2_g,
                conv_fuel_l: wsData.conv_fuel_l !== undefined ? wsData.conv_fuel_l : prev.conv_fuel_l,
                timestamp: Date.now()
            }));
        }
    }, [wsData]);

    const sendCommand = useCallback((type, value = null) => {
        wsSendCommand(type, value);
    }, [wsSendCommand]);

    // Removed Cloud Sync (Redis) - Now using Relay Server
    // Cloud Sync functionality removed in v1.0
    // This effect is disabled and kept only for reference

    // Local physics simulation when not connected to Wokwi
    useEffect(() => {
        const timer = setInterval(() => {
            setState(prev => {
                // Calculate speed and altitude
                const newSpeed = (prev.speed * 0.995) + (prev.thrust / 2500);
                const newAlt = (newSpeed > 80) ? prev.altitude + (newSpeed - 80) / 10 : Math.max(0, prev.altitude - 1.5);

                // If not connected to Wokwi, simulate local data
                if (!isConnected && prev.masterPower) {
                    const dt = TICK_RATE / 1000; // seconds

                    // Calculate thrust based on throttle
                    const targetThrust = (prev.throttle / 100) * MAX_THRUST;
                    const newThrust = prev.thrust + (targetThrust - prev.thrust) * 0.1;

                    // Battery discharge
                    const motorPower = newThrust / 5000 * 100; // kW
                    const batteryDrain = (motorPower / 50000) * (dt / 3600) * 100;
                    const newBattery = Math.max(0, prev.batterySoC - batteryDrain);

                    // Solar generation (varies)
                    const solarVariation = Math.sin(Date.now() / 5000) * 0.5 + 0.5;
                    const solarPower = MAX_SOLAR * solarVariation * 1000;

                    // Motor running if throttle > 0
                    const motorRunning = prev.throttle > 0;

                    // Energy accumulation
                    const newElectricWh = prev.electricWh + (motorPower * dt / 3600) + 0.01; // Small bias for visual
                    const newSolarWh = prev.solarWh + (solarPower / 1000 * dt / 3600) + 0.005;
                    const newIceWh = prev.iceWh + (prev.iceRunning ? 50 * dt / 3600 : 0.002);

                    return {
                        ...prev,
                        thrust: newThrust,
                        speed: newSpeed,
                        altitude: newAlt,
                        batterySoC: newBattery,
                        solarPower: solarPower,
                        motorRunning: motorRunning,
                        electricWh: newElectricWh,
                        solarWh: newSolarWh,
                        iceWh: newIceWh
                    };
                }

                // If connected, only update speed and altitude (data comes from Wokwi)
                return { ...prev, speed: newSpeed, altitude: newAlt };
            });
        }, TICK_RATE);

        return () => clearInterval(timer);
    }, [isConnected]);

    const lastHistoryUpdate = useRef(0);
    useEffect(() => {
        const now = Date.now();
        if (now - lastHistoryUpdate.current >= 1000) {
            lastHistoryUpdate.current = now;
            setHistory(prev => {
                const date = new Date();
                const timeLabel = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
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
        }
    }, [state]);

    // Handlers - only work when connected
    const toggleMaster = () => {
        if (!isConnected) {
            alert('⚠️ Connect to Wokwi first! Click the "Connect Wokwi" cloud button in the top-right corner.');
            trackInteraction('master_power_button', 'click_blocked', { reason: 'not_connected' });
            return;
        }
        const next = !state.masterPower;
        setState(s => ({ ...s, masterPower: next }));
        if (isConnected) sendCommand(next ? "MASTER_ON" : "MASTER_OFF");
        trackEngineControl(next ? 'master_power_on' : 'master_power_off', {
            battery_level: state.batterySoC,
            fuel_level: state.fuelLevel
        });
    };

    const toggleICE = () => {
        if (!isConnected) {
            alert('⚠️ Connect to Wokwi first! Click the "Connect Wokwi" cloud button in the top-right corner.');
            trackInteraction('ice_button', 'click_blocked', { reason: 'not_connected' });
            return;
        }
        if (state.masterPower) {
            const nextState = !state.iceRunning;
            setState(s => ({ ...s, iceRunning: nextState }));
            if (isConnected) sendCommand("ICE_START");
            trackEngineControl(nextState ? 'ice_start' : 'ice_stop', {
                mode: getModeLabel(),
                battery_level: state.batterySoC,
                fuel_level: state.fuelLevel
            });
        }
    };

    const cycleMode = () => {
        if (!isConnected) {
            alert('⚠️ Connect to Wokwi first! Click the "Connect Wokwi" cloud button in the top-right corner.');
            trackInteraction('mode_button', 'click_blocked', { reason: 'not_connected' });
            return;
        }
        const next = (state.mode + 1) % 3;
        const modes = ['ELECTRIC', 'HYBRID', 'CHARGING'];
        setState(s => ({ ...s, mode: next }));
        if (isConnected) sendCommand("MODE", next);
        trackEngineControl('mode_change', {
            old_mode: modes[state.mode],
            new_mode: modes[next],
            battery_level: state.batterySoC
        });
    };

    const handleThrottleChange = (e) => {
        if (!isConnected) return;
        const val = parseInt(e.target.value);
        window.lastThrottleAt = Date.now();
        if (state.masterPower && !state.emergencyMode) {
            setState(s => ({ ...s, throttle: val }));
            if (isConnected) sendCommand("THROTTLE", val);
            // Only track significant throttle changes (every 10%)
            if (Math.abs(val - state.throttle) >= 10) {
                trackEngineControl('throttle_change', {
                    old_value: state.throttle,
                    new_value: val,
                    mode: getModeLabel()
                });
            }
        }
    };

    const handleEmergency = () => {
        if (!isConnected) {
            alert('⚠️ Connect to Wokwi first! Click the "Connect Wokwi" cloud button in the top-right corner.');
            trackInteraction('emergency_button', 'click_blocked', { reason: 'not_connected' });
            return;
        }
        setState(s => ({ ...s, emergencyMode: true, throttle: 0 }));
        if (isConnected) sendCommand("EMERGENCY_ON");
        trackEngineControl('emergency_activated', {
            previous_throttle: state.throttle,
            mode: getModeLabel(),
            altitude: state.altitude,
            speed: state.speed
        });
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

    const hasEnergyData = (state.electricWh + state.iceWh + state.solarWh) > 0.01;

    const energyBreakdownData = {
        labels: ['Electric', 'ICE', 'Solar'],
        datasets: [{
            data: hasEnergyData
                ? [state.electricWh, state.iceWh, state.solarWh]
                : [1, 1, 1], // Placeholder for visibility
            backgroundColor: hasEnergyData
                ? [
                    'rgba(0, 242, 255, 0.8)',
                    'rgba(255, 100, 100, 0.8)',
                    'rgba(254, 225, 64, 0.8)'
                ]
                : [
                    'rgba(255, 255, 255, 0.05)',
                    'rgba(255, 255, 255, 0.05)',
                    'rgba(255, 255, 255, 0.05)'
                ],
            borderColor: hasEnergyData
                ? ['#00f2ff', '#ff6464', '#fee140']
                : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.1)'],
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
                    <img src="/skyblue.png" alt="SKYBLUE Logo" className="logo-image" />
                    <div>
                        <div className="system-title-new">SKYBLUE HYBRID ENGINE</div>
                        <div className="version-tag-new">v1.0 Environmental Analysis</div>
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
                    <a
                        href="https://wokwi.com/projects/452473775385515009"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wokwi-pulse-btn"
                    >
                        <Zap size={18} fill="currentColor" />
                        <span>Run Model</span>
                    </a>

                    <button
                        className="header-btn"
                        onClick={() => setShowHelp(true)}
                        title="Open Documentation & Help"
                    >
                        <HelpCircle size={18} />
                        <span>Help</span>
                    </button>

                    <button
                        className={`header-btn ${isConnected ? 'active' : ''}`}
                        onClick={isConnected ? wsDisconnect : wsConnect}
                        title={wsError ? `Error: ${wsError}` : isConnected ? 'Disconnect from Wokwi Relay' : 'Connect to Wokwi via Relay Server'}
                    >
                        {isConnected ? <Cloud size={18} /> : <CloudOff size={18} />}
                        <span>{isConnected ? 'Wokwi Connected' : wsError ? 'Connection Error' : 'Connect Wokwi'}</span>
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
                                <div className="metric-value">{(state.batterySoC || 0).toFixed(1)}%</div>
                            </div>
                            <div className="metric-bar">
                                <div className="metric-bar-fill" style={{
                                    width: `${state.batterySoC || 0}%`,
                                    backgroundColor: (state.batterySoC || 0) < 20 ? '#ff4d4d' : '#39ff14'
                                }}></div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon"><Fuel size={24} /></div>
                            <div className="metric-info">
                                <div className="metric-label">Fuel</div>
                                <div className="metric-value">{(state.fuelLevel || 0).toFixed(1)}%</div>
                            </div>
                            <div className="metric-bar">
                                <div className="metric-bar-fill" style={{
                                    width: `${state.fuelLevel || 0}%`,
                                    backgroundColor: (state.fuelLevel || 0) < 15 ? '#ff4d4d' : '#ffcc00'
                                }}></div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon"><Sun size={24} /></div>
                            <div className="metric-info">
                                <div className="metric-label">Solar</div>
                                <div className="metric-value">{(state.solarPower / 1000 || 0).toFixed(2)} kW</div>
                            </div>
                            <div className="metric-bar">
                                <div className="metric-bar-fill" style={{
                                    width: `${Math.min(100, (state.solarPower / 5000) * 100 || 0)}%`,
                                    backgroundColor: '#fee140'
                                }}></div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon"><MapPin size={24} /></div>
                            <div className="metric-info">
                                <div className="metric-label">Range</div>
                                <div className="metric-value">{(state.rangeKm || 0).toFixed(0)} km</div>
                            </div>
                            <div className="metric-bar">
                                <div className="metric-bar-fill" style={{
                                    width: '100%',
                                    opacity: 0.1,
                                    backgroundColor: '#fff'
                                }}></div>
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
                                    <div className="throttle-value-large">{Math.round(state.throttle || 0)}</div>
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
                <div className="footer-left">
                    <div className={`status-light ${isConnected ? 'active blue' : ''}`}>
                        <div className="status-dot"></div>
                        <span>CLOUD CONNECTION</span>
                    </div>
                </div>

                <div className="status-indicators">
                    <div className={`status-light ${state.motorRunning ? 'active green' : ''}`}>
                        <div className="status-dot"></div>
                        <span>MOTOR</span>
                    </div>
                    <div className={`status-light ${state.iceRunning ? 'active yellow' : ''}`}>
                        <div className="status-dot"></div>
                        <span>ICE</span>
                    </div>
                    <div className={`status-light ${state.emergencyMode ? 'active red' : ''}`}>
                        <div className="status-dot"></div>
                        <span>EMERGENCY</span>
                    </div>
                </div>

                <div className="footer-right">
                    <div className="footer-links-new">
                        <a href="https://wokwi.com/projects/452473775385515009" target="_blank" rel="noreferrer">WOKWI</a>
                        <span>•</span>
                        <a href="https://github.com/daniel-marnet/skyblue-hybrid-engine" target="_blank" rel="noreferrer">GITHUB</a>
                        <span>•</span>
                        <a href="https://daniel.marnettech.com.br/" target="_blank" rel="noreferrer" className="dev-credit">DANIEL MARNET</a>
                    </div>
                </div>
            </footer>

            {/* Help Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        </div>
    );
};

export default App;

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
    Zap
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

// Constants
const MAX_SOLAR = 5.0; // kW
const MAX_THRUST = 5000; // N
const TICK_RATE = 100; // ms

// --- Sub-components (Defined first to avoid hoisting issues) ---

const StatItem = ({ label, value }) => (
    <div className="stat-top-item">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
    </div>
);

const PanelSection = ({ title, children }) => (
    <div className="panel-section">
        <div className="panel-section-title">{title}</div>
        <div className="panel-content">{children}</div>
    </div>
);

const DataCard = ({ label, value, unit, color, percent }) => (
    <div className="data-card">
        <span className="stat-label">{label}</span>
        <div className="card-val">{value}<span className="card-unit">{unit}</span></div>
        <div className="meter-container">
            <div
                className="meter-fill"
                style={{
                    width: `${Math.min(100, Math.max(0, percent))}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}`
                }}
            ></div>
        </div>
    </div>
);

const AnnunciatorLight = ({ label, active, type }) => (
    <div className={`warning-light ${active ? `active ${type}` : ''}`}>
        {label}
    </div>
);

// --- Main Application ---

const App = () => {
    const [state, setState] = useState({
        masterPower: false,
        iceRunning: false,
        motorRunning: false,
        emergencyMode: false,
        mode: 'ELECTRIC',
        batterySoC: 80.0,
        fuelLevel: 100.0,
        throttle: 0,
        solarPower: 0,
        thrust: 0,
        speed: 0,
        altitude: 0,
        powerOutput: 0,
        timestamp: 0
    });

    const [isConnected, setIsConnected] = useState(false);
    const [cloudSync, setCloudSync] = useState(false);
    const serialWriter = useRef(null);

    const [chartData, setChartData] = useState({
        labels: Array(50).fill(''),
        datasets: [
            {
                label: 'Thrust Line',
                borderColor: '#00f2ff',
                backgroundColor: 'rgba(0, 242, 255, 0.1)',
                data: Array(50).fill(0),
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }
        ]
    });

    // --- Web Serial API ---
    const connectSerial = async () => {
        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });
            setIsConnected(true);
            setCloudSync(false);

            const textEncoder = new TextEncoderStream();
            textEncoder.readable.pipeTo(port.writable);
            serialWriter.current = textEncoder.writable.getWriter();

            const textDecoder = new TextDecoderStream();
            port.readable.pipeTo(textDecoder.writable);
            const reader = textDecoder.readable.getReader();

            const readLoop = async () => {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    if (value.includes('DATA:')) {
                        try {
                            const raw = value.split('DATA:')[1].split('\n')[0];
                            const data = JSON.parse(raw);
                            setState(prev => ({
                                ...prev,
                                masterPower: !!data.mas,
                                iceRunning: !!data.ice,
                                motorRunning: !!data.mot,
                                batterySoC: data.bat,
                                fuelLevel: data.fue,
                                throttle: data.thr,
                                solarPower: data.sol * 1000,
                                thrust: data.tst,
                                timestamp: Date.now()
                            }));
                        } catch (e) { }
                    }
                }
                setIsConnected(false);
            };
            readLoop();
        } catch (err) {
            console.error('Serial Error:', err);
        }
    };

    const sendCommand = useCallback(async (cmd) => {
        if (serialWriter.current) {
            try {
                await serialWriter.current.write(cmd + '\n');
            } catch (e) {
                console.error('Write error:', e);
            }
        }
    }, []);

    // --- Cloud Sync (Redis) ---
    useEffect(() => {
        let cloudTimer;
        if (cloudSync && !isConnected) {
            cloudTimer = setInterval(async () => {
                try {
                    const res = await fetch('/api/telemetry');
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.timestamp) {
                            setState(prev => ({ ...prev, ...data, speed: prev.speed, altitude: prev.altitude }));
                        }
                    }
                } catch (e) { }
            }, 1000);
        }
        return () => clearInterval(cloudTimer);
    }, [cloudSync, isConnected]);

    // --- Hybrid Engine Physics Simulation ---
    useEffect(() => {
        const timer = setInterval(() => {
            setState(prev => {
                // Shared Physics (Kinematics)
                const newSpeed = (prev.speed * 0.995) + (prev.thrust / 2500);
                const newAlt = (newSpeed > 80) ? prev.altitude + (newSpeed - 80) / 10 : Math.max(0, prev.altitude - 1.5);

                // If we have an external data source, just update kinematics
                if (isConnected || (cloudSync && prev.timestamp)) {
                    return { ...prev, speed: newSpeed, altitude: newAlt };
                }

                // Full Local Simulation Logic
                if (!prev.masterPower || prev.emergencyMode) {
                    return {
                        ...prev,
                        thrust: prev.thrust * 0.8,
                        speed: newSpeed,
                        altitude: newAlt,
                        motorRunning: false,
                        iceRunning: false,
                        powerOutput: 0
                    };
                }

                const now = Date.now();
                const solarPower = Math.abs(Math.sin(now / 15000)) * (MAX_SOLAR * 1000);
                let cons = (prev.throttle / 100) * 0.05;

                if (prev.iceRunning) {
                    if (prev.mode === 'CHARGING') cons = -0.08;
                    else if (prev.mode === 'HYBRID') cons *= 0.6;
                }

                const batterySoC = Math.min(100, Math.max(0, prev.batterySoC - cons));
                const thrust = (prev.throttle / 100) * MAX_THRUST;

                return {
                    ...prev,
                    solarPower,
                    batterySoC,
                    thrust,
                    speed: newSpeed,
                    altitude: newAlt,
                    powerOutput: (prev.throttle / 100) * 125,
                    motorRunning: prev.throttle > 5 && batterySoC > 1
                };
            });
        }, TICK_RATE);

        return () => clearInterval(timer);
    }, [isConnected, cloudSync]);

    // --- UI Update Loops (Chart & Time) ---
    useEffect(() => {
        const chartTimer = setInterval(() => {
            setChartData(prev => ({
                ...prev,
                datasets: [{
                    ...prev.datasets[0],
                    data: [...prev.datasets[0].data.slice(1), state.thrust / 50]
                }]
            }));
        }, 500);
        return () => clearInterval(chartTimer);
    }, [state.thrust]);

    // --- Handlers ---
    const toggleMaster = () => {
        const next = !state.masterPower;
        setState(s => ({ ...s, masterPower: next }));
        if (isConnected) sendCommand(next ? "MASTER_ON" : "MASTER_OFF");
    };

    const handleThrottleChange = (e) => {
        const val = parseInt(e.target.value);
        if (state.masterPower && !state.emergencyMode) {
            setState(s => ({ ...s, throttle: val }));
            if (isConnected) sendCommand(`THROTTLE:${val}`);
        }
    };

    return (
        <div className="app-container">
            {/* HEADER HUD */}
            <header className="hud-header">
                <div className="system-title">
                    <Zap size={24} style={{ marginRight: '10px' }} />
                    SKYBLUE <span className="version-tag">HIL v5.5</span>
                </div>

                <div className="hud-gauges">
                    <StatItem label="Airspeed" value={`${state.speed.toFixed(0)} KT`} />
                    <StatItem label="Altitude" value={`${state.altitude.toFixed(0)} FT`} />
                    <StatItem label="Source" value={isConnected ? "HARDWARE" : (cloudSync ? "CLOUD" : "SIM")} />
                </div>

                <div className="hud-actions">
                    <button
                        className={`hud-btn ${cloudSync ? 'active' : ''}`}
                        onClick={() => setCloudSync(!cloudSync)}
                    >
                        {cloudSync ? <Cloud size={16} /> : <CloudOff size={16} />}
                        {cloudSync ? 'Cloud Sync' : 'Go Cloud'}
                    </button>

                    <button
                        className={`hud-btn ${isConnected ? 'active' : 'warning'}`}
                        onClick={isConnected ? () => setIsConnected(false) : connectSerial}
                    >
                        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                        {isConnected ? 'Connected' : 'HW Link'}
                    </button>
                </div>
            </header>

            {/* LEFT: POWER SPECS */}
            <aside className="side-panel">
                <PanelSection title="Energy Storage">
                    <DataCard label="Battery SoC" value={state.batterySoC.toFixed(1)} unit="%" color="var(--success)" percent={state.batterySoC} />
                    <DataCard label="Fuel Level" value={state.fuelLevel.toFixed(1)} unit="%" color="var(--warning)" percent={state.fuelLevel} />
                </PanelSection>

                <PanelSection title="Power Generation">
                    <DataCard label="Solar Array" value={(state.solarPower / 1000).toFixed(2)} unit="kW" color="#fee140" percent={(state.solarPower / 5000) * 100} />
                    <div className="data-card">
                        <span className="stat-label">Bus Power</span>
                        <div className="card-val">{state.powerOutput.toFixed(1)}<span className="card-unit">kW</span></div>
                    </div>
                </PanelSection>
            </aside>

            {/* CENTER: PFD & HUD */}
            <main className="center-display">
                <div className="pfd-viewport">
                    <div className="pfd-bg" style={{
                        transform: `rotate(${state.speed / 20}deg) translateY(${-(state.altitude / 100) % 50}px)`
                    }}></div>
                    <div className="pfd-overlay-grid"></div>

                    <div className="pfd-content">
                        <div className="thrust-viz">
                            <span className="label">THRUST FORCE</span>
                            <div className="huge-val">{state.thrust.toFixed(0)}</div>
                            <span className="unit">NEWTONS</span>
                        </div>
                    </div>
                </div>

                <div className="telemetry-chart">
                    <div className="panel-section-title">Mission Telemetry Feedback</div>
                    <div className="chart-wrapper">
                        <Line data={chartData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: { y: { display: false, min: 0, max: 100 }, x: { display: false } },
                            animation: { duration: 0 }
                        }} />
                    </div>
                </div>
            </main>

            {/* RIGHT: COMMAND & CONTROL */}
            <aside className="side-panel">
                <PanelSection title="Command Panel">
                    <div className="control-grid">
                        <button className={`cmd-btn ${state.masterPower ? 'on' : ''}`} onClick={toggleMaster}>
                            <Power size={20} /> MASTER
                        </button>

                        <button
                            className={`cmd-btn ${state.iceRunning ? 'on' : ''}`}
                            onClick={() => {
                                if (state.masterPower) {
                                    setState(s => ({ ...s, iceRunning: !s.iceRunning }));
                                    if (isConnected) sendCommand("ICE_START");
                                }
                            }}
                        >
                            <Activity size={20} /> ICE IGNITION
                        </button>

                        <button className="cmd-btn" onClick={() => {
                            const modes = ['ELECTRIC', 'HYBRID', 'CHARGING'];
                            const next = modes[(modes.indexOf(state.mode) + 1) % modes.length];
                            setState(s => ({ ...s, mode: next }));
                            if (isConnected) sendCommand(`MODE:${modes.indexOf(next)}`);
                        }}>
                            <RotateCcw size={20} /> {state.mode}
                        </button>

                        <button className={`cmd-btn danger ${state.emergencyMode ? 'on' : ''}`} onClick={() => {
                            setState(s => ({ ...s, emergencyMode: true, throttle: 0 }));
                            if (isConnected) sendCommand("EMERGENCY_ON");
                        }}>
                            <Skull size={20} /> ABORT / KILL
                        </button>
                    </div>
                </PanelSection>

                <PanelSection title="Thrust Control">
                    <div className="throttle-container">
                        <div className="throttle-val">{state.throttle}%</div>
                        <input
                            type="range"
                            className="vertical-throttle"
                            min="0" max="100"
                            value={state.throttle}
                            onChange={handleThrottleChange}
                        />
                        <span className="stat-label">Power Lever</span>
                    </div>
                </PanelSection>
            </aside>

            {/* FOOTER: STATS & LINKS */}
            <footer className="cockpit-footer">
                <div className="annunciators">
                    <AnnunciatorLight label="Motor" active={state.motorRunning} type="safe" />
                    <AnnunciatorLight label="ICE" active={state.iceRunning} type="caution" />
                    <AnnunciatorLight label="Cloud" active={cloudSync} type="safe" />
                    <AnnunciatorLight label="HIL" active={isConnected} type="safe" />
                </div>

                <div className="footer-links">
                    <a href="https://wokwi.com/projects/452473775385515009" target="_blank" rel="noreferrer">WOKWI SIM</a>
                    <a href="https://github.com/daniel-marnet/skyblue-hybrid-engine" target="_blank" rel="noreferrer">SOURCE CODE</a>
                    <span className="divider">/</span>
                    <a href="https://daniel.marnettech.com.br/" target="_blank" rel="noreferrer" className="dev-tag">DEVELOPED BY DANIEL MARNET</a>
                </div>
            </footer>
        </div>
    );
};

export default App;

import React, { useState, useEffect, useRef } from 'react';
import {
    Power,
    Activity,
    Battery,
    Fuel,
    Sun,
    AlertTriangle,
    RotateCcw,
    Skull,
    ArrowUp,
    ArrowDown,
    Gauge,
    Wifi,
    WifiOff,
    Cloud,
    CloudOff
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

const MAX_SOLAR = 5.0;
const MAX_THRUST = 5000;
const TICK_RATE = 100;

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
        powerOutput: 0
    });

    const [isConnected, setIsConnected] = useState(false);
    const [cloudSync, setCloudSync] = useState(false);
    const serialPort = useRef(null);
    const serialReader = useRef(null);
    const serialWriter = useRef(null);

    const [chartData, setChartData] = useState({
        labels: Array(50).fill(''),
        datasets: [
            {
                label: 'Thrust',
                borderColor: '#00f2ff',
                backgroundColor: 'rgba(0, 242, 255, 0.1)',
                data: Array(50).fill(0),
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }
        ]
    });

    // --- Cloud Sync Implementation ---
    useEffect(() => {
        let cloudTimer;
        if (cloudSync && !isConnected) {
            cloudTimer = setInterval(async () => {
                try {
                    const res = await fetch('/api/telemetry');
                    if (!res.ok) return;
                    const data = await res.json();
                    if (data && data.timestamp) {
                        setState(prev => ({
                            ...prev,
                            ...data,
                            // Speed and Altitude are calculated locally for visual smoothness
                            speed: prev.speed,
                            altitude: prev.altitude
                        }));
                    }
                } catch (err) {
                    console.error('Cloud Sync Error:', err);
                }
            }, 1000);
        }
        return () => clearInterval(cloudTimer);
    }, [cloudSync, isConnected]);

    // --- Web Serial Hardware Integration ---
    const connectSerial = async () => {
        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });
            serialPort.current = port;
            setIsConnected(true);
            setCloudSync(false);

            const textEncoder = new TextEncoderStream();
            textEncoder.readable.pipeTo(port.writable);
            serialWriter.current = textEncoder.writable.getWriter();

            const textDecoder = new TextDecoderStream();
            port.readable.pipeTo(textDecoder.writable);
            serialReader.current = textDecoder.readable.getReader();

            readSerialData();
        } catch (err) {
            console.error('Serial Connection Failed:', err);
        }
    };

    const sendCommand = async (cmd) => {
        if (serialWriter.current) {
            await serialWriter.current.write(cmd + '\n');
        }
    };

    const readSerialData = async () => {
        while (true) {
            try {
                const { value, done } = await serialReader.current.read();
                if (done) break;
                if (value.startsWith('DATA:')) {
                    const jsonStr = value.substring(5);
                    const data = JSON.parse(jsonStr);
                    const newState = {
                        masterPower: data.mas,
                        iceRunning: data.ice,
                        motorRunning: data.mot,
                        batterySoC: data.bat,
                        fuelLevel: data.fue,
                        throttle: data.thr,
                        solarPower: data.sol * 1000,
                        thrust: data.tst
                    };

                    setState(prev => ({ ...prev, ...newState }));

                    // Push telemetry to Cloud (Redis) if connected to hardware
                    if (cloudSync) {
                        fetch('/api/telemetry', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...newState, timestamp: Date.now() })
                        }).catch(e => console.error('Redis Upload Failed:', e));
                    }
                }
            } catch (err) {
                console.error('Read error:', err);
                break;
            }
        }
        setIsConnected(false);
    };

    // --- Animation & Physics Engine ---
    useEffect(() => {
        const timer = setInterval(() => {
            setState(prev => {
                const speed = (prev.speed * 0.995) + (prev.thrust / 2500);
                const altitude = (speed > 80) ? prev.altitude + (speed - 80) / 10 : Math.max(0, prev.altitude - 1.5);

                // If connected to data source, only update physics
                if (isConnected || (cloudSync && state.timestamp)) {
                    return { ...prev, speed, altitude };
                }

                // Offline Simulation
                if (!prev.masterPower || prev.emergencyMode) {
                    return {
                        ...prev,
                        thrust: prev.thrust * 0.8,
                        speed: prev.speed * 0.98,
                        altitude: Math.max(0, prev.altitude - 1.5),
                        motorRunning: false,
                        iceRunning: false
                    };
                }

                const now = Date.now();
                const solarPower = Math.abs(Math.sin(now / 15000)) * (MAX_SOLAR * 1000);
                let cons = (prev.throttle / 100) * 0.05;
                if (prev.iceRunning && prev.mode === 'CHARGING') cons = -0.08;

                const batterySoC = Math.min(100, Math.max(0, prev.batterySoC - cons));
                const thrust = (prev.throttle / 100) * MAX_THRUST;

                return {
                    ...prev,
                    solarPower,
                    batterySoC,
                    thrust,
                    speed,
                    altitude,
                    powerOutput: (prev.throttle / 100) * 125
                };
            });
        }, TICK_RATE);

        return () => clearInterval(timer);
    }, [isConnected, cloudSync]);

    // Chart Update
    useEffect(() => {
        const chartTimer = setInterval(() => {
            setChartData(prev => ({
                ...prev,
                datasets: [{ ...prev.datasets[0], data: [...prev.datasets[0].data.slice(1), state.thrust / 50] }]
            }));
        }, 500);
        return () => clearInterval(chartTimer);
    }, [state.thrust]);

    const handleThrottle = (val) => {
        const t = parseInt(val);
        if (state.masterPower && !state.emergencyMode) {
            setState(s => ({ ...s, throttle: t }));
            if (isConnected) sendCommand(`THROTTLE:${t}`);
        }
    };

    return (
        <div className="app-container" style={{ display: 'grid', gridTemplateColumns: '350px 1fr 350px', gridTemplateRows: '80px 1fr 180px', gap: '15px', padding: '15px', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            {/* HUD HEADER */}
            <header className="hud-header">
                <div className="system-title">SKYBLUE <span style={{ fontSize: '0.6rem', color: cloudSync ? 'var(--accent-primary)' : '#555' }}>CLOUD-SYNC v5.0</span></div>
                <div className="hud-stats-top" style={{ display: 'flex', gap: '30px' }}>
                    <StatItem label="IAS (kt)" value={state.speed.toFixed(0)} />
                    <StatItem label="ALT (ft)" value={state.altitude.toFixed(0)} />
                    <StatItem label="Status" value={isConnected ? "HIL ONLINE" : (cloudSync ? "REMOTE LINK" : "LOCAL SIM")} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setCloudSync(!cloudSync)}
                        className={`warning-light active ${cloudSync ? 'safe' : ''}`}
                        style={{ cursor: 'pointer', background: 'none' }}
                    >
                        {cloudSync ? <Cloud size={14} /> : <CloudOff size={14} />} {cloudSync ? 'Cloud Sync' : 'Go Cloud'}
                    </button>
                    <button
                        onClick={isConnected ? () => setIsConnected(false) : connectSerial}
                        className={`warning-light active ${isConnected ? 'safe' : 'caution'}`}
                        style={{ cursor: 'pointer', background: 'none' }}
                    >
                        {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />} {isConnected ? 'Link Live' : 'Hardware'}
                    </button>
                </div>
            </header>

            {/* LEFT PANEL */}
            <aside className="side-panel">
                <PanelSection title="Energy Bank">
                    <DataCard label="Battery SoC" value={state.batterySoC.toFixed(1)} unit="%" color="var(--success)" percent={state.batterySoC} />
                    <DataCard label="Fuel Level" value={state.fuelLevel.toFixed(1)} unit="%" color="var(--warning)" percent={state.fuelLevel} />
                </PanelSection>
                <PanelSection title="Renewable">
                    <DataCard label="Solar Yield" value={(state.solarPower / 1000).toFixed(2)} unit="kW" color="#fee140" percent={(state.solarPower / (MAX_SOLAR * 1000)) * 100} />
                    <div className="data-card">
                        <span className="stat-label">Bus Power</span>
                        <div className="card-val">{(state.powerOutput || 0).toFixed(1)}<span className="card-unit">kW</span></div>
                    </div>
                </PanelSection>
            </aside>

            {/* CENTER */}
            <main style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '15px' }}>
                <div className="pfd-container">
                    <div className="pfd-overlay"></div>
                    <div id="horizon" style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(to bottom, #1a2a6c 0%, #1a2a6c 50%, #5c2000 50%, #5c2000 100%)',
                        opacity: 0.4,
                        transition: 'transform 0.1s linear',
                        transform: `rotate(${state.speed / 20}deg) translateY(${-(state.altitude / 100) % 50}px)`
                    }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 5 }}>
                        <span className="stat-label" style={{ letterSpacing: '5px' }}>Propulsion Force</span>
                        <div style={{ fontSize: '5rem', fontFamily: 'Orbitron', fontWeight: 700 }}>{state.thrust.toFixed(0)}</div>
                        <span className="stat-label">Newtons</span>
                    </div>
                </div>
                <div className="graph-container">
                    <div className="panel-section-title">Global Telemetry Feedback</div>
                    <div style={{ height: 'calc(100% - 30px)' }}>
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

            {/* RIGHT PANEL */}
            <aside className="side-panel">
                <PanelSection title="Command Panel">
                    <div className="btn-grid">
                        <button className={`cmd-btn ${state.masterPower ? 'active' : ''}`} onClick={() => {
                            const newVal = !state.masterPower;
                            setState(s => ({ ...s, masterPower: newVal }));
                            if (isConnected) sendCommand(newVal ? "MASTER_ON" : "MASTER_OFF");
                        }}>
                            <Power size={18} /> Master
                        </button>
                        <button className={`cmd-btn ${state.iceRunning ? 'active' : ''}`} onClick={() => {
                            if (state.masterPower && state.fuelLevel > 0) {
                                setState(s => ({ ...s, iceRunning: !s.iceRunning }));
                                if (isConnected) sendCommand("ICE_START");
                            }
                        }}>
                            <Activity size={18} /> ICE
                        </button>
                        <button className="cmd-btn" onClick={() => {
                            const modes = ['ELECTRIC', 'HYBRID', 'CHARGING'];
                            const nextMode = modes[(modes.indexOf(state.mode) + 1) % modes.length];
                            setState(s => ({ ...s, mode: nextMode }));
                            if (isConnected) sendCommand(`MODE:${modes.indexOf(nextMode)}`);
                        }}>
                            <RotateCcw size={18} /> {state.mode}
                        </button>
                        <button className={`cmd-btn emergency-btn ${state.emergencyMode ? 'active' : ''}`} onClick={() => {
                            setState(s => ({ ...s, emergencyMode: true, throttle: 0 }));
                            if (isConnected) sendCommand("EMERGENCY_ON");
                        }}>
                            <Skull size={18} /> KILL
                        </button>
                    </div>
                </PanelSection>
                <PanelSection title="Propulsion Lever">
                    <div className="throttle-slider-container">
                        <div style={{ fontSize: '2rem', fontFamily: 'Orbitron' }}>{state.throttle}%</div>
                        <input
                            type="range"
                            value={state.throttle}
                            onChange={(e) => handleThrottle(e.target.value)}
                        />
                    </div>
                </PanelSection>
            </aside>

            {/* FOOTER */}
            <footer className="annunciator">
                <div style={{ display: 'flex', gap: '10px' }}>
                    <AnnunciatorLight label="Motor" active={state.motorRunning} type="safe" />
                    <AnnunciatorLight label="ICE" active={state.iceRunning} type="caution" />
                    <AnnunciatorLight label="Cloud" active={cloudSync} type="safe" />
                    <AnnunciatorLight label="Link" active={isConnected} type="safe" />
                </div>

                <div style={{ display: 'flex', flexGrow: 1, justifyContent: 'center', gap: '25px', fontSize: '0.7rem', color: '#8b949e' }}>
                    <a href="https://wokwi.com/projects/452473775385515009" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Activity size={12} /> WOKWI SIMULATION
                    </a>
                    <a href="https://github.com/daniel-marnet/skyblue-hybrid-engine" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Wifi size={12} /> GITHUB REPO
                    </a>
                    <span style={{ opacity: 0.6 }}>|</span>
                    <a href="https://daniel.marnettech.com.br/" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>
                        DEVELOPED BY DANIEL MARNET
                    </a>
                </div>

                <div style={{ alignSelf: 'center', fontSize: '0.6rem', opacity: 0.3, letterSpacing: '2px' }}>
                    SKYBLUE v5.2 | MISSION CONTROL
                </div>
            </footer>
        </div>
    );
};

const StatItem = ({ label, value }) => (
    <div className="stat-top-item">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
    </div>
);

const PanelSection = ({ title, children }) => (
    <div className="panel-section">
        <div className="panel-section-title">{title}</div>
        {children}
    </div>
);

const DataCard = ({ label, value, unit, color, percent }) => (
    <div className="data-card" style={{ marginBottom: '10px' }}>
        <span className="stat-label">{label}</span>
        <div className="card-val">{value}<span className="card-unit">{unit}</span></div>
        <div className="meter-container">
            <div className="meter-fill" style={{ width: `${percent}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}></div>
        </div>
    </div>
);

const AnnunciatorLight = ({ label, active, type }) => (
    <div className={`warning-light ${active ? 'active' : ''} ${active ? type : ''}`}>
        {label}
    </div>
);

export default App;

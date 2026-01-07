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
    WifiOff
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

const MAX_SOLAR = 5.0; // kW
const MAX_THRUST = 5000; // N (Aligned with .ino)
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

    // --- Web Serial Hardware Integration ---
    const connectSerial = async () => {
        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });
            serialPort.current = port;
            setIsConnected(true);

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
                    // Update state from hardware telemetry
                    setState(prev => ({
                        ...prev,
                        masterPower: data.mas,
                        iceRunning: data.ice,
                        motorRunning: data.mot,
                        batterySoC: data.bat,
                        fuelLevel: data.fue,
                        throttle: data.thr,
                        solarPower: data.sol * 1000, // back to Watts
                        thrust: data.tst
                    }));
                }
            } catch (err) {
                console.error('Read error:', err);
                break;
            }
        }
        setIsConnected(false);
    };

    // --- Simulation Logic (Fall-back if not connected) ---
    useEffect(() => {
        const timer = setInterval(() => {
            if (isConnected) {
                // Only update Speed/Alt (Physics) based on hardware thrust
                setState(prev => {
                    const speed = (prev.speed * 0.99) + (prev.thrust / 2000);
                    const altitude = (speed > 80) ? prev.altitude + (speed - 80) / 5 : Math.max(0, prev.altitude - 2);
                    return { ...prev, speed, altitude };
                });
                return;
            }

            // Full simulation if offline
            setState(prev => {
                if (!prev.masterPower || prev.emergencyMode) {
                    return {
                        ...prev,
                        thrust: prev.thrust * 0.8,
                        speed: prev.speed * 0.98,
                        altitude: Math.max(0, prev.altitude - 1.5),
                        motorRunning: false,
                        iceRunning: false,
                        powerOutput: 0
                    };
                }

                const now = Date.now();
                const solarPower = Math.abs(Math.sin(now / 10000)) * (MAX_SOLAR * 1000);
                let consumptionRate = 0;
                let demand = (prev.throttle / 100) * 100;

                let motorRunning = prev.throttle > 5 && prev.batterySoC > 2;
                if (motorRunning) consumptionRate = demand * 0.05;

                let iceRunning = prev.iceRunning;
                let fuelLevel = prev.fuelLevel;
                if (iceRunning) {
                    if (prev.mode === 'HYBRID') {
                        consumptionRate -= (prev.throttle / 100) * 0.03;
                        fuelLevel -= (prev.throttle / 100) * 0.02;
                    } else if (prev.mode === 'CHARGING') {
                        consumptionRate -= 0.08;
                        fuelLevel -= 0.05;
                    }
                }

                consumptionRate -= (solarPower / (MAX_SOLAR * 1000)) * 0.02;
                if (fuelLevel <= 0) {
                    fuelLevel = 0;
                    iceRunning = false;
                }

                const batterySoC = Math.min(100, Math.max(0, prev.batterySoC - consumptionRate));
                if (batterySoC <= 0) motorRunning = false;

                const thrust = (motorRunning ? (prev.throttle / 100) * MAX_THRUST : 0) + (iceRunning && prev.mode === 'HYBRID' ? 800 : 0);
                const speed = (prev.speed * 0.99) + (thrust / 2000);
                const altitude = (speed > 80) ? prev.altitude + (speed - 80) / 5 : Math.max(0, prev.altitude - 2);

                return {
                    ...prev,
                    solarPower,
                    motorRunning,
                    iceRunning,
                    fuelLevel,
                    batterySoC,
                    thrust,
                    speed,
                    altitude,
                    powerOutput: (prev.throttle / 100) * 125
                };
            });
        }, TICK_RATE);

        return () => clearInterval(timer);
    }, [isConnected]);

    // Update Chart
    useEffect(() => {
        const chartTimer = setInterval(() => {
            setChartData(prev => {
                const newData = [...prev.datasets[0].data.slice(1), state.thrust / 50];
                return {
                    ...prev,
                    datasets: [{ ...prev.datasets[0], data: newData }]
                };
            });
        }, 500);
        return () => clearInterval(chartTimer);
    }, [state.thrust]);

    const toggleMaster = () => {
        const newVal = !state.masterPower;
        setState(s => ({ ...s, masterPower: newVal }));
        if (isConnected) sendCommand(newVal ? "MASTER_ON" : "MASTER_OFF");
    };

    const toggleIce = () => {
        if (state.masterPower && state.fuelLevel > 0 && !state.emergencyMode) {
            setState(s => ({ ...s, iceRunning: !s.iceRunning }));
            if (isConnected) sendCommand("ICE_START");
        }
    };

    const handleThrottle = (val) => {
        const t = parseInt(val);
        if (state.masterPower && !state.emergencyMode) {
            setState(s => ({ ...s, throttle: t }));
            if (isConnected) sendCommand(`THROTTLE:${t}`);
        }
    };

    return (
        <div className="app-container" style={{ display: 'grid', gridTemplateColumns: '350px 1fr 350px', gridTemplateRows: '80px 1fr 180px', gap: '15px', padding: '15px', height: '100vh' }}>
            {/* HUD HEADER */}
            <header className="hud-header">
                <div className="system-title">SKYBLUE HYBRID <span style={{ fontSize: '0.6rem' }}>v4.0-HIL</span></div>
                <div className="hud-stats-top" style={{ display: 'flex', gap: '40px' }}>
                    <StatItem label="Airspeed" value={`${state.speed.toFixed(0)} KT`} />
                    <StatItem label="Altitude" value={`${state.altitude.toFixed(0)} FT`} />
                    <StatItem label="Hardware Link" value={isConnected ? "ONLINE" : "OFFLINE"} />
                </div>
                <button
                    onClick={isConnected ? () => setIsConnected(false) : connectSerial}
                    className={`warning-light active ${isConnected ? 'safe' : 'caution'}`}
                    style={{ cursor: 'pointer', background: 'none' }}
                >
                    {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />} {isConnected ? 'Engine Connected' : 'Connect Engine'}
                </button>
            </header>

            {/* LEFT PANEL */}
            <aside className="side-panel">
                <PanelSection title="Energy Storage">
                    <DataCard label="Li-ion Battery SoC" value={state.batterySoC.toFixed(1)} unit="%" color="var(--success)" percent={state.batterySoC} />
                    <DataCard label="Fuel Reserves" value={state.fuelLevel.toFixed(1)} unit="%" color="var(--warning)" percent={state.fuelLevel} />
                </PanelSection>
                <PanelSection title="Generation">
                    <DataCard label="Solar Yield" value={(state.solarPower / 1000).toFixed(2)} unit="kW" color="#fee140" percent={(state.solarPower / (MAX_SOLAR * 1000)) * 100} />
                    <div className="data-card">
                        <span className="stat-label">System Output</span>
                        <div className="card-val">{state.powerOutput.toFixed(1)}<span className="card-unit">kW</span></div>
                    </div>
                </PanelSection>
            </aside>

            {/* CENTER */}
            <main style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '15px', minHeight: '0' }}>
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
                <div className="graph-container" style={{ minHeight: '0' }}>
                    <div className="panel-section-title">HIL Performance Monitor</div>
                    <Line data={chartData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { display: false, min: 0, max: 100 }, x: { display: false } },
                        animation: { duration: 0 }
                    }} />
                </div>
            </main>

            {/* RIGHT PANEL */}
            <aside className="side-panel">
                <PanelSection title="Command Console">
                    <div className="btn-grid">
                        <button className={`cmd-btn ${state.masterPower ? 'active' : ''}`} onClick={toggleMaster}>
                            <Power size={18} /> Master
                        </button>
                        <button className={`cmd-btn ${state.iceRunning ? 'active' : ''}`} onClick={toggleIce}>
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
                <AnnunciatorLight label="Motor" active={state.motorRunning} type="safe" />
                <AnnunciatorLight label="ICE" active={state.iceRunning} type="caution" />
                <AnnunciatorLight label="Solar" active={state.solarPower > 500} type="safe" />
                <AnnunciatorLight label="Stall" active={state.speed < 60 && state.altitude > 100} type="critical" />
                <AnnunciatorLight label="HIL" active={isConnected} type="safe" />
                <div style={{ flexGrow: 1 }}></div>
                <div style={{ alignSelf: 'center', fontSize: '0.6rem', opacity: 0.3 }}>SKYBLUE AEROSPACE | SECURE LINK</div>
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

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
    Gauge
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
const MAX_THRUST = 8500;
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

    const lastUpdate = useRef(Date.now());

    // Simulation Logic
    useEffect(() => {
        const timer = setInterval(() => {
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
                const solarPower = Math.abs(Math.sin(now / 10000)) * MAX_SOLAR;
                let consumptionRate = 0;
                let demand = (prev.throttle / 100) * 100;

                let motorRunning = prev.throttle > 5 && prev.batterySoC > 1;
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

                consumptionRate -= (solarPower / MAX_SOLAR) * 0.02;
                if (fuelLevel <= 0) {
                    fuelLevel = 0;
                    iceRunning = false;
                }

                const batterySoC = Math.min(100, Math.max(0, prev.batterySoC - consumptionRate));
                if (batterySoC <= 0) motorRunning = false;

                const thrust = (motorRunning ? (prev.throttle / 100) * MAX_THRUST : 0) + (iceRunning && prev.mode === 'HYBRID' ? 1000 : 0);
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
    }, []);

    // Update Chart
    useEffect(() => {
        const chartTimer = setInterval(() => {
            setChartData(prev => {
                const newData = [...prev.datasets[0].data.slice(1), state.thrust / 85];
                return {
                    ...prev,
                    datasets: [{ ...prev.datasets[0], data: newData }]
                };
            });
        }, 500);
        return () => clearInterval(chartTimer);
    }, [state.thrust]);

    const toggleMaster = () => {
        setState(s => ({
            ...s,
            masterPower: !s.masterPower,
            emergencyMode: s.masterPower ? s.emergencyMode : false,
            throttle: s.masterPower ? 0 : s.throttle
        }));
    };

    const toggleIce = () => {
        if (state.masterPower && state.fuelLevel > 0 && !state.emergencyMode) {
            setState(s => ({ ...s, iceRunning: !s.iceRunning }));
        }
    };

    return (
        <div className="app-container" style={{ display: 'grid', gridTemplateColumns: '350px 1fr 350px', gridTemplateRows: '80px 1fr 180px', gap: '15px', padding: '15px', height: '100vh' }}>
            {/* HUD HEADER */}
            <header className="hud-header">
                <div className="system-title">SKYBLUE HYBRID <span style={{ fontSize: '0.6rem' }}>v3.0-REACT</span></div>
                <div className="hud-stats-top" style={{ display: 'flex', gap: '40px' }}>
                    <StatItem label="Airspeed" value={`${state.speed.toFixed(0)} KT`} />
                    <StatItem label="Altitude" value={`${state.altitude.toFixed(0)} FT`} />
                    <StatItem label="System Time" value={new Date().toLocaleTimeString()} />
                </div>
                <div className={`warning-light active safe`}>Link: Stable</div>
            </header>

            {/* LEFT PANEL */}
            <aside className="side-panel">
                <PanelSection title="Energy Storage">
                    <DataCard label="Li-ion Battery SoC" value={state.batterySoC.toFixed(1)} unit="%" color="var(--success)" percent={state.batterySoC} />
                    <DataCard label="Fuel Reserves" value={state.fuelLevel.toFixed(1)} unit="%" color="var(--warning)" percent={state.fuelLevel} />
                </PanelSection>
                <PanelSection title="Generation">
                    <DataCard label="Solar Yield" value={state.solarPower.toFixed(2)} unit="kW" color="#fee140" percent={(state.solarPower / MAX_SOLAR) * 100} />
                    <div className="data-card">
                        <span className="stat-label">Output</span>
                        <div className="card-val">{state.powerOutput.toFixed(1)}<span className="card-unit">kW</span></div>
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
                        transform: `rotate(${state.speed / 20}deg) translateY(${-(state.altitude / 100) % 50}px)`
                    }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 5 }}>
                        <span className="stat-label" style={{ letterSpacing: '5px' }}>Thrust Output</span>
                        <div style={{ fontSize: '5rem', fontFamily: 'Orbitron', fontWeight: 700 }}>{state.thrust.toFixed(0)}</div>
                        <span className="stat-label">Newtons</span>
                    </div>
                </div>
                <div className="graph-container">
                    <div className="panel-section-title">Performance Telemetry</div>
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
                        <button className="cmd-btn" onClick={() => setState(s => ({ ...s, mode: s.mode === 'ELECTRIC' ? 'HYBRID' : s.mode === 'HYBRID' ? 'CHARGING' : 'ELECTRIC' }))}>
                            <RotateCcw size={18} /> {state.mode}
                        </button>
                        <button className={`cmd-btn emergency-btn ${state.emergencyMode ? 'active' : ''}`} onClick={() => setState(s => ({ ...s, emergencyMode: true, throttle: 0 }))}>
                            <Skull size={18} /> KILL
                        </button>
                    </div>
                </PanelSection>
                <PanelSection title="Throttle">
                    <div className="throttle-slider-container">
                        <div style={{ fontSize: '2rem', fontFamily: 'Orbitron' }}>{state.throttle}%</div>
                        <input
                            type="range"
                            value={state.throttle}
                            onChange={(e) => state.masterPower && !state.emergencyMode && setState(s => ({ ...s, throttle: parseInt(e.target.value) }))}
                        />
                    </div>
                </PanelSection>
            </aside>

            {/* FOOTER */}
            <footer className="annunciator">
                <AnnunciatorLight label="Motor" active={state.motorRunning} type="safe" />
                <AnnunciatorLight label="ICE" active={state.iceRunning} type="caution" />
                <AnnunciatorLight label="Solar" active={state.solarPower > 0.5} type="safe" />
                <AnnunciatorLight label="Stall" active={state.speed < 60 && state.altitude > 100} type="critical" />
                <AnnunciatorLight label="Pwr" active={state.masterPower} type="safe" />
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

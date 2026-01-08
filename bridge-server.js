/**
 * SKYBLUE Bridge Server
 * Connects Wokwi simulation to web interface via WebSocket
 * 
 * This server:
 * 1. Connects to Wokwi serial port (or real ESP32)
 * 2. Exposes WebSocket server for web interface
 * 3. Forwards data bidirectionally
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');

// Configuration
const SERIAL_PORT = process.env.SERIAL_PORT || 'COM3'; // Change to your port
const BAUD_RATE = 115200;
const WS_PORT = process.env.WS_PORT || 8080;
const HTTP_PORT = process.env.HTTP_PORT || 3001;

// State
let serialPort = null;
let parser = null;
let wsClients = new Set();
let lastData = null;
let isConnected = false;

// Express server for status endpoint
const app = express();
app.use(cors());
app.use(express.json());

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        connected: isConnected,
        clients: wsClients.size,
        port: SERIAL_PORT,
        lastData: lastData
    });
});

// Available ports endpoint
app.get('/ports', async (req, res) => {
    try {
        const { SerialPort } = require('serialport');
        const ports = await SerialPort.list();
        res.json(ports.map(p => ({
            path: p.path,
            manufacturer: p.manufacturer,
            serialNumber: p.serialNumber,
            pnpId: p.pnpId
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(HTTP_PORT, () => {
    console.log(`📊 HTTP Status server running on http://localhost:${HTTP_PORT}`);
    console.log(`   Status: http://localhost:${HTTP_PORT}/status`);
    console.log(`   Ports:  http://localhost:${HTTP_PORT}/ports`);
});

// WebSocket Server
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
    console.log('🔌 New WebSocket client connected');
    wsClients.add(ws);

    // Send current connection status
    ws.send(JSON.stringify({
        type: 'status',
        connected: isConnected
    }));

    // Send last data if available
    if (lastData) {
        ws.send(JSON.stringify({
            type: 'data',
            data: lastData
        }));
    }

    // Handle messages from web interface
    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message);

            if (msg.type === 'command' && serialPort && serialPort.isOpen) {
                // Forward command to serial port
                const command = msg.command + '\n';
                serialPort.write(command, (err) => {
                    if (err) {
                        console.error('❌ Error writing to serial:', err);
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Failed to send command'
                        }));
                    } else {
                        console.log('📤 Sent command:', msg.command);
                    }
                });
            } else if (msg.type === 'reconnect') {
                connectSerial();
            }
        } catch (error) {
            console.error('❌ Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
        wsClients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        wsClients.delete(ws);
    });
});

console.log(`🌐 WebSocket server running on ws://localhost:${WS_PORT}`);

// Broadcast to all connected WebSocket clients
function broadcast(data) {
    const message = JSON.stringify(data);
    wsClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Connect to serial port
function connectSerial() {
    if (serialPort && serialPort.isOpen) {
        console.log('⚠️  Serial port already open');
        return;
    }

    console.log(`🔌 Connecting to serial port: ${SERIAL_PORT}`);

    try {
        serialPort = new SerialPort({
            path: SERIAL_PORT,
            baudRate: BAUD_RATE,
            autoOpen: false
        });

        parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

        serialPort.open((err) => {
            if (err) {
                console.error('❌ Error opening serial port:', err.message);
                isConnected = false;
                broadcast({
                    type: 'status',
                    connected: false,
                    error: err.message
                });

                // Retry after 5 seconds
                setTimeout(connectSerial, 5000);
                return;
            }

            console.log('✅ Serial port connected');
            isConnected = true;
            broadcast({
                type: 'status',
                connected: true
            });
        });

        // Handle incoming data from serial port
        parser.on('data', (line) => {
            try {
                // Look for DATA: prefix
                if (line.startsWith('DATA:')) {
                    const jsonStr = line.substring(5).trim();
                    const data = JSON.parse(jsonStr);

                    lastData = data;

                    // Broadcast to all WebSocket clients
                    broadcast({
                        type: 'data',
                        data: data
                    });

                    // Log periodically (every 5 seconds)
                    if (!connectSerial.lastLog || Date.now() - connectSerial.lastLog > 5000) {
                        console.log('📊 Data:', {
                            battery: data.bat + '%',
                            fuel: data.fue + '%',
                            throttle: data.thr + '%',
                            thrust: data.tst + 'N'
                        });
                        connectSerial.lastLog = Date.now();
                    }
                } else {
                    // Forward other serial output (like environmental summaries)
                    console.log('📝', line);
                }
            } catch (error) {
                console.error('❌ Error parsing serial data:', error);
            }
        });

        serialPort.on('error', (err) => {
            console.error('❌ Serial port error:', err);
            isConnected = false;
            broadcast({
                type: 'status',
                connected: false,
                error: err.message
            });
        });

        serialPort.on('close', () => {
            console.log('🔌 Serial port closed');
            isConnected = false;
            broadcast({
                type: 'status',
                connected: false
            });

            // Attempt to reconnect after 5 seconds
            setTimeout(connectSerial, 5000);
        });

    } catch (error) {
        console.error('❌ Error creating serial port:', error);
        setTimeout(connectSerial, 5000);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');

    if (serialPort && serialPort.isOpen) {
        serialPort.close();
    }

    wss.close();
    process.exit(0);
});

// Start
console.log('🚀 SKYBLUE Bridge Server Starting...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`   Serial Port: ${SERIAL_PORT}`);
console.log(`   Baud Rate:   ${BAUD_RATE}`);
console.log(`   WebSocket:   ws://localhost:${WS_PORT}`);
console.log(`   HTTP API:    http://localhost:${HTTP_PORT}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

connectSerial();

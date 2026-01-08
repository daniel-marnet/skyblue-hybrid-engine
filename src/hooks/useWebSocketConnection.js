import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for Server-Sent Events (SSE) connection to SKYBLUE Relay Server
 * Receives real-time data from Wokwi via Vercel Edge Function
 */
export const useWebSocketConnection = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [lastData, setLastData] = useState(null);
    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    // Relay server URL
    const RELAY_URL = import.meta.env.VITE_RELAY_URL || '';
    const STREAM_ENDPOINT = `${RELAY_URL}/api/websocket-relay/stream`;
    const COMMAND_ENDPOINT = `${RELAY_URL}/api/websocket-relay/command`;
    const STATUS_ENDPOINT = `${RELAY_URL}/api/websocket-relay/status`;

    const connect = useCallback(() => {
        if (eventSourceRef.current) {
            console.log('⚠️ Already connected');
            return;
        }

        console.log(`🔌 Connecting to relay server: ${STREAM_ENDPOINT}`);
        setConnectionError(null);

        try {
            const eventSource = new EventSource(STREAM_ENDPOINT);

            eventSource.onopen = () => {
                console.log('✅ Connected to relay server');
                setIsConnected(true);
                setConnectionError(null);

                // Clear any pending reconnection attempts
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }

                // Check Wokwi connection status
                checkWokwiStatus();
            };

            eventSource.onmessage = (event) => {
                try {
                    // Ignore heartbeat messages
                    if (event.data.startsWith(':')) return;

                    const data = JSON.parse(event.data);
                    setLastData(data);
                    console.log('📊 Data received from Wokwi:', data);
                } catch (error) {
                    console.error('❌ Error parsing data:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('❌ SSE error:', error);
                setIsConnected(false);
                setConnectionError('Connection to relay server failed');

                // Close and attempt reconnect
                eventSource.close();
                eventSourceRef.current = null;

                // Reconnect after 5 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('🔄 Attempting to reconnect...');
                    connect();
                }, 5000);
            };

            eventSourceRef.current = eventSource;
        } catch (error) {
            console.error('❌ Error creating EventSource:', error);
            setConnectionError(error.message);
        }
    }, [STREAM_ENDPOINT]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (eventSourceRef.current) {
            console.log('🔌 Disconnecting from relay server');
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setIsConnected(false);
        setConnectionError(null);
    }, []);

    const sendCommand = useCallback(async (commandType, value = null) => {
        try {
            const command = {
                type: commandType,
                value: value,
                timestamp: Date.now()
            };

            console.log('📤 Sending command to Wokwi:', command);

            const response = await fetch(COMMAND_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Command sent:', result);
                return true;
            } else {
                console.error('❌ Failed to send command:', response.statusText);
                return false;
            }
        } catch (error) {
            console.error('❌ Error sending command:', error);
            return false;
        }
    }, [COMMAND_ENDPOINT]);

    const checkWokwiStatus = useCallback(async () => {
        try {
            const response = await fetch(STATUS_ENDPOINT);
            if (response.ok) {
                const status = await response.json();
                console.log('📊 Relay status:', status);

                if (!status.wokwiConnected) {
                    setConnectionError('Wokwi simulation not connected. Please start Wokwi at https://wokwi.com/projects/452473775385515009');
                } else {
                    setConnectionError(null);
                }
            }
        } catch (error) {
            console.error('❌ Error checking status:', error);
        }
    }, [STATUS_ENDPOINT]);

    // Auto-connect on mount
    useEffect(() => {
        // Don't auto-connect if no relay URL configured
        if (!RELAY_URL) {
            console.log('ℹ️ No relay URL configured, running in demo mode');
            setConnectionError('Running in demonstration mode');
            return;
        }

        connect();

        // Cleanup on unmount
        return () => {
            disconnect();
        };
    }, [connect, disconnect, RELAY_URL]);

    // Periodic status check (every 10 seconds)
    useEffect(() => {
        if (!isConnected || !RELAY_URL) return;

        const interval = setInterval(checkWokwiStatus, 10000);
        return () => clearInterval(interval);
    }, [isConnected, checkWokwiStatus, RELAY_URL]);

    return {
        isConnected,
        connectionError,
        lastData,
        connect,
        disconnect,
        sendCommand
    };
};

export default useWebSocketConnection;

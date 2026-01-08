import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for WebSocket connection to SKYBLUE Bridge Server
 * Manages connection, data reception, and command sending
 */
export const useWebSocketConnection = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [lastData, setLastData] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    // WebSocket URL - can be configured via environment variable
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('⚠️ WebSocket already connected');
            return;
        }

        console.log(`🔌 Connecting to WebSocket: ${WS_URL}`);
        setConnectionError(null);

        try {
            const ws = new WebSocket(WS_URL);

            ws.onopen = () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);
                setConnectionError(null);

                // Clear any pending reconnection attempts
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    switch (message.type) {
                        case 'status':
                            console.log('📊 Status update:', message.connected ? 'Connected' : 'Disconnected');
                            if (message.error) {
                                setConnectionError(message.error);
                            }
                            break;

                        case 'data':
                            // Update telemetry data
                            setLastData(message.data);
                            break;

                        case 'error':
                            console.error('❌ Server error:', message.message);
                            setConnectionError(message.message);
                            break;

                        default:
                            console.log('📨 Unknown message type:', message.type);
                    }
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                setConnectionError('WebSocket connection error');
            };

            ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                setIsConnected(false);
                wsRef.current = null;

                // Attempt to reconnect after 5 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('🔄 Attempting to reconnect...');
                    connect();
                }, 5000);
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('❌ Error creating WebSocket:', error);
            setConnectionError(error.message);
        }
    }, [WS_URL]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            console.log('🔌 Disconnecting WebSocket');
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
        setConnectionError(null);
    }, []);

    const sendCommand = useCallback((command) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            // Send plain text command (works with both bridge and direct Wokwi)
            wsRef.current.send(command);
            console.log('📤 Sent command:', command);
            return true;
        } else {
            console.warn('⚠️ Cannot send command: WebSocket not connected');
            return false;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

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

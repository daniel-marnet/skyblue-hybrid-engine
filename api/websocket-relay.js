/**
 * SKYBLUE WebSocket Relay Server
 * Vercel Edge Function que atua como intermediário entre Wokwi e Interface Web
 *
 * Arquitetura:
 * Wokwi (Cliente WS) → Esta Function (Relay) ← Interface Web (Cliente WS)
 */

import { Server } from 'socket.io';

// Armazena conexões ativas
const clients = new Map();
const wokwiConnection = { ws: null, data: null };

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // SSE (Server-Sent Events) para streaming de dados
  if (req.method === 'GET' && (req.url === '/stream' || req.url === '/api/websocket-relay/stream')) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const clientId = Date.now();
    clients.set(clientId, res);

    // Envia dados atuais imediatamente se disponível
    if (wokwiConnection.data) {
      res.write(`data: ${JSON.stringify(wokwiConnection.data)}\n\n`);
    }

    // Heartbeat para manter conexão viva
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);

    // Cleanup quando cliente desconectar
    req.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(clientId);
    });

    return;
  }

  // POST endpoint para Wokwi enviar dados
  if (req.method === 'POST' && (req.url === '/wokwi' || req.url === '/api/websocket-relay/wokwi')) {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        wokwiConnection.data = data;
        wokwiConnection.lastUpdate = Date.now();

        // Broadcast para todos os clientes conectados
        clients.forEach((clientRes) => {
          try {
            clientRes.write(`data: ${JSON.stringify(data)}\n\n`);
          } catch (e) {
            console.error('Error sending to client:', e);
          }
        });

        res.status(200).json({ success: true, clients: clients.size });
      } catch (error) {
        res.status(400).json({ error: 'Invalid JSON' });
      }
    });

    return;
  }

  // POST endpoint para Interface Web enviar comandos para Wokwi
  if (req.method === 'POST' && (req.url === '/command' || req.url === '/api/websocket-relay/command')) {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const command = JSON.parse(body);

        // Armazena comando para Wokwi pegar
        wokwiConnection.pendingCommand = command;
        wokwiConnection.commandTimestamp = Date.now();

        res.status(200).json({ success: true, command });
      } catch (error) {
        res.status(400).json({ error: 'Invalid JSON' });
      }
    });

    return;
  }

  // GET endpoint para Wokwi pegar comandos pendentes
  if (req.method === 'GET' && (req.url === '/command' || req.url === '/api/websocket-relay/command')) {
    const command = wokwiConnection.pendingCommand;
    const timestamp = wokwiConnection.commandTimestamp;

    // Limpa comando após 1 segundo (evita repetição)
    if (timestamp && Date.now() - timestamp > 1000) {
      wokwiConnection.pendingCommand = null;
      wokwiConnection.commandTimestamp = null;
    }

    res.status(200).json({
      command: command || null,
      timestamp: timestamp || null
    });
    return;
  }

  // Status endpoint
  if (req.method === 'GET' && (req.url === '/status' || req.url === '/api/websocket-relay/status')) {
    res.status(200).json({
      clients: clients.size,
      wokwiConnected: wokwiConnection.lastUpdate
        ? Date.now() - wokwiConnection.lastUpdate < 5000
        : false,
      lastUpdate: wokwiConnection.lastUpdate,
      hasPendingCommand: !!wokwiConnection.pendingCommand
    });
    return;
  }

  res.status(404).json({ error: 'Not found' });
}

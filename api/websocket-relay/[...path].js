import Redis from 'ioredis';

// Redis connection - using the same one from telemetry.js
const redisUrl = "redis://default:o80LHfGtdfHjhBYcr8ksiHTqA7DeGCK5@redis-11163.crce207.sa-east-1-2.ec2.cloud.redislabs.com:11163";
const redis = new Redis(redisUrl);
const pub = new Redis(redisUrl);
const sub = new Redis(redisUrl);

// Store for local SSE clients of this specific instance
const localClients = new Map();

// Subscribe to telemetry channel
sub.subscribe('skyblue_telemetry_stream');
sub.on('message', (channel, message) => {
  if (channel === 'skyblue_telemetry_stream') {
    const data = JSON.parse(message);
    // Broadcast to all local SSE clients
    localClients.forEach((clientRes) => {
      try {
        clientRes.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (e) {
        // Client likely disconnected
      }
    });
  }
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Robust path detection from the raw URL
  const url = req.url || '';
  const path = url.split('/api/websocket-relay')[1]?.split('?')[0] || '/';

  // SSE (Server-Sent Events) for streaming data
  if (req.method === 'GET' && path === '/stream') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const clientId = Date.now();
    localClients.set(clientId, res);

    const lastData = await redis.get('skyblue_last_telemetry');
    if (lastData) {
      try {
        res.write(`data: ${lastData}\n\n`);
      } catch (e) { }
    }

    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch (e) { }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      localClients.delete(clientId);
    });
    return;
  }

  // Helper to parse body securely
  const getBody = () => new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10000) req.destroy(); // Protection
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });

  // POST endpoint for Wokwi to send data
  if (req.method === 'POST' && path === '/wokwi') {
    try {
      const data = await getBody();

      // Store in Redis (for new clients)
      await redis.set('skyblue_last_telemetry', JSON.stringify(data), 'EX', 60);

      // Publish to all instances via Redis Pub/Sub
      await pub.publish('skyblue_telemetry_stream', JSON.stringify(data));

      return res.status(200).json({ success: true, clients: localClients.size });
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  // POST endpoint for Interface Web to send commands to Wokwi
  if (req.method === 'POST' && path === '/command') {
    try {
      const { command } = await getBody();

      // Store command in Redis
      await redis.set('skyblue_pending_command', JSON.stringify(command), 'EX', 10);

      return res.status(200).json({ success: true, command });
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  // GET endpoint for Wokwi to pick up pending commands
  if (req.method === 'GET' && path === '/command') {
    const commandStr = await redis.get('skyblue_pending_command');
    const command = commandStr ? JSON.parse(commandStr) : null;

    // Commands are short-lived. We don't strictly need to delete it if we use EX, 
    // but let's clear it once read to be safe and responsive.
    if (command) {
      await redis.del('skyblue_pending_command');
    }

    return res.status(200).json({
      command: command || null,
      timestamp: Date.now()
    });
  }

  // Status endpoint
  if (req.method === 'GET' && path === '/status') {
    const lastUpdate = await redis.get('skyblue_last_telemetry');
    return res.status(200).json({
      instances_local_clients: localClients.size,
      wokwiConnected: !!lastUpdate,
      hasPendingCommand: !!(await redis.exists('skyblue_pending_command'))
    });
  }

  return res.status(404).json({ error: `Not found: ${path}. Available: /stream, /wokwi, /command, /status`, query: req.query });
}


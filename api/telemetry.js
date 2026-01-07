import Redis from 'ioredis';

const redis = new Redis("redis://default:o80LHfGtdfHjhBYcr8ksiHTqA7DeGCK5@redis-11163.crce207.sa-east-1-2.ec2.cloud.redislabs.com:11163");

export default async function handler(req, res) {
    // Add CORS headers for local dev
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'POST') {
            const data = req.body;
            await redis.set('skyblue_telemetry', JSON.stringify({
                ...data,
                timestamp: Date.now()
            }));
            return res.status(200).json({ success: true });
        }

        if (req.method === 'GET') {
            const data = await redis.get('skyblue_telemetry');
            return res.status(200).json(data ? JSON.parse(data) : {});
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Redis Error:', error);
        return res.status(500).json({ error: error.message });
    }
}

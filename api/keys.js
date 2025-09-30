const crypto = require('crypto');

let keys = [];
let lastUpdate = 0;
let usedKeys = new Set();
let userSessions = new Map();

function generateKeys() {
    keys = [];
    for (let i = 0; i < 50; i++) {
        keys.push('Free_' + crypto.randomBytes(16).toString('hex'));
    }
    lastUpdate = Date.now();
}

generateKeys();

function getRandomKey() {
    const availableKeys = keys.filter(k => !usedKeys.has(k));
    if (availableKeys.length === 0) {
        generateKeys();
        return keys[0];
    }
    return availableKeys[Math.floor(Math.random() * availableKeys.length)];
}

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (now - lastUpdate >= dayInMs) {
        generateKeys();
        usedKeys.clear();
        userSessions.clear();
    }

    // Get single key - Requires valid session
    if (req.method === 'GET' && !req.url.includes('/roblox')) {
        const session = req.query.session;
        
        if (!session || !userSessions.has(session)) {
            return res.status(403).json({ 
                error: 'Complete verification first',
                redirect: true 
            });
        }
        
        const userData = userSessions.get(session);
        
        if (userData.key) {
            return res.json({ key: userData.key });
        }
        
        const key = getRandomKey();
        userData.key = key;
        usedKeys.add(key);
        
        return res.json({ key: key });
    }

    // Roblox endpoint
    if (req.url.includes('/roblox')) {
        return res.json({
            keys: keys,
            count: keys.length
        });
    }

    return res.status(404).json({ error: 'Not found' });
}

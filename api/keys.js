const crypto = require('crypto');

let keys = [];
let lastUpdate = 0;
let usedKeys = new Set();

// Use global for shared sessions across API routes
global.userSessions = global.userSessions || new Map();

function generateKeys() {
    keys = [];
    for (let i = 0; i < 50; i++) {
        keys.push('Free_' + crypto.randomBytes(16).toString('hex'));
    }
    lastUpdate = Date.now();
    console.log('Generated', keys.length, 'new keys');
}

generateKeys();

function getRandomKey() {
    const availableKeys = keys.filter(k => !usedKeys.has(k));
    if (availableKeys.length === 0) {
        generateKeys();
        usedKeys.clear();
        return keys[0];
    }
    return availableKeys[Math.floor(Math.random() * availableKeys.length)];
}

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // Refresh keys every 24 hours
    if (now - lastUpdate >= dayInMs) {
        generateKeys();
        usedKeys.clear();
        global.userSessions.clear();
        console.log('Daily refresh completed');
    }

    // Roblox endpoint - returns all keys for validation
    if (req.url.includes('/roblox')) {
        return res.json({
            keys: keys,
            count: keys.length,
            lastUpdate: lastUpdate
        });
    }

    // Get single key endpoint - requires valid session
    const session = req.query.session;
    
    if (!session) {
        return res.status(400).json({ 
            error: 'No session provided',
            message: 'Complete verification first'
        });
    }
    
    if (!global.userSessions.has(session)) {
        return res.status(403).json({ 
            error: 'Invalid session',
            message: 'Session expired or invalid. Please complete verification again.'
        });
    }
    
    const userData = global.userSessions.get(session);
    
    // Check if session expired (30 minutes)
    if (now - userData.timestamp > 30 * 60 * 1000) {
        global.userSessions.delete(session);
        return res.status(403).json({ 
            error: 'Session expired',
            message: 'Session expired. Please complete verification again.'
        });
    }
    
    // Return existing key if user already got one
    if (userData.key) {
        return res.json({ 
            key: userData.key,
            cached: true
        });
    }
    
    // Give user 1 random key
    const key = getRandomKey();
    userData.key = key;
    usedKeys.add(key);
    
    console.log('Key assigned:', key.substring(0, 15) + '...');
    
    return res.json({ 
        key: key,
        cached: false
    });
}

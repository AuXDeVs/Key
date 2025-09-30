const crypto = require('crypto');

let keys = [];
let lastUpdate = 0;
let usedKeys = new Set(); // Track used keys
let userSessions = new Map(); // Track users who got keys

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
        generateKeys(); // Refresh if all used
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

    // Verify endpoint - Called by Lootlink redirect
    if (req.url.includes('/verify')) {
        const r = req.query.r; // Lootlink sends this
        
        if (!r || r.length < 10) {
            return res.status(400).json({ error: 'Invalid verification' });
        }
        
        // Generate session token
        const sessionToken = crypto.randomBytes(32).toString('hex');
        userSessions.set(sessionToken, {
            verified: true,
            timestamp: now,
            key: null
        });
        
        // Redirect back to site with session token
        return res.redirect(`/?session=${sessionToken}`);
    }

    // Get single key - Requires valid session
    if (req.method === 'GET' && req.url.includes('/getkey')) {
        const session = req.query.session;
        
        if (!session || !userSessions.has(session)) {
            return res.status(403).json({ error: 'Complete verification first' });
        }
        
        const userData = userSessions.get(session);
        
        // Check if user already got a key
        if (userData.key) {
            return res.json({ key: userData.key });
        }
        
        // Give user 1 random key
        const key = getRandomKey();
        userData.key = key;
        usedKeys.add(key);
        
        return res.json({ key: key });
    }

    // Roblox endpoint - Returns all keys (for validation)
    if (req.url.includes('/roblox')) {
        return res.json({
            keys: keys,
            count: keys.length
        });
    }

    return res.status(404).json({ error: 'Not found' });
}

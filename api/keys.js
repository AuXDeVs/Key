const crypto = require('crypto');

let keys = [];
let lastUpdate = 0;

function generateKeys() {
    keys = [];
    for (let i = 0; i < 20; i++) {
        keys.push('Free_' + crypto.randomBytes(16).toString('hex'));
    }
    lastUpdate = Date.now();
}

generateKeys();

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (now - lastUpdate >= dayInMs) {
        generateKeys();
    }
    
    return res.json({
        keys: keys,
        nextUpdate: lastUpdate + dayInMs
    });
}

const crypto = require('crypto');

// Import shared data from keys.js
let userSessions = new Map();

export default function handler(req, res) {
    // Get Lootlink token
    const lootlinkToken = req.query.r || req.query.token || req.query.verify;
    
    // Validate token exists (Lootlink always sends something)
    if (!lootlinkToken) {
        return res.redirect('/?error=invalid');
    }
    
    // Create session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Store session with timestamp
    const sessionData = {
        verified: true,
        timestamp: Date.now(),
        key: null,
        lootlinkToken: lootlinkToken
    };
    
    // Store in global (shared with keys.js)
    global.userSessions = global.userSessions || new Map();
    global.userSessions.set(sessionToken, sessionData);
    
    // Redirect to main page with session
    return res.redirect(`/?session=${sessionToken}`);
}

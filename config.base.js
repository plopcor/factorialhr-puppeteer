//const fs = import('node:fs')
// import fs from 'node:fs';
const fs = require('node:fs')

// Base config
let configuration = {
    CHROME_DEBUG_URL: 'http://127.0.0.1:9222',
    DASHBOARD_URL: 'https://app.factorialhr.com/dashboard',
    SESSION_COOKIE: {
        domain: '.api.factorialhr.com',
        name: '_factorial_session_v2',
    },
    SESSION_COOKIE_FILE: 'session_token.txt',
    USER_CONFIG: 'config.json',
    SCHEDULE: null,     // Defined by user
};

// -----------------------

// Get custom config (config.json)
try {
    let userConfig = fs.readFileSync(configuration.USER_CONFIG, 'utf8')?.trim();
    if (userConfig) {
        userConfig = JSON.parse(userConfig);
        configuration = Object.assign(configuration, userConfig)
    }
} catch (err) {
    console.log("[ERROR] Failed trying to load custom configuration")
    console.error(err);
    process.exit(1)
}

// Validate
if (!configuration.SCHEDULE || typeof configuration.SCHEDULE !== 'object') {
    console.log("[ERROR] Schedule not specified")
    process.exit(1)
}

// Token

function loadToken() {
    try {
        let token = fs.readFileSync(configuration.SESSION_COOKIE_FILE, 'utf8')?.trim();
        return token || null;
    } catch (err) {
        console.error(err);
        return null;
    }
}

const regexValidateToken = new RegExp('^[a-z0-9]{32}$');
function validateToken(token) {
    return regexValidateToken.test(token);
}

function saveToken(token) {
    try {
        fs.writeFileSync(configuration.SESSION_COOKIE_FILE, token.trim());
        return true;
    } catch (err) {
        console.error(err)
        return false;
    }
}


//export { configuration as default, loadToken, validateToken, saveToken };

exports.configuration = configuration;
exports.loadToken = loadToken;
exports.validateToken = validateToken;
exports.saveToken = saveToken;
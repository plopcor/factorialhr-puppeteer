const cron = require('node-cron');
const { configuration, loadToken, validateToken, saveToken } = require('./config.base.js')
const child_process = require('child_process')

const CLOCKS = configuration.SCHEDULE;
const TASK_FILE = './cron_job.mjs'

// ---------- FUNCTIONS
function getDateTime() {
    return (new Date()).toLocaleString();
}

function validateInt(val, min, max) {
    return (val >= min && val <= max);
}

function getToken() {
    if (!SESSION_TOKEN) {
        SESSION_TOKEN = loadToken();
    }
    return SESSION_TOKEN || null;
}

function setToken(token) {
    SESSION_TOKEN = token;
    saveToken(token)
}


function executeTask(isClockIn) {
    // Get token
    let token = getToken();
    if (!token || !validateToken(token)) {
        return Error("Invalid session token")
    }

    // Start job
    var process = child_process.fork(TASK_FILE, [
        isClockIn ? 1 : 0,
        token
    ])

    process.on('spawn', () => console.log("[Task] Spawned"));

    process.on('message', (data) => console.log("[Task] Data: " + data));   // Triggers when child process uses process.send, in JSON format 

    process.on('error', (err) => console.log("[Task] ERROR: " + err));

    // process.on('close', onExit);
    process.on('exit', (code) => {
        if (code == 0) {
            console.log("[Task] OK")
        } else {
            console.log("[Task] Failed")
        }
    });
}


// ---------- MAIN
let SESSION_TOKEN;
SESSION_TOKEN = process.argv[2] || getToken();
if (!SESSION_TOKEN) {
    console.error("[ERROR] Token not found")
    process.exit(1)
}
if (!validateToken(SESSION_TOKEN)) {
    console.log("[ERROR] Token format is invalid")
    process.exit(1)
}

// For each day
/*
    Sort dayOfWeek by numeric =>
        let collator = new Intl.Collator([], {numeric: true});
        Object.keys(CLOCKS).sort((a, b) => collator.compare(a,b));
*/

let cronStrings = [];
for (let dayOfWeek of Object.keys(CLOCKS)) {

    console.log(`[Schedule] Day/s: ${dayOfWeek} => ${CLOCKS[dayOfWeek].map(e => e.join('-')).join(" | ")}`)

    for (let hours of CLOCKS[dayOfWeek]) {
        // Parse: 09.50 => '9.50' => [ 9, 50 ]  ||  09.05 => '9.05' => [ 9, 5]
        let [inTime, outTime] = hours.map(e => e.toFixed(2).split('.').map(e => parseInt(e)));

        let [inHour, inMin] = inTime;       // If minutes not specified, will be 0
        let [outHour, outMin] = outTime;

        // Validate hours (min & max)
		if (!validateInt(inHour, 0, 23) || !validateInt(inMin, 0, 59)) {
            console.log(`[ERROR] Invalid hour/minute range in day "${dayOfWeek}", hour: ${hours[0]}`)
            process.exit(1)
		}
        if (!validateInt(outHour, 0, 23) || !validateInt(outMin, 0, 59)) {
            console.log(`[ERROR] Invalid hour/minute range in day "${dayOfWeek}", hour "${hours[1]}"`)
            process.exit(1)
		}

        // Generate CRON strings
        let inCron = `${inMin} ${inHour} * * ${dayOfWeek}`
        let outCron = `${outMin} ${outHour} * * ${dayOfWeek}`

        // Validate
        if (!cron.validate(inCron)) {
            console.log(`[ERROR] Invalid schedule time in day ${dayOfWeek}, hour ${inHour}.${inMin}`)
            process.exit(1)
        }
        if (!cron.validate(outCron)) {
            console.log(`[ERROR] Invalid schedule time in day ${dayOfWeek}, hour ${outHour}.${outMin}`)
            process.exit(1)
        }

        cronStrings.push([inCron, outCron])
    }

}

// Validate
if (cronStrings.length === 0) {
    console.error("[ERROR] Can't generate schedule tasks")
    process.exit(1)
}

saveToken(SESSION_TOKEN)

// Schedule in and outs
for (let [inCron, outCron] of cronStrings) {

    // In
    cron.schedule(inCron, () => {
        console.log(`[${getDateTime()}] Clock in`)
        executeTask(true)
    });

    // Out
    cron.schedule(outCron, () => {
        console.log(`[${getDateTime()}] Clock out`)
        executeTask(false)
    });
}

console.log("[Schedule] All set")
console.log("[Schedule] Waiting for next event...")

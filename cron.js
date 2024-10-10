const cron = require('node-cron');

// ---------------------------------------
// # CONFIGURATION

/*
Clock format:

    <day_of_week>: [
        [<clock_in_hour>, <clock_out_hour>],
        [<clock_in_hour>, <clock_out_hour>],
        [<clock_in_hour.minute>, <clock_out_hour.minutes>]
    ]

- day_of_week: 1 to 7, group using '1-3' or multiple using '1,3,5'
- clock_in/out_hour[.minute]: Hour in 24h format (minute is optional). Ex: 9.30 -> 9:30/9:30am, 15 -> 15:00/3pm, 18.45 -> 18:45/6:45pm
*/

const CLOCKS = {
    '1-4': [
        [8.30, 11],
        [11.30, 14],
        [15, 18]
    ],
    5: [
        [8, 11],
        [11.30, 14]
    ]
    // '1,3,5': [ ... ] // Days 1, 3 and 5
    // '1-3':           // Days 1 to 3
}


// ---------------------------------------

// ---------- FUNCTION
function getDateTime() {
    return (new Date()).toLocaleString();
}

function validateInt(val, min, max) {
    return (val >= min && val <= max);
}

// ---------- MAIN

if (Object.keys(CLOCKS).length === 0) {
    console.log("[ERROR] Clocking schedule can't be empty")
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

        // console.log("IN ", inCron);
        // console.log("OUT", outCron);

        cronStrings.push([inCron, outCron])
        // cronStrings.push([
        //     { str: inCron, dayOfWeek, inHour, inMin: inMin || null },
        //     { str: outCron, dayOfWeek, outHour, outMin: outMin || null }
        // ])
    }

}

// Validate
if (cronStrings.length === 0) {
    console.error("[ERROR] No crons set")
    process.exit(1)
}

// Schedule in and outs
for (let [inCron, outCron] of cronStrings) {

    // In
    cron.schedule(inCron, () => {
        console.log(`[${getDateTime()}] Clock in`)
        // TODO => index.mjs 1 <access_token>
    });

    // Out
    cron.schedule(outCron, () => {
        console.log(`[${getDateTime()}] Clock out`)
        // TODO => index.mjs 0 <access_token>
    });
}

console.log("[Schedule] All set")
console.log("[Schedule] Waiting for next event...")

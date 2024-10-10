import puppeteer from 'puppeteer-core';
import { exec } from 'node:child_process';

/*
const fs = await import('node:fs');
const puppeteer = await import('puppeteer-core');
const http = require("http")
const COOKIE = '<FILL_WITH_COOKIE>';
*/

// +Info https://github.com/benjajaja/factorial-puppeteer

// EXECUTE
// $ index.js <is_clock_in> [factorial_session_cookie]

// EXAMPLES
// > Clock in
// $ index.js 1 12345678ABC
// > Clock out
// $ index.js 0 12345678ABC
// > Clock in, using already set cookie (don't specify)
// $ index.js 1

// Help with "--help" argument
if (process.argv[2] === '--help') {
	console.log("Command: manual.js <is_clock_in> [factorial_session_cookie]")
	console.log("Exeample: manual.js 0|1 [12345678ABC]")
	process.exit(0)
}

// ---------------------------------------
// # CONFIGURATION
const REMOTE_URL = 'http://127.0.0.1:9222'
const DASHBOARD_URL = 'https://app.factorialhr.com/dashboard'
const IS_FITXAR = process.argv[2];
const FACTORIAL_COOKIE = {
	name: '_factorial_session_v2',
	domain: '.api.factorialhr.com',
	value: process.argv[3] || null 	// If not specified as argument, will try the one already set
									// If none was set before, will show an error
}
// ---------------------------------------

// ---------- ARGUMENTS

// Argument: Click in/out
if (IS_FITXAR === undefined || (IS_FITXAR !== '0' && IS_FITXAR !== '1')) {
	console.error("[ERROR] Clock in/out value is missing, specify 0 or 1. See README.txt")
	process.exit(1)
}

// Argument (optional): Factorial session cookie
if (process.argv[3] && process.argv[3].length < 10) {
	console.error("[ERROR] Invalid session token format")
	process.exit(1)
}

// ---------- FUNCTIONS

// Delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// Get Chrome WS for debug connection
async function getRemoteDebugWSURL() {

	// Get it from "<ip>:<port>/json/version", webSocketDebuggerUrl property
	return fetch(REMOTE_URL + '/json/version')
		.then(async (response) => {
			let body = await response.json()
			return body.webSocketDebuggerUrl;
		})
		.catch(async (error) => {
			// console.log("[ERROR]", error.message)
			return null;
		});
}


// ---------- MAIN

console.log("> Clock:", Boolean(IS_FITXAR) ? "IN" : "OUT")

// Get already opened Chrome debugging URL
var DEBUG_WS_URL = await getRemoteDebugWSURL();
// If not opened
if (DEBUG_WS_URL == null) {
	console.log("[Chrome] New instance")
	// Launch Chrome
	await exec('google-chrome --incognito --remote-debugging-port=9222')
	await delay(2000)
	DEBUG_WS_URL = await getRemoteDebugWSURL();
}

if (DEBUG_WS_URL == null) {
	console.error("[ERROR] Chrome in debugging mode not found or debug URL not found")	
	// console.error("[ERROR] Chrome instance with debugging mode enabled not found")
	process.exit(1)
}

// Connector to running Chrome instance
const browser = await puppeteer.connect({
  browserWSEndpoint: DEBUG_WS_URL,
});

// Get actual page
const page = (await browser.pages())[0];
await page.setViewport({width: 1080, height: 1024});

// Check if session cookie already exists
var cookies = (await page._client().send('Network.getAllCookies')).cookies;
let sessionCookie = cookies.find(e => e.domain == FACTORIAL_COOKIE.domain && e.name == FACTORIAL_COOKIE.name)
if (!sessionCookie) { // If doesn't exist, set it

	// Check if passed as argument
	if (!FACTORIAL_COOKIE.value) {
		console.error("[ERROR] Session not started and cookie not specified, specify one")
		browser.close();
		process.exit(1)
	}

	console.log("[Session] Set cookie")
	sessionCookie = {
		domain: FACTORIAL_COOKIE.domain,
		name: FACTORIAL_COOKIE.name,
		value: FACTORIAL_COOKIE.value,
	};
	await page.setCookie(sessionCookie);	
} else {
	console.log("[Session] Cookie already set")
}

// Go to dashboard
await page.goto(DASHBOARD_URL, {
    waitUntil: 'networkidle2',
});

// If needs login (or got redirected)
if (page.url() !== DASHBOARD_URL) {
	console.error("[ERROR] Session token expired, specify a new one");
	browser.close();
	process.exit(1)
}

// Wait for load
await page.waitForSelector('div[aria-label="Clock in widget"]');

let isFitxat = !! await page.$('div[aria-label="Clock in widget"] div.ooir1');
let fitxarBtn = await page.$('div[aria-label="Clock in widget"] button');

if (
	(IS_FITXAR === '1' && !isFitxat)
	||
	(IS_FITXAR === '0' && isFitxat)
) {
	await fitxarBtn.evaluate(e => e.click());
}

// If need to interact again with fitxarBtn, get it again
console.log("DONE - Fitxat")
process.exit(0)
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


// ---------------------------------------
import { configuration as CONFIG, loadToken, saveToken, validateToken } from './config.base.js'

// ---------- ARGUMENTS

const CLOCK_IN = process.argv[2];
let SESSION_TOKEN = process.argv[3];

if (!SESSION_TOKEN || !validateToken(SESSION_TOKEN)) {
	console.error("[ERROR] Session token not specified or invalid")
	process.exit(1);
}

if (CLOCK_IN === undefined || (CLOCK_IN !== '0' && CLOCK_IN !== '1')) {
	console.error("[ERROR] Clock in/out format is incorrect (1 o 0) or not specified, see README.txt")
   process.exit(1)
}


// ---------- FUNCTIONS

// Delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// Get Chrome WS for debug connection
async function getRemoteDebugWSURL() {

	// Get it from "<ip>:<port>/json/version", webSocketDebuggerUrl property
	return fetch(CONFIG.CHROME_DEBUG_URL + '/json/version')
		.then(async (response) => {
			let body = await response.json()
			return body.webSocketDebuggerUrl;
		})
		.catch(async (error) => {
			return null;
		});
}


// ---------- MAIN

// Get already opened Chrome debugging URL
var DEBUG_URL = await getRemoteDebugWSURL();
if (DEBUG_URL == null) { // If not opened
	console.log("[Chrome] New instance")
	// Launch Chrome
	await exec('google-chrome --incognito --remote-debugging-port=9222')
	await delay(2000)
	DEBUG_URL = await getRemoteDebugWSURL();
}

if (DEBUG_URL == null) {
	console.error("[ERROR] Chrome in debugging mode not found or debug URL not found")	
	process.exit(1)
}

// Connect to browser
const browser = await puppeteer.connect({
  browserWSEndpoint: DEBUG_URL,
});

// Get current page
const page = (await browser.pages())[0];
await page.setViewport({width: 1080, height: 1024});

// Check if session cookie already exists
var cookies = (await page._client().send('Network.getAllCookies')).cookies;
let sessionCookie = cookies.find(e => e.domain == CONFIG.SESSION_COOKIE.domain && e.name == CONFIG.SESSION_COOKIE.name)
if (!sessionCookie) { // If doesn't exist, set it

	// Check if passed as argument
	if (!SESSION_TOKEN) {
		console.error("[ERROR] Session token not specified, can't set session cookie")
		browser.close();
		process.exit(1)
	}

	console.log("[Session] Set cookie")
	sessionCookie = {
		domain: CONFIG.SESSION_COOKIE.domain,
		name: CONFIG.SESSION_COOKIE.name,
		value: SESSION_TOKEN,
	};
	await page.setCookie(sessionCookie);	
} else {
	console.log("[Session] Cookie already set")
}

// Go to dashboard
await page.goto(CONFIG.DASHBOARD_URL, {
    waitUntil: 'networkidle2',
});

// If needs login (got redirected)
if (page.url() !== CONFIG.DASHBOARD_URL) {
	console.error("[ERROR] Session token expired, specify a new one");
	browser.close();
	process.exit(1)
}

// Wait for load
await page.waitForSelector('div[aria-label="Clock in widget"]');

let isClockedIn = !! await page.$('div[aria-label="Clock in widget"] div.ooir1');
let clockInBtn = await page.$('div[aria-label="Clock in widget"] button');

// If needs to clock in/out
if (
	(CLOCK_IN === '1' && !isClockedIn)
	||
	(CLOCK_IN === '0' && isClockedIn)
) {
	await clockInBtn.evaluate(e => e.click());
}
// If need to interact again with clockBtn, get it again

saveToken(sessionCookie.value)

browser.disconnect();
process.exit(0)
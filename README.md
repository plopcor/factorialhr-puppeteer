Script to clock in and out of Factorial using Puppeteer.

# Installation
```
npm i
```

# Usage
**You will need to provide a cookie for the first access or if the session cookie expired (22h after the last page refresh)**.

Cookie must be extracted from an already opened session. More info at "Extract session cookie"

## Extract session cookie
You will only have to do this once, as the script will keep the cookie valid on each refresh.

To get a valid session cookie:
1. Log in to Factorial
2. Open DevTools with `F12`
3. Go to "Application" tab
4. On left menu > "Cookies" > "app.factorialhr.com"
5. Search for a cookie named "_factorial_session_v2"
6. Copy it's value

Good to go!

## Execute
```
index.mjs CLOCK_IN [COOKIE]
```

- `CLOCK_IN` (`int`) - If clocking in or out. Values: In=1, Out=2
- `COOKIE` (`string`) - Cookie value to get an opened session

### Example:
```
// Clock in with a cookie for the first time
index.mjs 1 a123b456c678d901e

// Clock in with an already set cookie
index.mjs 1

// Clock out with an already set cookie
index.mjs 0
```

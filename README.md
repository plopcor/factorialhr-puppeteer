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

## Clock in/out
`index.mjs CLOCK_IN [COOKIE]`

- `CLOCK_IN` (`bool`) - If clocking in or out. Values: In=1, Out=0
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


## Cron
`cron.js`

Configure work schedule for the week.
You can specify days individually or group them

### Configure schedule

Work schedule configuration:

```
CLOCK = [
    day_of_week: [
        [clock_in, clock_out],
        [clock_in, clock_out]
    ],
    day_of_week: [
        [clock_in, clock_out]
    ]
]
```

| field       | type        | value                              | example                                                               |
|-------------|-------------| ---------------------------------- |-----------------------------------------------------------------------|
| day_of_week | int\|string |`1` to `7` (Monday, Tuesday, Wed..) | `1` Monday, `'1-3'` Monday to Wednesday, `'1,3'` Monday and Wednesday |
| clock_in    | float (2)   | 0 to 23.59 (`0`-`23`.`0`-`59`)     | `9` 09:00 `14.30` 14:30, `18` 18:00, `19.05` 19:05                    |
| clock_out   | float (2)   | 0 to 23.59 (`0`-`23`.`0`-`59`)     | `9` 09:00, `14.30` 14:30, `18` 18:00, `19.05` 19:05                   |

<!--
**day_of_week**

Values: `1 to 7`

> 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday

Grouping days:

> `'1-4'`: 1 to 4 (Monday, Tuesday, Wednesday and Thrusday)

> `'1,3,5'`: 1, 3 and 5 (Monday, Wednesday and Friday)
-->

**Examples**

Monday from 8:00 to 14:00 and 15:00 to 17:30
```json
1: [
    [8, 14],
    [15, 17.30]
]
```

Monday to Friday from 8:30 to 17:30
```json
"1-5": [
    [8.30, 17.30]
]
```


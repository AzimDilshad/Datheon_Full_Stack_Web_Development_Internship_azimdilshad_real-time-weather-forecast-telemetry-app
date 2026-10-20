# Weather Dashboard

A live weather search app. Search any city in the world and see the current
temperature, conditions, humidity, wind speed, pressure and a 5-day forecast.
The background changes with the weather (sunny, rainy, cloudy, snowy, night).

## Features
- Current weather with icons that change by condition and day/night
- Humidity, wind speed and atmospheric pressure
- 5-day forecast cards
- Loading spinner and clear error messages (unknown city, bad key, network down)
- °C / °F toggle
- Works on phones and desktops
- Remembers the last city you searched

## Setup
1. Make a free account at https://openweathermap.org and copy your API key.
2. Open the `.env` file and replace `your_api_key_here` with your key:
   ```
   OPENWEATHER_API_KEY=abc123yourkey
   ```
3. Install Node.js 18 or newer, then run:
   ```
   npm start
   ```
4. Open http://localhost:3000

There are no packages to install.

## Deploying to Vercel
1. Push the project to a GitHub repo (the `.env` file is ignored, so your key stays private).
2. On https://vercel.com click **Add New > Project** and import the repo.
3. Leave the framework as **Other** and don't change the build settings.
4. Open **Environment Variables** and add:
   - Name: `OPENWEATHER_API_KEY`
   - Value: your key
5. Click **Deploy**. If you add or change the variable later, redeploy so it applies.

## Notes
- New OpenWeatherMap keys can take up to a couple of hours before they work.
- The key is only read on the server (`api/weather.js`), so it is never sent to the browser.

## Project structure
```
weather-dashboard/
├── api/
│   └── weather.js   # serverless route that calls the weather API
├── server.js        # local dev server only
├── .env             # your API key goes here (local only)
├── vercel.json
├── package.json
└── public/
    ├── index.html
    ├── style.css
    └── script.js
```

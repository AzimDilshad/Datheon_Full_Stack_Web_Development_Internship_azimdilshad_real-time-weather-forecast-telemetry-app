// Serverless route: /api/weather?city=London
// Vercel runs this as a function, and server.js reuses it for local testing.
// The key comes from the OPENWEATHER_API_KEY environment variable.

const BASE = 'https://api.openweathermap.org/data/2.5';

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  const KEY = process.env.OPENWEATHER_API_KEY;
  const url = new URL(req.url, 'http://localhost');
  const city = (url.searchParams.get('city') || '').trim();

  if (!city) return send(res, 400, { message: 'Please type a city name.' });
  if (!KEY || KEY === 'your_api_key_here') {
    return send(res, 500, { message: 'API key missing. Add OPENWEATHER_API_KEY to your environment settings.' });
  }

  const q = encodeURIComponent(city);
  try {
    // current weather and forecast are separate endpoints, grab both at once
    const [curRes, foreRes] = await Promise.all([
      fetch(`${BASE}/weather?q=${q}&units=metric&appid=${KEY}`),
      fetch(`${BASE}/forecast?q=${q}&units=metric&appid=${KEY}`)
    ]);

    if (curRes.status === 404) {
      return send(res, 404, { message: `Couldn't find a city called "${city}".` });
    }
    if (curRes.status === 401) {
      return send(res, 401, { message: 'The API key was rejected. New keys can take a couple of hours to activate.' });
    }
    if (!curRes.ok || !foreRes.ok) {
      return send(res, 502, { message: 'Weather service had a problem, try again in a bit.' });
    }

    const current = await curRes.json();
    const forecast = await foreRes.json();
    send(res, 200, { current, forecast });
  } catch (err) {
    console.error('fetch failed:', err.message);
    send(res, 502, { message: 'Could not reach the weather service.' });
  }
};

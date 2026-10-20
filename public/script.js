// Weather dashboard front end.
// Talks to our own /api/weather route (see server.js), not to OpenWeatherMap directly.

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const unitBtn = document.getElementById('unitBtn');
const loader = document.getElementById('loader');
const errorBox = document.getElementById('error');
const result = document.getElementById('result');

let useCelsius = true;
let lastData = null; // keep the last response so the unit toggle doesn't need a new request

// ---------- helpers ----------

// the api gives us celsius, convert only when showing
function formatTemp(c) {
  const val = useCelsius ? c : (c * 9) / 5 + 32;
  return `${Math.round(val)}°`;
}

// pick an emoji from the openweather condition id
function getIcon(id, isNight) {
  if (id >= 200 && id < 300) return '⛈️';
  if (id >= 300 && id < 400) return '🌦️';
  if (id >= 500 && id < 600) return '🌧️';
  if (id >= 600 && id < 700) return '❄️';
  if (id >= 700 && id < 800) return '🌫️';
  if (id === 800) return isNight ? '🌙' : '☀️';
  if (id === 801 || id === 802) return isNight ? '☁️' : '⛅';
  return '☁️';
}

function getTheme(id, isNight) {
  if (id >= 200 && id < 300) return 'thunder';
  if (id >= 300 && id < 600) return 'rain';
  if (id >= 600 && id < 700) return 'snow';
  if (id >= 700 && id < 800) return 'mist';
  if (id === 800 || id === 801) return isNight ? 'clear-night' : 'clear-day';
  return isNight ? 'clear-night' : 'clouds';
}

// shift a unix timestamp by the city's offset so UTC getters give us the city's local time
function toCityDate(unixSeconds, offsetSeconds) {
  return new Date((unixSeconds + offsetSeconds) * 1000);
}

function showLoading(on) {
  loader.classList.toggle('hidden', !on);
  searchBtn.disabled = on;
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove('hidden');
  result.classList.add('hidden');
}

// ---------- data ----------

async function fetchWeather(city) {
  const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

// the forecast comes in 3 hour steps, so group them by day first
function groupByDay(list, offset) {
  const days = {};
  list.forEach((item) => {
    const key = toCityDate(item.dt, offset).toISOString().slice(0, 10);
    if (!days[key]) days[key] = [];
    days[key].push(item);
  });
  return Object.entries(days).slice(0, 5);
}

// ---------- rendering ----------

function render(data) {
  const { current, forecast } = data;
  const offset = current.timezone;

  const isNight = current.dt < current.sys.sunrise || current.dt > current.sys.sunset;
  const cond = current.weather[0];

  document.body.dataset.theme = getTheme(cond.id, isNight);

  document.getElementById('cityName').textContent = `${current.name}, ${current.sys.country}`;
  document.getElementById('localTime').textContent =
    toCityDate(current.dt, offset).toLocaleString('en-US', {
      weekday: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'UTC'
    }) + ' (local time)';

  document.getElementById('icon').textContent = getIcon(cond.id, isNight);
  document.getElementById('temp').textContent = formatTemp(current.main.temp);
  document.getElementById('condition').textContent = cond.description;
  document.getElementById('feels').textContent = `Feels like ${formatTemp(current.main.feels_like)}`;

  document.getElementById('humidity').textContent = `${current.main.humidity}%`;
  document.getElementById('wind').textContent = `${Math.round(current.wind.speed * 3.6)} km/h`; // m/s -> km/h
  document.getElementById('pressure').textContent = `${current.main.pressure} hPa`;

  const days = groupByDay(forecast.list, offset);

  const cards = days.map(([dateKey, items]) => {
    const temps = items.map((i) => i.main.temp);
    const high = Math.max(...temps);
    const low = Math.min(...temps);

    // use the entry closest to midday for the icon, looks better than a night one
    const midday = items.reduce((best, i) => {
      const h = toCityDate(i.dt, offset).getUTCHours();
      const bestH = toCityDate(best.dt, offset).getUTCHours();
      return Math.abs(h - 12) < Math.abs(bestH - 12) ? i : best;
    });

    const name = new Date(`${dateKey}T00:00:00Z`).toLocaleDateString('en-US', {
      weekday: 'short', timeZone: 'UTC'
    });

    return `
      <div class="card day">
        <p class="name">${name}</p>
        <p class="d-icon">${getIcon(midday.weather[0].id, false)}</p>
        <p class="range">${formatTemp(high)} <small>${formatTemp(low)}</small></p>
      </div>`;
  });

  document.getElementById('forecast').innerHTML = cards.join('');

  errorBox.classList.add('hidden');
  result.classList.remove('hidden');
}

// ---------- events ----------

async function search() {
  const city = cityInput.value.trim();
  if (!city) {
    showError('Please type a city name first.');
    return;
  }

  errorBox.classList.add('hidden');
  showLoading(true);

  try {
    lastData = await fetchWeather(city);
    render(lastData);
    localStorage.setItem('lastCity', city);
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

searchBtn.addEventListener('click', search);
cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') search();
});

unitBtn.addEventListener('click', () => {
  useCelsius = !useCelsius;
  unitBtn.textContent = useCelsius ? '°C' : '°F';
  if (lastData) render(lastData);
});

// load the last searched city when the page opens
const saved = localStorage.getItem('lastCity');
if (saved) {
  cityInput.value = saved;
  search();
}

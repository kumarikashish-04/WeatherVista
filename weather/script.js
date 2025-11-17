// Replace with your OpenWeather API key
const API_KEY = "230d4a4f2117eb8411c83ff0c7ad602e";

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const cityNameEl = document.getElementById('cityName');
const tempEl = document.getElementById('temp');
const descEl = document.getElementById('description');
const iconEl = document.getElementById('weatherIcon');
const statsEl = document.getElementById('stats');
const card = document.getElementById('weatherCard');
const errCard = document.getElementById('errorCard');
const errorMsg = document.getElementById('errorMsg');
const unitsSelect = document.getElementById('units');
const geoBtn = document.getElementById('geoBtn');
const lastUpdated = document.getElementById('lastUpdated');
const timeLocal = document.getElementById('timeLocal');

function showError(msg){
  errCard.style.display='block';
  errorMsg.textContent = msg;
  card.style.display='none';
}
function hideError(){
  errCard.style.display='none';
}
function formatTimeFromUnix(unix, tzOffsetSec){
  // openweather returns timezone as seconds offset from UTC
  const d = new Date((unix + (tzOffsetSec || 0)) * 1000);
  return d.toLocaleString();
}
function setBackgroundByWeather(main){
  const page = document.getElementById('page');
  const m = (main || '').toLowerCase();
  if(m.includes('cloud')) page.style.background = "linear-gradient(180deg,#253244,#071025 90%)";
  else if(m.includes('rain') || m.includes('drizzle')) page.style.background = "linear-gradient(180deg,#1f2a3a,#07101a 90%)";
  else if(m.includes('snow')) page.style.background = "linear-gradient(180deg,#3b5a6a,#07101a 90%)";
  else page.style.background = "linear-gradient(180deg,#0b5266,#071026 90%)";
}
function iconFromCode(code){
  if(!code) return '❔';
  const c = code.slice(0,2);
  if(code.endsWith('d')){
    if(c==='01') return '☀️';
    if(c==='02') return '⛅';
    if(c==='03'||c==='04') return '☁️';
    if(c==='09'||c==='10') return '🌧️';
    if(c==='11') return '⛈️';
    if(c==='13') return '❄️';
    if(c==='50') return '🌫️';
  } else {
    if(c==='01') return '🌙';
    if(c==='02'||c==='03'||c==='04') return '☁️';
    if(c==='09'||c==='10') return '🌧️';
    if(c==='11') return '⛈️';
    if(c==='13') return '❄️';
    if(c==='50') return '🌫️';
  }
  return '🌤️';
}

const indianCities = ["delhi","mumbai","bangalore","kolkata","chennai","hyderabad"];

async function fetchWeatherByCity(city, units='metric'){
  if(!API_KEY || API_KEY === "YOUR_OPENWEATHER_API_KEY_HERE"){
    showError("Please set your OpenWeather API key in script.js.");
    return;
  }
  hideError();

  if(indianCities.includes(city.toLowerCase())){
    city += ",IN";
  }

  try{
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`;
    const res = await fetch(url);
    if(!res.ok){
      if(res.status === 404) throw new Error("City not found. Check spelling.");
      else if(res.status === 401) throw new Error("Invalid API key. Make sure your key is active.");
      else throw new Error("Network error: " + res.status);
    }
    const data = await res.json();
    renderWeather(data, units);
    localStorage.setItem('lastCity', city);
    localStorage.setItem('units', units);
  }catch(err){
    showError(err.message);
    console.error(err);
  }
}

async function fetchWeatherByCoords(lat, lon, units='metric'){
  if(!API_KEY || API_KEY === "YOUR_OPENWEATHER_API_KEY_HERE"){
    showError("Please set your OpenWeather API key in script.js.");
    return;
  }
  hideError();
  try{
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error("Unable to fetch for coordinates.");
    const data = await res.json();
    renderWeather(data, units);
    localStorage.setItem('lastCity', data.name);
    localStorage.setItem('units', units);
  }catch(err){
    showError(err.message);
    console.error(err);
  }
}

function renderWeather(data, units){
  if(!data) return;
  card.style.display='flex';
  hideError();
  const name = data.name + (data.sys?.country ? ", "+data.sys.country : "");
  cityNameEl.textContent = name;
  cityNameEl.title = "Click to copy";
  cityNameEl.onclick = () => { navigator.clipboard?.writeText(name); };
  const temp = Math.round(data.main.temp);
  const unitSymbol = units==='metric' ? '°C' : '°F';
  tempEl.textContent = `${temp}${unitSymbol}`;
  descEl.textContent = data.weather?.[0]?.description || '—';
  iconEl.textContent = iconFromCode(data.weather?.[0]?.icon);
  statsEl.innerHTML = `
    <div class="stat">Feels like: ${Math.round(data.main.feels_like)}${unitSymbol}</div>
    <div class="stat">Humidity: ${data.main.humidity}%</div>
    <div class="stat">Wind: ${Math.round(data.wind.speed)} ${units==='metric'?'m/s':'mph'}</div>
    <div class="stat">Pressure: ${data.main.pressure} hPa</div>
  `;
  timeLocal.textContent = formatTimeFromUnix(data.dt, data.timezone);
  lastUpdated.textContent = new Date().toLocaleString();
  setBackgroundByWeather(data.weather?.[0]?.main || '');
  if(window.innerWidth < 880) window.scrollTo({top:0, behavior:'smooth'});
}

searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if(!city){ showError("Please enter a city name."); return; }
  fetchWeatherByCity(city, unitsSelect.value);
});

cityInput.addEventListener('keydown', e => { if(e.key==='Enter') searchBtn.click(); });
unitsSelect.addEventListener('change', () => {
  const last = localStorage.getItem('lastCity');
  if(last) fetchWeatherByCity(last, unitsSelect.value);
});
geoBtn.addEventListener('click', () => {
  if(!navigator.geolocation){ showError("Geolocation not supported."); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    const {latitude, longitude} = pos.coords;
    fetchWeatherByCoords(latitude, longitude, unitsSelect.value);
  }, err => { showError("Permission denied or unable to get location."); });
});

window.addEventListener('load', () => {
  const last = localStorage.getItem('lastCity');
  const savedUnits = localStorage.getItem('units');
  if(savedUnits) unitsSelect.value = savedUnits;
  if(last){
    cityInput.value = last;
    fetchWeatherByCity(last, unitsSelect.value);
  }
});

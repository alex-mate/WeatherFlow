// ==================== HEADER ====================
const headerClockDisplay = document.getElementById("header-clock-display");
const weatherLastUpdatedTime = document.getElementById(
  "weather-last-updated-time",
);
const searchCityInput = document.getElementById("search-city-input");

// ==================== MAIN WEATHER DISPLAY ====================
const weatherMainDisplay = document.getElementById("weather-main-display");
const weatherConditionBadge = document.getElementById(
  "weather-condition-badge",
);
const conditionText = document.getElementById("condition-text");
const temperatureDisplay = document.getElementById("temperature-display");
const currentTemperature = document.getElementById("current-temperature");
const feelsLikeRow = document.getElementById("feels-like-row");
const feelsLikeTemp = document.getElementById("feels-like-temp");
const windDescription = document.getElementById("wind-description");

// ==================== TEMPERATURE RANGE ====================
const tempRangeContainer = document.getElementById("temp-range-container");
const highTempItem = document.getElementById("high-temp-item");
const highTempValue = document.getElementById("high-temp-value");
const lowTempItem = document.getElementById("low-temp-item");
const lowTempValue = document.getElementById("low-temp-value");

// ==================== QUICK STATS ====================
const weatherQuickStats = document.getElementById("weather-quick-stats");
const quickStatsGrid = document.getElementById("quick-stats-grid");

// Humidity Stats
const statHumidity = document.getElementById("stat-humidity");
const statHumidityValue = document.getElementById("stat-humidity-value");
const statHumiditySubtext = document.getElementById("stat-humidity-subtext");

// Wind Stats
const statWind = document.getElementById("stat-wind");
const statWindValue = document.getElementById("stat-wind-value");
const statWindSubtext = document.getElementById("stat-wind-subtext");

// Visibility Stats
const statVisibility = document.getElementById("stat-visibility");
const statVisibilityValue = document.getElementById("stat-visibility-value");
const statVisibilitySubtext = document.getElementById(
  "stat-visibility-subtext",
);

// Pressure Stats
const statPressure = document.getElementById("stat-pressure");
const statPressureValue = document.getElementById("stat-pressure-value");
const statPressureSubtext = document.getElementById("stat-pressure-subtext");

// ==================== SECTIONS ====================
const mainContentWrapper = document.getElementById("main-content-wrapper");
const hourlySection = document.getElementById("hourly-section");
const hourlyForecastCarousel = document.getElementById(
  "hourly-forecast-carousel",
);
const forecastSection = document.getElementById("forecast-section");
const weeklyForecastContainer = document.getElementById(
  "weekly-forecast-container",
);
const conditionsSection = document.getElementById("conditions-section");
const conditionsGridContainer = document.getElementById(
  "conditions-grid-container",
);

// ==================== DETAIL CARDS - HUMIDITY ====================
const detailHumidity = document.getElementById("detail-humidity");
const detailHumidityValue = document.getElementById("detail-humidity-value");
const detailHumidityBar = document.getElementById("detail-humidity-bar");
const detailHumiditySubtext = document.getElementById(
  "detail-humidity-subtext",
);

// ==================== DETAIL CARDS - UV ====================
const detailUv = document.getElementById("detail-uv");
const detailUvValue = document.getElementById("detail-uv-value");
const detailUvLevel = document.getElementById("detail-uv-level");
const detailUvBar = document.getElementById("detail-uv-bar");
const detailUvSubtext = document.getElementById("detail-uv-subtext");

// ==================== DETAIL CARDS - WIND ====================
const detailWind = document.getElementById("detail-wind");
const detailWindValue = document.getElementById("detail-wind-value");
const windCompassContainer = document.getElementById("wind-compass-container");
const windCompass = document.getElementById("wind-compass");
const compassNeedle = document.getElementById("compass-needle");
const compassLabels = document.getElementById("compass-labels");
const compassDirection = document.getElementById("compass-direction");
const windGusts = document.getElementById("wind-gusts");

// ==================== DETAIL CARDS - PRESSURE ====================
const detailPressure = document.getElementById("detail-pressure");
const detailPressureValue = document.getElementById("detail-pressure-value");
const detailPressureBar = document.getElementById("detail-pressure-bar");
const detailPressureSubtext = document.getElementById(
  "detail-pressure-subtext",
);

// ==================== DETAIL CARDS - VISIBILITY ====================
const detailVisibility = document.getElementById("detail-visibility");
const detailVisibilityValue = document.getElementById(
  "detail-visibility-value",
);
const detailVisibilityBar = document.getElementById("detail-visibility-bar");
const detailVisibilitySubtext = document.getElementById(
  "detail-visibility-subtext",
);

// ==================== DETAIL CARDS - PRECIPITATION ====================
const detailPrecipitation = document.getElementById("detail-precipitation");
const detailPrecipitationValue = document.getElementById(
  "detail-precipitation-value",
);
const detailPrecipitationBar = document.getElementById(
  "detail-precipitation-bar",
);
const detailPrecipitationSubtext = document.getElementById(
  "detail-precipitation-subtext",
);

// ==================== DETAIL CARDS - SUN ====================
const detailSun = document.getElementById("detail-sun");
const sunPositionArc = document.getElementById("sun-position-arc");
const sunriseInfo = document.getElementById("sunrise-info");
const sunriseTime = document.getElementById("sunrise-time");
const sunsetInfo = document.getElementById("sunset-info");
const sunsetTime = document.getElementById("sunset-time");
const daylightInfo = document.getElementById("daylight-info");

// ==================== FOOTER ====================
const footerTime = document.getElementById("footer-time");

const weatherCodes = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  61: "Rain",
  71: "Snow",
};

function updateClock() {
  const now = new Date();
  const t = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  headerClockDisplay.textContent = t.toUpperCase();
  document.getElementById("weather-last-updated-time").textContent =
    now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  document.getElementById("footer-time").textContent = now.toLocaleDateString(
    "en-GB",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  );
}
updateClock();
setInterval(updateClock, 30000);

function searchCity() {
  const val = searchCityInput.value.trim();
  if (!val) return;

  fetchCityWeather(val);
  searchCityInput.value = "";
  searchCityInput.blur();
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const weather = await getWeather(latitude, longitude);
        updateSearchLocationDisplay("Your location");
        updateWeatherDisplay(weather, { name: "Current Location" });
      } catch (error) {
        console.error(error);
        alert("Unable to retrieve weather for your location.");
      }
    },
    (error) => {
      console.error(error);
      alert("Unable to access your location. Please allow location access.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    },
  );
}

function updateSearchLocationDisplay(city) {
  const locationDisplay = document.querySelector(".current-location-display");
  if (!locationDisplay) return;

  const textNode = Array.from(locationDisplay.childNodes).find(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
  );

  if (textNode) {
    textNode.textContent = " " + city;
  } else {
    locationDisplay.appendChild(document.createTextNode(" " + city));
  }

  const footerFirstSpan = document.querySelector("footer > span:first-child");
  if (footerFirstSpan) {
    footerFirstSpan.textContent = `Weather Flow · ${city}`;
  }
}

searchCityInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") searchCity();
});

async function getCoordinates(city) {
  const query = encodeURIComponent(city);
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1`,
  );

  if (!res.ok) {
    throw new Error(`Geocoding request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.results?.[0];
}

async function getWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
    `&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,wind_speed_10m` +
    `&hourly=temperature_2m,precipitation_probability,relative_humidity_2m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
    `&forecast_days=7`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather request failed: ${res.status}`);
  }

  return await res.json();
}

async function fetchCityWeather(city) {
  const location = await getCoordinates(city);

  if (!location) {
    alert(`City not found: ${city}`);
    return;
  }

  try {
    const weather = await getWeather(location.latitude, location.longitude);
    console.log(weather);
    updateSearchLocationDisplay(location.name || city);
    updateWeatherDisplay(weather, location);
  } catch (error) {
    console.error(error);
    alert("Unable to retrieve weather data at this time.");
  }
}

function updateWeatherDisplay(weather, location) {
  if (!weather || !weather.current_weather) return;

  const current = weather.current_weather;
  console.log("Current Weather:", weather.current);
  const temperature = Math.round(current.temperature);

  conditionText.textContent = weatherCodes[current.weathercode] || "Unknown";
  currentTemperature.textContent = `${temperature}`;
  feelsLikeTemp.textContent = `${temperature}°C`;
  windDescription.textContent = `${Math.round(current.windspeed)} km/h`;
  highTempValue.textContent = `${temperature + 1}°`;
  lowTempValue.textContent = `${temperature - 2}°`;

  statHumidityValue.textContent = `${Math.round(current.relative_humidity)}%`;
  statWindValue.textContent = `${Math.round(current.windspeed)} km/h`;
  statVisibilityValue.textContent = ` km`;
  statPressureValue.textContent = `${Math.round(current.pressure_msl)} hPa`;

  weatherLastUpdatedTime.textContent = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

import { weatherCodes } from "./weather-codes.js";
import { weatherIconsDay } from "./weather-icons-day.js";
import { weatherIconsNight } from "./weather-icons-night.js";

const currentTemperature = document.getElementById("current-temperature");
const currentWeatherDescription = document.getElementById(
  "current-weather-description",
);
const currentWindSpeed = document.getElementById("current-wind-speed");
const currentWindDirection = document.getElementById("current-wind-direction");
const currentWindBearing = document.getElementById("current-wind-bearing");
const windCompass = document.getElementById("wind-compass");
const windCompassNeedle = document.getElementById("wind-compass-needle");
const currentHumidity = document.getElementById("current-humidity");
const currentWeatherIcon = document.getElementById("current-weather-icon");
const locationElement = document.getElementById("location");

const feelsLikeTemperature = document.getElementById(
  "current-weather-feels-like",
);
const currentPressure = document.getElementById("current-weather-pressure");
const lowTemperature = document.getElementById("current-weather-low");
const highTemperature = document.getElementById("current-weather-high");
const precipitationProbability = document.getElementById(
  "current-weather-precipitation",
);
const lastUpdated = document.getElementById("last-updated");
const sunriseTime = document.getElementById("sunrise-time");
const sunsetTime = document.getElementById("sunset-time");
const uvIndex = document.getElementById("current-weather-uv-index");

const hourlyForecastContainer = document.getElementById("hourly-display");
const hourlyCards = document.getElementById("hourly-cards");
const weeklyForecastContainer = document.getElementById("weekly-forecast");
const weeklyCards = document.getElementById("week-cards");

export function updateWeatherUI(weatherData) {
  const current = weatherData.current;
  const daily = weatherData.daily;
  const hourly = weatherData.hourly;

  currentTemperature.textContent = `${Math.round(current.temperature_2m)}°C`;

  currentWeatherDescription.textContent =
    weatherCodes[current.weather_code] || "Unknown Weather";

  const windSpeed =
    current.wind_speed_10m != null ? Math.round(current.wind_speed_10m) : null;
  const windDirection = current.wind_direction_10m;
  const windDirectionLabel = getWindDirectionLabel(windDirection);

  currentWindSpeed.textContent = windSpeed != null ? `${windSpeed} km/h` : "--";
  currentWindDirection.textContent = windDirectionLabel;
  currentWindBearing.textContent =
    windDirection != null
      ? `${Math.round(windDirection)}° from ${windDirectionLabel}`
      : "Direction unavailable";

  if (windDirection != null) {
    windCompassNeedle.style.setProperty(
      "--wind-direction",
      `${Math.round(windDirection)}deg`,
    );
    windCompass.setAttribute(
      "aria-label",
      `Wind ${windSpeed ?? "--"} km/h from ${windDirectionLabel}`,
    );
  } else {
    windCompassNeedle.style.setProperty("--wind-direction", "0deg");
    windCompass.setAttribute("aria-label", "Wind direction unavailable");
  }

  currentHumidity.textContent = `${current.relative_humidity_2m}%`;

  const currentTimeISO = current.time || new Date().toISOString();
  const currentSunTimes = getSunTimesForDate(currentTimeISO, daily);
  const isCurrentDaytime = isDaytime(
    currentTimeISO,
    currentSunTimes.sunrise,
    currentSunTimes.sunset,
  );

  updateWeatherBackground(current.weather_code, isCurrentDaytime);

  const currentIconPath = getWeatherIcon(
    current.weather_code,
    currentTimeISO,
    currentSunTimes.sunrise,
    currentSunTimes.sunset,
    getEventIconForTime(currentTimeISO, daily),
  );
  currentWeatherIcon.src = currentIconPath;

  feelsLikeTemperature.textContent = `${Math.round(
    current.apparent_temperature,
  )}°C`;

  currentPressure.textContent = `${Math.round(current.pressure_msl)} hPa`;

  lowTemperature.textContent = daily?.temperature_2m_min
    ? `${Math.round(daily.temperature_2m_min[0])}°C`
    : "--";

  highTemperature.textContent = daily?.temperature_2m_max
    ? `${Math.round(daily.temperature_2m_max[0])}°C`
    : "--";

  precipitationProbability.textContent = hourly?.precipitation_probability
    ? `${Math.round(hourly.precipitation_probability[0])}%`
    : "--";

  const uvValue = daily?.uv_index_max?.[0];
  uvIndex.textContent =
    uvValue != null ? `${uvValue} ${getUVLevel(uvValue)}` : "--";

  lastUpdated.textContent = new Date().toLocaleTimeString(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  sunriseTime.textContent = daily?.sunrise
    ? new Date(daily.sunrise[0]).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--";

  sunsetTime.textContent = daily?.sunset
    ? new Date(daily.sunset[0]).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--";
}

export function updateLocationUI(city, country) {
  locationElement.textContent = country ? `${city}, ${country}` : city;
}

export function updateHourlyForecast(hourly, daily) {
  hourlyCards.innerHTML = "";

  const startIndex = hourly.time.findIndex(
    (time) => new Date(time).getTime() >= Date.now(),
  );
  const firstIndex = startIndex >= 0 ? startIndex : 0;
  const lastIndex = Math.min(firstIndex + 24, hourly.time.length);

  for (let i = firstIndex; i < lastIndex; i++) {
    const forecastTime = new Date(hourly.time[i]);
    const forecastTimeStr = forecastTime.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const isNow = i === firstIndex;

    let specialEvent = "";
    const eventIcon = getEventIconForTime(hourly.time[i], daily);

    if (eventIcon === "sunrise.svg") {
      specialEvent = "🌅 Sunrise";
    } else if (eventIcon === "sunset.svg") {
      specialEvent = "🌇 Sunset";
    }

    const sunTimes = getSunTimesForDate(hourly.time[i], daily);
    const weatherIcon = getWeatherIcon(
      hourly.weather_code[i],
      hourly.time[i],
      sunTimes.sunrise,
      sunTimes.sunset,
      eventIcon,
    );

    const precipitationText = hourly?.precipitation_probability
      ? `Precip: ${Math.round(hourly.precipitation_probability[i])}%`
      : "";

    const card = document.createElement("div");
    card.className = `hourly-forecast-card${isNow ? " now" : ""}`;
    card.innerHTML = `
      <p class="hourly-time-label">${isNow ? "Now" : forecastTimeStr}</p>
      <img class="hourly-weather-icon" src="${weatherIcon}" alt="${weatherCodes[hourly.weather_code[i]] || "Weather Icon"}" />
      <p class="hourly-temperature">${Math.round(hourly.temperature_2m[i])}°C</p>
      <p class="hourly-rain-probability">${specialEvent || precipitationText}</p>
    `;

    hourlyCards.appendChild(card);
  }
}

export function updateWeeklyForecast(daily) {
  weeklyCards.innerHTML = "";

  const daysToShow = Math.min(10, daily.time.length);
  const weekLowTemps = daily.temperature_2m_min.slice(0, daysToShow);
  const weekHighTemps = daily.temperature_2m_max.slice(0, daysToShow);
  const minTemp = Math.min(...weekLowTemps);
  const maxTemp = Math.max(...weekHighTemps);

  for (let i = 0; i < daysToShow; i++) {
    const dayName = new Date(daily.time[i]).toLocaleDateString("en-GB", {
      weekday: "short",
    });
    const weatherIcon = getWeatherIcon(
      daily.weather_code[i],
      daily.sunrise?.[i] || `${daily.time[i]}T12:00`,
      daily.sunrise?.[i],
      daily.sunset?.[i],
    );
    const highTemp = Math.round(daily.temperature_2m_max[i]);
    const lowTemp = Math.round(daily.temperature_2m_min[i]);
    const rangePercent =
      maxTemp !== minTemp
        ? ((highTemp - minTemp) / (maxTemp - minTemp)) * 100
        : 50;

    const row = document.createElement("div");
    row.className = "daily-forecast-row";
    row.innerHTML = `
      <div class="forecast-day-label">${dayName}</div>
      <div class="forecast-weather-icon">
        <img src="${weatherIcon}" alt="${weatherCodes[daily.weather_code[i]] || "Weather Icon"}" />
      </div>
      <div class="forecast-description">${weatherCodes[daily.weather_code[i]] || ""}</div>
      <div class="temperature-range-bar-track">
        <div class="temperature-range-bar-fill" style="width: ${rangePercent}%;"></div>
      </div>
      <div class="forecast-high-temp">${highTemp}°C</div>
      <div class="forecast-low-temp">${lowTemp}°C</div>
    `;

    weeklyCards.appendChild(row);
  }
}

function getWeatherIcon(
  weatherCode,
  timeISO,
  sunriseISO,
  sunsetISO,
  overrideIcon,
) {
  if (overrideIcon) {
    return getIconPath(overrideIcon);
  }

  const iconFile = getIconFile(weatherCode, timeISO, sunriseISO, sunsetISO);
  return getIconPath(iconFile);
}

function getIconFile(weatherCode, timeISO, sunriseISO, sunsetISO) {
  if (weatherCode == null) {
    return "";
  }

  const isDay = isDaytime(timeISO, sunriseISO, sunsetISO);
  if (isDay) {
    return weatherIconsDay[weatherCode] || weatherIconsNight[weatherCode] || "";
  }

  return weatherIconsNight[weatherCode] || weatherIconsDay[weatherCode] || "";
}

function isDaytime(timeISO, sunriseISO, sunsetISO) {
  if (!timeISO || !sunriseISO || !sunsetISO) {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
  }

  const time = new Date(timeISO);
  const sunrise = new Date(sunriseISO);
  const sunset = new Date(sunsetISO);

  return time >= sunrise && time < sunset;
}

function getSunTimesForDate(timeISO, daily) {
  const fallbackSunTimes = {
    sunrise: daily?.sunrise?.[0],
    sunset: daily?.sunset?.[0],
  };

  if (!timeISO || !daily?.time?.length) {
    return fallbackSunTimes;
  }

  const dayIndex = daily.time.findIndex((day) => day === timeISO.slice(0, 10));

  if (dayIndex < 0) {
    return fallbackSunTimes;
  }

  return {
    sunrise: daily.sunrise?.[dayIndex] ?? fallbackSunTimes.sunrise,
    sunset: daily.sunset?.[dayIndex] ?? fallbackSunTimes.sunset,
  };
}

function getEventIconForTime(timeISO, daily) {
  if (!timeISO || !daily) {
    return "";
  }

  if (daily.sunrise?.some((sunriseISO) => isInEventHour(timeISO, sunriseISO))) {
    return "sunrise.svg";
  }

  if (daily.sunset?.some((sunsetISO) => isInEventHour(timeISO, sunsetISO))) {
    return "sunset.svg";
  }

  return "";
}

function isInEventHour(timeISO, eventISO) {
  if (!eventISO) {
    return false;
  }

  const time = new Date(timeISO);
  const event = new Date(eventISO);

  if (Number.isNaN(time.getTime()) || Number.isNaN(event.getTime())) {
    return false;
  }

  const eventHourStart = new Date(event);
  eventHourStart.setMinutes(0, 0, 0);

  const eventHourEnd = new Date(eventHourStart);
  eventHourEnd.setHours(eventHourEnd.getHours() + 1);

  return time >= eventHourStart && time < eventHourEnd;
}

function getWindDirectionLabel(degrees) {
  if (degrees == null || Number.isNaN(Number(degrees))) {
    return "--";
  }

  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(Number(degrees) / 22.5) % directions.length;

  return directions[index];
}

function getIconPath(iconFile) {
  return iconFile ? `assets/icons/${iconFile}` : "";
}

function updateWeatherBackground(weatherCode, isCurrentDaytime) {
  document.body.dataset.weatherTheme = getWeatherTheme(weatherCode);
  document.body.dataset.dayPeriod = isCurrentDaytime ? "day" : "night";
}

function getWeatherTheme(weatherCode) {
  if (weatherCode == null) {
    return "cloudy";
  }

  const code = Number(weatherCode);

  if (Number.isNaN(code)) {
    return "cloudy";
  }

  if ([95, 96, 99].includes(code)) return "storm";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "rain";
  }
  if ([45, 48].includes(code)) return "fog";
  if ([2, 3].includes(code)) return "cloudy";
  if ([0, 1].includes(code)) return "clear";

  return "cloudy";
}

function getUVLevel(uv) {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

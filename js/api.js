export async function getWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
    `&longitude=${lon}` +
    `&timezone=auto` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m` +
    `&hourly=temperature_2m,precipitation_probability,relative_humidity_2m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max` +
    `&forecast_days=10`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather request failed: ${res.status}`);
  }

  return await res.json();
}

export async function reverseGeocode(lat, lon) {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}` +
    `&longitude=${lon}&localityLanguage=en`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Location lookup failed: ${response.status}`);
  }

  const data = await response.json();
  const city =
    data.city ||
    data.locality ||
    data.principalSubdivision ||
    data.localityInfo?.administrative?.[0]?.name;

  if (!city && !data.countryName) {
    return null;
  }

  return {
    name: city || "My Location",
    country: formatCountryName(data.countryName),
  };
}

function formatCountryName(countryName) {
  const countryNames = {
    "United Kingdom of Great Britain and Northern Ireland (the)": "United Kingdom",
    "United States of America (the)": "United States",
  };

  return countryNames[countryName] || countryName || "";
}

export async function searchCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.results?.length) {
    throw new Error("City not found");
  }

  const { latitude, longitude } = data.results[0];

  const weatherData = await getWeather(latitude, longitude);

  return {
    weatherData,
    city: data.results[0].name,
    country: data.results[0].country,
    latitude,
    longitude,
  };
}

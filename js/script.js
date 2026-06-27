import {
  searchCity as fetchCityByName,
  getWeather,
  reverseGeocode,
} from "./api.js";
import {
  updateWeatherUI,
  updateLocationUI,
  updateHourlyForecast,
  updateWeeklyForecast,
} from "./ui.js";

const searchCityInput = document.getElementById("search-city-input");
const searchCityButton = document.getElementById("search-city-button");
const useLocationButton = document.getElementById("use-location-button");
const favoriteCurrentButton = document.getElementById(
  "favorite-current-button",
);
const savedLocationsPanel = document.getElementById("saved-locations-panel");
const favoritesGroup = document.getElementById("favorites-group");
const recentSearchesGroup = document.getElementById("recent-searches-group");
const favoritesList = document.getElementById("favorites-list");
const recentSearchesList = document.getElementById("recent-searches-list");
const loadingOverlay = document.getElementById("loading-overlay");
const loadingText = document.getElementById("loading-text");
const errorBanner = document.getElementById("error-banner");

const STORAGE_KEYS = {
  favorites: "weatherflow:favorites",
  recentSearches: "weatherflow:recent-searches",
};
const MAX_FAVORITES = 8;
const MAX_RECENT_SEARCHES = 6;

let favoriteLocations = readStoredLocations(STORAGE_KEYS.favorites);
let recentSearches = readStoredLocations(STORAGE_KEYS.recentSearches);
let currentLocation = null;
let isLoadingWeather = false;

renderSavedLocations();
loadCurrentLocation({ isInitialLoad: true });

searchCityInput.addEventListener("keydown", async (event) => {
  if (event.key === "Enter") {
    await handleSearch();
  }
});

searchCityButton.addEventListener("click", async () => {
  await handleSearch();
});

useLocationButton.addEventListener("click", async () => {
  await loadCurrentLocation();
});

favoriteCurrentButton.addEventListener("click", () => {
  if (!currentLocation || isLoadingWeather) return;

  if (isFavorite(currentLocation)) {
    removeFavorite(currentLocation);
  } else {
    addFavorite(currentLocation);
  }

  renderSavedLocations();
});

async function handleSearch() {
  const city = searchCityInput.value.trim();
  if (!city) return;

  hideError();
  setLoading(true, "Loading weather...");
  try {
    const result = await fetchCityByName(city);
    applyWeatherResult(result);
    addRecentSearch(currentLocation);
    renderSavedLocations();
  } catch (error) {
    const message = error?.message
      ? `Could not load weather for "${city}": ${error.message}`
      : `Could not load weather for "${city}". Please try again.`;
    showError(message);
    console.error(error);
  } finally {
    setLoading(false);
  }
}

async function loadSavedLocation(location) {
  hideError();
  setLoading(true, `Loading weather for ${formatLocation(location)}...`);
  try {
    const weatherData = await getWeather(location.latitude, location.longitude);
    applyWeatherResult({
      weatherData,
      city: location.city,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    addRecentSearch(currentLocation);
    renderSavedLocations();
  } catch (error) {
    const label = formatLocation(location);
    const message = error?.message
      ? `Could not load weather for "${label}": ${error.message}`
      : `Could not load weather for "${label}". Please try again.`;
    showError(message);
    console.error(error);
  } finally {
    setLoading(false);
  }
}

async function loadCurrentLocation(options = {}) {
  if (!navigator.geolocation) {
    showError("Your browser does not support location access.");
    return;
  }

  hideError();
  setLoading(
    true,
    options.isInitialLoad
      ? "Finding your local weather..."
      : "Updating from your location...",
  );

  try {
    const position = await getCurrentPosition();
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const weatherData = await getWeather(latitude, longitude);
    const place = await reverseGeocode(latitude, longitude).catch(() => null);

    applyWeatherResult({
      weatherData,
      city: place?.name || "My Location",
      country: place?.country || "",
      latitude,
      longitude,
    });
    renderSavedLocations();
  } catch (error) {
    showError(getLocationErrorMessage(error));
    console.error(error);
  } finally {
    setLoading(false);
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 10 * 60 * 1000,
      timeout: 12000,
    });
  });
}

function getLocationErrorMessage(error) {
  if (error?.code === 1) {
    return "Location access was blocked. Allow location access or search for a city.";
  }

  if (error?.code === 2) {
    return "Your location is unavailable right now. Search for a city instead.";
  }

  if (error?.code === 3) {
    return "Location lookup timed out. Try again or search for a city.";
  }

  return error?.message
    ? `Could not load weather for your location: ${error.message}`
    : "Could not load weather for your location.";
}

function applyWeatherResult(result) {
  currentLocation = createLocation(result);
  updateWeatherUI(result.weatherData);
  updateLocationUI(result.city, result.country);
  updateHourlyForecast(result.weatherData.hourly, result.weatherData.daily);
  updateWeeklyForecast(result.weatherData.daily);
  updateFavoriteButton();
}

function addRecentSearch(location) {
  recentSearches = upsertLocation(
    recentSearches,
    location,
    MAX_RECENT_SEARCHES,
  );
  saveStoredLocations(STORAGE_KEYS.recentSearches, recentSearches);
}

function addFavorite(location) {
  favoriteLocations = upsertLocation(favoriteLocations, location, MAX_FAVORITES);
  saveStoredLocations(STORAGE_KEYS.favorites, favoriteLocations);
}

function removeFavorite(location) {
  const locationId = getLocationId(location);
  favoriteLocations = favoriteLocations.filter((item) => item.id !== locationId);
  saveStoredLocations(STORAGE_KEYS.favorites, favoriteLocations);
}

function renderSavedLocations() {
  renderLocationList(favoritesList, favoriteLocations, { removable: true });
  renderLocationList(recentSearchesList, recentSearches, { removable: false });

  favoritesGroup.hidden = favoriteLocations.length === 0;
  recentSearchesGroup.hidden = recentSearches.length === 0;
  savedLocationsPanel.classList.toggle(
    "hidden",
    favoriteLocations.length === 0 && recentSearches.length === 0,
  );
  savedLocationsPanel.classList.toggle("is-loading", isLoadingWeather);

  updateFavoriteButton();
}

function renderLocationList(container, locations, options) {
  container.innerHTML = "";

  locations.forEach((location) => {
    const chip = document.createElement("div");
    chip.className = "saved-location-chip";

    const loadButton = document.createElement("button");
    loadButton.type = "button";
    loadButton.className = "saved-location-load";
    loadButton.disabled = isLoadingWeather;
    loadButton.textContent = formatLocation(location);
    loadButton.addEventListener("click", async () => {
      await loadSavedLocation(location);
    });
    chip.appendChild(loadButton);

    if (options.removable) {
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "saved-location-remove";
      removeButton.disabled = isLoadingWeather;
      removeButton.setAttribute(
        "aria-label",
        `Remove ${formatLocation(location)} from favorites`,
      );
      removeButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18"></path>
        </svg>
      `;
      removeButton.addEventListener("click", () => {
        removeFavorite(location);
        renderSavedLocations();
      });
      chip.appendChild(removeButton);
    }

    container.appendChild(chip);
  });
}

function readStoredLocations(key) {
  try {
    const locations = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(locations)) return [];
    return locations.map(normalizeLocation).filter(Boolean);
  } catch (error) {
    console.warn(`Unable to read ${key}`, error);
    return [];
  }
}

function saveStoredLocations(key, locations) {
  try {
    localStorage.setItem(key, JSON.stringify(locations));
  } catch (error) {
    console.warn(`Unable to save ${key}`, error);
  }
}

function upsertLocation(locations, location, maxItems) {
  const normalizedLocation = normalizeLocation(location);
  if (!normalizedLocation) return locations;

  return [
    normalizedLocation,
    ...locations.filter((item) => item.id !== normalizedLocation.id),
  ].slice(0, maxItems);
}

function createLocation(result) {
  return normalizeLocation({
    city: result.city,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
  });
}

function normalizeLocation(location) {
  if (!location?.city || location.latitude == null || location.longitude == null) {
    return null;
  }

  const normalizedLocation = {
    city: String(location.city),
    country: location.country ? String(location.country) : "",
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
  };

  normalizedLocation.id = location.id || getLocationId(normalizedLocation);
  return normalizedLocation;
}

function getLocationId(location) {
  const city = String(location.city || "").trim().toLowerCase();
  const country = String(location.country || "").trim().toLowerCase();
  const latitude = Number(location.latitude).toFixed(4);
  const longitude = Number(location.longitude).toFixed(4);

  return `${city}|${country}|${latitude}|${longitude}`;
}

function formatLocation(location) {
  return location.country ? `${location.city}, ${location.country}` : location.city;
}

function isFavorite(location) {
  const locationId = getLocationId(location);
  return favoriteLocations.some((item) => item.id === locationId);
}

function updateFavoriteButton() {
  const hasCurrentLocation = Boolean(currentLocation);
  const currentIsFavorite = hasCurrentLocation && isFavorite(currentLocation);
  const label = hasCurrentLocation
    ? `${currentIsFavorite ? "Remove" : "Add"} ${formatLocation(
        currentLocation,
      )} ${currentIsFavorite ? "from" : "to"} favorites`
    : "Add current city to favorites";

  favoriteCurrentButton.disabled = !hasCurrentLocation || isLoadingWeather;
  favoriteCurrentButton.classList.toggle("is-favorite", currentIsFavorite);
  favoriteCurrentButton.setAttribute("aria-label", label);
  favoriteCurrentButton.setAttribute("aria-pressed", String(currentIsFavorite));
  favoriteCurrentButton.title = label;
}

function setLoading(isLoading, message = "Loading weather...") {
  isLoadingWeather = isLoading;
  loadingText.textContent = message;
  loadingOverlay.classList.toggle("hidden", !isLoading);
  searchCityInput.disabled = isLoading;
  searchCityButton.disabled = isLoading;
  useLocationButton.disabled = isLoading;
  searchCityButton.style.opacity = isLoading ? "0.6" : "1";
  useLocationButton.style.opacity = isLoading ? "0.6" : "1";
  savedLocationsPanel.classList.toggle("is-loading", isLoading);
  setSavedLocationButtonsDisabled(isLoading);
  updateFavoriteButton();
}

function setSavedLocationButtonsDisabled(isDisabled) {
  document
    .querySelectorAll(".saved-location-load, .saved-location-remove")
    .forEach((button) => {
      button.disabled = isDisabled;
    });
}

function showError(message) {
  if (!errorBanner) return;
  errorBanner.textContent = message;
  errorBanner.classList.remove("hidden");
}

function hideError() {
  if (!errorBanner) return;
  errorBanner.classList.add("hidden");
  errorBanner.textContent = "";
}

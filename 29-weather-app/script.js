/**
 * Configuration & DOM Elements
 */
const API_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const GEO_API_URL = "https://geocoding-api.open-meteo.com/v1/search";

const elements = {
  form: document.getElementById("search-form"),
  input: document.getElementById("city-input"),
  geoBtn: document.getElementById("geo-btn"),
  card: document.getElementById("weather-card"),
  loading: document.getElementById("loading-state"),
  error: document.getElementById("error-state"),
  errMsg: document.getElementById("error-message"),

  // Output Elements
  cityName: document.getElementById("city-name"),
  country: document.getElementById("country-code"),
  temp: document.getElementById("temperature"),
  condition: document.getElementById("condition-text"),
  icon: document.getElementById("weather-icon"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind-speed"),
};

/**
 * WMO Weather Code to Description & Icon Mapping
 * Open-Meteo returns numeric codes (0-99).
 */
const getWeatherDescription = (code) => {
  // Map codes to simplistic descriptions and emojis
  const weatherCodes = {
    0: { desc: "Clear Sky", icon: "☀️" },
    1: { desc: "Mainly Clear", icon: "🌤️" },
    2: { desc: "Partly Cloudy", icon: "⛅" },
    3: { desc: "Overcast", icon: "☁️" },
    45: { desc: "Fog", icon: "🌫️" },
    48: { desc: "Depositing Rime Fog", icon: "🌫️" },
    51: { desc: "Light Drizzle", icon: "🌦️" },
    53: { desc: "Moderate Drizzle", icon: "🌧️" },
    55: { desc: "Dense Drizzle", icon: "🌧️" },
    61: { desc: "Slight Rain", icon: "🌧️" },
    63: { desc: "Moderate Rain", icon: "🌧️" },
    65: { desc: "Heavy Rain", icon: "⛈️" },
    71: { desc: "Slight Snow", icon: "🌨️" },
    73: { desc: "Moderate Snow", icon: "🌨️" },
    75: { desc: "Heavy Snow", icon: "❄️" },
    95: { desc: "Thunderstorm", icon: "⚡" },
    96: { desc: "Thunderstorm with Hail", icon: "⛈️" },
    99: { desc: "Heavy Thunderstorm", icon: "⛈️" },
  };
  return weatherCodes[code] || { desc: "Unknown", icon: "❓" };
};

/**
 * Update UI Helper
 * Uses the View Transitions API if available for smoother updates.
 */
function updateUI(data) {
  const updateDOM = () => {
    // Hide loading/error, show card
    elements.loading.classList.add("hidden");
    elements.error.classList.add("hidden");
    elements.card.classList.remove("hidden");

    // Populate Data
    elements.cityName.textContent = data.city;
    elements.country.textContent = data.country;

    // Format numbers using Intl for localization
    const numberFormat = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
    });
    elements.temp.textContent = numberFormat.format(data.temp);
    elements.humidity.textContent = `${data.humidity}%`;
    elements.wind.textContent = `${data.wind} km/h`;

    // Weather Condition
    const info = getWeatherDescription(data.code);
    elements.condition.textContent = info.desc;
    elements.icon.textContent = info.icon;
  };

  // Use View Transitions API if supported
  if (document.startViewTransition) {
    document.startViewTransition(updateDOM);
  } else {
    updateDOM();
  }
}

function showError(message) {
  elements.loading.classList.add("hidden");
  elements.card.classList.add("hidden");
  elements.error.classList.remove("hidden");
  elements.errMsg.textContent = message;
}

function showLoading() {
  elements.card.classList.add("hidden");
  elements.error.classList.add("hidden");
  elements.loading.classList.remove("hidden");
}

/**
 * Core Logic: Fetch Weather
 * 1. Get Lat/Lon (Geocoding) -> 2. Get Weather
 */
async function fetchWeather(query) {
  showLoading();

  try {
    // Step 1: Geocoding (Get Lat/Lon from City Name)
    // If query is an object (lat/lon), skip this step
    let lat, lon, name, country;

    if (typeof query === "string") {
      const geoRes = await fetch(
        `${GEO_API_URL}?name=${query}&count=1&language=en&format=json`,
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("City not found. Please try again.");
      }

      const location = geoData.results[0];
      lat = location.latitude;
      lon = location.longitude;
      name = location.name;
      country = location.country_code;
    } else {
      // Geolocation Object provided
      lat = query.lat;
      lon = query.lon;
      // Reverse geocoding optional here, putting generic name for simplicity
      name = "My Location";
      country = "📍";
    }

    // Step 2: Fetch Weather Data
    // Parameters: temperature_2m, relative_humidity_2m, weather_code, wind_speed_10m
    const weatherRes = await fetch(
      `${API_BASE_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`,
    );
    const weatherData = await weatherRes.json();

    // Process final data object
    const finalData = {
      city: name,
      country: country,
      temp: weatherData.current.temperature_2m,
      humidity: weatherData.current.relative_humidity_2m,
      wind: weatherData.current.wind_speed_10m,
      code: weatherData.current.weather_code,
    };

    updateUI(finalData);
  } catch (error) {
    console.error(error);
    showError(error.message || "Failed to fetch weather data.");
  }
}

/**
 * Event Listeners
 */

// 1. Handle Form Submit
elements.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = elements.input.value.trim();
  if (city) {
    fetchWeather(city);
  }
});

// 2. Handle Geolocation (Current Location)
elements.geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }

  showLoading();
  navigator.geolocation.getCurrentPosition(
    (position) => {
      fetchWeather({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });
    },
    () => {
      showError("Unable to retrieve your location.");
    },
  );
});

// Initial Load (Optional: Load a default city)
// fetchWeather('New York');

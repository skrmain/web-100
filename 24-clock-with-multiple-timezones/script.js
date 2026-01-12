/* ============================================
   TIMEZONE CLOCK APPLICATION
   Vanilla JavaScript - No dependencies
   ============================================ */

/**
 * Array of timezones to display
 * Each object contains:
 * - name: Display name of the timezone
 * - timeZone: IANA timezone identifier for Intl API
 * -
 * To add or remove timezones, simply modify this array.
 * Reference: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 */
const TIMEZONES = [
  {
    name: "Local Time",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  { name: "UTC", timeZone: "UTC" },
  { name: "New York", timeZone: "America/New_York" },
  { name: "London", timeZone: "Europe/London" },
  { name: "Paris", timeZone: "Europe/Paris" },
  { name: "Dubai", timeZone: "Asia/Dubai" },
  { name: "India", timeZone: "Asia/Kolkata" },
  { name: "Bangkok", timeZone: "Asia/Bangkok" },
  { name: "Tokyo", timeZone: "Asia/Tokyo" },
  { name: "Sydney", timeZone: "Australia/Sydney" },
  { name: "Los Angeles", timeZone: "America/Los_Angeles" },
  { name: "São Paulo", timeZone: "America/Sao_Paulo" },
];

/**
 * DOM element references
 */
const clocksContainer = document.getElementById("clocksContainer");

/* ============================================
   INITIALIZATION
   ============================================ */

/**
 * Initialize the application
 * - Create clock cards for each timezone
 * - Start the update interval
 */
function initializeApp() {
  // Create clock cards for all timezones
  renderClocks();

  // Update all clocks immediately
  updateClocks();

  // Update clocks every second
  setInterval(updateClocks, 1000);
}

/* ============================================
   RENDERING FUNCTIONS
   ============================================ */

/**
 * Create and render clock cards for all timezones
 */
function renderClocks() {
  // Clear existing content
  clocksContainer.innerHTML = "";

  // Create a card for each timezone
  TIMEZONES.forEach((timezone) => {
    const card = createClockCard(timezone);
    clocksContainer.appendChild(card);
  });
}

/**
 * Create a single clock card element
 * @param {Object} timezone - Timezone object with name and timeZone properties
 * @returns {HTMLElement} - The clock card element
 */
function createClockCard(timezone) {
  // Create container div
  const card = document.createElement("div");
  card.className = "clock-card";
  card.setAttribute("data-timezone", timezone.timeZone);

  // Create timezone name element
  const nameEl = document.createElement("div");
  nameEl.className = "timezone-name";
  nameEl.textContent = timezone.name;

  // Create time display element
  const timeEl = document.createElement("div");
  timeEl.className = "time-display";
  timeEl.setAttribute("data-time", "");

  // Create date display element
  const dateEl = document.createElement("div");
  dateEl.className = "date-display";
  dateEl.setAttribute("data-date", "");

  // Create timezone offset element
  const offsetEl = document.createElement("div");
  offsetEl.className = "timezone-offset";
  offsetEl.setAttribute("data-offset", "");

  // Append all elements to card
  card.appendChild(nameEl);
  card.appendChild(timeEl);
  card.appendChild(dateEl);
  card.appendChild(offsetEl);

  return card;
}

/* ============================================
   TIME UPDATE FUNCTIONS
   ============================================ */

/**
 * Update all clock cards with current time
 * Called every second by setInterval
 */
function updateClocks() {
  // Get all clock cards
  const cards = document.querySelectorAll(".clock-card");

  // Update each card
  cards.forEach((card) => {
    updateClockCard(card);
  });
}

/**
 * Update a single clock card with current time for its timezone
 * @param {HTMLElement} card - The clock card element to update
 */
function updateClockCard(card) {
  // Get the timezone identifier
  const timeZoneId = card.getAttribute("data-timezone");

  // Get current date/time
  const now = new Date();

  // Update time display
  updateTimeDisplay(card, now, timeZoneId);

  // Update date display
  updateDateDisplay(card, now, timeZoneId);

  // Update timezone offset
  updateTimezoneOffset(card, now, timeZoneId);
}

/**
 * Update the time display (HH:MM:SS) for a specific timezone
 * @param {HTMLElement} card - The clock card element
 * @param {Date} date - The date object
 * @param {string} timeZoneId - IANA timezone identifier
 */
function updateTimeDisplay(card, date, timeZoneId) {
  // Use Intl.DateTimeFormat for proper timezone handling
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZoneId,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Format the time
  const timeString = timeFormatter.format(date);

  // Update the DOM element
  const timeElement = card.querySelector("[data-time]");
  timeElement.textContent = timeString;
}

/**
 * Update the date display (Mon, Jan 12, 2026) for a specific timezone
 * @param {HTMLElement} card - The clock card element
 * @param {Date} date - The date object
 * @param {string} timeZoneId - IANA timezone identifier
 */
function updateDateDisplay(card, date, timeZoneId) {
  // Use Intl.DateTimeFormat for proper date formatting
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZoneId,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Format the date
  const dateString = dateFormatter.format(date);

  // Update the DOM element
  const dateElement = card.querySelector("[data-date]");
  dateElement.textContent = dateString;
}

/**
 * Update the timezone offset display (e.g., UTC+05:30) for a specific timezone
 * @param {HTMLElement} card - The clock card element
 * @param {Date} date - The date object
 * @param {string} timeZoneId - IANA timezone identifier
 */
function updateTimezoneOffset(card, date, timeZoneId) {
  // Get the UTC offset for this timezone
  const offset = calculateTimezoneOffset(date, timeZoneId);

  // Format and display the offset
  const offsetElement = card.querySelector("[data-offset]");
  offsetElement.textContent = offset;
}

/**
 * Calculate the UTC offset for a given timezone
 * @param {Date} date - The date object
 * @param {string} timeZoneId - IANA timezone identifier
 * @returns {string} - The offset string (e.g., "UTC+05:30" or "UTC-08:00")
 */
function calculateTimezoneOffset(date, timeZoneId) {
  // Get UTC time in ISO format
  const utcTime = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));

  // Get timezone time in ISO format
  const tzTime = new Date(
    date.toLocaleString("en-US", { timeZone: timeZoneId })
  );

  // Calculate the difference in minutes
  const diffMs = tzTime - utcTime;
  const diffMins = diffMs / (1000 * 60);

  // Convert to hours and minutes
  const hours = Math.floor(Math.abs(diffMins) / 60);
  const minutes = Math.abs(diffMins) % 60;

  // Determine the sign
  const sign = diffMins >= 0 ? "+" : "-";

  // Format the offset string
  return `UTC${sign}${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}`;
}

/* ============================================
   EVENT LISTENERS & APP START
   ============================================ */

/**
 * Start the application when DOM is ready
 */
document.addEventListener("DOMContentLoaded", initializeApp);

/**
 * Handle visibility change to optimize performance
 * Pause updates when tab is not visible
 */
let updateInterval = null;

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Pause updates when tab is hidden
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  } else {
    // Resume updates when tab becomes visible
    updateClocks();
    if (!updateInterval) {
      updateInterval = setInterval(updateClocks, 1000);
    }
  }
});

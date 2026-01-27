/* ============================================
       DIGITAL CLOCK APPLICATION
       Modern JavaScript using Web Platform APIs
       ============================================ */

// ============================================
// CONFIGURATION & STATE
// ============================================

// Get DOM elements - cache for better performance
const timeElement = document.getElementById('time');
const dateElement = document.getElementById('date');
const formatToggle = document.getElementById('format-toggle');
const toggleSwitch = document.querySelector('.toggle-switch');

// State: Track if we're using 12-hour format
// Note: We're NOT using localStorage as requested in requirements
// Instead, we'll use a simple in-memory variable
let is12HourFormat = true;

// ============================================
// INTL.DATETIMEFORMAT SETUP
// Modern Web API for internationalized formatting
// ============================================

/**
 * Creates Intl.DateTimeFormat options based on format preference
 * @param {boolean} use12Hour - Whether to use 12-hour format
 * @returns {object} - Options object for DateTimeFormat
 */
function getTimeFormatOptions(use12Hour) {
    return {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: use12Hour, // This determines 12 vs 24 hour format
    };
}

/**
 * Options for date formatting
 * Using 'long' format for readable dates
 */
const dateFormatOptions = {
    weekday: 'long', // e.g., "Monday"
    year: 'numeric', // e.g., "2026"
    month: 'long', // e.g., "January"
    day: 'numeric', // e.g., "11"
};

// ============================================
// CORE CLOCK FUNCTIONS
// ============================================

/**
 * Updates the clock display with current time
 * Uses Intl.DateTimeFormat for proper localization
 */
function updateClock() {
    // Get current date/time
    const now = new Date();

    // Create formatter with current settings
    const timeFormatter = new Intl.DateTimeFormat('en-US', getTimeFormatOptions(is12HourFormat));

    // Format the time
    const formattedTime = timeFormatter.format(now);

    // Update the display
    timeElement.textContent = formattedTime;
}

/**
 * Updates the date display
 * Separate from time for efficiency (date changes less frequently)
 */
function updateDate() {
    const now = new Date();

    // Create date formatter
    const dateFormatter = new Intl.DateTimeFormat('en-US', dateFormatOptions);

    // Format and display
    dateElement.textContent = dateFormatter.format(now);
}

// ============================================
// OPTIMIZED TIMER USING SETRIMEOUT
// More precise than setInterval for clock updates
// ============================================

/**
 * Recursive setTimeout pattern for precise updates
 * Calculates next update time to sync with second changes
 */
function startClock() {
    // Update immediately
    updateClock();

    // Calculate milliseconds until next second
    const now = new Date();
    const msUntilNextSecond = 1000 - now.getMilliseconds();

    // Schedule next update at the start of next second
    setTimeout(() => {
        updateClock();
        // Continue the clock with 1-second intervals
        setInterval(updateClock, 1000);
    }, msUntilNextSecond);
}

// ============================================
// EVENT HANDLERS
// ============================================

/**
 * Handles format toggle change
 * Updates both the clock and ARIA attributes
 */
formatToggle.addEventListener('change', (event) => {
    // Update state
    is12HourFormat = event.target.checked;

    // Update ARIA attribute for accessibility
    toggleSwitch.setAttribute('aria-checked', is12HourFormat);

    // Immediately update display with new format
    updateClock();

    // Note: In a production app, you might save this to localStorage here
    // Example: localStorage.setItem('clockFormat', is12HourFormat ? '12' : '24');
});

// ============================================
// INITIALIZATION
// Called when page loads
// ============================================

/**
 * Initialize the application
 * Sets up initial state and starts the clock
 */
function init() {
    // Set initial toggle state
    formatToggle.checked = is12HourFormat;
    toggleSwitch.setAttribute('aria-checked', is12HourFormat);

    // Update date (only needs to update once per day typically)
    updateDate();

    // Update date at midnight each day
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0) - now;

    setTimeout(() => {
        updateDate();
        // Then update daily
        setInterval(updateDate, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    // Start the clock
    startClock();

    // Note: To load saved preference from localStorage, you would do:
    // const savedFormat = localStorage.getItem('clockFormat');
    // if (savedFormat) {
    //   is12HourFormat = savedFormat === '12';
    //   formatToggle.checked = is12HourFormat;
    // }
}

// ============================================
// START THE APPLICATION
// Wait for DOM to be fully loaded
// ============================================

// Modern way to ensure DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM already loaded
    init();
}

// =========================
// Try

// document.onreadystatechange = () => {
//     console.log(document.readyState);
// };

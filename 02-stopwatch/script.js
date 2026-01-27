/* ===================================
       JAVASCRIPT - STOPWATCH LOGIC
       =================================== */

// ============ DOM ELEMENTS ============
// Cache DOM elements for better performance
const display = document.getElementById('display');
const startBtn = document.getElementById('startBtn');
const lapBtn = document.getElementById('lapBtn');
const resetBtn = document.getElementById('resetBtn');
const lapsSection = document.getElementById('laps');
const lapList = document.getElementById('lapList');

// ============ STATE VARIABLES ============
// Stopwatch state management
let isRunning = false; // Whether stopwatch is currently running
let isPaused = false; // Whether stopwatch is paused
let startTime = 0; // Timestamp when stopwatch started (performance.now())
let elapsedTime = 0; // Total elapsed time in milliseconds
let animationId = null; // requestAnimationFrame ID for cleanup
let laps = []; // Array to store lap times

// ============ TIMING LOGIC ============

/**
 * Formats milliseconds into HH:MM:SS:MS display format
 * @param {number} ms - Milliseconds to format
 * @returns {string} Formatted time string
 */
function formatTime(ms) {
    // Extract time components
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10); // Display centiseconds (2 digits)

    // Pad with leading zeros for consistent display
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
        2,
        '0',
    )}:${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(2, '0')}`;
}

/**
 * Main update loop using requestAnimationFrame
 * This runs on every frame for smooth, accurate timing
 * Using performance.now() ensures high precision and prevents drift
 */
function update() {
    if (!isRunning) return;

    // Calculate elapsed time since start
    // performance.now() provides microsecond precision
    const currentTime = performance.now();
    elapsedTime = currentTime - startTime;

    // Update display
    display.textContent = formatTime(elapsedTime);

    // Schedule next frame
    // requestAnimationFrame syncs with display refresh rate (~60fps)
    animationId = requestAnimationFrame(update);
}

// ============ CONTROL FUNCTIONS ============

/**
 * Starts the stopwatch
 * Sets initial timestamp and begins animation loop
 */
function start() {
    isRunning = true;
    isPaused = false;

    // Set start time, accounting for any previously elapsed time
    // This allows for accurate pause/resume functionality
    startTime = performance.now() - elapsedTime;

    // Update UI
    startBtn.textContent = 'Pause';
    startBtn.className = 'btn-primary';
    lapBtn.disabled = false;
    resetBtn.disabled = false;

    // Start the animation loop
    update();
}

/**
 * Pauses the stopwatch
 * Stops the animation loop and preserves elapsed time
 */
function pause() {
    isRunning = false;
    isPaused = true;

    // Cancel animation frame to stop updates
    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    // Update UI
    startBtn.textContent = 'Resume';
    startBtn.className = 'btn-success';
    lapBtn.disabled = true;
}

/**
 * Resets the stopwatch to initial state
 * Clears all timing data and lap records
 */
function reset() {
    isRunning = false;
    isPaused = false;
    elapsedTime = 0;
    laps = [];

    // Cancel animation frame
    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    // Reset display
    display.textContent = '00:00:00:00';

    // Reset UI
    startBtn.textContent = 'Start';
    startBtn.className = 'btn-primary';
    lapBtn.disabled = true;
    resetBtn.disabled = true;

    // Clear laps
    lapList.innerHTML = '';
    lapsSection.classList.remove('active');
}

/**
 * Records a lap time
 * Stores current elapsed time and updates lap display
 */
function recordLap() {
    if (!isRunning) return;

    // Add current time to laps array
    laps.push(elapsedTime);

    // Create and insert lap item at the top (most recent first)
    const lapItem = document.createElement('div');
    lapItem.className = 'lap-item';
    lapItem.setAttribute('role', 'listitem');

    lapItem.innerHTML = `
        <span class="lap-number">Lap ${laps.length}</span>
        <span class="lap-time">${formatTime(elapsedTime)}</span>
      `;

    // Insert at the beginning for reverse chronological order
    lapList.insertBefore(lapItem, lapList.firstChild);

    // Show laps section
    lapsSection.classList.add('active');
}

// ============ EVENT LISTENERS ============

/**
 * Start/Pause/Resume button handler
 * Toggles between start, pause, and resume states
 */
startBtn.addEventListener('click', () => {
    if (!isRunning && !isPaused) {
        start();
    } else if (isRunning) {
        pause();
    } else if (isPaused) {
        start();
    }
});

/**
 * Lap button handler
 * Records current time as a lap
 */
lapBtn.addEventListener('click', recordLap);

/**
 * Reset button handler
 * Resets stopwatch to initial state
 */
resetBtn.addEventListener('click', reset);

// ============ KEYBOARD ACCESSIBILITY ============

/**
 * Keyboard shortcuts for better accessibility
 * Space: Start/Pause/Resume
 * L: Record Lap
 * R: Reset
 */
document.addEventListener('keydown', (e) => {
    // Prevent default only for our shortcuts
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        startBtn.click();
    } else if (e.code === 'KeyL' && !lapBtn.disabled) {
        e.preventDefault();
        lapBtn.click();
    } else if (e.code === 'KeyR' && !resetBtn.disabled) {
        e.preventDefault();
        resetBtn.click();
    }
});

/* ===================================
       OPTIONAL: PERSISTENCE
       
       Uncomment this section to enable localStorage persistence
       This will save and restore the stopwatch state across sessions
       
       Note: The instructions mentioned localStorage as optional, so
       this code is provided but commented out by default
       =================================== */

/*
    // Save state to localStorage
    function saveState() {
      const state = {
        elapsedTime,
        laps,
        isPaused
      };
      localStorage.setItem('stopwatch-state', JSON.stringify(state));
    }

    // Load state from localStorage
    function loadState() {
      const saved = localStorage.getItem('stopwatch-state');
      if (saved) {
        const state = JSON.parse(saved);
        elapsedTime = state.elapsedTime || 0;
        laps = state.laps || [];
        isPaused = state.isPaused || false;
        
        // Restore display
        display.textContent = formatTime(elapsedTime);
        
        // Restore laps
        if (laps.length > 0) {
          laps.forEach((lapTime, index) => {
            const lapItem = document.createElement('div');
            lapItem.className = 'lap-item';
            lapItem.innerHTML = `
              <span class="lap-number">Lap ${index + 1}</span>
              <span class="lap-time">${formatTime(lapTime)}</span>
            `;
            lapList.appendChild(lapItem);
          });
          lapsSection.classList.add('active');
        }
        
        // Restore UI state
        if (isPaused) {
          startBtn.textContent = 'Resume';
          startBtn.className = 'btn-success';
          resetBtn.disabled = false;
        }
      }
    }

    // Auto-save on state changes
    setInterval(() => {
      if (isRunning || isPaused) {
        saveState();
      }
    }, 1000);

    // Load state on page load
    loadState();
    */

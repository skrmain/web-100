/**
 * POMODORO TIMER CONFIGURATION
 * Centralized settings for easy adjustments
 */
const MODES = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

// DOM Elements
const timeDisplay = document.getElementById("time-left");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const modeText = document.getElementById("mode-text");
const modeButtons = document.querySelectorAll(".mode-btn");
const alarmSound = document.getElementById("alarm-sound");

// State Variables
let currentMode = "focus"; // 'focus', 'short', 'long'
let timeLeft = MODES[currentMode];
let timerInterval = null;
let isRunning = false;

// Drift Correction Variables
let endTime = null; // The timestamp when the timer should finish

/**
 * INITIALIZATION
 */
function init() {
  updateDisplay();
  setupEventListeners();
  // Check local storage for preference (Optional feature)
  if (localStorage.getItem("pomodoroMode")) {
    switchMode(localStorage.getItem("pomodoroMode"));
  }
}

/**
 * CORE TIMER LOGIC
 * Uses Date.now() to prevent timer drift that occurs with standard setInterval
 */
function startTimer() {
  if (isRunning) return;

  isRunning = true;

  // Calculate the target end time based on current timeLeft
  // Date.now() is in ms, timeLeft is in seconds
  endTime = Date.now() + timeLeft * 1000;

  // Swap buttons
  startBtn.classList.add("hidden");
  pauseBtn.classList.remove("hidden");

  // Run the loop
  timerInterval = setInterval(() => {
    const now = Date.now();
    const secondsRemaining = Math.ceil((endTime - now) / 1000);

    if (secondsRemaining <= 0) {
      finishTimer();
    } else {
      timeLeft = secondsRemaining;
      updateDisplay();
    }
  }, 200); // Check every 200ms for smoothness, but calc math based on real time
}

function pauseTimer() {
  if (!isRunning) return;

  isRunning = false;
  clearInterval(timerInterval);

  // Note: We don't need to save endTime, because timeLeft is preserved
  // and used to recalculate endTime on resume.

  startBtn.classList.remove("hidden");
  pauseBtn.classList.add("hidden");
  startBtn.textContent = "Resume";
}

function resetTimer() {
  pauseTimer();
  timeLeft = MODES[currentMode];
  startBtn.textContent = "Start";
  updateDisplay();
}

function finishTimer() {
  clearInterval(timerInterval);
  timeLeft = 0;
  updateDisplay();

  // Play sound
  try {
    alarmSound.play();
  } catch (e) {
    console.log("Audio play blocked by browser policy");
  }

  isRunning = false;
  startBtn.classList.remove("hidden");
  pauseBtn.classList.add("hidden");
  startBtn.textContent = "Restart";

  // Update Title to alert user
  document.title = "Time's Up!";
}

/**
 * MODE SWITCHING
 * Handles switching between Focus, Short Break, and Long Break
 */
function switchMode(mode) {
  // Stop current timer
  pauseTimer();

  // Update State
  currentMode = mode;
  timeLeft = MODES[mode];

  // Update UI
  updateDisplay();
  startBtn.textContent = "Start";

  // Update Active Tab
  modeButtons.forEach((btn) => {
    btn.classList.remove("active");
    btn.setAttribute("aria-selected", "false");
    if (btn.dataset.mode === mode) {
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
    }
  });

  // Update Theme (Color changing)
  document.body.setAttribute("data-theme", mode);

  // Update Text
  const labels = {
    focus: "Focus Time",
    short: "Short Break",
    long: "Long Break",
  };
  modeText.textContent = labels[mode];

  // Persist choice
  localStorage.setItem("pomodoroMode", mode);
}

/**
 * HELPER FUNCTIONS
 */
function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Pad with leading zero: 5:9 -> 05:09
  const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Update DOM
  timeDisplay.textContent = timeString;
  timeDisplay.setAttribute("datetime", `PT${minutes}M${seconds}S`);

  // Update Browser Tab Title
  document.title = `${timeString} - ${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}`;
}

function setupEventListeners() {
  startBtn.addEventListener("click", startTimer);
  pauseBtn.addEventListener("click", pauseTimer);
  resetBtn.addEventListener("click", resetTimer);

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const mode = e.target.dataset.mode;
      switchMode(mode);
    });
  });
}

// Start the app
init();

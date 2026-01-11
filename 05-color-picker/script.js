/* ========================================
   COLOR CONVERSION UTILITIES
   ======================================= */

/**
 * Converts RGB color values to HEX format
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} HEX color string (e.g., "#4CAF50")
 */
function rgbToHex(r, g, b) {
  // Convert each RGB component to hexadecimal and pad with zero if needed
  const toHex = (num) => {
    const hex = num.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Converts HEX color to RGB values
 * @param {string} hex - HEX color string (e.g., "#4CAF50")
 * @returns {object} Object with r, g, b properties (0-255)
 */
function hexToRgb(hex) {
  // Remove # if present and parse hexadecimal values
  hex = hex.replace("#", "");
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

/**
 * Converts RGB color values to HSL format
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {object} Object with h (0-360), s (0-100), l (0-100) properties
 */
function rgbToHsl(r, g, b) {
  // Normalize RGB values to 0-1 range
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    // Achromatic (gray)
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    // Calculate hue based on which component is largest
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Convert to standard HSL ranges
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converts HSL color values to RGB format
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {object} Object with r, g, b properties (0-255)
 */
function hslToRgb(h, s, l) {
  // Normalize HSL values to 0-1 range
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    // Achromatic (gray)
    r = g = b = l;
  } else {
    // Helper function for HSL to RGB conversion
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  // Convert back to 0-255 range
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/* ========================================
   DOM ELEMENTS & STATE
   ======================================= */

// Get references to all DOM elements we'll be working with
const colorPreview = document.getElementById("colorPreview");
const nativeColorPicker = document.getElementById("nativeColorPicker");
const eyedropperBtn = document.getElementById("eyedropperBtn");

// RGB slider elements
const rSlider = document.getElementById("rSlider");
const gSlider = document.getElementById("gSlider");
const bSlider = document.getElementById("bSlider");
const rValue = document.getElementById("rValue");
const gValue = document.getElementById("gValue");
const bValue = document.getElementById("bValue");

// HSL slider elements
const hSlider = document.getElementById("hSlider");
const sSlider = document.getElementById("sSlider");
const lSlider = document.getElementById("lSlider");
const hValue = document.getElementById("hValue");
const sValue = document.getElementById("sValue");
const lValue = document.getElementById("lValue");

// Output value elements
const hexValue = document.getElementById("hexValue");
const rgbValue = document.getElementById("rgbValue");
const hslValue = document.getElementById("hslValue");

// Container elements
const rgbSliders = document.getElementById("rgbSliders");
const hslSliders = document.getElementById("hslSliders");
const recentColorsContainer = document.getElementById("recentColors");

// Mode toggle buttons
const modeBtns = document.querySelectorAll(".mode-btn");

// Application state
let currentMode = "rgb"; // Track current slider mode (rgb or hsl)
let recentColors = []; // Array to store recent colors
const MAX_RECENT_COLORS = 8; // Maximum number of recent colors to store

/* ========================================
   INITIALIZATION
   ======================================= */

/**
 * Initialize the application
 * - Load saved colors from localStorage
 * - Set up EyeDropper API if available
 * - Update UI with initial color
 */
function init() {
  loadRecentColors();
  checkEyeDropperSupport();
  updateColor();
  attachEventListeners();
}

/**
 * Check if EyeDropper API is supported and update button accordingly
 */
function checkEyeDropperSupport() {
  if (!("EyeDropper" in window)) {
    // API not supported - disable button and show message
    eyedropperBtn.disabled = true;
    eyedropperBtn.textContent = "🎨 Not Supported";
    eyedropperBtn.title = "EyeDropper API not supported in this browser";
  }
}

/* ========================================
   COLOR UPDATE LOGIC
   ======================================= */

/**
 * Main function to update all color displays
 * Called whenever any color input changes
 */
function updateColor() {
  // Get current RGB values from sliders
  const r = parseInt(rSlider.value);
  const g = parseInt(gSlider.value);
  const b = parseInt(bSlider.value);

  // Convert to different formats
  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);

  // Update all displays
  updatePreview(hex);
  updateOutputValues(hex, r, g, b, hsl);
  updateSliderLabels(r, g, b, hsl);
  updateNativePickerColor(hex);
}

/**
 * Update the color preview box
 */
function updatePreview(hex) {
  colorPreview.style.backgroundColor = hex;
}

/**
 * Update all color format output values
 */
function updateOutputValues(hex, r, g, b, hsl) {
  hexValue.textContent = hex;
  rgbValue.textContent = `rgb(${r}, ${g}, ${b})`;
  hslValue.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * Update slider label values
 */
function updateSliderLabels(r, g, b, hsl) {
  // RGB labels
  rValue.textContent = r;
  gValue.textContent = g;
  bValue.textContent = b;

  // HSL labels
  hValue.textContent = hsl.h + "°";
  sValue.textContent = hsl.s + "%";
  lValue.textContent = hsl.l + "%";
}

/**
 * Sync native color picker with current color
 */
function updateNativePickerColor(hex) {
  nativeColorPicker.value = hex;
}

/**
 * Update RGB sliders based on new RGB values
 */
function updateRgbSliders(r, g, b) {
  rSlider.value = r;
  gSlider.value = g;
  bSlider.value = b;
}

/**
 * Update HSL sliders based on RGB values
 */
function updateHslSliders(r, g, b) {
  const hsl = rgbToHsl(r, g, b);
  hSlider.value = hsl.h;
  sSlider.value = hsl.s;
  lSlider.value = hsl.l;
}

/* ========================================
   EVENT HANDLERS
   ======================================= */

/**
 * Handle RGB slider changes
 */
function handleRgbSliderChange() {
  const r = parseInt(rSlider.value);
  const g = parseInt(gSlider.value);
  const b = parseInt(bSlider.value);

  // Update HSL sliders to match
  updateHslSliders(r, g, b);
  updateColor();
}

/**
 * Handle HSL slider changes
 */
function handleHslSliderChange() {
  const h = parseInt(hSlider.value);
  const s = parseInt(sSlider.value);
  const l = parseInt(lSlider.value);

  // Convert HSL to RGB and update RGB sliders
  const rgb = hslToRgb(h, s, l);
  updateRgbSliders(rgb.r, rgb.g, rgb.b);
  updateColor();
}

/**
 * Handle native color picker changes
 */
function handleNativePickerChange(e) {
  const hex = e.target.value;
  const rgb = hexToRgb(hex);

  // Update both RGB and HSL sliders
  updateRgbSliders(rgb.r, rgb.g, rgb.b);
  updateHslSliders(rgb.r, rgb.g, rgb.b);
  updateColor();

  // Save to recent colors
  addToRecentColors(hex);
}

/**
 * Handle EyeDropper button click
 * Uses modern EyeDropper API to pick colors from screen
 */
async function handleEyeDropper() {
  try {
    const eyeDropper = new EyeDropper();
    const result = await eyeDropper.open();

    // User selected a color
    const hex = result.sRGBHex;
    const rgb = hexToRgb(hex);

    updateRgbSliders(rgb.r, rgb.g, rgb.b);
    updateHslSliders(rgb.r, rgb.g, rgb.b);
    updateColor();
    addToRecentColors(hex);
  } catch (err) {
    // User cancelled or error occurred
    console.log("Color picking cancelled or failed:", err);
  }
}

/**
 * Handle mode toggle (RGB/HSL)
 */
function handleModeToggle(e) {
  const mode = e.target.dataset.mode;
  if (!mode || mode === currentMode) return;

  currentMode = mode;

  // Update button states
  modeBtns.forEach((btn) => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive);
  });

  // Show/hide appropriate sliders
  if (mode === "rgb") {
    rgbSliders.style.display = "block";
    hslSliders.style.display = "none";
  } else {
    rgbSliders.style.display = "none";
    hslSliders.style.display = "block";
  }
}

/**
 * Handle copy button clicks
 * Uses Clipboard API to copy color values
 */
async function handleCopy(e) {
  const format = e.target.dataset.format;
  let textToCopy = "";

  // Get the appropriate color value based on format
  switch (format) {
    case "hex":
      textToCopy = hexValue.textContent;
      break;
    case "rgb":
      textToCopy = rgbValue.textContent;
      break;
    case "hsl":
      textToCopy = hslValue.textContent;
      break;
  }

  try {
    // Use Clipboard API to copy text
    await navigator.clipboard.writeText(textToCopy);

    // Show visual feedback
    e.target.textContent = "Copied!";
    e.target.classList.add("copied");

    // Reset button after 2 seconds
    setTimeout(() => {
      e.target.textContent = "Copy";
      e.target.classList.remove("copied");
    }, 2000);
  } catch (err) {
    console.error("Failed to copy:", err);
    e.target.textContent = "Failed";
    setTimeout(() => {
      e.target.textContent = "Copy";
    }, 2000);
  }
}

/**
 * Handle clicking on a recent color swatch
 */
function handleSwatchClick(e) {
  const hex = e.target.dataset.color;
  if (!hex) return;

  const rgb = hexToRgb(hex);
  updateRgbSliders(rgb.r, rgb.g, rgb.b);
  updateHslSliders(rgb.r, rgb.g, rgb.b);
  updateColor();
}

/* ========================================
   RECENT COLORS (localStorage)
   ======================================= */

/**
 * Load recent colors from localStorage
 */
function loadRecentColors() {
  try {
    const saved = localStorage.getItem("recentColors");
    recentColors = saved ? JSON.parse(saved) : [];
    renderRecentColors();
  } catch (err) {
    console.error("Failed to load recent colors:", err);
    recentColors = [];
  }
}

/**
 * Save recent colors to localStorage
 */
function saveRecentColors() {
  try {
    localStorage.setItem("recentColors", JSON.stringify(recentColors));
  } catch (err) {
    console.error("Failed to save recent colors:", err);
  }
}

/**
 * Add a color to recent colors list
 * Limits to 8 colors and prevents duplicates
 */
function addToRecentColors(hex) {
  // Remove if already exists (to move it to front)
  recentColors = recentColors.filter((color) => color !== hex);

  // Add to beginning of array
  recentColors.unshift(hex);

  // Limit to MAX_RECENT_COLORS
  if (recentColors.length > MAX_RECENT_COLORS) {
    recentColors = recentColors.slice(0, MAX_RECENT_COLORS);
  }

  saveRecentColors();
  renderRecentColors();
}

/**
 * Render recent colors swatches to the DOM
 */
function renderRecentColors() {
  // Clear existing swatches
  recentColorsContainer.innerHTML = "";

  // Create swatches for recent colors
  for (let i = 0; i < MAX_RECENT_COLORS; i++) {
    const swatch = document.createElement("div");
    swatch.className = "color-swatch";
    swatch.setAttribute("role", "listitem");

    if (recentColors[i]) {
      swatch.style.backgroundColor = recentColors[i];
      swatch.dataset.color = recentColors[i];
      swatch.setAttribute("aria-label", `Recent color ${recentColors[i]}`);
      swatch.addEventListener("click", handleSwatchClick);
    } else {
      swatch.classList.add("empty");
      swatch.setAttribute("aria-label", "Empty color slot");
    }

    recentColorsContainer.appendChild(swatch);
  }
}

/* ========================================
   EVENT LISTENERS
   ======================================= */

/**
 * Attach all event listeners
 */
function attachEventListeners() {
  // RGB sliders
  rSlider.addEventListener("input", handleRgbSliderChange);
  gSlider.addEventListener("input", handleRgbSliderChange);
  bSlider.addEventListener("input", handleRgbSliderChange);

  // HSL sliders
  hSlider.addEventListener("input", handleHslSliderChange);
  sSlider.addEventListener("input", handleHslSliderChange);
  lSlider.addEventListener("input", handleHslSliderChange);

  // Native color picker
  nativeColorPicker.addEventListener("input", handleNativePickerChange);

  // EyeDropper button
  eyedropperBtn.addEventListener("click", handleEyeDropper);

  // Mode toggle buttons
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", handleModeToggle);
  });

  // Copy buttons
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", handleCopy);
  });
}

/* ========================================
   START APPLICATION
   ======================================= */

// Initialize the app when DOM is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

/*
 * Random Background Color App - JavaScript
 * Handles color generation, display, and clipboard operations
 */

// ============================================================================
// Color Generation Functions
// ============================================================================

/**
 * Generates a random color in HEX format
 * Uses Math.random() to generate random RGB values
 * Returns a valid HEX color string (e.g., "#A3C5F2")
 */
function generateRandomHexColor() {
  // Generate a random number between 0 and 16777215 (0xFFFFFF in decimal)
  // This ensures we get all possible 6-digit hex colors
  const randomNumber = Math.floor(Math.random() * 16777215);

  // Convert the number to hexadecimal and pad with zeros if needed
  // toString(16) converts to hex, padStart ensures 6 digits
  const hexColor =
    "#" + randomNumber.toString(16).padStart(6, "0").toUpperCase();

  return hexColor;
}

/**
 * Converts a HEX color to RGB format
 * Takes a HEX string (e.g., "#A3C5F2") and returns RGB string (e.g., "rgb(163, 197, 242)")
 */
function hexToRgb(hex) {
  // Remove the '#' character from the hex string
  const cleanHex = hex.replace("#", "");

  // Convert hex pairs to decimal values
  // parseInt(hexPair, 16) converts a 2-character hex string to a decimal number
  const red = parseInt(cleanHex.substring(0, 2), 16);
  const green = parseInt(cleanHex.substring(2, 4), 16);
  const blue = parseInt(cleanHex.substring(4, 6), 16);

  // Return as RGB string format
  return `rgb(${red}, ${green}, ${blue})`;
}

// ============================================================================
// Color Display Functions
// ============================================================================

/**
 * Updates the background color and displays the new color values
 * This is the main function called when a new color is generated
 */
function updateBackgroundColor() {
  // Generate a new random HEX color
  const newColor = generateRandomHexColor();

  // Convert HEX to RGB format
  const rgbColor = hexToRgb(newColor);

  // Update the CSS variable --bg-color on the root element
  // This changes the background color with a smooth transition
  document.documentElement.style.setProperty("--bg-color", newColor);

  // Update the HEX color display element
  const hexElement = document.getElementById("colorHex");
  if (hexElement) {
    hexElement.textContent = newColor;
  }

  // Update the RGB color display element
  const rgbElement = document.getElementById("colorRgb");
  if (rgbElement) {
    rgbElement.textContent = rgbColor;
  }
}

// ============================================================================
// Clipboard Functions
// ============================================================================

/**
 * Copies the specified color value to the clipboard
 * Uses the modern Clipboard API for better browser support
 * Shows a notification when copy is successful
 */
async function copyToClipboard(colorValue) {
  try {
    // Use the Clipboard API to write text to clipboard
    // This is the modern, secure way to copy data
    await navigator.clipboard.writeText(colorValue);

    // Show success notification
    showCopyNotification();
  } catch (error) {
    // Fallback for older browsers that don't support Clipboard API
    console.warn("Clipboard API failed, using fallback method:", error);
    fallbackCopyToClipboard(colorValue);
  }
}

/**
 * Fallback method for copying to clipboard (older browser support)
 * Creates a temporary textarea element and uses the old execCommand method
 */
function fallbackCopyToClipboard(colorValue) {
  try {
    // Create a temporary textarea element
    const textarea = document.createElement("textarea");
    textarea.value = colorValue;

    // Make it invisible and add to the document
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);

    // Select and copy the text
    textarea.select();
    document.execCommand("copy");

    // Remove the temporary element
    document.body.removeChild(textarea);

    // Show success notification
    showCopyNotification();
  } catch (error) {
    console.error("Fallback copy method failed:", error);
    alert("Failed to copy color to clipboard");
  }
}

/**
 * Shows a temporary notification toast when color is copied
 * The notification appears at the bottom of the screen and disappears after 2 seconds
 */
function showCopyNotification() {
  // Get the notification element
  const notification = document.getElementById("copyNotification");

  if (notification) {
    // Add the 'show' class to trigger the animation
    notification.classList.add("show");

    // Remove the notification after 2 seconds
    setTimeout(() => {
      notification.classList.remove("show");
    }, 2000);
  }
}

// ============================================================================
// Event Listeners Setup
// ============================================================================

/**
 * Initialize the app when the DOM is fully loaded
 * Sets up event listeners and generates the initial color
 */
document.addEventListener("DOMContentLoaded", function () {
  // Generate an initial random color on page load
  updateBackgroundColor();

  // Get the main generate button
  const generateBtn = document.getElementById("generateBtn");
  if (generateBtn) {
    // Add click event listener to generate new color
    generateBtn.addEventListener("click", updateBackgroundColor);

    // Optional: Allow Enter key to generate color when button is focused
    generateBtn.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        updateBackgroundColor();
      }
    });
  }

  // Get the copy HEX button and add event listener
  const copyHexBtn = document.getElementById("copyHexBtn");
  if (copyHexBtn) {
    copyHexBtn.addEventListener("click", function () {
      // Get the current HEX color value and copy it
      const hexValue = document.getElementById("colorHex").textContent;
      copyToClipboard(hexValue);
    });
  }

  // Get the copy RGB button and add event listener
  const copyRgbBtn = document.getElementById("copyRgbBtn");
  if (copyRgbBtn) {
    copyRgbBtn.addEventListener("click", function () {
      // Get the current RGB color value and copy it
      const rgbValue = document.getElementById("colorRgb").textContent;
      copyToClipboard(rgbValue);
    });
  }

  // Bonus: Allow pressing 'Space' to generate a new color (when no input is focused)
  document.addEventListener("keydown", function (event) {
    // Check if the pressed key is the spacebar
    if (event.code === "Space" && event.target === document.body) {
      // Prevent page scroll on spacebar
      event.preventDefault();
      // Generate new color
      updateBackgroundColor();
    }
  });
});

// ============================================================================
// Accessibility Enhancements
// ============================================================================

/*
 * Additional accessibility features:
 * 1. All buttons have proper aria-labels for screen readers
 * 2. Keyboard navigation is fully supported (Tab, Enter, Space)
 * 3. Focus states are visible with outline styling
 * 4. Color values are displayed in large, readable font
 * 5. Semantic HTML is used throughout
 * 6. Copy notifications have aria-live for screen reader announcements
 */

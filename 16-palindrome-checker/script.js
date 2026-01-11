/* ==========================================
   Palindrome Checker Application
   Vanilla JavaScript - No external libraries
   ========================================== */

// ===========================================
// DOM Element References
// ===========================================

// Cache DOM references for better performance
const form = document.getElementById("palindromeForm");
const textInput = document.getElementById("textInput");
const resultContainer = document.getElementById("resultContainer");
const resultOutput = document.getElementById("resultOutput");
const resultIndicator = document.getElementById("resultIndicator");
const errorMessage = document.getElementById("errorMessage");

// ===========================================
// Utility Functions
// ===========================================

/**
 * Normalizes text for palindrome checking by:
 * 1. Converting to lowercase
 * 2. Removing spaces, punctuation, and special characters
 * 3. Keeping only alphanumeric characters
 *
 * @param {string} text - The text to normalize
 * @returns {string} - The normalized text
 *
 * Examples:
 * - "A man, a plan, a canal: Panama" → "amanaplanacanalpanama"
 * - "Racecar!" → "racecar"
 * - "Hello, World?" → "helloworld"
 */
function normalizeText(text) {
  // Convert to lowercase
  const lowerText = text.toLowerCase();

  // Remove all non-alphanumeric characters using regex
  // \W means any character that is NOT alphanumeric or underscore
  // We also replace underscore with empty string
  const cleanedText = lowerText.replace(/[^a-z0-9]/g, "");

  return cleanedText;
}

/**
 * Checks if a text string is a palindrome
 *
 * @param {string} text - The text to check
 * @returns {boolean} - True if palindrome, false otherwise
 *
 * Logic:
 * 1. Normalize the text (remove spaces, punctuation, lowercase)
 * 2. Compare the text with its reverse
 * 3. Return true if they match
 */
function isPalindrome(text) {
  // Normalize the text
  const normalized = normalizeText(text);

  // Check if empty after normalization
  if (normalized.length === 0) {
    return false;
  }

  // Reverse the normalized text
  // Split into array, reverse array, join back to string
  const reversed = normalized.split("").reverse().join("");

  // Compare original with reversed
  return normalized === reversed;
}

/**
 * Validates user input
 *
 * @param {string} text - The text to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidInput(text) {
  // Check if text is empty or only whitespace
  return text.trim().length > 0;
}

/**
 * Displays an error message to the user
 *
 * @param {string} message - The error message to display
 */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");

  // Hide result container when showing error
  resultContainer.classList.add("hidden");
}

/**
 * Hides the error message
 */
function hideError() {
  errorMessage.classList.add("hidden");
  errorMessage.textContent = "";
}

/**
 * Displays the palindrome check result
 *
 * @param {string} originalText - The original text entered by user
 * @param {boolean} result - Whether it's a palindrome
 */
function displayResult(originalText, result) {
  // Hide any error messages
  hideError();

  // Create appropriate message based on result
  const message = result
    ? `✓ Yes, "${originalText.trim()}" is a palindrome!`
    : `✗ No, "${originalText.trim()}" is not a palindrome.`;

  // Update the output element with result message
  resultOutput.textContent = message;

  // Remove any existing success/error classes
  resultContainer.classList.remove("success", "error");

  // Add appropriate class based on result
  if (result) {
    resultContainer.classList.add("success");
  } else {
    resultContainer.classList.add("error");
  }

  // Show the result container with smooth animation
  resultContainer.classList.remove("hidden");
}

// ===========================================
// Event Listeners
// ===========================================

/**
 * Handle form submission
 * Triggered when user clicks "Check" button
 */
form.addEventListener("submit", function (event) {
  // Prevent page reload on form submission
  event.preventDefault();

  // Get the input value from the text field
  const userText = textInput.value;

  // Validate that user entered something
  if (!isValidInput(userText)) {
    showError("⚠️ Please enter some text to check!");
    return;
  }

  // Check if the text is a palindrome
  const result = isPalindrome(userText);

  // Display the result to the user
  displayResult(userText, result);
});

/**
 * Optional: Real-time checking as user types
 * This provides immediate feedback without requiring button click
 *
 * Remove the comment slashes below to enable real-time checking
 */
textInput.addEventListener("input", function () {
  const userText = textInput.value;

  // Only check if user has entered text
  if (isValidInput(userText)) {
    const result = isPalindrome(userText);
    displayResult(userText, result);
  } else {
    // Hide result if text is empty
    resultContainer.classList.add("hidden");
    hideError();
  }
});

/**
 * Clear error message when user starts typing
 * This improves user experience by removing old error messages
 */
textInput.addEventListener("focus", function () {
  hideError();
});

// ===========================================
// Initialize Application
// ===========================================

// Optional: Set initial focus to text input for better UX
textInput.focus();

// Add keyboard shortcut information (optional)
console.log("💡 Palindrome Checker loaded successfully!");
console.log("Tip: Enter text and press Enter or click Check button");

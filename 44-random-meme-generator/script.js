// --- Configuration ---
const API_URL = "https://meme-api.com/gimme";

// --- DOM Elements (Selecting elements from HTML) ---
const generateBtn = document.getElementById("generate-btn");
const memeImg = document.getElementById("meme-img");
const memeTitle = document.getElementById("meme-title");
const memeAuthor = document.getElementById("meme-author");
const memeDisplay = document.getElementById("meme-display");

// --- Functions ---

/**
 * Updates the UI state to "Loading"
 * Disables button and shows spinner
 */
const showLoading = () => {
  memeDisplay.classList.add("loading");
  memeDisplay.classList.remove("error");
  memeImg.classList.remove("active"); // Hide image while loading
  generateBtn.disabled = true;
  generateBtn.textContent = "Fetching Meme...";
};

/**
 * Updates the UI state to "Active" (Meme loaded)
 */
const hideLoading = () => {
  memeDisplay.classList.remove("loading");
  memeImg.classList.add("active"); // Fade image in
  generateBtn.disabled = false;
  generateBtn.textContent = "Get New Meme 🚀";
};

/**
 * Updates the UI state to "Error"
 */
const showError = () => {
  memeDisplay.classList.remove("loading");
  memeDisplay.classList.add("error");
  generateBtn.disabled = false;
  generateBtn.textContent = "Try Again 🔄";
};

/**
 * Main function to fetch meme data
 * Uses async/await for modern asynchronous handling
 */
const getMeme = async () => {
  // 1. Start loading state
  showLoading();

  try {
    // 2. Fetch data from API
    const response = await fetch(API_URL);

    // Check if response is okay (status 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 3. Set content in the DOM
    updateMemeUI(data);
  } catch (error) {
    console.error("Error fetching meme:", error);
    showError();
  }
};

/**
 * Updates the DOM elements with API data
 * Note: We wait for the image to actually load before hiding the spinner
 */
const updateMemeUI = (data) => {
  const { url, title, author, subreddit } = data;

  // Set Text Content
  memeTitle.innerText = title;
  memeAuthor.innerText = `r/${subreddit} | by ${author}`;

  // Set Image Source
  memeImg.src = url;
  memeImg.alt = title;

  // IMPORTANT: Wait for image to download before showing it
  // If we simply hideLoading() now, the user sees a blank space while the image downloads.
  memeImg.onload = () => {
    hideLoading();
  };

  // Handle broken image links
  memeImg.onerror = () => {
    showError();
  };
};

// --- Event Listeners ---

// Fetch a meme when the button is clicked
generateBtn.addEventListener("click", getMeme);

// Fetch a meme automatically when the page loads
document.addEventListener("DOMContentLoaded", getMeme);

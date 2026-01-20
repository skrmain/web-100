/* CONFIGURATION 
  Replace 'YOUR_ACCESS_KEY' with your actual Unsplash API Key.
*/
const accessKey = "YOUR_ACCESS_KEY_HERE";
const apiUrl = "https://api.unsplash.com/search/photos";

// --- DOM Elements Selection ---
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const imageGrid = document.getElementById("image-grid");
const showMoreBtn = document.getElementById("show-more-btn");
const loader = document.getElementById("loader");
const errorMsg = document.getElementById("error-msg");

// --- State Variables ---
let keyword = ""; // Stores the current search query
let page = 1; // Tracks the current page number for pagination

// --- Event Listeners ---

// 1. Handle Form Submission
searchForm.addEventListener("submit", (e) => {
  e.preventDefault(); // Prevent page reload

  keyword = searchInput.value.trim();
  if (!keyword) return; // Do nothing if input is empty

  // Reset for a new search
  page = 1;
  imageGrid.innerHTML = "";
  errorMsg.classList.add("hidden");

  fetchImages();
});

// 2. Handle "Show More" Button Click
showMoreBtn.addEventListener("click", () => {
  page++; // Increment page number
  fetchImages();
});

// --- Main Function: Fetch Images from API ---
async function fetchImages() {
  // Show loading spinner
  loader.classList.remove("hidden");
  showMoreBtn.classList.add("hidden"); // Hide button while loading

  try {
    // Construct the API URL with Query Parameters
    const url = `${apiUrl}?page=${page}&query=${keyword}&client_id=${accessKey}&per_page=12`;

    // Fetch data using async/await
    const response = await fetch(url);

    // Check for HTTP errors (e.g., 401 Unauthorized, 403 Rate Limit)
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Handle case where no results are found
    if (data.results.length === 0 && page === 1) {
      showError("No images found. Try a different keyword!");
      return;
    }

    // Render the images to the DOM
    displayImages(data.results);

    // Show "Show More" button if there are more pages available
    if (page < data.total_pages) {
      showMoreBtn.classList.remove("hidden");
    } else {
      showMoreBtn.classList.add("hidden");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    showError("Something went wrong. Please check your internet or API key.");
  } finally {
    // Hide loader regardless of success or failure
    loader.classList.add("hidden");
  }
}

// --- Helper Function: Render Images ---
function displayImages(results) {
  results.forEach((result) => {
    // Create the card container
    const card = document.createElement("div");
    card.classList.add("image-card");

    // Create the image element
    const img = document.createElement("img");
    img.src = result.urls.small; // Use 'small' for better performance
    img.alt = result.alt_description || "Unsplash Image";
    img.loading = "lazy"; // Native lazy loading for performance

    // Open full image on click
    img.onclick = () => window.open(result.links.html, "_blank");

    // Create the info section (Photographer info)
    const info = document.createElement("div");
    info.classList.add("image-info");

    // Use template literals for cleaner HTML insertion
    info.innerHTML = `
            <div class="user-info">
                <img src="${result.user.profile_image.small}" alt="${result.user.name}" class="user-thumb">
                <a href="${result.user.links.html}" target="_blank" class="photographer-name">
                    ${result.user.name}
                </a>
            </div>
        `;

    // Append elements to card, then card to grid
    card.appendChild(img);
    card.appendChild(info);
    imageGrid.appendChild(card);
  });
}

// --- Helper Function: Display Error Messages ---
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
  loader.classList.add("hidden");
}

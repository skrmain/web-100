// --- Configuration ---
// ⚠️ REPLACE 'YOUR_API_KEY' WITH YOUR ACTUAL KEY FROM OMDB (e.g., 'a1b2c3d4')
const API_KEY = "YOUR_API_KEY";
const API_URL = "https://www.omdbapi.com/";

// --- DOM Elements ---
const searchInput = document.getElementById("search-input");
const movieGrid = document.getElementById("movie-grid");
const statusMessage = document.getElementById("status-message");
const modal = document.getElementById("movie-modal");
const modalBody = document.getElementById("modal-body");
const closeModalBtn = document.getElementById("close-modal");

// --- State Management ---
let searchTimeoutToken = 0;

// --- Event Listeners ---

// 1. Debounced Search Input
// Wait 500ms after user stops typing before fetching
searchInput.addEventListener("input", (e) => {
  clearTimeout(searchTimeoutToken);
  const query = e.target.value.trim();

  if (query.length === 0) {
    clearGrid();
    return;
  }

  searchTimeoutToken = setTimeout(() => {
    fetchMovies(query);
  }, 500);
});

// 2. Close Modal
closeModalBtn.addEventListener("click", () => {
  modal.close(); // Native dialog method
  document.body.style.overflow = "auto"; // Restore scrolling
});

// 3. Close modal if clicking outside content
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.close();
    document.body.style.overflow = "auto";
  }
});

// --- Core Functions ---

/**
 * Fetches movies based on search query
 */
async function fetchMovies(query) {
  showLoading();

  try {
    // Fetch data using async/await
    const response = await fetch(`${API_URL}?apikey=${API_KEY}&s=${query}`);
    const data = await response.json();

    if (data.Response === "True") {
      displayMovies(data.Search);
      hideStatus();
    } else {
      // API returns error (e.g., "Movie not found!")
      showError(data.Error);
    }
  } catch (error) {
    showError("Network error. Please try again.");
    console.error("Fetch error:", error);
  }
}

/**
 * Renders the list of movies as cards
 */
function displayMovies(movies) {
  clearGrid(); // Remove old results

  movies.forEach((movie) => {
    // Create card element
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.id = movie.imdbID; // Store ID for detail fetch

    // Handle missing posters
    const posterSrc =
      movie.Poster !== "N/A"
        ? movie.Poster
        : "https://via.placeholder.com/300x450?text=No+Poster";

    card.innerHTML = `
            <img src="${posterSrc}" alt="${movie.Title}" loading="lazy">
            <div class="card-info">
                <h3 class="card-title">${movie.Title}</h3>
                <div class="card-meta">
                    <span>${movie.Year}</span>
                    <span>${capitalize(movie.Type)}</span>
                </div>
            </div>
        `;

    // Add click event for details
    card.addEventListener("click", () => fetchMovieDetails(movie.imdbID));

    movieGrid.appendChild(card);
  });
}

/**
 * Fetches detailed info for a specific movie ID
 */
async function fetchMovieDetails(id) {
  try {
    const response = await fetch(
      `${API_URL}?apikey=${API_KEY}&i=${id}&plot=full`,
    );
    const movie = await response.json();

    if (movie.Response === "True") {
      showModal(movie);
    }
  } catch (error) {
    console.error("Detail fetch error:", error);
  }
}

/**
 * Renders modal content and opens the dialog
 */
function showModal(movie) {
  const posterSrc =
    movie.Poster !== "N/A"
      ? movie.Poster
      : "https://via.placeholder.com/300x450?text=No+Poster";

  modalBody.innerHTML = `
        <div class="modal-details">
            <img src="${posterSrc}" alt="${movie.Title}" style="width:100%; border-radius:8px;">
            <div>
                <h2>${movie.Title} <span style="font-size:0.8em; color:#888;">(${movie.Year})</span></h2>
                <p style="margin: 0.5rem 0;"><strong>Genre:</strong> ${movie.Genre}</p>
                <p style="margin: 0.5rem 0;"><strong>Runtime:</strong> ${movie.Runtime}</p>
                <p style="margin: 0.5rem 0;"><strong>IMDb Rating:</strong> ⭐ ${movie.imdbRating}</p>
                <p style="margin: 1rem 0; line-height: 1.6;">${movie.Plot}</p>
                <p><strong>Actors:</strong> ${movie.Actors}</p>
            </div>
        </div>
    `;

  modal.showModal(); // Native dialog method
  document.body.style.overflow = "hidden"; // Prevent background scrolling
}

// --- Utility Helpers ---

function showLoading() {
  clearGrid();
  statusMessage.textContent = "Loading movies...";
  statusMessage.classList.remove("hidden");
}

function showError(message) {
  clearGrid();
  statusMessage.textContent = message;
  statusMessage.classList.remove("hidden");
}

function hideStatus() {
  statusMessage.classList.add("hidden");
}

function clearGrid() {
  movieGrid.innerHTML = "";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

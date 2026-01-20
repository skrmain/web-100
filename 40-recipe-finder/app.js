// --- Constants ---
const API_BASE = "https://www.themealdb.com/api/json/v1/1/search.php?s=";

// --- DOM Elements ---
const searchInput = document.getElementById("search-input");
const recipeGrid = document.getElementById("recipe-grid");
const statusMessage = document.getElementById("status-message");
const themeToggle = document.getElementById("theme-toggle");
const modal = document.getElementById("recipe-modal");
const modalBody = document.getElementById("modal-body");
const closeModalBtn = document.getElementById("close-modal");

// --- State ---
let debounceTimer;

// --- Event Listeners ---

// 1. Search Input with Debounce
// Prevents API calls on every keystroke, waits 500ms after user stops typing
searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();

  // Clear previous timer
  clearTimeout(debounceTimer);

  // Set new timer
  debounceTimer = setTimeout(() => {
    if (query.length > 0) {
      fetchRecipes(query);
    } else {
      recipeGrid.innerHTML = "";
      showStatus("");
    }
  }, 500);
});

// 2. Theme Toggle
themeToggle.addEventListener("click", () => {
  const isDark = document.body.getAttribute("data-theme") === "dark";
  document.body.setAttribute("data-theme", isDark ? "light" : "dark");
  themeToggle.textContent = isDark ? "🌙" : "☀️";
});

// 3. Modal Closure
closeModalBtn.addEventListener("click", () => modal.close());
// Close when clicking outside the modal content
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.close();
});

// --- Core Functions ---

/**
 * Fetch recipes from API asynchronously
 * @param {string} query - The search term
 */
async function fetchRecipes(query) {
  showStatus("Loading delicious recipes...");
  recipeGrid.innerHTML = "";

  try {
    const response = await fetch(`${API_BASE}${query}`);
    const data = await response.json();

    if (data.meals) {
      showStatus(""); // Clear loading text
      displayRecipes(data.meals);
    } else {
      showStatus('No recipes found. Try "Chicken" or "Pasta"!');
    }
  } catch (error) {
    console.error("Fetch error:", error);
    showStatus("Error fetching data. Please check your connection.");
  }
}

/**
 * Render the list of recipe cards
 * @param {Array} recipes - Array of recipe objects
 */
function displayRecipes(recipes) {
  recipes.forEach((recipe) => {
    const card = document.createElement("article");
    card.className = "recipe-card";
    // View Transition Name (Unique ID for potential future animations)
    card.style.viewTransitionName = `recipe-${recipe.idMeal}`;

    card.innerHTML = `
            <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" loading="lazy">
            <div class="card-info">
                <h3>${recipe.strMeal}</h3>
                <span>${recipe.strArea}</span>
                <span>${recipe.strCategory}</span>
            </div>
        `;

    // Add click event to open details
    card.addEventListener("click", () => openRecipeDetails(recipe));

    recipeGrid.appendChild(card);
  });
}

/**
 * Helper to show/hide status messages
 */
function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.classList.remove("hidden");
  if (!message) statusMessage.classList.add("hidden");
}

/**
 * Populate and open the details modal
 * @param {Object} recipe - The specific recipe data
 */
function openRecipeDetails(recipe) {
  // 1. Gather ingredients (TheMealDB formats them as strIngredient1, strIngredient2...)
  let ingredientsList = "";
  for (let i = 1; i <= 20; i++) {
    const ingredient = recipe[`strIngredient${i}`];
    const measure = recipe[`strMeasure${i}`];

    if (ingredient && ingredient.trim() !== "") {
      ingredientsList += `<li>${measure} ${ingredient}</li>`;
    }
  }

  // 2. Build Modal HTML
  modalBody.innerHTML = `
        <div class="modal-header">
            <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
        </div>
        <h2>${recipe.strMeal}</h2>
        <p><strong>Cuisine:</strong> ${recipe.strArea} | <strong>Category:</strong> ${recipe.strCategory}</p>
        
        <h4>Ingredients:</h4>
        <ul>${ingredientsList}</ul>
        
        <h4>Instructions:</h4>
        <p>${recipe.strInstructions.replace(/\r\n/g, "<br>")}</p>
        
        <br>
        ${recipe.strYoutube ? `<a href="${recipe.strYoutube}" target="_blank">🎥 Watch on YouTube</a>` : ""}
    `;

  // 3. Show Modal
  modal.showModal();
}

/* =========================================
   1. MOCK DATASET (Tech Products)
   ========================================= */
const dataset = [
  {
    id: 1,
    name: "MacBook Pro 16",
    category: "Laptop",
    price: "$2499",
    description:
      "Powerful M2 Max chip with stunning Liquid Retina XDR display for professionals.",
  },
  {
    id: 2,
    name: "Dell XPS 13",
    category: "Laptop",
    price: "$999",
    description:
      "Ultra-thin, lightweight design with an InfinityEdge display and Intel Core i7.",
  },
  {
    id: 3,
    name: "iPhone 15 Pro",
    category: "Smartphone",
    price: "$999",
    description: "Titanium design, A17 Pro chip, and advanced camera system.",
  },
  {
    id: 4,
    name: "Sony WH-1000XM5",
    category: "Audio",
    price: "$398",
    description:
      "Industry-leading noise canceling headphones with exceptional sound quality.",
  },
  {
    id: 5,
    name: "Logitech MX Master 3S",
    category: "Accessory",
    price: "$99",
    description:
      "Performance wireless mouse with 8K DPI tracking and quiet clicks.",
  },
  {
    id: 6,
    name: "Samsung Galaxy S24",
    category: "Smartphone",
    price: "$799",
    description:
      "AI-powered smartphone with Nightography and long-lasting battery.",
  },
  {
    id: 7,
    name: "Keychron K2",
    category: "Accessory",
    price: "$79",
    description:
      "Wireless mechanical keyboard with Gateron switches and compact layout.",
  },
  {
    id: 8,
    name: "iPad Air",
    category: "Tablet",
    price: "$599",
    description: "Versatile tablet with M1 chip, compatible with Apple Pencil.",
  },
  {
    id: 9,
    name: "Kindle Paperwhite",
    category: "E-Reader",
    price: "$139",
    description: "Waterproof reading device with adjustable warm light.",
  },
  {
    id: 10,
    name: "NVIDIA RTX 4090",
    category: "Component",
    price: "$1599",
    description: "The ultimate graphics card for gamers and creators.",
  },
  {
    id: 11,
    name: "Google Pixel 8",
    category: "Smartphone",
    price: "$699",
    description: "The helpful phone engineered by Google with the G3 chip.",
  },
];

/* =========================================
   2. STATE MANAGEMENT
   ========================================= */
const state = {
  query: "",
  results: [...dataset], // Start with all data
};

// DOM Elements
const searchInput = document.getElementById("search-input");
const resultsContainer = document.getElementById("results-container");
const noResultsElement = document.getElementById("no-results");
const statsElement = document.getElementById("stats");

/* =========================================
   3. HELPER FUNCTIONS
   ========================================= */

/**
 * Debounce Function
 * Delays execution until the user stops typing for (delay) ms.
 */
function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Highlight Match
 * Wraps matched text in <mark> tags using Regex.
 */
function highlightText(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi"); // gi = global, case-insensitive
  return text.replace(regex, "<mark>$1</mark>");
}

/* =========================================
   4. SEARCH LOGIC (With Ranking)
   ========================================= */
function performSearch(query) {
  const cleanQuery = query.toLowerCase().trim();
  state.query = cleanQuery;

  if (!cleanQuery) {
    state.results = dataset;
    renderResults();
    return;
  }

  // Filter and Rank
  const scoredResults = dataset
    .map((item) => {
      let score = 0;
      const name = item.name.toLowerCase();
      const desc = item.description.toLowerCase();
      const cat = item.category.toLowerCase();

      // Ranking Logic:
      // 1. Exact match in Name (Highest priority)
      if (name === cleanQuery) score += 100;
      // 2. Name starts with Query
      else if (name.startsWith(cleanQuery)) score += 50;
      // 3. Name contains Query
      else if (name.includes(cleanQuery)) score += 20;

      // 4. Description or Category contains Query (Lower priority)
      if (desc.includes(cleanQuery)) score += 5;
      if (cat.includes(cleanQuery)) score += 5;

      return { item, score };
    })
    .filter((result) => result.score > 0) // Remove non-matches
    .sort((a, b) => b.score - a.score); // Sort by highest score

  // Unwrap items from the score object
  state.results = scoredResults.map((result) => result.item);

  renderResults();
}

/* =========================================
   5. RENDERING UI
   ========================================= */
function renderResults() {
  resultsContainer.innerHTML = ""; // Clear current results

  // Handle Empty State
  if (state.results.length === 0) {
    noResultsElement.classList.remove("hidden");
    statsElement.textContent = `Found 0 results for "${state.query}"`;
    return;
  }

  noResultsElement.classList.add("hidden");
  statsElement.textContent = state.query
    ? `Found ${state.results.length} result${state.results.length > 1 ? "s" : ""}`
    : `Showing all ${state.results.length} items`;

  // Generate HTML for each card
  state.results.forEach((product) => {
    const card = document.createElement("div");
    card.className = "card";

    // Apply highlighting if a search is active
    const displayName = highlightText(product.name, state.query);
    const displayDesc = highlightText(product.description, state.query);
    const displayCat = highlightText(product.category, state.query);

    card.innerHTML = `
            <div class="card-category">${displayCat}</div>
            <h2 class="card-title">${displayName}</h2>
            <p class="card-desc">${displayDesc}</p>
            <div class="card-price">${product.price}</div>
        `;

    resultsContainer.appendChild(card);
  });
}

/* =========================================
   6. EVENT LISTENERS
   ========================================= */

// Apply Debounce (wait 300ms after typing stops)
const debouncedSearch = debounce((e) => {
  performSearch(e.target.value);
}, 300);

searchInput.addEventListener("input", debouncedSearch);

// Initial Render
renderResults();

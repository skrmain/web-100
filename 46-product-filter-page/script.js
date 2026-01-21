/* --- 1. Dataset (Dummy Data) --- */
const products = [
  {
    id: 1,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 120,
    rating: 4.5,
  },
  { id: 2, name: "Running Shoes", category: "Fashion", price: 85, rating: 4.7 },
  { id: 3, name: "Coffee Maker", category: "Home", price: 45, rating: 4.2 },
  { id: 4, name: "Yoga Mat", category: "Sports", price: 25, rating: 4.8 },
  {
    id: 5,
    name: "Smart Watch",
    category: "Electronics",
    price: 199,
    rating: 4.6,
  },
  { id: 6, name: "Denim Jacket", category: "Fashion", price: 60, rating: 4.3 },
  { id: 7, name: "Blender", category: "Home", price: 35, rating: 4.1 },
  { id: 8, name: "Dumbbell Set", category: "Sports", price: 55, rating: 4.5 },
  {
    id: 9,
    name: "Gaming Mouse",
    category: "Electronics",
    price: 40,
    rating: 4.4,
  },
  { id: 10, name: "Sunglasses", category: "Fashion", price: 15, rating: 3.9 },
  { id: 11, name: "Desk Lamp", category: "Home", price: 20, rating: 4.0 },
  {
    id: 12,
    name: "Tennis Racket",
    category: "Sports",
    price: 110,
    rating: 4.7,
  },
];

/* --- 2. State Management --- */
// We keep a 'state' object to track active filters
let state = {
  products: products,
  filters: {
    search: "",
    category: "all",
    maxPrice: 200,
  },
};

/* --- 3. DOM Elements --- */
const productGrid = document.getElementById("product-grid");
const searchInput = document.getElementById("search-input");
const categoryBtns = document.querySelectorAll(".cat-btn");
const priceRange = document.getElementById("price-range");
const priceValue = document.getElementById("price-value");
const emptyState = document.getElementById("empty-state");
const clearBtn = document.getElementById("clear-filters-btn");

/* --- 4. Initialization --- */
function init() {
  renderProducts(state.products);
  setupEventListeners();
}

/* --- 5. Rendering Logic --- */
function renderProducts(productsToRender) {
  productGrid.innerHTML = ""; // Clear existing grid

  // Check for empty results
  if (productsToRender.length === 0) {
    productGrid.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  productGrid.classList.remove("hidden");
  emptyState.classList.add("hidden");

  // Create a fragment to minimize reflows (Optimization)
  const fragment = document.createDocumentFragment();

  productsToRender.forEach((product) => {
    const card = document.createElement("article");
    card.className = "card";

    // Using emoji as placeholder images for simplicity
    const icons = {
      Electronics: "💻",
      Fashion: "👕",
      Home: "🏠",
      Sports: "⚽",
    };

    card.innerHTML = `
            <div class="card-img-placeholder">${icons[product.category] || "📦"}</div>
            <div class="card-content">
                <span class="card-cat">${product.category}</span>
                <h3 class="card-title">${product.name}</h3>
                <div class="card-footer">
                    <span class="card-price">$${product.price}</span>
                    <span class="card-rating">★ ${product.rating}</span>
                </div>
            </div>
        `;
    fragment.appendChild(card);
  });

  productGrid.appendChild(fragment);
}

/* --- 6. Filtering Logic --- */
// Core function: Applies all filters in sequence
function filterProducts() {
  const { search, category, maxPrice } = state.filters;

  const filtered = state.products.filter((product) => {
    // 1. Category Match
    const matchCategory = category === "all" || product.category === category;

    // 2. Price Match
    const matchPrice = product.price <= maxPrice;

    // 3. Search Match (Case insensitive)
    const matchSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchCategory && matchPrice && matchSearch;
  });

  renderProducts(filtered);
}

/* --- 7. Event Listeners --- */
function setupEventListeners() {
  // A. Search Input with Debounce
  // Debounce prevents filtering on every single keystroke, waiting until user stops typing
  const handleSearch = debounce((e) => {
    state.filters.search = e.target.value;
    filterProducts();
  }, 300);

  searchInput.addEventListener("input", handleSearch);

  // B. Category Buttons
  categoryBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Remove active class from all, add to clicked
      categoryBtns.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      // Update State
      state.filters.category = e.target.dataset.category;
      filterProducts();
    });
  });

  // C. Price Range Slider
  priceRange.addEventListener("input", (e) => {
    const value = e.target.value;
    priceValue.textContent = `$${value}`; // Update text UI immediately
    state.filters.maxPrice = Number(value);
    filterProducts();
  });

  // D. Clear Filters (Empty State)
  clearBtn.addEventListener("click", () => {
    // Reset State
    state.filters = { search: "", category: "all", maxPrice: 200 };

    // Reset UI controls
    searchInput.value = "";
    priceRange.value = 200;
    priceValue.textContent = "$200";
    categoryBtns.forEach((b) => b.classList.remove("active"));
    document.querySelector('[data-category="all"]').classList.add("active");

    filterProducts();
  });
}

/* --- 8. Utility Functions --- */
// Standard Debounce implementation
function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
}

// Start the app
init();

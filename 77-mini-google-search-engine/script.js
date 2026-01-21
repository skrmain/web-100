/* =========================================
   1. MOCK DATA (The "Internet")
   ========================================= */
const DATA_SOURCE = [
  {
    id: 1,
    title: "Introduction to JavaScript ES6",
    url: "https://dev.docs/js/es6-intro",
    tags: ["javascript", "coding", "web"],
    content:
      "ES6 brought major changes to JavaScript including arrow functions, const/let, and classes. It modernized web development.",
  },
  {
    id: 2,
    title: "Best Pizza Recipes in Italy",
    url: "https://cooking.master/pizza-italy",
    tags: ["cooking", "food", "recipes"],
    content:
      "Authentic Neapolitan pizza requires San Marzano tomatoes, mozzarella di bufala, and a wood-fired oven.",
  },
  {
    id: 3,
    title: "Understanding CSS Flexbox",
    url: "https://css-tricks.mock/flexbox",
    tags: ["css", "design", "web"],
    content:
      "Flexbox makes aligning items easy. Use justify-content and align-items to center elements perfectly on the page.",
  },
  {
    id: 4,
    title: "History of the Roman Empire",
    url: "https://history.edu/rome",
    tags: ["history", "rome", "ancient"],
    content:
      "The Roman Empire controlled the Mediterranean. Julius Caesar and Augustus are key figures in its rise.",
  },
  {
    id: 5,
    title: "Top 10 Hiking Trails in Colorado",
    url: "https://nature.hike/colorado",
    tags: ["travel", "nature", "hiking"],
    content:
      "Colorado offers stunning trails like Rocky Mountain National Park. Prepare for high altitude and beautiful vistas.",
  },
  {
    id: 6,
    title: "Python vs JavaScript for Beginners",
    url: "https://code.compare/py-vs-js",
    tags: ["python", "javascript", "coding"],
    content:
      "Python is great for data science, while JavaScript rules the web. Both are excellent choices for new developers.",
  },
  {
    id: 7,
    title: "Quantum Physics 101",
    url: "https://science.daily/quantum",
    tags: ["science", "physics", "quantum"],
    content:
      "Quantum entanglement and superposition challenge our understanding of reality at the subatomic level.",
  },
  {
    id: 8,
    title: "How to Bake Sourdough Bread",
    url: "https://baking.love/sourdough",
    tags: ["cooking", "baking", "food"],
    content:
      "Creating a starter takes time. Fermentation gives sourdough its distinct tang and airy texture.",
  },
  {
    id: 9,
    title: "SpaceX and the Future of Mars",
    url: "https://space.news/mars-mission",
    tags: ["space", "technology", "future"],
    content:
      "Elon Musk aims to colonize Mars using the Starship rocket. Interplanetary travel is the next frontier.",
  },
  {
    id: 10,
    title: "React.js: A Complete Guide",
    url: "https://react.dev/guide",
    tags: ["javascript", "react", "web"],
    content:
      "React is a library for building UIs. It uses a virtual DOM and component-based architecture for speed.",
  },
  {
    id: 11,
    title: "Cardio vs Weight Training",
    url: "https://fitness.hub/cardio-weights",
    tags: ["fitness", "health", "gym"],
    content:
      "Cardio improves heart health, while weight training builds muscle density. A balance of both is optimal.",
  },
  {
    id: 12,
    title: "The Art of Minimalist Design",
    url: "https://design.blog/minimalism",
    tags: ["design", "art", "style"],
    content:
      "Less is more. Minimalist design focuses on whitespace, typography, and removing unnecessary elements.",
  },
  {
    id: 13,
    title: "Machine Learning Algorithms Explained",
    url: "https://ai.tech/ml-algos",
    tags: ["tech", "ai", "data"],
    content:
      "From linear regression to neural networks, machine learning powers modern AI applications.",
  },
  {
    id: 14,
    title: "Gardening Tips for Spring",
    url: "https://garden.life/spring-tips",
    tags: ["nature", "gardening", "home"],
    content:
      "Plant tulips and daffodils in the fall for spring blooms. Ensure soil is well-drained and nutrient-rich.",
  },
  {
    id: 15,
    title: "Advanced CSS Grid Layouts",
    url: "https://css.pro/grid-layout",
    tags: ["css", "web", "design"],
    content:
      "CSS Grid allows 2-dimensional layouts. Define rows and columns to create complex magazine-style webs.",
  },
  {
    id: 16,
    title: "Meditation for Stress Relief",
    url: "https://mind.wellness/meditation",
    tags: ["health", "mindfulness", "wellness"],
    content:
      "Daily mindfulness practice reduces cortisol levels. Focus on your breath to anchor your mind.",
  },
  {
    id: 17,
    title: "Blockchain Beyond Bitcoin",
    url: "https://crypto.tech/blockchain",
    tags: ["tech", "crypto", "finance"],
    content:
      "Smart contracts and decentralized finance (DeFi) are expanding the utility of blockchain technology.",
  },
  {
    id: 18,
    title: "Photography Basics: Aperture and ISO",
    url: "https://photo.learn/basics",
    tags: ["art", "photography", "tech"],
    content:
      "Aperture controls depth of field, while ISO controls light sensitivity. Mastering these is key to manual mode.",
  },
  {
    id: 19,
    title: "The Industrial Revolution",
    url: "https://history.world/industrial",
    tags: ["history", "economy", "europe"],
    content:
      "The shift to powered machinery changed society forever, starting in Britain in the 18th century.",
  },
  {
    id: 20,
    title: "Effective Remote Work Strategies",
    url: "https://work.remote/tips",
    tags: ["business", "productivity", "work"],
    content:
      "Communication and defined working hours are crucial for avoiding burnout while working from home.",
  },
  {
    id: 21,
    title: "Understanding TypeScript",
    url: "https://ts.dev/intro",
    tags: ["javascript", "coding", "typescript"],
    content:
      "TypeScript adds static typing to JavaScript, reducing runtime errors and improving code maintainability.",
  },
  {
    id: 22,
    title: "Classic French Cuisine",
    url: "https://chef.france/classic",
    tags: ["cooking", "food", "travel"],
    content:
      "Master the mother sauces: Béchamel, Velouté, Espagnole, Sauce Tomate, and Hollandaise.",
  },
  {
    id: 23,
    title: "Global Warming Effects",
    url: "https://climate.change/warning",
    tags: ["science", "nature", "climate"],
    content:
      "Rising sea levels and extreme weather patterns are direct results of increased greenhouse gases.",
  },
  {
    id: 24,
    title: "Introduction to SQL",
    url: "https://db.data/sql",
    tags: ["coding", "database", "tech"],
    content:
      "SELECT * FROM users WHERE active = true. SQL is the standard language for relational database management.",
  },
  {
    id: 25,
    title: "How Electric Cars Work",
    url: "https://auto.ev/how-it-works",
    tags: ["technology", "cars", "energy"],
    content:
      "EVs use battery packs and electric motors instead of internal combustion engines for zero emissions.",
  },
  {
    id: 26,
    title: "The Golden Age of Hollywood",
    url: "https://film.history/golden-age",
    tags: ["history", "movies", "art"],
    content:
      "From the late 1920s to 1960s, the studio system produced thousands of classic films.",
  },
  {
    id: 27,
    title: "Yoga Poses for Flexibility",
    url: "https://yoga.flow/flexibility",
    tags: ["health", "fitness", "yoga"],
    content:
      "Downward dog and pigeon pose help open up the hips and hamstrings effectively.",
  },
  {
    id: 28,
    title: "Cybersecurity Best Practices",
    url: "https://sec.net/practices",
    tags: ["tech", "security", "internet"],
    content:
      "Use strong passwords, enable 2FA, and beware of phishing emails to keep your data safe.",
  },
  {
    id: 29,
    title: "The Solar System",
    url: "https://astro.space/solar-system",
    tags: ["space", "science", "nature"],
    content:
      "Jupiter is the largest planet, while Mercury is closest to the Sun. Earth is the only known habitable zone.",
  },
  {
    id: 30,
    title: "Writing a Novel: Plot Structure",
    url: "https://write.lit/plot",
    tags: ["writing", "art", "creativity"],
    content:
      "The three-act structure is the most common framework for storytelling: Setup, Confrontation, and Resolution.",
  },
];

/* =========================================
   2. SEARCH ENGINE CORE (Logic)
   ========================================= */

// Configuration
const CONFIG = {
  resultsPerPage: 10,
  debounceTime: 300,
  weights: {
    title: 10,
    tags: 5,
    content: 1,
  },
};

// State Management
const state = {
  query: "",
  filteredResults: [],
  currentPage: 1,
  timeTaken: 0,
  isHomeView: true,
};

/**
 * Tokenizer & Normalizer
 * Converts text to lowercase, removes punctuation, and splits into array of words.
 * @param {string} text
 * @returns {string[]} Array of tokens
 */
const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim()
    .split(" ");
};

/**
 * Relevance Scoring Algorithm
 * Calculates a score for a document based on query matches in different fields.
 */
const calculateRelevance = (doc, queryTokens) => {
  let score = 0;

  // Pre-process doc fields
  const titleTokens = tokenize(doc.title);
  const contentTokens = tokenize(doc.content);
  const tagTokens = doc.tags.map((t) => t.toLowerCase());

  queryTokens.forEach((token) => {
    // 1. Title Match (High Priority)
    if (titleTokens.includes(token)) {
      score += CONFIG.weights.title;
    }

    // 2. Tags Match (Medium Priority)
    // Check if any tag contains the token or equals it
    if (tagTokens.some((tag) => tag.includes(token))) {
      score += CONFIG.weights.tags;
    }

    // 3. Content/Description Match (Low Priority)
    if (contentTokens.includes(token)) {
      score += CONFIG.weights.content;
    }
  });

  return score;
};

/**
 * Main Search Function
 * Filters, scores, and sorts data.
 */
const performSearch = (query) => {
  const startTime = performance.now();
  const queryTokens = tokenize(query);

  if (
    queryTokens.length === 0 ||
    (queryTokens.length === 1 && queryTokens[0] === "")
  ) {
    state.filteredResults = [];
    return;
  }

  // Map results to include score
  const scoredResults = DATA_SOURCE.map((doc) => {
    return {
      ...doc,
      score: calculateRelevance(doc, queryTokens),
    };
  });

  // Filter out zero scores and Sort descending by score
  state.filteredResults = scoredResults
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score);

  const endTime = performance.now();
  state.timeTaken = ((endTime - startTime) / 1000).toFixed(4);
  state.currentPage = 1;
};

/* =========================================
   3. DOM & UI LOGIC
   ========================================= */

const elements = {
  app: document.getElementById("app"),
  input: document.getElementById("searchInput"),
  clearBtn: document.getElementById("clearBtn"),
  resultsContainer: document.getElementById("resultsContainer"),
  pagination: document.getElementById("pagination"),
  stats: document.getElementById("searchStats"),
  main: document.querySelector(".results-main"),
  logo: document.querySelector(".logo"),
};

// Debounce Utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// Highlighter Utility
// Safely highlights keywords in text without breaking HTML
const highlightText = (text, query) => {
  if (!query) return text;
  const tokens = tokenize(query);
  // Create a regex that matches any of the tokens, case insensitive
  const regex = new RegExp(`(${tokens.join("|")})`, "gi");
  return text.replace(regex, "<mark>$1</mark>"); // Google style: usually bold, here using mark for visibility
};

// Render Functions
const renderStats = () => {
  if (state.filteredResults.length > 0) {
    elements.stats.textContent = `About ${state.filteredResults.length} results (${state.timeTaken} seconds)`;
  } else {
    elements.stats.textContent = `No results found (${state.timeTaken} seconds)`;
  }
};

const renderPagination = () => {
  elements.pagination.innerHTML = "";
  const totalPages = Math.ceil(
    state.filteredResults.length / CONFIG.resultsPerPage,
  );

  if (totalPages <= 1) return;

  // Previous Button
  const prevBtn = document.createElement("button");
  prevBtn.className = "page-btn";
  prevBtn.textContent = "Previous";
  prevBtn.disabled = state.currentPage === 1;
  prevBtn.onclick = () => changePage(state.currentPage - 1);
  elements.pagination.appendChild(prevBtn);

  // Next Button
  const nextBtn = document.createElement("button");
  nextBtn.className = "page-btn";
  nextBtn.textContent = "Next";
  nextBtn.disabled = state.currentPage === totalPages;
  nextBtn.onclick = () => changePage(state.currentPage + 1);
  elements.pagination.appendChild(nextBtn);
};

const renderResults = () => {
  elements.resultsContainer.innerHTML = "";

  // Slice for pagination
  const start = (state.currentPage - 1) * CONFIG.resultsPerPage;
  const end = start + CONFIG.resultsPerPage;
  const pageResults = state.filteredResults.slice(start, end);

  if (pageResults.length === 0) {
    elements.resultsContainer.innerHTML = `<p>Your search - <strong>${state.query}</strong> - did not match any documents.</p>`;
    return;
  }

  pageResults.forEach((doc) => {
    const card = document.createElement("div");
    card.className = "result-card";

    const highlightedDesc = highlightText(doc.content, state.query);

    card.innerHTML = `
            <a href="${doc.url}" class="result-url">${doc.url}</a>
            <a href="${doc.url}" class="result-title">${doc.title}</a> <div class="result-desc">${highlightedDesc}</div>
            <div class="result-tags">
                ${doc.tags.map((tag) => `<span class="tag-badge">${tag}</span>`).join("")}
            </div>
        `;
    elements.resultsContainer.appendChild(card);
  });
};

const updateUI = () => {
  // Transition to Results View if not already
  if (state.query.length > 0 && state.isHomeView) {
    elements.app.classList.remove("view-home");
    elements.app.classList.add("view-results");
    elements.main.style.display = "block";
    state.isHomeView = false;
  } else if (state.query.length === 0 && !state.isHomeView) {
    // Optional: Revert to home if input cleared?
    // Google doesn't usually revert fully, but let's stay on results view for stability
    // or clear results. Here we clear results.
  }

  elements.clearBtn.style.display = state.query.length > 0 ? "block" : "none";

  renderStats();
  renderResults();
  renderPagination();
};

const changePage = (newPage) => {
  state.currentPage = newPage;
  renderResults();
  renderPagination();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Event Handlers
const handleSearch = (e) => {
  const value = e.target.value;
  state.query = value;

  if (value.trim() === "") {
    state.filteredResults = [];
    renderResults(); // Clears view
    elements.stats.textContent = "";
    elements.pagination.innerHTML = "";
    return;
  }

  performSearch(value);
  updateUI();
};

const handleClear = () => {
  state.query = "";
  state.filteredResults = [];
  elements.input.value = "";
  elements.input.focus();
  // We stay in results view but empty
  updateUI();
};

// Return to Home view if Logo clicked
elements.logo.addEventListener("click", () => {
  state.isHomeView = true;
  state.query = "";
  elements.input.value = "";
  elements.app.classList.add("view-home");
  elements.app.classList.remove("view-results");
  elements.main.style.display = "none";
});

// Initialization
elements.input.addEventListener(
  "input",
  debounce(handleSearch, CONFIG.debounceTime),
);
elements.clearBtn.addEventListener("click", handleClear);

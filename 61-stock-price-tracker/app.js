/* STOCK TRACKER LOGIC
    API: Finnhub.io (Free Tier)
*/

// --- CONFIGURATION ---
// TODO: Replace with your actual Finnhub API Key
const API_KEY = "YOUR_FINNHUB_API_KEY_HERE";
const BASE_URL = "https://finnhub.io/api/v1";

// --- STATE MANAGEMENT ---
const state = {
  currentSymbol: null,
  lastPrice: 0,
  intervalId: null,
  controller: null, // For aborting pending fetch requests
};

// --- DOM ELEMENTS ---
const elements = {
  input: document.getElementById("symbolInput"),
  btn: document.getElementById("searchBtn"),
  dashboard: document.getElementById("dashboard"),
  loading: document.getElementById("loadingState"),
  error: document.getElementById("errorState"),
  errorMsg: document.getElementById("errorMessage"),

  // Data Fields
  symbol: document.getElementById("stockSymbol"),
  name: document.getElementById("stockName"),
  price: document.getElementById("currentPrice"),
  changeBox: document.getElementById("priceChange"),
  changeVal: document.getElementById("changeValue"),
  changePct: document.getElementById("changePercent"),
  open: document.getElementById("statOpen"),
  high: document.getElementById("statHigh"),
  low: document.getElementById("statLow"),
  prev: document.getElementById("statPrev"),
  time: document.getElementById("lastUpdatedTime"),
};

// --- UTILITY FUNCTIONS ---

// Format currency (USD)
const formatMoney = (num) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
};

// Format Percentage
const formatPercent = (num) => {
  return `${num > 0 ? "+" : ""}${num.toFixed(2)}%`;
};

// Toggle UI Views
const setView = (view) => {
  elements.dashboard.classList.add("hidden");
  elements.loading.classList.add("hidden");
  elements.error.classList.add("hidden");

  if (view === "dashboard") elements.dashboard.classList.remove("hidden");
  if (view === "loading") elements.loading.classList.remove("hidden");
  if (view === "error") elements.error.classList.remove("hidden");
};

// --- API FUNCTIONS ---

// 1. Fetch Company Profile (Name, etc) - Cached in LocalStorage
async function fetchCompanyProfile(symbol) {
  // Check Cache first
  const cacheKey = `stock_profile_${symbol}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) return JSON.parse(cached);

  try {
    const response = await fetch(
      `${BASE_URL}/stock/profile2?symbol=${symbol}&token=${API_KEY}`,
    );
    const data = await response.json();

    // Finnhub returns empty object {} if symbol invalid
    if (Object.keys(data).length === 0) throw new Error("Invalid Symbol");

    // Save to cache
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (err) {
    throw err;
  }
}

// 2. Fetch Price Quote
async function fetchQuote(symbol) {
  try {
    // Abort previous pending requests if any
    if (state.controller) state.controller.abort();
    state.controller = new AbortController();

    const response = await fetch(
      `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`,
      {
        signal: state.controller.signal,
      },
    );

    if (!response.ok) throw new Error("Network Error");

    const data = await response.json();

    // c = Current price, d = Change, dp = Percent change, h = High, l = Low, o = Open, pc = Prev Close
    if (!data.c) throw new Error("No price data found");

    return data;
  } catch (err) {
    if (err.name === "AbortError") return null; // Ignore aborts
    throw err;
  }
}

// --- CORE APP LOGIC ---

async function loadStock(symbol) {
  // Cleanup previous state
  if (state.intervalId) clearInterval(state.intervalId);
  state.currentSymbol = symbol.toUpperCase();

  setView("loading");

  try {
    // Parallel fetch: Profile (once) + Quote (dynamic)
    const [profile, quote] = await Promise.all([
      fetchCompanyProfile(state.currentSymbol),
      fetchQuote(state.currentSymbol),
    ]);

    // Render Initial Data
    renderProfile(profile);
    renderQuote(quote);

    // Start Polling (Real-time mode)
    startPolling();

    setView("dashboard");
  } catch (err) {
    console.error(err);
    elements.errorMsg.textContent = err.message || "Failed to load stock data.";
    setView("error");
  }
}

function renderProfile(data) {
  elements.symbol.textContent = data.ticker;
  elements.name.textContent = data.name;
}

function renderQuote(data) {
  if (!data) return;

  const price = data.c;
  const change = data.d;
  const percent = data.dp;

  // Detect Price Movement for Animation
  const prevPrice = state.lastPrice;
  state.lastPrice = price;

  // Remove old animation classes
  elements.price.classList.remove("flash-up", "flash-down");

  // Force reflow to restart animation if needed
  void elements.price.offsetWidth;

  // Add animation based on change vs previous fetch
  if (prevPrice > 0 && price !== prevPrice) {
    if (price > prevPrice) elements.price.classList.add("flash-up");
    else elements.price.classList.add("flash-down");
  }

  // Update Text Content
  elements.price.textContent = formatMoney(price);
  elements.changeVal.textContent = formatMoney(change); // Using money format for absolute change
  elements.changePct.textContent = formatPercent(percent);

  elements.open.textContent = formatMoney(data.o);
  elements.high.textContent = formatMoney(data.h);
  elements.low.textContent = formatMoney(data.l);
  elements.prev.textContent = formatMoney(data.pc);

  // Color Logic for Change Pill
  elements.changeBox.className = "change-pill"; // Reset
  if (change >= 0) {
    elements.changeBox.classList.add("bg-up", "up");
    elements.price.classList.remove("down");
    elements.price.classList.add("up");
  } else {
    elements.changeBox.classList.add("bg-down", "down");
    elements.price.classList.remove("up");
    elements.price.classList.add("down");
  }

  // Update Timestamp
  const now = new Date();
  elements.time.textContent = now.toLocaleTimeString();
}

function startPolling() {
  // Poll every 15 seconds
  state.intervalId = setInterval(async () => {
    try {
      const quote = await fetchQuote(state.currentSymbol);
      if (quote) renderQuote(quote);
    } catch (err) {
      console.log("Polling error (market closed?):", err);
    }
  }, 15000);
}

// --- EVENT LISTENERS ---

elements.btn.addEventListener("click", () => {
  const symbol = elements.input.value.trim();
  if (symbol) loadStock(symbol);
});

elements.input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const symbol = elements.input.value.trim();
    if (symbol) loadStock(symbol);
  }
});

// --- Configuration ---
const API_URL = "https://api.frankfurter.app";
const CACHE_KEY = "currency_cache";
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// --- DOM Elements ---
const amountInput = document.getElementById("amount");
const fromSelect = document.getElementById("from-currency");
const toSelect = document.getElementById("to-currency");
const resultDisplay = document.getElementById("converted-amount");
const conversionText = document.getElementById("conversion-text");
const rateInfo = document.getElementById("exchange-rate-info");
const timeInfo = document.getElementById("last-updated");
const swapBtn = document.getElementById("swap-btn");
const errorMsg = document.getElementById("error-msg");

// --- Initialization ---
async function init() {
  try {
    await loadCurrencies();

    // Set defaults
    fromSelect.value = "USD";
    toSelect.value = "EUR";

    // Initial conversion
    convertCurrency();

    // --- Event Listeners ---
    // 'input' fires on every keystroke, 'change' fires on dropdown selection
    amountInput.addEventListener("input", convertCurrency);
    fromSelect.addEventListener("change", convertCurrency);
    toSelect.addEventListener("change", convertCurrency);

    swapBtn.addEventListener("click", () => {
      const temp = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = temp;
      convertCurrency();
    });
  } catch (err) {
    showError("Failed to initialize app.");
  }
}

// --- Logic: Fetch Currencies (with Caching) ---
async function loadCurrencies() {
  // Check LocalStorage first
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
  const now = new Date().getTime();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    populateDropdowns(cached.data);
    return;
  }

  // Fetch from API if cache is empty or old
  const res = await fetch(`${API_URL}/currencies`);
  const data = await res.json();

  // Save to cache
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      data: data,
      timestamp: now,
    }),
  );

  populateDropdowns(data);
}

function populateDropdowns(data) {
  const options = Object.entries(data)
    .map(([code, name]) => `<option value="${code}">${code} - ${name}</option>`)
    .join("");

  fromSelect.innerHTML = options;
  toSelect.innerHTML = options;
}

// --- Logic: Conversion ---
async function convertCurrency() {
  const amount = parseFloat(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  if (isNaN(amount)) return;

  if (from === to) {
    displayResult(amount, 1, from, to);
    return;
  }

  try {
    errorMsg.classList.add("hidden");

    // Fetch specific rate
    const res = await fetch(
      `${API_URL}/latest?amount=${amount}&from=${from}&to=${to}`,
    );
    if (!res.ok) throw new Error("Network error");

    const data = await res.json();
    const converted = data.rates[to];
    const rate = converted / amount;

    displayResult(converted, rate, from, to, data.date);
  } catch (err) {
    console.error(err);
    showError("Unable to fetch exchange rates.");
  }
}

// --- UI: Display Results ---
function displayResult(value, rate, from, to, date) {
  // Modern currency formatting
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: to,
  });

  resultDisplay.innerText = formatter.format(value);
  conversionText.innerText = `${amountInput.value} ${from} =`;
  rateInfo.innerText = `1 ${from} = ${rate.toFixed(4)} ${to}`;

  // Fallback date if API doesn't return one (some endpoints differ)
  const updateTime = date ? new Date(date).toLocaleDateString() : "Today";
  timeInfo.innerText = `Refreshed: ${updateTime}`;
}

function showError(msg) {
  errorMsg.innerText = msg;
  errorMsg.classList.remove("hidden");
  resultDisplay.innerText = "---";
}

// Start App
init();

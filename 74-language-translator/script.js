// --- 1. Configuration & State ---
const languages = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  hi: "Hindi",
  ja: "Japanese",
};

// Fallback dictionary for "Mock Mode" (when API fails or offline)
const mockDictionary = {
  hello: { "es-ES": "hola", "fr-FR": "bonjour", "de-DE": "hallo" },
  world: { "es-ES": "mundo", "fr-FR": "monde", "de-DE": "welt" },
  "thank you": { "es-ES": "gracias", "fr-FR": "merci", "de-DE": "danke" },
};

const state = {
  inputText: "",
  sourceLang: "en-GB",
  targetLang: "es-ES",
  isLoading: false,
};

// --- 2. DOM Elements ---
const inputEl = document.getElementById("input-text");
const outputEl = document.getElementById("translated-text");
const sourceSelect = document.getElementById("source-lang");
const targetSelect = document.getElementById("target-lang");
const swapBtn = document.getElementById("swap-btn");
const loader = document.getElementById("loader");
const charCount = document.getElementById("char-count");
const copyBtn = document.getElementById("copy-btn");
const speakSourceBtn = document.getElementById("speak-source");
const speakTargetBtn = document.getElementById("speak-target");

// --- 3. Initialization ---
function init() {
  populateLanguages();

  // Event Listeners
  // Debounce input to avoid spamming API
  inputEl.addEventListener("input", debounce(handleInput, 500));

  sourceSelect.addEventListener("change", (e) => {
    state.sourceLang = e.target.value;
    triggerTranslation();
  });

  targetSelect.addEventListener("change", (e) => {
    state.targetLang = e.target.value;
    triggerTranslation();
  });

  swapBtn.addEventListener("click", swapLanguages);
  copyBtn.addEventListener("click", copyToClipboard);
  speakSourceBtn.addEventListener("click", () =>
    speakText(inputEl.value, state.sourceLang),
  );
  speakTargetBtn.addEventListener("click", () =>
    speakText(outputEl.innerText, state.targetLang),
  );
}

// Populate Dropdowns
function populateLanguages() {
  Object.entries(languages).forEach(([code, name]) => {
    const option1 = new Option(name, code);
    const option2 = new Option(name, code);

    if (code === state.sourceLang) option1.selected = true;
    if (code === state.targetLang) option2.selected = true;

    sourceSelect.add(option1);
    targetSelect.add(option2);
  });
}

// --- 4. Logic & Handlers ---

function handleInput(e) {
  const text = e.target.value;
  state.inputText = text;
  charCount.textContent = `${text.length} / 5000`;

  if (!text.trim()) {
    outputEl.innerText = "";
    return;
  }

  translateText();
}

function triggerTranslation() {
  if (state.inputText.trim()) translateText();
}

// Updated translateText function using Lingva (Google Translate Engine)
async function translateText() {
  state.isLoading = true;
  updateUIState();

  const text = state.inputText;
  const source = state.sourceLang.split("-")[0]; // Lingva uses 2-letter codes (e.g., "en", "es")
  const target = state.targetLang.split("-")[0];

  // Encode text properly to handle spaces and special characters
  const encodedText = encodeURIComponent(text);

  try {
    // 1. URL Structure: https://lingva.ml/api/v1/{source}/{target}/{text}
    const url = `https://lingva.ml/api/v1/${source}/${target}/${encodedText}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    // Lingva returns: { translation: "..." }
    outputEl.innerText = data.translation;
  } catch (error) {
    console.warn("API failed, switching to Mock Mode", error);
    // Fallback to mock mode if the public API is overloaded
    mockTranslate();
  } finally {
    state.isLoading = false;
    updateUIState();
  }
}

// B. Mock/Fallback Logic
function mockTranslate() {
  const textLower = state.inputText.toLowerCase().trim();
  const target = state.targetLang;

  // Simple direct word lookup
  if (mockDictionary[textLower] && mockDictionary[textLower][target]) {
    outputEl.innerText = mockDictionary[textLower][target];
  } else {
    // Simulate "Pseudotranslation" if word not in dictionary
    // (Just appending the language code to show it worked)
    outputEl.innerText = `[MOCK ${target}]: ${state.inputText}`;
  }
}

function swapLanguages() {
  // 1. Swap State
  [state.sourceLang, state.targetLang] = [state.targetLang, state.sourceLang];

  // 2. Swap Dropdowns
  sourceSelect.value = state.sourceLang;
  targetSelect.value = state.targetLang;

  // 3. Swap Text (Optional: usually desirable)
  const currentOutput = outputEl.innerText;
  inputEl.value = currentOutput;
  state.inputText = currentOutput;
  outputEl.innerText = ""; // Clear until re-translated

  // 4. UI Animation
  swapBtn.classList.toggle("rotate");

  // 5. Trigger new translation
  triggerTranslation();
}

function updateUIState() {
  if (state.isLoading) {
    loader.classList.remove("hidden");
    outputEl.style.opacity = "0.5";
  } else {
    loader.classList.add("hidden");
    outputEl.style.opacity = "1";
  }
}

// --- 5. Utilities ---

// Utility: Debounce to prevent too many API requests while typing
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Feature: Clipboard
async function copyToClipboard() {
  const text = outputEl.innerText;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    // Visual feedback
    const originalIcon = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
    setTimeout(() => (copyBtn.innerHTML = originalIcon), 2000);
  } catch (err) {
    console.error("Failed to copy", err);
  }
}

// Feature: Text-to-Speech
function speakText(text, lang) {
  if (!text || !window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang; // e.g., 'es-ES'
  utterance.rate = 1;

  window.speechSynthesis.speak(utterance);
}

// Run the app
init();

/* --- State Management --- */
const state = {
  loading: false,
  error: null,
  data: null,
  history: JSON.parse(localStorage.getItem("previewHistory")) || [],
};

/* --- DOM Elements --- */
const form = document.getElementById("preview-form");
const urlInput = document.getElementById("url-input");
const loader = document.getElementById("loader");
const previewContainer = document.getElementById("preview-container");
const errorMsg = document.getElementById("error-message");
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history");

// Card Elements
const cardImg = document.getElementById("card-image");
const cardTitle = document.getElementById("card-title");
const cardDesc = document.getElementById("card-description");
const cardDomain = document.getElementById("card-domain");
const cardFavicon = document.getElementById("card-favicon");
const copyBtn = document.getElementById("copy-btn");

/* --- Event Listeners --- */
document.addEventListener("DOMContentLoaded", renderHistory);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = urlInput.value.trim();
  if (!url) return;

  // Simple URL validation
  try {
    new URL(url);
    await handlePreview(url);
  } catch (err) {
    showError("Please enter a valid URL (include http:// or https://)");
  }
});

copyBtn.addEventListener("click", () => {
  if (state.data && state.data.url) {
    navigator.clipboard.writeText(state.data.url);
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = `<span style="font-size: 0.8rem; font-weight:bold;">Copied!</span>`;
    setTimeout(() => (copyBtn.innerHTML = originalText), 2000);
  }
});

clearHistoryBtn.addEventListener("click", () => {
  state.history = [];
  localStorage.removeItem("previewHistory");
  renderHistory();
});

/* --- Core Logic --- */

// 1. Fetch Metadata
async function fetchMetadata(url) {
  // We use Microlink API which is excellent for frontend-only previews
  // It handles CORS and parsing automatically.
  const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;

  const response = await fetch(apiUrl);
  const result = await response.json();

  if (result.status === "fail" || !result.data) {
    throw new Error("Could not fetch metadata for this URL");
  }

  return result.data; // { title, description, image: {url}, logo: {url}, ... }
}

// 2. Handle Logic Flow
async function handlePreview(url) {
  setLoading(true);
  resetError();
  previewContainer.classList.add("hidden");

  try {
    const metadata = await fetchMetadata(url);

    // Normalize Data structure
    const normalizedData = {
      title: metadata.title || url,
      description: metadata.description || "No description available.",
      image: metadata.image ? metadata.image.url : null,
      url: metadata.url || url,
      domain: new URL(metadata.url || url).hostname,
      favicon: metadata.logo
        ? metadata.logo.url
        : `https://www.google.com/s2/favicons?domain=${url}`,
    };

    state.data = normalizedData;
    renderCard(normalizedData);
    addToHistory(normalizedData);
  } catch (err) {
    console.error(err);
    showError("Failed to load metadata. Please check the URL and try again.");
  } finally {
    setLoading(false);
  }
}

// 3. Render Card
function renderCard(data) {
  cardTitle.textContent = data.title;
  cardDesc.textContent = data.description;
  cardDomain.textContent = data.domain;

  // Handle Images
  if (data.image) {
    cardImg.src = data.image;
    cardImg.parentElement.style.display = "block";
  } else {
    // Hide image container if no image found
    cardImg.parentElement.style.display = "none";
  }

  // Handle Favicon
  cardFavicon.src = data.favicon;
  cardFavicon.onerror = () => {
    cardFavicon.style.display = "none";
  }; // Hide if broken

  previewContainer.classList.remove("hidden");
}

// 4. History Management
function addToHistory(data) {
  // Avoid duplicates: remove if exists, then add to top
  state.history = state.history.filter((item) => item.url !== data.url);
  state.history.unshift(data);

  // Limit to 5 items
  if (state.history.length > 5) state.history.pop();

  localStorage.setItem("previewHistory", JSON.stringify(state.history));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";

  if (state.history.length === 0) {
    historyList.innerHTML =
      '<p class="empty-state" style="text-align:center; color:var(--muted-text);">No recent history</p>';
    clearHistoryBtn.classList.add("hidden");
    return;
  }

  clearHistoryBtn.classList.remove("hidden");

  state.history.forEach((item) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
            <img class="history-thumb" src="${item.image || item.favicon || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4="}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4='">
            <div class="history-info">
                <div class="history-title">${item.title}</div>
                <div class="history-url">${item.domain}</div>
            </div>
        `;

    // Click history item to reload preview
    div.addEventListener("click", () => {
      urlInput.value = item.url;
      renderCard(item);
      previewContainer.scrollIntoView({ behavior: "smooth" });
    });

    historyList.appendChild(div);
  });
}

/* --- Utilities --- */
function setLoading(isLoading) {
  state.loading = isLoading;
  if (isLoading) {
    loader.classList.remove("hidden");
    document.getElementById("submit-btn").disabled = true;
  } else {
    loader.classList.add("hidden");
    document.getElementById("submit-btn").disabled = false;
  }
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

function resetError() {
  errorMsg.classList.add("hidden");
  errorMsg.textContent = "";
}

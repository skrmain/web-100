// =========================================
// 1. DOM ELEMENTS SELECTION
// =========================================
const searchBtn = document.getElementById("search-btn");
const searchInput = document.getElementById("search-input");
const mainContent = document.getElementById("main-content");
const errorMsg = document.getElementById("error-msg");

// =========================================
// 2. CONSTANTS & UTILS
// =========================================
const API_URL = "https://api.github.com/users/";

// Helper to format dates (e.g., "2020-01-01" -> "01 Jan 2020")
function formatDate(isoString) {
  const date = new Date(isoString);
  const options = { day: "numeric", month: "short", year: "numeric" };
  return `Joined ${date.toLocaleDateString("en-GB", options)}`;
}

// Check if data exists, otherwise return "Not Available"
function checkNull(value) {
  return value ? value : "Not Available";
}

// =========================================
// 3. MAIN API LOGIC
// =========================================

// Async function to fetch user data
async function getUser(username) {
  // 1. Clear previous errors and show loading spinner
  errorMsg.textContent = "";
  mainContent.innerHTML = `<div class="spinner"></div>`;

  try {
    // 2. Fetch data from GitHub API
    const response = await fetch(API_URL + username);

    // 3. Handle 404 (User not found)
    if (!response.ok) {
      throw new Error("User not found");
    }

    // 4. Parse JSON data
    const data = await response.json();

    // 5. Render the profile card
    renderProfile(data);
  } catch (error) {
    // Handle specific errors
    mainContent.innerHTML = ""; // Remove spinner
    errorMsg.textContent =
      error.message === "User not found"
        ? "No results found"
        : "Something went wrong";
  }
}

// =========================================
// 4. RENDER UI FUNCTION
// =========================================
function renderProfile(user) {
  // Destructuring the user object for cleaner code
  const {
    avatar_url,
    name,
    login,
    created_at,
    bio,
    public_repos,
    followers,
    following,
    location,
    blog,
    twitter_username,
    company,
    html_url,
  } = user;

  // Determine opacity class for missing info
  const locationClass = location ? "" : "not-available";
  const blogClass = blog ? "" : "not-available";
  const twitterClass = twitter_username ? "" : "not-available";
  const companyClass = company ? "" : "not-available";

  // Inject HTML dynamically
  mainContent.innerHTML = `
        <article class="profile-card">
            <div class="profile-left">
                <img src="${avatar_url}" alt="${login}" class="avatar">
            </div>

            <div class="profile-right">
                <div class="profile-header">
                    <div class="profile-name">
                        <h2>${name || login}</h2>
                        <div class="login"><a href="${html_url}" target="_blank">@${login}</a></div>
                    </div>
                    <p class="joined-date">${formatDate(created_at)}</p>
                </div>

                <p class="bio">${bio || "This profile has no bio"}</p>

                <div class="stats-container">
                    <div class="stat-item">
                        <span class="stat-title">Repos</span>
                        <span class="stat-value">${public_repos}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-title">Followers</span>
                        <span class="stat-value">${followers}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-title">Following</span>
                        <span class="stat-value">${following}</span>
                    </div>
                </div>

                <div class="links-container">
                    <div class="link-item ${locationClass}">
                        <i class="fas fa-map-marker-alt"></i> 
                        <span>${checkNull(location)}</span>
                    </div>
                    <div class="link-item ${blogClass}">
                        <i class="fas fa-link"></i> 
                        ${blog ? `<a href="${blog.startsWith("http") ? blog : "https://" + blog}" target="_blank">Website</a>` : "Not Available"}
                    </div>
                    <div class="link-item ${twitterClass}">
                        <i class="fab fa-twitter"></i> 
                        <span>${checkNull(twitter_username)}</span>
                    </div>
                    <div class="link-item ${companyClass}">
                        <i class="fas fa-building"></i> 
                        <span>${checkNull(company)}</span>
                    </div>
                </div>
            </div>
        </article>
    `;
}

// =========================================
// 5. EVENT LISTENERS
// =========================================

// Listen for "Click" on the Search Button
searchBtn.addEventListener("click", () => {
  const user = searchInput.value;
  if (user) {
    getUser(user);
  }
});

// Listen for "Enter" key in the input field
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const user = searchInput.value;
    if (user) {
      getUser(user);
    }
  }
});

// Optional: Load a default profile on startup (e.g., octocat)
// getUser('octocat');

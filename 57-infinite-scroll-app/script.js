/* Configuration & State Management
 */
const API_URL = "https://jsonplaceholder.typicode.com/posts";
const LIMIT = 10; // Number of posts per fetch
let currentPage = 1;
let isLoading = false;
let hasMoreData = true;

// DOM Elements
const postGrid = document.getElementById("post-grid");
const loader = document.getElementById("loader");
const endMessage = document.getElementById("end-message");
const errorMessage = document.getElementById("error-message");

/* 1. Fetch Function 
    Fetches data from JSONPlaceholder with pagination params.
*/
async function fetchPosts(page, limit) {
  // Artificial delay to simulate network latency for the demo
  // Remove this await in production!
  await new Promise((resolve) => setTimeout(resolve, 800));

  const response = await fetch(`${API_URL}?_page=${page}&_limit=${limit}`);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return await response.json();
}

/* 2. Render Function
    Creates HTML elements for posts and appends them to the DOM.
*/
function renderPosts(posts) {
  const fragment = document.createDocumentFragment(); // Performance optimization

  posts.forEach((post) => {
    const postEl = document.createElement("article");
    postEl.classList.add("post-card");

    postEl.innerHTML = `
            <span class="post-id">Post #${post.id}</span>
            <h2 class="post-title">${post.title}</h2>
            <p class="post-body">${post.body}</p>
        `;

    fragment.appendChild(postEl);
  });

  postGrid.appendChild(fragment);
}

/* 3. Core Load Logic
    Orchestrates the fetching and state updates.
*/
async function loadMorePosts() {
  // Guard clause: Prevent duplicate fetches or fetching after end
  if (isLoading || !hasMoreData) return;

  isLoading = true;
  loader.classList.add("show"); // Show spinner
  errorMessage.hidden = true;

  try {
    const posts = await fetchPosts(currentPage, LIMIT);

    if (posts.length > 0) {
      renderPosts(posts);
      currentPage++;

      // JSONPlaceholder posts stop at 100.
      // If we get fewer items than the limit, we've reached the end.
      if (posts.length < LIMIT) {
        hasMoreData = false;
      }
    } else {
      hasMoreData = false;
    }

    // Handle End of Data State
    if (!hasMoreData) {
      endMessage.hidden = false;
      // Stop observing to save resources
      observer.unobserve(loader);
    }
  } catch (error) {
    console.error("Failed to load posts:", error);
    errorMessage.hidden = false;
  } finally {
    isLoading = false;
    loader.classList.remove("show"); // Hide spinner
  }
}

/* 4. Intersection Observer Logic
    Detects when the user scrolls near the bottom (the loader element).
*/
const observerOptions = {
  root: null, // viewport
  rootMargin: "0px",
  threshold: 0.1, // Trigger when 10% of the loader is visible
};

const observer = new IntersectionObserver((entries) => {
  const [entry] = entries;

  // Only load if the loader is visible and we have more data
  if (entry.isIntersecting && hasMoreData) {
    loadMorePosts();
  }
}, observerOptions);

// Start observing the loader element
if (loader) {
  observer.observe(loader);
}

// Initial Load
loadMorePosts();

/**
 * JOB BOARD FILTER APP
 * * Architecture:
 * 1. MOCK_DATA: Static JSON-like data.
 * 2. STATE: Single source of truth for filters.
 * 3. LOGIC: Filter function using Array.every for tags and partial matching for text.
 * 4. RENDER: Functions to draw HTML based on filtered data.
 */

// --- 1. MOCK DATA ---
const jobsData = [
  {
    id: 1,
    company: "Photosnap",
    logo: "https://via.placeholder.com/88",
    new: true,
    featured: true,
    position: "Senior Frontend Developer",
    role: "Frontend",
    level: "Senior",
    postedAt: "1d ago",
    contract: "Full Time",
    location: "USA Only",
    languages: ["HTML", "CSS", "JavaScript"],
    tools: [],
  },
  {
    id: 2,
    company: "Manage",
    logo: "https://via.placeholder.com/88",
    new: true,
    featured: true,
    position: "Fullstack Developer",
    role: "Fullstack",
    level: "Midweight",
    postedAt: "1d ago",
    contract: "Part Time",
    location: "Remote",
    languages: ["Python"],
    tools: ["React"],
  },
  {
    id: 3,
    company: "Account",
    logo: "https://via.placeholder.com/88",
    new: true,
    featured: false,
    position: "Junior Frontend Developer",
    role: "Frontend",
    level: "Junior",
    postedAt: "2d ago",
    contract: "Part Time",
    location: "USA Only",
    languages: ["JavaScript"],
    tools: ["React", "Sass"],
  },
  {
    id: 4,
    company: "MyHome",
    logo: "https://via.placeholder.com/88",
    new: false,
    featured: false,
    position: "Junior Frontend Developer",
    role: "Frontend",
    level: "Junior",
    postedAt: "5d ago",
    contract: "Contract",
    location: "USA Only",
    languages: ["CSS", "JavaScript"],
    tools: [],
  },
  {
    id: 5,
    company: "Loop Studios",
    logo: "https://via.placeholder.com/88",
    new: false,
    featured: false,
    position: "Software Engineer",
    role: "Fullstack",
    level: "Midweight",
    postedAt: "1w ago",
    contract: "Full Time",
    location: "Worldwide",
    languages: ["JavaScript"],
    tools: ["Ruby", "Sass"],
  },
  {
    id: 6,
    company: "FaceIt",
    logo: "https://via.placeholder.com/88",
    new: false,
    featured: false,
    position: "Backend Developer",
    role: "Backend",
    level: "Junior",
    postedAt: "2w ago",
    contract: "Full Time",
    location: "UK",
    languages: ["Ruby"],
    tools: ["RoR"],
  },
];

// --- 2. STATE MANAGEMENT ---

const state = {
  filters: {
    text: "",
    role: "",
    level: "",
    location: "",
    tags: [], // Array of strings e.g., ["React", "CSS"]
  },
};

// --- 3. DOM ELEMENTS ---
const jobListEl = document.getElementById("jobList");
const activeTagsEl = document.getElementById("activeTags");
const emptyStateEl = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const roleSelect = document.getElementById("roleSelect");
const levelSelect = document.getElementById("levelSelect");
const locationSelect = document.getElementById("locationSelect");
const clearBtn = document.getElementById("clearBtn");

// --- 4. CORE LOGIC ---

function init() {
  // Initial render
  applyFilters();

  // Event Listeners
  searchInput.addEventListener("input", (e) =>
    updateFilter("text", e.target.value),
  );
  roleSelect.addEventListener("change", (e) =>
    updateFilter("role", e.target.value),
  );
  levelSelect.addEventListener("change", (e) =>
    updateFilter("level", e.target.value),
  );
  locationSelect.addEventListener("change", (e) =>
    updateFilter("location", e.target.value),
  );

  clearBtn.addEventListener("click", clearFilters);
}

// Updates state and triggers re-render
function updateFilter(key, value) {
  if (key === "tags") {
    // Prevent duplicates
    if (!state.filters.tags.includes(value)) {
      state.filters.tags.push(value);
    }
  } else if (key === "removeTag") {
    state.filters.tags = state.filters.tags.filter((tag) => tag !== value);
  } else {
    state.filters[key] = value;
  }

  applyFilters();
}

function clearFilters() {
  state.filters = {
    text: "",
    role: "",
    level: "",
    location: "",
    tags: [],
  };

  // Reset UI inputs
  searchInput.value = "";
  roleSelect.value = "";
  levelSelect.value = "";
  locationSelect.value = "";

  applyFilters();
}

// Main Filter Logic (Subtractive)
function applyFilters() {
  const { text, role, level, location, tags } = state.filters;

  const filteredJobs = jobsData.filter((job) => {
    // 1. Text Search (Case insensitive, checks Title or Company)
    const matchText =
      job.position.toLowerCase().includes(text.toLowerCase()) ||
      job.company.toLowerCase().includes(text.toLowerCase());

    // 2. Dropdown Filters
    const matchRole = role ? job.role === role : true;
    const matchLevel = level ? job.level === level : true;
    const matchLocation = location ? job.location === location : true;

    // 3. Tags Filter (Intersection: Job must have ALL selected tags)
    // Combine job role, level, languages and tools into one searchable array
    const jobTags = [job.role, job.level, ...job.languages, ...job.tools];
    const matchTags =
      tags.length === 0 || tags.every((tag) => jobTags.includes(tag));

    return matchText && matchRole && matchLevel && matchLocation && matchTags;
  });

  renderJobs(filteredJobs);
  renderActiveTags();
}

// --- 5. RENDERING ---

function renderJobs(jobs) {
  jobListEl.innerHTML = ""; // Clear current list

  if (jobs.length === 0) {
    emptyStateEl.classList.remove("hidden");
    return;
  } else {
    emptyStateEl.classList.add("hidden");
  }

  jobs.forEach((job) => {
    // Combine all tags for the UI buttons
    const allTags = [job.role, job.level, ...job.languages, ...job.tools];

    const jobCard = document.createElement("article");
    jobCard.className = `job-card ${job.featured ? "featured" : ""}`;

    // Generate Tags HTML
    const tagsHtml = allTags
      .map(
        (tag) =>
          `<button class="tag-btn" onclick="addTagFilter('${tag}')">${tag}</button>`,
      )
      .join("");

    jobCard.innerHTML = `
              <div class="card-left">
                  <div class="logo">
                      <img src="${job.logo}" alt="${job.company} logo">
                  </div>
                  <div class="job-info">
                      <h4>
                          ${job.company}
                          ${job.new ? '<span class="badge badge-new">New!</span>' : ""}
                          ${job.featured ? '<span class="badge badge-featured">Featured</span>' : ""}
                      </h4>
                      <h3 class="job-title">${job.position}</h3>
                      <ul class="job-meta">
                          <li>${job.postedAt}</li>
                          <li>${job.contract}</li>
                          <li>${job.location}</li>
                      </ul>
                  </div>
              </div>
              <div class="card-tags">
                  ${tagsHtml}
              </div>
          `;

    jobListEl.appendChild(jobCard);
  });
}

function renderActiveTags() {
  activeTagsEl.innerHTML = "";

  // If no tags are active, hide the clear button logic could go here,
  // but we leave the "Clear" button to clear inputs too.

  state.filters.tags.forEach((tag) => {
    const chip = document.createElement("div");
    chip.className = "tag-chip";
    chip.innerHTML = `
              <span class="tag-text">${tag}</span>
              <button class="remove-tag" onclick="removeTagFilter('${tag}')">✕</button>
          `;
    activeTagsEl.appendChild(chip);
  });
}

// --- 6. EXPOSED HELPERS (Global Scope for HTML onclick) ---

window.addTagFilter = (tag) => {
  updateFilter("tags", tag);
  // Optional: Scroll to top to see filter added
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.removeTagFilter = (tag) => {
  updateFilter("removeTag", tag);
};

// Start App
init();

// Select DOM elements
const form = document.getElementById("resume-form");
const resetBtn = document.getElementById("reset-btn");

// Mapping Input IDs to Preview IDs
// Key = Form Input ID, Value = Preview Element ID
const fieldMapping = {
  name: "p-name",
  title: "p-title",
  summary: "p-summary",
  email: "p-email",
  phone: "p-phone",
  website: "p-website",
  company: "p-company",
  job_role: "p-job-role",
  years: "p-years",
  exp_desc: "p-exp-desc",
};

// 1. Initialize logic
document.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
});

// 2. Input Event Listener (Live Preview)
// We listen to the whole form, utilizing "Event Bubbling"
form.addEventListener("input", (e) => {
  const target = e.target;

  // Handle Skills separately (List generation)
  if (target.id === "skills") {
    updateSkills(target.value);
  }
  // Handle Standard Text Inputs
  else if (fieldMapping[target.id]) {
    const previewElement = document.getElementById(fieldMapping[target.id]);
    if (previewElement) {
      // If input is empty, revert to default text (optional polish)
      previewElement.textContent = target.value || "Not specified";
    }
  }

  // Save state automatically
  saveToStorage();
});

// 3. Skills List Logic
function updateSkills(csvString) {
  const listContainer = document.getElementById("p-skills-list");
  listContainer.innerHTML = ""; // Clear current list

  if (!csvString) return;

  // Split by comma, remove whitespace, and filter empty strings
  const skillsArray = csvString
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  skillsArray.forEach((skill) => {
    const li = document.createElement("li");
    li.textContent = skill;
    listContainer.appendChild(li);
  });
}

// 4. LocalStorage Logic
function saveToStorage() {
  const formData = new FormData(form);
  const data = {};

  // Convert FormData to simple object
  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }

  localStorage.setItem("resumeDraft", JSON.stringify(data));
}

function loadFromStorage() {
  const savedData = localStorage.getItem("resumeDraft");
  if (!savedData) return;

  const data = JSON.parse(savedData);

  // Populate inputs and trigger updates
  for (let key in data) {
    const input = document.getElementById(key);
    if (input) {
      input.value = data[key];

      // Manually dispatch input event so preview updates
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
}

// 5. Reset Form
resetBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear your resume?")) {
    form.reset();
    localStorage.removeItem("resumeDraft");
    location.reload(); // Quick way to clear preview state
  }
});

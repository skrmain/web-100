// script.js

document.addEventListener("DOMContentLoaded", () => {
  // --- Configuration ---
  const STORAGE_KEY = "wizard_form_data";
  const form = document.getElementById("wizardForm");
  const steps = Array.from(document.querySelectorAll(".step"));
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  const progressBar = document.getElementById("progressBar");
  const indicators = document.querySelectorAll(".step-indicator");
  const summaryContainer = document.getElementById("summaryContainer");

  let currentStep = 0;

  // --- State Management ---

  // 1. Load data from LocalStorage on init
  function loadSavedData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const data = JSON.parse(savedData);
      Object.keys(data).forEach((key) => {
        const input = form.elements[key];
        if (input) input.value = data[key];
      });
    }
  }

  // 2. Save data to LocalStorage
  function saveData() {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // --- Navigation Logic ---

  function updateUI() {
    // 1. Toggle Step Visibility
    steps.forEach((step, index) => {
      step.classList.toggle("active", index === currentStep);
    });

    // 2. Update Progress Bar & Indicators
    const progressPercentage = (currentStep / (steps.length - 2)) * 100; // -2 to exclude success step
    progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;

    indicators.forEach((indicator, index) => {
      indicator.classList.toggle("active", index === currentStep);
      indicator.classList.toggle("completed", index < currentStep);
    });

    // 3. Button States
    prevBtn.disabled = currentStep === 0;

    // Change "Next" to "Submit" on Review step (Index 2)
    if (currentStep === steps.length - 2) {
      nextBtn.textContent = "Submit";
    } else {
      nextBtn.textContent = "Next Step";
    }

    // Hide buttons on Success step
    if (currentStep === steps.length - 1) {
      document.getElementById("actionButtons").style.display = "none";
    }

    // If on Review step, populate summary
    if (currentStep === 2) renderSummary();
  }

  function handleNext() {
    // Validate current step before moving
    if (!validateStep(currentStep)) return;

    // If it's the review step (second to last), submit
    if (currentStep === steps.length - 2) {
      submitForm();
      return;
    }

    currentStep++;
    updateUI();
    saveData(); // Auto-save on navigation
  }

  function handleBack() {
    if (currentStep > 0) {
      currentStep--;
      updateUI();
    }
  }

  // --- Validation Logic ---

  function validateStep(stepIndex) {
    const currentStepEl = steps[stepIndex];
    const inputs = currentStepEl.querySelectorAll("input, select");
    let isValid = true;

    inputs.forEach((input) => {
      if (!input.checkValidity()) {
        isValid = false;
        showError(input);
      } else {
        clearError(input);
      }
    });

    return isValid;
  }

  function showError(input) {
    const group = input.parentElement;
    const errorMsg = group.querySelector(".error-msg");
    input.classList.add("invalid");
    if (errorMsg) errorMsg.style.display = "block";
  }

  function clearError(input) {
    const group = input.parentElement;
    const errorMsg = group.querySelector(".error-msg");
    input.classList.remove("invalid");
    if (errorMsg) errorMsg.style.display = "none";
  }

  // Real-time validation (clear errors as user types)
  form.addEventListener("input", (e) => {
    if (e.target.classList.contains("invalid")) {
      if (e.target.checkValidity()) {
        clearError(e.target);
      }
    }
    saveData(); // Also auto-save on typing
  });

  // --- Summary & Submission ---

  function renderSummary() {
    const formData = new FormData(form);
    summaryContainer.innerHTML = ""; // Clear previous

    // Mapping friendly names
    const labels = {
      fullName: "Full Name",
      email: "Email",
      phone: "Phone",
      preference: "Contact Preference",
    };

    for (const [key, value] of formData.entries()) {
      const row = document.createElement("div");
      row.className = "summary-item";
      row.innerHTML = `
                <span class="summary-label">${labels[key] || key}:</span>
                <span class="summary-value">${value}</span>
            `;
      summaryContainer.appendChild(row);
    }
  }

  function submitForm() {
    // Simulate API Call
    const btnOriginalText = nextBtn.textContent;
    nextBtn.textContent = "Submitting...";
    nextBtn.disabled = true;

    setTimeout(() => {
      currentStep++; // Move to Success Step
      updateUI();
      localStorage.removeItem(STORAGE_KEY); // Clear saved data on success
    }, 1500);
  }

  // --- Initialization ---
  nextBtn.addEventListener("click", handleNext);
  prevBtn.addEventListener("click", handleBack);

  loadSavedData();
  updateUI();
});

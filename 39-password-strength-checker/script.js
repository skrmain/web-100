/* --- Configuration & DOM Elements --- */
const passwordInput = document.getElementById("passwordInput");
const toggleBtn = document.getElementById("toggleBtn");
const copyBtn = document.getElementById("copyBtn");
const generateBtn = document.getElementById("generateBtn");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");

// UI Elements for Validation Hints
const requirements = {
  length: document.getElementById("req-length"),
  lower: document.getElementById("req-lower"),
  upper: document.getElementById("req-upper"),
  num: document.getElementById("req-num"),
  special: document.getElementById("req-special"),
};

// Regex Patterns
const patterns = {
  lower: /[a-z]/,
  upper: /[A-Z]/,
  num: /\d/,
  special: /[!@#$%^&*(),.?":{}|<>]/,
};

/* --- 1. Core Logic: Password Evaluation --- */
const evaluatePassword = (password) => {
  let score = 0;
  let validCount = 0; // Check how many conditions are met

  // 1. Length Check
  const isLengthValid = password.length >= 8;
  updateRequirementUI("length", isLengthValid);
  if (isLengthValid) {
    score += 10;
    validCount++;
  }
  // Bonus for extra length
  if (password.length >= 12) score += 10;

  // 2. Character Checks (Loop through patterns)
  // We map keys (lower, upper, etc) to their regex
  ["lower", "upper", "num", "special"].forEach((key) => {
    const isValid = patterns[key].test(password);
    updateRequirementUI(key, isValid); // Update the hint list

    if (isValid) {
      score += 20; // 20 points per character type
      validCount++;
    }
  });

  return { score, validCount };
};

/* --- 2. UI Updates --- */
const updateRequirementUI = (reqKey, isValid) => {
  const el = requirements[reqKey];
  const icon = el.querySelector("i");

  if (isValid) {
    el.classList.add("valid");
    el.classList.remove("pending");
    icon.className = "fa-solid fa-check-circle"; // Success Icon
  } else {
    el.classList.remove("valid");
    el.classList.add("pending");
    icon.className = "fa-solid fa-circle"; // Default Dot
  }
};

const updateMeter = (score) => {
  // Clamp score between 0 and 100
  const percent = Math.min(100, Math.max(0, score));

  strengthBar.style.width = `${percent}%`;

  // Determine Color and Text Label based on score tiers
  let color = "#d1d5db"; // Default gray
  let label = "N/A";

  if (score > 0) {
    if (score < 40) {
      color = "var(--strength-weak)";
      label = "Weak";
    } else if (score < 80) {
      color = "var(--strength-medium)";
      label = "Medium";
    } else {
      color = "var(--strength-strong)";
      label = "Strong";
    }
  }

  strengthBar.style.backgroundColor = color;
  strengthText.innerText = label;
  strengthText.style.color = color === "#d1d5db" ? "var(--text-muted)" : color;
};

/* --- 3. Event Listeners --- */

// Real-time Input Listener
passwordInput.addEventListener("input", (e) => {
  const password = e.target.value;

  if (password.length === 0) {
    updateMeter(0);
    // Reset hints
    Object.keys(requirements).forEach((key) => updateRequirementUI(key, false));
    return;
  }

  const { score } = evaluatePassword(password);
  updateMeter(score);
});

// Toggle Password Visibility
toggleBtn.addEventListener("click", () => {
  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);

  // Switch Icon class
  const icon = toggleBtn.querySelector("i");
  icon.classList.toggle("fa-eye");
  icon.classList.toggle("fa-eye-slash");
});

// Copy to Clipboard
copyBtn.addEventListener("click", async () => {
  if (!passwordInput.value) return;

  try {
    await navigator.clipboard.writeText(passwordInput.value);
    alert("Password copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy!", err);
  }
});

// Generate Strong Password
generateBtn.addEventListener("click", () => {
  const length = 16;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";

  // Use Crypto API for better randomness
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);

  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length];
  }

  passwordInput.value = password;
  // Trigger input event manually to update strength meter
  passwordInput.dispatchEvent(new Event("input"));
});

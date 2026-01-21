/* --- CONSTANTS & DOM ELEMENTS --- */
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const toggleBtn = document.getElementById("toggle-btn");
const toggleText = document.getElementById("toggle-text");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");

// State to track current view
let isLoginView = true;

/* --- EVENT LISTENERS --- */

// 1. Toggle between Login and Register views
toggleBtn.addEventListener("click", (e) => {
  e.preventDefault();

  // Check if browser supports View Transitions API
  if (document.startViewTransition) {
    document.startViewTransition(() => switchView());
  } else {
    // Fallback for older browsers
    switchView();
  }
});

// 2. Handle Login Submission
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (validateForm(loginForm)) {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    attemptLogin(email, password);
  }
});

// 3. Handle Register Submission
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (validateForm(registerForm)) {
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;

    attemptRegister(email, password);
  }
});

// 4. Real-time validation (removes error styles on input)
document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", () => {
    clearError(input);
  });
});

/* --- CORE FUNCTIONS --- */

/**
 * Switches the UI between Login and Register modes
 */
function switchView() {
  isLoginView = !isLoginView;

  if (isLoginView) {
    // UI updates for Login
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    pageTitle.textContent = "Welcome Back";
    pageSubtitle.textContent = "Enter your details to sign in.";
    toggleText.innerHTML = `Don't have an account? <a href="#" id="toggle-btn-inner">Sign up</a>`;
  } else {
    // UI updates for Register
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    pageTitle.textContent = "Create Account";
    pageSubtitle.textContent = "Start your journey with us.";
    toggleText.innerHTML = `Already have an account? <a href="#" id="toggle-btn-inner">Sign in</a>`;
  }

  // Re-bind the toggle button inside the new HTML string
  document.getElementById("toggle-btn-inner").addEventListener("click", (e) => {
    e.preventDefault();
    if (document.startViewTransition) {
      document.startViewTransition(() => switchView());
    } else {
      switchView();
    }
  });
}

/* --- VALIDATION LOGIC --- */

/**
 * Validates all inputs in a specific form
 */
function validateForm(form) {
  let isValid = true;
  const inputs = form.querySelectorAll("input");

  inputs.forEach((input) => {
    if (!validateInput(input)) {
      isValid = false;
    }
  });

  return isValid;
}

/**
 * Validates a single input based on type and custom logic
 */
function validateInput(input) {
  const value = input.value.trim();
  let error = "";

  // 1. Check Empty
  if (!value) {
    error = "This field is required";
  }
  // 2. Check Email Format
  else if (input.type === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) error = "Invalid email format";
  }
  // 3. Check Password Length (Register only)
  else if (input.id === "reg-password" && value.length < 6) {
    error = "Password must be at least 6 characters";
  }
  // 4. Check Password Match (Register only)
  else if (input.id === "reg-confirm") {
    const password = document.getElementById("reg-password").value;
    if (value !== password) error = "Passwords do not match";
  }

  if (error) {
    showError(input, error);
    return false;
  }
  return true;
}

/* --- UI FEEDBACK HELPERS --- */

function showError(input, message) {
  const group = input.parentElement;
  const errorSpan = group.querySelector(".error-msg");

  input.classList.add("invalid");
  errorSpan.textContent = message;
}

function clearError(input) {
  const group = input.parentElement;
  const errorSpan = group.querySelector(".error-msg");

  input.classList.remove("invalid");
  errorSpan.textContent = "";
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");

  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/* --- MOCK BACKEND (LOCALSTORAGE) --- */

/**
 * Simulates user registration
 */
function attemptRegister(email, password) {
  // Check if user exists
  const users = JSON.parse(localStorage.getItem("auth_users")) || [];
  const userExists = users.find((u) => u.email === email);

  if (userExists) {
    showToast("Email already registered", "error");
    return;
  }

  // Save user (In real app, NEVER save plain passwords)
  users.push({ email, password });
  localStorage.setItem("auth_users", JSON.stringify(users));

  showToast("Account created! Switching to login...", "success");

  // Auto-switch to login after delay
  setTimeout(() => {
    if (document.startViewTransition) {
      document.startViewTransition(() => switchView());
    } else {
      switchView();
    }
  }, 1500);
}

/**
 * Simulates user login
 */
function attemptLogin(email, password) {
  const users = JSON.parse(localStorage.getItem("auth_users")) || [];
  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    showToast("Login successful!", "success");
    // Simulate redirect
    setTimeout(() => {
      document.body.innerHTML = `<h1 style="color:var(--text-main); text-align:center; margin-top:50px;">Welcome to Dashboard, ${email}!</h1>`;
    }, 1500);
  } else {
    showToast("Invalid email or password", "error");
    // Shake animation for error visual
    document
      .querySelector(".auth-container")
      .animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-10px)" },
          { transform: "translateX(10px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 300 },
      );
  }
}

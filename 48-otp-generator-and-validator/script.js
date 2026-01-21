document.addEventListener("DOMContentLoaded", () => {
  // --- Configuration ---
  const OTP_LENGTH = 4;
  const EXPIRY_SECONDS = 30;

  // --- State Variables ---
  let currentOTP = null;
  let timerInterval = null;
  let timeLeft = EXPIRY_SECONDS;

  // --- DOM Elements ---
  const generatorSection = document.getElementById("generator-section");
  const validatorSection = document.getElementById("validator-section");
  const inputsContainer = document.getElementById("inputs-container");
  const inputs = document.querySelectorAll(".otp-inputs input");
  const generateBtn = document.getElementById("generate-btn");
  const verifyBtn = document.getElementById("verify-btn");
  const resendBtn = document.getElementById("resend-btn");
  const timerDisplay = document.getElementById("timer");
  const messageBox = document.getElementById("message-box");
  const mockSms = document.getElementById("mock-sms");
  const smsCodeSpan = document.getElementById("sms-code");

  // --- Event Listeners ---
  generateBtn.addEventListener("click", initOTPFlow);
  resendBtn.addEventListener("click", initOTPFlow);

  // Verify on button click
  document.getElementById("otp-form").addEventListener("submit", (e) => {
    e.preventDefault();
    validateOTP();
  });

  // Input Handling (The complex part!)
  inputs.forEach((input, index) => {
    // 1. Handle typing numbers
    input.addEventListener("input", (e) => {
      const val = e.target.value;

      // Only allow numbers
      if (isNaN(val)) {
        e.target.value = "";
        return;
      }

      if (val !== "") {
        // Move to next input if available
        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      }
    });

    // 2. Handle Backspace (move previous)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && e.target.value === "") {
        if (index > 0) {
          inputs[index - 1].focus();
        }
      }
    });

    // 3. Handle Paste (fill all fields)
    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData("text").slice(0, OTP_LENGTH);

      if (!/^\d+$/.test(pasteData)) return; // Only numbers

      pasteData.split("").forEach((char, i) => {
        if (inputs[i]) inputs[i].value = char;
      });

      // Focus the last filled input or the next empty one
      const lastIndex = Math.min(pasteData.length, inputs.length) - 1;
      inputs[lastIndex].focus();
    });
  });

  // --- Core Functions ---

  // 1. Generate Secure OTP
  function generateSecureOTP(length) {
    // crypto.getRandomValues is more secure than Math.random()
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);

    // Convert random number to string, slice to length
    // We use modulus to ensure it fits, then padStart to keep leading zeros
    const maxRange = Math.pow(10, length);
    const code = (array[0] % maxRange).toString().padStart(length, "0");
    return code;
  }

  // 2. Start the Flow
  function initOTPFlow() {
    // Generate Code
    currentOTP = generateSecureOTP(OTP_LENGTH);

    // Show UI
    generatorSection.classList.add("hidden");
    validatorSection.classList.remove("hidden");
    validatorSection.setAttribute("aria-hidden", "false");

    // Reset Inputs & State
    inputs.forEach((input) => {
      input.value = "";
      input.disabled = false;
      input.parentElement.classList.remove("error", "success", "expired");
    });
    messageBox.textContent = "";
    messageBox.className = "message-box";

    // Start Timer
    startTimer();

    // Trigger Mock SMS (UX Requirement)
    showMockSMS(currentOTP);

    // Auto focus first input
    inputs[0].focus();
  }

  // 3. Timer Logic
  function startTimer() {
    clearInterval(timerInterval);
    timeLeft = EXPIRY_SECONDS;
    timerDisplay.textContent = timeLeft;
    resendBtn.disabled = true;

    timerInterval = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handleExpiration();
      }
    }, 1000);
  }

  function handleExpiration() {
    inputsContainer.classList.add("expired");
    inputs.forEach((input) => (input.disabled = true));
    showMessage("Code expired. Please request a new one.", "error");
    resendBtn.disabled = false;
    currentOTP = null; // Invalidate code
  }

  // 4. Validation Logic
  function validateOTP() {
    // Collect values
    let enteredOTP = "";
    inputs.forEach((input) => (enteredOTP += input.value));

    if (!currentOTP) {
      showMessage("Session expired. Request new code.", "error");
      return;
    }

    if (enteredOTP.length !== OTP_LENGTH) {
      showMessage("Please enter all 4 digits.", "error");
      inputsContainer.classList.add("error");
      return;
    }

    if (enteredOTP === currentOTP) {
      // Success State
      clearInterval(timerInterval);
      inputsContainer.classList.remove("error");
      inputsContainer.classList.add("success");
      inputs.forEach((input) => (input.disabled = true));
      showMessage("Verification Successful! Redirecting...", "success");
      verifyBtn.disabled = true;
      resendBtn.disabled = true;
    } else {
      // Error State
      inputsContainer.classList.add("error");
      // Remove error class after animation to allow re-shake
      setTimeout(() => inputsContainer.classList.remove("error"), 500);
      showMessage("Invalid Code. Please try again.", "error");
      inputs.forEach((input) => (input.value = ""));
      inputs[0].focus();
    }
  }

  // 5. Helper: Show UI Messages
  function showMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.className = `message-box ${type}`; // Add color class
    messageBox.style.color =
      type === "error" ? "var(--error-color)" : "var(--success-color)";
    messageBox.style.marginTop = "1rem";
  }

  // 6. Helper: Mock SMS Notification
  function showMockSMS(code) {
    smsCodeSpan.textContent = code;
    mockSms.classList.remove("hidden");

    // Hide after 5 seconds
    setTimeout(() => {
      mockSms.classList.add("hidden");
    }, 5000);
  }
});

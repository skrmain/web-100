/* script.js */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const inputs = form.querySelectorAll("input");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const successMessage = document.getElementById("successMessage");

  // 1. Validation Logic
  // -------------------

  /**
   * Checks validity of a specific input field
   * @param {HTMLInputElement} input
   */
  const validateField = (input) => {
    let isValid = true;

    // Remove previous styles first
    removeError(input);

    // Check Native Constraints (required, type, pattern, etc.)
    if (!input.checkValidity()) {
      isValid = false;
      showError(input, getErrorMessage(input));
    }

    // Custom Logic: Confirm Password Match
    if (input === confirmPasswordInput) {
      if (passwordInput.value !== confirmPasswordInput.value) {
        isValid = false;
        showError(input, "Passwords do not match.");
      }
    }

    // Apply Success Style if valid and not empty
    if (isValid && input.value.trim() !== "") {
      input.classList.add("success");
    } else {
      input.classList.remove("success");
    }

    return isValid;
  };

  /**
   * Determines the specific error message based on validity state
   * @param {HTMLInputElement} input
   */
  const getErrorMessage = (input) => {
    const validity = input.validity;

    if (validity.valueMissing) return "This field is required.";
    if (validity.typeMismatch)
      return "Please enter a valid format (e.g., email).";
    if (validity.patternMismatch)
      return "Format is invalid (check letters/numbers).";
    if (validity.tooShort)
      return `Minimum ${input.minLength} characters required.`;
    if (validity.rangeUnderflow) return `Value must be at least ${input.min}.`;
    if (validity.rangeOverflow) return `Value must be less than ${input.max}.`;

    return "Invalid input.";
  };

  /**
   * Visuals: Display error message and add red border
   */
  const showError = (input, message) => {
    const inputGroup = input.parentElement;
    const errorDisplay = inputGroup.querySelector(".error-message");

    input.classList.add("error");
    input.classList.remove("success");
    errorDisplay.textContent = message;
  };

  /**
   * Visuals: Clear error message and red border
   */
  const removeError = (input) => {
    const inputGroup = input.parentElement;
    const errorDisplay = inputGroup.querySelector(".error-message");

    input.classList.remove("error");
    errorDisplay.textContent = "";
  };

  // 2. Event Listeners
  // ------------------

  inputs.forEach((input) => {
    // Validate on Blur (when user leaves the field)
    input.addEventListener("blur", () => {
      validateField(input);
    });

    // Validate on Input (clear error as user types)
    input.addEventListener("input", () => {
      // Only re-validate immediately if it already has an error
      // This prevents annoyed users seeing red while still typing valid data
      if (input.classList.contains("error") || input === confirmPasswordInput) {
        validateField(input);
      }
    });
  });

  // 3. Form Submission
  // ------------------
  form.addEventListener("submit", (e) => {
    e.preventDefault(); // Stop default HTML submission

    let isFormValid = true;

    // Run validation on ALL fields
    inputs.forEach((input) => {
      if (!validateField(input)) {
        isFormValid = false;
      }
    });

    if (isFormValid) {
      // Success State
      successMessage.classList.remove("hidden");

      // Disable form to prevent double submit (optional UX)
      Array.from(form.elements).forEach((el) => (el.disabled = true));

      console.log("Form Submitted Successfully!");
    } else {
      // Hide success message if previously shown
      successMessage.classList.add("hidden");
    }
  });
});

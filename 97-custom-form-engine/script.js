/**
 * ARCHITECTURE:
 * 1. Store: Manages Schema State.
 * 2. Validator: Pure functions for input validation.
 * 3. FormRenderer: Factory Pattern to generate DOM and handle Logic.
 * 4. BuilderUI: Manages the Editor interface.
 */

// --- 1. UTILS & STORE ---
const generateId = () => "field_" + Math.random().toString(36).substr(2, 9);

const AppState = {
  schema: [], // Array of Field Objects
  subscribers: [],

  addField(type) {
    const newField = {
      id: generateId(),
      type: type,
      label: `New ${type}`,
      placeholder: "",
      required: false,
      options:
        type === "select" || type === "radio" ? ["Option 1", "Option 2"] : [],
      visibleIf: null,
    };
    this.schema.push(newField);
    this.notify();
  },

  updateField(id, updates) {
    const index = this.schema.findIndex((f) => f.id === id);
    if (index > -1) {
      this.schema[index] = { ...this.schema[index], ...updates };
      this.notify();
    }
  },

  deleteField(id) {
    this.schema = this.schema.filter((f) => f.id !== id);
    this.schema.forEach((f) => {
      if (f.visibleIf && f.visibleIf.field === id) f.visibleIf = null;
    });
    this.notify();
  },

  getField(id) {
    return this.schema.find((f) => f.id === id);
  },

  subscribe(fn) {
    this.subscribers.push(fn);
  },

  notify() {
    this.subscribers.forEach((fn) => fn(this.schema));
  },
};

// --- 2. VALIDATION ENGINE ---
const Validator = {
  rules: {
    required: (value) => value && value.trim() !== "",
    email: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    minLength: (value, min) => !value || value.length >= min,
  },

  validateField(field, value) {
    if (field.required && !this.rules.required(value)) {
      return "This field is required";
    }
    if (
      field.type === "text" &&
      field.label.toLowerCase().includes("email") &&
      !this.rules.email(value)
    ) {
      return "Please enter a valid email";
    }
    return null;
  },
};

// --- 3. FORM RENDERER (The Engine) ---
class FormRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.formValues = {}; // Mirrors current state of inputs
    this.currentSchema = []; // Keep track of schema for logic checks

    // FIX #2: Setup Event Delegation ONCE in constructor
    this.setupDelegation();
  }

  render(schema) {
    this.currentSchema = schema;
    this.container.innerHTML = ""; // Clear DOM

    schema.forEach((field) => {
      const fieldDOM = this.createFieldDOM(field);
      this.container.appendChild(fieldDOM);
    });

    // Re-evaluate logic immediately to hide/show fields based on existing values
    this.evaluateVisibility();
  }

  // Factory Pattern
  createFieldDOM(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "field-container visible";
    wrapper.dataset.id = field.id;

    // Label
    const label = document.createElement("label");
    label.className = "form-label";
    label.innerHTML = `${field.label} ${field.required ? '<span class="required-star">*</span>' : ""}`;
    wrapper.appendChild(label);

    let inputEl;
    const currentValue = this.formValues[field.id] || ""; // FIX #1: Retrieve existing value

    if (field.type === "textarea") {
      inputEl = document.createElement("textarea");
      inputEl.className = "form-textarea";
      inputEl.value = currentValue; // Restore value
    } else if (field.type === "select") {
      inputEl = document.createElement("select");
      inputEl.className = "form-select";
      const defOpt = document.createElement("option");
      defOpt.value = "";
      defOpt.text = "-- Select --";
      inputEl.appendChild(defOpt);

      field.options.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        option.text = opt;
        inputEl.appendChild(option);
      });
      inputEl.value = currentValue; // Restore value
    } else if (field.type === "radio") {
      inputEl = document.createElement("div");
      field.options.forEach((opt) => {
        const lbl = document.createElement("label");
        lbl.style.marginRight = "10px";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = field.id;
        radio.value = opt;
        // Restore checked state
        if (currentValue === opt) radio.checked = true;

        lbl.appendChild(radio);
        lbl.appendChild(document.createTextNode(opt));
        inputEl.appendChild(lbl);
      });
    } else {
      // Text / Checkbox
      inputEl = document.createElement("input");
      inputEl.className = "form-input";

      if (field.type === "checkbox") {
        inputEl.type = "checkbox";
        // Checkbox value handling
        if (currentValue === "true") inputEl.checked = true;
      } else {
        inputEl.type = "text";
        inputEl.value = currentValue; // Restore value
      }
    }

    if (
      field.placeholder &&
      inputEl.tagName === "INPUT" &&
      field.type !== "checkbox" &&
      field.type !== "radio"
    ) {
      inputEl.placeholder = field.placeholder;
    }

    // Add ID (skip for radio container)
    if (field.type !== "radio") {
      inputEl.name = field.id;
      inputEl.id = field.id;
    }

    wrapper.appendChild(inputEl);

    // Error Container
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    wrapper.appendChild(errorDiv);

    // UI Controls
    const actions = document.createElement("div");
    actions.className = "field-actions";
    actions.innerHTML = `
            <button class="action-btn edit" type="button" onclick="BuilderUI.editField('${field.id}')">Edit</button>
            <button class="action-btn delete" type="button" onclick="AppState.deleteField('${field.id}')">Delete</button>
        `;
    wrapper.appendChild(actions);

    return wrapper;
  }

  setupDelegation() {
    this.container.addEventListener("input", (e) => {
      const target = e.target;
      // Handle Radio Buttons (name attribute) vs others (id attribute)
      const fieldId = target.name || target.id;
      const fieldDef = this.currentSchema.find((f) => f.id === fieldId);

      if (!fieldDef) return;

      // 1. Capture Value
      let value = target.value;
      if (target.type === "checkbox") value = target.checked ? "true" : "false";

      this.formValues[fieldId] = value;

      // 2. Validate Real-time
      const errorMsg = Validator.validateField(fieldDef, value);
      const wrapper = target.closest(".field-container");
      const errorEl = wrapper.querySelector(".error-message");

      if (errorMsg) {
        target.classList.add("invalid");
        errorEl.textContent = errorMsg;
        errorEl.classList.add("active");
      } else {
        target.classList.remove("invalid");
        errorEl.classList.remove("active");
      }

      // 3. Trigger Dependency Check
      this.evaluateVisibility();
    });
  }

  evaluateVisibility() {
    this.currentSchema.forEach((field) => {
      if (field.visibleIf) {
        const parentFieldId = field.visibleIf.field;
        const parentValue = this.formValues[parentFieldId];
        const requiredValue = field.visibleIf.value;

        const domEl = document.querySelector(`div[data-id="${field.id}"]`);
        if (domEl) {
          // Logic: Does current parent value match required value?
          const isVisible = parentValue === requiredValue;

          if (isVisible) {
            domEl.classList.remove("hidden");
            domEl.classList.add("visible");
          } else {
            domEl.classList.add("hidden");
            domEl.classList.remove("visible");
          }
        }
      }
    });
  }

  exportData() {
    console.log("--- FORM SUBMISSION DATA ---");
    console.log(JSON.stringify(this.formValues, null, 2));
    alert("Form Data exported to Console!");
  }
}

// --- 4. BUILDER UI (Left Pane Logic) ---
const BuilderUI = {
  selectedFieldId: null,
  renderer: null,

  init() {
    this.renderer = new FormRenderer("generated-form");

    // Tool Buttons
    document.querySelectorAll(".tool-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        AppState.addField(btn.dataset.type);
      });
    });

    // Property Editor Inputs
    document
      .getElementById("save-props-btn")
      .addEventListener("click", () => this.saveProperties());
    document
      .getElementById("cancel-props-btn")
      .addEventListener("click", () => this.hideEditor());

    // Export
    document.getElementById("export-btn").addEventListener("click", (e) => {
      e.preventDefault();
      this.renderer.exportData();
    });

    // Subscribe Renderer to State
    AppState.subscribe((schema) => {
      this.renderer.render(schema);
      this.updateDependencyDropdown(schema);
    });
  },

  editField(id) {
    this.selectedFieldId = id;
    const field = AppState.getField(id);
    if (!field) return;

    // Populate Form
    document.getElementById("property-editor").classList.remove("hidden");
    document.getElementById("prop-label").value = field.label;
    document.getElementById("prop-placeholder").value = field.placeholder || "";
    document.getElementById("prop-required").checked = field.required;

    // Handle Options
    const optsGroup = document.getElementById("prop-options-group");
    const optsInput = document.getElementById("prop-options");
    if (field.type === "select" || field.type === "radio") {
      optsGroup.classList.remove("hidden");
      optsInput.value = field.options.join(", ");
    } else {
      optsGroup.classList.add("hidden");
    }

    // Handle Logic
    document.getElementById("prop-dependency-value").value = field.visibleIf
      ? field.visibleIf.value
      : "";
    const depSelect = document.getElementById("prop-dependency-target");
    // Need to update dropdown options first to ensure current selection exists
    this.updateDependencyDropdown(AppState.schema);
    depSelect.value = field.visibleIf ? field.visibleIf.field : "";
  },

  saveProperties() {
    if (!this.selectedFieldId) return;

    const optionsStr = document.getElementById("prop-options").value;
    const depTarget = document.getElementById("prop-dependency-target").value;
    const depValue = document.getElementById("prop-dependency-value").value;

    const updates = {
      label: document.getElementById("prop-label").value,
      placeholder: document.getElementById("prop-placeholder").value,
      required: document.getElementById("prop-required").checked,
      options: optionsStr ? optionsStr.split(",").map((s) => s.trim()) : [],
      visibleIf:
        depTarget && depValue ? { field: depTarget, value: depValue } : null,
    };

    AppState.updateField(this.selectedFieldId, updates);
    this.hideEditor();
  },

  hideEditor() {
    document.getElementById("property-editor").classList.add("hidden");
    this.selectedFieldId = null;
  },

  updateDependencyDropdown(schema) {
    const select = document.getElementById("prop-dependency-target");
    const currentVal = select.value;

    select.innerHTML = '<option value="">-- None --</option>';
    schema.forEach((f) => {
      if (f.id !== this.selectedFieldId) {
        const opt = document.createElement("option");
        opt.value = f.id;
        opt.text = `${f.label} (${f.id})`;
        select.appendChild(opt);
      }
    });

    if (currentVal) select.value = currentVal;
  },
};

window.BuilderUI = BuilderUI;
window.AppState = AppState;

document.addEventListener("DOMContentLoaded", () => {
  BuilderUI.init();
});

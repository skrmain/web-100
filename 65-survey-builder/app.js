/**
 * Survey Builder App
 * Using Vanilla JS modules structure
 */

const app = (() => {
  // --- 1. State Management ---

  // Default state structure
  let state = {
    title: "My Awesome Survey",
    questions: [],
  };

  // Current drag source index
  let dragSrcIndex = null;

  // Load from LocalStorage if available
  function loadState() {
    const saved = localStorage.getItem("surveyData");
    if (saved) {
      state = JSON.parse(saved);
      document.getElementById("survey-title-input").value = state.title;
    }
    renderBuilder();
  }

  function saveState() {
    state.title = document.getElementById("survey-title-input").value;
    localStorage.setItem("surveyData", JSON.stringify(state));
  }

  // Helper: Generate unique ID
  const generateId = () => "_" + Math.random().toString(36).substr(2, 9);

  // --- 2. Core Logic (CRUD) ---

  function addQuestion(type) {
    const newQ = {
      id: generateId(),
      type: type, // short, long, single, multi, rating
      label: "New Question",
      required: false,
      options:
        type === "single" || type === "multi" ? ["Option 1", "Option 2"] : [],
    };
    state.questions.push(newQ);
    saveState();
    renderBuilder();
  }

  function deleteQuestion(id) {
    if (!confirm("Delete this question?")) return;
    state.questions = state.questions.filter((q) => q.id !== id);
    saveState();
    renderBuilder();
  }

  function updateQuestion(id, key, value) {
    const q = state.questions.find((q) => q.id === id);
    if (q) {
      q[key] = value;
      saveState();
      // We don't re-render entire list for text input to keep focus,
      // but we save to state.
    }
  }

  function updateOption(qId, index, value) {
    const q = state.questions.find((q) => q.id === qId);
    if (q && q.options) {
      q.options[index] = value;
      saveState();
    }
  }

  function addOption(qId) {
    const q = state.questions.find((q) => q.id === qId);
    if (q) {
      q.options.push(`Option ${q.options.length + 1}`);
      saveState();
      renderBuilder();
    }
  }

  function removeOption(qId, index) {
    const q = state.questions.find((q) => q.id === qId);
    if (q && q.options.length > 1) {
      q.options.splice(index, 1);
      saveState();
      renderBuilder();
    }
  }

  // --- 3. Drag and Drop Logic (Native API) ---

  function handleDragStart(e) {
    this.style.opacity = "0.4";
    dragSrcIndex = +this.getAttribute("data-index");
    e.dataTransfer.effectAllowed = "move";
    // Required for Firefox
    e.dataTransfer.setData("text/html", this.innerHTML);
    this.classList.add("dragging");
  }

  function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault(); // Necessary for 'drop' to fire
    e.dataTransfer.dropEffect = "move";
    return false;
  }

  function handleDrop(e) {
    e.stopPropagation();
    const dropTarget = e.target.closest(".question-card");

    if (dragSrcIndex !== null && dropTarget) {
      const dropIndex = +dropTarget.getAttribute("data-index");

      if (dragSrcIndex !== dropIndex) {
        // Reorder array
        const item = state.questions.splice(dragSrcIndex, 1)[0];
        state.questions.splice(dropIndex, 0, item);
        saveState();
        renderBuilder();
      }
    }
    return false;
  }

  function handleDragEnd() {
    this.style.opacity = "1";
    this.classList.remove("dragging");
    // Clean up classes
    document
      .querySelectorAll(".question-card")
      .forEach((card) => card.classList.remove("dragging"));
  }

  // --- 4. Rendering ---

  function renderBuilder() {
    const container = document.getElementById("questions-container");
    container.innerHTML = "";

    if (state.questions.length === 0) {
      container.innerHTML = `<div class="empty-state">Start by adding a question from the toolbox.</div>`;
      return;
    }

    state.questions.forEach((q, index) => {
      const card = document.createElement("div");
      card.className = "question-card";
      card.setAttribute("draggable", "true");
      card.setAttribute("data-id", q.id);
      card.setAttribute("data-index", index);

      // Drag Events
      card.addEventListener("dragstart", handleDragStart);
      card.addEventListener("dragover", handleDragOver);
      card.addEventListener("drop", handleDrop);
      card.addEventListener("dragend", handleDragEnd);

      // Conditional HTML for options (Radio/Checkbox)
      let optionsHtml = "";
      if (q.type === "single" || q.type === "multi") {
        optionsHtml = `
                    <div class="options-list">
                        <small>Options:</small>
                        ${q.options
                          .map(
                            (opt, i) => `
                            <div class="option-item">
                                <input type="text" value="${opt}" oninput="app.updateOption('${q.id}', ${i}, this.value)">
                                <button class="btn-sm" onclick="app.removeOption('${q.id}', ${i})">×</button>
                            </div>
                        `,
                          )
                          .join("")}
                        <button class="btn-sm" style="margin-top:5px" onclick="app.addOption('${q.id}')">+ Add Option</button>
                    </div>
                `;
      }

      card.innerHTML = `
                <div class="drag-handle">:::</div>
                <div class="card-header">
                    <div style="flex-grow:1; margin-right:10px;">
                        <input type="text" class="q-label" value="${q.label}" 
                               oninput="app.updateQuestion('${q.id}', 'label', this.value)" 
                               placeholder="Question Label">
                    </div>
                    <select onchange="app.updateQuestion('${q.id}', 'type', this.value)">
                        <option value="short" ${q.type === "short" ? "selected" : ""}>Short Text</option>
                        <option value="long" ${q.type === "long" ? "selected" : ""}>Long Text</option>
                        <option value="single" ${q.type === "single" ? "selected" : ""}>Single Choice</option>
                        <option value="multi" ${q.type === "multi" ? "selected" : ""}>Checkbox</option>
                        <option value="rating" ${q.type === "rating" ? "selected" : ""}>Rating</option>
                    </select>
                </div>
                <div class="card-body">
                    <label>
                        <input type="checkbox" ${q.required ? "checked" : ""} 
                               onchange="app.updateQuestion('${q.id}', 'required', this.checked)"> 
                        Required
                    </label>
                    ${optionsHtml}
                    <div style="text-align:right; margin-top:10px;">
                        <button style="color:var(--danger); border-color:var(--danger)" 
                                onclick="app.deleteQuestion('${q.id}')">Delete</button>
                    </div>
                </div>
            `;
      container.appendChild(card);
    });
  }

  function renderPreview() {
    const form = document.getElementById("preview-form");
    const title = document.getElementById("preview-title");
    title.innerText = state.title;
    form.innerHTML = "";

    state.questions.forEach((q) => {
      const div = document.createElement("div");
      div.className = "form-group";

      // Validation indicator
      const reqStar = q.required ? '<span style="color:red">*</span>' : "";
      const label = `<label>${q.label} ${reqStar}</label>`;

      let inputHtml = "";

      if (q.type === "short") {
        inputHtml = `<input type="text" name="${q.id}" ${q.required ? "required" : ""}>`;
      } else if (q.type === "long") {
        inputHtml = `<textarea name="${q.id}" rows="3" ${q.required ? "required" : ""}></textarea>`;
      } else if (q.type === "rating") {
        inputHtml = `<div class="rating-input">
                    ${[1, 2, 3, 4, 5]
                      .map(
                        (num) => `
                        <label style="display:inline-block; margin-right:10px; font-weight:normal;">
                            <input type="radio" name="${q.id}" value="${num}" ${q.required ? "required" : ""}> ${num}
                        </label>
                    `,
                      )
                      .join("")}
                </div>`;
      } else if (q.type === "single") {
        inputHtml = q.options
          .map(
            (opt) => `
                    <div style="margin-bottom:5px;">
                        <input type="radio" name="${q.id}" value="${opt}" ${q.required ? "required" : ""}> ${opt}
                    </div>
                `,
          )
          .join("");
      } else if (q.type === "multi") {
        // Checkbox validation is tricky in HTML5, handled in submit
        inputHtml = q.options
          .map(
            (opt) => `
                    <div style="margin-bottom:5px;">
                        <input type="checkbox" name="${q.id}" value="${opt}"> ${opt}
                    </div>
                `,
          )
          .join("");
      }

      div.innerHTML = label + inputHtml;
      form.appendChild(div);
    });
  }

  // --- 5. Application Controls ---

  function switchMode(mode) {
    // Save title before switching
    state.title = document.getElementById("survey-title-input").value;
    saveState();

    const builderView = document.getElementById("builder-view");
    const previewView = document.getElementById("preview-view");
    const btnBuilder = document.getElementById("btn-view-builder");
    const btnPreview = document.getElementById("btn-view-preview");
    const jsonOutput = document.getElementById("json-output");

    // Optional: View Transitions API
    const doSwitch = () => {
      if (mode === "builder") {
        builderView.classList.remove("hidden");
        previewView.classList.add("hidden");
        btnBuilder.classList.add("active");
        btnPreview.classList.remove("active");
        renderBuilder();
        jsonOutput.classList.add("hidden"); // hide JSON on switch back
      } else {
        builderView.classList.add("hidden");
        previewView.classList.remove("hidden");
        btnBuilder.classList.remove("active");
        btnPreview.classList.add("active");
        renderPreview();
      }
    };

    if (document.startViewTransition) {
      document.startViewTransition(doSwitch);
    } else {
      doSwitch();
    }
  }

  // Handle Form Submission
  function setupEventListeners() {
    document.getElementById("preview-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const response = {};

      // Parse FormData
      state.questions.forEach((q) => {
        if (q.type === "multi") {
          // Checkboxes need getAll
          response[q.label] = formData.getAll(q.id);
        } else {
          response[q.label] = formData.get(q.id);
        }
      });

      const output = document.getElementById("json-output");
      output.textContent =
        "Submission JSON:\n" + JSON.stringify(response, null, 2);
      output.classList.remove("hidden");

      // Check scroll
      output.scrollIntoView({ behavior: "smooth" });
    });

    // Sync title changes
    document
      .getElementById("survey-title-input")
      .addEventListener("input", (e) => {
        state.title = e.target.value;
        saveState();
      });
  }

  // Initialization
  function init() {
    loadState();
    setupEventListeners();
  }

  init();

  // Public API for HTML onclick bindings
  return {
    addQuestion,
    deleteQuestion,
    updateQuestion,
    addOption,
    removeOption,
    updateOption,
    switchMode,
  };
})();

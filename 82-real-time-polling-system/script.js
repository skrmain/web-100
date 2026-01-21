/**
 * Custom SVG Charting Engine
 * Manages raw SVG DOM elements based on data inputs.
 */
class ChartRenderer {
  constructor(svgId, config) {
    this.svg = document.getElementById(svgId);
    this.config = {
      viewBoxWidth: 600,
      rowHeight: 60, // Height allocated per bar including gap
      barHeight: 30, // Actual height of the rect
      labelOffset: 120, // Space reserved for left labels
      colors: ["#4299e1", "#48bb78", "#ed8936", "#f56565"],
      ...config,
    };
    this.ns = "http://www.w3.org/2000/svg"; // SVG Namespace
    this.initialized = false;
    this.elements = {}; // Cache references to DOM elements
  }

  /**
   * Initializes the SVG structure (only runs once)
   */
  init(options) {
    this.svg.innerHTML = ""; // Clear
    this.elements = {};

    options.forEach((opt, index) => {
      const g = document.createElementNS(this.ns, "g");
      const yPos = index * this.config.rowHeight + 10;

      // 1. Text Label (Option Name)
      const label = document.createElementNS(this.ns, "text");
      label.setAttribute("x", 0);
      label.setAttribute("y", yPos + 20); // Center vertically roughly
      label.setAttribute("class", "bar-label");
      label.textContent = opt.label;

      // 2. Background Track (Gray bar)
      const bgRect = document.createElementNS(this.ns, "rect");
      bgRect.setAttribute("x", this.config.labelOffset);
      bgRect.setAttribute("y", yPos);
      bgRect.setAttribute(
        "width",
        this.config.viewBoxWidth - this.config.labelOffset - 50,
      ); // -50 for % text space
      bgRect.setAttribute("height", this.config.barHeight);
      bgRect.setAttribute("fill", "#edf2f7");
      bgRect.setAttribute("rx", 4);

      // 3. The Value Bar (Colored) - Starts at width 0
      const bar = document.createElementNS(this.ns, "rect");
      bar.setAttribute("x", this.config.labelOffset);
      bar.setAttribute("y", yPos);
      bar.setAttribute("height", this.config.barHeight);
      bar.setAttribute("width", 0); // Start at 0
      bar.setAttribute(
        "fill",
        this.config.colors[index % this.config.colors.length],
      );
      bar.setAttribute("class", "bar"); // For CSS transition

      // 4. Percentage Text
      const percent = document.createElementNS(this.ns, "text");
      percent.setAttribute("x", this.config.labelOffset + 10);
      percent.setAttribute("y", yPos + 20);
      percent.setAttribute("class", "bar-percent");
      percent.textContent = "0%";

      g.appendChild(label);
      g.appendChild(bgRect);
      g.appendChild(bar);
      g.appendChild(percent);
      this.svg.appendChild(g);

      // Cache for updates
      this.elements[opt.id] = { bar, percent };
    });
  }

  /**
   * Updates the attributes of existing SVG elements
   */
  update(options, totalVotes) {
    const maxBarWidth = this.config.viewBoxWidth - this.config.labelOffset - 60; // Max pixels available for bar

    options.forEach((opt) => {
      const els = this.elements[opt.id];
      if (!els) return;

      // Calculate Math
      const percentage = totalVotes === 0 ? 0 : (opt.votes / totalVotes) * 100;
      const pixelWidth = (percentage / 100) * maxBarWidth;

      // Apply attributes
      els.bar.setAttribute("width", Math.max(0, pixelWidth)); // Prevent negative

      // Update Text
      els.percent.textContent = `${percentage.toFixed(1)}%`;

      // Move text to follow bar end, but keep minimum padding
      const textX = this.config.labelOffset + pixelWidth + 10;
      els.percent.setAttribute("x", textX);
    });
  }
}

/**
 * Poll Application Logic
 * Handles State, Persistence, and Interaction
 */
class PollApp {
  constructor() {
    this.STORAGE_KEY = "poll_data_v1";
    this.state = this.loadState() || this.getDefaultState();

    this.renderer = new ChartRenderer("chart-svg");
    this.simTimer = null;

    this.ui = {
      question: document.getElementById("poll-question"),
      grid: document.getElementById("voting-grid"),
      total: document.getElementById("total-votes"),
      btnReset: document.getElementById("btn-reset"),
      btnSimulate: document.getElementById("btn-simulate"),
    };

    this.init();
  }

  getDefaultState() {
    return {
      question: "Which Frontend Framework do you prefer?",
      options: [
        { id: "opt_1", label: "React", votes: 0 },
        { id: "opt_2", label: "Vue", votes: 0 },
        { id: "opt_3", label: "Svelte", votes: 0 },
        { id: "opt_4", label: "Vanilla JS", votes: 0 },
      ],
      totalVotes: 0,
      userChoice: null, // Local user's choice
    };
  }

  init() {
    // Initial Render
    this.ui.question.textContent = this.state.question;
    this.renderButtons();
    this.renderer.init(this.state.options);
    this.updateView();

    // Event Listeners
    this.ui.btnReset.addEventListener("click", () => this.resetPoll());
    this.ui.btnSimulate.addEventListener("click", () =>
      this.toggleSimulation(),
    );

    // Listen for updates from other tabs
    window.addEventListener("storage", (e) => this.handleStorageEvent(e));
  }

  /**
   * Core: Handles local storage read/write
   */
  saveState() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
  }

  loadState() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Cross-Tab Reactivity
   * Triggered when another tab updates localStorage
   */
  handleStorageEvent(e) {
    if (e.key === this.STORAGE_KEY && e.newValue) {
      const newState = JSON.parse(e.newValue);
      // Preserve local user choice (UI state), merge data state
      const localChoice = this.state.userChoice;
      this.state = newState;
      this.state.userChoice = localChoice; // Keep local selection highlighting
      this.updateView();
    }
  }

  /**
   * Optimistic UI Update
   * Updates internal state and UI immediately, then saves.
   */
  vote(optionId) {
    // Find option
    const optionIndex = this.state.options.findIndex((o) => o.id === optionId);
    if (optionIndex === -1) return;

    // Logic: Increment
    this.state.options[optionIndex].votes++;
    this.state.totalVotes++;
    this.state.userChoice = optionId;

    // 1. Instant UI Update (Optimistic)
    this.updateView();
    this.highlightChoice(optionId);

    // 2. Persist
    this.saveState();
  }

  resetPoll() {
    this.state = this.getDefaultState();
    this.saveState();
    this.renderer.init(this.state.options); // Re-init SVG structure in case options changed
    this.updateView();
    this.renderButtons(); // Reset button styles
  }

  /**
   * Updates DOM elements based on current state
   */
  updateView() {
    // Update Chart
    this.renderer.update(this.state.options, this.state.totalVotes);

    // Update Text
    this.ui.total.textContent = `Total Votes: ${this.state.totalVotes}`;

    // Ensure buttons reflect current user choice
    if (this.state.userChoice) {
      this.highlightChoice(this.state.userChoice);
    }
  }

  /**
   * Renders the clickable voting cards
   */
  renderButtons() {
    this.ui.grid.innerHTML = "";
    this.state.options.forEach((opt) => {
      const btn = document.createElement("div");
      btn.className = "vote-card";
      btn.textContent = opt.label;
      btn.dataset.id = opt.id;

      // Interaction
      btn.addEventListener("click", () => this.vote(opt.id));

      this.ui.grid.appendChild(btn);
    });
  }

  highlightChoice(id) {
    // Remove selected class from all
    const allBtns = this.ui.grid.querySelectorAll(".vote-card");
    allBtns.forEach((b) => b.classList.remove("selected"));

    // Add to current
    const target = this.ui.grid.querySelector(`.vote-card[data-id="${id}"]`);
    if (target) {
      target.classList.add("selected");
      target.textContent = target.textContent.replace(" (You)", "") + " (You)";
    }
  }

  /**
   * Simulation Logic
   * Demonstrates stability under load
   */
  toggleSimulation() {
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
      this.ui.btnSimulate.textContent = "⚡ Simulate Traffic";
      this.ui.btnSimulate.classList.remove("danger");
    } else {
      this.ui.btnSimulate.textContent = "⏹ Stop Simulation";
      this.ui.btnSimulate.classList.add("danger");

      let count = 0;
      this.simTimer = setInterval(() => {
        if (count >= 20) {
          // Stop after 10 seconds (20 * 500ms)
          this.toggleSimulation();
          return;
        }
        const randomIdx = Math.floor(Math.random() * 4);
        this.vote(this.state.options[randomIdx].id);
        count++;
      }, 500);
    }
  }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  window.app = new PollApp();
});

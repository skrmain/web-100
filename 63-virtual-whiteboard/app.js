/**
 * Virtual Whiteboard Application
 * Focus: Pointer Events, State Management, Canvas API
 */

// --- DOM Elements ---
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d", { willReadFrequently: true }); // Optimized for Undo/Redo
const cursor = document.getElementById("cursor-brush");
const toolbar = document.getElementById("toolbar");

// Controls
const colorPicker = document.getElementById("color-picker");
const brushSizeInput = document.getElementById("brush-size");
const sizeDisplay = document.getElementById("size-display");

// Buttons
const btnDraw = document.getElementById("btn-draw");
const btnErase = document.getElementById("btn-erase");
const btnClear = document.getElementById("btn-clear");
const btnSave = document.getElementById("btn-save");
const btnUndo = document.getElementById("btn-undo");
const btnRedo = document.getElementById("btn-redo");
const toggleMenu = document.getElementById("toggle-menu");

// Modal
const modal = document.getElementById("confirm-modal");
const btnModalConfirm = document.getElementById("modal-confirm");
const btnModalCancel = document.getElementById("modal-cancel");

// --- State Management ---
const state = {
  isDrawing: false,
  mode: "draw", // 'draw' or 'erase'
  color: "#000000",
  size: 5,
  lastX: 0,
  lastY: 0,
  // History Stack for Undo/Redo
  history: [],
  historyStep: -1,
  maxHistory: 20,
};

// --- Initialization ---

function init() {
  resizeCanvas();

  // Load local storage if available
  const savedCanvas = localStorage.getItem("whiteboard_state");
  if (savedCanvas) {
    const img = new Image();
    img.src = savedCanvas;
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      saveHistory(); // Initial state
    };
  } else {
    saveHistory(); // Blank state
  }

  // Determine default theme color for eraser
  updateEraserColor();
}

// Handle Window Resize
window.addEventListener("resize", () => {
  // Save current content before resizing clears canvas
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCtx.drawImage(canvas, 0, 0);

  resizeCanvas();

  // Restore content
  ctx.drawImage(tempCanvas, 0, 0);
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  updateCursor();
}

function updateEraserColor() {
  // If dark mode, eraser usually means painting background color
  // or using globalCompositeOperation = 'destination-out'
  // We will use destination-out for true transparency
}

// --- Drawing Logic (Modular) ---

function getPointerPos(e) {
  return { x: e.clientX, y: e.clientY, pressure: e.pressure };
}

function onPointerDown(e) {
  if (e.target !== canvas) return;

  state.isDrawing = true;
  const { x, y, pressure } = getPointerPos(e);
  state.lastX = x;
  state.lastY = y;

  // Handle Pressure (if supported, default to 0.5)
  const p = pressure || 0.5;

  // Start Path
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Draw a single dot if just clicked
  drawStroke(x, y, p);
}

function onPointerMove(e) {
  // Always update cursor position even if not drawing
  updateCursorPosition(e);

  if (!state.isDrawing) return;
  e.preventDefault(); // Prevent scrolling on touch

  const { x, y, pressure } = getPointerPos(e);
  drawStroke(x, y, pressure || 0.5);

  state.lastX = x;
  state.lastY = y;
}

function onPointerUp(e) {
  if (state.isDrawing) {
    state.isDrawing = false;
    ctx.closePath();
    saveHistory();
    saveToLocalStorage();
  }
}

function drawStroke(x, y, pressure) {
  // Dynamic width based on pressure (Optional feature)
  // If pressure is 0 (mouse), we fallback to 1. If styling pen, varies 0.5 to 1.5
  const pressureMultiplier =
    state.mode === "erase" ? 1 : pressure > 0 ? pressure * 2 : 1;
  const currentLineWidth = state.size * pressureMultiplier;

  ctx.lineWidth = currentLineWidth;

  if (state.mode === "erase") {
    ctx.globalCompositeOperation = "destination-out"; // Makes transparent
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = state.color;
  }

  ctx.lineTo(x, y);
  ctx.stroke();

  // Reset start for smoother curves in next frame
  ctx.beginPath();
  ctx.moveTo(x, y);
}

// --- Undo / Redo System ---

function saveHistory() {
  // If we undo and then draw, we cut off the "future" redo history
  if (state.historyStep < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyStep + 1);
  }

  // Save current canvas state as Data URL
  state.history.push(canvas.toDataURL());
  state.historyStep++;

  // Limit memory usage
  if (state.history.length > state.maxHistory) {
    state.history.shift();
    state.historyStep--;
  }

  updateHistoryButtons();
}

function undo() {
  if (state.historyStep > 0) {
    state.historyStep--;
    restoreHistory();
  }
}

function redo() {
  if (state.historyStep < state.history.length - 1) {
    state.historyStep++;
    restoreHistory();
  }
}

function restoreHistory() {
  const img = new Image();
  img.src = state.history[state.historyStep];
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    saveToLocalStorage();
  };
  updateHistoryButtons();
}

function updateHistoryButtons() {
  btnUndo.disabled = state.historyStep <= 0;
  btnRedo.disabled = state.historyStep >= state.history.length - 1;
}

// --- Persistence ---

function saveToLocalStorage() {
  // Throttle can be added here for performance
  localStorage.setItem("whiteboard_state", canvas.toDataURL());
}

function downloadImage() {
  const link = document.createElement("a");
  link.download = `whiteboard-${Date.now()}.png`;

  // Create a temporary canvas to composite a white background
  // (since eraser makes things transparent)
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;

  // Fill white background
  tempCtx.fillStyle = "#FFFFFF";
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  // Draw drawing
  tempCtx.drawImage(canvas, 0, 0);

  link.href = tempCanvas.toDataURL();
  link.click();
}

// --- UI & UX Logic ---

// Custom Cursor
function updateCursorPosition(e) {
  cursor.style.left = `${e.clientX}px`;
  cursor.style.top = `${e.clientY}px`;
}

function updateCursor() {
  cursor.style.width = `${state.size}px`;
  cursor.style.height = `${state.size}px`;
  cursor.style.backgroundColor =
    state.mode === "erase" ? "#ffffff" : state.color;
  cursor.style.borderColor = state.mode === "erase" ? "#000" : state.color;

  // Invert color for visibility using mix-blend-mode in CSS,
  // but here we set border to match logic.
}

// Toggle Draw/Erase
function setMode(mode) {
  state.mode = mode;
  btnDraw.classList.toggle("active", mode === "draw");
  btnErase.classList.toggle("active", mode === "erase");
  updateCursor();
}

// --- Event Listeners ---

// 1. Pointer Events (Unified Mouse/Touch)
canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointerout", () => {
  state.isDrawing = false;
  ctx.beginPath();
});

// 2. Toolbar Events
colorPicker.addEventListener("input", (e) => {
  state.color = e.target.value;
  if (state.mode === "erase") setMode("draw"); // Switch back to draw if picking color
  updateCursor();
});

brushSizeInput.addEventListener("input", (e) => {
  state.size = e.target.value;
  sizeDisplay.textContent = state.size;
  updateCursor();
});

btnDraw.addEventListener("click", () => setMode("draw"));
btnErase.addEventListener("click", () => setMode("erase"));

btnUndo.addEventListener("click", undo);
btnRedo.addEventListener("click", redo);
btnSave.addEventListener("click", downloadImage);

// 3. Modal Logic (Clear Board)
btnClear.addEventListener("click", () => modal.showModal());
btnModalCancel.addEventListener("click", () => modal.close());
btnModalConfirm.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  saveHistory();
  saveToLocalStorage();
  modal.close();
});

// 4. Keyboard Shortcuts
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    e.preventDefault();
    undo();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "y") {
    e.preventDefault();
    redo();
  }
  if (e.key === "e") setMode("erase");
  if (e.key === "d") setMode("draw");
});

// 5. Mobile Menu
toggleMenu.addEventListener("click", () => {
  toolbar.classList.toggle("open");
});

// Run Init
init();

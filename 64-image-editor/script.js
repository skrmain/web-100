/* --- State Management --- */
const state = {
  originalImage: null, // The loaded Image object (Source of Truth)
  currentImage: null, // The currently modified Image object (after crops)
  rotation: 0, // Current rotation in degrees (0, 90, 180, 270)
  scale: 1, // Canvas display scale factor
  crop: {
    // Crop box coordinates relative to the IMAGE
    active: false,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  },
  dragging: null, // 'move', 'nw', 'ne', 'sw', 'se' or null
  dragStart: { x: 0, y: 0 },
};

/* --- DOM Elements --- */
const elements = {
  canvas: document.getElementById("editor-canvas"),
  ctx: document.getElementById("editor-canvas").getContext("2d"),
  container: document.getElementById("canvas-container"),
  cropOverlay: document.getElementById("crop-overlay"),
  cropArea: document.querySelector(".crop-area"),
  fileInput: document.getElementById("file-input"),
  emptyState: document.getElementById("empty-state"),
  btns: {
    upload: document.getElementById("btn-upload"),
    rotateLeft: document.getElementById("btn-rotate-left"),
    rotateRight: document.getElementById("btn-rotate-right"),
    cropMode: document.getElementById("btn-crop-mode"),
    applyCrop: document.getElementById("btn-apply-crop"),
    reset: document.getElementById("btn-reset"),
    download: document.getElementById("btn-download"),
  },
};

/* --- Initialization --- */
function init() {
  elements.btns.upload.addEventListener("click", () =>
    elements.fileInput.click(),
  );
  elements.fileInput.addEventListener("change", handleUpload);

  elements.btns.rotateLeft.addEventListener("click", () => rotateImage(-90));
  elements.btns.rotateRight.addEventListener("click", () => rotateImage(90));

  elements.btns.cropMode.addEventListener("click", toggleCropMode);
  elements.btns.applyCrop.addEventListener("click", applyCrop);
  elements.btns.reset.addEventListener("click", resetEditor);
  elements.btns.download.addEventListener("click", exportImage);

  // Crop Interaction Listeners
  elements.cropOverlay.addEventListener("mousedown", startDrag);
  window.addEventListener("mousemove", onDrag);
  window.addEventListener("mouseup", endDrag);

  // Handle Window Resize
  window.addEventListener("resize", () => {
    if (state.currentImage) renderCanvas();
  });
}

/* --- Core Functions --- */

// 1. Load Image
function handleUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      state.originalImage = img;
      state.currentImage = img;
      state.rotation = 0;
      state.crop.active = false;

      elements.emptyState.style.display = "none";
      enableControls(true);
      renderCanvas();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
  // Reset input so same file can be selected again
  e.target.value = "";
}

// 2. Render Canvas & Overlay
function renderCanvas() {
  if (!state.currentImage) return;

  const { canvas, ctx, container } = elements;
  const { currentImage: img, rotation } = state;

  // 1. Calculate Canvas Dimensions based on Rotation
  // If rotated 90 or 270, width/height swap
  const isVertical = rotation % 180 !== 0;
  const canvasWidth = isVertical ? img.height : img.width;
  const canvasHeight = isVertical ? img.width : img.height;

  // 2. Calculate Scale to fit in viewport (Container)
  // Container has a max size via CSS, but we need exact pixels for logic
  const maxWidth = container.parentElement.clientWidth - 40; // padding
  const maxHeight = container.parentElement.clientHeight - 40;

  state.scale = Math.min(maxWidth / canvasWidth, maxHeight / canvasHeight);

  // Set actual canvas size (Visual size via CSS, Buffer size via attributes)
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Set visual size
  canvas.style.width = `${canvasWidth * state.scale}px`;
  canvas.style.height = `${canvasHeight * state.scale}px`;
  container.style.width = `${canvasWidth * state.scale}px`;
  container.style.height = `${canvasHeight * state.scale}px`;

  // 3. Draw Image with Rotation
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Move to center
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);

  // Draw centered (using original image dims)
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();

  // 4. Update Crop UI if active
  if (state.crop.active) {
    renderCropOverlay();
  }
}

// 3. Rotation Logic
function rotateImage(deg) {
  state.rotation = (state.rotation + deg) % 360;
  if (state.rotation < 0) state.rotation += 360;

  // Reset crop on rotate to simplify UX (Hard to track crop box across 90deg flips)
  if (state.crop.active) {
    initCropState(); // Re-center crop box
  }

  renderCanvas();
}

/* --- Crop Logic --- */

function toggleCropMode() {
  state.crop.active = !state.crop.active;
  elements.cropOverlay.classList.toggle("hidden", !state.crop.active);
  elements.btns.applyCrop.disabled = !state.crop.active;

  if (state.crop.active) {
    initCropState();
    renderCanvas();
  }
}

function initCropState() {
  const { canvas } = elements;
  // Default crop: 80% of current view center
  const w = canvas.width * 0.8;
  const h = canvas.height * 0.8;
  const x = (canvas.width - w) / 2;
  const y = (canvas.height - h) / 2;

  state.crop.x = x;
  state.crop.y = y;
  state.crop.w = w;
  state.crop.h = h;
}

function renderCropOverlay() {
  const { cropArea } = elements;
  const { x, y, w, h } = state.crop;
  const s = state.scale;

  // Convert Image Coordinates -> Screen Coordinates
  cropArea.style.left = `${x * s}px`;
  cropArea.style.top = `${y * s}px`;
  cropArea.style.width = `${w * s}px`;
  cropArea.style.height = `${h * s}px`;
}

// Apply the Crop
function applyCrop() {
  // 1. Create a temp canvas to render the current visual state
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  // Size it to the CURRENT rotated bounds
  tempCanvas.width = elements.canvas.width;
  tempCanvas.height = elements.canvas.height;

  // Draw the image rotated exactly as seen on screen
  tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
  tempCtx.rotate((state.rotation * Math.PI) / 180);
  tempCtx.drawImage(
    state.currentImage,
    -state.currentImage.width / 2,
    -state.currentImage.height / 2,
  );

  // 2. Extract the cropped region
  const { x, y, w, h } = state.crop;
  const croppedData = tempCtx.getImageData(x, y, w, h);

  // 3. Create new canvas for the result
  const resultCanvas = document.createElement("canvas");
  resultCanvas.width = w;
  resultCanvas.height = h;
  resultCanvas.getContext("2d").putImageData(croppedData, 0, 0);

  // 4. Update State with new Image
  const newImg = new Image();
  newImg.onload = () => {
    state.currentImage = newImg;
    state.rotation = 0; // Reset rotation as it's baked in
    state.crop.active = false;
    elements.cropOverlay.classList.add("hidden");
    elements.btns.applyCrop.disabled = true;
    renderCanvas();
  };
  newImg.src = resultCanvas.toDataURL();
}

/* --- Drag & Resize Interaction --- */

function startDrag(e) {
  if (!state.crop.active) return;

  // Check what we clicked: The box ('move') or a handle ('nw', 'se', etc.)
  if (e.target.classList.contains("handle")) {
    state.dragging = e.target.dataset.handle;
  } else if (e.target.classList.contains("crop-area")) {
    state.dragging = "move";
  } else {
    return;
  }

  state.dragStart = { x: e.clientX, y: e.clientY };
  e.preventDefault();
}

function onDrag(e) {
  if (!state.dragging || !state.crop.active) return;

  const dx = (e.clientX - state.dragStart.x) / state.scale;
  const dy = (e.clientY - state.dragStart.y) / state.scale;

  const c = state.crop;
  const limitW = elements.canvas.width;
  const limitH = elements.canvas.height;

  // Logic for Move vs Resize
  if (state.dragging === "move") {
    // Move, constraining to bounds
    c.x = Math.max(0, Math.min(limitW - c.w, c.x + dx));
    c.y = Math.max(0, Math.min(limitH - c.h, c.y + dy));
  } else {
    // Resize logic (Simplified for readability)
    // Adjust x, y, w, h based on corner
    if (state.dragging.includes("w")) {
      // West (Left)
      const newW = c.w - dx;
      if (newW > 20 && c.x + dx >= 0) {
        c.x += dx;
        c.w -= dx;
      }
    }
    if (state.dragging.includes("n")) {
      // North (Top)
      const newH = c.h - dy;
      if (newH > 20 && c.y + dy >= 0) {
        c.y += dy;
        c.h -= dy;
      }
    }
    if (state.dragging.includes("e")) {
      // East (Right)
      const newW = c.w + dx;
      if (newW > 20 && c.x + newW <= limitW) {
        c.w += dx;
      }
    }
    if (state.dragging.includes("s")) {
      // South (Bottom)
      const newH = c.h + dy;
      if (newH > 20 && c.y + newH <= limitH) {
        c.h += dy;
      }
    }
  }

  state.dragStart = { x: e.clientX, y: e.clientY };
  renderCropOverlay();
}

function endDrag() {
  state.dragging = null;
}

/* --- Export & Utilities --- */

function exportImage() {
  if (!state.currentImage) return;

  // Create a temporary canvas to render the final output (Rotated)
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = state.currentImage;
  const rotation = state.rotation;

  // Handle swap for 90/270
  const isVertical = rotation % 180 !== 0;
  canvas.width = isVertical ? img.height : img.width;
  canvas.height = isVertical ? img.width : img.height;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  // Download
  const link = document.createElement("a");
  link.download = "edited-image.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function resetEditor() {
  if (state.originalImage) {
    state.currentImage = state.originalImage;
    state.rotation = 0;
    state.crop.active = false;
    elements.cropOverlay.classList.add("hidden");
    renderCanvas();
  }
}

function enableControls(enabled) {
  const ids = [
    "btn-rotate-left",
    "btn-rotate-right",
    "btn-crop-mode",
    "btn-reset",
    "btn-download",
  ];
  ids.forEach((id) => (document.getElementById(id).disabled = !enabled));
}

// Start app
init();

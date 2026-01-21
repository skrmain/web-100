/**
 * Configuration & Mock Data
 */
const DATA = {
  tables: [
    {
      id: "users",
      name: "public.users",
      x: 100,
      y: 100,
      columns: [
        { name: "id", type: "uuid" },
        { name: "name", type: "varchar" },
        { name: "email", type: "varchar" },
      ],
    },
    {
      id: "posts",
      name: "public.posts",
      x: 500,
      y: 150,
      columns: [
        { name: "id", type: "uuid" },
        { name: "user_id", type: "uuid" }, // FK
        { name: "title", type: "varchar" },
        { name: "content", type: "text" },
      ],
    },
    {
      id: "comments",
      name: "public.comments",
      x: 500,
      y: 450,
      columns: [
        { name: "id", type: "uuid" },
        { name: "post_id", type: "uuid" }, // FK
        { name: "user_id", type: "uuid" }, // FK
        { name: "text", type: "text" },
      ],
    },
  ],
  relations: [
    // Source: Where the line starts (the Foreign Key)
    // Target: Where the line ends (the Primary Key)
    { fromTable: "posts", fromCol: "user_id", toTable: "users", toCol: "id" },
    {
      fromTable: "comments",
      fromCol: "post_id",
      toTable: "posts",
      toCol: "id",
    },
    {
      fromTable: "comments",
      fromCol: "user_id",
      toTable: "users",
      toCol: "id",
    },
  ],
};

/**
 * DOM Elements
 */
const container = document.getElementById("nodes-layer");
const svgLayer = document.getElementById("svg-layer");

/**
 * Initialization
 */
function init() {
  renderTables();
  renderLines();
}

/**
 * 1. Render Tables (HTML Cards)
 */
function renderTables() {
  DATA.tables.forEach((table) => {
    const card = document.createElement("div");
    card.className = "table-node";
    card.id = `table-${table.id}`;
    // Set initial position
    card.style.transform = `translate(${table.x}px, ${table.y}px)`;
    // Store logical coordinates on the element for easy access
    card.dataset.x = table.x;
    card.dataset.y = table.y;
    card.dataset.id = table.id;

    // Header
    const header = document.createElement("div");
    header.className = "table-header";
    header.innerText = table.name;

    // Header Hover Interaction
    header.addEventListener("mouseenter", () =>
      highlightConnections(table.id, true),
    );
    header.addEventListener("mouseleave", () =>
      highlightConnections(table.id, false),
    );

    // Drag Start
    header.addEventListener("mousedown", handleDragStart);

    // Columns
    const list = document.createElement("ul");
    list.className = "table-rows";

    table.columns.forEach((col) => {
      const li = document.createElement("li");
      li.className = "row";
      // Important: Mark the row specifically for anchor calculation
      li.dataset.col = col.name;
      li.innerHTML = `<span>${col.name}</span><span class="type">${col.type}</span>`;
      list.appendChild(li);
    });

    card.appendChild(header);
    card.appendChild(list);
    container.appendChild(card);
  });
}

/**
 * 2. Render Lines (SVG Paths)
 */
function renderLines() {
  // Clear existing
  svgLayer.innerHTML = "";

  DATA.relations.forEach((rel, index) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.id = `link-${index}`;
    path.dataset.fromTable = rel.fromTable;
    path.dataset.toTable = rel.toTable;

    // Initial Draw
    const d = calculatePath(rel.fromTable, rel.fromCol, rel.toTable, rel.toCol);
    path.setAttribute("d", d);

    svgLayer.appendChild(path);
  });
}

/**
 * Math: Bezier Curve Calculation
 * Creates a smooth 'S' curve between two specific row elements.
 */
function calculatePath(fromTableId, fromColName, toTableId, toColName) {
  // 1. Get DOM elements
  const fromTableEl = document.getElementById(`table-${fromTableId}`);
  const toTableEl = document.getElementById(`table-${toTableId}`);

  // 2. Find specific row elements (for Y-alignment)
  const fromRow = fromTableEl.querySelector(`[data-col="${fromColName}"]`);
  const toRow = toTableEl.querySelector(`[data-col="${toColName}"]`);

  if (!fromRow || !toRow) return "";

  // 3. Get current transforms (X/Y)
  // Note: We use the stored dataset values for performance/cleanliness
  const tx1 = parseFloat(fromTableEl.dataset.x);
  const ty1 = parseFloat(fromTableEl.dataset.y);
  const tx2 = parseFloat(toTableEl.dataset.x);
  const ty2 = parseFloat(toTableEl.dataset.y);

  // 4. Calculate Anchor Points relative to the Canvas
  // Logic:
  // Start X = Table X + Table Width (Right side)
  // Start Y = Table Y + Row Offset Top + (Row Height / 2)

  // We need element dimensions.
  // Optimization: In a huge app, cache these. Here, we read them.
  const fromRect = fromRow.getBoundingClientRect(); // Relative to viewport
  const toRect = toRow.getBoundingClientRect();
  const canvasRect = container.getBoundingClientRect(); // Relative to viewport

  // Calculate offsets relative to the Canvas Container
  const startX = tx1 + fromTableEl.offsetWidth;
  const startY =
    ty1 +
    (fromRect.top - fromTableEl.getBoundingClientRect().top) +
    fromRect.height / 2;

  const endX = tx2;
  const endY =
    ty2 +
    (toRect.top - toTableEl.getBoundingClientRect().top) +
    toRect.height / 2;

  // 5. Control Points for Bezier (The "Curvature")
  // We want the line to come out to the right, and go in from the left.
  const curvature = 0.5;
  const deltaX = Math.abs(endX - startX);

  // If tables are close, reduce curve control point distance
  const controlDist = Math.max(deltaX * curvature, 50);

  const cp1x = startX + controlDist;
  const cp1y = startY;
  const cp2x = endX - controlDist;
  const cp2y = endY;

  return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
}

/**
 * Drag Physics Engine
 */
let draggedElement = null;
let offset = { x: 0, y: 0 };
let activeTableId = null;

function handleDragStart(e) {
  draggedElement = e.target.closest(".table-node");
  activeTableId = draggedElement.dataset.id;

  const startX = parseFloat(draggedElement.dataset.x);
  const startY = parseFloat(draggedElement.dataset.y);

  // Calculate offset from mouse to element top-left
  offset.x = e.clientX - startX;
  offset.y = e.clientY - startY;

  document.addEventListener("mousemove", handleDragMove);
  document.addEventListener("mouseup", handleDragEnd);
}

function handleDragMove(e) {
  if (!draggedElement) return;

  // 1. Calculate new position
  const newX = e.clientX - offset.x;
  const newY = e.clientY - offset.y;

  // 2. Update State
  draggedElement.dataset.x = newX;
  draggedElement.dataset.y = newY;

  // 3. Update Visuals (CSS Transform)
  draggedElement.style.transform = `translate(${newX}px, ${newY}px)`;

  // 4. Update Connected Lines (Optimization: Only update relevant lines)
  updateConnectedLines(activeTableId);
}

function handleDragEnd() {
  draggedElement = null;
  activeTableId = null;
  document.removeEventListener("mousemove", handleDragMove);
  document.removeEventListener("mouseup", handleDragEnd);
}

function updateConnectedLines(tableId) {
  DATA.relations.forEach((rel, index) => {
    if (rel.fromTable === tableId || rel.toTable === tableId) {
      const path = document.getElementById(`link-${index}`);
      if (path) {
        const newD = calculatePath(
          rel.fromTable,
          rel.fromCol,
          rel.toTable,
          rel.toCol,
        );
        path.setAttribute("d", newD);
      }
    }
  });
}

/**
 * Interaction: Hover Highlighting
 */
function highlightConnections(tableId, isHighlighting) {
  DATA.relations.forEach((rel, index) => {
    if (rel.fromTable === tableId || rel.toTable === tableId) {
      const path = document.getElementById(`link-${index}`);
      if (path) {
        if (isHighlighting) {
          path.classList.add("highlight");
        } else {
          path.classList.remove("highlight");
        }
      }
    }
  });
}

// Start
init();

/**
 * SENIOR FRONTEND INTERFACE ENGINEER
 * Project: Kanban Board
 * Constraints: Pure JS, Normalized State, Native DnD
 */

// --- 1. State Management (Normalized) ---

const INITIAL_DATA = {
  tasks: {},
  columns: {
    "col-1": { id: "col-1", title: "To Do", taskIds: [] },
    "col-2": { id: "col-2", title: "In Progress", taskIds: [] },
    "col-3": { id: "col-3", title: "Done", taskIds: [] },
  },
  columnOrder: ["col-1", "col-2", "col-3"],
};

class Store {
  constructor() {
    const saved = localStorage.getItem("kanban-state");
    this.state = saved
      ? JSON.parse(saved)
      : JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  save() {
    localStorage.setItem("kanban-state", JSON.stringify(this.state));
    renderBoard(); // Re-render triggers UI updates
  }

  // --- Actions ---

  addColumn(title) {
    const id = `col-${Date.now()}`;
    this.state.columns[id] = { id, title, taskIds: [] };
    this.state.columnOrder.push(id);
    this.save();
  }

  deleteColumn(colId) {
    const col = this.state.columns[colId];
    // Cleanup tasks
    col.taskIds.forEach((taskId) => delete this.state.tasks[taskId]);
    delete this.state.columns[colId];
    this.state.columnOrder = this.state.columnOrder.filter(
      (id) => id !== colId,
    );
    this.save();
  }

  addTask(colId, content) {
    const taskId = `task-${Date.now()}`;
    this.state.tasks[taskId] = { id: taskId, content, color: "none" };
    this.state.columns[colId].taskIds.push(taskId);
    this.save();
  }

  updateTask(taskId, content, color) {
    const task = this.state.tasks[taskId];
    if (task) {
      task.content = content;
      task.color = color;
      this.save();
    }
  }

  deleteTask(taskId) {
    // Find column containing task
    for (const colId in this.state.columns) {
      const col = this.state.columns[colId];
      const idx = col.taskIds.indexOf(taskId);
      if (idx > -1) {
        col.taskIds.splice(idx, 1);
        break;
      }
    }
    delete this.state.tasks[taskId];
    this.save();
  }

  moveTask(taskId, sourceColId, destColId, newIndex) {
    const sourceCol = this.state.columns[sourceColId];
    const destCol = this.state.columns[destColId];

    // Remove from source
    sourceCol.taskIds = sourceCol.taskIds.filter((id) => id !== taskId);

    // Add to destination at specific index
    destCol.taskIds.splice(newIndex, 0, taskId);

    this.save();
  }
}

const store = new Store();

// --- 2. DOM Selection & Rendering ---

const boardEl = document.getElementById("board");
const modalEl = document.getElementById("card-modal");
const modalTextEl = document.getElementById("modal-text-input");
let currentEditingTaskId = null;
let currentSelectedColor = "none";

function renderBoard() {
  boardEl.innerHTML = ""; // Clear board

  store.state.columnOrder.forEach((colId) => {
    const column = store.state.columns[colId];
    const colEl = document.createElement("div");
    colEl.className = "column";
    colEl.dataset.colId = colId;

    // Column Header
    const header = document.createElement("div");
    header.className = "column-header";
    header.innerHTML = `<span>${column.title}</span> <button class="delete-col-btn" data-col="${colId}">×</button>`;

    // Task List Container
    const taskList = document.createElement("div");
    taskList.className = "task-list";
    taskList.dataset.colId = colId;

    // Render Tasks
    column.taskIds.forEach((taskId) => {
      const task = store.state.tasks[taskId];
      const taskEl = createTaskElement(task);
      taskList.appendChild(taskEl);
    });

    // Add Card Button
    const addBtn = document.createElement("button");
    addBtn.className = "add-card-btn";
    addBtn.textContent = "+ Add a card";
    addBtn.dataset.colId = colId;

    colEl.append(header, taskList, addBtn);
    boardEl.appendChild(colEl);
  });
}

function createTaskElement(task) {
  const el = document.createElement("div");
  el.className = "card";
  el.draggable = true;
  el.dataset.taskId = task.id;
  el.dataset.label = task.color;
  el.innerHTML = `<div class="card-label"></div><div class="card-content">${task.content}</div>`;
  return el;
}

// --- 3. Event Delegation & UI Logic ---

// Click Handling (Add, Edit, Delete)
boardEl.addEventListener("click", (e) => {
  // Add Card
  if (e.target.classList.contains("add-card-btn")) {
    const colId = e.target.dataset.colId;
    const content = prompt("Enter task content:");
    if (content) store.addTask(colId, content);
    return;
  }

  // Delete Column
  if (e.target.classList.contains("delete-col-btn")) {
    if (confirm("Delete this column?")) {
      store.deleteColumn(e.target.dataset.col);
    }
    return;
  }

  // Edit Card (Open Modal)
  const card = e.target.closest(".card");
  if (card) {
    openModal(card.dataset.taskId);
  }
});

document.getElementById("add-column-btn").addEventListener("click", () => {
  const title = prompt("Column Title:");
  if (title) store.addColumn(title);
});

// --- 4. Modal Logic ---

function openModal(taskId) {
  const task = store.state.tasks[taskId];
  if (!task) return;

  currentEditingTaskId = taskId;
  modalTextEl.value = task.content;
  currentSelectedColor = task.color;

  // Setup Color Selection UI
  document.querySelectorAll(".color-option").forEach((opt) => {
    opt.classList.toggle("selected", opt.dataset.color === task.color);
    opt.onclick = () => {
      currentSelectedColor = opt.dataset.color;
      document
        .querySelectorAll(".color-option")
        .forEach((o) => o.classList.remove("selected"));
      opt.classList.add("selected");
    };
  });

  modalEl.classList.add("active");
}

document.getElementById("save-card-btn").addEventListener("click", () => {
  if (currentEditingTaskId) {
    store.updateTask(
      currentEditingTaskId,
      modalTextEl.value,
      currentSelectedColor,
    );
    closeModal();
  }
});

document.getElementById("delete-card-btn").addEventListener("click", () => {
  if (currentEditingTaskId && confirm("Delete this card?")) {
    store.deleteTask(currentEditingTaskId);
    closeModal();
  }
});

document.querySelector(".close-modal").addEventListener("click", closeModal);
function closeModal() {
  modalEl.classList.remove("active");
  currentEditingTaskId = null;
}

// --- 5. Advanced Drag & Drop Engine (The "Very Hard" Part) ---

let draggedItem = null;
let sourceColId = null;
let placeholder = document.createElement("div");
placeholder.className = "placeholder";

boardEl.addEventListener("dragstart", (e) => {
  if (!e.target.classList.contains("card")) return;

  draggedItem = e.target;
  sourceColId = draggedItem.closest(".task-list").dataset.colId;

  // Set explicit height on placeholder to prevent UI jumping
  placeholder.style.height = `${draggedItem.offsetHeight}px`;

  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", draggedItem.dataset.taskId);

  // Delay adding class so the drag ghost image is the original card, not the faded one
  requestAnimationFrame(() => draggedItem.classList.add("dragging"));
});

boardEl.addEventListener("dragend", () => {
  if (draggedItem) {
    draggedItem.classList.remove("dragging");
    placeholder.remove();
    draggedItem.style.display = "block";
    draggedItem = null;
  }
});

boardEl.addEventListener("dragover", (e) => {
  e.preventDefault(); // Necessary to allow dropping

  const taskList = e.target.closest(".task-list");
  if (!taskList) return;

  // The Magic: Determine where to place the placeholder
  const afterElement = getDragAfterElement(taskList, e.clientY);

  // If we are over the same list and same position, do nothing (optimization)
  // Note: We hide the original dragged item from layout flow during dragover visual
  draggedItem.style.display = "none";

  if (afterElement == null) {
    taskList.appendChild(placeholder);
  } else {
    taskList.insertBefore(placeholder, afterElement);
  }
});

boardEl.addEventListener("drop", (e) => {
  e.preventDefault();
  const taskList = e.target.closest(".task-list");
  if (!taskList || !draggedItem) return;

  const destColId = taskList.dataset.colId;
  const taskId = draggedItem.dataset.taskId;

  // Determine Index based on placeholder position
  // We get all cards in the destination list *after* the DOM has been updated with placeholder
  // But we need to exclude the placeholder itself from the counting to get the pure data index
  const children = Array.from(taskList.children);
  const newIndex = children.indexOf(placeholder);

  // Update State
  store.moveTask(taskId, sourceColId, destColId, newIndex);
});

// --- Mathematical Sorting Logic ---
// Calculates the element immediately after the mouse cursor
function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".card:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      // Calculate offset from the center of the box to the mouse cursor
      const offset = y - box.top - box.height / 2;

      // We want the element where the mouse is ABOVE the center (negative offset)
      // But closest to 0 (highest negative number)
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY },
  ).element;
}

// Initial Render
renderBoard();

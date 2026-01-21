/**
 * SENIOR FRONTEND ARCHITECT - Pure JS Implementation
 * Concepts: Unidirectional Data Flow, Pub/Sub via BroadcastChannel, Native Drag-and-Drop
 */

// --- CONFIGURATION ---
const CONSTANTS = {
  STORAGE_KEY: "glass_todo_state",
  CHANNEL: "sync_channel_v1",
};

// --- STATE MANAGEMENT (The "Brain") ---
class TodoState {
  constructor() {
    this.todos = this._load();
    this.filter = "all"; // 'all', 'active', 'completed'
    this.subscribers = [];

    // 1. Broadcast Channel API Implementation
    this.channel = new BroadcastChannel(CONSTANTS.CHANNEL);

    // Listen for messages from other tabs
    this.channel.onmessage = (event) => {
      if (event.data && event.data.type === "SYNC") {
        console.log("Received sync from another tab");
        this.todos = event.data.payload;
        this._notify(false); // Update UI, but do NOT broadcast back to avoid loops
      }
    };
  }

  // Persist to LocalStorage
  _save() {
    localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(this.todos));
  }

  _load() {
    const data = localStorage.getItem(CONSTANTS.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Observer Pattern: Notify UI
  subscribe(callback) {
    this.subscribers.push(callback);
  }

  _notify(shouldBroadcast = true) {
    this._save();
    this.subscribers.forEach((cb) => cb(this.todos, this.filter));

    if (shouldBroadcast) {
      this.channel.postMessage({ type: "SYNC", payload: this.todos });
    }
  }

  // --- ACTIONS ---

  add(text) {
    const task = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      text: text,
      completed: false,
      createdAt: Date.now(),
    };
    this.todos.unshift(task);
    this._notify();
  }

  toggle(id) {
    this.todos = this.todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t,
    );
    this._notify();
  }

  updateText(id, newText) {
    this.todos = this.todos.map((t) =>
      t.id === id ? { ...t, text: newText } : t,
    );
    this._notify();
  }

  delete(id) {
    this.todos = this.todos.filter((t) => t.id !== id);
    this._notify();
  }

  setFilter(newFilter) {
    this.filter = newFilter;
    this._notify(false); // Filter change is local UI state only
  }

  reorder(srcId, targetId, targetListStatus) {
    const srcIndex = this.todos.findIndex((t) => t.id === srcId);
    if (srcIndex === -1) return;

    // Remove item from old position
    const [item] = this.todos.splice(srcIndex, 1);

    // Update completion status based on where it was dropped
    if (targetListStatus === "completed") item.completed = true;
    if (targetListStatus === "active") item.completed = false;

    // If targetId is null, it was dropped at the end of a list
    if (!targetId) {
      this.todos.push(item);
    } else {
      // Find index of target to insert before
      const targetIndex = this.todos.findIndex((t) => t.id === targetId);
      // If targetIndex is -1 (not found), push to end
      if (targetIndex === -1) this.todos.push(item);
      else this.todos.splice(targetIndex, 0, item);
    }

    this._notify();
  }
}

// --- INITIALIZATION ---
const state = new TodoState();

// --- DOM ELEMENTS ---
const els = {
  input: document.getElementById("taskInput"),
  addBtn: document.getElementById("addBtn"),
  todoList: document.getElementById("todoList"),
  doneList: document.getElementById("doneList"),
  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  filters: document.querySelectorAll(".filter-btn"),
};

// --- RENDER ENGINE ---
const render = (todos, filter) => {
  // 1. Update Progress Bar
  const total = todos.length;
  const done = todos.filter((t) => t.completed).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  els.progressBar.style.width = `${percent}%`;
  els.progressText.textContent = `${percent}% Done`;

  // 2. Filter Todos
  const visibleTodos = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  // 3. Render Lists (Simple Diffing: Clear & Rebuild)
  els.todoList.innerHTML = "";
  els.doneList.innerHTML = "";

  visibleTodos.forEach((task) => {
    const node = createNode(task);
    if (task.completed) els.doneList.appendChild(node);
    else els.todoList.appendChild(node);
  });
};

// Component Factory
const createNode = (task) => {
  const li = document.createElement("li");
  li.className = `task-item ${task.completed ? "completed" : ""}`;
  li.setAttribute("draggable", "true");
  li.dataset.id = task.id;

  // Structure
  li.innerHTML = `
        <div class="checkbox"></div>
        <span class="task-text" contenteditable="true">${task.text}</span>
        <button class="delete-btn">✕</button>
    `;

  // Event Handlers
  const checkbox = li.querySelector(".checkbox");
  checkbox.onclick = () => state.toggle(task.id);

  const deleteBtn = li.querySelector(".delete-btn");
  deleteBtn.onclick = () => {
    li.classList.add("fade-out");
    li.addEventListener("animationend", () => state.delete(task.id));
  };

  const textSpan = li.querySelector(".task-text");
  textSpan.onblur = () => {
    const val = textSpan.innerText.trim();
    if (val) state.updateText(task.id, val);
    else textSpan.innerText = task.text; // Revert if empty
  };
  textSpan.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      textSpan.blur();
    }
  };

  // Attach Drag Events
  addDragHandlers(li);

  return li;
};

// --- DRAG AND DROP LOGIC (Native API) ---
let draggedId = null;

function addDragHandlers(el) {
  el.addEventListener("dragstart", (e) => {
    draggedId = el.dataset.id;
    el.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });

  el.addEventListener("dragend", () => {
    el.classList.remove("dragging");
    draggedId = null;
    document
      .querySelectorAll(".task-list")
      .forEach((l) => (l.style.background = ""));
  });
}

// Container Handlers
[els.todoList, els.doneList].forEach((list) => {
  list.addEventListener("dragover", (e) => {
    e.preventDefault(); // Allow drop
    const afterElement = getDragAfterElement(list, e.clientY);
    // Visual feedback could happen here
  });

  list.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!draggedId) return;

    const listStatus = list.dataset.status; // 'active' or 'completed'
    const afterElement = getDragAfterElement(list, e.clientY);
    const targetId = afterElement ? afterElement.dataset.id : null;

    state.reorder(draggedId, targetId, listStatus);
  });
});

// Helper: Calculate position relative to other items
function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".task-item:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2; // Distance from vertical center

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY },
  ).element;
}

// --- EVENT LISTENERS ---

// Add Task
els.addBtn.onclick = () => {
  const val = els.input.value.trim();
  if (val) {
    state.add(val);
    els.input.value = "";
  }
};

els.input.onkeypress = (e) => {
  if (e.key === "Enter") els.addBtn.click();
};

// Filters
els.filters.forEach((btn) => {
  btn.onclick = () => {
    els.filters.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.setFilter(btn.dataset.filter);
  };
});

// --- START ---
state.subscribe(render);
render(state.todos, state.filter);

// script.js

// --- 1. State Management ---

// Default data if nothing is in LocalStorage
const defaultBoardState = {
  todo: [
    { id: "t1", content: "Design System" },
    { id: "t2", content: "Setup Repo" },
  ],
  "in-progress": [{ id: "t3", content: "Build HTML Structure" }],
  done: [],
};

// Load state from LocalStorage or use default
let boardState =
  JSON.parse(localStorage.getItem("kanbanBoard")) || defaultBoardState;

// Save state to LocalStorage
function saveState() {
  localStorage.setItem("kanbanBoard", JSON.stringify(boardState));
}

// --- 2. Rendering Logic ---

const columns = document.querySelectorAll(".task-container");

function renderBoard() {
  // Loop through each column key in state
  Object.keys(boardState).forEach((status) => {
    const columnEl = document.getElementById(status);
    columnEl.innerHTML = ""; // Clear current HTML

    // Update count in header
    document.getElementById(`${status}-count`).innerText =
      boardState[status].length;

    // Create cards
    boardState[status].forEach((task) => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.setAttribute("draggable", "true"); // Enable HTML5 Drag API
      card.setAttribute("id", task.id);

      // Allow editing content directly
      card.innerHTML = `
                <p contenteditable="true" onblur="updateTaskContent('${status}', '${task.id}', this.innerText)">${task.content}</p>
                <button class="delete-btn" onclick="deleteTask('${status}', '${task.id}')">&times;</button>
            `;

      // Attach drag events to the new card
      attachDragEvents(card);

      columnEl.appendChild(card);
    });
  });
}

// --- 3. Drag & Drop Logic (The Core) ---

function attachDragEvents(card) {
  card.addEventListener("dragstart", () => {
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    updateStateFromDOM(); // Sync state after drop
  });
}

// Add event listeners to columns (Drop Zones)
columns.forEach((column) => {
  column.addEventListener("dragover", (e) => {
    e.preventDefault(); // Necessary to allow dropping

    const afterElement = getDragAfterElement(column, e.clientY);
    const draggable = document.querySelector(".dragging");

    if (afterElement == null) {
      column.appendChild(draggable); // Drop at the end
    } else {
      column.insertBefore(draggable, afterElement); // Drop before specific element
    }
  });
});

/**
 * HARD DIFFICULTY LOGIC:
 * Calculates which element the mouse is hovering over to determine sort order.
 * It checks the Y position of the cursor relative to the center of other cards.
 */
function getDragAfterElement(container, y) {
  // Get all cards in this column EXCEPT the one we are dragging
  const draggableElements = [
    ...container.querySelectorAll(".card:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2; // Distance from center of box

      // We want the element where our mouse is strictly ABOVE the center (negative offset)
      // AND the offset is the largest (closest to 0) among negative offsets
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY },
  ).element;
}

// --- 4. State Updates (CRUD) ---

// Re-reads the DOM to update the JS State Object (Run after every drag drop)
function updateStateFromDOM() {
  const newBoardState = { todo: [], "in-progress": [], done: [] };

  // Loop through DOM columns
  Object.keys(newBoardState).forEach((key) => {
    const columnEl = document.getElementById(key);
    const cards = columnEl.querySelectorAll(".card");

    cards.forEach((card) => {
      newBoardState[key].push({
        id: card.id,
        content: card.querySelector("p").innerText,
      });
    });
  });

  boardState = newBoardState;
  saveState();
  // Update counts
  Object.keys(boardState).forEach((status) => {
    document.getElementById(`${status}-count`).innerText =
      boardState[status].length;
  });
}

// Add New Task
window.openAddModal = (status) => {
  const text = prompt("Enter task details:"); // Simple prompt for MVP
  if (text) {
    const newTask = {
      id: "task-" + Date.now(),
      content: text,
    };
    boardState[status].push(newTask);
    saveState();
    renderBoard();
  }
};

// Update Task Text (on blur)
window.updateTaskContent = (status, id, newText) => {
  const taskIndex = boardState[status].findIndex((t) => t.id === id);
  if (taskIndex > -1) {
    boardState[status][taskIndex].content = newText;
    saveState();
  }
};

// Delete Task
window.deleteTask = (status, id) => {
  if (confirm("Delete this task?")) {
    boardState[status] = boardState[status].filter((t) => t.id !== id);
    saveState();
    renderBoard();
  }
};

// --- 5. Initialization ---
renderBoard();

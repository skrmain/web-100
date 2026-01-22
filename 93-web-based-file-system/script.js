/* --- STATE MANAGEMENT --- */

// 1. The Virtual File System (Recursive Structure)
const fileSystem = {
  name: "root",
  type: "folder",
  children: [
    {
      name: "Documents",
      type: "folder",
      modified: "2023-10-25",
      children: [
        {
          name: "Resume.txt",
          type: "file",
          modified: "2023-10-26",
          content: "Senior Frontend Engineer\nExperience: 8 Years...",
        },
        {
          name: "Budget.txt",
          type: "file",
          modified: "2023-10-24",
          content: "Rent: $2000\nFood: $500",
        },
      ],
    },
    {
      name: "Images",
      type: "folder",
      modified: "2023-10-20",
      children: [],
    },
    {
      name: "todo.txt",
      type: "file",
      modified: "2023-10-27",
      content: "1. Build VFS\n2. Style it.",
    },
  ],
};

// 2. App State
let currentPath = ["root"]; // Breadcrumb stack
let viewMode = "grid"; // 'grid' or 'list'
let selectedItem = null; // Name of selected item
let contextTarget = null; // Name of item right-clicked

/* --- VFS CORE HELPERS --- */

// Traverses the fileSystem object based on currentPath array
function getCurrentFolder() {
  let node = fileSystem;
  // We skip index 0 because it's 'root', and our 'node' starts at root
  for (let i = 1; i < currentPath.length; i++) {
    node = node.children.find((child) => child.name === currentPath[i]);
  }
  return node;
}

function findItemInCurrentFolder(name) {
  const folder = getCurrentFolder();
  return folder.children.find((child) => child.name === name);
}

/* --- RENDERING --- */

const viewport = document.getElementById("viewport");
const breadcrumbsEl = document.getElementById("breadcrumbs");

function render() {
  const folder = getCurrentFolder();

  // 1. Render Breadcrumbs
  breadcrumbsEl.innerHTML = "";
  currentPath.forEach((step, index) => {
    const span = document.createElement("span");
    span.className = "breadcrumb-item";
    span.textContent = step;
    span.onclick = () => navigateToPathIndex(index);

    breadcrumbsEl.appendChild(span);
    if (index < currentPath.length - 1) {
      const sep = document.createElement("span");
      sep.className = "breadcrumb-separator";
      sep.textContent = " / ";
      breadcrumbsEl.appendChild(sep);
    }
  });

  // 2. Render Viewport
  viewport.innerHTML = "";
  viewport.className = `viewport ${viewMode}-view`;

  if (folder.children.length === 0) {
    viewport.innerHTML =
      '<div style="color:#aaa; text-align:center; width:100%; margin-top:50px;">Folder is empty</div>';
    return;
  }

  folder.children.forEach((item) => {
    const el = document.createElement("div");
    el.className = "file-item";
    if (selectedItem === item.name) el.classList.add("selected");
    el.dataset.name = item.name;
    el.dataset.type = item.type;

    const icon = item.type === "folder" ? "📁" : "📄";

    // Structure depends on CSS grid/flex, but DOM order is same
    el.innerHTML = `
            <div class="icon">${icon}</div>
            <div class="name">${item.name}</div>
            <div class="meta">${item.type}</div>
            <div class="meta">${item.modified || "-"}</div>
        `;

    // Event: Select on click
    el.onclick = (e) => {
      e.stopPropagation();
      selectItem(item.name);
    };

    // Event: Double click to open
    el.ondblclick = (e) => {
      e.stopPropagation();
      openItem(item);
    };

    viewport.appendChild(el);
  });
}

/* --- ACTIONS & NAVIGATION --- */

function selectItem(name) {
  selectedItem = name;
  render();
}

function navigateToPathIndex(index) {
  // Slice path back to index
  currentPath = currentPath.slice(0, index + 1);
  selectedItem = null;
  render();
}

function openItem(item) {
  if (item.type === "folder") {
    currentPath.push(item.name);
    selectedItem = null;
    render();
  } else {
    openFileModal(item);
  }
}

function createItem(type) {
  const folder = getCurrentFolder();
  const baseName = type === "folder" ? "New Folder" : "New File.txt";
  let name = baseName;
  let counter = 1;

  // Handle duplicates
  while (folder.children.find((c) => c.name === name)) {
    name = `${baseName} (${counter++})`;
  }

  const newItem = {
    name: name,
    type: type,
    modified: new Date().toISOString().split("T")[0],
    children: type === "folder" ? [] : undefined,
    content: type === "file" ? "" : undefined,
  };

  folder.children.push(newItem);
  render();
}

function deleteItem(name) {
  const folder = getCurrentFolder();
  folder.children = folder.children.filter((child) => child.name !== name);
  selectedItem = null;
  render();
}

function renameItem(oldName) {
  const folder = getCurrentFolder();
  const item = folder.children.find((c) => c.name === oldName);
  if (!item) return;

  const newName = prompt(`Rename ${oldName} to:`, oldName);
  if (newName && newName !== oldName) {
    // Simple check for duplicates
    if (folder.children.find((c) => c.name === newName)) {
      alert("A file with that name already exists.");
      return;
    }
    item.name = newName;
    render();
  }
}

/* --- CONTEXT MENU LOGIC --- */

const ctxMenu = document.getElementById("context-menu");

// Hide menu on global click
document.addEventListener("click", () => {
  ctxMenu.classList.add("hidden");
});

// Override Right Click
viewport.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  // Determine what was clicked
  const fileItem = e.target.closest(".file-item");

  if (fileItem) {
    // Clicked on a file/folder
    contextTarget = fileItem.dataset.name;
    selectItem(contextTarget); // Auto-select on right click

    // Show file-specific options
    document.getElementById("ctx-open").style.display = "block";
    document.getElementById("ctx-rename").style.display = "block";
    document.getElementById("ctx-delete").style.display = "block";
  } else {
    // Clicked on empty white space
    contextTarget = null;
    selectedItem = null;
    render(); // clear selection

    // Show generic options (e.g. only New Folder - streamlined for demo)
    // For this demo, we'll hide specific file ops
    document.getElementById("ctx-open").style.display = "none";
    document.getElementById("ctx-rename").style.display = "none";
    document.getElementById("ctx-delete").style.display = "none";
  }

  // Position Menu
  const { clientX: mouseX, clientY: mouseY } = e;
  ctxMenu.style.top = `${mouseY}px`;
  ctxMenu.style.left = `${mouseX}px`;
  ctxMenu.classList.remove("hidden");
});

// Context Menu Actions
document.getElementById("ctx-open").onclick = () => {
  if (contextTarget) openItem(findItemInCurrentFolder(contextTarget));
};
document.getElementById("ctx-delete").onclick = () => {
  if (contextTarget) deleteItem(contextTarget);
};
document.getElementById("ctx-rename").onclick = () => {
  if (contextTarget) renameItem(contextTarget);
};

/* --- UI EVENT LISTENERS --- */

// Toolbar Buttons
document.getElementById("btn-new-folder").onclick = () => createItem("folder");
document.getElementById("btn-new-file").onclick = () => createItem("file");

// View Toggles
document.getElementById("btn-grid").onclick = function () {
  viewMode = "grid";
  this.classList.add("active");
  document.getElementById("btn-list").classList.remove("active");
  render();
};
document.getElementById("btn-list").onclick = function () {
  viewMode = "list";
  this.classList.add("active");
  document.getElementById("btn-grid").classList.remove("active");
  render();
};

// Modal Logic
const modal = document.getElementById("file-modal");
const modalClose = document.getElementById("modal-close");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");

function openFileModal(file) {
  modalTitle.textContent = file.name;
  modalBody.value = file.content || "";
  modal.classList.remove("hidden");
}

modalClose.onclick = () => modal.classList.add("hidden");
// Close modal on click outside
modal.onclick = (e) => {
  if (e.target === modal) modal.classList.add("hidden");
};

// Deselect on empty space click
viewport.onclick = (e) => {
  if (e.target === viewport) {
    selectedItem = null;
    render();
  }
};

/* --- INIT --- */
render();

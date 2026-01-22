/**
 * SENIOR ARCHITECT IMPLEMENTATION
 * Core Focus: Promisified IndexedDB, Sync Queue, Offline Detection
 */

// --- 1. PROMISIFIED INDEXEDDB WRAPPER ---
class StorageLayer {
  constructor(dbName, storeName, version = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
    this.db = null;
  }

  // Opens the database connection
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          // Create object store with 'id' as keyPath (auto-increment)
          // We also create an index on 'date' for sorting
          const store = db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("date", "date", { unique: false });
          store.createIndex("synced", "synced", { unique: false });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this);
      };

      request.onerror = (e) => reject(`IDB Error: ${e.target.error}`);
    });
  }

  // Generic Transaction Helper
  _tx(type) {
    return this.db
      .transaction([this.storeName], type)
      .objectStore(this.storeName);
  }

  // Generic Add
  async add(data) {
    return new Promise((resolve, reject) => {
      const request = this._tx("readwrite").add(data);
      request.onsuccess = () => resolve(request.result); // Returns the new ID
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Get All
  async getAll() {
    return new Promise((resolve, reject) => {
      // Get all and sort by date using the index
      const request = this._tx("readonly")
        .index("date")
        .openCursor(null, "prev");
      const results = [];
      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Update (Put)
  async put(data) {
    return new Promise((resolve, reject) => {
      const request = this._tx("readwrite").put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Delete
  async delete(id) {
    return new Promise((resolve, reject) => {
      const request = this._tx("readwrite").delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get specific notes awaiting sync
  async getUnsynced() {
    return new Promise((resolve, reject) => {
      const request = this._tx("readonly")
        .index("synced")
        .getAll(IDBKeyRange.only(false));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// --- 2. APPLICATION LOGIC ---

const DB_NAME = "OfflineNotesDB";
const STORE_NAME = "notes";
const db = new StorageLayer(DB_NAME, STORE_NAME);

// DOM Elements
const titleInput = document.getElementById("note-title");
const bodyInput = document.getElementById("note-body");
const saveBtn = document.getElementById("save-btn");
const notesList = document.getElementById("notes-list");
const statusBar = document.getElementById("status-bar");
const quotaText = document.getElementById("quota-text");
const quotaBar = document.getElementById("quota-bar");

// --- 3. UI HELPERS ---

function showStatus(message, type) {
  statusBar.textContent = message;
  statusBar.className = `status-bar visible ${type}`;

  // Auto-hide after 3s if it's the "Online" success message
  if (type === "online") {
    setTimeout(() => {
      statusBar.classList.remove("visible");
    }, 3000);
  }
}

function updateVisualState(isOnline) {
  if (isOnline) {
    document.body.classList.remove("offline-mode");
    showStatus("Back online. Syncing...", "online");
  } else {
    document.body.classList.add("offline-mode");
    showStatus("You are offline. Changes will save locally.", "offline");
  }
}

async function updateQuota() {
  if (navigator.storage && navigator.storage.estimate) {
    const { usage, quota } = await navigator.storage.estimate();
    // Convert to KB/MB for display
    const usageKB = (usage / 1024).toFixed(1);
    const percent = Math.min((usage / quota) * 100, 100).toFixed(4); // IDB is small, so percent will be tiny

    // For visual demo purposes, we might show a minimum width if it's too small
    quotaText.textContent = `${usageKB} KB used`;
    quotaBar.style.width = `${Math.max(percent, 1)}%`;
  }
}

// --- 4. RENDERER ---

function renderNoteCard(note) {
  const div = document.createElement("div");
  div.className = "note-card";

  const syncIcon = note.synced
    ? '<span class="sync-icon synced" title="Synced to Cloud">✓ Cloud</span>'
    : '<span class="sync-icon pending" title="Waiting for Network">CLOCK (Local)</span>';

  div.innerHTML = `
        <div class="note-title">${escapeHtml(note.title)}</div>
        <div class="note-body">${escapeHtml(note.body)}</div>
        <div class="note-footer">
            ${syncIcon}
            <span class="delete-btn" data-id="${note.id}">DELETE</span>
        </div>
    `;
  return div;
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function refreshUI() {
  notesList.innerHTML = "";
  const notes = await db.getAll();
  notes.forEach((note) => {
    notesList.appendChild(renderNoteCard(note));
  });
  updateQuota();
}

// --- 5. SYNC ENGINE (The "Hard" Part) ---

/**
 * Simulates a server API call.
 * Takes 1 second. Returns true.
 */
function mockServerApi(note) {
  return new Promise((resolve) => {
    console.log(`[Server] Uploading note: ${note.title}...`);
    setTimeout(() => {
      console.log(`[Server] Upload success.`);
      resolve(true);
    }, 1000); // 1-second delay per item as requested
  });
}

/**
 * The Sync Queue Processor
 * 1. Fetches all notes where synced == false
 * 2. Iterates and calls mock API
 * 3. Updates IDB record to synced == true
 * 4. Refreshes UI
 */
async function processSyncQueue() {
  if (!navigator.onLine) return;

  const unsyncedNotes = await db.getUnsynced();

  if (unsyncedNotes.length === 0) return;

  console.log(`[Sync] Found ${unsyncedNotes.length} items to sync.`);
  showStatus(`Syncing ${unsyncedNotes.length} items...`, "online");

  // Process sequentially (could be Promise.all, but usually sync queues are serial for safety)
  for (const note of unsyncedNotes) {
    await mockServerApi(note); // Wait 1s

    // Update local DB
    note.synced = true;
    await db.put(note);

    // Refresh UI to show the green checkmark immediately for this item
    await refreshUI();
  }

  showStatus("All data synced.", "online");
}

// --- 6. EVENT LISTENERS & INIT ---

// Network State Listeners
window.addEventListener("online", () => {
  updateVisualState(true);
  processSyncQueue();
});

window.addEventListener("offline", () => {
  updateVisualState(false);
});

// Save Note Logic
saveBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title && !body) return;

  const isOnline = navigator.onLine;

  const newNote = {
    title,
    body,
    date: new Date().toISOString(),
    synced: isOnline, // If online, we assume immediate sync success for this demo
  };

  try {
    await db.add(newNote);

    // If we claimed it was synced (online), we skip queue.
    // If offline, it's saved as synced:false and will be picked up later.
    if (isOnline) {
      // Simulate the delay for the current action if online to feel "real"
      // Or strictly following the requirement: "When the network returns... process them"
      // For immediate saves while online, we can assume "Optimistic UI"
    }

    titleInput.value = "";
    bodyInput.value = "";
    await refreshUI();
  } catch (err) {
    console.error("Save failed", err);
    alert("Failed to save note.");
  }
});

// Delete Note Logic (Delegation)
notesList.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const id = parseInt(e.target.dataset.id, 10);
    await db.delete(id);
    await refreshUI();
  }
});

// Initialization
(async () => {
  try {
    await db.init();

    // Check initial network state
    if (!navigator.onLine) {
      updateVisualState(false);
    } else {
      // If we load the app and we are online, check for leftovers
      processSyncQueue();
    }

    await refreshUI();
  } catch (err) {
    console.error("App Init Failed:", err);
  }
})();

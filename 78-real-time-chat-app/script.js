/**
 * Serverless Chat Architecture
 * Concepts: Event-Driven, LocalStorage Bus, Append-Only Rendering
 */

// --- 1. CONFIGURATION & STATE ---
const DB_KEY = "chat_history_v1";
const USER_KEY = "chat_user_id";

// State to track render position (Performance Optimization)
let lastRenderedIndex = 0;
let currentUser = null;

// DOM Elements
const chatArea = document.getElementById("chat-area");
const chatForm = document.getElementById("chat-form");
const inputField = document.getElementById("message-input");
const userIdDisplay = document.getElementById("user-id-display");
const clearBtn = document.getElementById("clear-btn");

// --- 2. IDENTITY MANAGEMENT ---
function initIdentity() {
  // SessionStorage allows different IDs per tab
  let id = sessionStorage.getItem(USER_KEY);
  if (!id) {
    id = "User_" + Math.floor(Math.random() * 10000);
    sessionStorage.setItem(USER_KEY, id);
  }
  currentUser = id;
  userIdDisplay.textContent = `(You: ${id})`;
  return id;
}

// --- 3. DATA LAYER (LocalStorage) ---
function getHistory() {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : [];
}

function addToHistory(messageObj) {
  const history = getHistory();
  history.push(messageObj);
  // Write back to LS - This triggers 'storage' event in OTHER tabs
  localStorage.setItem(DB_KEY, JSON.stringify(history));
  return history;
}

function clearHistory() {
  localStorage.removeItem(DB_KEY);
  location.reload();
}

// --- 4. CORE PROTOCOL & RENDERING ---

// Message Protocol Factory
function createMessage(text) {
  return {
    id: Date.now() + Math.random().toString(), // Unique ID
    text: text,
    senderId: currentUser,
    timestamp: Date.now(),
    type: "text",
  };
}

// Efficient DOM Appending
function appendMessageToDOM(msg) {
  const isMe = msg.senderId === currentUser;

  const div = document.createElement("div");
  div.classList.add("message", isMe ? "outgoing" : "incoming");

  // Time formatting
  const date = new Date(msg.timestamp);
  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Sanitization (Prevent XSS by using textContent for body)
  const textNode = document.createElement("div");
  textNode.textContent = msg.text;

  const metaNode = document.createElement("span");
  metaNode.classList.add("meta");
  metaNode.textContent = `${isMe ? "" : msg.senderId + " • "}${timeStr}`;

  div.appendChild(textNode);
  div.appendChild(metaNode);

  chatArea.appendChild(div);

  // Auto-scroll
  scrollToBottom();
}

function scrollToBottom() {
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Synchronization Engine
function syncDOM() {
  const history = getHistory();

  // If local index is behind DB length, we have new messages
  if (history.length > lastRenderedIndex) {
    // Slice only the new messages (Optimization)
    const newMessages = history.slice(lastRenderedIndex);

    newMessages.forEach((msg) => {
      appendMessageToDOM(msg);
    });

    // Update pointer
    lastRenderedIndex = history.length;
  }
  // Handle case where history was cleared externally
  else if (history.length < lastRenderedIndex) {
    chatArea.innerHTML = "";
    lastRenderedIndex = 0;
    syncDOM(); // Re-render from scratch
  }
}

// --- 5. EVENT LISTENERS ---

// A. Listen for inputs (Current Tab)
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = inputField.value.trim();
  if (!text) return;

  // 1. Create Object
  const msg = createMessage(text);

  // 2. Save to DB
  addToHistory(msg);

  // 3. Render immediately (Storage event doesn't fire for self)
  syncDOM();

  // 4. Cleanup
  inputField.value = "";
  inputField.focus();
});

// B. Listen for changes in other tabs (Cross-Tab Communication)
window.addEventListener("storage", (e) => {
  if (e.key === DB_KEY) {
    syncDOM();
  }
});

// C. Utility
clearBtn.addEventListener("click", clearHistory);

// --- 6. INITIALIZATION ---
initIdentity();
syncDOM(); // Load any existing history on startup

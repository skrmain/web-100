/**
 * CONSTANTS & CONFIGURATION
 */
const STORAGE_KEY_MSG = "discord_clone_messages";
const STORAGE_KEY_ROOMS = "discord_clone_rooms";
const STORAGE_KEY_SOCKET = "discord_clone_socket_event"; // Trigger for cross-tab
const SESSION_USER = "discord_clone_username";

/**
 * UTILITIES
 */
const Utils = {
  generateId: () => "_" + Math.random().toString(36).substr(2, 9),

  formatDate: (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);

    if (isToday) return `Today at ${timeStr}`;
    return `${date.toLocaleDateString()} at ${timeStr}`;
  },
};

/**
 * DATA LAYER: LocalStorage Wrapper
 */
const DataStore = {
  getRooms: () => {
    const stored = localStorage.getItem(STORAGE_KEY_ROOMS);
    if (!stored) {
      // Default rooms
      const defaults = [
        { id: "general", name: "general" },
        { id: "random", name: "random" },
        { id: "tech", name: "tech" },
      ];
      localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(stored);
  },

  saveRoom: (room) => {
    const rooms = DataStore.getRooms();
    rooms.push(room);
    localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
    return rooms;
  },

  getMessages: (roomId) => {
    const allMsgs = JSON.parse(localStorage.getItem(STORAGE_KEY_MSG) || "{}");
    return allMsgs[roomId] || [];
  },

  saveMessage: (roomId, messageObj) => {
    const allMsgs = JSON.parse(localStorage.getItem(STORAGE_KEY_MSG) || "{}");
    if (!allMsgs[roomId]) allMsgs[roomId] = [];
    allMsgs[roomId].push(messageObj);
    localStorage.setItem(STORAGE_KEY_MSG, JSON.stringify(allMsgs));
  },

  clearMessages: (roomId) => {
    const allMsgs = JSON.parse(localStorage.getItem(STORAGE_KEY_MSG) || "{}");
    allMsgs[roomId] = [];
    localStorage.setItem(STORAGE_KEY_MSG, JSON.stringify(allMsgs));
  },
};

/**
 * ARCHITECTURE: MockSocket
 * Simulates a WebSocket connection using LocalStorage events for cross-tab communication.
 */
class MockSocket {
  constructor(userId) {
    this.userId = userId;
    this.listeners = {}; // eventName -> [callbacks]

    // Listen for storage events (Cross-tab communication)
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY_SOCKET && e.newValue) {
        const eventData = JSON.parse(e.newValue);
        // Prevent self-triggering if logic requires, though storage event
        // typically doesn't fire on source tab.
        this.trigger(eventData.type, eventData.payload);
      }
    });
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  trigger(event, payload) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(payload));
    }
  }

  emit(event, payload) {
    // 1. Handle logic (Persist to DB)
    if (event === "message") {
      DataStore.saveMessage(payload.roomId, payload);
    } else if (event === "create_room") {
      DataStore.saveRoom(payload);
    } else if (event === "clear_history") {
      DataStore.clearMessages(payload.roomId);
    }

    // 2. Trigger for THIS tab immediately
    this.trigger(event, payload);

    // 3. Trigger for OTHER tabs via Storage Event
    // We set a timestamp to ensure the value changes even if payload is identical
    const socketPacket = {
      type: event,
      payload: payload,
      _ts: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_SOCKET, JSON.stringify(socketPacket));
  }
}

/**
 * CORE APPLICATION LOGIC
 */
class App {
  constructor() {
    // User Setup
    this.username = sessionStorage.getItem(SESSION_USER);
    if (!this.username) {
      this.username =
        prompt("Enter your username:") ||
        `User_${Math.floor(Math.random() * 1000)}`;
      sessionStorage.setItem(SESSION_USER, this.username);
    }

    // State
    this.socket = new MockSocket(this.username);
    this.activeRoom = "general";
    this.unreadCounts = {}; // { roomId: number }

    // DOM Elements
    this.els = {
      channelList: document.getElementById("channels-list"),
      messageStream: document.getElementById("message-stream"),
      input: document.getElementById("message-input"),
      form: document.getElementById("chat-form"),
      roomName: document.getElementById("current-room-name"),
      addBtn: document.getElementById("add-channel-btn"),
    };

    this.init();
  }

  init() {
    // Initial Render
    this.renderSidebar();
    this.loadRoom(this.activeRoom);

    // Socket Listeners
    this.socket.on("message", (msg) => this.handleIncomingMessage(msg));
    this.socket.on("create_room", () => this.renderSidebar());
    this.socket.on("clear_history", (payload) => {
      if (payload.roomId === this.activeRoom) {
        this.loadRoom(this.activeRoom);
      }
    });

    // DOM Listeners
    this.els.form.addEventListener("submit", (e) => this.handleSubmit(e));
    this.els.addBtn.addEventListener("click", () => this.handleCreateRoomCmd());
  }

  /**
   * STATE MANAGEMENT: Room Switching
   */
  loadRoom(roomId) {
    this.activeRoom = roomId;
    this.unreadCounts[roomId] = 0; // Reset unread
    this.updateUnreadBadges();

    // Update Header
    const rooms = DataStore.getRooms();
    const room = rooms.find((r) => r.id === roomId) || { name: roomId };
    this.els.roomName.innerText = `# ${room.name}`;
    this.els.input.placeholder = `Message #${room.name}`;

    // Highlight Sidebar
    document.querySelectorAll(".channel-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.id === roomId);
    });

    // Clear & Lazy Load Messages
    this.els.messageStream.innerHTML = "";
    const messages = DataStore.getMessages(roomId);

    if (messages.length === 0) {
      this.els.messageStream.innerHTML = `<div class="welcome-placeholder">This is the start of #${room.name}.</div>`;
    } else {
      messages.forEach((msg) => this.renderMessageToDOM(msg));
    }

    this.scrollToBottom();
  }

  /**
   * LOGIC: Incoming Message Handler & Unread Counter
   */
  handleIncomingMessage(msg) {
    if (msg.roomId === this.activeRoom) {
      // Render immediately
      this.renderMessageToDOM(msg);
      this.scrollToBottom();
    } else {
      // Increment background counter
      if (!this.unreadCounts[msg.roomId]) this.unreadCounts[msg.roomId] = 0;
      this.unreadCounts[msg.roomId]++;
      this.updateUnreadBadges();
    }
  }

  /**
   * LOGIC: Slash Command Parser
   */
  handleSubmit(e) {
    e.preventDefault();
    const rawText = this.els.input.value.trim();
    if (!rawText) return;

    this.els.input.value = "";

    // Command Parsing
    if (rawText.startsWith("/")) {
      const parts = rawText.split(" ");
      const command = parts[0].toLowerCase();
      const args = parts.slice(1).join(" ");

      switch (command) {
        case "/nick":
          if (args) {
            this.username = args;
            sessionStorage.setItem(SESSION_USER, args);
            this.addSystemMessage(`Username changed to ${args}`);
          }
          return;
        case "/clear":
          this.socket.emit("clear_history", { roomId: this.activeRoom });
          return;
        case "/join":
          if (args) {
            const newId = args.toLowerCase().replace(/\s+/g, "-");
            this.socket.emit("create_room", { id: newId, name: newId });
            // Optionally auto-switch: this.loadRoom(newId);
          }
          return;
        default:
          this.addSystemMessage(`Unknown command: ${command}`);
          return;
      }
    }

    // Standard Message
    const messagePayload = {
      id: Utils.generateId(),
      roomId: this.activeRoom,
      username: this.username,
      text: rawText,
      timestamp: new Date().toISOString(),
      type: "user",
    };

    this.socket.emit("message", messagePayload);
  }

  handleCreateRoomCmd() {
    const name = prompt("Enter new channel name:");
    if (name) {
      const newId = name.toLowerCase().replace(/\s+/g, "-");
      this.socket.emit("create_room", { id: newId, name: name });
    }
  }

  /**
   * UI RENDERING
   */
  renderSidebar() {
    const rooms = DataStore.getRooms();
    this.els.channelList.innerHTML = "";

    rooms.forEach((room) => {
      const div = document.createElement("div");
      div.className = `channel-item ${room.id === this.activeRoom ? "active" : ""}`;
      div.dataset.id = room.id;
      div.innerHTML = `
                <span><span class="hashtag">#</span>${room.name}</span>
                <span class="unread-badge" id="badge-${room.id}">0</span>
            `;
      div.onclick = () => this.loadRoom(room.id);
      this.els.channelList.appendChild(div);
    });

    this.updateUnreadBadges();
  }

  updateUnreadBadges() {
    Object.keys(this.unreadCounts).forEach((roomId) => {
      const count = this.unreadCounts[roomId];
      const badge = document.getElementById(`badge-${roomId}`);
      if (badge) {
        badge.innerText = count;
        if (count > 0) badge.classList.add("visible");
        else badge.classList.remove("visible");
      }
    });
  }

  renderMessageToDOM(msg) {
    const div = document.createElement("div");
    div.className = `message ${msg.type === "system" ? "system-msg" : ""}`;

    const dateStr = Utils.formatDate(msg.timestamp);

    div.innerHTML = `
            <div class="msg-header">
                <span class="username">${msg.username}</span>
                <span class="timestamp">${dateStr}</span>
            </div>
            <div class="msg-content">${this.escapeHtml(msg.text)}</div>
        `;
    this.els.messageStream.appendChild(div);
  }

  addSystemMessage(text) {
    const msg = {
      username: "System",
      text: text,
      timestamp: new Date().toISOString(),
      type: "system",
    };
    this.renderMessageToDOM(msg);
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.els.messageStream.scrollTop = this.els.messageStream.scrollHeight;
  }

  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, function (m) {
      return map[m];
    });
  }
}

// Start Application
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});

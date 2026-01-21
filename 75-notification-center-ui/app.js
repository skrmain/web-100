/**
 * Notification Center Logic
 * 1. State Management
 * 2. Data Generation (Mock)
 * 3. Rendering & DOM Manipulation
 */

class NotificationCenter {
  constructor() {
    // --- 1. STATE ---
    this.state = {
      isOpen: false,
      notifications: [],
      unreadCount: 0,
    };

    // --- DOM ELEMENTS ---
    this.ui = {
      bellBtn: document.getElementById("bell-btn"),
      tray: document.getElementById("notification-tray"),
      list: document.getElementById("notification-list"),
      badge: document.getElementById("badge"),
      markAllBtn: document.getElementById("mark-all-read"),
      clearAllBtn: document.getElementById("clear-all"),
    };

    // --- INIT ---
    this.loadFromStorage();
    this.initEventListeners();
    this.render();

    // Start simulated real-time updates
    this.startMockGenerator();
  }

  // --- 2. CORE FUNCTIONS ---

  // Toggle the UI Panel
  toggleTray() {
    this.state.isOpen = !this.state.isOpen;
    this.ui.tray.setAttribute("aria-hidden", !this.state.isOpen);

    if (this.state.isOpen) {
      this.ui.tray.classList.remove("hidden");
    } else {
      this.ui.tray.classList.add("hidden");
    }
  }

  // Add a new notification
  addNotification(notif) {
    const newNotif = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: Date.now(),
      read: false,
      ...notif,
    };

    // Add to beginning of array
    this.state.notifications.unshift(newNotif);
    this.updateCounts();
    this.saveToStorage();
    this.render();

    // Optional: Play sound
    // new Audio('notification.mp3').play().catch(e => {});
  }

  // Mark specific item as read
  markAsRead(id) {
    const notif = this.state.notifications.find((n) => n.id === id);
    if (notif && !notif.read) {
      notif.read = true;
      this.updateCounts();
      this.saveToStorage();
      this.render();
    }
  }

  // Remove specific item
  dismissNotification(id, event) {
    if (event) event.stopPropagation(); // Prevent triggering markAsRead

    this.state.notifications = this.state.notifications.filter(
      (n) => n.id !== id,
    );
    this.updateCounts();
    this.saveToStorage();
    this.render();
  }

  // Mark all as read
  markAllAsRead() {
    this.state.notifications.forEach((n) => (n.read = true));
    this.updateCounts();
    this.saveToStorage();
    this.render();
  }

  // Clear all notifications
  clearAll() {
    this.state.notifications = [];
    this.updateCounts();
    this.saveToStorage();
    this.render();
  }

  // --- 3. RENDERING ---

  updateCounts() {
    this.state.unreadCount = this.state.notifications.filter(
      (n) => !n.read,
    ).length;

    // Update Badge UI
    if (this.state.unreadCount > 0) {
      this.ui.badge.textContent =
        this.state.unreadCount > 9 ? "9+" : this.state.unreadCount;
      this.ui.badge.classList.remove("hidden");
    } else {
      this.ui.badge.classList.add("hidden");
    }
  }

  render() {
    // Clear list
    this.ui.list.innerHTML = "";

    // Empty State
    if (this.state.notifications.length === 0) {
      this.ui.list.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons-round">notifications_off</span>
                    <p>No new notifications</p>
                </div>
            `;
      return;
    }

    // Render Items
    this.state.notifications.forEach((notif) => {
      const el = document.createElement("div");
      el.className = `notif-card ${notif.read ? "read" : "unread"}`;
      el.onclick = () => this.markAsRead(notif.id);

      // Icon selection based on source
      let iconName = "notifications";
      if (notif.source === "chat") iconName = "chat_bubble";
      if (notif.source === "system") iconName = "settings";
      if (notif.source === "alert") iconName = "warning";

      el.innerHTML = `
                <span class="material-icons-round notif-icon">${iconName}</span>
                <div class="notif-content">
                    <div class="notif-title">${notif.title}</div>
                    <div class="notif-msg">${notif.message}</div>
                    <span class="notif-time">${this.getRelativeTime(notif.timestamp)}</span>
                </div>
                <button class="notif-close" aria-label="Dismiss">
                    <span class="material-icons-round">close</span>
                </button>
            `;

      // Attach dismiss handler specifically to the close button
      const closeBtn = el.querySelector(".notif-close");
      closeBtn.onclick = (e) => this.dismissNotification(notif.id, e);

      this.ui.list.appendChild(el);
    });
  }

  // --- 4. UTILITIES ---

  // Relative Time Formatter (e.g. "5 mins ago")
  getRelativeTime(timestamp) {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const diffInSeconds = (timestamp - Date.now()) / 1000;

    if (Math.abs(diffInSeconds) < 60) return "Just now";
    if (Math.abs(diffInSeconds) < 3600)
      return rtf.format(Math.ceil(diffInSeconds / 60), "minute");
    if (Math.abs(diffInSeconds) < 86400)
      return rtf.format(Math.ceil(diffInSeconds / 3600), "hour");
    return rtf.format(Math.ceil(diffInSeconds / 86400), "day");
  }

  // Persist to LocalStorage
  saveToStorage() {
    localStorage.setItem(
      "notifications",
      JSON.stringify(this.state.notifications),
    );
  }

  loadFromStorage() {
    const saved = localStorage.getItem("notifications");
    if (saved) {
      this.state.notifications = JSON.parse(saved);
      this.updateCounts();
    }
  }

  initEventListeners() {
    this.ui.bellBtn.addEventListener("click", () => this.toggleTray());
    this.ui.markAllBtn.addEventListener("click", () => this.markAllAsRead());
    this.ui.clearAllBtn.addEventListener("click", () => this.clearAll());

    // Close tray when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !this.ui.tray.contains(e.target) &&
        !this.ui.bellBtn.contains(e.target) &&
        this.state.isOpen
      ) {
        this.toggleTray();
      }
    });
  }

  // --- 5. MOCK DATA GENERATOR ---

  addRandomNotification() {
    const types = [
      {
        source: "chat",
        title: "New Message",
        message: "Sarah sent you a photo.",
      },
      {
        source: "system",
        title: "Update Available",
        message: "Version 2.0 is ready to install.",
      },
      {
        source: "alert",
        title: "Disk Space",
        message: "Your storage is 90% full.",
      },
      { source: "app", title: "Task Completed", message: "Export successful." },
    ];

    const random = types[Math.floor(Math.random() * types.length)];
    this.addNotification(random);
  }

  startMockGenerator() {
    // Automatically add a notification every 30 seconds for demo
    setInterval(() => {
      if (Math.random() > 0.7) {
        // 30% chance to skip
        this.addRandomNotification();
      }
    }, 30000);
  }
}

// Initialize
const nc = new NotificationCenter();

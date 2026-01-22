/**
 * AeroOS Core Architecture
 * 1. ProcessManager: Handles PIDs and state.
 * 2. WindowManager: Handles DOM, Drag/Drop, Z-Index.
 * 3. System: Clock, Battery, Start Menu.
 */

class WindowManager {
  constructor() {
    this.desktop = document.getElementById("desktop");
    this.template = document.getElementById("window-template");
    this.dock = document.getElementById("dock");
    this.windows = new Map(); // Store active windows
    this.zIndex = 100;
    this.dragState = { isDragging: false, win: null, offsetX: 0, offsetY: 0 };
    this.resizeState = {
      isResizing: false,
      win: null,
      startW: 0,
      startH: 0,
      startX: 0,
      startY: 0,
    };

    this._initGlobalListeners();
  }

  _initGlobalListeners() {
    // Global Drag & Resize Handlers (attached to window to catch fast mouse movements)
    window.addEventListener("mousemove", (e) => this._onMouseMove(e));
    window.addEventListener("mouseup", () => this._onMouseUp());

    // Bring to front on click
    this.desktop.addEventListener("mousedown", (e) => {
      const winEl = e.target.closest(".window");
      if (winEl) this.focusWindow(winEl.id);
    });
  }

  spawnWindow(appId, title, contentEl, icon = "🖥️") {
    const pid = "win_" + Date.now();
    const clone = this.template.content.cloneNode(true);
    const winEl = clone.querySelector(".window");

    // Setup Window
    winEl.id = pid;
    winEl.style.zIndex = ++this.zIndex;
    winEl.style.left = 50 + this.windows.size * 20 + "px";
    winEl.style.top = 50 + this.windows.size * 20 + "px";

    // Fill Content
    winEl.querySelector(".win-text").textContent = title;
    winEl.querySelector(".win-icon").textContent = icon;
    winEl.querySelector(".window-body").appendChild(contentEl);

    // Header Controls
    const header = winEl.querySelector(".window-header");
    header.addEventListener("mousedown", (e) => this._startDrag(e, winEl));

    winEl.querySelector(".close").onclick = () => this.closeWindow(pid);
    winEl.querySelector(".minimize").onclick = () => this.toggleMinimize(pid);
    winEl.querySelector(".maximize").onclick = () => this.toggleMaximize(winEl);

    // Resize Handle
    const resizer = winEl.querySelector(".resize-handle");
    resizer.addEventListener("mousedown", (e) => this._startResize(e, winEl));

    this.desktop.appendChild(winEl);
    this.windows.set(pid, { id: pid, app: appId, minimized: false });

    this._addToDock(pid, title, icon);
    this.focusWindow(pid);

    return winEl;
  }

  focusWindow(pid) {
    const winEl = document.getElementById(pid);
    if (winEl) {
      winEl.style.zIndex = ++this.zIndex;
      // Update active state in dock
      document
        .querySelectorAll(".dock-item")
        .forEach((el) => el.classList.remove("active"));
      const dockItem = document.getElementById("dock-" + pid);
      if (dockItem) dockItem.classList.add("active");
    }
  }

  closeWindow(pid) {
    const winEl = document.getElementById(pid);
    if (winEl) {
      winEl.style.opacity = "0";
      winEl.style.transform = "scale(0.9)";
      setTimeout(() => winEl.remove(), 200);
      this.windows.delete(pid);
      document.getElementById("dock-" + pid)?.remove();
    }
  }

  toggleMinimize(pid) {
    const winEl = document.getElementById(pid);
    const winData = this.windows.get(pid);
    if (winData.minimized) {
      winEl.style.display = "flex";
      this.focusWindow(pid);
      winData.minimized = false;
    } else {
      winEl.style.display = "none";
      document.getElementById("dock-" + pid).classList.remove("active");
      winData.minimized = true;
    }
  }

  toggleMaximize(winEl) {
    if (winEl.style.width === "100%") {
      winEl.style.width = "";
      winEl.style.height = "";
      winEl.style.top = "50px";
      winEl.style.left = "50px";
    } else {
      winEl.style.width = "100%";
      winEl.style.height = "100%";
      winEl.style.top = "0";
      winEl.style.left = "0";
    }
  }

  _addToDock(pid, title, icon) {
    const btn = document.createElement("div");
    btn.className = "dock-item active";
    btn.id = "dock-" + pid;
    btn.innerHTML = `${icon} ${title}`;
    btn.onclick = () => this.toggleMinimize(pid);
    this.dock.appendChild(btn);
  }

  // --- Physics Engine (Drag & Resize) ---

  _startDrag(e, winEl) {
    if (e.target.closest(".window-controls")) return; // Don't drag if clicking buttons
    this.dragState = {
      isDragging: true,
      win: winEl,
      offsetX: e.clientX - winEl.getBoundingClientRect().left,
      offsetY: e.clientY - winEl.getBoundingClientRect().top,
    };
    this.focusWindow(winEl.id);
  }

  _startResize(e, winEl) {
    e.stopPropagation();
    this.resizeState = {
      isResizing: true,
      win: winEl,
      startW: winEl.offsetWidth,
      startH: winEl.offsetHeight,
      startX: e.clientX,
      startY: e.clientY,
    };
    this.focusWindow(winEl.id);
  }

  _onMouseMove(e) {
    if (this.dragState.isDragging) {
      const { win, offsetX, offsetY } = this.dragState;
      // Tablet mode guard
      if (window.innerWidth > 768) {
        win.style.left = `${e.clientX - offsetX}px`;
        win.style.top = `${e.clientY - offsetY}px`;
      }
    }
    if (this.resizeState.isResizing) {
      const { win, startW, startH, startX, startY } = this.resizeState;
      win.style.width = `${startW + (e.clientX - startX)}px`;
      win.style.height = `${startH + (e.clientY - startY)}px`;
    }
  }

  _onMouseUp() {
    this.dragState.isDragging = false;
    this.resizeState.isResizing = false;
  }
}

// --- Application Logic ---

const apps = {
  notepad: {
    title: "Notepad",
    icon: "📝",
    render: () => {
      const div = document.createElement("div");
      div.style.height = "100%";
      const area = document.createElement("textarea");
      area.className = "notepad-area";
      area.placeholder = "Type here... (Auto-saved)";
      area.value = localStorage.getItem("os-notepad") || "";
      area.oninput = (e) => localStorage.setItem("os-notepad", e.target.value);
      div.appendChild(area);
      return div;
    },
  },
  browser: {
    title: "Web Browser",
    icon: "🌐",
    render: () => {
      const iframe = document.createElement("iframe");
      iframe.src = "https://www.wikipedia.org/";
      iframe.className = "browser-frame";
      return iframe;
    },
  },
  calculator: {
    title: "Calculator",
    icon: "🧮",
    render: () => {
      const container = document.createElement("div");
      container.className = "calc-grid";
      const display = document.createElement("div");
      display.className = "calc-display";
      display.textContent = "0";
      container.appendChild(display);

      [
        "7",
        "8",
        "9",
        "/",
        "4",
        "5",
        "6",
        "*",
        "1",
        "2",
        "3",
        "-",
        "C",
        "0",
        "=",
        "+",
      ].forEach((key) => {
        const btn = document.createElement("button");
        btn.textContent = key;
        btn.onclick = () => {
          if (key === "C") display.textContent = "0";
          else if (key === "=") {
            try {
              display.textContent = eval(display.textContent);
            } catch {
              display.textContent = "Error";
            }
          } else {
            if (display.textContent === "0") display.textContent = key;
            else display.textContent += key;
          }
        };
        container.appendChild(btn);
      });
      return container;
    },
  },
  settings: {
    title: "Settings",
    icon: "⚙️",
    render: () => {
      const div = document.createElement("div");
      div.innerHTML = "<h3>Background</h3>";
      const bgs = [
        "linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)",
        "url(https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)",
        "url(https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)",
      ];
      bgs.forEach((bg) => {
        const btn = document.createElement("button");
        btn.style.width = "50px";
        btn.style.height = "50px";
        btn.style.margin = "5px";
        btn.style.background = bg;
        btn.style.backgroundSize = "cover";
        btn.style.border = "1px solid #ccc";
        btn.onclick = () =>
          (document.body.style.background = bg + " center/cover no-repeat");
        div.appendChild(btn);
      });
      return div;
    },
  },
};

// --- OS Bootloader ---

class OS {
  constructor() {
    this.wm = new WindowManager();
    this.initSystem();
  }

  initSystem() {
    // Clock
    setInterval(() => {
      const now = new Date();
      document.getElementById("clock").textContent = now.toLocaleTimeString(
        [],
        { hour: "2-digit", minute: "2-digit" },
      );
    }, 1000);

    // Battery
    if (navigator.getBattery) {
      navigator.getBattery().then((batt) => {
        const updateBatt = () => {
          document.getElementById("battery-level").textContent =
            `🔋 ${Math.round(batt.level * 100)}%`;
        };
        updateBatt();
        batt.addEventListener("levelchange", updateBatt);
      });
    }

    // Desktop Icons
    document.querySelectorAll(".desktop-icon").forEach((icon) => {
      icon.addEventListener("dblclick", () => {
        const appKey = icon.dataset.app;
        if (appKey === "pc") alert("System Drive: C:/");
        else this.launch(appKey);
      });
    });

    // Start Menu
    document.getElementById("start-btn").onclick = (e) => {
      e.stopPropagation();
      document.getElementById("start-menu").classList.toggle("hidden");
    };
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#start-menu") && !e.target.closest("#start-btn")) {
        document.getElementById("start-menu").classList.add("hidden");
      }
    });
  }

  launch(appId) {
    if (apps[appId]) {
      const app = apps[appId];
      this.wm.spawnWindow(appId, app.title, app.render(), app.icon);
      document.getElementById("start-menu").classList.add("hidden");
    }
  }
}

// Boot
const os = new OS();

/* * SYSTEM CONFIGURATION & STATE
 */
const state = {
  // 1. The Virtual File System (Nested Objects = Dirs, Strings = Files)
  fileSystem: {
    root: {
      home: {
        user: {
          "about.txt": "System Engineer with a passion for CLI tools.",
          projects: {
            "vfs.js": "// Virtual File System Logic",
            "style.css": "/* Retro Styles */",
          },
          "todo.txt": "1. Build Terminal\n2. Drink Coffee",
        },
      },
      var: { log: {} },
      etc: {},
    },
  },
  // Track current path as an array of keys, e.g., ['root', 'home', 'user']
  path: ["root", "home", "user"],

  // Command History Buffer
  history: [],
  historyIndex: -1,
};

// DOM Elements
const elements = {
  terminal: document.getElementById("terminal"),
  output: document.getElementById("output"),
  inputLine: document.getElementById("input-line"),
  prompt: document.getElementById("prompt"),
  typed: document.getElementById("typed-text"),
  hiddenInput: document.getElementById("hidden-input"),
};

/* * CORE VFS LOGIC
 */

// Helper: Get the actual directory object based on current path
function getCurrentDirectory() {
  return state.path.reduce((dir, subDir) => dir[subDir], state.fileSystem);
}

// Helper: Resolve a specific directory object from a path array
function resolvePath(pathArray) {
  return pathArray.reduce((dir, subDir) => {
    return dir && dir[subDir] ? dir[subDir] : null;
  }, state.fileSystem);
}

// Helper: Update the UI prompt
function updatePrompt() {
  // Convert path array to string (e.g., ~/projects)
  let pathStr = "";
  if (
    state.path.length >= 3 &&
    state.path[0] === "root" &&
    state.path[1] === "home" &&
    state.path[2] === "user"
  ) {
    const relPath = state.path.slice(3);
    pathStr = "~" + (relPath.length ? "/" + relPath.join("/") : "");
  } else {
    pathStr = "/" + state.path.slice(1).join("/");
  }
  elements.prompt.innerText = `user@web-terminal:${pathStr}$`;
}

/* * COMMAND EXECUTION ENGINE
 */
const commands = {
  help: () => {
    return `Available commands:\n  help, ls, cd [dir], mkdir [name], touch [name], cat [file], echo [text], clear`;
  },

  clear: () => {
    elements.output.innerHTML = "";
    return null; // Return null prevents printing anything
  },

  ls: () => {
    const currentDir = getCurrentDirectory();
    const contents = Object.keys(currentDir).map((key) => {
      const isDir = typeof currentDir[key] === "object";
      const style = isDir ? 'class="directory"' : 'class="file"';
      const suffix = isDir ? "/" : "";
      return `<span ${style}>${key}${suffix}</span>`;
    });
    return contents.join("  ");
  },

  cd: (args) => {
    if (!args[0]) return ""; // No arg, do nothing (or go home in real OS)

    const target = args[0];

    // Handle ".."
    if (target === "..") {
      if (state.path.length > 1) {
        // Prevent going above root
        state.path.pop();
      }
      updatePrompt();
      return "";
    }

    // Handle child directory
    const currentDir = getCurrentDirectory();
    if (currentDir[target] && typeof currentDir[target] === "object") {
      state.path.push(target);
      updatePrompt();
      return "";
    } else {
      return `<span class="error">cd: ${target}: No such directory</span>`;
    }
  },

  mkdir: (args) => {
    if (!args[0]) return '<span class="error">usage: mkdir [name]</span>';
    const currentDir = getCurrentDirectory();
    if (currentDir[args[0]]) {
      return `<span class="error">mkdir: cannot create directory '${args[0]}': File exists</span>`;
    }
    currentDir[args[0]] = {}; // Create new object
    return "";
  },

  touch: (args) => {
    if (!args[0]) return '<span class="error">usage: touch [name]</span>';
    const currentDir = getCurrentDirectory();
    currentDir[args[0]] = ""; // Create empty string
    return "";
  },

  cat: (args) => {
    if (!args[0]) return '<span class="error">usage: cat [file]</span>';
    const currentDir = getCurrentDirectory();

    if (!currentDir[args[0]]) {
      return `<span class="error">cat: ${args[0]}: No such file</span>`;
    }

    if (typeof currentDir[args[0]] === "object") {
      return `<span class="error">cat: ${args[0]}: Is a directory</span>`;
    }

    return currentDir[args[0]].replace(/\n/g, "<br>");
  },

  echo: (args) => {
    return args.join(" ");
  },
};

/* * UI & EVENT HANDLERS
 */

// Execute the command string
function executeCommand(rawInput) {
  const cleanInput = rawInput.trim();
  if (!cleanInput) return;

  // Add to history
  state.history.push(cleanInput);
  state.historyIndex = state.history.length;

  // Print the command line to history
  const commandRow = document.createElement("div");
  commandRow.className = "output-cmd";
  commandRow.innerHTML = `${elements.prompt.innerHTML} ${cleanInput}`;
  elements.output.appendChild(commandRow);

  // Parse command
  const parts = cleanInput.split(" ");
  const cmd = parts[0];
  const args = parts.slice(1);

  // Run command
  if (commands[cmd]) {
    const result = commands[cmd](args);
    if (result !== null && result !== "") {
      const resultRow = document.createElement("div");
      resultRow.className = "output-text";
      resultRow.innerHTML = result;
      elements.output.appendChild(resultRow);
    }
  } else {
    const errorRow = document.createElement("div");
    errorRow.className = "output-text error";
    errorRow.innerText = `Command not found: ${cmd}`;
    elements.output.appendChild(errorRow);
  }

  // Auto scroll
  elements.terminal.scrollTop = elements.terminal.scrollHeight;
}

// Sync hidden input with visible cursor
elements.hiddenInput.addEventListener("input", (e) => {
  elements.typed.innerText = elements.hiddenInput.value;
});

// Keydown Logic (Enter, Up, Down)
elements.hiddenInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const input = elements.hiddenInput.value;
    executeCommand(input);
    elements.hiddenInput.value = ""; // Clear input
    elements.typed.innerText = "";
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (state.historyIndex > 0) {
      state.historyIndex--;
      const historyCmd = state.history[state.historyIndex];
      elements.hiddenInput.value = historyCmd;
      elements.typed.innerText = historyCmd;
    }
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      const historyCmd = state.history[state.historyIndex];
      elements.hiddenInput.value = historyCmd;
      elements.typed.innerText = historyCmd;
    } else {
      state.historyIndex = state.history.length;
      elements.hiddenInput.value = "";
      elements.typed.innerText = "";
    }
  }
});

// Initialize
updatePrompt();

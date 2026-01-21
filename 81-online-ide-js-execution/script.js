/* --- DOM Elements --- */
const codeInput = document.getElementById("codeInput");
const lineNumbers = document.getElementById("lineNumbers");
const runBtn = document.getElementById("runBtn");
const clearBtn = document.getElementById("clearBtn");
const autoRunCheckbox = document.getElementById("autoRun");
const consoleOutput = document.getElementById("consoleOutput");
const iframeContainer = document.getElementById("iframeContainer");
const tabs = document.querySelectorAll(".tab");

/* --- State --- */
let autoRunTimer = null;

/* --- 1. Editor Logic (Line Numbers & Tab) --- */

const updateLineNumbers = () => {
  const lines = codeInput.value.split("\n").length;
  lineNumbers.innerHTML = Array(lines)
    .fill(0)
    .map((_, i) => `<div>${i + 1}</div>`)
    .join("");
};

const syncScroll = () => {
  lineNumbers.scrollTop = codeInput.scrollTop;
};

// Handle Tab Key (Insert 2 spaces)
codeInput.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = codeInput.selectionStart;
    const end = codeInput.selectionEnd;
    // Insert 2 spaces
    codeInput.value =
      codeInput.value.substring(0, start) +
      "  " +
      codeInput.value.substring(end);
    // Move caret
    codeInput.selectionStart = codeInput.selectionEnd = start + 2;
    updateLineNumbers(); // Updates if a newline was somehow involved or to be safe
  }
});

codeInput.addEventListener("input", () => {
  updateLineNumbers();
  if (autoRunCheckbox.checked) {
    clearTimeout(autoRunTimer);
    autoRunTimer = setTimeout(runCode, 1000); // 1s Debounce
  }
});

codeInput.addEventListener("scroll", syncScroll);

/* --- 2. Sandbox Execution Logic --- */

const createConsoleProxy = () => {
  // This script runs INSIDE the iframe.
  // It overrides console.log/error/warn and sends data to parent.
  return `
    <script>
        (function() {
            const send = (type, args) => {
                try {
                    // Convert args to strings to avoid cloning issues with DOM elements
                    const payload = args.map(arg => {
                        if (typeof arg === 'object' && arg !== null) {
                            try {
                                return JSON.stringify(arg, null, 2);
                            } catch (e) {
                                return arg.toString();
                            }
                        }
                        return String(arg);
                    });
                    window.parent.postMessage({ source: 'sandbox', type, payload }, '*');
                } catch (e) {
                    window.parent.postMessage({ source: 'sandbox', type: 'error', payload: ['Log serialization failed'] }, '*');
                }
            };

            const originalLog = console.log;
            const originalWarn = console.warn;
            const originalError = console.error;

            console.log = (...args) => { originalLog(...args); send('log', args); };
            console.warn = (...args) => { originalWarn(...args); send('warn', args); };
            console.error = (...args) => { originalError(...args); send('error', args); };

            window.onerror = (message, source, lineno, colno, error) => {
                send('error', [\`Uncaught Error: \${message} (Line \${lineno})\`]);
            };
        })();
    <\/script>
    `;
};

const runCode = () => {
  // 1. Clear previous logs to keep it clean (optional, but good for UX)
  consoleOutput.innerHTML = "";

  // 2. Remove old iframe to clear memory/state
  iframeContainer.innerHTML = "";

  // 3. Create new iframe
  const iframe = document.createElement("iframe");
  iframeContainer.appendChild(iframe);

  // 4. Construct content
  const userCode = codeInput.value;
  const proxyScript = createConsoleProxy();

  // We wrap user code in a try-catch for immediate syntax errors during execution
  const wrappedCode = `
        <body>
            <div id="app"></div>
            ${proxyScript}
            <script>
                try {
                    ${userCode}
                } catch (err) {
                    console.error(err.toString());
                }
            <\/script>
        </body>
    `;

  // 5. Write to iframe
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(wrappedCode);
  doc.close();
};

/* --- 3. Message Listener (Receiving Logs) --- */

window.addEventListener("message", (event) => {
  // Security check: ensure message is from our sandbox system
  if (!event.data || event.data.source !== "sandbox") return;

  const { type, payload } = event.data;

  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;

  // Join arguments with space
  entry.textContent = `> ${payload.join(" ")}`;

  consoleOutput.appendChild(entry);
  consoleOutput.scrollTop = consoleOutput.scrollHeight; // Auto-scroll to bottom
});

/* --- 4. UI Controls --- */

runBtn.addEventListener("click", runCode);

clearBtn.addEventListener("click", () => {
  consoleOutput.innerHTML = "";
});

// Tab Switching
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.add("hidden"));
    document
      .getElementById(`${tab.dataset.target}Content`)
      .classList.remove("hidden");
  });
});

/* --- Init --- */
updateLineNumbers();
// runCode(); // Optional: Auto-run on load

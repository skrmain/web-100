/**
 * SENIOR FRONTEND SYSTEM - CORE LOGIC
 * Architecture: Ring Buffer Storage -> Canvas Render Loop (60fps) -> Simulation Tick (500ms)
 */

// --- 1. DATA STRUCTURES ---

/**
 * Ring Buffer implementation to store fixed-window time series data.
 * Prevents memory leaks by reusing a fixed array size.
 */
class DataStream {
  constructor(limit = 60) {
    this.limit = limit;
    this.data = new Array(limit).fill(0);
    this.pointer = 0; // Not strictly needed for JS array.push/shift, but conceptually valid
  }

  add(value) {
    this.data.push(value);
    if (this.data.length > this.limit) {
      this.data.shift();
    }
  }

  get() {
    return this.data;
  }

  last() {
    return this.data[this.data.length - 1];
  }
}

// --- 2. CANVAS ENGINE ---

class GraphRenderer {
  constructor(canvasId, color, type = "line") {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.color = color;
    this.type = type; // 'line', 'area', 'bar'
    this.resize();

    // Handle window resize
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    // High DPI Scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentNode.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.ctx.scale(dpr, dpr);

    this.width = rect.width;
    this.height = rect.height;
  }

  render(dataStream) {
    const data = dataStream.get();
    const ctx = this.ctx;
    const h = this.height;
    const w = this.width;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw Grid Lines (Subtle)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < h; i += 40) {
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
    }
    for (let i = 0; i < w; i += 40) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
    }
    ctx.stroke();

    // Prepare Graph Path
    const step = w / (dataStream.limit - 1);

    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    // Glow Effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;

    if (this.type === "bar") {
      this.renderBars(ctx, data, step, h);
      return;
    }

    // Line & Area logic
    let hasStarted = false;
    data.forEach((val, index) => {
      const x = index * step;
      // Map 0-100 to Height-0
      const y = h - (val / 100) * h;

      if (!hasStarted) {
        ctx.moveTo(x, y);
        hasStarted = true;
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // If Area, close the path
    if (this.type === "area") {
      ctx.lineTo((data.length - 1) * step, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = this.color.replace(")", ", 0.2)").replace("rgb", "rgba"); // Hex handling would be complex, assuming rgb vars or hex in real app
      // Simple hex to rgba hack for demo or just use globalAlpha
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    ctx.shadowBlur = 0; // Reset
  }

  renderBars(ctx, data, step, h) {
    ctx.fillStyle = this.color;
    const barWidth = step - 2;

    data.forEach((val, index) => {
      const x = index * step;
      const barHeight = (val / 100) * h;
      const y = h - barHeight;
      ctx.fillRect(x, y, Math.max(barWidth, 1), barHeight);
    });
  }
}

// --- 3. SYSTEM SIMULATION AGENT ---

const SIMULATION_TICK = 500; // ms

// State
const sysState = {
  cpu: new DataStream(60),
  ram: new DataStream(60),
  net: new DataStream(60),
  processes: [
    { pid: 1024, name: "dockerd", cpu: 5, mem: 12 },
    { pid: 8432, name: "chrome_helper", cpu: 15, mem: 40 },
    { pid: 101, name: "kernel_task", cpu: 2, mem: 5 },
    { pid: 443, name: "nginx_worker", cpu: 1, mem: 8 },
    { pid: 3306, name: "mysqld", cpu: 8, mem: 20 },
    { pid: 9001, name: "node_server", cpu: 0, mem: 15 },
    { pid: 777, name: "kworker", cpu: 0, mem: 0 },
  ],
  alertCounter: 0,
};

// Renderers
const renderers = {
  cpu: new GraphRenderer("cpuCanvas", "#00f3ff", "line"), // Cyan
  ram: new GraphRenderer("ramCanvas", "#bc13fe", "area"), // Purple
  net: new GraphRenderer("netCanvas", "#0aff00", "bar"), // Green
};

// --- LOGIC FUNCTIONS ---

function getNextValue(current, volatility) {
  // Random walk: Current + (Random(-0.5 to 0.5) * volatility)
  let change = (Math.random() - 0.5) * volatility;
  let next = current + change;
  if (next < 0) next = 0;
  if (next > 100) next = 100;
  return next;
}

function updateProcesses() {
  // Simulate process flux
  sysState.processes.forEach((p) => {
    p.cpu = getNextValue(p.cpu, 15); // Volatile CPU
    p.mem = getNextValue(p.mem, 2); // Stable Mem
  });

  // Sort Descending by CPU
  sysState.processes.sort((a, b) => b.cpu - a.cpu);

  // Update DOM
  const tbody = document.querySelector("#procTable tbody");
  tbody.innerHTML = ""; // efficient enough for small lists

  // Fragment for batch insertion
  const frag = document.createDocumentFragment();

  sysState.processes.slice(0, 8).forEach((p) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${p.pid}</td>
            <td style="color: #fff">${p.name}</td>
            <td>${p.cpu.toFixed(1)}%</td>
            <td>${p.mem.toFixed(1)}%</td>
        `;
    frag.appendChild(row);
  });

  tbody.appendChild(frag);
}

function logAlert(msg) {
  const term = document.getElementById("logTerminal");
  const entry = document.createElement("div");
  entry.className = "log-entry alert";

  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  entry.innerText = `[${time}] CRITICAL: ${msg}`;

  term.appendChild(entry);
  term.scrollTop = term.scrollHeight; // Auto scroll
}

// --- MAIN LOOPS ---

// 1. Data Ingestion Loop (500ms)
setInterval(() => {
  // Calculate new metrics
  const lastCpu = sysState.cpu.last();
  const lastRam = sysState.ram.last();

  // CPU: Volatile
  const newCpu = getNextValue(lastCpu || 50, 20);
  // RAM: Slow moving
  const newRam = getNextValue(lastRam || 40, 5);
  // Net: Bursty
  const newNet = Math.random() > 0.7 ? Math.random() * 80 : Math.random() * 20;

  sysState.cpu.add(newCpu);
  sysState.ram.add(newRam);
  sysState.net.add(newNet);

  // Update Text
  document.getElementById("cpuValue").innerText = newCpu.toFixed(1) + "%";
  document.getElementById("ramValue").innerText = newRam.toFixed(1) + "%";
  document.getElementById("netValue").innerText = newNet.toFixed(0) + " Mbps";

  // Alert Logic
  if (newCpu > 90) {
    sysState.alertCounter++;
  } else {
    sysState.alertCounter = 0;
    document.body.classList.remove("critical-alert");
    document.getElementById("globalStatus").innerText = "STATUS: NOMINAL";
    document.getElementById("globalStatus").style.color = "#0aff00";
  }

  if (sysState.alertCounter > 3) {
    document.body.classList.add("critical-alert");
    document.getElementById("globalStatus").innerText = "STATUS: CRITICAL";
    document.getElementById("globalStatus").style.color = "#ff003c";
    logAlert(`CPU LOAD ${newCpu.toFixed(1)}%`);
  }

  // Process Table Update
  updateProcesses();
}, SIMULATION_TICK);

// 2. Render Loop (60fps) via requestAnimationFrame
function animate() {
  renderers.cpu.render(sysState.cpu);
  renderers.ram.render(sysState.ram);
  renderers.net.render(sysState.net);
  requestAnimationFrame(animate);
}

// Start
animate();

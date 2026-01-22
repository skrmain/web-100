/**
 * SENIOR FRONTEND DATA ENGINEER SOLUTION
 * 1. Mock Data Generator
 * 2. Custom SVG Chart Engine
 * 3. Aggregation & Controller
 */

// --- 1. MOCK DATA GENERATOR ---

const generateDates = (daysBack) => {
  const dates = [];
  for (let i = daysBack; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // Simple string format "Jan 1"
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    // Random traffic with some organic-looking variance
    const base = 2000;
    const random = Math.floor(Math.random() * 1500);
    const noise = Math.sin(i) * 500; // Add a wave pattern
    const value = Math.max(0, Math.floor(base + random + noise));

    dates.push({ label, value, dateObj: d });
  }
  return dates;
};

// Top pages mock data
const TOP_PAGES = [
  { url: "/home", views: "12.5K", unique: "8.2K", bounce: "42%" },
  { url: "/pricing", views: "4.1K", unique: "3.9K", bounce: "25%" },
  { url: "/blog/svg-tutorial", views: "3.8K", unique: "3.1K", bounce: "65%" },
  { url: "/contact", views: "1.2K", unique: "900", bounce: "30%" },
];

// --- 2. CUSTOM SVG CHART ENGINE (The Hard Part) ---

class LineChart {
  constructor(containerId, data) {
    this.container = document.getElementById(containerId);
    this.data = data;
    this.padding = { top: 20, bottom: 30, left: 40, right: 20 };
    this.tooltip = document.getElementById("tooltip");

    // Resize observer for responsiveness
    new ResizeObserver(() => this.render()).observe(this.container);
    this.render();
  }

  updateData(newData) {
    this.data = newData;
    this.render();
  }

  // Normalization: Map data value to SVG coordinate
  // Formula: y = containerHeight - ((val - min) / (max - min) * usableHeight)
  getScale(val, min, max, dimension) {
    if (max === min) return dimension / 2;
    return ((val - min) / (max - min)) * dimension;
  }

  render() {
    // Clear previous SVG
    this.container.innerHTML = "";

    // --- SAFETY CHECK: HANDLE EMPTY DATA ---
    if (!this.data || this.data.length === 0) {
      // Optional: Add a "No Data" message for better UX
      this.container.innerHTML = `
            <div style="height:100%; display:flex; align-items:center; justify-content:center; color:#9ca3af;">
                No data available for this range
            </div>
        `;
      return; // STOP EXECUTION HERE
    }

    // 1. Setup Dimensions
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const chartW = width - this.padding.left - this.padding.right;
    const chartH = height - this.padding.top - this.padding.bottom;

    // 2. Calculate Min/Max for Scaling
    const values = this.data.map((d) => d.value);
    const maxVal = Math.max(...values) * 1.1; // Add 10% headroom
    const minVal = 0; // Baseline at 0 for pageviews

    // 3. Coordinate Mapping Function
    const points = this.data.map((d, i) => {
      const x = (i / (this.data.length - 1)) * chartW + this.padding.left;
      const y =
        height -
        this.padding.bottom -
        this.getScale(d.value, minVal, maxVal, chartH);
      return { x, y, ...d };
    });

    // 4. Create SVG Element
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    // 5. Define Gradient
    const defs = document.createElementNS(svgNS, "defs");
    const gradient = document.createElementNS(svgNS, "linearGradient");
    gradient.id = "gradient";
    gradient.setAttribute("x1", "0");
    gradient.setAttribute("x2", "0");
    gradient.setAttribute("y1", "0");
    gradient.setAttribute("y2", "1");

    const stop1 = document.createElementNS(svgNS, "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "var(--primary)");
    stop1.setAttribute("stop-opacity", "0.5");

    const stop2 = document.createElementNS(svgNS, "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "var(--primary-light)");
    stop2.setAttribute("stop-opacity", "0"); // Fade out

    gradient.append(stop1, stop2);
    defs.append(gradient);
    svg.append(defs);

    // 6. Generate Path Strings (Line & Area)
    // M = Move to, L = Line to
    let pathD = `M ${points[0].x} ${points[0].y}`;
    points.slice(1).forEach((p) => (pathD += ` L ${p.x} ${p.y}`));

    // Close the loop for area (down to bottom right, over to bottom left)
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - this.padding.bottom} L ${points[0].x} ${height - this.padding.bottom} Z`;

    // 7. Draw Area
    const areaPath = document.createElementNS(svgNS, "path");
    areaPath.setAttribute("d", areaD);
    areaPath.setAttribute("class", "area-path");
    svg.append(areaPath);

    // 8. Draw Line
    const linePath = document.createElementNS(svgNS, "path");
    linePath.setAttribute("d", pathD);
    linePath.setAttribute("class", "line-path");
    svg.append(linePath);

    // 9. Interactive Elements (Hover Line & Circle)
    const hoverLine = document.createElementNS(svgNS, "line");
    hoverLine.setAttribute("class", "hover-line");
    hoverLine.setAttribute("y1", this.padding.top);
    hoverLine.setAttribute("y2", height - this.padding.bottom);
    svg.append(hoverLine);

    const hoverCircle = document.createElementNS(svgNS, "circle");
    hoverCircle.setAttribute("class", "hover-circle");
    svg.append(hoverCircle);

    // 10. Mouse Interaction Logic
    // Create an overlay rect to catch events easily
    const overlay = document.createElementNS(svgNS, "rect");
    overlay.setAttribute("width", width);
    overlay.setAttribute("height", height);
    overlay.setAttribute("fill", "transparent");
    svg.append(overlay);

    overlay.addEventListener("mousemove", (e) => {
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      // Find closest data point based on X coordinate
      // X position relative to chart area
      const relativeX = Math.max(
        0,
        Math.min(mouseX - this.padding.left, chartW),
      );
      // Convert length to index
      const index = Math.round((relativeX / chartW) * (this.data.length - 1));
      const point = points[index];

      if (point) {
        // Update visuals
        hoverLine.setAttribute("x1", point.x);
        hoverLine.setAttribute("x2", point.x);
        hoverLine.style.opacity = 1;

        hoverCircle.setAttribute("cx", point.x);
        hoverCircle.setAttribute("cy", point.y);
        hoverCircle.style.opacity = 1;

        // Update Tooltip
        this.tooltip.innerHTML = `<strong>${point.label}</strong><br/>${point.value.toLocaleString()} Views`;
        this.tooltip.style.left = `${point.x}px`; // Relative to container
        this.tooltip.style.top = `${point.y}px`;
        this.tooltip.classList.add("visible");
      }
    });

    overlay.addEventListener("mouseleave", () => {
      hoverLine.style.opacity = 0;
      hoverCircle.style.opacity = 0;
      this.tooltip.classList.remove("visible");
    });

    this.container.appendChild(svg);
  }
}

// --- 3. CONTROLLER & AGGREGATION LOGIC ---

// Initialize Data (60 days back to allow for "All time")
const rawData = generateDates(60);

// Initialize Chart
const chart = new LineChart("chart-container", []);

// Aggregation Functions
const filterData = (range) => {
  let days;
  if (range === "7") days = 7;
  else if (range === "30") days = 30;
  else days = rawData.length;

  return rawData.slice(-days);
};

const updateMetrics = (data) => {
  // Math for header cards
  const totalViews = data.reduce((acc, curr) => acc + curr.value, 0);
  const unique = Math.floor(totalViews * 0.65); // Dummy logic

  // Update DOM
  document.getElementById("kpi-views").textContent =
    (totalViews / 1000).toFixed(1) + "K";
  document.getElementById("kpi-visitors").textContent =
    (unique / 1000).toFixed(1) + "K";

  // Randomize time slightly based on range for realism
  const timeM = Math.floor(2 + Math.random());
  const timeS = Math.floor(Math.random() * 60);
  document.getElementById("kpi-time").textContent = `${timeM}m ${timeS}s`;
};

const renderTable = () => {
  const tbody = document.getElementById("top-pages-body");
  tbody.innerHTML = TOP_PAGES.map(
    (page) => `
        <tr>
            <td>${page.url}</td>
            <td>${page.views}</td>
            <td>${page.unique}</td>
            <td>${page.bounce}</td>
        </tr>
    `,
  ).join("");
};

const handleFilterChange = (range) => {
  // 1. Filter Data
  const subset = filterData(range);

  // 2. Update Chart
  chart.updateData(subset);

  // 3. Update Metrics
  updateMetrics(subset);
};

// Event Listeners for Buttons
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    // Toggle Active Class
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");

    // Trigger Update
    const range = e.target.getAttribute("data-range");
    handleFilterChange(range);
  });
});

// Initial Load
handleFilterChange("7"); // Default to 7 days
renderTable();

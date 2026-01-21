/**
 * ARCHITECTURE:
 * 1. Store (Observable): Manages state, emits events.
 * 2. Logic: Pure functions for GPA/Stats calculations.
 * 3. UI: Subscribers that update specific parts of the DOM.
 */

/* --- 1. STATE MANAGEMENT & DATA --- */

const generateId = () => "_" + Math.random().toString(36).substr(2, 9);

// Initial Dummy Data
const generateDummyData = () => {
  const names = [
    "Alice Johnson",
    "Bob Smith",
    "Charlie Brown",
    "Diana Prince",
    "Evan Wright",
    "Fiona Gallagher",
    "George Miller",
    "Hannah Abbott",
    "Ian Somerhalder",
    "Jane Doe",
  ];
  return names.map((name) => ({
    id: generateId(),
    name: name,
    math: Math.floor(Math.random() * 40) + 60, // 60-100
    science: Math.floor(Math.random() * 40) + 60,
    history: Math.floor(Math.random() * 40) + 60,
    attendance: Math.floor(Math.random() * 20) + 80, // 80-100
  }));
};

// The Observable Store
class Store {
  constructor() {
    this.subscribers = [];
    // Load from LocalStorage or Init
    const saved = localStorage.getItem("edtech_students");
    this.state = {
      students: saved ? JSON.parse(saved) : generateDummyData(),
      sortConfig: { key: "name", dir: "asc" },
    };
  }

  subscribe(fn) {
    this.subscribers.push(fn);
    fn(this.state); // Initial call
  }

  notify() {
    this.subscribers.forEach((fn) => fn(this.state));
    this.persist();
  }

  persist() {
    localStorage.setItem(
      "edtech_students",
      JSON.stringify(this.state.students),
    );
  }

  /* Actions */

  updateGrade(id, subject, value) {
    const student = this.state.students.find((s) => s.id === id);
    if (student) {
      student[subject] = Number(value);
      this.notify();
    }
  }

  addStudent(studentData) {
    this.state.students.push({ ...studentData, id: generateId() });
    this.notify();
  }

  deleteStudent(id) {
    this.state.students = this.state.students.filter((s) => s.id !== id);
    this.notify();
  }

  setSort(key) {
    // Toggle direction if same key, else default asc
    if (this.state.sortConfig.key === key) {
      this.state.sortConfig.dir =
        this.state.sortConfig.dir === "asc" ? "desc" : "asc";
    } else {
      this.state.sortConfig.key = key;
      this.state.sortConfig.dir = key === "name" ? "asc" : "desc"; // Default desc for numbers
    }
    this.notify();
  }
}

/* --- 2. COMPUTED LOGIC --- */

const Logic = {
  calculateGPA: (s) => ((s.math + s.science + s.history) / 3).toFixed(1),

  getClassStats: (students) => {
    if (students.length === 0) return { avg: 0, top: "None" };

    let totalGpa = 0;
    let topStudent = students[0];
    let maxGpa = -1;

    students.forEach((s) => {
      const gpa = parseFloat(Logic.calculateGPA(s));
      totalGpa += gpa;
      if (gpa > maxGpa) {
        maxGpa = gpa;
        topStudent = s;
      }
    });

    return {
      avg: (totalGpa / students.length).toFixed(1),
      top: topStudent.name,
    };
  },

  getSortedStudents: (students, { key, dir }) => {
    const sorted = [...students];
    sorted.sort((a, b) => {
      let valA, valB;

      if (key === "gpa") {
        valA = parseFloat(Logic.calculateGPA(a));
        valB = parseFloat(Logic.calculateGPA(b));
      } else {
        valA = a[key];
        valB = b[key];
      }

      if (valA < valB) return dir === "asc" ? -1 : 1;
      if (valA > valB) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  },
};

/* --- 3. UI RENDERING & SUBSRIBERS --- */

const app = {
  store: new Store(),

  init() {
    // SUBSCRIBER 1: Update Top Cards
    this.store.subscribe((state) => {
      const stats = Logic.getClassStats(state.students);
      document.getElementById("stat-total").innerText = state.students.length;
      document.getElementById("stat-average").innerText = stats.avg;
      document.getElementById("stat-top").innerText = stats.top;

      // CSS Bar update
      const percentage = Math.min((stats.avg / 100) * 100, 100);
      document.getElementById("avg-bar").style.width = `${percentage}%`;
    });

    // SUBSCRIBER 2: Render Table (Smart Re-render logic)
    // Note: In a real framework, we'd use VDOM. Here, we re-render rows
    // unless focused to maintain state, but for sorting/adding we need full render.
    this.store.subscribe((state) => {
      this.renderTable(state);
    });

    // Form Listener
    document
      .getElementById("add-student-form")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleAddSubmit();
      });
  },

  // Helper to determine badge color
  getBadgeHtml(gpa) {
    let color = "badge-red";
    if (gpa >= 90) color = "badge-green";
    else if (gpa >= 70) color = "badge-yellow";
    return `<span class="badge ${color}">${gpa}</span>`;
  },

  renderTable(state) {
    const tbody = document.getElementById("gradebook-body");
    const sortedData = Logic.getSortedStudents(
      state.students,
      state.sortConfig,
    );

    // We only want to rebuild the DOM if we aren't currently editing
    // (to prevent focus loss), OR if the operation was a sort/add/delete.
    // For this vanilla implementation, we will rebuild, but restore focus
    // if the active element was an input.

    const activeId = document.activeElement.id; // Capture focus

    tbody.innerHTML = "";

    sortedData.forEach((s) => {
      const gpa = Logic.calculateGPA(s);
      const tr = document.createElement("tr");

      tr.innerHTML = `
                <td style="font-weight: 500">${s.name}</td>
                <td style="color: var(--text-muted)">${s.id.substr(0, 4).toUpperCase()}</td>
                <td><input type="number" id="math-${s.id}" value="${s.math}" oninput="app.handleInput('${s.id}', 'math', this.value)"></td>
                <td><input type="number" id="sci-${s.id}" value="${s.science}" oninput="app.handleInput('${s.id}', 'science', this.value)"></td>
                <td><input type="number" id="hist-${s.id}" value="${s.history}" oninput="app.handleInput('${s.id}', 'history', this.value)"></td>
                <td>${s.attendance}%</td>
                <td id="gpa-${s.id}">${this.getBadgeHtml(gpa)}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="app.deleteStudent('${s.id}')">Expel</button>
                </td>
            `;
      tbody.appendChild(tr);
    });

    // Restore focus if we were editing
    if (activeId && document.getElementById(activeId)) {
      const input = document.getElementById(activeId);
      input.focus();
      // Restore cursor position hack
      const val = input.value;
      input.value = "";
      input.value = val;
    }
  },

  /* Event Handlers */

  handleInput(id, subject, value) {
    // Optimistic UI Update for specific cell before Store notifies (Performance tweak)
    // Not strictly necessary but feels snappier.
    this.store.updateGrade(id, subject, value);
  },

  sortData(key) {
    this.store.setSort(key);
  },

  deleteStudent(id) {
    if (confirm("Are you sure?")) {
      this.store.deleteStudent(id);
    }
  },

  toggleModal(show) {
    document.getElementById("add-modal").style.display = show ? "flex" : "none";
    if (show) document.getElementById("add-student-form").reset();
  },

  handleAddSubmit() {
    const student = {
      name: document.getElementById("new-name").value,
      math: Number(document.getElementById("new-math").value),
      science: Number(document.getElementById("new-science").value),
      history: Number(document.getElementById("new-history").value),
      attendance: Number(document.getElementById("new-attendance").value),
    };
    this.store.addStudent(student);
    this.toggleModal(false);
  },
};

// Initialize App
app.init();

document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Select DOM Elements ---
  const calendarGrid = document.getElementById("calendar-grid");
  const monthYearText = document.getElementById("month-year");
  const prevBtn = document.getElementById("prev-month");
  const nextBtn = document.getElementById("next-month");
  const todayBtn = document.getElementById("btn-today");
  const selectedDateDisplay = document.getElementById("selected-date-display");

  // --- 2. State Management ---
  const today = new Date();
  let currentDate = new Date(); // Tracks the currently displayed month
  let selectedDate = null; // Tracks the user-clicked date

  // --- 3. Date Utility Functions ---

  /**
   * Get the number of days in a specific month/year.
   * Note: Month is 0-indexed (0 = Jan, 11 = Dec).
   * new Date(year, month + 1, 0) gets the last day of the passed month.
   */
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  /**
   * Get the weekday index (0-6) of the first day of the month.
   * 0 = Sunday, 1 = Monday, etc.
   */
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // --- 4. Rendering Logic ---

  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update Header Text
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    monthYearText.textContent = `${monthNames[month]} ${year}`;

    // Clear previous grid
    calendarGrid.innerHTML = "";

    // Calculate grid details
    const daysInMonth = getDaysInMonth(year, month);
    const startDayIndex = getFirstDayOfMonth(year, month);

    // A. Render Empty Cells (Padding for start of month)
    // If month starts on Tuesday (index 2), we need 2 empty cells (Sun, Mon)
    for (let i = 0; i < startDayIndex; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.classList.add("day-cell", "empty");
      calendarGrid.appendChild(emptyCell);
    }

    // B. Render Day Cells (1 to 31)
    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement("div");
      dayCell.textContent = day;
      dayCell.classList.add("day-cell");

      // Check if this cell is "Today"
      const isToday =
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

      if (isToday) {
        dayCell.classList.add("today");
      }

      // Check if this cell is "Selected"
      if (
        selectedDate &&
        day === selectedDate.getDate() &&
        month === selectedDate.getMonth() &&
        year === selectedDate.getFullYear()
      ) {
        dayCell.classList.add("selected");
      }

      // Add Click Event for Selection
      dayCell.addEventListener("click", () => {
        // Update State
        selectedDate = new Date(year, month, day);

        // Update UI: Re-render to show selection class
        renderCalendar();
        updateFooter();
      });

      calendarGrid.appendChild(dayCell);
    }
  }

  function updateFooter() {
    if (selectedDate) {
      // Format: "Thu, Jan 01, 2026"
      const options = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      };
      selectedDateDisplay.textContent = selectedDate.toLocaleDateString(
        "en-US",
        options,
      );
    } else {
      selectedDateDisplay.textContent = "None";
    }
  }

  // --- 5. Event Listeners for Navigation ---

  prevBtn.addEventListener("click", () => {
    // Decrease month by 1
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  nextBtn.addEventListener("click", () => {
    // Increase month by 1
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  todayBtn.addEventListener("click", () => {
    // Reset current view to actual today
    currentDate = new Date();
    selectedDate = new Date(); // Optional: Select today as well
    renderCalendar();
    updateFooter();
  });

  // --- 6. Initial Render ---
  renderCalendar();
});

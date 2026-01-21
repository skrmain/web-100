document.addEventListener("DOMContentLoaded", () => {
  // 1. Elements
  const editor = document.getElementById("editor");
  const toolbar = document.getElementById("toolbar");
  const buttons = toolbar.querySelectorAll(".btn[data-cmd]");
  const colorPicker = document.getElementById("color-picker");
  const headingSelector = document.getElementById("heading-selector");
  const statusDisplay = document.getElementById("save-status");
  const wordCountDisplay = document.getElementById("word-count");
  const charCountDisplay = document.getElementById("char-count");
  const printBtn = document.getElementById("print-btn");

  // 2. Initialization & LocalStorage Loading
  const LOCAL_STORAGE_KEY = "docuclone_content";
  const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY);

  if (savedContent) {
    editor.innerHTML = savedContent;
  }
  updateCounts(); // Initialize counts

  // 3. Formatting Logic (WYSIWYG)
  // Using execCommand as requested for "bold", "italic", etc.

  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const cmd = btn.dataset.cmd;

      // Execute the command
      document.execCommand(cmd, false, null);

      // Refocus editor to keep typing
      editor.focus();

      // Force state update immediately for UI feedback
      updateToolbarState();
    });
  });

  // Color Picker Logic
  colorPicker.addEventListener("input", (e) => {
    document.execCommand("foreColor", false, e.target.value);
    editor.focus();
  });

  // Heading Selector Logic
  headingSelector.addEventListener("change", (e) => {
    document.execCommand("formatBlock", false, e.target.value);
    editor.focus();
  });

  // Print Logic
  printBtn.addEventListener("click", () => {
    window.print();
  });

  // 4. State Feedback (Active Buttons)
  // We listen to selectionchange on document to detect cursor position changes
  function updateToolbarState() {
    if (
      document.activeElement !== editor &&
      !editor.contains(document.activeElement)
    )
      return;

    buttons.forEach((btn) => {
      const cmd = btn.dataset.cmd;
      // queryCommandState returns true if the formatting is currently applied
      try {
        if (document.queryCommandState(cmd)) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      } catch (e) {
        // Some commands (like undo/redo) don't have a state
      }
    });

    // Update Heading Dropdown based on current block
    // This is tricky with queryCommandValue, defaulting to P if unsure
    const block = document.queryCommandValue("formatBlock");
    if (block) {
      headingSelector.value = block.toUpperCase();
    }
  }

  document.addEventListener("selectionchange", updateToolbarState);
  editor.addEventListener("keyup", updateToolbarState);
  editor.addEventListener("mouseup", updateToolbarState);

  // 5. Auto-Save System (Debounced)
  let saveTimeoutId;
  const DEBOUNCE_DELAY = 1000; // 1 second

  function saveData() {
    const content = editor.innerHTML;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, content);
      statusDisplay.innerText = "Saved to this device";
      // Optional: visual cue fade out could go here
    } catch (e) {
      statusDisplay.innerText = "Error saving";
      console.error("Storage failed", e);
    }
  }

  // Debounce function wrapper
  function handleInput() {
    // 1. Update UI Status immediately
    statusDisplay.innerText = "Saving...";

    // 2. Clear existing timer
    if (saveTimeoutId) clearTimeout(saveTimeoutId);

    // 3. Set new timer
    saveTimeoutId = setTimeout(saveData, DEBOUNCE_DELAY);

    // 4. Update Word Counts
    updateCounts();
  }

  // Use MutationObserver for robust change detection (covers typing, formatting, pasting)
  const observer = new MutationObserver(handleInput);
  observer.observe(editor, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  // Also listen to input just in case
  editor.addEventListener("input", handleInput);

  // 6. Word Counting Logic
  function updateCounts() {
    const text = editor.innerText || "";
    // Remove empty whitespace entries
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    wordCountDisplay.innerText = `${words.length} words`;
    charCountDisplay.innerText = `${text.length} chars`;
  }
});

/* --- STATE MANAGEMENT --- */
// Participants: Array of strings ["Alice", "Bob"]
let participants = [];
// Expenses: Array of objects { desc, amount, payer, involved: [] }
let expenses = [];

/* --- DOM ELEMENT REFERENCES --- */
const dom = {
  pNameInput: document.getElementById("participant-name"),
  pList: document.getElementById("participant-list"),
  payerSelect: document.getElementById("payer-select"),
  splitCheckboxes: document.getElementById("split-checkboxes"),
  expDesc: document.getElementById("expense-desc"),
  expAmount: document.getElementById("expense-amount"),
  expList: document.getElementById("expense-list"),
  resultsOutput: document.getElementById("results-output"),
};

/* --- INITIALIZATION --- */
function init() {
  loadState(); // Optional: Load from LocalStorage
  renderParticipants();
}

/* --- PARTICIPANT FUNCTIONS --- */
function addParticipant() {
  const name = dom.pNameInput.value.trim();

  // Validation
  if (!name) return alert("Please enter a name.");
  if (participants.includes(name)) return alert("Name already exists.");

  participants.push(name);
  dom.pNameInput.value = ""; // Clear input

  updateUI();
  saveState();
}

function removeParticipant(name) {
  if (confirm(`Remove ${name}? This will clear current expenses.`)) {
    participants = participants.filter((p) => p !== name);
    expenses = []; // Reset expenses to avoid data inconsistencies
    updateUI();
    saveState();
  }
}

/* --- EXPENSE FUNCTIONS --- */
function addExpense() {
  const desc = dom.expDesc.value.trim() || "Untitled";
  const amount = parseFloat(dom.expAmount.value);
  const payer = dom.payerSelect.value;

  // Get checked participants
  const checkboxes = document.querySelectorAll(".participant-checkbox:checked");
  const involved = Array.from(checkboxes).map((cb) => cb.value);

  // Validation
  if (isNaN(amount) || amount <= 0)
    return alert("Please enter a valid amount.");
  if (!payer) return alert("Please select who paid.");
  if (involved.length === 0)
    return alert("Select at least one person to split with.");

  const expense = {
    id: Date.now(),
    desc,
    amount,
    payer,
    involved,
  };

  expenses.push(expense);

  // Clear Form
  dom.expDesc.value = "";
  dom.expAmount.value = "";

  renderExpenses();
  saveState();

  // Auto-recalculate for better UX
  calculateSettlement();
}

/* --- RENDERING FUNCTIONS --- */
function updateUI() {
  renderParticipants();
  renderPayerSelect();
  renderSplitCheckboxes();
  renderExpenses();
}

function renderParticipants() {
  dom.pList.innerHTML = participants
    .map(
      (p) => `
        <li class="tag">
            ${p} <span onclick="removeParticipant('${p}')">&times;</span>
        </li>
    `,
    )
    .join("");
}

function renderPayerSelect() {
  dom.payerSelect.innerHTML =
    `<option value="" disabled selected>Select Payer</option>` +
    participants.map((p) => `<option value="${p}">${p}</option>`).join("");
}

function renderSplitCheckboxes() {
  if (participants.length === 0) {
    dom.splitCheckboxes.innerHTML =
      '<p class="text-muted">Add participants first.</p>';
    return;
  }

  dom.splitCheckboxes.innerHTML = participants
    .map(
      (p) => `
        <label class="checkbox-label">
            <input type="checkbox" class="participant-checkbox" value="${p}" checked>
            ${p}
        </label>
    `,
    )
    .join("");
}

function renderExpenses() {
  if (expenses.length === 0) {
    dom.expList.innerHTML =
      '<p class="text-muted text-center">No expenses recorded yet.</p>';
    return;
  }

  dom.expList.innerHTML = expenses
    .map(
      (e) => `
        <div class="expense-item">
            <div>
                <strong>${e.desc}</strong> <br>
                <small class="text-muted">Paid by ${e.payer}</small>
            </div>
            <div class="money">$${e.amount.toFixed(2)}</div>
        </div>
    `,
    )
    .join("");
}

/* --- CORE LOGIC: SETTLEMENT ALGORITHM --- */
function calculateSettlement() {
  if (participants.length < 2) {
    dom.resultsOutput.innerHTML = "<p>Need at least 2 participants.</p>";
    return;
  }

  // 1. Initialize Balances
  let balances = {};
  participants.forEach((p) => (balances[p] = 0));

  // 2. Calculate Net Balance for each person
  expenses.forEach((exp) => {
    const paidBy = exp.payer;
    const totalAmount = exp.amount;
    const splitCount = exp.involved.length;
    const share = totalAmount / splitCount;

    // The payer gets back the full amount (temporarily)
    balances[paidBy] += totalAmount;

    // Subtract share from everyone involved
    exp.involved.forEach((person) => {
      balances[person] -= share;
    });
  });

  // 3. Separate into Debtors (-) and Creditors (+)
  // Rounding is crucial to avoid floating point errors (e.g., 0.000000001)
  let debtors = [];
  let creditors = [];

  for (const [person, amount] of Object.entries(balances)) {
    const roundedAmount = Math.round(amount * 100) / 100;
    if (roundedAmount < -0.01) debtors.push({ person, amount: roundedAmount });
    if (roundedAmount > 0.01) creditors.push({ person, amount: roundedAmount });
  }

  // Sort to optimize matching (optional, simplifies logic)
  debtors.sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
  creditors.sort((a, b) => b.amount - a.amount); // Descending (most positive first)

  // 4. Generate Transactions (Greedy Algorithm)
  let settlements = [];
  let i = 0; // Debtor pointer
  let j = 0; // Creditor pointer

  while (i < debtors.length && j < creditors.length) {
    let debtor = debtors[i];
    let creditor = creditors[j];

    // The amount to settle is the minimum of (abs(debt), credit)
    let amountToSettle = Math.min(Math.abs(debtor.amount), creditor.amount);

    // Round to 2 decimals
    amountToSettle = Math.round(amountToSettle * 100) / 100;

    // Record transaction
    settlements.push(
      `${debtor.person} pays ${creditor.person} <span class="money">$${amountToSettle.toFixed(2)}</span>`,
    );

    // Update remaining balances
    debtor.amount += amountToSettle;
    creditor.amount -= amountToSettle;

    // Round again to check zero status
    debtor.amount = Math.round(debtor.amount * 100) / 100;
    creditor.amount = Math.round(creditor.amount * 100) / 100;

    // Move pointers if settled
    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  // 5. Render Results
  renderSettlements(settlements, balances);
}

function renderSettlements(settlements, balances) {
  let html = `<h3>Net Balances</h3><ul class="tag-list" style="margin-bottom: 15px;">`;

  for (const [p, amt] of Object.entries(balances)) {
    const color = amt >= 0 ? "var(--success)" : "var(--danger)";
    html += `<li class="tag" style="border-color:${color}">${p}: $${amt.toFixed(2)}</li>`;
  }
  html += `</ul><h3>Settlement Plan</h3>`;

  if (settlements.length === 0) {
    html += `<p class="text-muted">No debts to settle. We are all square! 🎉</p>`;
  } else {
    html += settlements
      .map((s) => `<div class="settlement-item">${s}</div>`)
      .join("");
  }

  dom.resultsOutput.innerHTML = html;
}

/* --- UTILS --- */
function handleEnter(event, callback) {
  if (event.key === "Enter") callback();
}

function saveState() {
  localStorage.setItem("fs_participants", JSON.stringify(participants));
  localStorage.setItem("fs_expenses", JSON.stringify(expenses));
}

function loadState() {
  const p = localStorage.getItem("fs_participants");
  const e = localStorage.getItem("fs_expenses");
  if (p) participants = JSON.parse(p);
  if (e) expenses = JSON.parse(e);
}

// Start App
init();

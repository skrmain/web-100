/**
 * STATE MANAGEMENT
 */
const state = {
  masterKey: null, // CryptoKey (never stored in localStorage)
  vault: [], // Array of decrypted entry objects
  salt: null, // Uint8Array (stored in localStorage)
};

const DOM = {
  authScreen: document.getElementById("auth-screen"),
  vaultScreen: document.getElementById("vault-screen"),
  authForm: document.getElementById("auth-form"),
  authTitle: document.getElementById("auth-title"),
  authBtn: document.getElementById("auth-btn"),
  authMsg: document.getElementById("auth-message"),
  vaultList: document.getElementById("vault-list"),
  lockBtn: document.getElementById("lockBtn"),
  addEntryBtn: document.getElementById("add-entry-btn"),
  entryModal: document.getElementById("entry-modal"),
  entryForm: document.getElementById("entry-form"),
  cancelModal: document.getElementById("cancel-modal"),
  controls: document.getElementById("controls"),
  emptyState: document.getElementById("empty-state"),
};

/**
 * 🔐 CRYPTOGRAPHY MODULE
 * Uses Web Crypto API (AES-GCM)
 */
const Crypto = {
  // 1. Generate a random salt for key derivation
  generateSalt: () => window.crypto.getRandomValues(new Uint8Array(16)),

  // 2. Derive a key from password + salt using PBKDF2
  deriveKey: async (password, salt) => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"],
    );

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000, // High iteration count for security
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false, // Key is not extractable
      ["encrypt", "decrypt"],
    );
  },

  // 3. Encrypt data (Returns object with ciphertext and IV)
  encrypt: async (dataObj, key) => {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const jsonStr = JSON.stringify(dataObj);

    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      enc.encode(jsonStr),
    );

    return {
      cipher: Crypto.buf2hex(ciphertext),
      iv: Crypto.buf2hex(iv),
    };
  },

  // 4. Decrypt data
  decrypt: async (cipherHex, ivHex, key) => {
    try {
      const ciphertext = Crypto.hex2buf(cipherHex);
      const iv = Crypto.hex2buf(ivHex);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext,
      );

      const dec = new TextDecoder();
      return JSON.parse(dec.decode(decrypted));
    } catch (e) {
      console.error("Decryption failed (Wrong password or tampered data)");
      throw e;
    }
  },

  // Helpers for storage (ArrayBuffer <-> Hex String)
  buf2hex: (buffer) => {
    return [...new Uint8Array(buffer)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
  },
  hex2buf: (hexString) => {
    return new Uint8Array(
      hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)),
    );
  },
};

/**
 * 📦 STORAGE MANAGER
 */
const Storage = {
  // Check if user is new or returning
  hasVault: () => localStorage.getItem("pm_salt") !== null,

  // Initialize new vault
  initVault: (saltHex) => {
    localStorage.setItem("pm_salt", saltHex);
    localStorage.setItem("pm_data", JSON.stringify([])); // Empty vault
    // We also store a check value to verify password quickly
    return true;
  },

  // Save current vault state to localStorage
  saveVault: async () => {
    if (!state.masterKey) return;

    // Encrypt every entry individually
    // (Allows loading list without decrypting everything if we optimized,
    // but here we encrypt the whole vault array logic for simplicity or per item.
    // Let's encrypt individual items for scalability).

    const encryptedVault = await Promise.all(
      state.vault.map(async (entry) => {
        return await Crypto.encrypt(entry, state.masterKey);
      }),
    );

    localStorage.setItem("pm_data", JSON.stringify(encryptedVault));
  },

  loadVault: async () => {
    const dataStr = localStorage.getItem("pm_data");
    if (!dataStr) return [];
    const encryptedVault = JSON.parse(dataStr);

    // Decrypt all entries
    const decryptedVault = [];
    for (const item of encryptedVault) {
      const entry = await Crypto.decrypt(item.cipher, item.iv, state.masterKey);
      decryptedVault.push(entry);
    }
    return decryptedVault;
  },

  // Integrity Check: Encrypt a known string "valid"
  setIntegrityCheck: async (key) => {
    const check = await Crypto.encrypt({ status: "valid" }, key);
    localStorage.setItem("pm_check", JSON.stringify(check));
  },

  verifyIntegrity: async (key) => {
    const checkStr = localStorage.getItem("pm_check");
    if (!checkStr) return true; // Legacy or first run
    const check = JSON.parse(checkStr);
    try {
      const res = await Crypto.decrypt(check.cipher, check.iv, key);
      return res.status === "valid";
    } catch (e) {
      return false;
    }
  },
};

/**
 * 🚀 APP LOGIC
 */

// Init Application
function initApp() {
  if (Storage.hasVault()) {
    DOM.authTitle.textContent = "Unlock Vault";
    DOM.authBtn.textContent = "Unlock";
    DOM.authMsg.textContent = "";

    // Load Salt
    const saltHex = localStorage.getItem("pm_salt");
    state.salt = Crypto.hex2buf(saltHex);
  } else {
    DOM.authTitle.textContent = "Create New Vault";
    DOM.authBtn.textContent = "Create & Encrypt";
    DOM.authMsg.textContent = "⚠️ This password cannot be recovered.";

    // Generate new Salt
    state.salt = Crypto.generateSalt();
  }
}

// Authentication / Lock Screen Handler
DOM.authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("master-password").value;

  if (!password) return;
  DOM.authBtn.disabled = true;
  DOM.authBtn.textContent = "Processing...";

  try {
    const key = await Crypto.deriveKey(password, state.salt);

    if (Storage.hasVault()) {
      // Verify Password
      const isValid = await Storage.verifyIntegrity(key);
      if (!isValid) throw new Error("Incorrect Password");

      state.masterKey = key;
      state.vault = await Storage.loadVault();
    } else {
      // Setup New Vault
      state.masterKey = key;
      Storage.initVault(Crypto.buf2hex(state.salt));
      await Storage.setIntegrityCheck(key);
      state.vault = [];
    }

    // Success: Transition UI
    showVaultUI();
    document.getElementById("master-password").value = ""; // clear memory
  } catch (err) {
    DOM.authMsg.textContent = "Incorrect password. Please try again.";
    DOM.authBtn.disabled = false;
    DOM.authBtn.textContent = "Unlock";
    console.error(err);
  }
});

function showVaultUI() {
  DOM.authScreen.classList.add("hidden");
  DOM.vaultScreen.classList.remove("hidden");
  DOM.controls.classList.remove("hidden");
  renderVault();
}

function lockVault() {
  state.masterKey = null;
  state.vault = [];
  DOM.vaultScreen.classList.add("hidden");
  DOM.controls.classList.add("hidden");
  DOM.authScreen.classList.remove("hidden");
  DOM.authBtn.disabled = false;
  DOM.authBtn.textContent = "Unlock";
  DOM.authMsg.textContent = "";
}

DOM.lockBtn.addEventListener("click", lockVault);

/**
 * 🎨 RENDER & CRUD
 */

function renderVault() {
  DOM.vaultList.innerHTML = "";

  if (state.vault.length === 0) {
    DOM.emptyState.classList.remove("hidden");
    return;
  }
  DOM.emptyState.classList.add("hidden");

  state.vault.forEach((entry, index) => {
    const card = document.createElement("div");
    card.className = "entry-card";
    card.innerHTML = `
            <div class="entry-header">
                <span class="site-title">${escapeHTML(entry.site)}</span>
                <button onclick="deleteEntry(${index})" class="btn-danger">✕</button>
            </div>
            <div class="username-display">${escapeHTML(entry.username)}</div>
            
            <div class="secret-field">
                <span class="blur-text" onclick="this.classList.toggle('revealed')">${escapeHTML(entry.password)}</span>
                <button class="btn-secondary" onclick="copyToClipboard('${escapeHTML(entry.password)}')" style="border:none;">📋</button>
            </div>

            <div class="entry-actions">
                <button class="btn-secondary" onclick="copyToClipboard('${escapeHTML(entry.username)}')">Copy User</button>
                <button class="btn-secondary" onclick="editEntry(${index})">Edit</button>
            </div>
        `;
    DOM.vaultList.appendChild(card);
  });
}

// Add/Edit Modal Handlers
let editingIndex = -1;

DOM.addEntryBtn.addEventListener("click", () => {
  editingIndex = -1;
  DOM.entryForm.reset();
  document.getElementById("modal-title").textContent = "Add Credential";
  DOM.entryModal.showModal();
});

DOM.cancelModal.addEventListener("click", () => DOM.entryModal.close());

// Password Generator
document.getElementById("generate-pass").addEventListener("click", () => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let pass = "";
  const array = new Uint32Array(16);
  window.crypto.getRandomValues(array);
  for (let i = 0; i < 16; i++) {
    pass += chars[array[i] % chars.length];
  }
  document.getElementById("password").value = pass;
});

// Save Entry
DOM.entryForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newEntry = {
    site: document.getElementById("site-name").value,
    username: document.getElementById("username").value,
    password: document.getElementById("password").value,
    notes: document.getElementById("notes").value,
    updated: Date.now(),
  };

  if (editingIndex >= 0) {
    state.vault[editingIndex] = newEntry;
  } else {
    state.vault.push(newEntry);
  }

  await Storage.saveVault();
  renderVault();
  DOM.entryModal.close();
});

// Global functions for HTML event handlers
window.deleteEntry = async (index) => {
  if (confirm("Are you sure? This cannot be undone.")) {
    state.vault.splice(index, 1);
    await Storage.saveVault();
    renderVault();
  }
};

window.editEntry = (index) => {
  editingIndex = index;
  const entry = state.vault[index];
  document.getElementById("site-name").value = entry.site;
  document.getElementById("username").value = entry.username;
  document.getElementById("password").value = entry.password;
  document.getElementById("notes").value = entry.notes;
  document.getElementById("modal-title").textContent = "Edit Credential";
  DOM.entryModal.showModal();
};

window.copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  const toast = document.getElementById("toast");
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2000);
};

// Simple HTML escaper to prevent XSS in rendering
function escapeHTML(str) {
  if (!str) return "";
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[tag],
  );
}

// Start
initApp();

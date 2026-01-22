/**
 * SECURITY UTILS
 * Using window.crypto for cryptographically strong random values.
 */
const CryptoUtils = {
  // Generates a 6-digit numeric OTP
  generateOTP: () => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    // Map 32-bit int to 6 digits (000000-999999)
    const otp = array[0] % 1000000;
    return otp.toString().padStart(6, "0");
  },

  // Generates a random alphanumeric token (mocking a hash)
  generateToken: (length = 32) => {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  },

  // Mocks a JWT (Header.Payload.Signature)
  createMockJWT: (email) => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        sub: email,
        iat: Date.now(),
        exp: Date.now() + 3600000,
      }),
    );
    const signature = CryptoUtils.generateToken(16); // Fake signature
    return `${header}.${payload}.${signature}`;
  },
};

/**
 * AUTH SERVICE
 * Simulates a backend server with network delay and "email dispatching".
 */
class AuthService extends EventTarget {
  constructor() {
    super();
    this.pendingAuth = null; // Stores { email, otp, token }
    this.SESSION_KEY = "secure_demo_session";
  }

  // 1. Request Login (Simulates API POST /auth/login)
  async requestLogin(email) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate secrets on "Server"
        const otp = CryptoUtils.generateOTP();
        const token = CryptoUtils.generateToken();

        this.pendingAuth = { email, otp, token };

        // Dispatch event to Virtual Inbox (Decoupled communication)
        this.dispatchEvent(
          new CustomEvent("email:sent", {
            detail: { email, otp, token },
          }),
        );

        resolve({ success: true, message: "Magic link sent" });
      }, 1500); // 1.5s Network Delay
    });
  }

  // 2. Verify OTP or Token (Simulates API POST /auth/verify)
  async verifyCredentials(inputVal) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!this.pendingAuth) {
          reject("No pending authentication found.");
          return;
        }

        const { otp, token, email } = this.pendingAuth;

        // Check if input matches OTP or Token
        if (inputVal === otp || inputVal === token) {
          const jwt = CryptoUtils.createMockJWT(email);
          localStorage.setItem(this.SESSION_KEY, jwt);
          this.pendingAuth = null; // Clear server memory
          resolve({ success: true, user: email, jwt });
        } else {
          reject("Invalid Code or Link");
        }
      }, 800); // 0.8s verify delay
    });
  }

  // 3. Logout
  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    window.location.reload();
  }

  // 4. Check Session
  getSession() {
    const token = localStorage.getItem(this.SESSION_KEY);
    if (!token) return null;

    try {
      // Decode the fake payload
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub; // Return email
    } catch (e) {
      return null;
    }
  }
}

/**
 * UI CONTROLLER
 * Manages DOM updates and wiring.
 */
document.addEventListener("DOMContentLoaded", () => {
  const authService = new AuthService();

  // DOM Elements
  const views = {
    login: document.getElementById("login-view"),
    dashboard: document.getElementById("dashboard-view"),
  };
  const forms = {
    login: document.getElementById("login-form"),
    emailInput: document.getElementById("email"),
    otpInput: document.getElementById("otp-code"),
    sendBtn: document.getElementById("send-btn"),
    verifyBtn: document.getElementById("verify-otp-btn"),
    otpContainer: document.getElementById("otp-container"),
  };
  const inbox = {
    drawer: document.getElementById("virtual-inbox"),
    toggle: document.getElementById("inbox-toggle"),
    list: document.getElementById("email-list"),
    badge: document.getElementById("notification-badge"),
    clear: document.getElementById("clear-inbox"),
  };

  // --- 1. Session Check ---
  const currentUser = authService.getSession();
  if (currentUser) {
    showDashboard(currentUser);
  }

  // --- 2. Login Flow ---
  forms.login.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = forms.emailInput.value;

    // UI Loading State
    setLoading(true);

    await authService.requestLogin(email);

    // UI Success State
    setLoading(false);
    forms.sendBtn.innerHTML = `<span class="btn-text">Check your email</span>`;
    forms.sendBtn.disabled = true;
    forms.otpContainer.classList.remove("hidden");

    // Auto-open inbox for demo purposes
    setTimeout(() => inbox.drawer.classList.add("open"), 500);
  });

  // --- 3. Verify OTP Flow ---
  forms.verifyBtn.addEventListener("click", () =>
    handleVerification(forms.otpInput.value),
  );

  // --- 4. Virtual Inbox Logic ---
  let unreadCount = 0;

  // Listen for the "Server" event
  authService.addEventListener("email:sent", (e) => {
    const { email, otp, token } = e.detail;

    // Remove empty state
    const emptyState = inbox.list.querySelector(".empty-state");
    if (emptyState) emptyState.remove();

    // Create HTML Email
    const emailEl = document.createElement("div");
    emailEl.className = "email-item";
    emailEl.innerHTML = `
            <div class="email-subject">Login to MyApp</div>
            <div class="email-meta">To: ${email} • Just now</div>
            <p style="font-size:0.8rem; margin-bottom:8px;">Click below to sign in:</p>
            <button class="magic-link-btn" data-token="${token}">Sign In Now</button>
            <div style="text-align:center; font-size:0.75rem; margin: 5px 0;">OR use code</div>
            <div class="otp-display">${otp}</div>
        `;

    inbox.list.prepend(emailEl);
    updateBadge(++unreadCount);

    // Bind Magic Link Click inside the inbox
    emailEl
      .querySelector(".magic-link-btn")
      .addEventListener("click", (evt) => {
        const token = evt.target.dataset.token;
        handleVerification(token);
      });
  });

  // Inbox Interactions
  inbox.toggle.addEventListener("click", () => {
    inbox.drawer.classList.toggle("open");
    updateBadge(0); // Clear badge on open
    unreadCount = 0;
  });

  inbox.clear.addEventListener("click", () => {
    inbox.list.innerHTML = '<div class="empty-state">No new emails</div>';
  });

  // --- Helpers ---

  async function handleVerification(credential) {
    const msg = document.getElementById("status-msg");
    msg.textContent = "Verifying...";
    msg.className = "status-msg";

    try {
      const result = await authService.verifyCredentials(credential);
      msg.textContent = "Success! Redirecting...";
      msg.className = "status-msg success";

      setTimeout(() => {
        showDashboard(result.user);
      }, 1000);
    } catch (error) {
      msg.textContent = error;
      msg.className = "status-msg error";
    }
  }

  function showDashboard(email) {
    views.login.classList.add("hidden");
    views.dashboard.classList.remove("hidden");
    document.getElementById("user-email-display").textContent = email;
    document.getElementById("session-id").textContent =
      localStorage.getItem(authService.SESSION_KEY).substring(0, 20) + "...";
    inbox.drawer.classList.remove("open"); // Close inbox
  }

  function setLoading(isLoading) {
    const btn = forms.sendBtn;
    const text = btn.querySelector(".btn-text");
    const loader = btn.querySelector(".loader");

    if (isLoading) {
      text.classList.add("hidden");
      loader.classList.remove("hidden");
      btn.disabled = true;
    } else {
      text.classList.remove("hidden");
      loader.classList.add("hidden");
      btn.disabled = false;
    }
  }

  function updateBadge(count) {
    if (count > 0) {
      inbox.badge.textContent = count;
      inbox.badge.classList.remove("hidden");
    } else {
      inbox.badge.classList.add("hidden");
    }
  }

  document.getElementById("logout-btn").addEventListener("click", () => {
    authService.logout();
  });
});

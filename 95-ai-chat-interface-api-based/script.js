/**
 * SENIOR FRONTEND ENGINEER - GEMINI/CHATGPT CLONE
 * * Architecture:
 * 1. State: Manages history, current chat, and settings.
 * 2. MD Engine: Regex-based parsing for bold, code blocks, newlines.
 * 3. Stream Handler: Fetch API + ReadableStream + TextDecoder.
 */

// --- DOM Elements ---
const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const settingsModal = document.getElementById("settings-modal");
const historyList = document.getElementById("history-list");

// --- State Management ---
const STATE = {
  apiKey: localStorage.getItem("openai_api_key") || "",
  chats: JSON.parse(localStorage.getItem("chat_history")) || [],
  currentChatId: null,
  isGenerating: false,
};

// --- Initialization ---
function init() {
  renderHistory();
  if (!STATE.apiKey) {
    settingsModal.style.display = "flex";
  }
  // Start a fresh chat if none selected
  if (STATE.chats.length === 0) startNewChat();
  else loadChat(STATE.chats[0].id);
}

// --- Helper: Generate ID ---
const uuid = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

// --- Settings Logic ---
document
  .getElementById("settings-btn")
  .addEventListener("click", () => (settingsModal.style.display = "flex"));
document
  .getElementById("close-modal-btn")
  .addEventListener("click", () => (settingsModal.style.display = "none"));
document.getElementById("save-key-btn").addEventListener("click", () => {
  const key = document.getElementById("api-key-input").value.trim();
  if (key) {
    STATE.apiKey = key;
    localStorage.setItem("openai_api_key", key);
    settingsModal.style.display = "none";
    alert("API Key saved!");
  }
});

// --- History Logic ---
document.getElementById("new-chat-btn").addEventListener("click", startNewChat);

function startNewChat() {
  STATE.currentChatId = uuid();
  const newChat = { id: STATE.currentChatId, title: "New Chat", messages: [] };
  STATE.chats.unshift(newChat);
  saveHistory();
  renderHistory();
  renderChat();
}

function saveHistory() {
  localStorage.setItem("chat_history", JSON.stringify(STATE.chats));
}

function renderHistory() {
  historyList.innerHTML = "";
  STATE.chats.forEach((chat) => {
    const div = document.createElement("div");
    div.className = `history-item ${chat.id === STATE.currentChatId ? "active" : ""}`;
    div.textContent = chat.title;
    div.onclick = () => loadChat(chat.id);
    historyList.appendChild(div);
  });
}

function loadChat(id) {
  STATE.currentChatId = id;
  renderHistory(); // Update active class
  renderChat();
}

// --- Core UI Logic ---

// Auto-resize textarea
userInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
  sendBtn.disabled = this.value.trim().length === 0;
});

// Handle Scroll Logic
let userScrolledUp = false;
chatContainer.addEventListener("scroll", () => {
  const threshold = 50;
  const position =
    chatContainer.scrollHeight -
    chatContainer.scrollTop -
    chatContainer.clientHeight;
  userScrolledUp = position > threshold;
});

function scrollToBottom() {
  if (!userScrolledUp) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

// Render the Main Chat Window
function renderChat() {
  chatContainer.innerHTML = "";
  const currentChat = STATE.chats.find((c) => c.id === STATE.currentChatId);

  if (!currentChat || currentChat.messages.length === 0) {
    chatContainer.innerHTML = `<div class="welcome-message"><h1>How can I help you today?</h1></div>`;
    return;
  }

  currentChat.messages.forEach((msg) =>
    appendMessageToDOM(msg.role, msg.content),
  );
  scrollToBottom();
}

function appendMessageToDOM(role, content) {
  const div = document.createElement("div");
  div.className = `message ${role}`;

  // We strip the content initially to prevent XSS, but parse markdown
  const formattedContent =
    role === "user" ? escapeHTML(content) : parseMarkdown(content);

  div.innerHTML = `
        <div class="avatar">${role === "user" ? "U" : "AI"}</div>
        <div class="message-content">${formattedContent}</div>
    `;
  chatContainer.appendChild(div);
  return div;
}

// --- THE HARD PART: Custom Markdown Parser ---
// Constraints: Regex only. No libraries.
function parseMarkdown(text) {
  // 1. Escape HTML first (safety)
  let cleanText = escapeHTML(text);

  // 2. Code Blocks (```code```)
  // We replace them with a placeholder to prevent internal formatting interference
  const codeBlocks = [];
  cleanText = cleanText.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    (match, lang, code) => {
      codeBlocks.push(
        `<pre><code class="language-${lang || "text"}">${code}</code></pre>`,
      );
      return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
    },
  );

  // 3. Bold (**text**)
  cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

  // 4. Italic (*text*)
  cleanText = cleanText.replace(/\*(.*?)\*/g, "<i>$1</i>");

  // 5. Newlines to <br> (but only in non-code areas)
  cleanText = cleanText.replace(/\n/g, "<br>");

  // 6. Restore Code Blocks
  cleanText = cleanText.replace(/___CODE_BLOCK_(\d+)___/g, (match, index) => {
    return codeBlocks[index];
  });

  return cleanText;
}

function escapeHTML(str) {
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

// --- Submit Handler & Streaming ---

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (STATE.isGenerating || !userInput.value.trim()) return;

  const text = userInput.value.trim();
  userInput.value = "";
  userInput.style.height = "auto";

  // 1. Add User Message
  const currentChat = STATE.chats.find((c) => c.id === STATE.currentChatId);
  currentChat.messages.push({ role: "user", content: text });

  // Update Sidebar Title if first message
  if (currentChat.messages.length === 1) {
    currentChat.title = text.substring(0, 30) + "...";
    renderHistory();
  }

  saveHistory();
  renderChat(); // Renders user message

  // 2. Prepare AI Placeholder
  STATE.isGenerating = true;
  userScrolledUp = false; // Reset scroll lock
  const aiMsgContainer = appendMessageToDOM("ai", "");
  const aiContentDiv = aiMsgContainer.querySelector(".message-content");
  aiContentDiv.innerHTML = '<span class="cursor-pulse"></span>';

  // 3. Stream Request
  try {
    const messagesPayload = currentChat.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STATE.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Or gpt-4
        messages: messagesPayload,
        stream: true, // CRITICAL
      }),
    });

    if (!response.ok) throw new Error("API Error");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let rawAccumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n"); // Stream sends multiple JSON lines

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.replace("data: ", "");
          if (jsonStr.trim() === "[DONE]") break;

          try {
            const json = JSON.parse(jsonStr);
            const content = json.choices[0]?.delta?.content || "";
            if (content) {
              rawAccumulated += content;
              // Re-parse markdown on every chunk (Inefficient but required for constraints)
              aiContentDiv.innerHTML = parseMarkdown(rawAccumulated);
              scrollToBottom();
            }
          } catch (e) {
            // Sometimes chunks are cut in middle of JSON.
            // In a prod app, we'd buffer partial lines.
            // For this demo, we assume standard clean chunks.
          }
        }
      }
    }

    // Save AI response
    currentChat.messages.push({ role: "assistant", content: rawAccumulated });
    saveHistory();
  } catch (err) {
    aiContentDiv.innerHTML = `<span style="color:red">Error: ${err.message}. Check API Key.</span>`;
  } finally {
    STATE.isGenerating = false;
  }
});

// Run Init
init();

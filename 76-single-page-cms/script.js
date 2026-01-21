/**
 * SENIOR FRONTEND ARCHITECTURE: VANILLA JS
 * * 1. Store: Centralized State Management (Observer Pattern)
 * 2. Router: Hash-based Routing
 * 3. Components: Functional HTML Generators
 * 4. App: Initialization and Event Delegation
 */

// ==========================================
// 1. SERVICES & UTILITIES
// ==========================================

const Utils = {
  generateId: () => Math.random().toString(36).substr(2, 9),
  formatDate: (isoString) =>
    new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  // Basic sanitization to prevent simple XSS
  sanitize: (str) => {
    const temp = document.createElement("div");
    temp.textContent = str;
    return temp.innerHTML;
  },
};

const StorageService = {
  KEY: "vanilla_cms_data",
  get() {
    const data = localStorage.getItem(this.KEY);
    return data ? JSON.parse(data) : [];
  },
  save(posts) {
    localStorage.setItem(this.KEY, JSON.stringify(posts));
  },
};

// ==========================================
// 2. STATE MANAGEMENT (The "Store")
// ==========================================

const Store = {
  state: {
    posts: StorageService.get(),
    currentRoute: "/",
    params: {},
  },

  // Actions modify state and trigger UI updates
  actions: {
    navigate(path) {
      window.location.hash = path;
      // The router listener will handle the state update
    },

    addPost(postData) {
      const newPost = {
        id: Utils.generateId(),
        title: postData.title,
        content: postData.content,
        updatedAt: new Date().toISOString(),
      };
      Store.state.posts.unshift(newPost); // Add to top
      StorageService.save(Store.state.posts);
      Store.actions.navigate("/");
    },

    updatePost(id, postData) {
      const index = Store.state.posts.findIndex((p) => p.id === id);
      if (index !== -1) {
        Store.state.posts[index] = {
          ...Store.state.posts[index],
          ...postData,
          updatedAt: new Date().toISOString(),
        };
        StorageService.save(Store.state.posts);
        Store.actions.navigate("/");
      }
    },

    deletePost(id) {
      if (confirm("Are you sure you want to delete this post?")) {
        Store.state.posts = Store.state.posts.filter((p) => p.id !== id);
        StorageService.save(Store.state.posts);
        App.render(); // Re-render current view
      }
    },
  },
};

// ==========================================
// 3. ROUTER
// ==========================================

const Router = {
  routes: [
    { path: /^\/$/, view: "Dashboard" },
    { path: /^\/create$/, view: "Editor" },
    { path: /^\/edit\/(.+)$/, view: "Editor" }, // Regex to capture ID
  ],

  parse() {
    const hash = window.location.hash.slice(1) || "/";

    for (const route of this.routes) {
      const match = hash.match(route.path);
      if (match) {
        Store.state.currentRoute = hash;
        Store.state.params = match[1] ? { id: match[1] } : {};
        return route.view;
      }
    }
    return "Dashboard"; // Fallback
  },
};

// ==========================================
// 4. COMPONENTS (View Layer)
// ==========================================

const Components = {
  // Layout wrapper
  AppShell: (contentHTML) => `
        <div class="app-shell">
            <aside class="sidebar">
                <div class="brand">Vanilla CMS</div>
                <nav>
                    <a href="#/" class="nav-link ${Store.state.currentRoute === "#/" || Store.state.currentRoute === "/" ? "active" : ""}">Dashboard</a>
                    <a href="#/create" class="nav-link ${Store.state.currentRoute === "#/create" ? "active" : ""}">+ New Post</a>
                </nav>
            </aside>
            <main class="main-content">
                ${contentHTML}
            </main>
        </div>
    `,

  Dashboard: () => {
    const posts = Store.state.posts;

    if (posts.length === 0) {
      return `
                <div class="empty-state">
                    <h2>No posts yet</h2>
                    <p>Write your first masterpiece.</p>
                    <br>
                    <a href="#/create" class="btn btn-primary">Create Post</a>
                </div>
            `;
    }

    const listItems = posts
      .map(
        (post) => `
            <li class="post-item">
                <div class="post-meta">
                    <a href="#/edit/${post.id}" class="post-title">${Utils.sanitize(post.title)}</a>
                    <span class="post-date">${Utils.formatDate(post.updatedAt)}</span>
                </div>
                <div class="post-actions">
                    <a href="#/edit/${post.id}" class="btn btn-ghost">Edit</a>
                    <button class="btn btn-danger" onclick="Store.actions.deletePost('${post.id}')">Delete</button>
                </div>
            </li>
        `,
      )
      .join("");

    return `
            <div class="dashboard">
                <h1>Posts</h1>
                <ul class="post-list">
                    ${listItems}
                </ul>
            </div>
        `;
  },

  Editor: () => {
    const isEditMode = !!Store.state.params.id;
    let post = { title: "", content: "" };

    if (isEditMode) {
      post = Store.state.posts.find((p) => p.id === Store.state.params.id);
      if (!post) return `<h2>Post not found</h2> <a href="#/">Go Back</a>`;
    }

    return `
            <div class="editor-container">
                <form id="post-form">
                    <div class="editor-header">
                        <a href="#/" class="btn btn-ghost">Cancel</a>
                        <button type="submit" class="btn btn-primary">${isEditMode ? "Update" : "Publish"}</button>
                    </div>
                    
                    <input type="text" 
                           id="title" 
                           class="input-title" 
                           placeholder="Untitled" 
                           value="${Utils.sanitize(post.title)}" 
                           autocomplete="off"
                           required>
                           
                    <textarea id="content" 
                              class="input-content" 
                              placeholder="Tell your story..." 
                              required>${Utils.sanitize(post.content)}</textarea>
                </form>
            </div>
        `;
  },
};

// ==========================================
// 5. APPLICATION CORE
// ==========================================

const App = {
  root: document.getElementById("root"),

  init() {
    // Event Listeners
    window.addEventListener("hashchange", () => this.render());
    window.addEventListener("submit", this.handleFormSubmit);

    // Initial Render
    this.render();
  },

  // The Render Loop: Clears root, determines view, paints HTML
  render() {
    const viewName = Router.parse();
    const contentHTML = Components[viewName]();
    this.root.innerHTML = Components.AppShell(contentHTML);
  },

  // Centralized Event Handlers
  handleFormSubmit(e) {
    if (e.target.id === "post-form") {
      e.preventDefault();
      const title = document.getElementById("title").value;
      const content = document.getElementById("content").value;

      if (Store.state.params.id) {
        Store.actions.updatePost(Store.state.params.id, { title, content });
      } else {
        Store.actions.addPost({ title, content });
      }
    }
  },
};

// Start the engine
App.init();

// Expose Store globally for inline event handlers (onclick="Store.actions...")
window.Store = Store;

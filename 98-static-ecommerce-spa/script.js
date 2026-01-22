/**
 * SENIOR ARCHITECT NOTES:
 * 1. Data Source: Hardcoded as requested, using Unsplash IDs for high-quality imagery.
 * 2. State Management: 'CartStore' class uses Singleton pattern + Observer pattern.
 * 3. Routing: Hash-based routing to handle navigation without page reloads.
 */

// --- 1. MOCK DATA ---
const PRODUCTS = [
  {
    id: 1,
    name: "Minimalist Watch",
    price: 129.99,
    category: "Accessories",
    image:
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 2,
    name: "Leather Tote",
    price: 189.5,
    category: "Accessories",
    image:
      "https://images.unsplash.com/photo-1590874102752-ce22d84f5fa1?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    name: "Ceramic Vase",
    price: 45.0,
    category: "Home",
    image:
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 4,
    name: "Wireless Headphones",
    price: 249.99,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 5,
    name: "Cotton Crewneck",
    price: 35.0,
    category: "Clothing",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 6,
    name: "Running Sneakers",
    price: 110.0,
    category: "Clothing",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 7,
    name: "Smart Speaker",
    price: 89.99,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 8,
    name: "Linen Sheets",
    price: 150.0,
    category: "Home",
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 9,
    name: "Sunglasses",
    price: 145.0,
    category: "Accessories",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 10,
    name: "Desk Lamp",
    price: 65.0,
    category: "Home",
    image:
      "https://images.unsplash.com/photo-1507473888900-52e1ad145924?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 11,
    name: "Denim Jacket",
    price: 85.0,
    category: "Clothing",
    image:
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 12,
    name: "Mechanical Keyboard",
    price: 160.0,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 13,
    name: "Travel Backpack",
    price: 95.0,
    category: "Accessories",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 14,
    name: "Coffee Maker",
    price: 199.0,
    category: "Home",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 15,
    name: "Hoodie",
    price: 45.0,
    category: "Clothing",
    image:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 16,
    name: "Tablet",
    price: 350.0,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 17,
    name: "Wall Art",
    price: 120.0,
    category: "Home",
    image:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 18,
    name: "Beanie",
    price: 25.0,
    category: "Clothing",
    image:
      "https://images.unsplash.com/photo-1576036195536-bb9ea3c713c4?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 19,
    name: "Camera Lens",
    price: 450.0,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 20,
    name: "Wallet",
    price: 55.0,
    category: "Accessories",
    image:
      "https://images.unsplash.com/photo-1627123424574-1800390cb1d5?auto=format&fit=crop&w=600&q=80",
  },
];

// --- 2. STATE MANAGEMENT (CartStore) ---
class CartStore {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem("luminary_cart")) || [];
    this.subscribers = [];
    this.taxRate = 0.08;
  }

  subscribe(callback) {
    this.subscribers.push(callback);
  }

  notify() {
    localStorage.setItem("luminary_cart", JSON.stringify(this.cart));
    this.subscribers.forEach((cb) => cb(this));
  }

  add(product, qty = 1) {
    const existing = this.cart.find((item) => item.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      this.cart.push({ ...product, qty });
    }
    this.notify();
  }

  remove(id) {
    this.cart = this.cart.filter((item) => item.id !== id);
    this.notify();
  }

  updateQty(id, change) {
    const item = this.cart.find((i) => i.id === id);
    if (item) {
      item.qty += change;
      if (item.qty <= 0) this.remove(id);
      else this.notify();
    }
  }

  clear() {
    this.cart = [];
    this.notify();
  }

  getTotals() {
    const subtotal = this.cart.reduce(
      (sum, item) => sum + item.price * item.qty,
      0,
    );
    const tax = subtotal * this.taxRate;
    return {
      count: this.cart.reduce((c, i) => c + i.qty, 0),
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: (subtotal + tax).toFixed(2),
    };
  }
}

const store = new CartStore();

// --- 3. UI RENDERERS ---

const formatPrice = (price) => `$${parseFloat(price).toFixed(2)}`;

// Header Updater (Observer)
store.subscribe((state) => {
  const badge = document.getElementById("cart-count");
  const { count } = state.getTotals();
  badge.textContent = count;

  // Animation
  badge.classList.remove("bounce");
  void badge.offsetWidth; // Trigger reflow
  badge.classList.add("bounce");
});

// Shop View
function renderShop(container) {
  const urlParams = new URLSearchParams(window.location.hash.split("?")[1]);
  const activeCategory = urlParams.get("category");

  let filtered = activeCategory
    ? PRODUCTS.filter((p) => p.category === activeCategory)
    : PRODUCTS;

  const categories = [...new Set(PRODUCTS.map((p) => p.category))];

  container.innerHTML = `
        <div class="container shop-layout fade-in">
            <aside class="sidebar">
                <h3>Categories</h3>
                <div class="filter-group">
                    <a href="#/shop" class="filter-btn ${!activeCategory ? "active" : ""}">All Products</a>
                    ${categories
                      .map(
                        (cat) => `
                        <a href="#/shop?category=${cat}" class="filter-btn ${activeCategory === cat ? "active" : ""}">${cat}</a>
                    `,
                      )
                      .join("")}
                </div>
            </aside>
            <section class="product-grid">
                ${filtered
                  .map(
                    (p) => `
                    <div class="product-card" onclick="window.location.hash = '#/product/${p.id}'">
                        <img src="${p.image}" class="card-img" alt="${p.name}">
                        <div class="card-info">
                            <h4>${p.name}</h4>
                            <p>${p.category}</p>
                            <span class="price">${formatPrice(p.price)}</span>
                        </div>
                    </div>
                `,
                  )
                  .join("")}
            </section>
        </div>
    `;
}

// Product Detail View
function renderProduct(container, id) {
  const product = PRODUCTS.find((p) => p.id === parseInt(id));

  if (!product) {
    container.innerHTML = `<div class="container" style="padding:100px; text-align:center"><h1>404</h1><p>Product not found.</p><a href="#/shop" class="btn">Back to Shop</a></div>`;
    return;
  }

  // Related products (Random 3 from same category, excluding current)
  const related = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id,
  )
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  container.innerHTML = `
        <div class="container fade-in">
            <div class="product-detail">
                <img src="${product.image}" class="detail-img" alt="${product.name}">
                <div class="detail-info">
                    <p>${product.category}</p>
                    <h1>${product.name}</h1>
                    <span class="price">${formatPrice(product.price)}</span>
                    <p>Experience premium quality with our ${product.name}. Designed for durability and style, this item fits perfectly into your modern lifestyle.</p>
                    <button id="add-to-cart-btn" class="btn">Add to Cart</button>
                </div>
            </div>
            
            <div style="margin-top: 60px;">
                <h3 style="margin-bottom: 20px;">You Might Also Like</h3>
                <div class="product-grid">
                    ${related
                      .map(
                        (p) => `
                        <div class="product-card" onclick="window.location.hash = '#/product/${p.id}'">
                            <img src="${p.image}" class="card-img" alt="${p.name}">
                            <div class="card-info">
                                <h4>${p.name}</h4>
                                <span class="price">${formatPrice(p.price)}</span>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        </div>
    `;

  // Micro-interaction logic
  const btn = document.getElementById("add-to-cart-btn");
  btn.onclick = (e) => {
    e.stopPropagation();
    btn.classList.add("loading");

    // Mock API Latency
    setTimeout(() => {
      store.add(product);
      btn.classList.remove("loading");
      btn.classList.add("success");
      btn.textContent = "Added!";

      setTimeout(() => {
        btn.classList.remove("success");
        btn.textContent = "Add to Cart";
      }, 2000);
    }, 600);
  };
}

// Cart View
function renderCart(container) {
  const { cart } = store;
  const totals = store.getTotals();

  if (cart.length === 0) {
    container.innerHTML = `
            <div class="container cart-page fade-in" style="text-align:center">
                <h2>Your Cart is Empty</h2>
                <p style="margin: 20px 0;">Looks like you haven't made a choice yet.</p>
                <a href="#/shop" class="btn">Start Shopping</a>
            </div>
        `;
    return;
  }

  container.innerHTML = `
        <div class="container cart-page fade-in">
            <h2>Your Cart (${totals.count})</h2>
            <div class="cart-list">
                ${cart
                  .map(
                    (item) => `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.name}">
                        <div>
                            <h4>${item.name}</h4>
                            <small>${formatPrice(item.price)}</small>
                        </div>
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="updateItem(${item.id}, -1)">-</button>
                            <span>${item.qty}</span>
                            <button class="qty-btn" onclick="updateItem(${item.id}, 1)">+</button>
                        </div>
                        <div>${formatPrice(item.price * item.qty)}</div>
                    </div>
                `,
                  )
                  .join("")}
            </div>
            <div class="cart-summary">
                <div class="summary-row"><span>Subtotal:</span> <span>$${totals.subtotal}</span></div>
                <div class="summary-row"><span>Tax (8%):</span> <span>$${totals.tax}</span></div>
                <div class="summary-row total"><span>Total:</span> <span>$${totals.total}</span></div>
                <button onclick="handleCheckout()" class="btn" style="margin-top: 20px; width: 100%;">Checkout</button>
            </div>
        </div>
    `;
}

// Global functions for inline HTML event handlers
window.updateItem = (id, delta) => store.updateQty(id, delta);
window.handleCheckout = () => {
  const modal = document.getElementById("checkout-modal");
  modal.classList.remove("hidden");
  setTimeout(() => {
    store.clear();
    modal.classList.add("hidden");
    window.location.hash = "#/shop";
    alert("Payment Successful! Thank you for your order.");
  }, 2000);
};

// --- 4. ROUTER ---
const router = () => {
  const app = document.getElementById("app-root");
  // Default to shop if hash is empty
  let hash = window.location.hash || "#/shop";

  // Normalize hash (remove query params for matching)
  const [path, query] = hash.split("?");

  if (path === "#/shop") {
    renderShop(app);
  } else if (path === "#/cart") {
    renderCart(app);
  } else if (path.startsWith("#/product/")) {
    const id = path.split("/")[2];
    renderProduct(app, id);
  } else {
    // Fallback
    window.location.hash = "#/shop";
  }

  // Scroll to top on route change
  window.scrollTo(0, 0);
};

// Initialize Router
window.addEventListener("hashchange", router);
window.addEventListener("load", router);

/* =========================================
   1. MARKET ENGINE & DATA
   ========================================= */

const STOCK_DATA = [
  { symbol: "AAPL", price: 150.0, volatility: 0.02 },
  { symbol: "GOOGL", price: 2800.0, volatility: 0.015 },
  { symbol: "TSLA", price: 700.0, volatility: 0.04 }, // High volatility
  { symbol: "AMZN", price: 3400.0, volatility: 0.012 },
  { symbol: "MSFT", price: 299.0, volatility: 0.015 },
  { symbol: "NFLX", price: 550.0, volatility: 0.03 },
];

class MarketEngine {
  constructor(stocks) {
    // Create deep copy to avoid mutating config
    this.stocks = stocks.map((s) => ({
      ...s,
      startPrice: s.price,
      change: 0,
    }));
    this.callbacks = [];
    this.isRunning = false;
  }

  // Register UI updates
  subscribe(callback) {
    this.callbacks.push(callback);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    // The Market Tick: 2 seconds
    setInterval(() => this.tick(), 2000);
  }

  tick() {
    this.stocks.forEach((stock) => {
      // RANDOM WALK ALGORITHM
      // Calculate random percentage change based on volatility
      // (Math.random() - 0.5) generates -0.5 to 0.5
      // Multiply by volatility (e.g., 0.02) -> +/- 1% swings typically
      const move = (Math.random() - 0.5) * 2 * stock.volatility;

      const oldPrice = stock.price;
      const newPrice = oldPrice * (1 + move);

      stock.price = parseFloat(newPrice.toFixed(2)); // Round to 2 decimals
      stock.change =
        ((stock.price - stock.startPrice) / stock.startPrice) * 100;
      stock.moveDirection = stock.price > oldPrice ? "up" : "down";
    });

    this.notify();
  }

  notify() {
    this.callbacks.forEach((cb) => cb(this.stocks));
  }

  getStock(symbol) {
    return this.stocks.find((s) => s.symbol === symbol);
  }
}

/* =========================================
   2. PORTFOLIO LOGIC
   ========================================= */

class Portfolio {
  constructor(initialCash = 10000) {
    this.cash = initialCash;
    this.holdings = {}; // { 'AAPL': 10 }
    this.history = []; // Array of transaction objects
  }

  buy(symbol, price, quantity) {
    const cost = price * quantity;
    if (cost > this.cash) return { success: false, msg: "Insufficient Funds" };

    this.cash -= cost;
    this.holdings[symbol] = (this.holdings[symbol] || 0) + quantity;

    this.logTransaction("BUY", symbol, price, quantity);
    return { success: true, msg: `Bought ${quantity} ${symbol} @ $${price}` };
  }

  sell(symbol, price, quantity) {
    const currentQty = this.holdings[symbol] || 0;
    if (currentQty < quantity)
      return { success: false, msg: "Not enough shares" };

    const revenue = price * quantity;
    this.cash += revenue;
    this.holdings[symbol] -= quantity;

    // Clean up 0 holdings
    if (this.holdings[symbol] === 0) delete this.holdings[symbol];

    this.logTransaction("SELL", symbol, price, quantity);
    return { success: true, msg: `Sold ${quantity} ${symbol} @ $${price}` };
  }

  logTransaction(type, symbol, price, qty) {
    this.history.unshift({
      type,
      symbol,
      price,
      qty,
      total: price * qty,
      time: new Date().toLocaleTimeString(),
    });
  }

  getNetWorth(marketStocks) {
    let stockValue = 0;
    for (const [symbol, qty] of Object.entries(this.holdings)) {
      const stock = marketStocks.find((s) => s.symbol === symbol);
      if (stock) stockValue += stock.price * qty;
    }
    return this.cash + stockValue;
  }
}

/* =========================================
   3. UI CONTROLLER
   ========================================= */

const fmtMoney = (num) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    num,
  );
const fmtPct = (num) => `${num > 0 ? "+" : ""}${num.toFixed(2)}%`;

class UI {
  constructor(market, portfolio) {
    this.market = market;
    this.portfolio = portfolio;
    this.selectedSymbol = null;

    // DOM Elements
    this.tableBody = document.getElementById("market-body");
    this.netWorthEl = document.getElementById("display-net-worth");
    this.cashEl = document.getElementById("display-cash");

    this.tradeSymbolEl = document.getElementById("trade-symbol");
    this.tradePriceEl = document.getElementById("trade-price");
    this.tradeQtyInput = document.getElementById("trade-qty");
    this.btnBuy = document.getElementById("btn-buy");
    this.btnSell = document.getElementById("btn-sell");
    this.tradeMsg = document.getElementById("trade-msg");
    this.maxBuyHint = document.getElementById("max-buy-hint");

    this.holdingsList = document.getElementById("holdings-list");
    this.historyList = document.getElementById("history-list");

    this.initEventListeners();
  }

  initEventListeners() {
    // Stock Selection
    this.tableBody.addEventListener("click", (e) => {
      const row = e.target.closest("tr");
      if (!row) return;
      this.selectStock(row.dataset.symbol);
    });

    // Trade Buttons
    this.btnBuy.addEventListener("click", () => this.executeTrade("buy"));
    this.btnSell.addEventListener("click", () => this.executeTrade("sell"));

    // Input validation for visual feedback
    this.tradeQtyInput.addEventListener("input", () => this.updateMaxBuyHint());

    // Tab Switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document
          .querySelectorAll(".tab-btn")
          .forEach((b) => b.classList.remove("active"));
        document
          .querySelectorAll(".tab-content")
          .forEach((c) => c.classList.remove("active"));

        e.target.classList.add("active");
        document
          .getElementById(`tab-${e.target.dataset.tab}`)
          .classList.add("active");
      });
    });
  }

  selectStock(symbol) {
    this.selectedSymbol = symbol;

    // Highlight row
    document
      .querySelectorAll("tr")
      .forEach((r) => r.classList.remove("selected"));
    const row = document.querySelector(`tr[data-symbol="${symbol}"]`);
    if (row) row.classList.add("selected");

    // Enable UI
    this.btnBuy.disabled = false;
    this.btnSell.disabled = false;
    this.tradeMsg.textContent = ""; // Clear errors

    this.updateTradePanel();
  }

  updateTradePanel() {
    if (!this.selectedSymbol) return;

    const stock = this.market.getStock(this.selectedSymbol);
    this.tradeSymbolEl.textContent = stock.symbol;
    this.tradePriceEl.textContent = fmtMoney(stock.price);

    // Color code price
    this.tradePriceEl.className = `price-display ${stock.moveDirection === "up" ? "color-up" : "color-down"}`;

    this.updateMaxBuyHint();
  }

  updateMaxBuyHint() {
    if (!this.selectedSymbol) return;
    const stock = this.market.getStock(this.selectedSymbol);
    const max = Math.floor(this.portfolio.cash / stock.price);
    this.maxBuyHint.textContent = `Max buy: ${max} shares`;
  }

  executeTrade(type) {
    const qty = parseInt(this.tradeQtyInput.value);
    if (qty <= 0 || isNaN(qty)) {
      this.showTradeMessage("Invalid Quantity", "down");
      return;
    }

    const stock = this.market.getStock(this.selectedSymbol);
    let result;

    if (type === "buy") {
      result = this.portfolio.buy(stock.symbol, stock.price, qty);
    } else {
      result = this.portfolio.sell(stock.symbol, stock.price, qty);
    }

    this.showTradeMessage(result.msg, result.success ? "up" : "down");

    if (result.success) {
      this.updateDashboard();
      this.updateMaxBuyHint(); // Recalculate max buy after cash change
    }
  }

  showTradeMessage(msg, type) {
    this.tradeMsg.textContent = msg;
    this.tradeMsg.className = `trade-message color-${type}`;
    setTimeout(() => (this.tradeMsg.textContent = ""), 3000);
  }

  // Main render loop called by Market Engine
  render(stocks) {
    // 1. Update Market Table
    // If table empty, build initial rows
    if (this.tableBody.children.length === 0) {
      this.tableBody.innerHTML = stocks
        .map(
          (s) => `
                <tr data-symbol="${s.symbol}">
                    <td><strong>${s.symbol}</strong></td>
                    <td class="price-cell">${fmtMoney(s.price)}</td>
                    <td class="change-cell">0.00%</td>
                </tr>
            `,
        )
        .join("");
    } else {
      // Update existing rows
      stocks.forEach((s) => {
        const row = document.querySelector(`tr[data-symbol="${s.symbol}"]`);
        const priceCell = row.querySelector(".price-cell");
        const changeCell = row.querySelector(".change-cell");

        // Check direction for flashing
        const prevPrice = parseFloat(priceCell.dataset.rawPrice || s.price);
        const direction = s.price > prevPrice ? "up" : "down";

        // Only flash if price changed
        if (s.price !== prevPrice) {
          priceCell.dataset.rawPrice = s.price;
          row.className = s.symbol === this.selectedSymbol ? "selected" : ""; // maintain selection

          // Reset animation hack
          row.classList.remove("flash-up", "flash-down");
          void row.offsetWidth; // trigger reflow
          row.classList.add(direction === "up" ? "flash-up" : "flash-down");
        }

        priceCell.textContent = fmtMoney(s.price);
        priceCell.className = `price-cell ${direction === "up" ? "color-up" : "color-down"}`;

        changeCell.textContent = fmtPct(s.change);
        changeCell.className = `change-cell ${s.change >= 0 ? "color-up" : "color-down"}`;
      });
    }

    // 2. Update Trade Panel (if stock selected)
    this.updateTradePanel();

    // 3. Update Dashboard Numbers (Net Worth fluctuates with market)
    this.updateDashboard();
  }

  updateDashboard() {
    // Header Metrics
    const netWorth = this.portfolio.getNetWorth(this.market.stocks);
    this.netWorthEl.textContent = fmtMoney(netWorth);
    this.cashEl.textContent = fmtMoney(this.portfolio.cash);

    // Holdings List
    const holdingsKeys = Object.keys(this.portfolio.holdings);
    if (holdingsKeys.length === 0) {
      this.holdingsList.innerHTML =
        '<li class="empty-state">No active holdings</li>';
    } else {
      this.holdingsList.innerHTML = holdingsKeys
        .map((symbol) => {
          const qty = this.portfolio.holdings[symbol];
          const currentPrice = this.market.getStock(symbol).price;
          const totalVal = currentPrice * qty;
          return `
                    <li class="list-item">
                        <div>
                            <strong>${symbol}</strong>
                            <small>${qty} Shares</small>
                        </div>
                        <div class="text-right">
                            <div>${fmtMoney(totalVal)}</div>
                            <small>@ ${fmtMoney(currentPrice)}</small>
                        </div>
                    </li>
                `;
        })
        .join("");
    }

    // History List
    if (this.portfolio.history.length === 0) {
      this.historyList.innerHTML =
        '<li class="empty-state">No transactions yet</li>';
    } else {
      this.historyList.innerHTML = this.portfolio.history
        .slice(0, 10)
        .map(
          (t) => `
                <li class="list-item">
                    <div>
                        <strong class="${t.type === "BUY" ? "color-up" : "color-down"}">${t.type} ${t.symbol}</strong>
                        <small>${t.time}</small>
                    </div>
                    <div>${fmtMoney(t.total)}</div>
                </li>
            `,
        )
        .join("");
    }
  }
}

// INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  const market = new MarketEngine(STOCK_DATA);
  const portfolio = new Portfolio(10000);
  const ui = new UI(market, portfolio);

  market.subscribe((stocks) => ui.render(stocks));
  market.start();
});

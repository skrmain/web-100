/* =========================================
   REGION 1: MICRO ENGINE CORE & UTILS
   ========================================= */

/**
 * Handles keyboard state.
 * Decouples DOM events from the Game Loop.
 */
class InputHandler {
  constructor() {
    this.keys = {};
    window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
    window.addEventListener("keyup", (e) => (this.keys[e.code] = false));
  }

  isDown(code) {
    return !!this.keys[code];
  }
}

/**
 * Static Physics Utilities.
 * Uses Axis-Aligned Bounding Box (AABB) logic.
 */
class Physics {
  // Check if two rectangles overlap
  static checkCollision(r1, r2) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  // Helps center text or objects
  static center(obj, canvasWidth, canvasHeight) {
    obj.x = (canvasWidth - obj.width) / 2;
    obj.y = (canvasHeight - obj.height) / 2;
  }
}

/**
 * Base Entity Class.
 * All game objects inherit from this.
 */
class GameObject {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.vx = 0;
    this.vy = 0;
    this.markedForDeletion = false;
  }

  update(dt) {
    // Basic Euler integration
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

/* =========================================
   REGION 2: GAME SPECIFIC LOGIC
   ========================================= */

class Player extends GameObject {
  constructor(x, y) {
    super(x, y, 30, 30, "#0ff"); // Cyan Player
    this.speed = 300; // Pixels per second
  }

  update(dt, input, walls, canvasWidth, canvasHeight) {
    // 1. Reset Velocity
    this.vx = 0;
    this.vy = 0;

    // 2. Handle Input
    if (input.isDown("ArrowUp") || input.isDown("KeyW")) this.vy = -this.speed;
    if (input.isDown("ArrowDown") || input.isDown("KeyS")) this.vy = this.speed;
    if (input.isDown("ArrowLeft") || input.isDown("KeyA"))
      this.vx = -this.speed;
    if (input.isDown("ArrowRight") || input.isDown("KeyD"))
      this.vx = this.speed;

    // 3. Move & Resolve Collisions (Axis Separation)

    // Move X
    this.x += this.vx * dt;
    // Check Wall Collision X
    for (const wall of walls) {
      if (Physics.checkCollision(this, wall)) {
        // Resolve X: If moving right, snap to left of wall, etc.
        if (this.vx > 0) this.x = wall.x - this.width;
        else if (this.vx < 0) this.x = wall.x + wall.width;
      }
    }

    // Move Y
    this.y += this.vy * dt;
    // Check Wall Collision Y
    for (const wall of walls) {
      if (Physics.checkCollision(this, wall)) {
        // Resolve Y
        if (this.vy > 0) this.y = wall.y - this.height;
        else if (this.vy < 0) this.y = wall.y + wall.height;
      }
    }

    // 4. Screen Bounds
    this.x = Math.max(0, Math.min(this.x, canvasWidth - this.width));
    this.y = Math.max(0, Math.min(this.y, canvasHeight - this.height));
  }
}

class Coin extends GameObject {
  constructor(x, y) {
    super(x, y, 15, 15, "#ffd700"); // Gold
    this.timer = 0;
  }

  // Override update to add a simple visual pulse effect
  update(dt) {
    this.timer += dt * 5;
    // Sine wave scaling effect
    const scale = 1 + Math.sin(this.timer) * 0.2;
    // Note: For collision to remain accurate, we don't change actual width/height,
    // just visual drawing logic or centered offset.
    // Keeping it simple for this demo.
  }
}

/**
 * Main Game Controller.
 * Manages states, loop, and high-level logic.
 */
class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.input = new InputHandler();
    this.lastTime = 0;

    // Game State Enum
    this.STATES = { MENU: 0, PLAYING: 1, GAMEOVER: 2 };
    this.currentState = this.STATES.MENU;

    // Entities
    this.player = null;
    this.walls = [];
    this.coins = [];

    this.score = 0;
    this.fps = 0;

    // Bind loop
    this.loop = this.loop.bind(this);
  }

  init() {
    this.resetGame();
    requestAnimationFrame(this.loop);
  }

  resetGame() {
    this.score = 0;
    this.player = new Player(100, 100);
    this.walls = [];
    this.coins = [];

    // Level Design (Simple Map)
    // 5 random walls
    for (let i = 0; i < 5; i++) {
      this.walls.push(
        new GameObject(
          200 + Math.random() * 400,
          100 + Math.random() * 400,
          50 + Math.random() * 100,
          20,
          "#d32f2f", // Red Wall
        ),
      );
    }

    // Spawn Coins
    this.spawnCoins(10);
  }

  spawnCoins(count) {
    for (let i = 0; i < count; i++) {
      let safe = false;
      let c;
      // Ensure coins don't spawn inside walls
      while (!safe) {
        c = new Coin(
          Math.random() * (this.width - 50),
          Math.random() * (this.height - 50),
        );
        safe = true;
        for (let w of this.walls) {
          if (Physics.checkCollision(c, w)) safe = false;
        }
      }
      this.coins.push(c);
    }
  }

  /* --- THE GAME LOOP --- */
  loop(timestamp) {
    // Calculate Delta Time (in seconds)
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    this.fps = Math.round(1 / dt);

    // Clear Screen
    this.ctx.fillStyle = "#111";
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.drawGrid();

    // State Machine
    switch (this.currentState) {
      case this.STATES.MENU:
        this.updateMenu();
        this.drawMenu();
        break;
      case this.STATES.PLAYING:
        this.updatePlaying(dt);
        this.drawPlaying();
        break;
      case this.STATES.GAMEOVER:
        this.updateGameOver();
        this.drawGameOver();
        break;
    }

    requestAnimationFrame(this.loop);
  }

  /* --- STATE LOGIC --- */

  // MENU
  updateMenu() {
    if (this.input.isDown("Enter")) {
      this.resetGame();
      this.currentState = this.STATES.PLAYING;
    }
  }
  drawMenu() {
    this.ctx.fillStyle = "white";
    this.ctx.font = '30px "Courier New"';
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "MICRO ENGINE DEMO",
      this.width / 2,
      this.height / 2 - 40,
    );
    this.ctx.font = '20px "Courier New"';
    this.ctx.fillStyle = "#0ff";
    this.ctx.fillText(
      "Press ENTER to Start",
      this.width / 2,
      this.height / 2 + 20,
    );
    this.ctx.fillStyle = "#aaa";
    this.ctx.fillText(
      "Arrow Keys to Move",
      this.width / 2,
      this.height / 2 + 60,
    );
  }

  // PLAYING
  updatePlaying(dt) {
    // Update Player (Passes dt, input, and walls for resolution)
    this.player.update(dt, this.input, this.walls, this.width, this.height);

    // Update Coins
    this.coins.forEach((c) => c.update(dt));

    // Check Coin Collection
    this.coins = this.coins.filter((coin) => {
      if (Physics.checkCollision(this.player, coin)) {
        this.score += 10;
        return false; // Remove coin
      }
      return true; // Keep coin
    });

    // Win Condition (All coins collected) -> Just spawn more for endless mode
    if (this.coins.length === 0) {
      this.spawnCoins(5);
    }

    // Game Over Trigger (Arbitrary: If player hits 'Q' or specific logic)
    // For this demo, let's say colliding with a specific "Trap" ends game.
    // We will just use 'Q' to simulate dying for testing,
    // or we could make Walls deadly. Let's keep walls as obstacles.
  }

  drawPlaying() {
    // Draw Walls
    this.walls.forEach((w) => w.draw(this.ctx));
    // Draw Coins
    this.coins.forEach((c) => c.draw(this.ctx));
    // Draw Player
    this.player.draw(this.ctx);
    // Draw HUD
    this.drawHUD();
  }

  // GAME OVER
  updateGameOver() {
    if (this.input.isDown("KeyR")) {
      this.resetGame();
      this.currentState = this.STATES.PLAYING;
    }
  }
  drawGameOver() {
    this.ctx.fillStyle = "red";
    this.ctx.font = '40px "Courier New"';
    this.ctx.textAlign = "center";
    this.ctx.fillText("GAME OVER", this.width / 2, this.height / 2 - 20);
    this.ctx.fillStyle = "white";
    this.ctx.font = '20px "Courier New"';
    this.ctx.fillText(
      `Final Score: ${this.score}`,
      this.width / 2,
      this.height / 2 + 30,
    );
    this.ctx.fillStyle = "#0ff";
    this.ctx.fillText(
      "Press R to Restart",
      this.width / 2,
      this.height / 2 + 70,
    );
  }

  /* --- HELPERS --- */
  drawHUD() {
    this.ctx.fillStyle = "white";
    this.ctx.font = '20px "Courier New"';
    this.ctx.textAlign = "left";
    this.ctx.fillText(`SCORE: ${this.score}`, 20, 30);

    this.ctx.textAlign = "right";
    this.ctx.fillStyle = "#0f0";
    this.ctx.fillText(`FPS: ${this.fps}`, this.width - 20, 30);
  }

  drawGrid() {
    this.ctx.strokeStyle = "#222";
    this.ctx.lineWidth = 1;
    const gridSize = 50;

    // Vertical
    for (let x = 0; x <= this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    // Horizontal
    for (let y = 0; y <= this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }
}

/* =========================================
   REGION 3: BOOTSTRAP
   ========================================= */
window.onload = () => {
  const game = new Game("gameCanvas");
  game.init();
};

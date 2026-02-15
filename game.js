// Chicken Run - Egg Defender
// A sidescrolling platformer game

let canvas, ctx;

function initCanvas() {
  canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Game canvas not found');
    return false;
  }
  ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get 2D context - try opening via http://localhost');
    return false;
  }
  canvas.width = 1200;
  canvas.height = 600;
  return true;
}

// Game dimensions
const GAME_WIDTH = 1200;
const GAME_HEIGHT = 600;

// Game states
const STATE = { MENU: 'menu', LEVEL_1: 'level1', LEVEL_2: 'level2', LEVEL_3: 'level3', GAME_OVER: 'gameover', YOU_WON: 'youwon' };
let gameState = STATE.MENU;

// Physics
const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const MOVE_SPEED = 6;
const DOUBLE_JUMP_FORCE = -12;

// Chicken
const chicken = {
  x: 100,
  y: 400,
  width: 40,
  height: 45,
  vx: 0,
  vy: 0,
  onGround: false,
  canDoubleJump: false,
  jumpKeyHeld: false,
  facingRight: true,
  lookingUp: false,
  invincible: false,
  invincibleTimer: 0,
  hasTopHat: false
};

// Egg projectiles
const eggs = [];
const EGG_SPEED = 12;
const EGG_SIZE = 8;

// Platforms - moon-like level 1
const platformsLevel1 = [
  { x: 0, y: 520, width: 400, height: 80 },
  { x: 350, y: 420, width: 150, height: 25 },
  { x: 500, y: 350, width: 180, height: 25 },
  { x: 700, y: 280, width: 200, height: 25 },
  { x: 450, y: 480, width: 120, height: 25 },
  { x: 650, y: 420, width: 150, height: 25 },
  { x: 900, y: 380, width: 180, height: 25 },
  { x: 950, y: 500, width: 250, height: 100 }
];

// Level 2 - disco boss fight with side platforms
const platformsLevel2 = [
  { x: 0, y: 520, width: GAME_WIDTH, height: 80 },      // main floor (index 0)
  { x: 80, y: 420, width: 180, height: 25 },             // left platform (index 1)
  { x: 940, y: 420, width: 180, height: 25 }            // right platform (index 2)
];

// Level 3 - Super Breakout style
const platformsLevel3 = [
  { x: 0, y: 520, width: GAME_WIDTH, height: 80 }
];

// Level 3 - bricks and shields
const bricks = [];
const BRICK_WIDTH = 58;
const BRICK_HEIGHT = 22;
const BRICK_ROWS = 6;
const BRICK_COLORS = ['#e63946', '#f4a261', '#e9c46a', '#2a9d8f', '#264653', '#9b5de5'];
const shields = [];
const LEVEL_3_TIME = 45;
let level3TimeLeft = LEVEL_3_TIME;
let level3Exploding = false;
let level3ExplosionParticles = [];
const eggSplats = [];
const EXPLOSIVE_BRICK_RADIUS = 95;
const LEVEL_3_FIRE_RATE = 6;
let level3FireCooldown = 0;

const spaceships = [];
const SPACESHIP_WIDTH = 24;
let level3Jellybean = null;
let megaBurstTimer = 0;
const SPACESHIP_HEIGHT = 16;
const SPACESHIP_SPEED = 3;
let level3SpaceshipSpawnTimer = 0;

let platforms = platformsLevel1;

// Level 1 coin (top hat unlock)
let level1Coin = null;

// Enemies - 5 green blobs (level 1)
const enemies = [];
const ENEMY_WIDTH = 35;
const ENEMY_HEIGHT = 30;
const ENEMY_MAX_HEALTH = 3;
const ENEMY_SPEED = 2;

// Bats - 5 flying enemies (level 1)
const bats = [];
const BAT_WIDTH = 40;
const BAT_HEIGHT = 25;
const BAT_MAX_HEALTH = 2;
const BAT_FLY_SPEED = 2;
const BAT_DROP_INTERVAL = 150;

// Cheese pieces dropped by bats
const cheesePieces = [];
const CHEESE_SIZE = 12;
const CHEESE_FALL_SPEED = 4;
const CHEESE_EXPLOSION_RADIUS = 55;

// Enemy explosion particles (for blobs and cheese)
const enemyExplosions = [];

// Boss (level 2)
const boss = {
  x: GAME_WIDTH / 2 - 60,
  y: 350,
  width: 120,
  height: 180,
  toeHealth: 5,
  maxToeHealth: 5,
  maceAngle: 0,
  maceSwingSpeed: 0.08,
  maceSwingDir: 1,
  maceVariationPhase: 0,  // for variable swing speed
  maceLength: 80,         // extends to 160 when reaching for player on side platforms
  moveSpeed: 2.5,
  explosionParticles: [],
  exploding: false,
  explosionTimer: 0
};

function initEnemies() {
  enemies.length = 0;
  const positions = [
    { x: 380, y: 385, platformIndex: 1 },
    { x: 530, y: 315, platformIndex: 2 },
    { x: 750, y: 245, platformIndex: 3 },
    { x: 480, y: 445, platformIndex: 4 },
    { x: 900, y: 345, platformIndex: 6 }
  ];

  positions.forEach((pos, i) => {
    const platform = platforms[pos.platformIndex];
    enemies.push({
      x: pos.x,
      y: platform.y - ENEMY_HEIGHT,
      width: ENEMY_WIDTH,
      height: ENEMY_HEIGHT,
      health: ENEMY_MAX_HEALTH,
      maxHealth: ENEMY_MAX_HEALTH,
      vx: ENEMY_SPEED * (i % 2 === 0 ? 1 : -1),
      vy: 0,
      platformIndex: pos.platformIndex,
      leftBound: platform.x,
      rightBound: platform.x + platform.width - ENEMY_WIDTH,
      jumpCooldown: i * 20
    });
  });

  // Coin on last platform (right side)
  const lastPlatform = platforms[7];
  level1Coin = {
    x: lastPlatform.x + lastPlatform.width / 2 - 12,
    y: lastPlatform.y - 28,
    width: 24,
    height: 24,
    collected: false
  };

  // Init bats - 5 flying bats
  bats.length = 0;
  cheesePieces.length = 0;
  enemyExplosions.length = 0;
  for (let i = 0; i < 5; i++) {
    bats.push({
      x: 200 + i * 180,
      baseY: 80 + (i % 3) * 50,
      y: 80 + (i % 3) * 50,
      width: BAT_WIDTH,
      height: BAT_HEIGHT,
      health: BAT_MAX_HEALTH,
      maxHealth: BAT_MAX_HEALTH,
      vx: BAT_FLY_SPEED * (i % 2 === 0 ? 1 : -1),
      dropTimer: i * 25
    });
  }
}

function triggerEnemyExplosion(x, y) {
  for (let i = 0; i < 25; i++) {
    enemyExplosions.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      size: 4 + Math.random() * 8,
      life: 1,
      color: ['#7cfc00', '#32cd32', '#ffcc44', '#fff'][Math.floor(Math.random() * 4)]
    });
  }
}

function triggerCheeseExplosion(x, y) {
  for (let i = 0; i < 20; i++) {
    enemyExplosions.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      size: 3 + Math.random() * 6,
      life: 1,
      color: ['#ffcc00', '#ffaa00', '#ff8844'][Math.floor(Math.random() * 3)]
    });
  }
}

function initBoss() {
  boss.x = GAME_WIDTH / 2 - 60;
  boss.y = 350;
  boss.toeHealth = 5;
  boss.maxToeHealth = 5;
  boss.maceAngle = 0;
  boss.maceSwingDir = 1;
  boss.maceVariationPhase = 0;
  boss.maceLength = 80;
  boss.isMoving = false;
  boss.toeExposedTimer = 0;
  boss.explosionParticles = [];
  boss.exploding = false;
  boss.explosionTimer = 0;
}

function initBricks() {
  bricks.length = 0;
  const cols = Math.floor(GAME_WIDTH / (BRICK_WIDTH + 4));
  const startX = (GAME_WIDTH - cols * (BRICK_WIDTH + 4) + 4) / 2;
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < cols; col++) {
      bricks.push({
        x: startX + col * (BRICK_WIDTH + 4),
        y: 60 + row * (BRICK_HEIGHT + 4),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        color: BRICK_COLORS[row % BRICK_COLORS.length],
        explosive: false
      });
    }
  }
  const totalBricks = bricks.length;
  const used = new Set();
  for (let i = 0; i < 3; i++) {
    let idx;
    do { idx = Math.floor(Math.random() * totalBricks); } while (used.has(idx));
    used.add(idx);
    bricks[idx].explosive = true;
    bricks[idx].color = '#22cc44';
  }
}

function initShields() {
  shields.length = 0;
  shields.push(
    { x: GAME_WIDTH / 2 - 60, y: 380, width: 120, height: 18, vx: 5 },
    { x: GAME_WIDTH / 2 - 45, y: 320, width: 90, height: 16, vx: 7 },
    { x: GAME_WIDTH / 2 - 35, y: 260, width: 70, height: 14, vx: 3 }
  );
  level3Jellybean = { shieldIndex: 0, width: 20, height: 20, collected: false };
  megaBurstTimer = 0;
  eggSplats.length = 0;
  level3TimeLeft = LEVEL_3_TIME;
  level3Exploding = false;
  level3ExplosionParticles = [];
  level3FireCooldown = 0;
  spaceships.length = 0;
  level3SpaceshipSpawnTimer = 0;
}

// Game state
let health = 5;
let gameOver = false;
let keys = {};
let menuDanceOffset = 0;
let level1Transitioning = false;

// Input
document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space') e.preventDefault();
});

document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// Retry button
document.getElementById('retry-btn').addEventListener('click', () => {
  if (gameState === STATE.LEVEL_1) startLevel1();
  else if (gameState === STATE.LEVEL_2) startLevel2();
  else if (gameState === STATE.LEVEL_3) startLevel3();
});

function startLevel1() {
  gameState = STATE.LEVEL_1;
  level1Transitioning = false;
  platforms = platformsLevel1;
  resetGame();
  initEnemies();
  document.getElementById('ui-overlay').style.display = 'block';
}

function startLevel2() {
  gameState = STATE.LEVEL_2;
  platforms = platformsLevel2;
  resetGame();
  initBoss();
  document.getElementById('ui-overlay').style.display = 'block';
}

function startLevel3() {
  gameState = STATE.LEVEL_3;
  level3Transitioning = false;
  platforms = platformsLevel3;
  resetGame();
  initBricks();
  initShields();
  document.getElementById('ui-overlay').style.display = 'block';
}

function resetGame() {
  chicken.x = 100;
  chicken.y = 400;
  chicken.vx = 0;
  chicken.vy = 0;
  chicken.onGround = false;
  chicken.canDoubleJump = false;
  chicken.jumpKeyHeld = false;
  chicken.facingRight = true;
  chicken.lookingUp = false;
  chicken.invincible = false;
  chicken.invincibleTimer = 0;

  eggs.length = 0;
  health = 5;
  gameOver = false;

  document.getElementById('game-over-screen').classList.remove('visible');
  document.getElementById('game-over-screen').querySelector('p').textContent = 'The chicken has lost all its eggs!';
  updateHealthDisplay();
}

function updateHealthDisplay() {
  const container = document.getElementById('health-eggs');
  container.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const egg = document.createElement('div');
    egg.className = 'health-egg' + (i >= health ? ' lost' : '');
    container.appendChild(egg);
  }
}

// ========== MENU - Dancing Chicken (drawn on game canvas) ==========
function drawMenuChicken(offsetY) {
  const scale = 6;
  const cx = GAME_WIDTH / 2;
  const cy = GAME_HEIGHT / 2 - 50 + offsetY;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-20, -22);

  // Body (yellow/white)
  ctx.fillStyle = '#fff5d4';
  ctx.beginPath();
  ctx.ellipse(20, 28, 14, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8c870';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Head
  ctx.fillStyle = '#fff5d4';
  ctx.beginPath();
  ctx.arc(20, 12, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Comb (red)
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.moveTo(18, 2);
  ctx.lineTo(22, 2);
  ctx.lineTo(20, -2);
  ctx.closePath();
  ctx.fill();

  // Beak
  ctx.fillStyle = '#ff9f43';
  ctx.beginPath();
  ctx.moveTo(28, 12);
  ctx.lineTo(38, 14);
  ctx.lineTo(28, 16);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(26, 10, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawMenu() {
  menuDanceOffset += 0.08;
  const bounceY = Math.sin(menuDanceOffset) * 12;

  // Menu background
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, '#0a0a1a');
  gradient.addColorStop(0.5, '#1a1a3a');
  gradient.addColorStop(1, '#0f0f23');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Stars
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 80; i++) {
    const x = (i * 37 + 13) % GAME_WIDTH;
    const y = (i * 53 + 7) % GAME_HEIGHT;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMenuChicken(bounceY);
}

// ========== LEVEL 1 - Moon ==========
function drawBackgroundLevel1() {
  const gradient = ctx.createRadialGradient(
    GAME_WIDTH / 2, GAME_HEIGHT / 2, 0,
    GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH
  );
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#16213e');
  gradient.addColorStop(1, '#0f0f23');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#fff';
  for (let i = 0; i < 80; i++) {
    const x = (i * 37 + 13) % GAME_WIDTH;
    const y = (i * 53 + 7) % GAME_HEIGHT;
    const size = (i % 3) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#8b8b9a';
  ctx.fillRect(0, 500, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#6b6b7a';
  [[100, 540, 40], [300, 550, 25], [600, 530, 35], [900, 545, 30]].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ========== LEVEL 2 - Disco ==========
let discoBallAngle = 0;

function drawBackgroundLevel2() {
  // Dark disco room
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, '#1a0a2e');
  gradient.addColorStop(0.5, '#2d1b4e');
  gradient.addColorStop(1, '#0f0a1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Disco floor pattern
  ctx.fillStyle = 'rgba(255, 0, 128, 0.1)';
  for (let i = 0; i < GAME_WIDTH; i += 80) {
    for (let j = 0; j < GAME_HEIGHT; j += 80) {
      if ((i + j) % 160 === 0) {
        ctx.fillRect(i, j, 80, 80);
      }
    }
  }

  // Disco ball
  discoBallAngle += 0.02;
  const ballX = GAME_WIDTH / 2;
  const ballY = 80;
  const ballRadius = 35;

  // Chain
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ballX, 0);
  ctx.lineTo(ballX, ballY - ballRadius);
  ctx.stroke();

  // Ball facets (sparkly)
  ctx.save();
  ctx.translate(ballX, ballY);
  ctx.rotate(discoBallAngle);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    ctx.fillStyle = i % 2 === 0 ? '#fff' : '#ddd';
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * 25, Math.sin(angle) * 25, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, 0, ballRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Light rays from disco ball
  ctx.fillStyle = `rgba(255, 100, 255, ${0.05 + Math.sin(discoBallAngle * 2) * 0.03})`;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Floor
  ctx.fillStyle = '#2a1a3a';
  ctx.fillRect(0, 500, GAME_WIDTH, GAME_HEIGHT);
}

// ========== LEVEL 3 - Super Breakout ==========
function drawBackgroundLevel3() {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, '#1a1a3a');
  gradient.addColorStop(0.5, '#2d2d5a');
  gradient.addColorStop(1, '#0f0f2a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.fillStyle = '#1a2a3a';
  ctx.fillRect(0, 500, GAME_WIDTH, GAME_HEIGHT);
}

function drawBricks() {
  bricks.forEach(b => {
    if (b.explosive) {
      const glow = 0.6 + 0.4 * Math.sin(Date.now() / 120);
      ctx.shadowColor = '#00ff44';
      ctx.shadowBlur = 12 + glow * 8;
      ctx.fillStyle = '#22cc44';
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.fillStyle = '#44ff66';
      ctx.fillRect(b.x + 3, b.y + 3, b.width - 6, b.height - 6);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    ctx.strokeStyle = b.explosive ? 'rgba(0,255,100,0.6)' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x, b.y, b.width, b.height);
  });
}

function drawJellybean() {
  if (!level3Jellybean || level3Jellybean.collected) return;
  const s = shields[level3Jellybean.shieldIndex];
  const x = s.x + s.width / 2 - level3Jellybean.width / 2;
  const y = s.y - level3Jellybean.height - 2;
  const w = level3Jellybean.width;
  const h = level3Jellybean.height;
  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
  gradient.addColorStop(0, '#ff69b4');
  gradient.addColorStop(0.3, '#ff1493');
  gradient.addColorStop(0.7, '#ff85c1');
  gradient.addColorStop(1, '#ffb6c1');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c71585';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawShields() {
  const shieldColors = ['#4a90d9', '#5aa0e9', '#3a80c9'];
  shields.forEach((s, i) => {
    ctx.fillStyle = shieldColors[i % shieldColors.length];
    ctx.fillRect(s.x, s.y, s.width, s.height);
    ctx.strokeStyle = '#2a70b9';
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x, s.y, s.width, s.height);
  });
}

function drawEggSplats() {
  eggSplats.forEach(s => {
    ctx.fillStyle = 'rgba(255, 248, 231, ' + s.life + ')';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function spawnLevel3Spaceships() {
  const count = Math.floor(Math.random() * 4);
  const targetX = chicken.x + chicken.width / 2;
  const targetY = chicken.y + chicken.height / 2;
  for (let i = 0; i < count; i++) {
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? -SPACESHIP_WIDTH - 5 : GAME_WIDTH + 5;
    const y = 150 + Math.random() * 300;
    const dx = targetX - x;
    const dy = targetY - y;
    const len = Math.hypot(dx, dy) || 1;
    spaceships.push({
      x, y,
      vx: (dx / len) * SPACESHIP_SPEED,
      vy: (dy / len) * SPACESHIP_SPEED,
      width: SPACESHIP_WIDTH,
      height: SPACESHIP_HEIGHT
    });
  }
}

function updateSpaceships() {
  for (let i = spaceships.length - 1; i >= 0; i--) {
    const s = spaceships[i];
    s.x += s.vx;
    s.y += s.vy;
    if (s.x < -50 || s.x > GAME_WIDTH + 50 || s.y < -50 || s.y > GAME_HEIGHT + 50) {
      spaceships.splice(i, 1);
    }
  }
}

function drawSpaceships() {
  spaceships.forEach(s => {
    const cx = s.x + s.width / 2;
    const cy = s.y + s.height / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.atan2(s.vy, s.vx));
    ctx.translate(-cx, -cy);
    ctx.fillStyle = '#5aa0e9';
    ctx.beginPath();
    ctx.moveTo(s.x + s.width, s.y + s.height / 2);
    ctx.lineTo(s.x, s.y);
    ctx.lineTo(s.x + s.width / 2, s.y + s.height / 2);
    ctx.lineTo(s.x, s.y + s.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2a70b9';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#aaddff';
    ctx.beginPath();
    ctx.arc(s.x + s.width / 2, s.y + s.height / 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function updateShields() {
  shields.forEach(s => {
    s.x += s.vx;
    if (s.x <= 0) {
      s.x = 0;
      s.vx = Math.abs(s.vx);
    }
    if (s.x + s.width >= GAME_WIDTH) {
      s.x = GAME_WIDTH - s.width;
      s.vx = -Math.abs(s.vx);
    }
  });
}

function triggerLevel3Explosion() {
  for (let i = 0; i < 120; i++) {
    level3ExplosionParticles.push({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12,
      size: 8 + Math.random() * 20,
      life: 1,
      color: ['#ff4444', '#ff8844', '#ffcc44', '#fff', '#e63946'][Math.floor(Math.random() * 5)]
    });
  }
}

function updateLevel3Explosion() {
  level3ExplosionParticles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.015;
  });
  level3ExplosionParticles = level3ExplosionParticles.filter(p => p.life > 0);
  if (level3ExplosionParticles.length === 0) {
    gameOver = true;
    document.getElementById('game-over-screen').querySelector('p').textContent = 'Time\'s up! The bricks exploded!';
    document.getElementById('game-over-screen').classList.add('visible');
  }
}

function drawLevel3Timer() {
  const secs = Math.ceil(level3TimeLeft);
  ctx.fillStyle = secs <= 10 ? '#ff4444' : '#fff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeText(secs + 's', GAME_WIDTH / 2, 35);
  ctx.fillText(secs + 's', GAME_WIDTH / 2, 35);
  if (megaBurstTimer > 0) {
    const burstSecs = Math.ceil(megaBurstTimer / 60);
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 24px sans-serif';
    ctx.strokeText('MEGA BURST: ' + burstSecs + 's', GAME_WIDTH / 2, 70);
    ctx.fillText('MEGA BURST: ' + burstSecs + 's', GAME_WIDTH / 2, 70);
  }
  ctx.textAlign = 'left';
}

function drawLevel3Explosion() {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  level3ExplosionParticles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function updateEggSplats() {
  for (let i = eggSplats.length - 1; i >= 0; i--) {
    const s = eggSplats[i];
    s.x += s.vx;
    s.y += s.vy;
    s.life -= 0.05;
    if (s.life <= 0) eggSplats.splice(i, 1);
  }
}

// Draw platforms
function drawPlatforms() {
  platforms.forEach((p) => {
    const gradient = ctx.createLinearGradient(p.x, p.y, p.x + p.width, p.y + p.height);
    gradient.addColorStop(0, '#9a9aaa');
    gradient.addColorStop(0.5, '#7a7a8a');
    gradient.addColorStop(1, '#5a5a6a');
    ctx.fillStyle = gradient;
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.width, p.height);
  });
}

// Draw chicken
function drawChicken() {
  ctx.save();
  ctx.translate(chicken.x + chicken.width / 2, chicken.y + chicken.height / 2);
  if (!chicken.facingRight) ctx.scale(-1, 1);
  ctx.translate(-chicken.width / 2, -chicken.height / 2);

  if (chicken.invincible && Math.floor(chicken.invincibleTimer / 5) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  // Body (yellow/white)
  ctx.fillStyle = '#fff5d4';
  ctx.beginPath();
  ctx.ellipse(20, 28, 14, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8c870';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Head - rotated up when looking up (or in level 3 where we always fire upward)
  ctx.save();
  if (chicken.lookingUp || gameState === STATE.LEVEL_3) {
    ctx.translate(20, 12);
    ctx.rotate(-Math.PI / 2);  // -90° to face up
    ctx.translate(-20, -12);
  }
  ctx.fillStyle = '#fff5d4';
  ctx.beginPath();
  ctx.arc(20, 12, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.moveTo(18, 2);
  ctx.lineTo(22, 2);
  ctx.lineTo(20, -2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ff9f43';
  ctx.beginPath();
  ctx.moveTo(28, 12);
  ctx.lineTo(38, 14);
  ctx.lineTo(28, 16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(26, 10, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Top hat (persists for rest of game when obtained in level 1)
  if (chicken.hasTopHat) {
    ctx.save();
    if (chicken.lookingUp || gameState === STATE.LEVEL_3) {
      ctx.translate(20, 12);
      ctx.rotate(-Math.PI / 2);
      ctx.translate(-20, -12);
    }
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(14, -8, 12, 14);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(12, 4, 16, 4);
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(15, -10, 10, 4);
    ctx.restore();
  }

  ctx.restore();
}

function drawEgg(egg) {
  ctx.fillStyle = '#fff8e7';
  ctx.beginPath();
  ctx.ellipse(egg.x, egg.y, EGG_SIZE, EGG_SIZE * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8d4a8';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawCoin() {
  if (!level1Coin || level1Coin.collected) return;
  const c = level1Coin;
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.ellipse(c.x + c.width / 2, c.y + c.height / 2, c.width / 2 - 2, c.height / 2 - 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffec8b';
  ctx.beginPath();
  ctx.ellipse(c.x + c.width / 2, c.y + c.height / 2, c.width / 4, c.height / 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(enemy) {
  const gradient = ctx.createRadialGradient(
    enemy.x + enemy.width / 2 - 5, enemy.y + enemy.height / 2 - 5, 0,
    enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width
  );
  gradient.addColorStop(0, '#7cfc00');
  gradient.addColorStop(0.5, '#32cd32');
  gradient.addColorStop(1, '#228b22');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2 - 2, enemy.height / 2 - 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a5f1a';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(enemy.x + 10, enemy.y + 10, 4, 0, Math.PI * 2);
  ctx.arc(enemy.x + 25, enemy.y + 10, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(enemy.x + 11, enemy.y + 10, 2, 0, Math.PI * 2);
  ctx.arc(enemy.x + 26, enemy.y + 10, 2, 0, Math.PI * 2);
  ctx.fill();

  const barWidth = 40, barHeight = 6, barX = enemy.x + (enemy.width - barWidth) / 2, barY = enemy.y - 12;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(barX, barY, (barWidth * enemy.health) / enemy.maxHealth, barHeight);
}

function drawBat(bat) {
  if (bat.health <= 0) return;
  ctx.fillStyle = '#2a1a2a';
  ctx.beginPath();
  ctx.ellipse(bat.x + bat.width / 2, bat.y + bat.height / 2, bat.width / 2 - 2, bat.height / 2 - 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(bat.x + 12, bat.y + 8, 3, 0, Math.PI * 2);
  ctx.arc(bat.x + 28, bat.y + 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(bat.x + 13, bat.y + 8, 1.5, 0, Math.PI * 2);
  ctx.arc(bat.x + 29, bat.y + 8, 1.5, 0, Math.PI * 2);
  ctx.fill();
  const barWidth = 30, barHeight = 4, barX = bat.x + (bat.width - barWidth) / 2, barY = bat.y - 8;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(barX, barY, (barWidth * bat.health) / bat.maxHealth, barHeight);
}

function drawCheese(c) {
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, CHEESE_SIZE, CHEESE_SIZE * 1.2, c.rotation || 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cc9900';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawEnemyExplosions() {
  enemyExplosions.forEach(p => {
    if (p.life !== undefined) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
}

function updateEnemyExplosions() {
  for (let i = enemyExplosions.length - 1; i >= 0; i--) {
    const p = enemyExplosions[i];
    if (p.vx !== undefined) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      if (p.life <= 0) enemyExplosions.splice(i, 1);
    }
  }
}

// ========== BOSS - Disco villain with mace ==========
function drawBoss() {
  if (boss.exploding) {
    drawBossExplosion();
    return;
  }

  const b = boss;
  const toeX = b.x + b.width / 2 - 15;
  const toeY = b.y + b.height - 55;  // Raised so chicken can hit with eggs
  const toeW = 30;
  const toeH = 25;

  // Robe/body - generic villain silhouette
  ctx.fillStyle = '#2a2a3a';
  ctx.fillRect(b.x + 20, b.y + 40, 80, 140);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x + 20, b.y + 40, 80, 140);

  // Hood/head area
  ctx.fillStyle = '#1a1a2a';
  ctx.beginPath();
  ctx.ellipse(b.x + 60, b.y + 50, 35, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Face shadow (generic)
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(b.x + 60, b.y + 55, 15, 0, Math.PI * 2);
  ctx.fill();

  // Medieval mace - on side closest to player
  const { maceCenterX, maceCenterY, maceEndX, maceEndY } = getMacePositions();

  ctx.strokeStyle = '#4a3728';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(maceCenterX, maceCenterY);
  ctx.lineTo(maceEndX, maceEndY);
  ctx.stroke();

  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.arc(maceEndX, maceEndY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Glowing red toe weakspot
  const glow = 0.5 + 0.5 * Math.sin(Date.now() / 150);
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 15 + glow * 10;
  ctx.fillStyle = '#ff3333';
  ctx.fillRect(toeX, toeY, toeW, toeH);
  ctx.fillStyle = '#ff6666';
  ctx.fillRect(toeX + 5, toeY + 5, toeW - 10, toeH - 10);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = '#aa0000';
  ctx.lineWidth = 2;
  ctx.strokeRect(toeX, toeY, toeW, toeH);

  // Toe shield - covers weak spot unless boss is moving AND mace is at top of swing
  if (!isToeExposed()) {
    const shieldX = toeX - 8;
    const shieldY = toeY - 5;
    const shieldW = toeW + 16;
    const shieldH = toeH + 12;
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(shieldX, shieldY, shieldW, shieldH);
    ctx.strokeStyle = '#5a4a35';
    ctx.lineWidth = 2;
    ctx.strokeRect(shieldX, shieldY, shieldW, shieldH);
    ctx.fillStyle = '#6b5a45';
    ctx.fillRect(shieldX + 4, shieldY + 4, shieldW - 8, shieldH - 8);
  }

  // Toe health
  ctx.fillStyle = '#333';
  ctx.fillRect(b.x + 30, b.y - 25, 60, 8);
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(b.x + 31, b.y - 24, (58 * b.toeHealth) / b.maxToeHealth, 6);
}

function drawBossExplosion() {
  boss.explosionParticles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function triggerBossExplosion() {
  const b = boss;
  for (let i = 0; i < 60; i++) {
    b.explosionParticles.push({
      x: b.x + b.width / 2 + (Math.random() - 0.5) * 100,
      y: b.y + b.height / 2 + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      size: 5 + Math.random() * 15,
      life: 1,
      color: ['#ff4444', '#ff8844', '#ffcc44', '#fff'][Math.floor(Math.random() * 4)]
    });
  }
}

function updateBossExplosion() {
  boss.explosionParticles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
  });
  boss.explosionParticles = boss.explosionParticles.filter(p => p.life > 0);
  boss.explosionTimer++;
  if (boss.explosionTimer > 90) {
    document.getElementById('level-complete-screen').querySelector('h2').textContent = 'Boss Defeated!';
    document.getElementById('level-complete-screen').querySelector('p').textContent = 'Entering Breakout...';
    document.getElementById('level-complete-screen').classList.add('visible');
    setTimeout(() => {
      document.getElementById('level-complete-screen').classList.remove('visible');
      document.getElementById('level-complete-screen').querySelector('h2').textContent = 'Level Complete!';
      document.getElementById('level-complete-screen').querySelector('p').textContent = 'Entering the Disco...';
      startLevel3();
    }, 1500);
    boss.explosionTimer = -999;
  }
}

// Collision helpers
function rectOverlap(a, b, padding = 0) {
  return a.x + a.width - padding > b.x + padding &&
         a.x + padding < b.x + b.width - padding &&
         a.y + a.height - padding > b.y + padding &&
         a.y + padding < b.y + b.height - padding;
}

function getBossToeRect() {
  const b = boss;
  return {
    x: b.x + b.width / 2 - 15,
    y: b.y + b.height - 55,
    width: 30,
    height: 25
  };
}

// Toe is exposed when toeExposedTimer > 0. Timer set to ~0.5 sec when mace at top + boss moving.
function isToeExposed() {
  return (boss.toeExposedTimer || 0) > 0;
}

// Returns mace center, end position. Mace is on side closest to player. Length can extend to 2x (160).
function getMacePositions() {
  const b = boss;
  const chickenCenterX = chicken.x + chicken.width / 2;
  const bossCenterX = b.x + b.width / 2;
  const playerOnLeft = chickenCenterX < bossCenterX;

  const maceCenterX = playerOnLeft ? b.x + 25 : b.x + 95;
  const maceCenterY = b.y + 80;
  const maceDir = playerOnLeft ? -1 : 1;
  const len = b.maceLength || 80;
  const maceEndX = maceCenterX + maceDir * len * Math.cos(b.maceAngle);
  const maceEndY = maceCenterY + len * Math.sin(b.maceAngle);

  return { maceCenterX, maceCenterY, maceEndX, maceEndY };
}

// Only the mace ball (end) hurts - circle collision
function circleRectOverlap(cx, cy, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
  const distX = cx - closestX;
  const distY = cy - closestY;
  return (distX * distX + distY * distY) <= (radius * radius);
}

function updateChicken() {
  chicken.vx = 0;
  if (keys['KeyA'] || keys['ArrowLeft']) {
    chicken.vx = -MOVE_SPEED;
    chicken.facingRight = false;
  }
  if (keys['KeyD'] || keys['ArrowRight']) {
    chicken.vx = MOVE_SPEED;
    chicken.facingRight = true;
  }

  chicken.x += chicken.vx;
  chicken.x = Math.max(0, Math.min(GAME_WIDTH - chicken.width, chicken.x));

  chicken.vy += GRAVITY;
  chicken.y += chicken.vy;

  chicken.onGround = false;
  platforms.forEach(p => {
    if (chicken.vy >= 0 &&
        chicken.x + chicken.width > p.x &&
        chicken.x < p.x + p.width &&
        chicken.y + chicken.height >= p.y &&
        chicken.y + chicken.height <= p.y + 20) {
      chicken.y = p.y - chicken.height;
      chicken.vy = 0;
      chicken.onGround = true;
      chicken.canDoubleJump = true;
    }
  });
  // Level 3: shields are solid platforms (land on top, cannot jump through)
  if (gameState === STATE.LEVEL_3) {
    shields.forEach(s => {
      const overlapX = chicken.x + chicken.width > s.x && chicken.x < s.x + s.width;
      if (chicken.vy >= 0 &&
          overlapX &&
          chicken.y + chicken.height >= s.y &&
          chicken.y + chicken.height <= s.y + 20) {
        chicken.y = s.y - chicken.height;
        chicken.vy = 0;
        chicken.onGround = true;
        chicken.canDoubleJump = true;
      }
      if (chicken.vy < 0 && overlapX &&
          chicken.y + chicken.height > s.y &&
          chicken.y < s.y + s.height) {
        chicken.y = s.y + s.height;
        chicken.vy = 0;
      }
    });
  }

  const jumpKey = keys['Space'] || keys['KeyW'] || keys['ArrowUp'];
  if (jumpKey) {
    if (chicken.onGround) {
      chicken.vy = JUMP_FORCE;
      chicken.onGround = false;
      chicken.canDoubleJump = true;
      chicken.jumpKeyHeld = true;
    } else if (chicken.canDoubleJump && !chicken.jumpKeyHeld) {
      chicken.vy = DOUBLE_JUMP_FORCE;
      chicken.canDoubleJump = false;
    }
  } else {
    chicken.jumpKeyHeld = false;
  }

  chicken.lookingUp = keys['KeyE'] || false;

  if (gameState === STATE.LEVEL_3) {
    if (megaBurstTimer > 0) megaBurstTimer--;
    if (keys['KeyJ'] || keys['ControlLeft']) {
      level3FireCooldown--;
      if (level3FireCooldown <= 0) {
        level3FireCooldown = 60 / LEVEL_3_FIRE_RATE;
        const cx = chicken.x + chicken.width / 2 - EGG_SIZE;
        const cy = chicken.y + 5 - EGG_SIZE;
        if (megaBurstTimer > 0) {
          const spreadRad = (30 * Math.PI / 180) / 2;
          for (let i = 0; i < 3; i++) {
            const angle = Math.PI / 2 + (Math.random() - 0.5) * spreadRad * 2;
            eggs.push({
              x: cx,
              y: cy,
              vx: EGG_SPEED * Math.cos(angle),
              vy: -EGG_SPEED * Math.sin(angle)
            });
          }
        } else {
          eggs.push({
            x: cx,
            y: cy,
            vx: 0,
            vy: -EGG_SPEED
          });
        }
      }
    } else {
      level3FireCooldown = 0;
    }
  } else if (keys['KeyJ'] || keys['ControlLeft']) {
    if (!chicken.justShot) {
      let vx, vy;
      if (chicken.lookingUp) {
        vx = 0;
        vy = -EGG_SPEED;
      } else {
        vx = chicken.facingRight ? EGG_SPEED : -EGG_SPEED;
        vy = 0;
      }
      eggs.push({
        x: chicken.lookingUp ? chicken.x + chicken.width / 2 - EGG_SIZE : (chicken.facingRight ? chicken.x + chicken.width : chicken.x - EGG_SIZE),
        y: chicken.y + (chicken.lookingUp ? 5 : chicken.height / 2) - EGG_SIZE,
        vx, vy
      });
      chicken.justShot = true;
    }
  } else {
    chicken.justShot = false;
  }

  if (chicken.invincible) {
    chicken.invincibleTimer--;
    if (chicken.invincibleTimer <= 0) chicken.invincible = false;
  }

  // Enemy collision (level 1)
  if (gameState === STATE.LEVEL_1 && !chicken.invincible && !gameOver) {
    enemies.forEach(enemy => {
      if (enemy.health > 0 && rectOverlap(chicken, enemy, 5)) {
        health--;
        chicken.invincible = true;
        chicken.invincibleTimer = 90;
        updateHealthDisplay();
        if (health <= 0) {
          gameOver = true;
          document.getElementById('game-over-screen').classList.add('visible');
        }
      }
    });
    bats.forEach(bat => {
      if (bat.health > 0 && rectOverlap(chicken, bat, 5)) {
        health--;
        chicken.invincible = true;
        chicken.invincibleTimer = 90;
        updateHealthDisplay();
        if (health <= 0) {
          gameOver = true;
          document.getElementById('game-over-screen').classList.add('visible');
        }
      }
    });
    if (level1Coin && !level1Coin.collected && rectOverlap(chicken, level1Coin, 2)) {
      level1Coin.collected = true;
      chicken.hasTopHat = true;
    }
  }

  // Jellybean collection (level 3)
  if (gameState === STATE.LEVEL_3 && level3Jellybean && !level3Jellybean.collected && !level3Exploding) {
    const s = shields[level3Jellybean.shieldIndex];
    const jb = {
      x: s.x + s.width / 2 - level3Jellybean.width / 2,
      y: s.y - level3Jellybean.height - 2,
      width: level3Jellybean.width,
      height: level3Jellybean.height
    };
    if (rectOverlap(chicken, jb, 2)) {
      level3Jellybean.collected = true;
      megaBurstTimer = 600;
    }
  }

  // Spaceship collision (level 3)
  if (gameState === STATE.LEVEL_3 && !chicken.invincible && !gameOver && !level3Exploding) {
    for (let ss = spaceships.length - 1; ss >= 0; ss--) {
      if (rectOverlap(chicken, spaceships[ss], 3)) {
        health--;
        chicken.invincible = true;
        chicken.invincibleTimer = 90;
        updateHealthDisplay();
        spaceships.splice(ss, 1);
        if (health <= 0) {
          gameOver = true;
          document.getElementById('game-over-screen').classList.add('visible');
        }
        break;
      }
    }
  }

  // Mace collision (level 2) - only the end of the mace hurts, works in any player state
  if (gameState === STATE.LEVEL_2 && !boss.exploding && !chicken.invincible && !gameOver) {
    const { maceEndX, maceEndY } = getMacePositions();
    const MACE_BALL_RADIUS = 20;
    if (circleRectOverlap(maceEndX, maceEndY, MACE_BALL_RADIUS, chicken)) {
      health--;
      chicken.invincible = true;
      chicken.invincibleTimer = 90;
      updateHealthDisplay();
      if (health <= 0) {
        gameOver = true;
        document.getElementById('game-over-screen').classList.add('visible');
      }
    }
  }
}

function updateEggs() {
  for (let i = eggs.length - 1; i >= 0; i--) {
    const egg = eggs[i];
    egg.x += egg.vx;
    egg.y += egg.vy;

    if (egg.x < -20 || egg.x > GAME_WIDTH + 20 || egg.y < -20 || egg.y > GAME_HEIGHT + 20) {
      eggs.splice(i, 1);
      continue;
    }

    if (gameState === STATE.LEVEL_1) {
      for (let e = enemies.length - 1; e >= 0; e--) {
        const enemy = enemies[e];
        if (enemy.health > 0) {
          const eggRect = { x: egg.x - EGG_SIZE, y: egg.y - EGG_SIZE, width: EGG_SIZE * 2, height: EGG_SIZE * 2.4 };
          if (rectOverlap(eggRect, enemy)) {
            enemy.health--;
            if (enemy.health <= 0) {
              triggerEnemyExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
              enemies.splice(e, 1);
            }
            eggs.splice(i, 1);
            break;
          }
        }
      }
      for (const bat of bats) {
        if (bat.health > 0) {
          const eggRect = { x: egg.x - EGG_SIZE, y: egg.y - EGG_SIZE, width: EGG_SIZE * 2, height: EGG_SIZE * 2.4 };
          if (rectOverlap(eggRect, bat)) {
            bat.health--;
            if (bat.health <= 0) {
              triggerEnemyExplosion(bat.x + bat.width / 2, bat.y + bat.height / 2);
            }
            eggs.splice(i, 1);
            break;
          }
        }
      }
    }

    if (gameState === STATE.LEVEL_2 && !boss.exploding) {
      const eggRect = { x: egg.x - EGG_SIZE, y: egg.y - EGG_SIZE, width: EGG_SIZE * 2, height: EGG_SIZE * 2.4 };
      const toe = getBossToeRect();
      if (rectOverlap(eggRect, toe)) {
        if (isToeExposed()) {
          boss.toeHealth--;
          eggs.splice(i, 1);
          if (boss.toeHealth <= 0) {
            boss.exploding = true;
            triggerBossExplosion();
          }
        } else {
          triggerEggSplat(egg.x + EGG_SIZE, egg.y + EGG_SIZE);
          eggs.splice(i, 1);
        }
      }
    }

    if (gameState === STATE.LEVEL_3) {
      const eggRect = { x: egg.x - EGG_SIZE, y: egg.y - EGG_SIZE, width: EGG_SIZE * 2, height: EGG_SIZE * 2.4 };
      let hit = false;
      for (let b = bricks.length - 1; b >= 0 && !hit; b--) {
        if (rectOverlap(eggRect, bricks[b])) {
          const hitBrick = bricks[b];
          const centerX = hitBrick.x + hitBrick.width / 2;
          const centerY = hitBrick.y + hitBrick.height / 2;
          if (hitBrick.explosive) {
            for (let j = bricks.length - 1; j >= 0; j--) {
              const other = bricks[j];
              const otherCenterX = other.x + other.width / 2;
              const otherCenterY = other.y + other.height / 2;
              const dist = Math.hypot(centerX - otherCenterX, centerY - otherCenterY);
              if (dist <= EXPLOSIVE_BRICK_RADIUS) {
                triggerEnemyExplosion(otherCenterX, otherCenterY);
                bricks.splice(j, 1);
              }
            }
          } else {
            bricks.splice(b, 1);
          }
          eggs.splice(i, 1);
          hit = true;
        }
      }
      if (!hit) {
        for (let ss = spaceships.length - 1; ss >= 0 && !hit; ss--) {
          if (rectOverlap(eggRect, spaceships[ss])) {
            triggerEnemyExplosion(spaceships[ss].x + spaceships[ss].width / 2, spaceships[ss].y + spaceships[ss].height / 2);
            spaceships.splice(ss, 1);
            eggs.splice(i, 1);
            hit = true;
          }
        }
      }
      if (!hit) {
        for (const s of shields) {
          if (rectOverlap(eggRect, s)) {
            triggerEggSplat(egg.x + EGG_SIZE, egg.y + EGG_SIZE);
            eggs.splice(i, 1);
            hit = true;
            break;
          }
        }
      }
    }
  }
}

function triggerEggSplat(x, y) {
  for (let i = 0; i < 12; i++) {
    eggSplats.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1,
      size: 3 + Math.random() * 5
    });
  }
}

const ENEMY_JUMP_FORCE = -10;
const ENEMY_JUMP_COOLDOWN = 90;

function updateEnemies() {
  const chickenCenterX = chicken.x + chicken.width / 2;
  enemies.forEach(enemy => {
    if (enemy.health <= 0) return;
    const enemyCenterX = enemy.x + enemy.width / 2;

    // Move toward player
    if (chickenCenterX > enemyCenterX + 10) enemy.vx = ENEMY_SPEED;
    else if (chickenCenterX < enemyCenterX - 10) enemy.vx = -ENEMY_SPEED;

    enemy.x += enemy.vx;

    // Gravity and jumping
    enemy.vy += GRAVITY * 0.8;
    enemy.y += enemy.vy;

    // Land on any platform
    let landed = false;
    for (const p of platforms) {
      if (enemy.vy >= 0 &&
          enemy.x + enemy.width > p.x &&
          enemy.x < p.x + p.width &&
          enemy.y + enemy.height >= p.y &&
          enemy.y + enemy.height <= p.y + 15) {
        enemy.y = p.y - enemy.height;
        enemy.vy = 0;
        enemy.platformIndex = platforms.indexOf(p);
        landed = true;
        break;
      }
    }
    if (landed) {
      const platform = platforms[enemy.platformIndex];
      if (enemy.x <= platform.x) {
        enemy.x = platform.x;
        enemy.vx = ENEMY_SPEED;
      }
      if (enemy.x >= platform.x + platform.width - enemy.width) {
        enemy.x = platform.x + platform.width - enemy.width;
        enemy.vx = -ENEMY_SPEED;
      }
      enemy.jumpCooldown = (enemy.jumpCooldown || 0) - 1;
      if (enemy.jumpCooldown <= 0) {
        enemy.vy = ENEMY_JUMP_FORCE;
        enemy.jumpCooldown = ENEMY_JUMP_COOLDOWN + Math.floor(Math.random() * 30);
      }
    }
  });
}

function updateBats() {
  bats.forEach(bat => {
    if (bat.health <= 0) return;
    bat.x += bat.vx;
    if (bat.x < 50 || bat.x > GAME_WIDTH - bat.width - 50) bat.vx *= -1;
    bat.y = bat.baseY + Math.sin(bat.x / 60) * 12;
    bat.dropTimer++;
    if (bat.dropTimer >= BAT_DROP_INTERVAL) {
      bat.dropTimer = 0;
      cheesePieces.push({
        x: bat.x + bat.width / 2 - CHEESE_SIZE,
        y: bat.y + bat.height,
        vx: 0,
        vy: CHEESE_FALL_SPEED,
        rotation: Math.random() * 0.5
      });
    }
  });
}

function updateCheese() {
  for (let i = cheesePieces.length - 1; i >= 0; i--) {
    const c = cheesePieces[i];
    c.y += c.vy;
    c.rotation = (c.rotation || 0) + 0.1;
    const cheeseCenterY = c.y + CHEESE_SIZE;
    const cheeseCenterX = c.x + CHEESE_SIZE;
    const hitPlatform = platforms.some(p =>
      cheeseCenterY + CHEESE_SIZE >= p.y && cheeseCenterY - CHEESE_SIZE <= p.y + 5 &&
      cheeseCenterX > p.x && cheeseCenterX < p.x + p.width
    );
    if (hitPlatform) {
      const cheeseX = cheeseCenterX;
      const cheeseY = cheeseCenterY;
      if (!chicken.invincible && !gameOver) {
        const dist = Math.hypot(
          chicken.x + chicken.width / 2 - cheeseX,
          chicken.y + chicken.height / 2 - cheeseY
        );
        if (dist < CHEESE_EXPLOSION_RADIUS) {
          health--;
          chicken.invincible = true;
          chicken.invincibleTimer = 90;
          updateHealthDisplay();
          if (health <= 0) {
            gameOver = true;
            document.getElementById('game-over-screen').classList.add('visible');
          }
        }
      }
      triggerCheeseExplosion(cheeseX, cheeseY);
      cheesePieces.splice(i, 1);
    } else if (!chicken.invincible && !gameOver) {
      const cheeseRect = { x: c.x, y: c.y, width: CHEESE_SIZE * 2, height: CHEESE_SIZE * 2.4 };
      if (rectOverlap(chicken, cheeseRect)) {
        health--;
        chicken.invincible = true;
        chicken.invincibleTimer = 90;
        updateHealthDisplay();
        triggerCheeseExplosion(c.x + CHEESE_SIZE, c.y + CHEESE_SIZE);
        cheesePieces.splice(i, 1);
        if (health <= 0) {
          gameOver = true;
          document.getElementById('game-over-screen').classList.add('visible');
        }
      }
    }
  }
}

function updateBoss() {
  if (boss.exploding) {
    updateBossExplosion();
    return;
  }

  const b = boss;
  b.isMoving = false;

  // Move toward the player
  const chickenCenterX = chicken.x + chicken.width / 2;
  const bossCenterX = b.x + b.width / 2;
  const diff = chickenCenterX - bossCenterX;
  if (Math.abs(diff) > 15) {
    const prevX = b.x;
    b.x += (diff > 0 ? 1 : -1) * Math.min(b.moveSpeed, Math.abs(diff) / 2);
    b.x = Math.max(0, Math.min(GAME_WIDTH - b.width, b.x));
    if (b.x !== prevX) b.isMoving = true;
  }

  // Extend mace to 2x length (160) when player is on a side platform
  const leftPlatform = platforms[1];
  const rightPlatform = platforms[2];
  const onLeftPlatform = leftPlatform && chicken.y + chicken.height >= leftPlatform.y - 5 &&
    chicken.y + chicken.height <= leftPlatform.y + 15 &&
    chicken.x + chicken.width > leftPlatform.x && chicken.x < leftPlatform.x + leftPlatform.width;
  const onRightPlatform = rightPlatform && chicken.y + chicken.height >= rightPlatform.y - 5 &&
    chicken.y + chicken.height <= rightPlatform.y + 15 &&
    chicken.x + chicken.width > rightPlatform.x && chicken.x < rightPlatform.x + rightPlatform.width;
  b.maceLength = (onLeftPlatform || onRightPlatform) ? 160 : 80;

  // Variable mace swing speed (0.04 to 0.14)
  b.maceVariationPhase += 0.02;
  b.maceSwingSpeed = 0.04 + 0.1 * (0.5 + 0.5 * Math.sin(b.maceVariationPhase));

  // Mace swings on side closest to player - angle oscillates
  b.maceAngle += b.maceSwingSpeed * b.maceSwingDir;
  if (b.maceAngle > 1.5) b.maceSwingDir = -1;
  if (b.maceAngle < -1.5) b.maceSwingDir = 1;

  // Toe exposure: when mace at top AND boss moving, expose toe for ~0.5 sec (30 frames)
  const maceAtTop = b.maceAngle >= -1.55 && b.maceAngle <= -1.35;
  if (b.isMoving && maceAtTop) b.toeExposedTimer = 30;
  if (b.toeExposedTimer > 0) b.toeExposedTimer--;
}

function checkLevel1Complete() {
  if (level1Transitioning) return;
  const allEnemiesDead = enemies.every(e => e.health <= 0);
  const allBatsDead = bats.every(b => b.health <= 0);
  if (allEnemiesDead && allBatsDead && (enemies.length > 0 || bats.length > 0)) {
    level1Transitioning = true;
    document.getElementById('level-complete-screen').classList.add('visible');
    setTimeout(() => {
      document.getElementById('level-complete-screen').classList.remove('visible');
      startLevel2();
      level1Transitioning = false;
    }, 1500);
  }
}

let level3Transitioning = false;
function checkLevel3Complete() {
  if (level3Transitioning) return;
  if (bricks.length === 0) {
    level3Transitioning = true;
    document.getElementById('you-won-screen').classList.add('visible');
    gameState = STATE.YOU_WON;
  }
}

function gameLoop() {
  if (gameState === STATE.MENU) {
    drawMenu();
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameState === STATE.LEVEL_1) {
    if (!gameOver) {
      updateChicken();
      updateEggs();
      updateEnemies();
      updateBats();
      updateCheese();
      updateEnemyExplosions();
      checkLevel1Complete();
    }
    drawBackgroundLevel1();
    drawPlatforms();
    drawCoin();
    eggs.forEach(drawEgg);
    cheesePieces.forEach(drawCheese);
    enemies.forEach(drawEnemy);
    bats.forEach(drawBat);
    drawEnemyExplosions();
    drawChicken();
  } else if (gameState === STATE.LEVEL_2) {
    if (!gameOver) {
      updateChicken();
      updateEggs();
      updateBoss();
    }
    drawBackgroundLevel2();
    drawPlatforms();
    eggs.forEach(drawEgg);
    drawBoss();
    drawChicken();
  } else if (gameState === STATE.LEVEL_3) {
    if (!gameOver && !level3Exploding) {
      updateChicken();
      updateEggs();
      updateShields();
      updateSpaceships();
      updateEggSplats();
      level3SpaceshipSpawnTimer++;
      if (level3SpaceshipSpawnTimer >= 60) {
        level3SpaceshipSpawnTimer = 0;
        spawnLevel3Spaceships();
      }
      checkLevel3Complete();
      level3TimeLeft -= 1 / 60;
      if (level3TimeLeft <= 0 && bricks.length > 0) {
        level3Exploding = true;
        triggerLevel3Explosion();
      }
    } else if (level3Exploding) {
      updateLevel3Explosion();
    }
    drawBackgroundLevel3();
    drawPlatforms();
    drawBricks();
    drawShields();
    drawJellybean();
    drawSpaceships();
    eggs.forEach(drawEgg);
    drawEggSplats();
    drawChicken();
    if (!level3Exploding) drawLevel3Timer();
    else drawLevel3Explosion();
  }

  requestAnimationFrame(gameLoop);
}

// Start - wait for DOM, init canvas, then run
function init() {
  if (!initCanvas()) {
    document.body.innerHTML = '<div style="color:white;padding:20px;text-align:center;">' +
      '<h2>Canvas Error</h2><p>Could not initialize game canvas.</p>' +
      '<p>Try opening via a local server: <code>python3 -m http.server 8080</code> then visit <code>http://localhost:8080</code></p>' +
      '</div>';
    return;
  }
  document.getElementById('ui-overlay').style.display = 'none';
  document.getElementById('start-btn').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('main-menu').classList.add('hidden');
    startLevel1();
  });
  const skipBtn = document.getElementById('skip-to-level');
  if (skipBtn) skipBtn.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('main-menu').classList.add('hidden');
    startLevel1();
  });
  document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('you-won-screen').classList.remove('visible');
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('ui-overlay').style.display = 'none';
    gameState = STATE.MENU;
  });
  gameLoop();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

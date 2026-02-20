// Chicken Run - Egg Defender
// A sidescrolling platformer game

let canvas, ctx;

const soundPools = {};
const SOUND_VOLUME = 0.5;
const MUSIC_VOLUME = 0.15;
const SOUNDS_PER_SECOND = 4;
const lastShootTimes = [0, 0, 0, 0];
const lastExplodeTimes = [0, 0, 0, 0];
const musicTracks = {
  menu: 'menu.mp3',
  level1: 'levelone.mp3',
  level2: 'disco.mp3',
  level3: 'breakout.mp3',
  level4: 'theskies.mp3'
};
let currentMusic = null;
let musicEl = null;
function initAudio() {
  const poolSizes = { shoot: 4, explode: 3, powerup: 2 };
  for (const name of ['shoot', 'explode', 'powerup']) {
    soundPools[name] = [];
    for (let i = 0; i < poolSizes[name]; i++) {
      const a = new Audio(name + '.wav');
      a.volume = SOUND_VOLUME;
      soundPools[name].push(a);
    }
  }
  if (!musicEl) {
    musicEl = new Audio();
    musicEl.volume = MUSIC_VOLUME;
    musicEl.loop = true;
  }
}
function playMusic(state) {
  const file = musicTracks[state];
  if (!file || !musicEl) return;
  if (currentMusic === state) return;
  currentMusic = state;
  try {
    musicEl.pause();
    musicEl.src = file;
    musicEl.play();
  } catch (_) {}
}
function canPlayRateLimited(times) {
  const now = Date.now();
  if (now - times[0] >= 1000) return true;
  return false;
}
function recordPlay(times) {
  const now = Date.now();
  for (let i = 0; i < times.length - 1; i++) times[i] = times[i + 1];
  times[times.length - 1] = now;
}
function playSound(name, rateLimitTimes) {
  const pool = soundPools[name];
  if (!pool) return;
  if (rateLimitTimes && !canPlayRateLimited(rateLimitTimes)) return;
  const a = pool.find(el => el.paused || el.ended) || pool[0];
  try {
    a.currentTime = 0;
    a.play();
    if (rateLimitTimes) recordPlay(rateLimitTimes);
  } catch (_) {}
}
function playShoot() { playSound('shoot', lastShootTimes); }
function playExplode() { playSound('explode', lastExplodeTimes); }
function playPowerup() { playSound('powerup'); }

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
const STATE = { SPLASH: 'splash', MENU: 'menu', LEVEL_1: 'level1', LEVEL_2: 'level2', LEVEL_3: 'level3', LEVEL_4: 'level4', GAME_OVER: 'gameover', YOU_WON: 'youwon' };
let gameState = STATE.SPLASH;

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

// Level 4 - Side-scrolling shooter (biplane in space)
const BIPLANE_SPEED = 5;
const BIPLANE_WIDTH = 60;
const BIPLANE_HEIGHT = 35;
const LEVEL_4_EGG_SIZE = 5;
const LEVEL_4_EGG_SPEED = 14;
const LEVEL_4_FIRE_RATE = 6;
const LEVEL_4_BOMB_RADIUS = 200;
const LEVEL_4_SHIELD_MAX = 600;
const RAIL_DAMAGE = 2;
let level4Stars = [];
let level4Comets = [];
let level4BgOffset = 0;
let level4Enemies = [];
let level4Projectiles = [];
let level4Bombs = [];
let level4BombActive = false;
let level4ShieldTimer = 0;
let level4Phase = 0;
let level4LandersKilled = 0;
let level4BeetlesKilled = 0;
let level4AstronautKilled = false;
let level4AstronautSpawned = false;
let level4MedCrosses = [];
let level4AstronautExploding = false;
let level4AstronautExplosionParticles = [];
let level4AstronautExplosionTimer = 0;
let level4EnemyDebris = [];
let level4SpawnTimer = 0;
let level4FireCooldown = 0;

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

function triggerAstronautExplosion() {
  level4AstronautExploding = true;
  level4AstronautExplosionTimer = 120; // 2 seconds at 60fps
  level4AstronautExplosionParticles = [];
  for (let i = 0; i < 600; i++) {
    level4AstronautExplosionParticles.push({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT,
      vx: (Math.random() - 0.5) * 25,
      vy: (Math.random() - 0.5) * 25,
      size: 25 + Math.random() * 80,
      life: 1,
      color: ['#2266ff', '#4488ff', '#66aaff', '#2288dd', '#aaddff', '#3377cc', '#1155dd'][Math.floor(Math.random() * 7)]
    });
  }
}

function updateAstronautExplosion() {
  level4AstronautExplosionTimer--;
  level4AstronautExplosionParticles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.008;
  });
  level4AstronautExplosionParticles = level4AstronautExplosionParticles.filter(p => p.life > 0);
  if (level4AstronautExplosionTimer <= 0) {
    document.getElementById('you-won-screen').classList.add('visible');
    gameState = STATE.YOU_WON;
  }
}

function drawAstronautExplosion() {
  const progress = 1 - level4AstronautExplosionTimer / 120;
  const blueIntensity = 0.4 + progress * 0.5;
  ctx.fillStyle = `rgba(20, 60, 180, ${blueIntensity})`;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  level4AstronautExplosionParticles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function spawnLevel4EnemyDebris(enemy) {
  playExplode();
  const vx = 5 + Math.random() * 6;
  const vy = (Math.random() - 0.5) * 8;
  level4EnemyDebris.push({
    x: enemy.x,
    y: enemy.y,
    type: enemy.type,
    width: enemy.width,
    height: enemy.height,
    vx,
    vy,
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * 0.3,
    damage: 1
  });
  for (let i = 0; i < 12; i++) {
    enemyExplosions.push({
      x: enemy.x + enemy.width / 2 + (Math.random() - 0.5) * 30,
      y: enemy.y + enemy.height / 2 + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      size: 8 + Math.random() * 12,
      life: 1,
      color: ['#ff8800', '#ff6600', '#ffaa00', '#ff4400'][Math.floor(Math.random() * 4)]
    });
  }
}

function updateLevel4EnemyDebris() {
  for (let i = level4EnemyDebris.length - 1; i >= 0; i--) {
    const d = level4EnemyDebris[i];
    d.x += d.vx;
    d.y += d.vy;
    d.rotation += d.rotationSpeed;
    if (Math.random() < 0.4) {
      enemyExplosions.push({
        x: d.x + d.width / 2 + (Math.random() - 0.5) * 20,
        y: d.y + d.height / 2 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 6 + Math.random() * 8,
        life: 1,
        color: ['#ff8800', '#ff6600', '#ffaa00'][Math.floor(Math.random() * 3)]
      });
    }
    const debrisRect = { x: d.x, y: d.y, width: d.width, height: d.height };
    for (let j = level4Enemies.length - 1; j >= 0; j--) {
      const other = level4Enemies[j];
      if (other.type === 'astronaut') continue;
      if (rectOverlap(debrisRect, other)) {
        other.health -= d.damage;
        if (other.health <= 0) {
          if (other.type === 'lander') level4LandersKilled++;
          else if (other.type === 'beetle') level4BeetlesKilled++;
          spawnLevel4EnemyDebris(other);
          level4Enemies.splice(j, 1);
        }
      }
    }
    if (d.x > GAME_WIDTH + 100 || d.y < -100 || d.y > GAME_HEIGHT + 100) {
      level4EnemyDebris.splice(i, 1);
    }
  }
}

function drawLevel4EnemyDebris() {
  level4EnemyDebris.forEach(d => {
    ctx.save();
    ctx.translate(d.x + d.width / 2, d.y + d.height / 2);
    ctx.rotate(d.rotation);
    ctx.translate(-d.width / 2, -d.height / 2);
    if (d.type === 'lander') {
      ctx.fillStyle = '#666';
      ctx.fillRect(5, 10, 30, 25);
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.arc(20, 35, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.type === 'beetle') {
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath();
      ctx.ellipse(d.width / 2, d.height / 2, d.width / 2 - 2, d.height / 2 - 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff8800';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  });
}

function triggerEnemyExplosion(x, y) {
  playExplode();
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
  level3Jellybean = { shieldIndex: 0, width: 36, height: 36, collected: false };
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
let health = 5.0;
let gameOver = false;
let keys = {};
let menuEggs = [];
let menuTrailParticles = [];
let menuChickenTimer = 0;
let menuChickenX = 0;
let menuChickenY = 0;
let menuChickenSide = 'bottom';
let menuChickenFacingRight = true;
let menuChickenFacingDown = false;
let menuChickenPhase = 'hidden'; // 'hidden' | 'popping' | 'firing' | 'leaving'
let menuChickenPhaseTimer = 0;

// Splash screen - samurai chicken animation
let splashTime = 0;
let splashChickenX = 0;
let splashChickenY = 0;
let splashChickenFacingRight = true;
let splashSwordAngle = 0;
const SPLASH_TEXT = 'Click to Continue';
const splashEnemies = [];
const splashExplosions = [];
let splashSpawnTimer = 0;
const SPLASH_SWORD_PIVOT_X = 32;
const SPLASH_SWORD_PIVOT_Y = 24;

let level1Transitioning = false;
let level1Countdown = 0;

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
  else if (gameState === STATE.LEVEL_4) startLevel4();
});

function startLevel1() {
  gameState = STATE.LEVEL_1;
  playMusic('level1');
  level1Transitioning = false;
  level1Countdown = 180; // 3 seconds at 60fps
  platforms = platformsLevel1;
  resetGame();
  initEnemies();
  document.getElementById('ui-overlay').style.display = 'block';
}

function startLevel2() {
  gameState = STATE.LEVEL_2;
  playMusic('level2');
  platforms = platformsLevel2;
  resetGame();
  initBoss();
  document.getElementById('ui-overlay').style.display = 'block';
}

function startLevel3() {
  gameState = STATE.LEVEL_3;
  playMusic('level3');
  level3Transitioning = false;
  platforms = platformsLevel3;
  resetGame();
  initBricks();
  initShields();
  document.getElementById('ui-overlay').style.display = 'block';
}

function initLevel4() {
  chicken.x = 150;
  chicken.y = GAME_HEIGHT / 2 - BIPLANE_HEIGHT / 2;
  chicken.vx = 0;
  chicken.vy = 0;
  eggs.length = 0;
  level4Stars = [];
  level4Comets = [];
  level4BgOffset = 0;
  level4Enemies = [];
  level4Projectiles = [];
  enemyExplosions.length = 0;
  level4Bombs = [];
  level4BombActive = false;
  level4ShieldTimer = 0;
  level4Phase = 0;
  level4LandersKilled = 0;
  level4BeetlesKilled = 0;
  level4AstronautKilled = false;
  level4AstronautSpawned = false;
  level4AstronautExploding = false;
  level4AstronautExplosionParticles = [];
  level4AstronautExplosionTimer = 0;
  level4EnemyDebris = [];
  level4MedCrosses = [];
  level4SpawnTimer = 0;
  level4FireCooldown = 0;
  for (let i = 0; i < 80; i++) {
    level4Stars.push({
      x: Math.random() * GAME_WIDTH * 2,
      y: Math.random() * GAME_HEIGHT,
      size: 1 + Math.random() * 2,
      speed: 2 + Math.random() * 4,
      brightness: 0.5 + Math.random() * 0.5
    });
  }
  for (let i = 0; i < 8; i++) {
    level4Comets.push({
      x: GAME_WIDTH + Math.random() * 400,
      y: Math.random() * GAME_HEIGHT,
      length: 30 + Math.random() * 40,
      speed: 8 + Math.random() * 6,
      angle: Math.PI * 0.95 + Math.random() * 0.1
    });
  }
  spawnLevel4Bombs();
  level4ShieldTimer = LEVEL_4_SHIELD_MAX;
  level4MedCrosses = [
    { x: GAME_WIDTH + 100 + Math.random() * 200, y: 80 + Math.random() * (GAME_HEIGHT - 160), width: 28, height: 28, vx: -3 },
    { x: GAME_WIDTH + 400 + Math.random() * 300, y: 80 + Math.random() * (GAME_HEIGHT - 160), width: 28, height: 28, vx: -3 }
  ];
}

const LEVEL_4_MAX_BOMBS = 2;

function spawnLevel4Bombs() {
  level4Bombs.length = 0;
  for (let i = 0; i < LEVEL_4_MAX_BOMBS; i++) {
    level4Bombs.push({
      x: GAME_WIDTH + 50 + Math.random() * 200 + i * 80,
      y: 80 + Math.random() * (GAME_HEIGHT - 160),
      width: 28,
      height: 28,
      vx: -2.5 - Math.random() * 1.5,
      collected: false
    });
  }
}

function startLevel4() {
  gameState = STATE.LEVEL_4;
  playMusic('level4');
  platforms = platformsLevel3;
  resetGame();
  initLevel4();
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
  health = 5.0;
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
    egg.className = 'health-egg' + (health < i + 1 ? ' lost' : '');
    container.appendChild(egg);
  }
}

// ========== MENU - Chicken pops up and fires eggs ==========
const MENU_EGG_COLORS = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff', '#ff8844'];
const MENU_TRAIL_COLORS = ['#ff6666', '#66ff66', '#6666ff', '#ffff66', '#ff66ff', '#66ffff', '#ffaa66', '#aa66ff'];

function updateMenuAnimation() {
  menuChickenTimer--;
  if (menuChickenPhase === 'hidden' && menuChickenTimer <= 0) {
    menuChickenPhase = 'popping';
    menuChickenPhaseTimer = 0;
    const side = ['top', 'bottom', 'left', 'right'][Math.floor(Math.random() * 4)];
    menuChickenSide = side;
    const CHICKEN_HALF_W = 120;
    const CHICKEN_HALF_H = 132;
    if (side === 'bottom') {
      menuChickenX = 150 + Math.random() * (GAME_WIDTH - 300);
      menuChickenY = GAME_HEIGHT + CHICKEN_HALF_H;
      menuChickenFacingRight = true;
      menuChickenFacingDown = false;
    } else if (side === 'top') {
      menuChickenX = 150 + Math.random() * (GAME_WIDTH - 300);
      menuChickenY = -CHICKEN_HALF_H;
      menuChickenFacingRight = true;
      menuChickenFacingDown = true;
    } else if (side === 'left') {
      menuChickenX = -CHICKEN_HALF_W;
      menuChickenY = 100 + Math.random() * (GAME_HEIGHT - 200);
      menuChickenFacingRight = true;
      menuChickenFacingDown = false;
    } else {
      menuChickenX = GAME_WIDTH + CHICKEN_HALF_W;
      menuChickenY = 100 + Math.random() * (GAME_HEIGHT - 200);
      menuChickenFacingRight = false;
      menuChickenFacingDown = false;
    }
    menuChickenTimer = 60 + Math.floor(Math.random() * 60);
  }
  if (menuChickenPhase === 'popping') {
    menuChickenPhaseTimer++;
    const popDuration = 16;
    const CHICKEN_HALF_W = 120;
    const CHICKEN_HALF_H = 132;
    const t = Math.min(1, menuChickenPhaseTimer / popDuration);
    const ease = t * t;
    if (menuChickenSide === 'bottom') {
      menuChickenY = GAME_HEIGHT + CHICKEN_HALF_H - (CHICKEN_HALF_H * 2) * ease;
    } else if (menuChickenSide === 'top') {
      menuChickenY = -CHICKEN_HALF_H + (CHICKEN_HALF_H * 2) * ease;
    } else if (menuChickenSide === 'left') {
      menuChickenX = -CHICKEN_HALF_W + (CHICKEN_HALF_W * 2) * ease;
    } else {
      menuChickenX = GAME_WIDTH + CHICKEN_HALF_W - (CHICKEN_HALF_W * 2) * ease;
    }
    if (menuChickenPhaseTimer >= popDuration) {
      menuChickenPhase = 'firing';
      menuChickenPhaseTimer = 0;
      const cx = menuChickenX;
      const cy = menuChickenY;
      let baseAngle = -Math.PI / 2;
      if (menuChickenSide === 'top') baseAngle = Math.PI / 2;
      else if (menuChickenSide === 'left') baseAngle = 0;
      else if (menuChickenSide === 'right') baseAngle = Math.PI;
      for (let i = 0; i < 3; i++) {
        const angle = baseAngle + (i - 1) * 0.3 + (Math.random() - 0.5) * 0.2;
        const speed = 10 + Math.random() * 8;
        menuEggs.push({
          x: cx + (Math.random() - 0.5) * 20,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: MENU_EGG_COLORS[Math.floor(Math.random() * MENU_EGG_COLORS.length)],
          size: 10
        });
      }
    }
  } else if (menuChickenPhase === 'firing') {
    menuChickenPhaseTimer++;
    if (menuChickenPhaseTimer >= 15) {
      menuChickenPhase = 'leaving';
      menuChickenPhaseTimer = 0;
    }
  } else if (menuChickenPhase === 'leaving') {
    menuChickenPhaseTimer++;
    const leaveDuration = 13;
    const CHICKEN_HALF_W = 120;
    const CHICKEN_HALF_H = 132;
    const t = Math.min(1, menuChickenPhaseTimer / leaveDuration);
    const ease = t * t;
    if (menuChickenSide === 'bottom') {
      menuChickenY = (GAME_HEIGHT - CHICKEN_HALF_H) + CHICKEN_HALF_H * 2 * ease;
    } else if (menuChickenSide === 'top') {
      menuChickenY = CHICKEN_HALF_H - CHICKEN_HALF_H * 2 * ease;
    } else if (menuChickenSide === 'left') {
      menuChickenX = CHICKEN_HALF_W - CHICKEN_HALF_W * 2 * ease;
    } else {
      menuChickenX = (GAME_WIDTH - CHICKEN_HALF_W) - CHICKEN_HALF_W * 2 * ease;
    }
    if (menuChickenPhaseTimer >= leaveDuration) {
      menuChickenPhase = 'hidden';
      menuChickenTimer = 60 + Math.floor(Math.random() * 60);
    }
  }
  menuEggs.forEach(egg => {
    egg.x += egg.vx;
    egg.y += egg.vy;
    if (Math.random() < 0.7) {
      menuTrailParticles.push({
        x: egg.x,
        y: egg.y,
        vx: egg.vx * -0.1 + (Math.random() - 0.5) * 2,
        vy: egg.vy * -0.1 + (Math.random() - 0.5) * 2,
        color: MENU_TRAIL_COLORS[Math.floor(Math.random() * MENU_TRAIL_COLORS.length)],
        life: 1,
        size: 4 + Math.random() * 6
      });
    }
  });
  menuEggs = menuEggs.filter(e => e.x > -50 && e.x < GAME_WIDTH + 50 && e.y > -50 && e.y < GAME_HEIGHT + 50);
  menuTrailParticles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.12;
  });
  menuTrailParticles = menuTrailParticles.filter(p => p.life > 0);
}

function drawMenuChicken() {
  const scale = 6;
  const cx = menuChickenX;
  const cy = menuChickenY;

  ctx.save();
  ctx.translate(cx, cy);
  if (menuChickenFacingDown) ctx.rotate(Math.PI);
  if (!menuChickenFacingRight) ctx.scale(-1, 1);
  ctx.scale(scale, scale);
  ctx.translate(-20, -22);

  ctx.fillStyle = '#fff5d4';
  ctx.beginPath();
  ctx.ellipse(20, 28, 14, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8c870';
  ctx.lineWidth = 2;
  ctx.stroke();

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
}

function drawMenu() {
  updateMenuAnimation();

  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, '#0a0a1a');
  gradient.addColorStop(0.5, '#1a1a3a');
  gradient.addColorStop(1, '#0f0f23');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#fff';
  for (let i = 0; i < 80; i++) {
    const x = (i * 37 + 13) % GAME_WIDTH;
    const y = (i * 53 + 7) % GAME_HEIGHT;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  menuTrailParticles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  menuEggs.forEach(egg => {
    ctx.fillStyle = egg.color;
    ctx.beginPath();
    ctx.ellipse(egg.x, egg.y, egg.size, egg.size * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  if (menuChickenPhase !== 'hidden') {
    drawMenuChicken();
  }
}

function drawLevel1Countdown() {
  const sec = Math.ceil(level1Countdown / 60);
  if (sec < 1) return;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 120px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(sec), GAME_WIDTH / 2, GAME_HEIGHT / 2);
  ctx.restore();
}

function drawControlsHint() {
  const keyW = 18;
  const keyH = 16;
  const gap = 3;
  const baseX = 20;
  const baseY = GAME_HEIGHT - 70;
  const showE = gameState === STATE.LEVEL_1 || gameState === STATE.LEVEL_2;
  const showSpace = gameState === STATE.LEVEL_4;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  const drawKey = (x, y, w, h, label) => {
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
  };
  drawKey(baseX + keyW + gap, baseY, keyW, keyH, 'W');
  if (showE) drawKey(baseX + (keyW + gap) * 2, baseY, keyW, keyH, 'E');
  drawKey(baseX, baseY + keyH + gap, keyW, keyH, 'A');
  drawKey(baseX + keyW + gap, baseY + keyH + gap, keyW, keyH, 'S');
  drawKey(baseX + (keyW + gap) * 2, baseY + keyH + gap, keyW, keyH, 'D');
  drawKey(baseX + (keyW + gap) * 4, baseY + keyH + gap, keyW + 4, keyH, 'J');
  if (showSpace) drawKey(baseX + (keyW + gap) * 5 + 4, baseY + keyH + gap, 42, keyH, 'Space');
  ctx.restore();
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

// ========== LEVEL 4 - Side-scrolling shooter ==========
function drawBackgroundLevel4() {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, '#0a0a1a');
  gradient.addColorStop(0.3, '#0d0d2e');
  gradient.addColorStop(0.7, '#151530');
  gradient.addColorStop(1, '#080818');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  level4Stars.forEach(s => {
    ctx.globalAlpha = s.brightness * (0.7 + 0.3 * Math.sin(Date.now() / 200 + s.x));
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  level4Comets.forEach(c => {
    ctx.strokeStyle = `rgba(30, 35, 55, ${0.25 + 0.15 * Math.sin(Date.now() / 100)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const tailX = c.x - Math.cos(c.angle) * c.length;
    const tailY = c.y - Math.sin(c.angle) * c.length;
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(c.x, c.y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(40, 45, 65, 0.4)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBiplane() {
  const bx = chicken.x;
  const by = chicken.y;
  const cx = bx + BIPLANE_WIDTH / 2;
  const cy = by + BIPLANE_HEIGHT / 2;

  // Top-down retro airplane: fuselage center, wings protruding sides
  // Wings (red) - extend from top and bottom
  ctx.fillStyle = '#cc3333';
  ctx.fillRect(bx + 8, by + 2, 44, 8);
  ctx.fillRect(bx + 8, by + BIPLANE_HEIGHT - 10, 44, 8);
  ctx.strokeStyle = '#991111';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 8, by + 2, 44, 8);
  ctx.strokeRect(bx + 8, by + BIPLANE_HEIGHT - 10, 44, 8);

  // Fuselage (white) - elongated body
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#dddddd';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Nose (red) - pointed front
  ctx.fillStyle = '#cc3333';
  ctx.beginPath();
  ctx.moveTo(bx + BIPLANE_WIDTH - 4, cy);
  ctx.lineTo(bx + BIPLANE_WIDTH + 6, cy - 6);
  ctx.lineTo(bx + BIPLANE_WIDTH + 6, cy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#991111';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Tail (red)
  ctx.fillStyle = '#cc3333';
  ctx.beginPath();
  ctx.ellipse(bx + 6, cy, 6, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#991111';
  ctx.stroke();

  if (level4BombActive) {
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(bx + BIPLANE_WIDTH + 12, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#aa0000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Cockpit (white circle)
  ctx.fillStyle = '#e8f4fc';
  ctx.beginPath();
  ctx.arc(cx - 2, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (chicken.hasTopHat) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(cx - 4, cy - 8, 8, 5);
  }
}

function drawLevel4Enemies() {
  level4Enemies.forEach(e => {
    if (e.type === 'lander') {
      ctx.fillStyle = '#888';
      ctx.fillRect(e.x + 5, e.y + 10, 30, 25);
      ctx.fillStyle = '#aaa';
      ctx.fillRect(e.x + 10, e.y + 15, 20, 15);
      ctx.fillStyle = '#666';
      ctx.beginPath();
      ctx.moveTo(e.x + 15, e.y + 5);
      ctx.lineTo(e.x + 25, e.y + 5);
      ctx.lineTo(e.x + 20, e.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(e.x + 20, e.y + 35, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'beetle') {
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath();
      ctx.ellipse(e.x + e.width / 2, e.y + e.height / 2, e.width / 2 - 2, e.height / 2 - 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ccaa00';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(e.x + 8, e.y + 6, 4, 0, Math.PI * 2);
      ctx.arc(e.x + 20, e.y + 10, 3, 0, Math.PI * 2);
      ctx.arc(e.x + 27, e.y + 6, 4, 0, Math.PI * 2);
      ctx.arc(e.x + 12, e.y + 20, 3, 0, Math.PI * 2);
      ctx.arc(e.x + 24, e.y + 20, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'astronaut') {
      const acx = e.x + e.width / 2;
      const acy = e.y + e.height / 2;
      const shieldRadius = 100;
      const rot = (e.shieldRotation || 0) % (Math.PI * 2);
      const cutoutAngle = Math.PI / 3;
      ctx.fillStyle = 'rgba(80, 120, 200, 0.6)';
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.9)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(acx, acy, shieldRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.beginPath();
      ctx.moveTo(acx, acy);
      ctx.arc(acx, acy, shieldRadius + 2, rot, rot + cutoutAngle);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(acx, acy);
      ctx.arc(acx, acy, shieldRadius + 2, rot + Math.PI, rot + Math.PI + cutoutAngle);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x + 20, e.y - 20, 110, 12);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(e.x + 22, e.y - 18, (106 * e.health) / e.maxHealth, 8);
      ctx.fillStyle = '#fff';
      ctx.fillRect(e.x + 30, e.y + 60, 90, 135);
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x + 45, e.y + 90, 60, 90);
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(e.x + 75, e.y + 45, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#444';
      ctx.fillRect(e.x + 105, e.y + 105, 45, 24);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(e.x + 144, e.y + 108, 24, 18);
    }
  });
}

function drawLevel4Projectiles() {
  level4Projectiles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawLevel4ShieldBar() {
  const barW = 200;
  const barH = 12;
  const barX = (GAME_WIDTH - barW) / 2;
  const barY = GAME_HEIGHT - 28;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = 'rgba(68, 136, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barW, barH);
  const fillW = (barW - 4) * Math.max(0, level4ShieldTimer) / LEVEL_4_SHIELD_MAX;
  if (fillW > 0) {
    ctx.fillStyle = 'rgba(68, 136, 255, 0.8)';
    ctx.fillRect(barX + 2, barY + 2, fillW, barH - 4);
  }
}

function drawLevel4ShieldEffect() {
  if (!chicken.invincible || chicken.invincibleTimer > 0) return;
  const cx = chicken.x + BIPLANE_WIDTH / 2;
  const cy = chicken.y + BIPLANE_HEIGHT / 2;
  const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 80);
  ctx.strokeStyle = `rgba(68, 136, 255, ${0.5 * pulse})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = `rgba(100, 160, 255, ${0.3 * pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 55, 0, Math.PI * 2);
  ctx.stroke();
}

function drawLevel4MedCrosses() {
  level4MedCrosses.forEach(m => {
    if (m.x < -50) return;
    const cx = m.x + m.width / 2;
    const cy = m.y + m.height / 2;
    const s = 10;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cc3333';
    ctx.lineWidth = 3;
    ctx.fillRect(cx - s / 2, cy - s * 1.2, s, s * 2.4);
    ctx.fillRect(cx - s * 1.2, cy - s / 2, s * 2.4, s);
    ctx.strokeRect(cx - s / 2, cy - s * 1.2, s, s * 2.4);
    ctx.strokeRect(cx - s * 1.2, cy - s / 2, s * 2.4, s);
  });
}

function drawLevel4Bombs() {
  level4Bombs.forEach(b => {
    if (b.collected) return;
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    const radius = 18;
    ctx.fillStyle = '#dd0000';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#aa0000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('B', cx, cy);
  });
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
  const cx = x + w / 2;
  const cy = y + h / 2;
  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
  gradient.addColorStop(0, '#ff69b4');
  gradient.addColorStop(0.3, '#ff1493');
  gradient.addColorStop(0.7, '#ff85c1');
  gradient.addColorStop(1, '#ffb6c1');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c71585';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy + h / 4);
  ctx.lineTo(cx - w / 4, cy - h / 4);
  ctx.lineTo(cx + w / 4, cy - h / 4);
  ctx.closePath();
  ctx.fill();
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
  const size = egg.level4 ? LEVEL_4_EGG_SIZE : EGG_SIZE;
  ctx.fillStyle = egg.bomb ? '#ff8888' : '#fff8e7';
  ctx.beginPath();
  ctx.ellipse(egg.x, egg.y, size, size * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = egg.bomb ? '#cc4444' : '#e8d4a8';
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

  // Green vulnerable zone on forehead
  const headSpot = getBossHeadSpotRect();
  const headGlow = 0.5 + 0.5 * Math.sin(Date.now() / 120);
  ctx.shadowColor = '#00ff00';
  ctx.shadowBlur = 8 + headGlow * 6;
  ctx.fillStyle = '#33ff33';
  ctx.fillRect(headSpot.x, headSpot.y, headSpot.width, headSpot.height);
  ctx.fillStyle = '#66ff66';
  ctx.fillRect(headSpot.x + 4, headSpot.y + 4, headSpot.width - 8, headSpot.height - 8);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#00aa00';
  ctx.lineWidth = 2;
  ctx.strokeRect(headSpot.x, headSpot.y, headSpot.width, headSpot.height);

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

  // Toe shield - covers weak spot unless opened by shooting head spot (2 sec)
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

function getBossHeadSpotRect() {
  const b = boss;
  return {
    x: b.x + b.width / 2 - 14,
    y: b.y + 28,
    width: 28,
    height: 24
  };
}

// Toe is exposed when toeExposedTimer > 0. Timer set to 2 sec when head spot is shot.
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

// ========== LEVEL 4 - Side-scrolling shooter ==========
function updateBiplane() {
  chicken.vx = 0;
  chicken.vy = 0;
  if (keys['KeyA']) chicken.vx = -BIPLANE_SPEED;
  if (keys['KeyD']) chicken.vx = BIPLANE_SPEED;
  if (keys['KeyW']) chicken.vy = -BIPLANE_SPEED;
  if (keys['KeyS']) chicken.vy = BIPLANE_SPEED;
  chicken.x += chicken.vx;
  chicken.y += chicken.vy;
  chicken.x = Math.max(20, Math.min(GAME_WIDTH - BIPLANE_WIDTH - 20, chicken.x));
  chicken.y = Math.max(20, Math.min(GAME_HEIGHT - BIPLANE_HEIGHT - 20, chicken.y));

  level4BgOffset += 8;
  level4Stars.forEach(s => {
    s.x -= s.speed;
    if (s.x < -10) s.x = GAME_WIDTH + Math.random() * 200;
  });
  level4Comets.forEach(c => {
    c.x -= c.speed;
    if (c.x < -100) {
      c.x = GAME_WIDTH + Math.random() * 300;
      c.y = Math.random() * GAME_HEIGHT;
    }
  });

  if (keys['KeyJ']) {
    level4FireCooldown--;
    if (level4FireCooldown <= 0) {
      level4FireCooldown = 60 / LEVEL_4_FIRE_RATE;
      const ly = chicken.y + 8;
      const ry = chicken.y + BIPLANE_HEIGHT - 13;
      const ex = chicken.x + BIPLANE_WIDTH;
      playShoot();
      eggs.push({
        x: ex, y: ly - LEVEL_4_EGG_SIZE,
        vx: LEVEL_4_EGG_SPEED, vy: 0,
        level4: true, bomb: level4BombActive
      });
      eggs.push({
        x: ex, y: ry - LEVEL_4_EGG_SIZE,
        vx: LEVEL_4_EGG_SPEED, vy: 0,
        level4: true, bomb: level4BombActive
      });
      if (level4BombActive) level4BombActive = false;
    }
  } else level4FireCooldown = 0;

  level4MedCrosses.forEach(m => {
    m.x += m.vx;
    if (m.x < -40) {
      m.x = GAME_WIDTH + 50 + Math.random() * 150;
      m.y = 80 + Math.random() * (GAME_HEIGHT - 160);
    }
    if (rectOverlap(
      { x: chicken.x, y: chicken.y, width: BIPLANE_WIDTH, height: BIPLANE_HEIGHT },
      m, 5)) {
      playPowerup();
      m.x = GAME_WIDTH + 50 + Math.random() * 150;
      m.y = 80 + Math.random() * (GAME_HEIGHT - 160);
      health = 5.0;
      updateHealthDisplay();
    }
  });
  level4Bombs.forEach(b => {
    if (b.collected) return;
    b.x += b.vx;
    if (b.x < -50) {
      b.x = GAME_WIDTH + 50 + Math.random() * 150;
      b.y = 80 + Math.random() * (GAME_HEIGHT - 160);
    }
    if (rectOverlap(
      { x: chicken.x, y: chicken.y, width: BIPLANE_WIDTH, height: BIPLANE_HEIGHT },
      { x: b.x, y: b.y, width: b.width, height: b.height }, 5)) {
      playPowerup();
      b.collected = true;
      level4BombActive = true;
    }
  });

  if (chicken.invincibleTimer > 0) {
    chicken.invincibleTimer--;
    chicken.invincible = true;
  } else if (keys['Space'] && level4ShieldTimer > 0) {
    level4ShieldTimer--;
    chicken.invincible = true;
  } else {
    chicken.invincible = false;
  }
}

function spawnLevel4Enemy(side, type, extra) {
  const sides = ['right', 'left', 'top', 'bottom'];
  const s = side || sides[Math.floor(Math.random() * sides.length)];
  let x, y, vx, vy;
  if (s === 'right') {
    x = GAME_WIDTH + 50 + (extra || 0);
    y = 100 + Math.random() * (GAME_HEIGHT - 200);
    vx = -1.5;
    vy = 0;
  } else if (s === 'left') {
    x = -80 - (extra || 0);
    y = 100 + Math.random() * (GAME_HEIGHT - 200);
    vx = 1.5;
    vy = 0;
  } else if (s === 'top') {
    x = 100 + Math.random() * (GAME_WIDTH - 200);
    y = -80 - (extra || 0);
    vx = (Math.random() - 0.5) * 0.8;
    vy = 1.5;
  } else {
    x = 100 + Math.random() * (GAME_WIDTH - 200);
    y = GAME_HEIGHT + 80 + (extra || 0);
    vx = (Math.random() - 0.5) * 0.8;
    vy = -1.5;
  }
  return { x, y, vx, vy };
}

const LEVEL_4_LANDERS_REQUIRED = 95;  // 63 * 1.5
const LEVEL_4_BEETLES_REQUIRED = 95;  // 63 * 1.5
const LEVEL_4_SPAWN_INTERVAL = 12;    // 8 * 1.5
const LEVEL_4_BEETLE_SPAWN_INTERVAL = 6;  // 4 * 1.5

function isLevel4EnemyVisible(enemy) {
  return enemy.x + enemy.width > 0 && enemy.x < GAME_WIDTH &&
         enemy.y + enemy.height > 0 && enemy.y < GAME_HEIGHT;
}

function isEggHitThroughAstronautShieldCutout(egg, enemy) {
  const acx = enemy.x + enemy.width / 2;
  const acy = enemy.y + enemy.height / 2;
  const ecx = egg.x + (egg.level4 ? LEVEL_4_EGG_SIZE : EGG_SIZE);
  const ecy = egg.y + (egg.level4 ? LEVEL_4_EGG_SIZE : EGG_SIZE) * 1.2;
  let angle = Math.atan2(ecy - acy, ecx - acx);
  if (angle < 0) angle += Math.PI * 2;
  const wrap = (a) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  angle = wrap(angle);
  const rot = wrap(enemy.shieldRotation || 0);
  const c1s = rot, c1e = wrap(rot + Math.PI / 3);
  const c2s = wrap(rot + Math.PI), c2e = wrap(rot + Math.PI + Math.PI / 3);
  const inCutout1 = c1s < c1e ? (angle >= c1s && angle < c1e) : (angle >= c1s || angle < c1e);
  const inCutout2 = c2s < c2e ? (angle >= c2s && angle < c2e) : (angle >= c2s || angle < c2e);
  return inCutout1 || inCutout2;
}

function spawnLevel4EnemyBatch() {
  if (level4Phase === 0 && level4LandersKilled < LEVEL_4_LANDERS_REQUIRED) {
    for (let k = 0; k < 3; k++) {
      const pos = spawnLevel4Enemy(null, 'lander', Math.random() * 80);
      level4Enemies.push({
      type: 'lander',
      x: pos.x,
      y: pos.y,
      width: 40,
      height: 45,
      health: 2,
      maxHealth: 2,
      vx: pos.vx,
      vy: pos.vy,
      shootTimer: Math.floor(Math.random() * 40),
      fragmentColors: ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff']
    });
    }
  } else if (level4Phase === 1 && level4BeetlesKilled < LEVEL_4_BEETLES_REQUIRED) {
    for (let k = 0; k < 5; k++) {
      const pos = spawnLevel4Enemy(null, 'beetle', Math.random() * 80);
      level4Enemies.push({
      type: 'beetle',
      x: pos.x,
      y: pos.y,
      width: 35,
      height: 28,
      health: 4,
      maxHealth: 4,
      vx: pos.vx,
      vy: pos.vy,
      shootTimer: Math.floor(Math.random() * 50)
    });
    }
  } else if (level4Phase === 2 && !level4AstronautSpawned) {
    level4AstronautSpawned = true;
    level4Enemies.push({
      type: 'astronaut',
      x: GAME_WIDTH + 80,
      y: GAME_HEIGHT / 2 - 120,
      width: 150,
      height: 240,
      health: 60,
      maxHealth: 60,
      vx: -2,
      vy: 0,
      shootTimer: 8,
      shieldRotation: 0
    });
  }
}

function updateLevel4Enemies() {
  if (level4Phase === 0 && level4LandersKilled >= LEVEL_4_LANDERS_REQUIRED && level4Enemies.length === 0) {
    level4Phase = 1;
  } else if (level4Phase === 1 && level4BeetlesKilled >= LEVEL_4_BEETLES_REQUIRED && level4Enemies.length === 0) {
    level4Phase = 2;
  }
  level4SpawnTimer--;
  const spawnInterval = level4Phase === 1 ? LEVEL_4_BEETLE_SPAWN_INTERVAL : LEVEL_4_SPAWN_INTERVAL;
  if (level4SpawnTimer <= 0) {
    level4SpawnTimer = spawnInterval;
    spawnLevel4EnemyBatch();
  }
  for (let i = level4Enemies.length - 1; i >= 0; i--) {
    const e = level4Enemies[i];
    e.x += e.vx || 0;
    e.y += e.vy || 0;
    if (e.type === 'astronaut') {
      e.shieldRotation = (e.shieldRotation || 0) + 0.04;
      e.x = Math.max(e.x, GAME_WIDTH / 2);
      e.y = Math.max(0, Math.min(GAME_HEIGHT - e.height, e.y));
    }
    e.shootTimer--;
    if (e.type === 'lander' && e.shootTimer <= 0) {
      e.shootTimer = 60 + Math.floor(Math.random() * 40);
      const landerCount = 5; // 8 * 0.6 (40% reduction)
      for (let j = 0; j < landerCount; j++) {
        const a = (j / landerCount) * Math.PI * 2 + Math.random() * 0.3;
        level4Projectiles.push({
          x: e.x + e.width / 2,
          y: e.y + e.height / 2,
          vx: Math.cos(a) * 3,
          vy: Math.sin(a) * 3,
          radius: 6,
          color: e.fragmentColors[j % e.fragmentColors.length],
          enemy: true,
          damage: 0.5
        });
      }
    }
    if (e.type === 'beetle' && e.shootTimer <= 0) {
      e.shootTimer = 33 + Math.floor(Math.random() * 34); // 25% fewer shots

      const a = Math.random() * Math.PI * 2;
      level4Projectiles.push({
        x: e.x + e.width / 2,
        y: e.y + e.height / 2,
        vx: Math.cos(a) * 4,
        vy: Math.sin(a) * 4,
        radius: 8,
        color: '#4488ff',
        enemy: true,
        damage: 0.5
      });
    }
    if (e.type === 'astronaut' && e.shootTimer <= 0) {
      e.shootTimer = 8;
      const dx = (chicken.x + BIPLANE_WIDTH / 2) - (e.x + e.width / 2);
      const dy = (chicken.y + BIPLANE_HEIGHT / 2) - (e.y + e.height / 2);
      const baseAngle = Math.atan2(dy, dx);
      const spreadRad = (10 * Math.PI / 180) / 2;
      const angle = baseAngle + (Math.random() - 0.5) * spreadRad * 2;
      const speed = 18;
      level4Projectiles.push({
        x: e.x + e.width / 2,
        y: e.y + e.height / 2 + 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 5,
        color: '#ffff00',
        enemy: true,
        damage: 1
      });
    }
    const offLeft = e.x < -80;
    const offRight = e.x > GAME_WIDTH + 80;
    const offTop = e.y < -80;
    const offBottom = e.y > GAME_HEIGHT + 80;
    if (offLeft || offRight || offTop || offBottom) level4Enemies.splice(i, 1);
  }
  for (let i = level4Projectiles.length - 1; i >= 0; i--) {
    const p = level4Projectiles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < -20 || p.x > GAME_WIDTH + 20 || p.y < -20 || p.y > GAME_HEIGHT + 20) {
      level4Projectiles.splice(i, 1);
    } else if (p.enemy) {
      const planeRect = { x: chicken.x, y: chicken.y, width: BIPLANE_WIDTH, height: BIPLANE_HEIGHT };
      if (circleRectOverlap(p.x, p.y, p.radius, planeRect) && !chicken.invincible) {
        health -= p.damage !== undefined ? p.damage : 1;
        chicken.invincible = true;
        chicken.invincibleTimer = 60;
        updateHealthDisplay();
        level4Projectiles.splice(i, 1);
        if (health <= 0) {
          gameOver = true;
          document.getElementById('game-over-screen').classList.add('visible');
        }
      }
    }
  }
}

function updateChicken() {
  if (gameState === STATE.LEVEL_4) {
    updateBiplane();
    return;
  }
  chicken.vx = 0;
  if (keys['KeyA']) {
    chicken.vx = -MOVE_SPEED;
    chicken.facingRight = false;
  }
  if (keys['KeyD']) {
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

  const jumpKey = keys['Space'] || keys['KeyW'];
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

  // Level 1: respawn on platform and lose 1 health when falling off screen
  if (gameState === STATE.LEVEL_1 && chicken.y > GAME_HEIGHT) {
    const spawnPlatform = platforms[0];
    chicken.x = spawnPlatform.x + 80;
    chicken.y = spawnPlatform.y - chicken.height;
    chicken.vx = 0;
    chicken.vy = 0;
    chicken.onGround = true;
    chicken.canDoubleJump = true;
    health--;
    updateHealthDisplay();
    if (health <= 0) {
      gameOver = true;
      document.getElementById('game-over-screen').classList.add('visible');
    }
  }

  if (gameState === STATE.LEVEL_3) {
    if (megaBurstTimer > 0) megaBurstTimer--;
    if (keys['KeyJ']) {
      level3FireCooldown--;
      if (level3FireCooldown <= 0) {
        level3FireCooldown = 60 / LEVEL_3_FIRE_RATE;
        const cx = chicken.x + chicken.width / 2 - EGG_SIZE;
        const cy = chicken.y + 5 - EGG_SIZE;
        playShoot();
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
  } else if (keys['KeyJ']) {
    if (!chicken.justShot) {
      playShoot();
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
      playPowerup();
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
      const headSpot = getBossHeadSpotRect();
      if (rectOverlap(eggRect, headSpot)) {
        boss.toeExposedTimer = 120;
        triggerEggSplat(egg.x + EGG_SIZE, egg.y + EGG_SIZE);
        eggs.splice(i, 1);
      } else {
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

    if (gameState === STATE.LEVEL_4 && egg.level4) {
      const eggSize = LEVEL_4_EGG_SIZE;
      const eggRect = { x: egg.x - eggSize, y: egg.y - eggSize, width: eggSize * 2, height: eggSize * 2.4 };
      let hitEnemy = false;
      for (let e = level4Enemies.length - 1; e >= 0; e--) {
        const enemy = level4Enemies[e];
        if (!isLevel4EnemyVisible(enemy)) continue;
        if (rectOverlap(eggRect, enemy)) {
          if (egg.bomb) {
            if (enemy.type === 'astronaut') {
              if (!isEggHitThroughAstronautShieldCutout(egg, enemy)) {
                triggerEggSplat(egg.x + eggSize, egg.y + eggSize);
              } else {
                const damage = Math.ceil(enemy.maxHealth / 2);
                enemy.health -= damage;
                triggerEnemyExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                if (enemy.health <= 0) {
                  level4AstronautKilled = true;
                  triggerAstronautExplosion();
                  level4Enemies.splice(e, 1);
                }
              }
            } else {
              const cx = enemy.x + enemy.width / 2;
              const cy = enemy.y + enemy.height / 2;
              for (let j = level4Enemies.length - 1; j >= 0; j--) {
                const other = level4Enemies[j];
                if (other.type === 'astronaut') continue;
                if (!isLevel4EnemyVisible(other)) continue;
                const ocx = other.x + other.width / 2;
                const ocy = other.y + other.height / 2;
                if (Math.hypot(cx - ocx, cy - ocy) <= LEVEL_4_BOMB_RADIUS) {
                  if (other.type === 'lander') {
                    level4LandersKilled++;
                    spawnLevel4EnemyDebris(other);
                  } else if (other.type === 'beetle') {
                    level4BeetlesKilled++;
                    spawnLevel4EnemyDebris(other);
                  } else {
                    triggerEnemyExplosion(ocx, ocy);
                  }
                  level4Enemies.splice(j, 1);
                }
              }
            }
          } else {
            if (enemy.type === 'astronaut') {
              if (!isEggHitThroughAstronautShieldCutout(egg, enemy)) {
                triggerEggSplat(egg.x + eggSize, egg.y + eggSize);
                eggs.splice(i, 1);
                hitEnemy = true;
                break;
              }
            }
            enemy.health--;
            if (enemy.health <= 0) {
              if (enemy.type === 'lander') {
                level4LandersKilled++;
                spawnLevel4EnemyDebris(enemy);
              } else if (enemy.type === 'beetle') {
                level4BeetlesKilled++;
                spawnLevel4EnemyDebris(enemy);
              } else if (enemy.type === 'astronaut') {
                level4AstronautKilled = true;
                triggerAstronautExplosion();
              } else {
                triggerEnemyExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
              }
              level4Enemies.splice(e, 1);
            }
          }
          eggs.splice(i, 1);
          hitEnemy = true;
          break;
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
    document.getElementById('level-complete-screen').querySelector('h2').textContent = 'Level Complete!';
    document.getElementById('level-complete-screen').querySelector('p').textContent = 'Entering the Skies...';
    document.getElementById('level-complete-screen').classList.add('visible');
    setTimeout(() => {
      document.getElementById('level-complete-screen').classList.remove('visible');
      startLevel4();
      level3Transitioning = false;
    }, 1500);
  }
}

function checkLevel4Complete() {
  if (level4AstronautKilled && level4Enemies.length === 0) {
    if (level4AstronautExploding) return;
    document.getElementById('you-won-screen').classList.add('visible');
    gameState = STATE.YOU_WON;
  }
}

function spawnSplashEnemy() {
  const type = Math.random() < 0.5 ? 'blob' : 'bug';
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = -30; y = 80 + Math.random() * (GAME_HEIGHT - 160); }
  else if (side === 1) { x = GAME_WIDTH + 30; y = 80 + Math.random() * (GAME_HEIGHT - 160); }
  else if (side === 2) { x = 80 + Math.random() * (GAME_WIDTH - 160); y = -30; }
  else { x = 80 + Math.random() * (GAME_WIDTH - 160); y = GAME_HEIGHT + 30; }
  const w = type === 'blob' ? 28 : 24;
  const h = type === 'blob' ? 24 : 20;
  const dx = (GAME_WIDTH / 2 - x) * 0.015;
  const dy = (GAME_HEIGHT / 2 - y) * 0.015;
  splashEnemies.push({ x, y, type, w, h, vx: dx, vy: dy });
}

function triggerSplashExplosion(x, y) {
  const cx = GAME_WIDTH / 2;
  const cy = GAME_HEIGHT / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy) || 1;
  const dirX = dx / dist;
  const dirY = dy / dist;
  const colors = ['#7cfc00', '#32cd32', '#ffdd00', '#ff8800', '#e63946'];
  for (let i = 0; i < 12; i++) {
    const angle = Math.atan2(dirY, dirX) + (Math.random() - 0.5) * 1.2;
    const speed = 4 + Math.random() * 8;
    splashExplosions.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      size: 4 + Math.random() * 8
    });
  }
}

function updateSplashEnemies() {
  splashSpawnTimer++;
  if (splashSpawnTimer >= 45) {
    splashSpawnTimer = 0;
    if (splashEnemies.length < 6) spawnSplashEnemy();
  }
  const tip = getSplashSwordTip();
  const hitRadius = 55;
  const swordActive = Math.abs(splashSwordAngle) < 0.5;
  for (let i = splashEnemies.length - 1; i >= 0; i--) {
    const e = splashEnemies[i];
    e.x += e.vx;
    e.y += e.vy;
    if (swordActive) {
      const ex = e.x + e.w / 2;
      const ey = e.y + e.h / 2;
      if (Math.hypot(tip.x - ex, tip.y - ey) < hitRadius) {
        triggerSplashExplosion(ex, ey);
        splashEnemies.splice(i, 1);
      }
    }
  }
  splashExplosions.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.025;
  });
  for (let i = splashExplosions.length - 1; i >= 0; i--) {
    if (splashExplosions[i].life <= 0) splashExplosions.splice(i, 1);
  }
}

function drawSplashEnemy(e) {
  if (e.type === 'blob') {
    const gradient = ctx.createRadialGradient(
      e.x + e.w / 2 - 5, e.y + e.h / 2 - 5, 0,
      e.x + e.w / 2, e.y + e.h / 2, e.w
    );
    gradient.addColorStop(0, '#7cfc00');
    gradient.addColorStop(0.5, '#32cd32');
    gradient.addColorStop(1, '#228b22');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w / 2 - 2, e.h / 2 - 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a5f1a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(e.x + 8, e.y + 8, 3, 0, Math.PI * 2);
    ctx.arc(e.x + 20, e.y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(e.x + 9, e.y + 8, 1.5, 0, Math.PI * 2);
    ctx.arc(e.x + 21, e.y + 8, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w / 2 - 2, e.h / 2 - 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ccaa00';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(e.x + 8, e.y + 10, 2, 0, Math.PI * 2);
    ctx.arc(e.x + 16, e.y + 10, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSplashExplosions() {
  splashExplosions.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function updateSplashAnimation() {
  splashTime++;
  const danceSpeed = 0.04;
  const danceRange = 400;
  splashChickenX = GAME_WIDTH / 2 + Math.sin(splashTime * danceSpeed) * danceRange;
  splashChickenY = GAME_HEIGHT / 2 + Math.sin(splashTime * danceSpeed * 1.3) * 30;
  if (Math.sin(splashTime * danceSpeed) > 0.1) splashChickenFacingRight = true;
  else if (Math.sin(splashTime * danceSpeed) < -0.1) splashChickenFacingRight = false;
  splashSwordAngle = Math.sin(splashTime * 0.15) * Math.PI * 0.6 - Math.PI / 4;

  updateSplashEnemies();

}

function drawSplashSamuraiChicken() {
  const scale = 5;
  const cx = splashChickenX;
  const cy = splashChickenY;
  ctx.save();
  ctx.translate(cx, cy);
  if (!splashChickenFacingRight) ctx.scale(-1, 1);
  ctx.scale(scale, scale);
  ctx.translate(-20, -22);

  ctx.fillStyle = '#fff5d4';
  ctx.beginPath();
  ctx.ellipse(20, 28, 14, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8c870';
  ctx.lineWidth = 2;
  ctx.stroke();

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

  ctx.fillStyle = '#c41e3a';
  ctx.beginPath();
  ctx.ellipse(20, 4, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8b0000';
  ctx.fillRect(8, 2, 24, 3);

  ctx.fillStyle = '#e8c870';
  ctx.beginPath();
  ctx.moveTo(26, 22);
  ctx.quadraticCurveTo(36, 20, SPLASH_SWORD_PIVOT_X, SPLASH_SWORD_PIVOT_Y);
  ctx.quadraticCurveTo(36, 28, 26, 26);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#d4b860';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.save();
  ctx.translate(SPLASH_SWORD_PIVOT_X, SPLASH_SWORD_PIVOT_Y);
  ctx.rotate(splashSwordAngle);
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(0, -1.5, 35, 3);
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(-3, -2, 6, 4);
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(32, -2, 6, 4);
  ctx.restore();

  ctx.restore();
}

function getSplashSwordTip() {
  const scale = 5;
  const tipLocalX = SPLASH_SWORD_PIVOT_X + 35 * Math.cos(splashSwordAngle);
  const tipLocalY = SPLASH_SWORD_PIVOT_Y + 35 * Math.sin(splashSwordAngle);
  const dx = (tipLocalX - 20) * scale;
  const dy = (tipLocalY - 22) * scale;
  return {
    x: splashChickenX + (splashChickenFacingRight ? 1 : -1) * dx,
    y: splashChickenY + dy
  };
}

function drawSplashText() {
  const bannerHeight = 48;
  const bannerY = GAME_HEIGHT - bannerHeight;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, bannerY, GAME_WIDTH, bannerHeight);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, bannerY, GAME_WIDTH, bannerHeight);

  const text = '  ★  ' + SPLASH_TEXT + '  ★  ' + SPLASH_TEXT + '  ★  ';
  ctx.font = 'bold 24px sans-serif';
  const textWidth = ctx.measureText(text).width;
  const scrollSpeed = 2;
  const offset = (splashTime * scrollSpeed) % textWidth;
  const x = GAME_WIDTH - offset;
  const baseY = bannerY + bannerHeight / 2;

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, baseY);
  ctx.fillText(text, x - textWidth, baseY);
}

function drawSplashScreen() {
  updateSplashAnimation();
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, '#0a0a1a');
  gradient.addColorStop(0.5, '#1a1a3a');
  gradient.addColorStop(1, '#0f0f23');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  for (let i = 0; i < 60; i++) {
    const x = (i * 47 + splashTime * 0.5) % (GAME_WIDTH + 40) - 20;
    const y = (i * 31 + 17) % GAME_HEIGHT;
    ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(splashTime * 0.1 + i) * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  splashEnemies.forEach(drawSplashEnemy);
  drawSplashExplosions();
  drawSplashSamuraiChicken();
  drawSplashText();
}

function gameLoop() {
  if (gameState === STATE.SPLASH) {
    drawSplashScreen();
    requestAnimationFrame(gameLoop);
    return;
  }
  if (gameState === STATE.MENU) {
    drawMenu();
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameState === STATE.LEVEL_1) {
    if (level1Countdown > 0) {
      level1Countdown--;
    } else if (!gameOver) {
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
    if (level1Countdown > 0) drawLevel1Countdown();
    drawControlsHint();
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
    drawControlsHint();
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
    drawControlsHint();
  } else if (gameState === STATE.LEVEL_4) {
    if (level4AstronautExploding) {
      updateAstronautExplosion();
      drawBackgroundLevel4();
      drawAstronautExplosion();
      drawLevel4ShieldBar();
      drawControlsHint();
    } else {
      if (!gameOver) {
        updateChicken();
        updateEggs();
        updateLevel4Enemies();
        updateLevel4EnemyDebris();
        updateEnemyExplosions();
      }
      drawBackgroundLevel4();
      drawLevel4Projectiles();
      drawLevel4Enemies();
      drawLevel4EnemyDebris();
      drawLevel4Bombs();
      drawLevel4MedCrosses();
      eggs.forEach(drawEgg);
      drawBiplane();
      drawLevel4ShieldEffect();
      drawLevel4ShieldBar();
      drawEnemyExplosions();
      checkLevel4Complete();
      drawControlsHint();
    }
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
  initAudio();
  document.getElementById('ui-overlay').style.display = 'none';
  canvas.addEventListener('click', () => {
    if (gameState === STATE.SPLASH) {
      gameState = STATE.MENU;
      document.getElementById('main-menu').classList.remove('hidden');
      playMusic('menu');
    }
  });
  document.getElementById('start-btn').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('main-menu').classList.add('hidden');
    startLevel1();
  });
  document.querySelectorAll('.skip-level').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('main-menu').classList.add('hidden');
      const level = parseInt(link.dataset.level, 10);
      if (level === 1) startLevel1();
      else if (level === 2) startLevel2();
      else if (level === 3) startLevel3();
      else if (level === 4) startLevel4();
    });
  });
  document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('you-won-screen').classList.remove('visible');
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('ui-overlay').style.display = 'none';
    gameState = STATE.MENU;
    playMusic('menu');
  });
  gameLoop();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

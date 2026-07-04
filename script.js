/* boids-flock v1.1.0 */
/* Boids — Craig Reynolds' flocking simulation.
   Three steering rules (separation, alignment, cohesion) + cursor interaction,
   a hunting predator, click-placed obstacles, and selectable color modes.
   Uses a spatial hash grid so it stays smooth with hundreds of boids. */

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
let W, H;
let bgGrad = null;

function makeGradient() {
  bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#070c1e");
  bgGrad.addColorStop(0.5, "#050813");
  bgGrad.addColorStop(1, "#04060f");
}
function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; makeGradient(); }
addEventListener("resize", resize);
resize();

const ui = {
  n: el("n"), nVal: el("nVal"),
  sep: el("sep"), sepVal: el("sepVal"),
  ali: el("ali"), aliVal: el("aliVal"),
  coh: el("coh"), cohVal: el("cohVal"),
  vis: el("vis"), visVal: el("visVal"),
  trails: el("trails"),
  panel: el("panel"),
  clearObs: el("clearObs"),
  fpsVal: el("fpsVal"), countVal: el("countVal"),
};
function el(id) { return document.getElementById(id); }

const P = { sep: 1.6, ali: 1.0, coh: 1.0, vis: 60, maxSpeed: 3.2, maxForce: 0.07 };
let cursorMode = "attract";
let predatorMode = "off";   // off | cursor | roam
let colorMode = "velocity"; // velocity | rainbow | mono
const mouse = { x: -9999, y: -9999, active: false };

const obstacles = [];

let boids = [];
function makeBoids(n) {
  boids = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    boids.push({
      x: Math.random() * W, y: Math.random() * H,
      vx: Math.cos(a) * 2, vy: Math.sin(a) * 2,
      hue: 160 + Math.random() * 120,
    });
  }
}

/* ---------- predator ---------- */
const predator = { x: 0, y: 0, vx: 1, vy: 0, maxSpeed: 4.0, maxForce: 0.12 };
function resetPredator() {
  predator.x = W * 0.5; predator.y = H * 0.5;
  const a = Math.random() * Math.PI * 2;
  predator.vx = Math.cos(a) * predator.maxSpeed;
  predator.vy = Math.sin(a) * predator.maxSpeed;
}
resetPredator();

function updatePredator() {
  if (predatorMode === "off") return;
  let tx, ty;
  if (predatorMode === "cursor" && mouse.active) {
    tx = mouse.x; ty = mouse.y;
  } else {
    // roam: hunt the nearest boid
    let best = null, bestD2 = Infinity;
    for (const b of boids) {
      const dx = b.x - predator.x, dy = b.y - predator.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) { bestD2 = d2; best = b; }
    }
    if (best) { tx = best.x; ty = best.y; }
    else { tx = predator.x + predator.vx; ty = predator.y + predator.vy; }
  }

  const dx = tx - predator.x, dy = ty - predator.y;
  const m = Math.hypot(dx, dy) || 1;
  const desiredX = dx / m * predator.maxSpeed;
  const desiredY = dy / m * predator.maxSpeed;
  let [fx, fy] = limit(desiredX - predator.vx, desiredY - predator.vy, predator.maxForce);
  predator.vx += fx; predator.vy += fy;
  [predator.vx, predator.vy] = limit(predator.vx, predator.vy, predator.maxSpeed);
  predator.x += predator.vx; predator.y += predator.vy;

  if (predator.x < 0) predator.x += W; else if (predator.x > W) predator.x -= W;
  if (predator.y < 0) predator.y += H; else if (predator.y > H) predator.y -= H;
}

/* ---------- spatial hash ---------- */
let cellSize = 60;
let cells = new Map();
function key(cx, cy) { return cx + "," + cy; }
function rebuild() {
  cellSize = Math.max(30, P.vis);
  cells.clear();
  for (const b of boids) {
    const cx = (b.x / cellSize) | 0, cy = (b.y / cellSize) | 0;
    const k = key(cx, cy);
    if (!cells.has(k)) cells.set(k, []);
    cells.get(k).push(b);
  }
}
function neighbors(b) {
  const cx = (b.x / cellSize) | 0, cy = (b.y / cellSize) | 0;
  const out = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++) {
      const arr = cells.get(key(cx + dx, cy + dy));
      if (arr) out.push(...arr);
    }
  return out;
}

/* ---------- steering ---------- */
function limit(vx, vy, max) {
  const m = Math.hypot(vx, vy);
  if (m > max) return [vx / m * max, vy / m * max];
  return [vx, vy];
}

const FLEE_DIST = 130;

function step() {
  rebuild();
  updatePredator();
  const vis2 = P.vis * P.vis;
  const sepDist2 = (P.vis * 0.5) ** 2;
  const flee2 = FLEE_DIST * FLEE_DIST;
  const predActive = predatorMode !== "off";

  for (const b of boids) {
    let sepX = 0, sepY = 0, aliX = 0, aliY = 0, cohX = 0, cohY = 0, count = 0, sepCount = 0;

    for (const o of neighbors(b)) {
      if (o === b) continue;
      const dx = b.x - o.x, dy = b.y - o.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > vis2 || d2 === 0) continue;
      count++;
      aliX += o.vx; aliY += o.vy;
      cohX += o.x; cohY += o.y;
      if (d2 < sepDist2) {
        sepX += dx / d2; sepY += dy / d2; sepCount++;
      }
    }

    let ax = 0, ay = 0;

    if (sepCount > 0) {
      let [sx, sy] = steer(sepX, sepY, b);
      ax += sx * P.sep; ay += sy * P.sep;
    }
    if (count > 0) {
      let [lx, ly] = steer(aliX / count, aliY / count, b);
      ax += lx * P.ali; ay += ly * P.ali;
      // cohesion: steer toward average position
      let [cx, cy] = steer((cohX / count) - b.x, (cohY / count) - b.y, b);
      ax += cx * P.coh; ay += cy * P.coh;
    }

    // flee the predator
    if (predActive) {
      const dx = b.x - predator.x, dy = b.y - predator.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < flee2 && d2 > 0) {
        const d = Math.sqrt(d2);
        const strength = (1 - d / FLEE_DIST) * 1.4;
        ax += (dx / d) * strength;
        ay += (dy / d) * strength;
      }
    }

    // steer around obstacles
    for (const ob of obstacles) {
      const dx = b.x - ob.x, dy = b.y - ob.y;
      const d = Math.hypot(dx, dy);
      const reach = ob.r + 34;
      if (d < reach && d > 0) {
        const strength = (1 - d / reach) * 1.8;
        ax += (dx / d) * strength;
        ay += (dy / d) * strength;
      }
    }

    // cursor
    if (mouse.active && cursorMode !== "off") {
      const dx = mouse.x - b.x, dy = mouse.y - b.y;
      const d = Math.hypot(dx, dy);
      if (d < 220 && d > 0) {
        const dir = cursorMode === "attract" ? 1 : -1;
        ax += (dx / d) * 0.25 * dir;
        ay += (dy / d) * 0.25 * dir;
      }
    }

    b.vx += ax; b.vy += ay;
    [b.vx, b.vy] = limit(b.vx, b.vy, P.maxSpeed);
    b.x += b.vx; b.y += b.vy;

    // wrap edges
    if (b.x < 0) b.x += W; else if (b.x > W) b.x -= W;
    if (b.y < 0) b.y += H; else if (b.y > H) b.y -= H;
  }
}

// produce a steering force toward a desired velocity vector, normalized to maxSpeed
function steer(dvx, dvy, b) {
  const m = Math.hypot(dvx, dvy);
  if (m === 0) return [0, 0];
  let desiredX = dvx / m * P.maxSpeed;
  let desiredY = dvy / m * P.maxSpeed;
  let [fx, fy] = limit(desiredX - b.vx, desiredY - b.vy, P.maxForce);
  return [fx, fy];
}

/* ---------- render ---------- */
function boidColor(b, speed, light) {
  if (colorMode === "mono") return `hsl(190, 90%, ${light}%)`;
  if (colorMode === "rainbow") return `hsl(${b.hue}, 90%, ${light}%)`;
  // velocity: hue by heading, saturation lifts with speed
  const ang = Math.atan2(b.vy, b.vx);
  const hue = ((ang / Math.PI) * 180 + 200 + 360) % 360;
  return `hsl(${hue}, 90%, ${light}%)`;
}

function drawObstacles() {
  for (const ob of obstacles) {
    ctx.beginPath();
    ctx.arc(ob.x, ob.y, ob.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(120, 150, 210, 0.10)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(150, 185, 255, 0.55)";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(120, 170, 255, 0.5)";
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function drawPredator() {
  if (predatorMode === "off") return;
  const ang = Math.atan2(predator.vy, predator.vx);
  ctx.save();
  ctx.translate(predator.x, predator.y);
  ctx.rotate(ang);
  ctx.fillStyle = "hsl(8, 92%, 60%)";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "hsl(14, 95%, 55%)";
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-9, 8);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-9, -8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0;
}

function draw() {
  if (ui.trails.checked) {
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
  }

  drawObstacles();

  for (const b of boids) {
    const ang = Math.atan2(b.vy, b.vx);
    const speed = Math.hypot(b.vx, b.vy);
    const light = 48 + (speed / P.maxSpeed) * 34;
    const color = boidColor(b, speed, light);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(ang);
    ctx.fillStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, 4);
    ctx.lineTo(-5, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.shadowBlur = 0;

  drawPredator();
}

/* ---------- FPS ---------- */
let fps = 60, lastT = performance.now(), fpsAccum = 0, fpsFrames = 0;
function updateFps(now) {
  fpsAccum += now - lastT;
  fpsFrames++;
  lastT = now;
  if (fpsAccum >= 500) {
    fps = Math.round((fpsFrames * 1000) / fpsAccum);
    ui.fpsVal.textContent = fps;
    ui.countVal.textContent = boids.length;
    fpsAccum = 0; fpsFrames = 0;
  }
}

function loop(now) {
  updateFps(now || performance.now());
  step();
  draw();
  requestAnimationFrame(loop);
}

/* ---------- UI ---------- */
function sync() {
  P.sep = +ui.sep.value / 10; ui.sepVal.textContent = P.sep.toFixed(1);
  P.ali = +ui.ali.value / 10; ui.aliVal.textContent = P.ali.toFixed(1);
  P.coh = +ui.coh.value / 10; ui.cohVal.textContent = P.coh.toFixed(1);
  P.vis = +ui.vis.value; ui.visVal.textContent = P.vis;
  ui.nVal.textContent = ui.n.value;
  ui.countVal.textContent = boids.length;
}
["sep", "ali", "coh", "vis"].forEach((k) => ui[k].addEventListener("input", sync));
ui.n.addEventListener("input", () => { makeBoids(+ui.n.value); sync(); });

function wireSegment(attr, apply) {
  document.querySelectorAll(`.seg button[data-${attr}]`).forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.parentElement;
      group.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      apply(btn.dataset[attr]);
    });
  });
}
wireSegment("mode", (v) => (cursorMode = v));
wireSegment("pred", (v) => { predatorMode = v; if (v !== "off") resetPredator(); });
wireSegment("color", (v) => (colorMode = v));

ui.clearObs.addEventListener("click", () => { obstacles.length = 0; });

addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
addEventListener("mouseleave", () => (mouse.active = false));
addEventListener("keydown", (e) => { if (e.key.toLowerCase() === "h") ui.panel.classList.toggle("hidden"); });

// click on the canvas to drop a circular obstacle
canvas.addEventListener("click", (e) => {
  const r = 26 + Math.random() * 22;
  obstacles.push({ x: e.clientX, y: e.clientY, r });
});

/* ---------- go ---------- */
sync();
makeBoids(+ui.n.value);
sync();
loop();

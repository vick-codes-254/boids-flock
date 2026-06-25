/* Boids — Craig Reynolds' flocking simulation.
   Three steering rules (separation, alignment, cohesion) + cursor interaction.
   Uses a spatial hash grid so it stays smooth with hundreds of boids. */

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
let W, H;

function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
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
};
function el(id) { return document.getElementById(id); }

const P = { sep: 1.6, ali: 1.0, coh: 1.0, vis: 60, maxSpeed: 3.2, maxForce: 0.07 };
let cursorMode = "attract";
const mouse = { x: -9999, y: -9999, active: false };

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

function step() {
  rebuild();
  const vis2 = P.vis * P.vis;
  const sepDist2 = (P.vis * 0.5) ** 2;

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
function draw() {
  if (ui.trails.checked) {
    ctx.fillStyle = "rgba(4,6,15,0.16)";
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.clearRect(0, 0, W, H);
  }

  for (const b of boids) {
    const ang = Math.atan2(b.vy, b.vx);
    const speed = Math.hypot(b.vx, b.vy);
    const light = 45 + (speed / P.maxSpeed) * 35;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(ang);
    ctx.fillStyle = `hsl(${b.hue}, 90%, ${light}%)`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = `hsl(${b.hue}, 90%, 60%)`;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, 4);
    ctx.lineTo(-5, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.shadowBlur = 0;
}

function loop() {
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
}
["sep", "ali", "coh", "vis"].forEach((k) => ui[k].addEventListener("input", sync));
ui.n.addEventListener("input", () => { sync(); makeBoids(+ui.n.value); });

document.querySelectorAll(".seg button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".seg button").forEach((b) => b.classList.remove("on"));
    btn.classList.add("on");
    cursorMode = btn.dataset.mode;
  });
});

addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
addEventListener("mouseleave", () => (mouse.active = false));
addEventListener("keydown", (e) => { if (e.key.toLowerCase() === "h") ui.panel.classList.toggle("hidden"); });

/* ---------- go ---------- */
sync();
makeBoids(+ui.n.value);
loop();

/*
 * Character Bouquet
 * A browser port of the supplied ASCII-Flower-Bouquet rendering approach.
 * The 3D arrangement, perspective projection, depth buffer, golden-angle
 * placement, billboard flower silhouettes and light-driven glyph shading
 * follow the reference's construction principles. The decorative paper,
 * ribbon, hearts, message and sparkles are intentionally omitted.
 */

const FPS = 24;
const SPIN_SPEED = 0.60;
const TILT = 0.30;
const CAM_DIST = 4.0;
const PIVOT_Y = 0.20;
const TAU = Math.PI * 2;

const SHADE = '.:-=+*%@';
const PETAL_SHADE = '+*#%';
const GREEN_GLYPHS = '.:-=+*%';
const CENTER_GLYPHS = 'oO@';

// ANSI-256 palettes retained from the supplied Python reference.
const PALETTES = {
  white: [244, 248, 251, 254, 255, 231],
  pink: [125, 162, 168, 205, 211, 218, 225],
  red: [52, 88, 124, 160, 196, 203],
  purple: [54, 91, 97, 134, 140, 183],
  yellow: [136, 178, 214, 220, 226, 229],
  orange: [130, 166, 202, 208, 214, 216],
  blue: [24, 31, 38, 39, 45, 81, 117, 153],
  paleBlue: [110, 117, 153, 159, 195, 231],
  gold: [94, 136, 178, 214, 220],
  darkGold: [52, 58, 94, 130, 136],
  greens: [22, 28, 28, 34, 35, 71, 77, 114],
};

const TULIP_PALETTES = [
  PALETTES.red, PALETTES.pink, PALETTES.yellow,
  PALETTES.purple, PALETTES.orange, PALETTES.red,
];
const WILDFLOWER_TYPES = [
  { petal: PALETTES.white, center: PALETTES.gold, n: 11 },
  { petal: PALETTES.purple, center: PALETTES.gold, n: 8 },
  { petal: PALETTES.yellow, center: PALETTES.darkGold, n: 12 },
  { petal: PALETTES.pink, center: PALETTES.gold, n: 9 },
  { petal: PALETTES.orange, center: PALETTES.darkGold, n: 9 },
];

const FORGET_PALETTES = [
  PALETTES.blue, PALETTES.paleBlue, PALETTES.blue,
  PALETTES.paleBlue, PALETTES.blue,
];

function ansi256(code) {
  if (code < 16) {
    const basic = [
      [0,0,0],[128,0,0],[0,128,0],[128,128,0],
      [0,0,128],[128,0,128],[0,128,128],[192,192,192],
      [128,128,128],[255,0,0],[0,255,0],[255,255,0],
      [0,0,255],[255,0,255],[0,255,255],[255,255,255],
    ];
    return basic[code];
  }
  if (code >= 232) {
    const v = 8 + (code - 232) * 10;
    return [v, v, v];
  }
  const n = code - 16;
  const levels = [0, 95, 135, 175, 215, 255];
  return [levels[Math.floor(n / 36)], levels[Math.floor((n % 36) / 6)], levels[n % 6]];
}

const COLOR_CACHE = new Map();
function colorOf(code) {
  if (!COLOR_CACHE.has(code)) COLOR_CACHE.set(code, ansi256(code));
  const c = COLOR_CACHE.get(code);
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const add = (p, d, k = 1) => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
function norm(v) {
  const m = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
}
function bezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [0,1,2].map(i => u*u*u*p0[i] + 3*u*u*t*p1[i] + 3*u*t*t*p2[i] + t*t*t*p3[i]);
}

const LIGHT = norm([-0.45, 0.60, 0.66]);
const NECK = [0, -0.12, 0];
const CENTER = [0, 0.12, 0];
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function buildScene() {
  const rnd = seededRandom(21);
  const points = [];
  const flowers = [];
  const forgetClusters = [];
  const N = 16;
  const tulipSlots = new Set([0, 3, 6, 9, 12, 15]);
  const wildSlots = new Set([1, 4, 7, 10, 13]);
  let wildIndex = 0;
  let tulipIndex = 0;
  let forgetIndex = 0;

  for (let i = 0; i < N; i++) {
    const el = (88 - 60 * Math.sqrt(i / (N - 1))) * Math.PI / 180;
    const az = i * GOLDEN_ANGLE;
    const direction = [Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)];
    const pos = add(CENTER, direction, 0.64 * (0.92 + rnd() * 0.13));
    const axis = norm(direction);
    const base = add(pos, axis, -0.03);

    // The signature reference look: thin, separated character trails
    // running from every bloom into a shared, narrow stem neck.
    for (let j = 0; j < 70; j++) {
      const t = j / 69;
      const p = [
        base[0] + (NECK[0] - base[0]) * t,
        base[1] + (NECK[1] - base[1]) * t,
        base[2] + (NECK[2] - base[2]) * t,
      ];
      points.push({ p, n: [axis[0], 0, axis[2]], pal: PALETTES.greens, tone: -0.12, twoSided: true, kind: 'stem', phase: rnd() * TAU });
    }

    if (tulipSlots.has(i)) {
      const flower = {
        pos, kind: 'tulip', pal: TULIP_PALETTES[tulipIndex % TULIP_PALETTES.length],
        center: null, nPet: 0, R: 0.125 + rnd() * 0.018,
        seed: rnd() * TAU, phase: rnd() * TAU, size: 1,
      };
      flowers.push(flower);
      tulipIndex++;
    } else if (wildSlots.has(i)) {
      const type = WILDFLOWER_TYPES[wildIndex % WILDFLOWER_TYPES.length];
      flowers.push({
        pos, kind: 'wild', pal: type.petal, center: type.center, nPet: type.n,
        R: 0.12 + rnd() * 0.02, seed: rnd() * TAU, phase: rnd() * TAU, size: 1,
      });
      wildIndex++;
    } else {
      // Each forget-me-not spray is a small branching cluster of five-petal blooms.
      const florets = [];
      const count = 4;
      const clusterSeed = rnd() * TAU;
      for (let k = 0; k < count; k++) {
        const a = clusterSeed + k * TAU / count;
        const rr = 0.032 + 0.018 * (k % 2);
        const miniPos = [
          pos[0] + Math.cos(a) * rr,
          pos[1] + (k % 2 ? 0.018 : -0.012),
          pos[2] + Math.sin(a) * rr,
        ];
        const palette = FORGET_PALETTES[(forgetIndex + k) % FORGET_PALETTES.length];
        florets.push({
          pos: miniPos, kind: 'forget', pal: palette, center: PALETTES.yellow,
          nPet: 5, R: 0.034 + rnd() * 0.006,
          seed: rnd() * TAU, phase: rnd() * TAU, size: 1,
        });
        // Fine forked stems from the spray to each tiny flower.
        const branchStart = add(pos, axis, -0.035);
        const branchEnd = add(miniPos, [0, -0.012, 0]);
        const branchAxis = norm(sub(branchEnd, branchStart));
        for (let j = 0; j < 12; j++) {
          const t = j / 11;
          const p = [
            branchStart[0] + (branchEnd[0] - branchStart[0]) * t,
            branchStart[1] + (branchEnd[1] - branchStart[1]) * t,
            branchStart[2] + (branchEnd[2] - branchStart[2]) * t,
          ];
          points.push({ p, n: branchAxis, pal: PALETTES.greens, tone: -0.06, twoSided: true, kind: 'stem', phase: rnd() * TAU });
        }
      }
      forgetClusters.push(...florets);
      forgetIndex++;
    }
  }

  // Twelve long, narrow leaves fan from the stem bundle, following the source's
  // point-surface construction rather than using solid polygon leaves.
  for (let i = 0; i < 12; i++) {
    const a = (i + 0.35) / 12 * TAU;
    const c = Math.cos(a), s = Math.sin(a);
    const base = [0.22 * c, 0.28 + (i % 3) * 0.025, 0.22 * s];
    const direction = norm([c, 0.20, s]);
    const side = [-s, 0, c];
    const normal = norm(cross(side, direction));
    const L = 0.38 + (i % 3) * 0.035;
    const W = 0.072;
    for (let ti = 0; ti < 32; ti++) {
      const t = ti / 31;
      for (let wi = -5; wi <= 5; wi++) {
        const w = wi / 5;
        const curl = 0.025 * w * w;
        const p = [
          base[0] + direction[0] * L * t + side[0] * W * Math.sin(Math.PI * t) * w + normal[0] * curl,
          base[1] + direction[1] * L * t - 0.10 * t * t + normal[1] * curl,
          base[2] + direction[2] * L * t + side[2] * W * Math.sin(Math.PI * t) * w + normal[2] * curl,
        ];
        points.push({ p, n: normal, pal: PALETTES.greens, tone: wi === 0 ? -0.18 : -0.02, twoSided: true, kind: 'leaf', phase: rnd() * TAU });
      }
    }
  }

  return { points, flowers, forgetClusters };
}

const CAMERA = [0, 0.12 + CAM_DIST * Math.sin(0.30), CAM_DIST * Math.cos(0.30)];
const TARGET = [0, 0.12, 0];
const FORWARD = norm(sub(TARGET, CAMERA));
const RIGHT = norm(cross(FORWARD, [0, 1, 0]));
const UP = norm(cross(RIGHT, FORWARD));

function rotateProject(x, y, z, angle, scale, sxScale, cx, cy) {
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const xr = x * ca - z * sa;
  const zr = x * sa + z * ca;
  const yp = y - PIVOT_Y;
  const ct = Math.cos(TILT), st = Math.sin(TILT);
  const yt = yp * ct - zr * st;
  const zt = yp * st + zr * ct;
  const f = CAM_DIST / Math.max(0.18, CAM_DIST - zt);
  return [cx + xr * f * sxScale, cy - yt * f * scale, zt, f];
}

function createRenderer(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  let width = 0, height = 0, dpr = 1;
  let cols = 0, rows = 0, cellW = 0, cellH = 0, fontSize = 0;
  let chars = [], colors = [], depths = [];
  let scale = 1, sxScale = 2, cx = 0, cy = 0, viewRows = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Terminal-like character cells: wide on desktop, finer on phones.
    fontSize = Math.max(9, Math.min(14, Math.min(width / 75, height / 56)));
    cellW = fontSize * 0.62;
    cellH = fontSize * 1.12;
    cols = Math.max(28, Math.floor(width / cellW));
    rows = Math.max(24, Math.floor(height / cellH));
    viewRows = rows - 1;
    scale = Math.max(1, Math.min((viewRows - 2) / 1.45, (cols - 2) / 2.7));
    sxScale = scale * 2.0;
    cx = cols / 2;
    cy = 1 + 0.78 * scale;
    chars = new Array(cols * rows).fill(' ');
    colors = new Int16Array(cols * rows);
    depths = new Float32Array(cols * rows);
    ctx.font = `600 ${fontSize}px "Cascadia Mono", "Consolas", "Menlo", monospace`;
  }

  function clear() {
    chars.fill(' ');
    colors.fill(0);
    depths.fill(-1e9);
  }

  function projectPoint(p, angle) {
    return rotateProject(p[0], p[1], p[2], angle, scale, sxScale, cx, cy);
  }

  function plot(col, row, z, glyph, color) {
    col = Math.round(col);
    row = Math.round(row);
    if (row < 0 || row >= viewRows || col < 0 || col >= cols) return;
    const index = row * cols + col;
    if (z > depths[index]) {
      depths[index] = z;
      chars[index] = glyph;
      colors[index] = color;
    }
  }

  function drawPointCloud(points, t, angle) {
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const ct = Math.cos(TILT), st = Math.sin(TILT);
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const p = projectPoint(point.p, angle);
      const nxr = point.n[0] * ca - point.n[2] * sa;
      const nzr = point.n[0] * sa + point.n[2] * ca;
      const nyt = point.n[1] * ct - nzr * st;
      const nzt = point.n[1] * st + nzr * ct;
      let light = nxr * LIGHT[0] + nyt * LIGHT[1] + nzt * LIGHT[2];
      if (point.twoSided && light < 0) light = -light * 0.55;
      const flow = 0.035 * Math.sin(t * 1.25 + point.phase + i * 0.003);
      let b = 0.25 + 0.75 * Math.max(0, light) + point.tone + flow;
      b = Math.min(0.999, Math.max(0, b));
      const glyphs = point.kind === 'stem' ? GREEN_GLYPHS : SHADE;
      const glyph = glyphs[Math.min(glyphs.length - 1, Math.floor(b * glyphs.length))];
      const color = point.pal[Math.min(point.pal.length - 1, Math.floor(b * point.pal.length))];
      plot(p[0], p[1], p[2], glyph, color);
    }
  }

  function drawFlowerHead(flower, t, angle) {
    const [fx, fy, zt, f] = projectPoint(flower.pos, angle);
    const rx = flower.R * f * sxScale;
    const ry = flower.R * f * scale;
    if (rx < 1.2 || ry < 1.2) return;
    const minRow = Math.max(0, Math.floor(fy - ry) - 1);
    const maxRow = Math.min(viewRows - 1, Math.ceil(fy + ry) + 1);
    const minCol = Math.max(0, Math.floor(fx - rx) - 1);
    const maxCol = Math.min(cols - 1, Math.ceil(fx + rx) + 1);
    const dim = -0.34 * (1 - Math.min(1, Math.max(0, (zt + 0.62) / 1.24)));
    const rot = flower.seed + angle * 0.7;

    for (let row = minRow; row <= maxRow; row++) {
      const dy = (row + 0.5 - fy) / ry;
      for (let col = minCol; col <= maxCol; col++) {
        const dx = (col + 0.5 - fx) / rx;
        let b, center = false, localDepth = zt;
        if (flower.kind === 'tulip') {
          const v = (1 - dy) / 2;
          if (v < 0 || v > 1) continue;
          const hw = 0.62 * Math.sin(Math.PI * 0.5 * Math.min(1, v * 1.5 + 0.05));
          if (hw <= 0 || Math.abs(dx) > hw) continue;
          const xn = dx / hw;
          if (v > 0.72 + 0.28 * Math.cos(1.5 * Math.PI * xn) ** 2) continue;
          const seam = Math.abs(Math.abs(xn) - 0.33) < 0.12 && v > 0.3 ? -0.25 : 0;
          const temporal = 0.035 * Math.sin(t * 1.1 + v * 5 + xn * 2 + flower.phase);
          b = 0.55 - 0.3 * xn + 0.1 * v + seam + dim + temporal;
          localDepth += 0.035 + 0.008 * (1 - Math.abs(xn));
        } else {
          const s = Math.sqrt(dx * dx + dy * dy);
          if (s > 1) continue;
          if (s < (flower.kind === 'forget' ? 0.27 : 0.30)) {
            b = 0.55 - 0.35 * dx - 0.35 * dy + dim + 0.035 * Math.sin(t * 1.4 + flower.phase);
            center = true;
            localDepth += 0.06;
          } else {
            const ph = Math.atan2(dy, dx);
            const reach = 0.32 + 0.68 * Math.abs(Math.cos(flower.nPet * (ph + rot) / 2)) ** 0.7;
            if (s > reach) continue;
            const edge = s > reach - 0.14 ? -0.22 : 0;
            b = 0.62 - 0.22 * dx - 0.28 * dy + 0.12 * s + edge + dim
              + 0.035 * Math.sin(t * 1.2 + ph * 2 + flower.phase);
            localDepth += 0.04 * (1 - s);
          }
        }
        b = Math.min(0.999, Math.max(0, b));
        let glyph;
        let palette;
        if (center) {
          palette = flower.center;
          glyph = Math.sqrt(dx * dx + dy * dy) < 0.16 ? '@' : CENTER_GLYPHS[(Math.floor((t * 1.5 + flower.phase) % CENTER_GLYPHS.length) + col + row) % CENTER_GLYPHS.length];
        } else {
          palette = flower.pal;
          glyph = PETAL_SHADE[Math.min(PETAL_SHADE.length - 1, Math.floor(b * PETAL_SHADE.length))];
          // Slow, restrained character substitutions keep the bloom alive
          // without breaking the reference's recognizable graphic silhouette.
          const glyphWave = Math.sin(t * 0.65 + row * 0.11 + col * 0.08 + flower.phase);
          if (glyphWave > 0.92 && glyph === '+') glyph = '*';
          else if (glyphWave < -0.94 && glyph === '%') glyph = '#';
        }
        const color = palette[Math.min(palette.length - 1, Math.floor(b * palette.length))];
        plot(col, row, localDepth, glyph, color);
      }
    }
  }

  function render(scene, t) {
    clear();
    const angle = t * SPIN_SPEED;
    drawPointCloud(scene.points, t, angle);
    for (const flower of scene.flowers) drawFlowerHead(flower, t, angle);
    for (const flower of scene.forgetClusters) drawFlowerHead(flower, t, angle);

    // One pass over the glyph grid, with the original terminal's monospace feel.
    ctx.fillStyle = '#202736';
    ctx.fillRect(0, 0, width, height);
    ctx.font = `600 ${fontSize}px "Cascadia Mono", "Consolas", "Menlo", monospace`;
    for (let row = 0; row < viewRows; row++) {
      const offset = row * cols;
      for (let col = 0; col < cols; col++) {
        const i = offset + col;
        const ch = chars[i];
        if (ch === ' ') continue;
        ctx.fillStyle = colorOf(colors[i]);
        ctx.fillText(ch, (col + 0.5) * cellW, (row + 0.56) * cellH);
      }
    }
  }

  resize();
  return { resize, render };
}

const canvas = document.getElementById('bouquet');
const renderer = createRenderer(canvas);
const scene = buildScene();
let start = performance.now();
let lastFrame = 0;

function frame(now) {
  if (now - lastFrame >= 1000 / FPS) {
    renderer.render(scene, (now - start) / 1000);
    lastFrame = now;
  }
  requestAnimationFrame(frame);
}

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => renderer.resize(), 60);
}, { passive: true });

requestAnimationFrame(frame);

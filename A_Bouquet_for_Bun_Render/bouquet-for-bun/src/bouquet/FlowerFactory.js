import * as THREE from 'three';
import { GlyphBuilder, addGlyphSurface } from '../graphics/glyphs.js';

const palettes = {
  rose: ['#d83c64', '#ef7690', '#b51e4f'],
  tulip: ['#f06d9c', '#f5a4b8', '#cb3f72'],
  delphinium: ['#668bea', '#9bb8ff', '#4b63c2'],
  cosmos: ['#e9a4c8', '#f6c3df', '#b96d9b'],
  ranunculus: ['#ef83a6', '#ffd0d9', '#c64e78'],
  forget: ['#86b9ff', '#c4e0ff', '#648dd8'],
  baby: ['#fff0e7', '#ffffff', '#d8b6c8'],
  lavender: ['#a88ce5', '#d2bfff', '#7760b7'],
  gerbera: ['#f49a41', '#ffd079', '#d85d32'],
  lily: ['#fff0e9', '#ffd5d8', '#d69aa7'],
  iris: ['#786bd0', '#b7aaff', '#51469f'],
  marigold: ['#f4a52e', '#ffd45d', '#d96b1f'],
};

function colorVariation(hex, random, amount = 0.18) {
  const base = new THREE.Color(hex);
  const target = random() > 0.5 ? new THREE.Color('#ffffff') : new THREE.Color('#55294d');
  return base.lerp(target, random() * amount);
}

function addCenter(builder, radius, color, random, density = 24) {
  const base = new THREE.Color(color);
  for (let i = 0; i < density; i += 1) {
    const angle = random() * Math.PI * 2;
    const r = Math.sqrt(random()) * radius;
    const p = new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0.075 + random() * 0.035);
    const tangentU = new THREE.Vector3(1, 0, 0);
    const tangentV = new THREE.Vector3(0, 1, 0);
    const c = colorVariation(base, random, 0.33);
    builder.addGlyph(p, tangentU, tangentV, 0.042 + random() * 0.024, 0.05 + random() * 0.025, c);
  }
}

function addPetalLayer(group, atlas, material, random, config) {
  const builder = new GlyphBuilder(atlas, random);
  const {
    count = 8, length = 0.42, width = 0.15, color = '#ef789f',
    inner = 0.035, z = 0, curve = 0.1, rows = 4, columns = 3,
    phase = 0, glyphSize = 0.073, angleOffset = 0, droop = 0,
    centerX = 0, centerY = 0, delay = undefined,
  } = config;
  const base = new THREE.Color(color);
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + angleOffset;
    const dir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    const side = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0);
    const localCenter = new THREE.Vector3(centerX, centerY, z);
    for (let row = 0; row < rows; row += 1) {
      const s = (row + 0.5) / rows;
      const profile = Math.pow(Math.sin(Math.PI * Math.pow(s, 0.86)), 0.62);
      for (let col = 0; col < columns; col += 1) {
        const t = ((col + 0.5) / columns) * 2 - 1;
        if (Math.abs(t) > profile * 1.06) continue;
        const p = localCenter.clone()
          .addScaledVector(dir, inner + s * length)
          .addScaledVector(side, t * width * profile);
        p.z += curve * Math.sin(Math.PI * s) + 0.025 * (1 - t * t) - droop * s * s;
        const u = dir.clone().add(new THREE.Vector3(0, 0, curve * Math.PI * Math.cos(Math.PI * s) / Math.max(length, 0.1)));
        const v = side.clone().add(new THREE.Vector3(0, 0, -t * 0.10));
        const tone = base.clone().lerp(new THREE.Color(s < 0.26 ? '#fff0f3' : '#ffffff'), (1 - s) * 0.11 + random() * 0.11);
        if (random() > 0.68) tone.lerp(new THREE.Color('#4c2345'), random() * 0.12);
        const size = glyphSize * (0.8 + profile * 0.32) * (0.88 + random() * 0.24);
        builder.addGlyph(p, u, v, size, size * 1.08, tone, null, { delay: delay ?? random() * 0.72, scatter: 1.8 });
      }
    }
  }
  const layer = new THREE.Group();
  layer.position.set(0, 0, 0);
  layer.add(builder.build(material));
  layer.userData.phase = phase + random() * 6;
  layer.userData.flutter = 0.006 + random() * 0.009;
  group.add(layer);
  return layer;
}

function addSimpleCluster(group, atlas, material, random, x, y, z, color, count = 5, scale = 0.12) {
  const petals = new GlyphBuilder(atlas, random);
  for (let i = 0; i < count; i += 1) {
    const a = i / count * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
    addGlyphSurface(petals, new THREE.Vector3(x, y, z), dir, scale, scale * 0.38, color, {
      rows: 2, columns: 2, glyphSize: 0.042, curve: 0.025,
    });
  }
  addCenter(petals, scale * 0.19, '#f5d17e', random, 4);
  const mesh = petals.build(material);
  group.add(mesh);
}

function makeStem(group, atlas, material, random, descriptor, baseColor = '#4f9a68') {
  const builder = new GlyphBuilder(atlas, random);
  const rootScale = descriptor.scale ?? 1;
  const base = new THREE.Vector3(-descriptor.x / rootScale, (-1.28 - descriptor.y) / rootScale, -descriptor.z / rootScale);
  const mid = base.clone().lerp(new THREE.Vector3(0, -0.48, 0), 0.5);
  mid.x += (random() - 0.5) * 0.15;
  mid.z += (random() - 0.5) * 0.12;
  const curve = new THREE.CatmullRomCurve3([base, mid, new THREE.Vector3(0, 0, 0)]);
  builder.addCurveGlyphs(curve, Math.max(18, Math.floor(curve.getLength() * 26)), baseColor, 0.053, { scatter: 1.45 });

  for (let i = 0; i < 2; i += 1) {
    const t = 0.26 + i * 0.30 + random() * 0.08;
    const p = curve.getPoint(t);
    const side = (i % 2 === 0 ? -1 : 1) * (0.28 + random() * 0.16);
    const dir = new THREE.Vector3(side, 0.32 + random() * 0.15, 0.04 * (random() - 0.5)).normalize();
    const widthDir = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
    const leafLength = 0.38 + random() * 0.16;
    const rows = 5;
    const cols = 3;
    for (let r = 0; r < rows; r += 1) {
      const s = (r + 0.5) / rows;
      const profile = Math.sin(Math.PI * s) ** 0.72;
      for (let c = 0; c < cols; c += 1) {
        const t2 = (c / (cols - 1) - 0.5) * 2;
        if (Math.abs(t2) > profile) continue;
        const point = p.clone().addScaledVector(dir, s * leafLength).addScaledVector(widthDir, t2 * profile * 0.09);
        point.z += 0.045 * Math.sin(Math.PI * s);
        const green = colorVariation('#4b9c68', random, 0.25);
        const size = 0.053 * (0.82 + profile * 0.35);
        builder.addGlyph(point, dir, widthDir, size, size * 1.1, green);
      }
    }
  }
  group.add(builder.build(material));
}

function flowerHead(group, atlas, material, random, species, colorOverride = null) {
  const palette = palettes[species] ?? palettes.rose;
  const colors = colorOverride ? [colorOverride, colorOverride, palette[2]] : palette;
  const layers = [];
  const layer = (cfg) => layers.push(addPetalLayer(group, atlas, material, random, { color: colors[0], ...cfg }));

  switch (species) {
    case 'rose':
      layer({ count: 8, length: 0.28, width: 0.17, inner: 0.015, z: -0.015, curve: 0.10, rows: 4, columns: 3, glyphSize: 0.069, angleOffset: 0.16 });
      layer({ count: 9, length: 0.36, width: 0.18, inner: 0.045, z: 0.005, curve: 0.13, rows: 4, columns: 3, glyphSize: 0.073, angleOffset: 0.48 });
      layer({ count: 10, length: 0.43, width: 0.19, inner: 0.065, z: 0.025, curve: 0.16, rows: 5, columns: 3, glyphSize: 0.074, angleOffset: 0.12 });
      layer({ count: 6, length: 0.20, width: 0.13, inner: 0.005, z: 0.06, curve: 0.08, rows: 3, columns: 2, glyphSize: 0.066, angleOffset: 0.28 });
      { const b = new GlyphBuilder(atlas, random); addCenter(b, 0.13, colors[2], random, 32); group.add(b.build(material)); }
      break;
    case 'tulip':
      layer({ count: 6, length: 0.55, width: 0.22, inner: 0.02, curve: 0.25, rows: 5, columns: 3, glyphSize: 0.078, angleOffset: Math.PI / 6 });
      layer({ count: 3, length: 0.48, width: 0.17, inner: 0.04, z: 0.05, curve: 0.30, rows: 5, columns: 3, glyphSize: 0.075, angleOffset: 0.55 });
      { const b = new GlyphBuilder(atlas, random); addCenter(b, 0.105, '#f8d57e', random, 14); group.add(b.build(material)); }
      break;
    case 'cosmos':
      layer({ count: 8, length: 0.51, width: 0.145, inner: 0.06, curve: 0.085, rows: 5, columns: 3, glyphSize: 0.068, angleOffset: 0.12 });
      { const b = new GlyphBuilder(atlas, random); addCenter(b, 0.17, '#e7b64d', random, 40); group.add(b.build(material)); }
      break;
    case 'ranunculus':
      layer({ count: 9, length: 0.25, width: 0.14, inner: 0.015, curve: 0.11, rows: 4, columns: 3, glyphSize: 0.065, angleOffset: 0.2 });
      layer({ count: 10, length: 0.32, width: 0.16, inner: 0.025, z: 0.03, curve: 0.13, rows: 4, columns: 3, glyphSize: 0.068, angleOffset: 0.48 });
      layer({ count: 11, length: 0.39, width: 0.17, inner: 0.04, z: 0.045, curve: 0.16, rows: 5, columns: 3, glyphSize: 0.069, angleOffset: 0.16 });
      { const b = new GlyphBuilder(atlas, random); addCenter(b, 0.105, colors[2], random, 26); group.add(b.build(material)); }
      break;
    case 'forget':
      layer({ count: 5, length: 0.18, width: 0.105, inner: 0.025, curve: 0.045, rows: 3, columns: 2, glyphSize: 0.05, angleOffset: 0.16 });
      { const b = new GlyphBuilder(atlas, random); addCenter(b, 0.055, '#f4cf71', random, 8); group.add(b.build(material)); }
      break;
    case 'delphinium':
      for (let j = 0; j < 5; j += 1) {
        const yy = -0.28 + j * 0.14;
        addSimpleCluster(group, atlas, material, random, (random() - 0.5) * 0.16, yy, j * 0.009, colors[0], 5, 0.12 + random() * 0.025);
      }
      break;
    case 'baby':
      for (let j = 0; j < 7; j += 1) {
        const a = j / 7 * Math.PI * 2;
        addSimpleCluster(group, atlas, material, random, Math.cos(a) * 0.19, Math.sin(a) * 0.17, random() * 0.05, '#fff4ef', 5, 0.095);
      }
      addSimpleCluster(group, atlas, material, random, 0, 0, 0.05, '#fff4ef', 5, 0.10);
      break;
    case 'lavender':
      for (let j = 0; j < 8; j += 1) {
        const yy = -0.30 + j * 0.09;
        const x = (j % 2 ? 0.065 : -0.065) * (1 - j / 11);
        addSimpleCluster(group, atlas, material, random, x, yy, 0, colors[0], 3, 0.105);
      }
      break;
    case 'gerbera':
      layer({ count: 15, length: 0.47, width: 0.09, inner: 0.07, curve: 0.075, rows: 5, columns: 2, glyphSize: 0.061, angleOffset: 0.08 });
      layer({ count: 9, length: 0.29, width: 0.09, inner: 0.05, z: 0.02, curve: 0.055, rows: 4, columns: 2, glyphSize: 0.058, angleOffset: 0.24 });
      { const b = new GlyphBuilder(atlas, random); addCenter(b, 0.17, '#7e452a', random, 44); group.add(b.build(material)); }
      break;
    case 'lily':
      layer({ count: 6, length: 0.63, width: 0.17, inner: 0.07, curve: 0.13, rows: 6, columns: 3, glyphSize: 0.075, angleOffset: 0.06, droop: 0.03 });
      layer({ count: 6, length: 0.49, width: 0.13, inner: 0.09, z: 0.045, curve: 0.15, rows: 5, columns: 2, glyphSize: 0.07, angleOffset: 0.57 });
      { const b = new GlyphBuilder(atlas, random); addCenter(b, 0.09, '#d8b36c', random, 18); group.add(b.build(material)); }
      break;
    case 'iris':
      layer({ count: 3, length: 0.55, width: 0.23, inner: 0.025, curve: 0.21, rows: 5, columns: 3, glyphSize: 0.073, angleOffset: Math.PI / 2 });
      layer({ count: 3, length: 0.48, width: 0.20, inner: 0.04, z: -0.01, curve: 0.10, rows: 5, columns: 3, glyphSize: 0.07, angleOffset: -Math.PI / 2, droop: 0.12 });
      { const b = new GlyphBuilder(atlas, random); addCenter(b, 0.12, '#f4cf62', random, 22); group.add(b.build(material)); }
      break;
    case 'marigold':
      layer({ count: 17, length: 0.33, width: 0.095, inner: 0.025, curve: 0.13, rows: 4, columns: 2, glyphSize: 0.061, angleOffset: 0.04 });
      layer({ count: 13, length: 0.25, width: 0.09, inner: 0.025, z: 0.035, curve: 0.11, rows: 4, columns: 2, glyphSize: 0.058, angleOffset: 0.22 });
      { const b = new GlyphBuilder(atlas, random); addCenter(b, 0.12, '#8d4b26', random, 30); group.add(b.build(material)); }
      break;
    default:
      layer({ count: 8, length: 0.4, width: 0.15 });
  }
  return layers;
}

export function createFlower(atlas, material, random, descriptor) {
  const root = new THREE.Group();
  const stemGroup = new THREE.Group();
  makeStem(stemGroup, atlas, material, random, descriptor);
  root.add(stemGroup);
  const head = new THREE.Group();
  const layers = flowerHead(head, atlas, material, random, descriptor.species, descriptor.color);
  root.add(head);
  root.position.set(descriptor.x, descriptor.y, descriptor.z);
  root.rotation.set(descriptor.rx ?? 0, descriptor.ry ?? 0, descriptor.rz ?? 0);
  root.scale.setScalar(descriptor.scale ?? 1);
  root.userData.motion = {
    phase: random() * Math.PI * 2,
    sway: 0.012 + random() * 0.018,
    baseRotation: root.rotation.z,
    layers,
  };
  root.userData.species = descriptor.species;
  return root;
}

export function animateFlower(root, time) {
  const motion = root.userData.motion;
  if (!motion) return;
  root.rotation.z = motion.baseRotation + Math.sin(time * 0.53 + motion.phase) * motion.sway;
  motion.layers.forEach((layer, index) => {
    layer.rotation.z = Math.sin(time * (0.68 + index * 0.07) + layer.userData.phase) * layer.userData.flutter;
    layer.rotation.x = Math.sin(time * 0.42 + layer.userData.phase) * layer.userData.flutter * 0.45;
  });
}

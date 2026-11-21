import * as THREE from 'three';
import { GlyphBuilder } from '../graphics/glyphs.js';

const WING_PALETTES = [
  ['#2f83d8', '#81caff', '#174e9d'],
  ['#e87535', '#ffc16a', '#7f2d24'],
  ['#e6c34e', '#fff0a0', '#a66a2d'],
  ['#a57de2', '#e2bcff', '#6046a9'],
  ['#c6e9f4', '#ffffff', '#78b8dc'],
  ['#e78db8', '#ffc9e2', '#8c579e'],
  ['#5eb89f', '#b9eed2', '#327c76'],
  ['#e45d7d', '#ffb8c7', '#a52d5b'],
];

function addWing(group, atlas, material, random, side, palette, phase) {
  const builder = new GlyphBuilder(atlas, random);
  const main = new THREE.Color(palette[0]);
  const light = new THREE.Color(palette[1]);
  const dark = new THREE.Color(palette[2]);
  const rows = 10;
  const cols = 7;
  for (let i = 0; i < rows; i += 1) {
    const s = (i + 0.5) / rows;
    const widthProfile = Math.pow(Math.sin(Math.PI * s), 0.52);
    for (let j = 0; j < cols; j += 1) {
      const t = (j / (cols - 1) - 0.5) * 2;
      const arch = widthProfile * 0.31;
      const y = 0.055 + t * arch + 0.08 * (1 - s) - 0.035 * s;
      const x = side * (0.095 + s * 0.52);
      const z = 0.025 + Math.sin(s * Math.PI) * 0.035 + (1 - Math.abs(t)) * 0.018;
      const p = new THREE.Vector3(x, y, z);
      const u = new THREE.Vector3(side, 0.12 * t, 0.05).normalize();
      const v = new THREE.Vector3(0, 1, 0.10 * t).normalize();
      const edge = Math.abs(t);
      let c = main.clone().lerp(light, (1 - s) * 0.22 + (1 - edge) * 0.18 + random() * 0.12);
      if ((i + j) % 5 === 0 || edge > 0.75) c.lerp(dark, 0.35 + random() * 0.25);
      if (s > 0.78 && random() > 0.55) c.lerp(new THREE.Color('#ffffff'), 0.38);
      const size = (0.053 + widthProfile * 0.018) * (0.85 + random() * 0.24);
      const delay = 0.87 + random() * 0.11;
      builder.addGlyph(p, u, v, size, size * 0.95, c, null, { delay, scatter: 1.3, phase: phase + random() });
    }
  }
  // Small character-defined eyespots and edge details
  for (let i = 0; i < 5; i += 1) {
    const p = new THREE.Vector3(side * (0.28 + i * 0.055), 0.055 + Math.sin(i * 0.8) * 0.17, 0.09);
    builder.addGlyph(p, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), 0.065, 0.065, palette[1], null, { delay: 0.9, scatter: 1.2 });
  }
  const mesh = builder.build(material);
  group.add(mesh);
  return group;
}

function createButterfly(atlas, material, random, index) {
  const group = new THREE.Group();
  const palette = WING_PALETTES[index % WING_PALETTES.length];
  const leftPivot = new THREE.Group();
  const rightPivot = new THREE.Group();
  leftPivot.position.set(-0.035, 0.02, 0);
  rightPivot.position.set(0.035, 0.02, 0);
  const left = new THREE.Group();
  const right = new THREE.Group();
  addWing(left, atlas, material, random, -1, palette, random());
  addWing(right, atlas, material, random, 1, palette, random());
  leftPivot.add(left);
  rightPivot.add(right);
  group.add(leftPivot, rightPivot);

  const bodyBuilder = new GlyphBuilder(atlas, random);
  const bodyCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.17, 0.04), new THREE.Vector3(0.012, -0.03, 0.08),
    new THREE.Vector3(-0.005, 0.12, 0.08), new THREE.Vector3(0.0, 0.21, 0.02),
  ]);
  bodyBuilder.addCurveGlyphs(bodyCurve, 8, '#38283d', 0.052, { delay: 0.86, scatter: 0.9 });
  const antennaL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.01, 0.16, 0.08), new THREE.Vector3(-0.08, 0.25, 0.10), new THREE.Vector3(-0.13, 0.28, 0.08),
  ]);
  const antennaR = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.01, 0.16, 0.08), new THREE.Vector3(0.08, 0.25, 0.10), new THREE.Vector3(0.13, 0.28, 0.08),
  ]);
  bodyBuilder.addCurveGlyphs(antennaL, 4, palette[2], 0.027, { delay: 0.9, scatter: 0.9 });
  bodyBuilder.addCurveGlyphs(antennaR, 4, palette[2], 0.027, { delay: 0.9, scatter: 0.9 });
  group.add(bodyBuilder.build(material));
  group.userData.flight = {
    phase: random() * Math.PI * 2,
    speed: 0.20 + random() * 0.15,
    radiusX: 1.15 + random() * 0.95,
    height: 0.65 + random() * 0.8,
    centerY: 0.35 + random() * 1.05,
    depth: index % 2 === 0 ? 1.05 + random() * 0.55 : -0.75 - random() * 0.55,
    flap: 8.5 + random() * 3.2,
    leftPivot,
    rightPivot,
    scale: 0.68 + random() * 0.5,
  };
  group.scale.setScalar(group.userData.flight.scale);
  return group;
}

export function createButterflies(atlas, material, random, count = 8) {
  const layer = new THREE.Group();
  const butterflies = [];
  for (let i = 0; i < count; i += 1) {
    const butterfly = createButterfly(atlas, material, random, i);
    layer.add(butterfly);
    butterflies.push(butterfly);
  }
  layer.userData.butterflies = butterflies;
  return layer;
}

export function animateButterflies(layer, time, openingProgress = 1) {
  layer.userData.butterflies.forEach((butterfly, index) => {
    const f = butterfly.userData.flight;
    const t = time * f.speed + f.phase;
    const x = Math.sin(t) * f.radiusX + Math.sin(t * 0.47 + f.phase) * 0.28;
    const y = f.centerY + Math.sin(t * 0.83 + f.phase * 1.7) * f.height + Math.cos(t * 0.38) * 0.17;
    const z = f.depth + Math.sin(t * 0.69 + f.phase) * 0.42;
    const arrival = THREE.MathUtils.smoothstep(openingProgress, 0.84 + index * 0.006, 1);
    butterfly.position.set(x * arrival, y * arrival - (1 - arrival) * 0.7, z);
    butterfly.visible = openingProgress > 0.84;
    butterfly.rotation.y = Math.sin(t * 0.7) * 0.58;
    butterfly.rotation.z = Math.cos(t * 0.52 + f.phase) * 0.30;
    butterfly.rotation.x = Math.sin(t * 0.65 + f.phase) * 0.18;
    const flap = Math.sin(time * f.flap + f.phase) * 0.54;
    f.leftPivot.rotation.y = flap;
    f.rightPivot.rotation.y = -flap;
    const glide = Math.max(0, Math.sin(time * 0.21 + f.phase + 1.2));
    f.leftPivot.rotation.z = -0.06 - glide * 0.04;
    f.rightPivot.rotation.z = 0.06 + glide * 0.04;
  });
}

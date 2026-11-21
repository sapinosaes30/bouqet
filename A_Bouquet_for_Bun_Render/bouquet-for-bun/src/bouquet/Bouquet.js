import * as THREE from 'three';
import { GlyphBuilder } from '../graphics/glyphs.js';
import { createFlower, animateFlower } from './FlowerFactory.js';

const FLOWERS = [
  // Main focal blooms
  { species: 'rose', x: -0.68, y: 1.32, z: 0.36, scale: 0.96, rz: -0.16, ry: -0.18, color: '#c72e50' },
  { species: 'tulip', x: -0.03, y: 1.78, z: -0.27, scale: 0.98, rz: 0.06, ry: 0.12, color: '#edc34e' },
  { species: 'rose', x: 0.69, y: 1.37, z: 0.30, scale: 0.99, rz: 0.18, ry: 0.24 },
  { species: 'gerbera', x: -1.05, y: 0.82, z: -0.16, scale: 0.84, rz: -0.22, ry: -0.24 },
  { species: 'lily', x: 1.02, y: 0.86, z: -0.18, scale: 0.88, rz: 0.18, ry: 0.22 },
  { species: 'ranunculus', x: -0.36, y: 0.90, z: 0.66, scale: 0.89, rz: -0.04, ry: -0.08 },
  { species: 'tulip', x: 0.43, y: 0.91, z: 0.61, scale: 0.86, rz: 0.08, ry: 0.1 },
  { species: 'cosmos', x: -0.06, y: 1.11, z: -0.78, scale: 0.82, rz: 0.10, ry: 0.12 },
  { species: 'iris', x: -1.15, y: 0.34, z: -0.32, scale: 0.75, rz: -0.16, ry: -0.2 },
  { species: 'marigold', x: 1.17, y: 0.40, z: -0.39, scale: 0.76, rz: 0.18, ry: 0.2 },
  { species: 'rose', x: -0.47, y: 1.67, z: -0.75, scale: 0.74, rz: -0.18, ry: -0.28 },
  { species: 'delphinium', x: 0.55, y: 1.55, z: -0.76, scale: 0.82, rz: 0.10, ry: 0.3 },
  // Mid-sized supporting blooms
  { species: 'cosmos', x: -1.29, y: 1.12, z: -0.69, scale: 0.58, rz: -0.12, ry: -0.32 },
  { species: 'rose', x: 1.32, y: 1.15, z: -0.68, scale: 0.64, rz: 0.12, ry: 0.32 },
  { species: 'lily', x: -0.91, y: 1.72, z: 0.05, scale: 0.67, rz: -0.24, ry: -0.08 },
  { species: 'gerbera', x: 0.94, y: 1.78, z: 0.03, scale: 0.64, rz: 0.18, ry: 0.12 },
  { species: 'ranunculus', x: -1.37, y: 0.58, z: 0.38, scale: 0.61, rz: -0.18, ry: -0.14 },
  { species: 'tulip', x: 1.38, y: 0.64, z: 0.40, scale: 0.65, rz: 0.16, ry: 0.16 },
  { species: 'iris', x: -0.74, y: 0.35, z: 0.82, scale: 0.60, rz: -0.10, ry: -0.1 },
  { species: 'marigold', x: 0.75, y: 0.37, z: 0.83, scale: 0.62, rz: 0.12, ry: 0.12 },
  // Small blooms and airy fillers
  { species: 'forget', x: -1.52, y: 1.47, z: -0.22, scale: 0.78, rz: -0.12, ry: -0.18 },
  { species: 'forget', x: 1.52, y: 1.48, z: -0.22, scale: 0.78, rz: 0.14, ry: 0.18 },
  { species: 'baby', x: -1.43, y: 1.88, z: -0.55, scale: 0.78, rz: -0.08, ry: -0.18 },
  { species: 'baby', x: 1.43, y: 1.90, z: -0.54, scale: 0.78, rz: 0.08, ry: 0.18 },
  { species: 'lavender', x: -1.57, y: 0.93, z: -0.8, scale: 0.74, rz: -0.16, ry: -0.2 },
  { species: 'lavender', x: 1.56, y: 0.94, z: -0.8, scale: 0.74, rz: 0.15, ry: 0.2 },
  { species: 'forget', x: -0.15, y: 2.04, z: 0.25, scale: 0.68, rz: 0.06, ry: 0.06 },
  { species: 'baby', x: 0.19, y: 0.50, z: 1.0, scale: 0.67, rz: -0.04, ry: 0.06 },
  { species: 'cosmos', x: -1.57, y: 0.06, z: -0.25, scale: 0.52, rz: -0.22, ry: -0.28 },
  { species: 'rose', x: 1.56, y: 0.08, z: -0.26, scale: 0.54, rz: 0.2, ry: 0.28 },
  { species: 'baby', x: -0.84, y: 0.14, z: -0.93, scale: 0.62, rz: -0.1, ry: -0.2 },
  { species: 'forget', x: 0.84, y: 0.16, z: -0.95, scale: 0.64, rz: 0.1, ry: 0.2 },
];

function addRibbonStrip(builder, curve, width, color, along = 34, across = 3, random = Math.random) {
  const normal = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < along; i += 1) {
    const t = (i + 0.5) / along;
    const p = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    let side = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    if (side.lengthSq() < 0.01) side.set(1, 0, 0);
    for (let j = 0; j < across; j += 1) {
      const acrossT = across === 1 ? 0 : (j / (across - 1) - 0.5) * 2;
      const pos = p.clone().addScaledVector(side, acrossT * width * 0.5);
      pos.z += 0.015 * (1 - acrossT * acrossT);
      const highlight = new THREE.Color(color).lerp(new THREE.Color('#fff0e8'), random() * 0.20 + 0.03);
      const size = 0.06 + random() * 0.012;
      builder.addGlyph(pos, tangent, side, size * 0.95, size * 0.78, highlight);
    }
  }
}

function createRibbon(atlas, material, random) {
  const group = new THREE.Group();
  const builder = new GlyphBuilder(atlas, random);
  const rose = '#e8a0c0';
  const blush = '#f4bed2';
  // gathered wrap around the stems
  for (let ring = 0; ring < 4; ring += 1) {
    const y = -1.20 + ring * 0.035;
    const radius = 0.17 + ring * 0.018;
    for (let i = 0; i < 20; i += 1) {
      const a = i / 20 * Math.PI * 2;
      const p = new THREE.Vector3(Math.cos(a) * radius, y + Math.sin(a * 2) * 0.025, Math.sin(a) * radius * 0.72 + 0.04);
      const u = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
      const v = new THREE.Vector3(0, 1, 0);
      builder.addGlyph(p, u, v, 0.065, 0.072, new THREE.Color(rose).lerp(new THREE.Color('#fff0f3'), random() * 0.3));
    }
  }
  // soft loops of the bow
  const leftLoop = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.05, -1.08, 0.08), new THREE.Vector3(-0.38, -0.91, 0.12),
    new THREE.Vector3(-0.62, -1.09, 0.10), new THREE.Vector3(-0.42, -1.28, 0.10),
    new THREE.Vector3(-0.12, -1.14, 0.12),
  ]);
  const rightLoop = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.05, -1.08, 0.08), new THREE.Vector3(0.39, -0.91, 0.12),
    new THREE.Vector3(0.63, -1.09, 0.10), new THREE.Vector3(0.42, -1.28, 0.10),
    new THREE.Vector3(0.12, -1.14, 0.12),
  ]);
  addRibbonStrip(builder, leftLoop, 0.13, blush, 34, 3, random);
  addRibbonStrip(builder, rightLoop, 0.13, blush, 34, 3, random);
  // long tails with slight curls
  const leftTail = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, -1.15, 0.10), new THREE.Vector3(-0.38, -1.39, 0.13),
    new THREE.Vector3(-0.31, -1.72, 0.16), new THREE.Vector3(-0.55, -1.96, 0.14),
    new THREE.Vector3(-0.48, -2.12, 0.12),
  ]);
  const rightTail = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.08, -1.15, 0.10), new THREE.Vector3(0.40, -1.38, 0.15),
    new THREE.Vector3(0.34, -1.67, 0.18), new THREE.Vector3(0.59, -1.91, 0.14),
    new THREE.Vector3(0.56, -2.10, 0.12),
  ]);
  addRibbonStrip(builder, leftTail, 0.13, rose, 46, 3, random);
  addRibbonStrip(builder, rightTail, 0.13, rose, 46, 3, random);
  // central knot
  for (let i = 0; i < 12; i += 1) {
    const a = i / 12 * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(a) * 0.065, -1.12 + Math.sin(a) * 0.055, 0.21);
    builder.addGlyph(p, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), 0.065, 0.08, '#ffd9e6');
  }
  group.add(builder.build(material));
  group.userData.phase = random() * 6;
  return group;
}

export function createBouquet(atlas, material, random) {
  const root = new THREE.Group();
  const flowerGroups = [];
  FLOWERS.forEach((descriptor, index) => {
    const flower = createFlower(atlas, material, random, descriptor);
    flower.userData.compositionIndex = index;
    root.add(flower);
    flowerGroups.push(flower);
  });
  const ribbon = createRibbon(atlas, material, random);
  root.add(ribbon);
  root.userData.flowers = flowerGroups;
  root.userData.ribbon = ribbon;
  return root;
}

export function animateBouquet(root, time) {
  root.rotation.y = time * (Math.PI * 2 / 75);
  root.rotation.z = Math.sin(time * 0.34) * 0.012;
  root.position.y = Math.sin(time * 0.58) * 0.045;
  root.position.x = Math.sin(time * 0.29) * 0.025;
  root.userData.flowers.forEach((flower) => animateFlower(flower, time));
  root.userData.ribbon.rotation.z = Math.sin(time * 0.85 + root.userData.ribbon.userData.phase) * 0.025;
  root.userData.ribbon.rotation.x = Math.sin(time * 0.63 + 1.2) * 0.015;
}

export const BOUQUET_FLOWER_COUNT = FLOWERS.length;

import * as THREE from 'three';

export const GLYPH_SET = '0123456789@#%&*+=~-.:;,aeou|/\\';

export function createGlyphAtlas() {
  const columns = 8;
  const rows = Math.ceil(GLYPH_SET.length / columns);
  const cellW = 72;
  const cellH = 88;
  const canvas = document.createElement('canvas');
  canvas.width = columns * cellW;
  canvas.height = rows * cellH;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 65px "DejaVu Sans Mono", "Courier New", monospace';
  ctx.fillStyle = '#ffffff';
  GLYPH_SET.split('').forEach((glyph, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    ctx.fillText(glyph, col * cellW + cellW / 2, row * cellH + cellH / 2 + 1);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return { texture, columns, rows, cellW, cellH };
}

export function makeSharedUniforms(atlasTexture) {
  return {
    uAtlas: { value: atlasTexture },
    uTime: { value: 0 },
    uAssembly: { value: 0 },
    uWaveStrength: { value: 0.075 },
  };
}

export function createGlyphMaterial(uniforms) {
  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    toneMapped: false,
    vertexShader: `
      attribute vec3 aColor;
      attribute vec3 aFrom;
      attribute float aDelay;
      attribute float aPhase;
      varying vec2 vUv;
      varying vec3 vColor;
      varying vec3 vWorldPosition;
      varying float vAlpha;
      varying float vPhase;
      uniform float uTime;
      uniform float uAssembly;
      void main() {
        float start = aDelay;
        float finish = min(1.0, aDelay + 0.30);
        float progress = smoothstep(start, finish, uAssembly);
        vec3 assembledPosition = position + aFrom * (1.0 - progress);
        vec4 worldPosition = modelMatrix * vec4(assembledPosition, 1.0);
        vWorldPosition = worldPosition.xyz;
        vUv = uv;
        vColor = aColor;
        vAlpha = progress;
        vPhase = aPhase;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform float uTime;
      uniform float uWaveStrength;
      varying vec2 vUv;
      varying vec3 vColor;
      varying vec3 vWorldPosition;
      varying float vAlpha;
      varying float vPhase;
      void main() {
        vec4 glyph = texture2D(uAtlas, vUv);
        if (glyph.a < 0.08) discard;
        float shimmer = 0.965 + 0.035 * sin(uTime * 1.25 + vPhase * 6.2831);
        float wave = sin(uTime * 0.48 + vWorldPosition.y * 2.15 + vWorldPosition.x * 1.35 + vPhase * 2.0);
        float light = 1.0 + wave * uWaveStrength;
        float centerGlow = 0.035 * exp(-dot(vWorldPosition.xz, vWorldPosition.xz) * 0.32);
        vec3 color = vColor * shimmer * light + vColor * centerGlow;
        gl_FragColor = vec4(color, glyph.a * vAlpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

export class GlyphBuilder {
  constructor(atlas, random) {
    this.atlas = atlas;
    this.random = random;
    this.positions = [];
    this.uvs = [];
    this.colors = [];
    this.from = [];
    this.delays = [];
    this.phases = [];
    this.indices = [];
    this.glyphCount = 0;
  }

  addGlyph(center, tangentU, tangentV, width, height, color, glyphIndex = null, options = {}) {
    const r = this.random;
    const u = tangentU.clone().normalize();
    const v = tangentV.clone().normalize();
    const right = u.clone().multiplyScalar(width * 0.5);
    const up = v.clone().multiplyScalar(height * 0.5);
    const corners = [
      center.clone().sub(right).sub(up),
      center.clone().add(right).sub(up),
      center.clone().sub(right).add(up),
      center.clone().add(right).add(up),
    ];
    const index = glyphIndex === null ? Math.floor(r() * GLYPH_SET.length) : glyphIndex % GLYPH_SET.length;
    const col = index % this.atlas.columns;
    const row = Math.floor(index / this.atlas.columns);
    const pad = 0.065;
    const u0 = (col + pad) / this.atlas.columns;
    const u1 = (col + 1 - pad) / this.atlas.columns;
    const vTop = 1 - (row + pad) / this.atlas.rows;
    const vBottom = 1 - (row + 1 - pad) / this.atlas.rows;
    const uv = [[u0, vBottom], [u1, vBottom], [u0, vTop], [u1, vTop]];
    const c = color instanceof THREE.Color ? color : new THREE.Color(color);
    const delay = options.delay ?? r() * 0.76;
    const phase = options.phase ?? r();
    const scatter = options.scatter ?? 1.7;
    const from = new THREE.Vector3(
      (r() - 0.5) * scatter * 2.4,
      (r() - 0.5) * scatter * 2.6,
      (r() - 0.5) * scatter * 2.2,
    );
    const base = this.glyphCount * 4;
    corners.forEach((p, i) => {
      this.positions.push(p.x, p.y, p.z);
      this.uvs.push(uv[i][0], uv[i][1]);
      this.colors.push(c.r, c.g, c.b);
      this.from.push(from.x, from.y, from.z);
      this.delays.push(delay);
      this.phases.push(phase);
    });
    this.indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
    this.glyphCount += 1;
  }

  addCurveGlyphs(curve, count, color, size = 0.075, options = {}) {
    const up = new THREE.Vector3(0, 1, 0);
    const zAxis = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i < count; i += 1) {
      const t = (i + 0.5) / count;
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      let side = new THREE.Vector3().crossVectors(tangent, zAxis).normalize();
      if (side.lengthSq() < 0.01) side = new THREE.Vector3(1, 0, 0);
      const width = size * (0.8 + this.random() * 0.35);
      this.addGlyph(point, side, tangent, width, size * 1.15, color, null, options);
    }
  }

  build(material) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(this.colors, 3));
    geometry.setAttribute('aFrom', new THREE.Float32BufferAttribute(this.from, 3));
    geometry.setAttribute('aDelay', new THREE.Float32BufferAttribute(this.delays, 1));
    geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(this.phases, 1));
    geometry.setIndex(this.indices);
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.userData.glyphCount = this.glyphCount;
    return mesh;
  }
}

export function makeSeededRandom(seed = 12345) {
  let state = seed >>> 0;
  return function random() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function addGlyphSurface(builder, center, direction, length, width, color, options = {}) {
  const normal = new THREE.Vector3(0, 0, 1);
  const dir = direction.clone().normalize();
  const side = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
  const rows = options.rows ?? 4;
  const columns = options.columns ?? 3;
  const curve = options.curve ?? 0.08;
  const density = options.density ?? 1;
  for (let row = 0; row < rows; row += 1) {
    const s = (row + 0.5) / rows;
    const widthAtRow = Math.sin(Math.PI * Math.pow(s, 0.84)) ** 0.68;
    for (let col = 0; col < columns; col += 1) {
      const t = ((col + 0.5) / columns) * 2 - 1;
      if (Math.abs(t) > widthAtRow * 0.98) continue;
      const across = t * width * widthAtRow;
      const point = center.clone()
        .addScaledVector(dir, s * length)
        .addScaledVector(side, across);
      point.z += curve * Math.sin(s * Math.PI) + 0.035 * (1 - t * t);
      const tangentU = dir.clone().addScaledVector(normal, curve * Math.cos(s * Math.PI) / Math.max(length, 0.1));
      const tangentV = side.clone().addScaledVector(normal, 0.07 * t);
      const edgeScale = 0.68 + widthAtRow * 0.32;
      const size = (options.glyphSize ?? 0.078) * edgeScale * (0.86 + builder.random() * 0.25);
      builder.addGlyph(point, tangentU, tangentV, size * 0.96, size * 1.05, color, null, options);
    }
  }
}

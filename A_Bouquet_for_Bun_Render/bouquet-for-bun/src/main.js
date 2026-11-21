import * as THREE from 'three';
import { createGlyphAtlas, makeSharedUniforms, createGlyphMaterial, makeSeededRandom } from './graphics/glyphs.js';
import { createBouquet, animateBouquet, BOUQUET_FLOWER_COUNT } from './bouquet/Bouquet.js';
import { createButterflies, animateButterflies } from './butterflies/Butterflies.js';
import { AudioManager } from './audio/AudioManager.js';

const canvas = document.querySelector('#artwork');
const dedication = document.querySelector('#dedication');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const random = makeSeededRandom(27112026);
const audio = new AudioManager();

let renderer;
let scene;
let camera;
let bouquet;
let butterflies;
let uniforms;
let startTime = performance.now();
let lastFrame = startTime;
let disposed = false;
let resizeObserver;
let pointerX = 0;
let pointerY = 0;
let targetPointerX = 0;
let targetPointerY = 0;

function init() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false,
    });
  } catch (error) {
    showFallback(error);
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.set(0, 0.93, 8.15);
  camera.lookAt(0, 0.14, 0);

  // Soft, restrained practical lights help the depth feel coherent even though
  // the floral surfaces themselves are rendered from individually colored glyphs.
  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);
  const pinkLight = new THREE.PointLight(0xff8dbb, 1.4, 9, 2);
  pinkLight.position.set(-2.8, 1.5, 3.5);
  scene.add(pinkLight);
  const blueLight = new THREE.PointLight(0x7199ff, 1.15, 8, 2);
  blueLight.position.set(2.8, 0.4, -2.2);
  scene.add(blueLight);
  const warmLight = new THREE.PointLight(0xffb36a, 0.75, 7, 2);
  warmLight.position.set(0.3, -1.5, 3.2);
  scene.add(warmLight);

  const atlas = createGlyphAtlas();
  uniforms = makeSharedUniforms(atlas.texture);
  const glyphMaterial = createGlyphMaterial(uniforms);

  bouquet = createBouquet(atlas, glyphMaterial, random);
  scene.add(bouquet);
  butterflies = createButterflies(atlas, glyphMaterial, random, 8);
  scene.add(butterflies);

  fitViewport();
  resizeObserver = new ResizeObserver(fitViewport);
  resizeObserver.observe(document.documentElement);
  window.addEventListener('orientationchange', fitViewport, { passive: true });
  canvas.addEventListener('pointermove', onPointerMove, { passive: true });
  canvas.addEventListener('pointerleave', resetPointer, { passive: true });
  window.addEventListener('pagehide', dispose, { once: true });
  window.addEventListener('pointerdown', startAudio, { once: true, passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  requestAnimationFrame(render);

  // Keep the actual generative nature of the work visible during development,
  // without adding interface elements to the artwork itself.
  document.documentElement.dataset.flowerCount = String(BOUQUET_FLOWER_COUNT);
}

function fitViewport() {
  if (!renderer || !camera || !bouquet) return;
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const aspect = width / height;
  const mobile = aspect < 0.78;
  const smallHeight = height < 680;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1.35 : 1.75);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  camera.aspect = aspect;
  camera.fov = mobile ? 39 : 37;
  camera.position.z = mobile ? 8.45 : 8.05;
  camera.position.y = smallHeight ? 0.78 : 0.93;
  camera.updateProjectionMatrix();
  camera.lookAt(0, 0.12, 0);
  const scale = mobile ? (smallHeight ? 0.63 : 0.65) : aspect < 1.15 ? 0.86 : 0.98;
  bouquet.scale.setScalar(scale);
  butterflies.scale.setScalar(mobile ? 0.86 : 1);
}

function onPointerMove(event) {
  if (event.pointerType === 'touch') return;
  targetPointerX = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
  targetPointerY = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
}

function resetPointer() {
  targetPointerX = 0;
  targetPointerY = 0;
}

function startAudio() {
  audio.start();
}

function onVisibilityChange() {
  if (document.hidden) lastFrame = performance.now();
}

function render(now) {
  if (disposed) return;
  requestAnimationFrame(render);
  if (document.hidden) return;

  const delta = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  const elapsed = (now - startTime) / 1000;
  const opening = THREE.MathUtils.clamp((elapsed - 0.25) / 8.7, 0, 1);
  uniforms.uTime.value = elapsed;
  uniforms.uAssembly.value = opening;
  uniforms.uWaveStrength.value = reducedMotion ? 0.035 : 0.075;

  if (elapsed > 2.25 && elapsed < 7.25) dedication.classList.add('visible');
  if (elapsed >= 7.25) dedication.classList.add('gone');

  const motionScale = reducedMotion ? 0.45 : 1;
  animateBouquet(bouquet, elapsed * motionScale);
  animateButterflies(butterflies, elapsed * motionScale, opening);

  pointerX += (targetPointerX - pointerX) * Math.min(1, delta * 1.3);
  pointerY += (targetPointerY - pointerY) * Math.min(1, delta * 1.3);
  camera.position.x = pointerX * 0.105;
  camera.position.y = (window.innerHeight < 680 ? 0.78 : 0.93) - pointerY * 0.075;
  camera.lookAt(pointerX * 0.045, 0.12 + pointerY * 0.035, 0);

  renderer.render(scene, camera);
}

function showFallback(error) {
  console.error('WebGL initialization failed:', error);
  canvas.hidden = true;
  const fallback = document.querySelector('#fallback');
  fallback.hidden = false;
  fallback.innerHTML = `
    <div class="fallback-bouquet" aria-label="A text bouquet">
      <div class="fallback-flowers">@   ✿   #   ✿   @<br>  %   *   +   *   %<br>✿   &   0   &   ✿</div>
      <div class="fallback-stems">\\  |  /  \\  |  /</div>
    </div>`;
}

function dispose() {
  if (disposed) return;
  disposed = true;
  resizeObserver?.disconnect();
  if (renderer) renderer.dispose();
}

init();

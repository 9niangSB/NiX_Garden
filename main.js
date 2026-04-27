/**
 * NiX Garden — 和風 Voxel 種田家園系統
 * ════════════════════════════════════════
 *  🏯 地基層（FROZEN - DO NOT MODIFY）
 *  地面 / 鏡頭 / 燈光 / 石燈籠 / 石頭 / Raycaster / 點擊放置植物+家具
 * ════════════════════════════════════════
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================
//  全域狀態
// ============================================================
let currentMode = 'plant';   // 'plant' | 'build' | 'delete'
let plantCount  = 0;
let buildCount  = 0;

const placedObjects = [];    // { mesh, type, gridX, gridZ }

// ============================================================
//  場景基礎
// ============================================================
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xF2E9E4);
scene.fog = new THREE.Fog(0xF2E9E4, 40, 80);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 14, 20);

// ============================================================
//  OrbitControls
// ============================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan     = false;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 2.2;
controls.minDistance   = 8;
controls.maxDistance   = 35;
controls.target.set(0, 0, 0);

// ============================================================
//  光源
// ============================================================
const ambientLight = new THREE.AmbientLight(0xFFF5E8, 1.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xFFE8C8, 2.2);
dirLight.position.set(-12, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near   = 0.5;
dirLight.shadow.camera.far    = 60;
dirLight.shadow.camera.left   = -20;
dirLight.shadow.camera.right  =  20;
dirLight.shadow.camera.top    =  20;
dirLight.shadow.camera.bottom = -20;
dirLight.shadow.bias = -0.001;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xD4E8F0, 0.6);
fillLight.position.set(8, 6, -8);
scene.add(fillLight);

// ============================================================
//  Voxel 地面（地基 - 不動）
// ============================================================
const GRID_SIZE  = 24;
const CELL_SIZE  = 1.0;

const GRASS_COLORS = [
  0xA8D5A2, 0x90C98A, 0xB8E0B2, 0x7EBE78, 0xC8E8C0,
];

const groundGroup = new THREE.Group();
scene.add(groundGroup);

const groundHitMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE),
  new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
);
groundHitMesh.rotation.x = -Math.PI / 2;
groundHitMesh.name = 'groundHit';
scene.add(groundHitMesh);

const occupiedCells = new Set();

function buildGround() {
  const half = GRID_SIZE / 2;
  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      const yOffset  = (Math.random() - 0.5) * 0.1;
      const height   = 0.2 + Math.random() * 0.08;
      const colorIdx = Math.floor(Math.random() * GRASS_COLORS.length);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_SIZE, height, CELL_SIZE),
        new THREE.MeshLambertMaterial({ color: GRASS_COLORS[colorIdx] })
      );
      mesh.position.set(
        x * CELL_SIZE + CELL_SIZE / 2,
        yOffset - height / 2,
        z * CELL_SIZE + CELL_SIZE / 2
      );
      mesh.receiveShadow = true;
      mesh.name = 'ground_tile';
      groundGroup.add(mesh);
    }
  }
}
buildGround();

function buildPath() {
  for (let x = -1; x <= 1; x++) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(CELL_SIZE * 0.92, 0.22, CELL_SIZE * 0.92),
      new THREE.MeshLambertMaterial({ color: 0xC4A882 })
    );
    mesh.position.set(x * CELL_SIZE, -0.05, 0);
    mesh.receiveShadow = true;
    groundGroup.add(mesh);
  }
}
buildPath();

// ============================================================
//  裝飾物（地基 - 不動）
// ============================================================
function createLantern(x, z) {
  const g        = new THREE.Group();
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0xB8AFA8 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.4), stoneMat);
  base.position.y = 0.08; base.castShadow = true; g.add(base);

  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.18), stoneMat);
  pole.position.y = 0.5; pole.castShadow = true; g.add(pole);

  const box = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.38),
    new THREE.MeshLambertMaterial({ color: 0xD4CFC8 }));
  box.position.y = 1.0; box.castShadow = true; g.add(box);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.52), stoneMat);
  roof.position.y = 1.2; g.add(roof);

  const pl = new THREE.PointLight(0xFFD080, 1.2, 3.5);
  pl.position.y = 1.0; g.add(pl);

  g.position.set(x, 0, z);
  scene.add(g);
}
createLantern(-5, -5);
createLantern( 5, -5);
createLantern(-5,  5);
createLantern( 5,  5);

function createRock(x, z, scale = 1) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.4*scale + Math.random()*0.2, 0.25*scale, 0.35*scale + Math.random()*0.15),
    new THREE.MeshLambertMaterial({ color: 0xBBB0A8 })
  );
  mesh.position.set(x, 0.12*scale, z);
  mesh.rotation.y = Math.random() * Math.PI;
  mesh.castShadow = true;
  scene.add(mesh);
}
createRock(-3, 7);
createRock( 4, -6, 1.3);
createRock(-7,  2);
createRock( 6,  3, 0.8);

// ============================================================
//  Raycaster & Pointer（地基 - 不動）
// ============================================================
const raycaster = new THREE.Raycaster();
const pointer   = new THREE.Vector2();

function getPointerNDC(event) {
  const rect    = renderer.domElement.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  pointer.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
  pointer.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
}

function raycastGround() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObject(groundHitMesh);
  return hits.length > 0 ? hits[0].point : null;
}

function snapToGrid(worldPos) {
  return {
    x: Math.round(worldPos.x / CELL_SIZE) * CELL_SIZE,
    z: Math.round(worldPos.z / CELL_SIZE) * CELL_SIZE
  };
}

// ============================================================
//  Hover 預覽（地基 - 不動）
// ============================================================
let previewMesh = null;

function createPreviewMesh(mode) {
  if (previewMesh) { scene.remove(previewMesh); previewMesh = null; }
  if (mode === 'delete') return;

  const geo = mode === 'plant'
    ? new THREE.ConeGeometry(0.28, 0.7, 6)
    : new THREE.BoxGeometry(0.7, 0.55, 0.7);
  const mat = new THREE.MeshLambertMaterial({
    color:       mode === 'plant' ? 0xF6C6C8 : 0xC89B6D,
    transparent: true,
    opacity:     0.45,
    depthWrite:  false
  });
  previewMesh = new THREE.Mesh(geo, mat);
  previewMesh.name = 'preview';
  scene.add(previewMesh);
}
createPreviewMesh(currentMode);

// ============================================================
//  植物生成（地基 - 不動）
// ============================================================
function spawnPlant(x, z) {
  const key = `${x},${z}`;
  if (occupiedCells.has(key)) return;
  occupiedCells.add(key);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.06, 0.35, 6),
    new THREE.MeshLambertMaterial({ color: 0x8DB870 })
  );
  stem.position.y = 0.17;

  const flower = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.6, 6),
    new THREE.MeshLambertMaterial({ color: 0xF6C6C8 })
  );
  flower.position.y = 0.65;

  const group = new THREE.Group();
  group.add(stem);
  group.add(flower);
  group.position.set(x, 0, z);
  group.castShadow = true;
  group.scale.set(0.1, 0.1, 0.1);

  scene.add(group);
  placedObjects.push({ mesh: group, type: 'plant', gridX: x, gridZ: z, grown: false });
  plantCount++;
  updateCountUI();
  showToast('🌱 種下了一株小花！');
  animateSpawn(group);
  setTimeout(() => growPlant(group), 5000);
}

// ============================================================
//  家具生成（地基 - 不動）
// ============================================================
function spawnFurniture(x, z) {
  const key = `${x},${z}`;
  if (occupiedCells.has(key)) return;
  occupiedCells.add(key);

  const types = ['bench', 'table', 'lamp'];
  const t     = types[Math.floor(Math.random() * types.length)];
  const group = new THREE.Group();

  if (t === 'bench') {
    const woodMat = new THREE.MeshLambertMaterial({ color: 0xC89B6D });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.1, 0.35), woodMat);
    seat.position.y = 0.3; group.add(seat);
    const legMat = new THREE.MeshLambertMaterial({ color: 0xA07850 });
    [[-0.28,-0.1],[0.28,-0.1],[-0.28,0.1],[0.28,0.1]].forEach(([lx,lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.07), legMat);
      leg.position.set(lx, 0.15, lz); group.add(leg);
    });

  } else if (t === 'table') {
    const woodMat = new THREE.MeshLambertMaterial({ color: 0xC89B6D });
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.65), woodMat);
    top.position.y = 0.42; group.add(top);
    const legMat = new THREE.MeshLambertMaterial({ color: 0xA07850 });
    [[-0.25,-0.25],[0.25,-0.25],[-0.25,0.25],[0.25,0.25]].forEach(([lx,lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 0.07), legMat);
      leg.position.set(lx, 0.21, lz); group.add(leg);
    });

  } else {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.12, 0.35, 8),
      new THREE.MeshLambertMaterial({ color: 0xF9D6A0, transparent: true, opacity: 0.88 })
    );
    body.position.y = 0.5; group.add(body);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.55, 6),
      new THREE.MeshLambertMaterial({ color: 0x8B6040 })
    );
    pole.position.y = 0.27; group.add(pole);
    const glow = new THREE.PointLight(0xFFD080, 1.0, 2.5);
    glow.position.y = 0.5; group.add(glow);
  }

  group.position.set(x, 0, z);
  group.castShadow = true;
  group.scale.set(0.1, 0.1, 0.1);
  scene.add(group);
  placedObjects.push({ mesh: group, type: 'build', gridX: x, gridZ: z });
  buildCount++;
  updateCountUI();
  showToast('🪑 放置了一件家具！');
  animateSpawn(group);
}

// ============================================================
//  成長 / 動畫（地基 - 不動）
// ============================================================
function growPlant(group) {
  const obj = placedObjects.find(o => o.mesh === group);
  if (!obj || obj.grown) return;
  obj.grown = true;

  const from = group.scale.x, to = 1.6, dur = 1200, t0 = performance.now();
  function tick(now) {
    const t = Math.min((now - t0) / dur, 1);
    const s = from + (to - from) * easeOutBounce(t);
    group.scale.set(s, s, s);
    if (t < 1) requestAnimationFrame(tick);
    else showToast('🌸 植物長大了！');
  }
  requestAnimationFrame(tick);
}

function animateSpawn(group) {
  const dur = 400, t0 = performance.now();
  function tick(now) {
    const t = Math.min((now - t0) / dur, 1);
    const s = easeOutBack(t);
    group.scale.set(s, s, s);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ============================================================
//  刪除（地基 - 不動）
// ============================================================
function deleteAt(x, z) {
  const key = `${x},${z}`;
  if (!occupiedCells.has(key)) return;
  const idx = placedObjects.findIndex(o => o.gridX === x && o.gridZ === z);
  if (idx < 0) return;
  const obj = placedObjects[idx];
  scene.remove(obj.mesh);
  obj.mesh.traverse(child => {
    if (child.isMesh) {
      child.geometry.dispose();
      (Array.isArray(child.material) ? child.material : [child.material]).forEach(m => m.dispose());
    }
  });
  if (obj.type === 'plant') plantCount = Math.max(0, plantCount - 1);
  else buildCount = Math.max(0, buildCount - 1);
  placedObjects.splice(idx, 1);
  occupiedCells.delete(key);
  updateCountUI();
  showToast('🗑️ 移除完成');
}

// ============================================================
//  Easing（地基 - 不動）
// ============================================================
function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t-1,3) + c1 * Math.pow(t-1,2);
}
function easeOutBounce(t) {
  const n1 = 7.5625, d1 = 2.75;
  if (t < 1/d1)   return n1*t*t;
  if (t < 2/d1)   return n1*(t-=1.5/d1)*t+0.75;
  if (t < 2.5/d1) return n1*(t-=2.25/d1)*t+0.9375;
  return n1*(t-=2.625/d1)*t+0.984375;
}

// ============================================================
//  Pointer 事件（地基 - 不動）
// ============================================================
let isDragging   = false;
let pointerStart = { x: 0, y: 0 };
const DRAG_THRESHOLD = 6;

renderer.domElement.addEventListener('pointerdown', e => {
  pointerStart.x = e.clientX;
  pointerStart.y = e.clientY;
  isDragging = false;
});

renderer.domElement.addEventListener('pointermove', e => {
  const dx = e.clientX - pointerStart.x;
  const dy = e.clientY - pointerStart.y;
  if (Math.sqrt(dx*dx + dy*dy) > DRAG_THRESHOLD) isDragging = true;

  getPointerNDC(e);
  const hit = raycastGround();
  if (hit && previewMesh) {
    const s = snapToGrid(hit);
    previewMesh.position.set(s.x, currentMode === 'plant' ? 0.55 : 0.28, s.z);
    previewMesh.visible = true;
  } else if (previewMesh) {
    previewMesh.visible = false;
  }
});

renderer.domElement.addEventListener('pointerup', e => {
  if (isDragging) return;
  getPointerNDC(e);
  const hit = raycastGround();
  if (!hit) return;
  const { x, z } = snapToGrid(hit);
  const half = (GRID_SIZE / 2) * CELL_SIZE;
  if (Math.abs(x) > half || Math.abs(z) > half) return;

  if (currentMode === 'plant')       spawnPlant(x, z);
  else if (currentMode === 'build')  spawnFurniture(x, z);
  else if (currentMode === 'delete') deleteAt(x, z);
});

// ============================================================
//  全域 setMode（地基 - 不動）
// ============================================================
window.setMode = function(mode) {
  currentMode = mode;
  document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
  const btnMap = { plant: 'btn-plant', build: 'btn-build', delete: 'btn-delete' };
  document.getElementById(btnMap[mode])?.classList.add('active');
  const labels = { plant: '種植', build: '家具', delete: '移除' };
  document.getElementById('mode-label').textContent = `模式：${labels[mode]}`;
  createPreviewMesh(mode);
};

// ============================================================
//  UI（地基 - 不動）
// ============================================================
function updateCountUI() {
  document.getElementById('plant-count').textContent = plantCount;
  document.getElementById('build-count').textContent = buildCount;
}

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
//  Render Loop（地基 - 不動）
// ============================================================
let previewFloatT = 0;
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  controls.update();

  if (previewMesh && previewMesh.visible) {
    previewFloatT += delta * 2.5;
    previewMesh.position.y += Math.sin(previewFloatT) * 0.003;
    previewMesh.rotation.y += delta * 1.2;
  }

  renderer.render(scene, camera);
}
animate();

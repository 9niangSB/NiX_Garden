/**
 * NiX Garden v1.0 Complete
 * ════════════════════════════
 *  地基層  — renderer / scene / camera / lights / ground / raycaster / easing
 *  一樓    — 背景山 / 便利屋建築 / 粒子 / 植物圖鑑 / 家具圖鑑 / 動物 / 季節
 *  二樓    — 農場經濟 (種子/成長/果實/採收/賣出/買種)
 * ════════════════════════════
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================
//  資料層
// ============================================================
const plantCatalog = {
  tomato:     { name:'番茄',   icon:'🍅', stemColor:0x6CA850, topColor:0xFF6347, shape:'sphere', growTime:8000,  produceTime:6000,  sell:5  },
  strawberry: { name:'草莓',   icon:'🍓', stemColor:0x6CA850, topColor:0xFF4D6D, shape:'cone',   growTime:10000, produceTime:6000,  sell:8  },
  blueberry:  { name:'藍莓',   icon:'🫐', stemColor:0x6CA850, topColor:0x4F6DFF, shape:'sphere', growTime:10000, produceTime:6000,  sell:10 },
  pumpkin:    { name:'南瓜',   icon:'🎃', stemColor:0x5A8A40, topColor:0xFFA500, shape:'big',    growTime:18000, produceTime:10000, sell:25, price:20 },
  sakura:     { name:'櫻花樹', icon:'🌸', stemColor:0x8B6040, topColor:0xF6C6C8, shape:'big',    growTime:12000, produceTime:12000, sell:15 },
};

const furnitureCatalog = [
  { id:'chair',  name:'椅子',   icon:'🪑', color:0xC89B6D },
  { id:'table',  name:'桌子',   icon:'🪵', color:0xA97C50 },
  { id:'window', name:'窗戶',   icon:'🪟', color:0xA8C8E8 },
  { id:'door',   name:'門',     icon:'🚪', color:0x8B6040 },
  { id:'cobble', name:'石子路', icon:'🪨', color:0xB0A898 },
  { id:'pond',   name:'池塘',   icon:'💧', color:0x5C8FB0 },
  { id:'japanese_house', name:'和風小屋', icon:'🏯', color:0xC87060 },
];

const SEASON_CFG = {
  spring: { bg:0xF2E9E4, fog:0xF2E9E4, grass:[0xA8D5A2,0x90C98A,0xB8E0B2,0x7EBE78,0xC8E8C0], mtn:[0xC8DDB0,0xB0CC98,0xD8E8C0], ambient:0xFFF5E8, dir:0xFFE8C8, ptcl:'petal', label:'春 🌸' },
  summer: { bg:0xD6EAF0, fog:0xD6EAF0, grass:[0x68B860,0x50A848,0x78C870,0x5AB852,0x88D880],  mtn:[0x5A9858,0x489048,0x6AA860], ambient:0xF0FFEE, dir:0xFFFFE0, ptcl:'leaf',  label:'夏 ☀️' },
  autumn: { bg:0xEDE0D4, fog:0xEDE0D4, grass:[0xC8A870,0xB89060,0xD8B880,0xA87850,0xE0C890],  mtn:[0xC07040,0xA86030,0xD08050], ambient:0xFFEED8, dir:0xFFCC88, ptcl:'maple', label:'秋 🍁' },
  winter: { bg:0xE8EEF5, fog:0xE8EEF5, grass:[0xD8E8F0,0xC8DCE8,0xE0EEF8,0xC0D4E4,0xF0F8FF], mtn:[0xE0ECF8,0xD0E0F0,0xF0F8FF], ambient:0xF0F8FF, dir:0xE8F0FF, ptcl:'snow',  label:'冬 ❄️' },
};

// ============================================================
//  全域狀態
// ============================================================
let currentMode    = 'plant';
let selectedSeed   = 'tomato';
let selectedFurnId = 'chair';
let currentSeason  = 'spring';
let money          = 0;

const inventory      = { tomato:0, strawberry:0, blueberry:0, pumpkin:0, sakura:0 };
const inventorySeeds = { tomato:999, strawberry:999, blueberry:999, pumpkin:0, sakura:999 };

const plants        = [];   // plant data objects
const placedObjects = [];   // furniture
const occupiedCells = new Set();
const groundTiles   = [];   // refs for season recolor
const animals       = [];

// ============================================================
//  ═══ 地基層 ═══  Renderer / Scene / Camera
// ============================================================
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.outputColorSpace  = THREE.SRGBColorSpace;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xF2E9E4);
scene.fog        = new THREE.Fog(0xF2E9E4, 40, 80);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 14, 20);

// ============================================================
//  ═══ 地基層 ═══  OrbitControls
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
//  ═══ 地基層 ═══  Lights
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
//  ═══ 地基層 ═══  Voxel Ground
// ============================================================
const GRID_SIZE    = 24;
const CELL_SIZE    = 1.0;
const GRASS_COLORS = [0xA8D5A2, 0x90C98A, 0xB8E0B2, 0x7EBE78, 0xC8E8C0];

const groundGroup   = new THREE.Group();
scene.add(groundGroup);

const groundHitMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE),
  new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
);
groundHitMesh.rotation.x = -Math.PI / 2;
groundHitMesh.name = 'groundHit';
scene.add(groundHitMesh);

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
      mesh.userData.colorIdx = colorIdx;
      groundGroup.add(mesh);
      groundTiles.push(mesh);   // ← season recolor
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
//  ═══ 地基層 ═══  石燈籠 & 石頭
// ============================================================
function createLantern(x, z) {
  const g        = new THREE.Group();
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0xB8AFA8 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.15,0.4), stoneMat);
  base.position.y = 0.08; base.castShadow = true; g.add(base);
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.7,0.18), stoneMat);
  pole.position.y = 0.5; pole.castShadow = true; g.add(pole);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.38,0.32,0.38),
    new THREE.MeshLambertMaterial({ color: 0xD4CFC8 }));
  box.position.y = 1.0; box.castShadow = true; g.add(box);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.52,0.1,0.52), stoneMat);
  roof.position.y = 1.2; g.add(roof);
  const pl = new THREE.PointLight(0xFFD080, 1.2, 3.5);
  pl.position.y = 1.0; g.add(pl);
  g.position.set(x, 0, z);
  scene.add(g);
}
createLantern(-5,-5); createLantern(5,-5);
createLantern(-5, 5); createLantern(5, 5);

function createRock(x, z, scale = 1) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.4*scale+Math.random()*0.2, 0.25*scale, 0.35*scale+Math.random()*0.15),
    new THREE.MeshLambertMaterial({ color: 0xBBB0A8 })
  );
  mesh.position.set(x, 0.12*scale, z);
  mesh.rotation.y = Math.random() * Math.PI;
  mesh.castShadow = true;
  scene.add(mesh);
}
createRock(-3, 7); createRock(4,-6,1.3);
createRock(-7, 2); createRock(6, 3,0.8);

// ============================================================
//  ═══ 一樓 ═══  背景山
// ============================================================
const mountainGroup = new THREE.Group();
scene.add(mountainGroup);

function buildMountains() {
  mountainGroup.clear();
  const mtn   = SEASON_CFG[currentSeason].mtn;
  const peaks = [[-22,-20,8,7],[-12,-22,6,5],[0,-24,10,9],[12,-22,7,6],[22,-20,9,7.5],[-20,20,7,5],[20,20,8,6]];
  peaks.forEach(([x,z,sx,sy],i) => {
    const m = new THREE.Mesh(
      new THREE.ConeGeometry(sx*0.6, sy, 5+(i%3)),
      new THREE.MeshLambertMaterial({ color: mtn[i%mtn.length] })
    );
    m.position.set(x, sy/2-0.5, z);
    mountainGroup.add(m);
  });
}

// ============================================================
//  ═══ 一樓 ═══  便利屋建築
// ============================================================
const shopGroup  = new THREE.Group();
const shopMeshes = [];

function addShopPart(geo, color, px, py, pz) {
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color }));
  m.position.set(px, py, pz);
  m.castShadow = true;
  m.userData.isShop = true;
  shopGroup.add(m);
  shopMeshes.push(m);
}
// 主體
addShopPart(new THREE.BoxGeometry(2.2,1.8,2.0), 0xF5E8C8, 0,0.9,0);
// 屋頂
addShopPart(new THREE.BoxGeometry(2.6,0.3,2.4), 0xC87040, 0,1.95,0);
// 屋簷
addShopPart(new THREE.BoxGeometry(2.8,0.08,2.6), 0xA05030, 0,1.8,0);
// 門
addShopPart(new THREE.BoxGeometry(0.6,1.0,0.06), 0x8B6040, 0,0.5,1.03);
// 招牌
addShopPart(new THREE.BoxGeometry(1.2,0.4,0.06), 0xD03020, 0,1.65,1.03);
// 招牌金文字裝飾
addShopPart(new THREE.BoxGeometry(0.9,0.22,0.08), 0xF5C030, 0,1.65,1.07);
// 窗戶（透明）
const shopWin = new THREE.Mesh(
  new THREE.BoxGeometry(0.7,0.5,0.06),
  new THREE.MeshLambertMaterial({ color:0xC8E8F8, transparent:true, opacity:0.72 })
);
shopWin.position.set(-0.7,0.9,1.03);
shopWin.userData.isShop = true;
shopGroup.add(shopWin);
shopMeshes.push(shopWin);
// 燈光
const shopLight = new THREE.PointLight(0xFFDD88, 1.0, 5.0);
shopLight.position.set(0,2.5,0);
shopGroup.add(shopLight);

shopGroup.position.set(9,0,8);
shopGroup.rotation.y = -Math.PI / 5;
scene.add(shopGroup);

// ============================================================
//  ═══ 一樓 ═══  粒子效果
// ============================================================
let particleSystem   = null;
const PARTICLE_COUNT = 280;

function buildParticles(type) {
  if (particleSystem) { scene.remove(particleSystem); particleSystem = null; }
  const pos = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pos[i*3]   = (Math.random()-0.5) * 24;
    pos[i*3+1] = Math.random() * 12 + 1;
    pos[i*3+2] = (Math.random()-0.5) * 24;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const colorMap = { petal:0xF6C6C8, snow:0xEEF4FF, maple:0xE85520, leaf:0x88C860 };
  particleSystem = new THREE.Points(geo, new THREE.PointsMaterial({
    color: colorMap[type] || 0xFFFFFF,
    size:  type === 'snow' ? 0.15 : 0.22,
    transparent: true, opacity: type === 'snow' ? 0.85 : 0.72,
    depthWrite: false, sizeAttenuation: true,
  }));
  particleSystem.userData.ptype = type;
  scene.add(particleSystem);
}

function updateParticles(delta) {
  if (!particleSystem) return;
  const pos = particleSystem.geometry.attributes.position.array;
  const spd = particleSystem.userData.ptype === 'snow' ? 0.5 : 0.8;
  const t   = Date.now() * 0.001;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pos[i*3+1] -= spd * delta;
    pos[i*3]   += Math.sin(t + i) * 0.004;
    if (pos[i*3+1] < -0.5) {
      pos[i*3]   = (Math.random()-0.5) * 24;
      pos[i*3+1] = 12 + Math.random() * 4;
      pos[i*3+2] = (Math.random()-0.5) * 24;
    }
  }
  particleSystem.geometry.attributes.position.needsUpdate = true;
}

// ============================================================
//  ═══ 地基層 ═══  Raycaster 工具
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
//  ═══ 一樓 ═══  Hover 預覽（圖鑑感知）
// ============================================================
let previewMesh = null;

function createPreviewMesh() {
  if (previewMesh) { scene.remove(previewMesh); previewMesh = null; }
  if (currentMode === 'delete') return;

  let geo, color;
  if (currentMode === 'plant') {
    const def = plantCatalog[selectedSeed];
    color = def.topColor;
    geo   = def.shape === 'big'    ? new THREE.SphereGeometry(0.5,7,5)
          : def.shape === 'sphere' ? new THREE.SphereGeometry(0.25,7,5)
          :                          new THREE.ConeGeometry(0.28,0.7,6);
  } else {
    color = (furnitureCatalog.find(f=>f.id===selectedFurnId)||furnitureCatalog[0]).color;
    geo   = new THREE.BoxGeometry(0.75,0.55,0.75);
  }
  previewMesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
    color, transparent:true, opacity:0.42, depthWrite:false
  }));
  previewMesh.name = 'preview';
  scene.add(previewMesh);
}

// ============================================================
//  ═══ 二樓 ═══  植物：視覺構建
// ============================================================
function buildPlantGroup(type) {
  const def   = plantCatalog[type];
  const g     = new THREE.Group();
  const isBig = def.shape === 'big';
  const stemH = isBig ? 0.7 : 0.38;

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(isBig?0.08:0.04, isBig?0.11:0.06, stemH, 6),
    new THREE.MeshLambertMaterial({ color: def.stemColor })
  );
  stem.position.y = stemH / 2;
  g.add(stem);

  let top;
  if (def.shape === 'big') {
    top = new THREE.Mesh(new THREE.SphereGeometry(0.5,8,6),
      new THREE.MeshLambertMaterial({ color: def.topColor }));
    top.position.y = stemH + 0.4;
  } else if (def.shape === 'sphere') {
    top = new THREE.Mesh(new THREE.SphereGeometry(0.22,7,5),
      new THREE.MeshLambertMaterial({ color: def.topColor }));
    top.position.y = stemH + 0.22;
  } else {
    top = new THREE.Mesh(new THREE.ConeGeometry(0.28,0.6,6),
      new THREE.MeshLambertMaterial({ color: def.topColor }));
    top.position.y = stemH + 0.4;
  }
  top.castShadow = true;
  top.userData.isPlantTop = true;
  g.add(top);
  return g;
}

// ============================================================
//  ═══ 二樓 ═══  植物：種植
// ============================================================
function spawnPlant(x, z) {
  const key = `${x},${z}`;
  if (occupiedCells.has(key)) return;
  if ((inventorySeeds[selectedSeed]||0) <= 0) {
    showToast('種が足りない！便利屋で買おう 🌱'); return;
  }
  occupiedCells.add(key);
  inventorySeeds[selectedSeed]--;

  const group = buildPlantGroup(selectedSeed);
  group.position.set(x, 0, z);
  group.scale.setScalar(0.15);
  scene.add(group);

  plants.push({
    mesh:       group,
    fruitMesh:  null,
    type:       selectedSeed,
    stage:      'growing',
    hasFruit:   false,
    lastUpdate: Date.now(),
    gridX:      x,
    gridZ:      z,
  });
  updateUI();
  showToast(`${plantCatalog[selectedSeed].icon} ${plantCatalog[selectedSeed].name} を植えた！`);
  animateSpawn(group);
}

// ============================================================
//  ═══ 二樓 ═══  植物：成長 loop
// ============================================================
function spawnFruitMesh(pData) {
  if (pData.fruitMesh) { pData.mesh.remove(pData.fruitMesh); pData.fruitMesh = null; }
  const def = plantCatalog[pData.type];
  const fr  = new THREE.Mesh(
    new THREE.SphereGeometry(0.14,6,5),
    new THREE.MeshLambertMaterial({ color:def.topColor, emissive:def.topColor, emissiveIntensity:0.35 })
  );
  const topMesh = pData.mesh.children.find(c => c.userData.isPlantTop);
  fr.position.set(0, topMesh ? topMesh.position.y + 0.28 : 0.9, 0);
  fr.userData.isFruit = true;
  pData.mesh.add(fr);
  pData.fruitMesh = fr;
}

function updatePlants(now) {
  plants.forEach(p => {
    const def = plantCatalog[p.type];
    if (!def) return;

    if (p.stage === 'growing') {
      const prog = Math.min((now - p.lastUpdate) / def.growTime, 1);
      p.mesh.scale.setScalar(0.15 + prog * 0.85);
      if (prog >= 1) { p.stage = 'ready'; p.lastUpdate = now; }

    } else if (p.stage === 'ready' && !p.hasFruit) {
      if (now - p.lastUpdate >= def.produceTime) {
        p.hasFruit = true;
        spawnFruitMesh(p);
        showToast(`${def.icon} ${def.name} が実った！タップして収穫`);
      }
    }

    // 果實浮動動畫
    if (p.fruitMesh) {
      p.fruitMesh.position.y += Math.sin(now * 0.002 + p.gridX) * 0.0012;
      p.fruitMesh.rotation.y += 0.015;
    }
  });
}

// ============================================================
//  ═══ 二樓 ═══  植物：採收
// ============================================================
function harvestPlant(pData) {
  if (!pData.hasFruit) return;
  inventory[pData.type] = (inventory[pData.type] || 0) + 1;
  pData.hasFruit   = false;
  pData.lastUpdate = Date.now();
  if (pData.fruitMesh) { pData.mesh.remove(pData.fruitMesh); pData.fruitMesh = null; }
  const def = plantCatalog[pData.type];
  showToast(`${def.icon} ${def.name} +1 収穫！`);
  updateUI();
  bounceAnim(pData.mesh);
}

// ============================================================
//  ═══ 一樓 ═══  家具：視覺構建
// ============================================================
function buildFurnitureMesh(id) {
  const def = furnitureCatalog.find(f=>f.id===id) || furnitureCatalog[0];
  const g   = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: def.color });

  if (id === 'chair') {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.75,0.1,0.35), mat);
    seat.position.y = 0.3; g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.75,0.4,0.06), mat);
    back.position.set(0,0.55,-0.15); g.add(back);
    const lm = new THREE.MeshLambertMaterial({ color:0xA07850 });
    [[-0.28,-0.1],[0.28,-0.1],[-0.28,0.1],[0.28,0.1]].forEach(([lx,lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.3,0.07),lm);
      leg.position.set(lx,0.15,lz); g.add(leg);
    });

  } else if (id === 'table') {
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.9,0.08,0.9), mat);
    top.position.y = 0.45; g.add(top);
    const lm = new THREE.MeshLambertMaterial({ color:0x8B6040 });
    [[-0.35,-0.35],[0.35,-0.35],[-0.35,0.35],[0.35,0.35]].forEach(([lx,lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.45,0.08),lm);
      leg.position.set(lx,0.225,lz); g.add(leg);
    });

  } else if (id === 'window') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.8,1.1,0.1), mat);
    frame.position.y = 0.55; g.add(frame);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.8,0.04),
      new THREE.MeshLambertMaterial({ color:0xC8E8F8, transparent:true, opacity:0.55 }));
    glass.position.set(0,0.6,0.04); g.add(glass);
    const bm = new THREE.MeshLambertMaterial({ color:0x8B6040 });
    const hb = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.04,0.05),bm); hb.position.set(0,0.6,0.06); g.add(hb);
    const vb = new THREE.Mesh(new THREE.BoxGeometry(0.04,0.8,0.05),bm); vb.position.set(0,0.6,0.06); g.add(vb);

  } else if (id === 'door') {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.7,1.4,0.1), mat);
    door.position.y = 0.7; g.add(door);
    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.12),
      new THREE.MeshLambertMaterial({ color:0xD4AA40 }));
    knob.position.set(0.25,0.7,0.1); g.add(knob);

  } else if (id === 'cobble') {
    for (let i=0;i<9;i++) {
      const s  = 0.12 + Math.random()*0.1;
      const sm = new THREE.Mesh(new THREE.BoxGeometry(s,0.07,s),
        new THREE.MeshLambertMaterial({ color:0xB0A898 }));
      sm.position.set((Math.random()-0.5)*0.82, 0.04, (Math.random()-0.5)*0.82);
      sm.rotation.y = Math.random()*Math.PI; g.add(sm);
    }

  } else if (id === 'pond') {
    const water = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.1,1.4),
      new THREE.MeshLambertMaterial({ color:0x5C8FB0, transparent:true, opacity:0.82 }));
    water.position.y = 0.02; g.add(water);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(1.6,0.12,1.6),
      new THREE.MeshLambertMaterial({ color:0xB0A898 }));
    rim.position.y = -0.04; g.add(rim);
    const lily = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.03,8),
      new THREE.MeshLambertMaterial({ color:0x78C860 }));
    lily.position.set(0.2,0.1,0.2); g.add(lily);

  } else if (id === 'japanese_house') {
    // ═══ 五重塔 v2.0 — 5-Tier Pagoda (5.5×5.5 base ≈ 30 cells²) ═══
    // Visual richness: 3-5 color shades per material, no empty surfaces

    // Reds: 3 shades (wall / shadow / highlight)
    const rA = new THREE.MeshLambertMaterial({ color: 0xBE3020 });
    const rB = new THREE.MeshLambertMaterial({ color: 0x982018 });
    const rC = new THREE.MeshLambertMaterial({ color: 0xD44035 });
    // Teals: 3 shades (roof main / deep / accent)
    const tA = new THREE.MeshLambertMaterial({ color: 0x1E6852 });
    const tB = new THREE.MeshLambertMaterial({ color: 0x286860 });
    const tC = new THREE.MeshLambertMaterial({ color: 0x144C3C });
    // Stones: 3 shades
    const sA = new THREE.MeshLambertMaterial({ color: 0xC8BEB0 });
    const sB = new THREE.MeshLambertMaterial({ color: 0xB0A898 });
    const sC = new THREE.MeshLambertMaterial({ color: 0xDAD4C8 });
    // Pinks: 3 shades (light / mid / saturated)
    const pkA = new THREE.MeshLambertMaterial({ color: 0xFCD8E4 });
    const pkB = new THREE.MeshLambertMaterial({ color: 0xF0A8C0 });
    const pkC = new THREE.MeshLambertMaterial({ color: 0xFAECF2 });
    // Browns: 2 shades
    const brM = new THREE.MeshLambertMaterial({ color: 0x8B6040 });
    const brD = new THREE.MeshLambertMaterial({ color: 0x644828 });
    // Greens: 3 shades
    const grA = new THREE.MeshLambertMaterial({ color: 0x7AAA50 });
    const grB = new THREE.MeshLambertMaterial({ color: 0x5A9040 });
    const grC = new THREE.MeshLambertMaterial({ color: 0x92C060 });
    // Gold (sorin finial)
    const goM = new THREE.MeshLambertMaterial({ color: 0xD4AA30, emissive: 0xA88010, emissiveIntensity: 0.30 });
    const whM = new THREE.MeshLambertMaterial({ color: 0xF8F0E0 });
    // Water: 2 depths
    const wA  = new THREE.MeshLambertMaterial({ color: 0x4C82B0, transparent: true, opacity: 0.85 });
    const wB  = new THREE.MeshLambertMaterial({ color: 0x38689A, transparent: true, opacity: 0.80 });
    // Lantern glow
    const lnM = new THREE.MeshLambertMaterial({ color: 0xF5D060, emissive: 0xFFAA00, emissiveIntensity: 0.42 });

    const jh = (geo, mat, x, y, z) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
      return m;
    };

    // ─── Platform ─────────────────────────────────────────────
    jh(new THREE.BoxGeometry(5.5,  0.24, 5.5),  sA, 0, 0.12, 0);    // base
    jh(new THREE.BoxGeometry(5.5,  0.06, 5.5),  sC, 0, 0.27, 0);    // highlight strip
    jh(new THREE.BoxGeometry(3.4,  0.24, 3.4),  sB, 0, 0.36, 0);    // inner raised plinth
    jh(new THREE.BoxGeometry(3.4,  0.04, 3.4),  sC, 0, 0.52, 0);    // plinth edge
    // Steps (front-center)
    jh(new THREE.BoxGeometry(1.8,  0.12, 0.32), sB, 0, 0.36, 1.74);
    jh(new THREE.BoxGeometry(1.5,  0.12, 0.32), sA, 0, 0.48, 1.44);

    // ─── 5-Tier Pagoda ────────────────────────────────────────
    // Alternating wall/eave colors per tier for visual richness
    const pTiers = [
      { bW:2.50, bH:1.10, e1:3.75, e2:4.08, wM:rA, eM:tA },
      { bW:2.00, bH:0.96, e1:3.05, e2:3.32, wM:rB, eM:tC },
      { bW:1.60, bH:0.84, e1:2.44, e2:2.66, wM:rA, eM:tB },
      { bW:1.25, bH:0.74, e1:1.92, e2:2.10, wM:rC, eM:tA },
      { bW:0.96, bH:0.64, e1:1.50, e2:1.64, wM:rB, eM:tC },
    ];
    let cY = 0.56;
    pTiers.forEach((t, i) => {
      // Body
      jh(new THREE.BoxGeometry(t.bW, t.bH, t.bW), t.wM, 0, cY+t.bH/2, 0);
      // Front face highlight (lighter red strip)
      jh(new THREE.BoxGeometry(t.bW*0.68, t.bH*0.48, 0.04), rC, 0, cY+t.bH*0.54, t.bW/2+0.02);
      // Eave — lower droop (slightly wider, lower, thin)
      const eY = cY + t.bH;
      jh(new THREE.BoxGeometry(t.e2, 0.09, t.e2), t.eM, 0, eY-0.05, 0);
      // Eave — main slab
      jh(new THREE.BoxGeometry(t.e1, 0.20, t.e1), t.eM, 0, eY+0.10, 0);
      // Eave — top accent (tB = mid teal)
      jh(new THREE.BoxGeometry(t.e1*0.86, 0.05, t.e1*0.86), tB, 0, eY+0.22, 0);
      // Eave corner gold ornaments (4 corners)
      const hw = t.e1/2 - 0.08;
      [[hw,hw],[hw,-hw],[-hw,hw],[-hw,-hw]].forEach(([cx,cz]) => {
        jh(new THREE.BoxGeometry(0.1, 0.16, 0.1), goM, cx, eY+0.07, cz);
      });
      cY = eY + 0.27;
    });

    // ─── Tier-1 Columns, Doors & Windows ─────────────────────
    [-0.92, 0.92].forEach(cx => {   // front columns
      jh(new THREE.BoxGeometry(0.11, 1.0, 0.11), rC, cx, 1.06, 1.26);
    });
    // Sliding door panels (front)
    jh(new THREE.BoxGeometry(0.58, 0.52, 0.07), whM,  0, 0.82, 1.27);
    jh(new THREE.BoxGeometry(0.56, 0.04, 0.08), rB, 0, 0.70, 1.28);
    jh(new THREE.BoxGeometry(0.56, 0.04, 0.08), rB, 0, 0.86, 1.28);
    jh(new THREE.BoxGeometry(0.04, 0.50, 0.08), rB, 0, 0.82, 1.28);
    // Round windows (both sides — CylinderGeometry disc)
    [-1.27, 1.27].forEach(wx => {
      const wd = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 10), whM);
      wd.rotation.z = Math.PI / 2;
      wd.position.set(wx, 0.92, 0);
      g.add(wd);
    });
    // Back columns
    [-0.92, 0.92].forEach(cx => {
      jh(new THREE.BoxGeometry(0.11, 1.0, 0.11), rC, cx, 1.06, -1.26);
    });

    // ─── Sorin Spire (相輪) ───────────────────────────────────
    const sY = cY;
    jh(new THREE.BoxGeometry(0.52, 0.48, 0.52), sB, 0, sY+0.24, 0);   // stone pedestal
    jh(new THREE.BoxGeometry(0.36, 0.40, 0.36), sA, 0, sY+0.68, 0);   // taper
    jh(new THREE.CylinderGeometry(0.04, 0.08, 1.6, 6), goM, 0, sY+1.50, 0); // gold rod
    [0.28, 0.52, 0.74, 0.93, 1.10].forEach(dy => {                    // 5 gold rings
      jh(new THREE.CylinderGeometry(0.10, 0.10, 0.055, 8), goM, 0, sY+0.88+dy, 0);
    });
    jh(new THREE.SphereGeometry(0.10, 8, 6),      goM, 0, sY+2.38, 0); // top orb
    jh(new THREE.ConeGeometry(0.07, 0.22, 6),     goM, 0, sY+2.56, 0); // flame tip

    // ─── Torii Gate (front entrance) ─────────────────────────
    jh(new THREE.BoxGeometry(0.10, 1.52, 0.10), rA, -1.08, 0.76, 2.44);
    jh(new THREE.BoxGeometry(0.10, 1.52, 0.10), rA,  1.08, 0.76, 2.44);
    jh(new THREE.BoxGeometry(2.45, 0.10, 0.10), rA,  0, 1.50, 2.44);
    jh(new THREE.BoxGeometry(2.25, 0.08, 0.10), rB,  0, 1.34, 2.44);
    jh(new THREE.BoxGeometry(0.88, 0.17, 0.08), goM, 0, 1.42, 2.46);   // plaque

    // ─── Stone Lanterns (4 positions) ─────────────────────────
    [[-1.52,1.92],[1.52,1.92],[-2.18,-0.08],[2.18,-0.08]].forEach(([lx,lz]) => {
      jh(new THREE.BoxGeometry(0.24, 0.10, 0.24), sB,  lx, 0.17, lz);  // base
      jh(new THREE.BoxGeometry(0.12, 0.52, 0.12), sA,  lx, 0.47, lz);  // pole
      jh(new THREE.BoxGeometry(0.32, 0.22, 0.32), lnM, lx, 0.77, lz);  // glow box
      jh(new THREE.BoxGeometry(0.40, 0.09, 0.40), sB,  lx, 0.93, lz);  // cap
    });

    // ─── Water Pond + Wooden Bridge ───────────────────────────
    jh(new THREE.BoxGeometry(2.05, 0.15, 1.22), sA,  -1.58, 0.09, 2.08);  // rim
    jh(new THREE.BoxGeometry(1.74, 0.10, 0.95), wA,  -1.58, 0.15, 2.08);  // surface
    jh(new THREE.BoxGeometry(1.74, 0.06, 0.95), wB,  -1.58, 0.09, 2.08);  // depth
    // Lily pads (3 greens)
    [[-1.4,2.02,grA],[-1.72,2.16,grB],[-1.52,2.38,grC]].forEach(([px,pz,gm]) => {
      jh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 8), gm, px, 0.20, pz);
    });
    // Red wooden bridge
    jh(new THREE.BoxGeometry(0.54, 0.07, 1.22), rB, -1.58, 0.23, 2.08);
    [-0.54, -0.10, 0.35].forEach(dz => {
      jh(new THREE.BoxGeometry(0.54, 0.28, 0.05), rA, -1.58, 0.37, 2.08+dz);  // railings
    });
    jh(new THREE.BoxGeometry(0.54, 0.05, 1.22), rC, -1.58, 0.50, 2.08);  // handrail top

    // ─── Cherry Blossom Trees (4 trees, rich clusters) ────────
    [[-2.12,-1.70],[-2.10,0.88],[2.20,-1.52],[2.20,0.68]].forEach(([tx,tz], ti) => {
      const tBr = ti%2===0 ? brM : brD;
      jh(new THREE.CylinderGeometry(0.10, 0.15, 1.52, 6), tBr, tx, 0.76, tz);
      jh(new THREE.CylinderGeometry(0.06, 0.09, 0.66, 5), tBr, tx+0.24, 1.18, tz+0.10);
      jh(new THREE.CylinderGeometry(0.06, 0.09, 0.64, 5), tBr, tx-0.20, 1.22, tz-0.10);
      // 9-sphere blossom crown (3 pink shades, varying sizes)
      const PKS = [pkA, pkB, pkC];
      [[0,1.66,0],[0.38,1.44,0.22],[-0.32,1.46,-0.20],[0.16,1.57,-0.30],
       [-0.20,1.52,0.28],[0.28,1.63,-0.14],[-0.12,1.73,0.12],[0,1.50,0.38],[-0.34,1.36,0.30]
      ].forEach(([bx,by,bz], bi) => {
        jh(new THREE.SphereGeometry(0.20+(bi%3)*0.04, 6, 5), PKS[bi%3], tx+bx, by, tz+bz);
      });
    });

    // ─── Scattered Petals (on ground + stone path) ────────────
    [[-0.6,2.55],[-1.88,2.22],[0.9,2.42],[1.6,2.02],
     [-0.2,2.88],[0.5,1.86],[1.2,2.62],[-0.8,1.72],[0.3,2.35]].forEach(([px,pz],pi) => {
      jh(new THREE.BoxGeometry(0.07, 0.025, 0.055), [pkA,pkB,pkC][pi%3], px, 0.26, pz);
    });
    // Petals drifting on eave (first roof tier top)
    [[-1.6,1.88,-1.0],[1.6,1.88,-0.8],[-1.2,1.88,1.4],[1.4,1.88,1.2]].forEach(([px,py,pz],pi) => {
      jh(new THREE.BoxGeometry(0.07, 0.025, 0.055), [pkA,pkB][pi%2], px, py, pz);
    });

    // ─── Ground Details ───────────────────────────────────────
    // Stone path (front-center)
    [[-0.58,2.12],[0,2.24],[0.58,2.12],[-0.3,2.46],[0.3,2.46]].forEach(([px,pz]) => {
      jh(new THREE.BoxGeometry(0.30, 0.06, 0.26), [sA,sB,sC][Math.floor(Math.random()*3)], px, 0.18, pz);
    });
    // Moss / grass patches
    [[-2.32,1.28],[-2.42,-0.22],[2.18,1.58],[2.30,-0.72],
     [-1.08,-2.12],[1.28,-2.20],[0,-2.45],[-2.02,-1.52],[2.08,-1.80]].forEach(([gx,gz]) => {
      jh(new THREE.BoxGeometry(0.36+Math.random()*0.28, 0.06, 0.30+Math.random()*0.22),
         [grA,grB,grC][Math.floor(Math.random()*3)], gx, 0.26, gz);
    });
    // Scatter rocks (3 stone shades)
    [[-2.55,0.52],[2.46,0.10],[-0.50,-2.36],[0.92,-2.42],
     [-1.90,-1.88],[1.84,-1.72],[-2.58,-1.22],[2.50,-1.40]].forEach(([rx,rz],ri) => {
      jh(new THREE.BoxGeometry(0.18, 0.10, 0.14), [sA,sB,sC][ri%3], rx, 0.17, rz);
    });
  }
  return g;
}

function spawnFurniture(x, z) {
  const key = `${x},${z}`;
  if (occupiedCells.has(key)) return;
  occupiedCells.add(key);
  const def   = furnitureCatalog.find(f=>f.id===selectedFurnId) || furnitureCatalog[0];
  const group = buildFurnitureMesh(selectedFurnId);
  group.position.set(x, 0, z);
  group.scale.setScalar(0.1);
  group.castShadow = true;
  scene.add(group);
  placedObjects.push({ mesh:group, type:'build', furnId:def.id, gridX:x, gridZ:z });
  updateUI();
  showToast(`${def.icon} ${def.name} を置いた！`);
  animateSpawn(group);
}

// ============================================================
//  ═══ 二樓 ═══  經濟：賣出 / 買種
// ============================================================
function sellAll() {
  let total = 0;
  for (const k in inventory) {
    if ((inventory[k]||0) > 0) {
      total       += inventory[k] * (plantCatalog[k]?.sell || 0);
      inventory[k] = 0;
    }
  }
  if (total === 0) { showToast('倉庫が空！先に収穫しよう 🌾'); return; }
  money += total;
  updateUI();
  showToast(`💰 +${total} コイン！`);
  closeAllPanels();
}
window.sellAll = sellAll;

function buySeed(type) {
  const def = plantCatalog[type];
  if (!def?.price || def.price <= 0) return;
  if (money < def.price) { showToast(`💸 コイン不足！(${def.price} 必要)`); return; }
  money -= def.price;
  inventorySeeds[type] = (inventorySeeds[type]||0) + 1;
  updateUI();
  showToast(`${def.icon} ${def.name} の種を購入！`);
}
window.buySeed = buySeed;

// ============================================================
//  ═══ 一樓 ═══  動物
// ============================================================
const ANIMAL_DEF = [
  { name:'兔', color:0xF5F0EA, sx:0.45, sy:0.45, sz:0.50 },
  { name:'狐', color:0xE8904A, sx:0.50, sy:0.42, sz:0.55 },
  { name:'鹿', color:0xC89060, sx:0.40, sy:0.65, sz:0.50 },
];

function createAnimal() {
  const t    = ANIMAL_DEF[Math.floor(Math.random()*ANIMAL_DEF.length)];
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(t.sx,t.sy,t.sz),
    new THREE.MeshLambertMaterial({ color:t.color })
  );
  const em  = new THREE.MeshLambertMaterial({ color:t.color });
  const eym = new THREE.MeshLambertMaterial({ color:0x222222 });
  [-0.1,0.1].forEach(ox => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.18,0.08),em);
    ear.position.set(ox,t.sy*0.6,0.1); body.add(ear);
  });
  [-0.1,0.1].forEach(ox => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,0.06),eym);
    eye.position.set(ox,t.sy*0.15,t.sz*0.5+0.01); body.add(eye);
  });
  body.position.set((Math.random()-0.5)*14, t.sy/2, (Math.random()-0.5)*14);
  body.castShadow = true;
  scene.add(body);
  animals.push({
    mesh:body, name:t.name, halfH:t.sy/2,
    speed:0.9+Math.random()*0.6,
    targetX:(Math.random()-0.5)*14, targetZ:(Math.random()-0.5)*14,
    changeTimer:0, changeInterval:3+Math.random()*4,
    isIdle:false, idleTimer:0,
  });
}
for (let i=0;i<3;i++) createAnimal();

function updateAnimals(delta, now) {
  animals.forEach(a => {
    a.changeTimer += delta;

    // 尋找有果實的最近植物
    let nearP = null, nearD = Infinity;
    plants.forEach(p => {
      if (!p.hasFruit) return;
      const dx = p.mesh.position.x - a.mesh.position.x;
      const dz = p.mesh.position.z - a.mesh.position.z;
      const d  = Math.sqrt(dx*dx + dz*dz);
      if (d < nearD) { nearD = d; nearP = p; }
    });
    if (nearP && nearD < 12) {
      a.targetX = nearP.mesh.position.x;
      a.targetZ = nearP.mesh.position.z;
      if (nearD < 0.9) {
        harvestPlant(nearP);
        showToast(`🐾 ${a.name}が収穫した！`);
        a.isIdle = true; a.idleTimer = 2; a.changeTimer = 0;
        return;
      }
    }

    if (a.isIdle) {
      a.mesh.rotation.y += Math.sin(now*0.003)*0.025;
      if (a.changeTimer > a.idleTimer) { a.isIdle = false; a.changeTimer = 0; }
      return;
    }

    const dx = a.targetX - a.mesh.position.x;
    const dz = a.targetZ - a.mesh.position.z;
    const d  = Math.sqrt(dx*dx + dz*dz);
    if (d > 0.15) {
      a.mesh.position.x += (dx/d)*a.speed*delta;
      a.mesh.position.z += (dz/d)*a.speed*delta;
      a.mesh.rotation.y  = Math.atan2(dx/d, dz/d);
      a.mesh.position.y  = a.halfH + Math.abs(Math.sin(now*0.008))*0.07;
    }
    if (a.changeTimer > a.changeInterval || d < 0.15) {
      a.changeTimer = 0; a.changeInterval = 3+Math.random()*5;
      if (Math.random() < 0.3) { a.isIdle = true; a.idleTimer = 1+Math.random()*2; }
      else { a.targetX = (Math.random()-0.5)*14; a.targetZ = (Math.random()-0.5)*14; }
    }
  });
}

// ============================================================
//  ═══ 一樓 ═══  季節系統
// ============================================================
function setSeason(s) {
  currentSeason = s;
  const cfg = SEASON_CFG[s];
  scene.background = new THREE.Color(cfg.bg);
  scene.fog         = new THREE.Fog(cfg.fog, 40, 80);
  groundTiles.forEach(t => t.material.color.setHex(cfg.grass[t.userData.colorIdx % cfg.grass.length]));
  buildMountains();
  ambientLight.color.setHex(cfg.ambient);
  dirLight.color.setHex(cfg.dir);
  buildParticles(cfg.ptcl);
  const lbl = document.getElementById('season-label');
  if (lbl) lbl.textContent = cfg.label;
  document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`btn-season-${s}`)?.classList.add('active');
  showToast(cfg.label);
}
window.setSeason = setSeason;

// ============================================================
//  ═══ 地基層 ═══  刪除
// ============================================================
function deleteAt(x, z) {
  const key = `${x},${z}`;
  if (!occupiedCells.has(key)) return;

  // 植物優先
  const pIdx = plants.findIndex(p => p.gridX===x && p.gridZ===z);
  if (pIdx >= 0) {
    const p = plants[pIdx];
    scene.remove(p.mesh);
    p.mesh.traverse(c => {
      if (!c.isMesh) return;
      c.geometry.dispose();
      (Array.isArray(c.material)?c.material:[c.material]).forEach(m=>m.dispose());
    });
    plants.splice(pIdx, 1);
    occupiedCells.delete(key);
    updateUI();
    showToast('🗑️ 植物を除去');
    return;
  }

  // 家具
  const idx = placedObjects.findIndex(o => o.gridX===x && o.gridZ===z);
  if (idx < 0) return;
  const obj = placedObjects[idx];
  scene.remove(obj.mesh);
  obj.mesh.traverse(c => {
    if (!c.isMesh) return;
    c.geometry.dispose();
    (Array.isArray(c.material)?c.material:[c.material]).forEach(m=>m.dispose());
  });
  placedObjects.splice(idx, 1);
  occupiedCells.delete(key);
  updateUI();
  showToast('🗑️ 移除完成');
}

// ============================================================
//  ═══ 地基層 ═══  Easing & Animation
// ============================================================
function easeOutBack(t) {
  const c1=1.70158, c3=c1+1;
  return 1 + c3*Math.pow(t-1,3) + c1*Math.pow(t-1,2);
}
function easeOutBounce(t) {  // kept for compatibility
  const n1=7.5625, d1=2.75;
  if (t<1/d1)   return n1*t*t;
  if (t<2/d1)   return n1*(t-=1.5/d1)*t+0.75;
  if (t<2.5/d1) return n1*(t-=2.25/d1)*t+0.9375;
  return n1*(t-=2.625/d1)*t+0.984375;
}
function animateSpawn(group) {
  const dur=380, t0=performance.now();
  function tick(now) {
    const t = Math.min((now-t0)/dur, 1);
    group.scale.setScalar(easeOutBack(t));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function bounceAnim(group) {
  const orig=group.scale.x, t0=performance.now();
  function tick(now) {
    const t = Math.min((now-t0)/300, 1);
    group.scale.setScalar(orig * (1 + Math.sin(t*Math.PI)*0.25));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ============================================================
//  ═══ 地基層 ═══  Pointer Events
// ============================================================
let isDragging   = false;
let pointerStart = { x:0, y:0 };
const DRAG_THRESHOLD = 6;

renderer.domElement.addEventListener('pointerdown', e => {
  pointerStart.x = e.clientX;
  pointerStart.y = e.clientY;
  isDragging = false;
});

renderer.domElement.addEventListener('pointermove', e => {
  const dx = e.clientX - pointerStart.x;
  const dy = e.clientY - pointerStart.y;
  if (Math.sqrt(dx*dx+dy*dy) > DRAG_THRESHOLD) isDragging = true;

  getPointerNDC(e);
  const hit = raycastGround();
  if (hit && previewMesh) {
    const s = snapToGrid(hit);
    previewMesh.position.set(s.x, currentMode==='plant' ? 0.6 : 0.3, s.z);
    previewMesh.visible = true;
  } else if (previewMesh) {
    previewMesh.visible = false;
  }
});

renderer.domElement.addEventListener('pointerup', e => {
  if (isDragging) return;
  getPointerNDC(e);
  raycaster.setFromCamera(pointer, camera);

  // ① 便利屋
  if (raycaster.intersectObjects(shopMeshes).length > 0) { openShop(); return; }

  // ② 植物（採收 / 刪除）
  const allPM = [];
  plants.forEach(p => p.mesh.traverse(c => { if (c.isMesh) allPM.push(c); }));
  const pHits = raycaster.intersectObjects(allPM);
  if (pHits.length > 0) {
    let target = null;
    outer: for (const p of plants) {
      let obj = pHits[0].object;
      while (obj) { if (obj===p.mesh){target=p; break outer;} obj=obj.parent; }
    }
    if (target) {
      if (currentMode === 'delete')     deleteAt(target.gridX, target.gridZ);
      else if (target.hasFruit)         harvestPlant(target);
      else showToast(target.stage==='growing' ? '🌱 育っています...' : '🌿 もうすぐ実る...');
      return;
    }
  }

  // ③ 地面
  const hit = raycastGround();
  if (!hit) return;
  const { x, z } = snapToGrid(hit);
  const half = (GRID_SIZE/2) * CELL_SIZE;
  if (Math.abs(x)>half || Math.abs(z)>half) return;

  if (currentMode === 'plant')       spawnPlant(x, z);
  else if (currentMode === 'build')  spawnFurniture(x, z);
  else if (currentMode === 'delete') deleteAt(x, z);
});

// ============================================================
//  ═══ Global API ═══  (HTML onclick)
// ============================================================
window.setMode = function(mode) {
  currentMode = mode;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const map = { plant:'btn-plant', build:'btn-build', delete:'btn-delete' };
  document.getElementById(map[mode])?.classList.add('active');
  const labels = { plant:'種植', build:'家具', delete:'移除' };
  document.getElementById('mode-label').textContent = `模式：${labels[mode]}`;
  closeAllPanels();
  createPreviewMesh();
};

window.openCatalog = function(type) {
  const panel = document.getElementById('catalog-panel');
  const list  = document.getElementById('catalog-list');
  const title = document.getElementById('catalog-title');
  document.getElementById('shop-panel')?.classList.add('hidden');
  list.innerHTML = '';

  if (type === 'plant') {
    title.textContent = '🌿 植物圖鑑';
    Object.entries(plantCatalog).forEach(([id, def]) => {
      const cnt = inventorySeeds[id] || 0;
      const btn = document.createElement('button');
      btn.className = 'catalog-item' + (id===selectedSeed ? ' selected' : '');
      btn.innerHTML = `<span class="ci-icon">${def.icon}</span><span class="ci-name">${def.name}</span><span class="ci-stock">×${cnt}</span>`;
      btn.onclick = () => {
        selectedSeed = id;
        window.setMode('plant');
        list.querySelectorAll('.catalog-item').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        showToast(`${def.icon} ${def.name} 選択`);
      };
      list.appendChild(btn);
    });
  } else {
    title.textContent = '🪵 家具圖鑑';
    furnitureCatalog.forEach(def => {
      const btn = document.createElement('button');
      btn.className = 'catalog-item' + (def.id===selectedFurnId ? ' selected' : '');
      btn.innerHTML = `<span class="ci-icon">${def.icon}</span><span class="ci-name">${def.name}</span>`;
      btn.onclick = () => {
        selectedFurnId = def.id;
        window.setMode('build');
        list.querySelectorAll('.catalog-item').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        showToast(`${def.icon} ${def.name} 選択`);
      };
      list.appendChild(btn);
    });
  }
  panel.classList.toggle('hidden');
};
window.closeCatalog = function() { document.getElementById('catalog-panel')?.classList.add('hidden'); };

function openShop() {
  document.getElementById('catalog-panel')?.classList.add('hidden');
  updateShopUI();
  document.getElementById('shop-panel')?.classList.toggle('hidden');
}
window.openShop  = openShop;
window.closeShop = function() { document.getElementById('shop-panel')?.classList.add('hidden'); };

function closeAllPanels() {
  document.getElementById('catalog-panel')?.classList.add('hidden');
  document.getElementById('shop-panel')?.classList.add('hidden');
}

function updateShopUI() {
  const sellList = document.getElementById('sell-list');
  if (!sellList) return;
  sellList.innerHTML = '';
  let total = 0;
  for (const k in inventory) {
    const cnt = inventory[k] || 0;
    const def = plantCatalog[k];
    if (!def) continue;
    total += cnt * (def.sell||0);
    const row = document.createElement('div');
    row.className = 'sell-row';
    row.innerHTML = `<span>${def.icon} ${def.name}</span><span class="sell-cnt">${cnt}個</span><span class="sell-val">+${cnt*(def.sell||0)}</span>`;
    sellList.appendChild(row);
  }
  const tot = document.getElementById('sell-total');
  if (tot) tot.textContent = `合計: ${total} コイン`;
}

// ============================================================
//  ═══ UI ═══
// ============================================================
function updateUI() {
  // 金錢
  const mEl = document.getElementById('money-display');
  if (mEl) mEl.textContent = money;

  // 倉庫（果實）
  for (const k in inventory) {
    const el = document.getElementById(`inv-${k}`);
    if (el) el.textContent = inventory[k] || 0;
  }

  // 種子庫存（便利屋內顯示）
  for (const k in inventorySeeds) {
    const el = document.getElementById(`seed-${k}`);
    if (el) el.textContent = inventorySeeds[k] || 0;
  }

  // 植物/家具計數（右下）
  const pc = document.getElementById('plant-count');
  const bc = document.getElementById('build-count');
  if (pc) pc.textContent = plants.length;
  if (bc) bc.textContent = placedObjects.length;
}

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2400);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
//  ═══ Render Loop ═══
// ============================================================
let previewFloatT = 0;
const clock = new THREE.Clock();

// 初始化（呼叫 setSeason 觸發山/粒子/顏色全部到位）
setSeason('spring');
createPreviewMesh();
updateUI();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const now   = Date.now();

  controls.update();
  updatePlants(now);
  updateAnimals(delta, now);
  updateParticles(delta);

  if (previewMesh?.visible) {
    previewFloatT += delta * 2.5;
    previewMesh.position.y += Math.sin(previewFloatT) * 0.003;
    previewMesh.rotation.y += delta * 1.2;
  }

  renderer.render(scene, camera);
}
animate();

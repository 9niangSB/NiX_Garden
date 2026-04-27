/**
 * NiX Garden v3 — 農場經濟循環系統
 * 種植 → 成長 → 產出 → 採收 → 倉庫 → 賣出 → 金錢 → 買種子
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================
//  種子資料庫（核心經濟數據）
// ============================================================
const seeds = {
  tomato:     { name:'番茄',   icon:'🍅', price:0,  growTime:5000,  produceTime:5000,  sell:5,  color:0xFF6347, stemColor:0x6CA850, big:false },
  strawberry: { name:'草莓',   icon:'🍓', price:0,  growTime:6000,  produceTime:5000,  sell:8,  color:0xFF4D6D, stemColor:0x6CA850, big:false },
  pumpkin:    { name:'南瓜',   icon:'🎃', price:20, growTime:12000, produceTime:8000,  sell:25, color:0xFFA500, stemColor:0x5A8A40, big:true  },
  watermelon: { name:'西瓜',   icon:'🍉', price:30, growTime:15000, produceTime:10000, sell:35, color:0x4CAF50, stemColor:0x4A7A30, big:true  },
  melon:      { name:'哈密瓜', icon:'🍈', price:40, growTime:18000, produceTime:12000, sell:50, color:0x90EE90, stemColor:0x6CA850, big:true  },
};

// ============================================================
//  家具圖鑑
// ============================================================
const furnitureCatalog = [
  { id:'chair',   name:'椅子',   icon:'🪑', color:0xC89B6D },
  { id:'table',   name:'桌子',   icon:'🪵', color:0xA97C50 },
  { id:'window',  name:'窗戶',   icon:'🪟', color:0xA8C8E8 },
  { id:'door',    name:'門',     icon:'🚪', color:0x8B6040 },
  { id:'cobble',  name:'石子路', icon:'🪨', color:0xB0A898 },
  { id:'pond',    name:'池塘',   icon:'💧', color:0x5C8FB0 },
];

// ============================================================
//  季節資料
// ============================================================
const SEASON_DATA = {
  spring: { bg:0xF2E9E4, fog:0xF2E9E4, grass:[0xA8D5A2,0x90C98A,0xB8E0B2,0x7EBE78,0xC8E8C0], mountain:[0xC8DDB0,0xB0CC98,0xD8E8C0], ambient:0xFFF5E8, dir:0xFFE8C8, particle:'petal',      label:'春 🌸' },
  summer: { bg:0xD6EAF0, fog:0xD6EAF0, grass:[0x68B860,0x50A848,0x78C870,0x5AB852,0x88D880],  mountain:[0x5A9858,0x489048,0x6AA860], ambient:0xF0FFEE, dir:0xFFFFE0, particle:'leaf_green', label:'夏 ☀️' },
  autumn: { bg:0xEDE0D4, fog:0xEDE0D4, grass:[0xC8A870,0xB89060,0xD8B880,0xA87850,0xE0C890],  mountain:[0xC07040,0xA86030,0xD08050], ambient:0xFFEED8, dir:0xFFCC88, particle:'maple',      label:'秋 🍁' },
  winter: { bg:0xE8EEF5, fog:0xE8EEF5, grass:[0xD8E8F0,0xC8DCE8,0xE0EEF8,0xC0D4E4,0xF0F8FF], mountain:[0xE0ECF8,0xD0E0F0,0xF0F8FF], ambient:0xF0F8FF, dir:0xE8F0FF, particle:'snow',       label:'冬 ❄️' },
};

// ============================================================
//  全域狀態
// ============================================================
let money          = 0;
let currentMode    = 'plant';
let selectedSeed   = 'tomato';
let selectedFurnId = 'chair';
let currentSeason  = 'spring';

const inventory      = { tomato:0, strawberry:0, pumpkin:0, watermelon:0, melon:0 };
const inventorySeeds = { tomato:999, strawberry:999, pumpkin:0, watermelon:0, melon:0 };

const plants        = [];   // { mesh, fruitMesh, type, stage, hasFruit, lastUpdate, gridX, gridZ }
const placedObjects = [];   // furniture
const occupiedCells = new Set();
const animals       = [];
const groundTiles   = [];

// ============================================================
//  Renderer / Scene / Camera
// ============================================================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.outputColorSpace  = THREE.SRGBColorSpace;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const scene  = new THREE.Scene();
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
dirLight.shadow.camera.right  = 20;
dirLight.shadow.camera.top    = 20;
dirLight.shadow.camera.bottom = -20;
dirLight.shadow.bias = -0.001;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xD4E8F0, 0.6);
fillLight.position.set(8, 6, -8);
scene.add(fillLight);

// ============================================================
//  Voxel 地面
// ============================================================
const GRID_SIZE   = 24;
const CELL_SIZE   = 1.0;
const groundGroup = new THREE.Group();
scene.add(groundGroup);

const groundHitMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE),
  new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
);
groundHitMesh.rotation.x = -Math.PI / 2;
scene.add(groundHitMesh);

function buildGround() {
  const half = GRID_SIZE / 2;
  const sd   = SEASON_DATA[currentSeason];
  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      const yOff = (Math.random() - 0.5) * 0.1;
      const h    = 0.2 + Math.random() * 0.08;
      const ci   = Math.floor(Math.random() * sd.grass.length);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, h, 1),
        new THREE.MeshLambertMaterial({ color: sd.grass[ci] })
      );
      mesh.position.set(x + 0.5, yOff - h / 2, z + 0.5);
      mesh.receiveShadow = true;
      mesh.userData.colorIdx = ci;
      groundGroup.add(mesh);
      groundTiles.push(mesh);
    }
  }
  // 石板小路
  for (let x = -1; x <= 1; x++) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.22, 0.92),
      new THREE.MeshLambertMaterial({ color: 0xC4A882 })
    );
    m.position.set(x, -0.05, 0);
    m.receiveShadow = true;
    groundGroup.add(m);
  }
}
buildGround();

// ============================================================
//  背景山
// ============================================================
const mountainGroup = new THREE.Group();
scene.add(mountainGroup);

function buildMountains() {
  mountainGroup.clear();
  const sd  = SEASON_DATA[currentSeason];
  const pts = [[-22,-20,8,7],[-12,-22,6,5],[0,-24,10,9],[12,-22,7,6],[22,-20,9,7.5],[-20,20,7,5],[20,20,8,6]];
  pts.forEach(([x,z,sx,sy], i) => {
    const m = new THREE.Mesh(
      new THREE.ConeGeometry(sx * 0.6, sy, 5 + (i % 3)),
      new THREE.MeshLambertMaterial({ color: sd.mountain[i % sd.mountain.length] })
    );
    m.position.set(x, sy / 2 - 0.5, z);
    mountainGroup.add(m);
  });
}
buildMountains();

// ============================================================
//  固定裝飾（石燈籠 / 石頭）
// ============================================================
function createLantern(x, z) {
  const g   = new THREE.Group();
  const sm  = new THREE.MeshLambertMaterial({ color: 0xB8AFA8 });
  const bm  = new THREE.MeshLambertMaterial({ color: 0xD4CFC8 });
  // 底座
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.4), sm); base.position.y=0.08; base.castShadow=true; g.add(base);
  // 柱
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.18), sm); pole.position.y=0.5; pole.castShadow=true; g.add(pole);
  // 燈室
  const box  = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.38), bm); box.position.y=1.0; box.castShadow=true; g.add(box);
  // 屋頂
  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.52), sm); roof.position.y=1.2; g.add(roof);
  // 光
  const pl   = new THREE.PointLight(0xFFD080, 1.2, 3.5); pl.position.y=1.0; g.add(pl);
  g.position.set(x, 0, z);
  scene.add(g);
}
[[-5,-5],[5,-5],[-5,5],[5,5]].forEach(([x,z]) => createLantern(x, z));

[[-3,7,1],[4,-6,1.3],[-7,2,1],[6,3,0.8]].forEach(([x,z,sc]) => {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(0.4*sc, 0.25*sc, 0.35*sc),
    new THREE.MeshLambertMaterial({ color: 0xBBB0A8 })
  );
  m.position.set(x, 0.12*sc, z);
  m.rotation.y = Math.random() * Math.PI;
  m.castShadow = true;
  scene.add(m);
});

// ============================================================
//  便利屋 NPC 建築
// ============================================================
const shopGroup = new THREE.Group();

// 主體
const shopBody = new THREE.Mesh(
  new THREE.BoxGeometry(2.2, 1.8, 2.0),
  new THREE.MeshLambertMaterial({ color: 0xF5E8C8 })
);
shopBody.position.y = 0.9;
shopBody.castShadow = true;
shopGroup.add(shopBody);

// 屋頂
const shopRoof = new THREE.Mesh(
  new THREE.BoxGeometry(2.6, 0.3, 2.4),
  new THREE.MeshLambertMaterial({ color: 0xC87040 })
);
shopRoof.position.y = 1.95;
shopGroup.add(shopRoof);

// 屋簷延伸（深色）
const shopEave = new THREE.Mesh(
  new THREE.BoxGeometry(2.8, 0.08, 2.6),
  new THREE.MeshLambertMaterial({ color: 0xA05030 })
);
shopEave.position.y = 1.8;
shopGroup.add(shopEave);

// 門
const shopDoor = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 1.0, 0.06),
  new THREE.MeshLambertMaterial({ color: 0x8B6040 })
);
shopDoor.position.set(0, 0.5, 1.03);
shopGroup.add(shopDoor);

// 窗戶
const shopWin = new THREE.Mesh(
  new THREE.BoxGeometry(0.7, 0.5, 0.06),
  new THREE.MeshLambertMaterial({ color: 0xC8E8F8, transparent: true, opacity: 0.72 })
);
shopWin.position.set(-0.7, 0.9, 1.03);
shopGroup.add(shopWin);

// 招牌（紅色）
const shopSign = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 0.4, 0.06),
  new THREE.MeshLambertMaterial({ color: 0xD03020 })
);
shopSign.position.set(0, 1.65, 1.03);
shopGroup.add(shopSign);

// 招牌小裝飾
const signDeco = new THREE.Mesh(
  new THREE.BoxGeometry(0.9, 0.22, 0.08),
  new THREE.MeshLambertMaterial({ color: 0xF5C030 })
);
signDeco.position.set(0, 1.65, 1.07);
shopGroup.add(signDeco);

// 燈光
const shopLight = new THREE.PointLight(0xFFDD88, 1.0, 5.0);
shopLight.position.set(0, 2.5, 0);
shopGroup.add(shopLight);

shopGroup.position.set(9, 0, 8);
shopGroup.rotation.y = -Math.PI / 5;
scene.add(shopGroup);

// Raycaster 用 mesh 清單
const shopMeshes = [];
shopGroup.traverse(c => { if (c.isMesh) { c.userData.isShop = true; shopMeshes.push(c); } });

// ============================================================
//  粒子系統
// ============================================================
let particleSystem = null;
const PARTICLE_COUNT = 300;

function buildParticles(type) {
  if (particleSystem) { scene.remove(particleSystem); particleSystem = null; }
  const pos = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 24;
    pos[i*3+1] = Math.random() * 12 + 1;
    pos[i*3+2] = (Math.random() - 0.5) * 24;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const colors = { petal: 0xF6C6C8, snow: 0xEEF4FF, maple: 0xE85520, leaf_green: 0x88C860 };
  const mat = new THREE.PointsMaterial({
    color: colors[type] || 0xFFFFFF,
    size: type === 'snow' ? 0.15 : 0.22,
    transparent: true, opacity: type === 'snow' ? 0.85 : 0.72,
    depthWrite: false, sizeAttenuation: true,
  });
  particleSystem = new THREE.Points(geo, mat);
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
      pos[i*3]   = (Math.random() - 0.5) * 24;
      pos[i*3+1] = 12 + Math.random() * 4;
      pos[i*3+2] = (Math.random() - 0.5) * 24;
    }
  }
  particleSystem.geometry.attributes.position.needsUpdate = true;
}

// ============================================================
//  季節系統
// ============================================================
function setSeason(season) {
  currentSeason = season;
  const sd = SEASON_DATA[season];
  scene.background = new THREE.Color(sd.bg);
  scene.fog        = new THREE.Fog(sd.fog, 40, 80);
  groundTiles.forEach(t => t.material.color.setHex(sd.grass[t.userData.colorIdx % sd.grass.length]));
  buildMountains();
  ambientLight.color.setHex(sd.ambient);
  dirLight.color.setHex(sd.dir);
  buildParticles(sd.particle);
  const lbl = document.getElementById('season-label');
  if (lbl) lbl.textContent = sd.label;
  document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`btn-season-${season}`)?.classList.add('active');
  showToast(sd.label);
}
window.setSeason = setSeason;

// ============================================================
//  植物 — 視覺構建
// ============================================================
function buildPlantMesh(type) {
  const def  = seeds[type];
  const g    = new THREE.Group();
  const isB  = def.big;
  const stemH = isB ? 0.7 : 0.38;

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(isB ? 0.08 : 0.04, isB ? 0.11 : 0.06, stemH, 6),
    new THREE.MeshLambertMaterial({ color: def.stemColor })
  );
  stem.position.y = stemH / 2;
  g.add(stem);

  const r   = isB ? 0.32 : 0.22;
  const top = new THREE.Mesh(
    isB ? new THREE.BoxGeometry(r*2, r*1.5, r*2) : new THREE.SphereGeometry(r, 7, 5),
    new THREE.MeshLambertMaterial({ color: def.color })
  );
  top.position.y = stemH + r * 0.9;
  top.castShadow = true;
  top.userData.isPlantTop = true;
  g.add(top);

  g.userData.plantType = type;
  return g;
}

// ============================================================
//  植物 — 果實生成
// ============================================================
function spawnFruit(plant) {
  if (plant.fruitMesh) { plant.mesh.remove(plant.fruitMesh); plant.fruitMesh = null; }
  const def = seeds[plant.type];
  const fr  = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 6, 5),
    new THREE.MeshLambertMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.3 })
  );
  // 放在 top mesh 上方
  const topMesh = plant.mesh.children.find(c => c.userData.isPlantTop);
  const baseY   = topMesh ? topMesh.position.y + 0.2 : 0.9;
  fr.position.set((Math.random()-0.5)*0.15, baseY + 0.22, (Math.random()-0.5)*0.15);
  fr.userData.isFruit = true;
  plant.mesh.add(fr);
  plant.fruitMesh = fr;
}

// ============================================================
//  植物 — 採收
// ============================================================
function harvestPlant(plant) {
  if (!plant.hasFruit) return;
  inventory[plant.type] = (inventory[plant.type] || 0) + 1;
  plant.hasFruit   = false;
  plant.lastUpdate = Date.now();
  if (plant.fruitMesh) { plant.mesh.remove(plant.fruitMesh); plant.fruitMesh = null; }
  const def = seeds[plant.type];
  showToast(`${def.icon} ${def.name} +1 收穫！`);
  updateEconomyUI();
  // 小跳動回饋
  bounceAnim(plant.mesh);
}

// ============================================================
//  植物 — 種植
// ============================================================
function spawnPlant(x, z) {
  const key = `${x},${z}`;
  if (occupiedCells.has(key)) return;
  if ((inventorySeeds[selectedSeed] || 0) <= 0) {
    showToast('種が足りない！まずは買うか無料種を選択'); return;
  }
  occupiedCells.add(key);
  inventorySeeds[selectedSeed]--;

  const group = buildPlantMesh(selectedSeed);
  group.position.set(x, 0, z);
  group.scale.setScalar(0.25);
  // 標記所有子 mesh 以便 raycaster 識別
  group.traverse(c => { c.userData.plantKey = key; });
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
  updateEconomyUI();
  showToast(`${seeds[selectedSeed].icon} ${seeds[selectedSeed].name} 種下！`);
  animateSpawn(group);
}

// ============================================================
//  植物 — 更新 Loop（每幀呼叫）
// ============================================================
function updatePlants(now) {
  plants.forEach(p => {
    const def = seeds[p.type];
    if (!def) return;

    if (p.stage === 'growing') {
      const prog = Math.min((now - p.lastUpdate) / def.growTime, 1);
      // 從 0.25 逐漸長到 1.0
      p.mesh.scale.setScalar(0.25 + prog * 0.75);
      if (prog >= 1) {
        p.stage      = 'ready';
        p.lastUpdate = now;
        p.mesh.scale.setScalar(1.0);
      }
    } else if (p.stage === 'ready' && !p.hasFruit) {
      if (now - p.lastUpdate >= def.produceTime) {
        p.hasFruit = true;
        spawnFruit(p);
        showToast(`${def.icon} ${def.name}が実った！タップして収穫`);
      }
    }

    // 果實漂浮動畫
    if (p.fruitMesh) {
      p.fruitMesh.position.y += Math.sin(now * 0.002 + p.gridX * 0.5) * 0.0015;
      p.fruitMesh.rotation.y += 0.015;
    }
  });
}

// ============================================================
//  植物 — 刪除
// ============================================================
function removePlant(plant) {
  scene.remove(plant.mesh);
  plant.mesh.traverse(c => {
    if (!c.isMesh) return;
    c.geometry.dispose();
    (Array.isArray(c.material) ? c.material : [c.material]).forEach(m => m.dispose());
  });
  const idx = plants.indexOf(plant);
  if (idx >= 0) plants.splice(idx, 1);
  occupiedCells.delete(`${plant.gridX},${plant.gridZ}`);
  showToast('🗑️ 植物を除去');
}

// ============================================================
//  家具 — 視覺構建
// ============================================================
function buildFurnitureMesh(def) {
  const g   = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: def.color });

  if (def.id === 'chair') {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.75,0.1,0.35), mat);
    seat.position.y = 0.3; g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.75,0.4,0.06), mat);
    back.position.set(0, 0.55, -0.15); g.add(back);
    const lm = new THREE.MeshLambertMaterial({ color: 0xA07850 });
    [[-0.28,-0.1],[0.28,-0.1],[-0.28,0.1],[0.28,0.1]].forEach(([lx,lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.3,0.07),lm);
      leg.position.set(lx,0.15,lz); g.add(leg);
    });

  } else if (def.id === 'table') {
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.9,0.08,0.9), mat);
    top.position.y = 0.45; g.add(top);
    const lm = new THREE.MeshLambertMaterial({ color: 0x8B6040 });
    [[-0.35,-0.35],[0.35,-0.35],[-0.35,0.35],[0.35,0.35]].forEach(([lx,lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.45,0.08),lm);
      leg.position.set(lx,0.225,lz); g.add(leg);
    });

  } else if (def.id === 'window') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.8,1.1,0.1), mat);
    frame.position.y = 0.55; g.add(frame);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.8,0.04),
      new THREE.MeshLambertMaterial({ color:0xC8E8F8, transparent:true, opacity:0.55 }));
    glass.position.set(0,0.6,0.04); g.add(glass);
    const barM = new THREE.MeshLambertMaterial({ color: 0x8B6040 });
    const hb = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.04,0.05),barM); hb.position.set(0,0.6,0.06); g.add(hb);
    const vb = new THREE.Mesh(new THREE.BoxGeometry(0.04,0.8,0.05),barM); vb.position.set(0,0.6,0.06); g.add(vb);

  } else if (def.id === 'door') {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.7,1.4,0.1), mat);
    door.position.y = 0.7; g.add(door);
    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.12),
      new THREE.MeshLambertMaterial({ color:0xD4AA40 }));
    knob.position.set(0.25,0.7,0.1); g.add(knob);

  } else if (def.id === 'cobble') {
    for (let i = 0; i < 9; i++) {
      const s  = 0.12 + Math.random() * 0.1;
      const sm = new THREE.Mesh(new THREE.BoxGeometry(s,0.07,s),
        new THREE.MeshLambertMaterial({ color: 0xB0A898 }));
      sm.position.set((Math.random()-0.5)*0.82, 0.04, (Math.random()-0.5)*0.82);
      sm.rotation.y = Math.random() * Math.PI;
      g.add(sm);
    }

  } else if (def.id === 'pond') {
    const water = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.1,1.4),
      new THREE.MeshLambertMaterial({ color:0x5C8FB0, transparent:true, opacity:0.82 }));
    water.position.y = 0.02; g.add(water);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(1.6,0.12,1.6),
      new THREE.MeshLambertMaterial({ color: 0xB0A898 }));
    rim.position.y = -0.04; g.add(rim);
    const lily = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.03,8),
      new THREE.MeshLambertMaterial({ color: 0x78C860 }));
    lily.position.set(0.2,0.1,0.2); g.add(lily);
  }
  return g;
}

function spawnFurniture(x, z) {
  const key = `${x},${z}`;
  if (occupiedCells.has(key)) return;
  occupiedCells.add(key);
  const def   = furnitureCatalog.find(f => f.id === selectedFurnId) || furnitureCatalog[0];
  const group = buildFurnitureMesh(def);
  group.position.set(x, 0, z);
  group.scale.setScalar(0.1);
  group.castShadow = true;
  scene.add(group);
  placedObjects.push({ mesh: group, type: 'build', furnId: def.id, gridX: x, gridZ: z });
  showToast(`${def.icon} ${def.name} 配置完了`);
  animateSpawn(group);
}

function removeFurnitureAt(x, z) {
  const key = `${x},${z}`;
  const idx = placedObjects.findIndex(o => o.gridX === x && o.gridZ === z);
  if (idx < 0) return;
  const obj = placedObjects[idx];
  scene.remove(obj.mesh);
  obj.mesh.traverse(c => {
    if (!c.isMesh) return;
    c.geometry.dispose();
    (Array.isArray(c.material) ? c.material : [c.material]).forEach(m => m.dispose());
  });
  placedObjects.splice(idx, 1);
  occupiedCells.delete(key);
  showToast('🗑️ 移除完成');
}

// ============================================================
//  動物系統（升級：自動尋找熟果採收）
// ============================================================
const ANIMAL_TYPES = [
  { name:'兔', color:0xF5F0EA, sx:0.45, sy:0.45, sz:0.5  },
  { name:'狐', color:0xE8904A, sx:0.5,  sy:0.42, sz:0.55 },
  { name:'鹿', color:0xC89060, sx:0.4,  sy:0.65, sz:0.5  },
];

function createAnimal() {
  const t    = ANIMAL_TYPES[Math.floor(Math.random() * ANIMAL_TYPES.length)];
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(t.sx, t.sy, t.sz),
    new THREE.MeshLambertMaterial({ color: t.color })
  );
  const eM = new THREE.MeshLambertMaterial({ color: t.color });
  [-0.1, 0.1].forEach(ox => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.18,0.08),eM);
    ear.position.set(ox, t.sy*0.6, 0.1); body.add(ear);
  });
  const eyM = new THREE.MeshLambertMaterial({ color: 0x222222 });
  [-0.1, 0.1].forEach(ox => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,0.06),eyM);
    eye.position.set(ox, t.sy*0.15, t.sz*0.5+0.01); body.add(eye);
  });
  body.position.set((Math.random()-0.5)*14, t.sy/2, (Math.random()-0.5)*14);
  body.castShadow = true;
  scene.add(body);

  animals.push({
    mesh:           body,
    name:           t.name,
    halfH:          t.sy / 2,
    speed:          0.9 + Math.random() * 0.6,
    targetX:        (Math.random()-0.5)*14,
    targetZ:        (Math.random()-0.5)*14,
    changeTimer:    0,
    changeInterval: 3 + Math.random() * 4,
    isIdle:         false,
    idleTimer:      0,
  });
}
for (let i = 0; i < 3; i++) createAnimal();

function updateAnimals(delta, now) {
  animals.forEach(a => {
    a.changeTimer += delta;

    // 尋找最近有果實的植物
    let nearestPlant = null;
    let nearestDist  = Infinity;
    plants.forEach(p => {
      if (!p.hasFruit) return;
      const dx = p.mesh.position.x - a.mesh.position.x;
      const dz = p.mesh.position.z - a.mesh.position.z;
      const d  = Math.sqrt(dx*dx + dz*dz);
      if (d < nearestDist) { nearestDist = d; nearestPlant = p; }
    });

    // 有成熟植物且在感知範圍內
    if (nearestPlant && nearestDist < 12) {
      a.targetX = nearestPlant.mesh.position.x;
      a.targetZ = nearestPlant.mesh.position.z;
      a.isIdle  = false;
      // 夠近時自動採收
      if (nearestDist < 0.9) {
        harvestPlant(nearestPlant);
        showToast(`🐾 ${a.name}が収穫した！`);
        a.isIdle   = true;
        a.idleTimer = 2.0;
        a.changeTimer = 0;
        return;
      }
    }

    if (a.isIdle) {
      a.mesh.rotation.y += Math.sin(now * 0.003) * 0.025;
      if (a.changeTimer > a.idleTimer) { a.isIdle = false; a.changeTimer = 0; }
      return;
    }

    // 移動
    const dx   = a.targetX - a.mesh.position.x;
    const dz   = a.targetZ - a.mesh.position.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    if (dist > 0.15) {
      a.mesh.position.x += (dx/dist) * a.speed * delta;
      a.mesh.position.z += (dz/dist) * a.speed * delta;
      a.mesh.rotation.y  = Math.atan2(dx/dist, dz/dist);
      a.mesh.position.y  = a.halfH + Math.abs(Math.sin(now * 0.008)) * 0.07;
    }

    // 換目標
    if (a.changeTimer > a.changeInterval || dist < 0.15) {
      a.changeTimer    = 0;
      a.changeInterval = 3 + Math.random() * 5;
      if (Math.random() < 0.3) {
        a.isIdle = true; a.idleTimer = 1 + Math.random() * 2;
      } else {
        a.targetX = (Math.random()-0.5) * 14;
        a.targetZ = (Math.random()-0.5) * 14;
      }
    }
  });
}

// ============================================================
//  經濟系統
// ============================================================
function sellAll() {
  let total = 0;
  let sold  = false;
  for (const k in inventory) {
    if (inventory[k] > 0) {
      total       += inventory[k] * seeds[k].sell;
      inventory[k] = 0;
      sold = true;
    }
  }
  if (!sold) { showToast('倉庫が空！先に収穫しよう'); return; }
  money += total;
  updateEconomyUI();
  showToast(`💰 +${total} コイン獲得！`);
  closeAllPanels();
}
window.sellAll = sellAll;

function buySeed(type) {
  const def = seeds[type];
  if (!def || def.price <= 0) { showToast('この種は無料で入手できます'); return; }
  if (money < def.price) {
    showToast(`💸 コイン不足！(${def.price}コイン必要)`);
    return;
  }
  money -= def.price;
  inventorySeeds[type] = (inventorySeeds[type] || 0) + 1;
  updateEconomyUI();
  showToast(`${def.icon} ${def.name}の種を購入！×${inventorySeeds[type]}`);
}
window.buySeed = buySeed;

// ============================================================
//  Raycaster & Pointer
// ============================================================
const raycaster = new THREE.Raycaster();
const pointer   = new THREE.Vector2();

function getPointerNDC(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  pointer.x =  ((cx - rect.left) / rect.width)  * 2 - 1;
  pointer.y = -((cy - rect.top)  / rect.height) * 2 + 1;
}

function raycastGround() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObject(groundHitMesh);
  return hits.length > 0 ? hits[0].point : null;
}

function snapToGrid(p) {
  return { x: Math.round(p.x), z: Math.round(p.z) };
}

// ============================================================
//  Hover 預覽
// ============================================================
let previewMesh = null;

function createPreviewMesh() {
  if (previewMesh) { scene.remove(previewMesh); previewMesh = null; }
  if (currentMode === 'delete') return;
  let geo, color;
  if (currentMode === 'plant') {
    const def = seeds[selectedSeed];
    geo   = def.big ? new THREE.BoxGeometry(0.65,0.55,0.65) : new THREE.SphereGeometry(0.25,7,5);
    color = def.color;
  } else {
    const def = furnitureCatalog.find(f => f.id === selectedFurnId);
    geo   = new THREE.BoxGeometry(0.8,0.6,0.8);
    color = def ? def.color : 0xC89B6D;
  }
  previewMesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
    color, transparent: true, opacity: 0.4, depthWrite: false
  }));
  previewMesh.name = 'preview';
  scene.add(previewMesh);
}
createPreviewMesh();

// ============================================================
//  Pointer Events
// ============================================================
let isDragging = false;
let pStart     = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', e => {
  pStart.x = e.clientX; pStart.y = e.clientY; isDragging = false;
});

renderer.domElement.addEventListener('pointermove', e => {
  if (Math.hypot(e.clientX - pStart.x, e.clientY - pStart.y) > 6) isDragging = true;
  getPointerNDC(e);
  const hit = raycastGround();
  if (hit && previewMesh) {
    const s = snapToGrid(hit);
    previewMesh.position.set(s.x, currentMode === 'plant' ? 0.6 : 0.3, s.z);
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
  const shopHit = raycaster.intersectObjects(shopMeshes);
  if (shopHit.length > 0) { openShop(); return; }

  // ② 植物 mesh（採收 or 刪除）
  const allPM = [];
  plants.forEach(p => p.mesh.traverse(c => { if (c.isMesh) allPM.push(c); }));
  const pHits = raycaster.intersectObjects(allPM);
  if (pHits.length > 0) {
    const hitObj = pHits[0].object;
    let targetPlant = null;
    outer: for (const p of plants) {
      let obj = hitObj;
      while (obj) {
        if (obj === p.mesh) { targetPlant = p; break outer; }
        obj = obj.parent;
      }
    }
    if (targetPlant) {
      if (currentMode === 'delete') {
        removePlant(targetPlant);
      } else if (targetPlant.hasFruit) {
        harvestPlant(targetPlant);
      } else {
        const d = seeds[targetPlant.type];
        const msg = targetPlant.stage === 'growing' ? `${d.icon} 成長中...` : `${d.icon} もうすぐ実る...`;
        showToast(msg);
      }
      return;
    }
  }

  // ③ 地面
  const gHit = raycastGround();
  if (!gHit) return;
  const { x, z } = snapToGrid(gHit);
  if (Math.abs(x) > GRID_SIZE/2 || Math.abs(z) > GRID_SIZE/2) return;

  if (currentMode === 'plant')       spawnPlant(x, z);
  else if (currentMode === 'build')  spawnFurniture(x, z);
  else if (currentMode === 'delete') removeFurnitureAt(x, z);
});

// ============================================================
//  動畫工具
// ============================================================
function animateSpawn(group) {
  const dur = 380, t0 = performance.now();
  function tick(now) {
    const t = Math.min((now - t0) / dur, 1);
    group.scale.setScalar(easeOutBack(t));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function bounceAnim(group) {
  const orig = group.scale.x;
  const t0   = performance.now();
  function tick(now) {
    const t = Math.min((now - t0) / 300, 1);
    const s = orig * (1 + Math.sin(t * Math.PI) * 0.25);
    group.scale.setScalar(s);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function easeOutBack(t) {
  const c1=1.70158, c3=c1+1;
  return 1 + c3*Math.pow(t-1,3) + c1*Math.pow(t-1,2);
}

// ============================================================
//  全域 API（HTML onclick 用）
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
  list.innerHTML = '';
  document.getElementById('shop-panel')?.classList.add('hidden');

  if (type === 'plant') {
    title.textContent = '🌿 植物圖鑑';
    Object.entries(seeds).forEach(([id, def]) => {
      const cnt = inventorySeeds[id] || 0;
      const btn = document.createElement('button');
      btn.className = 'catalog-item' + (id === selectedSeed ? ' selected' : '');
      btn.innerHTML = `<span class="ci-icon">${def.icon}</span><span class="ci-name">${def.name}</span><span class="ci-stock">×${cnt}</span>`;
      btn.onclick = () => {
        selectedSeed = id; currentMode = 'plant'; window.setMode('plant');
        document.querySelectorAll('.catalog-item').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        createPreviewMesh();
        showToast(`${def.icon} ${def.name} 選択`);
      };
      list.appendChild(btn);
    });
  } else {
    title.textContent = '🪵 家具圖鑑';
    furnitureCatalog.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'catalog-item' + (f.id === selectedFurnId ? ' selected' : '');
      btn.innerHTML = `<span class="ci-icon">${f.icon}</span><span class="ci-name">${f.name}</span>`;
      btn.onclick = () => {
        selectedFurnId = f.id; currentMode = 'build'; window.setMode('build');
        document.querySelectorAll('.catalog-item').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        createPreviewMesh();
        showToast(`${f.icon} ${f.name} 選択`);
      };
      list.appendChild(btn);
    });
  }

  panel.classList.toggle('hidden');
};

window.closeCatalog = function() {
  document.getElementById('catalog-panel')?.classList.add('hidden');
};

function openShop() {
  const panel = document.getElementById('shop-panel');
  document.getElementById('catalog-panel')?.classList.add('hidden');
  updateShopUI();
  panel.classList.toggle('hidden');
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
  let totalPreview = 0;
  for (const k in inventory) {
    const cnt = inventory[k];
    const def = seeds[k];
    if (cnt > 0) totalPreview += cnt * def.sell;
    const row = document.createElement('div');
    row.className = 'sell-row';
    row.innerHTML = `<span>${def.icon} ${def.name}</span><span class="sell-cnt">${cnt}個</span><span class="sell-val">+${cnt*def.sell}コイン</span>`;
    sellList.appendChild(row);
  }
  const tot = document.getElementById('sell-total');
  if (tot) tot.textContent = `合計: ${totalPreview} コイン`;
}

// ============================================================
//  UI 更新
// ============================================================
function updateEconomyUI() {
  // 金錢
  const mEl = document.getElementById('money-display');
  if (mEl) mEl.textContent = money;
  // 倉庫（果實）
  for (const k in inventory) {
    const el = document.getElementById(`inv-${k}`);
    if (el) el.textContent = inventory[k];
  }
  // 種子庫存
  for (const k in inventorySeeds) {
    const el = document.getElementById(`seed-${k}`);
    if (el) el.textContent = inventorySeeds[k];
  }
  // 圖鑑內種子數量同步
  document.querySelectorAll('.ci-stock').forEach(el => {
    const btn = el.closest('.catalog-item');
    if (!btn) return;
    const id = btn.dataset.seedId;
    if (id) el.textContent = `×${inventorySeeds[id] || 0}`;
  });
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
//  Render Loop
// ============================================================
const clock = new THREE.Clock();
let previewFloatT = 0;

// 初始化場景
setSeason('spring');
updateEconomyUI();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const now   = Date.now();

  controls.update();
  updatePlants(now);
  updateAnimals(delta, now);
  updateParticles(delta);

  if (previewMesh && previewMesh.visible) {
    previewFloatT += delta * 2.5;
    previewMesh.position.y += Math.sin(previewFloatT) * 0.003;
    previewMesh.rotation.y += delta * 1.2;
  }

  renderer.render(scene, camera);
}
animate();

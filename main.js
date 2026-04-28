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
import { OBJLoader }     from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader }     from 'three/addons/loaders/MTLLoader.js';
import { OBJExporter }   from 'three/addons/exporters/OBJExporter.js';

// ============================================================
//  資料層
// ============================================================
const plantCatalog = {
  // ── D Grade (disposable — dies after first harvest) ───────────
  carrot:     { name:'胡蘿蔔', icon:'🥕', grade:'D', disposable:true,  stemColor:0x5A8840, topColor:0xFF7040, shape:'cone',    growTime:5000,  produceTime:4000,  sell:2,  price:3,  minRadius:0.6 },
  scallion:   { name:'蔥',     icon:'🌿', grade:'D', disposable:true,  stemColor:0x50A040, topColor:0x78D060, shape:'flat',    growTime:4000,  produceTime:3000,  sell:1,  price:2,  minRadius:0.5 },
  onion:      { name:'洋蔥',   icon:'🧅', grade:'D', disposable:true,  stemColor:0xD0C8A0, topColor:0xC0A040, shape:'shroom',  growTime:6000,  produceTime:4000,  sell:3,  price:4,  minRadius:0.6 },
  // ── C Grade (永續 sustainable) ────────────────────────────────
  tomato:     { name:'番茄',   icon:'🍅', grade:'C', stemColor:0x6CA850, topColor:0xFF6347, shape:'sphere', growTime:8000,  produceTime:6000,  sell:5,  minRadius:0.7 },
  strawberry: { name:'草莓',   icon:'🍓', grade:'C', stemColor:0x6CA850, topColor:0xFF4D6D, shape:'cone',   growTime:10000, produceTime:6000,  sell:8,  minRadius:0.7 },
  blueberry:  { name:'藍莓',   icon:'🫐', grade:'C', stemColor:0x6CA850, topColor:0x4F6DFF, shape:'sphere', growTime:10000, produceTime:6000,  sell:10, minRadius:0.7 },
  // ── B Grade (永續 sustainable) ────────────────────────────────
  corn:       { name:'玉米',   icon:'🌽', grade:'B', stemColor:0x70A030, topColor:0xF0D040, shape:'tall',   growTime:14000, produceTime:8000,  sell:15, price:12, minRadius:0.8 },
  sunflowerB: { name:'向日葵', icon:'🌻', grade:'B', stemColor:0x80B030, topColor:0xF0C020, shape:'tall',   growTime:16000, produceTime:9000,  sell:18, price:15, minRadius:0.8 },
  pumpkin:    { name:'南瓜',   icon:'🎃', grade:'B', stemColor:0x5A8A40, topColor:0xFFA500, shape:'big',    growTime:18000, produceTime:10000, sell:25, price:20, minRadius:1.0 },
  // ── A Grade (昂貴永續 expensive sustainable) ──────────────────
  sakura:     { name:'櫻花樹', icon:'🌸', grade:'A', stemColor:0x8B6040, topColor:0xF6C6C8, shape:'big',    growTime:22000, produceTime:12000, sell:40, price:30, minRadius:1.2 },
  pinecone:   { name:'松果',   icon:'🌲', grade:'A', stemColor:0x5A4020, topColor:0x4A7030, shape:'tall',   growTime:25000, produceTime:14000, sell:50, price:38, minRadius:1.1 },
  willow:     { name:'柳樹',   icon:'🌳', grade:'A', stemColor:0x6A5030, topColor:0x608040, shape:'drape',  growTime:28000, produceTime:16000, sell:60, price:45, minRadius:1.2 },
  // ── S Grade (稀有昂貴永續 rare expensive) ─────────────────────
  giantSakura:{ name:'巨大櫻花樹', icon:'🌸', grade:'S', stemColor:0x3A1F12, topColor:0xFF9CCF, shape:'sakura_night', growTime:40000, produceTime:20000, sell:100, price:80, minRadius:1.5 },
  giantPine:  { name:'巨大松樹',   icon:'🌲', grade:'S', stemColor:0x4A3820, topColor:0x386030, shape:'big', growTime:45000, produceTime:22000, sell:120, price:95, minRadius:1.5 },
  butterfly:  { name:'蝴蝶草',     icon:'🦋', grade:'S', stemColor:0x9060B0, topColor:0xD080E0, shape:'rose', growTime:35000, produceTime:18000, sell:90, price:70, minRadius:1.3 },
  // ── SS Grade (極稀有昂貴永續 ultra rare) ─────────────────────
  demonFruit: { name:'惡魔果實',icon:'🔴', grade:'SS', stemColor:0x802040, topColor:0xFF2060, shape:'crystal', growTime:60000, produceTime:30000, sell:250, price:180, minRadius:1.6 },
  moonLotus:  { name:'月蓮',   icon:'🪷', grade:'SS', stemColor:0x6080C0, topColor:0xC0D8FF, shape:'lotus',   growTime:55000, produceTime:28000, sell:200, price:150, minRadius:1.4 },
  hemp:       { name:'大麻樹', icon:'🌿', grade:'SS', stemColor:0x507030, topColor:0x78C050, shape:'tall',    growTime:65000, produceTime:35000, sell:300, price:220, minRadius:1.6 },
};

const furnitureCatalog = [
  { id:'chair',  name:'椅子',   icon:'🪑', color:0xC89B6D },
  { id:'table',  name:'桌子',   icon:'🪵', color:0xA97C50 },
  { id:'window', name:'窗戶',   icon:'🪟', color:0xA8C8E8 },
  { id:'door',   name:'門',     icon:'🚪', color:0x8B6040 },
  { id:'cobble', name:'石子路', icon:'🪨', color:0xB0A898 },
  { id:'pond',   name:'池塘',   icon:'💧', color:0x5C8FB0 },
  { id:'japanese_house', name:'和風小屋', icon:'🏯', color:0xC87060 },
  { id:'tea_house',      name:'茶室',    icon:'🍵', color:0xB03020 },
  { id:'jump_ramp',   name:'小跳台',  icon:'🎿', color:0xE8F0FF },
  { id:'big_jump',    name:'大跳台',  icon:'🏔️', color:0xD0E8FF },
  { id:'chairlift',   name:'纜車椅', icon:'🚡', color:0xC0C8D8 },
  { id:'snow_cannon', name:'造雪機', icon:'💨', color:0x8090A8 },
  { id:'frozen_tree', name:'冰結樹', icon:'🧊', color:0xE0F0FF },
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

const inventory      = Object.fromEntries(Object.keys(plantCatalog).map(k=>[k,0]));
const inventorySeeds = Object.fromEntries(Object.keys(plantCatalog).map(k=>[k,
  (plantCatalog[k].grade==='D' || plantCatalog[k].grade==='C') ? 999 : (plantCatalog[k].price>0 ? 0 : 999)
]));

const SNOW_ZONE_Z = -8;  // tiles with worldZ < this become permanent snow

const plants        = [];   // plant data objects
const placedObjects = [];   // furniture
const occupiedCells = new Set();
const groundTiles   = [];   // refs for season recolor
const animals       = [];

// ============================================================
//  ═══ 地基層 ═══  OBJ 模型載入系統 (MagicaVoxel → Three.js)
// ============================================================
const MODEL_PATH  = './models/';
const modelCache  = {};            // { id: THREE.Group } — preloaded meshes
let   modelsReady = false;

// 所有可被 .obj 取代的模型 ID 清單
const ALL_MODEL_IDS = [
  // 植物
  ...Object.keys(plantCatalog),
  // 家具
  ...furnitureCatalog.map(f => f.id),
  // 動物
  'animal_lv1','animal_lv2','animal_lv3','animal_lv4',
];

/**
 * 嘗試載入單一 .obj（帶 .mtl 材質）
 * 成功 → 存入 modelCache[id]
 * 失敗 → 靜默跳過（fallback 回程式碼版本）
 */
async function tryLoadModel(id) {
  try {
    const mtlPath = MODEL_PATH + id + '.mtl';
    const objPath = MODEL_PATH + id + '.obj';

    // 先確認檔案存在（避免 404 噪音）
    const check = await fetch(objPath, { method: 'HEAD' }).catch(() => null);
    if (!check || !check.ok) return;

    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(MODEL_PATH);

    let materials = null;
    try {
      materials = await mtlLoader.loadAsync(id + '.mtl');
      materials.preload();
    } catch (_) { /* .mtl 不存在也沒關係 */ }

    const objLoader = new OBJLoader();
    if (materials) objLoader.setMaterials(materials);

    const obj = await objLoader.loadAsync(objPath);

    // 自動置中 + 縮放到合理尺寸
    const box  = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // 將模型底部對齊 Y=0，水平居中
    obj.position.sub(center);
    obj.position.y += size.y / 2;

    // 縮放：讓最大維度 = 1.0 遊戲單位
    const maxDim    = Math.max(size.x, size.y, size.z);
    const normScale = 1.0 / maxDim;
    obj.scale.setScalar(normScale);

    // 啟用陰影
    obj.traverse(c => {
      if (c.isMesh) {
        c.castShadow    = true;
        c.receiveShadow = true;
      }
    });

    // 包成 Group 方便後續操作
    const wrapper = new THREE.Group();
    wrapper.add(obj);
    modelCache[id] = wrapper;
    console.log(`[NiX] Loaded custom model: ${id}`);
  } catch (_) {
    // 靜默失敗 — 使用程式碼 fallback
  }
}

/**
 * 啟動時掃描所有可能的 .obj，載入存在的
 */
async function preloadAllModels() {
  await Promise.all(ALL_MODEL_IDS.map(id => tryLoadModel(id)));
  modelsReady = true;
  const loaded = Object.keys(modelCache);
  if (loaded.length > 0) {
    console.log(`[NiX] Custom models loaded: ${loaded.join(', ')}`);
  }
}

/**
 * 取得自訂模型的 clone（如果存在）
 * @returns {THREE.Group|null}
 */
function getCustomModel(id) {
  if (!modelCache[id]) return null;
  const clone = modelCache[id].clone(true);
  // 深拷貝材質（避免共用材質互相干擾）
  clone.traverse(c => {
    if (c.isMesh && c.material) {
      c.material = Array.isArray(c.material)
        ? c.material.map(m => m.clone())
        : c.material.clone();
    }
  });
  return clone;
}

// 啟動預載（非阻塞）
preloadAllModels();

// ── Per-voxel colour variation helper (±5% brightness noise) ──
function varyColor(hex, pct = 0.05) {
  const f = 1 + (Math.random() * 2 - 1) * pct;
  const r = Math.min(255, Math.round(((hex >> 16) & 0xFF) * f));
  const g = Math.min(255, Math.round(((hex >>  8) & 0xFF) * f));
  const b = Math.min(255, Math.round(( hex        & 0xFF) * f));
  return new THREE.MeshLambertMaterial({ color: (r<<16)|(g<<8)|b });
}

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
  const half     = GRID_SIZE / 2;
  const snowPal  = SEASON_CFG.winter.grass;
  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      const worldZ   = z * CELL_SIZE + CELL_SIZE / 2;
      const isSnow   = worldZ < SNOW_ZONE_Z;
      const palette  = isSnow ? snowPal : GRASS_COLORS;
      const yOffset  = (Math.random() - 0.5) * 0.1;
      const height   = 0.2 + Math.random() * 0.08;
      const colorIdx = Math.floor(Math.random() * palette.length);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_SIZE, height, CELL_SIZE),
        new THREE.MeshLambertMaterial({ color: palette[colorIdx] })
      );
      mesh.position.set(
        x * CELL_SIZE + CELL_SIZE / 2,
        yOffset - height / 2,
        worldZ
      );
      mesh.receiveShadow = true;
      mesh.name = 'ground_tile';
      mesh.userData.colorIdx = colorIdx;
      mesh.userData.isSnow   = isSnow;
      groundGroup.add(mesh);
      groundTiles.push(mesh);
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
    if (!def) return;
    color = def.topColor;
    const r = (def.minRadius ?? 0.7) * 0.55;
    geo   = def.shape === 'big'    ? new THREE.SphereGeometry(r*1.2, 7, 5)
          : def.shape === 'sphere' ? new THREE.SphereGeometry(r, 7, 5)
          : def.shape === 'cone'   ? new THREE.ConeGeometry(r*0.8, r*2, 6)
          : def.shape === 'tall'   ? new THREE.CylinderGeometry(r*0.5, r*0.6, r*2.5, 6)
          :                          new THREE.SphereGeometry(r, 7, 5);
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
  // ── 優先使用 MagicaVoxel 自訂模型 ──
  const custom = getCustomModel(type);
  if (custom) {
    // 標記頂部以供果實定位
    let topY = 0;
    custom.traverse(c => { if (c.isMesh) topY = Math.max(topY, c.position.y); });
    const marker = new THREE.Object3D();
    marker.position.y = topY + 0.3;
    marker.userData.isPlantTop = true;
    custom.add(marker);
    return custom;
  }

  // ── Fallback: 程式碼生成 ──
  const def = plantCatalog[type];
  const g   = new THREE.Group();

  const jh = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  };

  const isBig = ['big','drape','rose','lotus','crystal'].includes(def.shape);
  const stemH = isBig ? 0.70 : 0.38;

  // Stem (shared by all shapes)
  jh(
    new THREE.CylinderGeometry(isBig?0.08:0.04, isBig?0.11:0.06, stemH, 6),
    varyColor(def.stemColor, 0.05),
    0, stemH/2, 0
  );

  switch (def.shape) {
    case 'sphere': {
      const top = jh(new THREE.SphereGeometry(0.22,7,5), varyColor(def.topColor), 0, stemH+0.22, 0);
      top.userData.isPlantTop = true;
      jh(new THREE.SphereGeometry(0.13,6,4), varyColor(def.topColor), 0.14, stemH+0.30, 0.08);
      jh(new THREE.SphereGeometry(0.11,6,4), varyColor(def.topColor), -0.12, stemH+0.28, -0.06);
      break;
    }
    case 'cone': {
      const top = jh(new THREE.ConeGeometry(0.28,0.6,6), varyColor(def.topColor), 0, stemH+0.40, 0);
      top.userData.isPlantTop = true;
      jh(new THREE.SphereGeometry(0.08,5,4), varyColor(def.topColor), 0.18, stemH+0.14, 0.10);
      jh(new THREE.SphereGeometry(0.07,5,4), varyColor(def.topColor), -0.16, stemH+0.12, 0.08);
      break;
    }
    case 'big': {
      const top = jh(new THREE.SphereGeometry(0.5,8,6), varyColor(def.topColor), 0, stemH+0.40, 0);
      top.userData.isPlantTop = true;
      jh(new THREE.SphereGeometry(0.32,7,5), varyColor(def.topColor), 0.28, stemH+0.52, 0.18);
      jh(new THREE.SphereGeometry(0.28,7,5), varyColor(def.topColor), -0.24, stemH+0.48, -0.16);
      jh(new THREE.BoxGeometry(0.22,0.05,0.16), varyColor(def.stemColor), 0.36, stemH+0.10, -0.14);
      jh(new THREE.BoxGeometry(0.22,0.05,0.16), varyColor(def.stemColor), -0.32, stemH+0.10, 0.16);
      jh(new THREE.BoxGeometry(0.22,0.05,0.16), varyColor(def.stemColor), 0.10, stemH+0.10, 0.38);
      break;
    }
    case 'flat': {
      const top = jh(new THREE.CylinderGeometry(0.28,0.28,0.06,8), varyColor(def.topColor), 0, stemH+0.05, 0);
      top.userData.isPlantTop = true;
      jh(new THREE.SphereGeometry(0.12,6,4), varyColor(def.topColor),  0.18, stemH+0.08,  0.16);
      jh(new THREE.SphereGeometry(0.12,6,4), varyColor(def.topColor), -0.18, stemH+0.08,  0.16);
      jh(new THREE.SphereGeometry(0.12,6,4), varyColor(def.topColor),  0.00, stemH+0.08, -0.20);
      break;
    }
    case 'shroom': {
      const top = jh(new THREE.CylinderGeometry(0.32,0.18,0.22,8), varyColor(def.topColor), 0, stemH+0.22, 0);
      top.userData.isPlantTop = true;
      jh(new THREE.BoxGeometry(0.06,0.04,0.06), varyColor(0xF8F4F0), 0.12, stemH+0.38, 0.08);
      jh(new THREE.BoxGeometry(0.06,0.04,0.06), varyColor(0xF8F4F0), -0.10, stemH+0.38, 0.14);
      jh(new THREE.BoxGeometry(0.06,0.04,0.06), varyColor(0xF8F4F0), 0.02, stemH+0.38, -0.12);
      break;
    }
    case 'tall': {
      jh(
        new THREE.CylinderGeometry(0.05,0.07,0.45,6),
        varyColor(def.stemColor), 0, stemH+0.225, 0
      );
      const top = jh(new THREE.CylinderGeometry(0.24,0.24,0.32,8), varyColor(def.topColor), 0, stemH+0.61, 0);
      top.userData.isPlantTop = true;
      jh(new THREE.BoxGeometry(0.28,0.06,0.10), varyColor(def.stemColor),  0.22, 0.30, 0.06);
      jh(new THREE.BoxGeometry(0.28,0.06,0.10), varyColor(def.stemColor), -0.22, 0.50, 0.06);
      break;
    }
    case 'drape': {
      const top = jh(new THREE.SphereGeometry(0.40,7,5), varyColor(def.topColor), 0, stemH+0.36, 0);
      top.userData.isPlantTop = true;
      jh(new THREE.BoxGeometry(0.10,0.18,0.08), varyColor(def.topColor),  0.14, stemH+0.16, 0.10);
      jh(new THREE.BoxGeometry(0.10,0.18,0.08), varyColor(def.topColor), -0.12, stemH+0.11, 0.06);
      jh(new THREE.BoxGeometry(0.10,0.18,0.08), varyColor(def.topColor),  0.06, stemH+0.06, -0.12);
      break;
    }
    case 'rose': {
      const top = jh(new THREE.SphereGeometry(0.26,7,5), varyColor(def.topColor), 0, stemH+0.32, 0);
      top.userData.isPlantTop = true;
      const angles = [0, 72, 144, 216, 288].map(d => d * Math.PI / 180);
      angles.forEach(a =>
        jh(new THREE.BoxGeometry(0.14,0.10,0.08), varyColor(def.topColor),
           Math.cos(a)*0.22, stemH+0.28, Math.sin(a)*0.22)
      );
      break;
    }
    case 'lotus': {
      const top = jh(new THREE.CylinderGeometry(0.36,0.36,0.08,10), varyColor(def.topColor), 0, stemH+0.06, 0);
      top.userData.isPlantTop = true;
      for (let i=0; i<8; i++) {
        const a = i * Math.PI / 4;
        jh(new THREE.BoxGeometry(0.16,0.10,0.10), varyColor(def.topColor),
           Math.cos(a)*0.38, stemH+0.08, Math.sin(a)*0.38);
      }
      const center = jh(new THREE.SphereGeometry(0.12,6,5), new THREE.MeshLambertMaterial({
        color:0xFFFFCC, emissive:new THREE.Color(0xAAAA40), emissiveIntensity:0.4
      }), 0, stemH+0.18, 0);
      break;
    }
    case 'crystal': {
      const top = jh(new THREE.ConeGeometry(0.22,0.50,6), varyColor(def.topColor), 0, stemH+0.30, 0);
      top.userData.isPlantTop = true;
      top.material.transparent = true; top.material.opacity = 0.88;
      jh(new THREE.ConeGeometry(0.12,0.30,5), varyColor(def.topColor),  0.18, stemH+0.12, 0.10);
      jh(new THREE.ConeGeometry(0.10,0.26,5), varyColor(def.topColor), -0.16, stemH+0.10, -0.08);
      break;
    }
    case 'sakura_night': {
      // ═══ VOXEL_SCENE: 夜景發光櫻花樹 ═══
      // palette: wood 3-tone #3A1F12/#5A2E1B/#7A4A2A
      //          leaf 3-tone #FF9CCF/#FFB6E0/#FFD1EC
      //          emissive   #FF80D5 (1.8) / #FFC2F0 (2.8)
      const wD = new THREE.MeshLambertMaterial({ color: 0x3A1F12 });
      const wM = new THREE.MeshLambertMaterial({ color: 0x5A2E1B });
      const wL = new THREE.MeshLambertMaterial({ color: 0x7A4A2A });
      const lB = new THREE.MeshLambertMaterial({ color: 0xFF9CCF });
      const lM = new THREE.MeshLambertMaterial({ color: 0xFFB6E0 });
      const lL = new THREE.MeshLambertMaterial({ color: 0xFFD1EC });
      const eP = new THREE.MeshLambertMaterial({ color: 0xFF80D5, emissive: new THREE.Color(0xFF80D5), emissiveIntensity: 0.60 });
      const eC = new THREE.MeshLambertMaterial({ color: 0xFFC2F0, emissive: new THREE.Color(0xFFC2F0), emissiveIntensity: 0.85 });

      // ── Trunk: base_radius 4V, height 28V, taper 0.65 ──
      const V = 0.05;
      const trunkH = 28 * V;
      // Main trunk (tapered cylinder)
      jh(new THREE.CylinderGeometry(4*V*0.65, 4*V, trunkH, 8), wM, 0, trunkH/2, 0);
      // Bark noise strips (SKILL D edge breakup)
      jh(new THREE.BoxGeometry(V*1.5, trunkH*0.7, V*1.2), wD, V*3.8, trunkH*0.4, V*0.5);
      jh(new THREE.BoxGeometry(V*1.2, trunkH*0.6, V*1.0), wL, -V*3.5, trunkH*0.45, -V*1.0);
      jh(new THREE.BoxGeometry(V*1.0, trunkH*0.5, V*1.5), wD, V*0.5, trunkH*0.35, V*3.6);

      // ── Roots: 6 spreading roots ──
      const rootSpread = 10 * V;
      for (let ri = 0; ri < 6; ri++) {
        const ra = (ri / 6) * Math.PI * 2 + Math.random() * 0.3;
        const rx = Math.cos(ra) * rootSpread * (0.6 + Math.random()*0.4);
        const rz = Math.sin(ra) * rootSpread * (0.6 + Math.random()*0.4);
        jh(new THREE.BoxGeometry(V*2.5, V*2.0, V*2.0), [wD,wM,wL][ri%3],
           rx*0.5, V*1.0, rz*0.5);
        jh(new THREE.BoxGeometry(V*1.5, V*1.2, V*1.5), wD, rx*0.8, V*0.5, rz*0.8);
      }

      // ── Branches: 12 branches, length 10-18V ──
      for (let bi = 0; bi < 12; bi++) {
        const ba  = (bi / 12) * Math.PI * 2 + Math.random() * 0.35;
        const bLen = (10 + Math.random() * 8) * V;
        const bThk = (1 + Math.random() * 2) * V;
        const bUp  = 0.6 + Math.random() * 0.3;
        const bx = Math.cos(ba) * bLen * 0.5;
        const bz = Math.sin(ba) * bLen * 0.5;
        const by = trunkH * (0.55 + Math.random()*0.35) + bLen * bUp * 0.3;
        jh(new THREE.BoxGeometry(bThk, bLen*0.15, bThk), [wM,wL,wD][bi%3],
           bx, by, bz);
      }

      // ── Canopy: sphere_cluster, radius 16-20V, density 0.85 ──
      const canopyY = trunkH + 4*V;
      const canopyR = 18 * V;  // avg of 16-20

      // Layer 1: leaf_base (65%) — main foliage mass
      for (let ci = 0; ci < 18; ci++) {
        const ca = Math.random() * Math.PI * 2;
        const cr = canopyR * (0.3 + Math.random()*0.7);
        const cx = Math.cos(ca) * cr;
        const cz = Math.sin(ca) * cr;
        const cy = canopyY + (Math.random()-0.3) * canopyR * 0.8;
        const cs = V * (3 + Math.random()*4);
        jh(new THREE.SphereGeometry(cs, 6, 5), lB, cx, cy, cz);
      }

      // Layer 2: leaf_light (20%) — highlight clusters
      for (let ci = 0; ci < 6; ci++) {
        const ca = Math.random() * Math.PI * 2;
        const cr = canopyR * (0.4 + Math.random()*0.5);
        const cx = Math.cos(ca) * cr;
        const cz = Math.sin(ca) * cr;
        const cy = canopyY + (Math.random()-0.2) * canopyR * 0.6;
        const cs = V * (2.5 + Math.random()*3);
        jh(new THREE.SphereGeometry(cs, 6, 4), lL, cx, cy, cz);
      }

      // Layer 3: emissive_pink (15%) — glowing leaf clusters
      for (let ci = 0; ci < 5; ci++) {
        const ca = Math.random() * Math.PI * 2;
        const cr = canopyR * (0.3 + Math.random()*0.6);
        const cx = Math.cos(ca) * cr;
        const cz = Math.sin(ca) * cr;
        const cy = canopyY + (Math.random()-0.3) * canopyR * 0.5;
        const cs = V * (2 + Math.random()*3);
        jh(new THREE.SphereGeometry(cs, 6, 4), eP, cx, cy, cz);
      }

      // ── Core glow: emissive_core, radius 6V ──
      const core = jh(new THREE.SphereGeometry(6*V, 7, 6), eC, 0, canopyY, 0);

      // ── Top marker ──
      const top = jh(new THREE.SphereGeometry(V*2, 5, 4), lM, 0, canopyY + canopyR*0.5, 0);
      top.userData.isPlantTop = true;

      // ── Point light for glow effect ──
      const glow = new THREE.PointLight(0xFF80D5, 1.5, 5.0);
      glow.position.set(0, canopyY, 0);
      g.add(glow);

      break;
    }
    default: {
      const top = jh(new THREE.SphereGeometry(0.22,7,5), varyColor(def.topColor), 0, stemH+0.22, 0);
      top.userData.isPlantTop = true;
    }
  }
  return g;
}

// ============================================================
//  ═══ 二樓 ═══  植物：種植
// ============================================================
function spawnPlant(worldX, worldZ) {
  const def = plantCatalog[selectedSeed];
  if (!def) return;
  if ((inventorySeeds[selectedSeed]||0) <= 0) {
    showToast('種が足りない！便利屋で買おう 🌱'); return;
  }

  // Radius-based overlap (free placement — no grid snap)
  const radius = def.minRadius ?? 0.7;
  const tooClose = plants.some(p => {
    const dx = p.mesh.position.x - worldX;
    const dz = p.mesh.position.z - worldZ;
    return Math.sqrt(dx*dx + dz*dz) < radius;
  });
  if (tooClose) { showToast('近すぎる！少し離して 🌿'); return; }

  inventorySeeds[selectedSeed]--;

  // Giant growth roll (10%)
  const isGiant = Math.random() < 0.10;

  const group = buildPlantGroup(selectedSeed);
  group.position.set(worldX, 0, worldZ);
  group.scale.setScalar(0.15);
  scene.add(group);

  plants.push({
    mesh:       group,
    fruitMesh:  null,
    type:       selectedSeed,
    stage:      'growing',
    hasFruit:   false,
    lastUpdate: Date.now(),
    gridX:      worldX,
    gridZ:      worldZ,
    isGiant:    isGiant,
    disposable: def.disposable || false,
  });
  updateUI();
  const sizeLabel = isGiant ? ' ✨ ジャイアント！' : '';
  showToast(`${def.icon} ${def.name} を植えた！${sizeLabel}`);
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
      const maxScale = p.isGiant ? 2.5 : 1.0;
      p.mesh.scale.setScalar(0.15 + prog * (maxScale - 0.15));
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

  // D-grade disposable: remove after first harvest
  if (pData.disposable) {
    setTimeout(() => {
      const idx = plants.indexOf(pData);
      if (idx >= 0) {
        scene.remove(pData.mesh);
        pData.mesh.traverse(c => {
          if (!c.isMesh) return;
          c.geometry.dispose();
          (Array.isArray(c.material)?c.material:[c.material]).forEach(m=>m.dispose());
        });
        plants.splice(idx, 1);
        updateUI();
        showToast(`${def.icon} 一年生植物が枯れた 🍂`);
      }
    }, 800);
  }
}

// ============================================================
//  ═══ 一樓 ═══  家具：視覺構建
// ============================================================
function buildFurnitureMesh(id) {
  // ── 優先使用 MagicaVoxel 自訂模型 ──
  const custom = getCustomModel(id);
  if (custom) return custom;

  // ── Fallback: 程式碼生成 ──
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
    // ═══════════════════════════════════════════════════════════════════
    //  NiX Garden — VOXEL SKILL SYSTEM  (shared by all catalog models)
    // ═══════════════════════════════════════════════════════════════════
    //  SKILL A — STRUCTURAL DEPTH
    //    walls ≥ 2V thick | roofs = 3 layers min | floors ≥ 2 layers
    //    NO flat surfaces allowed
    //
    //  SKILL B — LAYERED ARCHITECTURE
    //    Each building layer: core mass → roof base (+2V) → roof stack
    //    (3 layers: top light / mid base / bottom dark) → edge lip (+1V)
    //    → underside beams (1V lines)
    //    Upper levels: inset 1V, scale ≈ 0.85, 1V air gap between tiers
    //
    //  SKILL C — COLOR DEPTH
    //    Each material = 3 tones: top→light / vertical→mid / bottom→dark
    //    Add ~10% noise variation via alternating mat selection
    //
    //  SKILL D — EDGE BREAKUP
    //    Every 3–5V: offset ±1 OR color variation OR small protrusion
    //    Avoid perfect straight edges
    //
    //  SKILL E — ORGANIC TREE SYSTEM
    //    Trunk: upward + random lean offset
    //    Branches: recursive depth 2–3, outward+upward bias
    //    Foliage: sphere base r=2–4V, remove 30% voxels randomly
    //             mix 3 pink tones | add floating+ground petals
    //    NO perfect spheres allowed
    //
    //  SKILL F — SURFACE DETAIL
    //    No empty area > 4×4V: color variation OR object OR height variation
    //
    //  SKILL G — GROUND SYSTEM
    //    Grass: 3 green tones random | Stone: irregular, 2–3 gray tones
    //    Water: depth gradient (light edge → dark center)
    //
    //  FINAL RULE: Structure clarity > decoration > performance
    // ═══════════════════════════════════════════════════════════════════
    // ═══ 五重塔 v3.1 — SKILL A/B/C/D/E/F/G compliant ═══
    // size = BASE_W * 0.85^i | 3-layer roof (dark/base/light) | corbels | air gaps
    // Color: 3-5 shades per material + 5~10% noise | no flat surfaces | no perfect symmetry

    const V      = 0.22;        // 1 voxel unit
    const BASE_W = 2.50;
    const WALL_H = V * 4;       // 4 voxels tall

    // Walls: 3 reds (dark / mid / light)
    const rA = new THREE.MeshLambertMaterial({ color: 0xBE3020 });
    const rB = new THREE.MeshLambertMaterial({ color: 0x962018 });
    const rC = new THREE.MeshLambertMaterial({ color: 0xD44035 });
    // Roofs: 3-layer teal (dark bottom / base mid / light top)
    const tDk = new THREE.MeshLambertMaterial({ color: 0x145040 });
    const tMd = new THREE.MeshLambertMaterial({ color: 0x1E6852 });
    const tLt = new THREE.MeshLambertMaterial({ color: 0x2C7C65 });
    // Stones: 3 shades
    const sA = new THREE.MeshLambertMaterial({ color: 0xC8BEB0 });
    const sB = new THREE.MeshLambertMaterial({ color: 0xB0A898 });
    const sC = new THREE.MeshLambertMaterial({ color: 0xDAD4C8 });
    // Pinks: 4 shades (light / mid / saturated / near-white) — 40/40/20 rule
    const pkA = new THREE.MeshLambertMaterial({ color: 0xFCD8E4 });  // light 40%
    const pkB = new THREE.MeshLambertMaterial({ color: 0xF0A8C0 });  // mid   40%
    const pkC = new THREE.MeshLambertMaterial({ color: 0xE280A0 });  // sat   20%
    const pkW = new THREE.MeshLambertMaterial({ color: 0xFAF2F5 });  // white
    // Browns: 3 shades
    const brM = new THREE.MeshLambertMaterial({ color: 0x8B6040 });
    const brD = new THREE.MeshLambertMaterial({ color: 0x644828 });
    const brL = new THREE.MeshLambertMaterial({ color: 0xA07848 });
    // Greens: 3 shades
    const grA = new THREE.MeshLambertMaterial({ color: 0x6AA040 });
    const grB = new THREE.MeshLambertMaterial({ color: 0x52882E });
    const grC = new THREE.MeshLambertMaterial({ color: 0x88B84C });
    // Flowers: yellow / white / pink
    const flY = new THREE.MeshLambertMaterial({ color: 0xF0D050 });
    const flW = new THREE.MeshLambertMaterial({ color: 0xF8F4F0 });
    const flP = new THREE.MeshLambertMaterial({ color: 0xF0A0B8 });
    // Gold + white
    const goM = new THREE.MeshLambertMaterial({ color: 0xD4AA30, emissive: 0xA88010, emissiveIntensity: 0.30 });
    const whM = new THREE.MeshLambertMaterial({ color: 0xF8F0E0 });
    // Water: shallow edge / deep center
    const wSh = new THREE.MeshLambertMaterial({ color: 0x72AACC, transparent: true, opacity: 0.80 });
    const wDp = new THREE.MeshLambertMaterial({ color: 0x3A6898, transparent: true, opacity: 0.88 });
    // Lantern glow
    const lnM = new THREE.MeshLambertMaterial({ color: 0xF5D060, emissive: 0xFFAA00, emissiveIntensity: 0.45 });

    const jh = (geo, mat, x, y, z) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m);
    };

    // ─── Platform ─────────────────────────────────────────────
    jh(new THREE.BoxGeometry(5.5,  0.24, 5.5),  sA, 0, 0.12,  0);   // base
    jh(new THREE.BoxGeometry(5.5,  0.06, 5.5),  sC, 0, 0.27,  0);   // top highlight
    jh(new THREE.BoxGeometry(3.6,  0.24, 3.6),  sB, 0, 0.36,  0);   // inner plinth
    jh(new THREE.BoxGeometry(3.6,  0.04, 3.6),  sC, 0, 0.52,  0);   // plinth edge
    jh(new THREE.BoxGeometry(1.9,  0.12, 0.32), sB, 0, 0.36,  1.84); // steps
    jh(new THREE.BoxGeometry(1.6,  0.12, 0.32), sA, 0, 0.48,  1.54);

    // ─── 5-Tier Pagoda  (size rule: fw = BASE_W × 0.85^i) ─────
    const wallMats = [rA, rB, rA, rC, rB];  // color noise via alternation

    let cY = 0.56;
    for (let i = 0; i < 5; i++) {
      const fw  = BASE_W * Math.pow(0.85, i);   // ← RULE: 0.85^i
      const hw  = fw / 2;
      const wM  = wallMats[i];
      const rY  = cY + WALL_H;                  // roof base Y

      // Body (wall) — solid, NOT hollow
      jh(new THREE.BoxGeometry(fw, WALL_H, fw), wM, 0, cY + WALL_H/2, 0);
      // Front face highlight (color noise, lighter strip)
      jh(new THREE.BoxGeometry(fw*0.62, WALL_H*0.46, 0.030), rC, 0, cY+WALL_H*0.55, hw+0.012);
      // Side shadow strips (dark edges)
      jh(new THREE.BoxGeometry(0.022, WALL_H*0.72, fw), rB,  hw-0.011, cY+WALL_H*0.5, 0);
      jh(new THREE.BoxGeometry(0.022, WALL_H*0.72, fw), rB, -hw+0.011, cY+WALL_H*0.5, 0);

      // ── 3-Layer Roof: bottom DARK → mid BASE → top LIGHT ────
      // Layer 1: lip droop (widest, thinnest, lowest — DARK)
      jh(new THREE.BoxGeometry(fw+V*5.2, V*0.34, fw+V*5.2), tDk, 0, rY-V*0.22, 0);
      // Layer 2: main dark slab (expand by 4V each side)
      jh(new THREE.BoxGeometry(fw+V*4.0, V*1.0,  fw+V*4.0), tDk, 0, rY+V*0.5,  0);
      // Layer 3: mid base slab (inset 0.6V — BASE tone)
      jh(new THREE.BoxGeometry(fw+V*2.8, V*0.85, fw+V*2.8), (i%2===0 ? tMd : tDk), 0, rY+V*1.35, 0);
      // Layer 4: light top slab (inset 1.2V — LIGHT tone)
      jh(new THREE.BoxGeometry(fw+V*1.6, V*0.65, fw+V*1.6), tLt, 0, rY+V*2.0,  0);
      // Cap accent strip
      jh(new THREE.BoxGeometry(fw+V*0.8, V*0.14, fw+V*0.8), tLt, 0, rY+V*2.52, 0);

      // Gold corner ornaments (4 corners, slightly asymmetric offset)
      const ech = (fw + V*4.0)/2 - V*0.08;
      [[ech,ech],[ech,-ech-V*0.1],[-ech-V*0.05,ech],[-ech,-(ech+V*0.08)]].forEach(([cx,cz]) => {
        jh(new THREE.BoxGeometry(V*0.46, V*0.72, V*0.46), goM, cx, rY+V*0.30, cz);
      });

      // ── Under-roof corbels (斗栱) — lower 3 tiers, every 2-3V ─
      if (i < 3) {
        const sp = V * 2.6;
        const ch = V * 0.82;
        for (let bx = -hw + sp*0.5; bx < hw + sp*0.1; bx += sp) {
          jh(new THREE.BoxGeometry(V*0.40, ch, V*0.30), brM, bx, rY-V*0.60,  hw+V*0.56);
          jh(new THREE.BoxGeometry(V*0.40, ch, V*0.30), brM, bx, rY-V*0.60, -hw-V*0.56);
        }
        for (let bz = -hw + sp*0.5; bz < hw + sp*0.1; bz += sp) {
          jh(new THREE.BoxGeometry(V*0.30, ch, V*0.40), brM,  hw+V*0.56, rY-V*0.60, bz);
          jh(new THREE.BoxGeometry(V*0.30, ch, V*0.40), brM, -hw-V*0.56, rY-V*0.60, bz);
        }
      }

      // Air gap: 1 voxel between roof top and next floor (shadow separation)
      cY = rY + V*2.66 + V;
    }

    // ─── Tier-1: Columns / Door / Round Windows ───────────────
    const t1hw = BASE_W / 2;  // = 1.25
    [-t1hw*0.74, t1hw*0.74].forEach(cx => {
      jh(new THREE.BoxGeometry(V*0.50, WALL_H, V*0.50), rC, cx,  0.56+WALL_H/2,  t1hw+0.014);
      jh(new THREE.BoxGeometry(V*0.50, WALL_H, V*0.50), rC, cx,  0.56+WALL_H/2, -t1hw-0.014);
    });
    jh(new THREE.BoxGeometry(V*2.8, WALL_H*0.58, V*0.32), whM, 0, 0.56+WALL_H*0.50, t1hw+0.016);
    jh(new THREE.BoxGeometry(V*2.7, V*0.20, V*0.36), rB, 0, 0.56+V*0.90, t1hw+0.018);
    jh(new THREE.BoxGeometry(V*2.7, V*0.20, V*0.36), rB, 0, 0.56+V*2.20, t1hw+0.018);
    jh(new THREE.BoxGeometry(V*0.20, WALL_H*0.58, V*0.36), rB, 0, 0.56+WALL_H*0.50, t1hw+0.018);
    [-t1hw-0.006, t1hw+0.006].forEach(wx => {
      const wd = new THREE.Mesh(new THREE.CylinderGeometry(V*0.82, V*0.82, V*0.40, 10), whM);
      wd.rotation.z = Math.PI/2; wd.position.set(wx, 0.56+V*2.5, 0); g.add(wd);
    });

    // ─── Sorin (相輪) ──────────────────────────────────────────
    const sY = cY;
    jh(new THREE.BoxGeometry(V*2.4, V*2.2, V*2.4), sB, 0, sY+V*1.1,  0);  // pedestal
    jh(new THREE.BoxGeometry(V*1.6, V*1.8, V*1.6), sA, 0, sY+V*3.2,  0);  // taper
    const jhRod = new THREE.Mesh(
      new THREE.CylinderGeometry(V*0.18, V*0.32, V*7.2, 6), goM);
    jhRod.position.set(0, sY+V*7.5, 0); jhRod.castShadow = true; g.add(jhRod);
    [1.30, 2.40, 3.40, 4.30, 5.10].forEach(dy => {         // 5 rings
      jh(new THREE.CylinderGeometry(V*0.46, V*0.46, V*0.26, 8), goM, 0, sY+V*4.0+V*dy, 0);
    });
    jh(new THREE.SphereGeometry(V*0.46, 8, 6),  goM, 0, sY+V*11.0, 0);  // orb
    jh(new THREE.ConeGeometry(V*0.30, V*0.95, 6), goM, 0, sY+V*11.7, 0); // flame

    // ─── Torii Gate ────────────────────────────────────────────
    jh(new THREE.BoxGeometry(V*0.46, V*7.0, V*0.46), rA, -V*4.9, V*3.5,  2.44);
    jh(new THREE.BoxGeometry(V*0.46, V*7.0, V*0.46), rA,  V*4.9, V*3.5,  2.44);
    jh(new THREE.BoxGeometry(V*11.0, V*0.46, V*0.46), rA, 0, V*6.9, 2.44);
    jh(new THREE.BoxGeometry(V*10.0, V*0.36, V*0.46), rB, 0, V*6.1, 2.44);
    jh(new THREE.BoxGeometry(V*4.0,  V*0.80, V*0.36), goM, 0, V*6.4, 2.46);

    // ─── Stone Lanterns (4) ────────────────────────────────────
    [[-1.52,1.92],[1.52,1.92],[-2.20,-0.10],[2.20,-0.10]].forEach(([lx,lz]) => {
      jh(new THREE.BoxGeometry(V*1.10, V*0.46, V*1.10), sB,  lx, V*0.23, lz);
      jh(new THREE.BoxGeometry(V*0.55, V*2.40, V*0.55), sA,  lx, V*1.66, lz);
      jh(new THREE.BoxGeometry(V*1.50, V*1.00, V*1.50), lnM, lx, V*3.16, lz);
      jh(new THREE.BoxGeometry(V*1.80, V*0.40, V*1.80), sB,  lx, V*3.82, lz);
    });

    // ─── Water Pond: 2-depth (shallow edge + deep center) ─────
    jh(new THREE.BoxGeometry(2.05,  V*0.68, 1.22),  sA,  -1.58, V*0.34, 2.08);  // rim
    jh(new THREE.BoxGeometry(1.74,  V*0.48, 0.96),  wSh, -1.58, V*0.54, 2.08);  // shallow
    jh(new THREE.BoxGeometry(1.18,  V*0.36, 0.62),  wDp, -1.58, V*0.49, 2.08);  // deep center
    [[-1.40,2.02,grA],[-1.72,2.16,grB],[-1.54,2.40,grC]].forEach(([px,pz,gm]) => {
      jh(new THREE.CylinderGeometry(V*0.60, V*0.60, V*0.14, 8), gm, px, V*0.72, pz);
    });
    // Red wooden bridge
    jh(new THREE.BoxGeometry(V*2.5, V*0.32, 1.22), rB, -1.58, V*1.16, 2.08);
    [-0.54,-0.10,0.35].forEach(dz => {
      jh(new THREE.BoxGeometry(V*2.5, V*1.30, V*0.22), rA, -1.58, V*1.70, 2.08+dz);
    });
    jh(new THREE.BoxGeometry(V*2.5, V*0.22, 1.22), rC, -1.58, V*2.46, 2.08);

    // ─── Cherry Blossom Trees — 30% removed sphere clusters ───
    // Define 13 offsets; keep 9-10 (= 30% removed) per tree
    const blmSph = [
      [0,0,0],[0.32,0,0],[-0.30,0,0],[0,0.30,0],[0,0,0.30],
      [0,-0.22,0],[0,0,-0.28],[0.22,0.20,0.14],[-0.20,0.22,-0.14],
      [0.14,0.18,-0.24],[-0.18,0.16,0.22],[0.24,-0.16,0.18],[-0.22,-0.14,-0.20]
    ];
    const PINKS = [pkA, pkB, pkC, pkW];

    [[-2.12,-1.70],[-2.10,0.88],[2.20,-1.52],[2.20,0.68]].forEach(([tx,tz], ti) => {
      const tBrM = [brM, brD, brM, brD][ti];
      // Trunk (slight lean via ti-based offset)
      jh(new THREE.CylinderGeometry(V*0.45, V*0.68, V*7.0, 6), tBrM, tx, V*3.5, tz);
      // 4 branches (brL = light brown for tips)
      [[-0.22,1.10,0.10],[0.20,1.14,-0.10],[-0.10,1.18,-0.22],[0.14,1.08,0.18]].forEach(([bx,by,bz]) => {
        jh(new THREE.CylinderGeometry(V*0.26, V*0.36, V*3.0, 5), brL, tx+bx, by, tz+bz);
      });
      // Blossom crown: 9+(ti%2) of 13 spheres → ~30% removed
      // Sizes vary (0.17~0.29), colors: 40% pkA / 40% pkB / 20% pkC+pkW
      blmSph.slice(0, 9 + ti%2).forEach(([bx,by,bz], bi) => {
        jh(new THREE.SphereGeometry(0.17+(bi%4)*0.03, 6, 5), PINKS[bi%4], tx+bx, 1.62+by, tz+bz);
      });
      // Falling petals (floating in air, sparse)
      [[0.38,1.22,0.12],[0.85,0.82,-0.15],[1.22,1.05,0.24],[1.68,0.62,-0.08]].forEach(([pd,py,pz], pi) => {
        const sign = ti < 2 ? -1 : 1;
        jh(new THREE.BoxGeometry(V*0.32, V*0.10, V*0.24), PINKS[pi%4], tx+sign*pd, py, tz+pz);
      });
      // Ground petals (scattered in radius around base)
      [0.30, 0.62, 0.95, 1.28].forEach((r, ri) => {
        const ang = r * 2.4 + ti;
        jh(new THREE.BoxGeometry(V*0.32, V*0.08, V*0.24), PINKS[ri%4],
           tx + r*Math.cos(ang), 0.26, tz + r*Math.sin(ang));
      });
    });

    // ─── Ground Flowers (3% per tile ≈ 12 flowers) ────────────
    [[1.22,2.32,flY],[-1.02,2.12,flW],[2.02,0.42,flP],[-2.12,1.02,flY],
     [0.82,-1.82,flW],[1.82,-1.22,flP],[-1.52,-1.62,flY],[-0.62,-2.22,flW],
     [2.32,-0.62,flY],[-2.32,0.02,flP],[0.02,2.62,flW],[1.52,1.52,flP]
    ].forEach(([fx,fz,fm]) => {
      jh(new THREE.BoxGeometry(V*0.36, V*0.46, V*0.36), fm, fx, V*1.36, fz);  // petal
      jh(new THREE.BoxGeometry(V*0.16, V*0.82, V*0.16), grB, fx, V*0.58, fz); // stem
    });

    // ─── Ground: 3-color grass noise (random per tile) ────────
    [[-2.35,1.30,grA],[-2.45,-0.20,grB],[2.18,1.60,grC],[2.30,-0.70,grA],
     [-1.08,-2.10,grB],[1.28,-2.20,grC],[0,-2.48,grA],[-2.05,-1.55,grC],
     [2.10,-1.82,grB],[1.70,2.10,grA],[-1.60,2.00,grB],[0.50,-2.52,grC],
     [-0.50,2.62,grA],[2.52,0.80,grC],[-2.52,0.60,grB]
    ].forEach(([gx,gz,gm]) => {
      jh(new THREE.BoxGeometry(V*1.6+Math.random()*V*1.2, V*0.28, V*1.4+Math.random()*V),
         gm, gx, V*0.24, gz);
    });

    // Stone path: irregular shapes, 3 gray tones
    [[-0.58,2.12,sA],[0,2.24,sB],[0.58,2.12,sC],[-0.30,2.46,sA],[0.30,2.46,sB]].forEach(([px,pz,sm]) => {
      jh(new THREE.BoxGeometry(V*1.4, V*0.28, V*1.2), sm, px, V*0.22, pz);
    });

    // Scatter rocks (3 stone shades, slight height variation)
    [[-2.55,0.52,sA],[2.46,0.10,sB],[-0.50,-2.36,sC],[0.92,-2.42,sA],
     [-1.90,-1.88,sB],[1.84,-1.72,sC],[-2.58,-1.22,sA],[2.50,-1.40,sB]
    ].forEach(([rx,rz,rm]) => {
      jh(new THREE.BoxGeometry(V*0.82, V*0.46, V*0.62), rm, rx, V*0.24, rz);
    });

    // Petals on first eave top (Tier-1 roof)
    const epY = 0.56 + WALL_H + V*2.52;
    [[-1.62,epY,-0.98],[1.64,epY,-0.80],[-1.24,epY,1.38],
     [1.42,epY,1.20],[0.52,epY,1.90],[-0.62,epY,1.94]
    ].forEach(([px,py,pz], pi) => {
      jh(new THREE.BoxGeometry(V*0.32, V*0.10, V*0.24), PINKS[pi%4], px, py, pz);
    });

  } else if (id === 'tea_house') {
    // ═══ 日式茶室 v1.0 — Full SKILL A/B/C/D/E/F/G ═══
    // Open-front tea house diorama with deck / bamboo / cherry blossoms / pond
    // All materials use 3-tone depth (top light / mid / bottom dark)

    const V = 0.22;  // 1 voxel unit

    // ── PALETTE: 3 tones per material (SKILL C) ─────────────────
    // Red wood walls
    const rwD = new THREE.MeshLambertMaterial({ color: 0x821808 });
    const rwM = new THREE.MeshLambertMaterial({ color: 0xA82818 });
    const rwL = new THREE.MeshLambertMaterial({ color: 0xC44030 });
    // Roof browns: bottom dark → mid → top light
    const rfD = new THREE.MeshLambertMaterial({ color: 0x5A3818 });
    const rfM = new THREE.MeshLambertMaterial({ color: 0x8A5C2A });
    const rfL = new THREE.MeshLambertMaterial({ color: 0xB88040 });
    // Wooden floor: 3 tones
    const wfD = new THREE.MeshLambertMaterial({ color: 0x6A3C18 });
    const wfM = new THREE.MeshLambertMaterial({ color: 0x8E5C30 });
    const wfL = new THREE.MeshLambertMaterial({ color: 0xB08050 });
    // Tatami: 2-tone green variation (SKILL C)
    const ttA = new THREE.MeshLambertMaterial({ color: 0x8AB870 });
    const ttB = new THREE.MeshLambertMaterial({ color: 0x6A9850 });
    // Stone: 3 gray tones (SKILL G)
    const stA = new THREE.MeshLambertMaterial({ color: 0xD0C8BE });
    const stB = new THREE.MeshLambertMaterial({ color: 0xB0A898 });
    const stC = new THREE.MeshLambertMaterial({ color: 0x908880 });
    // Water: shallow edge / deep center (SKILL G depth gradient)
    const wSh = new THREE.MeshLambertMaterial({ color: 0x80BBCC, transparent: true, opacity: 0.80 });
    const wDp = new THREE.MeshLambertMaterial({ color: 0x3A6898, transparent: true, opacity: 0.90 });
    // Cherry pinks: 4 tones 40/40/20/white (SKILL E)
    const pkL = new THREE.MeshLambertMaterial({ color: 0xFCD8E4 });
    const pkM = new THREE.MeshLambertMaterial({ color: 0xF0A8C0 });
    const pkS = new THREE.MeshLambertMaterial({ color: 0xE280A0 });
    const pkW = new THREE.MeshLambertMaterial({ color: 0xFAF2F5 });
    const TPINKS = [pkL, pkM, pkS, pkW];
    // Tree browns: 3 tones
    const trD = new THREE.MeshLambertMaterial({ color: 0x5A3010 });
    const trM = new THREE.MeshLambertMaterial({ color: 0x7A5030 });
    const trL = new THREE.MeshLambertMaterial({ color: 0xA07040 });
    // Grass: 3 green tones (SKILL G)
    const grA = new THREE.MeshLambertMaterial({ color: 0x7AB860 });
    const grB = new THREE.MeshLambertMaterial({ color: 0x5E9E48 });
    const grC = new THREE.MeshLambertMaterial({ color: 0x90C870 });
    // Interior
    const tbM = new THREE.MeshLambertMaterial({ color: 0x3C2008 });
    const csA = new THREE.MeshLambertMaterial({ color: 0x7080B8 });
    const csB = new THREE.MeshLambertMaterial({ color: 0xB08858 });
    const csC = new THREE.MeshLambertMaterial({ color: 0x906890 });
    const teaK = new THREE.MeshLambertMaterial({ color: 0x303030 });
    const cupM = new THREE.MeshLambertMaterial({ color: 0x68A888 });
    const whM = new THREE.MeshLambertMaterial({ color: 0xF0EDE8 });
    const lnM = new THREE.MeshLambertMaterial({ color: 0xF5D060, emissive: 0xFFAA00, emissiveIntensity: 0.42 });
    // Bamboo
    const bmA = new THREE.MeshLambertMaterial({ color: 0x70A840 });
    const bmB = new THREE.MeshLambertMaterial({ color: 0x5A9030 });
    const bmN = new THREE.MeshLambertMaterial({ color: 0x9EC858 });

    const jh = (geo, mat, x, y, z) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true; m.receiveShadow = true; g.add(m);
    };

    // ── SKILL A: PLATFORM — floor ≥ 2 layers ─────────────────────
    jh(new THREE.BoxGeometry(5.8, V*0.9, 5.8), stC, 0, V*0.45, 0);   // base dark
    jh(new THREE.BoxGeometry(5.8, V*0.28, 5.8), stA, 0, V*1.04, 0);  // top highlight
    jh(new THREE.BoxGeometry(4.2, V*0.28, 5.8), stB, 0, V*1.32, 0);  // plinth edge noise

    // Raised wood floor: 2 layers (SKILL A)
    jh(new THREE.BoxGeometry(3.8, V*1.2, 3.0), wfD, 0, V*1.8, -0.4);  // bottom dark
    jh(new THREE.BoxGeometry(3.8, V*0.5, 3.0), wfM, 0, V*2.7, -0.4);  // top mid
    // Floor edge lip +1V (SKILL B)
    jh(new THREE.BoxGeometry(4.0, V*0.4, 3.2), wfD, 0, V*1.4, -0.4);

    // Tatami inset (lower 1V, 2 alternating tones — SKILL C noise)
    jh(new THREE.BoxGeometry(1.65, V*0.4, 2.7), ttA, -0.48, V*3.0, -0.4);
    jh(new THREE.BoxGeometry(1.65, V*0.4, 2.7), ttB,  0.55, V*3.0, -0.4);
    // Tatami border strip (color noise — SKILL D)
    jh(new THREE.BoxGeometry(3.3, V*0.2, V*0.5), wfM, 0, V*3.1, -0.4);

    // ── SKILL A: WALLS ≥ 2V thick ────────────────────────────────
    // Back wall: outer + inner face (2V depth)
    jh(new THREE.BoxGeometry(3.8, V*9, V*2.0), rwM, 0, V*7.1, -1.9);  // body mid
    jh(new THREE.BoxGeometry(3.8, V*0.6, V*2.0), rwL, 0, V*11.2, -1.9); // top light
    jh(new THREE.BoxGeometry(3.8, V*0.4, V*2.0), rwD, 0, V*3.1, -1.9);  // base dark
    // SKILL D: vertical beam accents every ~3V
    [-1.4, -0.45, 0.45, 1.4].forEach(bx => {
      jh(new THREE.BoxGeometry(V*0.7, V*9, V*2.0), rwD, bx, V*7.1, -1.9);
    });

    // Left wall: 2V thick
    jh(new THREE.BoxGeometry(V*2.0, V*9, 3.0), rwM, -2.1, V*7.1, -0.4);
    jh(new THREE.BoxGeometry(V*2.0, V*0.6, 3.0), rwL, -2.1, V*11.2, -0.4);
    jh(new THREE.BoxGeometry(V*2.0, V*0.4, 3.0), rwD, -2.1, V*3.1, -0.4);
    [-1.1, 0.1, 1.3].forEach(bz => {
      jh(new THREE.BoxGeometry(V*2.0, V*9, V*0.7), rwD, -2.1, V*7.1, bz);
    });

    // Right wall: 2V thick
    jh(new THREE.BoxGeometry(V*2.0, V*9, 3.0), rwM, 2.1, V*7.1, -0.4);
    jh(new THREE.BoxGeometry(V*2.0, V*0.6, 3.0), rwL, 2.1, V*11.2, -0.4);
    jh(new THREE.BoxGeometry(V*2.0, V*0.4, 3.0), rwD, 2.1, V*3.1, -0.4);
    [-1.1, 0.1, 1.3].forEach(bz => {
      jh(new THREE.BoxGeometry(V*2.0, V*9, V*0.7), rwD, 2.1, V*7.1, bz);
    });

    // Open front: corner posts only (no full wall — tea house open design)
    jh(new THREE.BoxGeometry(V*1.8, V*9, V*1.8), rwM, -1.8, V*7.1, 1.4);
    jh(new THREE.BoxGeometry(V*1.8, V*9, V*1.8), rwM,  1.8, V*7.1, 1.4);
    // Lintel beam across open front
    jh(new THREE.BoxGeometry(3.8, V*0.6, V*1.4), rwD, 0, V*11.0, 1.4);

    // ── ROUND WINDOW on right wall (voxel circle approx) ─────────
    const rwX = 2.1 * V + 0.04;
    // Outer ring (8 positions around center)
    [[0,0.55],[0,-0.55],[0.55,0],[-0.55,0],[0.38,0.38],[0.38,-0.38],[-0.38,0.38],[-0.38,-0.38]].forEach(([dy,dz]) => {
      jh(new THREE.BoxGeometry(V*0.3, V*0.55, V*0.55), rwL, rwX, V*7.5+dy*0.6, -0.6+dz*0.6);
    });
    // Glass center
    jh(new THREE.BoxGeometry(V*0.3, V*1.3, V*1.3), whM, rwX, V*7.5, -0.6);

    // ── SLIDING DOORS (open front, white grid — SKILL F fill) ────
    // Panel left (slightly inset from open edge)
    jh(new THREE.BoxGeometry(1.3, V*7.5, V*0.45), whM, -0.65, V*6.5, 1.32);
    [V*2.5, V*4.5, V*6.5].forEach(gy => {
      jh(new THREE.BoxGeometry(1.3, V*0.20, V*0.48), rwD, -0.65, V*3+gy, 1.32);
    });
    [-0.32, 0, 0.32].forEach(gx => {
      jh(new THREE.BoxGeometry(V*0.20, V*7.5, V*0.48), rwD, -0.65+gx, V*6.5, 1.32);
    });
    // Panel right (slightly ajar — SKILL D offset ±1)
    jh(new THREE.BoxGeometry(1.1, V*7.5, V*0.45), whM, 1.0, V*6.5, 1.36);
    [V*2.5, V*4.5, V*6.5].forEach(gy => {
      jh(new THREE.BoxGeometry(1.1, V*0.20, V*0.48), rwD, 1.0, V*3+gy, 1.36);
    });
    [0.3, 0.65].forEach(gx => {
      jh(new THREE.BoxGeometry(V*0.20, V*7.5, V*0.48), rwD, 0.5+gx, V*6.5, 1.36);
    });

    // ── SKILL B: ROOF — 3 layers + edge lip + underside beams ────
    const roofY = V*11.5;
    const rW    = 3.8 + V*4.0;   // base wall + outset +2V each side
    const rD    = 3.0 + V*4.0;

    // Underside beams (SKILL B: 1V thick lines)
    for (let bx = -1.7; bx <= 1.7; bx += 0.65) {
      jh(new THREE.BoxGeometry(V*0.5, V*0.5, rD + V*1.6), rfD, bx, roofY - V*0.7, -0.4);
    }
    for (let bz = -1.6; bz <= 1.6; bz += 0.7) {
      jh(new THREE.BoxGeometry(rW + V*1.6, V*0.5, V*0.5), rfD, 0, roofY - V*0.7, bz - 0.4);
    }
    // Layer 1 (bottom DARK): drooping lip — widest, thinnest
    jh(new THREE.BoxGeometry(rW + V*2.6, V*0.55, rD + V*2.6), rfD, 0, roofY - V*0.9, -0.4);
    // Edge lip +1V outward (SKILL B)
    jh(new THREE.BoxGeometry(rW + V*0.6, V*0.22, rD + V*0.6), rfM, 0, roofY - V*0.2, -0.4);
    // Layer 2 (main slab DARK): +4V outset
    jh(new THREE.BoxGeometry(rW, V*1.5, rD), rfD, 0, roofY + V*0.75, -0.4);
    // Layer 3 (mid MID): inset 1.2V
    jh(new THREE.BoxGeometry(rW - V*2.4, V*1.1, rD - V*2.4), rfM, 0, roofY + V*2.1, -0.4);
    // Layer 4 (top LIGHT): inset 2.4V
    jh(new THREE.BoxGeometry(rW - V*4.8, V*0.80, rD - V*4.8), rfL, 0, roofY + V*3.0, -0.4);
    // Roof ridge (slightly raised — SKILL D protrusion)
    jh(new THREE.BoxGeometry(rW - V*6.5, V*0.90, V*0.9), rfL, 0, roofY + V*3.7, -0.4);
    // SKILL D: corner offsets ±1 for edge breakup
    const rHW = (rW + V*2.6) / 2;
    const rHD = (rD + V*2.6) / 2;
    [[-rHW, -rHD-0.4], [rHW, -rHD-0.4], [-rHW, rHD-0.4], [rHW+V*0.3, rHD-0.4]].forEach(([cx,cz]) => {
      jh(new THREE.BoxGeometry(V*0.9, V*0.7, V*0.9), rfD, cx, roofY - V*0.5, cz);
    });

    // ── LANTERNS hang from roof corners (SKILL F surface detail) ─
    [[-1.7, 1.4], [1.7, 1.4], [-1.7, -1.7], [1.7, -1.7]].forEach(([lx, lz], li) => {
      jh(new THREE.BoxGeometry(V*0.15, V*1.8, V*0.15), wfD, lx, roofY - V*2.8, lz - 0.4);
      jh(new THREE.BoxGeometry(V*1.0, V*1.5, V*1.0), lnM, lx, roofY - V*4.2, lz - 0.4);
      jh(new THREE.BoxGeometry(V*1.3, V*0.35, V*1.3), rfD, lx, roofY - V*3.4, lz - 0.4);
      jh(new THREE.BoxGeometry(V*0.5, V*0.45, V*0.5), rfD, lx, roofY - V*5.0, lz - 0.4);
      const pl = new THREE.PointLight(0xFFCC66, 0.65, 3.2);
      pl.position.set(lx, roofY - V*4.2, lz - 0.4);
      g.add(pl);
    });

    // ── INTERIOR (SKILL F: no empty >4×4) ─────────────────────────
    // Low table (center)
    jh(new THREE.BoxGeometry(1.0, V*0.55, 0.70), tbM, -0.1, V*4.0, -0.4);
    [[-0.38,-0.26],[0.38,-0.26],[-0.38,0.26],[0.38,0.26]].forEach(([tx,tz]) => {
      jh(new THREE.BoxGeometry(V*0.5, V*1.6, V*0.5), tbM, tx, V*2.45, tz - 0.4);
    });
    // Cushions x3 (color variation — SKILL C)
    jh(new THREE.BoxGeometry(0.52, V*0.90, 0.42), csA, -0.58, V*3.45, 0.25);
    jh(new THREE.BoxGeometry(0.52, V*0.90, 0.42), csB,  0.52, V*3.45, 0.25);
    jh(new THREE.BoxGeometry(0.52, V*0.90, 0.42), csC, -0.04, V*3.45, -0.9);
    // Tea set (clustered voxels — SKILL F micro detail)
    jh(new THREE.BoxGeometry(V*1.0, V*1.5, V*1.0), teaK,  0.08, V*4.75, -0.38);  // pot
    jh(new THREE.SphereGeometry(V*0.48, 6, 5), teaK, 0.08, V*5.8, -0.38);         // lid
    jh(new THREE.BoxGeometry(V*0.60, V*0.80, V*0.60), cupM, -0.28, V*4.55, -0.28); // cup A
    jh(new THREE.BoxGeometry(V*0.60, V*0.80, V*0.60), cupM,  0.42, V*4.55, -0.22); // cup B (offset — SKILL D)
    jh(new THREE.BoxGeometry(V*0.30, V*0.28, V*0.50), wfL,  0.08, V*4.30, -0.55); // tray

    // ── EXTERIOR DECK front-right (SKILL A: 2-layer floor) ───────
    jh(new THREE.BoxGeometry(1.9, V*1.2, 1.5), wfD, 1.55, V*1.8, 2.05);
    jh(new THREE.BoxGeometry(1.9, V*0.4, 1.5), wfL, 1.55, V*2.65, 2.05);
    // Deck railing posts spacing 2V (SKILL B: post grid)
    [0.68, 1.10, 1.52, 1.95, 2.38].forEach(px => {
      jh(new THREE.BoxGeometry(V*0.6, V*3.8, V*0.6), rwD, px, V*2.8, 2.75);
    });
    jh(new THREE.BoxGeometry(1.92, V*0.38, V*0.5), rwM, 1.55, V*6.0, 2.75);  // top rail
    [0.65, 2.45].forEach(px => {
      jh(new THREE.BoxGeometry(V*0.6, V*3.8, V*0.6), rwD, px, V*2.8, 1.38);
    });
    jh(new THREE.BoxGeometry(V*0.45, V*3.8, 1.5), rwM, 0.65, V*2.8, 2.05);

    // ── STAIRS 3 steps × 2V deep (SKILL A: depth = 2V) ───────────
    jh(new THREE.BoxGeometry(1.9, V*0.65, V*2), stB, 1.55, V*1.1, 3.12);
    jh(new THREE.BoxGeometry(1.9, V*0.65, V*2), stA, 1.55, V*1.75, 3.55);
    jh(new THREE.BoxGeometry(1.9, V*0.65, V*2), stC, 1.55, V*2.40, 3.98);

    // ── BAMBOO CLUSTER (left side — SKILL D height variation) ─────
    [-2.45, -2.60, -2.35, -2.52, -2.68].forEach((bx, i) => {
      const bh  = 2.6 + i * 0.38 + (i % 2) * 0.15;
      const bz  = 1.9 + (i % 3) * 0.20 - 0.12;
      const bmt = i % 2 === 0 ? bmA : bmB;
      jh(new THREE.CylinderGeometry(V*0.30, V*0.36, bh, 5), bmt, bx, bh/2, bz);
      // Node rings every ~0.65V (SKILL D protrusions)
      for (let ny = 0.45; ny < bh - 0.28; ny += 0.60 + (i%3)*0.10) {
        jh(new THREE.CylinderGeometry(V*0.38, V*0.38, V*0.32, 5), bmN, bx, ny, bz);
      }
      // Leaves (SKILL D variation)
      jh(new THREE.BoxGeometry(V*1.5, V*0.20, V*0.40), grC, bx+0.28, bh-0.18, bz);
      jh(new THREE.BoxGeometry(V*1.1, V*0.20, V*0.38), grA, bx-0.22, bh-0.42, bz+0.08);
    });

    // ── CHERRY BLOSSOM TREES — SKILL E (2 trees left+right) ─────
    [[-2.55, -1.9], [2.55, -1.9]].forEach(([tx, tz], ti) => {
      const lean = ti === 0 ? 0.10 : -0.10;
      // Trunk grows upward with slight lean offset (SKILL E)
      jh(new THREE.CylinderGeometry(V*0.52, V*0.78, V*8.5, 6), trM, tx, V*4.25, tz);
      jh(new THREE.CylinderGeometry(V*0.36, V*0.52, V*3.5, 6), trM, tx+lean*0.6, V*9.5, tz);

      // Primary branches: outward + upward bias, depth 1 (SKILL E)
      const b1 = [[0.38,1.22,0.12],[-0.32,1.18,-0.14],[0.12,1.28,0.42],
                  [-0.16,1.14,-0.38],[0.28,1.32,-0.28],[-0.30,1.20,0.30]];
      b1.forEach(([bx,by,bz]) => {
        jh(new THREE.CylinderGeometry(V*0.24, V*0.34, V*3.4, 5), trL, tx+bx, by, tz+bz);
        // Sub-branches: depth 2 (SKILL E recursive)
        jh(new THREE.CylinderGeometry(V*0.14, V*0.24, V*2.0, 5), trL, tx+bx*1.5, by+0.38, tz+bz*1.4);
      });

      // Foliage: 13 pos → 9+ti used (~30% removed), sizes 0.18–0.32 (SKILL E)
      const fs = [
        [0,0,0],[0.40,0.10,0],[-0.38,0.12,0],[0.10,0.38,0],[0.02,0.10,0.40],
        [0,-0.26,0],[0.06,0,-0.36],[0.30,0.24,0.20],[-0.28,0.24,-0.20],
        [0.20,0.22,-0.30],[-0.24,0.20,0.28],[0.32,-0.20,0.24],[-0.24,-0.18,-0.22]
      ];
      fs.slice(0, 9 + ti).forEach(([bx,by,bz], bi) => {
        const r = 0.20 + (bi % 4) * 0.03;
        jh(new THREE.SphereGeometry(r, 6, 5), TPINKS[bi % 4], tx+bx, 1.85+by, tz+bz);
      });

      // Floating petals (SKILL E)
      [[0.55,1.20,0.18],[0.95,0.78,-0.22],[1.28,1.08,0.32],[-0.65,0.92,0.38]].forEach(([pd,py,pz],pi) => {
        const sg = ti === 0 ? 1 : -1;
        jh(new THREE.BoxGeometry(V*0.36, V*0.10, V*0.26), TPINKS[pi%4], tx+sg*pd, py, tz+pz);
      });

      // Ground petals scattered (SKILL E)
      [0.32, 0.62, 0.98, 1.35].forEach((r,ri) => {
        const ang = r * 2.2 + ti * 1.6;
        jh(new THREE.BoxGeometry(V*0.36, V*0.08, V*0.26), TPINKS[ri%4],
           tx + r*Math.cos(ang), V*1.4, tz + r*Math.sin(ang));
      });

      // Petals on roof eave (SKILL E scatter)
      [[-0.85,0.95],[0.65,1.18],[1.55,0.78],[-1.38,0.62]].forEach(([px,pz],pi) => {
        jh(new THREE.BoxGeometry(V*0.36, V*0.10, V*0.26), TPINKS[pi%4],
           tx*0.25 + px*0.5, roofY + V*0.85, pz - 0.4);
      });
    });

    // ── WATER POND (SKILL G: depth gradient, uneven border) ───────
    // Front center, irregular stone border
    jh(new THREE.BoxGeometry(2.30, V*1.00, 1.65), stC, -0.45, V*0.50, 2.52);  // stone rim
    jh(new THREE.BoxGeometry(2.08, V*0.65, 1.45), wSh, -0.45, V*0.82, 2.52);  // shallow edge
    jh(new THREE.BoxGeometry(1.38, V*0.42, 0.95), wDp, -0.45, V*0.78, 2.52);  // deep center
    // Uneven border stones (SKILL G irregular)
    [[0.65,2.22,stA],[0.28,3.08,stB],[-0.85,2.12,stC],
     [-1.28,2.72,stA],[0.18,2.98,stB],[-1.55,2.30,stC]].forEach(([px,pz,sm]) => {
      jh(new THREE.BoxGeometry(V*1.3, V*0.55, V*1.1), sm, px, V*0.52, pz);
    });
    // Lily pad + small stone
    jh(new THREE.CylinderGeometry(V*0.70, V*0.70, V*0.14, 8), grA, -0.45, V*1.05, 2.52);
    jh(new THREE.BoxGeometry(V*0.90, V*0.50, V*0.72), stB, -1.35, V*0.55, 2.42);

    // ── GROUND — SKILL G (3 green tones random patches) ──────────
    [[-1.8,3.5,grA],[0.3,3.7,grB],[2.1,3.1,grC],
     [-2.6,1.6,grB],[2.5,1.3,grA],[-2.7,-0.5,grC],
     [2.6,-1.2,grB],[-2.5,-1.9,grA],[1.3,-2.6,grC],
     [-1.1,-2.7,grB],[0.1,-2.9,grA],[2.1,-2.4,grC]
    ].forEach(([gx,gz,gm]) => {
      jh(new THREE.BoxGeometry(V*1.9+Math.random()*V*1.1, V*0.30, V*1.6+Math.random()*V*0.9), gm, gx, V*0.26, gz);
    });

    // Stone path (SKILL G irregular, 3 tones)
    [[-0.5,2.85,stA],[0.1,3.22,stB],[0.65,2.78,stC],
     [-0.2,3.58,stA],[0.35,3.92,stB]].forEach(([px,pz,sm]) => {
      jh(new THREE.BoxGeometry(V*1.6, V*0.30, V*1.3), sm, px, V*0.22, pz);
    });

    // Scatter rocks (SKILL G: irregular 3 tones, height variation)
    [[-2.65,0.62,stA],[2.55,0.28,stB],[-0.85,-2.52,stC],
     [1.05,-2.62,stA],[-2.18,-2.08,stB],[1.96,-2.10,stC]].forEach(([rx,rz,rm]) => {
      jh(new THREE.BoxGeometry(V*1.0, V*0.52, V*0.80), rm, rx, V*0.26, rz);
    });

    // SKILL F: no empty >4×4 — corner moss tufts + detail voxels
    [[1.85,-2.05,grA],[-1.85,-2.25,grB],[2.28,-0.82,grC],[-2.28,-0.52,grA]].forEach(([fx,fz,fm]) => {
      jh(new THREE.BoxGeometry(V*0.95, V*0.62, V*0.95), fm, fx, V*0.52, fz);
      jh(new THREE.BoxGeometry(V*0.50, V*1.20, V*0.50), grB, fx, V*0.95, fz);
    });

  } else if (id === 'jump_ramp') {
    const V = 0.22;
    const snA = new THREE.MeshLambertMaterial({ color: 0xEFF5FF });
    const snB = new THREE.MeshLambertMaterial({ color: 0xD8E8F8 });
    const snC = new THREE.MeshLambertMaterial({ color: 0xC0D4EC });
    const mtA = new THREE.MeshLambertMaterial({ color: 0x8090A8 });
    const mtB = new THREE.MeshLambertMaterial({ color: 0x607090 });
    const mtC = new THREE.MeshLambertMaterial({ color: 0x4A5870 });
    const jh = (geo, mat, x, y, z) => { const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; g.add(m); };

    // Base platform (2 layers)
    jh(new THREE.BoxGeometry(2.2, V*1.5, 1.2), snC, 0, V*0.75, 0);
    jh(new THREE.BoxGeometry(2.2, V*0.4, 1.2), snA, 0, V*1.70, 0);
    // Angled ramp body
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(2.0, V*0.5, 1.0), snB);
    ramp.rotation.x = -Math.PI * 0.18;
    ramp.position.set(0, V*3.5, -0.25);
    ramp.castShadow = true; g.add(ramp);
    const ramp2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, V*0.3, 1.0), snA);
    ramp2.rotation.x = -Math.PI * 0.18;
    ramp2.position.set(0, V*4.0, -0.48);
    g.add(ramp2);
    // Metal kicker lip
    jh(new THREE.BoxGeometry(2.0, V*0.4, V*0.5), mtA, 0, V*5.6, -0.72);
    jh(new THREE.BoxGeometry(2.0, V*0.6, V*0.3), mtB, 0, V*5.2, -0.60);
    // Side walls
    [[-1.0], [1.0]].forEach(([sx]) => {
      jh(new THREE.BoxGeometry(V*0.6, V*3.0, 1.2), mtC, sx, V*2.5, 0);
      jh(new THREE.BoxGeometry(V*0.4, V*1.2, V*0.4), mtB, sx, V*5.4, -0.65);
    });
    // Landing spray voxels
    jh(new THREE.BoxGeometry(V*1.2, V*0.5, V*0.8), snA,  0.35, 0.06,  0.62);
    jh(new THREE.BoxGeometry(V*1.0, V*0.4, V*0.7), snA, -0.28, 0.06,  0.70);
    jh(new THREE.BoxGeometry(V*0.9, V*0.4, V*0.6), snA,  0.10, 0.06,  0.80);

  } else if (id === 'big_jump') {
    const V = 0.22;
    const snA = new THREE.MeshLambertMaterial({ color: 0xEFF5FF });
    const snB = new THREE.MeshLambertMaterial({ color: 0xD8E8F8 });
    const snC = new THREE.MeshLambertMaterial({ color: 0xB8CDE0 });
    const mtA = new THREE.MeshLambertMaterial({ color: 0x9AAABB });
    const mtB = new THREE.MeshLambertMaterial({ color: 0x6A8090 });
    const jh = (geo, mat, x, y, z) => { const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; g.add(m); };

    // Wide base (3-layer)
    jh(new THREE.BoxGeometry(3.5, V*2.0, 1.8), snC, 0, V*1.0, 0);
    jh(new THREE.BoxGeometry(3.5, V*0.5, 1.8), snB, 0, V*2.25, 0);
    jh(new THREE.BoxGeometry(3.5, V*0.2, 1.8), snA, 0, V*2.60, 0);
    // Stepped ramp approach
    jh(new THREE.BoxGeometry(3.4, V*1.5, 0.55), snB, 0, V*3.5, 0.58);
    jh(new THREE.BoxGeometry(3.4, V*2.5, 0.55), snB, 0, V*4.5, 1.12);
    jh(new THREE.BoxGeometry(3.4, V*3.5, 0.55), snB, 0, V*5.5, 1.66);
    // Metal lip
    jh(new THREE.BoxGeometry(3.4, V*0.8, V*0.6), mtA, 0, V*9.2, 1.92);
    jh(new THREE.BoxGeometry(3.4, V*0.4, V*0.4), mtB, 0, V*8.8, 1.70);
    // Back safety wall
    jh(new THREE.BoxGeometry(3.5, V*7.0, V*2.0), snC, 0, V*6.0, -0.80);
    jh(new THREE.BoxGeometry(3.5, V*0.4, V*2.0), snA, 0, V*9.8, -0.80);
    // Side walls
    [[-1.74],[1.74]].forEach(([sx]) => {
      jh(new THREE.BoxGeometry(V*0.8, V*9.0, 1.8), mtB, sx, V*4.5, 0);
    });

  } else if (id === 'chairlift') {
    const V = 0.22;
    const stA = new THREE.MeshLambertMaterial({ color: 0xD0D8E8 });
    const stB = new THREE.MeshLambertMaterial({ color: 0xA8B8CC });
    const stC = new THREE.MeshLambertMaterial({ color: 0x8090A8 });
    const stL = new THREE.MeshLambertMaterial({ color: 0xC8D0E0, emissive:new THREE.Color(0x6080A0), emissiveIntensity:0.15 });
    const seatM = new THREE.MeshLambertMaterial({ color: 0xE8E0D0 });
    const seatD = new THREE.MeshLambertMaterial({ color: 0xD0C8B8 });
    const jh = (geo, mat, x, y, z) => { const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; g.add(m); };

    // Two posts
    [[-1.8],[1.8]].forEach(([px]) => {
      jh(new THREE.BoxGeometry(V*1.4, V*0.8, V*1.4), stC, px, V*0.4, 0);
      jh(new THREE.BoxGeometry(V*1.0, V*14,  V*1.0), stB, px, V*8.0, 0);
      jh(new THREE.BoxGeometry(V*3.8, V*0.8, V*0.8), stB, px, V*15.8, 0);
      jh(new THREE.BoxGeometry(V*3.8, V*0.3, V*0.8), stA, px, V*16.4, 0);
    });
    // Cable
    jh(new THREE.BoxGeometry(3.6, V*0.25, V*0.25), stL, 0, V*15.5, 0);
    // Two hanging seats
    [[-0.7],[0.7]].forEach(([sx]) => {
      jh(new THREE.BoxGeometry(V*0.20, V*4.0, V*0.20), stC, sx, V*13.5, 0);
      jh(new THREE.BoxGeometry(V*5.5, V*0.6, V*2.5), seatD, sx, V*11.2, 0);
      jh(new THREE.BoxGeometry(V*5.5, V*0.3, V*2.5), seatM, sx, V*11.65, 0);
      jh(new THREE.BoxGeometry(V*5.5, V*0.3, V*0.3), stB, sx, V*13.2, V*1.3);
      jh(new THREE.BoxGeometry(V*5.5, V*3.5, V*0.4), seatD, sx, V*12.8, -V*1.0);
      [[-V*2.2],[V*2.2]].forEach(([lx]) =>
        jh(new THREE.BoxGeometry(V*0.4, V*1.5, V*0.4), stC, sx+lx, V*10.2, 0)
      );
    });

  } else if (id === 'snow_cannon') {
    const V = 0.22;
    const mtA = new THREE.MeshLambertMaterial({ color: 0x8898AA });
    const mtB = new THREE.MeshLambertMaterial({ color: 0x5A6878 });
    const mtC = new THREE.MeshLambertMaterial({ color: 0x3C4858 });
    const acA = new THREE.MeshLambertMaterial({ color: 0xC83020 });
    const msA = new THREE.MeshLambertMaterial({ color: 0xE8F4FF, transparent:true, opacity:0.70 });
    const msB = new THREE.MeshLambertMaterial({ color: 0xD0E8FF, transparent:true, opacity:0.55 });
    const jh = (geo, mat, x, y, z) => { const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; g.add(m); };

    // Tripod legs
    [[0.55,0,0.38],[-0.55,0,0.38],[0,0,-0.55]].forEach(([lx,ly,lz], li) => {
      const rot = li===2 ? 0 : (li===0 ? 0.3 : -0.3);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(V*0.9, V*3.5, V*0.9), mtC);
      leg.position.set(lx, V*1.75, lz); leg.rotation.z = rot; leg.castShadow = true; g.add(leg);
      jh(new THREE.BoxGeometry(V*1.4, V*0.5, V*1.4), mtB, lx, V*0.25, lz);
    });
    // Central mount
    jh(new THREE.BoxGeometry(V*2.0, V*1.2, V*2.0), mtB, 0, V*4.2, 0);
    jh(new THREE.BoxGeometry(V*1.6, V*0.4, V*1.6), mtA, 0, V*4.9, 0);
    jh(new THREE.BoxGeometry(V*2.2, V*0.3, V*2.2), mtC, 0, V*3.6, 0);
    // Tilted barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(V*1.1, V*1.4, V*8.0, 8), mtB);
    barrel.rotation.z = Math.PI * 0.11; barrel.position.set(0.20, V*8.5, 0); barrel.castShadow = true; g.add(barrel);
    const bH = new THREE.Mesh(new THREE.CylinderGeometry(V*1.15, V*1.45, V*0.5, 8), mtA);
    bH.rotation.z = Math.PI * 0.11; bH.position.set(0.22, V*11.8, 0); g.add(bH);
    // Muzzle accent
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(V*1.3, V*1.1, V*0.8, 8), acA);
    muzzle.rotation.z = Math.PI * 0.11; muzzle.position.set(0.38, V*13.0, 0); g.add(muzzle);
    // Snow mist cloud voxels
    jh(new THREE.BoxGeometry(V*1.8, V*1.4, V*1.6), msA, 0.65, V*15, 0.12);
    jh(new THREE.BoxGeometry(V*1.6, V*1.2, V*1.4), msA, 0.90, V*16, -0.18);
    jh(new THREE.BoxGeometry(V*1.4, V*1.0, V*1.2), msA, 1.15, V*14.5, 0.24);
    jh(new THREE.BoxGeometry(V*1.2, V*1.4, V*1.0), msA, 0.80, V*17, 0.06);
    jh(new THREE.BoxGeometry(V*1.2, V*1.0, V*1.2), msB, 0.50, V*15.8, -0.10);
    jh(new THREE.BoxGeometry(V*1.0, V*0.8, V*1.0), msB, 1.00, V*15.2, 0.20);
    // Control box
    jh(new THREE.BoxGeometry(V*1.8, V*2.2, V*1.0), mtC, -0.52, V*5.5, 0.35);
    jh(new THREE.BoxGeometry(V*1.6, V*0.3, V*0.8), acA, -0.52, V*6.6, 0.35);

  } else if (id === 'frozen_tree') {
    // ═══════════════════════════════════════════════════════════════
    //  Frozen Tree — 冰結樹 (ref: @mc_builds27)
    //  粗壯木+冰紋幹 → 寬扁冰冠(3層) → 垂掛發光冰柱 → 暖光核心
    //  尺寸: 比茶室更高更寬 (約 5.5 寬 × 6.0 高)
    // ═══════════════════════════════════════════════════════════════
    const V = 0.22;
    // ── 木材 3色調 ──
    const wkD = new THREE.MeshLambertMaterial({ color: 0x3A2010 });  // dark oak
    const wkM = new THREE.MeshLambertMaterial({ color: 0x5A3820 });  // mid oak
    const wkL = new THREE.MeshLambertMaterial({ color: 0x7A5030 });  // light oak
    // ── 冰紋石塊 3色調（半透明）──
    const iceA = new THREE.MeshLambertMaterial({ color: 0xA0C0D0, transparent: true, opacity: 0.80 });
    const iceB = new THREE.MeshLambertMaterial({ color: 0x88AAB8, transparent: true, opacity: 0.75 });
    const iceC = new THREE.MeshLambertMaterial({ color: 0xC0D8E8, transparent: true, opacity: 0.85 });
    // ── 樹冠發光塊（暖白 emission）──
    const glA = new THREE.MeshLambertMaterial({ color: 0xFFF0D0, emissive: new THREE.Color(0xFFE8B0), emissiveIntensity: 0.55 });
    const glB = new THREE.MeshLambertMaterial({ color: 0xFFF8E8, emissive: new THREE.Color(0xFFF0C0), emissiveIntensity: 0.70 });
    const glC = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, emissive: new THREE.Color(0xFFFFE0), emissiveIntensity: 0.45 });
    // ── 冰柱發光（強 emission）──
    const icG = new THREE.MeshLambertMaterial({ color: 0xFFF8F0, emissive: new THREE.Color(0xFFE8C0), emissiveIntensity: 0.90, transparent: true, opacity: 0.85 });
    // ── 草地 ──
    const grA = new THREE.MeshLambertMaterial({ color: 0x6AAA40 });
    const grB = new THREE.MeshLambertMaterial({ color: 0x88C850 });
    const grC = new THREE.MeshLambertMaterial({ color: 0xA0D060 });
    // ── 泥土/路徑 ──
    const drM = new THREE.MeshLambertMaterial({ color: 0xC8A870 });
    // ── 紅蘑菇 ──
    const msR = new THREE.MeshLambertMaterial({ color: 0xD03020 });
    const msW = new THREE.MeshLambertMaterial({ color: 0xF0E8E0 });

    const jh = (geo, mat, x, y, z) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m);
      return m;
    };

    // ═══ 基座：草地方塊（不規則棋盤格）═══
    const baseY = V * 0.5;
    const grassMats = [grA, grB, grC, drM];
    for (let gx = -3; gx <= 3; gx++) {
      for (let gz = -3; gz <= 3; gz++) {
        const dist = Math.sqrt(gx*gx + gz*gz);
        if (dist > 3.5) continue;
        const gh = V * (1.5 + Math.random() * 1.2);
        const gm = grassMats[(gx+gz+8) % grassMats.length];
        jh(new THREE.BoxGeometry(V*4.2, gh, V*4.2), gm,
           gx*V*4.2, gh/2, gz*V*4.2);
      }
    }

    // ═══ 小紅蘑菇（基座裝飾）═══
    jh(new THREE.BoxGeometry(V*1.0, V*1.8, V*1.0), msW, V*5, V*1.4, V*3);
    jh(new THREE.BoxGeometry(V*2.0, V*1.0, V*2.0), msR, V*5, V*2.5, V*3);

    // ═══ 樹幹：粗壯方塊（木材+冰紋交錯）═══
    const trunkH = V * 24;   // ~5.3 voxel units tall
    const trunkW = V * 5;

    // 主幹核心（3段疊加，交錯材質）
    jh(new THREE.BoxGeometry(trunkW, trunkH*0.35, trunkW), wkD, 0, trunkH*0.175 + baseY, 0);
    jh(new THREE.BoxGeometry(trunkW, trunkH*0.35, trunkW), wkM, 0, trunkH*0.525 + baseY, 0);
    jh(new THREE.BoxGeometry(trunkW*0.85, trunkH*0.30, trunkW*0.85), wkL, 0, trunkH*0.80 + baseY, 0);

    // 冰紋石塊鑲嵌在幹面（SKILL D 邊緣破碎）
    jh(new THREE.BoxGeometry(V*4.8, V*5.0, V*1.5), iceA, 0, trunkH*0.35+baseY, trunkW*0.48);
    jh(new THREE.BoxGeometry(V*1.5, V*6.0, V*4.8), iceB, trunkW*0.48, trunkH*0.55+baseY, 0);
    jh(new THREE.BoxGeometry(V*4.8, V*4.0, V*1.5), iceC, 0, trunkH*0.65+baseY, -trunkW*0.45);
    jh(new THREE.BoxGeometry(V*1.5, V*5.5, V*4.8), iceA, -trunkW*0.48, trunkH*0.45+baseY, 0);

    // 幹頂冰塊突出
    jh(new THREE.BoxGeometry(V*3.5, V*3.0, V*3.5), iceB, V*1.5, trunkH*0.88+baseY, V*1.5);
    jh(new THREE.BoxGeometry(V*3.0, V*3.5, V*3.0), iceC, -V*2.0, trunkH*0.82+baseY, -V*1.0);

    // ═══ 樹冠：寬扁蘑菇形（3層堆疊）═══
    const crownY = trunkH + baseY;
    const crownW = V * 28;   // 寬度 ~6.2 units
    const crownD = V * 26;

    // ── 第1層（最下）：大面積半透明冰+發光塊 ──
    const layer1Y = crownY + V*1;
    // 冰塊 — 不規則排列
    const icePos1 = [
      [-10,-8,iceA],[-6,-6,iceC],[-2,-10,iceB],[2,-8,iceA],[6,-6,iceC],[10,-8,iceB],
      [-10,-2,iceC],[-6, 0,iceA],[-2,-4,iceB],[2, 0,iceC],[6,-2,iceA],[10,-4,iceB],
      [-10, 4,iceA],[-6, 6,iceB],[-2, 4,iceC],[2, 6,iceA],[6, 4,iceB],[10, 6,iceC],
      [-8, 8,iceB],[-4, 10,iceA],[0, 8,iceC],[4, 10,iceB],[8, 8,iceA],
    ];
    icePos1.forEach(([ix, iz, im]) => {
      const bh = V * (2.5 + Math.random()*1.5);
      jh(new THREE.BoxGeometry(V*4.5, bh, V*4.5), im, ix*V, layer1Y+bh/2, iz*V);
    });
    // 發光暖塊穿插
    const glowPos1 = [
      [-8,-4,glA],[-4,-8,glB],[0,-2,glA],[4,-6,glC],[8,0,glB],
      [-6,4,glA],[2,4,glC],[6,8,glB],[-2,8,glA],
    ];
    glowPos1.forEach(([gx,gz,gm]) => {
      const bh = V * (3.0 + Math.random()*1.5);
      jh(new THREE.BoxGeometry(V*4.5, bh, V*4.5), gm, gx*V, layer1Y+bh/2, gz*V);
    });

    // ── 第2層（中間）：稍窄，更多發光塊 ──
    const layer2Y = crownY + V*5;
    const icePos2 = [
      [-8,-6,iceC],[-4,-4,iceA],[0,-8,iceB],[4,-4,iceC],[8,-6,iceA],
      [-8, 2,iceB],[-4, 4,iceC],[0, 2,iceA],[4, 4,iceB],[8, 2,iceC],
      [-4, 8,iceA],[4, 8,iceB],
    ];
    icePos2.forEach(([ix,iz,im]) => {
      const bh = V * (2.0 + Math.random()*1.5);
      jh(new THREE.BoxGeometry(V*4.5, bh, V*4.5), im, ix*V, layer2Y+bh/2, iz*V);
    });
    const glowPos2 = [
      [-6,0,glB],[0,0,glA],[6,0,glC],[-2,-6,glB],[2,6,glA],[0,-4,glC],
    ];
    glowPos2.forEach(([gx,gz,gm]) => {
      const bh = V * (2.5 + Math.random()*1.0);
      jh(new THREE.BoxGeometry(V*4.5, bh, V*4.5), gm, gx*V, layer2Y+bh/2, gz*V);
    });

    // ── 第3層（最上）：小頂冠 ──
    const layer3Y = crownY + V*8;
    [[-4,-2,iceC],[0,-4,glA],[4,-2,iceA],[-2,2,glB],[2,4,iceB],[0,0,glC]].forEach(([ix,iz,im]) => {
      const bh = V * (2.0 + Math.random()*1.0);
      jh(new THREE.BoxGeometry(V*4.5, bh, V*4.5), im, ix*V, layer3Y+bh/2, iz*V);
    });

    // ═══ 垂掛冰柱（最關鍵特徵）：從樹冠邊緣垂下 ═══
    const iciclePositions = [
      // 外圈（長冰柱）
      [-12,-8, 18],[-8,-10, 22],[0,-10, 20],[8,-10, 24],[12,-8, 19],
      [-12, 0, 21],[-12, 6, 17],[12, 2, 23],[12, 8, 18],
      [-8, 10, 20],[-4, 12, 22],[4, 12, 19],[8, 10, 24],
      // 中圈（中等冰柱）
      [-6,-6, 14],[-2,-8, 16],[4,-6, 13],[8,-4, 15],
      [-6, 4, 12],[6, 6, 14],[-2, 8, 16],[2, 6, 13],
      // 內圈（短冰柱）
      [-4,-2, 8],[0,-4, 10],[4, 0, 9],[-2, 4, 11],[2, 2, 7],
    ];
    iciclePositions.forEach(([ix, iz, len]) => {
      const icicleH = len * V;
      const topY    = layer1Y;
      // 冰柱主體（細長方塊，強發光）
      const icicle = jh(
        new THREE.BoxGeometry(V*0.6, icicleH, V*0.6),
        icG, ix*V, topY - icicleH/2, iz*V
      );
      // 冰柱頂端稍粗（連接點）
      jh(new THREE.BoxGeometry(V*1.2, V*1.5, V*1.2), icG, ix*V, topY - V*0.5, iz*V);
      // 冰柱尖端更細
      jh(new THREE.BoxGeometry(V*0.3, V*2.0, V*0.3), icG, ix*V, topY - icicleH - V*1.0, iz*V);
    });

    // ═══ 光源系統 ═══
    // 樹冠中心暖光
    const mainLight = new THREE.PointLight(0xFFE8C0, 3.0, 8.0);
    mainLight.position.set(0, crownY + V*4, 0);
    g.add(mainLight);
    // 樹冠邊緣補光（4個方向）
    [[V*-20, V*2, 0],[V*20, V*2, 0],[0, V*2, V*-20],[0, V*2, V*20]].forEach(([lx,ly,lz]) => {
      const edgeLight = new THREE.PointLight(0xFFF0D0, 1.2, 5.0);
      edgeLight.position.set(lx, crownY + ly, lz);
      g.add(edgeLight);
    });
    // 冰柱底部微光
    const bottomGlow = new THREE.PointLight(0xFFF8E8, 1.5, 4.0);
    bottomGlow.position.set(0, crownY - V*14, 0);
    g.add(bottomGlow);

    // ═══ 空氣微粒（sparkle 小方塊散佈在樹冠周圍）═══
    for (let si = 0; si < 35; si++) {
      const sx = (Math.random()-0.5) * crownW * 1.2;
      const sy = crownY + (Math.random()-0.5) * V * 20;
      const sz = (Math.random()-0.5) * crownD * 1.2;
      const sparkSize = V * (0.3 + Math.random()*0.5);
      const sparkle = jh(
        new THREE.BoxGeometry(sparkSize, sparkSize, sparkSize),
        new THREE.MeshLambertMaterial({
          color: 0xFFFFFF,
          emissive: new THREE.Color(0xFFFFE0),
          emissiveIntensity: 0.6 + Math.random()*0.4,
          transparent: true,
          opacity: 0.5 + Math.random()*0.4,
        }),
        sx, sy, sz
      );
    }

    // ═══ 搖曳動畫標記 ═══
    g.userData.frozenTreeSway = true;
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
//  ═══ 一樓 ═══  動物 (4-tier breeding lifecycle)
// ============================================================
const ANIMAL_TIER = [
  { lv:1, name:'小兔', nameAdult:'大兔',   color:0xF5F0EA, accent:0xE8DDD0, sx:0.45,sy:0.45,sz:0.50, speed:1.2, lifespan:180, breedTime:50,  nextLv:2 },
  { lv:2, name:'狐仔', nameAdult:'狐狸',   color:0xE8904A, accent:0xC87030, sx:0.50,sy:0.42,sz:0.55, speed:1.5, lifespan:240, breedTime:70,  nextLv:3 },
  { lv:3, name:'鷹',   nameAdult:'神鷹',   color:0x8090A0, accent:0xF5C030, sx:0.55,sy:0.35,sz:0.75, speed:1.8, lifespan:300, breedTime:90,  nextLv:4 },
  { lv:4, name:'雪狼', nameAdult:'芬尼爾', color:0x9080C0, accent:0xE0D0FF, sx:0.80,sy:0.65,sz:0.90, speed:1.0, lifespan:600, breedTime:null,nextLv:null },
];
function getTierDef(lv) { return ANIMAL_TIER.find(t=>t.lv===lv)||ANIMAL_TIER[0]; }

function buildAnimalMesh(tierDef, isBaby) {
  // ── 優先使用 MagicaVoxel 自訂模型 ──
  const modelId = `animal_lv${tierDef.lv}`;
  const custom  = getCustomModel(modelId);
  if (custom) {
    const sc = isBaby ? 0.4 : 1.0;
    custom.scale.setScalar(sc);
    return custom;
  }

  // ── Fallback: 程式碼生成 ──
  const sc   = isBaby ? 0.4 : 1.0;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(tierDef.sx*sc, tierDef.sy*sc, tierDef.sz*sc),
    new THREE.MeshLambertMaterial({ color: tierDef.color })
  );
  const em  = new THREE.MeshLambertMaterial({ color: tierDef.color });
  const acM = new THREE.MeshLambertMaterial({ color: tierDef.accent });
  const eym = new THREE.MeshLambertMaterial({ color: 0x222222 });

  if (tierDef.lv === 3) {
    // Hawks get wing stubs instead of ears
    [-0.1,0.1].forEach(ox => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.22*sc,0.05*sc,0.12*sc), acM);
      wing.position.set(ox, tierDef.sy*sc*0.2, 0); body.add(wing);
    });
  } else {
    [-0.1,0.1].forEach(ox => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.10*sc,0.18*sc,0.08*sc), em);
      ear.position.set(ox, tierDef.sy*sc*0.6, 0.1*sc); body.add(ear);
    });
  }
  [-0.1,0.1].forEach(ox => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06*sc,0.06*sc,0.06*sc), eym);
    eye.position.set(ox, tierDef.sy*sc*0.15, tierDef.sz*sc*0.5+0.01); body.add(eye);
  });
  if (tierDef.lv === 4) {
    body.material.emissive = new THREE.Color(0x4020A0);
    body.material.emissiveIntensity = 0.20;
  }
  return body;
}

function spawnAnimal(lv, spawnX, spawnZ) {
  const tierDef = getTierDef(lv);
  const mesh    = buildAnimalMesh(tierDef, true);
  mesh.position.set(
    spawnX !== undefined ? spawnX : (Math.random()-0.5)*14,
    tierDef.sy*0.4/2,
    spawnZ !== undefined ? spawnZ : (Math.random()-0.5)*14
  );
  mesh.castShadow = true;
  scene.add(mesh);
  animals.push({
    mesh, tierDef, lv,
    isBaby:        true,
    age:           0,
    breedCooldown: 0,
    speed:         tierDef.speed * 0.6,
    targetX:       (Math.random()-0.5)*14,
    targetZ:       (Math.random()-0.5)*14,
    changeTimer:   0,
    changeInterval: 3+Math.random()*4,
    isIdle: false, idleTimer: 0,
  });
}
for (let i=0;i<3;i++) spawnAnimal(1);

function updateAnimals(delta, now) {
  const GROW_AGE = 20;
  const toSpawn  = [];

  for (let ai = animals.length-1; ai >= 0; ai--) {
    const a = animals[ai];
    a.age           += delta;
    a.changeTimer   += delta;
    a.breedCooldown  = Math.max(0, a.breedCooldown - delta);

    // Baby → Adult
    if (a.isBaby && a.age >= GROW_AGE) {
      a.isBaby = false;
      a.speed  = a.tierDef.speed;
      a.mesh.scale.setScalar(1.0 / 0.4);
    }

    // Lifespan expiry
    if (a.age >= a.tierDef.lifespan) {
      scene.remove(a.mesh);
      a.mesh.traverse(c => { if (c.isMesh) { c.geometry.dispose(); [c.material].flat().forEach(m=>m.dispose()); }});
      animals.splice(ai, 1);
      showToast(`💀 ${a.tierDef.nameAdult} が寿命を終えた`);
      continue;
    }

    // Breeding: find nearby adult of same level
    if (!a.isBaby && a.breedCooldown <= 0 && a.tierDef.nextLv !== null && animals.length < 20) {
      for (let bi = 0; bi < animals.length; bi++) {
        if (bi === ai) continue;
        const b = animals[bi];
        if (b.lv !== a.lv || b.isBaby || b.breedCooldown > 0) continue;
        const dx = b.mesh.position.x - a.mesh.position.x;
        const dz = b.mesh.position.z - a.mesh.position.z;
        if (Math.sqrt(dx*dx+dz*dz) < 1.5) {
          const nx = (a.mesh.position.x + b.mesh.position.x) / 2;
          const nz = (a.mesh.position.z + b.mesh.position.z) / 2;
          toSpawn.push({ lv: a.tierDef.nextLv, x: nx, z: nz });
          a.breedCooldown = a.tierDef.breedTime;
          b.breedCooldown = a.tierDef.breedTime;
          const nextDef = getTierDef(a.tierDef.nextLv);
          showToast(`🐣 LV${a.tierDef.nextLv} ${nextDef.name} 誕生！`);
          break;
        }
      }
    }

    // Seek nearest fruit-bearing plant
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
        showToast(`🐾 ${a.tierDef.nameAdult}が収穫した！`);
        a.isIdle = true; a.idleTimer = 2; a.changeTimer = 0;
        continue;
      }
    }

    if (a.isIdle) {
      a.mesh.rotation.y += Math.sin(now*0.003)*0.025;
      if (a.changeTimer > a.idleTimer) { a.isIdle = false; a.changeTimer = 0; }
      continue;
    }

    const dx = a.targetX - a.mesh.position.x;
    const dz = a.targetZ - a.mesh.position.z;
    const d  = Math.sqrt(dx*dx + dz*dz);
    if (d > 0.15) {
      a.mesh.position.x += (dx/d)*a.speed*delta;
      a.mesh.position.z += (dz/d)*a.speed*delta;
      a.mesh.rotation.y  = Math.atan2(dx/d, dz/d);
      const halfH = a.tierDef.sy * (a.isBaby ? 0.4 : 1.0) / 2;
      a.mesh.position.y  = halfH + Math.abs(Math.sin(now*0.008))*0.07;
    }
    if (a.changeTimer > a.changeInterval || d < 0.15) {
      a.changeTimer = 0; a.changeInterval = 3+Math.random()*5;
      if (Math.random() < 0.3) { a.isIdle = true; a.idleTimer = 1+Math.random()*2; }
      else { a.targetX = (Math.random()-0.5)*14; a.targetZ = (Math.random()-0.5)*14; }
    }
  }
  toSpawn.forEach(({ lv, x, z }) => spawnAnimal(lv, x, z));
}

// ============================================================
//  ═══ 一樓 ═══  季節系統
// ============================================================
function setSeason(s) {
  currentSeason = s;
  const cfg = SEASON_CFG[s];
  scene.background = new THREE.Color(cfg.bg);
  scene.fog         = new THREE.Fog(cfg.fog, 40, 80);
  groundTiles.forEach(t => {
    if (t.userData.isSnow) return;
    t.material.color.setHex(cfg.grass[t.userData.colorIdx % cfg.grass.length]);
  });
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
function deleteAt(wx, wz) {
  // Plants: proximity-based (free placement, no grid key)
  const pIdx = plants.findIndex(p => {
    const dx = p.mesh.position.x - wx;
    const dz = p.mesh.position.z - wz;
    return Math.sqrt(dx*dx + dz*dz) < 0.9;
  });
  if (pIdx >= 0) {
    const p = plants[pIdx];
    scene.remove(p.mesh);
    p.mesh.traverse(c => {
      if (!c.isMesh) return;
      c.geometry.dispose();
      (Array.isArray(c.material)?c.material:[c.material]).forEach(m=>m.dispose());
    });
    plants.splice(pIdx, 1);
    updateUI();
    showToast('🗑️ 植物を除去');
    return;
  }

  // Furniture: grid-key based (snapped placement)
  const key = `${Math.round(wx)},${Math.round(wz)}`;
  if (!occupiedCells.has(key)) return;
  const idx = placedObjects.findIndex(o => o.gridX===Math.round(wx) && o.gridZ===Math.round(wz));
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
    if (currentMode === 'plant') {
      previewMesh.position.set(hit.x, 0.6, hit.z);
    } else {
      const s = snapToGrid(hit);
      previewMesh.position.set(s.x, 0.3, s.z);
    }
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
      if (currentMode === 'export') {
        exportMeshToOBJ(target.mesh, target.type);
        return;
      }
      if (currentMode === 'delete')     deleteAt(target.gridX, target.gridZ);
      else if (target.hasFruit)         harvestPlant(target);
      else showToast(target.stage==='growing' ? '🌱 育っています...' : '🌿 もうすぐ実る...');
      return;
    }
  }

  // ②b 家具 export 模式
  if (currentMode === 'export') {
    const allFM = [];
    placedObjects.forEach(o => o.mesh.traverse(c => { if (c.isMesh) allFM.push(c); }));
    const fHits = raycaster.intersectObjects(allFM);
    if (fHits.length > 0) {
      for (const o of placedObjects) {
        let obj = fHits[0].object;
        while (obj) { if (obj===o.mesh){ exportMeshToOBJ(o.mesh, o.furnId); return; } obj=obj.parent; }
      }
    }
  }

  // ③ 地面
  const hit = raycastGround();
  if (!hit) return;
  const half = (GRID_SIZE/2) * CELL_SIZE;
  if (Math.abs(hit.x)>half || Math.abs(hit.z)>half) return;

  if (currentMode === 'plant') {
    spawnPlant(hit.x, hit.z);
  } else if (currentMode === 'export') {
    // export 模式點地面不做任何事
  } else {
    const { x, z } = snapToGrid(hit);
    if (currentMode === 'build')       spawnFurniture(x, z);
    else if (currentMode === 'delete') deleteAt(hit.x, hit.z);
  }
});

// ============================================================
//  ═══ Global API ═══  (HTML onclick)
// ============================================================
window.setMode = function(mode) {
  currentMode = mode;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const map = { plant:'btn-plant', build:'btn-build', delete:'btn-delete', export:'btn-export' };
  document.getElementById(map[mode])?.classList.add('active');
  const labels = { plant:'種植', build:'家具', delete:'移除', export:'匯出' };
  document.getElementById('mode-label').textContent = `模式：${labels[mode]}`;
  if (mode === 'export') showToast('📦 點擊任何植物或家具 → 下載 .obj');
  closeAllPanels();
  createPreviewMesh();
};

// ============================================================
//  ═══ 匯出系統 ═══  OBJ Exporter (場上物件 → .obj 下載)
// ============================================================
const objExporter = new OBJExporter();

/**
 * 匯出單一物件為 .obj 下載
 */
function exportMeshToOBJ(group, filename) {
  try {
    const result = objExporter.parse(group);
    const blob   = new Blob([result], { type: 'text/plain' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = filename + '.obj';
    a.click();
    URL.revokeObjectURL(url);
    showToast(`📦 ${filename}.obj 下載完成！`);
  } catch (e) {
    showToast('匯出失敗: ' + e.message);
  }
}

/**
 * 匯出圖鑑中的模型（不需要先種植）
 */
window.exportFromCatalog = function(type, category) {
  let group, filename;
  if (category === 'plant') {
    group    = buildPlantGroup(type);
    filename = type;
  } else {
    group    = buildFurnitureMesh(type);
    filename = type;
  }
  exportMeshToOBJ(group, filename);
  // 清理暫時生成的 mesh
  group.traverse(c => {
    if (c.isMesh) {
      c.geometry.dispose();
      (Array.isArray(c.material)?c.material:[c.material]).forEach(m=>m.dispose());
    }
  });
};

/**
 * 一鍵匯出全部植物 + 全部家具圖鑑
 */
window.exportAllModels = function() {
  let count = 0;
  // 植物
  Object.keys(plantCatalog).forEach(id => {
    const g = buildPlantGroup(id);
    exportMeshToOBJ(g, id);
    g.traverse(c => { if (c.isMesh) { c.geometry.dispose(); [c.material].flat().forEach(m=>m.dispose()); }});
    count++;
  });
  // 家具
  furnitureCatalog.forEach(f => {
    const g = buildFurnitureMesh(f.id);
    exportMeshToOBJ(g, f.id);
    g.traverse(c => { if (c.isMesh) { c.geometry.dispose(); [c.material].flat().forEach(m=>m.dispose()); }});
    count++;
  });
  showToast(`📦 全部 ${count} 個模型匯出完成！`);
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
      btn.innerHTML = `<span class="ci-icon">${def.icon}</span><span class="ci-name">${def.name}</span><span class="ci-stock">×${cnt}</span><span class="ci-export" data-export="plant:${id}">📦</span>`;
      btn.onclick = (e) => {
        if (e.target.classList.contains('ci-export')) {
          e.stopPropagation();
          exportFromCatalog(e.target.dataset.export.split(':')[1], 'plant');
          return;
        }
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
      btn.innerHTML = `<span class="ci-icon">${def.icon}</span><span class="ci-name">${def.name}</span><span class="ci-export" data-export="build:${def.id}">📦</span>`;
      btn.onclick = (e) => {
        if (e.target.classList.contains('ci-export')) {
          e.stopPropagation();
          exportFromCatalog(e.target.dataset.export.split(':')[1], 'build');
          return;
        }
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
    if (!def || cnt === 0) continue;
    total += cnt * (def.sell||0);
    const row = document.createElement('div');
    row.className = 'sell-row';
    row.innerHTML = `<span>${def.icon} ${def.name}</span><span class="sell-cnt">${cnt}個</span><span class="sell-val">+${cnt*(def.sell||0)}</span>`;
    sellList.appendChild(row);
  }
  const tot = document.getElementById('sell-total');
  if (tot) tot.textContent = `合計: ${total} コイン`;

  // Grade-organized buy section
  const buyList = document.getElementById('shop-buy-list');
  if (buyList) {
    buyList.innerHTML = '';
    const gradeOrder = ['D','C','B','A','S','SS'];
    const gradeEmoji = { D:'⚪', C:'🟢', B:'🔵', A:'🟣', S:'🟡', SS:'🔴' };
    gradeOrder.forEach(grade => {
      const items = Object.entries(plantCatalog).filter(([,d]) => d.grade===grade && d.price>0);
      if (items.length === 0) return;
      const hdr = document.createElement('div');
      hdr.className = 'shop-grade-header';
      hdr.textContent = `${gradeEmoji[grade]} ${grade} 等級`;
      buyList.appendChild(hdr);
      items.forEach(([id, def]) => {
        const row = document.createElement('div');
        row.className = 'shop-buy-row';
        const stock = inventorySeeds[id] || 0;
        row.innerHTML = `<span>${def.icon} ${def.name}</span><span class="seed-stock">持有: ${stock}</span><button class="shop-buy-btn" onclick="buySeed('${id}')">${def.price} コイン</button>`;
        buyList.appendChild(row);
      });
    });
  }
}

// ============================================================
//  ═══ UI ═══
// ============================================================
function updateUI() {
  // 金錢
  const mEl = document.getElementById('money-display');
  if (mEl) mEl.textContent = money;

  // 倉庫 — dynamic (all plant types)
  const invEl = document.getElementById('inventory-dynamic');
  if (invEl) {
    invEl.innerHTML = '';
    for (const k in inventory) {
      const def = plantCatalog[k];
      if (!def) continue;
      const cnt = inventory[k] || 0;
      if (cnt === 0 && !plants.some(p => p.type === k)) continue;
      const row = document.createElement('div');
      row.className = 'inv-row';
      row.innerHTML = `${def.icon} <span id="inv-${k}">${cnt}</span>`;
      invEl.appendChild(row);
    }
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

  // ── Frozen Tree 搖曳動畫 ──
  const swayT = now * 0.001;
  placedObjects.forEach(o => {
    if (!o.mesh.userData.frozenTreeSway) return;
    // 樹冠微幅搖擺（wind sway）
    o.mesh.rotation.z = Math.sin(swayT * 0.6) * 0.012;
    o.mesh.rotation.x = Math.cos(swayT * 0.45 + 0.5) * 0.008;
  });

  renderer.render(scene, camera);
}
animate();

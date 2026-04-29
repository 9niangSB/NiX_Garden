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
  carrot:     { name:'胡蘿蔔', icon:'🥕', grade:'D', disposable:true,  stemColor:0x4A8838, topColor:0xF07030, shape:'carrot',  growTime:5000,  produceTime:4000,  sell:2,  price:3,  minRadius:0.08 },
  scallion:   { name:'蔥',     icon:'🌿', grade:'D', disposable:true,  stemColor:0x50A040, topColor:0x78D060, shape:'flat',    growTime:4000,  produceTime:3000,  sell:1,  price:2,  minRadius:0.05 },
  onion:      { name:'洋蔥',   icon:'🧅', grade:'D', disposable:true,  stemColor:0xD0C8A0, topColor:0xC0A040, shape:'shroom',  growTime:6000,  produceTime:4000,  sell:3,  price:4,  minRadius:0.08 },
  // ── C Grade (永續 sustainable) ────────────────────────────────
  tomato:     { name:'番茄',   icon:'🍅', grade:'C', stemColor:0x4A8838, topColor:0xE83020, shape:'tomato', growTime:8000,  produceTime:6000,  sell:5,  minRadius:0.12 },
  strawberry: { name:'草莓',   icon:'🍓', grade:'C', stemColor:0x4A8838, topColor:0xE83050, shape:'strawberry', growTime:10000, produceTime:6000, sell:8,  minRadius:0.10 },
  blueberry:  { name:'藍莓',   icon:'🫐', grade:'C', stemColor:0x4A8838, topColor:0x4060C0, shape:'blueberry', growTime:10000, produceTime:6000, sell:10, minRadius:0.12 },
  // ── B Grade (永續 sustainable) — 可密植 ───────────────────────
  corn:       { name:'玉米',   icon:'🌽', grade:'B', stemColor:0x4A8030, topColor:0xF0D040, shape:'corn',   growTime:14000, produceTime:8000,  sell:15, price:12, minRadius:0.12 },
  sunflowerB: { name:'向日葵', icon:'🌻', grade:'B', stemColor:0x80B030, topColor:0xF0C020, shape:'tall',   growTime:16000, produceTime:9000,  sell:18, price:15, minRadius:0.12 },
  pumpkin:    { name:'南瓜',   icon:'🎃', grade:'B', stemColor:0x5A8A40, topColor:0xFFA500, shape:'big',    growTime:18000, produceTime:10000, sell:25, price:20, minRadius:0.18 },
  // ── A Grade (昂貴永續 expensive sustainable) ──────────────────
  sakura:     { name:'櫻花樹', icon:'🌸', grade:'A', stemColor:0x5A3020, topColor:0xF8B0C0, shape:'sakura', growTime:22000, produceTime:12000, sell:40, price:30, minRadius:0.30, baseScale:1.8 },
  pinecone:   { name:'松果',   icon:'🌲', grade:'A', stemColor:0x5A4020, topColor:0x4A7030, shape:'tall',   growTime:25000, produceTime:14000, sell:50, price:38, minRadius:0.25, baseScale:1.6 },
  willow:     { name:'柳樹',   icon:'🌳', grade:'A', stemColor:0x4A3018, topColor:0x58A040, shape:'willow', growTime:28000, produceTime:16000, sell:60, price:45, minRadius:0.28, baseScale:1.8 },
  // ── S Grade (稀有昂貴永續 rare expensive) ─────────────────────
  giantSakura:{ name:'巨大櫻花樹', icon:'🌸', grade:'S', stemColor:0x3A1F12, topColor:0xFF9CCF, shape:'sakura_night', growTime:40000, produceTime:20000, sell:100, price:80, minRadius:0.38, baseScale:2.2 },
  giantPine:  { name:'巨大松樹',   icon:'🌲', grade:'S', stemColor:0x4A3820, topColor:0x386030, shape:'big', growTime:45000, produceTime:22000, sell:120, price:95, minRadius:0.38, baseScale:2.2 },
  butterfly:  { name:'蝴蝶草',     icon:'🦋', grade:'S', stemColor:0x9060B0, topColor:0xD080E0, shape:'rose', growTime:35000, produceTime:18000, sell:90, price:70, minRadius:0.35 },
  // ── SS Grade (極稀有昂貴永續 ultra rare) ─────────────────────
  demonFruit: { name:'惡魔果實',icon:'🔴', grade:'SS', stemColor:0x802040, topColor:0xFF2060, shape:'crystal', growTime:60000, produceTime:30000, sell:250, price:180, minRadius:0.48 },
  moonLotus:  { name:'月蓮',   icon:'🪷', grade:'SS', stemColor:0x6080C0, topColor:0xC0D8FF, shape:'lotus',   growTime:55000, produceTime:28000, sell:200, price:150, minRadius:0.45 },
  hemp:       { name:'大麻樹', icon:'🌿', grade:'SS', stemColor:0x3A5020, topColor:0x68B040, shape:'hemp',    growTime:65000, produceTime:35000, sell:300, price:220, minRadius:0.48, baseScale:2.0 },
};

const furnitureCatalog = [
  { id:'chair',  name:'椅子',   icon:'🪑', color:0xC89B6D, price:10 },
  { id:'table',  name:'桌子',   icon:'🪵', color:0xA97C50, price:15 },
  { id:'window', name:'窗戶',   icon:'🪟', color:0xA8C8E8, price:20 },
  { id:'door',   name:'門',     icon:'🚪', color:0x8B6040, price:20 },
  { id:'cobble', name:'石子路', icon:'🪨', color:0xB0A898, price:10 },
  { id:'pond',   name:'池塘',   icon:'💧', color:0x5C8FB0, price:50 },
  { id:'japanese_house', name:'和風小屋', icon:'🏯', color:0xC87060, price:500 },
  { id:'tea_house',      name:'茶室',    icon:'🍵', color:0xB03020, price:400 },
  { id:'jump_ramp',   name:'小跳台',  icon:'🎿', color:0xE8F0FF, price:30 },
  { id:'big_jump',    name:'大跳台',  icon:'🏔️', color:0xD0E8FF, price:80 },
  { id:'chairlift',   name:'纜車椅', icon:'🚡', color:0xC0C8D8, price:100 },
  { id:'snow_cannon', name:'造雪機', icon:'💨', color:0x8090A8, price:120 },
  { id:'frozen_tree', name:'冰結樹', icon:'🧊', color:0xE0F0FF, price:200 },
  { id:'jp_pavilion',  name:'和風涼亭',  icon:'⛩️', color:0xC83030, price:350, scale:0.14 },
  { id:'jp_gate',      name:'山門',      icon:'🏯', color:0xB82828, price:450, scale:0.14 },
  { id:'jp_bridge',    name:'和橋',      icon:'🌉', color:0xC04030, price:280, scale:0.14 },
  { id:'jp_gate_bridge', name:'門橋',    icon:'🎌', color:0xC83838, price:650, scale:0.14 },
  { id:'jp_romon',       name:'神社楼門', icon:'🏛️', color:0xC04028, price:550, scale:0.15 },
];

const equipmentCatalog = [
  { id:'board_black',   name:'黒板',   icon:'🏂', price:100 },
  { id:'board_flame',   name:'炎板',   icon:'🔥', price:300 },
  { id:'helmet_gold',   name:'金盔',   icon:'⛑️', price:500 },
  { id:'goggle_rainbow', name:'虹鏡', icon:'🌈', price:200 },
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
let money          = 20000000;  // 管理員模式：2000萬

const inventory      = Object.fromEntries(Object.keys(plantCatalog).map(k=>[k,0]));
const inventorySeeds = Object.fromEntries(Object.keys(plantCatalog).map(k=>[k, 999]));  // 管理員模式：全解鎖

const SNOW_ZONE_Z = -8;  // tiles with worldZ < this become permanent snow

const plants        = [];   // plant data objects
const placedObjects = [];   // furniture
const occupiedCells = new Set();
const groundTiles   = [];   // refs for season recolor
const animals       = [];

// ── Player & Ski system state ──
let playerMesh       = null;
let playerBoardMesh  = null;
let playerState      = 'walking';   // walking | riding_lift | skiing
const playerPos      = { x:0, y:0, z:0 };
const playerVel      = { x:0, y:0, z:0 };
let playerFacing     = 0;           // radians
let playerBobT       = 0;
const keysDown       = {};
const PLAYER_SPEED   = 2.5;
const SKI_ACCEL      = 8.0;
const SKI_MAX_SPEED  = 12.0;
let cameraFollowMode = false;       // 預設不鎖鏡頭

// ── 自由行走：AI 漫步 + 點擊移動 ──
let playerTarget     = null;        // { x, z } 點擊目標，null = AI 漫步
let playerIdleTimer  = 0;
let playerIdleAction = 'idle';      // idle | happy | plant | squat
let playerIdleActionTimer = 0;
let playerWanderTimer = 0;
const PLAYER_WANDER_INTERVAL = 4;   // 每幾秒換方向
let playerIsSelected = false;       // 滑鼠選中角色

// ── Shop: furniture & equipment inventory ──
const furnitureInventory = {};   // { id: count }
const equipmentInventory = {};  // { id: count }
let equippedBoard  = 'board_black';
let equippedHelmet = null;
let equippedGoggle = null;
let activeShopTab  = 'seeds';

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
scene.fog        = new THREE.Fog(0xF2E9E4, 50, 120);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 300);
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
controls.maxDistance   = 80;
controls.target.set(0, 0, 0);

// ── Keyboard input for player movement ──
window.addEventListener('keydown', e => { keysDown[e.key.toLowerCase()] = true; });
window.addEventListener('keyup',   e => { keysDown[e.key.toLowerCase()] = false; });

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

// ═══ 日式露天攤位（參照 pngtree 和風市集攤） ═══
{
  const V = 0.08;
  const sh = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
    m.userData.isShop = true;
    shopGroup.add(m); shopMeshes.push(m);
    return m;
  };

  // ── 色盤 ──
  const wkD = new THREE.MeshLambertMaterial({ color: 0x5A3820 });  // 深木
  const wkM = new THREE.MeshLambertMaterial({ color: 0x7A5030 });  // 中木
  const wkL = new THREE.MeshLambertMaterial({ color: 0x9A6840 });  // 淺木
  const wkP = new THREE.MeshLambertMaterial({ color: 0xC89060 });  // 木板淺
  const rfD = new THREE.MeshLambertMaterial({ color: 0x5A4838 });  // 屋瓦深
  const rfM = new THREE.MeshLambertMaterial({ color: 0x7A6050 });  // 屋瓦中
  const rfL = new THREE.MeshLambertMaterial({ color: 0x8A7060 });  // 屋瓦淺
  const rfH = new THREE.MeshLambertMaterial({ color: 0x9A8070 });  // 屋瓦高光
  const awA = new THREE.MeshLambertMaterial({ color: 0xF0E0C0 });  // 遮棚白
  const awB = new THREE.MeshLambertMaterial({ color: 0xD4A060 });  // 遮棚橙
  const wallM = new THREE.MeshLambertMaterial({ color: 0xF5E8D0 }); // 牆面米
  const wallD = new THREE.MeshLambertMaterial({ color: 0xE0D0B8 }); // 牆面深
  const glsM = new THREE.MeshLambertMaterial({ color: 0xC8E0F0, transparent:true, opacity:0.55 }); // 玻璃
  const glow = new THREE.MeshLambertMaterial({ color: 0xFFF0C0, emissive: new THREE.Color(0xFFDD80), emissiveIntensity: 0.4 });

  // ── 石板底座（圓形攤位地基）──
  for (let sx=-3; sx<=3; sx++) {
    for (let sz=-3; sz<=3; sz++) {
      if (sx*sx+sz*sz > 10) continue;
      sh(new THREE.BoxGeometry(V*4, V*1, V*4),
         new THREE.MeshLambertMaterial({ color: [0xD0C8B8,0xC8C0B0,0xD8D0C0][Math.abs(sx+sz)%3] }),
         sx*V*4, V*0.5, sz*V*4);
    }
  }

  // ── 後牆（三面圍，前面開放）──
  sh(new THREE.BoxGeometry(V*28, V*16, V*2), wallM, 0, V*10, -V*12);  // 後牆
  sh(new THREE.BoxGeometry(V*2, V*16, V*22), wallD, -V*14, V*10, 0);  // 左牆
  sh(new THREE.BoxGeometry(V*28, V*1, V*2), wkD, 0, V*2, -V*12);     // 後牆踢腳
  sh(new THREE.BoxGeometry(V*2, V*1, V*22), wkD, -V*14, V*2, 0);     // 左踢腳

  // ── 木柱（4根，前面2根+後面2根）──
  [[-V*13,V*12],[V*13,V*12],[-V*13,-V*11],[V*13,-V*11]].forEach(([px,pz]) => {
    sh(new THREE.BoxGeometry(V*1.8, V*26, V*1.8), wkD, px, V*14, pz);
    sh(new THREE.BoxGeometry(V*2.2, V*1, V*2.2), wkM, px, V*1.5, pz);   // 柱基
    sh(new THREE.BoxGeometry(V*2.2, V*0.6, V*2.2), wkL, px, V*27.2, pz); // 柱頭
  });

  // ── 屋頂：多層瓦片（核心細節）──
  const roofY = V*27;
  // 第1層：大底板（最寬，深色）
  sh(new THREE.BoxGeometry(V*36, V*1.2, V*30), rfD, 0, roofY, 0);
  // 第2層：中板（稍窄）
  sh(new THREE.BoxGeometry(V*34, V*1.0, V*28), rfM, 0, roofY+V*1.2, 0);
  // 第3層：淺色
  sh(new THREE.BoxGeometry(V*32, V*0.8, V*26), rfL, 0, roofY+V*2.2, 0);
  // 第4層：高光
  sh(new THREE.BoxGeometry(V*30, V*0.6, V*24), rfH, 0, roofY+V*3.0, 0);
  // 屋脊（頂部深色條）
  sh(new THREE.BoxGeometry(V*2, V*1.5, V*28), rfD, 0, roofY+V*4.2, 0);
  sh(new THREE.BoxGeometry(V*1.2, V*0.5, V*28), rfM, 0, roofY+V*5.2, 0);
  // 瓦片紋路（橫條 — 每隔一段深淺交替）
  for (let ri=-4; ri<=4; ri++) {
    const rz = ri * V*3;
    sh(new THREE.BoxGeometry(V*34, V*0.3, V*1.5), ri%2===0 ? rfD : rfM, 0, roofY-V*0.1, rz);
  }
  // 屋簷下緣（出簷深色邊）
  sh(new THREE.BoxGeometry(V*36, V*0.5, V*1.5), rfD, 0, roofY-V*0.6, V*15);
  sh(new THREE.BoxGeometry(V*36, V*0.5, V*1.5), rfD, 0, roofY-V*0.6, -V*15);
  sh(new THREE.BoxGeometry(V*1.5, V*0.5, V*30), rfD, V*18, roofY-V*0.6, 0);
  sh(new THREE.BoxGeometry(V*1.5, V*0.5, V*30), rfD, -V*18, roofY-V*0.6, 0);

  // ── 遮棚（白橙條紋布，正面垂掛）──
  for (let ai=0; ai<8; ai++) {
    const ax = -V*13 + ai*V*3.8;
    sh(new THREE.BoxGeometry(V*3.6, V*3.5, V*0.5), ai%2===0 ? awA : awB,
       ax, roofY-V*3.5, V*13);
  }
  // 側面遮棚
  for (let ai=0; ai<6; ai++) {
    const az = -V*10 + ai*V*3.8;
    sh(new THREE.BoxGeometry(V*0.5, V*3.5, V*3.6), ai%2===0 ? awA : awB,
       V*14, roofY-V*3.5, az);
  }

  // ── 前檯面（開放式攤位櫃台）──
  sh(new THREE.BoxGeometry(V*26, V*1.2, V*5), wkM, 0, V*8, V*9);   // 檯面板
  sh(new THREE.BoxGeometry(V*26, V*0.4, V*5), wkP, 0, V*8.8, V*9); // 淺色面板
  // 檯面下方木板（簍空感 — 間隔木條）
  for (let bi=0; bi<7; bi++) {
    const bx = -V*11 + bi*V*3.8;
    sh(new THREE.BoxGeometry(V*1.2, V*6, V*0.8), wkD, bx, V*4, V*11); // 直條
  }
  sh(new THREE.BoxGeometry(V*26, V*0.8, V*0.8), wkM, 0, V*1.5, V*11); // 底橫條
  sh(new THREE.BoxGeometry(V*26, V*0.8, V*0.8), wkM, 0, V*5.0, V*11); // 中橫條

  // ── 右側展台 ──
  sh(new THREE.BoxGeometry(V*10, V*7, V*5), wkM, V*9, V*5, V*2);
  sh(new THREE.BoxGeometry(V*10, V*0.4, V*5), wkP, V*9, V*8.2, V*2);

  // ── 商品展示：碗盤杯子果實 ──
  // 大碗
  sh(new THREE.CylinderGeometry(V*2.5, V*2, V*1.5, 8),
     new THREE.MeshLambertMaterial({ color: 0xF0E0C0 }), -V*5, V*10, V*9);
  // 小碗排列
  [[-V*8,V*9.5,V*9,0xE8D0B0],[V*2,V*9.5,V*9,0xD0B898],[V*6,V*9.5,V*9,0xC8A880]].forEach(([bx,by,bz,bc]) => {
    sh(new THREE.CylinderGeometry(V*1.2, V*1, V*1, 7),
       new THREE.MeshLambertMaterial({ color: bc }), bx, by, bz);
  });
  // 玻璃展示罩
  sh(new THREE.BoxGeometry(V*6, V*5, V*4), glsM, -V*4, V*12, V*8.5);
  // 罩內紅色糕點
  sh(new THREE.BoxGeometry(V*4, V*1.5, V*2.5),
     new THREE.MeshLambertMaterial({ color: 0xD04030 }), -V*4, V*10.5, V*8.5);
  // 階梯展架（後方牆上）
  for (let si=0; si<3; si++) {
    sh(new THREE.BoxGeometry(V*8, V*0.6, V*3), wkL,
       -V*4, V*12 + si*V*3, -V*9 + si*V*1.5);
    // 架上小物
    sh(new THREE.BoxGeometry(V*1.5, V*1.5, V*1.5),
       new THREE.MeshLambertMaterial({ color: [0xE8C040,0xD09030,0xC07020][si] }),
       -V*4 + si*V*2, V*13 + si*V*3, -V*9 + si*V*1.5);
  }
  // 右側醬料瓶排列
  for (let ji=0; ji<4; ji++) {
    sh(new THREE.CylinderGeometry(V*0.5, V*0.5, V*2.5, 6),
       new THREE.MeshLambertMaterial({ color: [0xF0F0E8,0xE8E0D0,0xD8D0C0,0xC8C0B0][ji] }),
       V*7+ji*V*2, V*9.8, V*2);
  }

  // ── 掛物：燈籠 + 木牌 ──
  // 右側木招牌
  sh(new THREE.BoxGeometry(V*4, V*6, V*0.6), wkP, V*15, V*18, V*10);
  sh(new THREE.BoxGeometry(V*3, V*4, V*0.4), wallM, V*15, V*18.5, V*10.4);
  // 正面掛物（魚乾/肉乾）
  for (let hi=0; hi<3; hi++) {
    sh(new THREE.BoxGeometry(V*0.6, V*3, V*0.4),
       new THREE.MeshLambertMaterial({ color: [0xA06030,0x905028,0xB07038][hi] }),
       V*6+hi*V*2.5, V*22, V*12);
  }
  // 左前盆栽
  sh(new THREE.CylinderGeometry(V*1.5, V*1.2, V*2.5, 7),
     new THREE.MeshLambertMaterial({ color: 0x9A7050 }), -V*16, V*2.5, V*10);
  sh(new THREE.SphereGeometry(V*2.5, 6, 5),
     new THREE.MeshLambertMaterial({ color: 0x50A038 }), -V*16, V*5.5, V*10);
  // 前方小板凳
  sh(new THREE.BoxGeometry(V*4, V*0.6, V*3), wkL, V*4, V*3, V*14);
  [[-V*1.3,V*14],[V*1.3,V*14],[V*-1.3,V*11.5],[V*1.3,V*11.5]].forEach(([lx,lz]) => {
    sh(new THREE.BoxGeometry(V*0.6, V*2.5, V*0.6), wkD, V*4+lx, V*1.5, lz);
  });

  // ── 光源 ──
  const sL1 = new THREE.PointLight(0xFFDD88, 1.5, 5.0);
  sL1.position.set(0, V*22, V*5); shopGroup.add(sL1);
  const sL2 = new THREE.PointLight(0xFFF0C0, 0.8, 4.0);
  sL2.position.set(-V*8, V*10, V*9); shopGroup.add(sL2);
}

shopGroup.position.set(9,0,8);
shopGroup.rotation.y = -Math.PI / 5;
scene.add(shopGroup);

// ============================================================
//  ═══ 一樓 ═══  粒子效果
// ============================================================
let particleSystem   = null;
const PARTICLE_COUNT = 500;

// ── 粒子色彩池（每種類型多色混合，增加細緻度）──
const PARTICLE_COLORS = {
  petal: [0xF6C6C8, 0xF0A8B0, 0xFFD4DC, 0xE89CA8, 0xFFC0C8, 0xF8B8C0],
  snow:  [0xEEF4FF, 0xD8E8F8, 0xFFFFFF, 0xE0F0FF, 0xC8DCF0, 0xF0F8FF],
  maple: [0xE85520, 0xD04010, 0xF07030, 0xC83808, 0xF09040, 0xE06028],
  leaf:  [0x88C860, 0x68B040, 0xA0D878, 0x58A030, 0x78C050, 0xB0E088],
};

function buildParticles(type) {
  if (particleSystem) { scene.remove(particleSystem); particleSystem = null; }
  const pos   = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const palette = PARTICLE_COLORS[type] || PARTICLE_COLORS.snow;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pos[i*3]   = (Math.random()-0.5) * 28;
    pos[i*3+1] = Math.random() * 14 + 1;
    pos[i*3+2] = (Math.random()-0.5) * 28;
    // 隨機從色彩池挑色
    const c = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
    // 微幅偏移增加自然感
    c.r += (Math.random()-0.5) * 0.06;
    c.g += (Math.random()-0.5) * 0.06;
    c.b += (Math.random()-0.5) * 0.06;
    colors[i*3]   = c.r;
    colors[i*3+1] = c.g;
    colors[i*3+2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  particleSystem = new THREE.Points(geo, new THREE.PointsMaterial({
    size:  type === 'snow' ? 0.06 : 0.08,
    transparent: true, opacity: type === 'snow' ? 0.80 : 0.65,
    depthWrite: false, sizeAttenuation: true,
    vertexColors: true,
  }));
  particleSystem.userData.ptype = type;
  scene.add(particleSystem);
}

function updateParticles(delta) {
  if (!particleSystem) return;
  const pos = particleSystem.geometry.attributes.position.array;
  const spd = particleSystem.userData.ptype === 'snow' ? 0.4 : 0.6;
  const t   = Date.now() * 0.001;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pos[i*3+1] -= spd * delta;
    // 更豐富的漂浮：雙重正弦 + 微風
    pos[i*3]   += Math.sin(t * 0.8 + i * 1.3) * 0.003 + Math.cos(t * 0.3 + i) * 0.001;
    pos[i*3+2] += Math.cos(t * 0.6 + i * 0.7) * 0.002;
    if (pos[i*3+1] < -0.5) {
      pos[i*3]   = (Math.random()-0.5) * 28;
      pos[i*3+1] = 14 + Math.random() * 4;
      pos[i*3+2] = (Math.random()-0.5) * 28;
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
          : def.shape === 'carrot' ? new THREE.ConeGeometry(r*0.5, r*2, 6)
          : def.shape === 'tomato' ? new THREE.SphereGeometry(r*0.8, 7, 5)
          : def.shape === 'corn'       ? new THREE.CylinderGeometry(r*0.3, r*0.4, r*3, 6)
          : def.shape === 'strawberry' ? new THREE.SphereGeometry(r*0.7, 7, 5)
          : def.shape === 'blueberry'  ? new THREE.SphereGeometry(r*0.6, 7, 5)
          : def.shape === 'tall'       ? new THREE.CylinderGeometry(r*0.5, r*0.6, r*2.5, 6)
          :                              new THREE.SphereGeometry(r, 7, 5);
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

  const isBig = ['big','drape','rose','lotus','crystal','sakura','willow','hemp','sakura_night'].includes(def.shape);
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
    // ═══ Grow-a-Garden 風格植物 ═══
    case 'carrot': {
      // 胡蘿蔔：橘色錐形根部半埋土中 + 綠色葉叢頂部
      // 土塊底座
      jh(new THREE.BoxGeometry(0.40, 0.12, 0.40),
         varyColor(0x8B6840), 0, 0.06, 0);
      jh(new THREE.BoxGeometry(0.34, 0.10, 0.34),
         varyColor(0x9A7848), 0.05, 0.12, -0.03);
      // 胡蘿蔔根部（3段漸細，從土裡露出一半）
      jh(new THREE.BoxGeometry(0.18, 0.22, 0.18),
         varyColor(0xF07030), 0, 0.22, 0);  // 粗段
      jh(new THREE.BoxGeometry(0.14, 0.18, 0.14),
         varyColor(0xE86828), 0, 0.38, 0);  // 中段
      jh(new THREE.BoxGeometry(0.10, 0.14, 0.10),
         varyColor(0xE06020), 0, 0.50, 0);  // 細段
      // 根部頂端圓角
      jh(new THREE.BoxGeometry(0.06, 0.08, 0.06),
         varyColor(0xD85818), 0, 0.08, 0);  // 尖端（土裡）
      // 橫紋環（胡蘿蔔表面紋路）
      jh(new THREE.BoxGeometry(0.20, 0.02, 0.20),
         varyColor(0xD06020), 0, 0.30, 0);
      jh(new THREE.BoxGeometry(0.16, 0.02, 0.16),
         varyColor(0xD06020), 0, 0.42, 0);
      // 綠色葉叢（3-4片向外展開）
      const leafG = 0x4A8838;
      const top = jh(new THREE.BoxGeometry(0.06, 0.30, 0.04),
         varyColor(leafG), 0, 0.72, 0);
      top.userData.isPlantTop = true;
      jh(new THREE.BoxGeometry(0.05, 0.26, 0.04),
         varyColor(0x58A040), 0.10, 0.68, 0.06);
      jh(new THREE.BoxGeometry(0.05, 0.24, 0.04),
         varyColor(0x58A040), -0.08, 0.66, -0.05);
      jh(new THREE.BoxGeometry(0.04, 0.20, 0.05),
         varyColor(0x68B048), 0.04, 0.64, -0.09);
      // 葉片頂端微彎（用小方塊偏移模擬）
      jh(new THREE.BoxGeometry(0.05, 0.06, 0.04),
         varyColor(leafG), 0.04, 0.88, 0.04);
      jh(new THREE.BoxGeometry(0.04, 0.06, 0.04),
         varyColor(0x58A040), 0.14, 0.82, 0.10);
      jh(new THREE.BoxGeometry(0.04, 0.06, 0.04),
         varyColor(0x58A040), -0.10, 0.80, -0.08);
      break;
    }
    case 'tomato': {
      // 番茄：綠色木架(支架) + 紅色圓果 + 小葉片
      // 木支架（Y字型竹竿）
      jh(new THREE.BoxGeometry(0.05, 0.70, 0.05),
         varyColor(0x8B6840), 0, 0.35, 0);
      jh(new THREE.BoxGeometry(0.05, 0.30, 0.05),
         varyColor(0x8B6840), 0.12, 0.60, 0);
      const stk = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.30, 0.05),
        varyColor(0x8B6840).clone()
      );
      stk.position.set(0.12, 0.60, 0);
      stk.rotation.z = 0.4;
      stk.castShadow = true; g.add(stk);
      const stk2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.28, 0.05),
        varyColor(0x8B6840).clone()
      );
      stk2.position.set(-0.10, 0.58, 0);
      stk2.rotation.z = -0.35;
      stk2.castShadow = true; g.add(stk2);
      // 藤蔓繞竿
      jh(new THREE.BoxGeometry(0.03, 0.08, 0.03),
         varyColor(0x4A8838), 0.04, 0.50, 0.04);
      jh(new THREE.BoxGeometry(0.03, 0.08, 0.03),
         varyColor(0x4A8838), -0.04, 0.40, -0.03);
      jh(new THREE.BoxGeometry(0.03, 0.06, 0.03),
         varyColor(0x58A040), 0.03, 0.30, 0.03);
      // 番茄果實（主果 + 2小果）
      const top = jh(new THREE.SphereGeometry(0.18, 8, 6),
         varyColor(0xE83020), 0.05, 0.52, 0.10);
      top.userData.isPlantTop = true;
      jh(new THREE.SphereGeometry(0.12, 7, 5),
         varyColor(0xE03828), -0.12, 0.42, -0.08);
      jh(new THREE.SphereGeometry(0.09, 6, 5),
         varyColor(0xD83018), 0.14, 0.38, -0.06);
      // 果實頂部星形萼片
      jh(new THREE.BoxGeometry(0.14, 0.02, 0.03),
         varyColor(0x4A8838), 0.05, 0.68, 0.10);
      jh(new THREE.BoxGeometry(0.03, 0.02, 0.14),
         varyColor(0x4A8838), 0.05, 0.68, 0.10);
      // 葉片（3片展開）
      jh(new THREE.BoxGeometry(0.16, 0.03, 0.08),
         varyColor(0x4A8838), 0.20, 0.55, 0.05);
      jh(new THREE.BoxGeometry(0.16, 0.03, 0.08),
         varyColor(0x58A040), -0.18, 0.50, -0.06);
      jh(new THREE.BoxGeometry(0.08, 0.03, 0.16),
         varyColor(0x4A8838), 0.02, 0.48, 0.18);
      break;
    }
    case 'corn': {
      // 玉米：高莖稈 + 黃色玉米棒 + 寬長葉片 + 棕色穗頂
      // 主莖稈（粗壯方形）
      jh(new THREE.BoxGeometry(0.08, 0.90, 0.08),
         varyColor(0x4A8030), 0, 0.45, 0);
      // 莖節環
      jh(new THREE.BoxGeometry(0.10, 0.03, 0.10),
         varyColor(0x3A7028), 0, 0.30, 0);
      jh(new THREE.BoxGeometry(0.10, 0.03, 0.10),
         varyColor(0x3A7028), 0, 0.55, 0);
      // 玉米棒（黃色圓柱，稍偏側）
      const cob = jh(new THREE.CylinderGeometry(0.10, 0.08, 0.30, 8),
         varyColor(0xF0D040), 0.10, 0.55, 0.06);
      // 玉米棒表面顆粒紋（小方塊）
      [[0.08,0.48,0.14],[0.14,0.52,0.02],[0.06,0.58,0.12],[0.14,0.62,0.08]].forEach(([kx,ky,kz]) =>
        jh(new THREE.BoxGeometry(0.03,0.03,0.03), varyColor(0xE8C830), kx,ky,kz)
      );
      // 玉米皮（部分剝開的綠色苞葉）
      jh(new THREE.BoxGeometry(0.06, 0.22, 0.12),
         varyColor(0x68A838), 0.20, 0.55, 0.06);
      jh(new THREE.BoxGeometry(0.06, 0.18, 0.10),
         varyColor(0x58A030), 0.02, 0.48, 0.14);
      // 寬長葉片（4片交替，Grow-a-Garden 風格弧形大葉）
      const leafMats = [0x4A8030, 0x58A038, 0x3A7028, 0x68B040];
      [[ 0.30, 0.35,  0.05, -0.3],
       [-0.28, 0.50, -0.06,  0.3],
       [ 0.25, 0.65,  0.08, -0.25],
       [-0.22, 0.25, -0.08,  0.25]].forEach(([lx,ly,lz,rot], li) => {
        const leaf = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.04, 0.10),
          varyColor(leafMats[li])
        );
        leaf.position.set(lx, ly, lz);
        leaf.rotation.z = rot;
        leaf.castShadow = true; g.add(leaf);
      });
      // 穗頂（棕色鬚絲）
      const top = jh(new THREE.BoxGeometry(0.04, 0.18, 0.04),
         varyColor(0xA08040), 0, 0.95, 0);
      top.userData.isPlantTop = true;
      jh(new THREE.BoxGeometry(0.03, 0.14, 0.03),
         varyColor(0xB09050), 0.04, 0.92, 0.03);
      jh(new THREE.BoxGeometry(0.03, 0.12, 0.03),
         varyColor(0xB09050), -0.03, 0.90, -0.02);
      break;
    }
    case 'strawberry': {
      // 草莓：低矮灌木 + 白花 + 紅色心形果實（Grow-a-Garden 風格）
      // 灌木叢底座
      jh(new THREE.SphereGeometry(0.22, 6, 5), varyColor(0x4A8838), 0, 0.24, 0);
      jh(new THREE.SphereGeometry(0.18, 6, 5), varyColor(0x58A040), 0.16, 0.22, 0.10);
      jh(new THREE.SphereGeometry(0.16, 6, 5), varyColor(0x58A040), -0.14, 0.20, -0.08);
      // 展開葉片（3片鋸齒狀，Grow-a-Garden 三葉草造型）
      jh(new THREE.BoxGeometry(0.20, 0.03, 0.10), varyColor(0x4A8838), 0.22, 0.28, 0.05);
      jh(new THREE.BoxGeometry(0.18, 0.03, 0.10), varyColor(0x58A040), -0.20, 0.26, -0.06);
      jh(new THREE.BoxGeometry(0.10, 0.03, 0.18), varyColor(0x4A8838), 0.04, 0.25, 0.20);
      // 白色小花（2朵）
      jh(new THREE.BoxGeometry(0.06, 0.06, 0.06), varyColor(0xF8F4F0), 0.14, 0.36, 0.12);
      jh(new THREE.BoxGeometry(0.05, 0.05, 0.05), varyColor(0xF8F0E8), -0.10, 0.34, -0.10);
      jh(new THREE.BoxGeometry(0.03, 0.03, 0.03), varyColor(0xF0D040), 0.14, 0.39, 0.12); // 花蕊
      // 草莓果實（主果 — 心形近似：寬頂窄底）
      const top = jh(new THREE.SphereGeometry(0.14, 7, 5), varyColor(0xE83050), 0.06, 0.18, 0.16);
      top.scale.set(1, 1.3, 1); // 拉長成心形
      top.userData.isPlantTop = true;
      // 草莓表面顆粒（黃色種子點）
      [[0.10,0.22,0.22],[0.02,0.16,0.24],[0.10,0.12,0.20]].forEach(([sx,sy,sz]) =>
        jh(new THREE.BoxGeometry(0.02, 0.02, 0.02), varyColor(0xE0C030), sx, sy, sz));
      // 果頂綠萼
      jh(new THREE.BoxGeometry(0.10, 0.02, 0.06), varyColor(0x4A8838), 0.06, 0.30, 0.16);
      // 小果實
      jh(new THREE.SphereGeometry(0.08, 6, 4), varyColor(0xD02840), -0.12, 0.14, -0.10);
      break;
    }
    case 'blueberry': {
      // 藍莓：矮灌木 + 圓形藍紫小果實成串（Grow-a-Garden 風格）
      // 灌木主體
      jh(new THREE.SphereGeometry(0.20, 6, 5), varyColor(0x4A8838), 0, 0.22, 0);
      jh(new THREE.SphereGeometry(0.16, 6, 5), varyColor(0x58A040), 0.14, 0.20, 0.08);
      jh(new THREE.SphereGeometry(0.14, 6, 5), varyColor(0x489030), -0.12, 0.18, -0.06);
      // 葉片
      jh(new THREE.BoxGeometry(0.16, 0.03, 0.08), varyColor(0x4A8838), 0.20, 0.26, 0.04);
      jh(new THREE.BoxGeometry(0.14, 0.03, 0.08), varyColor(0x58A040), -0.18, 0.24, -0.05);
      jh(new THREE.BoxGeometry(0.08, 0.03, 0.14), varyColor(0x4A8838), 0.03, 0.23, 0.16);
      // 藍莓果實成串（6-8顆小球）
      const berryColors = [0x4060C0, 0x3050B0, 0x5070D0, 0x3848A0, 0x4868C8];
      const berryPos = [
        [0.08,0.34,0.10],[-0.06,0.32,0.12],[0.12,0.30,-0.04],
        [-0.10,0.28,-0.08],[0.02,0.36,0.04],[-0.04,0.34,-0.02],
        [0.14,0.26,0.08],[-0.12,0.30,0.06],
      ];
      let topBerry = null;
      berryPos.forEach(([bx,by,bz], bi) => {
        const berry = jh(new THREE.SphereGeometry(0.055, 6, 5), varyColor(berryColors[bi%5]), bx, by, bz);
        // 每顆藍莓頂部有小十字萼痕
        jh(new THREE.BoxGeometry(0.03, 0.01, 0.01), varyColor(0x3A5080), bx, by+0.055, bz);
        if (bi === 4) { topBerry = berry; topBerry.userData.isPlantTop = true; }
      });
      // 果實白霜（藍莓表面特徵）
      jh(new THREE.SphereGeometry(0.04, 5, 4),
         new THREE.MeshLambertMaterial({ color: 0x8090C0, transparent: true, opacity: 0.35 }),
         0.08, 0.35, 0.10);
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
    case 'sakura': {
      // ═══ 櫻花樹：粗壯深色樹幹 + 粉色球狀樹冠(多層) + 飄落花瓣 ═══
      const V = 0.04;  // 細緻 voxel 單位
      // 樹幹（3色調深木）
      jh(new THREE.CylinderGeometry(V*3.5, V*5, V*35, 7), varyColor(0x5A3020), 0, V*17.5, 0);
      jh(new THREE.BoxGeometry(V*3, V*28, V*2.5), varyColor(0x4A2818), V*2.5, V*16, V*1.5);
      jh(new THREE.BoxGeometry(V*2, V*24, V*2.5), varyColor(0x6A4030), -V*3, V*14, -V*1);
      // 根部突起
      [[V*5,V*2,V*2],[V*-4,V*2,V*3],[V*1,V*2,V*-5]].forEach(([rx,ry,rz]) =>
        jh(new THREE.BoxGeometry(V*4, V*4, V*3), varyColor(0x4A2818), rx, ry, rz));
      // 分枝（6支向外放射）
      for (let bi=0; bi<6; bi++) {
        const ba = bi*Math.PI/3 + Math.random()*0.3;
        const bl = V*(12+Math.random()*8);
        const bx = Math.cos(ba)*bl*0.5;
        const bz = Math.sin(ba)*bl*0.5;
        jh(new THREE.BoxGeometry(V*1.5, V*2, bl), varyColor(0x5A3020),
           bx, V*30+Math.random()*V*8, bz);
      }
      // 粉色樹冠：10 個小區塊，每區塊 8×8 密集方塊（類冰結樹風格）
      const pinks = [0xF8B0C0, 0xF0A0B8, 0xFFC0D0, 0xF090A8, 0xFFD0E0, 0xE8A0B0, 0xF0C0D8, 0xE090A0];
      const crY = V*38;
      const bkSize = V*1.0;  // 每個小方塊大小
      const clusterR = bkSize * 4;  // 8×8 = 半徑4格

      // 10 個區塊中心點（不規則分佈形成自然樹冠）
      const clusterCenters = [
        [0, crY+V*2, 0],           // 中心
        [V*8, crY+V*1, V*4],       // 右前
        [-V*7, crY+V*0, V*5],      // 左前
        [V*5, crY+V*3, -V*6],      // 右後
        [-V*6, crY+V*2, -V*5],     // 左後
        [V*3, crY+V*7, V*2],       // 上中右
        [-V*4, crY+V*6, -V*2],     // 上中左
        [V*10, crY-V*1, -V*2],     // 遠右
        [-V*9, crY-V*2, V*3],      // 遠左
        [0, crY+V*10, 0],          // 最頂
      ];

      clusterCenters.forEach(([cx, cy, cz], ci) => {
        // 每個區塊 8×8 格子，隨機跳過一些格子營造不規則邊緣
        for (let bx = -4; bx < 4; bx++) {
          for (let bz = -4; bz < 4; bz++) {
            // 圓形裁切 + 隨機邊緣
            const dist = Math.sqrt(bx*bx + bz*bz);
            if (dist > 3.8) continue;               // 圓形邊界
            if (dist > 2.5 && Math.random() < 0.3) continue;  // 邊緣隨機缺口

            // 高度隨機 ±5~8% 偏移
            const yOff = (Math.random()-0.5) * bkSize * 0.16;
            // 位置 ±5~8% 偏移
            const xOff = (Math.random()-0.5) * bkSize * 0.16;
            const zOff = (Math.random()-0.5) * bkSize * 0.16;

            // 顏色從 pinks 陣列隨機選 + varyColor ±8%
            const baseColor = pinks[Math.floor(Math.random() * pinks.length)];
            const mat = varyColor(baseColor, 0.08);

            jh(new THREE.BoxGeometry(bkSize, bkSize, bkSize), mat,
               cx + bx*bkSize + xOff,
               cy + yOff,
               cz + bz*bkSize + zOff);
          }
        }
      });

      const top = new THREE.Object3D();
      top.position.set(0, crY+V*14, 0);
      top.userData.isPlantTop = true;
      g.add(top);
      // 飄落花瓣（小扁方塊）
      for (let pi=0; pi<12; pi++) {
        const px = (Math.random()-0.5)*V*30;
        const py = crY - V*(5+Math.random()*25);
        const pz = (Math.random()-0.5)*V*30;
        jh(new THREE.BoxGeometry(V*1.2, V*0.3, V*1.0), varyColor(0xFFC0D0), px, py, pz);
      }
      break;
    }
    case 'willow': {
      // ═══ 柳樹：高瘦深色樹幹 + 長條垂枝（綠色漸層）═══
      const V = 0.04;
      // 主幹（深色，微彎）
      jh(new THREE.CylinderGeometry(V*2.5, V*4, V*45, 7), varyColor(0x4A3018), 0, V*22.5, 0);
      jh(new THREE.BoxGeometry(V*2, V*38, V*2), varyColor(0x3A2010), V*2, V*20, V*1);
      jh(new THREE.BoxGeometry(V*1.5, V*35, V*1.5), varyColor(0x5A4028), -V*2.5, V*18, -V*1);
      // 根部
      [[V*4,V*2,V*3],[V*-3,V*2,V*4],[V*2,V*1.5,V*-4]].forEach(([rx,ry,rz]) =>
        jh(new THREE.BoxGeometry(V*3, V*3, V*3), varyColor(0x3A2010), rx, ry, rz));
      // 頂部分枝基座
      const crownY = V*42;
      for (let bi=0; bi<8; bi++) {
        const ba = bi*Math.PI/4 + Math.random()*0.2;
        const bl = V*(8+Math.random()*6);
        const bx = Math.cos(ba)*bl*0.5;
        const bz = Math.sin(ba)*bl*0.5;
        jh(new THREE.BoxGeometry(V*1.2, V*2, bl*0.6), varyColor(0x4A3018),
           bx, crownY-V*2+Math.random()*V*4, bz);
      }
      // 垂枝（核心特徵：30 條細長垂枝 + 細長葉片）
      const greens = [0x58A040, 0x489030, 0x68B050, 0x408028, 0x78C060];
      for (let wi=0; wi<30; wi++) {
        const wa = (wi/30)*Math.PI*2 + Math.random()*0.4;
        const wr = V*(7+Math.random()*12);
        const wLen = V*(25+Math.random()*20);  // 更長
        const wx = Math.cos(wa)*wr;
        const wz = Math.sin(wa)*wr;
        // 垂枝：極細線條
        const segments = 6+Math.floor(Math.random()*3);
        const segH = wLen/segments;
        for (let si=0; si<segments; si++) {
          const sx = wx + Math.sin(si*0.6+wi)*V*1.2;
          const sy = crownY - si*segH;
          const sz = wz + Math.cos(si*0.5+wi)*V*1.2;
          // 枝幹極細（V*0.4 寬）
          jh(new THREE.BoxGeometry(V*0.4, segH, V*0.3),
             varyColor(greens[si%5]), sx, sy-segH/2, sz);
          // 細長葉片（柳樹特徵：窄而長，每段掛 1-2 片）
          if (si % 2 === 0 || Math.random() < 0.4) {
            const leafLen = V*(3+Math.random()*3);  // 長葉
            const leafW   = V*0.3;                  // 極窄
            const leafOff = (Math.random()-0.5)*V*2;
            jh(new THREE.BoxGeometry(leafW, leafLen, V*0.15),
               varyColor(greens[(si+wi)%5]),
               sx+leafOff, sy-segH*0.4, sz+leafOff*0.3);
          }
        }
      }
      const top = jh(new THREE.SphereGeometry(V*3,5,4), varyColor(0x68B050), 0, crownY+V*3, 0);
      top.userData.isPlantTop = true;
      break;
    }
    case 'hemp': {
      // ═══ 大麻：真實比例 — 主莖+對生掌狀葉+花穗頂 ═══
      const V = 0.04;
      // 主莖（綠色帶棱）
      jh(new THREE.CylinderGeometry(V*1.5, V*2.5, V*50, 6), varyColor(0x3A5020), 0, V*25, 0);
      jh(new THREE.BoxGeometry(V*1.0, V*45, V*0.8), varyColor(0x4A6030), V*1, V*24, V*0.5);
      // 莖節
      for (let ni=0; ni<7; ni++) {
        const ny = V*(8+ni*6);
        jh(new THREE.BoxGeometry(V*3.5, V*0.8, V*3.5), varyColor(0x3A5020), 0, ny, 0);
      }
      // 對生掌狀複葉（7對，從下往上逐漸變小）
      const leafGreens = [0x3A6020, 0x4A7030, 0x5A8040, 0x68B040, 0x78C050];
      for (let li=0; li<7; li++) {
        const ly = V*(10+li*5.5);
        const leafScale = 1.0 - li*0.08;  // 越高越小
        const rot = li % 2 === 0 ? 0 : Math.PI/4;  // 交替 90°
        // 每片葉 = 5-7 個細長指狀小葉
        const fingers = 7 - Math.floor(li * 0.5);
        for (let fi=0; fi<fingers; fi++) {
          const fa = rot + (fi - fingers/2) * 0.28;
          const fLen = V*(8+Math.random()*4) * leafScale;
          const fx = Math.cos(fa) * fLen * 0.6;
          const fz = Math.sin(fa) * fLen * 0.6;
          // 指狀小葉（細長方塊）
          jh(new THREE.BoxGeometry(V*0.6, V*0.3, fLen*0.8),
             varyColor(leafGreens[fi%5]),
             fx, ly, fz);
          // 葉尖
          jh(new THREE.BoxGeometry(V*0.4, V*0.2, V*1.2),
             varyColor(leafGreens[(fi+1)%5]),
             fx + Math.cos(fa)*fLen*0.3, ly, fz + Math.sin(fa)*fLen*0.3);
        }
        // 對面也長一組（180°翻轉）
        for (let fi=0; fi<fingers; fi++) {
          const fa = rot + Math.PI + (fi - fingers/2) * 0.28;
          const fLen = V*(8+Math.random()*4) * leafScale;
          const fx = Math.cos(fa) * fLen * 0.6;
          const fz = Math.sin(fa) * fLen * 0.6;
          jh(new THREE.BoxGeometry(V*0.6, V*0.3, fLen*0.8),
             varyColor(leafGreens[fi%5]),
             fx, ly, fz);
        }
      }
      // 花穗頂部（密集圓錐形，淺綠+米黃毛刺）
      const budY = V*48;
      for (let bi=0; bi<8; bi++) {
        const ba = Math.random()*Math.PI*2;
        const br = V*(1+Math.random()*2);
        jh(new THREE.SphereGeometry(V*(1.5+Math.random()), 5, 4),
           varyColor(0x88C050),
           Math.cos(ba)*br, budY+Math.random()*V*6, Math.sin(ba)*br);
      }
      // 花穗毛刺（細小突起）
      for (let ti=0; ti<12; ti++) {
        const ta = Math.random()*Math.PI*2;
        const tr = V*(0.5+Math.random()*2.5);
        jh(new THREE.BoxGeometry(V*0.3, V*(2+Math.random()*2), V*0.3),
           varyColor(0xC8B880),
           Math.cos(ta)*tr, budY+V*(2+Math.random()*6), Math.sin(ta)*tr);
      }
      const top = jh(new THREE.SphereGeometry(V*1.5,5,4), varyColor(0x78C050), 0, budY+V*8, 0);
      top.userData.isPlantTop = true;
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

  // ── S/SS 等級植物：自動加發光 + 放大比例 ──
  if (def.grade === 'S' || def.grade === 'SS') {
    const glowColor = def.grade === 'SS' ? 0xFFD060 : 0xC0E0FF;
    const glowInt   = def.grade === 'SS' ? 0.40 : 0.25;
    g.traverse(c => {
      if (c.isMesh && c.material && !c.material.emissive) {
        c.material.emissive = new THREE.Color(glowColor);
        c.material.emissiveIntensity = glowInt;
      }
    });
    // 加光源
    const pl = new THREE.PointLight(glowColor, def.grade==='SS' ? 2.0 : 1.2, 4.0);
    pl.position.set(0, 1.0, 0);
    g.add(pl);
    // 放大 1.5x (S) / 2.0x (SS)
    const baseScale = def.grade === 'SS' ? 2.0 : 1.5;
    g.scale.setScalar(baseScale);
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
      const catalogScale = def.baseScale ?? 1.0;
      const maxScale = p.isGiant ? catalogScale * 2.5 : catalogScale;
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
    // 第2層不發光，用冰塊代替
    [[-6,0,iceB],[0,0,iceA],[6,0,iceC],[-2,-6,iceA],[2,6,iceB],[0,-4,iceC]].forEach(([gx,gz,gm]) => {
      const bh = V * (2.5 + Math.random()*1.0);
      jh(new THREE.BoxGeometry(V*4.5, bh, V*4.5), gm, gx*V, layer2Y+bh/2, gz*V);
    });

    // ── 第3層（最上）：小頂冠 — 樹頂不發光，只用冰塊 ──
    const layer3Y = crownY + V*8;
    [[-4,-2,iceC],[0,-4,iceA],[4,-2,iceB],[-2,2,iceC],[2,4,iceA],[0,0,iceB]].forEach(([ix,iz,im]) => {
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

  // ════════════════════════════════════════════════════════════════
  //  和風涼亭 (Japanese Pavilion) — 開放式亭子，暗瓦屋頂，紅柱
  // ════════════════════════════════════════════════════════════════
  } else if (id === 'jp_pavilion') {
    const V = 0.08;
    const jh = (geo, mat, x, y, z) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x,y,z);
      m.castShadow=true; m.receiveShadow=true; g.add(m); return m;
    };
    // 色盤
    const pillarD = new THREE.MeshLambertMaterial({ color:0x8B2020 });
    const pillarM = new THREE.MeshLambertMaterial({ color:0xB03030 });
    const roofD   = new THREE.MeshLambertMaterial({ color:0x3A2820 });
    const roofM   = new THREE.MeshLambertMaterial({ color:0x4A3830 });
    const roofL   = new THREE.MeshLambertMaterial({ color:0x5A4840 });
    const baseD   = new THREE.MeshLambertMaterial({ color:0x605050 });
    const baseM   = new THREE.MeshLambertMaterial({ color:0x787070 });
    const floorM  = new THREE.MeshLambertMaterial({ color:0x906848 });
    const lanternM= new THREE.MeshLambertMaterial({ color:0xFFE060, emissive:new THREE.Color(0xFFCC00), emissiveIntensity:0.5 });

    // 石基座 (2層)
    jh(new THREE.BoxGeometry(V*22,V*2,V*22), baseD, 0,V*1,0);
    jh(new THREE.BoxGeometry(V*20,V*2,V*20), baseM, 0,V*3,0);
    // 木地板
    jh(new THREE.BoxGeometry(V*18,V*1,V*18), floorM, 0,V*4.5,0);
    // 四根紅柱
    const pH = V*16;
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => {
      jh(new THREE.BoxGeometry(V*2,pH,V*2), Math.random()>0.5?pillarD:pillarM, sx*V*8,V*5+pH/2,sz*V*8);
      // 柱頭橫樑
      jh(new THREE.BoxGeometry(V*3,V*1,V*2), pillarD, sx*V*8,V*5+pH+V*0.5,sz*V*8);
    });
    // 橫樑連接（四邊）
    const beamY = V*5+pH;
    jh(new THREE.BoxGeometry(V*20,V*1.5,V*1.5), pillarD, 0,beamY,V*-8);
    jh(new THREE.BoxGeometry(V*20,V*1.5,V*1.5), pillarD, 0,beamY,V*8);
    jh(new THREE.BoxGeometry(V*1.5,V*1.5,V*20), pillarD, V*-8,beamY,0);
    jh(new THREE.BoxGeometry(V*1.5,V*1.5,V*20), pillarD, V*8,beamY,0);
    // 屋頂（三層，越上越小，帶翹角）
    const roofBase = beamY + V*2;
    jh(new THREE.BoxGeometry(V*26,V*2,V*26), roofD, 0,roofBase,0);
    jh(new THREE.BoxGeometry(V*24,V*1.5,V*24), roofM, 0,roofBase+V*2,0);
    jh(new THREE.BoxGeometry(V*20,V*2,V*20), roofM, 0,roofBase+V*4,0);
    jh(new THREE.BoxGeometry(V*14,V*2,V*14), roofL, 0,roofBase+V*6,0);
    jh(new THREE.BoxGeometry(V*8,V*2,V*8), roofD, 0,roofBase+V*8,0);
    // 屋脊
    jh(new THREE.BoxGeometry(V*3,V*3,V*3), roofD, 0,roofBase+V*11,0);
    // 翹角（四角突出）
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => {
      jh(new THREE.BoxGeometry(V*4,V*1,V*2), roofD, sx*V*14,roofBase+V*0.5,sz*V*14);
      jh(new THREE.BoxGeometry(V*2,V*1,V*4), roofD, sx*V*14,roofBase+V*0.5,sz*V*14);
    });
    // 燈籠（四角）
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => {
      jh(new THREE.BoxGeometry(V*1.5,V*1.5,V*1.5), lanternM, sx*V*13,roofBase-V*1,sz*V*13);
    });

  // ════════════════════════════════════════════════════════════════
  //  山門 (Temple Gate) — 大型門樓，紅牆暗瓦
  // ════════════════════════════════════════════════════════════════
  } else if (id === 'jp_gate') {
    const V = 0.08;
    const jh = (geo, mat, x, y, z) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x,y,z);
      m.castShadow=true; m.receiveShadow=true; g.add(m); return m;
    };
    const pillarD = new THREE.MeshLambertMaterial({ color:0x8B2020 });
    const pillarM = new THREE.MeshLambertMaterial({ color:0xA82828 });
    const wallD   = new THREE.MeshLambertMaterial({ color:0x9A3030 });
    const wallM   = new THREE.MeshLambertMaterial({ color:0xB84040 });
    const roofD   = new THREE.MeshLambertMaterial({ color:0x382018 });
    const roofM   = new THREE.MeshLambertMaterial({ color:0x4A3028 });
    const roofL   = new THREE.MeshLambertMaterial({ color:0x5A4038 });
    const baseD   = new THREE.MeshLambertMaterial({ color:0x504848 });
    const baseM   = new THREE.MeshLambertMaterial({ color:0x686060 });
    const woodD   = new THREE.MeshLambertMaterial({ color:0x5A3020 });
    const lanternM= new THREE.MeshLambertMaterial({ color:0xFFE060, emissive:new THREE.Color(0xFFCC00), emissiveIntensity:0.5 });

    // 石基座
    jh(new THREE.BoxGeometry(V*30,V*3,V*18), baseD, 0,V*1.5,0);
    jh(new THREE.BoxGeometry(V*28,V*2,V*16), baseM, 0,V*4,0);
    // 台階（正面）
    for (let s=0; s<3; s++) {
      jh(new THREE.BoxGeometry(V*12,V*1.5,V*2), baseM, 0,V*(1+s*1.5),V*(10+s*2));
    }
    // 六根紅柱（正面三根 × 背面三根）
    const pH = V*22;
    [-1,0,1].forEach(xi => {
      [1,-1].forEach(zi => {
        jh(new THREE.BoxGeometry(V*2.5,pH,V*2.5), xi===0?pillarM:pillarD, xi*V*11,V*5+pH/2,zi*V*6);
      });
    });
    // 紅牆板（左右兩側，柱間）
    [-1,1].forEach(zi => {
      jh(new THREE.BoxGeometry(V*8,V*14,V*1.5), wallD, V*-5.5,V*12,zi*V*6);
      jh(new THREE.BoxGeometry(V*8,V*14,V*1.5), wallM, V*5.5,V*12,zi*V*6);
    });
    // 橫樑
    const beamY = V*5+pH;
    jh(new THREE.BoxGeometry(V*28,V*2,V*2), pillarD, 0,beamY,V*-6);
    jh(new THREE.BoxGeometry(V*28,V*2,V*2), pillarD, 0,beamY,V*6);
    jh(new THREE.BoxGeometry(V*2,V*2,V*16), pillarD, V*-11,beamY,0);
    jh(new THREE.BoxGeometry(V*2,V*2,V*16), pillarD, V*11,beamY,0);
    // 斗拱（柱頭裝飾）
    [-1,0,1].forEach(xi => {
      jh(new THREE.BoxGeometry(V*4,V*1,V*14), woodD, xi*V*11,beamY+V*1.5,0);
    });
    // 大屋頂（四層堆疊）
    const rb = beamY + V*3;
    jh(new THREE.BoxGeometry(V*34,V*2,V*22), roofD, 0,rb,0);
    jh(new THREE.BoxGeometry(V*30,V*2,V*20), roofM, 0,rb+V*2.5,0);
    jh(new THREE.BoxGeometry(V*24,V*2.5,V*16), roofM, 0,rb+V*5,0);
    jh(new THREE.BoxGeometry(V*16,V*2,V*10), roofL, 0,rb+V*8,0);
    jh(new THREE.BoxGeometry(V*8,V*2,V*6), roofD, 0,rb+V*10.5,0);
    // 屋脊飾
    jh(new THREE.BoxGeometry(V*4,V*4,V*4), roofD, 0,rb+V*14,0);
    jh(new THREE.BoxGeometry(V*2,V*2,V*2), roofL, 0,rb+V*17,0);
    // 翹角
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => {
      jh(new THREE.BoxGeometry(V*5,V*1.5,V*3), roofD, sx*V*18,rb+V*1,sz*V*12);
      jh(new THREE.BoxGeometry(V*3,V*1.5,V*5), roofD, sx*V*18,rb+V*1,sz*V*12);
    });
    // 燈籠
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => {
      jh(new THREE.BoxGeometry(V*1.8,V*1.8,V*1.8), lanternM, sx*V*16,rb-V*1,sz*V*10);
    });

  // ════════════════════════════════════════════════════════════════
  //  和橋 (Japanese Bridge) — 紅色木橋，裝飾欄杆
  // ════════════════════════════════════════════════════════════════
  } else if (id === 'jp_bridge') {
    const V = 0.08;
    const jh = (geo, mat, x, y, z) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x,y,z);
      m.castShadow=true; m.receiveShadow=true; g.add(m); return m;
    };
    const deckD  = new THREE.MeshLambertMaterial({ color:0x5A3020 });
    const deckM  = new THREE.MeshLambertMaterial({ color:0x6A4030 });
    const railD  = new THREE.MeshLambertMaterial({ color:0x8B2020 });
    const railM  = new THREE.MeshLambertMaterial({ color:0xB03030 });
    const railL  = new THREE.MeshLambertMaterial({ color:0xC84040 });
    const postD  = new THREE.MeshLambertMaterial({ color:0x7A2828 });
    const baseD  = new THREE.MeshLambertMaterial({ color:0x504848 });
    const lanternM= new THREE.MeshLambertMaterial({ color:0xFFE060, emissive:new THREE.Color(0xFFCC00), emissiveIntensity:0.5 });

    // 橋墩（兩端）
    [-1,1].forEach(sx => {
      jh(new THREE.BoxGeometry(V*6,V*6,V*14), baseD, sx*V*18,V*3,0);
    });
    // 橋面（微拱形 — 中段略高）
    const segments = 9;
    for (let i = 0; i < segments; i++) {
      const t = (i / (segments-1)) - 0.5; // -0.5 ~ +0.5
      const arch = (1 - t*t*4) * V*3; // 拋物線拱起
      const xp = (i / (segments-1) - 0.5) * V*40;
      jh(new THREE.BoxGeometry(V*5,V*1.5,V*12), i%2===0?deckD:deckM, xp,V*6+arch,0);
    }
    // 欄杆柱（兩側，每隔一段）
    for (let i = 0; i <= 8; i++) {
      const t = (i / 8) - 0.5;
      const arch = (1 - t*t*4) * V*3;
      const xp = t * V*40;
      [-1,1].forEach(sz => {
        jh(new THREE.BoxGeometry(V*1.5,V*8,V*1.5), i%2===0?postD:railD, xp,V*10+arch,sz*V*6.5);
      });
    }
    // 欄杆橫條（兩側，兩層）
    [-1,1].forEach(sz => {
      // 上橫條
      for (let i = 0; i < 8; i++) {
        const t0 = (i / 8) - 0.5, t1 = ((i+1) / 8) - 0.5;
        const a0 = (1 - t0*t0*4) * V*3, a1 = (1 - t1*t1*4) * V*3;
        const xp = (t0+t1)/2 * V*40;
        jh(new THREE.BoxGeometry(V*5,V*1,V*1), i%2===0?railM:railL, xp,V*13.5+(a0+a1)/2,sz*V*6.5);
        jh(new THREE.BoxGeometry(V*5,V*1,V*1), i%2===0?railD:railM, xp,V*10+(a0+a1)/2,sz*V*6.5);
      }
    });
    // 端部燈籠
    [-1,1].forEach(sx => {
      jh(new THREE.BoxGeometry(V*2,V*2,V*2), lanternM, sx*V*20,V*16,0);
    });

  // ════════════════════════════════════════════════════════════════
  //  門橋 (Gate-Bridge Combo) — 山門+橋接合
  // ════════════════════════════════════════════════════════════════
  } else if (id === 'jp_gate_bridge') {
    const V = 0.08;
    const jh = (geo, mat, x, y, z) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x,y,z);
      m.castShadow=true; m.receiveShadow=true; g.add(m); return m;
    };
    const pillarD = new THREE.MeshLambertMaterial({ color:0x8B2020 });
    const pillarM = new THREE.MeshLambertMaterial({ color:0xA82828 });
    const roofD   = new THREE.MeshLambertMaterial({ color:0x382018 });
    const roofM   = new THREE.MeshLambertMaterial({ color:0x4A3028 });
    const roofL   = new THREE.MeshLambertMaterial({ color:0x5A4038 });
    const deckD   = new THREE.MeshLambertMaterial({ color:0x5A3020 });
    const deckM   = new THREE.MeshLambertMaterial({ color:0x6A4030 });
    const railD   = new THREE.MeshLambertMaterial({ color:0x8B2020 });
    const railM   = new THREE.MeshLambertMaterial({ color:0xB03030 });
    const baseD   = new THREE.MeshLambertMaterial({ color:0x504848 });
    const baseM   = new THREE.MeshLambertMaterial({ color:0x686060 });
    const lanternM= new THREE.MeshLambertMaterial({ color:0xFFE060, emissive:new THREE.Color(0xFFCC00), emissiveIntensity:0.5 });

    // ── 門樓部分（右側）──
    // 基座
    jh(new THREE.BoxGeometry(V*16,V*3,V*14), baseD, V*14,V*1.5,0);
    jh(new THREE.BoxGeometry(V*14,V*2,V*12), baseM, V*14,V*4,0);
    // 四柱
    const gH = V*18;
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => {
      jh(new THREE.BoxGeometry(V*2,gH,V*2), Math.random()>0.5?pillarD:pillarM, V*14+sx*V*5,V*5+gH/2,sz*V*5);
    });
    // 門樓橫樑
    const gbY = V*5+gH;
    jh(new THREE.BoxGeometry(V*14,V*1.5,V*1.5), pillarD, V*14,gbY,V*-5);
    jh(new THREE.BoxGeometry(V*14,V*1.5,V*1.5), pillarD, V*14,gbY,V*5);
    // 門樓屋頂
    jh(new THREE.BoxGeometry(V*22,V*2,V*18), roofD, V*14,gbY+V*2,0);
    jh(new THREE.BoxGeometry(V*18,V*2,V*14), roofM, V*14,gbY+V*4.5,0);
    jh(new THREE.BoxGeometry(V*12,V*2,V*10), roofL, V*14,gbY+V*7,0);
    jh(new THREE.BoxGeometry(V*6,V*2,V*6), roofD, V*14,gbY+V*9.5,0);
    // 屋脊
    jh(new THREE.BoxGeometry(V*3,V*3,V*3), roofD, V*14,gbY+V*12.5,0);
    // 翹角
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => {
      jh(new THREE.BoxGeometry(V*3,V*1,V*2), roofD, V*14+sx*V*12,gbY+V*2.5,sz*V*10);
    });

    // ── 橋面部分（從門樓向左延伸）──
    const bridgeLen = 7;
    for (let i = 0; i < bridgeLen; i++) {
      const xp = V*14 - (i+1)*V*5;
      jh(new THREE.BoxGeometry(V*5.5,V*1.5,V*10), i%2===0?deckD:deckM, xp,V*5,0);
    }
    // 橋墩
    jh(new THREE.BoxGeometry(V*4,V*6,V*10), baseD, V*-14,V*3,0);
    jh(new THREE.BoxGeometry(V*4,V*6,V*10), baseD, V*0,V*3,0);
    // 欄杆柱
    for (let i = 0; i <= bridgeLen; i++) {
      const xp = V*14 - i*V*5;
      [-1,1].forEach(sz => {
        jh(new THREE.BoxGeometry(V*1.2,V*6,V*1.2), railD, xp,V*8.5,sz*V*5.5);
      });
    }
    // 欄杆橫條
    [-1,1].forEach(sz => {
      jh(new THREE.BoxGeometry(V*38,V*0.8,V*0.8), railM, V*-3,V*11,sz*V*5.5);
      jh(new THREE.BoxGeometry(V*38,V*0.8,V*0.8), railD, V*-3,V*8,sz*V*5.5);
    });
    // 燈籠
    [V*14, V*-21].forEach(xp => {
      jh(new THREE.BoxGeometry(V*1.8,V*1.8,V*1.8), lanternM, xp,V*13,0);
    });

  // ════════════════════════════════════════════════════════════════
  //  神社楼門 (Shrine Rōmon Gate) — 雙紅柱+灰瓦大屋頂+匾額+石燈籠塔
  // ════════════════════════════════════════════════════════════════
  } else if (id === 'jp_romon') {
    const V = 0.08;
    const jh = (geo, mat, x, y, z) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x,y,z);
      m.castShadow=true; m.receiveShadow=true; g.add(m); return m;
    };
    // ── 色盤 ──
    const pillarD  = new THREE.MeshLambertMaterial({ color:0x8A2018 });
    const pillarM  = new THREE.MeshLambertMaterial({ color:0xB03028 });
    const pillarL  = new THREE.MeshLambertMaterial({ color:0xC84038 });
    const roofD    = new THREE.MeshLambertMaterial({ color:0x484848 });
    const roofM    = new THREE.MeshLambertMaterial({ color:0x5A5A5A });
    const roofL    = new THREE.MeshLambertMaterial({ color:0x6A6A6A });
    const roofEdge = new THREE.MeshLambertMaterial({ color:0x787878 });
    const stoneD   = new THREE.MeshLambertMaterial({ color:0x9A9088 });
    const stoneM   = new THREE.MeshLambertMaterial({ color:0xB0A898 });
    const stoneL   = new THREE.MeshLambertMaterial({ color:0xC8C0B0 });
    const woodD    = new THREE.MeshLambertMaterial({ color:0x5A3020 });
    const plaque   = new THREE.MeshLambertMaterial({ color:0x6A5830, emissive:new THREE.Color(0x4A3820), emissiveIntensity:0.2 });
    const goldM    = new THREE.MeshLambertMaterial({ color:0xC8A850, emissive:new THREE.Color(0x8A7030), emissiveIntensity:0.3 });
    const lanternBody = new THREE.MeshLambertMaterial({ color:0xC84030 });
    const lanternRoof = new THREE.MeshLambertMaterial({ color:0x505050 });
    const lanternGlow = new THREE.MeshLambertMaterial({ color:0xFFE8A0, emissive:new THREE.Color(0xFFCC60), emissiveIntensity:0.4 });

    // ── 石階段（三層） ──
    for (let s = 0; s < 3; s++) {
      const w = V*(28 - s*2), d = V*(16 - s*1);
      jh(new THREE.BoxGeometry(w, V*1.5, d), s===0?stoneD:stoneM, 0, V*(0.75+s*1.5), V*(s*1));
    }
    // 石板地面
    jh(new THREE.BoxGeometry(V*22, V*1, V*14), stoneL, 0, V*5, 0);

    // ── 雙紅主柱（粗大） ──
    const colH = V*28;
    const colY = V*5.5 + colH/2;
    [-1,1].forEach(sx => {
      // 主柱身（三色交替增加層次）
      for (let cy = 0; cy < 7; cy++) {
        const segH = colH / 7;
        const mat = cy%3===0 ? pillarD : cy%3===1 ? pillarM : pillarL;
        jh(new THREE.BoxGeometry(V*3, segH, V*3), mat, sx*V*7, V*5.5 + segH/2 + cy*segH, 0);
      }
      // 柱礎（石基座）
      jh(new THREE.BoxGeometry(V*5, V*2, V*5), stoneD, sx*V*7, V*5, 0);
    });

    // ── 紅色貫（橫樑）三層 ──
    // 下貫
    jh(new THREE.BoxGeometry(V*22, V*2, V*2.5), pillarD, 0, V*12, 0);
    // 中貫（含左右突出）
    jh(new THREE.BoxGeometry(V*26, V*2, V*2), pillarM, 0, V*20, 0);
    // 左右突出端（木鼻）
    [-1,1].forEach(sx => {
      jh(new THREE.BoxGeometry(V*3, V*2.5, V*3), woodD, sx*V*13.5, V*20, 0);
    });
    // 上貫
    jh(new THREE.BoxGeometry(V*20, V*1.5, V*2), pillarD, 0, V*28, 0);

    // ── 斗拱（bracket 裝飾） ──
    [-1,1].forEach(sx => {
      // 三層遞出
      jh(new THREE.BoxGeometry(V*5, V*1.5, V*4), pillarD, sx*V*7, V*30, 0);
      jh(new THREE.BoxGeometry(V*6, V*1, V*5), pillarM, sx*V*7, V*31.5, 0);
      jh(new THREE.BoxGeometry(V*7, V*1, V*6), woodD, sx*V*7, V*32.5, 0);
    });
    // 中央連接梁
    jh(new THREE.BoxGeometry(V*18, V*1.5, V*5), pillarD, 0, V*32, 0);

    // ── 中央匾額 ──
    jh(new THREE.BoxGeometry(V*6, V*5, V*1), plaque, 0, V*24, V*1.8);
    // 匾額金邊
    jh(new THREE.BoxGeometry(V*6.5, V*0.5, V*1.2), goldM, 0, V*26.8, V*1.8);
    jh(new THREE.BoxGeometry(V*6.5, V*0.5, V*1.2), goldM, 0, V*21.5, V*1.8);
    jh(new THREE.BoxGeometry(V*0.5, V*5, V*1.2), goldM, V*-3.2, V*24, V*1.8);
    jh(new THREE.BoxGeometry(V*0.5, V*5, V*1.2), goldM, V*3.2, V*24, V*1.8);

    // ── 大屋頂（灰瓦，寬大懸挑） ──
    const roofBase = V*33.5;
    // 屋簷底板（最寬）
    jh(new THREE.BoxGeometry(V*36, V*1.5, V*22), roofD, 0, roofBase, 0);
    // 屋簷圓瓦邊飾（小方塊排列）
    for (let ex = -17; ex <= 17; ex += 2) {
      jh(new THREE.BoxGeometry(V*1.2, V*1, V*1), roofEdge, V*ex, roofBase-V*1, V*11.5);
      jh(new THREE.BoxGeometry(V*1.2, V*1, V*1), roofEdge, V*ex, roofBase-V*1, V*-11.5);
    }
    // 瓦面（三層堆疊遞縮）
    jh(new THREE.BoxGeometry(V*32, V*2, V*20), roofM, 0, roofBase+V*2.5, 0);
    jh(new THREE.BoxGeometry(V*26, V*2.5, V*16), roofM, 0, roofBase+V*5, 0);
    jh(new THREE.BoxGeometry(V*18, V*2.5, V*12), roofL, 0, roofBase+V*8, 0);
    jh(new THREE.BoxGeometry(V*10, V*2, V*8), roofD, 0, roofBase+V*11, 0);
    // 屋脊（最頂端水平脊）
    jh(new THREE.BoxGeometry(V*12, V*1.5, V*2), roofD, 0, roofBase+V*13.5, 0);
    // 鬼瓦（屋脊兩端裝飾）
    [-1,1].forEach(sx => {
      jh(new THREE.BoxGeometry(V*3, V*4, V*3), roofD, sx*V*7, roofBase+V*14, 0);
      jh(new THREE.BoxGeometry(V*2, V*2, V*2), roofEdge, sx*V*7, roofBase+V*17, 0);
    });
    // 翹角（四角上翹）
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => {
      jh(new THREE.BoxGeometry(V*5, V*1, V*3), roofD, sx*V*19, roofBase+V*1, sz*V*12);
      jh(new THREE.BoxGeometry(V*3, V*2, V*2), roofEdge, sx*V*20, roofBase+V*2.5, sz*V*12);
    });

    // ── 兩側石燈籠塔 ──
    [-1,1].forEach(sx => {
      const lx = sx * V*16;
      // 燈籠石基座
      jh(new THREE.BoxGeometry(V*5, V*3, V*5), stoneD, lx, V*1.5, 0);
      jh(new THREE.BoxGeometry(V*4.5, V*2, V*4.5), stoneM, lx, V*4, 0);
      // 燈籠柱身
      jh(new THREE.BoxGeometry(V*2, V*6, V*2), stoneM, lx, V*8, 0);
      // 燈籠紅色體（窗口層）
      jh(new THREE.BoxGeometry(V*4, V*5, V*4), lanternBody, lx, V*13.5, 0);
      // 窗口亮光
      [[0,0,1],[0,0,-1],[1,0,0],[-1,0,0]].forEach(([dx,dy,dz]) => {
        jh(new THREE.BoxGeometry(
          dz!==0?V*1.5:V*0.5,
          V*2,
          dx!==0?V*1.5:V*0.5
        ), lanternGlow, lx+dx*V*2.2, V*13.5, dz*V*2.2);
      });
      // 燈籠小屋頂
      jh(new THREE.BoxGeometry(V*6, V*1, V*6), lanternRoof, lx, V*16.5, 0);
      jh(new THREE.BoxGeometry(V*5, V*1, V*5), lanternRoof, lx, V*17.5, 0);
      jh(new THREE.BoxGeometry(V*3, V*1, V*3), lanternRoof, lx, V*18.5, 0);
      // 燈籠尖頂
      jh(new THREE.BoxGeometry(V*1, V*2, V*1), roofEdge, lx, V*20, 0);
      jh(new THREE.BoxGeometry(V*0.6, V*1.5, V*0.6), goldM, lx, V*22, 0);
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
  group.scale.setScalar(def.scale ?? 0.1);
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
const ANIMAL_CAP = 5;    // 場上動物上限（5種）
const ANIMAL_TIER = [
  // lv1 兔: 存活 2hr, 每30min 交配, 每胎 3-6 隻, 商店價低
  { lv:1, name:'小兔', nameAdult:'大兔',   color:0xF5F0EA, accent:0xF0D0D8, sx:0.45,sy:0.45,sz:0.50, speed:1.2,
    lifespan:7200, breedTime:1800, minOffspring:3, maxOffspring:6, nextLv:null,
    price:0, hungerMax:30, hungerRate:0.5 },
  // lv2 狐: 商店可買, 較貴
  { lv:2, name:'狐仔', nameAdult:'狐狸',   color:0xE8904A, accent:0xC87030, sx:0.50,sy:0.42,sz:0.55, speed:1.5,
    lifespan:14400, breedTime:3600, minOffspring:1, maxOffspring:3, nextLv:null,
    price:200, hungerMax:60, hungerRate:0.3 },
  // lv3 鷹: 昂貴
  { lv:3, name:'鷹',   nameAdult:'神鷹',   color:0x8090A0, accent:0xF5C030, sx:0.55,sy:0.35,sz:0.75, speed:1.8,
    lifespan:28800, breedTime:7200, minOffspring:1, maxOffspring:2, nextLv:null,
    price:800, hungerMax:120, hungerRate:0.2 },
  // lv4 格里芬: 極昂貴
  { lv:4, name:'幼獅鷲', nameAdult:'格里芬', color:0xC8A060, accent:0xE0D0A0, sx:0.80,sy:0.65,sz:0.90, speed:1.0,
    lifespan:86400, breedTime:null, minOffspring:0, maxOffspring:0, nextLv:null,
    price:5000, hungerMax:300, hungerRate:0.1 },
  // lv5 紫狐: 大型，發光
  { lv:5, name:'幼紫狐', nameAdult:'妖紫狐', color:0x9060C0, accent:0x4A1880, sx:0.70,sy:0.60,sz:0.75, speed:1.6,
    lifespan:86400, breedTime:null, minOffspring:0, maxOffspring:0, nextLv:null,
    price:8000, hungerMax:200, hungerRate:0.1 },
  // lv6 紅蜘蛛: 大型，中二
  { lv:6, name:'幼紅蛛', nameAdult:'血蛛王', color:0xC02020, accent:0x1A1A1A, sx:0.85,sy:0.45,sz:0.90, speed:1.3,
    lifespan:86400, breedTime:null, minOffspring:0, maxOffspring:0, nextLv:null,
    price:12000, hungerMax:250, hungerRate:0.1 },
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

  if (tierDef.lv === 5) {
    // ═══ 妖紫狐：靈狐造型 — 修長身體、尖臉長吻、三角大耳、巨大飄逸尾巴 ═══
    body.material.emissive = new THREE.Color(0x5028A0);
    body.material.emissiveIntensity = 0.30;
    const V = sc;
    const deepP = new THREE.MeshLambertMaterial({ color:0x38106A, emissive:new THREE.Color(0x2A0850), emissiveIntensity:0.45 });
    const glowP = new THREE.MeshLambertMaterial({ color:0xC090FF, emissive:new THREE.Color(0x9060E0), emissiveIntensity:0.55 });
    const pinkI = new THREE.MeshLambertMaterial({ color:0xE0A0C8, emissive:new THREE.Color(0xD080B0), emissiveIntensity:0.3 });
    const whiteM = new THREE.MeshLambertMaterial({ color:0xE8D8F0 });

    // ── 狐狸頭部：尖臉 + 長吻（不是兔子圓臉）──
    // 頭（比身體窄，前端收尖）
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32*V, 0.28*V, 0.30*V), em);
    head.position.set(0, tierDef.sy*V*0.55, tierDef.sz*V*0.30); body.add(head);
    // 尖吻部（往前突出，漸細）
    const snout1 = new THREE.Mesh(new THREE.BoxGeometry(0.18*V, 0.14*V, 0.16*V), em);
    snout1.position.set(0, tierDef.sy*V*0.42, tierDef.sz*V*0.56); body.add(snout1);
    const snout2 = new THREE.Mesh(new THREE.BoxGeometry(0.12*V, 0.10*V, 0.12*V), em);
    snout2.position.set(0, tierDef.sy*V*0.38, tierDef.sz*V*0.68); body.add(snout2);
    // 鼻尖（黑色小方塊）
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.06*V, 0.05*V, 0.04*V),
      new THREE.MeshLambertMaterial({ color:0x1A1018 }));
    nose.position.set(0, tierDef.sy*V*0.40, tierDef.sz*V*0.76); body.add(nose);
    // 白色嘴下（狐狸特徵）
    const chin = new THREE.Mesh(new THREE.BoxGeometry(0.14*V, 0.06*V, 0.14*V), whiteM);
    chin.position.set(0, tierDef.sy*V*0.32, tierDef.sz*V*0.52); body.add(chin);
    // 白色胸口
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.22*V, 0.18*V, 0.10*V), whiteM);
    chest.position.set(0, tierDef.sy*V*0.10, tierDef.sz*V*0.38); body.add(chest);

    // ── 三角大耳（狐狸最重要特徵）── 尖三角形、向外微張
    [-0.14,0.14].forEach((ox, i) => {
      // 耳朵外框（三角 → 用梯形近似）
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.10*V, 0.32*V, 0.06*V), em);
      ear.position.set(ox*V, tierDef.sy*V*0.82, tierDef.sz*V*0.28);
      ear.rotation.z = (i===0 ? 0.15 : -0.15); // 微微外張
      body.add(ear);
      // 耳尖（深紫色）
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.06*V, 0.12*V, 0.05*V), deepP);
      tip.position.set(ox*V, tierDef.sy*V*1.02, tierDef.sz*V*0.28);
      body.add(tip);
      // 粉色內耳
      const inner = new THREE.Mesh(new THREE.BoxGeometry(0.05*V, 0.22*V, 0.03*V), pinkI);
      inner.position.set(ox*V, tierDef.sy*V*0.85, tierDef.sz*V*0.30);
      body.add(inner);
    });

    // ── 細長眼睛（狐狸是斜長眼，不是圓眼）──
    const eyeGlow = new THREE.MeshLambertMaterial({ color:0xD0A0FF, emissive:new THREE.Color(0xB070F0), emissiveIntensity:0.7 });
    [-0.10,0.10].forEach(ox => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08*V, 0.04*V, 0.04*V), eyeGlow);
      eye.position.set(ox*V, tierDef.sy*V*0.52, tierDef.sz*V*0.48); body.add(eye);
    });

    // ── 四隻腿（纖細，深紫色腳掌）──
    [[-0.12,0.20],[ 0.12,0.20],[-0.12,-0.22],[ 0.12,-0.22]].forEach(([lx,lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07*V, 0.20*V, 0.07*V), em);
      leg.position.set(lx*V, -tierDef.sy*V*0.22, lz*V); body.add(leg);
      // 深紫腳掌
      const paw = new THREE.Mesh(new THREE.BoxGeometry(0.08*V, 0.06*V, 0.09*V), deepP);
      paw.position.set(lx*V, -tierDef.sy*V*0.34, lz*V); body.add(paw);
    });

    // ── 巨大飄逸尾巴（狐狸靈魂！3段漸大+發光尾尖）──
    // 尾根（細）
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.10*V, 0.10*V, 0.14*V), em);
    t1.position.set(0, tierDef.sy*V*0.15, -tierDef.sz*V*0.52); body.add(t1);
    // 尾中段（膨脹）
    const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.18*V, 0.20*V, 0.22*V), em);
    t2.position.set(0, tierDef.sy*V*0.28, -tierDef.sz*V*0.68);
    t2.rotation.x = -0.3; body.add(t2);
    // 尾末段（最大，向上翹起）
    const t3 = new THREE.Mesh(new THREE.SphereGeometry(0.18*V, 7, 6), glowP);
    t3.position.set(0, tierDef.sy*V*0.50, -tierDef.sz*V*0.78); body.add(t3);
    // 尾尖（深紫發光）
    const t4 = new THREE.Mesh(new THREE.SphereGeometry(0.12*V, 6, 5), deepP);
    t4.position.set(0, tierDef.sy*V*0.65, -tierDef.sz*V*0.82); body.add(t4);
    // 尾巴發光粒子
    for (let pi=0; pi<5; pi++) {
      const spark = new THREE.Mesh(new THREE.BoxGeometry(0.03*V, 0.03*V, 0.03*V),
        new THREE.MeshLambertMaterial({ color:0xE0C0FF, emissive:new THREE.Color(0xC0A0F0), emissiveIntensity:0.8, transparent:true, opacity:0.6 }));
      spark.position.set(
        (Math.random()-0.5)*0.15*V,
        tierDef.sy*V*(0.35+Math.random()*0.35),
        -tierDef.sz*V*(0.60+Math.random()*0.25)
      ); body.add(spark);
    }

    // ── 脖子繩結+鈴鐺（參照圖片）──
    const rope = new THREE.Mesh(new THREE.BoxGeometry(0.30*V, 0.04*V, 0.04*V),
      new THREE.MeshLambertMaterial({ color:0xE0A0C8 }));
    rope.position.set(0, tierDef.sy*V*0.30, tierDef.sz*V*0.35); body.add(rope);
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.04*V, 6, 5),
      new THREE.MeshLambertMaterial({ color:0xD4AA30, emissive:new THREE.Color(0xA08010), emissiveIntensity:0.3 }));
    bell.position.set(0, tierDef.sy*V*0.24, tierDef.sz*V*0.38); body.add(bell);

    // ── 身體發光 ──
    const ptLight = new THREE.PointLight(0x8050C0, 1.5, 3.5);
    ptLight.position.set(0, tierDef.sy*V*0.3, 0); body.add(ptLight);

  } else if (tierDef.lv === 6) {
    // ═══ 血蛛王：大型紅蜘蛛 — 紅身黑紋，8 隻腳，屁股有中二黑色圖案 ═══
    body.material.emissive = new THREE.Color(0x600808);
    body.material.emissiveIntensity = 0.15;
    const blkM = new THREE.MeshLambertMaterial({ color:0x1A1A1A });
    const redD = new THREE.MeshLambertMaterial({ color:0x901818 });
    const redL = new THREE.MeshLambertMaterial({ color:0xD03030 });
    const eyeR = new THREE.MeshLambertMaterial({ color:0xFF2020, emissive:new THREE.Color(0xCC0000), emissiveIntensity:0.6 });
    // 腹部（後面大球）
    const abdomen = new THREE.Mesh(
      new THREE.SphereGeometry(tierDef.sz*sc*0.55, 8, 6), redD);
    abdomen.position.set(0, tierDef.sy*sc*0.1, -tierDef.sz*sc*0.42);
    abdomen.castShadow = true; body.add(abdomen);
    // 腹部黑色中二圖案（骷髏形：V字+圓）
    const mark1 = new THREE.Mesh(new THREE.BoxGeometry(0.16*sc, 0.04*sc, 0.12*sc), blkM);
    mark1.position.set(0, tierDef.sy*sc*0.22, -tierDef.sz*sc*0.68); body.add(mark1);
    const mark2 = new THREE.Mesh(new THREE.BoxGeometry(0.08*sc, 0.08*sc, 0.04*sc), blkM);
    mark2.position.set(0, tierDef.sy*sc*0.14, -tierDef.sz*sc*0.70); body.add(mark2);
    // V 字紋
    const markV1 = new THREE.Mesh(new THREE.BoxGeometry(0.04*sc, 0.12*sc, 0.04*sc), blkM);
    markV1.position.set(-0.06*sc, tierDef.sy*sc*0.28, -tierDef.sz*sc*0.66);
    markV1.rotation.z = 0.4; body.add(markV1);
    const markV2 = new THREE.Mesh(new THREE.BoxGeometry(0.04*sc, 0.12*sc, 0.04*sc), blkM);
    markV2.position.set(0.06*sc, tierDef.sy*sc*0.28, -tierDef.sz*sc*0.66);
    markV2.rotation.z = -0.4; body.add(markV2);
    // 黑色條紋（腹部側面）
    [-0.10,0.10].forEach(ox => {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.03*sc, 0.04*sc, 0.20*sc), blkM);
      stripe.position.set(ox*sc, tierDef.sy*sc*0.08, -tierDef.sz*sc*0.42); body.add(stripe);
    });
    // 8 隻腳（左4右4，交錯彎曲）
    for (let li=0; li<4; li++) {
      [-1,1].forEach(side => {
        const angle = (li-1.5) * 0.35;
        const legLen = (0.22 + li*0.04) * sc;
        // 上段（靠身體）
        const upper = new THREE.Mesh(new THREE.BoxGeometry(0.04*sc, legLen, 0.04*sc), blkM);
        upper.position.set(
          side * (tierDef.sx*sc*0.48 + 0.02),
          tierDef.sy*sc*0.05,
          (li-1.5)*0.12*sc
        );
        upper.rotation.z = side * 0.6;
        upper.rotation.y = angle; body.add(upper);
        // 下段（接地）
        const lower = new THREE.Mesh(new THREE.BoxGeometry(0.03*sc, legLen*0.8, 0.03*sc), redD);
        lower.position.set(
          side * (tierDef.sx*sc*0.48 + legLen*0.5),
          -tierDef.sy*sc*0.15,
          (li-1.5)*0.12*sc
        );
        lower.rotation.z = side * -0.3; body.add(lower);
      });
    }
    // 螯牙（前面 2 顆）
    [-0.06,0.06].forEach(ox => {
      const fang = new THREE.Mesh(new THREE.BoxGeometry(0.04*sc, 0.10*sc, 0.04*sc), blkM);
      fang.position.set(ox*sc, -tierDef.sy*sc*0.15, tierDef.sz*sc*0.50);
      fang.rotation.z = ox > 0 ? -0.3 : 0.3; body.add(fang);
    });
    // 8 顆紅眼（蜘蛛經典排列：2大+6小）
    [-0.06,0.06].forEach(ox => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06*sc, 0.06*sc, 0.04*sc), eyeR);
      eye.position.set(ox*sc, tierDef.sy*sc*0.18, tierDef.sz*sc*0.48); body.add(eye);
    });
    [[-0.10,0.24],[-0.04,0.26],[0.04,0.26],[0.10,0.24],[-0.08,0.12],[0.08,0.12]].forEach(([ex,ey]) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.03*sc, 0.03*sc, 0.03*sc), eyeR);
      eye.position.set(ex*sc, tierDef.sy*sc*ey, tierDef.sz*sc*0.49); body.add(eye);
    });

  } else if (tierDef.lv === 4) {
    // ═══ 格里芬：鷹頭獅身有翼獸 ═══
    // 鷹嘴
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06*sc, 0.18*sc, 4), new THREE.MeshLambertMaterial({ color:0xE0A830 }));
    beak.rotation.x = -Math.PI/2;
    beak.position.set(0, tierDef.sy*sc*0.15, tierDef.sz*sc*0.55); body.add(beak);
    // 鷹冠（頭頂羽毛）
    [-0.06,0,0.06].forEach((ox,i) => {
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.04*sc, 0.12*sc, 0.03*sc),
        new THREE.MeshLambertMaterial({ color:[0xC89040,0xD4A050,0xB88030][i] }));
      crest.position.set(ox*sc, tierDef.sy*sc*0.65, 0.05*sc); body.add(crest);
    });
    // 大翅膀（展開，左右各一）
    [-1,1].forEach(side => {
      const wingM = new THREE.MeshLambertMaterial({ color: tierDef.accent });
      // 內翼
      const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.30*sc, 0.04*sc, 0.20*sc), wingM);
      w1.position.set(side*0.30*sc, tierDef.sy*sc*0.3, -0.05*sc);
      w1.rotation.z = side*0.3; body.add(w1);
      // 外翼
      const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.22*sc, 0.03*sc, 0.16*sc),
        new THREE.MeshLambertMaterial({ color:0xD0C090 }));
      w2.position.set(side*0.50*sc, tierDef.sy*sc*0.38, -0.08*sc);
      w2.rotation.z = side*0.45; body.add(w2);
      // 翼尖
      const w3 = new THREE.Mesh(new THREE.BoxGeometry(0.14*sc, 0.02*sc, 0.10*sc),
        new THREE.MeshLambertMaterial({ color:0xC0B080 }));
      w3.position.set(side*0.65*sc, tierDef.sy*sc*0.44, -0.10*sc);
      w3.rotation.z = side*0.55; body.add(w3);
    });
    // 獅尾
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05*sc, 0.05*sc, 0.22*sc), em);
    tail.position.set(0, tierDef.sy*sc*0.1, -tierDef.sz*sc*0.5-0.08*sc); body.add(tail);
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.06*sc,5,4),
      new THREE.MeshLambertMaterial({ color:0xC89040 }));
    tuft.position.set(0, tierDef.sy*sc*0.1, -tierDef.sz*sc*0.5-0.20*sc); body.add(tuft);
    // 前爪
    [-0.15,0.15].forEach(ox => {
      const claw = new THREE.Mesh(new THREE.BoxGeometry(0.06*sc, 0.12*sc, 0.06*sc),
        new THREE.MeshLambertMaterial({ color:0xE0A830 }));
      claw.position.set(ox*sc, -tierDef.sy*sc*0.35, tierDef.sz*sc*0.3); body.add(claw);
    });
    // 微發光
    body.material.emissive = new THREE.Color(0x806020);
    body.material.emissiveIntensity = 0.15;
  } else if (tierDef.lv === 3) {
    // Hawks get wing stubs instead of ears
    [-0.1,0.1].forEach(ox => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.22*sc,0.05*sc,0.12*sc), acM);
      wing.position.set(ox, tierDef.sy*sc*0.2, 0); body.add(wing);
    });
  } else if (tierDef.lv === 1) {
    // ── 兔子 Grow-a-Garden 風格：圓潤 + 粉色內耳 + 圓尾 ──
    [-0.08,0.08].forEach(ox => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.08*sc, 0.22*sc, 0.06*sc), em);
      ear.position.set(ox*sc, tierDef.sy*sc*0.65, 0.06*sc); body.add(ear);
      // 粉色內耳
      const inner = new THREE.Mesh(new THREE.BoxGeometry(0.04*sc, 0.16*sc, 0.03*sc),
        new THREE.MeshLambertMaterial({ color: 0xF0B0C0 }));
      inner.position.set(ox*sc, tierDef.sy*sc*0.65, 0.085*sc); body.add(inner);
    });
    // 粉紅鼻子
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.04*sc, 0.03*sc, 0.04*sc),
      new THREE.MeshLambertMaterial({ color: 0xF0A0B0 }));
    nose.position.set(0, tierDef.sy*sc*0.08, tierDef.sz*sc*0.52); body.add(nose);
    // 圓尾巴
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.06*sc, 5, 4), em);
    tail.position.set(0, tierDef.sy*sc*0.1, -tierDef.sz*sc*0.52); body.add(tail);
  } else {
    [-0.1,0.1].forEach(ox => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.10*sc,0.18*sc,0.08*sc), em);
      ear.position.set(ox, tierDef.sy*sc*0.6, 0.1*sc); body.add(ear);
    });
  }
  // 眼睛（格里芬已在上面處理嘴，其他動物加眼睛）
  if (tierDef.lv !== 4) {
    [-0.1,0.1].forEach(ox => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06*sc,0.06*sc,0.06*sc), eym);
      eye.position.set(ox, tierDef.sy*sc*0.15, tierDef.sz*sc*0.5+0.01); body.add(eye);
    });
  } else {
    // 格里芬鷹眼（金色/琥珀色）
    const hawkEye = new THREE.MeshLambertMaterial({ color:0xE0A020, emissive:new THREE.Color(0xA07010), emissiveIntensity:0.3 });
    [-0.08,0.08].forEach(ox => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05*sc,0.05*sc,0.05*sc), hawkEye);
      eye.position.set(ox*sc, tierDef.sy*sc*0.25, tierDef.sz*sc*0.5+0.01); body.add(eye);
    });
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
    harvestCount:  0,     // 採收計數（滿 5 顆休息）
    speed:         tierDef.speed * 0.6,
    targetX:       (Math.random()-0.5)*14,
    targetZ:       (Math.random()-0.5)*14,
    changeTimer:   0,
    changeInterval: 3+Math.random()*4,
    isIdle: false, idleTimer: 0,
  });
}

// 餵食寵物
function feedAnimal(animalData) {
  // 找倉庫裡最高級的作物餵食
  const gradeOrder = ['SS','S','A','B','C','D'];
  for (const grade of gradeOrder) {
    for (const [k, def] of Object.entries(plantCatalog)) {
      if (def.grade !== grade || (inventory[k]||0) <= 0) continue;
      inventory[k]--;
      const feedAmount = def.sell * 2;  // 越值錢的作物恢復越多飽食度
      animalData.hunger = Math.min(animalData.tierDef.hungerMax, animalData.hunger + feedAmount);
      animalData.isHungry = animalData.hunger > animalData.tierDef.hungerMax * 0.2;
      updateUI();
      showToast(`🍖 ${def.icon} → ${animalData.tierDef.nameAdult} 飽食度 +${feedAmount}`);
      return true;
    }
  }
  showToast('🍽️ 倉庫沒有作物可以餵食！');
  return false;
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

    // Breeding: same-level adults nearby → spawn offspring (same level)
    if (!a.isBaby && a.breedCooldown <= 0 && a.tierDef.breedTime !== null && animals.length < ANIMAL_CAP) {
      for (let bi = 0; bi < animals.length; bi++) {
        if (bi === ai) continue;
        const b = animals[bi];
        if (b.lv !== a.lv || b.isBaby || b.breedCooldown > 0) continue;
        const dx = b.mesh.position.x - a.mesh.position.x;
        const dz = b.mesh.position.z - a.mesh.position.z;
        if (Math.sqrt(dx*dx+dz*dz) < 1.5) {
          // 生 minOffspring ~ maxOffspring 隻同等級幼獸
          const count = a.tierDef.minOffspring +
            Math.floor(Math.random() * (a.tierDef.maxOffspring - a.tierDef.minOffspring + 1));
          const spawnCount = Math.min(count, ANIMAL_CAP - animals.length);
          const nx = (a.mesh.position.x + b.mesh.position.x) / 2;
          const nz = (a.mesh.position.z + b.mesh.position.z) / 2;
          for (let si = 0; si < spawnCount; si++) {
            toSpawn.push({ lv: a.lv, x: nx + (Math.random()-0.5)*2, z: nz + (Math.random()-0.5)*2 });
          }
          a.breedCooldown = a.tierDef.breedTime;
          b.breedCooldown = a.tierDef.breedTime;
          showToast(`🐣 ${a.tierDef.name} ×${spawnCount} 誕生！`);
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
        a.harvestCount++;
        showToast(`🐾 ${a.tierDef.nameAdult}が収穫した！(${a.harvestCount}/5)`);
        if (a.harvestCount >= 5) {
          // 採滿 5 顆 → 休息 3 秒
          a.harvestCount = 0;
          a.isIdle = true; a.idleTimer = 3; a.changeTimer = 0;
        } else {
          // 每次採收短暫停頓 0.5 秒
          a.isIdle = true; a.idleTimer = 0.5; a.changeTimer = 0;
        }
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
//  ═══ 一樓 ═══  Player Character (Chibi Snowboard Girl)
// ============================================================
function buildPlayerMesh() {
  const g = new THREE.Group();
  const V = 0.06; // voxel unit for player (~1.5 total height)
  const jh = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.castShadow = true; g.add(m); return m;
  };

  // ── Head (chibi: ~0.6 units, 40% of 1.5) ──
  const skinM  = new THREE.MeshLambertMaterial({ color: 0xFDE4C8 });
  const helmM  = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const gogM   = new THREE.MeshLambertMaterial({ color: 0xF0F0F0 });
  const gogL   = new THREE.MeshLambertMaterial({ color: 0xA0D0E8, transparent:true, opacity:0.7 });
  const hairM  = new THREE.MeshLambertMaterial({ color: 0x6A3A20 });
  const eyeM   = new THREE.MeshLambertMaterial({ color: 0x2A2020 });
  const mouthM = new THREE.MeshLambertMaterial({ color: 0xD07060 });

  // Head sphere (chibi large)
  jh(new THREE.BoxGeometry(V*9, V*9, V*8), skinM, 0, 1.20, 0);
  // Helmet (top of head)
  jh(new THREE.BoxGeometry(V*10, V*5, V*9), helmM, 0, 1.42, 0);
  // Goggles on helmet top
  jh(new THREE.BoxGeometry(V*8, V*2.5, V*2), gogM, 0, 1.52, V*4);
  jh(new THREE.BoxGeometry(V*3, V*2, V*1), gogL, -V*2, 1.52, V*5);
  jh(new THREE.BoxGeometry(V*3, V*2, V*1), gogL,  V*2, 1.52, V*5);
  // Eyes
  jh(new THREE.BoxGeometry(V*1.5, V*1.5, V*1), eyeM, -V*2, 1.18, V*4.5);
  jh(new THREE.BoxGeometry(V*1.5, V*1.5, V*1), eyeM,  V*2, 1.18, V*4.5);
  // Mouth
  jh(new THREE.BoxGeometry(V*2, V*0.8, V*0.5), mouthM, 0, 1.10, V*4.5);
  // Braids (two brown braids hanging down)
  [-V*4.5, V*4.5].forEach(bx => {
    for (let i = 0; i < 5; i++) {
      jh(new THREE.BoxGeometry(V*1.5, V*2, V*1.5), hairM, bx, 1.15 - i*V*2, -V*2);
    }
    // Braid tie
    jh(new THREE.BoxGeometry(V*2, V*1, V*2), new THREE.MeshLambertMaterial({color:0xE06030}), bx, 1.15-5*V*2, -V*2);
  });
  // Hair bangs
  jh(new THREE.BoxGeometry(V*9, V*2, V*2), hairM, 0, 1.35, V*4);

  // ── Body (chibi: short ~0.5 units) ──
  const jacketM = new THREE.MeshLambertMaterial({ color: 0xE86820 }); // orange
  const shirtM  = new THREE.MeshLambertMaterial({ color: 0xF0E0C8 }); // cream
  const zipM    = new THREE.MeshLambertMaterial({ color: 0xC8C8C8 }); // zip

  // Torso
  jh(new THREE.BoxGeometry(V*8, V*7, V*5), jacketM, 0, 0.78, 0);
  // Shirt peek (under jacket)
  jh(new THREE.BoxGeometry(V*3, V*2, V*1), shirtM, 0, 0.70, V*2.8);
  // Zip line
  jh(new THREE.BoxGeometry(V*0.8, V*6, V*0.5), zipM, 0, 0.78, V*2.6);

  // ── Arms ──
  [-V*5, V*5].forEach(ax => {
    jh(new THREE.BoxGeometry(V*2.5, V*6, V*3), jacketM, ax, 0.76, 0);
    // Hands (skin)
    jh(new THREE.BoxGeometry(V*2, V*2, V*2.5), skinM, ax, 0.58, 0);
  });

  // ── Legs (orange pants) ──
  const pantsM = new THREE.MeshLambertMaterial({ color: 0xE07020 });
  const pantsD = new THREE.MeshLambertMaterial({ color: 0x3A3030 }); // dark accents
  const bootM  = new THREE.MeshLambertMaterial({ color: 0x222222 });
  [-V*2.5, V*2.5].forEach(lx => {
    jh(new THREE.BoxGeometry(V*3, V*5, V*3.5), pantsM, lx, 0.45, 0);
    jh(new THREE.BoxGeometry(V*3.2, V*1, V*0.8), pantsD, lx, 0.42, V*1.8); // dark accent stripe
    // Boots
    jh(new THREE.BoxGeometry(V*3.2, V*3, V*4), bootM, lx, 0.20, V*0.5);
  });

  // ── Snowboard (held at side, flat black) ──
  const boardMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
  const boardTextM = new THREE.MeshLambertMaterial({ color: 0xE0E0E0 });
  const boardGrp = new THREE.Group();
  const boardBody = new THREE.Mesh(new THREE.BoxGeometry(V*2, V*16, V*0.8), boardMat);
  boardBody.position.set(0, 0.75, 0); boardBody.castShadow = true; boardGrp.add(boardBody);
  // Board nose/tail curve
  const boardNose = new THREE.Mesh(new THREE.BoxGeometry(V*1.5, V*1.5, V*0.8), boardMat);
  boardNose.position.set(0, 1.23, 0); boardGrp.add(boardNose);
  const boardTail = new THREE.Mesh(new THREE.BoxGeometry(V*1.5, V*1.2, V*0.8), boardMat);
  boardTail.position.set(0, 0.27, 0); boardGrp.add(boardTail);
  // "NOVEMBER" text marker (small white block)
  const boardLabel = new THREE.Mesh(new THREE.BoxGeometry(V*1, V*3, V*0.3), boardTextM);
  boardLabel.position.set(0, 0.80, V*0.5); boardGrp.add(boardLabel);
  boardGrp.position.set(V*7, 0, -V*1);
  boardGrp.rotation.z = 0.08;
  g.add(boardGrp);

  g.userData.boardGrp = boardGrp;
  return g;
}

// ── Snowboard under feet (for skiing mode) ──
function buildSkiBoard() {
  const g = new THREE.Group();
  const V = 0.06;
  const boardMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
  // Flat board under feet
  const body = new THREE.Mesh(new THREE.BoxGeometry(V*4, V*0.8, V*18), boardMat);
  body.position.set(0, -0.02, 0); body.castShadow = true; g.add(body);
  // Nose curve
  const nose = new THREE.Mesh(new THREE.BoxGeometry(V*3, V*0.8, V*2), boardMat);
  nose.position.set(0, 0, V*9.5); g.add(nose);
  // Tail curve
  const tail = new THREE.Mesh(new THREE.BoxGeometry(V*3, V*0.8, V*1.5), boardMat);
  tail.position.set(0, 0, -V*9.5); g.add(tail);
  return g;
}

// Spawn the player
function initPlayer() {
  playerMesh = buildPlayerMesh();
  playerMesh.position.set(0, 0, 2);
  playerPos.x = 0; playerPos.y = 0; playerPos.z = 2;
  scene.add(playerMesh);
}
initPlayer();

// ── Mountain terrain height lookup ──
const mountainHeightMap = [];   // will be filled by buildSkiMountain
function getMountainHeight(x, z) {
  // Approximate height from the ski mountain geometry
  if (z > SNOW_ZONE_Z || z < -35) return 0;
  // Mountain profile: gentle slope from z=-8 to peak at z=-28, Y=12
  const peakZ = -28, peakY = 12, baseZ = SNOW_ZONE_Z, endZ = -35;
  const halfW = 6; // mountain width
  if (Math.abs(x) > halfW + 2) return 0;
  const widthFactor = Math.max(0, 1 - Math.pow(Math.abs(x) / (halfW + 1), 2));
  let h = 0;
  if (z >= baseZ && z > peakZ) {
    // ascending slope
    const t = (baseZ - z) / (baseZ - peakZ);
    h = peakY * Math.pow(t, 0.8);
  } else if (z <= peakZ && z >= endZ) {
    // descending back side (steep)
    const t = (z - peakZ) / (endZ - peakZ);
    h = peakY * (1 - t * t);
  }
  return h * widthFactor;
}

// ── Player update (called each frame) ──
function updatePlayer(delta, now) {
  if (!playerMesh) return;

  if (playerState === 'walking') {
    let dx = 0, dz = 0;
    let moving = false;

    // ① WASD 手動控制（有按鍵時優先）
    if (keysDown['w'] || keysDown['arrowup'])    dz -= 1;
    if (keysDown['s'] || keysDown['arrowdown'])  dz += 1;
    if (keysDown['a'] || keysDown['arrowleft'])  dx -= 1;
    if (keysDown['d'] || keysDown['arrowright']) dx += 1;
    const hasKeyInput = dx !== 0 || dz !== 0;

    if (hasKeyInput) {
      playerTarget = null;  // 手動操控 → 取消點擊目標
      const len = Math.sqrt(dx*dx + dz*dz);
      dx /= len; dz /= len;
      moving = true;

    // ② 點擊目標移動
    } else if (playerTarget) {
      dx = playerTarget.x - playerPos.x;
      dz = playerTarget.z - playerPos.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      if (dist < 0.3) {
        playerTarget = null;  // 到達
      } else {
        dx /= dist; dz /= dist;
        moving = true;
      }

    // ③ AI 自由漫步（沒人操控時自己走）
    } else {
      playerWanderTimer += delta;
      playerIdleTimer += delta;

      // 隨機停下來做表情動作
      if (playerIdleAction !== 'idle') {
        playerIdleActionTimer -= delta;
        if (playerIdleActionTimer <= 0) {
          playerIdleAction = 'idle';
          playerMesh.scale.setScalar(1);  // 復原
        }
      }

      if (playerWanderTimer > PLAYER_WANDER_INTERVAL) {
        playerWanderTimer = 0;

        // 30% 機率停下做表情
        if (Math.random() < 0.3 && playerIdleAction === 'idle') {
          const actions = ['happy','plant','squat'];
          playerIdleAction = actions[Math.floor(Math.random()*3)];
          playerIdleActionTimer = 1.5 + Math.random();
          // 表情動畫
          if (playerIdleAction === 'happy') {
            showToast('😊');
            playerMesh.scale.set(1, 1.08, 1);  // 開心微跳
          } else if (playerIdleAction === 'plant') {
            showToast('🌱');
            playerMesh.scale.set(1, 0.85, 1);  // 蹲下種菜
          } else if (playerIdleAction === 'squat') {
            showToast('💤');
            playerMesh.scale.set(1, 0.80, 1);  // 蹲下休息
          }
        } else {
          // 隨機選新目的地（在農場範圍內）
          playerTarget = {
            x: (Math.random()-0.5) * 16,
            z: (Math.random()-0.5) * 16
          };
        }
      }
    }

    if (moving) {
      playerPos.x += dx * PLAYER_SPEED * delta;
      playerPos.z += dz * PLAYER_SPEED * delta;
      playerFacing = Math.atan2(dx, dz);
      playerBobT += delta * 8;
      playerIdleAction = 'idle';
      playerMesh.scale.setScalar(1);
    }

    // Terrain height follow
    const terrainH = getMountainHeight(playerPos.x, playerPos.z);
    playerPos.y = terrainH;
    // Bob while moving
    const bobY = moving ? Math.abs(Math.sin(playerBobT)) * 0.08 : 0;
    playerMesh.position.set(playerPos.x, playerPos.y + bobY, playerPos.z);
    playerMesh.rotation.y = playerFacing;

    // Check if reached mountain top → start skiing
    if (playerPos.y > 10 && playerPos.z < -20) {
      startSkiing();
    }

    // Show/hide held board based on state
    if (playerMesh.userData.boardGrp) playerMesh.userData.boardGrp.visible = true;

  } else if (playerState === 'skiing') {
    // Auto-slide downhill (toward +Z, following mountain slope)
    const slope = getMountainHeight(playerPos.x, playerPos.z) - getMountainHeight(playerPos.x, playerPos.z + 0.3);
    const slopeFactor = Math.max(0.5, slope * 8);
    playerVel.z += SKI_ACCEL * slopeFactor * delta;
    playerVel.z = Math.min(playerVel.z, SKI_MAX_SPEED);

    // Slight steering with A/D
    if (keysDown['a'] || keysDown['arrowleft'])  playerVel.x -= 4 * delta;
    if (keysDown['d'] || keysDown['arrowright']) playerVel.x += 4 * delta;
    playerVel.x *= 0.95; // friction

    playerPos.x += playerVel.x * delta;
    playerPos.z += playerVel.z * delta;

    // Y follows terrain
    const terrainH = getMountainHeight(playerPos.x, playerPos.z);
    // Jump ramp detection
    let onRamp = false;
    placedObjects.forEach(o => {
      if (o.furnId !== 'jump_ramp' && o.furnId !== 'big_jump') return;
      const ddx = playerPos.x - o.mesh.position.x;
      const ddz = playerPos.z - o.mesh.position.z;
      if (Math.abs(ddx) < 1.5 && Math.abs(ddz) < 1.5) {
        onRamp = true;
        const jumpPower = o.furnId === 'big_jump' ? 6 : 3;
        if (playerVel.y <= 0) playerVel.y = jumpPower;
      }
    });

    // Gravity for jumps
    if (playerPos.y > terrainH + 0.1) {
      playerVel.y -= 15 * delta;  // gravity
    } else {
      playerVel.y = 0;
      playerPos.y = terrainH;
    }
    playerPos.y += playerVel.y * delta;
    playerPos.y = Math.max(playerPos.y, terrainH);

    playerFacing = Math.atan2(playerVel.x, playerVel.z);
    playerMesh.position.set(playerPos.x, playerPos.y, playerPos.z);
    playerMesh.rotation.y = playerFacing;
    // Tilt forward slightly while skiing
    playerMesh.rotation.x = -0.15;

    // End skiing when back at flat ground
    if (playerPos.z > SNOW_ZONE_Z - 1 && playerPos.y < 0.5) {
      endSkiing();
    }

  } else if (playerState === 'riding_lift') {
    // Simple auto-ride up the mountain
    playerPos.z -= 2 * delta;
    playerPos.y = getMountainHeight(playerPos.x, playerPos.z) + 2;
    playerMesh.position.set(playerPos.x, playerPos.y, playerPos.z);
    if (playerPos.z < -25) {
      playerState = 'walking';
      playerPos.y = getMountainHeight(playerPos.x, playerPos.z);
      showToast('🏔️ 山頂到着！滑り出そう！');
    }
  }

  // Camera follow（只在滑雪時自動跟隨，平時不鎖鏡頭）
  if (playerState === 'skiing' || playerState === 'riding_lift') {
    const targetPos = new THREE.Vector3(playerPos.x, playerPos.y + 2, playerPos.z);
    controls.target.lerp(targetPos, 0.05);
    const camOffset = new THREE.Vector3(
      playerPos.x + Math.sin(playerFacing + Math.PI) * 8,
      playerPos.y + 8,
      playerPos.z + Math.cos(playerFacing + Math.PI) * 8
    );
    camera.position.lerp(camOffset, 0.03);
  }
}

function startSkiing() {
  playerState = 'skiing';
  playerVel.x = 0; playerVel.y = 0; playerVel.z = 1;  // start sliding toward +Z
  // Attach snowboard under feet
  if (!playerBoardMesh) {
    playerBoardMesh = buildSkiBoard();
  }
  playerMesh.add(playerBoardMesh);
  playerBoardMesh.position.set(0, 0.05, 0);
  // Hide held board
  if (playerMesh.userData.boardGrp) playerMesh.userData.boardGrp.visible = false;
  showToast('🏂 滑降開始！');
}

function endSkiing() {
  playerState = 'walking';
  playerVel.x = 0; playerVel.y = 0; playerVel.z = 0;
  playerMesh.rotation.x = 0;
  // Remove board from feet
  if (playerBoardMesh && playerBoardMesh.parent) {
    playerMesh.remove(playerBoardMesh);
  }
  // Show held board again
  if (playerMesh.userData.boardGrp) playerMesh.userData.boardGrp.visible = true;
  showToast('🚶 歩行モードに戻った');
}

// ============================================================
//  ═══ 一樓 ═══  Ski Mountain (playable terrain)
// ============================================================
function buildSkiMountain() {
  const mtnGroup = new THREE.Group();
  mtnGroup.name = 'skiMountain';

  const snowA = new THREE.MeshLambertMaterial({ color: 0xF0F8FF });
  const snowB = new THREE.MeshLambertMaterial({ color: 0xE0ECF8 });
  const snowC = new THREE.MeshLambertMaterial({ color: 0xD0E0F0 });
  const snowD = new THREE.MeshLambertMaterial({ color: 0xC8D8E8 });
  const rockA = new THREE.MeshLambertMaterial({ color: 0x8898A8 });
  const rockB = new THREE.MeshLambertMaterial({ color: 0x6A7888 });
  const treeSnowA = new THREE.MeshLambertMaterial({ color: 0x3A6838 });
  const treeSnowB = new THREE.MeshLambertMaterial({ color: 0xD0E8E0 });
  const snows = [snowA, snowB, snowC, snowD];

  // Build mountain as layered blocks
  const peakZ = -28, peakY = 12;
  const baseZ = SNOW_ZONE_Z; // -8
  const endZ  = -35;
  const halfW = 6;

  // Generate terrain blocks
  for (let z = baseZ; z >= endZ; z -= 0.8) {
    for (let x = -halfW - 1; x <= halfW + 1; x += 0.8) {
      const h = getMountainHeight(x, z);
      if (h < 0.2) continue;
      const blockH = Math.max(0.4, h * 0.3);
      const mat = snows[Math.floor(Math.random() * snows.length)];
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, blockH, 0.85),
        mat
      );
      block.position.set(x, h - blockH/2, z);
      block.receiveShadow = true;
      block.castShadow = true;
      mtnGroup.add(block);
    }
  }

  // Snow surface layer (smoother top)
  for (let z = baseZ; z >= endZ; z -= 1.2) {
    for (let x = -halfW; x <= halfW; x += 1.2) {
      const h = getMountainHeight(x, z);
      if (h < 0.3) continue;
      const mat = snows[Math.floor(Math.random() * snows.length)];
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.15, 1.3),
        mat
      );
      slab.position.set(x, h + 0.05, z);
      slab.receiveShadow = true;
      mtnGroup.add(slab);
    }
  }

  // Slope path (darker, 3-4 units wide, winding)
  const pathMat = new THREE.MeshLambertMaterial({ color: 0xD8E4F0 });
  for (let z = baseZ - 1; z >= endZ + 2; z -= 0.6) {
    const t = (baseZ - z) / (baseZ - peakZ);
    const pathX = Math.sin(t * 4) * 2; // winding
    const h = getMountainHeight(pathX, z);
    if (h < 0.2) continue;
    const pathBlock = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.12, 0.7),
      pathMat
    );
    pathBlock.position.set(pathX, h + 0.08, z);
    pathBlock.receiveShadow = true;
    mtnGroup.add(pathBlock);
  }

  // Rock outcroppings
  [[-5, -15, 3], [4, -20, 4], [-3, -25, 5], [5, -12, 2.5], [-6, -30, 3]].forEach(([rx, rz, rh]) => {
    const h = getMountainHeight(rx, rz);
    const rock = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, rh, 1.2),
      Math.random() > 0.5 ? rockA : rockB
    );
    rock.position.set(rx, h + rh/2 - 0.5, rz);
    rock.castShadow = true;
    mtnGroup.add(rock);
  });

  // Snow-dusted trees on slopes
  [[-4, -12], [3, -14], [-5, -18], [4, -22], [-3, -26], [5, -10], [-6, -20]].forEach(([tx, tz]) => {
    const h = getMountainHeight(tx, tz);
    if (h < 0.5) return;
    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 1.2, 5),
      new THREE.MeshLambertMaterial({ color: 0x5A3820 })
    );
    trunk.position.set(tx, h + 0.6, tz);
    trunk.castShadow = true;
    mtnGroup.add(trunk);
    // Snow-covered foliage (3 layers)
    [0.8, 1.2, 1.5].forEach((ly, i) => {
      const r = 0.5 - i * 0.12;
      const foliage = new THREE.Mesh(
        new THREE.ConeGeometry(r, 0.5, 6),
        i % 2 === 0 ? treeSnowA : treeSnowB
      );
      foliage.position.set(tx, h + ly, tz);
      foliage.castShadow = true;
      mtnGroup.add(foliage);
    });
  });

  // Chairlift line (poles from bottom to top)
  const liftX = -3;
  const poleCount = 6;
  const cableMat = new THREE.MeshLambertMaterial({ color: 0x808890 });
  const poleMat  = new THREE.MeshLambertMaterial({ color: 0xA0A8B0 });
  for (let i = 0; i <= poleCount; i++) {
    const t = i / poleCount;
    const pz = baseZ - t * (baseZ - (peakZ + 2));
    const ph = getMountainHeight(liftX, pz);
    // Pole
    const poleH = 3;
    const pole = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, poleH, 0.15),
      poleMat
    );
    pole.position.set(liftX, ph + poleH/2, pz);
    pole.castShadow = true;
    mtnGroup.add(pole);
    // Cross bar at top
    const crossbar = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.1, 0.1),
      poleMat
    );
    crossbar.position.set(liftX, ph + poleH, pz);
    mtnGroup.add(crossbar);
  }
  // Cable
  for (let i = 0; i < poleCount; i++) {
    const t0 = i / poleCount;
    const t1 = (i + 1) / poleCount;
    const z0 = baseZ - t0 * (baseZ - (peakZ + 2));
    const z1 = baseZ - t1 * (baseZ - (peakZ + 2));
    const h0 = getMountainHeight(liftX, z0) + 3;
    const h1 = getMountainHeight(liftX, z1) + 3;
    const midZ = (z0 + z1) / 2;
    const cableLen = Math.sqrt(Math.pow(z1-z0,2) + Math.pow(h1-h0,2));
    const cable = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, Math.abs(z1 - z0)),
      cableMat
    );
    cable.position.set(liftX, (h0 + h1) / 2, midZ);
    mtnGroup.add(cable);
  }

  // Extend groundHitMesh to cover mountain area
  const extendedHit = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 30),
    new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
  );
  extendedHit.rotation.x = -Math.PI / 2;
  extendedHit.position.set(0, 0, -20);
  extendedHit.name = 'mountainHit';
  scene.add(extendedHit);

  scene.add(mtnGroup);
  return mtnGroup;
}

// Build mountain before background mountains
buildSkiMountain();

// ============================================================
//  ═══ 二樓 ═══  Shop: Buy furniture & equipment
// ============================================================
function buyFurniture(id) {
  const def = furnitureCatalog.find(f => f.id === id);
  if (!def || !def.price) return;
  if (money < def.price) { showToast(`💸 コイン不足！(${def.price} 必要)`); return; }
  money -= def.price;
  furnitureInventory[id] = (furnitureInventory[id] || 0) + 1;
  updateUI();
  updateShopUI();
  showToast(`${def.icon} ${def.name} 購入！`);
}
window.buyFurniture = buyFurniture;

function buyEquipment(id) {
  const def = equipmentCatalog.find(e => e.id === id);
  if (!def) return;
  if (equipmentInventory[id]) { showToast('既に所持しています'); return; }
  if (money < def.price) { showToast(`💸 コイン不足！(${def.price} 必要)`); return; }
  money -= def.price;
  equipmentInventory[id] = 1;
  updateUI();
  updateShopUI();
  showToast(`${def.icon} ${def.name} 購入！`);
}
window.buyEquipment = buyEquipment;

function equipItem(id) {
  if (!equipmentInventory[id]) return;
  const def = equipmentCatalog.find(e => e.id === id);
  if (!def) return;
  if (id.startsWith('board_'))  equippedBoard  = id;
  if (id.startsWith('helmet_')) equippedHelmet = id;
  if (id.startsWith('goggle_')) equippedGoggle = id;
  showToast(`${def.icon} ${def.name} 装着！`);
  // Cosmetic: change board color
  if (playerMesh && id.startsWith('board_')) {
    const colorMap = { board_black: 0x1A1A1A, board_flame: 0xC83010 };
    const col = colorMap[id] || 0x1A1A1A;
    playerMesh.userData.boardGrp?.traverse(c => {
      if (c.isMesh && c.material.color) {
        if (c.material.color.getHex() === 0x1A1A1A || c.material.color.getHex() === 0xC83010) {
          c.material.color.setHex(col);
        }
      }
    });
  }
}
window.equipItem = equipItem;

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
    const def = plantCatalog[p.type];
    // 高級作物（A/S/SS）移除前確認
    const highGrades = ['A','S','SS'];
    if (def && highGrades.includes(def.grade)) {
      clearDeleteHighlight();
      if (!confirm(`⚠️ 確定要移除 ${def.icon} ${def.name}（${def.grade}級）嗎？`)) return;
    }
    clearDeleteHighlight();
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
  clearDeleteHighlight();
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

// 直接點擊家具也能刪除（delete 模式）
function deleteFurnitureByMesh(targetMesh) {
  const idx = placedObjects.findIndex(o => o.mesh === targetMesh);
  if (idx < 0) return false;
  const obj = placedObjects[idx];
  const key = `${obj.gridX},${obj.gridZ}`;
  clearDeleteHighlight();
  scene.remove(obj.mesh);
  obj.mesh.traverse(c => {
    if (!c.isMesh) return;
    c.geometry.dispose();
    (Array.isArray(c.material)?c.material:[c.material]).forEach(m=>m.dispose());
  });
  placedObjects.splice(idx, 1);
  occupiedCells.delete(key);
  updateUI();
  showToast('🗑️ 家具を除去');
  return true;
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

// ── 刪除模式：懸停紅色高亮系統 ──
let deleteHoverMeshes = [];   // 當前被紅染的 meshes（含原色備份）
function clearDeleteHighlight() {
  deleteHoverMeshes.forEach(({ mesh, origColor, origEmissive, origEmissiveIntensity }) => {
    if (!mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m, i) => {
      if (origColor[i])    m.color.copy(origColor[i]);
      if (origEmissive[i]) m.emissive.copy(origEmissive[i]);
      m.emissiveIntensity = origEmissiveIntensity[i] ?? 0;
    });
  });
  deleteHoverMeshes = [];
}
function applyDeleteHighlight(group) {
  clearDeleteHighlight();
  group.traverse(c => {
    if (!c.isMesh || !c.material) return;
    const mats = Array.isArray(c.material) ? c.material : [c.material];
    const origColor = mats.map(m => m.color.clone());
    const origEmissive = mats.map(m => m.emissive ? m.emissive.clone() : new THREE.Color(0));
    const origEmissiveIntensity = mats.map(m => m.emissiveIntensity ?? 0);
    mats.forEach(m => {
      m.color.lerp(new THREE.Color(0xFF2020), 0.5);
      if (m.emissive) { m.emissive.set(0xFF0000); m.emissiveIntensity = 0.3; }
    });
    deleteHoverMeshes.push({ mesh: c, origColor, origEmissive, origEmissiveIntensity });
  });
}

// ── 長按系統：移動/收納 ──
let longPressTimer = null;
let longPressTarget = null;    // { type:'plant'|'build', data, mesh }
let isMovingObject = false;    // 正在拖動物件
let movingObject = null;

function startLongPress(e) {
  getPointerNDC(e);
  raycaster.setFromCamera(pointer, camera);

  // 檢測植物
  const allPM = [];
  plants.forEach(p => p.mesh.traverse(c => { if (c.isMesh) allPM.push(c); }));
  const pHits = raycaster.intersectObjects(allPM);
  if (pHits.length > 0) {
    for (const p of plants) {
      let obj = pHits[0].object;
      while (obj) {
        if (obj === p.mesh) {
          longPressTarget = { type:'plant', data:p, mesh:p.mesh };
          return;
        }
        obj = obj.parent;
      }
    }
  }
  // 檢測家具
  const allFM = [];
  placedObjects.forEach(o => o.mesh.traverse(c => { if (c.isMesh) allFM.push(c); }));
  const fHits = raycaster.intersectObjects(allFM);
  if (fHits.length > 0) {
    for (const o of placedObjects) {
      let obj = fHits[0].object;
      while (obj) {
        if (obj === o.mesh) {
          longPressTarget = { type:'build', data:o, mesh:o.mesh };
          return;
        }
        obj = obj.parent;
      }
    }
  }
}

function triggerLongPress() {
  if (!longPressTarget) return;
  isMovingObject = true;
  movingObject   = longPressTarget;
  controls.enabled = false;  // 拖動時禁用相機旋轉
  // 視覺回饋：物件浮起 + 半透明
  movingObject.mesh.position.y += 0.5;
  movingObject.mesh.traverse(c => {
    if (c.isMesh && c.material) {
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach(m => { m.transparent = true; m.opacity = 0.6; });
    }
  });
  showToast('🫳 拖動到新位置 · 點右鍵收納');
}

function finishMove(worldX, worldZ) {
  if (!movingObject) return;
  const obj = movingObject;

  // 放置到新位置
  if (obj.type === 'plant') {
    obj.data.gridX = worldX;
    obj.data.gridZ = worldZ;
    obj.mesh.position.set(worldX, 0, worldZ);
  } else {
    // 家具：移除舊 key，建立新 key
    const oldKey = `${obj.data.gridX},${obj.data.gridZ}`;
    occupiedCells.delete(oldKey);
    const nx = Math.round(worldX);
    const nz = Math.round(worldZ);
    obj.data.gridX = nx;
    obj.data.gridZ = nz;
    occupiedCells.add(`${nx},${nz}`);
    obj.mesh.position.set(nx, 0, nz);
  }

  // 復原透明度
  obj.mesh.traverse(c => {
    if (c.isMesh && c.material) {
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach(m => { m.opacity = 1.0; m.transparent = (m.userData?.origTransparent || false); });
    }
  });

  isMovingObject = false;
  movingObject   = null;
  controls.enabled = true;
  showToast('✅ 移動完成');
}

function storeObject() {
  if (!movingObject) return;
  const obj = movingObject;

  if (obj.type === 'plant') {
    // 收納植物 → 種子 +1
    const def = plantCatalog[obj.data.type];
    inventorySeeds[obj.data.type] = (inventorySeeds[obj.data.type]||0) + 1;
    scene.remove(obj.mesh);
    obj.mesh.traverse(c => {
      if (!c.isMesh) return;
      c.geometry.dispose();
      (Array.isArray(c.material)?c.material:[c.material]).forEach(m=>m.dispose());
    });
    const idx = plants.indexOf(obj.data);
    if (idx >= 0) plants.splice(idx, 1);
    showToast(`📥 ${def.icon} ${def.name} 收納 → 種子 +1`);
  } else {
    // 收納家具 → 消失（歸還）
    const key = `${obj.data.gridX},${obj.data.gridZ}`;
    occupiedCells.delete(key);
    scene.remove(obj.mesh);
    obj.mesh.traverse(c => {
      if (!c.isMesh) return;
      c.geometry.dispose();
      (Array.isArray(c.material)?c.material:[c.material]).forEach(m=>m.dispose());
    });
    const idx = placedObjects.indexOf(obj.data);
    if (idx >= 0) placedObjects.splice(idx, 1);
    showToast('📥 家具已收納');
  }

  isMovingObject = false;
  movingObject   = null;
  controls.enabled = true;
  updateUI();
}

renderer.domElement.addEventListener('pointerdown', e => {
  pointerStart.x = e.clientX;
  pointerStart.y = e.clientY;
  isDragging = false;
  longPressTarget = null;
  startLongPress(e);
  longPressTimer = setTimeout(() => triggerLongPress(), 600);  // 600ms 長按
});

renderer.domElement.addEventListener('pointermove', e => {
  const dx = e.clientX - pointerStart.x;
  const dy = e.clientY - pointerStart.y;
  if (Math.sqrt(dx*dx+dy*dy) > DRAG_THRESHOLD) {
    isDragging = true;
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
  }

  getPointerNDC(e);
  const hit = raycastGround();

  // 長按拖動中：物件跟隨滑鼠
  if (isMovingObject && movingObject && hit) {
    movingObject.mesh.position.set(hit.x, 0.5, hit.z);
    return;
  }

  // ── 刪除模式：懸停紅色高亮 ──
  if (currentMode === 'delete') {
    raycaster.setFromCamera(pointer, camera);
    let foundTarget = null;
    // 檢查植物
    const allPM2 = [];
    plants.forEach(p => p.mesh.traverse(c => { if (c.isMesh) allPM2.push(c); }));
    const pHits2 = raycaster.intersectObjects(allPM2);
    if (pHits2.length > 0) {
      for (const p of plants) {
        let obj = pHits2[0].object;
        while (obj) { if (obj===p.mesh){foundTarget=p.mesh; break;} obj=obj.parent; }
        if (foundTarget) break;
      }
    }
    // 檢查家具
    if (!foundTarget) {
      const allFM2 = [];
      placedObjects.forEach(o => o.mesh.traverse(c => { if (c.isMesh) allFM2.push(c); }));
      const fHits2 = raycaster.intersectObjects(allFM2);
      if (fHits2.length > 0) {
        for (const o of placedObjects) {
          let obj = fHits2[0].object;
          while (obj) { if (obj===o.mesh){foundTarget=o.mesh; break;} obj=obj.parent; }
          if (foundTarget) break;
        }
      }
    }
    if (foundTarget) applyDeleteHighlight(foundTarget);
    else clearDeleteHighlight();
  }

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

// 右鍵 → 收納（長按拖動中）
renderer.domElement.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (isMovingObject) storeObject();
});

renderer.domElement.addEventListener('pointerup', e => {
  if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

  // 長按拖動放下
  if (isMovingObject) {
    const hit = raycastGround();
    if (hit) finishMove(hit.x, hit.z);
    else finishMove(movingObject.mesh.position.x, movingObject.mesh.position.z);
    return;
  }

  if (isDragging) return;
  getPointerNDC(e);
  raycaster.setFromCamera(pointer, camera);

  // ⓪ 點擊角色 → 選中/取消
  if (playerMesh) {
    const playerParts = [];
    playerMesh.traverse(c => { if (c.isMesh) playerParts.push(c); });
    if (raycaster.intersectObjects(playerParts).length > 0) {
      playerIsSelected = !playerIsSelected;
      showToast(playerIsSelected ? '🧑 角色已選中 — 點地面移動' : '🧑 取消選中');
      return;
    }
  }

  // ① 便利屋
  if (raycaster.intersectObjects(shopMeshes).length > 0) { openShop(); return; }

  // ①b 動物（移除模式=出售 / 其他=查看狀態）
  const allAM = [];
  animals.forEach(a => { if (a.mesh.isMesh) allAM.push(a.mesh); else a.mesh.traverse(c => { if (c.isMesh) allAM.push(c); }); });
  const aHits = raycaster.intersectObjects(allAM);
  if (aHits.length > 0) {
    for (let ai = 0; ai < animals.length; ai++) {
      const a = animals[ai];
      let obj = aHits[0].object;
      while (obj) {
        if (obj === a.mesh) {
          if (currentMode === 'delete') {
            // 出售寵物：退回一半價格
            const sellPrice = Math.floor((a.tierDef.price || 0) * 0.5);
            money += sellPrice;
            scene.remove(a.mesh);
            a.mesh.traverse(c => { if (c.isMesh) { c.geometry.dispose(); [c.material].flat().forEach(m=>m.dispose()); }});
            animals.splice(ai, 1);
            updateUI();
            showToast(`💰 ${a.tierDef.nameAdult} 出售！+${sellPrice} コイン`);
          } else {
            const status = a.isBaby ? '幼体' : `採收 ${a.harvestCount}/5`;
            showToast(`${a.tierDef.nameAdult} — ${status}`);
          }
          return;
        }
        obj = obj.parent;
      }
    }
  }

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

  // ②b 家具 export / delete 模式
  if (currentMode === 'export' || currentMode === 'delete') {
    const allFM = [];
    placedObjects.forEach(o => o.mesh.traverse(c => { if (c.isMesh) allFM.push(c); }));
    const fHits = raycaster.intersectObjects(allFM);
    if (fHits.length > 0) {
      for (const o of placedObjects) {
        let obj = fHits[0].object;
        while (obj) {
          if (obj===o.mesh) {
            if (currentMode === 'export') { exportMeshToOBJ(o.mesh, o.furnId); return; }
            if (currentMode === 'delete')  { deleteFurnitureByMesh(o.mesh); return; }
          }
          obj=obj.parent;
        }
      }
    }
  }

  // ③ 地面
  const hit = raycastGround();
  if (!hit) return;

  // 角色選中時 → 點擊地面移動角色（不執行種植/家具）
  if (playerIsSelected && playerState === 'walking') {
    playerTarget = { x: hit.x, z: hit.z };
    playerIsSelected = false;  // 移動後自動取消選中
    showToast('🧑 移動中...');
    return;
  }

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
  clearDeleteHighlight();
  currentMode = mode;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const map = { plant:'btn-plant', build:'btn-build', delete:'btn-delete', export:'btn-export' };
  document.getElementById(map[mode])?.classList.add('active');
  const labels = { plant:'種植', build:'家具', delete:'移除', export:'匯出' };
  document.getElementById('mode-label').textContent = `模式：${labels[mode]}`;
  closeAllPanels();
  createPreviewMesh();
  // 點植物/家具 mode 自動開圖鑑
  if (mode === 'plant') window.openCatalog('plant');
  else if (mode === 'build') window.openCatalog('build');
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

function setShopTab(tab) {
  activeShopTab = tab;
  document.querySelectorAll('.shop-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.shop-tab-btn[data-tab="${tab}"]`)?.classList.add('active');
  document.querySelectorAll('.shop-tab-content').forEach(d => d.classList.add('hidden'));
  const target = document.getElementById(`shop-tab-${tab}`);
  if (target) target.classList.remove('hidden');
}
window.setShopTab = setShopTab;

function updateShopUI() {
  // ── Sell section (always visible above tabs) ──
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
  // 場上寵物出售提示
  if (animals.length > 0) {
    const petHdr = document.createElement('div');
    petHdr.className = 'shop-grade-header';
    petHdr.textContent = `🐾 場上寵物 (${animals.length}/${ANIMAL_CAP})`;
    sellList.appendChild(petHdr);
    animals.forEach((a, ai) => {
      const sellPrice = Math.floor((a.tierDef.price || 0) * 0.5);
      const row = document.createElement('div');
      row.className = 'sell-row';
      row.innerHTML = `<span>${a.tierDef.nameAdult}</span><span class="sell-cnt">${a.isBaby?'幼':'成'}</span><span class="sell-val"><button class="shop-buy-btn" onclick="sellAnimalByIndex(${ai})" style="font-size:11px;padding:2px 8px;">售 +${sellPrice}</button></span>`;
      sellList.appendChild(row);
      total += 0; // 不計入自動賣出
    });
  }

  const tot = document.getElementById('sell-total');
  if (tot) tot.textContent = `合計: ${total} コイン`;

  // ── Seeds tab ──
  const seedsTab = document.getElementById('shop-tab-seeds');
  if (seedsTab) {
    seedsTab.innerHTML = '';
    const gradeOrder = ['D','C','B','A','S','SS'];
    const gradeEmoji = { D:'⚪', C:'🟢', B:'🔵', A:'🟣', S:'🟡', SS:'🔴' };
    gradeOrder.forEach(grade => {
      const items = Object.entries(plantCatalog).filter(([,d]) => d.grade===grade && d.price>0);
      if (items.length === 0) return;
      const hdr = document.createElement('div');
      hdr.className = 'shop-grade-header';
      hdr.textContent = `${gradeEmoji[grade]} ${grade} 等級`;
      seedsTab.appendChild(hdr);
      items.forEach(([id, def]) => {
        const row = document.createElement('div');
        row.className = 'shop-buy-row';
        const stock = inventorySeeds[id] || 0;
        row.innerHTML = `<span>${def.icon} ${def.name}</span><span class="seed-stock">持有: ${stock}</span><button class="shop-buy-btn" onclick="buySeed('${id}')">${def.price} コイン</button>`;
        seedsTab.appendChild(row);
      });
    });
  }

  // ── Pets tab ──
  const petsTab = document.getElementById('shop-tab-pets');
  if (petsTab) {
    petsTab.innerHTML = '';
    ANIMAL_TIER.filter(t => t.price > 0).forEach(t => {
      const row = document.createElement('div');
      row.className = 'shop-buy-row';
      const lvEmoji = ['','🐰','🦊','🦅','🦁','🦊','🕷️'][t.lv] || '🐾';
      row.innerHTML = `<span>${lvEmoji} LV${t.lv} ${t.nameAdult}</span><span class="seed-stock">場上: ${animals.filter(a=>a.lv===t.lv).length}</span><button class="shop-buy-btn" onclick="buyAnimal(${t.lv})">${t.price} コイン</button>`;
      petsTab.appendChild(row);
    });
  }

  // ── Furniture tab ──
  const furnTab = document.getElementById('shop-tab-furniture');
  if (furnTab) {
    furnTab.innerHTML = '';
    furnitureCatalog.forEach(def => {
      if (!def.price) return;
      const row = document.createElement('div');
      row.className = 'shop-buy-row';
      const owned = furnitureInventory[def.id] || 0;
      row.innerHTML = `<span>${def.icon} ${def.name}</span><span class="seed-stock">所持: ${owned}</span><button class="shop-buy-btn" onclick="buyFurniture('${def.id}')">${def.price} コイン</button>`;
      furnTab.appendChild(row);
    });
  }

  // ── Equipment tab ──
  const equipTab = document.getElementById('shop-tab-equipment');
  if (equipTab) {
    equipTab.innerHTML = '';
    equipmentCatalog.forEach(def => {
      const row = document.createElement('div');
      row.className = 'shop-buy-row';
      const owned = equipmentInventory[def.id] ? '✅' : '—';
      const isEquipped = (equippedBoard === def.id || equippedHelmet === def.id || equippedGoggle === def.id);
      let btnHtml;
      if (equipmentInventory[def.id]) {
        btnHtml = isEquipped
          ? `<button class="shop-buy-btn" disabled>装着中</button>`
          : `<button class="shop-buy-btn" onclick="equipItem('${def.id}')">装着</button>`;
      } else {
        btnHtml = `<button class="shop-buy-btn" onclick="buyEquipment('${def.id}')">${def.price} コイン</button>`;
      }
      row.innerHTML = `<span>${def.icon} ${def.name}</span><span class="seed-stock">${owned}</span>${btnHtml}`;
      equipTab.appendChild(row);
    });
  }

  // Activate current tab
  setShopTab(activeShopTab);
}

window.buyAnimal = function(lv) {
  const def = getTierDef(lv);
  if (!def?.price || def.price <= 0) return;
  if (money < def.price) { showToast(`💸 コイン不足！(${def.price} 必要)`); return; }
  if (animals.length >= ANIMAL_CAP) { showToast(`🐾 寵物已達上限 ${ANIMAL_CAP} 隻`); return; }
  money -= def.price;
  spawnAnimal(lv);
  updateUI();
  showToast(`🐾 LV${lv} ${def.nameAdult} 購入！`);
};

window.sellAnimalByIndex = function(idx) {
  if (idx < 0 || idx >= animals.length) return;
  const a = animals[idx];
  const sellPrice = Math.floor((a.tierDef.price || 0) * 0.5);
  money += sellPrice;
  scene.remove(a.mesh);
  a.mesh.traverse(c => { if (c.isMesh) { c.geometry.dispose(); [c.material].flat().forEach(m=>m.dispose()); }});
  animals.splice(idx, 1);
  updateUI();
  updateShopUI();
  showToast(`💰 ${a.tierDef.nameAdult} 出售！+${sellPrice} コイン`);
};

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
  let delta = clock.getDelta();
  // 跳離頁面回來時 delta 會暴增 → 鎖上限 0.1s，避免卡死
  if (delta > 0.1) delta = 0.016;
  const now   = Date.now();

  controls.update();
  updatePlants(now);
  updateAnimals(delta, now);
  updateParticles(delta);
  updatePlayer(delta, now);

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

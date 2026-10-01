// The 3D view: draws the game's map (columns 1-52, rows 1-22 of the screen)
// as extruded neon characters in a black space, over the 2D map.  The stats
// on the right and the messages below stay in 2D.
//
// It only reads the game: the screen page being shown and a few shared
// variables (position, darkness, ...).  Its only effect on the game is
// sending keypresses (see input.js).  F8 switches it on and off at any time;
// Shift+F8 changes the camera.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { glyphGeometry, glyphHeight, isMobile } from './glyphs.js';
import { Layer, EGA } from './layer.js';
import { previewArea } from './preview.js';
import { installInput } from './input.js';

const COLS = 52, ROWS = 22;                // the map part of the 80 x 25 screen
const CORNERS = new Set([218, 191, 192, 217, 201, 187, 200, 188]);
const CAMERAS = { behind: 'Behind', first: 'First person', table: 'Tabletop' };
const CASTLE_ORIGIN = -10000;              // keeps castle levels apart from the outdoors
const PREVIEW_BRIGHTNESS = 0.32;

// ------------------------------------------------------------ page and overlay
const screenCanvas = document.getElementById('screen');
const viewport = document.getElementById('viewport');
const canvas = document.createElement('canvas');
canvas.id = 'screen3d';
canvas.setAttribute('aria-label', 'AlphaMan 3D view');
viewport.appendChild(canvas);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setClearColor(0x000000);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, COLS * 9 / (ROWS * 16), 0.05, 400);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.3, 0.2);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(ratio);
  renderer.setSize(w, h, false);
  composer.setPixelRatio(ratio);
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  needRender = true;
}
new ResizeObserver(resize).observe(canvas);

// ------------------------------------------------------------ scene contents
const localGroup = new THREE.Group(), worldGroup = new THREE.Group(), previewGroup = new THREE.Group();
scene.add(localGroup, worldGroup);
localGroup.add(previewGroup);
const localLayer = new Layer(localGroup), worldLayer = new Layer(worldGroup);
const previews = new Map();                // "mx,my" -> Layer
let previewSeed = null;

// Moving characters (you and the creatures), matched between frames so
// they glide from square to square.
const mobiles = { local: [], world: [] };
const mobileMaterial = (fc) => new THREE.MeshBasicMaterial({
  vertexColors: true, color: EGA[fc], transparent: true, opacity: 0,
});
function makeMobile(group, x, z, v) {
  const code = v & 255, fc = (v >> 8) & 15;
  const mesh = new THREE.Mesh(glyphGeometry(code), mobileMaterial(fc));
  mesh.scale.set(1, glyphHeight(code, fc), 1);
  mesh.position.set(x + 0.5, 0, z + 0.5);
  group.add(mesh);
  return { mesh, v, x, z, tx: x, tz: z, gone: false };
}
function updateMobiles(list, group, cells) {
  const unmatched = new Set(list.filter((m) => !m.gone));
  for (const [x, z, v] of cells) {
    let best = null, bestD = 3;
    for (const m of unmatched) {
      if (m.v !== v) continue;
      const d = Math.max(Math.abs(m.tx - x), Math.abs(m.tz - z));
      if (d < bestD) { best = m; bestD = d; }
    }
    if (best) {
      unmatched.delete(best);
      best.tx = x; best.tz = z;
    } else {
      list.push(makeMobile(group, x, z, v));
    }
  }
  for (const m of unmatched) m.gone = true;
}
function animateMobiles(list, dt, hideCode) {
  const k = 1 - Math.exp(-dt * 14);
  let moving = false;
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i], mat = m.mesh.material;
    m.x += (m.tx - m.x) * k; m.z += (m.tz - m.z) * k;
    m.mesh.position.set(m.x + 0.5, 0, m.z + 0.5);
    mat.opacity = Math.max(0, Math.min(1, mat.opacity + (m.gone ? -dt * 6 : dt * 6)));
    m.mesh.visible = (m.v & 255) !== hideCode && mat.opacity > 0;
    if (m.gone && mat.opacity <= 0) {
      m.mesh.removeFromParent(); mat.dispose(); list.splice(i, 1);
    }
    if (Math.abs(m.tx - m.x) > 1e-3 || Math.abs(m.tz - m.z) > 1e-3 || (mat.opacity > 0 && mat.opacity < 1)) moving = true;
    if (m.gone || m.mesh.visible !== m.lastVisible) { moving = true; m.lastVisible = m.mesh.visible; }
  }
  return moving;
}
function clearMobiles(list) {
  for (const m of list) { m.mesh.removeFromParent(); m.mesh.material.dispose(); }
  list.length = 0;
}

// ------------------------------------------------------------ reading the screen
const isMapPage = (page) =>
  CORNERS.has(SCR.getCell(page, 1, 1) & 255) && CORNERS.has(SCR.getCell(page, COLS, 1) & 255) &&
  CORNERS.has(SCR.getCell(page, 1, ROWS) & 255) && CORNERS.has(SCR.getCell(page, COLS, ROWS) & 255);

function snapshot(page) {
  const a = new Uint16Array(COLS * ROWS);
  for (let y = 1; y <= ROWS; y++) for (let x = 1; x <= COLS; x++) a[(y - 1) * COLS + x - 1] = SCR.getCell(page, x, y);
  return a;
}
const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i]);

// Splits a page into static and moving cells in world coordinates.
function cellsOf(snap, ox, oz, skipFrame) {
  const statics = [], movers = [];
  for (let y = 1; y <= ROWS; y++) {
    for (let x = 1; x <= COLS; x++) {
      const v = snap[(y - 1) * COLS + x - 1], code = v & 255, attr = v >> 8;
      const frame = x === 1 || x === COLS || y === 1 || y === ROWS;
      // The plain red frame round the map is left out so neighbouring areas
      // join up; a coloured frame (radiation) is kept.
      if (frame && (skipFrame || attr === 0x04)) continue;
      if (code === 32 && !((attr >> 4) & 7)) continue;
      const cell = [ox + x - 2, oz + y - 2, v];
      (isMobile(code) ? movers : statics).push(cell);
    }
  }
  return { statics, movers };
}

// ------------------------------------------------------------ state
const view = {
  on: false,
  camera: (() => { try { return localStorage.getItem('alphaman-3d-camera') || 'behind'; } catch { return 'behind'; } })(),
  heading: 0,                 // 0..7, 45 degree steps clockwise from north
  yaw: 0,                     // shown yaw (radians), eases towards heading
  wantWorld: false,           // the player asked for the main map (F5)
  scene: null,                // 'local' or 'world'
  localSnap: null, localOrigin: null, areaKey: null,
  worldSnap: null,
  player: new THREE.Vector3(),
  active() { return this.on && overlayShown; },
  relative() { return this.scene === 'local' && this.camera !== 'table'; },
  turn(d) { this.heading = (this.heading + d + 8) % 8; },
  toggle() { setOn(!this.on); },
  cycleCamera() {
    const keys = Object.keys(CAMERAS);
    setCamera(keys[(keys.indexOf(this.camera) + 1) % keys.length]);
  },
  noteKey(code) { if (code === 'F5') this.wantWorld = true; },
};
let overlayShown = false;

function areaOrigin() {
  if (incastle) return [CASTLE_ORIGIN, CASTLE_ORIGIN];
  return [(mainx - 2) * 50, (mainy - 2) * 20];
}

function refreshPreviews() {
  const outdoors = view.scene === 'local' && !incastle;
  const show = outdoors && dark === 0;
  if (previewGroup.visible !== show) { previewGroup.visible = show; needRender = true; }
  if (!outdoors) return;
  if (previewSeed !== seed) {
    for (const l of previews.values()) l.dispose();
    previews.clear(); previewSeed = seed;
  }
  const want = new Set();
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) if (dx || dy) want.add(`${mainx + dx},${mainy + dy}`);
  }
  for (const [k, l] of previews) if (!want.has(k)) { l.dispose(); previews.delete(k); }
  for (const k of want) {
    if (previews.has(k)) continue;
    const [mx, my] = k.split(',').map(Number);
    const cells = previewArea(mx, my);
    const layer = new Layer(previewGroup, PREVIEW_BRIGHTNESS);
    if (cells) layer.set(cells.map(([x, y, v]) => [(mx - 2) * 50 + x - 2, (my - 2) * 20 + y - 2, v]));
    previews.set(k, layer);
    needRender = true;
  }
}

function update() {
  const page = SCR.vpage;
  // Page 1 only ever holds the local map (outdoors, castles, lairs); page 0
  // holds the main map once a game is under way (with its frame; the intro
  // screen uses it too).  Inside castles the local map has no frame of its
  // own, so page 1 is recognised by the main map being in place on page 0.
  const playing = isMapPage(0);
  let target = null;
  if (playing && page === 1) target = 'local';
  else if (playing && page === 0 && (view.wantWorld || !view.localSnap)) target = 'world';
  else if (playing && page === 0) target = view.scene;      // the map flashes up while an area is made
  if (page === 1) view.wantWorld = false;

  setOverlay(view.on && !!target);
  if (!target) return false;
  let changed = view.scene !== target;
  view.scene = target;

  if (target === 'local' && page === 1) {
    const snap = snapshot(1);
    const key = `${incastle},${mainx},${mainy},${castlelevel}`;
    // Take a new position only along with new map contents, so a move to
    // the next area shows the old area until the new one is drawn.
    if (!same(snap, view.localSnap)) {
      const changedArea = key !== view.areaKey;
      view.localOrigin = areaOrigin(); view.areaKey = key;
      const [ox, oz] = view.localOrigin;
      const { statics, movers } = cellsOf(snap, ox, oz, !incastle);
      localLayer.set(statics);
      if (changedArea && incastle) clearMobiles(mobiles.local);
      updateMobiles(mobiles.local, localGroup, movers);
      view.localSnap = snap;
      changed = true;
      if (changedArea && view.localOrigin[0] !== CASTLE_ORIGIN) {
        const p = previews.get(`${mainx},${mainy}`);   // the real area replaces its preview
        if (p) { p.dispose(); previews.delete(`${mainx},${mainy}`); }
      }
    }
    if (view.localOrigin) {
      const [ox, oz] = view.localOrigin;
      view.player.set(ox + localx - 2 + 0.5, 0, oz + localy - 2 + 0.5);
    }
    refreshPreviews();
  } else if (target === 'world') {
    const snap = snapshot(0);
    if (!same(snap, view.worldSnap)) {
      const { statics, movers } = cellsOf(snap, 0, 0, false);
      worldLayer.set(statics);
      updateMobiles(mobiles.world, worldGroup, movers.filter(([, , v]) => (v & 255) === 1));
      view.worldSnap = snap;
      changed = true;
    }
    view.player.set(mainx - 2 + 0.5, 0, mainy - 2 + 0.5);
  }
  localGroup.visible = view.scene === 'local';
  worldGroup.visible = view.scene === 'world';
  return changed;
}

// ------------------------------------------------------------ cameras
const tmpTarget = new THREE.Vector3(), camGoal = new THREE.Vector3(), lookGoal = new THREE.Vector3();
const lookAt = new THREE.Vector3();
let cameraPlaced = false;
function placeCamera(dt) {
  const goalYaw = view.heading * Math.PI / 4;
  let d = goalYaw - view.yaw;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  view.yaw += d * (1 - Math.exp(-dt * 10));
  const mode = view.scene === 'world' ? 'world' : view.camera;
  const yaw = mode === 'behind' || mode === 'first' ? view.yaw : 0;
  const fx = Math.sin(yaw), fz = -Math.cos(yaw);
  tmpTarget.copy(view.player);
  switch (mode) {
    case 'behind':
      camGoal.set(tmpTarget.x - fx * 5.5, 4.2, tmpTarget.z - fz * 5.5);
      lookGoal.set(tmpTarget.x + fx * 4, 0, tmpTarget.z + fz * 4);
      break;
    case 'first':
      camGoal.set(tmpTarget.x - fx * 0.15, 0.62, tmpTarget.z - fz * 0.15);
      lookGoal.set(tmpTarget.x + fx * 6, 0.35, tmpTarget.z + fz * 6);
      break;
    case 'table':
      camGoal.set(tmpTarget.x, 26, tmpTarget.z + 15);
      lookGoal.set(tmpTarget.x, 0, tmpTarget.z);
      break;
    default:    // the main map
      camGoal.set(tmpTarget.x, 34, tmpTarget.z + 20);
      lookGoal.set(tmpTarget.x, 0, tmpTarget.z);
  }
  const k = cameraPlaced ? 1 - Math.exp(-dt * 8) : 1;
  const moving = camera.position.distanceToSquared(camGoal) > 1e-6 || lookAt.distanceToSquared(lookGoal) > 1e-6;
  camera.position.lerp(camGoal, k);
  lookAt.lerp(lookGoal, k);
  camera.lookAt(lookAt);
  cameraPlaced = true;
  scene.fog = mode === 'behind' || mode === 'first' ? fog : null;
  return moving;
}
const fog = new THREE.Fog(0x000000, 16, 42);

// ------------------------------------------------------------ main loop
// Draws only when something changed or is still moving.
let last = performance.now();
let needRender = true;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (!view.on) return;
  if (update()) needRender = true;
  if (!overlayShown) return;
  const hide = view.scene === 'local' && view.camera === 'first' ? 1 : -1;
  if (animateMobiles(mobiles.local, dt, hide)) needRender = true;
  if (animateMobiles(mobiles.world, dt, -1)) needRender = true;
  if (placeCamera(dt)) needRender = true;
  if (!needRender) return;
  needRender = false;
  composer.render();
}
requestAnimationFrame(frame);

// ------------------------------------------------------------ controls
const controls = document.getElementById('view3d-controls');
const button = document.createElement('button');
button.type = 'button';
const select = document.createElement('select');
select.setAttribute('aria-label', '3D camera');
for (const [k, label] of Object.entries(CAMERAS)) select.add(new Option(label, k));
const hint = document.createElement('span');
hint.className = 'hint';
controls.append(button, select, hint);
button.addEventListener('click', () => { view.toggle(); button.blur(); });
select.addEventListener('change', () => { setCamera(select.value); select.blur(); });

function setOverlay(show) {
  if (show === overlayShown) return;
  overlayShown = show;
  canvas.style.display = show ? 'block' : 'none';
  if (show) { resize(); cameraPlaced = false; needRender = true; }
}
function setOn(on) {
  view.on = on;
  button.textContent = on ? '2D view (F8)' : '3D view (F8)';
  button.setAttribute('aria-pressed', String(on));
  select.disabled = !on;
  if (!on) setOverlay(false);
  updateHint();
}
function setCamera(c) {
  view.camera = c;
  select.value = c;
  try { localStorage.setItem('alphaman-3d-camera', c); } catch { /* ignore */ }
  cameraPlaced = false;
  updateHint();
}
function updateHint() {
  hint.textContent = !view.on ? '' : view.camera === 'table'
    ? 'Shift+F8 changes camera'
    : 'Up/Down move, Left/Right turn, keypad 4/6 step sideways · Shift+F8 changes camera';
}
canvas.style.display = 'none';
setCamera(view.camera);
setOn(false);
installInput(view);

// For tests and tinkering in the console.
window.AlphaMan3D = { view, bloom, camera, scene, previews, previewArea, setOn, setCamera };

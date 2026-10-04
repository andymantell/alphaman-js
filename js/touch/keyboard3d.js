// The touch keyboard drawn from a real IBM Model M keycap (js/touch/keycap.json,
// from "IBM Model M Keyboard" by timblewee, CC BY 4.0; see that file).
//
// With the touch controls in the Model M style, each group of keys (the rows
// above and below the screen, the side columns, the answer buttons, the item
// popup and the direction pad) is drawn once with three.js: the keycap
// stretched to each key, in dark wells cut in a textured case, lit and
// shadowed.  The picture becomes the group's background and the HTML buttons
// stay on top of it with their legends, so taps work exactly as before.  It is
// drawn again only when a group changes size or its keys change.  The scene is
// kept, and a key being pressed is drawn moving: the cap travels down and
// springs back, drawn just around the key on a small canvas over the picture.
//
// Nothing here runs on the desktop page.  If WebGL or three.js is missing,
// the keys keep their CSS look (body.kb3d is never set).

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// The look, matched to photos of a Model M.
const LOOK = {
  view: 65,                 // degrees above the keyboard, seen from the front
  sunAz: -160, sunEl: 50, sun: 3, env: 0.45,
  cream: { skirt: '#e7e6d0', top: '#e7dfca' }, grey: '#7d776c',
  caseColour: '#c8c8ba', well: '#161616',
  inset: 2.5,               // px between a button's edge and its cap
  wellMargin: 1,            // px of well round each cap
  wellRadius: 3, chipRadius: 7, lip: 0.6,
  grain: 0.8, grainBlur: 0.8, bump: 40,
};
const MAIN = ['touch-top', 'touch-bottom', 'touch-left', 'touch-right'];
const CHIPS = ['touch-answers', 'touch-popup', 'touch-pad'];

let renderer = null, keycap = null, envMap = null;
const cache = new Map();    // drawing signature -> picture URL
const LABEL = 14;           // px for a side key's name printed under its cap
const TRAVEL = 0.0035;      // how far a cap goes down (metres; a Model M's is about 3.8 mm)

async function setup() {
  const url = new URL('keycap.json' + new URL(import.meta.url).search, import.meta.url);
  const data = await (await fetch(url)).json();
  const geo = (part) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(part.position.map((v) => v / 1e5), 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(part.normal.map((v) => v / 127), 3));
    g.setIndex(part.index);
    return g;
  };
  keycap = { skirt: geo(data.skirt), top: geo(data.top), w: data.size[0] / 1e5, d: data.size[2] / 1e5 };
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const pm = new THREE.PMREMGenerator(renderer);
  envMap = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
}

// Stretches the keycap to w x d metres: the corners keep their shape and only
// the middle grows.
function stretch(geo, w, d) {
  const out = geo.clone(), p = out.attributes.position, R = 0.006;
  const f = (v, a0, A) => { const s = Math.sign(v), x = Math.abs(v); return s * (x < a0 - R ? x * (A - R) / (a0 - R) : x + (A - a0)); };
  for (let i = 0; i < p.count; i++) p.setXYZ(i, f(p.getX(i), keycap.w / 2, w / 2), p.getY(i), f(p.getZ(i), keycap.d / 2, d / 2));
  return out;
}

function canvas2d(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

// The same grain every time, so a scene built again matches its picture.
function seeded(seed) {
  return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Builds one group's scene: W x H page pixels, caps as {x, y, w, h, grey}
// within it.  A chip has rounded corners and nothing outside them.
function build(W, H, keys, chip, dpr) {
  const k = keycap.w / Math.min(...keys.map((key) => Math.min(key.w, key.h)));   // metres per page pixel
  const toX = (px) => (px - W / 2) * k, toZ = (py) => (py - H / 2) * k;
  const disposables = [];
  const keep = (x) => { disposables.push(x); return x; };

  const scene = new THREE.Scene();
  scene.environment = envMap; scene.environmentIntensity = LOOK.env;
  const world = new THREE.Group(); scene.add(world);

  // The case: a plate with the wells cut out by an alpha mask; a blurred copy
  // of the mask plus fine noise is its bump map (the wells' rounded lips and
  // the orange-peel grain).
  const TS = dpr, cw = Math.ceil(W * TS), ch = Math.ceil(H * TS);
  const [mc, mx] = canvas2d(cw, ch);
  mx.fillStyle = '#000'; mx.fillRect(0, 0, cw, ch); mx.fillStyle = '#fff';
  mx.beginPath(); mx.roundRect(0, 0, cw, ch, chip ? LOOK.chipRadius * TS : 0); mx.fill();
  mx.fillStyle = '#000';
  const m = LOOK.wellMargin, rad = LOOK.wellRadius;
  for (const key of keys) { mx.beginPath(); mx.roundRect((key.x - m) * TS, (key.y - m) * TS, (key.w + 2 * m) * TS, (key.h + 2 * m) * TS, rad * TS); mx.fill(); }
  // Neighbouring keys share one well: fill between them square, so their
  // rounded corners leave no notch of case where they meet.
  const near = 2 * m + 1.5;
  for (const a of keys) for (const b of keys) {
    if (a === b) continue;
    const top = Math.max(a.y, b.y), bot = Math.min(a.y + a.h, b.y + b.h), lft = Math.max(a.x, b.x), rgt = Math.min(a.x + a.w, b.x + b.w);
    const gx = b.x - (a.x + a.w), gy = b.y - (a.y + a.h);
    if (gx >= -0.5 && gx <= near && bot > top) mx.fillRect((a.x + a.w - rad) * TS, (top - m) * TS, (gx + 2 * rad) * TS, (bot - top + 2 * m) * TS);
    if (gy >= -0.5 && gy <= near && rgt > lft) mx.fillRect((lft - m) * TS, (a.y + a.h - rad) * TS, (rgt - lft + 2 * m) * TS, (gy + 2 * rad) * TS);
  }
  const [bc, bx] = canvas2d(cw, ch);
  bx.filter = `blur(${LOOK.lip * TS}px)`; bx.drawImage(mc, 0, 0);
  const [nc, nx] = canvas2d(cw, ch), nd = nx.createImageData(cw, ch);
  const rnd = seeded(1987);
  for (let i = 0; i < nd.data.length; i += 4) { const v = rnd() * 255; nd.data[i] = nd.data[i + 1] = nd.data[i + 2] = v; nd.data[i + 3] = 255; }
  nx.putImageData(nd, 0, 0);
  bx.globalAlpha = LOOK.grain; bx.filter = `blur(${LOOK.grainBlur * TS}px)`; bx.drawImage(nc, 0, 0);
  const caseMat = keep(new THREE.MeshStandardMaterial({ color: LOOK.caseColour, roughness: 0.9 }));
  caseMat.alphaMap = keep(new THREE.CanvasTexture(mc)); caseMat.alphaTest = 0.5;
  caseMat.bumpMap = keep(new THREE.CanvasTexture(bc)); caseMat.bumpScale = LOOK.bump;
  const CASE_Y = 0.0025, FLOOR_Y = -0.006;
  const plate = new THREE.Mesh(keep(new THREE.PlaneGeometry(W * k, H * k)), caseMat);
  plate.rotation.x = -Math.PI / 2; plate.position.y = CASE_Y; plate.receiveShadow = plate.castShadow = true;
  world.add(plate);
  // The dark floor of the wells (with a chip, only inside its corners).
  const floorMat = keep(new THREE.MeshStandardMaterial({ color: LOOK.well, roughness: 1 }));
  if (chip) {
    const [fc, fx] = canvas2d(cw, ch); fx.fillStyle = '#fff';
    fx.beginPath(); fx.roundRect(2 * TS, 2 * TS, cw - 4 * TS, ch - 4 * TS, LOOK.chipRadius * TS); fx.fill();
    floorMat.alphaMap = keep(new THREE.CanvasTexture(fc)); floorMat.alphaTest = 0.5;
  }
  const floor = new THREE.Mesh(keep(new THREE.PlaneGeometry(W * k * (chip ? 1 : 2), H * k * (chip ? 1 : 2))), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR_Y; floor.receiveShadow = true;
  world.add(floor);

  // The keys.
  const mats = {
    cream: { skirt: keep(new THREE.MeshStandardMaterial({ color: LOOK.cream.skirt, roughness: 0.55 })), top: keep(new THREE.MeshStandardMaterial({ color: LOOK.cream.top, roughness: 0.8 })) },
    grey: { skirt: keep(new THREE.MeshStandardMaterial({ color: LOOK.grey, roughness: 0.55 })), top: keep(new THREE.MeshStandardMaterial({ color: LOOK.grey, roughness: 0.8 })) },
  };
  const caps = keys.map((key) => {
    const cap = new THREE.Group();
    cap.position.set(toX(key.x + key.w / 2), FLOOR_Y + 0.003, toZ(key.y + key.h / 2));
    for (const part of ['skirt', 'top']) {
      const mesh = new THREE.Mesh(keep(stretch(keycap[part], (key.w - 2 * LOOK.inset) * k, (key.h - 2 * LOOK.inset) * k)), mats[key.grey ? 'grey' : 'cream'][part]);
      mesh.castShadow = mesh.receiveShadow = true;
      cap.add(mesh);
    }
    world.add(cap);
    return cap;
  });

  // Seen a little from the front, as from a chair.  Stretching the scene front
  // to back by 1 / sin(view) keeps the plate exactly over the buttons.
  const el = THREE.MathUtils.degToRad(LOOK.view);
  world.scale.z = 1 / Math.sin(el);
  const cam = new THREE.OrthographicCamera(-W * k / 2, W * k / 2, H * k / 2, -H * k / 2, 0.001, 10);
  cam.position.set(0, CASE_Y + Math.sin(el), Math.cos(el)); cam.lookAt(0, CASE_Y, 0);
  const sun = new THREE.DirectionalLight(0xffffff, LOOK.sun);
  const sa = THREE.MathUtils.degToRad(LOOK.sunAz), se = THREE.MathUtils.degToRad(LOOK.sunEl);
  sun.position.set(Math.sin(sa) * Math.cos(se), Math.sin(se), Math.cos(sa) * Math.cos(se));
  sun.castShadow = true;
  const S = Math.max(W, H) * k * 1.5;
  Object.assign(sun.shadow.camera, { left: -S, right: S, top: S, bottom: -S });
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0002; sun.shadow.radius = 3;
  scene.add(sun, sun.target);

  // How far down the page a cap's top moves for each metre it goes down.
  const pxPerDepth = Math.cos(el) / k;
  return { W, H, dpr, scene, cam, caps, keys, pxPerDepth, rest: FLOOR_Y + 0.003,
    dispose() { sun.dispose(); for (const x of disposables) x.dispose(); } };
}

// Renders the whole group (for its picture), or only the part x, y, w, h.
function render(st, part) {
  renderer.setPixelRatio(st.dpr);
  if (part) { st.cam.setViewOffset(st.W, st.H, part.x, part.y, part.w, part.h); renderer.setSize(part.w, part.h, false); }
  else { st.cam.clearViewOffset(); renderer.setSize(st.W, st.H, false); }
  renderer.render(st.scene, st.cam);
  return renderer.domElement;
}

// ---- Which groups to draw, and when.

const isChip = (id) => CHIPS.includes(id);
function measure(holder) {
  const r = holder.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return null;
  const keys = [];
  for (const b of holder.querySelectorAll('.tk')) {
    const q = b.getBoundingClientRect();
    if (q.width < 2) continue;
    const shift = pressShift.get(b) || 0;   // a pressed key's legend moves down with its cap
    keys.push({ b, x: round(q.left - r.left), y: round(q.top - r.top - shift), w: round(q.width), h: round(q.height),
      grey: b.classList.contains('special') || b.classList.contains('arrow') });
  }
  if (!keys.length) return null;
  // Caps are never narrower than they are tall, and never taller than the
  // narrowest key is wide: a tall button gets a square cap, centred (in the
  // side columns, centred with the key's name printed on the case below).
  // Where the cap is goes on the button (--cap-y, --cap-h, --cap-b) for the
  // legends and the pressed look.
  const unit = Math.min(...keys.map((k) => k.w)), atTop = holder.classList.contains('touch-side');
  const caps = keys.map(({ b, ...k }) => {
    const h = Math.min(k.h, unit), dy = k.h > h ? Math.max(0, (k.h - h - (atTop ? LABEL : 0)) / 2) : 0;
    b.style.setProperty('--cap-y', dy + 'px'); b.style.setProperty('--cap-h', h + 'px'); b.style.setProperty('--cap-b', (k.h - h - dy) + 'px');
    return { ...k, y: k.y + dy, h };
  });
  return { W: round(r.width), H: round(r.height), caps, buttons: keys.map((k) => k.b) };
}
const round = (v) => Math.round(v * 4) / 4;

// Drawn straight away when a group changes (the observers run before the page
// is painted), so a new popup never shows the old picture.
const dirty = new Set();
let queued = false;
function schedule(holder) {
  if (!document.body.classList.contains('kb3d')) return;
  dirty.add(holder);
  if (!queued) { queued = true; queueMicrotask(flush); }
}
function flush() {
  queued = false;
  try {
    for (const holder of [...dirty]) {
      dirty.delete(holder);
      const m = measure(holder);
      if (!m) continue;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const { buttons, ...drawn } = m;
      const sig = JSON.stringify([drawn, dpr, holder.id]);
      if (holder.dataset.kb3d === sig) { live.get(holder).buttons = buttons; continue; }
      endPresses(holder);
      live.get(holder)?.dispose();
      const st = build(m.W, m.H, m.caps, isChip(holder.id), dpr);
      st.buttons = buttons;
      live.set(holder, st);
      let url = cache.get(sig);
      if (!url) {
        url = render(st).toDataURL('image/png');
        cache.set(sig, url);
        if (cache.size > 24) cache.delete(cache.keys().next().value);
      }
      holder.style.backgroundImage = `url("${url}")`;
      holder.dataset.kb3d = sig;
      holder.classList.add('kb3d-drawn');
    }
  } catch (e) {
    console.warn('Model M keyboard: drawing failed, keeping the plain keys.', e);
    stop();
  }
}

// ---- Pressing a key: the cap goes down while it is held and springs back
// when let go.  touch.js marks a held key with the class "down".
const live = new Map();         // holder -> its scene
const pressShift = new WeakMap();   // button -> px its legend is moved down
const moving = new Map();       // button -> { holder, p, v, target, canvas }
let ticking = false, last = 0;

function presses(holder, records) {
  for (const r of records) {
    const b = r.target;
    if (r.type !== 'attributes' || !b.classList || !b.classList.contains('tk')) continue;
    const down = b.classList.contains('down');
    const a = moving.get(b);
    if (down && !a) moving.set(b, { holder, p: 0, v: 0, target: 1, canvas: null });
    else if (a) a.target = down ? 1 : 0;
  }
  if (moving.size && !ticking) { ticking = true; last = performance.now(); requestAnimationFrame(tick); }
}

function endPresses(holder) {
  for (const [b, a] of moving) {
    if (a.holder !== holder) continue;
    a.canvas?.remove(); b.style.translate = ''; pressShift.delete(b); moving.delete(b);
  }
}

function tick(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now;
  // Springs: quick and firm going down, a little bounce coming back up.
  for (const a of moving.values()) {
    const [k, c] = a.target ? [2200, 84] : [900, 33];
    for (let t = 0; t < dt; t += 0.004) {
      const h = Math.min(0.004, dt - t);
      a.v += (k * (a.target - a.p) - c * a.v) * h; a.p += a.v * h;
      if (a.target && a.p > 1) { a.p = 1; a.v = 0; }   // bottomed out
    }
  }
  const byHolder = new Map();
  for (const [b, a] of moving) {
    const st = live.get(a.holder), i = st ? st.buttons.indexOf(b) : -1;
    if (i < 0) { a.canvas?.remove(); b.style.translate = ''; pressShift.delete(b); moving.delete(b); continue; }
    st.caps[i].position.y = st.rest - a.p * TRAVEL;
    const shift = Math.round(a.p * TRAVEL * st.pxPerDepth * 100) / 100;
    pressShift.set(b, shift); b.style.translate = `0 ${shift}px`;
    if (!byHolder.has(a.holder)) byHolder.set(a.holder, []);
    byHolder.get(a.holder).push([b, a, st.keys[i]]);
  }
  for (const [holder, list] of byHolder) {
    const st = live.get(holder);
    for (const [, a, key] of list) {
      // The key and a little round it (its shadow on its neighbours).
      const pad = 6, x = Math.max(0, Math.floor(key.x - pad)), y = Math.max(0, Math.floor(key.y - pad));
      const part = { x, y, w: Math.min(st.W, Math.ceil(key.x + key.w + pad)) - x, h: Math.min(st.H, Math.ceil(key.y + key.h + pad)) - y };
      if (!a.canvas) {
        a.canvas = document.createElement('canvas'); a.canvas.className = 'kb3d-press';
        holder.prepend(a.canvas);
      }
      const cv = a.canvas, pw = Math.round(part.w * st.dpr), ph = Math.round(part.h * st.dpr);
      if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
      Object.assign(cv.style, { left: part.x + 'px', top: part.y + 'px', width: part.w + 'px', height: part.h + 'px' });
      const src = render(st, part);
      const g = cv.getContext('2d'); g.clearRect(0, 0, pw, ph); g.drawImage(src, 0, 0, pw, ph);
    }
  }
  // Back at rest: the picture underneath is the same, so the canvas goes.
  for (const [b, a] of moving) {
    if (a.target === 0 && Math.abs(a.p) < 0.002 && Math.abs(a.v) < 0.05) {
      const st = live.get(a.holder), i = st.buttons.indexOf(b);
      if (i >= 0) st.caps[i].position.y = st.rest;
      a.canvas?.remove(); b.style.translate = ''; pressShift.delete(b); moving.delete(b);
    }
  }
  if (moving.size) requestAnimationFrame(tick); else ticking = false;
}

let watching = false;
function start() {
  if (watching) return;
  watching = true;
  document.body.classList.add('kb3d');
  for (const id of [...MAIN, ...CHIPS]) {
    const holder = document.getElementById(id);
    if (!holder) continue;
    new ResizeObserver(() => schedule(holder)).observe(holder);
    new MutationObserver((records) => { presses(holder, records); schedule(holder); }).observe(holder, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    schedule(holder);
  }
}
function stop() {
  document.body.classList.remove('kb3d');
  for (const id of [...MAIN, ...CHIPS]) {
    const holder = document.getElementById(id);
    if (!holder) continue;
    endPresses(holder);
    holder.style.backgroundImage = ''; holder.classList.remove('kb3d-drawn'); delete holder.dataset.kb3d;
  }
  failed = true;
}

let failed = false, ready = null;
function check() {
  const want = document.body.classList.contains('touch') && document.body.classList.contains('tk-modelm');
  if (!want || failed) return;
  ready ||= setup().then(start, (e) => { console.warn('Model M keyboard: not available, keeping the plain keys.', e); failed = true; });
}
new MutationObserver(check).observe(document.body, { attributes: true, attributeFilter: ['class'] });
check();
window.AlphaManKeyboard3D = { drawn: () => [...document.querySelectorAll('.kb3d-drawn')].map((h) => h.id) };

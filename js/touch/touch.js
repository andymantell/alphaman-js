// Touch controls for phones and tablets.  The game is not changed: like the
// keyboard, these controls only put keys into the game's keyboard buffer
// (KB.push).  What the game is waiting for (GameWait, in io.js) decides what
// a tap on the screen means.
//
// They turn on by themselves on a touch screen (pointer: coarse), and can be
// turned on or off in the settings menu.  With them off the page is as on a
// desktop.
'use strict';

(function () {
  const store = {
    get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* not kept */ } },
  };
  const MODE = 'alphaman-touch', THEME = 'alphaman-touch-theme', PAD = 'alphaman-touch-arrows';
  const coarse = matchMedia('(pointer: coarse)');
  const isOn = () => { const m = store.get(MODE, 'auto'); return m === 'on' || (m === 'auto' && coarse.matches); };

  const K = KEY_CODES;
  const send = (s) => KB.push(s);
  // Compass directions: [dx, dy] -> key
  const DIR = {
    '-1,-1': K.Home, '0,-1': K.ArrowUp, '1,-1': K.PageUp,
    '-1,0': K.ArrowLeft, '1,0': K.ArrowRight,
    '-1,1': K.End, '0,1': K.ArrowDown, '1,1': K.PageDown,
  };
  const dirKey = (dx, dy) => DIR[Math.sign(dx) + ',' + Math.sign(dy)];

  // The game's commands (from its ? screen), in pairs.  [key, legend, word, class]
  // Left: things you do with your items and abilities.
  const LEFT = [
    ['u', 'u', 'use'], ['U', 'U', 'unuse'],
    ['e', 'e', 'eat'], ['d', 'd', 'drop'],
    ['t', 't', 'throw'], ['f', 'f', 'figure'],
    ['a', 'a', 'again'], ['X', 'X', 'exam'],
    ['m', 'm', 'mental'], ['p', 'p', 'phys'],
    ['s', 's', 'search'], ['r', 'r', 'trap'],
  ];
  // Right: what is shown, stairs and resting, then answering the game.
  // 'panel' switches the right of the screen between stats (F1) and items
  // (F2).  The rest of the commands are in the More menu.
  const RIGHT = [
    ['panel', 'F1/2', 'items', 'fkey panel'], ['?', '?', 'help'],
    ['<', '<', 'down'], ['>', '>', 'up'],
    ['Z', 'Z', 'sleep'], ['.', '.', 'rest'],
    ['\x1b', 'Esc', 'cancel', 'special'], ['\r', '\u21b5', 'enter', 'special'],
    ['kbd', '\u2328', 'type', 'special'], ['menu', '\u2261', 'more', 'special'],
    [' ', '\u2423', 'space', 'move wide'],
  ];
  const PADKEYS = [
    [K.Home, '↖'], [K.ArrowUp, '↑'], [K.PageUp, '↗'],
    [K.ArrowLeft, '←'], null, [K.ArrowRight, '→'],
    [K.End, '↙'], [K.ArrowDown, '↓'], [K.PageDown, '↘'],
  ];

  const playarea = document.getElementById('playarea');
  const viewport = document.getElementById('viewport');
  const screenbox = document.getElementById('screenbox');
  const canvas = document.getElementById('screen');
  const el = (tag, props = {}, kids = []) => {
    const e = Object.assign(document.createElement(tag), props);
    for (const k of kids) e.append(k);
    return e;
  };

  // ---- Holding a key: the first press at once, then repeats, each only
  // once the game has taken the one before.
  let hold = null;   // { key() -> string|null, next }
  function startHold(key, repeat) {
    const k = key();
    if (k) send(k);
    hold = repeat ? { key, next: performance.now() + 350, sent: !!k } : null;
  }
  // Walking by touch waits a moment before the first step, to tell a tap
  // (one step when lifted), a hold and a drag apart.
  const DECIDE = 150;
  function startWalk() { hold = { key: walkKey, next: performance.now() + DECIDE, sent: false, walk: true }; }
  function stopHold() { hold = null; }
  setInterval(() => {
    pumpTarget();
    pumpRun();
    // The panel key is captioned with what it would show next.
    const word = globalThis.rdisp === 2 ? 'stats' : 'items';
    const cap = panelCaption();
    if (cap && cap.textContent !== word) cap.textContent = word;
    if (!hold || performance.now() < hold.next || KB.buffer.length) return;
    const k = hold.key();
    hold.next = performance.now() + (hold.walk && !hold.sent ? 300 : 160);
    if (k) { send(k); hold.sent = true; }
  }, 20);

  function makeKey([key, legend, word, cls], repeat) {
    const b = el('button', { type: 'button', className: 'tk ' + (cls || '') }, [legend]);
    if (word) b.append(el('small', { textContent: word }));
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      b.classList.add('down');
      if (key === 'kbd') { openKeyboard(); return; }
      if (key === 'menu') { toggleMenu(); return; }
      target = null;
      if (key === 'panel') { send(globalThis.rdisp === 2 ? K.F1 : K.F2); return; }
      startHold(() => key, repeat);
    });
    const up = () => { b.classList.remove('down'); stopHold(); };
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('pointerleave', up);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    keyButtons.set(key, b);
    return b;
  }
  const keyButtons = new Map();
  const panelCaption = () => keyButtons.get('panel') && keyButtons.get('panel').querySelector('small');
  const left = el('div', { className: 'touch-side', id: 'touch-left' }, LEFT.map((k) => makeKey(k, false)));
  const right = el('div', { className: 'touch-side', id: 'touch-right' }, RIGHT.map((k) => makeKey(k, false)));
  playarea.prepend(left);
  playarea.append(right);
  const pad = el('div', { id: 'touch-pad' }, PADKEYS.map((k) => k ? makeKey([k[0], k[1], '', 'move'], true) : el('span')));
  screenbox.append(pad);

  // ---- What the game waits for.
  const typeBox = el('div', { id: 'touch-type' });
  const items = el('div', { id: 'touch-items' });
  const input = el('input', {
    id: 'touch-input', type: 'text', autocomplete: 'off', spellcheck: false,
  });
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('enterkeyhint', 'done');
  input.setAttribute('aria-label', 'Type here');
  screenbox.append(typeBox, items, input);

  const cellPct = (col, row) => ({ left: (col - 1) * 100 / 80 + '%', top: (row - 1) * 100 / 25 + '%' });
  function showWait(kind, info) {
    if (!document.body.classList.contains('touch')) return;
    for (const k of [' ', '\r']) keyButtons.get(k).classList.remove('glow');
    if (kind === 'continue') keyButtons.get(' ').classList.add('glow');
    if (kind === 'target') keyButtons.get('\r').classList.add('glow');
    if (kind === 'text') {
      Object.assign(typeBox.style, cellPct(info.col, info.row), { width: (81 - info.col) * 100 / 80 + '%' });
      Object.assign(input.style, cellPct(info.col, info.row));
      input.inputMode = info.numeric ? 'numeric' : 'text';
      if (input.value !== info.value) { input.value = info.value; typed = info.value; }
      typeBox.classList.toggle('show', document.activeElement !== input);
      textRow = info.row;
    } else if (kind !== null) {
      typeBox.classList.remove('show');
      if (keyMode !== 'key' && document.activeElement === input) input.blur();
    }
    if (kind === 'item') {
      // The items are on rows 2 to count + 1, the extra choices just below
      // (and "3." on row 1).
      const first = info.extras & 4 ? 1 : 2;
      const last = info.count + 1 + (info.extras & 1 ? 1 : 0) + (info.extras & 2 ? 1 : 0);
      Object.assign(items.style, { top: (first - 1) * 100 / 25 + '%', height: (last - first + 1) * 100 / 25 + '%' });
      items.classList.add('show');
    } else if (kind !== null) {
      items.classList.remove('show');
    }
    if (kind !== null && kind !== 'target') target = null;
  }
  GameWait.listeners.push(showWait);

  // ---- Typing with the phone's keyboard.  In 'text' mode the box holds the
  // line being typed and changes to it are sent as keys; in 'key' mode
  // (any other prompt) each character typed is sent at once.
  let typed = '', keyMode = 'text', textRow = 1;
  function openKeyboard() {
    keyMode = GameWait.kind === 'text' ? 'text' : 'key';
    if (keyMode === 'key') { input.value = ''; typed = ''; input.inputMode = 'text'; }
    input.focus({ preventScroll: true });
  }
  typeBox.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); openKeyboard(); });
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();          // the game hears it through the box instead
    if (e.key === 'Enter') { e.preventDefault(); send('\r'); if (keyMode === 'key') input.blur(); }
    else if (e.key === 'Escape') { e.preventDefault(); send('\x1b'); input.blur(); }
    else if (e.key === 'Backspace' && input.value === '' && keyMode === 'key') send('\b');
  });
  input.addEventListener('input', () => {
    const v = input.value;
    let i = 0;
    while (i < v.length && i < typed.length && v[i] === typed[i]) i++;
    for (let j = i; j < typed.length; j++) send('\b');
    for (const ch of v.slice(i)) {
      const c = ch.charCodeAt(0);
      if (c >= 32 && c < 127) send(ch);
    }
    typed = v;
    if (keyMode === 'key') { input.value = ''; typed = ''; }
  });

  const strip = el('div', { id: 'touch-typing' });
  const stripCanvas = el('canvas', { width: 720, height: 16 });
  const done = el('button', { type: 'button', textContent: 'Done' });
  strip.append(stripCanvas, done);
  document.body.append(strip);
  done.addEventListener('pointerdown', (e) => { e.preventDefault(); input.blur(); });
  input.addEventListener('focus', () => {
    strip.classList.add('show'); typeBox.classList.remove('show');
  });
  input.addEventListener('blur', () => {
    strip.classList.remove('show');
    if (GameWait.kind === 'text') typeBox.classList.add('show');
  });
  // The strip shows the screen row being typed on (or the bottom rows for
  // other prompts), copied from the game screen.
  (function drawStrip() {
    if (strip.classList.contains('show')) {
      const ctx = stripCanvas.getContext('2d');
      if (keyMode === 'text') {
        if (stripCanvas.height !== 16) stripCanvas.height = 16;
        ctx.drawImage(canvas, 0, (textRow - 1) * 16, 720, 16, 0, 0, 720, 16);
      } else {
        if (stripCanvas.height !== 48) stripCanvas.height = 48;
        ctx.drawImage(canvas, 0, 22 * 16, 720, 48, 0, 0, 720, 48);
      }
    }
    requestAnimationFrame(drawStrip);
  })();

  // ---- Taps on the game screen.
  const view3dCovers = () => {
    const c = document.getElementById('screen3d');
    return !!c && getComputedStyle(c).display !== 'none';
  };
  function cellAt(e) {
    const r = canvas.getBoundingClientRect();
    return {
      col: Math.min(80, Math.max(1, Math.floor((e.clientX - r.left) / r.width * 80) + 1)),
      row: Math.min(25, Math.max(1, Math.floor((e.clientY - r.top) / r.height * 25) + 1)),
    };
  }
  const onMap = ({ col, row }) => col >= 1 && col <= 52 && row >= 1 && row <= 22;
  const cellCode = (col, row) => SCR.getCell(SCR.vpage, col, row) & 255;

  // Moving the targeting cursor to a tapped square, one key at a time.
  let target = null;   // { x, y, sentFrom }
  function pumpTarget() {
    if (!target || GameWait.kind !== 'target' || KB.buffer.length) return;
    const { x, y } = GameWait.info;
    if (x === target.x && y === target.y) { target = null; return; }
    if (target.sentFrom === x + ',' + y) { target = null; return; }   // it could not move
    target.sentFrom = x + ',' + y;
    send(dirKey(target.x - x, target.y - y));
  }

  // Walking: towards the square held, one step at a time.
  // The nearest of the eight directions to a vector on the screen.
  function dirOf(px, py) {
    const a = Math.round(Math.atan2(py, px) / (Math.PI / 4));
    return dirKey(Math.round(Math.cos(a * Math.PI / 4)), Math.round(Math.sin(a * Math.PI / 4)));
  }
  // Walking: while the finger is down, towards it from the character; once
  // it has been dragged, in the direction it was dragged (like a joystick),
  // which also works at the edges of the map.
  const DRAG = 24;   // CSS pixels
  let finger = null;  // { x0, y0, x, y, dragged }
  function walkKey() {
    if (!finger || GameWait.kind !== 'command' || SCR.vpage !== 1) return null;
    if (finger.dragged) return dirOf(finger.x - finger.x0, finger.y - finger.y0);
    const r = canvas.getBoundingClientRect();
    const cx = r.left + (globalThis.localx - 0.5) * r.width / 80;
    const cy = r.top + (globalThis.localy - 0.5) * r.height / 25;
    const px = finger.x - cx, py = finger.y - cy;
    if (Math.abs(px) < r.width / 160 && Math.abs(py) < r.height / 50) return null;   // on the character
    return dirOf(px, py);
  }
  // Running: a flick (a quick swipe) keeps walking that way until something
  // happens: a message or prompt, damage, a bump, a new area, a creature
  // coming within range or close (even an invisible one), or another touch.
  const FLICK_MS = 300, FLICK_PX = 40, RUN_MAX = 80;
  let run = null;   // { key, x, y, area, lpoint, hits, seen, steps, next }
  // Creatures in range, shown or not (an invisible one may need fighting).
  function nearbyCreatures() {
    let n = 0, near = false;
    for (let j = 1; j <= nnear; j++) {
      const c = ncre[j];
      const dx = c[4], dy = c[5], x = localx + dx, y = localy + dy;
      if (x < 1 || x > 52 || y < 1 || y > 22 || c[2] <= -2000) continue;   // off the map or removed
      if (Math.max(Math.abs(dx), Math.abs(dy)) <= 8) n++;
      if (Math.max(Math.abs(dx), Math.abs(dy)) <= 2) near = true;
    }
    return { n, near };
  }
  const snapshot = () => ({
    x: localx, y: localy, area: mainx + ',' + mainy,
    lpoint: lpoint, hits: hits,
  });
  function startRun(key) {
    run = Object.assign(snapshot(), { key, seen: nearbyCreatures().n, steps: 0, next: performance.now() + 160 });
  }
  function pumpRun() {
    if (!run || KB.buffer.length || performance.now() < run.next) return;
    const now = snapshot(), v = nearbyCreatures();
    const stop = GameWait.kind !== 'command' ? 'prompt' : SCR.vpage !== 1 ? 'page' : now.lpoint !== run.lpoint ? 'message'
      : now.hits < run.hits ? 'hurt' : now.area !== run.area ? 'area' : run.steps > 0 && now.x === run.x && now.y === run.y ? 'bump'
      : v.near ? 'near' : v.n > run.seen ? 'seen' : ++run.steps > RUN_MAX ? 'far' : null;
    if (stop) { run = null; return; }
    Object.assign(run, now, { seen: v.n, next: performance.now() + 160 });
    send(run.key);
  }

  screenbox.addEventListener('pointermove', (e) => {
    if (!finger || e.pointerId !== finger.id) return;
    finger.x = e.clientX; finger.y = e.clientY;
    if (!finger.dragged && Math.hypot(finger.x - finger.x0, finger.y - finger.y0) > DRAG) {
      finger.dragged = true;
      if (hold && !hold.sent) hold.next = performance.now();   // no step yet: step at once
    }
  });

  document.addEventListener('pointerdown', () => { run = null; }, true);
  screenbox.addEventListener('pointerdown', (e) => {
    if (!document.body.classList.contains('touch') || e.target.closest('.tk')) return;
    e.preventDefault();
    const cell = cellAt(e), kind = GameWait.kind;
    if (kind === 'text') { openKeyboard(); return; }
    if (kind === 'item' && cell.col >= 54) {
      const c = cellCode(55, cell.row), next = cellCode(56, cell.row);
      if ((c >= 97 && c <= 122 && next === 32) || (c >= 49 && c <= 51 && next === 46)) send(String.fromCharCode(c));
      return;
    }
    if (kind === 'target' && onMap(cell) && !view3dCovers()) {
      const { x, y } = GameWait.info;
      if (cell.col === x && cell.row === y) send('\r');
      else target = { x: cell.col, y: cell.row, sentFrom: null };
      return;
    }
    if (kind === 'command') {
      if (view3dCovers()) return;
      // On the main map (shown at the start), a tap goes back to the local map.
      if (SCR.vpage === 0) { if (onMap(cell)) send(K.F6); return; }
      finger = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, dragged: false, t0: performance.now() };
      try { screenbox.setPointerCapture(e.pointerId); } catch (err) { /* keeps working without */ }
      startWalk();
      return;
    }
    if (kind === 'continue' || kind === 'key') send(' ');
  });
  const release = () => {
    // A tap that ended before the first step: one step.
    if (hold && hold.walk && !hold.sent && KB.buffer.length === 0) { const k = walkKey(); if (k) send(k); }
    // A flick: keep running that way.
    if (finger && finger.dragged && performance.now() - finger.t0 < FLICK_MS &&
        Math.hypot(finger.x - finger.x0, finger.y - finger.y0) > FLICK_PX) {
      startRun(dirOf(finger.x - finger.x0, finger.y - finger.y0));
    }
    stopHold(); finger = null;
  };
  screenbox.addEventListener('pointerup', release);
  screenbox.addEventListener('pointercancel', release);

  // ---- Full screen and turning the phone sideways.
  const root = document.documentElement;
  const canFullScreen = !!(root.requestFullscreen || root.webkitRequestFullscreen) &&
    (document.fullscreenEnabled || document.webkitFullscreenEnabled);
  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone === true;
  async function enterFullScreen() {
    try {
      await (root.requestFullscreen ? root.requestFullscreen({ navigationUI: 'hide' }) : root.webkitRequestFullscreen());
      const so = window.screen.orientation;
      if (so && so.lock) await so.lock('landscape').catch(() => {});
    } catch (e) { /* not allowed: play in the page */ }
  }
  function toggleFullScreen() {
    if (fsElement()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else enterFullScreen();
  }

  const rotate = el('div', { className: 'touch-notice', id: 'touch-rotate' }, [
    el('div', { className: 'big', textContent: '↻' }),
    el('p', { textContent: 'Turn your device sideways to play AlphaMan.' }),
  ]);
  // The character: name, difficulty and wimpy critter are asked for here,
  // before the game starts, and remembered.  The game is given them
  // (GameHooks.newGame and GameHooks.wimpy) instead of asking.
  const PLAYER = 'alphaman-touch-player';
  const DIFFICULTIES = [['Normal', 0], ['Somewhat easy', 1], ['Easy', 2]];
  const WIMP_COLORS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15];   // not black, nor the wall colour 9
  let saved = {};
  try { saved = JSON.parse(store.get(PLAYER, '{}')) || {}; } catch (e) { saved = {}; }
  const cleanText = (v, n) => String(v || '').replace(/[^\x20-\x7e]/g, '').trim().slice(0, n);
  const cleanLetter = (v) => (/^[A-Za-z]/.test(v || '') ? v[0] : 'M');
  const startingFresh = !location.search;   // a saved game brings its own character
  const nameBox = el('input', { type: 'text', maxLength: 20, placeholder: 'random if blank', value: cleanText(saved.name, 20) });
  const wimpNameBox = el('input', { type: 'text', maxLength: 20, value: cleanText(saved.wimpName, 20) || 'Wolverine' });
  const letterBox = el('input', { type: 'text', maxLength: 1, className: 'letter', value: cleanLetter(saved.wimpSym) });
  for (const box of [nameBox, wimpNameBox, letterBox]) {
    box.autocomplete = 'off'; box.spellcheck = false;
    box.setAttribute('autocorrect', 'off'); box.setAttribute('autocapitalize', box === nameBox ? 'words' : 'off');
  }
  let difficulty = [0, 1, 2].includes(saved.difficulty) ? saved.difficulty : 0;
  let wimpColor = WIMP_COLORS.includes(saved.wimpColor) ? saved.wimpColor : 1;
  const pickers = [];
  const diffButtons = DIFFICULTIES.map(([label, v]) => {
    const b = el('button', { type: 'button', textContent: label });
    b.addEventListener('click', () => { difficulty = v; refreshForm(); });
    pickers.push(() => b.classList.toggle('on', difficulty === v));
    return b;
  });
  const preview = el('span', { className: 'preview' });
  const swatches = WIMP_COLORS.map((c) => {
    const [r, g, bl] = PALETTE[c];
    const b = el('button', { type: 'button', className: 'swatch', ariaLabel: 'colour ' + c });
    b.style.background = `rgb(${r},${g},${bl})`;
    b.addEventListener('click', () => { wimpColor = c; refreshForm(); });
    pickers.push(() => b.classList.toggle('on', wimpColor === c));
    return b;
  });
  function refreshForm() {
    for (const f of pickers) f();
    const [r, g, bl] = PALETTE[wimpColor];
    preview.textContent = cleanLetter(letterBox.value);
    preview.style.color = `rgb(${r},${g},${bl})`;
  }
  letterBox.addEventListener('input', refreshForm);
  refreshForm();
  const field = (label, ...kids) => el('div', { className: 'field' }, [el('span', { textContent: label }), ...kids]);
  const form = el('div', { id: 'touch-player' }, [
    el('div', { className: 'col' }, [
      field('Your name', nameBox),
      field('Difficulty', el('div', { className: 'seg' }, diffButtons)),
    ]),
    el('div', { className: 'col' }, [
      field('Wimpy critter', wimpNameBox),
      field('Letter', letterBox, preview),
      el('div', { className: 'swatches' }, swatches),
    ]),
  ]);
  form.hidden = !startingFresh;
  form.addEventListener('keydown', (e) => e.stopPropagation());   // typing here is not for the game
  const playFs = el('button', { type: 'button', textContent: 'Play full screen' });
  const playHere = el('button', { type: 'button', textContent: 'Play in the page' });
  const startNote = el('p', { className: 'muted' });
  const start = el('div', { className: 'touch-notice', id: 'touch-start' }, [
    el('div', { className: 'inner' }, [
      el('p', { className: 'big', textContent: 'AlphaMan' }),
      form,
      el('div', { className: 'row' }, canFullScreen && !standalone ? [playFs, ' ', playHere] : [playHere]),
      el('p', { className: 'muted', textContent: '\u21bb AlphaMan is played with the device turned sideways.' }),
      startNote,
    ]),
  ]);
  if (!canFullScreen || standalone) {
    playHere.textContent = 'Play';
    startNote.textContent = /iPhone|iPod/.test(navigator.userAgent)
      ? 'For full screen on an iPhone, tap Share and then Add to Home Screen, and play from there. ' +
        'Saved games played from the Home Screen are kept apart from those in Safari.'
      : '';
  }
  document.body.append(rotate, start);
  let started = false, player = null, releaseReady = null;
  const ready = new Promise((resolve) => { releaseReady = resolve; });
  const begin = () => {
    if (startingFresh) {
      player = {
        name: cleanText(nameBox.value, 20), difficulty,
        wimp: { name: cleanText(wimpNameBox.value, 20), sym: cleanLetter(letterBox.value), color: wimpColor },
      };
      store.set(PLAYER, JSON.stringify({
        name: player.name, difficulty, wimpName: player.wimp.name, wimpSym: player.wimp.sym, wimpColor,
      }));
    }
    started = true; start.classList.remove('show'); releaseReady();
  };
  playFs.addEventListener('click', () => { begin(); enterFullScreen(); });
  playHere.addEventListener('click', begin);
  // The start screen shows until Play is pressed (also on the Home Screen
  // and full screen when it has the character to ask for).
  function updateStart() {
    const on = document.body.classList.contains('touch');
    start.classList.toggle('show', on && !started && (startingFresh || (!standalone && !fsElement())));
  }
  // The game waits here for the character.  With the touch controls off
  // (or a saved game being loaded) it asks as usual.
  const touchOn = () => document.body.classList.contains('touch');
  GameHooks.newGame = async () => {
    if (!touchOn() || !startingFresh) return null;
    await ready;
    return player && { name: player.name, difficulty: player.difficulty };
  };
  GameHooks.wimpy = async () => {
    if (!touchOn()) return null;
    if (startingFresh) await ready;
    if (player) return player.wimp;
    return saved.wimpName ? { name: cleanText(saved.wimpName, 20), sym: cleanLetter(saved.wimpSym), color: wimpColor } : null;
  };

  // ---- Settings menu.  The button for it also shows on the desktop page.
  const menu = el('div', { id: 'touch-menu', hidden: true });
  const mk = (label, fn) => {
    const b = el('button', { type: 'button', textContent: label });
    b.addEventListener('click', () => { fn(); });
    return b;
  };
  const gameKey = (k) => () => { menu.hidden = true; send(k); };
  const modeSel = el('select', {}, [['auto', 'Automatic'], ['on', 'On'], ['off', 'Off']].map(([v, t]) => el('option', { value: v, textContent: t })));
  const themeSel = el('select', {}, [['ega', 'EGA'], ['modelm', 'IBM Model M']].map(([v, t]) => el('option', { value: v, textContent: t })));
  const padBox = el('input', { type: 'checkbox' });
  const fsButton = mk('Full screen', () => { menu.hidden = true; toggleFullScreen(); });
  const gameRows = el('div', { className: 'game-only' }, [
    el('h3', { textContent: 'Look' }),
    el('div', { className: 'row' }, [mk('Main map (F5)', gameKey(K.F5)), mk('Local map (F6)', gameKey(K.F6))]),
    el('div', { className: 'row' }, [mk('Known berries & devices (F3)', gameKey(K.F3))]),
    el('div', { className: 'row' }, [mk('Condition (F4)', gameKey(K.F4)), mk('Symbols (F7)', gameKey(K.F7))]),
    el('div', { className: 'row' }, [mk('Previous messages (P)', gameKey('P'))]),
    el('h3', { textContent: 'Game' }),
    el('div', { className: 'row' }, [mk('Fast fight on/off (F)', gameKey('F'))]),
    el('div', { className: 'row' }, [mk('Save (S)', gameKey('S')), mk('Quit (Q)', gameKey('Q'))]),
    el('div', { className: 'row' }, [mk('Wimpy critter (W)', gameKey('W')), mk('Credits (F9)', gameKey(K.F9))]),
    el('div', { className: 'row' }, [mk('Boss key: fake DOS (F10)', gameKey(K.F10))]),
    el('h3', { textContent: 'Screen' }),
    el('div', { className: 'row' }, canFullScreen ? [fsButton] : []),
    el('label', {}, [padBox, 'Arrow keys (otherwise tap the map to move)']),
    el('label', {}, ['Buttons ', themeSel]),
  ]);
  menu.append(
    gameRows,
    el('h3', { textContent: 'Touch controls' }),
    el('label', {}, [modeSel]),
    el('div', { className: 'row' }, [mk('Close', () => { menu.hidden = true; })]),
  );
  document.body.append(menu);
  function toggleMenu() { menu.hidden = !menu.hidden; }

  const settingsButton = el('button', { type: 'button', id: 'touch-settings-button', textContent: 'Settings' });
  settingsButton.addEventListener('click', () => { toggleMenu(); settingsButton.blur(); });
  document.getElementById('controls').append(settingsButton);
  menu.addEventListener('keydown', (e) => e.stopPropagation());   // its controls are not game keys

  modeSel.value = store.get(MODE, 'auto');
  themeSel.value = store.get(THEME, 'ega');
  padBox.checked = store.get(PAD, 'off') === 'on';   // off: tap the map to move
  modeSel.addEventListener('change', () => { store.set(MODE, modeSel.value); apply(); });
  themeSel.addEventListener('change', () => { store.set(THEME, themeSel.value); apply(); });
  padBox.addEventListener('change', () => { store.set(PAD, padBox.checked ? 'on' : 'off'); apply(); });

  function apply() {
    const on = isOn(), b = document.body.classList;
    b.toggle('touch', on);
    b.toggle('touch-pad', on && padBox.checked);
    b.toggle('tk-ega', themeSel.value !== 'modelm');
    b.toggle('tk-modelm', themeSel.value === 'modelm');
    if (!on) { typeBox.classList.remove('show'); items.classList.remove('show'); strip.classList.remove('show'); }
    else showWait(GameWait.kind, GameWait.info);
    updateStart();
  }
  // A long press would otherwise select text or open a menu (with a buzz).
  for (const type of ['contextmenu', 'selectstart']) {
    document.addEventListener(type, (e) => {
      const inForm = e.target.closest && e.target.closest('#touch-player');
      if (document.body.classList.contains('touch') && e.target !== input && !inForm) e.preventDefault();
    }, true);
  }
  coarse.addEventListener('change', apply);
  document.addEventListener('fullscreenchange', updateStart);
  document.addEventListener('webkitfullscreenchange', updateStart);
  apply();

  // Fast fight (no space needed between blows) starts on with touch controls;
  // F in the More menu still turns it off.
  GameHooks.fastFightOn = () => document.body.classList.contains('touch');

  // For tests.
  window.AlphaManTouch = { apply, isOn, menu, begin };
})();

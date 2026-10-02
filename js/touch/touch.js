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
  const MODE = 'alphaman-touch', THEME = 'alphaman-touch-theme', PAD = 'alphaman-touch-pad';
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
    [K.ArrowLeft, '←'], ['.', '·'], [K.ArrowRight, '→'],
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
    hold = repeat ? { key, next: performance.now() + 350 } : null;
  }
  function stopHold() { hold = null; }
  setInterval(() => {
    pumpTarget();
    // The panel key is captioned with what it would show next.
    const word = globalThis.rdisp === 2 ? 'stats' : 'items';
    const cap = panelCaption();
    if (cap && cap.textContent !== word) cap.textContent = word;
    if (!hold || performance.now() < hold.next || KB.buffer.length) return;
    const k = hold.key();
    if (k) send(k);
    hold.next = performance.now() + 160;
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
  const pad = el('div', { id: 'touch-pad' }, PADKEYS.map(([k, l]) => makeKey([k, l, '', 'move'], true)));
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
  function walkKey(col, row) {
    if (GameWait.kind !== 'command' || SCR.vpage !== 1) return null;
    const dx = col - globalThis.localx, dy = row - globalThis.localy;
    if (!dx && !dy) return null;
    return dirKey(dx, dy);
  }

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
      if (onMap(cell) && !view3dCovers()) startHold(() => walkKey(cell.col, cell.row), true);
      return;
    }
    if (kind === 'continue' || kind === 'key') send(' ');
  });
  const release = () => stopHold();
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
  const playFs = el('button', { type: 'button', textContent: 'Play full screen' });
  const playHere = el('button', { type: 'button', textContent: 'Play in the page' });
  const startNote = el('p', { className: 'muted' });
  const start = el('div', { className: 'touch-notice', id: 'touch-start' }, [
    el('p', { className: 'big', textContent: 'AlphaMan' }),
    el('div', { className: 'row' }, canFullScreen ? [playFs, ' ', playHere] : [playHere]),
    el('p', { textContent: '\u21bb AlphaMan is played with the device turned sideways.' }),
    startNote,
  ]);
  if (!canFullScreen) {
    playHere.textContent = 'Play';
    startNote.textContent = /iPhone|iPod/.test(navigator.userAgent)
      ? 'For full screen on an iPhone, tap Share and then Add to Home Screen, and play from there. ' +
        'Saved games played from the Home Screen are kept apart from those in Safari.'
      : '';
  }
  document.body.append(rotate, start);
  let started = false;
  const begin = () => { started = true; start.classList.remove('show'); };
  playFs.addEventListener('click', () => { begin(); enterFullScreen(); });
  playHere.addEventListener('click', begin);
  function updateStart() {
    start.classList.toggle('show', document.body.classList.contains('touch') && !started && !standalone && !fsElement());
  }

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
    el('label', {}, [padBox, 'Direction pad']),
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
  padBox.checked = store.get(PAD, 'on') === 'on';
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

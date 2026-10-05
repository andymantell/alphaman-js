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
  const MODE = 'alphaman-touch', PAD = 'alphaman-touch-arrows';
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

  // The game's commands (from its ? screen).  id: [key, legend, word, class]
  // 'inv' shows the items on the right of the screen (F2), where tapping one
  // offers what to do with it, or the stats again (F1); 'menu' opens More.
  const KEYS = {
    inv: ['inv', 'i', 'inv/stats', 'fkey long'],
    F5: [K.F5, 'F5', 'map', 'fkey'], F3: [K.F3, 'F3', 'berries', 'fkey'], F4: [K.F4, 'F4', 'condition', 'fkey long'],
    a: ['a', 'a', 'again'], s: ['s', 's', 'search'], m: ['m', 'm', 'mental'], p: ['p', 'p', 'phys'],
    r: ['r', 'r', 'trap'], S: ['S', 'S', 'save', 'fkey'], rest: ['.', '.', 'rest'], Z: ['Z', 'Z', 'sleep'],
    down: ['<', '<', 'down'], up: ['>', '>', 'up'],
    esc: ['\x1b', 'Esc', 'cancel', 'special'], help: ['?', '?', 'help'], more: ['menu', '\u2261', 'more', 'special'],
    space: [' ', '\u2423', 'space', 'move'],
    // The direction keys of the upright keyboard (held: keep walking).
    nw: [K.Home, '\u2196', '', 'move arrow'], n: [K.ArrowUp, '\u2191', '', 'move arrow'], ne: [K.PageUp, '\u2197', '', 'move arrow'],
    w: [K.ArrowLeft, '\u2190', '', 'move arrow'], e: [K.ArrowRight, '\u2192', '', 'move arrow'],
    sw: [K.End, '\u2199', '', 'move arrow'], so: [K.ArrowDown, '\u2193', '', 'move arrow'], se: [K.PageDown, '\u2198', '', 'move arrow'],
  };
  // Where the keys go.  [id, extra class]; '' is a gap.
  //  Sideways, in two columns either side of the screen: on the left Esc,
  //  the F keys, then doing things; on the right stairs, help and sleep,
  //  then answering the game, with Space and Enter side by side.
  //  Upright, a row above the screen laid out like the top of the keyboard
  //  (Esc, F keys, help, More), and below it a keyboard: direction keys
  //  beside the commands, then the stairs, Space and Enter.
  const LAYOUTS = {
    sideways: {
      // Esc and the F keys at the top left, as on the keyboard.
      // One column of wide keys each side (like a Model M's Tab and Ctrl),
      // each with its name on the cap beside its letter.
      left: ['esc', 'F3', 'F4', 'F5', 'inv', 'a', 's', 'm', 'p', 'r'],
      right: ['down', 'up', 'help', 'Z', 'S', 'rest', 'more', 'space'],
    },
    upright: {
      // Esc on its own, the F keys in their groups (F1-F4, F5-F8 on a Model
      // M), then a wide More.  The space between F4 and F5 is in the middle
      // of the screen, where phones usually have their camera.
      top: ['esc', '', 'F3', 'F4', '', 'F5', '', 'more'],
      // Commands below the screen (walk by tapping or swiping the map), in
      // the order their keys have on a Model M, left to right: a s S r i p
      // (the letter rows; S is shift+s), then z m < > . ? (the bottom row;
      // < > . ? are the comma, period and slash keys), then the space bar.
      // No Enter: a target is fired at with the Fire answer button (or a
      // second tap on it).
      bottom: ['a', 's', 'S', 'r', 'inv', 'p', 'Z', 'm', 'down', 'up', 'rest', 'help', ['space', 'wide6']],
    },
  };

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
    if (!hold || performance.now() < hold.next || KB.buffer.length) return;
    const k = hold.key();
    hold.next = performance.now() + (hold.walk && !hold.sent ? 300 : 160);
    if (k) { send(k); hold.sent = true; }
  }, 20);

  function makeKey([key, legend, word, cls], repeat) {
    const b = el('button', { type: 'button', className: 'tk ' + (cls || '') }, [legend]);
    b.dataset.base = b.className;
    if (word) b.append(el('small', { textContent: word }));
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      b.classList.add('down');
      if (key === 'menu') { toggleMenu(); return; }
      target = null;
      if (key === 'inv') { closePopup(); send(globalThis.rdisp === 2 ? K.F1 : K.F2); return; }
      startHold(() => key, repeat);
    });
    const up = () => { b.classList.remove('down'); stopHold(); };
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('pointerleave', up);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    return b;
  }
  const keyButtons = new Map();   // id -> button
  for (const [id, def] of Object.entries(KEYS)) {
    const b = makeKey(def, def[3] && def[3].includes('arrow'));
    b.dataset.k = id;
    keyButtons.set(id, b);
  }
  const holders = {
    left: el('div', { className: 'touch-side', id: 'touch-left' }),
    right: el('div', { className: 'touch-side', id: 'touch-right' }),
    top: el('div', { className: 'touch-keys', id: 'touch-top' }),
    bottom: el('div', { className: 'touch-keys', id: 'touch-bottom' }),
  };
  playarea.prepend(holders.top, holders.left);
  playarea.append(holders.right, holders.bottom);
  // Puts the keys where the layout for the way the screen is turned says.
  const upright = matchMedia('(orientation: portrait)');
  function placeKeys() {
    const layout = LAYOUTS[upright.matches ? 'upright' : 'sideways'];
    for (const [name, holder] of Object.entries(holders)) {
      holder.replaceChildren(...(layout[name] || []).map((item) => {
        const [id, extra] = Array.isArray(item) ? item : [item, ''];
        if (!id) return el('span', { className: 'gap' });
        const b = keyButtons.get(id);
        b.className = b.dataset.base + (extra ? ' ' + extra : '');
        return b;
      }));
    }
  }
  placeKeys();
  upright.addEventListener('change', placeKeys);
  const pad = el('div', { id: 'touch-pad' }, PADKEYS.map((k) => k ? makeKey([k[0], k[1], '', 'move'], true) : el('span')));
  screenbox.append(pad);

  // ---- What the game waits for.  Nothing is typed with the phone's
  // keyboard: numbers have a number pad, everything else buttons or taps.
  const items = el('div', { id: 'touch-items' });
  screenbox.append(items);

  function showWait(kind, info) {
    if (!document.body.classList.contains('touch')) return;
    keyButtons.get('space').classList.toggle('glow', kind === 'continue');
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

  // ---- Answer buttons.  When the game asks a question with set answers
  // (yes / no, a numbered list, short or long range...) or for a number,
  // they appear at the top of the screen, so nothing has to be typed.
  const answers = el('div', { id: 'touch-answers' });
  screenbox.append(answers);
  function showAnswers(keys) {
    answers.replaceChildren(...keys.map(([key, label]) => {
      const b = el('button', { type: 'button', className: 'tk answer' + (label.length > 2 ? ' word' : '') }, [label]);
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); send(key); });
      return b;
    }));
    answers.classList.add('show');
  }
  const NUMPAD = [...'1234567890'].map((d) => [d, d]).concat([['\b', '\u232b'], ['\r', 'OK']]);
  GameWait.listeners.push((kind, info) => {
    if (!document.body.classList.contains('touch') || kind === null) return;
    if (kind === 'choice') showAnswers(info.keys);
    else if (kind === 'text') showAnswers(info.numeric ? NUMPAD : [['\r', 'OK']]);   // (no other line is asked for with touch)
    else if (kind === 'target') showAnswers([['\r', info.page === 0 ? 'OK' : 'Fire']]);   // Enter: at the cursor (page 0: a region on the main map)
    else answers.classList.remove('show');
  });

  // ---- Inventory: with the items on the right of the screen, tapping one
  // offers what to do with it.  The command is sent, then the item when the
  // game asks which (found again by its name, in case the list changed).
  const popup = el('div', { id: 'touch-popup', hidden: true });
  screenbox.append(popup);
  let pending = null;   // { action, text, t }
  const rowText = (row) => {
    let t = '';
    for (let c = 57; c <= 80; c++) t += String.fromCharCode(cellCode(c, row));
    return t.trimEnd();
  };
  function closePopup() { popup.hidden = true; }
  function itemAt(cell) {
    if (GameWait.kind !== 'command' || globalThis.rdisp !== 2 || SCR.vpage > 1 || cell.col < 54) return null;
    const i = cell.row - 1, code = cellCode(55, cell.row);
    if (i < 1 || i > ngoody || code !== 96 + i || cellCode(56, cell.row) !== 32) return null;
    return { i, row: cell.row, text: rowText(cell.row), inUse: cellCode(54, cell.row) === 42 };
  }
  function openPopup(item) {
    const type = Math.abs(goody[item.i][1]);
    const acts = [item.inUse ? ['U', 'Unuse'] : ['u', 'Use']];
    if (type === 1 || type === 2 || type === 6) acts.push(['e', 'Eat']);
    acts.push(['t', 'Throw'], ['f', 'Figure out'], ['X', 'Examine'], ['d', 'Drop']);
    popup.replaceChildren(
      el('p', { textContent: item.text }),
      ...acts.map(([key, label]) => {
        // A key like the others: the game's own key for it, and what it does.
        const b = el('button', { type: 'button', className: 'tk act' }, [key, el('small', { textContent: label.toLowerCase() })]);
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault(); e.stopPropagation(); closePopup();
          pending = { action: key, text: item.text, t: performance.now() };
          send(key);
        });
        return b;
      }),
      (() => {
        const b = el('button', { type: 'button', className: 'tk act special' }, ['Esc', el('small', { textContent: 'cancel' })]);
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); closePopup(); });
        return b;
      })(),
    );
    popup.style.top = Math.min(item.row, 14) * 100 / 25 + '%';
    popup.hidden = false;
  }
  GameWait.listeners.push((kind, info) => {
    if (kind !== null) closePopup();
    if (!pending || kind === null) return;
    const p = pending;
    if (performance.now() - p.t > 10000) { pending = null; return; }
    if (kind === 'choice' && p.action === 'X' && info.keys.some(([k]) => k === 'I')) {
      setTimeout(() => send('I'));   // examine: an item
      return;
    }
    pending = null;
    if (kind !== 'item') return;   // the game said something else instead
    for (let row = 2; row <= info.count + 1; row++) {
      if (rowText(row) === p.text && cellCode(55, row) === 95 + row) { setTimeout(() => send(String.fromCharCode(95 + row))); return; }
    }
  });

  // ---- Taps on the game screen.
  const view3dCovers = () => {
    const c = document.getElementById('screen3d');
    return !!c && getComputedStyle(c).display !== 'none';
  };
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  // The game square under a touch.
  function cellAt(e) {
    if (split) return splitCellAt(e.clientX, e.clientY);
    const r = canvas.getBoundingClientRect();
    return {
      col: clamp(Math.floor((e.clientX - r.left) / r.width * 80) + 1, 1, 80),
      row: clamp(Math.floor((e.clientY - r.top) / r.height * 25) + 1, 1, 25),
    };
  }
  // Where the character is on the page, and half a square's size.
  function characterAt() {
    const r = (split ? mapCanvas : canvas).getBoundingClientRect();
    const cols = split ? 52 : 80, rows = split ? 22 : 25;
    return {
      x: r.left + (localx - 0.5) * r.width / cols, y: r.top + (localy - 0.5) * r.height / rows,
      hw: r.width / cols / 2, hh: r.height / rows / 2,
    };
  }

  // ---- Portrait: the map takes the full width, with the messages under it
  // and then the panel from the right of the screen (stats or items), its
  // lines laid out again in two columns, with the location box above them.
  // All copied from the game screen, which the game draws as always; taps
  // on the copies are taken back to the squares they show.  Other screens
  // (help, lists, the start) are shown whole.
  const MAP_CORNERS = new Set([218, 191, 192, 217, 201, 187, 200, 188]);
  const portrait = matchMedia('(orientation: portrait)');
  const PANEL_LINES = 10;   // lines per column kept free (most panels fit)
  const mapCanvas = el('canvas', { width: 468, height: 352 });
  const pmMap = el('div', { id: 'pm-map' }, [mapCanvas]);
  const msgCanvas = el('canvas', { id: 'pm-msg', width: 486, height: 48 });
  const panelCanvas = el('canvas', { id: 'pm-panel', width: 486, height: 16 * (PANEL_LINES + 1) });
  const pm = el('div', { id: 'pm' }, [pmMap, msgCanvas, panelCanvas]);
  screenbox.append(pm);
  let split = false;
  let panelLines = [];   // { row, side, line }: game row shown on panel line (from 1), column side 0 / 1
  const blankCell = (c) => (c & 255) === 32 || (c & 255) === 0;
  const playingScreen = () => SCR.vpage <= 1 &&
    [[1, 1], [52, 1], [1, 22], [52, 22]].every(([x, y]) => MAP_CORNERS.has(SCR.getCell(0, x, y) & 255));
  const view3dOn = () => !!(window.AlphaMan3D && window.AlphaMan3D.view && window.AlphaMan3D.view.on);
  function layoutPanel() {
    const rows = [];
    for (let row = 1; row <= 22; row++) {
      for (let col = 54; col <= 80; col++) if (!blankCell(SCR.getCell(SCR.vpage, col, row))) { rows.push(row); break; }
    }
    const per = Math.max(1, Math.ceil(rows.length / 2));
    panelLines = rows.map((row, i) => ({ row, side: i < per ? 0 : 1, line: (i % per) + 1 }));
    return per;
  }
  function setSplit(on) {
    if (on === split) return;
    split = on;
    document.body.classList.toggle('pm', on);
    (on ? pmMap : screenbox).append(pad);
  }
  function drawSplit() {
    const on = document.body.classList.contains('touch') && portrait.matches && playingScreen() && !view3dOn();
    setSplit(on);
    if (on) {
      mapCanvas.getContext('2d').drawImage(canvas, 0, 0, 468, 352, 0, 0, 468, 352);
      msgCanvas.getContext('2d').drawImage(canvas, 0, 352, 486, 48, 0, 0, 486, 48);
      const per = layoutPanel(), h = 16 * (Math.max(per, PANEL_LINES) + 1);
      if (panelCanvas.height !== h) panelCanvas.height = h;
      const ctx = panelCanvas.getContext('2d');
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 486, h);
      // The location box (rows 24 and 25, columns 56-80) as one line.
      ctx.drawImage(canvas, 495, 368, 225, 16, 18, 0, 225, 16);
      ctx.drawImage(canvas, 495, 384, 225, 16, 243, 0, 225, 16);
      for (const { row, side, line } of panelLines) {
        ctx.drawImage(canvas, 477, (row - 1) * 16, 243, 16, side * 243, line * 16, 243, 16);
      }
      panelCanvas.classList.toggle('pick', GameWait.kind === 'item');
    }
    requestAnimationFrame(drawSplit);
  }
  requestAnimationFrame(drawSplit);
  function splitCellAt(x, y) {
    let r = mapCanvas.getBoundingClientRect();
    if (y < r.bottom) {
      return { col: clamp(Math.floor((x - r.left) / r.width * 52) + 1, 1, 52), row: clamp(Math.floor((y - r.top) / r.height * 22) + 1, 1, 22) };
    }
    r = msgCanvas.getBoundingClientRect();
    if (y < r.bottom) {
      return { col: clamp(Math.floor((x - r.left) / r.width * 54) + 1, 1, 54), row: clamp(Math.floor((y - r.top) / r.height * 3) + 23, 23, 25) };
    }
    r = panelCanvas.getBoundingClientRect();
    const sx = (x - r.left) / r.width * 486, sy = (y - r.top) / r.height * panelCanvas.height;
    const line = Math.floor(sy / 16), side = sx < 243 ? 0 : 1;
    const col = 54 + clamp(Math.floor((sx - side * 243) / 9), 0, 26);
    if (line <= 0) return { col: clamp(col + 2, 56, 80), row: 24 };
    const hit = panelLines.find((p) => p.side === side && p.line === line);
    return { col, row: hit ? hit.row : 23 };   // row 23 of the panel is always blank
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
    const c = characterAt(), px = finger.x - c.x, py = finger.y - c.y;
    if (Math.abs(px) < c.hw && Math.abs(py) < c.hh) return null;   // on the character
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
    if (kind === 'text') return;
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
    if (kind === 'direction') {
      const c = characterAt(), px = e.clientX - c.x, py = e.clientY - c.y;
      if (Math.abs(px) > c.hw || Math.abs(py) > c.hh) send(dirOf(px, py));
      return;
    }
    if (kind === 'command') {
      const item = itemAt(cell);
      if (item) { openPopup(item); return; }
      if (!popup.hidden) { closePopup(); return; }
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
  popup.addEventListener('pointerdown', (e) => e.stopPropagation());
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

  // ---- Full screen.
  const root = document.documentElement;
  const canFullScreen = !!(root.requestFullscreen || root.webkitRequestFullscreen) &&
    (document.fullscreenEnabled || document.webkitFullscreenEnabled);
  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone === true;
  // Some phones leave full screen when turned round.  If the player had it
  // on and did not turn it off in More, a button over the screen puts it
  // back, and when it was the turning, so does the next tap anywhere (a page
  // may only ask for full screen straight after a tap).
  let wantFull = false, turnedAt = -1e9, tapBack = false;
  matchMedia('(orientation: portrait)').addEventListener('change', () => { turnedAt = performance.now(); });
  async function enterFullScreen() {
    try {
      await (root.requestFullscreen ? root.requestFullscreen({ navigationUI: 'hide' }) : root.webkitRequestFullscreen());
      wantFull = true;
    } catch (e) { /* not allowed: play in the page */ }
    fsBack.hidden = true;
  }
  function toggleFullScreen() {
    if (fsElement()) { wantFull = false; (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    else enterFullScreen();
  }
  const fsBack = el('button', { type: 'button', id: 'touch-fs-back', className: 'tk special', hidden: true }, ['\u26f6', el('small', { textContent: 'full screen' })]);
  screenbox.append(fsBack);
  const lostFull = () => wantFull && !fsElement() && document.body.classList.contains('touch');
  const onFsChange = () => {
    fsBack.hidden = !lostFull();
    tapBack = lostFull() && performance.now() - turnedAt < 2000;
  };
  fsBack.addEventListener('click', enterFullScreen);
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);
  // pointerup (not pointerdown) is a tap browsers accept for full screen.
  document.addEventListener('pointerup', () => { if (tapBack && lostFull()) { tapBack = false; enterFullScreen(); } }, true);

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
  // One Play button: full screen where the browser has it.
  const play = el('button', { type: 'button', textContent: 'Play' });
  const startNote = el('p', { className: 'muted' });
  const start = el('div', { className: 'touch-notice', id: 'touch-start' }, [
    el('div', { className: 'inner' }, [
      el('p', { className: 'big', textContent: 'AlphaMan' }),
      form,
      el('div', { className: 'row' }, [play]),
      startNote,
    ]),
  ]);
  if (!canFullScreen) {
    startNote.textContent = /iPhone|iPod/.test(navigator.userAgent)
      ? 'For full screen on an iPhone, tap Share and then Add to Home Screen, and play from there. ' +
        'Saved games played from the Home Screen are kept apart from those in Safari.'
      : '';
  }
  document.body.append(start);
  let started = false, player = null, releaseReady = null;
  const ready = new Promise((resolve) => { releaseReady = resolve; });
  const fromForm = () => ({
    name: cleanText(nameBox.value, 20), difficulty,
    wimp: { name: cleanText(wimpNameBox.value, 20), sym: cleanLetter(letterBox.value), color: wimpColor },
  });
  const begin = () => {
    if (startingFresh) {
      player = fromForm();
      store.set(PLAYER, JSON.stringify({
        name: player.name, difficulty, wimpName: player.wimp.name, wimpSym: player.wimp.sym, wimpColor,
      }));
    }
    started = true; start.classList.remove('show'); releaseReady();
  };
  play.addEventListener('click', () => {
    begin();
    if (canFullScreen && !standalone && !fsElement()) enterFullScreen();
  });
  // The start screen shows until Play is pressed (also on the Home Screen
  // and full screen when it has the character to ask for).
  function updateStart() {
    const on = document.body.classList.contains('touch');
    start.classList.toggle('show', on && !started && (startingFresh || (!standalone && !fsElement())));
  }
  // The game waits here for the character.  With the touch controls off it
  // asks as usual; a saved game being loaded has its own, until the player
  // plays again (again: the game's "play again"), when the remembered
  // character is used.
  const touchOn = () => document.body.classList.contains('touch');
  let again = false;
  GameHooks.newGame = async (playAgain) => {
    if (!touchOn()) return null;
    if (playAgain) again = true;
    if (!startingFresh && !again) return null;
    if (startingFresh) await ready;
    const p = player || fromForm();
    return { name: p.name, difficulty: p.difficulty };
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
  const padBox = el('input', { type: 'checkbox' });
  const fsButton = mk('Full screen', () => { menu.hidden = true; toggleFullScreen(); });
  const gameRows = el('div', { className: 'game-only' }, [
    el('h3', { textContent: 'Look' }),
    el('div', { className: 'row' }, [mk('Local map (F6)', gameKey(K.F6)), mk('Symbols (F7)', gameKey(K.F7))]),
    el('div', { className: 'row' }, [mk('Previous messages (P)', gameKey('P'))]),
    el('h3', { textContent: 'Game' }),
    el('div', { className: 'row' }, [mk('Fast fight on/off (F)', gameKey('F'))]),
    el('div', { className: 'row' }, [mk('Credits (F9)', gameKey(K.F9))]),
    el('div', { className: 'row' }, [mk('Boss key: fake DOS (F10)', gameKey(K.F10))]),
    el('h3', { textContent: 'Screen' }),
    el('div', { className: 'row' }, canFullScreen ? [fsButton] : []),
    el('label', {}, [padBox, 'Arrow keys (otherwise tap the map to move)']),
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
  padBox.checked = store.get(PAD, 'off') === 'on';   // off: tap the map to move
  modeSel.addEventListener('change', () => { store.set(MODE, modeSel.value); apply(); });
  padBox.addEventListener('change', () => { store.set(PAD, padBox.checked ? 'on' : 'off'); apply(); });

  function apply() {
    const on = isOn(), b = document.body.classList;
    b.toggle('touch', on);
    b.toggle('touch-pad', on && padBox.checked);
    b.add('tk-modelm');   // the buttons look like IBM Model M keys
    if (!on) {
      for (const x of [items, answers]) x.classList.remove('show');
      closePopup();
    }
    else showWait(GameWait.kind, GameWait.info);
    updateStart();
  }
  // A long press would otherwise select text or open a menu (with a buzz).
  for (const type of ['contextmenu', 'selectstart']) {
    document.addEventListener(type, (e) => {
      const inForm = e.target.closest && e.target.closest('#touch-player');
      if (document.body.classList.contains('touch') && !inForm) e.preventDefault();
    }, true);
  }
  coarse.addEventListener('change', apply);
  document.addEventListener('fullscreenchange', updateStart);
  document.addEventListener('webkitfullscreenchange', updateStart);
  apply();

  // Fast fight (no space needed between blows) starts on with touch controls;
  // F in the More menu still turns it off.
  GameHooks.fastFightOn = () => document.body.classList.contains('touch');

  // Aiming tells you to use the arrow keys and Enter; with touch controls it
  // says what to tap instead (the answer button is Fire, or OK for a region).
  const REWORD = {
    'Use arrow keys to indicate target': 'Tap the map to aim',
    'Use arrow keys to indicate region': 'Tap the map to pick a region',
  };
  GameHooks.reword = ([l1, l2]) => {
    if (!touchOn() || !REWORD[l1.trim()]) return [l1, l2];
    const region = /region/.test(l1);
    return [REWORD[l1.trim()], `Tap ${region ? 'OK' : 'Fire'} when ready or Esc to exit`];
  };

  // Where a game square is shown on the page (its centre), in either layout.
  function whereIs(col, row) {
    const at = (el, fx, fy) => { const r = el.getBoundingClientRect(); return { x: r.left + fx * r.width, y: r.top + fy * r.height }; };
    if (!split) return at(canvas, (col - 0.5) / 80, (row - 0.5) / 25);
    if (row <= 22 && col <= 52) return at(mapCanvas, (col - 0.5) / 52, (row - 0.5) / 22);
    if (row >= 23 && col <= 54) return at(msgCanvas, (col - 0.5) / 54, (row - 22.5) / 3);
    const h = panelCanvas.height;
    if (row >= 24) return at(panelCanvas, (Math.max(col, 56) - 56 + 2.5 + (row - 24) * 25) * 9 / 486, 8 / h);
    const p = panelLines.find((q) => q.row === row);
    return p ? at(panelCanvas, (p.side * 243 + (col - 54 + 0.5) * 9) / 486, (p.line * 16 + 8) / h) : null;
  }

  // For tests.
  window.AlphaManTouch = {
    apply, isOn, menu, begin, whereIs,
    isSplit: () => split, panelLines: () => panelLines, cellAtPoint: (x, y) => cellAt({ clientX: x, clientY: y }),
  };
})();

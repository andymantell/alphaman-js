// QuickBasic console statements (SCREEN, COLOR, LOCATE, PRINT, CLS, INKEY$,
// INPUT, LINE INPUT) on top of TextScreen and Keyboard.
'use strict';

const SCR = new TextScreen();
let KB = null;              // created by main.js once the page is ready

// SCREEN , , apage, vpage
function screenPages(apage, vpage) { SCR.screen(apage, vpage); }
function color(f, b) { SCR.color(f, b); }
function locate(row, col, cursor) { SCR.locate(row, col, cursor); }
function cls() { SCR.cls(); }
function csrlin() { return SCR.csrlin(); }
function pos() { return SCR.pos(); }

// PRINT a; b; c;   -> print(a, b, c)
// PRINT a; b; c    -> println(a, b, c)
// Numbers are formatted as PRINT does: STR$() plus a trailing space.  Pass
// singles as {single: x} to get SINGLE formatting.
function printText(v) {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return str$(v, Number.isInteger(v) ? 'int' : 'single') + ' ';
  if (v && v.single !== undefined) return str$(v.single, 'single') + ' ';
  return String(v);
}
function print(...items) { for (const v of items) SCR.printItem(printText(v)); }
function println(...items) { print(...items); SCR.newline(); }
function printTab(n) { SCR.tab(n); }

// INKEY$
function inkey$() { return KB.inkey(); }

// What the game is waiting for, for the touch controls (js/touch/).  The game
// only labels its waits (GameWait.next) and never reads any of this back, so
// it runs the same with or without the touch controls.
//   kind: null (not waiting), 'command', 'item', 'target', 'continue',
//         'key' (anything else) or 'text' (a line being typed)
//   info: details of the wait (for 'text': row, col, numeric, value)
const GameWait = {
  kind: null, info: null,
  label: null, numeric: false,
  listeners: [],
  // Labels the next key wait.
  next(kind, info = null) { this.label = { kind, info }; },
  // Marks the next line input as a number.
  number() { this.numeric = true; },
  // Labels the next key wait as a choice between keys: [key, label] pairs.
  choice(...keys) { this.next('choice', { keys }); },
  yesNo() { this.choice(['Y', 'Y'], ['N', 'N']); },
  // A choice of the numbers 1 to n (one key each).
  numbers(n) {
    const keys = [];
    for (let i = 1; i <= Math.min(n, 9); i++) keys.push([String(i), String(i)]);
    keys.push(['\x1b', 'None']);
    this.choice(...keys);
  },
  set(kind, info) {
    this.kind = kind; this.info = info;
    for (const f of this.listeners) f(kind, info);
  },
};

// WHILE a$ = "": a$ = INKEY$: WEND
async function getKey() {
  const label = GameWait.label || { kind: 'key', info: null };
  GameWait.label = null;
  let told = false;
  for (;;) {
    const k = KB.inkey();
    if (k !== '') { if (GameWait.kind) GameWait.set(null, null); return k; }
    if (!told) { told = true; GameWait.set(label.kind, label.info); }
    await KB.whenKey();
  }
}

// Pause for a number of seconds (the original busy-waits on TIMER).
function sleepSeconds(s) { return new Promise((resolve) => setTimeout(resolve, s * 1000)); }

// LINE INPUT [;] ["prompt";] v$ — line editor at the cursor.  With
// `stayOnLine` (the ";" form) the cursor is not moved to the next line.
async function lineInput(prompt = '', stayOnLine = false) {
  SCR.print(prompt);
  const startRow = SCR.row, startCol = SCR.col;
  let s = '';
  const wait = { row: startRow, col: startCol, numeric: GameWait.numeric, value: '' };
  GameWait.numeric = false;
  const oldCursor = SCR.cursorVisible;
  SCR.cursorVisible = true;
  SCR.dirty = true;
  for (;;) {
    wait.value = s;
    GameWait.next('text', wait);
    const k = await getKey();
    if (k === '\r') break;
    if (k === '\b') {
      if (s.length) {
        s = s.slice(0, -1);
        SCR.col--;
        if (SCR.col < 1) { SCR.col = 80; SCR.row--; }
        SCR.setCell(SCR.apage, SCR.col, SCR.row, 0x20 | (SCR.attr() << 8));
        SCR.dirty = true;
      }
    } else if (k === '\x1b') {
      while (s.length) {
        s = s.slice(0, -1);
        SCR.col--;
        if (SCR.col < 1) { SCR.col = 80; SCR.row--; }
        SCR.setCell(SCR.apage, SCR.col, SCR.row, 0x20 | (SCR.attr() << 8));
      }
      SCR.row = startRow; SCR.col = startCol;
      SCR.dirty = true;
    } else if (k.length === 1 && k.charCodeAt(0) >= 32 && s.length < 255) {
      s += k;
      SCR.print(k);
    }
  }
  SCR.cursorVisible = oldCursor;
  if (!stayOnLine) SCR.newline();
  SCR.dirty = true;
  return s;
}

// INPUT "prompt", v$ (comma form: no question mark) or INPUT "prompt"; v$.
async function input(prompt = '', question = true, stayOnLine = false) {
  return lineInput(prompt + (question ? '? ' : ''), stayOnLine);
}

// END: stops the program.
class ProgramEnd extends Error {}
function end() { throw new ProgramEnd('END'); }

// INPUT "prompt", v$ / INPUT "prompt"; v$ for one string variable.
// Leading and trailing blanks are removed; an unquoted comma means too many
// values and QuickBasic asks again.
async function inputString(prompt = '', question = false) {
  for (;;) {
    const line = (await lineInput(prompt + (question ? '? ' : ''))).trim();
    const q = /^"([^"]*)"?\s*$/.exec(line);
    if (q) return q[1];
    if (line.indexOf(',') < 0) return line;
    println('?Redo from start');
  }
}

// INPUT "prompt", v for one numeric variable.
async function inputNumber(prompt = '', question = false) {
  for (;;) {
    GameWait.number();
    const line = (await lineInput(prompt + (question ? '? ' : ''))).trim();
    if (line === '') return 0;
    if (/^[+-]?(\d+\.?\d*|\.\d+)([ED][+-]?\d+)?[!#%&]?$/i.test(line) || /^&H[0-9A-F]+$/i.test(line)) return val(line);
    println('?Redo from start');
  }
}

// Hooks for the conveniences of the optional 3D view and touch controls.
// With those off they all return false and the game runs the original code
// unchanged.
const GameHooks = {
  fastAreaChange: () => false,   // skip the one second minimum when entering an area
  fastFightOn: () => false,      // start a game with fast fight on
  // Details the touch controls collect before the game starts, so that
  // nothing has to be typed.  Both may wait (for the start screen) and give
  // null when the game should ask as usual.
  newGame: async (playAgain) => null,   // { name, difficulty: 0 | 1 | 2 }
  wimpy: async () => null,       // { name, sym, color }
  // The game's instructions where they name keys a touch screen does not
  // have (e.g. aiming: the arrow keys and Enter): given the message lines,
  // gives the lines to print.
  reword: (lines) => lines,
};

// Lets the browser render and handle events during long stretches of play
// that never wait for a key (e.g. while the character is asleep).
let lastYield = 0;
async function yieldToBrowser() {
  const now = performance.now();
  if (now - lastYield < 30) return;
  lastYield = now;
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// LPRINT: collected and sent to the browser's print dialog.
let printerLines = [];
function lprint(text) { printerLines.push(text); }
function lprintFlush() {
  const text = printerLines.join('\n');
  printerLines = [];
  if (typeof window === 'undefined' || !window.open) return;
  const w = window.open('', '_blank');
  if (!w) return;
  const pre = w.document.createElement('pre');
  pre.textContent = text;
  w.document.body.appendChild(pre);
  w.document.title = 'AlphaMan commands';
  w.print();
}

// Keyboard handling for the 3D view.  The game itself is not changed: keys
// it should see are put into its keyboard buffer (KB.push) exactly as the
// keyboard would, and keys meant for the 3D view are kept from it.
//
// With a camera that turns with the character, movement is relative to the
// way you face: Up / Down (and keypad 8 / 2) move forwards / backwards,
// Left / Right turn by 45 degrees, keypad 4 / 6 step sideways and keypad
// 7 / 9 / 1 / 3 move diagonally.  Each is sent to the game as the compass
// direction it means.  With the tabletop camera the keys keep their compass
// directions.
//
// Walking is paced by the 3D view rather than by the keyboard's auto-repeat:
// the first step is sent at once, then one step every WALK_FACTOR repeat
// intervals while a movement key is held, and only when the game has taken
// the previous key.  Holding keys is tracked here, so turning while walking
// keeps you walking in the new direction.

// Compass directions clockwise from north, as the game's key codes
// (CHR$(0) + scan code): N, NE, E, SE, S, SW, W, NW.
const COMPASS = [72, 73, 77, 81, 80, 79, 75, 71].map((s) => '\0' + String.fromCharCode(s));

// Relative direction (0 = forwards, clockwise in 45 degree steps) of the
// keys that move; Left / Right arrows turn instead.
const RELATIVE = {
  ArrowUp: 0, Numpad8: 0, ArrowDown: 4, Numpad2: 4,
  Numpad9: 1, PageUp: 1, Numpad6: 2, Numpad3: 3, PageDown: 3,
  Numpad1: 5, End: 5, Numpad4: 6, Numpad7: 7, Home: 7,
};
// Compass direction of each key for the tabletop camera.
const ABSOLUTE = {
  ArrowUp: 0, Numpad8: 0, PageUp: 1, Numpad9: 1, ArrowRight: 2, Numpad6: 2,
  PageDown: 3, Numpad3: 3, ArrowDown: 4, Numpad2: 4, End: 5, Numpad1: 5,
  ArrowLeft: 6, Numpad4: 6, Home: 7, Numpad7: 7,
};
const TURN = { ArrowLeft: -1, ArrowRight: 1 };

const WALK_FACTOR = 3;          // steps are this many times further apart than auto-repeat
const TURN_INTERVAL = 250;      // ms between 45 degree turns while Left / Right is held
let repeatMs = 33;              // the keyboard's auto-repeat interval, measured below

export function sendKey(s) { KB.push(s); }

// view: { active(), walking(), relative(), heading, turn(delta), toggle(),
//         cycleCamera(), noteKey(code) }
export function installInput(view) {
  const held = [];              // movement keys held down, most recent last
  let nextStep = 0;
  let turnKey = null, nextTurn = 0;
  const lastRepeat = new Map();

  const stepInterval = () => Math.min(400, Math.max(60, repeatMs * WALK_FACTOR));
  const direction = (code) => view.relative()
    ? (RELATIVE[code] + view.heading + 8) % 8
    : ABSOLUTE[code];
  const step = (code) => sendKey(COMPASS[direction(code)]);

  window.addEventListener('keydown', (e) => {
    // Leave typing in the page's own controls alone.
    if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.code === 'F8') {
      e.preventDefault(); e.stopImmediatePropagation();
      if (e.shiftKey) view.cycleCamera(); else view.toggle();
      return;
    }
    if (!e.repeat) view.noteKey(e.code);
    if (!view.active() || !view.walking()) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const isTurn = view.relative() && e.code in TURN;
    const isMove = !isTurn && (view.relative() ? e.code in RELATIVE : e.code in ABSOLUTE);
    if (!isTurn && !isMove) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.repeat) {
      // Measure the keyboard's auto-repeat; the steps themselves are paced
      // by the timer below.
      const now = performance.now(), prev = lastRepeat.get(e.code);
      if (prev && now - prev > 10 && now - prev < 200) repeatMs = repeatMs * 0.8 + (now - prev) * 0.2;
      lastRepeat.set(e.code, now);
      return;
    }
    lastRepeat.delete(e.code);
    const now = performance.now();
    if (isTurn) {
      view.turn(TURN[e.code]);
      turnKey = e.code; nextTurn = now + Math.max(TURN_INTERVAL, 400);
      return;
    }
    const i = held.indexOf(e.code);
    if (i >= 0) held.splice(i, 1);
    held.push(e.code);
    step(e.code);
    nextStep = now + Math.max(stepInterval(), 300);   // a tap is a single step
  }, true);

  window.addEventListener('keyup', (e) => {
    const i = held.indexOf(e.code);
    if (i >= 0) held.splice(i, 1);
    if (e.code === turnKey) turnKey = null;
    lastRepeat.delete(e.code);
  }, true);
  window.addEventListener('blur', () => { held.length = 0; turnKey = null; });

  setInterval(() => {
    if (!view.active() || !view.walking()) { held.length = 0; turnKey = null; return; }
    const now = performance.now();
    if (turnKey && view.relative() && now >= nextTurn) {
      view.turn(TURN[turnKey]);
      nextTurn = now + TURN_INTERVAL;
    }
    if (held.length && now >= nextStep && KB.buffer.length === 0) {
      step(held[held.length - 1]);
      nextStep = now + stepInterval();
    }
  }, 15);
}

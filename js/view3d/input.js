// Keyboard handling for the 3D view.  The game itself is not changed: keys
// it should see are put into its keyboard buffer (KB.push) exactly as the
// keyboard would, and keys meant for the 3D view are kept from it.
//
// With a camera that turns with the character, movement is relative to the
// way you face: Up / Down (and keypad 8 / 2) move forwards / backwards,
// Left / Right turn by 45 degrees, keypad 4 / 6 step sideways and keypad
// 7 / 9 / 1 / 3 move diagonally.  Each is sent to the game as the compass
// direction it means.

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
const TURN = { ArrowLeft: -1, ArrowRight: 1 };

export function sendKey(s) { KB.push(s); }

// view: { active(), relative(), heading, turn(delta), toggle(), cycleCamera(),
//         noteKey(code) }
export function installInput(view) {
  window.addEventListener('keydown', (e) => {
    // Leave typing in the page's own controls alone.
    if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.code === 'F8') {
      e.preventDefault(); e.stopImmediatePropagation();
      if (e.shiftKey) view.cycleCamera(); else view.toggle();
      return;
    }
    view.noteKey(e.code);
    if (!view.active() || !view.relative()) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.code in TURN) {
      e.preventDefault(); e.stopImmediatePropagation();
      view.turn(TURN[e.code]);
      return;
    }
    if (e.code in RELATIVE) {
      e.preventDefault(); e.stopImmediatePropagation();
      sendKey(COMPASS[(RELATIVE[e.code] + view.heading + 8) % 8]);
    }
  }, true);
}

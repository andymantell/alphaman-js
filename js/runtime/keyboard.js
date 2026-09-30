// Keyboard input: browser key events -> the strings INKEY$ returns.
//
// Ordinary keys give a one-character string; extended keys give CHR$(0) plus
// the scan code, e.g. up arrow = CHR$(0) + "H".  The original game forces
// NumLock off (POKE &H417), so the numeric keypad always acts as cursor keys.
'use strict';

const EXT = (scan) => '\0' + String.fromCharCode(scan);

const KEY_CODES = {
  ArrowUp: EXT(72), ArrowDown: EXT(80), ArrowLeft: EXT(75), ArrowRight: EXT(77),
  Home: EXT(71), End: EXT(79), PageUp: EXT(73), PageDown: EXT(81),
  Insert: EXT(82), Delete: EXT(83),
  Numpad7: EXT(71), Numpad8: EXT(72), Numpad9: EXT(73),
  Numpad4: EXT(75), Numpad6: EXT(77),
  Numpad1: EXT(79), Numpad2: EXT(80), Numpad3: EXT(81),
  Numpad0: EXT(82), NumpadDecimal: EXT(83),
  F1: EXT(59), F2: EXT(60), F3: EXT(61), F4: EXT(62), F5: EXT(63),
  F6: EXT(64), F7: EXT(65), F8: EXT(66), F9: EXT(67), F10: EXT(68),
  Enter: '\r', NumpadEnter: '\r', Escape: '\x1b', Backspace: '\b', Tab: '\t',
};

class Keyboard {
  constructor(target) {
    this.buffer = [];
    this.waiters = [];
    target.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  onKeyDown(e) {
    let s = null;
    if (e.code === 'Numpad5') {
      // With NumLock off the keypad 5 key produces no character.
      e.preventDefault();
      return;
    } else if (e.code in KEY_CODES) {
      s = KEY_CODES[e.code];
    } else if (e.key in KEY_CODES) {
      s = KEY_CODES[e.key];
    } else if (e.key.length === 1 && !e.altKey && !e.metaKey) {
      const c = e.key.charCodeAt(0);
      if (e.ctrlKey) {
        const u = e.key.toUpperCase().charCodeAt(0);
        if (u >= 64 && u <= 95) s = String.fromCharCode(u - 64);
      } else if (c < 128) {
        s = e.key;
      }
    }
    if (s === null) return;
    e.preventDefault();
    this.push(s);
  }

  push(s) {
    if (this.buffer.length < 15) this.buffer.push(s); // BIOS buffer holds 15 keys
    const w = this.waiters;
    this.waiters = [];
    for (const f of w) f();
  }

  // INKEY$
  inkey() { return this.buffer.length ? this.buffer.shift() : ''; }

  clear() { this.buffer.length = 0; }

  // Resolves when a key is available (without removing it).
  whenKey() {
    if (this.buffer.length) return Promise.resolve();
    return new Promise((resolve) => this.waiters.push(resolve));
  }
}

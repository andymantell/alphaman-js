// 80x25 colour text mode with eight video pages, as used by the original
// program through QuickBasic (SCREEN, COLOR, LOCATE, PRINT, CLS) and through
// direct writes to video memory at B800:0000 (ALPCLIB.C).
'use strict';

const SCREEN_COLS = 80;
const SCREEN_ROWS = 25;
const PAGE_CELLS = SCREEN_COLS * SCREEN_ROWS;

// Standard CGA/EGA/VGA text palette.
const PALETTE = [
  [0x00, 0x00, 0x00], [0x00, 0x00, 0xaa], [0x00, 0xaa, 0x00], [0x00, 0xaa, 0xaa],
  [0xaa, 0x00, 0x00], [0xaa, 0x00, 0xaa], [0xaa, 0x55, 0x00], [0xaa, 0xaa, 0xaa],
  [0x55, 0x55, 0x55], [0x55, 0x55, 0xff], [0x55, 0xff, 0x55], [0x55, 0xff, 0xff],
  [0xff, 0x55, 0x55], [0xff, 0x55, 0xff], [0xff, 0xff, 0x55], [0xff, 0xff, 0xff],
];

class TextScreen {
  constructor() {
    // Each cell is char + 256 * attribute, like a word of video memory.
    this.pages = [];
    for (let p = 0; p < 8; p++) this.pages.push(new Uint16Array(PAGE_CELLS).fill(0x0720));
    this.apage = 0;         // page written to
    this.vpage = 0;         // page displayed
    this.row = 1;           // cursor, 1-based
    this.col = 1;
    this.fg = 7;
    this.bg = 0;
    this.cursorVisible = false;
    this.dirty = true;
    this.onBeep = null;
  }

  // ------------------------------------------------------------ attributes
  attr() {
    // COLOR foreground 16-31 means blinking.
    return ((this.bg & 7) << 4) | (this.fg & 15) | ((this.fg & 16) ? 0x80 : 0);
  }

  // SCREEN , , apage, vpage
  screen(apage, vpage) {
    if (apage !== undefined && apage !== null) this.apage = apage;
    if (vpage !== undefined && vpage !== null) {
      this.vpage = vpage;
    } else if (apage !== undefined && apage !== null) {
      // "SCREEN , , n" sets both the active and the visual page.
      this.vpage = apage;
    }
    this.dirty = true;
  }

  // COLOR f, b
  color(f, b) {
    if (f !== undefined && f !== null) this.fg = f;
    if (b !== undefined && b !== null) this.bg = b;
  }

  // LOCATE row, col, cursor
  locate(row, col, cursor) {
    if (row !== undefined && row !== null) this.row = row;
    if (col !== undefined && col !== null) this.col = col;
    if (cursor !== undefined && cursor !== null) this.cursorVisible = cursor !== 0;
    this.dirty = true;
  }

  csrlin() { return this.row; }
  pos() { return this.col; }

  // ------------------------------------------------------ direct memory
  getCell(page, x, y) {           // x, y 1-based
    // Like the original's direct video memory reads, x is not range checked
    // within a row; reads outside the page return 0.
    const i = (y - 1) * SCREEN_COLS + (x - 1);
    return i < 0 || i >= PAGE_CELLS ? 0 : this.pages[page][i];
  }
  setCell(page, x, y, value) {
    const i = (y - 1) * SCREEN_COLS + (x - 1);
    if (i < 0 || i >= PAGE_CELLS) return;
    this.pages[page][i] = value;
    if (page === this.vpage) this.dirty = true;
  }
  fillPage(page, value) {
    this.pages[page].fill(value);
    if (page === this.vpage) this.dirty = true;
  }

  // ----------------------------------------------------------- printing
  scrollUp() {
    // The text viewport is lines 1-24; line 25 is not scrolled.
    const p = this.pages[this.apage];
    p.copyWithin(0, SCREEN_COLS, 24 * SCREEN_COLS);
    p.fill(0x20 | (this.attr() << 8), 23 * SCREEN_COLS, 24 * SCREEN_COLS);
    if (this.apage === this.vpage) this.dirty = true;
  }

  newline() {
    this.col = 1;
    if (this.row < 24) this.row++;
    else if (this.row === 24) this.scrollUp();
    else { this.scrollUp(); this.row = 24; }
  }

  putChar(code) {
    if (this.col > SCREEN_COLS) this.newline();
    this.setCell(this.apage, this.col, this.row, code | (this.attr() << 8));
    this.col++;
  }

  // PRINT text; (no newline).  Control characters behave as in QuickBasic.
  print(text) {
    for (let k = 0; k < text.length; k++) {
      const c = text.charCodeAt(k);
      switch (c) {
        case 7: if (this.onBeep) this.onBeep(); break;
        case 9: do { this.putChar(32); } while ((this.col - 1) % 8 !== 0 && this.col <= SCREEN_COLS); break;
        case 10: case 13: this.newline(); break;
        case 11: this.row = 1; this.col = 1; break;
        case 12: this.cls(); break;
        case 28: if (this.col < SCREEN_COLS) this.col++; break;
        case 29: if (this.col > 1) this.col--; break;
        case 30: if (this.row > 1) this.row--; break;
        case 31: if (this.row < 24) this.row++; break;
        default: this.putChar(c);
      }
    }
    this.dirty = true;
  }

  // One PRINT item: like QuickBasic, an item that does not fit on the rest of
  // the line (and would fit on a line of its own) starts on the next line.
  printItem(text) {
    if (this.col > 1 && this.col - 1 + text.length > SCREEN_COLS && text.length <= SCREEN_COLS) this.newline();
    this.print(text);
  }

  // PRINT text (with newline).
  println(text = '') {
    this.print(text);
    this.newline();
  }

  // PRINT a, b with comma: advance to the next 14-column zone.
  printComma() {
    const next = Math.floor((this.col - 1) / 14 + 1) * 14 + 1;
    if (next > SCREEN_COLS - 13) this.newline();
    else while (this.col < next) this.putChar(32);
  }

  // TAB(n) inside PRINT.
  tab(n) {
    if (this.col > n) this.newline();
    while (this.col < n) this.putChar(32);
  }

  cls() {
    const p = this.pages[this.apage];
    p.fill(0x20 | (((this.bg & 7) << 4 | (this.fg & 15)) << 8), 0, 24 * SCREEN_COLS);
    p.fill(0x20 | (((this.bg & 7) << 4 | (this.fg & 15)) << 8), 24 * SCREEN_COLS, PAGE_CELLS);
    this.row = 1; this.col = 1;
    if (this.apage === this.vpage) this.dirty = true;
  }
}

// Draws the visible page onto a canvas using a 9x16 VGA font (the font data
// already includes the 9th-column extension of the line-drawing characters).
class CanvasRenderer {
  constructor(canvas, screen, font) {
    this.canvas = canvas;
    this.screen = screen;
    this.font = font;
    this.cw = 9; this.ch = 16;
    canvas.width = SCREEN_COLS * this.cw;
    canvas.height = SCREEN_ROWS * this.ch;
    this.ctx = canvas.getContext('2d');
    this.image = this.ctx.createImageData(canvas.width, canvas.height);
    this.shown = new Int32Array(PAGE_CELLS).fill(-1);
    this.blinkOn = true;
    this.lastBlink = 0;
    this.cursorShown = -1;
    const frame = (t) => { this.draw(t); requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  }

  drawCell(i, cell, blinkOn, underline) {
    const code = cell & 0xff, attr = cell >> 8;
    const fgc = PALETTE[attr & 15];
    const bgc = PALETTE[(attr >> 4) & 7];
    const hidden = (attr & 0x80) && !blinkOn;
    const glyph = this.font[code];
    const x0 = (i % SCREEN_COLS) * this.cw, y0 = Math.floor(i / SCREEN_COLS) * this.ch;
    const d = this.image.data, w = this.canvas.width;
    for (let r = 0; r < 16; r++) {
      let bits = glyph[r];
      if (underline && r >= 14) bits = 0x1ff;
      let o = ((y0 + r) * w + x0) * 4;
      for (let c = 0; c < 9; c++, o += 4) {
        const on = !hidden && (bits & (0x100 >> c));
        const col = on ? fgc : bgc;
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
      }
    }
  }

  draw(t) {
    const s = this.screen;
    let blinkChanged = false;
    if (t - this.lastBlink > 267) {
      this.blinkOn = !this.blinkOn; this.lastBlink = t; blinkChanged = true;
    }
    const cursorIndex = s.cursorVisible && s.apage === s.vpage ? (s.row - 1) * SCREEN_COLS + (s.col - 1) : -1;
    if (!s.dirty && !blinkChanged && cursorIndex === this.cursorShown) return;
    const page = s.pages[s.vpage];
    let changed = false;
    for (let i = 0; i < PAGE_CELLS; i++) {
      const cell = page[i];
      const under = i === cursorIndex && this.blinkOn;
      const key = cell | (under ? 0x10000 : 0);
      if (this.shown[i] === key && !(blinkChanged && (cell & 0x8000)) && i !== this.cursorShown && i !== cursorIndex) continue;
      this.drawCell(i, cell, this.blinkOn, under);
      this.shown[i] = key;
      changed = true;
    }
    this.cursorShown = cursorIndex;
    s.dirty = false;
    if (changed) this.ctx.putImageData(this.image, 0, 0);
  }
}

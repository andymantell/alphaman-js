// 3D shapes for the 256 characters of the VGA 9x16 font: every lit pixel of
// the glyph becomes part of a solid block standing on the cell, as if the
// 2D screen were laid flat and its characters pulled straight up.
//
// The geometry is one unit wide (the 9 font columns), one unit deep (the 16
// font rows) and one unit high; instances are scaled to each character's
// height.  Vertex colours give the top faces full brightness and the sides
// less, so the shapes read as solid in the flat, unlit neon colours.
import * as THREE from 'three';

const TOP = 1.0, SIDE_NS = 0.62, SIDE_EW = 0.48;
const cache = new Map();

// Splits the glyph's lit pixels into rectangles (greedy, row by row).
function rectangles(rows) {
  const lit = (x, y) => (rows[y] >> (8 - x)) & 1;
  const used = Array.from({ length: 16 }, () => new Uint8Array(9));
  const out = [];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 9; x++) {
      if (!lit(x, y) || used[y][x]) continue;
      let w = 1;
      while (x + w < 9 && lit(x + w, y) && !used[y][x + w]) w++;
      let h = 1;
      grow: while (y + h < 16) {
        for (let i = 0; i < w; i++) if (!lit(x + i, y + h) || used[y + h][x + i]) break grow;
        h++;
      }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[y + j][x + i] = 1;
      out.push([x, y, w, h]);
    }
  }
  return out;
}

// The shape of character `code`, or null for a blank character.
export function glyphGeometry(code) {
  if (cache.has(code)) return cache.get(code);
  const rects = rectangles(VGA_FONT_9X16[code]);
  if (rects.length === 0) { cache.set(code, null); return null; }
  const pos = [], col = [];
  const quad = (a, b, c, d, shade) => {
    for (const p of [a, b, c, a, c, d]) { pos.push(...p); col.push(shade, shade, shade); }
  };
  for (const [x, y, w, h] of rects) {
    const x0 = x / 9 - 0.5, x1 = (x + w) / 9 - 0.5;
    const z0 = y / 16 - 0.5, z1 = (y + h) / 16 - 0.5;
    quad([x0, 1, z0], [x0, 1, z1], [x1, 1, z1], [x1, 1, z0], TOP);          // top
    quad([x0, 0, z1], [x1, 0, z1], [x1, 1, z1], [x0, 1, z1], SIDE_NS);      // south
    quad([x1, 0, z0], [x0, 0, z0], [x0, 1, z0], [x1, 1, z0], SIDE_NS);      // north
    quad([x1, 0, z1], [x1, 0, z0], [x1, 1, z0], [x1, 1, z1], SIDE_EW);      // east
    quad([x0, 0, z0], [x0, 0, z1], [x0, 1, z1], [x0, 1, z0], SIDE_EW);      // west
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeBoundingSphere();
  cache.set(code, g);
  return g;
}

// A flat square, for characters' background colours.
export const tileGeometry = (() => {
  const g = new THREE.PlaneGeometry(1, 1);
  g.rotateX(-Math.PI / 2);
  const n = g.attributes.position.count;
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(n * 3).fill(1), 3));
  return g;
})();

// Upright version of character `code`, for the cameras near the ground: the
// glyph's pixels as a thin slab facing +Z, one unit wide and one unit high
// (scaled per character), standing on y = 0.
const standCache = new Map();
const DEPTH = 0.14;
export function standingGeometry(code) {
  if (standCache.has(code)) return standCache.get(code);
  const rects = rectangles(VGA_FONT_9X16[code]);
  if (rects.length === 0) { standCache.set(code, null); return null; }
  const pos = [], col = [];
  const quad = (a, b, c, d, shade) => {
    for (const p of [a, b, c, a, c, d]) { pos.push(...p); col.push(shade, shade, shade); }
  };
  const z0 = -DEPTH / 2, z1 = DEPTH / 2;
  for (const [x, y, w, h] of rects) {
    const x0 = x / 9 - 0.5, x1 = (x + w) / 9 - 0.5;
    const y1 = 1 - y / 16, y0 = 1 - (y + h) / 16;
    quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], TOP);       // front
    quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], SIDE_EW);   // back
    quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], SIDE_NS);   // top
    quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], SIDE_EW);   // bottom
    quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], SIDE_EW);   // right
    quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], SIDE_EW);   // left
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeBoundingSphere();
  standCache.set(code, g);
  return g;
}

const WALL = 1.25, WALL_COLOUR = 9;
const FLOOR = new Set([32, 176, 177, 178, 247, 249, 250, 126, 255, 10, 19, 240, 31]);
const isLetter = (c) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122);

// How character `code` (in foreground colour fc) is shown:
//   'wall'  - pulled up out of the floor to wall height (box drawing in the
//             wall colour, solid blocks, doors in walls)
//   'floor' - nearly flat (ground cover, water, pits, traps, stairs)
//   'stand' - everything else (you, creatures, trees, items): flat when seen
//             from above, upright and facing you from the low cameras
export function glyphStyle(code, fc) {
  if (fc === WALL_COLOUR && ((code >= 179 && code <= 219) || code === 43 || code === 228)) return 'wall';
  if (code === 219) return 'wall';
  if (FLOOR.has(code)) return 'floor';
  return 'stand';
}

// Height of the flat (pulled-up) shape, in cells.
export function glyphHeight(code, fc) {
  const style = glyphStyle(code, fc);
  if (style === 'wall') return (code === 43 || code === 228) ? WALL * 0.85 : WALL;
  if (style === 'floor') return code === 240 ? 0.08 : 0.04;
  if (code >= 179 && code <= 218) return 0.12;            // webs and other line drawing
  if (code === 15) return 0.9;                             // trees
  if (code === 42) return 0.45;                            // bushes
  if (code === 1 || code === 2 || isLetter(code)) return 0.5;   // you, creatures
  return 0.28;                                             // items and the rest
}

// Height of the upright shape, in cells (its width keeps the font's 9:16).
export function standHeight(code) {
  if (code === 15) return 1.35;                            // trees
  if (code === 42) return 0.8;                             // bushes
  if (code === 1 || code === 2 || isLetter(code)) return 1.0;   // you, creatures
  if (code >= 179 && code <= 218) return 0.7;              // webs
  return 0.6;                                              // items and the rest
}

// Characters that move about: you and the creatures.
export const isMobile = (code) => code === 1 || code === 2 || isLetter(code);

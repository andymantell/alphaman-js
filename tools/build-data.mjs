// Builds js/data.js from the original data-generation sources in original/.
//
// The original game shipped its data as obfuscated binary files
// (ALPHAMAN.1 - ALPHAMAN.6) produced by small QuickBasic programs.  This
// script reproduces what those programs wrote, but stores the result as plain
// JavaScript data:
//
//   ALPHAMAN.1  <- MODJNK.BAS    JNK[]     423 strings of 68 chars (index num+2)
//   ALPHAMAN.2  <- CREALTER.BAS  CRE[]     creature records {name, v[1..15]}
//   ALPHAMAN.3  <- ALPHA.GDY     ALPHA3    16-bit integers (item tables)
//   ALPHAMAN.4  <- ALPHA.CAS     ALPHA4    16-bit integers (castle layouts)
//   ALPHAMAN.6  <- MODAM6.BAS    AM6[]     294 strings of 74 chars (index 1..)
//   ALPHAMAN.5  <- data/ALPHAMAN.5  ALPHA5  the help text file (no generator
//                                         source exists; taken from the release)
//
// The XOR "encryption" applied by the originals is symmetric and is undone by
// the game when reading, so it is simply omitted here.
//
// Usage: node tools/build-data.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const orig = (f) => fs.readFileSync(path.join(root, 'original', f), 'latin1');

// ---------------------------------------------------------------- strings
function stringTable(src, lo, hi, width) {
  const t = {};
  for (let i = lo; i <= hi; i++) t[i] = ' '.repeat(width);
  for (const line of src.split(/\r?\n/)) {
    const m = /^\s*j\((-?\d+)\) = "([^"]*)"\s*$/.exec(line);
    if (!m) continue;
    const n = Number(m[1]);
    if (n < lo || n > hi) throw new Error(`index ${n} out of range`);
    // Fixed-length string assignment: pad with spaces or truncate.
    t[n] = (m[2] + ' '.repeat(width)).slice(0, width);
  }
  const out = [];
  for (let i = lo; i <= hi; i++) out.push(t[i]);
  return out;
}

const JNK = stringTable(orig('MODJNK.BAS.txt'), -2, 420, 68);
const AM6 = stringTable(orig('MODAM6.BAS.txt'), 1, 294, 74);
// The ALPHAMAN.6 shipped with version 1.1 was generated before this line of
// MODAM6.BAS was corrected; keep the text the released game showed (checked
// with tools/verify-data.mjs against the release files).
AM6[52 - 1] = 'A Flash Grenade can blinds everything in a large area.'.padEnd(74);

// ---------------------------------------------------------------- DATA reader
// Minimal emulation of QuickBasic DATA / READ / RESTORE for integer data.
function dataProgram(src) {
  const items = [];
  const labels = {};
  for (let line of src.split(/\r?\n/)) {
    const lm = /^([A-Za-z][A-Za-z0-9]*):(.*)$/.exec(line);
    if (lm) { labels[lm[1].toLowerCase()] = items.length; line = lm[2]; }
    const dm = /^\s*DATA\s+(.*)$/i.exec(line);
    if (!dm) continue;
    for (const f of dm[1].split(',')) {
      const s = f.trim();
      if (!/^-?\d+$/.test(s)) throw new Error(`bad DATA item "${s}"`);
      items.push(Number(s));
    }
  }
  let ptr = 0;
  return {
    restore(label) {
      if (!(label in labels)) throw new Error(`no label ${label}`);
      ptr = labels[label];
    },
    read() {
      if (ptr >= items.length) throw new Error('Out of DATA');
      return items[ptr++];
    },
  };
}

// ---------------------------------------------------------------- ALPHAMAN.3
const nwep = 14, nrwep = 12, nsh = 9, narm = 12;
const nssd = 38, ntechwep = 37, nstrash = 18, nlsd = 25, nltrash = 13;
function buildAlpha3() {
  const d = dataProgram(orig('ALPHA.GDY.txt'));
  const out = [];
  const copy = (label, count) => {
    if (label) d.restore(label);
    for (let i = 0; i < count; i++) out.push(d.read());
  };
  copy('wepnames', (nwep + nrwep + nsh + narm) * 3);
  copy('technames', (nssd + ntechwep + nstrash + nlsd + nltrash) * 3);
  copy('syms', 10 * 3);
  copy('wep', (nwep + nrwep) * 6);
  copy('sh', nsh * 2);
  copy('arm', narm * 2);
  copy('ssd', nssd * 5);
  copy(null, ntechwep * 10);
  copy(null, nstrash * 5);
  copy('lsd', (nlsd + nltrash) * 5);
  return out;
}

// ---------------------------------------------------------------- ALPHAMAN.4
function buildAlpha4() {
  const d = dataProgram(orig('ALPHA.CAS.txt'));
  const out = [13, 0, 0, 0, 0, 0]; // header: byte position of each castle
  const castles = ['elvcas', 'muncas', 'gilcas', 'trucas', 'twocas', 'gricas'];
  castles.forEach((label, ci) => {
    out[ci] = out.length * 2 + 1;  // PUT #1, 2*ci+1, location
    d.restore(label);
    const group = (width) => {
      const n = d.read(); out.push(n);
      for (let j = 0; j < n * width; j++) out.push(d.read());
    };
    group(4); // rooms: xr, xl, yb, yt
    group(3); // walls to remove: sym, x, y
    group(2); // doors
    group(2); // locked doors
    group(2); // secret doors
    group(5); // items: sym, x, y, fc, iop
    group(4); // traps: sym, x, y, fc
  });
  return out;
}

// ---------------------------------------------------------------- ALPHAMAN.2
// INPUT #1 parsing of ALPHA.CRE: name, then 5 + 10 integers.
function buildCreatures() {
  const recs = [null];
  for (const line of orig('ALPHA.CRE').split(/\r?\n/)) {
    if (line.trim() === '') continue;
    if (line.trimStart().startsWith("'")) break;
    const m = /^\s*"([^"]*)"\s*,(.*)$/.exec(line);
    if (!m) throw new Error(`bad creature line: ${line}`);
    const nums = m[2].split(',').map((s) => s.trim()).filter((s) => s !== '');
    if (nums.length !== 15) throw new Error(`creature ${m[1]} has ${nums.length} values`);
    // v[1..15]: a, defense, c, susc, expr, att1, btt1, ... att5, btt5
    recs.push({ name: m[1].slice(0, 20), v: [0, ...nums.map(Number)] });
  }
  return recs;
}

const ALPHA3 = buildAlpha3();
const ALPHA4 = buildAlpha4();
const CRE = buildCreatures();
for (const v of [...ALPHA3, ...ALPHA4, ...CRE.slice(1).flatMap((c) => c.v)]) {
  if (v < -32768 || v > 32767) throw new Error(`value ${v} does not fit INTEGER`);
}

// Every character code in these strings is a CP437 code 0-255; codes above
// 0x7f are written as \x escapes so the file is plain ASCII.
const js = `// GENERATED by tools/build-data.mjs from the files in original/ and data/ - do not edit.
// Copyright (c) 1995 Jeffrey R. Olson (MIT license, see LICENSE)
'use strict';
// ALPHAMAN.1: JNK[num + 2] is string number num (-2..420), 68 characters.
const JNK = ${JSON.stringify(JNK, null, 0).replace(/","/g, '",\n  "')};
// ALPHAMAN.2: CRE[typ] = {name, v}; v[1..15] are the stats read by Creature().
const CRE = [null,\n${CRE.slice(1).map((c) => '  ' + JSON.stringify(c)).join(',\n')}];
// ALPHAMAN.3: item tables as a flat list of 16-bit integers.
const ALPHA3 = new Int16Array(${JSON.stringify(ALPHA3)});
// ALPHAMAN.4: castle layouts as a flat list of 16-bit integers.
const ALPHA4 = new Int16Array(${JSON.stringify(ALPHA4)});
// ALPHAMAN.6: AM6[num] is text line num (1..294), 74 characters.
const AM6 = [null,\n  ${AM6.map((s) => JSON.stringify(s)).join(',\n  ')}];
// ALPHAMAN.5: the text file read by the ? screen and the print command list
// (data/ALPHAMAN.5, the file from the version 1.1 release), with CR LF lines.
const ALPHA5 = ${JSON.stringify(fs.readFileSync(path.join(root, 'data', 'ALPHAMAN.5'), 'latin1'))};
`;
fs.writeFileSync(path.join(root, 'js', 'data.js'),
  js.replace(/[\x80-\xff]/g, (c) => '\\x' + c.charCodeAt(0).toString(16)), 'ascii');
console.log(`JNK ${JNK.length}, CRE ${CRE.length - 1}, ALPHA3 ${ALPHA3.length}, ALPHA4 ${ALPHA4.length}, AM6 ${AM6.length - 1}`);

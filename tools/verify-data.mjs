// Compares js/data.js with the data files of the AlphaMan 1.1 release
// (ALPHAMAN.1 - ALPHAMAN.4 and ALPHAMAN.6), decoding them the way the game
// read them.
//
//   node tools/verify-data.mjs <directory containing alphaman.1 ...>
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.argv[2];
if (!dir) { console.error('usage: node tools/verify-data.mjs <dir>'); process.exit(2); }
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/data.js'), 'latin1') +
  '\nthis.D = { JNK, CRE, ALPHA3, ALPHA4, AM6 };', ctx);
const { JNK, CRE, ALPHA3, ALPHA4, AM6 } = ctx.D;
const file = (n) => fs.readFileSync(path.join(dir, 'alphaman.' + n));
let bad = 0;
const report = (what, ok, detail) => { if (!ok) { bad++; console.log('MISMATCH', what, detail || ''); } };

// ALPHAMAN.1: 68-byte records, record num + 2 for num = -2..420.
{
  const f = file(1);
  for (let num = -2; num <= 420; num++) {
    let s = '';
    for (let p = 1; p <= 68; p++) {
      s += String.fromCharCode(f[(num + 2) * 68 + p - 1] ^ (Math.abs(17 * num + 31 * p) % 256));
    }
    report('JNK ' + num, s === JNK[num + 2], JSON.stringify([s, JNK[num + 2]]));
  }
  console.log('ALPHAMAN.1:', f.length, 'bytes checked');
}
// ALPHAMAN.6: 74-byte records 1..294.
{
  const f = file(6);
  for (let num = 1; num <= 294; num++) {
    let s = '';
    for (let k = 1; k <= 74; k++) s += String.fromCharCode(f[num * 74 - 74 + k - 1] ^ (Math.abs(17 * num + 31 * k) % 256));
    report('AM6 ' + num, s === AM6[num], JSON.stringify([s, AM6[num]]));
  }
  console.log('ALPHAMAN.6:', f.length, 'bytes checked');
}
// ALPHAMAN.2: 50-byte records: 20-byte name, then 15 16-bit integers.
{
  const f = file(2);
  const n = f.length / 50;
  for (let typ = 1; typ <= n; typ++) {
    const o = (typ - 1) * 50;
    // Names are stored XOR k * 6 (k = 1..20), ending at a CHR$(242).
    let name = '';
    const raw = f.subarray(o, o + 20).toString('latin1').trim();
    for (let k = 1; k <= raw.length && raw.charCodeAt(k - 1) !== 242; k++) {
      name += String.fromCharCode((raw.charCodeAt(k - 1) ^ (k * 6)) % 256);
    }
    const c = CRE[typ];
    if (!c) { report('CRE ' + typ, false, 'missing'); continue; }
    report('CRE name ' + typ, name.trim() === c.name.trim(), JSON.stringify([name, c.name]));
    for (let s = 1; s <= 15; s++) {
      const v = f.readInt16LE(o + 20 + (s - 1) * 2);
      report(`CRE ${typ}.${s}`, v === c.v[s], `${v} vs ${c.v[s]}`);
    }
  }
  console.log('ALPHAMAN.2:', n, 'records checked');
}
// ALPHAMAN.3 and ALPHAMAN.4: 16-bit integers.
for (const [n, arr] of [[3, ALPHA3], [4, ALPHA4]]) {
  const f = file(n);
  report(`ALPHAMAN.${n} length`, f.length === arr.length * 2, `${f.length} bytes vs ${arr.length} ints`);
  let diffs = 0;
  for (let i = 0; i < Math.min(arr.length, f.length / 2); i++) {
    if (f.readInt16LE(i * 2) !== arr[i]) { if (diffs++ < 5) report(`ALPHAMAN.${n}[${i}]`, false, `${f.readInt16LE(i * 2)} vs ${arr[i]}`); }
  }
  if (diffs > 5) report(`ALPHAMAN.${n}`, false, `${diffs} differing integers`);
  console.log(`ALPHAMAN.${n}:`, f.length, 'bytes checked');
}
console.log(bad ? `${bad} mismatch(es)` : 'data matches the release files');
process.exitCode = bad ? 1 : 0;

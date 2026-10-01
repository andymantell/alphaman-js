// QuickBasic evaluates a FOR loop's end value once, before the loop starts.
// A JavaScript "for (let i = a; i <= n; i++)" re-reads n on every pass, which
// differs when the body changes n (e.g. RemoveCreat lowers nnear).  This
// finds such loops: the bound uses a variable that the loop body assigns,
// directly or through a function it calls.  Loops written with a
// precomputed end ("iEnd") are fine.
//
//   node tools/check-for-bounds.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['js/alpclib.js', ...fs.readdirSync(path.join(root, 'js/game')).map((f) => 'js/game/' + f)];
const blank = (s) => s.replace(/\/\/[^\n]*|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/g, (t) => t.replace(/[^\n]/g, ' '));
const src = Object.fromEntries(files.map((f) => [f, blank(fs.readFileSync(path.join(root, f), 'latin1'))]));

function matchBrace(s, open) {
  let d = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '{') d++; else if (s[i] === '}' && --d === 0) return i + 1;
  }
  return s.length;
}
// Function bodies.
const fns = {};
for (const [f, s] of Object.entries(src)) {
  for (const m of s.matchAll(/^(?:async )?function ([\w$]+)\(([^)]*)\)\s*\{/gm)) {
    const open = m.index + m[0].length - 1;
    fns[m[1]] = { f, body: s.slice(open, matchBrace(s, open)), params: m[2].split(',').map((x) => x.trim()) };
  }
}
const assigned = (body) => {
  const out = new Set();
  for (const m of body.matchAll(/(?<![\w$.\]])([\w$]+)\s*(?:[-+*/|&]?=(?!=)|\+\+|--)/g)) out.add(m[1]);
  for (const m of body.matchAll(/(?:\+\+|--)([\w$]+)/g)) out.add(m[1]);
  for (const m of body.matchAll(/\[([^\]=]+)\]\s*=(?!=)/g)) for (const n of m[1].split(',')) out.add(n.trim());
  return out;
};
const calls = (body) => new Set([...body.matchAll(/(?<![\w$.])([\w$]+)\s*\(/g)].map((m) => m[1]).filter((n) => fns[n]));
// Globals each function may change (transitively); locals declared with let are excluded.
const locals = (fn) => new Set([...fn.body.matchAll(/\b(?:let|const)\s+([^;]+)/g)].flatMap((m) => [...m[1].matchAll(/(?:^|,)\s*([\w$]+)/g)].map((x) => x[1])).concat(fn.params));
const eff = {};
for (const [n, fn] of Object.entries(fns)) { const l = locals(fn); eff[n] = new Set([...assigned(fn.body)].filter((v) => !l.has(v))); }
for (let changed = true; changed;) {
  changed = false;
  for (const [n, fn] of Object.entries(fns)) {
    for (const c of calls(fn.body)) for (const v of eff[c]) if (!eff[n].has(v) && !locals(fn).has(v)) { eff[n].add(v); changed = true; }
  }
}
let count = 0;
for (const [f, s] of Object.entries(src)) {
  for (const m of s.matchAll(/for \(let ([\w$]+) = [^;]+; \1 (<=|>=) ([^;]+); /g)) {
    const bound = m[3];
    if (/End\b/.test(bound)) continue;
    const vars = [...bound.matchAll(/(?<![\w$.])([a-z_$][\w$]*)/gi)].map((x) => x[1]).filter((v) => v !== m[1]);
    if (!vars.length) continue;
    const open = s.indexOf('{', m.index + m[0].length);
    const semi = s.indexOf(';', m.index + m[0].length);
    const nl = s.indexOf('\n', m.index);
    const body = open >= 0 && open < nl ? s.slice(open, matchBrace(s, open)) : s.slice(m.index + m[0].length, Math.max(semi, nl));
    const changes = new Set(assigned(body));
    for (const c of calls(body)) for (const v of eff[c]) changes.add(v);
    const hit = vars.filter((v) => changes.has(v));
    if (hit.length) {
      count++;
      console.log(`${f}:${s.slice(0, m.index).split('\n').length}: bound "${bound.trim()}" can change in the body (${hit.join(', ')})`);
    }
  }
}
console.log(count ? `${count} loop(s)` : 'for-bounds check: OK');

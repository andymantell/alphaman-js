// Checks the game sources for calls to async functions that are missing an
// "await", and for "await" inside functions that are not async.
//
//   node tools/check-async.mjs [--fix]
//
// With --fix, adds the missing awaits and marks the enclosing functions async,
// repeating until nothing changes.
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const files = ['js/alpclib.js', ...fs.readdirSync(path.join(root, 'js/game')).map((f) => 'js/game/' + f)]
  .filter((f) => f.endsWith('.js'));
const fix = process.argv.includes('--fix');

// Functions that are async because of the runtime (they wait for keys/time).
const RUNTIME_ASYNC = ['getKey', 'lineInput', 'input', 'inputString', 'inputNumber', 'sleepSeconds', 'yieldToBrowser'];

function scan() {
  const src = Object.fromEntries(files.map((f) => [f, fs.readFileSync(path.join(root, f), 'utf8')]));
  const asyncFns = new Set(RUNTIME_ASYNC);
  for (const s of Object.values(src)) {
    for (const m of s.matchAll(/^async function ([\w$]+)/gm)) asyncFns.add(m[1]);
  }
  return { src, asyncFns };
}

// Splits a file into top-level functions: [{name, isAsync, start, end}].
function topFunctions(s) {
  const out = [];
  const re = /^(async )?function ([\w$]+)\(/gm;
  let m;
  const starts = [];
  while ((m = re.exec(s))) starts.push({ name: m[2], isAsync: !!m[1], start: m.index });
  for (let i = 0; i < starts.length; i++) {
    const end = s.indexOf('\n}\n', starts[i].start);
    out.push({ ...starts[i], end: end < 0 ? s.length : end + 2 });
  }
  return out;
}

function matchBrace(s, open) {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}' && --depth === 0) return i + 1;
  }
  return s.length;
}

// Removes strings and comments so names inside them are not matched.
function blank(s) {
  return s.replace(/\/\/[^\n]*|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g,
    (t) => t.replace(/[^\n]/g, ' '));
}

let changed = true, pass = 0, problems = [];
while (changed && pass < 50) {
  changed = false; pass++; problems = [];
  const { src, asyncFns } = scan();
  for (const f of files) {
    let s = src[f];
    const b = blank(s);
    const edits = [];   // [pos, text] insertions
    for (const fn of topFunctions(b)) {
      const body = b.slice(fn.start, fn.end);
      // Inner closures (the GOSUB subroutines): "const name = (...) => {".
      const closures = [];
      for (const m of body.matchAll(/const ([\w$]+) = (async )?\(([^)]*)\) => \{/g)) {
        const open = m.index + m[0].length - 1;
        closures.push({ name: m[1], isAsync: !!m[2], start: m.index, arrow: m.index + m[0].indexOf('('), open, end: matchBrace(body, open) });
      }
      const localAsync = new Set(closures.filter((c) => c.isAsync).map((c) => c.name));
      // A closure needs async if it awaits or calls something async.
      let grew = true;
      while (grew) {
        grew = false;
        for (const c of closures) {
          if (localAsync.has(c.name)) continue;
          const inner = body.slice(c.open, c.end);
          const calls = [...inner.matchAll(/(^|[^\w$.])([\w$]+)\s*\(/g)].map((x) => x[2]);
          if (/\bawait\b/.test(inner) || calls.some((n) => asyncFns.has(n) || localAsync.has(n))) {
            localAsync.add(c.name); grew = true;
            const line = s.slice(0, fn.start + c.start).split('\n').length;
            problems.push(`${f}:${line}: closure ${c.name} in ${fn.name} must be async`);
            if (fix) edits.push([fn.start + c.arrow, 'async ']);
          }
        }
      }
      const callRe = /([\w$.]*?)\b([\w$]+)\s*\(/g;
      let c;
      let needsAsync = false;
      while ((c = callRe.exec(body))) {
        const name = c[2];
        if (!asyncFns.has(name) && !localAsync.has(name)) continue;
        if (c[1].endsWith('.')) continue;                  // method call
        const before = body.slice(0, c.index + c[1].length);
        if (/function\s+$/.test(before) || /const\s+$/.test(before)) continue;   // declarations
        if (/await\s+$/.test(before)) { needsAsync = true; continue; }
        const line = s.slice(0, fn.start + c.index).split('\n').length;
        problems.push(`${f}:${line}: ${name}() called without await in ${fn.name}`);
        if (fix) edits.push([fn.start + c.index + c[1].length, 'await ']);
        needsAsync = true;
      }
      if (/\bawait\b/.test(body)) needsAsync = true;
      if (needsAsync && !fn.isAsync) {
        const line = s.slice(0, fn.start).split('\n').length;
        problems.push(`${f}:${line}: ${fn.name} uses await but is not async`);
        if (fix) edits.push([fn.start, 'async ']);
      }
    }
    if (fix && edits.length) {
      edits.sort((x, y) => y[0] - x[0]);
      for (const [p, t] of edits) s = s.slice(0, p) + t + s.slice(p);
      fs.writeFileSync(path.join(root, f), s);
      changed = true;
    }
  }
  if (!fix) break;
}
for (const p of problems) console.log(p);
console.log(problems.length ? `${problems.length} problem(s)` : 'async check: OK');
process.exitCode = problems.length && !fix ? 1 : 0;

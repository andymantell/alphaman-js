// Lints the game scripts as the browser loads them: classic scripts sharing
// one global scope, in the order index.html lists them.  Reports undefined
// names, redeclarations, assignments to constants and similar slips.
//
//   node tools/lint.mjs        (needs the eslint package)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let eslintPath;
try { eslintPath = require.resolve('eslint'); } catch { eslintPath = '/opt/node-tools/node_modules/eslint/lib/api.js'; }
const { Linter } = require(eslintPath);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
let combined = '', map = [];
for (const f of files) {
  const src = fs.readFileSync(path.join(root, f), 'latin1').replace(/^'use strict';$/m, '');
  const start = combined.split('\n').length;
  map.push({ f, start, lines: src.split('\n').length });
  combined += src + '\n';
}
const where = (line) => {
  for (const m of map) if (line >= m.start && line < m.start + m.lines) return `${m.f}:${line - m.start + 1}`;
  return '?:' + line;
};
const browserGlobals = ['window', 'document', 'console', 'localStorage', 'performance', 'requestAnimationFrame',
  'setTimeout', 'clearTimeout', 'Promise', 'DataView', 'ArrayBuffer', 'Blob', 'URL', 'TextEncoder',
  'TextDecoder', 'DecompressionStream', 'Response', 'atob', 'btoa', 'location', 'confirm', 'globalThis',
  'Int16Array', 'Int32Array', 'Uint8Array', 'Uint32Array', 'Float32Array', 'Map', 'Set', 'Math', 'Number',
  'String', 'Object', 'Array', 'Error', 'JSON', 'Date', 'Symbol', 'Infinity', 'NaN', 'isNaN', 'parseInt',
  'encodeURIComponent', 'decodeURIComponent'];
// Shared COMMON variables are created with defGlobal(); collect their names.
const state = fs.readFileSync(path.join(root, 'js/game/state.js'), 'utf8');
const dyn = [];
for (const m of state.matchAll(/`([^`]*)`\.split/g)) dyn.push(...m[1].split(/\s+/).filter(Boolean));
for (const m of state.matchAll(/for \(const n of \[([^\]]*)\]\) defGlobal/g)) dyn.push(...[...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
const globals = Object.fromEntries([...browserGlobals, ...dyn].map((g) => [g, 'writable']));

const linter = new Linter({ configType: 'flat' });
const msgs = linter.verify(combined, {
  languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals },
  rules: {
    'no-undef': 'error', 'no-redeclare': 'error', 'no-const-assign': 'error', 'no-dupe-keys': 'error',
    'no-unreachable': 'warn', 'no-self-assign': 'warn', 'no-dupe-else-if': 'warn', 'no-cond-assign': 'warn',
    'no-unused-labels': 'warn', 'no-fallthrough': 'warn', 'no-func-assign': 'error', 'no-shadow-restricted-names': 'error',
  },
});
for (const m of msgs) console.log(`${where(m.line)}: ${m.severity === 2 ? 'error' : 'warning'}: ${m.message} (${m.ruleId})`);
console.log(msgs.length ? `${msgs.length} problem(s)` : 'lint: OK');
process.exitCode = msgs.some((m) => m.severity === 2) ? 1 : 0;

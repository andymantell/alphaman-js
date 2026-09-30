// QuickBasic 4.5 language semantics used by the AlphaMan port.
//
// The original program is compiled QuickBasic with DEFINT A-Z, so almost all
// variables are 16-bit integers.  JavaScript numbers are doubles, so the port
// uses the helpers below wherever QuickBasic would convert or round.
'use strict';

// ------------------------------------------------------------------ numbers

const QB_TRUE = -1;
const QB_FALSE = 0;

// Boolean -> QuickBasic truth value (-1 / 0).
function qb(b) { return b ? -1 : 0; }

// Round to nearest, ties to even (QuickBasic CINT / implicit conversion).
function roundEven(x) {
  const r = Math.round(x);
  if (Math.abs(x % 1) === 0.5 && r % 2 !== 0) return r - 1;
  return r;
}

// Conversion to INTEGER (16-bit).  QuickBasic raises "Overflow" when the value
// does not fit; the port wraps instead of crashing and logs a warning.
function cint(x) {
  let r = roundEven(+x);
  if (r < -32768 || r > 32767 || Number.isNaN(r)) {
    console.warn('INTEGER overflow', x, new Error().stack);
    if (Number.isNaN(r)) return 0;
    r = ((r + 32768) & 0xffff) - 32768;
  }
  return r === 0 ? 0 : r; // no negative zero
}

// Conversion to LONG (32-bit).
function clng(x) {
  let r = roundEven(+x);
  if (r < -2147483648 || r > 2147483647 || Number.isNaN(r)) {
    console.warn('LONG overflow', x, new Error().stack);
    if (Number.isNaN(r)) return 0;
    r = r | 0;
  }
  return r === 0 ? 0 : r;
}

// Conversion to SINGLE.
const csng = Math.fround;

// INT(): largest integer <= x.  FIX(): truncate.
function int(x) { return Math.floor(x); }
function fix(x) { return Math.trunc(x); }

// Integer division "\" and MOD: operands are rounded to integers first.
function idiv(a, b) {
  a = roundEven(a); b = roundEven(b);
  if (b === 0) throw new QBError('Division by zero');
  const r = Math.trunc(a / b);
  return r === 0 ? 0 : r;
}
function imod(a, b) {
  a = roundEven(a); b = roundEven(b);
  if (b === 0) throw new QBError('Division by zero');
  const r = a % b;
  return r === 0 ? 0 : r;
}

// Float division "/" by zero is also a runtime error in QuickBasic.
function fdiv(a, b) {
  if (b === 0) throw new QBError('Division by zero');
  return a / b;
}

function sgn(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }

// Logical operators on integers (AND, OR, XOR, NOT are bitwise in QB).
function not(x) { return ~roundEven(x); }

class QBError extends Error {}

// ------------------------------------------------------------------ strings
// Strings hold CP437 character codes 0-255, one per JS char.

function chr$(n) {
  n = roundEven(n);
  if (n < 0 || n > 255) throw new QBError('Illegal function call: CHR$(' + n + ')');
  return String.fromCharCode(n);
}
function asc(s) {
  if (s.length === 0) throw new QBError('Illegal function call: ASC("")');
  return s.charCodeAt(0);
}
function len(s) { return s.length; }
function left$(s, n) { return s.substring(0, Math.max(0, roundEven(n))); }
function right$(s, n) { n = roundEven(n); return n <= 0 ? '' : s.substring(Math.max(0, s.length - n)); }
function mid$(s, start, n) {
  start = roundEven(start);
  if (start < 1) throw new QBError('Illegal function call: MID$ start ' + start);
  if (n === undefined) return s.substring(start - 1);
  n = roundEven(n);
  return s.substr(start - 1, Math.max(0, n));
}
// MID$(s, start, n) = r  (statement form).  Returns the new string.
function midSet(s, start, n, r) {
  start = roundEven(start);
  if (n === undefined) n = r.length;
  n = Math.min(roundEven(n), r.length, s.length - start + 1);
  if (n <= 0) return s;
  return s.substring(0, start - 1) + r.substring(0, n) + s.substring(start - 1 + n);
}
function ltrim$(s) { return s.replace(/^ +/, ''); }
function rtrim$(s) { return s.replace(/ +$/, ''); }
function space$(n) { return ' '.repeat(Math.max(0, roundEven(n))); }
function string$(n, c) {
  const ch = typeof c === 'string' ? c.charAt(0) : String.fromCharCode(c);
  return ch.repeat(Math.max(0, roundEven(n)));
}
function ucase$(s) { return s.replace(/[a-z]/g, (c) => c.toUpperCase()); }
function lcase$(s) { return s.replace(/[A-Z]/g, (c) => c.toLowerCase()); }
function instr(a, b, c) {
  // INSTR([start,] s, find)
  let start = 1, s = a, find = b;
  if (typeof a === 'number') { start = a; s = b; find = c; }
  if (start > s.length) return 0;
  if (find === '') return start;
  return s.indexOf(find, start - 1) + 1;
}
// Fixed-length string (STRING * n) assignment: pad with spaces or truncate.
function fixstr(s, n) {
  return s.length >= n ? s.substring(0, n) : s + ' '.repeat(n - s.length);
}

// ------------------------------------------------------------ number format
// Digits of a number as QuickBasic prints them: `digits` significant digits
// (7 for SINGLE, 16 for DOUBLE), fixed notation when it fits in that many
// digits, otherwise d.ddddddE+xx.
function fmtNum(x, digits) {
  if (x === 0) return '0';
  const m = /^(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(Math.abs(x).toExponential(digits - 1));
  const mant = (m[1] + (m[2] || '')).replace(/0+$/, '') || '0';
  const exp = Number(m[3]);
  let out;
  if (exp >= digits || (exp < 0 && mant.length - exp - 1 > digits)) {
    out = mant[0] + (mant.length > 1 ? '.' + mant.substring(1) : '') +
      'E' + (exp < 0 ? '-' : '+') + String(Math.abs(exp)).padStart(2, '0');
  } else if (exp < 0) {
    out = '.' + '0'.repeat(-exp - 1) + mant;
  } else if (mant.length <= exp + 1) {
    out = mant + '0'.repeat(exp + 1 - mant.length);
  } else {
    out = mant.substring(0, exp + 1) + '.' + mant.substring(exp + 1);
  }
  return (x < 0 ? '-' : '') + out;
}

// STR$(): leading space for non-negative numbers.  `type` is 'int' (INTEGER or
// LONG), 'single' or 'double'.
function str$(x, type = 'int') {
  let s;
  if (type === 'int') s = String(x);
  else if (type === 'double') s = fmtNum(x, 16);
  else s = fmtNum(Math.fround(x), 7);
  return x >= 0 ? ' ' + s : s;
}

// VAL(): parse the leading number, ignoring blanks.
function val(s) {
  s = s.replace(/[ \t\n]/g, '');
  const h = /^&H([0-9A-F]+)/i.exec(s);
  if (h) { let v = parseInt(h[1], 16); if (v > 32767 && v < 65536) v -= 65536; return v; }
  const o = /^&O?([0-7]+)/i.exec(s);
  if (o) return parseInt(o[1], 8);
  const m = /^[+-]?(\d+\.?\d*|\.\d+)([ED][+-]?\d+)?/i.exec(s);
  if (!m) return 0;
  return Number(m[0].replace(/[dD]/, 'e'));
}

// PRINT USING for the numeric (#, +, ., ,) and string (&, !, \ \) fields.
// Returns the formatted text.
function printUsing$(fmt, ...args) {
  let out = '';
  let ai = 0;
  let pos = 0;
  let usedField = false;
  const fieldAt = (i) => {
    const c = fmt[i];
    if (c === '&' || c === '!') return { kind: 's', width: c === '&' ? 0 : 1, end: i + 1 };
    if (c === '\\') {
      let j = i + 1;
      while (j < fmt.length && fmt[j] === ' ') j++;
      if (fmt[j] === '\\') return { kind: 's', width: j - i + 1, end: j + 1 };
      return null;
    }
    // numeric field
    let j = i, plusLead = false;
    if (fmt[j] === '+' && (fmt[j + 1] === '#' || (fmt[j + 1] === '.' && fmt[j + 2] === '#'))) { plusLead = true; j++; }
    if (fmt[j] === '#' || (fmt[j] === '.' && fmt[j + 1] === '#')) {
      let ints = 0, decs = -1, comma = false;
      while (fmt[j] === '#' || fmt[j] === ',') { if (fmt[j] === ',') comma = true; ints++; j++; }
      if (fmt[j] === '.') { decs = 0; j++; while (fmt[j] === '#') { decs++; j++; } }
      let plusTrail = false, minusTrail = false;
      if (!plusLead && fmt[j] === '+') { plusTrail = true; j++; } else if (fmt[j] === '-') { minusTrail = true; j++; }
      return { kind: 'n', ints, decs, comma, plusLead, plusTrail, minusTrail, end: j };
    }
    return null;
  };
  const fmtNumField = (f, x) => {
    const d = Math.max(0, f.decs);
    let v = Math.abs(x);
    let s = v.toFixed(d);
    if (f.decs === -1) s = String(roundEven(v));
    let [ip, fp] = s.split('.');
    if (ip === '0' && f.ints === 0) ip = '';
    if (f.comma) ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    let sign = '';
    if (f.plusLead || f.plusTrail) sign = x < 0 ? '-' : '+';
    else if (x < 0 && !f.minusTrail) sign = '-';
    let body = ip + (f.decs >= 0 ? '.' + (fp || '') : '');
    let width = f.ints + (f.decs >= 0 ? f.decs + 1 : 0) + (f.plusLead ? 1 : 0);
    let lead = f.plusLead || (!f.plusTrail && !f.minusTrail) ? sign + body : body;
    let res;
    if (lead.length > width) res = '%' + lead;
    else res = lead.padStart(width, ' ');
    if (f.plusTrail) res += sign;
    if (f.minusTrail) res += x < 0 ? '-' : ' ';
    return res;
  };
  while (ai < args.length) {
    if (pos >= fmt.length) {
      if (!usedField) throw new QBError('Illegal function call: PRINT USING');
      pos = 0;
    }
    const c = fmt[pos];
    if (c === '_' && pos + 1 < fmt.length) { out += fmt[pos + 1]; pos += 2; continue; }
    const f = fieldAt(pos);
    if (!f) { out += c; pos++; continue; }
    usedField = true;
    const a = args[ai++];
    if (f.kind === 's') {
      const s = String(a);
      out += f.width === 0 ? s : fixstr(s, f.width);
    } else {
      out += fmtNumField(f, +a);
    }
    pos = f.end;
    // Copy literal text that follows up to the next field.
    while (pos < fmt.length) {
      if (fmt[pos] === '_' && pos + 1 < fmt.length) { out += fmt[pos + 1]; pos += 2; continue; }
      if (fieldAt(pos)) break;
      out += fmt[pos++];
    }
  }
  return out;
}

// ---------------------------------------------------------------- RND
// QuickBasic's 24-bit linear congruential generator.
let rndSeed = 0x50000;
let rndLast = 0;
function rnd(arg) {
  if (arg !== undefined && arg < 0) {
    const b = new DataView(new ArrayBuffer(4));
    b.setFloat32(0, arg, true);
    const bits = b.getUint32(0, true);
    rndSeed = (bits + (bits >>> 24)) & 0xffffff;
  }
  if (arg === undefined || arg !== 0) {
    rndSeed = (Math.imul(rndSeed, 0xfd43fd) + 0xc39ec3) & 0xffffff;
  }
  rndLast = Math.fround(rndSeed / 0x1000000);
  return rndLast;
}
// RANDOMIZE n: the upper 16 bits of the seed come from the double's bits.
function randomize(n) {
  const b = new DataView(new ArrayBuffer(8));
  b.setFloat64(0, n, true);
  const hi = b.getUint32(4, true);
  const s = ((hi >>> 16) ^ (hi & 0xffff)) & 0xffff;
  rndSeed = ((s << 8) | (rndSeed & 0xff)) & 0xffffff;
}

// ------------------------------------------------------ Microsoft C rand()
let cRandState = 1;
function cSrand(seed) { cRandState = seed >>> 0; }
function cRand() {
  cRandState = (Math.imul(cRandState, 214013) + 2531011) >>> 0;
  return (cRandState >>> 16) & 0x7fff;
}

// ---------------------------------------------------------------- time
// TIMER: seconds since midnight, single precision, 18.2 Hz resolution.
function timer() {
  const d = new Date();
  const secs = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000;
  return Math.fround(Math.floor(secs * 18.2065) / 18.2065);
}
function time$() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}
function date$() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return p(d.getMonth() + 1) + '-' + p(d.getDate()) + '-' + d.getFullYear();
}

// ------------------------------------------------------------- arrays
// DIM helpers.  Each range is [lo, hi] (inclusive); a bare number n means
// [1, n] (the game uses OPTION BASE 1).  Integer arrays use Int16Array rows so
// stored values wrap like 16-bit integers; float values must still be rounded
// with cint() before storing, since typed arrays truncate.
function dimRange(r) { return typeof r === 'number' ? [1, r] : r; }
function dimArray(fill, ...ranges) {
  const [lo, hi] = dimRange(ranges[0]);
  const rest = ranges.slice(1);
  const typed = typeof fill === 'function' && lo >= 0;
  if (rest.length === 0 && typed) return new fill(hi + 1);
  const a = [];
  for (let i = Math.min(0, lo); i <= hi; i++) {
    if (rest.length) a[i] = dimArray(fill, ...rest);
    else a[i] = typeof fill === 'function' ? 0 : fill;
  }
  return a;
}
const dimInt = (...r) => dimArray(Int16Array, ...r);
const dimLong = (...r) => dimArray(Int32Array, ...r);
const dimSingle = (...r) => dimArray(Float32Array, ...r);
const dimStr = (...r) => dimArray('', ...r);

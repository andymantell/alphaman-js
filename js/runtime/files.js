// A small DOS-like file system stored in localStorage, plus QuickBasic style
// file handles.  Saved games, saved maps, the high score list and the game
// parameters are kept in the same binary / text formats the original wrote,
// so files are byte-compatible with the DOS version.
'use strict';

const FS_PREFIX = 'alphaman-fs:';

const DosFS = {
  mem: new Map(),      // fallback when localStorage is unavailable

  rom: {},            // read-only files shipped with the game (ALPHAMAN.5)

  // DOS file names: case-insensitive, trailing blanks ignored, 8.3 truncation.
  normalize(name) {
    let n = name.trim().toUpperCase();
    const dot = n.lastIndexOf('.');
    if (dot >= 0) n = n.substring(0, dot).trimEnd().substring(0, 8) + '.' + n.substring(dot + 1).trim().substring(0, 3);
    else n = n.substring(0, 8);
    return n;
  },

  key(name) { return FS_PREFIX + this.normalize(name); },

  read(name) {
    const r = this.rom[this.normalize(name)];
    if (r) return r.slice();
    let s = null;
    try { s = localStorage.getItem(this.key(name)); } catch (e) { /* ignore */ }
    if (s === null && this.mem.has(this.key(name))) s = this.mem.get(this.key(name));
    if (s === null) return null;
    const bin = atob(s);
    const a = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return a;
  },

  write(name, bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 8192) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    }
    const s = btoa(bin);
    this.mem.set(this.key(name), s);
    try { localStorage.setItem(this.key(name), s); } catch (e) {
      console.warn('localStorage write failed for', name, e);
    }
  },

  exists(name) { return this.read(name) !== null; },

  remove(name) {
    this.mem.delete(this.key(name));
    try { localStorage.removeItem(this.key(name)); } catch (e) { /* ignore */ }
  },

  list() {
    const names = new Set();
    for (const k of this.mem.keys()) names.add(k.substring(FS_PREFIX.length));
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(FS_PREFIX)) names.add(k.substring(FS_PREFIX.length));
      }
    } catch (e) { /* ignore */ }
    return [...names].sort();
  },
};

// An open file.  Binary access (GET/PUT) and sequential access (PRINT #,
// WRITE #, INPUT #, LINE INPUT #) share the same byte buffer.
class QBFile {
  constructor(name, mode) {
    this.name = name;
    this.mode = mode; // 'BINARY' | 'INPUT' | 'OUTPUT' | 'APPEND'
    const existing = DosFS.read(name);
    if (mode === 'INPUT' && existing === null) throw new QBError('File not found: ' + name);
    this.data = mode === 'OUTPUT' || existing === null ? new Uint8Array(0) : existing;
    this.size = this.data.length;
    this.pos = mode === 'APPEND' ? this.size : 0;   // 0-based byte position
    this.changed = mode !== 'INPUT';
    if (mode !== 'INPUT') this.flush();              // OPEN creates the file
  }

  ensure(n) {
    if (n <= this.data.length) return;
    const a = new Uint8Array(Math.max(n, this.data.length * 2, 256));
    a.set(this.data.subarray(0, this.size));
    this.data = a;
  }

  flush() { DosFS.write(this.name, this.data.subarray(0, this.size)); this.changed = false; }
  close() { if (this.changed) this.flush(); }

  lof() { return this.size; }
  loc() { return this.mode === 'BINARY' ? this.pos : Math.ceil(this.pos / 128); }
  eof() {
    if (this.mode === 'INPUT') {
      // A Ctrl-Z also marks the end of a text file.
      return this.pos >= this.size || this.data[this.pos] === 26;
    }
    return this.pos >= this.size;
  }

  seek(p) { if (p !== undefined && p !== null) this.pos = p - 1; } // p is 1-based

  // ------------------------------------------------ binary GET / PUT
  getBytes(n, p) {
    this.seek(p);
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const k = this.pos + i;
      out[i] = k < this.size ? this.data[k] : 0;
    }
    this.pos += n;
    return out;
  }
  putBytes(bytes, p) {
    this.seek(p);
    this.ensure(this.pos + bytes.length);
    this.data.set(bytes, this.pos);
    this.pos += bytes.length;
    if (this.pos > this.size) this.size = this.pos;
    this.changed = true;
  }

  getInt(p) { const b = this.getBytes(2, p); return new DataView(b.buffer).getInt16(0, true); }
  getLong(p) { const b = this.getBytes(4, p); return new DataView(b.buffer).getInt32(0, true); }
  getSingle(p) { const b = this.getBytes(4, p); return new DataView(b.buffer).getFloat32(0, true); }
  getDouble(p) { const b = this.getBytes(8, p); return new DataView(b.buffer).getFloat64(0, true); }
  // GET of a string variable reads LEN(variable) bytes.
  getString(n, p) { return String.fromCharCode(...this.getBytes(n, p)); }

  putInt(v, p) { const b = new Uint8Array(2); new DataView(b.buffer).setInt16(0, v, true); this.putBytes(b, p); }
  putLong(v, p) { const b = new Uint8Array(4); new DataView(b.buffer).setInt32(0, v, true); this.putBytes(b, p); }
  putSingle(v, p) { const b = new Uint8Array(4); new DataView(b.buffer).setFloat32(0, v, true); this.putBytes(b, p); }
  putDouble(v, p) { const b = new Uint8Array(8); new DataView(b.buffer).setFloat64(0, v, true); this.putBytes(b, p); }
  putString(s, p) {
    const b = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff;
    this.putBytes(b, p);
  }

  // ------------------------------------------------ sequential output
  // PRINT #n, text  (text already formatted; newline adds CR LF)
  print(text) { this.putString(text); }
  println(text = '') { this.putString(text + '\r\n'); }

  // WRITE #n, a, b, ...: strings quoted, numbers without spaces.
  write(...vals) {
    const parts = vals.map((v) => {
      if (typeof v === 'string') return '"' + v + '"';
      return ltrim$(str$(v.value !== undefined ? v.value : v, v.type || 'int'));
    });
    this.println(parts.join(','));
  }

  // ------------------------------------------------ sequential input
  // LINE INPUT #n
  lineInput() {
    if (this.eof()) throw new QBError('Input past end of file: ' + this.name);
    let s = '';
    while (this.pos < this.size) {
      const c = this.data[this.pos++];
      if (c === 13) { if (this.data[this.pos] === 10) this.pos++; break; }
      if (c === 10) break;
      if (c === 26) { this.pos--; break; }
      s += String.fromCharCode(c);
    }
    return s;
  }

  // INPUT #n: one comma / newline separated field, quotes removed.
  inputField() {
    if (this.eof()) throw new QBError('Input past end of file: ' + this.name);
    // Skip leading blanks.
    while (this.pos < this.size && (this.data[this.pos] === 32 || this.data[this.pos] === 9)) this.pos++;
    let s = '';
    if (this.data[this.pos] === 34) {
      this.pos++;
      while (this.pos < this.size && this.data[this.pos] !== 34) s += String.fromCharCode(this.data[this.pos++]);
      this.pos++; // closing quote
      while (this.pos < this.size && this.data[this.pos] === 32) this.pos++;
    } else {
      while (this.pos < this.size) {
        const c = this.data[this.pos];
        if (c === 44 || c === 13 || c === 10 || c === 26) break;
        s += String.fromCharCode(c);
        this.pos++;
      }
      s = s.replace(/ +$/, '');
    }
    // Consume the separator.
    const c = this.data[this.pos];
    if (c === 44) this.pos++;
    else if (c === 13) { this.pos++; if (this.data[this.pos] === 10) this.pos++; }
    else if (c === 10) this.pos++;
    return s;
  }
  inputString() { return this.inputField(); }
  inputNumber() { return val(this.inputField()); }
}

// File numbers #1, #2, ... as in QuickBasic.
const openFiles = {};
function qbOpen(num, name, mode) {
  if (openFiles[num]) throw new QBError('File already open: #' + num);
  openFiles[num] = new QBFile(name, mode);
  return openFiles[num];
}
function qbClose(num) {
  if (num === undefined) {
    for (const k of Object.keys(openFiles)) { openFiles[k].close(); delete openFiles[k]; }
    return;
  }
  if (openFiles[num]) { openFiles[num].close(); delete openFiles[num]; }
}
function qbFile(num) {
  const f = openFiles[num];
  if (!f) throw new QBError('Bad file number: #' + num);
  return f;
}
function qbKill(name) {
  if (!DosFS.exists(name)) throw new QBError('File not found: ' + name);
  DosFS.remove(name);
}

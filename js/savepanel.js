// The saved-games panel under the game screen: lists the saved games in the
// browser's file store and lets the player download them (as a .zip of the
// original DOS files, usable with the DOS version too) or upload them.
//
// A saved game is NAME.ALF (the character) plus NAME.SAV (the maps).
'use strict';

// ------------------------------------------------------------ zip files
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Builds a .zip (no compression) from [{name, data: Uint8Array}].
function makeZip(files) {
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const parts = [], central = [];
  let offset = 0;
  for (const f of files) {
    const name = new TextEncoder().encode(f.name);
    const crc = crc32(f.data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 10, true);
    local.setUint16(10, dosTime, true); local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true); local.setUint32(18, f.data.length, true);
    local.setUint32(22, f.data.length, true); local.setUint16(26, name.length, true);
    parts.push(new Uint8Array(local.buffer), name, f.data);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 10, true);
    cen.setUint16(12, dosTime, true); cen.setUint16(14, dosDate, true);
    cen.setUint32(16, crc, true); cen.setUint32(20, f.data.length, true);
    cen.setUint32(24, f.data.length, true); cen.setUint16(28, name.length, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), name);
    offset += 30 + name.length + f.data.length;
  }
  const cenSize = central.reduce((n, p) => n + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cenSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}

// Reads a .zip: returns [{name, data}].  Handles stored and deflated files.
async function readZip(buf) {
  const v = new DataView(buf);
  let e = buf.byteLength - 22;
  while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('not a zip file');
  const count = v.getUint16(e + 10, true);
  let p = v.getUint32(e + 16, true);
  const out = [];
  for (let i = 0; i < count; i++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('bad zip directory');
    const method = v.getUint16(p + 10, true);
    const csize = v.getUint32(p + 20, true);
    const nlen = v.getUint16(p + 28, true), xlen = v.getUint16(p + 30, true), clen = v.getUint16(p + 32, true);
    const lho = v.getUint32(p + 42, true);
    const name = new TextDecoder().decode(new Uint8Array(buf, p + 46, nlen));
    p += 46 + nlen + xlen + clen;
    const start = lho + 30 + v.getUint16(lho + 26, true) + v.getUint16(lho + 28, true);
    const raw = new Uint8Array(buf, start, csize);
    let data;
    if (method === 0) {
      data = raw.slice();
    } else if (method === 8) {
      const ds = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      data = new Uint8Array(await new Response(ds).arrayBuffer());
    } else {
      throw new Error('unsupported compression in ' + name);
    }
    if (!name.endsWith('/')) out.push({ name: name.split('/').pop(), data });
  }
  return out;
}

// ------------------------------------------------------------ the panel
const SavePanel = {
  init(root) {
    this.root = root;
    this.list = root.querySelector('#save-list');
    this.msg = root.querySelector('#save-message');
    const input = root.querySelector('#save-upload');
    input.addEventListener('change', async () => {
      await this.upload([...input.files]);
      input.value = '';
      input.blur();
    });
    let pending = false;
    DosFS.listeners.push(() => {
      if (pending) return;
      pending = true;
      setTimeout(() => { pending = false; this.render(); }, 250);
    });
    this.render();
  },

  // Saved games: NAME -> {alf, sav} (sizes in bytes, or null).
  saves() {
    const saves = new Map();
    for (const f of DosFS.list()) {
      const m = /^(.+)\.(ALF|SAV)$/.exec(f);
      if (!m) continue;
      const s = saves.get(m[1]) || { alf: null, sav: null };
      s[m[2].toLowerCase()] = DosFS.read(f).length;
      saves.set(m[1], s);
    }
    return saves;
  },

  render() {
    const saves = this.saves();
    this.list.textContent = '';
    if (saves.size === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No saved games yet. Press S in the game to save.';
      this.list.appendChild(li);
      return;
    }
    for (const [name, s] of saves) {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.className = 'save-name';
      label.textContent = name;
      const info = document.createElement('span');
      info.className = 'save-info';
      info.textContent = s.alf === null ? 'maps only (no .ALF)' : s.sav === null ? 'character only (no .SAV)' : '';
      const play = document.createElement('button');
      play.textContent = 'Play';
      play.title = `Restart with this saved game (like typing ALPHAMAN ${name} in DOS)`;
      play.disabled = s.alf === null;
      play.addEventListener('click', () => {
        if (!confirm(`Load ${name}? Any game in progress that hasn't been saved will be lost.`)) { play.blur(); return; }
        location.search = '?' + encodeURIComponent(name);
      });
      const dl = document.createElement('button');
      dl.textContent = 'Download';
      dl.title = `Download ${name}.ALF and ${name}.SAV as a .zip`;
      dl.addEventListener('click', () => { this.download(name); dl.blur(); });
      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.className = 'danger';
      del.addEventListener('click', () => {
        del.blur();
        if (!confirm(`Delete the saved game ${name}? This can't be undone.`)) return;
        DosFS.remove(name + '.ALF'); DosFS.remove(name + '.SAV');
        this.say(`Deleted ${name}.`);
      });
      li.append(label, info, play, dl, del);
      this.list.appendChild(li);
    }
  },

  download(name) {
    const files = [];
    for (const ext of ['ALF', 'SAV']) {
      const data = DosFS.read(name + '.' + ext);
      if (data) files.push({ name: name + '.' + ext, data });
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(makeZip(files));
    a.download = name + '.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  },

  async upload(fileList) {
    const added = [];
    try {
      for (const file of fileList) {
        const buf = await file.arrayBuffer();
        const entries = /\.zip$/i.test(file.name) ? await readZip(buf) : [{ name: file.name, data: new Uint8Array(buf) }];
        for (const e of entries) {
          if (!/\.(alf|sav)$/i.test(e.name)) continue;
          const n = DosFS.normalize(e.name);
          if (DosFS.exists(n) && !confirm(`Replace the existing ${n}?`)) continue;
          DosFS.write(n, e.data);
          added.push(n);
        }
      }
      this.say(added.length ? `Uploaded ${added.join(', ')}. Press Play to load it.`
        : 'No .ALF or .SAV files were found in that upload.');
    } catch (err) {
      this.say('Upload failed: ' + err.message);
    }
  },

  say(text) { this.msg.textContent = text; },
};

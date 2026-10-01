// Port of ALPCLIB.C, the C and assembly helper library linked into the
// QuickBasic program.  C "int" is 16 bits (MS QuickC, medium model); i16()
// marks the places where that matters.  Page 2 is not real video memory: it
// is the BASIC array pag2() reached through the BASIC GetSym / PutSym.
//
// Copyright (c) 1995 Jeffrey R. Olson (MIT license, see LICENSE)
'use strict';

const i16 = (v) => ((v + 32768) & 0xffff) - 32768;

// #define getrandom(min, max) ((rand() % (int)((max) - (min) + 1)) + (min))
function getrandom(min, max) {
  const r = cRand();
  const m = i16(max - min + 1);
  return i16((r % m) + min);
}

// C constants from ALPCLIB.C
const C_TRUE = -1, C_FALSE = 0;
const C_HOR = 205, C_VER = 186, C_CEN = 206, C_UL = 201, C_UM = 203, C_UR = 187;
const C_ML = 204, C_MRT = 185, C_LL = 200, C_LM = 202, C_LR = 188;
const C_LOCKEDDOOR = 43, C_SECRETDOOR = 228;

let nested = 0, maxnested = 0, xstair = 0, ystair = 0;

function addaroom(x, y, dx, dy) {
  let putroom = C_TRUE;
  cputsym(219, x, y, 9, 0, 2);
  cputsym(219, x - dx, y - dy, 9, 0, 2);
  let xr = getrandom(x, x + 2);
  let xl = getrandom(x - 2, x);
  let yb = getrandom(y, y + 2);
  let yt = getrandom(y - 2, y);
  if (dx === 1) xr++;
  else if (dx === -1) xl--;
  if (dy === 1) yb++;
  else if (dy === -1) yt--;

  for (let i = xl - 1; i <= xr + 1; i++) {
    for (let j = yt - 1; j <= yb + 1; j++) {
      const sym = cgetsym(i, j, 2) % 256;
      if (sym !== 219) putroom = C_FALSE;
    }
  }

  if (putroom) {
    for (let i = xl; i <= xr; i++) { for (let j = yt; j <= yb; j++) cputsym(250, i, j, 8, 0, 2); }
    for (let i = 1; i <= 10; i++) {
      const dir = getrandom(1, 4);
      let x1 = getrandom(xl, xr), y1 = getrandom(yt, yb), dx1 = 0, dy1 = 0;
      switch (dir) {
        case 1: x1 = xl; dx1 = -1; break;
        case 2: y1 = yt; dy1 = -1; break;
        case 3: x1 = xr; dx1 = 1; break;
        case 4: y1 = yb; dy1 = 1; break;
      }
      drawtunnel(x1, y1, dx1, dy1);
    }
  }
  cputsym(250, x, y, 8, 0, 2);
  cputsym(250, x - dx, y - dy, 8, 0, 2);
}

function drawtunnel(x, y, dx, dy) {
  nested++;
  let maxlen = dy === 0 ? getrandom(3, getrandom(3, 14)) : getrandom(3, getrandom(3, 8));
  const max = walldist(x, y, dx, dy, maxlen, 1) - 1;
  if (maxlen > max) maxlen = max;
  if (maxlen < 3) { nested--; return; }
  for (let i = 0; i < maxlen; i++) {
    cputsym(250, x, y, 8, 0, 2);
    x += dx; y += dy;
  }
  x -= dx; y -= dy;

  if (nested > 4) addaroom(x, y, dx, dy);

  if (nested < 30) {
    const dx1 = -dy, dy1 = -dx, dx2 = dy, dy2 = dx;
    const dx3 = dx, dy3 = dy;
    drawtunnel(x, y, dx1, dy1);
    drawtunnel(x, y, dx2, dy2);
    drawtunnel(x, y, dx3, dy3);
  }

  if ((maxnested < nested) && (cRoll(2) === 2)) {
    maxnested = nested; xstair = x; ystair = y;
  }
  nested--;
}

// void lair(int *xr, int *xl, int *yb, int *yt, int *xs, int *ys)
function lair() {
  nested = 0;
  maxnested = 0;
  const xm = getrandom(21, 32), xw = getrandom(6, 10);
  const ym = getrandom(10, 13), yw = getrandom(4, 6);
  const xl = xm - Math.trunc(xw / 2), xr = xl + xw;
  const yt = ym - Math.trunc(yw / 2), yb = yt + yw;
  for (let i = 2; i < 52; i++) { for (let j = 2; j < 22; j++) cputsym(219, i, j, 9, 0, 2); }
  for (let i = xl; i <= xr; i++) {
    for (let j = yt; j <= yb; j++) cputsym(250, i, j, 8, 0, 2);
  }
  box(1, 52, 1, 22, 1, 4, 2);
  for (let i = 0; i < 10; i++) {
    let x = getrandom(xl + 1, xr - 1), y = getrandom(yt + 1, yb - 1);
    let dx = 0, dy = 0;
    switch (cRoll(4)) {
      case 1: x = xl - 1; dx = -1; break;
      case 2: x = xr + 1; dx = 1; break;
      case 3: y = yt - 1; dy = -1; break;
      case 4: y = yb + 1; dy = 1; break;
    }
    drawtunnel(x, y, dx, dy);
  }
  cputsym(240, xstair, ystair, 13, 0, 2);
  return { xr, xl, yb, yt, xs: xstair, ys: ystair };
}

function walldist(x, y, dx, dy, max, incastle) {
  let dist = max;
  let k = 0;
  while (k < max) {
    k++;
    x += dx; y += dy;
    if (incastle === 1) {
      const sym = cgetsym(x, y, 2) % 256;
      const sym1 = cgetsym(x + dy, y + dx, 2) % 256;
      const sym2 = cgetsym(x - dy, y - dx, 2) % 256;
      if ((sym !== 219) || (sym1 !== 219) || (sym2 !== 219)) {
        if (cRoll(40) !== 1) { dist = k - 1; k = max + 1; }
      }
    } else {
      const sym = cgetsym(x + dx * k, y + dy * k, 2) % 256;
      switch (sym) {
        case 32: case 240: case 250: break;
        default: dist = k; k = max + 1; break;
      }
    }
  }
  return dist;
}

// void finddot(int *x, int *y, int incastle)
function finddot(incastle) {
  let dot = C_FALSE;
  let x = 0, y = 0;
  while (dot === 0) {
    x = getrandom(2, 51); y = getrandom(2, 21);
    const sym = cgetsym(x, y, 2) % 256;
    if (incastle) { if (sym === 250) dot = C_TRUE; }
    else if (sym === 250 || sym === 249 || sym === 32 || sym === 247 || sym === 126) dot = C_TRUE;
  }
  return [x, y];
}

function rolldice(size, nroll, nuse) {
  // QuickBasic passed these BYVAL AS INTEGER, rounding any fractions.
  size = cint(size); nroll = cint(nroll); nuse = cint(nuse);
  const dice = new Array(50).fill(0);
  nroll = nroll > 50 ? 50 : nroll;
  nuse = nuse > nroll ? nroll : nuse;
  for (let i = 0; i < nroll; i++) dice[i] = getrandom(1, size);
  if (nroll !== nuse) {
    for (let i = 0; i < nuse; i++) {
      for (let j = i + 1; j < nroll; j++) {
        if (dice[i] < dice[j]) { const t = dice[i]; dice[i] = dice[j]; dice[j] = t; }
      }
    }
  }
  let temp = 0;
  for (let i = 0; i < nuse; i++) temp += dice[i];
  return i16(temp);
}

function confuse(r, i) {
  let dir = -1;
  let z;
  switch (r) {
    case 1071: dir = 7; break;
    case 1072: dir = 0; break;
    case 1073: dir = 1; break;
    case 1075: dir = 6; break;
    case 1077: dir = 2; break;
    case 1079: dir = 5; break;
    case 1080: dir = 4; break;
    case 1081: dir = 3; break;
  }
  z = getrandom(1, 100);
  switch (i) {
    case 1:
      if (z < 68) {
        dir += getrandom(-2, 2);
        dir = dir < 0 ? dir + 8 : dir;
        dir = dir > 7 ? dir - 8 : dir;
      } else if (z < 95) dir = r;
      else dir = 46;
      break;
    case 2:
      if (z < 72) {
        dir += getrandom(-1, 1);
        dir = dir < 0 ? dir + 8 : dir;
        dir = dir > 7 ? dir - 8 : dir;
      } else if (z < 99) dir = r;
      else dir = 46;
      break;
    default:
      if (z < 68) dir = getrandom(0, 7);
      else if (z < 95) dir = r;
      else dir = 46;
      break;
  }
  switch (dir) {
    case 0: z = 1072; break;
    case 1: z = 1073; break;
    case 2: z = 1077; break;
    case 3: z = 1081; break;
    case 4: z = 1080; break;
    case 5: z = 1079; break;
    case 6: z = 1075; break;
    case 7: z = 1071; break;
    default: z = dir; break;
  }
  return z;
}

function roomit(xr, xl, yb, yt) {
  let sym;
  let dots = 0;

  sym = cgetsym(xr, yb, 2) % 256;
  switch (sym) {
    case C_LL: case C_HOR: sym = C_LM; break;
    case C_UL: case C_UM: case C_ML: sym = C_CEN; break;
    case C_LR: case C_LM: case C_MRT: case C_CEN:
    case C_LOCKEDDOOR: case C_SECRETDOOR: break;
    case C_UR: case C_VER: sym = C_MRT; break;
    default: sym = C_LR; break;
  }
  cputsym(sym, xr, yb, 9, 0, 2);

  sym = cgetsym(xr, yt, 2) % 256;
  switch (sym) {
    case C_VER: case C_LR: sym = C_MRT; break;
    case C_ML: case C_LL: case C_LM: sym = C_CEN; break;
    case C_UM: case C_UR: case C_MRT: case C_CEN:
    case C_LOCKEDDOOR: case C_SECRETDOOR: break;
    case C_UL: case C_HOR: sym = C_UM; break;
    default: sym = C_UR; break;
  }
  cputsym(sym, xr, yt, 9, 0, 2);

  sym = cgetsym(xl, yb, 2) % 256;
  switch (sym) {
    case C_UL: case C_VER: sym = C_ML; break;
    case C_UM: case C_UR: case C_MRT: sym = C_CEN; break;
    case C_ML: case C_LL: case C_LM: case C_CEN:
    case C_LOCKEDDOOR: case C_SECRETDOOR: break;
    case C_LR: case C_HOR: sym = C_LM; break;
    default: sym = C_LL; break;
  }
  cputsym(sym, xl, yb, 9, 0, 2);

  sym = cgetsym(xl, yt, 2) % 256;
  switch (sym) {
    case C_LL: case C_VER: sym = C_ML; break;
    case C_LM: case C_LR: case C_MRT: sym = C_CEN; break;
    case C_ML: case C_UL: case C_UM: case C_CEN:
    case C_LOCKEDDOOR: case C_SECRETDOOR: break;
    case C_UR: case C_HOR: sym = C_UM; break;
    default: sym = C_UL; break;
  }
  cputsym(sym, xl, yt, 9, 0, 2);

  for (let i = xl + 1; i < xr; i++) {
    sym = cgetsym(i, yt, 2) % 256;
    switch (sym) {
      case C_LL: case C_LM: case C_LR: sym = C_LM; break;
      case C_CEN: case C_LOCKEDDOOR: case C_SECRETDOOR: break;
      default: sym = C_HOR; break;
    }
    cputsym(sym, i, yt, 9, 0, 2);
    sym = cgetsym(i, yb, 2) % 256;
    switch (sym) {
      case C_UL: case C_UM: case C_UR: sym = C_UM; break;
      case C_CEN: case C_LOCKEDDOOR: case C_SECRETDOOR: break;
      default: sym = C_HOR; break;
    }
    cputsym(sym, i, yb, 9, 0, 2);
    for (let j = yt + 1; j < yb; j++) { cputsym(250, i, j, 8, 0, 2); dots++; }
  }
  for (let i = yt + 1; i < yb; i++) {
    sym = cgetsym(xr, i, 2) % 256;
    switch (sym) {
      case C_LL: case C_ML: case C_UL: sym = C_ML; break;
      case C_CEN: case C_LOCKEDDOOR: case C_SECRETDOOR: break;
      default: sym = C_VER; break;
    }
    cputsym(sym, xr, i, 9, 0, 2);
    sym = cgetsym(xl, i, 2) % 256;
    switch (sym) {
      case C_LR: case C_MRT: case C_UR: sym = C_MRT; break;
      case C_CEN: case C_LOCKEDDOOR: case C_SECRETDOOR: break;
      default: sym = C_VER; break;
    }
    cputsym(sym, xl, i, 9, 0, 2);
  }
  return dots;
}

// Generates the main (overland) map on video page 0.  C float variables are
// single precision; arithmetic is done in double as MS C did.
function cmainmap(irnd, jrnd) {
  const f = Math.fround;
  let x, y, result, csx, csy, z, z1, sym;
  box(1, 52, 1, 22, 1, 4, 0);
  for (let i = 2; i <= 17; i++) {
    y = f((i - 2) * 0.025);
    for (let j = 2; j <= 51; j++) {
      x = f((j - 25) * 0.02);
      result = f(getrandom(4, 7) / (0.033 + x * x + 5 * (y - 0.1) * (y - 0.1)));
      result = f(result + getrandom(4, 7) / (0.05 + (x - 0.5) * (x - 0.5) + 2 * y * y));
      z = i16(Math.floor(result) - getrandom(16, 50));
      if (getrandom(1, 100) < z) {
        sym = (getrandom(1, 1000) < 7 * z) ? 15 : 42;
        cputsym(sym, j + jrnd * (53 - 2 * j), i + irnd * (23 - 2 * i), 2 + 8 * (getrandom(1, 2) === 1 ? 1 : 0), 0, 0);
      }
    }
  }
  const a = getrandom(1, 40), b = getrandom(1, 20), c = getrandom(1, 300);
  for (let i = 14; i <= 21; i++) {
    y = f(i * 33 - 420 + a);
    csy = f(Math.cos(y / 200));
    for (let j = 2; j <= 51; j++) {
      x = f(j * 10 - 230 + b);
      csx = f(Math.cos(x / 200));
      z = i16(Math.trunc(100 * (csx * csx + csy * csy) + x * y / (3500 + c)));
      z1 = i16(z + cRoll(10) - cRoll(10));
      if (z < 58) {
        cputsym(247, j + jrnd * (53 - 2 * j), i + irnd * (23 - 2 * i), 1 + 8 * (getrandom(1, 2) === 1 ? 1 : 0), 0, 0);
      } else if (z1 < 78) {
        cputsym(177, j + jrnd * (53 - 2 * j), i + irnd * (23 - 2 * i), 6, 0, 0);
      } else if (z1 < 100) {
        cputsym(176, j + jrnd * (53 - 2 * j), i + irnd * (23 - 2 * i), 6, 0, 0);
      }
    }
  }
}

// Generates a local map on page 2 from the terrain types of the main map
// square (t) and its four neighbours (t1 left, t2 above, t3 right, t4 below).
function cdetailedmap(t, t1, t2, t3, t4) {
  let terr, z, sym, clr, clradd, xx, yy, zx, zy;
  box(1, 52, 1, 22, 1, 4, 1); box(1, 52, 1, 22, 1, 4, 2);
  for (let x = 2; x <= 51; x++) {
    zx = 7 * (Math.abs(x - 26) - 12);
    for (let y = 2; y <= 21; y++) {
      zy = 14 * (Math.abs(y - 11) - 3);
      xx = getrandom(1, 100); yy = getrandom(1, 100);
      terr = t;
      if (yy < zy) terr = (y > 12) ? t4 : t2;
      if (xx < zx) terr = (x > 25) ? t3 : t1;
      z = getrandom(1, 100);
      clradd = getrandom(0, 1) * 8;
      switch (terr) {
        case 15: case 94: // deep forest
          if (z > 70) sym = 250;
          else if (z > 40) sym = 249;
          else if (z > 11) sym = 42;
          else sym = 15;
          clr = 2 + clradd;
          break;
        case 42: case 127: // light forest
          if (z > 70) sym = 32;
          else if (z > 40) sym = 250;
          else if (z > 15) sym = 249;
          else if (z > 5) sym = 42;
          else sym = 15;
          clr = 2 + clradd;
          break;
        case 176: case 30: // marsh
          clr = 6;
          if (z > 24) sym = 32;
          else if (z > 10) sym = 176;
          else if (z > 6) { sym = 247; clr = 1; }
          else if (z > 2) {
            sym = 42;
            if (getrandom(1, 3) !== 1) clr = 2;
          } else {
            sym = 15;
            if (getrandom(1, 3) !== 1) clr = 2;
          }
          break;
        case 177: // swamp
          clr = 6;
          if (z > 44) sym = 32;
          else if (z > 17) sym = 176;
          else if (z > 6) { sym = 247; clr = 1; }
          else if (z > 2) {
            sym = 42;
            if (getrandom(1, 2) !== 1) clr = 2;
          } else {
            sym = 15;
            if (getrandom(1, 2) !== 1) clr = 2;
          }
          break;
        case 247:
          if (z < 90) sym = 247;
          else sym = 126;
          clr = (getrandom(1, 6) === 1) ? 3 : 1;
          break;
        default:
          clr = 6;
          if (z > 40) sym = 32;
          else if (z > 20) sym = 250;
          else if (z > 2) sym = 249;
          else if (z === 2) { sym = 42; clr = 2 + clradd; }
          else { sym = 15; clr = 2 + clradd; }
          break;
      }
      cputsym(sym, x, y, clr, 0, 2);
    }
  }
}

function box(lc, rc, tc, bc, nl, fc, pag) {
  let a, b, c, d, e, f;
  switch (nl) {
    case 1: a = 196; b = 179; c = 218; d = 191; e = 217; f = 192; break;
    default: a = 205; b = 186; c = 201; d = 187; e = 188; f = 200; break;
  }
  for (let i = lc + 1; i < rc; i++) {
    cputsym(a, i, bc, fc, 0, pag); cputsym(a, i, tc, fc, 0, pag);
  }
  for (let i = tc + 1; i < bc; i++) {
    cputsym(b, rc, i, fc, 0, pag); cputsym(b, lc, i, fc, 0, pag);
  }
  cputsym(c, lc, tc, fc, 0, pag); cputsym(d, rc, tc, fc, 0, pag);
  cputsym(e, rc, bc, fc, 0, pag); cputsym(f, lc, bc, fc, 0, pag);
}

// Sorts the nearby creatures ncre(1..nnear, 1..15) by distance.  The C
// version's quirks are kept: one pass per gap ("limit = switchit - offset"),
// and the result is applied as the inverse permutation.  Returns the new
// value of tentgrab.
function creatsort(nnear, tentgrab, ncre) {
  const cnt = new Array(51).fill(0);
  const scratch = new Array(51).fill(0);
  if (nnear > 50) nnear = 50;
  for (let i = 1; i <= nnear; i++) {
    scratch[i] = Math.abs(ncre[i][4]) + Math.abs(ncre[i][5]);
    if (ncre[i][6] < 0) scratch[i] = -scratch[i];
    cnt[i] = i;
  }
  let offset = Math.floor(nnear / 2);
  let switched = C_FALSE;
  while (offset > 0) {
    let limit = nnear - offset;
    let switchit;
    do {
      switchit = C_FALSE;
      for (let i = 1; i <= limit; i++) {
        if (scratch[cnt[i]] > scratch[cnt[i + offset]]) {
          const tempo = cnt[i];
          cnt[i] = cnt[i + offset];
          cnt[i + offset] = tempo;
          switchit = C_TRUE;
          switched = C_TRUE;
        }
      }
      limit = switchit - offset;
    } while (switchit);
    offset = Math.floor(offset / 2);
  }
  if (switched) {
    const temp = [];
    for (let i = 1; i <= nnear; i++) temp[i] = Array.from(ncre[i]);
    for (let i = 1; i <= nnear; i++) {
      for (let j = 1; j <= 15; j++) ncre[cnt[i]][j] = temp[i][j];
    }
    if (tentgrab > 0) tentgrab = cnt[tentgrab];
  }
  return tentgrab;
}

// True if nothing blocks the line from (x1,y1) to (x2,y2) on page 2.
function csameroom(x1, y1, x2, y2, localx, localy, nnear, ncre) {
  let same = C_TRUE;
  const ddx = x2 - x1;
  const ddy = y2 - y1;
  const dxtemp = ddx - sgn(ddx);
  const dytemp = ddy - sgn(ddy);
  let x = dxtemp - sgn(dxtemp);
  let y = dytemp - sgn(dytemp);
  const rrr = crdsimp(x, y);
  let dx = 0, dy = 0;
  if (rrr > 0) { dx = Math.fround(x / rrr); dy = Math.fround(y / rrr); }
  const xstart = x1 + sgn(ddx), ystart = y1 + sgn(ddy);
  for (let i = 0; i <= rrr; i++) {
    y = i16(Math.floor(ystart + dy * i + 0.5)); x = i16(Math.floor(xstart + dx * i + 0.5));
    if ((x !== x1 + ddx) || (y !== y1 + ddy)) {
      let attr = cgetsym(x, y, 2);
      const sym = attr % 256; attr -= sym; attr >>= 8; const fc = attr % 16;
      if (fc === 9) same = C_FALSE;
      else if ((sym >= 65 && sym <= 90) || (sym >= 97 && sym <= 122)) {  // isalpha
        let cr = 0;
        for (let j = 1; j <= nnear; j++) {
          if ((ncre[j][4] === (x - localx)) && (ncre[j][5] === (y - localy))) cr = j;
        }
        if ((cr > 0) && (Math.floor(Math.trunc(ncre[cr][8] / 1000)) === 9)) same = C_FALSE;
      }
    }
  }
  return same;
}

function badmovecreat(newx, newy, nnear, cre, ncre) {
  let bad = 0;
  let count = 1;
  while ((bad === 0) && (count <= nnear)) {
    if ((ncre[count][4] === newx) && (ncre[count][5] === newy)) {
      if (count !== cre) { bad = count; return bad; }
    }
    count++;
  }
  return bad;
}

// Blanks columns 54-80 of rows 1-23 (the right-hand panel).
function clearright(pag) {
  for (let row = 1; row <= 23; row++) {
    for (let col = 54; col <= 80; col++) SCR.setCell(pag, col, row, 0x0720);
  }
}

function ccls(pag) { SCR.fillPage(pag, 0x0720); }

// sgn() is the same as QuickBasic SGN (defined in runtime/qb.js).

// Integer square root (rounded), exactly as the assembly routine computed it.
function isqrt(num) {
  let cx = i16(num & 0xffff);
  const bx = num & 0xffff;
  let ax = 1;
  while (cx >= 0) { cx = i16(cx - ax); ax = i16(ax + 2); }
  ax >>= 1;
  cx = ax;
  ax = i16(Math.imul(ax, cx));
  ax = i16(ax - cx + 1);
  if ((ax & 0xffff) > bx) cx--;
  return cx;
}

function cgetsym(x, y, pag) {
  if (pag === 2) {
    // The C code asks the BASIC GetSym for page 2 (the pag2 array).
    const [sym, fc, bc] = GetSym(x, y, pag);
    return i16(((fc + bc * 16) << 8) + sym);
  }
  return i16(SCR.getCell(pag, x, y));
}

function cputsym(sym, x, y, fc, bc, pag) {
  if (pag === 2) { PutSym(sym, x, y, fc, bc, pag); return; }
  SCR.setCell(pag, x, y, (sym + ((fc + bc * 16) << 8)) & 0xffff);
}

function crandomize(seed) {
  seed = Math.fround(seed);
  for (; seed > 3276; seed = Math.fround(seed / 2));
  const iseed = Math.floor(seed * 10) & 0xffff;
  cSrand(iseed);
}

function cRoll(max) { max = cint(max); return max > 1 ? getrandom(1, max) : 1; }

// Distance, rounded.
function crd(x, y) {
  const result = Math.fround(i16(i16(y * y) + i16(x * x)));
  if (result < 65536) return isqrt(Math.floor(result + 0.5) & 0xffff);
  return i16(Math.floor(Math.sqrt(result) + 0.5));
}

// Quick approximate distance.
function crdsimp(x, y) {
  let xx = Math.abs(x), yy = Math.abs(y);
  if (xx > yy) { yy >>= 2; return xx + yy; }
  xx >>= 2; return xx + yy;
}

// Direction for a fleeing/approaching creature at offset (x, y); returns
// 10*(dx+1) + (dy+1).
function cfinddxdy(x, y, n) {
  const p = i16(Math.trunc(30 * (n + 0.2)));
  let mult = i16(3 * p);
  if (mult < 100) mult = 100;
  const rx = getrandom(1, i16(10 * mult)), ry = getrandom(1, i16(10 * mult));
  let dx = -sgn(x); if (Math.abs(x) === 1 && cRoll(4) === 1) dx = 0;
  let dy = -sgn(y); if (Math.abs(y) === 1 && cRoll(4) === 1) dy = 0;
  switch (dx) {
    case -1: case 1:
      if (rx < p) dx = -dx;
      else if (rx < p * 10) dx = 0;
      break;
    default:
      if (rx < mult * 3) dx = -1;
      else if (rx < mult * 6) dx = 1;
      break;
  }
  switch (dy) {
    case -1: case 1:
      if (ry < p) dy = -dy;
      else if (ry < p * 10) dy = 0;
      break;
    default:
      if (ry < mult * 3) dy = -1;
      else if (ry < mult * 6) dy = 1;
      break;
  }
  return 10 * (++dx) + (++dy);
}

// Port of A6.BAS: castle rooms and walls, lighting of rooms (DotIt), berry
// effects, dropping and eating, entering and leaving castles, identifying
// items (Figure) and removing traps.
//
// Copyright (c) 1995 Jeffrey R. Olson (MIT license, see LICENSE)
'use strict';

const inRange = (v, lo, hi) => v >= lo && v <= hi;
const isLetter = (s) => inRange(s, 65, 90) || inRange(s, 97, 122);

// Adds a room behind the nearest suitable wall.  Returns didit.
function AddRoom(x, y, didit, small) {
  let xdoor = x, ydoor = y, rdist = 0, ldist = 0, bdist = 0, tdist = 0;
  let sym = 0, sym2 = 0, fc = 0, bc = 0, zzz = 0, aaa = 0;
  const doorSym = () => {
    sym = cen; zzz = cRoll(100); aaa = 6 * Math.abs(castlelevel) + 2 * lvl;
    if (aaa > 70) aaa = 70;
    if (zzz < aaa) sym = lockeddoor; else if (zzz < aaa * 1.3) sym = secretdoor;
  };
  didit = FALSE;
  rdist = Walld(x, y, 1, 0, 100);
  [sym, fc, bc] = GetSym(x + rdist, y, 2);
  [sym2, fc, bc] = GetSym(x + rdist + 1, y, 2);
  if (sym === ver && sym2 === 250) {
    xdoor = x + rdist;
    doorSym();
    PutSym(sym, xdoor, ydoor, wallcolr + 1, 0, 2); didit = TRUE;
    DrawRoom(xdoor, ydoor, 2, ver, small);
  } else {
    ldist = Walld(x, y, -1, 0, 100);
    [sym, fc, bc] = GetSym(x - ldist, y, 2);
    [sym2, fc, bc] = GetSym(x - ldist - 1, y, 2);
    if (sym === ver && sym2 === 250) {
      xdoor = x - ldist;
      doorSym();
      PutSym(sym, xdoor, ydoor, wallcolr + 1, 0, 2); didit = TRUE;
      DrawRoom(xdoor, ydoor, 1, ver, small);
    } else {
      bdist = Walld(x, y, 0, 1, 100);
      [sym, fc, bc] = GetSym(x, y + bdist, 2);
      [sym2, fc, bc] = GetSym(x, y + bdist + 1, 2);
      if (sym === hor && sym2 === 250) {
        ydoor = y + bdist;
        doorSym();
        PutSym(sym, xdoor, ydoor, wallcolr + 1, 0, 2); didit = TRUE;
        DrawRoom(xdoor, ydoor, 3, hor, small);
      } else {
        tdist = Walld(x, y, 0, -1, 100);
        [sym, fc, bc] = GetSym(x, y - tdist, 2);
        [sym2, fc, bc] = GetSym(x, y - tdist - 1, 2);
        if (sym === hor && sym2 === 250) {
          ydoor = y - tdist;
          doorSym();
          PutSym(sym, xdoor, ydoor, wallcolr + 1, 0, 2); didit = TRUE;
          DrawRoom(xdoor, ydoor, 4, hor, small);
        }
      }
    }
  }
  return didit;
}

// Once per turn: counts down the berry effects.
async function BerryEffect() {
  let fc = 15, aa = 0, bb = 0, cc = 0, dd = 0, ee = 0, ff = 0;
  const bryef = async () => {
    ClearMess();
    if (cc > 0) {   // (cc keeps its value from an earlier bryef (sic))
      Ljnkbig(aa, bb, cc, 13, 51, 18, jnk$(71, 1, 5), 0, 2);
    } else {
      ljnk(dd, ee, ff, 2);
    }
    await MessPause(fc, 0); SetCombatStats(); if (rdisp === 1) await DisplayCharacter();
  };

  if (bergreen) {
    bergreen = bergreen - 1;
    if (bergreen === 0) { aa = 328; bb = 51; cc = 10; fc = 10; await bryef(); }
  }

  if (berfresh) berfresh = berfresh - 1;

  if (berstr) {
    berstr = berstr - 1;
    if (imod(berstr, 1000) === 0) {
      str = str - idiv(berstr, 1000);
      berstr = 0; aa = 0; bb = 1; cc = 8; await bryef();
    }
  }

  if (berdex) {
    berdex = berdex - 1;
    if (imod(berdex, 1000) === 0) {
      dex = dex - idiv(berdex, 1000);
      berdex = 0; aa = 0; bb = 9; cc = 9; await bryef();
    }
  }

  if (bercon) {
    bercon = bercon - 1;
    if (imod(bercon, 1000) === 0) {
      con = con - idiv(bercon, 1000);
      bercon = 0; aa = 0; bb = 18; cc = 12; await bryef();
    }
  }

  if (berrr) {
    berrr = berrr - 1;
    if (imod(berrr, 1000) === 0) {
      rr = rr - idiv(berrr, 1000);
      berrr = 0; aa = 0; bb = 30; cc = 20; await bryef();
    }
  }

  if (bermr) {
    bermr = bermr - 1;
    if (imod(bermr, 1000) === 0) {
      mr = mr - idiv(bermr, 1000);
      bermr = 0; aa = -1; bb = 1; cc = 17; await bryef();
    }
  }

  if (berintl) {
    berintl = berintl - 1;
    if (imod(berintl, 1000) === 0) {
      intl = intl - idiv(berintl, 1000);
      berintl = 0; aa = -1; bb = 18; cc = 12; await bryef();
    }
  }

  if (berconfuse) berconfuse = berconfuse - 1;

  if (berscience) {
    berscience = berscience - 1;
    if (berscience === 0) { dd = 244; ee = 22; ff = 25; await bryef(); }
  }

  if (berpmut) {
    berpmut = berpmut - 1;
    if (berpmut === 0) {
      switch (pmut) {
        case 2: dex = dex + 10; break;
        case 3: str = str + 10; break;
        case 4: other2hitc = other2hitc + 1; other2hitr = other2hitr + 2; break;
        case 5: skinac = skinac + 5; SetCombatStats(); break;
        case 7:
          con = con + 10; hits = hits + 2 * lvl;
          hitmax = hitmax + 2 * lvl; ShowHits();
          break;
        case 8: rr = rr + 10; break;
      }
      await DisplayCharacter();
    }
  }

  if (berhpmut) {
    berhpmut = berhpmut - 1;
    if (berhpmut === 0) {
      switch (pmut) {
        case 2: dex = dex - 10; break;
        case 3: str = str - 10; break;
        case 4: other2hitc = other2hitc - 1; other2hitr = other2hitr - 2; break;
        case 5: skinac = skinac - 5; break;
        case 7:
          con = con - 10; hits = hits - 2 * lvl;
          hitmax = hitmax - 2 * lvl; ShowHits();
          break;
        case 8: rr = rr - 10; break;
      }
      await DisplayCharacter();
    }
  }

  if (bermmut) {
    bermmut = bermmut - 1;
    if (bermmut === 0) {
      switch (mmut) {
        case 1:
          other2hitc = other2hitc + 2; other2hitr = other2hitr + 2;
          otherdam = otherdam + 4;
          break;
        case 2: intl = intl + 10; break;
        case 3: mr = mr + 10; break;
      }
      await DisplayCharacter();
    }
  }

  if (berhmmut) {
    berhmmut = berhmmut - 1;
    if (berhmmut === 0) {
      switch (mmut) {
        case 1:
          other2hitc = other2hitc - 2; other2hitr = other2hitr - 2;
          otherdam = otherdam - 4;
          break;
        case 2: intl = intl - 10; break;
        case 3: mr = mr - 10; break;
      }
      await DisplayCharacter();
    }
  }

  if (berdet) {
    berdet = berdet - 1;
    if (berdet <= 0) {
      other2hitc = other2hitc - 2; other2hitr = other2hitr - 2;
    }
  }

  if (berblind) {
    berblind = berblind - 1 + (2 - 2 * qb(berhpmut > 0)) * qb(pmut === 4);
    if (berblind <= 0) {
      berblind = 0; dd = 174; ee = 44; ff = 17; await bryef();
    }
  }

  if (berhic) berhic = berhic - 1;

  if (berscare) {
    berscare = berscare - 1;
    if (berscare === 0) {
      if (not(mask)) for (let i = 1; i <= nnear; i++) ncre[i][6] = Math.abs(ncre[i][6]);
    }
  }

  if (berrambo) {
    berrambo = berrambo - 1;
    if (berrambo === 0) {
      str = str - 6; dex = dex - 6; con = con - 6; rr = rr - 6;
      hitmax = hitmax - 12;
      if (hits > hitmax) hits = hitmax;
      intl = intl + 10; mr = mr + 10;
      dd = 174; ee = 16; ff = 28; await bryef();
    }
  }

  if (berklutz) {
    berklutz = berklutz - 1;
    if (berklutz === 0) {
      dex = dex + klutzdex; dd = 304; ee = 16; ff = 24; await bryef();
    }
  }

  if (berregen) {
    berregen = berregen - 1;
    if (berregen === 0) { dd = 305; ee = 25; ff = 24; await bryef(); }
  }

  if (beryum) {
    beryum = beryum - 1;
    if (beryum === 0) { dd = 305; ee = 1; ff = 24; await bryef(); }
  }

  if (berff) {
    berff = berff - 1;
    if (berff === 0) { dd = 343; ee = 1; ff = 43; await bryef(); }
  }
}

// Is there already a door in the wall next to (xdoor, ydoor)?  Returns huh.
function Doored(xdoor, ydoor, xr, xl, yb, yt, dir, huh) {
  let sym = 0, fc = 0, bc = 0;
  huh = FALSE;
  switch (dir) {
    case 1: case 2:
      for (let i = ydoor - 1; i >= yt; i--) {
        [sym, fc, bc] = GetSym(xdoor, i, 2);
        if (sym === cen || sym === lockeddoor || sym === secretdoor) huh = TRUE; else if (sym === ml || sym === mrt) break;
      }
      for (let i = ydoor + 1; i <= yb; i++) {
        [sym, fc, bc] = GetSym(xdoor, i, 2);
        if (sym === cen || sym === lockeddoor || sym === secretdoor) huh = TRUE; else if (sym === ml || sym === mrt) break;
      }
      break;
    default:
      for (let i = xdoor - 1; i >= xl; i--) {
        [sym, fc, bc] = GetSym(i, ydoor, 2);
        if (sym === cen || sym === lockeddoor || sym === secretdoor) huh = TRUE; else if (sym === um || sym === lm) break;
      }
      for (let i = xdoor + 1; i <= xr; i++) {
        [sym, fc, bc] = GetSym(i, ydoor, 2);
        if (sym === cen || sym === lockeddoor || sym === secretdoor) huh = TRUE; else if (sym === um || sym === lm) break;
      }
  }
  return huh;
}

// Draws the wall corners saved by DotIt with the right junction symbols
// for the walls the character can see.
function DotCorn() {
  let x = 0, y = 0, s = 0, fc = 0, bc = 0, newsym = 0, xx = 0, yy = 0, sc = 0, sym = 0, ch = 0;
  let s1 = 0, s2 = 0, s3 = 0, s4 = 0, ss1 = 0, ss2 = 0, ss3 = 0, ss4 = 0;
  let fca = 0, fcb = 0, fcc = 0, fcd = 0, fc1 = 0, fc2 = 0, fc3 = 0, fc4 = 0, num = 0;
  const crecorn = () => {
    [sym, fc, bc] = GetSym(xx, yy, sc);
    if (isLetter(sym)) {
      ch = badmovecreat(xx - localx, yy - localy, nnear, 0, ncre);
      if (ch > 0) {
        sym = imod(ncre[ch][8], 1000); fc = idiv(ncre[ch][8], 1000);
      } else {
        sym = cen; fc = wallcolr;
      }
    }
  };
  for (let i = 1; i <= savecorn; i++) {
    x = savcrn[i][1]; y = savcrn[i][2];
    [s, fc, bc] = GetSym(x, y, 2);
    if (s === 240 || s === 250) {
      newsym = 240;
    } else {
      xx = x - 1; yy = y; sc = 1; crecorn(); s1 = sym; fca = fc;
      sc = 2; crecorn(); ss1 = sym; fc1 = fc;
      xx = x + 1; yy = y; sc = 1; crecorn(); s2 = sym; fcb = fc;
      sc = 2; crecorn(); ss2 = sym; fc2 = fc;
      xx = x; yy = y - 1; sc = 1; crecorn(); s3 = sym; fcc = fc;
      sc = 2; crecorn(); ss3 = sym; fc3 = fc;
      xx = x; yy = y + 1; sc = 1; crecorn(); s4 = sym; fcd = fc;
      sc = 2; crecorn(); ss4 = sym; fc4 = fc;

      [s, fc, bc] = GetSym(x, y, 2);
      switch (s) {
        case cen: num = 15; break;
        case mrt: num = 13; break;
        case ml: num = 14; break;
        case um: num = 11; break;
        case lm: num = 7; break;
      }

      if (num & 1) {
        if ((fca !== wallcolr && s1 !== 1) || (s1 === 1 && currf !== wallcolr)) {
          num = num - 1;
        } else if (fca === wallcolr) {
          if (s1 === ur || s1 === mrt || s1 === lr || s1 === ver) num = num - 1;
        } else {
          if (ss1 === ur || ss1 === mrt || ss1 === lr || ss1 === ver) num = num - 1;
        }
      }

      if (num & 2) {
        if ((fcb !== wallcolr && s2 !== 1) || (s2 === 1 && currf !== wallcolr)) {
          num = num - 2;
        } else if (fcb === wallcolr) {
          if (s2 === ul || s2 === ml || s2 === ll || s2 === ver) num = num - 2;
        } else {
          if (ss2 === ul || ss2 === ml || ss2 === ll || ss2 === ver) num = num - 2;
        }
      }

      if (num & 4) {
        if ((fcc !== wallcolr && s3 !== 1) || (s3 === 1 && currf !== wallcolr)) {
          num = num - 4;
        } else if (fcc === wallcolr) {
          if (s3 === ll || s3 === lm || s3 === lr || s3 === hor) num = num - 4;
        } else {
          if (ss3 === ll || ss3 === lm || ss3 === lr || ss3 === hor) num = num - 4;
        }
      }

      if (num & 8) {
        if ((fcd !== wallcolr && s4 !== 1) || (s4 === 1 && currf !== wallcolr)) {
          num = num - 8;
        } else if (fcd === wallcolr) {
          if (s4 === ul || s4 === um || s4 === ur || s4 === hor) num = num - 8;
        } else {
          if (ss4 === ul || ss4 === um || ss4 === ur || ss4 === hor) num = num - 8;
        }
      }

      switch (num) {
        case 10: newsym = ul; break;
        case 11: newsym = um; break;
        case 9: newsym = ur; break;
        case 14: newsym = ml; break;
        case 15: newsym = cen; break;
        case 13: newsym = mrt; break;
        case 6: newsym = ll; break;
        case 7: newsym = lm; break;
        case 5: newsym = lr; break;
        case 1: case 2: case 3: newsym = hor; break;
        default: newsym = ver;
      }
      fc = wallcolr;
    }
    PutSym(newsym, x, y, fc, bc, 1);   // dotput
    if (newsym === 240) PutSym(newsym, x, y, fc, bc, 2);
  }
}

// Lights up the part of the room containing (x, y) (flood fill).
function DotIt(x, y) {
  let sym = 0, fc = 0, bc = 0, goon = TRUE, newsym = 0, fca = 0, fcb = 0, bca = 0, ch = 0;
  if (x < 2 || x > 51 || y < 2 || y > 21) return;
  [sym, fc, bc] = GetSym(x, y, 1);
  if ((sym !== 32) && (sym !== 240) && (fc !== wallcolr)) return;
  [sym, fc, bc] = GetSym(x, y, 2);
  goon = TRUE;
  if (sym === 32 || sym === 219) {
    PutSym(219, x, y, wallcolr, 0, -1); goon = FALSE;
  } else if (sym === 250) {
    PutSym(sym, x, y, fc, bc, 1);
  } else if (sym === hor || sym === ver || sym === 43 || sym === ul || sym === ur || sym === ll || sym === lr || sym === lockeddoor) {
    PutSym(sym, x, y, fc, bc, 1); goon = FALSE;
  } else if (sym === cen) {
    goon = FALSE;
    [newsym, fca, bca] = GetSym(x - 1, y, 2); [newsym, fcb, bca] = GetSym(x, y - 1, 2);
    PutSym(sym, x, y, wallcolr, bc, 1);
    if (fca === wallcolr && fcb === wallcolr) {
      savecorn = savecorn + 1; savcrn[savecorn][1] = x; savcrn[savecorn][2] = y;
    }
  } else if (sym === um || sym === ml || sym === mrt || sym === lm) {
    savecorn = savecorn + 1;
    savcrn[savecorn][1] = x; savcrn[savecorn][2] = y;
    PutSym(sym, x, y, wallcolr, 0, 1); goon = FALSE;
  } else if (sym === 240) {   // stairs
    savecorn = savecorn + 1;
    savcrn[savecorn][1] = x; savcrn[savecorn][2] = y;
    PutSym(250, x, y, fc, 0, -1);
  } else if (sym === pit || sym === trap || sym === gas) {
    PutSym(250, x, y, 8, 0, 1);
  } else if (sym === secretdoor) {
    [newsym, fca, bca] = GetSym(x - 1, y, 2);
    if (fca === wallcolr) newsym = hor; else newsym = ver;
    PutSym(newsym, x, y, wallcolr, 0, 1);
    goon = FALSE;
  } else if (isLetter(sym)) {
    ch = badmovecreat(x - localx, y - localy, nnear, 0, ncre);
    if (ch === 0) {
      sym = 250; fc = 8; bc = 0;
    } else if (idiv(ncre[ch][8], 1000) === wallcolr) {
      goon = FALSE; savecorn = savecorn + 1;
      savcrn[savecorn][1] = x; savcrn[savecorn][2] = y;
      sym = imod(ncre[ch][8], 1000); fc = idiv(ncre[ch][8], 1000); bc = 0;
      if (sym === secretdoor) {
        [newsym, fca, bca] = GetSym(x - 1, y, 2);
        if (fca === wallcolr) newsym = hor; else newsym = ver;
      }
    }
    PutSym(sym, x, y, fc, bc, 1); PutSym(sym, x, y, fc, bc, 2);
  } else {
    PutSym(sym, x, y, fc, bc, 1);
  }

  if (goon) {
    for (let ig = -1; ig <= 1; ig++) {
      for (let jg = -1; jg <= 1; jg++) {
        if (ig | jg) {   // foll
          [sym, fc, bc] = GetSym(x + ig, y + jg, 1);
          if (sym === 32 || sym === 240 || fc === wallcolr) DotIt(x + ig, y + jg);
        }
      }
    }
  }
}

// Draws a room behind the door at (xdoor, ydoor) and, recursively, the
// rooms behind its doors.  Returns [xdoor, ydoor, dir].
function DrawRoom(xdoor, ydoor, dir, doorsym, small) {
  let xmax = 0, ymax = 0, cas = 0, xmaxx = 0, ymaxx = 0, x = 0, y = 0, d = 0, amax = 0, a = 0;
  let xl = 0, xr = 0, yb = 0, yt = 0, xd = 0, xm = 0, yd = 0, ym = 0, ndoors = 0, dx = 0, dy = 0;
  let dsym = 0, sym = 0, fc = 0, bc = 0, conti = FALSE, huh = FALSE, zzz = 0, aaa = 0;
  if (small) {
    xmax = 2; ymax = 2;
  } else {
    xmax = cint(3 + (rnd() + 0.4) * (rnd() + 0.2) * (rwall - lwall) / 3);
    ymax = cint(3 + (rnd() + 0.4) * (rnd() + 0.2) * (bwall - twall) / 3);
    cas = castle; if (castle === 6) cas = imod(Math.abs(castlelevel), 5) + 1;
    switch (cas) {
      case 1: xmaxx = 8; ymaxx = 2; if (cRoll(4) === 1) { const t = xmaxx; xmaxx = ymaxx; ymaxx = t; } break;
      case 2: xmaxx = 7; ymaxx = 5; break;
      case 3: case 5: xmaxx = 6; ymaxx = 4; break;
      case 4: xmaxx = 8; ymaxx = 5; break;
      default: xmaxx = 1 + cRoll(cRoll(8)); ymaxx = 1 + cRoll(cRoll(6));
    }
    if (xmax > xmaxx) xmax = xmaxx;
    if (ymax > ymaxx) ymax = ymaxx;
  }
  x = xdoor; y = ydoor;
  switch (dir) {
    case 1:
      xl = xdoor; d = Walld(x, y, 1, 0, xmax);
      for (let i = 1; i <= d - 1; i++) {
        scratch[i + 30] = y + Walld(x + i, y, 0, 1, cint(ymax / 2));
        for (let j = 1; j <= i - 1; j++) if (scratch[i + 30] > scratch[j + 30]) scratch[i + 30] = scratch[j + 30];
        scratch[i + 20] = y - Walld(x + i, y, 0, -1, cint(ymax / 2));
        for (let j = 1; j <= i - 1; j++) if (scratch[i + 20] < scratch[j + 20]) scratch[i + 20] = scratch[j + 20];
      }
      amax = 0;
      for (let i = 1; i <= d - 1; i++) {
        a = scratch[i + 30] - scratch[i + 20] - 1;
        if (a >= amax) { amax = a; xr = xdoor + i + 1; yb = scratch[i + 30]; yt = scratch[i + 20]; }
      }
      break;
    case 2:
      xr = xdoor; d = Walld(x, y, -1, 0, xmax);
      for (let i = 1; i <= d - 1; i++) {
        scratch[i + 30] = y + Walld(x - i, y, 0, 1, cint(ymax / 2));
        for (let j = 1; j <= i - 1; j++) if (scratch[i + 30] > scratch[j + 30]) scratch[i + 30] = scratch[j + 30];
        scratch[i + 20] = y - Walld(x - i, y, 0, -1, cint(ymax / 2));
        for (let j = 1; j <= i - 1; j++) {
          if (scratch[i + 20] < scratch[j + 20]) scratch[i + 20] = scratch[j + 20];
        }
      }
      amax = 0;
      for (let i = 1; i <= d - 1; i++) {
        a = scratch[i + 30] - scratch[i + 20] - 1;
        if (a >= amax) { amax = a; xl = xdoor - i - 1; yb = scratch[i + 30]; yt = scratch[i + 20]; }
      }
      break;
    case 3:
      yb = ydoor; d = Walld(x, y, 0, -1, ymax);
      for (let i = 1; i <= d - 1; i++) {
        scratch[i + 10] = x + Walld(x, y - i, 1, 0, cint(xmax / 2));
        for (let j = 1; j <= i - 1; j++) if (scratch[i + 10] > scratch[j + 10]) scratch[i + 10] = scratch[j + 10];
        scratch[i] = x - Walld(x, y - i, -1, 0, cint(xmax / 2));
        for (let j = 1; j <= i - 1; j++) {
          if (scratch[i] < scratch[j]) scratch[i] = scratch[j];
        }
      }
      amax = 0;
      for (let i = 1; i <= d - 1; i++) {
        a = scratch[i + 10] - scratch[i] - 1;
        if (a >= amax) { amax = a; yt = ydoor - i - 1; xr = scratch[i + 10]; xl = scratch[i]; }
      }
      break;
    case 4:
      yt = ydoor; d = Walld(x, y, 0, 1, ymax);
      for (let i = 1; i <= d - 1; i++) {
        scratch[i + 10] = x + Walld(x, y + i, 1, 0, cint(xmax / 2));
        for (let j = 1; j <= i - 1; j++) if (scratch[i + 10] > scratch[j + 10]) scratch[i + 10] = scratch[j + 10];
        scratch[i] = x - Walld(x, y + i, -1, 0, cint(xmax / 2));
        for (let j = 1; j <= i - 1; j++) if (scratch[i] < scratch[j]) scratch[i] = scratch[j];
      }
      amax = 0;
      for (let i = 1; i <= d - 1; i++) {
        a = scratch[i + 10] - scratch[i] - 1;
        if (a >= amax) { amax = a; yb = ydoor + i + 1; xr = scratch[i + 10]; xl = scratch[i]; }
      }
      break;
  }
  if (xl === lwall + 1) xl = lwall;
  if (xr === rwall - 1) xr = rwall;
  if (yt === twall + 1) yt = twall;
  if (yb === bwall - 1) yb = bwall;
  xd = xr - xl - xmax;
  if (xd > 1) {
    xm = cRoll(xd - 1); xr = xr - xm; xl = xl + xd - xm;
    if (xr < xdoor + 1) { xl = xl + xdoor - xr + 1; xr = xdoor + 1; }
    if (xl > xdoor - 1) { xr = xr - xdoor + xl - 1; xl = xdoor - 1; }
  }
  yd = yb - yt - ymax;
  if (yd > 1) {
    ym = cRoll(yd - 1); yb = yb - ym; yt = yt + yd - ym;
    if (yb < ydoor + 1) { yt = yt + ydoor - yb + 1; yb = ydoor + 1; }
    if (yt > ydoor - 1) { yb = yb - ydoor + yt - 1; yt = ydoor - 1; }
  }
  if ((xr - xl) < 2 || (yb - yt) < 2) {
    PutSym(doorsym, xdoor, ydoor, wallcolr, 0, 2); return [xdoor, ydoor, dir];   // nxd2
  }
  dots = dots + roomit(xr, xl, yb, yt);
  ndoors = cint((xr - xl + yb - yt) / 15 + 2);
  for (let n = 1; n <= ndoors; n++) {   // (nxd: next n)
    dir = cRoll(4); dx = 0; dy = 0;
    switch (dir) {
      case 1: xdoor = xr; ydoor = cRoll(yb - yt - 1) + yt; dx = 1; break;
      case 2: xdoor = xl; ydoor = cRoll(yb - yt - 1) + yt; dx = -1; break;
      case 3: ydoor = yt; xdoor = cRoll(xr - xl - 1) + xl; dy = -1; break;
      case 4: ydoor = yb; xdoor = cRoll(xr - xl - 1) + xl; dy = 1; break;
    }
    if (xdoor <= lwall || xdoor >= rwall || ydoor <= twall || ydoor >= bwall) continue;
    [dsym, fc, bc] = GetSym(xdoor, ydoor, 2);
    if (dsym !== hor && dsym !== ver) continue;   // 32, cen, lockeddoor, secretdoor
    [sym, fc, bc] = GetSym(xdoor + dx, ydoor + dy, 2);
    conti = TRUE;
    if (sym === 32) {
      // nothing
    } else if (sym === 250) {
      conti = FALSE;
      huh = Doored(xdoor, ydoor, xr, xl, yb, yt, dir, huh);
      if (huh) continue;
    } else {
      continue;
    }
    sym = cen; zzz = cRoll(100); aaa = 6 * Math.abs(castlelevel) + 2 * lvl;
    if (aaa > 70) aaa = 70;
    if (zzz < aaa) sym = lockeddoor; else if (zzz < aaa * 1.3) sym = secretdoor;
    PutSym(sym, xdoor, ydoor, wallcolr, 0, 2);
    if (conti) [xdoor, ydoor, dir] = DrawRoom(xdoor, ydoor, dir, dsym, small);   // recursion, draw dungeon
  }
  return [xdoor, ydoor, dir];
}

async function Drop() {
  let i = 0, th = 0, rmgdy = TRUE;
  ljnk(7, 1, 25, 1);
  rdr: {
    i = 0; i = await SelectGoody(i, 7, FALSE);
    if (i === 0) { didstuff = FALSE; ClearMess(); break rdr; }
    if (i === -10) { await Help(8); await DisplayCharacter(); return; }
    if (berconfuse) i = cRoll(ngoody);

    th = Math.abs(goody[i][1]);
    fatadd = 0.3; rmgdy = TRUE;
    switch (th) {
      case 1: case 2:   // spam, beefa
        goody[i][3] = goody[i][3] - 1;
        if (goody[i][3] > 0) rmgdy = FALSE;
        break;
      case 4:
        if (goody[i][1] < 0) {
          ClearMess();
          ljnk(7, 26, 37, 2); if (berconfuse === 0) didstuff = FALSE;
          break rdr;
        }
        break;
      case 5: case 7: case 8: case 9:
        if (goody[i][1] < 0) {
          if (!(th === 8 && goody[i][11] === 8)) {
            ClearMess();
            ljnk(234, 41, 28, 2); if (berconfuse === 0) didstuff = FALSE;
            break rdr;
          }
        }
        break;
    }
    i = AddToDrop(i); if (rmgdy) RemoveGoody(i, FALSE);
  }
  fatig = Fatigu(); SetCombatStats(); await DisplayCharacter();   // rdr
  l1 = ''; l3 = ''; PrintMessage(7, 0);
}

async function Eat() {
  let i = 0, res1 = 0, res2 = 0, a = 0, b = 0, c = 0, rd1 = TRUE;
  eatit: for (;;) {
    ljnk(8, 1, 24, 1); i = 0; i = await SelectGoody(i, 7, FALSE);
    if (i === 0) { didstuff = FALSE; ClearMess(); rd1 = FALSE; break; }
    if (i === -10) { await Help(3); await DisplayCharacter(); return; }
    ClearMess();
    if ((sick & qb(cRoll(2) === 1)) !== 0) { ljnk(313, 1, 22, 2); break; }
    if (berconfuse) i = cRoll(ngoody);
    switch (Math.abs(goody[i][1])) {
      case 6:
        i = await EatBerry(i); hunger = hunger - 350;
        knownb[goody[Math.abs(i)][3]] = TRUE; RemoveGoody(Math.abs(i), FALSE);
        if (i < 0) Scatter(0);
        break;
      case 1: case 2:
        res1 = rolldice(500, 6, 4) + 500;
        res2 = 600 - rolldice(800, 2, 1);
        switch (cRoll(6)) {
          case 1: case 2:
            Ljnkbig(9, 1, 5, 0, 0, 0, gdy[i], 1, 2);
            a = 9; b = 5; c = 22;
            break;
          case 3: a = 9; b = 27; c = 18; res1 = cint(res1 * 1.5); res2 = cint(res2 / 1.5); break;
          case 4: case 5: a = 9; b = 45; c = 11; res1 = cint(res1 * 1.2); res2 = cint(res2 / 1.2); break;
          default:
            a = 9; b = 56; c = 12; sick = sick + cRoll(3);
            res1 = cint(res1 / 1.3); res2 = cint(res2 * 1.3);
        }
        Ljnkbig(a, b, c, 0, 0, 0, rtrim$(l2), 0, 2);
        if (Math.abs(goody[i][1]) === 1) {
          hunger = hunger - res1;
        } else if (hunger > res2) {
          hunger = res2;
        }
        l1 = ''; PrintMessage(7, 0);
        if (hunger < -2000) { hits = -hitmax - 999; hunger = -1500; st1 = jnk$(288, 49, 10); await Dead(0); }
        goody[i][3] = goody[i][3] - 1;
        if (goody[i][3] < 1) RemoveGoody(i, FALSE);
        if (hunger < 0) {
          if (hittox > 0) { hitmax = hitmax + 1; hits = hits + 1; hittox = hittox - 1; }
          if ((qb(strtox > 0) & qb(cRoll(8) === 1)) !== 0) { str = str + 1; strtox = strtox - 1; }
          if ((qb(dextox > 0) & qb(cRoll(8) === 1)) !== 0) { dex = dex + 1; dextox = dextox - 1; }
          if ((qb(contox > 0) & qb(cRoll(5) === 1)) !== 0) { con = con + 1; contox = contox - 1; }
        }
        break;
      case 7:
        if (goody[i][11] === 22) {
          hunger = -200; ljnk(288, 1, 48, 2); RemoveGoody(i, FALSE);
          PrintMessage(1, 0); tapeworm = FALSE;
        } else {
          ljnk(8, 25, 40, 2); await MessPause(2, 0);
          if (berconfuse === 0) continue eatit; else { rd1 = FALSE; break eatit; }
        }
        break;
      case 9:   // specials
        if (goody[i][3] === 6) {   // roastbeast
          hunger = -2000; ljnk(355, 58, 11, 2); RemoveGoody(i, FALSE);
        } else {
          ljnk(8, 25, 40, 2); await MessPause(2, 0);
          if (berconfuse === 0) continue eatit; else { rd1 = FALSE; break eatit; }
        }
        break;
      default:
        ljnk(8, 25, 40, 2); await MessPause(2, 0);
        if (berconfuse === 0) continue eatit; else { rd1 = FALSE; break eatit; }
    }
    break;
  }
  if (rd1) await MessPause(7, 0);
  await DisplayCharacter(); PrintMessage(7, 0);   // rd2
}

// The effect of eating berry i.  Returns i (negated when the berry makes
// the character drop things, for Scatter).
async function EatBerry(i) {
  let d = 0, v = 0, aa = 0, bb = 0, cc = 0, dd = 0, ee = 0, ff = 0, dam = 0, ffkill = FALSE;
  let typ = 0, exper = 0, resl = 0, res = 0, newlev = 0, b$ = '', a = 0, b = 0, c = 0;
  let rnds = 0, del = 0, sp = 0, n = 0, num = 0;
  d = goody[i][4]; v = goody[i][5]; ClearMess();
  l2 = 'The ' + gdy[i];
  cc = 0; ff = 0;
  ebe: {
    switch (goody[i][3]) {
      case 0:   // green one
        bergreen = bergreen + idiv(d ** 5, 10) * (1 + v ** 2);
        aa = 295; bb = 51; cc = 17;
        break;
      case 1:
        dam = rolldice(7 + idiv(lvl, 2) + 3 * v ** 2, d + v, d + v);
        [dam, ffkill] = ffEffect(dam, ffkill); hits = hits - dam; tapeworm = FALSE;
        Ljnkbig(10, 4, 21, 0, 0, 0, rtrim$(l2) + bl, 0, 2);
        if (ffkill) {
          l1 = l2; Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
        }
        if (hits < 0) { st1 = jnk$(10, 26, 25); await Dead(0); break ebe; }
        break;
      case 2:
        dam = rolldice(5 + idiv(lvl, 2) + 4 * v, d + v * 2, d + v);
        if (rr > 1) dam = idiv(dam * 10, rr) + 1; else dam = cint(dam * 10);
        [dam, ffkill] = ffEffect(dam, ffkill); hits = hits - dam; tapeworm = FALSE;
        Ljnkbig(11, 1, 26, 0, 0, 0, rtrim$(l2) + bl, 0, 2);
        if (ffkill) {
          l1 = l2; Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
        }
        if (hits < 0) {
          st1 = jnk$(10, 26, 8) + bl + jnk$(10, 51, 10) + jnk$(10, 46, 5); await Dead(0);
          break ebe;
        }
        break;
      case 3: hunger = -(200 * d + 300); aa = 12; bb = 1; cc = 12; break;
      case 4:
        fatigue = -50 * (v ** 2 + 1); aa = 12; bb = 13; cc = 13;
        berfresh = berfresh + 50 + rolldice(25 * d, 3, 2);
        if (zippy < 0) zippy = 0;
        break;
      case 5:
        typ = cRoll(3); dam = rolldice(2 + d, 4 + 4 * v, 4 + 4 * v);
        if (con > 1) dam = cint(dam * 10 / (con * typ) + 1); else dam = idiv(dam * 10, typ);
        hits = hits - dam;
        sick = sick + rolldice((d + 2) * (v + 1), 4, 4); tapeworm = FALSE;
        switch (typ) {
          case 1:
            if (cRoll(20) <= (d + v * 3)) { dex = dex - 1 - v; dextox = dextox + 1 + v; }
            break;
          case 2:
            if (cRoll(8) <= (d + v * 3)) { str = str - 1 - v; strtox = strtox + 1 + v; }
            break;
          case 3:
            if (cRoll(8) <= (d + v * 3)) {
              con = con - 1 - v; contox = contox + 1 + v; hits = hits - 2 * lvl;
              hitmax = hitmax - idiv(d * lvl, 3); hittox = hittox + idiv(d * lvl, 3);
            }
            break;
        }
        if (hits < 0) { st1 = jnk$(12, 26, 21); await Dead(0); break ebe; }
        aa = 11; bb = 27; cc = 19;
        break;
      case 6:
        sick = 0;
        if (hits >= hitmax) {
          hits = hitmax + 1 + v * 2; hitmax = hits;
        } else {
          hits = hits + rolldice(lvl + 3, 2 + d + v * 2, 2 + d + v * 2);
          if (hits > hitmax) hits = hitmax;
        }
        if (hittox > 0) { hittox = hittox - 1 - v * 2; hitmax = hitmax + 1 - v * 2; hits = hits + 1 - v * 2; }
        if (hittox < 0) { hitmax = hitmax + hittox; hits = hits + hittox; hittox = 0; }
        spore = spore - cRoll(2); if (spore < 0) spore = 0;
        Ljnkbig(11, 27, 15, 11, 51, 6, rtrim$(l2) + bl, 0, 2);
        break;
      case 7:
        sick = 0;
        if (hits >= hitmax) {
          hits = hitmax + 3 + 4 * v; hitmax = hits;
        } else {
          hits = hits + rolldice(lvl + 2, 6 + d * 3 + v * 8, 6 + d * 3 + v * 8);
          if (hits > hitmax) hits = hitmax;
        }
        if (hittox > 0) { hittox = hittox - 3 - v * 4; hitmax = hitmax + 3 + v * 4; hits = hits + 3 + v * 4; }
        if (hittox < 0) { hitmax = hitmax + hittox; hits = hits + hittox; hittox = 0; }
        spore = spore - rolldice(2, 3, 3); if (spore < 0) spore = 0;
        Ljnkbig(11, 27, 15, 11, 46, 11, rtrim$(l2) + bl, 0, 2);
        break;
      case 8:
        if (expr > 20000) exper = 20000; else exper = cint(Math.abs(expr));
        resl = rolldice(exper / 10 + 5, 4, 4);
        res = clng((v + 1) * resl * (d - 3.5));
        expr = expr + res; l1 = l2; [newlev, b$] = await Level(newlev, b$); l2 = b$;
        if (d > 3) {
          Ljnkbig(13, 1, 23, 0, 0, 0, rtrim$(l1) + bl, 0, 1);
          if (newlev) {
            a = 0;
            switch (cRoll(6)) {
              case 1: str = str + 1; b = 1; c = 8; break;
              case 2: dex = dex + 1; b = 9; c = 9; break;
              case 3:
                con = con + 1; b = 18; c = 12;
                hitmax = hitmax + 1; hits = hits + 1;
                break;
              case 4: rr = rr + 1; b = 30; c = 20; break;
              case 5: mr = mr + 1; a = -1; b = 1; c = 17; break;
              default: intl = intl + 1; a = -1; b = 18; c = 12;
            }
            l2 = jnk$(34, 1, 5) + jnk$(a, b, c) + jnk$(34, 5, 9);
            await MessPause(4, 0); ClearMess();
            Ljnkbig(14, 26, 17, 0, 0, 0, str$(lvl), 1, 2);
          }
        } else {
          l1 = rtrim$(l1) + bl + jnk$(13, 1, 10) + 'less' + jnk$(13, 15, 9);
          if (newlev) {
            await MessPause(4, 0); ClearMess();
            Ljnkbig(14, 26, 17, 0, 0, 0, str$(lvl), 1, 2);
          }
        }
        await DisplayCharacter();
        break;
      case 9: case 10: case 11: case 12: case 13: case 14: {
        rnds = rolldice(100, 5 + v * 4, 5 + v * 4);
        if (rnds > 999) rnds = 999;
        const r = cRoll(100);
        if (r === 1) del = -12 * (v + 1);
        else if (inRange(r, 2, 4)) del = -8 * (v + 1);
        else if (inRange(r, 5, 10)) del = -4 * (v + 1);
        else if (inRange(r, 11, 62)) del = 4 * (v + 1);
        else if (inRange(r, 63, 95)) del = 8 * (v + 1);
        else del = 12 * (v + 1);
        if (d < 3) del = -del;
        if (del > 31) del = 31; else if (del < -32) del = -32;
        if (del < 0) st1 = jnk$(13, 24, 6); else st1 = jnk$(13, 30, 6);
        l1 = l2; l2 = st1 + bl + jnk$(10, 16, 5);
        if (d === 1 || d === 6) l2 = jnk$(121, 52, 12) + l2;
        switch (goody[i][3]) {
          case 9:
            str = str - int(berstr / 1000); berstr = 0;
            if (strtox > 0) { str = str + strtox; strtox = 0; }
            if (d === 6 || d === 1) {
              str = str + del / 4;
            } else {
              str = str + del; berstr = 1000 * del + rnds;
            }
            aa = 0; bb = 1; cc = 8;
            break;
          case 10:
            dex = dex - int(berdex / 1000); berdex = 0;
            if (dextox > 0) { dex = dex + dextox; dextox = 0; }
            if (d === 6 || d === 1) {
              dex = dex + del / 4;
            } else {
              dex = dex + del; berdex = 1000 * del + rnds;
            }
            aa = 0; bb = 9; cc = 9;
            break;
          case 11:
            con = con - int(bercon / 1000); bercon = 0;
            if (contox > 0) { con = con + contox; contox = 0; }
            if (d === 6 || d === 1) {
              con = con + del / 4;
              hits = hits + idiv((del / 4) * lvl, 3);
              hitmax = hitmax + idiv((del / 4) * lvl, 3);
            } else {
              con = con + del; bercon = 1000 * del + rnds;
            }
            aa = 0; bb = 18; cc = 12;
            break;
          case 12:
            rr = rr - int(berrr / 1000); berrr = 0;
            if (d === 6 || d === 1) {
              rr = rr + del / 4;
            } else {
              rr = rr + del; berrr = 1000 * del + rnds;
            }
            aa = 0; bb = 30; cc = 20;
            break;
          case 13:
            mr = mr - int(bermr / 1000); bermr = 0;
            if (d === 6 || d === 1) {
              mr = mr + del / 4;
            } else {
              mr = mr + del; bermr = 1000 * del + rnds;
            }
            aa = -1; bb = 1; cc = 17;
            break;
          case 14:
            intl = intl - int(berintl / 1000); berintl = 0;
            if (d === 6 || d === 1) {
              intl = intl + del / 4;
            } else {
              intl = intl + del; berintl = 1000 * del + rnds;
            }
            aa = -1; bb = 18; cc = 12;
            break;
        }
        break;
      }
      case 15:
        if (d < 3) sp = -1; else sp = 2;
        rnds = rolldice(Math.abs(d - 3.5) * 6, 5 + v * 6, 5 + v * 6);
        zippy = zippy + sp * rnds;
        if (sp === 2) {
          aa = 14; bb = 1; cc = 13;
        } else {
          l2 = rtrim$(l2) + bl + jnk$(14, 14, 6) + 'you' + jnk$(14, 19, 5);
        }
        break;
      case 16:
        if ((qb(cRoll(100) > berac * 29) | qb(cRoll(10) < (6 * v + d - berac)) | qb(cRoll(10) === 1)) !== 0) {
          berac = berac + 1; SetCombatStats(); aa = -1; bb = 44; cc = 18;
        } else {
          aa = -1; bb = 30; cc = 14;
        }
        break;
      case 17:
        rnds = rolldice(6 + d * 6, 4 + v * 5, 4 + v * 5);
        berconfuse = berconfuse + rnds;
        Ljnkbig(13, 1, 10, 13, 40, 5, rtrim$(l2) + bl, 0, 2);
        if (brandy === 0) str = str + 1;
        brandy = brandy + 600;
        break;
      case 18:
        rnds = rolldice(16 + d * 8, 5 + v * 8, 5 + v * 8);
        berscience = berscience + rnds;
        Ljnkbig(13, 1, 10, 13, 45, 6, rtrim$(l2) + bl, 0, 2);
        break;
      case 19:
        switch (d) {
          case 1: a = 16; b = 1; c = 34; break;
          case 2: a = 14; b = 44; c = 25; break;
          case 3: a = 15; b = 16; c = 22; break;
          case 4: a = 15; b = 38; c = 5; break;
          case 5: a = 15; b = 1; c = 15; break;
          default:
            a = 16; b = 35; c = 25;
            if (udder) {
              a = 242; b = 37; c = 11; con = con + 1;
              str = str + 1; hitmax = hitmax + 4; hits = hits + 4;
            }
            udder = TRUE;
        }
        Ljnkbig(15, 43, 9, a, b, c, chr$(33), 2, 2);
        break;
      case 20:
        rnds = rolldice(20 * Math.abs(d - 3.5) + 50 * v, 15, 15);
        if (cRoll(5) >= d) {           // quench
          switch (cRoll(2)) {
            case 1:                      // physical
              l1 = l2; Ljnkbig(17, 1, 14, 0, 0, 0, pmutn$, 1, 2);
              if (berpmut === 0) {
                switch (pmut) {
                  case 2: dex = dex - 10; break;
                  case 3: str = str - 10; break;
                  case 4: other2hitc = other2hitc - 1; other2hitr = other2hitr - 2; break;
                  case 5: skinac = skinac - 5; SetCombatStats(); break;
                  case 7:
                    con = con - 10; hits = hits - 2 * lvl;
                    hitmax = hitmax - 2 * lvl;
                    if (hits < 0) { st1 = jnk$(17, 15, 12); await Dead(0); break ebe; }
                    break;
                  case 8: rr = rr - 10; break;
                  case 14: zippy = 0; break;
                  case 17: tentgrab = 0; break;
                }
              }
              pmutturns = pmutturns + rnds; berpmut = pmutturns;
              break;
            default:
              l1 = l2; Ljnkbig(17, 1, 14, 0, 0, 0, mmutn$, 1, 2);
              if (bermmut === 0) {       // mental
                switch (mmut) {
                  case 1:
                    other2hitc = other2hitc - 2; other2hitr = other2hitr - 2;
                    otherdam = otherdam - 4;
                    break;
                  case 2: intl = intl - 10; break;
                  case 3: mr = mr - 10; break;
                  case 7: forcefield = FALSE; break;
                }
              }
              mmutturns = mmutturns + rnds; bermmut = mmutturns;
          }
        } else {                         // heighten
          switch (cRoll(2)) {
            case 1:                      // physical
              l1 = l2; Ljnkbig(417, 43, 15, 0, 0, 0, pmutn$, 1, 2);
              if (berhpmut === 0) {
                switch (pmut) {
                  case 2: dex = dex + 10; break;
                  case 3: str = str + 10; break;
                  case 4: other2hitc = other2hitc + 1; other2hitr = other2hitr + 2; break;
                  case 5: skinac = skinac + 5; break;
                  case 7:
                    con = con + 10; hits = hits + 2 * lvl;
                    hitmax = hitmax + 2 * lvl;
                    break;
                  case 8: rr = rr + 10; break;
                }
              }
              berhpmut = berhpmut + rnds;
              break;
            default:                     // mental
              l1 = l2; Ljnkbig(417, 43, 15, 0, 0, 0, mmutn$, 1, 2);
              if (berhmmut === 0) {
                switch (mmut) {
                  case 1:
                    other2hitc = other2hitc + 2; other2hitr = other2hitr + 2;
                    otherdam = otherdam + 4;
                    break;
                  case 2: intl = intl + 10; break;
                  case 3: mr = mr + 10; break;
                }
              }
              berhmmut = berhmmut + rnds;
          }
        }
        break;
      case 21:
        vpage = 1; screenPages(1); MapLevel(); ljnk(63, 1, 12, 4);
        PrintMessage(7, 0); SetCombatStats(); await DisplayCharacter();
        rnds = rolldice(16 + 8 * d, 6 + v * 6, 6 + v * 6);
        if (berdet === 0) { other2hitc = other2hitc + 2; other2hitr = other2hitr + 2; }
        berdet = berdet + rnds; ljnk(238, 1, 30, 2);
        if (berblind) berblind = 1;
        break;
      case 22:
        rnds = rolldice(9 + d * 8, 6 + 6 * v, 6 + 6 * v);
        berblind = berblind + rnds; if (berdet) berdet = 1;
        aa = 17; bb = 28; cc = 11;
        break;
      case 23:
        rnds = rolldice(6 + 6 * d, 3 + v * 4, 3 + v * 4);
        berhic = berhic + rnds; dd = 17;
        switch (d) {
          case 1: ee = 39; ff = 4; break;
          case 2: ee = 43; ff = 6; break;
          case 3: ee = 49; ff = 5; break;
          case 4: ee = 54; ff = 8; break;
          case 5: ee = 62; ff = 4; break;
          default: dd = 16; ee = 60; ff = 6;
        }
        ber$ = jnk$(dd, ee, ff);
        if (d !== 4) {
          l2 = rtrim$(l2) + ' makes you ' + ber$;
        } else {
          l2 = rtrim$(l2) + ' makes you sneeze';
        }
        break;
      case 24:
        for (let j = 1, jEnd = int((v + 1) * nberry * (d + 6) / 18); j <= jEnd; j++) {
          n = cRoll(nberry); knownb[n] = FALSE;
        }
        for (let k = 1, kEnd = int((v + 1) * (nssd + ntechwep + nstrash) * (d + 6) / 18); k <= kEnd; k++) {
          n = cRoll(nssd + ntechwep + nstrash);
          ssdknown[n] = FALSE;
          for (let j = 1; j <= ngoody; j++) {
            if (Math.abs(goody[j][1]) === 7 && goody[j][11] === n) {
              gdy[j] = jnk$(155, 1, 18); goody[j][10] = FALSE;
            }
          }
          for (let j = 1; j <= npack; j++) {
            if (Math.abs(backpack[j][1]) === 7 && backpack[j][11] === n) {
              bakpak[j] = jnk$(155, 1, 18); backpack[j][10] = FALSE;
            }
          }
          for (let j = 1; j <= nsafe; j++) {
            if (Math.abs(safe[j][1]) === 7 && safe[j][11] === n) {
              saf[j] = jnk$(155, 1, 18); safe[j][10] = FALSE;
            }
          }
        }
        for (let k = 1, kEnd = int((v + 1) * (nlsd + nltrash) * (d + 6) / 18); k <= kEnd; k++) {
          n = cRoll(nlsd + nltrash); lsdknown[n] = FALSE;
          for (let j = 1; j <= ngoody; j++) {
            if (Math.abs(goody[j][1]) === 8 && goody[j][11] === n) {
              gdy[j] = jnk$(155, 19, 17); goody[j][10] = FALSE;
            }
          }
          for (let j = 1; j <= npack; j++) {
            if (Math.abs(backpack[j][1]) === 8 && backpack[j][11] === n) {
              bakpak[j] = jnk$(155, 19, 17); backpack[j][10] = FALSE;
            }
          }
          for (let j = 1; j <= nsafe; j++) {
            if (Math.abs(safe[j][1]) === 8 && safe[j][11] === n) {
              saf[j] = jnk$(155, 19, 17); safe[j][10] = FALSE;
            }
          }
        }
        dd = 35; ee = 59; ff = 6;
        break;
      case 25:
        num = rolldice(6 + 4 * d, 5 + v * 6, 5 + v * 6);
        berscare = berscare + num;
        for (let j = 1; j <= nnear; j++) ncre[j][6] = -Math.abs(ncre[j][6]);
        aa = 87; bb = 53; cc = 16;
        break;
      case 26:
        str = str + strtox; dex = dex + dextox; con = con + contox;
        strtox = 0; dextox = 0; contox = 0; sick = 0; tapeworm = FALSE;
        hitmax = hitmax + hittox; hits = hits + hittox; hittox = 0;
        spore = 0;
        aa = 152; bb = 22; cc = 14;
        if (berconfuse) berconfuse = 1;
        if (berblind > 1) berblind = 1;
        break;
      case 27:
        if (berrambo === 0) {
          str = str + 6 + v; dex = dex + 6 + v; con = con + 6 + v; rr = rr + 6;
          hitmax = hitmax + 12 + 3 * v; hits = hits + 12 + 3 * v;
          intl = intl - 10 - 2 * v; mr = mr - 10 - 2 * v;
          if (berscience > 1) berscience = 1;
        } else {
          intl = intl - 1 - v; mr = mr - 1 - v;
          if (cRoll(10) < 5 * (v + 1)) str = str + 1;
          if (cRoll(10) < 5 * (v + 1)) dex = dex + 1;
          if (cRoll(10) < 5 * (v + 1)) con = con + 1;
          if (cRoll(10) < 5 * (v + 1)) rr = rr + 1;
          hitmax = hitmax + 4 * (v + 1); hits = hits + 4 * (v + 1);
        }
        berrambo = berrambo + rolldice(12 + d * 3, 6 + v * 10, 6 + v * 10);
        dd = 171; ee = 15; ff = 31;
        break;
      case 28:
        rnds = rolldice(6 + d * 6, 5 + v * 5, 3 + v * 5);
        if (mmut === 10 && bermmut === 0) rnds = cint(rnds * 2);
        invisible = invisible + rnds; dd = 318; ee = 16; ff = 49;
        PutSym(1, localx, localy, 8, 0, 1);
        break;
      case 29:
        n = v * 2 + 1;
        teleporting = TRUE; ClearMess(); await Teleport(n); teleporting = FALSE;
        if (rdisp !== 1) DisplayGoodies(FALSE);
        dd = 241; ee = 16; ff = 15;
        break;
      case 30: asleep = TRUE; berhic = 0; sick = 0; dd = 250; ee = 48; ff = 20; break;
      case 31:
        num = rolldice(15 + d * 15, 4 + v * 5, 4 + v * 5);
        berklutz = berklutz + num; klutzdex = dex + 5; dex = -5;
        l2 = rtrim$(l2) + ' makes'; aa = 304; bb = 6; cc = 10;
        if (cRoll(d) === 1) i = -i;    // for scatter
        break;
      case 32:
        berregen = berregen + rolldice(20 + d * 10, 8 + v * 10, 8 + v * 10);
        l2 = rtrim$(l2) + ' makes'; aa = 304; bb = 45; cc = 14;
        break;
      case 33:
        beryum = beryum + rolldice(4 + d * 4, 6 + v * 8, 6 + v * 8);
        MakeCreature(0, 0, TRUE, FALSE);
        for (let j = 1; j <= nnear; j++) ncre[j][11] = ncre[j][11] | 1;
        aa = 309; bb = 1; cc = 11;
        break;
      case 34:
        berff = berff + rolldice(15 + d * 4, 8 + v * 8, 8 + v * 8);
        dd = 404; ee = 1; ff = 36;
        break;
      case 35:
        dam = rolldice(9 + idiv(lvl, 2) + 6 * v, d + v, d + v);
        if (pmut === 12 && berpmut === 0) dam = 0;
        [dam, ffkill] = ffEffect(dam, ffkill); hits = hits - dam; tapeworm = FALSE;
        Ljnkbig(265, 37, 19, 0, 0, 0, rtrim$(l2) + bl, 0, 2);
        if (ffkill) {
          l1 = l2; Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
        }
        if (hits < 0) { st1 = jnk$(266, 1, 20); await Dead(0); break ebe; }
        break;
    }
    if (cc > 0) Ljnkbig(aa, bb, cc, 0, 0, 0, rtrim$(l2) + bl, 0, 2);
    if (ff > 0) ljnk(dd, ee, ff, 2);
  }
  SetCombatStats();   // ebe
  return i;
}

async function EnterCastle() {
  let a = 0, b = 0, c = 0, aa = 0, bb = 0, cc = 0, maxlevel = 0, showlev = 0;
  let dk = 0, olddark = 0, changed = 0;
  for (let i = -10; i <= -1; i++) goodycastle[0][i] = 0;
  for (let i = 1; i <= 10; i++) goodycastle[0][i] = 0;
  nnear = 0; incastle = -1; castlelevel = 0;
  // ndropped set in drawdungeon
  localx = xenter; localy = yenter;
  [dk, olddark, changed] = SetDark(dark, olddark, changed); dark = dk;
  switch (enterdir) {
    case 1: localx = localx + 1; break;
    case 2: localx = localx - 1; break;
    case 3: localy = localy - 1; break;
    default: localy = localy + 1;
  }
  switch (castle) {
    case 0: break;
    case 1: a = 302; b = 25; c = 9; break;
    case 2: a = 140; b = 43; c = 21; break;
    case 3: a = 303; b = 39; c = 11; break;
    case 4: a = 302; b = 48; c = 7; break;
    case 5: a = 302; b = 34; c = 14; break;
    case 6: a = 380; b = 13; c = 34; break;
  }
  l3 = bl;
  if (castle === 6) {
    l1 = jnk$(380, 1, 12) + chr$(34) + jnk$(a, b, c) + chr$(34);
  } else {
    if (c > 0) l1 = jnk$(302, 1, 24) + chr$(34) + jnk$(a, b, c) + chr$(34); else l1 = bl;
  }
  maxlevel = 0; while (xstairs[maxlevel] > 1) maxlevel = maxlevel + 1;
  maxlevel = maxlevel + 1;
  if ((cRoll(10) < 3) && (castle === 0)) {
    showlev = maxlevel + cRoll(3) - cRoll(3);
  } else {
    showlev = maxlevel;
  }
  if (showlev < 1) showlev = 1;
  if (showlev === 1) { b = 50; c = 11; } else { b = 26; c = 13; }
  if (castle === 0) { aa = 304; bb = 59; cc = 10; } else { aa = 303; bb = 1; cc = 11; }
  Ljnkbig(aa, bb, cc, 303, 12, 14, str$(showlev) + jnk$(303, b, c), 2, 2);
  await MessPause(15, 0);
}

// Try to work out what an item is.
async function Figure() {
  let pze = TRUE, i = 0, figured = FALSE, th = 0, j$ = '', a = 0, b = 0, c = 0;
  let chan = 0, zip = 0, zip2 = 0, rls = 0, brkch = 0, nobrk = FALSE, typ = 0, broke = FALSE;
  let dam = 0, ffkill = FALSE, b$ = '', c$ = '', devnam$ = '';
  if (ngoody === 0) return;
  if ((not(agin & keysave2) & rside) !== 0) DisplayGoodies(FALSE);
  ClearMess();
  pze = TRUE;
  ljnk(18, 1, 31, 1);
  rdf: {
    if ((agin & keysave2) !== 0) {
      i = keysave1;
    } else {
      i = 0; i = await SelectGoody(i, 7, FALSE); keysave1 = i;
    }
    if (i === 0) { pze = FALSE; didstuff = FALSE; ClearMess(); break rdf; }
    if (i === -10) { await Help(7); await DisplayCharacter(); return; }
    if (berconfuse) i = cRoll(ngoody);
    figured = TRUE; keysave2 = FALSE;
    th = Math.abs(goody[i][1]); l1 = '';
    switch (th) {
      case 1:   // spam
        ljnk(19, 1, 51, 1); break;
      case 2:   // Beef
        ljnk(20, 1, 39, 1); break;
      case 3:   // wep
        if (goody[i][3] > 1) j$ = 's'; else j$ = bl;
        if (goody[i][8] <= nwep) { a = 18; b = 32; c = 24; } else { a = 159; b = 20; c = 15; }
        Ljnkbig(a, b, c, 0, 0, 0, rtrim$(gdy[i]) + j$, 1, 1);
        break;
      case 4:   // armor
        Ljnkbig(20, 40, 14, 20, 53, 15, rtrim$(gdy[i]), 1, 1); break;
      case 5:   // shield
        Ljnkbig(21, 1, 38, 0, 0, 0, right$(rtrim$(gdy[i]), 6), 0, 1); break;
      case 6:   // berry
        ljnk(22, 1, 52, 1); break;
      case 9:   // specials
        ljnk(347, 1, 48, 1); break;
      case 7: case 8: {   // ssd, lsd
        if (goody[i][10]) {
          Ljnkbig(23, 1, 31, 0, 0, 0, rtrim$(gdy[i]), 1, 1);
          if (berconfuse === 0) didstuff = FALSE;
          keysave2 = TRUE; break rdf;
        }
        chan = cint(goody[i][4] * intl);
        if (berblind) chan = idiv(chan, 10);
        zip = 2000; rls = 1;
        if (mmut === 2 && bermmut === 0) rls = rls + (2 - 2 * qb(berhmmut > 0));
        if (berscience) rls = rls + 4;
        for (let lll = 1; lll <= rls; lll++) {
          zip2 = cRoll(1000); if (zip > zip2) zip = zip2;
        }
        if (zip > chan * 2) {
          keysave2 = TRUE;
          ljnk(21, 39, 29, 1); figured = FALSE; pze = FALSE;
          if (intl > 0) brkch = cint(100 / intl); else brkch = cint(100 * (1 - intl));
          if (berklutz) brkch = brkch + 100;
          if (berblind) brkch = brkch + 50;
          if (berscience) brkch = cint(brkch / 10);
          if (cRoll(1000) < brkch) {
            for (let mmm = 1; mmm <= ngoody; mmm++) {
              if (Math.abs(goody[mmm][1]) === 7 && goody[mmm][11] === 16 && goody[mmm][3] > 0) {
                ljnk(87, 1, 13, 1); ljnk(123, 13, 33, 2);
                pze = TRUE; nobrk = TRUE;
              }
            }
            if (not(nobrk)) {
              ljnk(87, 1, 13, 1); RemoveGoody(i, FALSE); pze = TRUE;
              keysave2 = FALSE;
            }
          }
        } else if (zip < chan) {
          keysave2 = FALSE;
          typ = goody[i][11]; broke = FALSE;
          if (th === 7 && typ > nssd && typ <= nssd + ntechwep) {
            if (intl > 0) brkch = cint(500 / intl); else brkch = 500;
            if (berklutz) brkch = brkch + 400;
            if (berblind) brkch = brkch + 200;
            if (berscience) brkch = cint(brkch / 10);
            if (th === 7 && typ === 19) brkch = 0;
            if (cRoll(1000) < brkch) {
              ljnk(51, 43, 19, 1);
              dam = rolldice(goody[i][6], goody[i][5], goody[i][5]);
              dam = idiv(dam * lvl, lvl + 5);
              [dam, ffkill] = ffEffect(dam, ffkill);
              if (ffkill) Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
              hits = hits - dam; ShowHits(); await MessPause(12, 0);
              switch (typ - nssd) {   // special wep effects
                case 9: case ngrenade + 21: asleep = TRUE; break;
                case 12: case ngrenade + 20: inglue = TRUE; break;
                case ngrenade + 23: berhic = berhic + rolldice(6, 6, 4); ber$ = 'aaaChoo!'; break;
              }
              if (hits < 0) {
                b$ = ltrim$(ssdnm$(typ));
                switch (ucase$(left$(b$, 1))) {
                  case 'A': case 'E': case 'I': case 'O': case 'U': c$ = 'an '; break;
                  default: c$ = 'a ';
                }
                st1 = c$ + b$; await Dead(0);
              }
              if (typ <= nssd + ngrenade) broke = TRUE;
            }
          }
          if (th === 8) {
            devnam$ = lsdnm$(typ); lsdknown[typ] = TRUE;
          } else {
            devnam$ = ssdnm$(typ); ssdknown[typ] = TRUE;
            if (goody[i][11] === 19 && castle === 4) devnam$ = 'ID Card';
          }
          for (let j = 1; j <= ngoody; j++) {
            if (goody[j][11] === typ && Math.abs(goody[j][1]) === th) {
              gdy[j] = devnam$; goody[j][10] = TRUE;
              if (th === 7) {
                if (goody[j][11] === nssd + ntechwep + 13) {
                  gdy[j] = CreatNam$(goody[j][5], 0) + bl + gdy[j];
                }
              }
            }
          }
          for (let j = 1; j <= npack; j++) {
            if (backpack[j][11] === typ && Math.abs(backpack[j][1]) === th) {
              bakpak[j] = devnam$; backpack[j][10] = TRUE;
              if (th === 7) {
                if (backpack[j][11] === nssd + ntechwep + 13) {
                  bakpak[j] = CreatNam$(goody[j][5], 0) + bl + bakpak[j];   // (sic) goody
                }
              }
            }
          }
          for (let j = 1; j <= nsafe; j++) {
            if (safe[j][11] === typ && Math.abs(safe[j][1]) === th) {
              saf[j] = devnam$; safe[j][10] = TRUE;
              if (th === 7) {
                if (safe[j][11] === nssd + ntechwep + 13) {
                  saf[j] = CreatNam$(goody[j][5], 0) + bl + saf[j];   // (sic) goody
                }
              }
            }
          }
          Ljnkbig(24, 1, 31, 0, 0, 0, gdy[i], 1, 2);
          if (broke) RemoveGoody(i, FALSE);
        } else {
          keysave2 = TRUE;
          goody[i][4] = goody[i][4] * 2;
          ljnk(24, 32, 28, 1);
          figured = FALSE; pze = FALSE;
        }
        break;
      }
    }
  }
  if (not(didstuff)) keysave2 = FALSE;   // rdf
  if (broke) keysave2 = FALSE;
  if (not(agin & keysave2)) await DisplayCharacter();
  l3 = bl; fatadd = 0.5;
  if (pze) await MessPause(7, 0); else PrintMessage(7, 0);
}

function LeaveCastle() {
  let ndro = 0;
  if (castle > 0) ncastle = ncastle + 1; else nruins = nruins + 1;
  castle = 0; incastle = 0; castlelevel = 0; nnear = 0;
  ndro = 0;
  for (let i = 1, iEnd = ndropped; i <= iEnd; i++) {
    if (Math.abs(drgoody[i][1]) === 8 && drgoody[i][11] === 8) {
      if (drgoody[i][13] < 0) {   // safe
        for (let j = 1; j <= 16; j++) drgoody[1][j] = drgoody[i][j];
        drgoody[1][13] = Math.abs(drgoody[1][13]);   // reset mainx so will display
        drgdy[1] = drgdy[i]; ndro = 1; break;
      } else {
        ShiftDropped(i);
      }
    }
  }
  ndropped = ndro;

  for (let i = 1; i <= ngoody; i++) {
    if (left$(gdy[i], 5) === 'Trump') {
      gdy[i] = right$(gdy[i], len(gdy[i]) - 6);
    }
  }
  for (let i = 1; i <= npack; i++) {
    if (left$(bakpak[i], 5) === 'Trump') {
      bakpak[i] = right$(bakpak[i], len(bakpak[i]) - 6);
    }
  }
  for (let i = 1; i <= nsafe; i++) {
    if (left$(saf[i], 5) === 'Trump') {
      saf[i] = right$(saf[i], len(saf[i]) - 6);
    }
  }

  localx = xenterscr; localy = yenterscr;
  switch (enterdir) {
    case 1: localx = localx - 1; break;
    case 2: localx = localx + 1; break;
    case 3: localy = localy + 1; break;
    default: localy = localy - 1;
  }

  for (let i = 2; i <= 51; i++) {
    for (let j = 2; j <= 21; j++) {
      // don't lose visit info:  if visited previously, leave as 512
      goodythere[i][j] = goodythere[i][j] & 512;
    }
  }

  for (let i = mainx - 1; i <= mainx + 1; i++) {
    for (let j = mainy - 1; j <= mainy + 1; j++) {
      // don't make new critters in closest squares
      if (i > 1 && i < 52 && j > 1 && j < 22) {
        goodythere[i][j] = goodythere[i][j] | 1024;
      }
    }
  }

  goodycastle[0][0] = 0;

  screenPages(2, vpage); clpage2(); screenPages(vpage);
}

// Disarm a trap, fill a pit, clear gas or rubble next to the character.
async function Remove() {
  let num = 0, dx = 0, dy = 0, sym = 0, fc = 0, bc = 0, rol = 0, shomess = TRUE;
  let a = 0, b = 0, c = 0, ffc = 0, dic = 0, dam = 0;
  ClearMess();
  if (agin) {
    num = keysave1; dx = keysave2; dy = keysave3;
  } else {
    ljnk(153, 32, 23, 2); PrintMessage(2, 0);
    [num, dx, dy] = await Target(num, 1.5, dx, dy, 0);
    keysave1 = num; keysave2 = dx; keysave3 = dy;
  }
  if (not(didstuff)) { ClearMess(); PrintMessage(7, 0); return; }
  [sym, fc, bc] = GetSym(localx + dx, localy + dy, 1);
  ClearMess();
  num = -num; fatadd = fatig;
  if ((num === trap || num === pit || num === gas || num === 215 || num === 216) && (sym === 250)) num = 1;
  rol = cRoll(20) + 9 * qb(berscience !== 0) + (9 - 9 * qb(berhmmut > 0)) * qb(mmut === 2 && bermmut === 0);
  shomess = TRUE;
  switch (num) {
    case trap:
      if (rol <= (dex + dexadd) / 3) {
        a = 154; b = 1; c = 15;
        PutSym(250, localx + dx, localy + dy, 8, 0, -1);
      } else if (rol === 20) {
        ljnk(154, 16, 12, 2); fc = await Trapp(fc); shomess = FALSE;
      } else {
        a = 154; b = 40; c = 21;
      }
      break;
    case pit:
      fatadd = fatadd + 1;
      if (rol <= (str + stradd) / 3) {
        a = 154; b = 1; c = 15;
        PutSym(250, localx + dx, localy + dy, 8, 0, -1);
      } else if (rol === 20) {
        PutSym(currsym, localx, localy, currf, currb, 1);
        currsym = sym; currf = fc; currb = bc;
        localx = localx + dx; localy = localy + dy;
        for (let i = 1; i <= nnear; i++) {
          ncre[i][4] = ncre[i][4] - dx; ncre[i][5] = ncre[i][5] - dy;
        }
        if (invisible) ffc = 8; else ffc = 15;
        PutSym(1, localx, localy, ffc, 0, 1);
        ljnk(154, 28, 12, 2); fc = await Pitt(fc); shomess = FALSE;
      } else {
        a = 154; b = 40; c = 21;
      }
      break;
    case gas:
      if (rol <= 2) {
        a = 154; b = 1; c = 15;
        PutSym(250, localx + dx, localy + dy, 8, 0, -1);
      } else if (rol === 20) {
        ljnk(389, 54, 15, 2);
        dic = idiv(21 - con, 3) + idiv(lvl, 2); if (dic < 1) dic = 1;
        dam = rolldice(4, dic, dic);
        if (pmut === 7 && berpmut === 0) dam = cint((dam + 1) / (2 - 2 * qb(berhpmut > 0)));
        if ((gasmask | spacesuit) !== 0) dam = 0;
        hits = hits - dam;
        if (hits < 0) { await MessPause(8, 0); st1 = jnk$(157, 42, 10); await Dead(0); shomess = FALSE; }
      } else {
        a = 154; b = 40; c = 21;
      }
      break;
    case 215: case 216:
      fatadd = fatadd + 1;
      if (rol <= idiv(str + stradd, 3)) {
        a = 154; b = 1; c = 15;
        PutSym(250, localx + dx, localy + dy, 8, 0, -1);
      } else {
        a = 154; b = 40; c = 21;
      }
      break;
    case 0:
      didstuff = FALSE;
      break;
    default:
      didstuff = FALSE; a = 153; b = 55; c = 12;
  }
  if (c > 0) ljnk(a, b, c, 2);
  if (shomess) await MessPause(7, 0);
}

// Knocks down a wall segment between two floor squares.  Returns
// [sym, removed].
function RemoveWall(sym, x, y, removed) {
  let sy1 = 0, sy2 = 0, fc = 0, bc = 0;
  let rdistt = 0, ldistt = 0, rdistb = 0, ldistb = 0, rdist = 0, ldist = 0;
  let tdistl = 0, bdistl = 0, tdistr = 0, bdistr = 0, tdist = 0, bdist = 0;
  if (sym === hor) {
    [sy1, fc, bc] = GetSym(x, y - 1, 2);
    [sy2, fc, bc] = GetSym(x, y + 1, 2);
    if (sy1 !== 250 || sy2 !== 250) return [sym, removed]; else removed = TRUE;
    rdistt = Walld(x, y - 1, 1, 0, 50);
    ldistt = Walld(x, y - 1, -1, 0, 50);
    rdistb = Walld(x, y + 1, 1, 0, 50);
    ldistb = Walld(x, y + 1, -1, 0, 50);
    if (rdistt < rdistb) rdist = rdistt; else rdist = rdistb;
    if (ldistt < ldistb) ldist = ldistt; else ldist = ldistb;
    for (let i = x - ldist + 1; i <= x + rdist - 1; i++) PutSym(250, i, y, 8, 0, 2);
    [sym, fc, bc] = GetSym(x - ldist, y, 2);
    switch (sym) {
      case ml: sym = ver; break;
      case cen: case lockeddoor: case secretdoor: sym = mrt; break;
      case um: sym = ur; break;
      case lm: sym = lr; break;
      default: sym = 32;
    }
    PutSym(sym, x - ldist, y, fc, bc, 2);
    [sym, fc, bc] = GetSym(x + rdist, y, 2);
    switch (sym) {
      case mrt: sym = ver; break;
      case cen: case lockeddoor: case secretdoor: sym = ml; break;
      case um: sym = ul; break;
      case lm: sym = ll; break;
      default: sym = 32;
    }
    PutSym(sym, x + rdist, y, fc, bc, 2);
  } else {
    [sy1, fc, bc] = GetSym(x - 1, y, 2);
    [sy2, fc, bc] = GetSym(x + 1, y, 2);
    if (sy1 !== 250 || sy2 !== 250) return [sym, removed]; else removed = TRUE;
    tdistl = Walld(x - 1, y, 0, -1, 50);
    bdistl = Walld(x - 1, y, 0, 1, 50);
    tdistr = Walld(x + 1, y, 0, -1, 50);
    bdistr = Walld(x + 1, y, 0, 1, 50);
    if (tdistr < tdistl) tdist = tdistr; else tdist = tdistl;
    if (bdistr < bdistl) bdist = bdistr; else bdist = bdistl;
    for (let i = y - tdist + 1; i <= y + bdist - 1; i++) {
      PutSym(250, x, i, 8, 0, 2);
    }
    [sym, fc, bc] = GetSym(x, y - tdist, 2);
    switch (sym) {
      case um: sym = hor; break;
      case cen: case lockeddoor: case secretdoor: sym = lm; break;
      case ml: sym = ll; break;
      case mrt: sym = lr; break;
      default: sym = 32;
    }
    PutSym(sym, x, y - tdist, fc, bc, 2);
    [sym, fc, bc] = GetSym(x, y + bdist, 2);
    switch (sym) {
      case lm: sym = hor; break;
      case cen: case lockeddoor: case secretdoor: sym = um; break;
      case ml: sym = ul; break;
      case mrt: sym = ur; break;
      default: sym = 32;
    }
    PutSym(sym, x, y + bdist, fc, bc, 2);
  }
  return [sym, removed];
}

// Is the square (dx, dy) from the character in the same castle room?
function SameRoom(dx, dy) {
  let sm = TRUE, ddx = 0, ddy = 0;
  if (incastle) {
    ddx = Math.abs(dx); ddy = Math.abs(dy);
    if (ddx > 12 || ddy > 7) {
      sm = FALSE;
    } else if (ddx < 2 && ddy < 2) {
      sm = TRUE;
    } else {
      sm = csameroom(localx, localy, localx + dx, localy + dy, localx, localy, nnear, ncre);
      if ((ddx === 1 || ddy === 1) && not(sm)) sm = csameroom(localx + dx, localy + dy, localx, localy, localx, localy, nnear, ncre);
    }
  }
  return sm;
}

// Darkens the room containing (x, y) again (flood fill).
function UnDotIt(x, y) {
  let sym = 0, fc = 0, bc = 0, ch = 0;
  [sym, fc, bc] = GetSym(x, y, 1);
  if (sym === 32 || fc === wallcolr) return;
  if (x < 2 || x > 51 || y < 2 || y > 21) return;
  [sym, fc, bc] = GetSym(x, y, 1);
  if (sym === 250) {
    sym = 32; fc = 7; bc = 0;
  } else if (isLetter(sym)) {
    sym = 32; fc = 7; bc = 0;
    ch = badmovecreat(x - localx, y - localy, nnear, 0, ncre);
    if (ch > 0) {
      sym = imod(ncre[ch][8], 1000); fc = idiv(ncre[ch][8], 1000); bc = 0;
      if (fc === wallcolr) {
        PutSym(sym, x, y, fc, bc, 1); return;
      } else {
        sym = 32; fc = 7; bc = 0;
      }
    }
  }
  PutSym(sym, x, y, fc, bc, 1);

  for (let ig = -1; ig <= 1; ig++) {
    for (let jg = -1; jg <= 1; jg++) {
      if (ig | jg) {
        [sym, fc, bc] = GetSym(x + ig, y + jg, 1);
        if (sym === 250 || isLetter(sym)) UnDotIt(x + ig, y + jg);
      }
    }
  }
}

// Distance to the nearest wall (colour 9) in direction (dx, dy), at most max.
function Walld(x, y, dx, dy, max) {
  let dist = max, ix = x, iy = y, sym = 0, fc = 0, bc = 0;
  for (let j = 1; j <= max; j++) {
    ix = ix + dx; iy = iy + dy;
    [sym, fc, bc] = GetSym(ix, iy, 2);
    if (fc === 9) { dist = j; break; }
  }
  return dist;
}

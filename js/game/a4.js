// Port of A4.BAS: food, dropped items, item names, the detailed (local) map,
// explosions, killing creatures, experience levels, the main map, making
// creatures and items, and removing creatures / items.
//
// Copyright (c) 1995 Jeffrey R. Olson (MIT license, see LICENSE)
'use strict';

// mut: / mmmut: DATA - lengths of the mutation names in JNK lines 100.. / 120..
const MUT_DATA = [21, 20, 19, 17, 17, 12, 22, 15, 16, 20, 9, 13, 12, 16, 20, 6, 9];
const MMMUT_DATA = [15, 17, 20, 12, 13, 14, 11, 20, 10, 12, 10, 8, 13];

function AddBeef() {
  if (goody[1][1] === 2) {
    goody[1][3] = goody[1][3] + 1;
  } else if (goody[2][1] === 2) {
    goody[2][3] = goody[2][3] + 1;
  } else {
    ngoody = ngoody + 1; goody[ngoody][1] = 2;
    goody[ngoody][2] = 0; goody[ngoody][3] = 1;
    gdy[ngoody] = jnk$(1, 23, 11);
  }
  ClearMess();
  ljnk(1, 1, 33, 2); PrintMessage(6, 0);
  if (rdisp !== 1) DisplayGoodies(FALSE);
}

function AddSpam() {
  if (Math.abs(goody[1][1]) === 1) {
    goody[1][3] = goody[1][3] + 1;
  } else {
    ngoody = ngoody + 1; goody[ngoody][1] = 1;
    goody[ngoody][2] = 0; goody[ngoody][3] = 1;
    gdy[ngoody] = 'Spam';
  }
  ClearMess();
  Ljnkbig(1, 1, 22, 0, 0, 0, 'Spam', 1, 2); PrintMessage(13, 0);
  if (rdisp !== 1) DisplayGoodies(FALSE);
}

// Adds an item to the front of the dropped-items list.  i > 0 is an item
// of the character (then backpack, then safe); i <= 0 creates an item:
// -1..-nberry berries, -nberry-1.. special items.  Returns i (the SUB's
// by-reference parameter, which one case uses as a loop variable).
function AddToDrop(i) {
  let th = 0, j = 0, nmaxi = 0, a = 0, b = 0, c = 0, typ = 0, num = 0, clr = 0, t = 0;
  if (ndropped === 30) {
    if (Math.abs(drgoody[30][1]) === 8 && drgoody[30][11] === 8) {   // safe
      for (j = 1; j <= 16; j++) { t = drgoody[25][j]; drgoody[25][j] = drgoody[30][j]; drgoody[30][j] = t; }
      const ts = drgdy[25]; drgdy[25] = drgdy[30]; drgdy[30] = ts;
    }
    if (drgoody[30][13] === mainx && drgoody[30][14] === mainy) {
      PutSym(250, drgoody[30][15], drgoody[30][16], 8, 0, -1);
    }
    ndropped = 29;
  }
  for (j = ndropped; j >= 1; j--) {
    drgdy[j + 1] = drgdy[j];
    for (let k = 1; k <= 16; k++) drgoody[j + 1][k] = drgoody[j][k];
  }
  ndropped = ndropped + 1;
  for (let ijk = 1; ijk <= 12; ijk++) drgoody[1][ijk] = 0;
  drgoody[1][13] = mainx; drgoody[1][14] = mainy;
  if (i > 0) {   // dropped from character,pack,safe
    if (i > ngoody + npack) {
      drgdy[1] = saf[i - ngoody - npack];
      for (j = 1; j <= 12; j++) drgoody[1][j] = safe[i - ngoody - npack][j];
    } else if (i > ngoody) {
      drgdy[1] = bakpak[i - ngoody];
      for (j = 1; j <= 12; j++) drgoody[1][j] = backpack[i - ngoody][j];
    } else {
      drgdy[1] = gdy[i];
      for (j = 1; j <= 12; j++) drgoody[1][j] = goody[i][j];
    }
    drgoody[1][1] = Math.abs(drgoody[1][1]); th = drgoody[1][1];
    if (th !== 9) {
      currsym = symb[th][1]; currf = symb[th][2]; currb = symb[th][3];
    } else {
      currb = 0;
      switch (drgoody[1][3]) {
        case 1: currsym = 147; currf = 15; break;
        case 2: currsym = 167; currf = 12; break;
        case 3: currsym = 7 + cRoll(2) * 11; currf = 15; break;
        case 4: currsym = 145; currf = 1; break;
        case 5: currsym = 234; currf = 15; break;
        case 6: currsym = 225; currf = 6; break;
        case 7: currsym = 35; currf = 6; break;
        case 8: currsym = 147; currf = 1; break;
        case 9: currsym = 147; currf = 14; break;
      }
    }
    drgoody[1][15] = localx; drgoody[1][16] = localy;
  } else {
    switch (i) {
      case -nberry - 1:      // SSD
        drgoody[1][1] = 7; j = cRoll(nssd + ntechwep + nstrash);
        if (j === 2 || j === 5) j = 6;
        if (j > nssd && j <= nssd + ntechwep) nmaxi = 9; else nmaxi = 4;
        for (let k = 2; k <= nmaxi; k++) drgoody[1][k] = ssd[j][k - 1];
        drgoody[1][10] = ssdknown[j]; drgoody[1][11] = j;
        if (ssdknown[j]) drgdy[1] = ssdnm$(j); else { a = 155; b = 1; c = 18; }
        break;
      case -nberry - 2:  // skiphat
        drgoody[1][1] = 9; drgoody[1][2] = 1; drgoody[1][3] = 1;
        a = 294; b = 25; c = 17;
        break;
      case -nberry - 3:  // keptibora
        drgoody[1][1] = 9; drgoody[1][2] = 1; drgoody[1][3] = 2;
        a = 117; b = 29; c = 15; drgoody[1][5] = 0;
        break;
      case -nberry - 4:  // map
        drgoody[1][1] = 9; drgoody[1][2] = 1; drgoody[1][3] = 3;
        a = 289; b = 62; c = 3;
        break;
      case -nberry - 5:  // BSshoes
        drgoody[1][1] = 9; drgoody[1][2] = 1; drgoody[1][3] = 4;
        a = 296; b = 3; c = 24;
        break;
      case -nberry - 6:  // Spacesuit
        drgoody[1][1] = 9; drgoody[1][2] = 10; drgoody[1][3] = 5;
        a = 294; b = 58; c = 10;
        break;
      case -nberry - 7:  // PID
        drgoody[1][1] = 7; drgoody[1][2] = 1; drgoody[1][3] = -1;
        drgoody[1][4] = 15; drgoody[1][5] = 4;  // pres
        drgoody[1][10] = ssdknown[19]; drgoody[1][11] = 19;
        if (ssdknown[19]) {
          drgdy[1] = ssdnm$(19);
        } else {
          drgdy[1] = jnk$(3, 62, 6) + jnk$(155, 25, 4) + jnk$(-2, 44, 7);
        }
        break;
      case -nberry - 8:  // bamboo raft
        drgoody[1][1] = 9; drgoody[1][2] = 15; drgoody[1][3] = 7;
        drgoody[1][4] = 20 - cRoll(cRoll(10)); drgoody[1][5] = 0;
        a = 409; b = 54; c = 11;
        break;
      case -nberry - 9:  // Roast Beast
        drgoody[1][1] = 9; drgoody[1][2] = 0; drgoody[1][3] = 6;
        a = 199; b = 32; c = 11;
        break;
      case -nberry - 10:   // tech components
        drgoody[1][1] = 10; drgoody[1][2] = cRoll(cRoll(50));
        drgoody[1][3] = rolldice(10, 3, 3);
        a = 319; b = 50; c = 17;
        break;
      case -nberry - 11:    // spam
        drgoody[1][1] = 1; drgoody[1][2] = 1; drgoody[1][3] = 1;
        drgdy[1] = 'Spam';
        break;
      case -nberry - 12:  // beef-a-roni
        drgoody[1][1] = 2; drgoody[1][2] = 1; drgoody[1][3] = 1;
        a = 1; b = 23; c = 11;
        break;
      case -nberry - 13:     // armor
        typ = 12 - cRoll(cRoll(11));
        drgoody[1][1] = 4; drgoody[1][2] = arm[drgoody[1][3]][1]; drgoody[1][3] = typ;
        drgoody[1][4] = cint((cRoll(arm[typ][2]) * 2 + arm[typ][2]) / 3);
        drgdy[1] = armnm$(typ);
        break;
      case -nberry - 14:     // shield
        typ = 6 - cRoll(cRoll(5));
        if (typ < 3) typ = 6 - cRoll(cRoll(5));
        drgoody[1][1] = 5; drgoody[1][2] = sh[typ][1]; drgoody[1][3] = typ;
        drgoody[1][4] = cint((cRoll(sh[typ][2]) * 2 + sh[typ][2]) / 3);
        drgdy[1] = shnm$(typ) + jnk$(3, 55, 7);
        break;
      case -nberry - 15:     // weapon
        switch (cRoll(12)) {
          case 1: case 2: case 3:
            typ = cRoll(cRoll(nrwep - 4)) + nwep; break;  // all but Ti, duralloy weps
          case 4: case 5:
            typ = cRoll(cRoll(nrwep)) + nwep; break;
          case 6: case 7: case 8: case 9:
            typ = cRoll(cRoll(nwep - 5)); break; // all but Ti, duralloy weps
          default:
            typ = cRoll(cRoll(nwep));
        }
        if ((typ < 1) || (typ > nwep + nrwep)) typ = 1;
        drgoody[1][1] = 3;
        for (let jj = 1; jj <= 6; jj++) drgoody[1][jj + 1] = wep[typ][jj];
        drgoody[1][8] = typ;
        drgdy[1] = wepnm$(typ);
        if (typ > nwep) {
          num = rolldice(drgoody[1][3], 2, 1); drgoody[1][3] = num;
        }
        break;
      case -nberry - 16:  // mets hat
        drgoody[1][1] = 9; drgoody[1][2] = 1; drgoody[1][3] = 8;
        a = 94; b = 46; c = 8;
        break;
      case -nberry - 17:  // tape recorder
        for (i = 1; i <= 8; i++) drgoody[1][i + 1] = ssd[5][i];
        drgoody[1][1] = 7; drgoody[1][10] = ssdknown[5]; drgoody[1][11] = 5;
        if (ssdknown[5]) drgdy[1] = ssdnm$(5); else drgdy[1] = jnk$(35, 39, 17);
        break;
      case -nberry - 18:  // Ivana wig
        drgoody[1][1] = 9; drgoody[1][2] = 1; drgoody[1][3] = 9;
        drgoody[1][4] = rolldice(3, 2, 2); a = 265; b = 59; c = 9;
        break;
      default:         // berry
        clr = cRoll(6); if (i === 0) clr = 4;   // Gregre berry
        drgdy[1] = Kolr$(clr) + berry$[-i] + bl + jnk$(-2, 37, 5);
        drgoody[1][1] = 6; drgoody[1][2] = 0; drgoody[1][3] = -i;
        drgoody[1][4] = clr; drgoody[1][5] = 0;
        drgoody[1][6] = cRoll(3) - 1; if (i === 0) drgoody[1][6] = 1;
    }
  }
  if (c > 0) drgdy[1] = jnk$(a, b, c);
  return i;
}

// Item names from the tables of ALPHAMAN.3 (three integers: string number,
// start, length at byte position place).
function itemName(place) {
  const k = (place - 1) / 2;
  return jnk$(ALPHA3[k], ALPHA3[k + 1], ALPHA3[k + 2]);
}

function armnm$(i) {
  const place = 6 * (nwep + nrwep + nsh + i) - 5;
  st1 = itemName(place);
  if (incastle & qb(castle === 4)) st1 = jnk$(246, 63, 6) + st1;
  return st1;
}

// Generates (or reloads) the local map of the current main-map square.
async function DetailedMap(loadmappossible) {
  const oldl1$ = l1, oldl2$ = l2, oldl3$ = l3;
  let t1 = 0, x = 0, t1_ = 0, j = 0, k = 0, f = 0, b = 0, ruins = 0, monolith = FALSE;
  let maxlevel = 0, minlevel = 0, dx = 0, dy = 0, zz = 0, doorsym = 0, numcre = 0, g = 0;
  let lobyte = 0, hibyte = 0, nstuff = 0, s = 0, y = 0, sym = 0, th = 0, fc = 0, bc = 0;
  let chan = 0, nobush = FALSE, xb = 0, yb = 0, numroll = 0, z = 0, xweb = 0, yweb = 0;
  let ffc = 0, olddark = 0, changed = 0;
  screenPages(0); ljnk(1, 38, 8, 4); ClearMess(); t1 = timer();
  ljnk(1, 46, 18, 2); locate(24, 1); print(l2);
  vpage = 0; await DisplayCharacter();
  screenPages(1, 0); ccls(1); screenPages(2, 0); clpage2();

  crandomize(seed + 1.3 * mainx + 62.2 * mainy);
  rnd(Math.fround(-(seed + 1.3 * mainx + 62.2 * mainy)));
  for (let i = 1, n = (mainx % 5) * 7 + (mainy % 11) * 3; i <= n; i++) {
    x = cint(rnd() + cRoll(10));
  }

  enddm: {
    if (((looking | teleporting) === 0) && loadmappossible) {
      if (await LoadMaps(0)) {
        if (starting === -1) starting = 1; else starting = 0;
        break enddm;
      }
    }

    // ----------------------------------------------

    t1_ = terrain;
    for (let i = 1; i <= 4; i++) {
      j = (i - 2) % 2; k = (i - 3) % 2;
      [scratch[i], f, b] = GetSym(mainx + j, mainy + k, 0);
      if (scratch[i] === 1) scratch[i] = looksym;
      if (t1_ === 247) scratch[i] = 247;
      switch (scratch[i]) {
        case 15: case 42: case 176: case 177: case 32: case 247: break;
        default: scratch[i] = t1_;
      }
    }
    switch (t1_) {
      case 234: case 239: case 30: case 94: case 127: case 71:
        j = cRoll(3); t1_ = scratch[j];
        switch (t1_) {
          case 234: case 239: case 30: case 94: case 127: case 71: t1_ = scratch[j + 1]; break;
          default: t1_ = 32;
        }
        break;
    }

    cdetailedmap(t1_, scratch[1], scratch[2], scratch[3], scratch[4]);

    if (radint && (bergreen === 0 && spacesuit === 0)) {
      box(1, 52, 1, 22, 1, 76, 1);
      box(1, 52, 1, 22, 1, 76, 2);
    }

    lwall = 0; rwall = 0; twall = 0; bwall = 0;
    lwscr = 0; rwscr = 0; twscr = 0; bwscr = 0;

    ruins = qb(cRoll(7) === 1) * (2 * qb(cRoll(3) === 1) + 1);
    bldg = FALSE; monolith = FALSE; mononum = 0;
    for (let i = 1; i <= nmonolith; i++) {
      if (monozone[i][1] === mainx && monozone[i][2] === mainy) {
        ruins = 0; monolith = TRUE; mononum = i;
      }
    }

    switch (terrain) {
      case 234: case 239: case 30: case 94: case 127: case 71:
        switch (terrain) {
          case 127: castle = 1; maxlevel = 4; minlevel = -4; break;
          case 30: castle = 2; maxlevel = 0; minlevel = -7; break;
          case 239: castle = 3; maxlevel = 5; minlevel = -2; break;
          case 234: castle = 4; maxlevel = 7; minlevel = 0; break;
          case 94: castle = 5; maxlevel = 2; minlevel = -5; break;
          case 71: castle = 6; maxlevel = 5; minlevel = -5; break;
        }
        bldg = TRUE; ruins = FALSE;
        lwall = 5; rwall = 48; twall = 3; bwall = 20;
        lwscr = 15; rwscr = 37; twscr = 6; bwscr = 15;
        break;
      case 247: ruins = FALSE; break;
      default:
        if (ruins < 0) {
          bldg = TRUE; castle = 0;
          maxlevel = cRoll(cRoll(5)); minlevel = -cRoll(cRoll(5));
          lwall = 5 + cRoll(17); rwall = 48 - cRoll(18);
          twall = 3 + cRoll(5); bwall = 19 - cRoll(4);
          dx = cint((rwall - lwall) / 3); dy = cint((bwall - twall) / 3);
          if (dx < 3) dx = 3;
          if (dy < 2) dy = 2;
          lwscr = cRoll(42 - dx) + 5; twscr = cRoll(16 - dy) + 3;
          rwscr = lwscr + dx; bwscr = twscr + dy;
        } else if (ruins > 0) {
          xenter = cRoll(30) + 10; yenter = cRoll(8) + 6;
          PutSym(240, xenter, yenter, 5, 0, -1);
        } else if (monolith) {
          [xmono, ymono] = finddot(incastle);
          PutSym(monosym, xmono, ymono, 11, 0, -1);
        }
    }
    if (bldg) {
      box(lwscr, rwscr, twscr, bwscr, 2, wallcolr, 1);
      box(lwscr, rwscr, twscr, bwscr, 2, wallcolr, 2);
      if (castle === 6) {
        for (let i = lwscr - 1; i <= rwscr + 1; i++) {
          PutSym(chasm, i, twscr - 1, 8, 0, -1); PutSym(chasm, i, bwscr + 1, 8, 0, -1);
        }
        for (let i = twscr; i <= bwscr; i++) {
          PutSym(chasm, lwscr - 1, i, 8, 0, -1); PutSym(chasm, rwscr + 1, i, 8, 0, -1);
        }
      }
      for (let s2 = -10; s2 <= 10; s2++) { xstairs[s2] = 0; ystairs[s2] = 0; }
      for (let s2 = minlevel; s2 <= maxlevel - 1; s2++) {
        xstairs[s2] = cRoll(rwall - lwall - 5) + lwall + 2;
        ystairs[s2] = cRoll(bwall - twall - 5) + twall + 2;
      }
      enterdir = cRoll(4); zz = cRoll(100);
      xenter = idiv(zz * (rwall - lwall - 2), 100) + 1 + lwall;
      xenterscr = idiv(zz * (rwscr - lwscr - 2), 100) + 1 + lwscr;
      yenter = idiv(zz * (bwall - twall - 2), 100) + 1 + twall;
      yenterscr = idiv(zz * (bwscr - twscr - 2), 100) + 1 + twscr;
      switch (enterdir) {
        case 1: xenter = lwall; xenterscr = lwscr; break;
        case 2: xenter = rwall; xenterscr = rwscr; break;
        case 3: yenter = bwall; yenterscr = bwscr; break;
        default: yenter = twall; yenterscr = twscr;
      }
      doorsym = cen;
      if (castle === 6 || cRoll(10) === 1) doorsym = lockeddoor;
      PutSym(doorsym, xenterscr, yenterscr, wallcolr, 0, -1);
      for (let i = lwscr + 1; i <= rwscr - 1; i++) {
        for (j = twscr + 1; j <= bwscr - 1; j++) PutSym(32, i, j, 7, 0, -1);
      }
    }

    if ((starting === -1) && bldg) {
      localx = xenterscr; localy = yenterscr;
      switch (enterdir) {
        case 1: localx = localx - 2; break;
        case 2: localx = localx + 2; break;
        case 3: localy = localy + 2; break;
        default: localy = localy - 2;
      }
    }

    for (let i = 1, n = ncastle + nruins; i <= n; i++) lobyte = cint(rnd() * cRoll(2));
    const r200 = cRoll(200);
    if (r200 <= 20) numcre = 0;
    else if (r200 <= 85) numcre = 1;
    else if (r200 <= 155) numcre = 2;
    else if (r200 <= 187) numcre = 3;
    else if (r200 <= 197) numcre = 4;
    else if (r200 <= 199) numcre = 5;
    else numcre = 5 + cRoll(5);

    if ((terrain === 15 || terrain === 177)) numcre = numcre + 1;
    if ((terrain === 42 || terrain === 176) && rnd() < 0.5) numcre = numcre + 1;
    if (terrain === 247) numcre = numcre + rolldice(2, 4, 4) - 4;
    g = goodythere[mainx][mainy];
    lobyte = imod(g, 256); hibyte = idiv(g - lobyte, 256);
    const r100 = cRoll(100);
    if (r100 <= 20) nstuff = 0;
    else if (r100 <= 69) nstuff = 1;
    else if (r100 <= 93) nstuff = 2;
    else if (r100 <= 98) nstuff = 3;
    else if (r100 === 99) nstuff = 4;
    else nstuff = 4 + cRoll(4);
    if (nstuff < numcre - 3) nstuff = numcre - 3;
    if (nstuff > numcre + 1) numcre = nstuff - 1 + qb(cRoll(3) === 1);
    if (nstuff > 8) nstuff = 8;
    if (terrain === 247) nstuff = 0;
    for (let i = 1; i <= nstuff; i++) MakeStuff(i);
    if (((hibyte & 4) === 0)) {
      lobyte = cint(lobyte + 2 ** nstuff - 1); hibyte = hibyte | 1;
    }
    for (let i = 1; i <= nstuff; i++) {
      if ((lobyte & 2 ** (i - 1))) {
        s = imod(localgoody[i][1], 256); f = idiv(localgoody[i][1], 256);
        PutSym(s, localgoody[i][2], localgoody[i][3], f, 0, 2);
      }
    }
    if (starting) {
      AddToDrop(-nberry - 17);
      for (;;) {   // incr:
        x = 3 + cRoll(46); y = 2 + cRoll(18);
        if (bldg) {
          if (x >= lwscr && x <= rwscr) {
            if (y >= twscr && y <= bwscr) continue;
          }
        }
        [sym, f, b] = GetSym(x, y, 1);
        if (sym !== 32 && sym !== 249 && sym !== 250) continue;
        break;
      }
      drgoody[1][15] = x; drgoody[1][16] = y;
      if (starting === -1) starting = 1; else starting = 0;
    }

    for (let i = 1; i <= ndropped; i++) {
      if (drgoody[i][13] === mainx && drgoody[i][14] === mainy) {
        th = Math.abs(drgoody[i][1]);
        if (th !== 9) {
          sym = symb[th][1]; fc = symb[th][2]; bc = symb[th][3];
        } else {
          bc = 0;
          switch (drgoody[i][3]) {
            case 1: sym = 147; fc = 15; break;
            case 2: sym = 167; fc = 12; break;
            case 3: sym = 7 + cRoll(2) * 11; fc = 15; break;
            case 4: sym = 145; fc = 1; break;
            case 5: sym = 234; fc = 15; break;
            case 6: sym = 225; fc = 6; break;
            case 7: sym = 35; fc = 6; break;
            case 8: sym = 147; fc = 1; break;
            case 9: sym = 147; fc = 14; break;
          }
        }
        PutSym(sym, drgoody[i][15], drgoody[i][16], fc, bc, 2);
      }
    }

    if ((hibyte & 1)) {
      switch (terrain) {
        case 42: case 176: case 239: case 30: case 127: case 94: case 234: case 71: chan = 15; break;
        case 15: case 177: chan = 8; break;
        case 247: chan = -1000; break;
        default: chan = 5;
      }
      chan = chan + 15 * radint;

      while (cRoll(100) < chan) {
        nobush = TRUE; chan = chan - 100;
        while (nobush) {
          xb = cRoll(45) + 3; yb = cRoll(15) + 3;
          [sym, f, b] = GetSym(xb, yb, 2);
          if ((sym === 42 || sym === 15)) {
            PutSym(sym, xb, yb, f, 4, 2); nobush = FALSE;
          }
          if (cRoll(200) === 1) nobush = FALSE;
        }
      }
    }

    for (let i = 1; i <= nnear; i++) PutCreat(i);
    if ((hibyte & 4) === 0) {
      for (j = 1; j <= numcre; j++) MakeCreature(0, 0, FALSE, looking);
    }
    if (not(looking)) {
      hibyte = hibyte | 2;   // square has been seen
      hibyte = hibyte | 4;   // don't create new dudes in this square later
      goodythere[mainx][mainy] = cint(lobyte + 256 * hibyte);
    }

    // (sic) "SQR(lvl) * (2 + 2 * terrain = 247)" is a comparison, always 0
    chan = cint(Math.sqrt(lvl) * qb(2 + 2 * terrain === 247));
    numroll = 10;
    while (cRoll(numroll) <= chan) {   // maketrap: ++++ create trap ++++
      for (;;) {   // rdotrp:
        [x, y] = finddot(incastle);
        if (bldg) {
          if (x > lwscr && x < rwscr && y < bwscr && y > twscr) continue;
        }
        break;
      }
      sym = trap; fc = 10; bc = 0;
      switch (terrain) {
        case 15: case 42:
          switch (cRoll(4)) {
            case 2: fc = 7; break;    // gopher hole
            case 3: fc = 6; break;    // quicksand
            case 4: fc = 12; break;   // explosive gas
          }
          break;
        case 176: case 177:
          switch (cRoll(4)) {
            case 2: fc = 8; break;    // tarpit
            case 3: fc = 6; break;    // quicksand
            case 4: fc = 12; break;   // explosive gas
          }
          break;
        default:
          switch (cRoll(3)) {
            case 2: fc = 7; break;    // gopher hole
            case 3: fc = 12; break;   // explosive gas
          }
      }
      PutSym(sym, x, y, fc, bc, 2);
      numroll = numroll + 6;
    }

    chan = cint(Math.sqrt(lvl));
    switch (terrain) {
      case 15: case 42: chan = chan * 2; break;
      case 176: case 177: break;
      case 247: chan = 0; break;
      default: chan = cint(chan / 2);
    }
    z = cRoll(20);
    while (z <= chan) {    // ++++ create web ++++
      xweb = cRoll(46) + 3; yweb = cRoll(16) + 3;
      [sym, fc, bc] = GetSym(xweb, yweb, 2);
      switch (sym) {
        case 32: case 249: case 250: PutSym(214 + cRoll(2), xweb, yweb, 8, 0, 2); break;
      }
      chan = chan - z; z = cRoll(20);
    }

    if (not(looking | teleporting)) {
      [currsym, currf, currb] = GetSym(localx, localy, 2);
      if (invisible) ffc = 8; else ffc = 15;
      PutSym(1, localx, localy, ffc, 0, -1);
    }
    // ----------------------------------------------
  }
  // enddm:

  [dark, olddark, changed] = SetDark(dark, olddark, changed); ChangeDark();
  screenPages(0, 0); l1 = oldl1$; l2 = oldl2$; l3 = oldl3$;
  if (starting) vpage = 0; else vpage = 1;
  PrintMessage(7, 0);
  // The original waits until at least one second has passed and then throws
  // away any keys pressed meanwhile.  The 3D view can skip both (GameHooks).
  if (!GameHooks.fastAreaChange()) {
    while (Math.abs(timer() - t1) < 1) await sleepSeconds(0.05);
    DumpBuffer();
  }
  screenPages(vpage, vpage); numroll = cint(rnd(Math.fround(-seed - gt)));
}

// An explosion / attack centred at (dx, dy) relative to the player with
// radius r (r < 0: a beam of length -r).  The BASIC SUB changed damtype,
// need, r and clr through its parameters; they are returned as an object.
async function Explode(dx, dy, damage, damtype, need, r, slf, clr, div) {
  r = Math.fround(r);
  const a$ = rtrim$(l1), aaa$ = jnk$(86, 34, 19);
  let dumx = 0, dumy = 0, sym = 0, ifc = 0, ibc = 0, cx = 0, cy = 0, nope = 0, typ = 0;
  let csym = 0, cf = 0, cbb = 0, kl = 0, crr = 0, ddx = 0, ddy = 0, csym1 = 0, fc1 = 0, bc1 = 0;
  let fc = 0, bc = 0, num = 0, x = 0, y = 0, dam = 0, needed = 0, tohit = 0, ffkill = FALSE;
  let sym1 = 0, snum = 0, tohitroll = 0, misspec = 0, ccfc = 0, ccsym = 0, az = 0, bz = 0, cz = 0;

  const getem = async () => {
    dam = damage; needed = need - idiv(ncre[num][9], div);
    if (needed > 18) needed = 18; else if (needed < 4) needed = 4;

    tohitroll = cRoll(20);

    [tohitroll, misspec] = await CrDef(num, damtype, tohitroll, misspec, int(r));
    kl = 0;
    if (tohitroll >= needed) {
      if (tohitroll === 20) dam = dam * 2;
      typ = ncre[num][1]; [dam, damtype] = CrDamAlter(num, dam, damtype);
      switch (damtype) {
        case 3: case 4: case 5:
          ccfc = idiv(ncre[num][8], 1000); ccsym = imod(ncre[num][8], 1000);
          if ((damtype === 5) && ((ccsym === 250) || (ccsym === 32))) {
            ncre[num][8] = 8000 + gas;
          } else if ((damtype === 4) && (dam > 0)) {
            ncre[num][6] = -Math.abs(ncre[num][6]);
          }
          break;
      }
      if (dam === 0) l2 = aaa$;
      if (dam > 0) {
        ncre[num][2] = ncre[num][2] - dam; az = 38;
        switch (damtype) {
          case 2: bz = 1; cz = 5; break;               // nuked
          case 3: case 4: case 5: az = 54; bz = 29; cz = 8; break; // poisoned
          case 6: az = 97; bz = 45; cz = 8; break;     // corroded
          case 7: bz = 26; cz = 5; break;              // fried
          case 8: az = 108; bz = 59; cz = 8; break;    // assailed
          case 9: bz = 42; cz = 6; break;              // zapped
          case 10: az = 55; bz = 57; cz = 5; break;    // burnt
          case 11: bz = 49; cz = 5; break;             // froze
          case 12: az = 97; bz = 53; cz = 11; break;   // immobilized
          case 22: az = 116; bz = 27; cz = 7; break;   // blinded
          case 31: az = 271; bz = 58; cz = 11; break;  // shorted out
          default: az = 51; bz = 62; cz = 7;           // injured
        }
        if (damtype === 26 && typ !== gill) ljnk(306, 37, 19, 2);
      } else {
        ncre[num][2] = ncre[num][2] - dam; ncre[num][3] = ncre[num][3] - idiv(dam, 2);
        az = 50; bz = 30; cz = 3;
      }
      if (ncre[num][2] < 0) {
        l1 = a$ + bl + jnk$(az, bz, cz) + bl + Der$(FALSE, num, 1);
        kl = num; await KillCreat(kl); if (r === 0) need = 0;
      }
    } else if ((damtype === 3 && r === 0) || (damtype === 11 && r === 0)) {
      need = -need; az = 50; bz = 37; cz = 6;
    } else if (misspec === 0) {
      az = 50; bz = 37; cz = 6;
    }
    if (kl === 0 && cz > 0 && misspec === 0) l1 = a$ + bl + jnk$(az, bz, cz) + bl + Der$(FALSE, num, 1);
    clr = await MessPause(clr, 0);
  };

  if (r >= 0) {
    dumx = localx + dx; dumy = localy + dy;   // for sameroom in loop
    let t = dumx; dumx = localx; localx = t;   // swaps back below
    t = dumy; dumy = localy; localy = t;
    for (let ix = cint(localx - r), ixEnd = cint(localx + r); ix <= ixEnd; ix++) {
      for (let iy = cint(localy - r), iyEnd = cint(localy + r); iy <= iyEnd; iy++) {
        if (crd(ix - localx, iy - localy) <= r && SameRoom(ix - localx, iy - localy)) {
          [sym, ifc, ibc] = GetSym(ix, iy, 1);
          PutSym(sym, ix, iy, ifc, clr % 8, 1);
        }
      }
    }
    localx = dumx; localy = dumy;             // right here
    for (num = nnear; num >= 1; num--) {
      if (crd(ncre[num][4] - dx, ncre[num][5] - dy) <= r) {
        cx = ncre[num][4] - dx; cy = ncre[num][5] - dy;
        localx = localx + dx; localy = localy + dy;
        nope = not(SameRoom(cx, cy));
        localx = localx - dx; localy = localy - dy;
        if (nope) continue;
        cx = ncre[num][4] + localx; cy = ncre[num][5] + localy;
        typ = ncre[num][1]; await Awaken(num);
        [csym, cf, cbb] = GetSym(cx, cy, 1); PutSym(csym, cx, cy, clr, 0, 1);
        kl = 0; await getem(); if (kl === 0) PutSym(csym, cx, cy, cf, cbb, 1);
      }
    }
  } else {
    r = -r; crr = crd(dx, dy); if (crr === 0) crr = 1;
    ddx = Math.fround(dx / crr); ddy = Math.fround(dy / crr);
    for (let i = 1, n = int(r); i <= n; i++) {
      cx = cint(localx + i * ddx); cy = cint(localy + i * ddy);
      if (not(SameRoom(cx - localx, cy - localy))) break;
      [csym1, fc1, bc1] = GetSym(cx, cy, 1);
      PutSym(csym1, cx, cy, fc1, clr % 8, 1);
    }
    for (let i = 1, n = int(r); i <= n; i++) {
      cx = cint(localx + i * ddx); cy = cint(localy + i * ddy);
      if (not(SameRoom(cx - localx, cy - localy))) break;
      [csym, fc, bc] = GetSym(cx, cy, 2);
      [csym1, fc1, bc1] = GetSym(cx, cy, 1);
      PutSym(csym1, cx, cy, fc1, clr % 8, 1);
      switch (csym) {
        case 15: case 42:
          PutSym(32, cx, cy, 7, clr % 8, 1); PutSym(32, cx, cy, 7, 0, 2);
          break;
        default:
          num = badmovecreat(cx - localx, cy - localy, nnear, 0, ncre);
          if (num > 0) { typ = ncre[num][1]; await Awaken(num); await getem(); }
      }
    }
    for (let i = 1, n = int(r); i <= n; i++) {
      x = cint(localx + i * ddx); y = cint(localy + i * ddy);
      if (not(SameRoom(x - localx, y - localy))) break;
      [csym1, fc1, bc1] = GetSym(x, y, 1); PutSym(csym1, x, y, fc1, 0, 1);
    }
    r = -r;
  }

  if (r >= 0) {
    if ((crd(dx, dy) <= r + 0.1) && slf && SameRoom(dx, dy)) {
      dam = damage; needed = need - idiv(ac, div); tohit = cRoll(20);
      if (tohit >= needed) {
        switch (damtype) {
          case 1: dam = await DamSuit(0, dam); break;
          case 2: dam = await DamSuit(1, dam);
            if (rr > 0) dam = cint(dam * 10 / rr); else dam = dam * 20;
            break;
          case 3: case 4: case 5:
            if (con > 0) dam = cint(dam * 10 / con); else dam = dam * 20;
            if (gasmask) dam = 0;
            break;
          case 6: dam = await DamSuit(5, dam); break;
          case 7: dam = await DamSuit(3, dam); break;
          case 8:
            if (mindweb && (cRoll(10) === 1)) {
              mindweb = 0; ljnk(111, 14, 23, 1); await MessPause(10, 0);
            }
            if (mindweb) dam = 0;
            if (mr > 0) dam = cint(dam * 10 / mr); else dam = dam * 20;
            break;
          case 9: dam = await DamSuit(4, dam); break;
          case 10: dam = await DamSuit(2, dam); break;
          case 12: inglue = TRUE; break;
          case 18: berhic = berhic + rolldice(3, 4, 4); ber$ = 'aaaChoo!'; break;
          case 22: berblind = berblind + rolldice(4, 4, 4); break;
          case 27: asleep = TRUE; berhic = 0; sick = 0; break;
          case 28: berhic = berhic + rolldice(3, 4, 4); ber$ = 'Burrrp!'; break;
        }
        if (dam > 0) {
          ClearMess();
          Ljnkbig(53, 31, 8, 0, 0, 0, a$, 0, 1); [dam, ffkill] = ffEffect(dam, ffkill);
          if (ffkill) Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
          clr = await MessPause(clr, 0); hits = hits - dam; ShowHits();
          if (hits < 0) { st1 = a$; await Dead(0); }
        }
      } else {
        ClearMess();
        Ljnkbig(152, 10, 11, 0, 0, 0, a$, 0, 1); clr = await MessPause(clr, 0);
      }
    }

    for (let ix = cint(localx + dx - r), ixEnd = cint(localx + dx + r); ix <= ixEnd; ix++) {
      for (let iy = cint(localy + dy - r), iyEnd = cint(localy + dy + r); iy <= iyEnd; iy++) {
        if (crd(ix - localx - dx, iy - localy - dy) <= r) {
          [sym1, ifc, ibc] = GetSym(ix, iy, 1); PutSym(sym1, ix, iy, ifc, 0, 1);
          [sym, ifc, ibc] = GetSym(ix, iy, 2);
          switch (damtype) {
            case 1: case 2: case 6: case 7: case 9: case 10: case 11:
              switch (sym) {
                case 15: case 42: PutSym(32, ix, iy, 7, 0, -1); break;
              }
              break;
            case 5:
              switch (sym) {
                case 250: case 249: case 32:
                  snum = -1; if ((incastle & qb(sym1 === 32))) snum = 2;
                  PutSym(gas, ix, iy, 8, 0, snum);
                  break;
              }
              break;
          }
        }
      }
    }
  }
  return { damtype, need, r, clr };
}

async function KillCreat(i) {
  let typ = 0, a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, ix = 0, iy = 0, yup = FALSE;
  let x = 0, y = 0, sym = 0, fc = 0, iop = 0, dam = 0, ffkill = FALSE, candrop = FALSE;
  let xz = 0, yz = 0, symz = 0, xcre = 0, ycre = 0, droprad = 0, ss = 0, gtyp = 0, compsym = 0;
  let expadd = 0, newlev = 0, b$ = '';

  typ = ncre[i][1];
  if (typ === grinch) { await GotGrinch(FALSE); return; } else await MaybeMessPause(13, 0);

  if (typ > ncreat + creextra + 1 || typ === pryor) {
    if (not(firstspecial) && (typ !== grinch)) {
      firstspecial = TRUE; ClearMess(); ljnk(385, 29, 31, 1); await MessPause(13, 0);
      ljnk(386, 1, 54, 1); ljnk(387, 1, 51, 2); ljnk(388, 1, 54, 3);
      PrintMessage(13, 0); await PauseForKey();
    }
  }

  a = 30; b = 1; c = 14;  // default "you've killed "
  if (typ === spot) { c = 0; d = 295; e = 39; f = 12; }
  else if (typ === elvimp) { c = 0; d = 295; e = 1; f = 38; }
  else if (typ === elvis) {
    c = 0; Ljnkbig(295, 1, 16, 0, 0, 0, Der$(TRUE, i, 1), 1, 1);
    ljnk(361, 34, 32, 2);      // will print in calling routine
    EraseCreat(i); [ix, iy] = finddot(incastle);
    ncre[i][4] = ix - localx; ncre[i][5] = iy - localy; PutCreat(i);
    ncre[i][2] = ncre[i][3]; ncre[i][11] = ncre[i][11] & ~1; return;
  } else if (typ === phoe) {
    yup = FALSE;
    if (ncre[i][14] === 0) {
      yup = TRUE;
    } else if (rnd() < 0.3 / ncre[i][14]) {
      yup = TRUE;
    }
    if (yup) {
      ncre[i][14] = ncre[i][14] + 1; ncre[i][2] = ncre[i][3]; await Awaken(i);
      c = 0; Ljnkbig(30, 1, 14, 0, 0, 0, Der$(TRUE, i, 1), 1, 1);
      ljnk(161, 1, 33, 2); return;     // will print in calling routine
    }
  } else if (typ > ncreat + creextra + 1 || typ === wimp || typ === pryor) {
    a = 295; b = 1; c = 16;
  }
  if (c > 0) Ljnkbig(a, b, c, 0, 0, 0, Der$(TRUE, i, 1), 1, 1); else ljnk(d, e, f, 1);
  switch (cRoll(15)) {
    case 1: a = 30; b = 15; c = 30; break;
    case 2: a = 30; b = 45; c = 7; break;
    case 3: a = 31; b = 1; c = 15; break;
    case 4: a = 31; b = 16; c = 17; break;
    case 5: a = 31; b = 33; c = 13; break;
    case 6: a = 31; b = 46; c = 20; break;
    case 7: a = 32; b = 1; c = 21; break;
    case 8: a = 82; b = 60; c = 9; break;
    case 9: a = 77; b = 63; c = 6; break;
    case 10: a = 266; b = 21; c = 10; break;
    case 11: a = 266; b = 31; c = 19; break;
    case 12: a = 143; b = 62; c = 7; break;
    case 13: a = 267; b = 1; c = 27; break;
    case 14: a = 278; b = 1; c = 31; break;
    default: a = 30; b = 52; c = 10;
  }
  ljnk(a, b, c, 2);
  x = ncre[i][4]; y = ncre[i][5]; sym = 0;
  switch (typ) {
    case puff:
      if (crd(x, y) < 4) {
        dam = rolldice(4 + 2 * lvl, 2, 2);
        [dam, ffkill] = ffEffect(dam, ffkill); dam = await DamSuit(0, dam); hits = hits - dam;
        if (hits < 0) { st1 = jnk$(136, 41, 21); await Dead(0); return; }
        ljnk(134, 59, 7, 2);
        if (ffkill) {
          Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
        }
      }
      ljnk(136, 19, 22, 1);
      break;
    case gspore:
      if (crd(x, y) < 4) {
        dam = rolldice(cint(4 + 1.5 * lvl), 2, 2);
        [dam, ffkill] = ffEffect(dam, ffkill); dam = await DamSuit(0, dam); hits = hits - dam;
        if (hits < 0) { st1 = jnk$(33, 24, 22); await Dead(0); return; }
        ljnk(33, 46, 23, 2);
        if (ffkill) {
          Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
        }
      }
      ljnk(33, 1, 23, 1);
      break;
    case bush: ljnk(32, 22, 18, 1); ljnk(95, 1, 26, 2);
      crtyp = quayle; MakeCreature((x + localx), (y + localy), FALSE, FALSE);
      break;
    case skip: sym = 147; fc = 15; iop = 2; break;
    case gill: sym = 167; fc = 12; iop = 3;
      finishedcastles = finishedcastles | 4;
      break;
    case buzz: sym = 234; fc = 15; iop = 6;
      finishedcastles = finishedcastles | 8;
      break;
    case trump: sym = 11; fc = 14; iop = 7;
      finishedcastles = finishedcastles | 16;
      break;
    case ivana: sym = 147; fc = 14; iop = 18; break;
  }
  if ((ncre[i][13] !== 0) && (grabbed > 0)) grabbed = grabbed - 1;
  switch (imod(ncre[i][8], 1000)) {
    case 250: case 32: case 249: candrop = TRUE; break;
    default: candrop = FALSE;
  }

  switch (typ) {
    case gill: case buzz: case trump:
      AddToDrop(-nberry - 17);
      do {   // inctr:
        xz = cRoll(8) + 22; yz = cRoll(4) + 9;
        [symz] = GetSym(xz, yz, 2);
      } while (symz !== 250);
      PutSym(10 + cRoll(2), xz, yz, 14, 0, -1);
      drgoody[1][15] = xz; drgoody[1][16] = yz;
      break;
  }

  RemoveCreat(i); xcre = x + localx; ycre = y + localy; droprad = 1;
  if (sym > 0) {
    while (!candrop) {
      xz = xcre + cRoll(2 * droprad + 1) - droprad - 1;
      yz = ycre + cRoll(2 * droprad + 1) - droprad - 1;
      if (xz < 2 || xz > 50) xz = xcre + 1;
      if (yz < 2 || yz > 20) yz = ycre;
      [ss] = GetSym(xz, yz, 2); if (ss === 250) candrop = TRUE;
      droprad = droprad - qb(cRoll(10) === 1);
    }
    PutSym(sym, xcre, ycre, fc, 0, -1); AddToDrop(-nberry - iop);
    drgoody[1][15] = xcre; drgoody[1][16] = ycre;
  } else if (candrop && (rnd() < 0.25 - qb(typ === prof) - qb(typ === fern))) {
    switch (typ) {
      case japb: case rdro: case ddro: case sdro: case wdro: case robot: case prof:
        PutSym(11, xcre, ycre, 14, 0, -1); AddToDrop(-nberry - 1);
        drgoody[1][15] = xcre; drgoody[1][16] = ycre;
        break;
      case cb: case bfoot: case fern:
        PutSym(236, xcre, ycre, 4, 0, -1);
        gtyp = cRoll(nberry); AddToDrop(-gtyp);
        drgoody[1][15] = xcre; drgoody[1][16] = ycre;
        break;
      case fox:
        PutSym(22, xcre, ycre, 5, 0, -1); AddToDrop(-nberry - 11);
        drgoody[1][15] = xcre; drgoody[1][16] = ycre;
        break;
    }
  } else if (candrop && (rnd() < 0.3) && mmut === 2) {
    switch (typ) {
      case rdro: case ddro: case sdro: case wdro: case robot:
        compsym = 128 - 7 * qb(cRoll(2) === 1);
        PutSym(compsym, xcre, ycre, 14, 0, -1); AddToDrop(-nberry - 10);
        drgoody[1][15] = xcre; drgoody[1][16] = ycre;
        break;
    }
  }
  expadd = clng(Creature(typ, 5) * (10 + cRoll(4) - cRoll(4)) / 10);
  if (typ === webspid) expadd = expadd * lvl;
  if ((expadd > idiv(expr + 10, 2)) && (expr > 0)) expadd = idiv(expr + 10, 2);
  expr = expr + expadd; [newlev, b$] = await Level(newlev, b$);
  if (rdisp === 1) await DisplayCharacter();
  if (newlev) {
    await MaybeMessPause(13, 0);
    Ljnkbig(14, 26, 17, 0, 0, 0, str$(lvl), 1, 1); l2 = b$;
  }
}

// Raises or lowers the experience level as needed.  Returns
// [ChangedLevel, b$] (b$ describes a changed characteristic).
async function Level(ChangedLevel, b$) {
  let needed = 0, oldneeded = 0, a = 0, b = 0, c = 0, hitadd = 0, statup = 0, siza = 0;
  let sizb = 0, sizc = 0, newlev = 0;
  ChangedLevel = FALSE;
  if (lvl <= 12) {
    needed = clng(5 * 2 ** lvl); oldneeded = idiv(needed, 2);
  } else {
    needed = clng((5 * 2 ** 12) * (lvl - 11)); oldneeded = clng(needed - 5 * 2 ** 12);
  }
  if (oldneeded < 10) oldneeded = -30;
  a = 0; b = 0; c = 0;
  if (expr >= needed) {
    lvl = lvl + 1;
    if (cRoll(3) === 1) {
      switch (cRoll(6)) {
        case 1: str = str + 1; b = 1; c = 8; break;
        case 2: dex = dex + 1; b = 9; c = 9; break;
        case 3: con = con + 1; b = 18; c = 12; hitadd = hitadd + 1; break;
        case 4: rr = rr + 1; b = 30; c = 20; break;
        case 5: mr = mr + 1; a = -1; b = 1; c = 17; break;
        default: intl = intl + 1; a = -1; b = 18; c = 12;
      }
      b$ = jnk$(34, 1, 5) + jnk$(a, b, c) + jnk$(34, 5, 9);
    } else {
      statup = 0;
      do {   // rstatup:
        statup = statup + 1;
        switch (cRoll(6)) {
          case 1: if (str < 10) { str = str + 1; b = 1; c = 8; statup = 4; } break;
          case 2: if (dex < 10) { dex = dex + 1; b = 9; c = 9; statup = 4; } break;
          case 3: if (con < 10) { con = con + 1; b = 18; c = 12; hitadd = hitadd + 1; statup = 4; } break;
          case 4: if (rr < 10) { rr = rr + 1; b = 30; c = 20; statup = 4; } break;
          case 5: if (mr < 10) { mr = mr + 1; a = -1; b = 1; c = 17; statup = 4; } break;
          default: if (intl < 10) { intl = intl + 1; a = -1; b = 18; c = 12; statup = 4; }
        }
      } while (statup < 4);
      if (b > 0) b$ = jnk$(34, 1, 5) + jnk$(a, b, c) + jnk$(34, 5, 9);
    }
    siza = 3;
    if (pmut === 7) siza = 3 - 2 * qb(berhpmut > 0);      // leave as 3
    if (con > 11) sizb = siza + 1; else sizb = siza;
    if (con > 15) sizc = siza + 1; else sizc = siza;
    if (pmut === 7) siza = siza - qb(berhpmut === 0);       // this is correct
    if (pmut === 10) siza = siza + 1 - qb(berhpmut > 0);  // so is this
    hitadd = hitadd + cRoll(siza) + cRoll(sizb) + cRoll(sizc) - qb(wpturns > 0);
    hitmax = hitmax + hitadd; hits = hits + hitadd;
    [newlev, b$] = await Level(newlev, b$); ChangedLevel = TRUE;
  } else if (expr < oldneeded) {
    lvl = lvl - 1; siza = 3;
    if (pmut === 7) siza = 3 - 2 * qb(berhpmut > 0);      // leave as 3
    if (con > 13) sizb = siza + 1; else sizb = siza;
    if (pmut === 7) siza = siza - qb(berhpmut === 0);       // this is correct
    if (pmut === 10) siza = siza + 1 - qb(berhpmut > 0);  // so is this
    hitadd = cRoll(siza) + cRoll(sizb) + cRoll(sizb) - qb(wpturns > 0);
    switch (cRoll(6)) {
      case 1: str = str - 1; b = 1; c = 8; break;
      case 2: dex = dex - 1; b = 9; c = 9; break;
      case 3: con = con - 1; b = 18; c = 12; hitadd = hitadd + 1; break;
      case 4: rr = rr - 1; b = 30; c = 20; break;
      case 5: mr = mr - 1; a = -1; b = 1; c = 17; break;
      default: intl = intl - 1; a = -1; b = 18; c = 12;
    }
    b$ = jnk$(34, 1, 5) + jnk$(a, b, c) + jnk$(34, 31, 11);
    hitmax = hitmax - hitadd; hits = hits - hitadd;
    if (hits < 0 || expr < -30) {
      st1 = jnk$(34, 42, 13); await Dead(0);
    } else {
      [newlev, b$] = await Level(newlev, b$); ChangedLevel = TRUE;
    }
  }
  SetCombatStats();
  return [ChangedLevel, b$];
}

function lsdnm$(i) {
  const place = 6 * (nwep + nrwep + nsh + narm + nssd + ntechwep + nstrash + i) - 5;
  st1 = itemName(place);
  if (incastle & qb(castle === 4)) {
    switch (i) {
      case 10: case nlsd + 12: break;
      default: st1 = jnk$(246, 63, 6) + st1;
    }
  }
  return st1;
}

// Generates the main map (lode TRUE when loading a saved game).
function MainMap(lode) {
  let jrnd = 0, irnd = 0, psym = 0, i = 0, j = 0, sym = 0, fcolr = 0, bcolr = 0, b = 0, redomono = FALSE;
  rnd(-seed); crandomize(seed);
  jrnd = int(rnd() * 2); irnd = int(rnd() * 2);
  ljnk(48, 1, 50, 1); ljnk(49, 1, 42, 2); ljnk(49, 43, 26, 3);
  ljnk(1, 38, 8, 4); t$ = ''; PrintMessage(7, 0);

  cmainmap(irnd, jrnd);

  psym = 127; // elv
  for (;;) {   // rcas:
    i = cRoll(18) + 2; j = cRoll(48) + 2;
    [sym, fcolr, bcolr] = GetSym(j, i, 0);
    if (sym !== 247 && fcolr !== 5) { PutSym(psym, j, i, 5, 0, 0); break; }
  }
  psym = 30; // munst
  do {   // mars:
    i = cRoll(18) + 2; j = cRoll(48) + 2;
    [sym, fcolr, bcolr] = GetSym(j, i, 0);
  } while (sym !== 176 && sym !== 177);
  PutSym(psym, j, i, 5, 0, 0);
  psym = 239; // gil
  do {   // watr:
    i = 2 + (cRoll(2) - 1) * 19;
    j = cRoll(2) + 1 + (cRoll(2) - 1) * 48;
    [sym, fcolr, bcolr] = GetSym(j, i, 0);
  } while (sym !== 247);
  PutSym(psym, j, i, 5, 0, 0);
  psym = 234; // trum
  do {   // fors:
    j = cRoll(11) + 39 - 37 * jrnd; i = cRoll(5) + 2 + 14 * irnd;
    [sym, fcolr, bcolr] = GetSym(j, i, 0);
  } while (sym !== 15 && sym !== 42);
  PutSym(psym, j, i, 5, 0, 0);
  psym = 94; // 2nd
  for (;;) {   // rcas2:
    j = cRoll(11) + 2 + 37 * jrnd; i = cRoll(5) + 2 + 14 * irnd;
    [sym, fcolr, bcolr] = GetSym(j, i, 0);
    if (sym !== 247 && fcolr !== 5) { PutSym(psym, j, i, 5, 0, 0); break; }
  }

  if (lode) {
    for (i = 1; i <= 10; i++) {
      if (radzone[i][3] < 0) {
        [sym, fcolr, b] = GetSym(radzone[i][1], radzone[i][2], 0);
        if (map && (i === grinchzone)) { sym = 71; fcolr = 13; }
        PutSym(sym, radzone[i][1], radzone[i][2], fcolr, 4, 0);
      }
    }
  } else {
    grinchzone = cRoll(10);
    for (i = 1; i <= 10; i++) {
      radzone[i][3] = rolldice(6, 3, 3);
      radzone[i][3] = radzone[i][3] + cRoll(i);
      for (;;) {   // rad:
        radzone[i][1] = cRoll(50) + 1; radzone[i][2] = cRoll(20) + 1;
        [sym, fcolr, b] = GetSym(radzone[i][1], radzone[i][2], 0);
        if (radzone[i][1] === mainx && radzone[i][2] === mainy) continue;
        if (fcolr === 5) continue;
        break;
      }
      if (pmut === 4) {
        PutSym(sym, radzone[i][1], radzone[i][2], fcolr, 4, 0);
        radzone[i][3] = -radzone[i][3];
      }
    }
    for (i = 1; i <= nmonolith; i++) {
      monozone[i][3] = 0;
      do {
        redomono = FALSE;
        monozone[i][1] = cRoll(50) + 1; monozone[i][2] = cRoll(20) + 1;
        for (j = 1; j <= i - 1; j++) {
          if (monozone[i][1] === monozone[j][1]) {
            if (monozone[i][2] === monozone[j][2]) redomono = TRUE;
          }
        }
        [sym, fcolr, bcolr] = GetSym(monozone[i][1], monozone[i][2], 0);
        if (fcolr === 5 || sym === 126 || sym === 247) redomono = TRUE;
      } while (redomono);
    }
  }

  [terrain, terrf, terrb] = GetSym(mainx, mainy, 0);
  PutSym(1, mainx, mainy, 15, 0, 0);
}

// Adds a creature (at (x, y) if both > 0, at the map border if border).
// With fake it is removed again (used while looking).  Returns [x, y]
// (the BASIC SUB's by-reference parameters).
function MakeCreature(x, y, border, fake) {
  let placed = FALSE, mctry = 0, ix = 0, iy = 0, sym = 0, f = 0, b = 0, maxcre = 0, maxspec = 0;
  let typ = 0, crefract = 0, fract = 0, ppp = 0, dic = 0, hts = 0, bushcolr = 0;
  let sss = 0, fff = 0, bbb = 0, cres = 0, zum = 0, num = 0;
  mce: {
    if ((incastle === -1) && (nnear >= dots)) break mce;
    if (x > 0 && y > 0) placed = TRUE;
    if (nnear === 50) { tentgrab = creatsort(nnear, tentgrab, ncre); EraseCreat(50); nnear = 49; }
    nnear = nnear + 1; mctry = 1;
    rdp: for (;;) {
      ix = cRoll(45) + 3; iy = cRoll(15) + 3;
      if (mctry > 1) { x = x + cRoll(3) - 2; y = y + cRoll(3) - 2; }
      mctry = mctry + 1;
      if (border) {
        switch (cRoll(4)) {
          case 1: ix = 2; break;
          case 2: ix = 51; break;
          case 3: iy = 2; break;
          case 4: iy = 21; break;
        }
      }
      if (incastle) [ix, iy] = finddot(incastle);
      if (placed) {
        if (x > 51) x = 51; else if (x < 2) x = 2;  // was 48,5
        if (y > 21) y = 21; else if (y < 2) y = 2;  // was 19,4
        ix = x; iy = y;
      }
      if (bldg && (incastle === 0)) {
        if (ix >= lwscr && ix <= rwscr) {
          if (iy >= twscr && iy <= bwscr) continue rdp;
        }
      }

      [sym, f, b] = GetSym(ix, iy, 2);
      if ((incastle === -1) && border && not(placed)) {
        if (SameRoom(ix - localx, iy - localy)) continue rdp;
      }
      switch (sym) {
        case 250: break;
        case 1: case 15: case 42: case 247: case 215: case 216: case monosym: continue rdp;
        case hor: case ver: case ul: case um: case ur: case ml: case cen: case mrt: case ll: case lm: case lr: case 219:
          continue rdp;
        case lockeddoor: case secretdoor: case pit: case trap: case gas: case chasm: continue rdp;
        default:
          if ((sym >= 65 && sym <= 90) || (sym >= 97 && sym <= 122)) continue rdp;
          if (incastle) continue rdp;
      }
      break;
    }

    maxcre = 3 + idiv(7 * lvl, 2) + ncastle;
    if (maxcre > ncreat) maxcre = ncreat;
    maxspec = lvl;
    if (incastle) maxspec = 1 + lvl;
    if (terrain === 247) {
      if (lvl < 8) maxspec = cint(2 + 1.5 * lvl);
      else maxspec = 6 + lvl;
    }
    if (incastle) {
      if (maxspec > crecas) maxspec = crecas;
    } else {
      switch (terrain) {
        case 15: case 42: case 234: case 71:
          if (maxspec > crefor) maxspec = crefor; break;
        case 176: case 177: case 239: case 30:
          if (maxspec > creswa) maxspec = creswa; break;
        case 32: case 127: case 94:
          if (maxspec > crepla) maxspec = crepla; break;
        case 247:
          if (maxspec > creh2o) maxspec = creh2o; break;
      }
    }
    rdo: for (;;) {
      if ((cRoll(100) < 45) || (terrain === 247)) {
        typ = cRoll(maxspec);
        if ((typ < idiv(maxspec, 2)) && (cRoll(lvl + 8) < cRoll(lvl - 5))) typ = cRoll(maxspec);
        crefract = Math.fround(typ / maxspec);
        if (incastle) {
          typ = ncreat + typ;
        } else {
          switch (terrain) {
            case 15: case 42: case 234: case 71: typ = ncreat + crecas + typ; break;
            case 176: case 177: case 239: case 30: typ = ncreat + crecas + crefor + typ; break;
            case 32: case 127: case 94: typ = ncreat + crecas + crefor + creswa + typ; break;
            case 247: typ = ncreat + crecas + crefor + creswa + crepla + typ; break;
            default: typ = 1;
          }
        }
      } else {
        typ = cRoll(maxcre); fract = Math.fround(lvl / 30); if (fract > 1) fract = 1;
        if ((typ < maxcre * fract) && (cRoll(lvl + 8) < cRoll(lvl - 5))) {
          if (maxcre < ncreat - 4) maxcre = maxcre + 4; else maxcre = ncreat;
          typ = cRoll(maxcre);
        }
        crefract = Math.fround(typ / maxcre);
        if (typ === gumby || typ === quayle) continue rdo;
      }

      if (incastle) {
        switch (typ) {
          case kong: case rodan: case godz: continue rdo;
        }
      }

      if (placed) { typ = crtyp; if (typ === pokey) typ = gumby; }
      if (incastle === 1) typ = crtyp;

      ncre[nnear][1] = typ; ppp = Creature(typ, 1); dic = imod(idiv(ppp, 10), 1000);
      if (typ > ncreat + creextra + 1) dic = dic + idiv(lvl, 2);
      if (dic === 0) hts = 1; else hts = rolldice(8, dic, dic);
      if ((crefract < 0.5) && (dic > 0)) hts = cint(hts + (0.5 - crefract) * lvl);

      if (typ === mph) hts = 8;
      if (typ === gworm) hts = idiv(rolldice(lvl, 3, 3), 2);
      ncre[nnear][2] = hts; ncre[nnear][3] = hts;
      ncre[nnear][4] = ix - localx; ncre[nnear][5] = iy - localy;
      ncre[nnear][10] = Creature(typ, 2);  // leave here
      ncre[nnear][12] = Creature(typ, 4);  // ditto
      ncre[nnear][6] = idiv(ppp, 10000);
      if ((ncre[nnear][10] & -32768)) ncre[nnear][6] = ncre[nnear][6] + 4;
      if (border && (ncre[nnear][6] === 0)) continue rdo;
      break;
    }
    if (berscare > 0 || mask) ncre[nnear][6] = -ncre[nnear][6];
    ncre[nnear][7] = Creature(typ, 3);
    if (typ === bush) {
      bushcolr = cRoll(3) * 3 + 6; if (bushcolr === 9) bushcolr = 1;
      ncre[nnear][7] = 66 + 1000 * bushcolr;
    }
    if (typ === roach) ncre[nnear][10] = roachdef;
    ncre[nnear][9] = imod(ppp, 10);
    if ((ncre[nnear][10] & 16384)) ncre[nnear][9] = ncre[nnear][9] - 10;
    if ((ncre[nnear][12] & 16384)) ncre[nnear][9] = ncre[nnear][9] + 10;
    ncre[nnear][11] = -(qb(incastle === 0) | qb(typ === quayle) | qb(typ === brain) | border);
    if ((ncre[nnear][12] & 256)) ncre[nnear][11] = 0;
    if (beryum) ncre[nnear][11] = 1;
    ncre[nnear][13] = 0; ncre[nnear][14] = 0; ncre[nnear][15] = 0;
    [sss, fff, bbb] = GetSym(ix, iy, 2); ncre[nnear][8] = cint(sss + 1000 * fff);
    if (!((incastle === -1) && border)) {
      PutCreat(nnear);
    } else {
      PutSym(imod(ncre[nnear][7], 1000), ix, iy, idiv(ncre[nnear][7], 1000), 0, 2);
    }

    cres = 0; zum = not(placed | (incastle & border)); crtyp = typ;
    switch (typ) {
      case ant: if (zum) { cres = cRoll(lvl) + 3; if (cres > 15) cres = 15; } break;
      case term: if (zum) { cres = rolldice(cint(lvl / 3), 2, 2); if (cres > 8) cres = 8; } break;
      case sard: if (zum) { cres = cRoll(2 * lvl) + 4; if (cres > 15) cres = 15; } break;
      case bee: if (zum) { cres = cRoll(idiv(lvl, 2)) + idiv(lvl, 3); if (cres > 12) cres = 12; } break;
      case rat: if (zum) { cres = cRoll(idiv(lvl, 2) + 3); if (cres > 15) cres = 15; } break;
      case hyena: if (zum) { cres = cRoll(idiv(lvl, 2) + 1); if (cres > 10) cres = 10; } break;
      case pivy: if (zum) { cres = cRoll(idiv(lvl, 3) + 1); if (cres > 10) cres = 10; } break;
      case puff: if (zum) { cres = cRoll(idiv(lvl, 3) + 3); if (cres > 8) cres = 8; } break;
      case raptor: if (zum) cres = 2; break;
      case locust: if (zum) { cres = cRoll(lvl) + 5; if (cres > 15) cres = 15; } break;
      case pokey: crtyp = pokey; cres = 1; break;
      case mdeck: crtyp = zola; cres = 1; break;
      case robot:
        dic = cRoll(10) + 9; hts = rolldice(8, dic, dic);
        ncre[nnear][2] = hts; ncre[nnear][3] = hts;
        ncre[nnear][6] = cRoll(4) - 1; ncre[nnear][9] = cRoll(8) - 3;
        ncre[nnear][14] = (cRoll(5) + 1) + 10 * cRoll(3) + 100 * (cRoll(10) + 5);
        // str + 10*rng + 100*tohit
        break;
      case rdro:
        dic = cRoll(3) + 1; hts = rolldice(8, dic, dic);
        ncre[nnear][2] = hts; ncre[nnear][3] = hts;
        ncre[nnear][9] = cRoll(8) - 1;  // ac
        ncre[nnear][14] = cRoll(2) + 10 * cRoll(3) + 100 * (cRoll(7) + 10);
        break;
      case ddro:
        dic = cRoll(4) + 3; hts = rolldice(8, dic, dic);
        ncre[nnear][2] = hts; ncre[nnear][3] = hts;
        ncre[nnear][9] = cRoll(8) - 3;  // ac
        ncre[nnear][14] = cRoll(3) + 10 * cRoll(3) + 100 * (cRoll(7) + 7);
        break;
      case sdro:
        dic = rolldice(4, 2, 2) + 5; hts = rolldice(8, dic, dic);
        ncre[nnear][2] = hts; ncre[nnear][3] = hts;
        ncre[nnear][9] = cRoll(8) - 6;  // ac
        ncre[nnear][14] = cRoll(4) + 2 + 10 * (cRoll(3) + 1) + 100 * (cRoll(7) + 4);
        break;
      case webspid:
        dic = cRoll(cint(lvl / 2)) + idiv(lvl, 3); hts = rolldice(8, dic, dic);
        ncre[nnear][2] = hts; ncre[nnear][3] = hts;
        num = cint(Math.sqrt(lvl)); ncre[nnear][14] = (cRoll(num + 1)) + 100 * (19 - lvl);
        // str + 100*tohit
        break;
    }
    for (let i = 1; i <= cres; i++) MakeCreature((ix), (iy), FALSE, fake);
  }
  // mce:
  if (fake) nnear = nnear - 1;
  return [x, y];
}

// Chooses item i of the local map (stored in localgoody).
function MakeStuff(i) {
  let s = 0, x = 0, y = 0, stuffpage = 0, sym = 0, fc = 0, bc = 0;
  const res = cRoll(70);
  if (res <= 4) s = 8 + 256 * 7;                  // armor
  else if (res <= 12) s = 9 + 256 * 3;            // shield
  else if (res <= 34) s = 5 + (cRoll(2) - 1) * 231 + 256 * (4 + (cRoll(2) - 1) * 8);  // berry
  else if (res <= 36) s = 254 + 256 * 6;          // beef
  else if (res <= 45) s = 22 + 256 * 5;           // spam
  else if (res <= 57) s = 24 + 256 * 1;           // wep
  else if (res <= 66) s = 10 + cRoll(2) + 256 * (14);  // ssd
  else s = 21 + (cRoll(2) - 1) * 136 + 256 * 11;  // 67 TO 70    lsd
  localgoody[i][1] = s;
  for (;;) {   // bads:
    x = cRoll(45) + 3; y = cRoll(15) + 3;
    stuffpage = 1;
    if (incastle) { [x, y] = finddot(incastle); stuffpage = 2; }
    [sym, fc, bc] = GetSym(x, y, stuffpage);
    if (sym === 1) continue;
    if ((incastle === 0) && bldg && x <= rwscr + 1 && x >= lwscr - 1 && y <= bwscr + 1 && y >= twscr - 1) continue;
    break;
  }
  localgoody[i][2] = x; localgoody[i][3] = y;
}

function mmutnm$(i) {
  let b = 0;
  for (let j = 1; j <= i; j++) b = MMMUT_DATA[j - 1];
  return jnk$(119 + i, 1, b);
}

// Moves the player's position on the main map.
function MoveMain(dmx, dmy) {
  PutSym(terrain, mainx, mainy, terrf, terrb, 0);
  mainx = mainx + dmx; mainy = mainy + dmy;
  [terrain, terrf, terrb] = GetSym(mainx, mainy, 0);
  switch (terrain) {
    case 15: case 42: case 32: case 176: case 177: case 247: case 234: case 239: case 30: case 94: case 127: case 71:
      break;
    default: terrain = 32;
  }
  PutSym(1, mainx, mainy, 15, 0, 0);
  incastle = 0;
  radint = 0;
  for (let i = 1; i <= 10; i++) {
    if (mainx === radzone[i][1] && mainy === radzone[i][2]) {
      if (i === grinchzone) { terrain = 71; terrf = 5; map = TRUE; }
      terrb = 4; radzone[i][3] = -Math.abs(radzone[i][3]);
      radint = Math.abs(radzone[i][3]);
    }
  }
}

function pmutnm$(i) {
  let b = 0;
  for (let j = 1; j <= i; j++) b = MUT_DATA[j - 1];
  return jnk$(99 + i, 1, b);
}

// Transmogrifies the creature at (dx, dy).
async function PolyCreat(dx, dy) {
  let num = 0, maxcre = 0, typ = 0, ppp = 0, dic = 0, hts = 0, bushcolr = 0, sy = 0, co = 0;
  for (let i = 1; i <= nnear; i++) {
    if (ncre[i][4] === dx && ncre[i][5] === dy) { num = i; break; }
  }

  if (ncre[num][1] > ncreat + creextra + 1) return;

  maxcre = 10 + 3 * lvl + ncastle;
  if (maxcre > ncreat) maxcre = ncreat;
  typ = cRoll(maxcre);
  if (cRoll(2) === 1) {
    typ = cRoll(creextra + 1) + ncreat;
  }
  ncre[num][1] = typ;
  ppp = Creature(typ, 1); dic = imod(idiv(ppp, 10), 1000);
  if (dic === 0) hts = 1; else hts = rolldice(8, dic, dic);
  if (typ === mph) hts = 8;
  if (typ === gworm) hts = idiv(rolldice(lvl, 3, 3), 2);
  ncre[num][2] = hts; ncre[num][3] = hts;
  ncre[num][10] = Creature(typ, 2);
  ncre[num][12] = Creature(typ, 4);
  ncre[num][6] = idiv(ppp, 10000);
  if ((ncre[num][10] & -32768)) ncre[num][6] = ncre[num][6] + 4;
  if ((berscare > 0 || mask)) ncre[num][6] = -ncre[num][6];
  ncre[num][7] = Creature(typ, 3);
  if (typ === bush) {
    bushcolr = cRoll(3) * 3 + 6; if (bushcolr === 9) bushcolr = 1;
    ncre[num][7] = 66 + 1000 * bushcolr;
  }
  if (typ === roach) ncre[num][10] = roachdef;
  ncre[num][9] = imod(ppp, 10);
  if ((ncre[num][10] & 16384)) ncre[num][9] = ncre[num][9] - 10;
  if ((ncre[num][12] & 16384)) ncre[num][9] = ncre[num][9] + 10;
  await Awaken(num);
  if ((ncre[num][13] !== 0) && (grabbed > 0)) grabbed = grabbed - 1;
  ncre[num][13] = 0; ncre[num][14] = 0; ncre[num][15] = 0;

  switch (typ) {
    case robot:
      dic = cRoll(20) + 5; hts = rolldice(8, dic, dic);
      ncre[num][2] = hts; ncre[num][3] = hts;
      ncre[num][6] = cRoll(4) - 1; ncre[num][9] = cRoll(10) - 1;
      ncre[num][14] = (cRoll(5) + 1) + 10 * cRoll(3) + 100 * (cRoll(10) + 5);
      // str + 10*rng + 100*tohit
      break;
    case rdro:
      dic = cRoll(5); hts = rolldice(8, dic, dic);
      ncre[num][2] = hts; ncre[num][3] = hts;
      ncre[num][9] = cRoll(6);  // ac
      ncre[num][14] = (cRoll(2)) + 10 * cRoll(3) + 100 * (cRoll(10) + 9);
      break;
    case ddro:
      dic = cRoll(6) + 2; hts = rolldice(8, dic, dic);
      ncre[num][2] = hts; ncre[num][3] = hts;
      ncre[num][9] = cRoll(6) - 2; // ac
      ncre[num][14] = (cRoll(3)) + 10 * cRoll(3) + 100 * (cRoll(10) + 7);
      break;
    case sdro:
      dic = cRoll(8) + 3; hts = rolldice(8, dic, dic);
      ncre[num][2] = hts; ncre[num][3] = hts;
      ncre[num][9] = cRoll(7) - 4; // ac
      ncre[num][14] = (cRoll(5) + 2) + 10 * (cRoll(3) + 1) + 100 * (cRoll(10) + 5);
      break;
  }

  sy = imod(ncre[num][7], 1000);
  co = idiv(ncre[num][7], 1000);
  if (((pmut === 4 && berpmut === 0) || berdet > 0) && co === 0) co = 8;
  PutSym(sy, ncre[num][4] + localx, ncre[num][5] + localy, co, 0, 1);
}

function RemoveCreat(i) {
  EraseCreat(i);
  const x = ncre[i][4] + localx, y = ncre[i][5] + localy;
  let sym = imod(ncre[i][8], 1000);
  const fc = idiv(ncre[i][8], 1000);
  if (sym === secretdoor) sym = cen;
  if ((dark === 0) || (crd(ncre[i][4], ncre[i][5]) <= dark)) {
    if (SameRoom(ncre[i][4], ncre[i][5])) PutSym(sym, x, y, fc, 0, 1);
  }
  PutSym(sym, x, y, fc, 0, 2);
  for (let j = i; j <= nnear - 1; j++) {
    for (let j2 = 1; j2 <= 15; j2++) ncre[j][j2] = ncre[j + 1][j2];
  }
  nnear = nnear - 1;
  if (tentgrab > i) {
    tentgrab = tentgrab - 1;
  } else if (tentgrab === i) {
    tentgrab = 0;
  }
}

// Removes item i of the character (pak 0), backpack (1) or safe (2).
function RemoveGoody(i, pak) {
  let n = 0;
  keysave2 = FALSE;
  if (pak === 0) {
    if (goody[i][1] === -7) {
      switch (goody[i][11]) {
        case 1: flashlight = FALSE; break;
        case 3: gasmask = FALSE; break;
        case 10: mask = FALSE; break;
        case 11: boots = FALSE; break;
        case 13: ffgen = FALSE; break;
        case 37: uvhelmet = FALSE; break;
        case nssd + ntechwep + 2: sunglasses = FALSE; break;
      }
    } else if (goody[i][1] === -8) {
      switch (goody[i][11]) {
        case 1: radsuit = FALSE; break;
        case 2: heatsuit = FALSE; break;
        case 3: reflecsuit = FALSE; break;
        case 7: wetsuit = FALSE; break;
        case 18: camosuit = FALSE; break;
        case 19: pinsuit = FALSE; break;
        case 20: bulletsuit = FALSE; break;
        case 25: neutronsuit = FALSE; break;
        case 4: if (vehicle === 1) vehicle = 0; break;
        case 12: if (vehicle === 3) vehicle = 0; break;
        case 13: if (vehicle === 4) vehicle = 0; break;
        case 15: if (vehicle === 5) vehicle = 0; break;
        case 16: if (vehicle === 6) vehicle = 0; break;
        case 21: repulse = FALSE; break;
      }
    } else if (goody[i][1] === -9) {
      switch (goody[i][3]) {
        case 4: bsshoes = FALSE; break;
        case 5: spacesuit = FALSE; break;
        case 7: if (vehicle === 7) vehicle = 0; break;
        case 8: metshat = FALSE; break;
        case 9: mr = mr - 15; intl = intl + 15; str = str + 5; dex = dex + 5; break;
      }
    }
  }

  if (pak === 1) {
    n = npack - 1;
  } else if (pak === 2) {
    n = nsafe - 1;
  } else {
    n = ngoody - 1;
  }

  for (let j = i; j <= n; j++) {
    if (pak === 1) {
      bakpak[j] = bakpak[j + 1];
    } else if (pak === 2) {
      saf[j] = saf[j + 1];
    } else {
      gdy[j] = gdy[j + 1];
    }
    for (let k = 1; k <= 12; k++) {
      if (pak === 1) {
        backpack[j][k] = backpack[j + 1][k];
      } else if (pak === 2) {
        safe[j][k] = safe[j + 1][k];
      } else {
        goody[j][k] = goody[j + 1][k];
      }
    }
  }
  if (pak === 0) {
    for (let k = 1; k <= 12; k++) goody[ngoody][k] = 0;
  } else if (pak === 1) {
    for (let k = 1; k <= 12; k++) backpack[npack][k] = 0;
  } else if (pak === 2) {
    for (let k = 1; k <= 12; k++) safe[nsafe][k] = 0;
  }
  if (pak === 1) {
    npack = npack - 1;
  } else if (pak === 2) {
    nsafe = nsafe - 1;
  } else {
    ngoody = ngoody - 1;
  }

  SetCombatStats();
}

// Removes the item at (nx, ny) of the local map and (for dropped items)
// puts it into goody(ngoody + 1).  Returns [nx, ny, dropped].
function RemoveLocalGoody(nx, ny, dropped) {
  let locnum = 0;
  dropped = FALSE;
  rlge: {
    for (let i = 1; i <= 8; i++) {
      if (nx === localgoody[i][2] && ny === localgoody[i][3]) {
        if (incastle === 0) {
          if ((goodythere[mainx][mainy] & 2 ** (i - 1))) locnum = i;
        } else if (incastle === 1) {
          if ((goodycastle[0][0] & 2 ** (i - 1))) locnum = i;
        } else {
          if ((goodycastle[castle][castlelevel] & 2 ** (i - 1))) locnum = i;
        }
      }
    }
    if (locnum > 0) {
      for (let i = 1; i <= 3; i++) localgoody[locnum][i] = 0;
      if (incastle === 0) {
        goodythere[mainx][mainy] = cint(goodythere[mainx][mainy] - 2 ** (locnum - 1));
      } else if (incastle === 1) {
        goodycastle[0][0] = cint(goodycastle[0][0] - 2 ** (locnum - 1));
      } else {
        goodycastle[castle][castlelevel] = cint(goodycastle[castle][castlelevel] - 2 ** (locnum - 1));
      }
      break rlge;
    }

    // locnum is zero :
    for (let i = 1; i <= ndropped; i++) {
      if (mainx === drgoody[i][13] && mainy === drgoody[i][14] && nx === drgoody[i][15] && ny === drgoody[i][16]) { locnum = i; break; }
    }
    if (locnum === 0) {
      ClearMess();
      ljnk(40, 32, 22, 2); PrintMessage(12, 0);
      ngoody = ngoody - 1; break rlge;
    }

    dropped = TRUE;
    if (Math.abs(drgoody[locnum][1]) < 3) { ShiftDropped(locnum); break rlge; }
    for (let i = 1; i <= 12; i++) goody[ngoody + 1][i] = drgoody[locnum][i];
    gdy[ngoody + 1] = drgdy[locnum];
    ShiftDropped(locnum);
  }
  return [nx, ny, dropped];
}

function shnm$(i) {
  const place = 6 * (nwep + nrwep + i) - 5;
  st1 = itemName(place);
  if (incastle & qb(castle === 4)) st1 = jnk$(246, 63, 6) + st1;
  return st1;
}

function ssdnm$(i) {
  const place = 6 * (nwep + nrwep + nsh + narm + i) - 5;
  st1 = itemName(place);
  if (incastle & qb(castle === 4)) {
    switch (i) {
      case nssd + ntechwep + 13: break;
      case 10: case 19: case 27: case nssd + ntechwep + 1: case nssd + ntechwep + 6: break;
      default: st1 = jnk$(246, 63, 6) + st1;
    }
  }
  return st1;
}

function wepnm$(i) {
  st1 = itemName(6 * i - 5);
  if (incastle & qb(castle === 4)) st1 = jnk$(246, 63, 6) + st1;
  return st1;
}

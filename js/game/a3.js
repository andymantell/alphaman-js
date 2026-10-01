// Port of A3.BAS: protective suits, darkness, the end screen, the Grinch,
// lightning, moving, riding vehicles, teleporting, throwing and monoliths.
//
// Copyright (c) 1995 Jeffrey R. Olson (MIT license, see LICENSE)
'use strict';

// Damage reduction by suits (i is the damage kind).  Suits may be destroyed.
// Returns dam (the BASIC SUB's by-reference parameter).
async function DamSuit(i, dam) {
  let remnum = 0, yup = FALSE, lsdtyp_ = 0, nobrk = FALSE;
  switch (i) {
    case 0:    // kinetic
      if (bulletsuit) dam = cint(dam * 0.81);
      break;
    case 1:    // radiat
      if ((radsuit | spacesuit)) dam = cint(dam * 0.51);
      break;
    case 2:    // heat, cold
      if ((heatsuit | spacesuit)) dam = cint(dam * 0.51);
      break;
    case 3:    // laser
      if (sunglasses) dam = dam - 1;
      if ((reflecsuit | spacesuit)) dam = cint(dam * 0.51);
      if (sunscreen) { dam = cint(dam * 0.51); sunscreen = sunscreen - 1; }
      break;
    case 4:    // electr
      if (wetsuit) dam = cint(dam * 0.51);
      break;
    case 5:    // acid
      if (wetsuit) dam = cint(dam * 0.71);
      break;
  }

  remnum = 0; yup = FALSE;
  for (let j = 1; j <= ngoody; j++) {
    if (goody[j][1] === -8 && cRoll(300) === 1) {
      lsdtyp_ = goody[j][11];
      switch (lsdtyp_) {
        case 1: case 2: case 3: case 7: case 18: case 19: case 20:
          switch (i) {
            case 1: if (lsdtyp_ !== 1 && lsdtyp_ !== 19 && lsdtyp_ !== 7) yup = TRUE; break;  // rad
            case 2: if (lsdtyp_ !== 2 && lsdtyp_ !== 1) yup = TRUE; break;   // h/c
            case 3: if (lsdtyp_ !== 3 && lsdtyp_ !== 2) yup = TRUE; break;   // laser
            case 4: if (lsdtyp_ !== 7 && lsdtyp_ !== 18) yup = TRUE; break;  // elec
            case 5: yup = TRUE; break;                                        // acid
          }
          break;
      }
      if (yup) { remnum = j; break; }
    }
  }
  if (remnum > 0) {
    ClearMess();
    Ljnkbig(10, 61, 5, 207, 1, 19, gdy[remnum], 1, 1);
    for (let mmm = 1; mmm <= ngoody; mmm++) {
      if (Math.abs(goody[mmm][1]) === 7 && goody[mmm][11] === 16 && goody[mmm][3] > 0) {
        if (cRoll(10) < 9) { ljnk(123, 13, 33, 2); nobrk = TRUE; }
      }
    }
    if (not(nobrk)) { l2 = string$(32, 88); RemoveGoody(remnum, FALSE); }
    await MessPause(11, 0);
  }
  return dam;
}

// Updates the lit area when moving from localx to localx + dx, etc.
// (only works if |dx| <= 1, |dy| <= 1)
function DarkMove(dx, dy) {
  let delx = 0, dely = 0, x = 0, y = 0, sym = 0, fc = 0, bc = 0, sym9 = 0, fc9 = 0, bc9 = 0;
  let ch = 0, sym1 = 0, fc1 = 0, bc1 = 0, fc2 = 0;
  const offdm = () => {
    x = localx + delx; y = localy + dely;
    if (x < 2 || x > 51 || y < 2 || y > 21) return;
    [sym, fc, bc] = GetSym(x, y, 1);
    switch (sym) {
      case 15: case 42: case 176: case 177: case 249: case 250:
        PutSym(32, x, y, 7, 0, 1); break;
      case 126: case 247:
        if (dark >= 0) PutSym(32, x, y, 7, 0, 1);
        break;
      default:
        if ((sym >= 65 && sym <= 90) || (sym >= 97 && sym <= 122)) PutSym(32, x, y, 7, 0, 1);
    }
  };
  const ondm = () => {
    x = localx + delx; y = localy + dely;
    if (x < 2 || x > 51 || y < 2 || y > 21) return;
    if (SameRoom(delx, dely)) {
      [sym, fc, bc] = GetSym(x, y, 2); [sym9, fc9, bc9] = GetSym(x, y, 1);
      switch (sym) {
        case trap: case pit: case gas: case 215: case 216:
          if (sym9 !== trap && sym9 !== pit && sym9 !== gas && sym9 !== 215 && sym9 !== 216) {
            sym = 250; fc = 8 + 2 * qb(incastle === 0); bc = 0;
          } else sym = sym9;
          break;
        case secretdoor:
          [sym1, fc1, bc1] = GetSym(x + 1, y, 2);
          if (fc1 === wallcolr) sym = hor; else sym = ver;
          break;
        case um: case lm: case ml: case mrt:
          savecorn = savecorn + 1; sym = sym9; fc = wallcolr;
          savcrn[savecorn][1] = x; savcrn[savecorn][2] = y;
          break;
        case cen:
          [sym1, fc1, bc] = GetSym(x + 1, y, 2);
          [sym1, fc2, bc] = GetSym(x, y + 1, 2);
          if (fc1 === wallcolr && fc2 === wallcolr) {
            savecorn = savecorn + 1; sym = sym9; fc = wallcolr;
            savcrn[savecorn][1] = x; savcrn[savecorn][2] = y;
          }
          break;
        default:
          if ((sym >= 65 && sym <= 90) || (sym >= 97 && sym <= 122)) {
            ch = badmovecreat(delx, dely, nnear, 0, ncre);
            if (ch === 0) {
              sym = 250; fc = 8 + 2 * qb(incastle === 0); bc = 0;
            } else {
              sym1 = imod(ncre[ch][8], 1000); fc1 = idiv(ncre[ch][8], 1000); bc1 = 0;
              if (sym1 === secretdoor) {
                [sym1, fc2, bc1] = GetSym(x + 1, y, 2);
                if (fc2 === wallcolr) sym = hor; else sym = ver;
              }
              if (fc1 === wallcolr) {
                savecorn = savecorn + 1; sym = sym9; fc = wallcolr; bc = 0;
                savcrn[savecorn][1] = x; savcrn[savecorn][2] = y;
              }
            }
            if (fc === 0 && incastle) { sym = sym9; fc = fc9; bc = bc9; }
          }
      }
      PutSym(sym, x, y, fc, bc, 1);
    }
  };

  if (dark === -1) {
    delx = 0; dely = 0; offdm();
  } else if (dark > 0) {
    if (incastle !== 1) {
      if (dx) {
        delx = -dark * dx;
        for (dely = -dark; dely <= dark; dely++) offdm();
      }
      if (dy) {
        dely = -dark * dy;
        for (delx = -dark; delx <= dark; delx++) offdm();
      }
    }

    localx = localx + dx; localy = localy + dy;
    if (incastle) {
      if (incastle === -1) savecorn = 0;
      for (dely = -dark; dely <= dark; dely++) {
        for (delx = -dark; delx <= dark; delx++) ondm();
      }
      if (incastle === -1) DotCorn();
    } else {
      if (dx) {
        delx = dark * dx;
        for (dely = -dark; dely <= dark; dely++) ondm();
      }
      if (dy) {
        dely = dark * dy;
        for (delx = -dark; delx <= dark; delx++) ondm();
      }
    }
    localx = localx - dx; localy = localy - dy;
  }
}

// The closing screens (number 1: quit/died, 0: won).
async function EndScreen(number) {
  let c = 0;
  screenPages(3, vpage); ccls(3);
  // OPEN "alphaman.6" FOR BINARY AS #2
  for (let num = 195 + number; num <= 210; num++) {
    st1 = AM6[num];
    if (num === 195) c = 13;
    else if (num >= 196 && num <= 199) c = 5;
    else if (num >= 200 && num <= 204) c = 3;
    else if (num === 205) c = 11;
    else if (num === 210) c = 10;
    else c = 9;
    color(c);
    locate(num - 193 - qb(num > 195) - 2 * qb(num > 199) - 2 * qb(num > 205) - 2 * qb(num > 209), 4 - 3 * qb(num === 195));
    print(st1);
  }
  box(2, 79, 1 + number * 2, 8, 1, 5, 3);
  box(2, 79, 9, 16, 1, 3, 3);
  box(2, 79, 17, 22, 1, 1, 3);
  box(20, 61, 23, 25, 1, 2, 3);
  screenPages(3);

  await PauseForKey(); screenPages(vpage);
}

// The Grinch is defeated (beast TRUE: fed the roast beast) or killed.
async function GotGrinch(beast) {
  let a = 0, c = 0, d = 0, f = 0, newlev = 0, b$ = '', extrapoints$ = '', timedone$ = '';
  if (beast) {
    a = 408; c = 52; d = 409; f = 53; notoxin = -1;
    finishedcastles = finishedcastles | 32;
  } else {
    a = 410; c = 36; d = 414; f = 48; notoxin = 1;
  }
  ljnk(a, 1, c, 1); ljnk(d, 1, f, 2); l3 = ''; await MessPause(12, 0); ClearMess();
  if (beast) {
    expr = expr + grinchstole + 40000 + 6 * clng(10800 - gt);
    [newlev, b$] = await Level(newlev, b$); await DisplayCharacter();
    if (newlev) { ClearMess(); Ljnkbig(14, 26, 17, 0, 0, 0, str$(lvl), 1, 1); await MessPause(10, 0); }
    grinchstole = 0;
    extrapoints$ = ltrim$(str$(6 * clng(10800 - gt)));
    timedone$ = ltrim$(str$(cint(gt / 60) - 8));
    Ljnkbig(395, 1, 48, 0, 0, 0, extrapoints$, 1, 1);
    Ljnkbig(396, 1, 24, 396, 24, 6, timedone$, 1, 2);
    await MessPause(13, 0); ClearMess();

    await EndScreen(0); ClearMess();
    ljnk(407, 27, 40, 2); PrintMessage(13, 0); await PauseForKey(); ClearMess();
    if (ucase$(st1) === 'Y') {
      ljnk(416, 1, 32, 2); await MessPause(14, 0); st1 = jnk$(406, 53, 10); await Dead(3);
    } else {
      PrintMessage(14, 0);
    }
  } else {
    expr = expr + 5000; ClearMess(); [newlev, b$] = await Level(newlev, b$); await DisplayCharacter();
    if (newlev) { Ljnkbig(14, 26, 17, 0, 0, 0, str$(lvl), 1, 1); await MessPause(10, 0); }
  }
  for (let i = nnear; i >= 1; i--) {
    ncre[i][11] = ncre[i][11] & ~1;
    if ((ncre[i][1] === gdog) || (ncre[i][1] === grinch)) RemoveCreat(i);
  }
}

// A lightning strike on the local map.
async function Lightning() {
  let xlight = 0, ylight = 0, sym = 0, fc = 0, bc = 0, fc2 = 0, ch = 0, dropped = 0;
  let d = 0, siz = 0, num = 0, damg = 0;
  const isAlpha = (s) => (s >= 65 && s <= 90) || (s >= 97 && s <= 122);
  screenPages(1); vpage = 1;
  for (;;) {   // looplight:
    xlight = cRoll(50) + 1; ylight = cRoll(20) + 1; ClearMess();
    [sym, fc, bc] = GetSym(xlight, ylight, 2); fc2 = fc;
    switch (sym) {
      case 1:                                                      // player, critters
      case 15: case 42: case 10: case 19: case 215: case 216:       // flora, traps, webs
      case 22: case 254: case 24: case 8: case 9: case 5: case 236: case 11: case 12: case 21: case 157:  // items
      case 147: case 167: case 18: case 29: case 145: case 234: case 225: case 35:  // special items
        break;
      default:
        if (isAlpha(sym)) break;
        continue;
    }
    break;
  }

  if (fc === 3) fc2 = 11;
  PutSym(sym, xlight, ylight, fc2, 3, 1);
  ljnk(161, 57, 10, 2); await MessPause(11, 0);
  switch (sym) {
    case 1: PutSym(sym, xlight, ylight, fc, bc, 1); break;     // player
    case 15: case 42:                                          // flora
      if (bc === 4) goodythere[mainx][mainy] = goodythere[mainx][mainy] & ~256;
      PutSym(32, xlight, ylight, 7, 0, -1);
      break;
    case 22: case 254: case 24: case 8: case 9: case 5: case 236: case 11: case 12: case 21: case 157:
    case 147: case 167: case 18: case 29: case 145: case 234: case 225: case 35:
      [xlight, ylight, dropped] = RemoveLocalGoody(xlight, ylight, dropped);
      PutSym(32, xlight, ylight, 7, 0, -1);
      break;
    case 215: case 216: case trap: case pit: PutSym(32, xlight, ylight, 7, 0, 1); break;   // webs, etc
    default:
      if (isAlpha(sym)) {                                      // critters
        ch = badmovecreat(xlight - localx, ylight - localy, nnear, 0, ncre);
        if ((ncre[ch][10] & 4) === 0) {
          ncre[ch][2] = ncre[ch][2] - rolldice(8, lvl + 2, lvl + 2);
          if (ncre[ch][2] < 0) ncre[ch][2] = -2000;   // sign to remove
        }
        PutSym(32, xlight, ylight, 7, 0, -1);
      }
  }

  d = crd(xlight - localx, ylight - localy);
  switch (d) {
    case 0: siz = 8; num = lvl + 2; break;
    case 1: siz = 5; num = lvl + 1; break;
    case 2: siz = 4; num = cint((lvl + 1) / 2); break;
    default: siz = 0;
  }
  if (siz > 0) {
    if (num < 1) num = 1;
    damg = rolldice(siz, cint(num * 1.5), num); if (wetsuit) damg = cint(damg * 0.51);
    hits = hits - damg; ShowHits();
    if (hits < 0) { st1 = jnk$(162, 1, 25); await Dead(0); }
  }

  for (let i = nnear; i >= 1; i--) {
    if (ncre[i][2] < -999) RemoveCreat(i);
  }
}

// Reveals the whole level (tricorder, TV).
function MapLevel() {
  let ss = 0, fc = 0, bc = 0, sym = 0;
  if (incastle === -1) {
    for (let ll1 = lwall; ll1 <= rwall; ll1++) {
      for (let ll2 = twall; ll2 <= bwall; ll2++) {
        [ss, fc, bc] = GetSym(ll1, ll2, 2); if (ss === secretdoor) ss = cen;
        PutSym(ss, ll1, ll2, fc, bc, -1);
      }
    }
  } else {    // include incastle=0 for webs, traps
    for (let ll1 = 2; ll1 <= 51; ll1++) {
      for (let ll2 = 2; ll2 <= 21; ll2++) {
        [ss, fc, bc] = GetSym(ll1, ll2, 2); if (ss === secretdoor) ss = cen;
        PutSym(ss, ll1, ll2, fc, bc, -1);
      }
    }
  }
  for (let ll1 = 1; ll1 <= nnear; ll1++) {
    if (localx + ncre[ll1][4] > 0 && localx + ncre[ll1][4] < 52) {
      if (localy + ncre[ll1][5] > 0 && localy + ncre[ll1][5] < 22) {
        sym = imod(ncre[ll1][7], 1000); fc = idiv(ncre[ll1][7], 1000); bc = 0;
        if (fc === 0) { fc = 8; bc = 8; }
        PutSym(sym, localx + ncre[ll1][4], localy + ncre[ll1][5], fc, bc, 1);
      }
    }
  }
  vpage = 1; screenPages(1);
}

// Moves the player one square (num is the key code).  Returns num, which is
// set to 1070 if doing a trap in the main loop is okay.
async function Move(num) {
  let chan = 0, bootsadd = 0, a = 0, b = 0, c = 0, dx = 0, dy = 0, newx = 0, newy = 0;
  let sym = 0, fc = 0, bc = 0, sym1 = 0, fc1 = 0, bc1 = 0, dmx = 0, dmy = 0, firstlocal = FALSE;
  let okay = 0, dropped = 0, typ = 0, numb = 0, numb1 = 0, dir = 0, symm = 0, sy = 0;
  let fc21 = 0, fc22 = 0, fc23 = 0, fc24 = 0, bc21 = 0, ddx = 0, ddy = 0, cx = 0, cy = 0, t = 0;
  let zz = 0, xweb = 0, yweb = 0, dic = 0, dam = 0, numbr = 0, xb = 0, yb = 0, sb = 0, fb = 0, bb = 0;

  const bertree = async () => {
    zz = cRoll(90) + lvl;
    if (zz > 80) {
      goodythere[mainx][mainy] = goodythere[mainx][mainy] & ~256;
      Ljnkbig(238, 52, 13, 238, 38, 14, bl, 2, 1);
      PutSym(32, newx, newy, 7, 0, -1);
      typ = cRoll(nberry);
      numbr = 2 + cRoll(2); if (sym === 15) numbr = numbr + cRoll(3);
      for (let bbb = 1; bbb <= numbr; bbb++) {
        for (;;) {   // retryber:
          xb = newx + cRoll(3) - 2;
          yb = newy + cRoll(3) - 2;
          [sb, fb, bb] = GetSym(xb, yb, 2);
          switch (sb) {
            case 32: case 249: case 250: case 176:
              PutSym(5, xb, yb, 12, 0, -1);
              AddToDrop(-typ); drgoody[1][15] = xb; drgoody[1][16] = yb;
              break;
            default:
              if (cRoll(5) !== 1) continue;
          }
          break;
        }
      }
    } else {
      ljnk(238, 31, 21, 1); ljnk(239, 1, 24, 2);
      dam = rolldice(lvl - 4 * qb(sym === 15), 2, 1);
      if (int(rnd() * 2)) dam = 1;
      hits = hits - dam;
      if (hits < 0) { await MessPause(12, 0); st1 = 'a' + jnk$(239, 4, 10); await Dead(0); }
    }
    await MaybeMessPause(10, 0);
  };
  const movething = () => {
    [newx, newy, dropped] = RemoveLocalGoody(newx, newy, dropped); ngoody = ngoody + 1;
    if (incastle) {
      PutSym(250, newx, newy, 8, 0, -1);
    } else {
      PutSym(32, newx, newy, 7, 0, -1);
    }
    fatig = Fatigu();
  };

  mve: {
    if (inpit | inweb | inglue | inbog | insand) {
      ClearMess();
      if (inpit) {
        chan = Math.fround((str + stradd + dex + dexadd) / 200); bootsadd = 3; a = -2; b = 64; c = 3;
      } else if (inbog) {
        chan = Math.fround((str + stradd + dex + dexadd) / 200); bootsadd = 1; a = 378; b = 61; c = 6;
      } else if (insand) {
        chan = Math.fround((str + stradd) / 100); bootsadd = 1; a = 384; b = 39; c = 9;
      } else if (inglue) {
        chan = Math.fround((str + stradd) / 150); bootsadd = 2; a = 163; b = 58; c = 4;
      } else {
        chan = Math.fround((str + stradd) / 70); bootsadd = 0; a = 160; b = 55; c = 3;
      }
      if (chan < 0.03) chan = Math.fround(0.03);
      st1 = jnk$(a, b, c);
      if (rnd() > chan - qb(boots !== 0) * bootsadd / 3) {
        Ljnkbig(84, 38, 25, 0, 0, 0, st1 + '!', 1, 1); await MessPause(10, 0);
        fatadd = 5; if (fatadd < 1.5 * fatig) fatadd = 1.5 * fatig;
        break mve;
      } else {
        inpit = FALSE; inweb = FALSE; inglue = FALSE; inbog = FALSE; insand = FALSE;
        Ljnkbig(58, 1, 23, 0, 0, 0, st1, 1, 1); await MessPause(7, 0);
      }
    }

    if (inwater) {
      ClearMess();
      if (not(wetsuit) && cRoll(50) < (dex + dexadd)) {
        ljnk(84, 38, 31, 1); await MessPause(11, 0);
        fatadd = 15; if (fatadd < 3 * fatig) fatadd = 3 * fatig;
        break mve;
      } else {
        inwater = FALSE; waterturns = 0;
        ljnk(58, 1, 29, 1); ljnk(58, 30, 35, 2); await MessPause(14, 0);
      }
    }

    vpage = 1; dx = 0; dy = 0;
    switch (num) {
      case 1071: dx = -1; dy = -1; break;   // home
      case 1072: dy = -1; break;            // up
      case 1073: dx = 1; dy = -1; break;    // PgUp
      case 1075: dx = -1; break;            // left
      case 1077: dx = 1; break;             // right
      case 1079: dx = -1; dy = 1; break;    // end
      case 1080: dy = 1; break;             // down
      case 1081: dx = 1; dy = 1; break;     // PgDn
    }
    if (attractx | attracty) {
      dx = attractx; dy = attracty; attractx = 0; attracty = 0; DumpBuffer();
    }
    newx = localx + dx; newy = localy + dy;

    [sym, fc, bc] = GetSym(newx, newy, 2);
    [sym1, fc1, bc1] = GetSym(newx, newy, 1);

    if ((sym > 64 && sym < 91) || (sym > 96 && sym < 123)) {
      await AttackCreat(dx, dy); num = 1070; break mve;
    }

    if (repulse) { ClearMess(); ljnk(124, 14, 45, 1); await MessPause(14, 0); break mve; }

    if (grabbed) {
      ClearMess();
      ljnk(240, 9, 26, 1); ljnk(240, 35, 29, 2); PrintMessage(10, 0);
      didstuff = FALSE; ClearMess(); DumpBuffer(); break mve;
    }

    if (newx < 2) {
      newx = 51; dmx = -1; firstlocal = TRUE;
    } else if (newx > 51) {
      newx = 2; dmx = 1; firstlocal = TRUE;
    }
    if (newy < 2) {
      newy = 21; dmy = -1; firstlocal = TRUE;
    } else if (newy > 21) {
      newy = 2; dmy = 1; firstlocal = TRUE;
    }
    if (firstlocal) {
      DumpBuffer();
      okay = qb(mainx + dmx < 52 && mainx + dmx > 1 && mainy + dmy > 1 && mainy + dmy < 22);
      if (okay) {    // to change main screens
        for (let i = 1; i <= nnear; i++) { ncre[i][4] = ncre[i][4] - dx; ncre[i][5] = ncre[i][5] - dy; }
        localx = newx; localy = newy; MoveMain(dmx, dmy);
        if (terrain === 247) {            // If in h2o,
          for (let i = nnear; i >= 1; i--) {     // remove landlubbers
            if ((ncre[i][1] <= ncreat + creextra - creh2o) || (ncre[i][1] > ncreat + creextra)) RemoveCreat(i);
          }
        } else {                             // not in h2o
          for (let i = nnear; i >= 1; i--) {     // remove sea critters
            if ((ncre[i][1] > ncreat + creextra - creh2o) && (ncre[i][1] <= ncreat + creextra)) RemoveCreat(i);
          }
        }
        await DetailedMap(FALSE);
        firstlocal = FALSE;
        screenPages(1); vpage = 1; ClearMess(); await DisplayCharacter();
        ljnk(59, 1, 13, 4); PrintMessage(7, 0); break mve;
      } else {
        didstuff = FALSE; ClearMess();
        ljnk(59, 14, 36, 2); PrintMessage(12, 0); break mve;
      }
    }
    dropped = FALSE; fatadd = fatig;
    let noroom = false;
    switch (sym) {      // sym is from screen 2;  sym1 is from screen 1
      case 32: case 250:
        break;
      case 15:      // tree
        num = 1070; DumpBuffer();
        fatadd = 8 + fatadd;
        if (bc === 4 || bc === 12) {
          await bertree();
        } else {
          if (rnd() < 0.5) {
            if (dark < 0) PutSym(15, newx, newy, fc, bc, 1);
            break mve;
          }
          if (fc < 8) {
            PutSym(42, newx, newy, fc + 8, 0, -1);
          } else {
            PutSym(15, newx, newy, fc - 8, 0, -1);
          }
        }
        break mve;
      case 42:      // bush
        num = 1070; fatadd = 5 + fatadd; DumpBuffer();
        if (bc === 4 || bc === 12) {
          await bertree();
        } else {
          if (rnd() < 0.5) {
            if (dark < 0) PutSym(42, newx, newy, fc, bc, 1);
            break mve;
          }
          if (fc < 8) {
            PutSym(32, newx, newy, fc, 0, -1);
          } else {
            PutSym(42, newx, newy, fc - 8, 0, -1);
          }
        }
        break mve;
      case 176:     // marsh
        fatadd = fatadd + 4;
        break;
      case 247: case 126:    // water
        DumpBuffer();
        if (wetsuit) {
          fatadd = fatadd + 3;
        } else {
          fatadd = 15; if (fatadd < 3 * fatig) fatadd = 3 * fatig;
          l1 = bl; ljnk(59, 50, 16, 2); ljnk(60, 1, 44, 3);
          PrintMessage(9, 0); inwater = TRUE;
        }
        break;
      case 22:      // spam
        DumpBuffer();
        if (ngoody === 20 && Math.abs(goody[1][1]) !== 1) { noroom = true; break; }
        fatadd = fatadd + 1; movething(); ngoody = ngoody - 1; AddSpam();
        SortGoody();
        break;
      case 254:     // beef
        DumpBuffer();
        if (ngoody === 20 && Math.abs(goody[1][1]) !== 2 && Math.abs(goody[2][1]) !== 2) { noroom = true; break; }
        fatadd = fatadd + 1; movething(); ngoody = ngoody - 1; AddBeef();
        SortGoody();
        break;
      case 24:      // wep
        DumpBuffer();
        if (ngoody === 20) { noroom = true; break; }
        fatadd = fatadd + 2; movething(); DetermineWep(dropped);
        SortGoody();
        break;
      case 8:      // armor
        DumpBuffer();
        if (ngoody === 20) { noroom = true; break; }
        fatadd = fatadd + 3; movething(); DetermineArmor(dropped);
        SortGoody();
        break;
      case 9:      // shield
        DumpBuffer();
        if (ngoody === 20) { noroom = true; break; }
        fatadd = fatadd + 2; movething(); DetermineShield(dropped);
        SortGoody();
        break;
      case 5: case 236:  // berry
        DumpBuffer();
        if (ngoody === 20) { noroom = true; break; }
        fatadd = fatadd + 1; movething(); DetermineBerry(dropped);
        SortGoody();
        break;
      case 11: case 12:  // ssd
        DumpBuffer();
        if (ngoody === 20) { noroom = true; break; }
        fatadd = fatadd + 2; movething(); DetermineSsd(dropped);
        SortGoody();
        break;
      case 21: case 157: // lsd
        DumpBuffer();
        if (ngoody === 20) { noroom = true; break; }
        fatadd = fatadd + 4; movething(); DetermineLsd(dropped);
        SortGoody();
        break;
      case 128: case 135:   // tech parts
        DumpBuffer();
        if (ngoody === 20) { noroom = true; break; }
        fatadd = fatadd + 4; movething(); DetermineParts(dropped);
        SortGoody();
        break;
      case 147: case 167: case 18: case 29: case 145: case 234: case 225: case 35:
        //  hat,serum,  map, shoes,suit,rbeast,braft
        DumpBuffer();
        if (ngoody === 20) { noroom = true; break; }
        fatadd = fatadd + 2; movething(); dropped = 1;
        switch (sym) {
          case 147:
            switch (fc) {
              case 1: typ = 8; break;             // mets hat
              case 15: typ = 1; break;            // skipper hat
              default: typ = 9;                   // Ivana wig
            }
            break;
          case 167: typ = 2; break;         // serum
          case 18: case 29: typ = 3;             // map
            finishedcastles = finishedcastles | 2;
            break;
          case 145: dropped = 2; typ = 4; break;  // bsshoes
          case 234: dropped = 10; typ = 5; break; // spacesuit
          case 225: typ = 6; break;                // rbeast
          case 35: dropped = 15; typ = 7; break;   // bamboo raft
        }
        typ = DetermineSpecial(dropped, typ);   // actually, dropped=mass
        SortGoody();
        break;
      case hor: case ver: case ur: case ul: case lr: case ll:
        if (dark < 0) PutSym(sym, newx, newy, wallcolr, 0, 1);
        didstuff = FALSE; break mve;
      case 219:     //  rubble
        PutSym(219, newx, newy, wallcolr, 0, 1); didstuff = FALSE; break mve;
      case um: case mrt: case ml: case lm:
        if (dark < 0) {
          switch (sym) {
            case um: numb = 11; break;
            case mrt: numb = 13; break;
            case ml: numb = 14; break;
            case lm: numb = 7; break;
          }
          if ((currsym === cen) && (dx * dy === 0)) numb = 3 - 9 * qb(dy !== 0);
          switch (sym1) {
            case hor: numb1 = 3; break;
            case ver: numb1 = 12; break;
            case ul: numb1 = 10; break;
            case ur: numb1 = 9; break;
            case ll: numb1 = 6; break;
            case lr: numb1 = 5; break;
            case um: numb1 = 11; break;
            case mrt: numb1 = 13; break;
            case ml: numb1 = 14; break;
            case lm: numb1 = 7; break;
            default: numb1 = 0;
          }
          dir = 0;
          if ((dx === -1)) dir = dir | 1;
          if ((dx === 1)) dir = dir | 2;
          if ((dy === -1)) dir = dir | 4;
          if ((dy === 1)) dir = dir | 8;
          fc = wallcolr;
          if (dir === 1 || dir === 2) {
            numb = 12;
          } else if (dir === 4 || dir === 8) {
            numb = 3;
          } else if (((dir & numb) === 1) || ((dir & numb) === 2) || ((dir & numb) === 4) || ((dir & numb) === 8)) {
            numb = numb & ~dir;
          } else if ((numb & 3) === 3) {
            numb = 3;
          } else if ((numb & 12) === 12) {
            numb = 12;
          }
          numb = numb | numb1;
          switch (numb) {
            case 3: sym = hor; break;
            case 12: sym = ver; break;
            case 10: sym = ul; break;
            case 9: sym = ur; break;
            case 6: sym = ll; break;
            case 5: sym = lr; break;
          }
          PutSym(sym, newx, newy, fc, 0, 1);
        }
        didstuff = FALSE; break mve;
      case secretdoor:
        if (dark < 0) {
          [symm, fc, bc] = GetSym(newx + 1, newy, 2);
          if (fc === wallcolr) symm = hor; else symm = ver;
          PutSym(symm, newx, newy, wallcolr, 0, 1);
        }
        didstuff = FALSE; break mve;
      case cen:
        DumpBuffer();
        if (incastle) {
          [sy, fc21, bc21] = GetSym(newx + 1, newy, 2);
          if (sy === 1) fc21 = currf;
          [sy, fc22, bc21] = GetSym(newx, newy + 1, 2);
          if (sy === 1) fc22 = currf;
          [sy, fc23, bc21] = GetSym(newx, newy - 1, 2);
          if (sy === 1) fc23 = currf;
          [sy, fc24, bc21] = GetSym(newx - 1, newy, 2);
          if (sy === 1) fc22 = currf;
          if ((fc21 === 9 && (fc22 === 9 || fc23 === 9)) || (fc24 === 9 && (fc22 === 9 || fc23 === 9))) {
            if (dark < 0) {
              switch (dx + 10 * dy) {
                case -11: PutSym(ul, newx, newy, wallcolr, 0, 1); break;
                case -9: PutSym(ur, newx, newy, wallcolr, 0, 1); break;
                case 9: PutSym(ll, newx, newy, wallcolr, 0, 1); break;
                case 11: PutSym(lr, newx, newy, wallcolr, 0, 1); break;
              }
            }
            didstuff = FALSE; break mve;
          }
        }
        if (incastle === 0) {
          for (let kl = 1; kl <= ngoody; kl++) {
            if (Math.abs(goody[kl][1]) === 8) {
              typ = goody[kl][11];
              if (typ === 4 || typ === 10 || typ === 12) {
                ClearMess();
                Ljnkbig(10, 61, 5, 231, 41, 27, gdy[kl], 1, 2);
                await MessPause(11, 0); break mve;
              }
            }
          }
          SaveMaps(0); await EnterCastle();
          newx = localx; newy = localy; await DrawDungeon(); dx = 0; dy = 0;
          KillBadMaps(1);
        } else {
          if (newx <= lwall || newx >= rwall || newy <= twall || newy >= bwall) {
            SaveMaps(-1); await LeaveCastle();
            newx = localx; newy = localy; dx = 0; dy = 0;
            await DetailedMap(TRUE); await DisplayCharacter();
          } else {
            if (dark === 0) {
              if (fc21 === wallcolr) { ddx = 0; ddy = dy; } else { ddy = 0; ddx = dx; }
              cx = newx + ddx; cy = newy + ddy;
              t = newx; newx = localx; localx = t; t = newy; newy = localy; localy = t;
              for (let i = 1; i <= nnear; i++) {
                ncre[i][4] = ncre[i][4] - dx; ncre[i][5] = ncre[i][5] - dy;
                if (SameRoom(ncre[i][4], ncre[i][5])) {
                  crtyp = ncre[i][1];
                  if (rnd() < 0.9 + qb(crtyp === elvis || crtyp === elvimp || crtyp === gill || crtyp === puff)) await Awaken(i);
                }
              }
              savecorn = 0; DotIt(cx, cy); DotCorn();
              for (let i = 1; i <= nnear; i++) {
                ncre[i][4] = ncre[i][4] + dx; ncre[i][5] = ncre[i][5] + dy;
              }
              t = newx; newx = localx; localx = t; t = newy; newy = localy; localy = t;
            } else {
              t = localx; localx = newx; newx = t; t = localy; localy = newy; newy = t;
              if (dark < 0) {
                PutSym(cen, localx, localy, fc, bc, 1);
              } else {
                ChangeDark();
              }
              for (let i = 1; i <= nnear; i++) {
                ncre[i][4] = ncre[i][4] - dx; ncre[i][5] = ncre[i][5] - dy;
                if (SameRoom(ncre[i][4], ncre[i][5])) {
                  if (rnd() < 0.9 + qb(ncre[i][1] === elvis || ncre[i][1] === elvimp || ncre[i][1] === gill)) await Awaken(i);
                }
                ncre[i][4] = ncre[i][4] + dx; ncre[i][5] = ncre[i][5] + dy;
              }
              t = localx; localx = newx; newx = t; t = localy; localy = newy; newy = t;
            }
          }
        }
        break;
      case lockeddoor:
        if (dark < 0) PutSym(lockeddoor, newx, newy, wallcolr, 0, 1);
        num = 1070; DumpBuffer();
        fatadd = fatadd + 2;
        zz = cint(lvl + (str + stradd + dex + dexadd) / 2 + intl / 3);
        if (zz < 6) zz = 7; else if (zz > 50) zz = 50;
        if (berscience) zz = 120;
        if ((mmut === 2 && bermmut === 0)) zz = zz * (2 - 2 * qb(berhmmut > 0));
        if (incastle === 0 && castle === 6) zz = -1;
        if (cRoll(120) < zz) PutSym(cen, newx, newy, wallcolr, 0, -1);
        break mve;
      case 240:  // stairs
        if (dark < 0) PutSym(240, newx, newy, fc, 0, 1);
        DumpBuffer();
        ClearMess();
        if (fc === 13) { b = 45; c = 9; } else { b = 54; c = 11; }
        if (incastle !== -1) { b = 65; c = 4; }
        ljnk(60, b, c, 1); PrintMessage(fc, 0);
        break;
      case pit:
        PutSym(pit, newx, newy, fc, 0, 1);
        if (not(boots)) { fc = await Pitt(fc); fatadd = fatadd + 3; }
        break;
      case trap:
        if (fc === 10) {
          PutSym(gas, newx, newy, 8, 0, -1);
        } else {
          PutSym(trap, newx, newy, fc, 0, 1);
        }
        fc = await Trapp(fc); fatadd = fatadd + 2;
        if (fc < 0) { newx = localx; newy = localy; dx = 0; dy = 0; }  // telep
        break;
      case 215: case 216:   // webs
        fatadd = fatadd + 3;
        PutSym(sym, newx, newy, 8, 0, 1);
        inweb = TRUE; ClearMess(); ljnk(161, 34, 23, 2); await MessPause(7, 0);
        PutSym(currsym, localx, localy, currf, currb, -1);
        crtyp = webspid; xweb = newx; yweb = newy;
        MakeCreature((xweb), (yweb), FALSE, FALSE);
        await Awaken(nnear); EraseCreat(nnear); PutCreat(nnear);
        break;
      case 1: PutSym(250, newx, newy, 8, 0, -1); didstuff = FALSE; break mve;
      case gas:
        PutSym(gas, newx, newy, 8, 0, 1); fatadd = fatadd + 4; DumpBuffer();
        dic = cint((20 - con) / 3 + lvl / 2); if (dic < 1) dic = 1;
        dam = rolldice(4, dic, dic); ClearMess(); ljnk(157, 34, 19, 2);
        if ((pmut === 7 && berpmut === 0)) dam = cint((dam + 1) / (2 - 2 * qb(berhpmut > 0)));
        if (gasmask | spacesuit) { dam = 0; l2 = bl; } else hits = hits - dam;
        if (hits < 0) { await MessPause(8, 0); st1 = jnk$(157, 53, 10); await Dead(0); break mve; }
        PrintMessage(8, 0);
        break;
      case monosym: ljnk(160, 58, 8, 1); ljnk(406, 37, 16, 2); PrintMessage(11, 0); break;
      case chasm: if (not(bsshoes)) { hits = -hitmax - 999; st1 = jnk$(336, 51, 18); await Dead(0); } break;
    }

    if (noroom) {
      ClearMess(); ljnk(57, 25, 29, 2);
      PrintMessage(7, 0); fatadd = 0;
    }
    // mv:
    PutSym(currsym, localx, localy, currf, currb, -1);
    if (dark) DarkMove(dx, dy);
    localx = newx; localy = newy;
    [currsym, currf, currb] = GetSym(localx, localy, 2);
    if (invisible) fc = 8; else fc = 15;
    PutSym(1, localx, localy, fc, 0, -1);
    for (let i = 1; i <= nnear; i++) {
      ncre[i][4] = ncre[i][4] - dx; ncre[i][5] = ncre[i][5] - dy;
    }
    tentgrab = 0;
  }
  // mve:
  return num;
}

// Moves up to dis squares with a vehicle.  Returns [num, dis].
async function Ride(num, dis) {
  let dx = 0, dy = 0, braft = 0, newx = 0, newy = 0, sym = 0, fc = 0, bc = 0, dmx = 0, dmy = 0;
  let firstlocal = FALSE, okay = FALSE, dropped = 0, dic = 0, dam = 0, ffkill = FALSE, a = 0, b = 0, c = 0;
  dis = cint(dis);
  inpit = FALSE; inweb = FALSE; inglue = FALSE; inbog = FALSE; insand = FALSE;

  if (inwater) {
    ClearMess();
    if (not(wetsuit) && rnd() < 1 - dex / 50) {
      fatadd = 15; if (fatadd < 3 * fatig) fatadd = 3 * fatig;
      ljnk(84, 38, 31, 1); await MessPause(11, 0); return [num, dis];
    } else {
      inwater = FALSE; waterturns = 0;
      ljnk(58, 1, 29, 1); ljnk(58, 30, 35, 2); await MessPause(14, 0);
    }
  }

  vpage = 1; dx = 0; dy = 0;
  if (vehicle === 4) num = confuse(num, 2);
  if (vehicle === 7) num = confuse(num, 2);
  switch (num) {
    case 1071: dx = -1; dy = -1; break;   // home
    case 1072: dy = -1; break;            // up
    case 1073: dx = 1; dy = -1; break;    // PgUp
    case 1075: dx = -1; break;            // left
    case 1077: dx = 1; break;             // right
    case 1079: dx = -1; dy = 1; break;    // end
    case 1080: dy = 1; break;             // down
    case 1081: dx = 1; dy = 1; break;     // PgDn
  }
  if (attractx | attracty) {
    dx = attractx; dy = attracty; attractx = 0; attracty = 0; DumpBuffer();
  }

  if (vehicle === 7 && cRoll(18) === 1) {
    for (let i = ngoody; i >= 1; i--) {
      if (goody[i][1] === -9 && goody[i][3] === 7) braft = i;
    }
    if (braft) {
      goody[braft][4] = goody[braft][4] - 1; ClearMess(); ljnk(410, 49, 20, 1);
      if (goody[braft][4] <= 0) {
        ljnk(408, 53, 14, 2); RemoveGoody(braft, FALSE); vehicle = 0; turbo = 1;
        if ((currsym === 247 || currsym === 126) && (wetsuit === 0)) inwater = TRUE;
      }
      await MessPause(6, 0);
    }
    dx = 0; dy = 0; dis = 0;
  }

  const damveh = async () => {
    if (vehicle !== 2) {
      dam = rolldice(dis, 2, 2);
      [dam, ffkill] = ffEffect(dam, ffkill);
      if (ffkill) {
        await MessPause(4, 0); ClearMess();
        Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
      }
      ClearMess();
      ljnk(231, 1, 40, 1); await MessPause(12, 0);
      hits = hits - dam; ShowHits();
      if (hits < 0) {
        if (berconfuse) {
          a = 242; b = 1; c = 13;
        } else {
          a = 229; b = 56; c = 12;
        }
        st1 = jnk$(a, b, c); await Dead(0);
      }
    }
  };

  nxrid: for (let i = 1, iEnd = dis; i <= iEnd; i++) {
    newx = localx + dx; newy = localy + dy; [sym, fc, bc] = GetSym(newx, newy, 2);

    if (((sym > 64 && sym < 91) || (sym > 96 && sym < 123))) {
      if (vehicle !== 2) { await AttackCreat(dx, dy); break; }
      i = i - 1;
    }

    if (repulse) { ClearMess(); ljnk(124, 14, 45, 1); await MessPause(14, 0); break; }

    if (grabbed) {
      ClearMess();
      ljnk(240, 9, 26, 1); ljnk(240, 35, 29, 2);
      await MessPause(10, 0); ClearMess(); DumpBuffer(); break;
    }

    if (vehicle === 5 || vehicle === 6 || vehicle === 7) {
      switch (sym) {
        case 247: case 126: case 179: case 191: case 192: case 196: case 217: case 218:  // water or border
          break;
        default: if (cRoll(2) === 1) continue nxrid;
      }
    }

    if (newx < 2) {
      newx = 51; dmx = -1; firstlocal = TRUE;
    } else if (newx > 51) {
      newx = 2; dmx = 1; firstlocal = TRUE;
    }
    if (newy < 2) {
      newy = 21; dmy = -1; firstlocal = TRUE;
    } else if (newy > 21) {
      newy = 2; dmy = 1; firstlocal = TRUE;
    }
    if (firstlocal) {
      DumpBuffer();
      if (mainx + dmx < 52 && mainx + dmx > 1 && mainy + dmy > 1 && mainy + dmy < 22) okay = TRUE; else okay = FALSE;
      if (okay) {
        for (let j = 1; j <= nnear; j++) { ncre[j][4] = ncre[j][4] - dx; ncre[j][5] = ncre[j][5] - dy; }
        localx = newx; localy = newy; MoveMain(dmx, dmy);
        if (terrain === 247) {            // If in h2o,
          for (let j = nnear; j >= 1; j--) {     // remove landlubbers
            if ((ncre[j][1] <= ncreat + creextra - creh2o) || (ncre[j][1] > ncreat + creextra)) RemoveCreat(j);
          }
        } else {                             // not in h2o
          for (let j = nnear; j >= 1; j--) {     // remove sea critters
            if ((ncre[j][1] > ncreat + creextra - creh2o) && (ncre[j][1] <= ncreat + creextra)) RemoveCreat(j);
          }
        }
        await DetailedMap(FALSE);
        firstlocal = FALSE;
        screenPages(1); vpage = 1; ClearMess(); await DisplayCharacter();
        ljnk(59, 1, 13, 4); PrintMessage(7, 0); continue nxrid;
      } else {
        ClearMess();
        ljnk(59, 14, 36, 2); PrintMessage(12, 0); break;
      }
    }
    vpage = 1;

    switch (sym) {
      case 15: case 42:
        if (vehicle === 1 || vehicle === 3) {
          PutSym(32, newx, newy, 0, 0, -1);
        }
        if (cRoll(3) === 1) await damveh();
        break;
      case 21: case 157:   // lsd
        if (cRoll(6) === 1) await damveh();
        if ((cRoll(3) & qb(vehicle === 1 || vehicle === 3)) !== 0) {
          PutSym(32, newx, newy, 7, 0, -1);
          [newx, newy, dropped] = RemoveLocalGoody(newx, newy, dropped);
        }
        break;
      case hor: case ver: case ur: case um: case ul: case mrt: case ml: case lr: case lm: case ll:
      case cen: case 219: case monosym:
        await damveh(); break nxrid;
      case 215: case 216:   // webs
        PutSym(32, newx, newy, 7, 0, -1);
        break;
      case 247: case 126:    // water
        switch (vehicle) {
          case 3: case 4: inwater = TRUE; break;
        }
        break;
      case gas:
        if (vehicle !== 2) {
          DumpBuffer();
          dic = cint((18 - con) / 3 + lvl / 2); if (dic < 1) dic = 1;
          dam = rolldice(4, dic, dic); ljnk(157, 34, 19, 2);
          if ((pmut === 7 && berpmut === 0)) dam = cint((dam + 1) / (2 - 2 * qb(berhpmut > 0)));
          dam = cint(fdiv(dam, dis));
          if (gasmask | spacesuit) {
            dam = 0; l2 = bl;
          } else {
            hits = hits - dam;
          }
          if (hits < 0) { st1 = jnk$(157, 53, 10); await Dead(0); break nxrid; }
          if (dam > 0) await MessPause(3, 0);
        }
        break;
      case trap:
        if (fc === 10) {
          PutSym(gas, newx, newy, 8, 0, -1);
        } else {
          PutSym(trap, newx, newy, fc, 0, 1);
        }
        if (vehicle !== 2) {                    // no jetpack traps
          if ((fc !== 7 || incastle !== 0)) {    // no ride on gophr
            if ((fc !== 5 || incastle === 0)) {   // no ride on glue
              fc = await Trapp(fc); fatadd = fatadd + 2;
              if (fc < 0) { newx = localx; newy = localy; dx = 0; dy = 0; }  // telep
              if ((fc === 6 || fc === 8) && incastle === 0) break nxrid;
            }
          }
        }
        break;
      case pit: PutSym(pit, newx, newy, fc, bc, -1); break;
      case chasm:
        if (not(bsshoes)) { hits = -hitmax - 999; st1 = jnk$(336, 51, 18); await Dead(0); }
        break;
    }
    PutSym(currsym, localx, localy, currf, currb, -1);
    if (dark) DarkMove(dx, dy);
    localx = newx; localy = newy;
    [currsym, currf, currb] = GetSym(localx, localy, 2);
    if (invisible) fc = 8; else fc = 15;
    PutSym(1, localx, localy, fc, 0, -1);
    for (let j = 1; j <= nnear; j++) {
      ncre[j][4] = ncre[j][4] - dx; ncre[j][5] = ncre[j][5] - dy;
    }
    tentgrab = 0;
  }
  return [num, dis];
}

// Teleport: tBer > 0 from a berry (long range, random), 0 from the mutation
// (asks short / long), -1 from a monolith transporter, -2 from a displacer.
async function Teleport(tBer) {
  let vpagesave = 0, aa = 0, avdclr = 0, num = 0, dx = 0, dy = 0, r = 0, fc = 0, bc = 0, cr = 0;
  let iq = 0, jq = 0, oldar = 0, rx = 0, ry = 0, nlx = 0, nly = 0, lsym = 0, dam = 0, a$ = '';
  let s = 0, f = 0, cl = 0, cenx = 0, ceny = 0, censx = 0, censy = 0, newx = 0, newy = 0, t = 0;
  ntpt: {
    tel: for (;;) {
      fatadd = 0; vpagesave = vpage; DumpBuffer();
      if (tBer === -2) {
        aa = 83;
      } else if (tBer) {
        aa = 76;
      } else {
        ClearMess();
        ljnk(62, 1, 38, 1); ljnk(62, 39, 25, 2);
        PrintMessage(9, 0); await PauseForKey(); aa = asc(st1);
      }
      switch (aa) {
        case 83: case 115: {  // short
          vpage = 1; screenPages(1); ljnk(63, 1, 12, 4); PrintMessage(7, 0);
          if (incastle) avdclr = 0; else avdclr = wallcolr;
          [num, dx, dy] = await Target(num, 100, dx, dy, avdclr); if (not(didstuff)) break ntpt;
          r = cRoll(100); dx = dx - qb(r < 6) - qb(r === 1) + qb(r > 95) + qb(r === 100);
          r = cRoll(100); dy = dy - qb(r < 6) - qb(r === 1) + qb(r > 96) + qb(r === 100);
          if (localx + dx < 2) dx = 2 - localx;
          if (localx + dx > 51) dx = 51 - localx;
          if (localy + dy < 2) dy = 2 - localy;
          if (localy + dy > 21) dy = 21 - localy;
          [num, fc, bc] = GetSym(localx + dx, localy + dy, 2);
          cr = 0;
          for (let i = 1; i <= nnear; i++) {
            if (ncre[i][4] === dx && ncre[i][5] === dy) { cr = i; break; }
          }
          if (cr !== 0) num = 65;
          iq = localx + dx; jq = localy + dy;
          for (let i = 1; i <= nnear; i++) { ncre[i][4] = ncre[i][4] - dx; ncre[i][5] = ncre[i][5] - dy; }
          if (dark) {
            oldar = dark; dark = -1; ChangeDark();
            PutSym(currsym, localx, localy, currf, currb, 2);
            PutSym(32, localx, localy, 7, 0, 1);
          } else {
            PutSym(currsym, localx, localy, currf, currb, -1);
          }
          break;
        }
        case 76: case 108:  // long
          if (tBer > 0) {
            rx = 7 * tBer; ry = 4 * tBer;
            do {
              do {   // rdnlx:
                nlx = mainx + cRoll(2 * rx + 1) - rx - 1;
              } while (nlx > 51 || nlx < 2);
              do {   // rdnly:
                nly = mainy + cRoll(2 * ry + 1) - ry - 1;
              } while (nly > 21 || nly < 2);
            } while (nlx === mainx && nly === mainy);
            if (incastle) { await LeaveCastle(); incastle = 0; }
            vpage = 0; screenPages(0); await DisplayCharacter();
          } else {
            vpage = 0; screenPages(0); await DisplayCharacter();
            [lsym, nlx, nly, fc, bc] = await TargetLong(lsym, Math.fround(4 - 4 * qb(berhmmut > 0) - 100 * qb(tBer === -1)), nlx, nly, fc, bc);
            PutSym(lsym, nlx, nly, fc, bc, 0);
            if (nlx === mainx && nly === mainy) didstuff = FALSE;
            if (not(didstuff)) break ntpt;
            if (incastle) { await LeaveCastle(); incastle = 0; }
          }
          iq = cRoll(42) + 5; jq = cRoll(14) + 4;
          MoveMain(nlx - mainx, nly - mainy);
          nnear = 0; localx = iq; localy = jq;
          await DetailedMap(FALSE);
          if (bldg && (localx >= lwscr) && (localx <= rwscr)) {
            if (localy >= twscr && localy <= bwscr) {
              for (let i = 1; i <= nnear; i++) {
                ncre[i][4] = ncre[i][4] + localx - (lwscr - 1);
              }
              localx = lwscr - 1; iq = localx;
            }
          }
          if (dark) { dark = oldar; ChangeDark(); }
          vpage = 1; screenPages(1); ljnk(63, 1, 12, 4); PrintMessage(7, 0);
          [num, fc, bc] = GetSym(localx, localy, 2);
          cr = 0;
          for (let i = 1; i <= nnear; i++) {
            if (ncre[i][4] === 0 && ncre[i][5] === 0) { cr = i; break; }
          }
          if (cr !== 0) num = 65;
          break;
        case 27: ClearMess(); didstuff = FALSE; break ntpt;
        default: continue tel;
      }
      break;
    }
    ClearMess();

    inpit = FALSE; inweb = FALSE; inglue = FALSE;
    inbog = FALSE; inwater = FALSE; insand = FALSE;

    PutSym(1, iq, jq, 4, 0, 1);

    switch (num) {
      case 15: case 42:
        dam = rolldice(8, lvl - 4 * qb(num === 15), lvl);
        if (tBer === -1) dam = cint(dam / 4);
        hits = hits - dam; await DisplayCharacter(); ljnk(63, 13, 33, 1);
        if (hits < 0) { st1 = jnk$(63, 46, 23); await Dead(0); break ntpt; }
        PutSym(32, iq, jq, 7, 0, -1);
        break;
      case 247: case 126:
        if (not(wetsuit) && vehicle !== 1 && vehicle !== 5 && vehicle !== 6 && vehicle !== 7) {
          l1 = bl; ljnk(59, 50, 16, 2); ljnk(60, 1, 44, 3);
          PrintMessage(9, 0); inwater = TRUE;
        }
        break;
      case pit:
        PutSym(pit, iq, jq, fc, 0, -1);
        if (not(boots)) { fc = await Pitt(fc); fatadd = fatadd + 2; }
        break;
      case trap:
        if (fc === 10) {
          PutSym(gas, iq, jq, 8, 0, -1);
        } else {
          PutSym(trap, iq, jq, fc, 0, 1);
        }
        fc = await Trapp(fc); fatadd = fatadd + 2;
        if (fc < 0) { newx = localx; newy = localy; dx = 0; dy = 0; }   // telep
        break;
      case 65:
        dam = rolldice(12, lvl + 2, lvl); if (tBer === -1) dam = cint(dam / 4);
        hits = hits - dam; await DisplayCharacter();
        if (hits < 0) {
          st1 = jnk$(63, 46, 17) + Der$(TRUE, cr, 3); await Dead(0); break ntpt;
        }
        ljnk(68, 62, 7, 1); await KillCreat(cr); a$ = l1; ljnk(73, 18, 13, 1);
        localx = iq; localy = jq;
        await Explode(0, 0, dam, 1, 11, 2, FALSE, 12, 4); ClearMess();
        l1 = a$; ljnk(64, 1, 32, 2);
        if (incastle) { s = 250; f = 8; } else { s = 32; f = 7; }
        PutSym(s, iq, jq, f, 0, -1);
        break;
      case 32:
        if (incastle) {
          if (iq < rwall && iq > lwall && jq < bwall && jq > twall) {
            st1 = jnk$(172, 29, 23); hits = -hitmax - 999; await Dead(0); break ntpt;
          }
          if (castlelevel >= 0) {
            cl = castlelevel; await LeaveCastle();
            t = localx; localx = iq; iq = t; t = localy; localy = jq; jq = t;
            await DetailedMap(FALSE);
            t = localx; localx = iq; iq = t; t = localy; localy = jq; jq = t;
            cenx = idiv(lwall + rwall, 2); ceny = idiv(bwall + twall, 2);
            censx = idiv(lwscr + rwscr, 2); censy = idiv(bwscr + twscr, 2);
            iq = cint(censx + 1.5 * (iq - cenx) * (rwscr - lwscr) / (rwall - lwall));
            jq = cint(censy + 1.5 * (jq - ceny) * (bwscr - twscr) / (bwall - twall));
            if (iq < 2) iq = 2; else if (iq > 51) iq = 51;
            if (jq < 2) jq = 2; else if (jq > 21) jq = 21;
            PutSym(32, iq, jq, 7, 0, 1); ljnk(48, 51, 18, 1);
            dam = 0; if (cl > 0) dam = rolldice(6 + lvl, cl + 1, cl);
            if (dam > 0) {
              ljnk(52, 55, 14, 2); hits = hits - dam; await DisplayCharacter();
              if (hits < 0) { st1 = jnk$(50, 57, 10); await Dead(0); break ntpt; }
            }
          } else {
            st1 = jnk$(172, 29, 17) + jnk$(172, 52, 12); hits = -hitmax - 999; await Dead(0); break ntpt;
          }
        }
        break;
      case chasm:
        if (not(bsshoes)) { hits = -hitmax - 999; st1 = jnk$(336, 51, 18); await Dead(0); }
        break;
      default:
        if (fc === wallcolr) { st1 = jnk$(172, 29, 23); hits = -hitmax - 999; await Dead(0); break ntpt; }
    }
    localx = iq; localy = jq;
    if ((incastle === -1) && (dark === 0)) {
      savecorn = 0;
      for (let i = iq - 1; i <= iq + 1; i++) {
        for (let j = jq - 1; j <= jq + 1; j++) DotIt((i), (j));
      }
      DotCorn();
    }
    if (dark) { dark = oldar; ChangeDark(); }
    [currsym, currf, currb] = GetSym(localx, localy, 2);
    if (invisible) fc = 8; else fc = 15;
    PutSym(1, localx, localy, fc, 0, -1);
    grabbed = 0; tentgrab = 0; berconfuse = berconfuse + rolldice(2, 3, 3);
    if ((tBer > 0) && (mmut !== 5)) berconfuse = berconfuse + rolldice(2, 3, 3);
    for (let ic = 1; ic <= nnear; ic++) {
      ncre[ic][13] = 0; if (SameRoom(ncre[ic][4], ncre[ic][5])) await Awaken(ic);
    }
  }
  // ntpt:
  vpage = vpagesave; screenPages(vpage);
  if (not(bitit)) await DisplayCharacter();
  PrintMessage(3, 0); fatadd = 30;
}

// t(hrow) an item; launch = 1 from the grenade launcher.
async function Throw(launch) {
  let i = 0, obj$ = '', rng = 0, num = 0, dx = 0, dy = 0, missed = FALSE, rmgd = FALSE, typ = 0;
  let needed = 0, tohitroll = 0, boomer = FALSE, dam = 0, aa = 0, bb = 0, cc = 0, dd = 0, ee = 0, ff = 0;
  let d = 0, v = 0, slugg = FALSE, damtype = 0, div = 0, r = 0, siz = 0, tr = 0, xdr = 0, ydr = 0;
  let sym = 0, fc = 0, bc = 0, dpt = FALSE, stemp = 0, ftemp = 0, btemp = 0, sc = 0;
  const split = 0;   // (sic) undeclared variable in "IF typ = split"
  if ((not(agin & keysave2) & rside) !== 0) DisplayGoodies(FALSE);
  color(3, 0); SetCombatStats(); l3 = bl;
  for (;;) {   // thrit:
    if (launch === 1) ljnk(307, 1, 13, 1); else ljnk(64, 33, 26, 1);
    l2 = bl; PrintMessage(7, 0);
    if (agin && keysave2 && (launch === 0)) {
      i = keysave1; locate(23, 29); print(chr$(i));
    } else {
      await PauseForKey();
      i = asc(st1); keysave1 = i;
    }
    if (i === 27) { didstuff = FALSE; ClearMess(); PrintMessage(7, 0); return; }
    if (i === 63) { ClearMess(); PrintMessage(7, 0); await Help(4); return; }
    i = i - 96;
    if (berconfuse) i = cRoll(ngoody);
    if (i < 1 || i > ngoody) {
      Wrong();
      if (agin) DisplayGoodies(FALSE);
      agin = FALSE; continue;
    }
    break;
  }
  obj$ = rtrim$(gdy[i]);
  if (goody[i][1] < 0) {
    if (berconfuse === 0) didstuff = FALSE;
    ClearMess();
    ljnk(234, 41, 28, 2); await MessPause(7, 0); return;
  }
  fatadd = goody[i][2] / 10;
  switch (Math.abs(goody[i][1])) {
    case 1: case 2: rng = 12; if (launch) rng = 100; break;
    case 3: rng = goody[i][7]; if (rng < 6) rng = 6; break;
    case 4: rng = 2.5; if (launch) rng = 1.5; break;
    case 5: rng = 3.5; if (launch) rng = 1.5; break;
    case 6: rng = 9.5; if (launch) rng = 100; break;
    case 7: case 8: case 9:
      if (launch) {
        const g11 = goody[i][11];
        if (g11 === 22 || g11 === 34 || (g11 >= nssd + 1 && g11 <= nssd + ngrenade)) rng = 100;
        else rng = 1.5;
      } else {
        rng = Math.fround(60 / (goody[i][2] + 3));
        if (rng < 1.5) rng = 1.5; else if (rng > 12) rng = 12;
      }
      break;
    default: rng = 3.5; if (launch) rng = 1.5;
  }
  rng = Math.fround(rng * ((str + stradd + 15) / 25));
  [num, dx, dy] = await Target(num, rng, dx, dy, wallcolr);
  if (not(didstuff)) {
    didstuff = FALSE; ClearMess(); PrintMessage(1, 0); return;
  }
  missed = TRUE; rmgd = FALSE; ClearMess(); typ = 0;
  if (num > 0 && num <= nnear) {
    typ = ncre[num][1];
    needed = tohitbase - other2hitr - dex2hit - ncre[num][9];
    if (incastle === 0) needed = needed + wind - 1;
    needed = needed - difficulty;
    await Awaken(num); st1 = jnk$(212, 61, 4) + obj$;
    l3 = st1 + jnk$(71, 40, 8) + Der$(FALSE, num, 1);
    l1 = st1 + jnk$(90, 43, 5) + Der$(FALSE, num, 1);
  }
  tohitroll = cRoll(20);

  thr: {
    switch (Math.abs(goody[i][1])) {
      case 1: case 2:  // food
        goody[i][3] = goody[i][3] - 1; if (goody[i][3] < 1) rmgd = TRUE;
        if (tohitroll <= (dex + dexadd) && num > 0) {
          Ljnkbig(85, 1, 13, 91, 66, 3, obj$, 1, 1);
          l1 = Der$(FALSE, num, 2) + l1; missed = FALSE; typ = 0;  // japb stuff
          if (cRoll(3) === 1 && (ncre[num][12] & 2048) === 0) {
            ncre[num][11] = ncre[num][11] | 16;
          }
        } else {
          l1 = l3;
        }
        break;
      case 3:
        if (goody[i][8] === nwep + 6) {
          boomer = TRUE; missed = FALSE;
        } else {
          boomer = FALSE;
          goody[i][3] = goody[i][3] - 1; if (goody[i][3] <= 0) rmgd = TRUE;
        }
        if (num <= 0) break thr;
        needed = needed - goody[i][6];
        needed = needed - difficulty;
        if (needed > 17) needed = 17; else if (needed < 5) needed = 5;

        if (tohitroll >= needed) {
          dam = rolldice(goody[i][5], goody[i][4], goody[i][4]);
          dam = dam + otherdam; if (tohitroll === 20) dam = dam * 2;
          [dam] = CrDamAlter(num, dam, 1);
          if (typ === split) {
            await SplitCre(num);
          } else {
            ncre[num][2] = ncre[num][2] - dam;
          }
          missed = FALSE; if (ncre[num][2] < 0) await KillCreat(num);
          if (boomer) {
            goody[i][3] = goody[i][3] - 1; if (goody[i][3] <= 0) rmgd = TRUE;
          }
        } else {
          l1 = l3; if (boomer) ljnk(310, 1, 28, 2);
        }
        break;
      case 4:
        if (goody[i][1] === -4) { ljnk(85, 14, 34, 2); didstuff = FALSE; break thr; }
        rmgd = TRUE; if (num <= 0) break thr;
        if (needed > 17) needed = 17; else if (needed < 5) needed = 5;
        if (tohitroll >= needed) {
          dam = cRoll(15) + otherdam; if (tohitroll === 20) dam = dam * 2;
          [dam] = CrDamAlter(num, dam, 1); ncre[num][2] = ncre[num][2] - dam;
          missed = FALSE; if (ncre[num][2] < 0) await KillCreat(num);
        } else {
          l1 = l3;
        }
        break;
      case 5:
        rmgd = TRUE; if (num <= 0) break thr;
        if (needed > 17) needed = 17; else if (needed < 5) needed = 5;
        if (tohitroll >= needed) {
          dam = cRoll(8) + otherdam; if (tohitroll === 20) dam = dam * 2;
          [dam] = CrDamAlter(num, dam, 1); ncre[num][2] = ncre[num][2] - dam;
          missed = FALSE; if (ncre[num][2] < 0) await KillCreat(num);
        } else {
          l1 = l3;
        }
        break;
      case 6:
        rmgd = TRUE;
        needed = 14 - idiv(lvl, 2) - dex2hit - other2hitr; ClearMess(); missed = FALSE;
        needed = needed - difficulty;
        if (needed > 14) needed = 14; else if (needed < 6) needed = 6;
        if (launch) needed = needed - 4;
        Ljnkbig(33, 1, 4, 85, 48, 19, obj$, 1, 1); ljnk(86, 1, 33, 2);
        aa = 0; bb = 0; cc = 0; dd = 0; ee = 0; ff = 0;
        d = goody[i][4]; v = goody[i][5];
        switch (goody[i][3]) {
          case 1:
            if (not(knownb[1])) {
              Ljnkbig(33, 1, 4, 33, 14, 10, obj$, 1, 1); l2 = bl;
              await MessPause(12, 0);
            }
            knownb[1] = TRUE;
            Ljnkbig(33, 1, 4, 0, 0, 0, obj$, 1, 1); l2 = bl;
            dam = rolldice(cint(8 + 3 * (v ** 2)), d + v, d + v);
            dam = dam + otherdam; needed = needed - 6;
            ({ need: needed } = await Explode(dx, dy, dam, 1, needed, 1, TRUE, 12, 2));
            RemoveGoody(i, FALSE); keysave2 = FALSE; return;
          case 2:
            if (not(knownb[2])) {
              Ljnkbig(33, 1, 4, 33, 14, 10, obj$, 1, 1); l2 = bl;
              await MessPause(12, 0);
            }
            knownb[2] = TRUE;
            Ljnkbig(33, 1, 4, 0, 0, 0, obj$, 1, 1); l2 = bl;
            dam = rolldice(6 + 4 * v, d + 2 * v, d + v) + otherdam;
            needed = needed - 8;
            ({ need: needed } = await Explode(dx, dy, dam, 2, needed, 1, TRUE, 4, 3));
            RemoveGoody(i, FALSE); keysave2 = FALSE; return;
          case 3: case 23:   // food, burp
            if (num > 0 && tohitroll > needed) {
              knownb[goody[i][3]] = TRUE;
              if ((ncre[num][12] & 2048) === 0) ncre[num][11] = ncre[num][11] | 16;
              aa = 292; bb = 1; cc = 9; dd = 162; ee = 61; ff = 5;
            }
            break;
          case 5:   // poison
            Ljnkbig(33, 1, 4, 0, 0, 0, obj$, 1, 1); l2 = bl;
            dam = rolldice(2 + d, 3 + 3 * v, 3 + 2 * v) + otherdam;
            ({ need: needed } = await Explode(dx, dy, dam, 3, needed, 0, FALSE, 4, 3));
            if (needed >= 0) knownb[5] = TRUE;
            if (num > 0 && needed > 0) {
              if (cRoll(2) === 1 && (ncre[num][10] & 1024) === 0) {
                ncre[num][11] = ncre[num][11] | 8;
              }
            }
            RemoveGoody(i, FALSE); keysave2 = FALSE; return;
          case 6: case 7:       // heals
            if (num > 0 && tohitroll > needed) {
              knownb[goody[i][3]] = TRUE; aa = 113; bb = 52; cc = 11;
              if (goody[i][3] === 7) {
                ncre[num][3] = ncre[num][3] + 4; ncre[num][2] = ncre[num][3];
              } else {
                ncre[num][2] = ncre[num][2] + rolldice(lvl, 3, 3);
                if (ncre[num][2] > ncre[num][3]) {
                  ncre[num][3] = ncre[num][3] + 4; ncre[num][2] = ncre[num][3];
                }
              }
            }
            break;
          case 15:   // speed / slow
            if (num > 0 && tohitroll > needed) {
              knownb[15] = TRUE;
              if (ncre[num][12] & -32768) slugg = TRUE; else slugg = FALSE;
              if (d < 3) {
                aa = 111; bb = 49; cc = 16;
                if (slugg) {
                  ncre[num][6] = 0; ncre[num][12] = ncre[num][12] ^ -32768;
                } else {
                  ncre[num][6] = ncre[num][6] - 1;
                  if (ncre[num][6] === 0) ncre[num][12] = ncre[num][12] | -32768;
                }
              } else {
                aa = 111; bb = 37; cc = 12;
                if (slugg) {
                  ncre[num][12] = ncre[num][12] ^ -32768;
                } else {
                  ncre[num][6] = ncre[num][6] + 1;
                }
              }
            }
            break;
          case 16:   // AC
            if (num > 0 && tohitroll > needed) {
              knownb[16] = TRUE; ncre[num][9] = ncre[num][9] - 5;
              aa = 115; bb = 43; cc = 17;
            }
            break;
          case 17: case 24: case 25: case 33: // confuse, forget, ,frighten, attraction odor
            if (num > 0 && tohitroll > needed) {
              knownb[goody[i][3]] = TRUE; ncre[num][11] = ncre[num][11] | 4;
              aa = 116; bb = 10; cc = 13;
            }
            break;
          case 22:      // blind
            if (num > 0 && tohitroll > needed) {
              knownb[22] = TRUE; aa = 116; bb = 23; cc = 12;
              if ((ncre[num][12] & 2048) === 0) ncre[num][11] = ncre[num][11] | 2;
            }
            break;
          case 27:   // rambo
            if (num > 0 && tohitroll > needed) {
              aa = 292; bb = 1; cc = 9; dd = 409; ee = 6; ff = 5;
              knownb[27] = TRUE;
              ncre[num][2] = ncre[num][2] + 10; ncre[num][3] = ncre[num][3] + 10;
              ncre[num][10] = ncre[num][10] | 1;
              ncre[num][12] = ncre[num][12] | 512;
            }
            break;
          case 28:   // invis
            if (num > 0 && tohitroll > needed) {
              ljnk(418, 63, 5, 1); l2 = bl;
              knownb[28] = TRUE; ncre[num][7] = imod(ncre[num][7], 1000);
            }
            break;
          case 29:   // teleport
            if (num > 0 && tohitroll > needed) {
              knownb[29] = TRUE;
              aa = 217; bb = 19; cc = 15; dd = 0; ee = 0; ff = 0;
              if (cRoll(3) === 1) {
                RemoveCreat(num);
              } else {
                TeleCreat(ncre[num][4], ncre[num][5]);
              }
            }
            break;
          case 30:   // relax
            if (num > 0 && tohitroll > needed) {
              knownb[30] = TRUE; ncre[num][11] = ncre[num][11] & ~1;
              aa = 419; bb = 30; cc = 8; dd = 419; ee = 37; ff = 9;
            }
            break;
          case 31:    // klutz
            if (num > 0 && tohitroll > needed) {
              knownb[31] = TRUE; ncre[num][9] = ncre[num][9] + 6;
              aa = 58; bb = 1; cc = 9; dd = 304; ee = 9; ff = 7;
            }
            break;
          case 32:    // regenerate
            if (num > 0 && tohitroll > needed) {
              knownb[goody[i][3]] = TRUE;
              aa = 292; bb = 1; cc = 9; dd = 304; ee = 48; ff = 11;
              ncre[num][3] = ncre[num][3] + 3; ncre[num][2] = ncre[num][3];
              if (ncre[num][10] & 256) {
                ncre[num][10] = ncre[num][10] | 2048;
              } else {
                ncre[num][10] = ncre[num][10] | 256;
              }
            }
            break;
          case 35:     // acid
            knownb[35] = TRUE; Ljnkbig(33, 1, 4, 0, 0, 0, obj$, 1, 1); l2 = bl;
            dam = rolldice(12 + 6 * v, d + v, d + v);
            dam = dam + otherdam; needed = needed - 6;
            ({ need: needed } = await Explode(dx, dy, dam, 6, needed, 0, TRUE, 6, 2));
            RemoveGoody(i, FALSE); keysave2 = FALSE; return;
        }
        if (cc > 0) {
          Ljnkbig(aa, bb, cc, dd, ee, ff, Der$(FALSE, num, 1), 1, 1); l2 = bl;
        }
        break;
      case 7: {
        rmgd = TRUE;
        const code = goody[i][11] * (qb(goody[i][3] === 0) * 2 + 1);
        if (code >= nssd + 1 && code <= nssd + ngrenade) {
          if ((incastle === -1 && castle === 6 && castlelevel === grinchlevel)) {
            fatadd = 1; ljnk(77, 33, 15, 1); ljnk(95, 27, 36, 2); await MessPause(14, 0);
          } else {
            ssdknown[goody[i][11]] = TRUE; missed = FALSE;
            Ljnkbig(33, 1, 4, 10, 4, 8, obj$ + bl, 1, 1);
            needed = tohitbase - goody[i][7]; ClearMess();
            needed = needed - difficulty;
            if (needed > 14) needed = 14; else if (needed < 3) needed = 3;
            if (launch) needed = needed - 4;
            dam = rolldice(goody[i][6], goody[i][5], goody[i][5]) + otherdam;
            damtype = goody[i][9];
            switch (goody[i][11] - nssd) {
              case 5: case 7: case 13: div = 3; break;
              case 2: case 4: case 10: case 12: div = 4; break;
              default: div = 2;
            }
            Ljnkbig(33, 1, 4, 0, 0, 0, obj$, 1, 1);
            r = goody[i][8];
            ({ damtype, need: needed, r } = await Explode(dx, dy, dam, damtype, needed, r, TRUE, 14, div));
          }
          RemoveGoody(i, FALSE); keysave2 = FALSE;
          return;
        } else if (code === 6) {   // powerpack
          if ((incastle === -1 && castle === 6 && castlelevel === grinchlevel)) {
            fatadd = 1; ljnk(77, 33, 15, 1); ljnk(95, 27, 36, 2); await MessPause(14, 0);
          } else {
            needed = tohitbase - 6 - dex2hit - other2hitr; ClearMess();
            needed = needed - difficulty;
            if (needed > 14) needed = 14; else if (needed < 3) needed = 3;
            if (launch) needed = needed - 4;
            Ljnkbig(33, 1, 4, 0, 0, 0, obj$, 1, 1);
            ({ need: needed } = await Explode(dx, dy, 1, 31, needed, 0, TRUE, 11, 3));
            RemoveGoody(i, FALSE); keysave2 = FALSE; return;
          }
        } else if (code === 22 || code === nssd + ngrenade + 22 || code === nssd + ngrenade + 23) {  // misty, pepper, salt
          if ((incastle === -1 && castle === 6 && castlelevel === grinchlevel)) {
            fatadd = 1; ljnk(77, 33, 15, 1); ljnk(95, 27, 36, 2); await MessPause(14, 0);
          } else {
            needed = tohitbase - 6 - dex2hit - other2hitr; ClearMess();
            needed = needed - difficulty;
            if (needed > 14) needed = 14; else if (needed < 3) needed = 3;
            if (launch) needed = needed - 4;
            if (goody[i][11] === 22) {
              dam = rolldice(10, 5, 5) + otherdam; damtype = 11; div = 2;
            } else if (goody[i][11] === nssd + ngrenade + 22) {
              dam = 1 + otherdam; damtype = 29; div = 3;
            } else {
              dam = 1 + otherdam; damtype = 18; div = 5;
            }
            r = 1; if (goody[i][3] === 0) { dam = 1; damtype = 1; r = 0; }
            Ljnkbig(33, 1, 4, 0, 0, 0, obj$, 1, 1);
            ({ damtype, need: needed, r } = await Explode(dx, dy, dam, damtype, needed, r, TRUE, 1, div));
            RemoveGoody(i, FALSE); keysave2 = FALSE; return;
          }
        } else {
          if (num <= 0) break thr;
          if (needed > 17) needed = 17; else if (needed < 5) needed = 5;
          if (tohitroll >= needed) {
            missed = FALSE;
            dam = cRoll(8) + otherdam; if (tohitroll === 20) dam = dam * 2;
            [dam] = CrDamAlter(num, dam, 1); ncre[num][2] = ncre[num][2] - dam;
            if (ncre[num][2] < 0) await KillCreat(num);
          } else {
            l1 = l3;
          }
        }
        break;
      }
      case 9:  // specials
        rmgd = TRUE; if (num <= 0) break thr;
        if (needed > 17) needed = 17; else if (needed < 5) needed = 5;
        switch (goody[i][3]) {
          case 6:   // roast beast
            if (typ === grinch) {
              await GotGrinch(TRUE);
              RemoveGoody(i, FALSE); keysave2 = FALSE; return;
            } else {
              if (tohitroll >= needed) {
                Ljnkbig(85, 1, 13, 91, 66, 3, obj$, 1, 1);
                l1 = Der$(FALSE, num, 2) + l1; missed = FALSE; typ = 0;
                ncre[num][11] = ncre[num][11] | 16;
              } else {
                l1 = l3;
              }
            }
            break;
          default:
            if (tohitroll >= needed) {
              dam = cRoll(6) + otherdam; if (tohitroll === 20) dam = dam * 2;
              [dam] = CrDamAlter(num, dam, 1); ncre[num][2] = ncre[num][2] - dam;
              if (ncre[num][2] < 0) await KillCreat(num);
              missed = FALSE;
            } else {
              l1 = l3;
            }
        }
        break;
      default:
        rmgd = TRUE;
        if (num <= 0) break thr;
        if (needed > 17) needed = 17; else if (needed < 5) needed = 5;
        if (tohitroll >= needed) {
          missed = FALSE; siz = cint(goody[i][2] / 4); if (siz < 6) siz = 6;
          dam = cRoll(siz) + otherdam; if (tohitroll === 20) dam = dam * 2;
          [dam] = CrDamAlter(num, dam, 1); ncre[num][2] = ncre[num][2] - dam;
          if (ncre[num][2] < 0) await KillCreat(num);
        } else {
          l1 = l3;
        }
    }
  }

  // thr:
  if (missed) {
    tr = 0;
    do {
      tr = tr + 1;
      xdr = dx + cRoll(3) - 2; ydr = dy + cRoll(3) - 2;
      if (localx + xdr < 2) xdr = 2 - localx; else if (localx + xdr > 51) xdr = 51 - localx;
      if (localy + ydr < 2) ydr = 2 - localy; else if (localy + ydr > 21) ydr = 21 - localy;
      [sym, fc, bc] = GetSym(localx + xdr, localy + ydr, 2);
      switch (sym) {
        case 32: case 249: case 250: dpt = TRUE;
          if (sym === 32 && incastle) {
            dpt = FALSE;
          } else {
            stemp = currsym; ftemp = currf; btemp = currb;
            i = AddToDrop(i);
            drgoody[1][15] = localx + xdr; drgoody[1][16] = localy + ydr;
            if (drgoody[1][1] < 4) drgoody[1][3] = 1;   // food&wep-only one
            sc = 2; if (SameRoom(xdr, ydr)) sc = -1;
            PutSym(currsym, localx + xdr, localy + ydr, currf, currb, sc);
            currsym = stemp; currf = ftemp; currb = btemp;
          }
          break;
        default: dpt = FALSE;
      }
    } while (!(dpt || (tr > 15)));
  }

  await MaybeMessPause(10, 0);

  if (rmgd) { RemoveGoody(i, FALSE); keysave2 = FALSE; } else keysave2 = TRUE;
  SetCombatStats();
}

// u(se) a Monolith.
async function UseMono() {
  const localmononum = mononum;
  let numused = 0, numid = 0, fc = 0, row = 0, colm = 0, a = 0, b = 0, c = 0, numtry = 0, numbr = 0;
  let bad = FALSE, a$ = '', temp = 0, des = 0, best = 0, nn = 0, aaa$ = '', aa$ = '', numsel = 0;
  const umonoclp = () => { color(fc, 0); locate(row, colm); Printjnk(a, b, c); };
  ccls(3); ClearMess(); screenPages(3); numused = monozone[mononum][3]; numid = 0;
  for (let i = 1; i <= ngoody; i++) {
    if (Math.abs(goody[i][1]) === 7 && goody[i][11] === 19) numid = 1;
  }
  randomize(Math.fround(seed + mononum * 100 + numused * 30));
  rnd(Math.fround(-(seed + mononum * 100 + numused * 30)));
  crandomize(Math.fround(seed + mononum * 100 + numused * 30));
  for (let i = 1, n = (numused + 3 * ripehrs) % 30; i <= n; i++) rnd() * cRoll(3);

  exum: {
    switch (mononum) {
      case 1:   // juice bar        ======================================
        fc = 12; row = 5; colm = 20; a = 324; b = 1; c = 40; umonoclp();
        fc = 4; row = 7; colm = 20; a = 325; b = 1; c = 43; umonoclp();
        color(5); locate(8, 20);
        numtry = 1;
        if (numused - numid <= 0) numbr = 7 - 2 * qb(numid > 0);
        else if (numused - numid === 1) numbr = 4 - 2 * qb(numid > 0);
        else if (numused - numid === 2) numbr = 2 - qb(numid > 0);
        else { numbr = 0; numtry = 0; }
        if (numtry > 0) {
          for (let i = 1; i <= numbr; i++) {
            do {   // juiceredo:
              scratch[i] = cRoll(nberry); bad = FALSE;
              for (let j = 1; j <= i - 1; j++) {
                if (scratch[j] === scratch[i]) bad = TRUE;
              }
            } while (bad);
            print(ltrim$(str$(i)), '. ', berry$[scratch[i]]);
            if (knownb[i]) print('  (', BerEff$(scratch[i]), ')');
            println(); locate(null, 20);
          }
          println(); locate(null, 20); Printjnk(327, 35, 28); await PauseForKey(); b = cint(val(st1));
          if (b > 0 && b <= numbr) {
            numused = numused + 1;
            screenPages(vpage);
            a$ = gdy[1]; for (let j = 1; j <= 12; j++) scratch[j + 10] = goody[1][j];
            gdy[1] = 'purple ' + berry$[scratch[b]] + ' nectar';
            goody[1][1] = 6; goody[1][3] = scratch[b];
            goody[1][4] = 6; goody[1][5] = 1;
            temp = 1; temp = await EatBerry(temp);
            hunger = hunger - 300; knownb[goody[1][3]] = TRUE;
            gdy[1] = a$; for (let j = 1; j <= 12; j++) goody[1][j] = scratch[j + 10];
            if (temp < 0) Scatter(0);
            await MessPause(12, 0); await DisplayCharacter(); PrintMessage(7, 0);
          }
        } else {
          Printjnk(326, 1, 40); fc = 10; row = 25; colm = 5;
          a = 3; b = 1; c = 18; umonoclp(); await PauseForKey();
        }
        break;
      case 2:   // supercomputer    ======================================
        fc = 14; row = 5; colm = 26; a = 324; b = 41; c = 27; umonoclp();
        if (numused - numid <= 0 || (numused - numid < 5 && cRoll(18 * numused) < intl)) {
          fc = 12; row = 10; colm = 29; a = 347; b = 49; c = 20; umonoclp();
          numused = numused + 1; await PauseForKey(); await Compute(2);
        } else {
          fc = 28; row = 10; colm = 33; a = 329; b = 55; c = 14; umonoclp();
          fc = 10; row = 25; colm = 5; a = 3; b = 1; c = 18; umonoclp();
          await PauseForKey();
        }
        break;
      case 3:   // tech dispensery  =========================================
        fc = 11; row = 5; colm = 20; a = 346; b = 52; c = 17; umonoclp();
        color(14); locate(7, 20);
        if (ngoody >= 20) {
          Printjnk(57, 25, 29); didstuff = FALSE; await PauseForKey(); break exum;
        } else {
          Printjnk(348, 1, 35); color(3, 0); locate(8, 20);
        }
        numtry = 1;
        if (numused - numid <= 0) numbr = 6 - qb(numid > 0) + 1;
        else if (numused - numid === 1) numbr = 4 - qb(numid > 0) + 1;
        else if (numused - numid === 2) numbr = 2 - qb(numid > 0) + 1;
        else { numbr = 0; numtry = 0; }
        if (numtry > 0) {
          numused = numused + 1;
          for (let i = 1; i <= numbr; i++) {
            if (i === 1) {
              scratch[i] = 6; // battery
            } else {
              do {   // techredo:
                bad = FALSE;
                switch (i % 3) {
                  case 1:
                    if (cRoll(3) === 1) {
                      scratch[i] = -(cRoll(nltrash) + nlsd);
                    } else {
                      scratch[i] = cRoll(nstrash) + nssd + ntechwep;
                    }
                    break;
                  case 2:
                    if (cRoll(3) === 1) {
                      scratch[i] = -(cRoll(nlsd));
                    } else {
                      scratch[i] = cRoll(nssd);
                    }
                    break;
                  case 0: scratch[i] = cRoll(ntechwep) + nssd; break;
                }
                for (let j = 1; j <= i - 1; j++) {
                  if (scratch[j] === scratch[i]) bad = TRUE;
                }
              } while (bad);
            }
            print(ltrim$(str$(i)), '. ');
            if (scratch[i] > 0) println(ssdnm$(scratch[i])); else println(lsdnm$(-scratch[i]));
            locate(null, 20);
          }
          println(); locate(null, 20); Printjnk(327, 35, 20); print('?');
          await PauseForKey();
          b = cint(val(st1));
          if (b > 0 && b <= numbr) {
            screenPages(vpage); ngoody = ngoody + 1;
            if (scratch[b] > 0) {
              ssdknown[scratch[b]] = TRUE; DetermineSsd(scratch[b]);
            } else {
              lsdknown[-scratch[b]] = TRUE; DetermineLsd(-scratch[b]);
            }
            PrintMessage(7, 0); await DisplayCharacter();
          }
        } else {
          Printjnk(326, 1, 15); print('  '); Printjnk(323, 47, 22);
          fc = 10; row = 25; colm = 5; a = 3; b = 1; c = 18; umonoclp();
          await PauseForKey();
        }
        break;
      case 4:   // deli             ======================================
        fc = 12; row = 5; colm = 10; a = 348; b = 36; c = 32; umonoclp();
        fc = 5; row = 7; a = 325; b = 1; c = 28; umonoclp();
        Printjnk(331, 54, 15); row = 8; fc = 6;
        switch (cRoll(3)) {
          case 1: a = 344; b = 54; c = 15; break; // tongue sandwich
          case 2: a = 359; b = 59; c = 10; break; // rump roast
          case 3: a = 345; b = 53; c = 16; break; // Sausage surprise
          case 4: a = 419; b = 17; c = 13; break; // Liver platter
        }
        umonoclp();
        fc = 5; row = 10; a = 349; b = 1; c = 51; umonoclp();
        fc = 10; row = 25; a = 35; b = 1; c = 32; umonoclp();
        hunger = -1500; fatigue = 0; await PauseForKey();
        break;
      case 5:   // armory           ======================================
        fc = 11; row = 5; colm = 18; a = 97; b = 1; c = 44; umonoclp();
        color(9); locate(7, 18);
        if (ngoody >= 20) {
          Printjnk(57, 25, 29); didstuff = FALSE; await PauseForKey(); break exum;
        } else if (numused < 4) {
          Printjnk(99, 44, 15);  //  "Would you like "
        } else {
          Printjnk(126, 32, 34); await PauseForKey();
          if (ucase$(st1) === 'Y') {
            dex = dex - 1; hits = hits - lvl; ShowHits();
            if (hits < 0) {
              st1 = jnk$(125, 42, 9); await Dead(0);
            } else {
              locate(9, 18); Printjnk(127, 21, 15); await PauseForKey();
            }
          }
          break exum;
        }
        switch (numused) {
          case 0: des = 4; best = 12; break;   // armor
          case 1: des = 3; best = 0; break;    // wep
          case 2: des = 5; best = 9; break;    // shield
          case 3: des = -3; best = 0; break;   // range wep
        }
        for (let i = 1; i <= ngoody; i++) {
          if (Math.abs(goody[i][1]) === Math.abs(des)) {
            if (des === 4 || des === 5) {
              if (goody[i][3] < best) {
                best = goody[i][3]; if (best < 4) best = 4;
              }
            } else if (des === 3) {
              if (goody[i][8] > best && goody[i][8] <= nwep) {
                best = goody[i][8]; if (best > nwep - 3) best = nwep - 3;
              }
            } else {
              if (goody[i][8] > best && goody[i][8] > nwep) {
                best = goody[i][8]; if (best > nrwep - 3) best = nrwep - 3;
              }
            }
          }
        }
        switch (des) {
          case 4: nn = best - cRoll(cRoll(best - 1));
            aaa$ = armnm$(nn); aa$ = 'some '; a$ = '?'; break;
          case 5: nn = best - cRoll(cRoll(best - 1));
            aaa$ = shnm$(nn); aa$ = 'a '; a$ = ' shield?'; break;
          case 3: nn = best + cRoll(cRoll(nwep - best));
            aaa$ = wepnm$(nn); aa$ = 'a '; a$ = '?'; break;
          case -3: nn = nwep + best + cRoll(cRoll(nrwep - best));
            aaa$ = wepnm$(nn); aa$ = 'some '; a$ = 's?'; break;
        }
        println(aa$, aaa$, a$); await PauseForKey();
        if (ucase$(st1) === 'Y') {
          ngoody = ngoody + 1; gdy[ngoody] = aaa$; numused = numused + 1;
          switch (des) {
            case 4: goody[ngoody][1] = 4;
              goody[ngoody][2] = arm[nn][1];
              goody[ngoody][3] = nn;
              goody[ngoody][4] = arm[nn][2];
              break;
            case 5: goody[ngoody][1] = 5;
              goody[ngoody][2] = sh[nn][1];
              goody[ngoody][3] = nn;
              goody[ngoody][4] = sh[nn][2];
              gdy[ngoody] = gdy[ngoody] + jnk$(3, 55, 7);
              break;
            case 3: case -3:
              goody[ngoody][1] = 3;
              for (let jj = 1; jj <= 6; jj++) goody[ngoody][jj + 1] = wep[nn][jj];
              goody[ngoody][8] = nn;
              break;
          }
        }
        break;
      case 6:   // medical          ======================================
        fc = 12; row = 5; colm = 25; a = 98; b = 1; c = 28; umonoclp();
        fc = 4; row = 7; colm = 20; a = 98; b = 29; c = 39; umonoclp();
        row = 8; colm = 18; a = 99; b = 1; c = 43; umonoclp();

        if (berconfuse) berconfuse = 1;
        if (berblind) berblind = 1;
        if (sick) sick = 1;
        if (berklutz) berklutz = 1;
        if (beryum) beryum = 1;
        if (berpmut) berpmut = 1;
        if (bermmut) bermmut = 1;
        tapeworm = FALSE;

        switch (numused) {
          case 0: numbr = 4 - qb(numid > 0); break;
          case 1: numbr = 3 - qb(numid > 0); break;
          case 2: numbr = 2 - qb(numid > 0); break;
          default: numbr = 0;
        }
        if (hittox | strtox | dextox | contox) numbr = numbr + 1;
        if (numbr === 0) {
          fc = 12; row = 11; colm = 25; a = 102; b = 39; c = 28; umonoclp();
          fc = 10; row = 25; colm = 5; a = 3; b = 1; c = 18; umonoclp();
          await PauseForKey();
        } else {
          fc = 12; row = 11; colm = 20; a = 103; b = 18; c = 21; umonoclp();
          for (let i = 1; i <= numbr; i++) {
            if (i === 1 && (hittox | strtox | dextox | contox)) {
              scratch[i] = 0;
            } else {
              do {   // redomed:
                scratch[i] = cRoll(8); bad = FALSE;
                for (let j = 1; j <= i - 1; j++) {
                  if (scratch[j] === scratch[i]) bad = TRUE;
                }
              } while (bad);
            }
            locate(11 + i, 19); print(ltrim$(str$(i)), '. ');
            switch (scratch[i]) {
              case 0: a = 106; b = 23; c = 32; break; // poison
              case 1: a = 103; b = 39; c = 28; break; // hitmax
              case 2: a = 104; b = 18; c = 48; break; // heighten muts
              case 3: a = 105; b = 13; c = 21; break; // raise stats
              case 4: a = 105; b = 35; c = 34; break; // AC
              case 5: a = 107; b = 21; c = 48; break; // detection
              case 6: a = 108; b = 17; c = 42; break; // regeneration
              case 7: a = 109; b = 21; c = 43; break; // force field
            }
            Printjnk(a, b, c);
          }
          await PauseForKey(); b = cint(val(st1));
          if (b > 0 && b <= numbr) {
            numsel = scratch[b]; numused = numused + 1;
            switch (numsel) {
              case 0:                              // detox
                if (strtox > 0) str = str + strtox;
                if (dextox > 0) dex = dex + dextox;
                if (contox > 0) con = con + contox;
                if (hittox > 0) { hits = hits + hittox; hitmax = hitmax + hittox; }
                strtox = 0; dextox = 0; contox = 0; hittox = 0;
                spore = 0; tapeworm = FALSE; if (sick) sick = 1;
                break;
              case 1:                              // hitmax
                hitmax = hitmax + 5 + idiv(lvl, 3); hits = hits + 5 + idiv(lvl, 3);
                break;
              case 2:                              // heighten muts
                switch (cRoll(2)) {
                  case 1:
                    if (berhpmut === 0) {
                      switch (pmut) {
                        case 2: dex = dex + 10; klutzdex = klutzdex + 10; break;
                        case 3: str = str + 10; break;
                        case 4: other2hitc = other2hitc + 1; other2hitr = other2hitr + 2; break;
                        case 7: con = con + 10; hits = hits + 2 * lvl;
                          hitmax = hitmax + 2 * lvl; break;
                        case 8: rr = rr + 10; break;
                      }
                    }
                    berhpmut = berhpmut + 800;
                    break;
                  case 2:
                    if (berhmmut === 0) {
                      switch (mmut) {
                        case 1: other2hitc = other2hitc + 2;
                          other2hitr = other2hitr + 2; otherdam = otherdam + 4; break;
                        case 2: intl = intl + 10; break;
                        case 3: mr = mr + 10; break;
                      }
                    }
                    berhmmut = berhmmut + 800;
                    break;
                }
                break;
              case 3:                                // raise stats
                str = str + 1; dex = dex + 1; con = con + 1;
                rr = rr + 1; mr = mr + 1; intl = intl + 1;
                break;
              case 4: skinac = skinac + 1; break;              // AC
              case 5: if (berblind) berblind = 1;   // detection
                if (berdet === 0) { other2hitc = other2hitc + 2; other2hitr = other2hitr + 2; }
                berdet = berdet + 2000;
                break;
              case 6: berregen = berregen + 1000; break;   // regeneration
              case 7: berff = berff + 1200; break;         // force field
            }
          }
        }
        break;
      case 7: case 8: case 9: case 10:  // transporter   ===================================
        fc = 11; row = 5; colm = 20; a = 340; b = 1; c = 39; umonoclp();
        fc = 3; row = 8; colm = 9; a = 341; b = 1; c = 61; umonoclp();
        await PauseForKey();
        screenPages(vpage); ClearMess();
        teleporting = TRUE; await Teleport(-1); teleporting = FALSE; await MessPause(11, 0);
        break;
    }
    monozone[localmononum][3] = numused;
  }
  // exum:
  didstuff = FALSE; await DisplayCharacter();
  screenPages(vpage);
}

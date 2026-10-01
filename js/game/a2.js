// Port of A2.BAS: melee attacks, creature attacks and movement, and the
// generation of caves, castle dungeon levels and lairs.
//
// Copyright (c) 1995 Jeffrey R. Olson (MIT license, see LICENSE)
'use strict';

// Player attacks the creature at (dx, dy).
async function AttackCreat(dx, dy) {
  let okfester = TRUE, ch = 0, typ = 0, wepnum = 0, rol = 0, hitbon = 0, siz = 0, dic = 0;
  let wepadddam = 0, needed = 0, misspec = 0, dam = 0, zz = 0, dam1 = 0, dam2 = 0, ffkill = FALSE;
  DumpBuffer(); SetCombatStats();
  ch = badmovecreat(dx, dy, nnear, 0, ncre);
  if (ch === 0) {
    PutSym(250, localx + dx, localy + dy, 8, 0, -1);
    ljnk(50, 1, 12, 1); PrintMessage(4, 0); return;
  }
  typ = ncre[ch][1]; await Awaken(ch);
  wepnum = 0;
  for (let i = 1; i <= ngoody; i++) {
    if (goody[i][1] === -3) { wepnum = i; break; }
  }
  ClearMess();
  rol = cRoll(20);

  if (wepnum > 0) {
    hitbon = goody[wepnum][6] + goody[wepnum][9];
    siz = goody[wepnum][5]; dic = goody[wepnum][4];
    wepadddam = goody[wepnum][10];
  } else {
    hitbon = -3; siz = 3; dic = 1;
  }

  if (idiv(ncre[ch][7], 1000) === 0) {
    if (!((pmut === 4 && berpmut === 0) || (berdet > 0))) hitbon = hitbon - 3;
  }

  if (((ncre[ch][11] & 1) === 0)) {  // asleep
    hitbon = hitbon + 4;
  } else if ((ncre[ch][11] & 2)) {    // blind
    hitbon = hitbon + 3;
  } else if ((ncre[ch][11] & 28)) {   // confused, sick or burping
    hitbon = hitbon + 2;
  }

  if (inglue) hitbon = hitbon - 2;
  if (inpit) hitbon = hitbon - 2;
  if (inbog) hitbon = hitbon - 3;
  if (insand) hitbon = hitbon - 4;
  if (inweb) hitbon = hitbon - 4;

  needed = tohitbase - str2hit - other2hitc - hitbon - ncre[ch][9];
  if (incastle === 0) needed = needed + weather - 2;
  needed = needed - difficulty;
  if (needed > 18) needed = 18; else if (needed < 5) needed = 5;

  [rol, misspec] = await CrDef(ch, 1, rol, misspec, 0);

  if (rol >= needed) {
    dam = rolldice(siz, dic, dic) + strdam + otherdam + wepadddam;
    if (dam < dic) dam = dic;
    zz = cint(Math.sqrt(lvl) * 100);
    dam = cint(dam * (4.5 + rnd() * zz / 100) / 5);
    if (rol === 20) { ljnk(50, 13, 13, 2); dam = dam * 2; }
    [dam] = CrDamAlter(ch, dam, 1);
    if (typ === gworm) await SplitCre(ch); else ncre[ch][2] = ncre[ch][2] - dam;
    Ljnkbig(238, 31, 8, 0, 0, 0, Der$(FALSE, ch, 1), 1, 1);
    dam1 = 0; dam2 = 0;
    if (ncre[ch][10] & 4096) dam1 = cRoll(4);
    if (ncre[ch][10] & 8192) dam2 = cRoll(10);
    dam = dam1 + dam2; [dam, ffkill] = ffEffect(dam, ffkill);
    if (ffkill) {
      await MessPause(4, 0); ClearMess();
      Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
    }
    if (dam > 0) {
      ljnk(86, 53, 16, 2); hits = hits - dam; ShowHits();
      if (hits < 0) { st1 = jnk$(296, 61, 8) + bl + Der$(TRUE, ch, 3); await Dead(0); }
    }
    if (ncre[ch][2] < 0) { await KillCreat(ch); okfester = FALSE; }
  } else if (misspec === 0) {
    Ljnkbig(50, 33, 10, 0, 0, 0, bl + Der$(FALSE, ch, 1), 1, 1);
    if (typ === bush) { l2 = l1; ljnk(50, 43, 14, 1); }
    if (rol === 1) {
      ljnk(51, 1, 42, 1); ljnk(52, 1, 41, 2);
    }
  }
  if (okfester && (ncre[ch][1] === fester)) { ljnk(382, 1, 31, 2); RemoveCreat(ch); }  // NOT typ!
  await MaybeMessPause(5, 0);
  fatadd = fatig + 4;
}

// Carves a cave system into page 2.  rms(0..7, 0..1) receives the room
// centres; returns numrms (the BASIC SUB's by-reference parameter).
function Cave(numrms, rms) {
  let x = 0, y = 0, tries = 0, bad = FALSE, dx = 0, dy = 0, differ = 0, rx = 0, ry = 0;
  let goon = FALSE, numdots = 0, xnew = 0, ynew = 0, found = FALSE, sym = 0, fc = 0, bc = 0;
  const param1 = cRoll(cRoll(1000)); clpage2();
  numrms = -1;     // 0 to 7
  for (let i = 3; i <= 50; i++) for (let j = 3; j <= 20; j++) PutSym(219, i, j, wallcolr, 0, 2);
  box(2, 51, 2, 21, 1, wallcolr, 2);

  const meander = () => {
    PutSym(250, x, y, 8, 0, 2);
    goon = TRUE; numdots = 0;
    while (goon) {
      for (let i = 1; i <= 10; i++) {
        bad = FALSE; dx = 0; dy = 0;
        switch (cRoll(3)) {
          case 1: case 2: dx = 2 * cRoll(2) - 3; break;
          default: dy = 2 * cRoll(2) - 3;
        }
        xnew = x + dx; ynew = y + dy;
        if (xnew < 3 || xnew > 50 || ynew < 3 || ynew > 20) bad = TRUE;
        if (dx) {
          for (let j = 0; dx > 0 ? j <= dx : j >= dx; j += dx) {
            for (let k = -1; k <= 1; k++) {
              [sym, fc, bc] = GetSym(xnew + j, ynew + k, 2);
              if ((sym !== 219 && sym !== 32)) bad = TRUE;
            }
          }
        } else {
          for (let j = -1; j <= 1; j++) {
            for (let k = 0; dy > 0 ? k <= dy : k >= dy; k += dy) {
              [sym, fc, bc] = GetSym(xnew + j, ynew + k, 2);
              if ((sym !== 219 && sym !== 32)) bad = TRUE;
            }
          }
        }
        if (!bad) {
          x = xnew; y = ynew; PutSym(250, x, y, 8, 0, 2); numdots = numdots + 1;
          break;
        }
      }
      if (bad) goon = FALSE;
    }
  };
  const caverm = () => {
    for (let i = -rx; i <= rx; i++) {
      for (let j = -ry; j <= ry; j++) {
        [sym, fc, bc] = GetSym(x + i, y + j, 2);
        if (sym === 219 || sym === 250) PutSym(32, x + i, y + j, 8, 0, 2);
      }
    }
    numrms = numrms + 1;
    rms[numrms][0] = x; rms[numrms][1] = y;
  };
  const cavefdot = () => {
    found = FALSE;
    while (!found) {
      x = cRoll(50) + 1; y = cRoll(20) + 1;
      [sym, fc, bc] = GetSym(x, y, 2);
      if (sym === 32 || ((sym === 250) && (cRoll(10) === 1))) found = TRUE;
    }
  };

  x = cRoll(30) + 10; y = cRoll(10) + 5; tries = 0;
  do {
    bad = FALSE; tries = tries + 1;
    for (let j = 0; j <= numrms; j++) {
      dx = x - rms[j][0]; dy = y - rms[j][1];
      differ = crd(dx, cint(1.3 * dy));
      if (differ < 10) bad = TRUE;
    }
    if (bad) {
      cavefdot();
    } else {
      rx = cRoll(3); ry = cRoll(2); caverm();
    }
    meander();
  } while (!(numrms === 7 || tries > 200));

  for (let iextra = 1; iextra <= param1; iextra++) { cavefdot(); meander(); }

  for (let i = 3; i <= 50; i++) {
    for (let j = 3; j <= 20; j++) {
      [sym, fc, bc] = GetSym(i, j, 2);
      if (sym === 32) PutSym(250, i, j, 8, 0, 2);
    }
  }
  for (let i = 2; i <= 51; i++) { PutSym(219, i, 2, wallcolr, 0, 2); PutSym(219, i, 21, wallcolr, 0, 2); }
  for (let j = 3; j <= 20; j++) { PutSym(219, 2, j, wallcolr, 0, 2); PutSym(219, 51, j, wallcolr, 0, 2); }
  return numrms;
}

// Creature type for a cave.
function CaveCreat() {
  let l = 0, maxcre = 0;
  const r = cRoll(100);
  if (r <= 60) {               // Anywhere critters
    maxcre = cint(3 + 3.49 * lvl + ncastle);
    for (;;) {   // redocc1:
      l = cRoll(maxcre);
      switch (l) {
        case 3: case 4: case 8: case 10: case 13: case 15: case 20: case 22: case 24: case 30:  // 15 is chamel, 30 is kbee
        case 31: case 33: case 40: case 43: case 45: case 48: case 53: case 57: case 60: case 61:  // 48 is grizz,  61 is Tricer
          break;
        default: continue;
      }
      break;
    }
  } else if (r <= 97) {        // terrain critters
    maxcre = lvl; if (maxcre > 17) maxcre = 17;
    l = cRoll(maxcre);
    switch (cRoll(4)) {
      case 1: l = ncreat + l; break;
      case 2: l = ncreat + crecas + l; break;
      case 3: l = ncreat + crecas + crefor + l; break;
      case 4: l = ncreat + crecas + crefor + creswa + l; break;
    }
  } else {                     // water
    maxcre = cint(1 + 1.5 * lvl); if (maxcre > creh2o) maxcre = creh2o;
    l = ncreat + crecas + crefor + creswa + crepla + cRoll(maxcre);
  }
  return l;
}

// Special defences of some creatures against the player's attack.
// Returns [rol, missspec].
async function CrDef(ch, atktyp, rol, missspec, r) {
  const typ = ncre[ch][1];
  let pp = 0, a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, dd = 0, ee = 0, ff = 0;
  missspec = 0;
  if (r < 1) {
    pp = cRoll(20);
    switch (typ) {
      case gill:
        if ((pp < 18) && (atktyp !== 26)) {
          rol = 1; missspec = 1; a = 299; b = 46; c = 23; d = 300;
          switch (cRoll(5)) {
            case 1: case 2: e = 1; f = 26;  // coconuts
              hits = hits - rolldice(cint(lvl / 2), 3, 3); ShowHits();
              if (hits < 0) {
                ljnk(a, b, c, 1); ljnk(d, e, f, 2); await MessPause(12, 0);
                st1 = jnk$(380, 47, 16); await Dead(0); return [rol, missspec];
              }
              break;
            case 3: e = 27; f = 21;   // glue
              inglue = TRUE; fatadd = fatadd + 3;
              break;
            case 4: d = 116; e = 35; f = 30;   // hair tonic
              berhic = berhic + cRoll(4); ber$ = 'aaaChoo!';
              break;
            default: e = 48; f = 21;     // glasses
          }
        }
        break;
      case mara: case mary: case ging: case mrshow: case ivana: case bunny:
        if (pp < 12 + 6 * qb(typ === bunny || typ === ivana)) {
          rol = 1; missspec = 2;
          a = 301; b = 1; c = 29; dd = 301; ee = 31; ff = 10;
          fatadd = 0;
        }
        break;
      case cubs:
        if (pp < 6) {
          rol = 1; missspec = 3;
          a = 299; b = 46; c = 23; d = 301; e = 44; f = 24;
        }
        break;
    }
    if (c > 0) ljnk(a, b, c, 1);
    if (f > 0) ljnk(d, e, f, 2);
    if (ff > 0) Ljnkbig(dd, ee, ff, 0, 0, 0, Der$(FALSE, ch, 1), 1, 2);
  }
  return [rol, missspec];
}

// Creature inew attacks the player.  Returns [inew, damage]: inew is set to
// -inew if CreatDo shouldn't change l2, 0 if it shouldn't change l1 or l2;
// damage is the damage done (-1 for special attacks).
async function CreatAttack(inew, damage) {
  const i = inew;
  let showchan = 40, typ = 0, cx = 0, cy = 0, ppp = 0, ppp1 = 0, atype = 0, attackrange = 0;
  let astr = 0, tohit = 0, range = 0, rol = 0, dam = 0, a = 0, b = 0, c = 0, d = 0, e = 0, f = 0;
  let aa = 0, bb = 0, cc = 0, siz = 0, dic = 0, damg = 0, stol = 0, l = 0, remchance = 0, numd = 0;
  let zzz = 0, zz = 0, rnds = 0, lostexp = FALSE, lose = 0, newlev = 0, b$ = '', num = 0;
  let nobrk = FALSE, olddark = 0, changed = 0;
  ClearMess();
  damage = 0; touch = FALSE;
  typ = ncre[i][1]; cx = ncre[i][4]; cy = ncre[i][5];

  const damarmor = () => {
    num = 0;
    for (let k = 1; k <= ngoody; k++) {
      if (goody[k][1] === -4) num = k;
    }
    if (num === 0) return;
    goody[num][4] = goody[num][4] - 1;
    inew = -Math.abs(inew);   // so creatdo won't change l2
    if (goody[num][4] < 1) {
      for (let mmm = 1; mmm <= ngoody; mmm++) {
        if (Math.abs(goody[mmm][1]) === 7 && goody[mmm][11] === 16 && goody[mmm][3] > 0) {
          if (cRoll(10) < 9) nobrk = TRUE;
        }
      }
      l2 = '****** ' + ucase$(jnk$(93, 13, 23)) + ' ******';
      if (nobrk) {
        goody[num][4] = cRoll(2); goody[num][5] = goody[num][5] - 1;
        l1 = l2; ljnk(123, 13, 33, 2); c = 0; cc = 0;
        inew = 0;   // so creatdo won't change l2 or l1
      } else {
        armor = narm; RemoveGoody(num, FALSE); SetCombatStats(); DisplayCharacter();
      }
    } else {
      Ljnkbig(93, 13, 14, 93, 36, 7, bl, 2, 2);
    }
    f = 0;
  };
  const damshield = () => {
    num = 0;
    for (let k = 1; k <= ngoody; k++) {
      if (goody[k][1] === -5) num = k;
    }
    if (num === 0) return;
    goody[num][4] = goody[num][4] - 1;
    inew = -Math.abs(inew);   // so creatdo won't change l2
    if (goody[num][4] < 1) {
      for (let mmm = 1; mmm <= ngoody; mmm++) {
        if (Math.abs(goody[mmm][1]) === 7 && goody[mmm][11] === 16 && goody[mmm][3] > 0) {
          if (cRoll(10) < 9) nobrk = TRUE;
        }
      }
      l2 = '****** ' + ucase$(jnk$(93, 13, 5) + jnk$(93, 43, 6) + jnk$(93, 23, 13)) + ' ******';
      if (nobrk) {
        goody[num][4] = cRoll(2); goody[num][5] = goody[num][5] - 1;
        l1 = l2; ljnk(123, 13, 33, 2); c = 0; cc = 0;
        inew = 0;   // so creatdo won't change l2 or l1
      } else {
        shield = nsh; RemoveGoody(num, FALSE); SetCombatStats(); DisplayCharacter();
      }
    } else {
      ljnk(315, 1, 22, 2);
    }
    f = 0;
  };

  nxcreatk: for (let j = 6; j <= 14; j += 2) {
    ppp = Creature(typ, j); ppp1 = Creature(typ, j + 1);
    atype = idiv(ppp1, 100); attackrange = imod(ppp1, 100);
    astr = idiv(ppp, 100); tohit = imod(ppp, 100);
    if (atype === 0) break;
    switch (typ) {
      case robot: case rdro: case sdro: case ddro:
        astr = imod(ncre[i][14], 10); tohit = idiv(ncre[i][14], 100);
        attackrange = imod(idiv(ncre[i][14], 10), 10);
        break;
      case webspid:
        astr = imod(ncre[i][14], 100); tohit = idiv(ncre[i][14], 100);
        break;
    }
    range = Math.fround(crd(cx, cy)); if (range > attackrange) break;

    switch (atype) {
      case 2: tohit = cint(tohit - ac * 0.7); break;                        // radiation
      case 8: case 13: tohit = mr - tohit - 4 * qb(berscience > 0); break;  // mentals
      case 9: tohit = tohit - ac + (armor - 2 - idiv(shield, 2));           // electric
        switch (armor) {
          case 1: case 2: case 3: case 4: case 5: case 8: case 9: tohit = tohit - 4; break;
          case 6: case 7: case 10: case 11: tohit = tohit + 6; break;
        }
        if (shield >= 1 && shield <= 6) tohit = tohit - 2;
        else if (shield === 7 || shield === 8) tohit = tohit + 3;
        break;
      case 14: case 16: case 22: case 23: case 27: tohit = tohit - 4; break;  // no AC depend
      case 18: tohit = cint(tohit - ac * 0.5); break;                        // spores
      case 20: case 21: tohit = tohit + idiv(mr, 2) - 6; break;              // attrac,deevol
      default: tohit = tohit - ac;
    }
    if (idiv(ncre[i][7], 1000) === 0) {
      if (!((pmut === 4 && berpmut === 0) || (berdet > 0))) tohit = tohit - 3;
    }
    if (beryum > 0) tohit = tohit - 4;
    if (asleep) {
      tohit = tohit - 4;
    } else if (berblind) {
      tohit = tohit - 3;
    } else if (berhic | berconfuse) {
      tohit = tohit - 2;
    }
    if (zippy < 0) tohit = tohit - 3; else if (zippy > 0) tohit = tohit + 3;
    if ((bergreen > 0) && (typ === herm)) tohit = tohit - 5;
    tohit = tohit + difficulty;
    if (tohit > 17) tohit = 17; else if (tohit < 5) tohit = 5;
    if ((ncre[i][13] & (2 ** (idiv(j, 2) - 2))) && (atype === 12)) { tohit = 0; showchan = 1; }

    rol = cRoll(20); dam = 0;
    if (rol >= tohit) {
      c = 0; f = 0; cc = 0;
      switch (atype) {
        case 8: case 13: case 20: case 21: case 27:
          if (mindweb && (cRoll(10) === 1)) {
            mindweb = 0; ljnk(111, 14, 23, 1); await MessPause(10, 0);
          }
          if (mindweb) {
            Ljnkbig(114, 21, 23, 0, 0, 0, Der$(FALSE, i, 1), 1, 1);
            ljnk(114, 44, 15, 2); damage = -1; continue nxcreatk;
          }
          break;
        case 17:
          if (berfresh) continue nxcreatk;
          break;
      }
      switch (atype) {
        case 1:  // kinetic
          siz = 6; if (astr === 0) { astr = 1; siz = 3; }
          dam = rolldice(siz, astr, astr); dam = DamSuit(0, dam);
          if (pmut === 5 && berpmut === 0) dam = cint(dam * (0.75 + 0.25 * qb(berhpmut > 0)));
          if (damage !== 0) { a = 53; b = 11; c = 20; } else { a = 53; b = 1; c = 10; }
          damage = damage + dam;
          if (attackrange > 1) { a = 53; b = 31; c = 20; }
          if (attackrange === 1) touch = TRUE;
          break;
        case 2:  // radiation
          siz = 5; if (astr === 0) { astr = 1; siz = 3; }
          dam = rolldice(siz, astr, astr);
          if (rr > 1) dam = cint(dam * 12 / (rr + 1)); else dam = dam * 5;
          dam = DamSuit(1, dam);
          if ((pmut === 8 && berpmut === 0)) dam = cint(dam * (0.75 + 0.25 * qb(berhpmut > 0)));
          if (dam < 1) dam = 1;
          damage = damage + dam; a = 54; b = 1; c = 15;
          break;
        case 3:  // poison type 1
          siz = 4; if (astr === 0) { astr = 1; siz = 3; }
          dam = rolldice(siz, astr, astr);
          if (con > 2) dam = cint(dam * 12 / (con + 1)); else dam = dam * 4;
          if ((pmut === 7 && berpmut === 0)) dam = cint((dam + 1) / (2 - 2 * qb(berhpmut > 0)));
          damage = damage + dam; a = 54; b = 28; c = 13;
          if (cRoll(50) <= astr) {
            if (!(pmut === 7 && berpmut === 0 && cRoll(5) > 1)) {
              dex = dex - 1; if (rnd() < 0.9) dextox = dextox + 1;
              if (rdisp === 1) DisplayCharacter();
            }
          }
          if (attackrange === 1) touch = TRUE;
          break;
        case 4:  // type 2
          siz = 4; if (astr === 0) { astr = 1; siz = 3; }
          dam = rolldice(siz, astr, astr);
          if (con > 1) dam = cint(dam * 7 / (con + 1)); else dam = dam * 4;
          if ((pmut === 7 && berpmut === 0)) dam = cint((dam + 1) / (2 - 2 * qb(berhpmut > 0)));
          damage = damage + dam;
          if (cRoll(10) <= astr) {
            if (!(pmut === 7 && berpmut === 0 && cRoll(5) > 1)) {
              str = str - 1; if (rnd() < 0.9) strtox = strtox + 1;
              if (rdisp === 1) DisplayCharacter();
            }
          }
          SetCombatStats();
          if (attackrange === 1) touch = TRUE;
          a = 54; b = 28; c = 13;
          break;
        case 5:  // type 3
          if (cRoll(10) <= astr) {
            if (!(pmut === 7 && berpmut === 0 && cRoll(5) > 1)) {
              damg = cRoll(idiv(lvl + astr, 2)); hitmax = hitmax - damg;
              if (cRoll(10) !== 1) hittox = hittox + damg;
              con = con - 1; if (rnd() < 0.9) contox = contox + 1;
              if (rdisp === 1) DisplayCharacter();
            }
          } else if (cRoll(3) === 1 && !(pmut === 7 && berpmut === 0 && cRoll(5) > 1)) {
            damg = idiv(astr, 3) + 1; hitmax = hitmax - damg; hittox = hittox + damg;
          }
          dam = rolldice(2, astr, astr);
          if (con > 3) dam = cint(dam * 12 / (con + 1)); else dam = dam * 3;
          if ((pmut === 7 && berpmut === 0)) dam = cint((dam + 1) / (2 - 2 * qb(berhpmut > 0)));
          damage = damage + dam + damg; a = 256; b = 52; c = 10;
          if (attackrange === 1) touch = TRUE;
          break;
        case 6:  // acid
          siz = 6; if (astr === 0) { astr = 1; siz = 3; }
          dam = rolldice(siz, astr, astr); dam = DamSuit(5, dam);
          damage = damage + dam; a = 54; b = 41; c = 28;
          if (attackrange === 1 && pmut === 1) touch = TRUE;
          break;
        case 7:  // laser
          siz = 4; if (astr === 0) { astr = 1; siz = 3; }
          dam = rolldice(siz, astr, astr);
          if ((pmut === 8 && berpmut === 0)) dam = cint(dam * (0.5 + 0.3 * qb(berhpmut > 0)));
          if ((mmut === 10 && bermmut === 0)) dam = cint(dam * (0.75 + 0.25 * qb(berhmmut > 0)));
          a = 55; b = 1; c = 22;
          if ((mirror > 0) && (cRoll(100) < 30 + 3 * (dex + dexadd))) {
            if ((cRoll(100) < 30 + 3 * (dex + dexadd))) {
              a = 257; b = 1; c = 31;
              Ljnkbig(257, 32, 17, 0, 0, 0, Der$(FALSE, i, 1), 0, 2);
              ncre[i][2] = ncre[i][2] - dam;
            } else {
              Ljnkbig(257, 1, 24, 285, 1, 15, bl, 2, 1); c = 0; l2 = bl;
            }
            damage = -1;
          } else {
            dam = DamSuit(3, dam); damage = damage + dam;
          }
          break;
        case 8:  // mental
          siz = 3; if (astr === 0) { astr = 1; siz = 2; }
          dic = rolldice(siz, astr, astr);
          dam = rolldice(siz, dic, dic);
          if (mr >= 0) dam = cint(dam * 17 / (mr + 6)); else dam = dam * 3;
          if ((mmut === 3 && bermmut === 0)) dam = cint((dam + 1) / (2 - 2 * qb(berhmmut > 0)));
          if (berscience > 0) { dam = cint(dam / 3); if (dam === 0) dam = 1; }
          damage = damage + dam; a = 55; b = 23; c = 21;
          break;
        case 9:  // electrical
          siz = 8; if (astr === 0) { astr = 1; siz = 4; }
          if (attackrange === 1 || pmut === 1) touch = TRUE;
          dam = rolldice(siz, astr, astr);
          if (pmut === 1 && berpmut === 0) dam = cint(dam * (0.5 + 0.5 * qb(berhpmut > 0)));
          dam = DamSuit(4, dam); damage = damage + dam;
          a = 55; b = 44; c = 12;
          break;
        case 10:  // heat
          siz = 5; if (astr === 0) { astr = 1; siz = 3; }
          dam = rolldice(siz, astr, astr);
          if ((pmut === 8 && berpmut === 0)) dam = cint(dam * (0.67 + 0.33 * qb(berhpmut > 0)));
          dam = DamSuit(2, dam); damage = damage + dam;
          a = 55; b = 56; c = 10;
          if (attackrange === 1 && pmut === 1) touch = TRUE;
          break;
        case 11:  // cold
          siz = 7; if (astr === 0) { astr = 1; siz = 3; }
          dam = rolldice(siz, astr, astr);
          if (brandy > 0 && dam > 1) dam = dam - 1;
          dam = DamSuit(2, dam); damage = damage + dam;
          a = 56; b = 1; c = 12;
          if (attackrange === 1 && pmut === 1) touch = TRUE;
          break;
        case 12:  // tenticles
          if ((ncre[i][13] & (2 ** (idiv(j, 2) - 2))) || (vehicle !== 0)) {  // leave
            dam = rolldice(3, astr, astr); a = 56; b = 13; c = 16;
          } else {
            dam = cRoll(astr); a = 52; b = 42; c = 13;
            if (ncre[i][13] === 0) grabbed = grabbed + 1;
            ncre[i][13] = (ncre[i][13] | (2 ** (idiv(j, 2) - 2)));
          }
          damage = damage + dam; touch = TRUE;
          break;
        case 13:  // life leech
          dam = cRoll(cint(astr / 2)) + cRoll(cint(astr / 2));
          if (mr >= 0) dam = cint(dam * 17 / (mr + 6)); else dam = dam * 3;
          if (berscience > 0) { dam = cint(dam / 3); if (dam === 0) dam = 1; }
          damage = damage + dam; a = 56; b = 29; c = 26;
          ncre[i][2] = ncre[i][2] + dam; ncre[i][3] = ncre[i][3] + idiv(dam, 3);
          break;
        case 14:  // steal
          if (astr === 0) astr = cRoll(8);
          stol = 0;
          for (let k = 1, kEnd = ngoody; k <= kEnd; k++) {
            l = cRoll(ngoody);
            if (Math.abs(goody[l][1]) === astr) { stol = l; break; }
            if ((astr === 1 || astr === 2) && (cRoll(2) === 1)) astr = 3 - astr;
            if ((astr === 7 || astr === 8) && (cRoll(2) === 1)) astr = 15 - astr;
          }
          if (stol > 0) {    // no steal Pres ID
            if (Math.abs(goody[stol][1]) === 7 && goody[stol][11] === 19 && goody[stol][5] > 3) stol = 0;
          }
          if (stol > 0) {
            if (typ === japb) {
              st1 = jnk$(56, 55, 7) + rtrim$(gdy[stol]);
            } else if (typ === gill) {
              st1 = jnk$(117, 17, 12) + rtrim$(gdy[stol]);
            } else if (Math.abs(goody[stol][1]) < 3) {
              st1 = jnk$(330, 48, 18) + rtrim$(gdy[stol]);
            } else {
              st1 = jnk$(332, 55, 10) + rtrim$(gdy[stol]);
              if (Math.abs(goody[stol][1]) === 3 && goody[stol][3] > 1) st1 = st1 + 's';
            }
            l1 = Der$(FALSE, i, 2) + st1;
            if (Math.abs(goody[stol][1]) === 7 && goody[stol][11] === 2) {  // backpack
              if (cRoll(2) === 1) Scatter(1);
            } else if (Math.abs(goody[stol][1]) === 8 && goody[stol][11] === 8) {  // safe
              if (cRoll(2) === 1) Scatter(2);
            }
            if (Math.abs(goody[stol][1]) < 3) {  // food
              remchance = 0; goody[stol][3] = goody[stol][3] - 1;
              if (goody[stol][3] <= 0) RemoveGoody(stol, FALSE);
            } else {
              RemoveGoody(stol, FALSE); SetCombatStats(); remchance = 95;
            }
            damage = -1;
            if (typ === gill) remchance = 0;
            if (cRoll(100) < remchance && i !== tentgrab) ncre[i][2] = -2000;  // removecreat
            DisplayCharacter();
            if (fastfight) await MessPause(12, 0);
          } else {
            a = 53; b = 1; c = 10; siz = lvl; numd = 1;
            if (typ === gill) { siz = cint(lvl / 3 + 1); numd = 4; }
            dam = rolldice(siz, numd, numd); damage = damage + dam;
          }
          break;
        case 15:  // tickle
          siz = 4; if (astr === 0) { astr = 1; siz = 2; }
          dam = rolldice(siz, astr, astr);
          if (pmut === 5 && berpmut === 0) dam = cint(dam * 3 / (4 - 4 * qb(berhpmut > 0)));
          damage = damage + dam; a = 57; b = 1; c = 24; touch = TRUE;
          break;
        case 16:  // damage armor
          if (j !== 6) continue nxcreatk;
          damage = -1; hits = hits - rolldice(astr + 1, astr + 1, astr + 1);
          touch = TRUE; zzz = 100;
          for (let k = 1; k <= astr + 1; k++) {
            zz = cRoll(105 - 5 * k); if (zzz > zz) zzz = zz;
          }
          aa = 55; bb = 2; cc = 7;
          if (zzz < 13) damarmor();
          else if (zzz < 40) damshield();
          break;
        case 17:   // pooped
          aa = 55; bb = 2; cc = 7; d = 219; e = 22; f = 18; damage = -1;
          if (fatigue < 130) fatigue = 130; else fatigue = fatigue + 9;
          if (attackrange === 1) touch = TRUE;
          break;
        case 18:   // spores
          if (astr > 0) dam = rolldice(5, astr, astr); else dam = -1;
          damage = damage + dam; a = 226; b = 49; c = 20;
          switch (ncre[i][1]) {
            case lotus: aa = 226; bb = 50; cc = 19; c = 0;
              d = 227; e = 1; f = 12; berconfuse = berconfuse + 1;
              break;
            case rweed: aa = 226; bb = 50; cc = 19; c = 0;
              berhic = berhic + cRoll(4); ber$ = 'aaaChoo!';
              if (cRoll(4) === 1 && i !== tentgrab) ncre[i][2] = -2000;   // sign to removecreat
              break;
            case gmold: damage = damage + spore; spore = spore + 1; d = 137;
              if (spore >= 1 && spore <= 3) { e = 1; f = 12; }        // odd
              else if (spore >= 4 && spore <= 6) { e = 13; f = 15; }  // sweat
              else if (spore >= 7 && spore <= 9) { e = 28; f = 20; }  // lightheaded
              else { e = 48; f = 20; }                                // heart racing
              break;
            default: l2 = 'for' + str$(dam) + jnk$(227, 16, 17);
          }
          break;
        case 19:   // trample
          touch = TRUE; siz = 6; if (astr === 0) { astr = 1; siz = 3; }
          dam = rolldice(siz, astr, astr);
          if (pmut === 5 && berpmut === 0) dam = cint(dam * (0.75 + 0.25 * qb(berhpmut > 0)));
          damage = damage + dam; ljnk(226, 37, 12, 1); l1 = bl + l1;
          break;
        case 20:   // attract
          if (ncre[i][13] === 0) {
            damage = -1; aa = 236; bb = 57; cc = 11;
            attractx = sgn(ncre[i][4]); attracty = sgn(ncre[i][5]);
          } else {
            dam = 0; a = 56; b = 61; c = 7;
          }
          break;
        case 21:    // drain
          damage = -1; if (attackrange === 1) touch = TRUE;
          aa = 239; bb = 15; cc = 10; d = 239; e = 25; f = 16;
          rnds = rolldice(12, astr, astr); lostexp = FALSE;
          if ((cRoll(2) === 1)) {
            if (pmutturns === 0) {
              pmutturns = rnds; berpmut = pmutturns;
              switch (pmut) {
                case 2: dex = dex - 10; break;
                case 3: str = str - 10; break;
                case 4: other2hitc = other2hitc - 1; other2hitr = other2hitr - 2; break;
                case 5: skinac = skinac - 5; SetCombatStats(); break;
                case 7: con = con - 10; hits = hits - 2 * lvl; hitmax = hitmax - 2 * lvl;
                  if (hits < 0) { st1 = jnk$(17, 15, 12); await Dead(0); continue nxcreatk; }
                  break;
                case 8: rr = rr - 10; break;
                case 14: zippy = 0; break;
              }
            } else {
              lostexp = TRUE;
            }
          } else {
            if (mmutturns === 0) {
              mmutturns = mmutturns + rnds; bermmut = mmutturns;
              switch (mmut) {
                case 1: other2hitc = other2hitc - 2; other2hitr = other2hitr - 2;
                  otherdam = otherdam - 4; break;
                case 2: intl = intl - 10; break;
                case 3: mr = mr - 10; break;
                case 7: forcefield = FALSE; break;
              }
            } else {
              lostexp = TRUE;
            }
          }
          if (lostexp) {
            lose = clng((expr * rnd() * 0.05 + 2) * astr);
            expr = expr - lose;
            if (typ === grinch) grinchstole = grinchstole + lose;
            [newlev, b$] = Level(newlev, b$); DisplayCharacter();
            if (newlev) {
              Ljnkbig(aa, bb, cc, 0, 0, 0, Der$(FALSE, i, 2) + bl, 0, 1);
              l2 = b$; await MaybeMessPause(13, 0); cc = 0; f = 0;
              Ljnkbig(14, 26, 17, 0, 0, 0, str$(lvl), 1, 1); l2 = b$;
            }
          }
          SetCombatStats();
          DisplayCharacter();
          break;
        case 22:   // blind
          damage = -1; aa = 249; bb = 34; cc = 11;
          if (attackrange === 1) touch = TRUE;
          rnds = rolldice(4, astr, astr);
          if ((pmut === 8 && berpmut === 0)) rnds = cint(rnds * (0.67 + 0.33 * qb(berhpmut > 0)));
          if ((pmut === 4 && berpmut === 0)) rnds = cint(rnds * (0.4 + 0.2 * qb(berhpmut > 0)));
          if ((mmut === 10 && bermmut === 0)) rnds = cint(rnds * (0.3 + 0.15 * qb(berhmmut > 0)));
          if (sunglasses) {
            damage = 0;
          } else {
            berblind = berblind + rnds;
            [dark, olddark, changed] = SetDark(dark, olddark, changed); if (changed) ChangeDark();
          }
          break;
        case 23:   // sick
          if (!(gasmask | spacesuit)) {
            damage = -1; aa = 249; bb = 45; cc = 13;
            rnds = rolldice(3, astr, astr); sick = sick + rnds;
          }
          break;
        case 24:   // help
          break;
        case 25:   // gore
          siz = 6; if (astr === 0) { astr = 1; siz = 3; }
          dam = rolldice(siz, astr, astr);
          if (pmut === 5 && berpmut === 0) dam = cint(dam * (0.75 + 0.25 * qb(berhpmut > 0)));
          touch = TRUE; damage = damage + dam; a = 298; b = 58; c = 11;
          break;
        case 26:   // special
          damage = -1; l1 = 'Special attack - not yet implemented';
          switch (typ) {
            case tworm: tapeworm = TRUE;
              aa = 311; bb = 38; cc = 24; d = 285; e = 65; f = 4;
              ncre[i][2] = -2000;   // sign to removecreat
              break;
            case skip:
              dam = rolldice(cint(lvl / 2), 6, 4);
              if (pmut === 5 && berpmut === 0) dam = cint(dam * (0.75 + 0.25 * qb(berhpmut > 0)));
              touch = TRUE; damage = damage + dam; a = 412; b = 1; c = 21;
              break;
            case prof:
              dam = rolldice(cint(lvl / 2), 3, 3);
              switch (cRoll(5)) {
                case 1: case 2:    // acid
                  dam = DamSuit(5, dam); a = 112; b = 39; c = 27; break;
                case 3: case 4:    // electrical
                  dam = DamSuit(4, dam); a = 113; b = 17; c = 35; break;
                default:           // flashpowder
                  if ((pmut === 8 && berpmut === 0)) dam = cint(dam * (0.67 + 0.33 * qb(berhpmut > 0)));
                  dam = DamSuit(2, dam); a = 115; b = 7; c = 36;
                  berblind = berblind + 5;
                  [dark, olddark, changed] = SetDark(dark, olddark, changed); if (changed) ChangeDark();
              }
              damage = damage + dam;
              break;
            case ging: case mary:
              dam = rolldice(lvl, 1, 1);
              if (pmut === 5 && berpmut === 0) dam = cint(dam * (0.75 + 0.25 * qb(berhpmut > 0)));
              touch = TRUE; damage = damage + dam; a = 389; b = 1; c = 26;
              break;
            case mrhow:
              dam = rolldice(cint(lvl / 2), 3, 2);
              if (pmut === 5 && berpmut === 0) dam = cint(dam * (0.75 + 0.25 * qb(berhpmut > 0)));
              touch = TRUE; damage = damage + dam; a = 412; b = 22; c = 28;
              break;
            case mrshow:
              dam = rolldice(lvl, 1, 1);
              if (pmut === 5 && berpmut === 0) dam = cint(dam * (0.75 + 0.25 * qb(berhpmut > 0)));
              touch = TRUE; damage = damage + dam; a = 413; b = 1; c = 27;
              break;
            case herm:
              dam = rolldice(cint(lvl / 2), 6, 4);
              if (pmut === 5 && berpmut === 0) dam = cint(dam * (0.75 + 0.25 * qb(berhpmut > 0)));
              touch = TRUE; damage = damage + dam; a = 151; b = 41; c = 12;
              break;
            case gramp:
              a = 382; b = 32; c = 32; d = 383; e = 1; f = 48; Mousify();
              break;
            case elvis: case elvimp:
              dam = rolldice(lvl, 2, 2);
              if (pmut === 5 && berpmut === 0) dam = cint(dam * (0.75 + 0.25 * qb(berhpmut > 0)));
              touch = TRUE; damage = damage + dam; a = 381; b = 1; c = 38;
              break;
            case buzz:
              touch = TRUE; dam = rolldice(lvl, 5, 2);
              if (pmut === 5 && berpmut === 0) dam = cint(dam * (0.75 + 0.25 * qb(berhpmut > 0)));
              damage = damage + dam;
              ljnk(226, 37, 12, 1); l1 = bl + l1; d = 389; e = 27; f = 27;
              inew = -Math.abs(inew);   // so creatdo won't change l2
              break;
            case cubs:
              dam = rolldice(lvl, 4, 4);
              if (pmut === 5 && berpmut === 0) dam = cint(dam * (0.75 + 0.25 * qb(berhpmut > 0)));
              if (metshat) dam = idiv(dam, 3);
              damage = damage + dam; touch = TRUE;
              a = 405; b = 29; c = 26; d = 406; e = 1; f = 24;
              inew = -Math.abs(inew);   // so creatdo won't change l2
              break;
            case saddam:
              dam = rolldice(lvl, 6, 4);
              if (pmut === 5 && berpmut === 0) dam = cint(dam * (0.75 + 0.25 * qb(berhpmut > 0)));
              damage = damage + dam; a = 405; b = 1; c = 28;
              break;
          }
          break;
        case 27:   // snooze
          damage = -1; aa = 237; bb = 21; cc = 20;
          asleep = TRUE; berhic = 0; sick = 0; zippy = -2;
          ncre[i][2] = -2000;   // sign to removecreat
          break;
      }
      if (c > 0) ljnk(a, b, c, 1);
      if (cc > 0) Ljnkbig(aa, bb, cc, 0, 0, 0, Der$(FALSE, i, 2) + bl, 0, 1);
      if (f > 0) ljnk(d, e, f, 2);
      showchan = 10;
    } else {    // missed
      switch (atype) {
        case 1: case 2: case 6: case 7: case 9: case 10: case 11: case 12: case 15: case 19: case 25:
          zzz = cRoll(75);
          if (zzz === 1 && j === 6) {
            ClearMess();
            damarmor(); if (num === 0) continue nxcreatk;
          } else if (zzz === 2 && j === 6) {
            ClearMess();
            damshield(); if (num === 0) continue nxcreatk;
          }
          break;
      }
    }
  }

  if (idiv(ncre[i][7], 1000) === 0) {   // fc=0: sometimes show critter
    if (cRoll(showchan) === 1) {
      PutSym(imod(ncre[i][7], 1000), localx + ncre[i][4], localy + ncre[i][5], 8, 0, -1);
    }
  }

  if (damage > 0) damage = cint(damage * (13 - difficulty) / 13);
  return [inew, damage];
}

// All nearby creatures act (wake, attack, move ...).
async function CreatDo() {
  let chan = 0, typ = 0, kild = FALSE, xx = 0, yy = 0, wake = FALSE, srxxyy = 0, ccc = 0;
  let creconfu = FALSE, range = 0, attackrange = 0, sensed = 0, atype = 0, noimpersonators = FALSE;
  let xdro = 0, ydro = 0, candrop = FALSE, ss = 0, fc = 0, bc = 0, blpos = 0, x = 0, y = 0, sym = 0;
  let atk = FALSE, moved = FALSE, ratio = 0, inew = 0, damage = 0, olddamage = 0, ffkill = FALSE;
  let fract = 0, a = 0, b = 0, c = 0, dam = 0, siz = 0, age = 0, chan_s = 0, newsym = 0, newf = 0;
  const max = 0;        // (sic) undeclared variable in "CASE grinch, max"
  if (incastle === -1) {
    chan = (4 - 6 * qb(beryum !== 0)) * (1 + qb(nnear === 0)) * (1 + tent);
    switch (castle) {
      case 1: if (castlelevel === elvislevel) chan = 0; break;
      case 2: if (castlelevel === -7) chan = 0; break;
      case 3: if (castlelevel === 5) chan = 0; break;
      case 4: if (castlelevel === 7) chan = 0; break;
      case 5: if (castlelevel === -5) chan = 0; break;
      case 6: if (castlelevel === grinchlevel) chan = 0; break;
    }
  } else if (incastle === 0) {
    chan = (8 - 16 * qb(beryum !== 0) - 4 * qb(terrain === 15) - 4 * qb(terrain === 177)) * (1 + tent);
  }

  if (incastle !== 1 && cRoll(15) === 1) tentgrab = creatsort(nnear, tentgrab, ncre);

  if (cRoll(1000) < chan) { MakeCreature(0, 0, TRUE, FALSE); await Awaken(nnear); }

  ErasePut();

  ncd: for (let i = 1, iEnd = nnear; i <= iEnd; i++) {
    typ = ncre[i][1]; kild = FALSE; touch = FALSE; ClearMess();
    xx = ncre[i][4]; yy = ncre[i][5]; wake = FALSE;
    srxxyy = SameRoom(xx, yy);
    if ((ncre[i][11] & 1) === 0) {
      chan = 3 - 3 * asleep - 30 * srxxyy;
      if (beryum && !(typ === elvis || typ === elvimp)) {
        wake = TRUE;
      } else if (ncre[i][11] & 56) {  // sneeze, burp, sick
        wake = TRUE;
      } else if (incastle === 1) {
        ccc = crd(xx, yy);
        if ((ccc <= 2) || (srxxyy && (ccc <= 12)) || (cRoll(1000) < chan)) wake = TRUE;
      } else if (i === tentgrab) {
        wake = TRUE;
      } else if (cRoll(1000) < chan && typ <= ncreat + creextra + 1) {
        wake = TRUE;
      }
      if (wake) await Awaken(i); else ncre[i][11] = 0;  // if asleep, no sneeze etc
    }
    if (i === tentgrab) touch = TRUE;
    switch (typ) {
      case elvis: case trump:
        if (!srxxyy && cRoll(10) === 1 && ((ncre[i][11] & 56) === 0)) ncre[i][11] = ncre[i][11] & ~1;
        break;
      case mph: ncre[i][2] = ncre[i][2] - qb(cRoll(20) === 1); break;
      case grinch: case max: ncre[i][6] = Math.abs(ncre[i][6]); break;
    }
    if ((ncre[i][10] & 256)) ncre[i][2] = ncre[i][2] + 1;
    if ((ncre[i][10] & 2048)) ncre[i][2] = ncre[i][2] + 3;
    if (ncre[i][2] > ncre[i][3]) ncre[i][2] = ncre[i][3];

    if ((qb((ncre[i][11] & 1) === 0) | bitit) !== 0) continue ncd;

    creconfu = FALSE;
    if ((ncre[i][11] & 8)) {      // sick
      if (cRoll(9) === 1) ncre[i][11] = ncre[i][11] & ~8;
      if (srxxyy) {
        Ljnkbig(343, 61, 8, 0, 0, 0, Der$(FALSE, i, 2), 0, 1);
        await MaybeMessPause(2, 0);
      }
      continue ncd;
    } else if ((ncre[i][11] & 16)) {      // burping
      if (cRoll(12) === 1) ncre[i][11] = ncre[i][11] & ~16;
      if (srxxyy) {
        Ljnkbig(162, 61, 8, 0, 0, 0, Der$(FALSE, i, 2), 0, 1);
        await MaybeMessPause(2, 0);
      }
      continue ncd;
    } else if ((ncre[i][11] & 32)) {      // sneezing
      if (cRoll(18) === 1) ncre[i][11] = ncre[i][11] & ~32;
      if (srxxyy) {
        Ljnkbig(385, 60, 9, 0, 0, 0, Der$(FALSE, i, 2), 0, 1);
        await MaybeMessPause(2, 0);
      }
      continue ncd;
    } else if ((ncre[i][11] & 6)) {  // blind or confused
      if (cRoll(30) === 1) ncre[i][11] = ncre[i][11] & ~2;
      if (cRoll(15) === 1) ncre[i][11] = ncre[i][11] & ~4;
      creconfu = qb(tentgrab !== i);
    }

    range = crd(xx, yy); if (range < 1) range = 1;
    switch (typ) {
      case robot: case rdro: case ddro: case sdro:
        attackrange = imod(idiv(ncre[i][14], 10), 10); break;
      default:
        attackrange = imod(Creature(typ, 7), 100);
    }
    if (ncre[i][13]) ncre[i][6] = Math.abs(ncre[i][6]);  // no flee if constrict

    if (srxxyy || (typ === brain)) {
      switch (typ) {
        case grinch: case max: case elvis: sensed = TRUE; break;
        case gramp: sensed = qb(bergreen === 0); break;
        case lily: case eddie: case mara:
          sensed = qb((invisible === 0) || (cRoll(range * 4) === 1));
          sensed = qb((sensed || (beryum !== 0)) && (bergreen === 0));
          break;
        case skip: sensed = qb((invisible === 0) || (cRoll(range * 4) === 1));
          sensed = qb(sensed || (beryum !== 0) || (cRoll(2) === 1));
          break;
        case brain: sensed = qb(mindweb === FALSE); break;
        default: sensed = qb((invisible === 0) || (cRoll(range * 4) === 1));
          sensed = qb(sensed && ((camosuit === 0) || (cRoll(6) !== 1)));
          sensed = qb(sensed || (beryum !== 0));
      }
      sensed = qb(sensed && (not(creconfu) || (cRoll(3) === 1)));
      sensed = qb(sensed || (tentgrab === i));
      for (let j = 6; j <= 14; j += 2) {
        atype = idiv(Creature(typ, j + 1), 100);
        if ((ncre[i][13] & (2 ** (idiv(j, 2) - 2))) && (atype === 12)) sensed = TRUE;
      }
    } else {
      sensed = FALSE;
    }

    if ((range <= attackrange) && (ncre[i][6] >= 0) && sensed) {
      if ((typ === elvis)) {
        noimpersonators = TRUE;
        for (let zn = 1; zn <= nnear; zn++) {
          if (ncre[zn][1] === elvimp) { noimpersonators = FALSE; zn = nnear; }
        }
        if (noimpersonators) {
          finishedcastles = finishedcastles | 1;
          xdro = xx + localx; ydro = yy + localy; candrop = FALSE;
          while (!candrop) {
            xdro = xdro + cRoll(3) - 2; ydro = ydro + cRoll(3) - 2;
            if (xdro < 2 || xdro > 50) xdro = xx + localx;
            if (ydro < 2 || ydro > 20) ydro = yy + localy;
            [ss, fc, bc] = GetSym(xdro, ydro, 2); if (ss === 250) candrop = TRUE;
          }
          AddToDrop(-nberry - 5); PutSym(145, xdro, ydro, 1, 0, -1);   // drop BSS
          drgoody[1][15] = xdro; drgoody[1][16] = ydro;
          st1 = rtrim$(ltrim$(name$)); blpos = instr(st1, bl);
          if (blpos === 0) blpos = len(st1) + 1;
          if (blpos > 13) blpos = 13;
          st1 = left$(st1, blpos - 1); ClearMess();
          Ljnkbig(378, 1, 8, 378, 9, 34, st1, 1, 1); ljnk(379, 1, 31, 2);
          for (let ispam = 1; ispam <= 3; ispam++) {
            xdro = xx + localx; ydro = yy + localy; candrop = FALSE;
            while (!candrop) {
              xdro = xdro + cRoll(3) - 2; ydro = ydro + cRoll(3) - 2;
              if (xdro < 2 || xdro > 50) xdro = xx + localx;
              if (ydro < 2 || ydro > 20) ydro = yy + localy;
              [ss, fc, bc] = GetSym(xdro, ydro, 1); if (ss === 250) candrop = TRUE;
            }
            AddToDrop(-nberry - 11); PutSym(22, xdro, ydro, 5, 0, -1);
            drgoody[1][15] = xdro; drgoody[1][16] = ydro;
          }
          await MessPause(9, 0); ncre[i][2] = -2000;   // sign to removecreat
          AddToDrop(-nberry - 17);          // tape recorder
          do {   // inccd:
            x = cRoll(8) + 22; y = cRoll(4) + 9;
            [sym] = GetSym(x, y, 2);
          } while (sym !== 250);
          PutSym(10 + cRoll(2), x, y, 14, 0, -1);
          drgoody[1][15] = x; drgoody[1][16] = y;
          continue ncd;
        }
      }

      atk = TRUE;
      if (sousa) {
        ncre[i][6] = -Math.abs(ncre[i][6]); moved = await CreatMove(i, moved); atk = FALSE;
        ncre[i][6] = Math.abs(ncre[i][6]);
      } else if (SmartCre(typ)) {
        ratio = cint(fdiv(100 * ncre[i][2], ncre[i][3]));
        if ((ratio < 33 && (range === 1 && attackrange > 1)) || (ratio < 15)) {
          if ((imod(ncre[i][8], 1000) !== cen) || (ratio < 15)) {
            ncre[i][6] = -Math.abs(ncre[i][6]); moved = await CreatMove(i, moved); atk = not(moved);
            ncre[i][6] = Math.abs(ncre[i][6]);
          }
        }
      }
      if (atk) {
        inew = i; [inew, damage] = await CreatAttack(inew, damage);
        // will set inew=-inew if shouldn't change l2, inew = 0 if l1&l2
        if (berscare && cRoll(4) === 1) ncre[i][6] = -Math.abs(ncre[i][6]);
        olddamage = damage;
        if (damage > 0) {
          l1 = Der$(FALSE, i, 2) + l1;
          [damage, ffkill] = ffEffect(damage, ffkill);
          if ((qb(damage < olddamage) | ffgen | forcefield | berff) !== 0) {
            fract = cint(100 * (olddamage - damage) / olddamage);
            Ljnkbig(83, 1, 23, 83, 24, 15, str$(fract), 1, 2); l3 = '';
            if (ffkill) {
              await MessPause(4, 0); ClearMess();
              Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
            }
          }
        } else if (damage === 0) {
          if (typ === cubs) { a = 164; b = 54; c = 8; } else { a = 56; b = 61; c = 7; }
          if (inew !== 0) Ljnkbig(a, b, c, 0, 0, 0, Der$(FALSE, i, 2), 0, 1);
        }
        ei: {
          if (damage < 1) {
            break ei;
          } else if (damage === olddamage && inew > 0) {
            if (damage === 1) st1 = ''; else st1 = 's';
            l2 = 'for' + str$(damage) + jnk$(80, 58, 6) + st1 + jnk$(57, 54, 10);
          }
          hits = hits - damage;
        }
        // ei:
        ShowHits();
        if (hits < 0) {
          st1 = Der$(TRUE, i, 3); if (typ === elvimp) st1 = jnk$(369, 45, 21);
          await Dead(0); return;
        }
        await MaybeMessPause(12, 0);
        if (asleep && zippy === 0) {
          asleep = FALSE; zippy = -6; ClearMess();
          ljnk(255, 1, 23, 1); await MaybeMessPause(12, 0);
        }
        if (touch) {
          if (shock) {
            if (pmutturns === 0) pmutturns = 1;
            pmutturns = pmutturns + 3 + 2 * qb(berhpmut > 0);
            fatadd = fatadd + 5;
            if ((ncre[i][10] & 4) === 0) {
              dam = rolldice(lvl + 4, 2, 2) + otherdam;
              if (berhpmut > 0) dam = cint(dam * 1.5);
              if (cRoll(20) === 1) dam = dam * 2;
              [dam] = CrDamAlter(i, dam, 9); ncre[i][2] = ncre[i][2] - dam;
              if (ncre[i][2] < 0) kild = TRUE;
              Ljnkbig(83, 39, 18, 0, 0, 0, bl + Der$(FALSE, i, 1), 1, 1);
              l2 = '';
              await MaybeMessPause(11, 0);
            } else {
              Ljnkbig(205, 1, 27, 0, 0, 0, Der$(FALSE, i, 2) + bl, 0, 1);
              l2 = '';
              await MaybeMessPause(2, 0);
            }
          }
          if (pmut === 16 && pmutturns === 0) {
            siz = 2 + idiv(lvl, 2); if (berhpmut > 0) siz = siz * 2;
            if (cRoll(20) === 1) siz = siz * 2;
            dam = siz + 1 - rolldice(siz, 2, 1); [dam] = CrDamAlter(i, dam, 1);
            if (dam > 0) {
              ncre[i][2] = ncre[i][2] - dam;
              if (ncre[i][2] < 0) kild = TRUE;
              Ljnkbig(102, 20, 19, 0, 0, 0, bl + Der$(FALSE, i, 1), 1, 1);
              if (not(kild)) await MaybeMessPause(6, 0);
            }
          }
        }
        if (typ === pryor && cRoll(8) === 1) {
          ljnk(87, 30, 22, 1); ncre[i][2] = -1000;  // remove him
          dam = rolldice(lvl, 4, 4); dam = DamSuit(2, dam);
          [dam, ffkill] = ffEffect(dam, ffkill);
          if (ffkill) {
            await MessPause(4, 0); ClearMess();
            Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
          }
          hits = hits - dam; ShowHits();
          ljnk(87, 30, 22, 1); await MaybeMessPause(4, 0);
          if (hits < 0) { st1 = 'a burning ' + CreatNam$(typ, i); await Dead(0); return; }
        }
      }
    } else {
      if (sousa) {
        ncre[i][6] = -Math.abs(ncre[i][6]); moved = await CreatMove(i, moved);
        ncre[i][6] = Math.abs(ncre[i][6]);
      } else if (SmartCre(typ)) {
        if (fdiv(ncre[i][2], ncre[i][3]) < 0.15) {
          ncre[i][6] = -Math.abs(ncre[i][6]); moved = await CreatMove(i, moved);
          ncre[i][6] = Math.abs(ncre[i][6]);
        } else {
          moved = await CreatMove(i, moved);
        }
      } else {
        moved = await CreatMove(i, moved);
      }
    }

    if (typ === bunny) {
      if ((ncre[i][11] === 1) && not(kild) && range <= 8) {
        age = ncre[i][14] + 1; chan_s = Math.fround((0.3 + lvl * 0.025) * (2 ** (-age)));
        if ((SameRoom(ncre[i][4], ncre[i][5])) && (rnd() < chan_s) && (age <= lvl)) {
          crtyp = bunny;
          MakeCreature((ncre[i][4] + localx), (ncre[i][5] + localy), FALSE, FALSE);
          ncre[i][14] = age; ncre[nnear][14] = age; await Awaken(nnear);
        }
      }
    } else if (typ === magg) {
      if ((not(ncre[i][14]) & qb(cRoll(10) === 1) & srxxyy & not(kild)) !== 0) {
        ncre[i][2] = cint((ncre[i][2] + ncre[i][3]) / 2 + 12);
        ncre[i][3] = ncre[i][3] + 12;
        ncre[i][6] = 2; ncre[i][7] = 7102;
        ncre[i][9] = ncre[i][9] - 8; ncre[i][10] = ncre[i][10] | 328;
        await Awaken(i); ncre[i][14] = TRUE; ClearMess(); EraseCreat(i); PutCreat(i);
        ljnk(258, 1, 24, 1); await MaybeMessPause(7, 0);
      }
    } else if (typ === algore) {
      if ((ncre[i][11] === 1) && not(kild)) {
        for (let jj = 1, jjEnd = cRoll(2) + cRoll(2); jj <= jjEnd; jj++) {
          xx = ncre[i][4] + localx + cRoll(5) - 3;
          yy = ncre[i][5] + localy + cRoll(5) - 3;
          [sym, fc, bc] = GetSym(xx, yy, 2);
          if (incastle === 0 && castle !== 0) {
            if (xx < rwscr && xx > lwscr && yy < bwscr && yy > twscr) sym = -1;
          }
          switch (sym) {
            case 32: case 250: case 249: case 176: newsym = 42; newf = 2; break;
            case 42: if (fc === 10) { newsym = 15; newf = 2; } else { newsym = 42; newf = 10; } break;
            case 15: newsym = 15; newf = 10; break;
            default: newsym = 0;
          }
          if (newsym) {
            if (xx > 1 && xx < 52 && yy > 1 && yy < 22) {
              PutSym(newsym, xx, yy, newf, bc, -1);
            }
          }
        }
      }
    }

    if (ncre[i][6] < 0) {
      if (((range <= attackrange && cRoll(5) === 1) || (cRoll(15) === 1)) && not(didmusk)) ncre[i][6] = Math.abs(ncre[i][6]);
    }
  }

  for (let i = nnear; i >= 1; i--) {
    if (imod(ncre[i][8], 1000) === gas) {
      if ((ncre[i][10] & 1024) === 0) {
        dam = rolldice(4, 3, 3);
        if ((ncre[i][12] & 1024)) dam = dam * 2;
        ncre[i][2] = ncre[i][2] - dam;
      }
    }
    if (ncre[i][2] < 0 && ncre[i][2] > -1000) {
      ClearMess();
      if (ncre[i][1] === elvimp) {
        ljnk(295, 1, 38, 2);
      } else {
        Ljnkbig(238, 52, 14, 0, 0, 0, Der$(FALSE, i, 1), 1, 2);
      }
      await KillCreat(i);
    } else if (crd(ncre[i][4], ncre[i][5]) > 60 || ncre[i][2] < -999) {
      RemoveCreat(i);
    }
  }
}

// Moves creature i.  Returns moved.
async function CreatMove(i, moved) {
  let typ = 0, badcount = 0, x = 0, y = 0, dx = 0, dy = 0, aaa = 0, bad = 0, newx = 0, newy = 0;
  let mx = 0, my = 0, mlocx = 0, mlocy = 0, sym = 0, fcolr = 0, bcolr = 0, sym2 = 0, fc2 = 0, bc2 = 0;
  let srep = 0, frep = 0, steal = 0, dropped = 0;
  const elvisimp = 0;   // (sic) undeclared variable, not elvimp

  if (i === tentgrab) { moved = FALSE; return moved; }

  if (incastle && asleep) {
    if (!(castle === 6 && castlelevel === grinchlevel)) {
      if (not(SameRoom(ncre[i][4], ncre[i][5]))) {
        if (Math.abs(ncre[i][6]) > 0 && ncre[i][1] < ncreat + creextra + 1) {
          if ((cRoll(5) === 1)) { TeleCreat(ncre[i][4], ncre[i][5]); return moved; }
        }
      }
    }
  }

  typ = ncre[i][1]; moved = FALSE;
  nxi: for (let movespeed = 1, msEnd = Math.abs(ncre[i][6]); movespeed <= msEnd; movespeed++) {
    if ((ncre[i][12] & -32768) && (cRoll(2) === 1)) continue nxi;
    badcount = -1 + qb(incastle === 0);    // leave as is!
    nxii: {
      fdxy: for (;;) {
        x = ncre[i][4]; y = ncre[i][5]; badcount = badcount + 1 - qb(incastle === 0);
        if (badcount >= 3 - qb(incastle === 0)) {
          dx = 0; dy = 0;
        } else {
          aaa = cfinddxdy(x, y, badcount);
          dy = (aaa % 10) - 1; dx = int(aaa / 10) - 1;
          if (ncre[i][6] < 0) { dx = -dx; dy = -dy; }
          if ((ncre[i][11] & 6)) { dx = cRoll(3) - 2; dy = cRoll(3) - 2; }
          if (((invisible & qb(rnd() < 0.9)) | (camosuit & qb(cRoll(5) === 1) & qb(beryum === 0))) !== 0) {
            dx = cRoll(3) - 2; dy = cRoll(3) - 2;
            if (not(dx | dy)) { dx = cRoll(3) - 2; dy = cRoll(3) - 2; }
          }
        }
        bad = FALSE; newx = x + dx; newy = y + dy;
        if ((dx !== 0 || dy !== 0)) {
          bad = badmovecreat(newx, newy, nnear, i, ncre);
        } else {
          continue nxi;
        }
        if (repulse) {
          if ((Math.abs(x) > 1 || Math.abs(y) > 1)) {
            if ((Math.abs(newx) <= 1 && Math.abs(newy) <= 1)) bad = TRUE;
          }
        }
        if (bad) continue fdxy;
        EraseCreat(i);
        ncre[i][4] = newx; ncre[i][5] = newy; [mx, my, mlocx, mlocy] = FindMPos(i, mx, my, mlocx, mlocy);
        if ((mx !== mainx || my !== mainy)) { moved = TRUE; break nxii; }
        [sym, fcolr, bcolr] = GetSym(mlocx, mlocy, 1);
        [sym2, fc2, bc2] = GetSym(mlocx, mlocy, 2);
        if (incastle) {
          srep = 250; frep = 8;
          if (sym === 32 || sym === 250) { sym = sym2; fcolr = fc2; bcolr = bc2; }
        } else {
          srep = 32; frep = 7;
          if (sym === 32 || sym === 250) { sym = sym2; fcolr = fc2; bcolr = bc2; }
          if (sym2 === 215 || sym2 === 216) sym = sym2;
        }

        const back = () => { ncre[i][4] = x; ncre[i][5] = y; PutCreat(i); };
        if (bc2 === 4) { back(); continue fdxy; }
        if ((sym2 === 247 || sym2 === 126)) {
          if (typ <= ncreat + creextra - creh2o) {
            back(); continue fdxy;
          }
        } else if ((typ > ncreat + creextra - creh2o) && (typ <= ncreat + creextra)) {
          switch (sym2) {
            case 179: case 196: case 217: case 218: case 191: case 192:  // borders
              break;
            default: back(); continue fdxy;
          }
        }

        steal = -1;
        if (idiv(Creature(typ, 7), 100) === 14) steal = idiv(Creature(typ, 6), 100);
        switch (sym) {
          case 32:
            if (incastle) { back(); continue fdxy; }
            break;
          case 176: case 249: case 0: case 126: case 247: case 250:
            break;
          case 240: case 179: case 196:
            break;
          case 8: case 9: case 24:  // wep, shield and armor
            if (steal === 0) {
              PutSym(srep, mlocx, mlocy, frep, 0, -1);
              [mlocx, mlocy, dropped] = RemoveLocalGoody(mlocx, mlocy, dropped);
            }
            break;
          case 5: case 236:    // ber
            if (steal === 6 || steal === 0) {
              PutSym(srep, mlocx, mlocy, frep, 0, -1);
              [mlocx, mlocy, dropped] = RemoveLocalGoody(mlocx, mlocy, dropped);
            }
            break;
          case 11: case 12: case 21: case 157:  // ssd,lsd
            if (steal === 7 || steal === 0) {
              PutSym(srep, mlocx, mlocy, frep, 0, -1);
              [mlocx, mlocy, dropped] = RemoveLocalGoody(mlocx, mlocy, dropped);
            }
            break;
          case 22:        // spam
            if ((typ === rat) || Yuck(i) || (typ === elvis) || steal === 1) {
              PutSym(srep, mlocx, mlocy, frep, 0, -1);
              [mlocx, mlocy, dropped] = RemoveLocalGoody(mlocx, mlocy, dropped);
              if (cRoll(3) === 1 && (ncre[i][12] & 2048) === 0) {
                ncre[i][11] = ncre[i][11] | 16;
              }
            } else if ((cRoll(10) - 1)) {
              back(); continue fdxy;
            }
            break;
          case 254:       // beef
            if ((typ === roach) || Yuck(i) || (typ === elvisimp) || steal === 1) {
              PutSym(srep, mlocx, mlocy, frep, 0, -1);
              [mlocx, mlocy, dropped] = RemoveLocalGoody(mlocx, mlocy, dropped);
              if (cRoll(3) === 1 && (ncre[i][12] & 2048) === 0) {
                ncre[i][11] = ncre[i][11] | 16;
              }
            } else if ((cRoll(10) - 1)) {
              back(); continue fdxy;
            }
            break;
          case gas:
            if ((cRoll(4) !== 1) || SmartCre(typ)) { back(); continue fdxy; }
            break;
          case cen: case lockeddoor: case secretdoor:
            if (sym === lockeddoor) {
              if ((cRoll(10) > 1) && typ !== robot && typ !== sdro && typ !== ddro && typ !== rdro) {
                back(); continue fdxy;
              }
            } else if (sym === secretdoor) {
              if (typ !== volte && cRoll(10) > 4) {
                back(); continue fdxy;
              }
            }
            if (incastle === 0) {
              back(); continue fdxy;
            } else {
              const [sy1, f1] = GetSym(mlocx + 1, mlocy, 2);
              const [sy2, f2] = GetSym(mlocx - 1, mlocy, 2);
              const [sy3, f3] = GetSym(mlocx, mlocy + 1, 2);
              const [sy4, f4] = GetSym(mlocx, mlocy - 1, 2);
              if (sy1 === 32 || sy2 === 32 || sy3 === 32 || sy4 === 32) {
                back(); continue fdxy;
              }
              if ((f1 === wallcolr && f3 === wallcolr) || (f2 === wallcolr && f4 === wallcolr)) {
                back(); continue fdxy;
              }
            }
            break;
          case 15: case 42:
            if (typ === tfrog || typ === bfoot || typ === algore) {
              movespeed = movespeed - 1;
            } else if (typ === term) {
              PutSym(srep, mlocx, mlocy, frep, 0, -1);
            } else if ((cRoll(16) - 1)) {
              back(); continue fdxy;
            }
            break;
          default: back(); continue fdxy;
            // this covers trap, pit, web, monolith, chasm
        }
        PutCreat(i); moved = TRUE;
        break;
      }
    }
    // nxii:
    if (ncre[i][13] !== 0) {
      grabbed = grabbed - 1; ncre[i][13] = 0;  // stop constricting if move
    }
  }
  return moved;
}

async function DrawCaves() {
  const rms = dimInt([0, 7], [0, 1]);
  let numrms = 0, xstair = 0, ystair = 0, ffc = 0, psym = 0, pf = 0, itemnum = 0;
  let maxcritter = 0, maxinrms = 0, x = 0, y = 0, sym = 0, fc = 0, bc = 0, ci = 0;
  numrms = Cave(numrms, rms);

  t$ = Terr$(terrain); DisplayCharacter(); PrintMessage(15, 0);

  [xstair, ystair] = finddot(incastle); localx = xstair; localy = ystair;
  currsym = 240; currf = 13; currb = 0;
  if (invisible) ffc = 8; else ffc = 15;
  PutSym(1, localx, localy, ffc, 0, 2);

  const cputit = () => {
    ci = Math.abs(itemnum) % (numrms + 1); x = rms[ci][0]; y = rms[ci][1];
    for (;;) {   // cputitxy:
      [sym, fc, bc] = GetSym(x, y, 2);
      if (sym === 250) {
        if (psym > 0) {
          PutSym(psym, x, y, pf, 0, 2);
          localgoody[itemnum + 1][1] = cint(psym + 256 * pf);
          localgoody[itemnum + 1][2] = x;
          localgoody[itemnum + 1][3] = y;
        } else {
          MakeCreature(x, y, FALSE, FALSE);
        }
        return;
      }
      x = rms[ci][0] + cRoll(3) - 2; y = rms[ci][1] + cRoll(3) - 2;
    }
  };

  goodycastle[0][0] = cint((2 ** (numrms + 1)) - 1);
  for (itemnum = 0; itemnum <= numrms; itemnum++) {
    switch (cRoll(12)) {
      case 1: case 2:   // ber
        psym = 5 + 231 * int(rnd() * 2); pf = 4 + 8 * int(rnd() * 2); cputit(); break;
      case 3:      // ssd
        psym = 11 + int(rnd() * 2); pf = 14; cputit(); break;
      case 4:      // lsd
        psym = 21 + 136 * int(rnd() * 2); pf = 11; cputit(); break;
      case 5: case 6:   // wep
        psym = 24; pf = 1; cputit(); break;
      case 7: case 8:   // sh
        psym = 9; pf = 3; cputit(); break;
      case 9: case 10:  // armor
        psym = 8; pf = 7; cputit(); break;
      case 11:     // beef
        psym = 254; pf = 6; cputit(); break;
      case 12:     // spam
        psym = 22; pf = 5; cputit(); break;
    }
  }
  crtyp = CaveCreat(); psym = -1;
  if (crtyp <= ncreat) {
    maxcritter = (numrms + 1) * 5 - crtyp + 2 * lvl;
  } else {
    maxcritter = (numrms + 1) * 4 + lvl;
  }
  if (crtyp === ant || crtyp === bee) maxcritter = maxcritter * 2;
  if (maxcritter > 45) maxcritter = 45;
  maxinrms = (numrms + 1) * (2 - qb(crtyp < 2 * lvl));
  for (itemnum = 1; itemnum <= maxinrms; itemnum++) cputit();
  maxcritter = maxcritter - maxinrms;
  for (let i = 1; i <= maxcritter; i++) {
    [x, y] = finddot(incastle); MakeCreature(x, y, FALSE, FALSE);  // puts other critters
  }

  if (crtyp > ncreat + crecas + crefor + creswa + crepla) {
    for (let i = 2; i <= 51; i++) {
      for (let j = 2; j <= 21; j++) {
        [sym, fc, bc] = GetSym(i, j, 2);
        if (sym === 250) PutSym(247, i, j, 1, 0, 2);
      }
    }
    for (let i = 1; i <= nnear; i++) ncre[i][8] = 1247;
  }

  screenPages(1); vpage = 1; ChangeDark();
  PrintMessage(5, 0); DisplayCharacter();
}

// Draws (or reloads) the current castle level.
async function DrawDungeon() {
  const place = dimInt(5);
  let x = 0, cl = 0, ndro = 0, lw = 0, rw = 0, tw = 0, bw = 0, xs = 0, ys = 0, special = 0;
  let entr = 0, xdoor = 0, ydoor = 0, bclr = 0, removed = FALSE, maxadd = 0, xx = 0, yy = 0;
  let sym = 0, fc = 0, bc = 0, didit = 0, y = 0, ffc = 0, nadd = 0, g = 0, lobyte = 0, hibyte = 0;
  let nthings = 0, symg = 0, fcg = 0, bad = FALSE, olddark = 0, changed = 0, t = 0;
  crandomize(seed + mainx + mainy * 50 + castlelevel);
  x = cint(rnd(Math.fround(-seed - mainx - mainy * 50 - castlelevel)));
  for (let i = 1; i <= castlelevel; i++) rnd() * cRoll(2);

  if (sunglasses) dark = -1;

  if ((LoadMaps(-1) === 0)) {
    // ----------------------------------------------

    if (lwall > rwall) { t = lwall; lwall = rwall; rwall = t; }
    if (twall > bwall) { t = twall; twall = bwall; bwall = t; }

    cl = castlelevel; dots = 0; nnear = 0;
    if (cl !== 0) ClearMess();
    if (castle === 6) {
      if (cl === grinchlevel) bwall = 19; else bwall = 20;
    }

    ndro = 0;
    for (let i = 1; i <= ndropped; i++) {
      if (Math.abs(drgoody[i][1]) === 8 && drgoody[i][11] === 8) {  // safe
        for (let j = 1; j <= 16; j++) drgoody[1][j] = drgoody[i][j];
        drgoody[1][13] = -Math.abs(drgoody[1][13]);   // negate mainx so won't display
        drgdy[1] = drgdy[i]; ndro = 1; break;
      }
    }
    ndropped = ndro;

    screenPages(1); vpage = 1; ccls(1); PrintMessage(7, 0); DisplayCharacter();
    box(lwall, rwall, twall, bwall, 2, wallcolr, 1);
    screenPages(2, 1); clpage2();
    box(lwall, rwall, twall, bwall, 2, wallcolr, 2);
    if (cl === 0) { lw = lwall; rw = rwall; tw = twall; bw = bwall; }
    else if (cl < 0) { xs = xstairs[cl]; ys = ystairs[cl]; }
    else { xs = xstairs[cl - 1]; ys = ystairs[cl - 1]; }
    if (cl !== 0) {
      lw = xs - cRoll(5); rw = xs + cRoll(5);
      tw = ys - cRoll(4); bw = ys + cRoll(4);
      switch (castle) {
        case 1:
          if (cl === elvislevel) special = 1;
          if (cl === elvislevel - sgn(elvislevel)) {
            if (elvislevel < 0) special = -11; else special = -1;
          }
          break;
        case 2:
          if (cl === -7) special = 2;
          if (cl === -6) special = -12;
          break;
        case 3:
          if (cl === 5) special = 3;
          if (cl === 4) special = -3;
          break;
        case 4:
          if (cl === 7) special = 4;
          if (cl === 6) special = -4;
          break;
        case 5:
          if (cl === -5) special = 5;
          if (cl === -4) special = -15;
          break;
        case 6:
          if (cl === grinchlevel) special = 6;
          if (cl === grinchlevel - sgn(grinchlevel)) {
            if (grinchlevel < 0) special = -16; else special = -6;
          }
          break;
      }
      if (special > 0) { lw = 22; rw = 31; tw = 9; bw = 14; if (special > 3) bw = 13; }
      if (lw < lwall + 2) lw = lwall + 2;
      if (rw > rwall - 2) rw = rwall - 2;
      if (tw < twall + 2) tw = twall + 2;
      if (bw > bwall - 2) bw = bwall - 2;

      dots = roomit(rw, lw, bw, tw);   // draw first room
    }

    enddraw: {
      if (special > 0) { special = DrawSpecial(special); break enddraw; }

      entr = cRoll(4);
      xdoor = cRoll(rw - lw - 1) + lw; ydoor = cRoll(bw - tw - 1) + tw;
      switch (entr) {
        case 1: xdoor = rw; break;
        case 2: xdoor = lw; break;
        case 3: ydoor = tw; break;
        case 4: ydoor = bw; break;
      }
      bclr = 0;
      if (cl === 0) { entr = enterdir; xdoor = xenter; ydoor = yenter; bclr = 2; }
      PutSym(cen, xdoor, ydoor, wallcolr, bclr, 2);
      [xdoor, ydoor, entr] = DrawRoom(xdoor, ydoor, entr, cen, FALSE);   // recursion, draw dungeon
      if (cl === 0) PutSym(cen, xenter, yenter, wallcolr, 2, -1);
      removed = FALSE; maxadd = 4 + cRoll(5);
      for (let addsmall = 0; addsmall <= maxadd; addsmall++) {
        for (let i = 1; i <= 50; i++) {
          xx = cRoll(rwall - lwall - 1) + lwall;
          yy = cRoll(bwall - twall - 1) + twall;
          [sym, fc, bc] = GetSym(xx, yy, 2);
          switch (sym) {
            case hor: case ver:  // remove wall
              if (not(removed) && (addsmall === maxadd)) [sym, removed] = RemoveWall(sym, xx, yy, removed);
              break;
            case 32:        // add new room
              didit = AddRoom(xx, yy, didit, qb(addsmall > 6));
              break;
          }
        }
      }
    }
    // enddraw:

    if (cl <= 0 && xstairs[cl] > 0) {   // for stairs going up from level cl
      [sym, fc, bc] = GetSym(xstairs[cl], ystairs[cl], 2);
      if (sym !== 250) {
        do {   // fd1:
          [x, y] = finddot(incastle);
        } while (x < lwall + 3 || x > rwall - 3 || y < twall + 3 || y > bwall - 3);
        xstairs[cl] = x; ystairs[cl] = y;
      }
      PutSym(240, xstairs[cl], ystairs[cl], 13, 0, 2); dots = dots - 1;
    }

    if (xstairs[cl - 1] > 0) {  // stairs going down from level cl
      [sym, fc, bc] = GetSym(xstairs[cl - 1], ystairs[cl - 1], 2);
      if (special < -10) sym = -1;
      if (sym !== 250) {
        for (;;) {   // fd2:
          [x, y] = finddot(incastle);
          if (x < lwall + 3 || x > rwall - 3 || y < twall + 3 || y > bwall - 3) continue;
          if (special < -10) {
            if (x < 23 || x > 30 || y < 10 || y > 12) continue;
          }
          break;
        }
        xstairs[cl - 1] = x; ystairs[cl - 1] = y;
      }
      PutSym(240, xstairs[cl - 1], ystairs[cl - 1], 5, 0, 2); dots = dots - 1;
    }

    if (cl > 0 && xstairs[cl] > 0) {   // stairs going up from level cl
      [sym, fc, bc] = GetSym(xstairs[cl], ystairs[cl], 2);
      if (special < 0 && special > -10) sym = -1;
      if (sym !== 250) {
        for (;;) {   // fd3:
          [x, y] = finddot(incastle);
          if (x < lwall + 3 || x > rwall - 3 || y < twall + 3 || y > bwall - 3) continue;
          if (special < 0 && special > -10) {
            if (x < 23 || x > 30 || y < 10 || y > 12) continue;
          }
          break;
        }
        xstairs[cl] = x; ystairs[cl] = y;
      }
      PutSym(240, xstairs[cl], ystairs[cl], 13, 0, 2); dots = dots - 1;
    }

    [currsym, currf, currb] = GetSym(localx, localy, 2);
    if (invisible) ffc = 8; else ffc = 15;
    PutSym(1, localx, localy, ffc, 0, 2);
    dots = dots - 1; t$ = Terr$(terrain);
    PrintMessage(7, 0); DisplayCharacter();

    nadd = cint(dots * (rnd() + 0.5) * (rnd() + 0.5) / 70 + Math.abs(cl));
    g = goodycastle[castle][cl];
    if (cl === 0 && castle === 0) g = 512;
    lobyte = imod(g, 256);
    hibyte = idiv(g - lobyte, 256);
    if (nadd > 8) nadd = 8;
    if (nadd < 2) nadd = 2;
    if (nadd > dots) nadd = dots;
    switch (special) {
      case 4: nadd = cint(nadd / 2 + 1); break;
      case 3: case 6: nadd = 0; break;
    }
    for (let i = 1, n = nadd; i <= n; i++) MakeStuff(i);
    if (g === 0) {
      lobyte = cint(lobyte + (2 ** nadd) - 1); hibyte = 31;
      goodycastle[castle][cl] = cint(lobyte + 256 * hibyte);
    }
    nthings = nadd;
    for (let i = 1, n = nadd; i <= n; i++) {
      if ((goodycastle[castle][cl] & 2 ** (i - 1))) {
        symg = imod(localgoody[i][1], 256); fcg = idiv(localgoody[i][1], 256);
        PutSym(symg, localgoody[i][2], localgoody[i][3], fcg, 0, 2);
        dots = dots - 1;
      }
    }

    nadd = cint(dots / 200 * (rnd() + 0.3) + Math.abs(cl));
    if (nadd > dots / 15) nadd = cint(dots / 15);
    switch (special) {
      case 2: case 6: nadd = 0; break;
    }
    for (let i = 1, n = nadd; i <= n; i++) {
      [x, y] = finddot(incastle);
      dots = dots - 1; sym = trap;
      switch (cRoll(14)) {
        case 1: case 2: case 3: sym = pit; fc = 4 * cRoll(2);  // pit
          if (cRoll(20) === 1) fc = 12;
          break;
        case 4: fc = 1; break;        // sleep
        case 5: fc = 2; break;        // dart
        case 6: fc = 3; break;        // shock
        case 7: fc = 4; break;        // radiation
        case 8: fc = 5; break;        // glue
        case 9: fc = 6; break;        // acid
        case 10: fc = 7; break;       // arrow
        case 11: fc = 8; break;       // teleport
        case 12: fc = 10; break;      // gas
        case 13: fc = 12; break;      // fire
        case 14: fc = 14; break;      // laser
      }
      PutSym(sym, x, y, fc, 0, 2);
    }

    nadd = cint(dots * (rnd() + 1.5) / 70 + 3 + Math.abs(cl));
    if (nadd < nthings * 2) nadd = nthings * 2;
    if (nadd > dots / 4) nadd = cint(dots / 4);
    const mkcr = () => {
      MakeCreature((x), (y), FALSE, FALSE); ncre[nnear][11] = 0;
      dots = dots - 1; nadd = nadd - 1;
    };
    switch (castle) {
      case 1:  // elvii
        if (castlelevel === elvislevel) {
          for (let i = 1; i <= 16; i++) {
            crtyp = elvimp - qb(i === 16); [x, y] = finddot(incastle); mkcr();
          }
        }
        break;
      case 2:  // munsters
        if (castlelevel === -7) {
          crtyp = herm; x = 40; y = 11; mkcr();
          crtyp = lily; x = 34; y = 11; mkcr();
          crtyp = gramp; x = 27; y = 17; mkcr();
          crtyp = eddie; x = 21; y = 11; mkcr();
          crtyp = mara; x = 40; y = 5; mkcr();
          crtyp = spot; x = 27; y = 5; mkcr();
          crtyp = igor; x = 13; y = 5; mkcr();
          crtyp = fester; x = 11; y = 11; mkcr();
          AddToDrop(-nberry - 17);  // tape recorder
          do {   // incdd:
            x = cRoll(7) + 10; y = cRoll(4) + 13;
            [sym] = GetSym(x, y, 2);
          } while (sym !== 250);
          PutSym(11, x, y, 14, 0, 2);
          drgoody[1][15] = x; drgoody[1][16] = y;
        } else if (castlelevel === -6) {
          AddToDrop(0);  // Gregre berry
          [x, y] = finddot(incastle); drgoody[1][15] = x; drgoody[1][16] = y;
          PutSym(5, x, y, 12, 0, 2); dots = dots - 1;
        }
        break;
      case 3:  // gilligan
        if (castlelevel === 5) {
          crtyp = gill; x = 8; y = 15; mkcr();
          crtyp = skip; [x, y] = finddot(incastle); mkcr();
          crtyp = prof; x = 25; y = 17; mkcr();
          crtyp = ging; x = 43; y = 8; mkcr();
          crtyp = mary; x = 37; y = 5; mkcr();
          crtyp = mrhow; x = 17; y = 5; mkcr();
          crtyp = mrshow; x = 17; y = 6; mkcr();
        }
        break;
      case 4:  // trump
        if (castlelevel === 7) {
          nadd = nadd + 4;
          for (let i = trump; i <= marla; i++) {
            crtyp = i;
            do {
              bad = FALSE; place[i - trump + 1] = cRoll(4);
              for (let j = trump; j <= i - 1; j++) {
                if (place[i - trump + 1] === place[j - trump + 1]) bad = TRUE;
              }
            } while (bad);
            bad = TRUE;
            do {   // putrumps:
              [x, y] = finddot(incastle);
              switch (place[i - trump + 1]) {
                case 1: if (x > 5 && x < 12 && y > 7 && y < 15) bad = FALSE; break;
                case 2: if (x > 5 && x < 15 && y > 15 && y < 20) bad = FALSE; break;
                case 3: if (x > 41 && x < 48 && y > 7 && y < 13) bad = FALSE; break;
                case 4: if (x > 42 && x < 48 && y > 13 && y < 20) bad = FALSE; break;
              }
            } while (bad);
            mkcr();
          }
        }
        break;
      case 5:  // 2nd placers
        if (castlelevel === -5) {
          switch (cRoll(3)) {
            case 1: x = 13; y = 4; break;
            case 2: x = 13; y = 8; break;
            case 3: x = 19; y = 4; break;
          }
          AddToDrop(-nberry - 16);   // Mets hat
          drgoody[1][15] = x; drgoody[1][16] = y;
          PutSym(147, x, y, 1, 0, 2); dots = dots - 1;
          crtyp = buzz; x = 11; y = 17; mkcr();
          for (let i = mdeck; i <= saddam; i++) {
            crtyp = i; [x, y] = finddot(incastle); mkcr();
          }
          crtyp = cubs;
          for (let i = 1; i <= 9; i++) {
            x = 0;
            while (x > 11 || x < 6 || y > 13 || y < 4) {
              [x, y] = finddot(incastle);
            }
            mkcr();
          }
          nadd = nadd + 6;
        }
        break;
      case 6:  // grinch
        if (castlelevel === grinchlevel) {
          nadd = 0;
          if (notoxin === 0) {
            crtyp = grinch; x = 8; y = 10; mkcr();
            crtyp = gdog; x = 8; y = 12; mkcr();
          }
          crtyp = sdro; x = 17; y = 11; mkcr();
          ncre[nnear][11] = 1;
          ncre[nnear][14] = ncre[nnear][14] + 1 + 10 - 200;
          crtyp = ddro; x = 19; y = 11; mkcr();
          ncre[nnear][11] = 1;
          ncre[nnear][14] = ncre[nnear][14] + 1 + 10 - 400;
          crtyp = ddro; x = 21; y = 11; mkcr();
          ncre[nnear][14] = ncre[nnear][14] + 1 + 10 - 400;
          crtyp = rdro; x = 21; y = 9; mkcr();
          ncre[nnear][14] = ncre[nnear][14] + 2 + 10 - 600;
          crtyp = rdro; x = 21; y = 13; mkcr();
          ncre[nnear][14] = ncre[nnear][14] + 2 + 10 - 600;
          crtyp = robot; x = 24 + cRoll(3); y = 3 + cRoll(3);
          mkcr(); ncre[nnear][7] = imod(ncre[nnear][7], 1000);
          crtyp = robot; x = 15 + cRoll(4); y = 6 + cRoll(3);
          mkcr(); ncre[nnear][7] = imod(ncre[nnear][7], 1000);
          crtyp = robot; x = 15 + cRoll(4); y = 12 + cRoll(3);
          mkcr(); ncre[nnear][7] = imod(ncre[nnear][7], 1000);
          crtyp = robot; x = 24 + cRoll(3); y = 15 + cRoll(3);
          mkcr(); ncre[nnear][7] = imod(ncre[nnear][7], 1000);
          crtyp = slug; x = 21; y = 15; mkcr();
          crtyp = lotus; x = 11; y = 11; mkcr();
          crtyp = rose; x = 6; y = 11; mkcr();
          for (let gs = 1; gs <= 4; gs++) { crtyp = gspore; x = 9; y = 11; mkcr(); }
          crtyp = cact; x = 6; y = 9; mkcr();
          crtyp = cact; x = 6; y = 13; mkcr();
          crtyp = gwasp; for (let i = 1; i <= 5; i++) { x = 47; y = 11; mkcr(); }
          crtyp = scor; for (let i = 1; i <= 5; i++) { x = 47; y = 11; mkcr(); }
          crtyp = puff; for (let i = 1; i <= 10; i++) { [x, y] = finddot(incastle); mkcr(); }
          flashlight = FALSE; gasmask = FALSE; mask = FALSE; boots = FALSE;
          ffgen = FALSE; sunglasses = FALSE; mindweb = FALSE; vehicle = 0;
          for (let i = 1; i <= ngoody; i++) {
            if (goody[i][1] === -7 && goody[i][11] !== 2) goody[i][1] = 7;
            if (goody[i][1] === -8 && goody[i][11] !== 8) goody[i][1] = 8;
          }
        } else if (castlelevel === -grinchlevel) {
          dots = dots - 1;
          [x, y] = finddot(incastle); PutSym(225, x, y, 6, 0, 2);
          AddToDrop(-nberry - 9); drgoody[1][15] = x; drgoody[1][16] = y;
        }
        break;
    }
    for (let i = 1, n = nadd; i <= n; i++) {
      MakeCreature(0, 0, FALSE, FALSE); dots = dots - 1;
    }
    for (let i = 1, n = nnear; i <= n; i++) {
      PutSym(32, localx + ncre[i][4], localy + ncre[i][5], 7, 0, 1);
      if (SameRoom(ncre[i][4], ncre[i][5]) && (ncre[i][1] <= ncreat + creextra + 1)) await Awaken(i);
    }

    if (xstairs[cl] > 0) PutSym(240, xstairs[cl], ystairs[cl], 13, 0, 2);
    if (xstairs[cl - 1] > 0) PutSym(240, xstairs[cl - 1], ystairs[cl - 1], 5, 0, 2);
    PutSym(250, localx, localy, 8, 0, 2);
    PutSym(32, localx, localy, 7, 0, 1);
    [dark, olddark, changed] = SetDark(dark, olddark, changed);
    if (dark) ChangeDark(); else { savecorn = 0; DotIt((localx), (localy)); DotCorn(); }
    if (xstairs[cl] > 0) {
      PutSym(240, xstairs[cl], ystairs[cl], 13, 0, 2);
      if (cl < 0) PutSym(240, xstairs[cl], ystairs[cl], 13, 0, 1);
    }
    if (xstairs[cl - 1] > 0) {
      PutSym(240, xstairs[cl - 1], ystairs[cl - 1], 5, 0, 2);
      if (cl > 0) PutSym(240, xstairs[cl - 1], ystairs[cl - 1], 5, 0, 1);
    }
    // -------------------------------------------------------
  }

  if (invisible) ffc = 8; else ffc = 15;
  PutSym(1, localx, localy, ffc, 0, -1);

  screenPages(1); vpage = 1; PrintMessage(5, 0);
  for (let i = 1, n = ncastle + nruins; i <= n; i++) x = cint(rnd() * cRoll(2));
}

// Draws (or reloads) a lair: either a cave or a tunnel maze with stairs.
async function DrawLair() {
  let xr = 0, xl = 0, yb = 0, yt = 0, xstair = 0, ystair = 0, ndro = 0, ffc = 0, strength = 0;
  let putlsd = 0, putssd = 0, putber = 0, putbeef = 0, nnn = 0, itemnum = 0, psym = 0, pf = 0;
  let maxcritter = 0, putcritter = 0, x = 0, y = 0, sym = 0, fc = 0, bc = 0;
  crandomize(seed + mainx + mainy * 50);
  xr = cint(rnd(Math.fround(-seed - mainx - mainy * 50)));
  for (let i = 1, n = mainx + mainy * 50; i <= n; i++) xr = cint(rnd() * cRoll(2));
  ClearMess();

  if (sunglasses) dark = -1;
  incastle = 1;

  if (LoadMaps(1) === 0) {
    // ----------------------------------------------
    nnear = 0; castle = 0; castlelevel = 0; dark = 1;
    lwall = 2; rwall = 51; twall = 2; bwall = 21;
    ndro = 0;
    for (let i = 1; i <= ndropped; i++) {
      if (Math.abs(drgoody[i][1]) === 8 && drgoody[i][11] === 8) {  // safe
        for (let j = 1; j <= 16; j++) drgoody[1][j] = drgoody[i][j];
        drgoody[1][13] = -Math.abs(drgoody[1][13]);   // negate mainx so won't display
        drgdy[1] = drgdy[i]; ndro = 1; break;
      }
    }
    ndropped = ndro;

    goodycastle[0][0] = 0;
    ljnk(309, 23, 23, 1); screenPages(1); vpage = 1; ccls(1); PrintMessage(7, 0);
    screenPages(2, 1);

    if (cRoll(2) === 1) { await DrawCaves(); return; }

    ({ xr, xl, yb, yt, xs: xstair, ys: ystair } = lair());
    t$ = Terr$(terrain); DisplayCharacter(); PrintMessage(15, 0);

    localx = xstair; localy = ystair;
    currsym = 240; currf = 13; currb = 0;
    if (invisible) ffc = 8; else ffc = 15;
    PutSym(1, localx, localy, ffc, 0, 2);

    const putit = () => {
      for (;;) {
        x = xl + cRoll(xr - xl + 1) - 1;
        y = yt + cRoll(yb - yt + 1) - 1;
        [sym, fc, bc] = GetSym(x, y, 2);
        if (sym === 250) {
          if (psym > 0) {
            PutSym(psym, x, y, pf, 0, 2);
            localgoody[itemnum][1] = cint(psym + 256 * pf);
            localgoody[itemnum][2] = x;
            localgoody[itemnum][3] = y;
            itemnum = itemnum + 1;
          } else {
            MakeCreature(x, y, FALSE, FALSE);
          }
          return;
        }
      }
    };

    strength = 0; [crtyp, strength] = LairCreat(strength);   // leave here
    putlsd = cRoll(cRoll(3)); putssd = cRoll(2) + 1;
    putber = 7 - putssd - putlsd; putbeef = 1;
    nnn = 8;
    if (strength < 60) { putlsd = putlsd - 1; nnn = nnn - 1; }
    if (strength < 30) { putssd = putssd - 1; nnn = nnn - 1; }
    goodycastle[0][0] = cint((2 ** nnn) - 1);
    itemnum = 1;
    for (let i = 1; i <= putber; i++) {
      psym = 5 + 231 * int(rnd() * 2); pf = 4 + 8 * int(rnd() * 2); putit();
    }
    for (let i = 1; i <= putssd; i++) {
      psym = 11 + int(rnd() * 2); pf = 14; putit();
    }
    for (let i = 1; i <= putlsd; i++) {
      psym = 21 + 136 * int(rnd() * 2); pf = 11; putit();
    }
    if (putbeef) { psym = 254; pf = 6; putit(); }

    if (crtyp <= ncreat) {
      maxcritter = cint(25 + rolldice(lvl, 2, 2) - 2 * Math.sqrt(crtyp));
    } else {
      maxcritter = 25 + rolldice(cint(Math.sqrt(lvl)), 3, 3);
    }

    if (maxcritter > 45) maxcritter = 45;
    putcritter = idiv(maxcritter, 3);
    for (let i = 1; i <= putcritter; i++) { psym = -1; putit(); }
    for (let i = 1; i <= maxcritter - putcritter; i++) {
      [x, y] = finddot(incastle); MakeCreature(x, y, FALSE, FALSE);
    }

    if (crtyp > ncreat + crecas + crefor + creswa + crepla) {
      for (let i = 2; i <= 51; i++) {
        for (let j = 2; j <= 21; j++) {
          [sym, fc, bc] = GetSym(i, j, 2);
          if (sym === 250) PutSym(247, i, j, 1, 0, 2);
        }
      }
      for (let i = 1; i <= nnear; i++) ncre[i][8] = 1247;
    }

    // ----------------------------------------------
  }

  screenPages(1); vpage = 1; ChangeDark(); PrintMessage(5, 0); DisplayCharacter();
}

// Draws a special castle level from ALPHAMAN.4.  Returns special (the BASIC
// SUB's by-reference parameter, unchanged).
function DrawSpecial(special) {
  // OPEN "alphaman.4" FOR BINARY AS #2
  let p = (ALPHA4[special - 1] - 1) / 2;   // GET #2, special * 2 - 1, filepos
  const get = () => ALPHA4[p++];
  let removed = FALSE, sym = 0, xr = 0, xl = 0, yb = 0, yt = 0, xd = 0, yd = 0, fc = 0, iop = 0;
  const numrooms = get();
  for (let i = 1; i <= numrooms; i++) {
    xr = get(); xl = get(); yb = get(); yt = get();
    dots = dots + roomit(xr, xl, yb, yt);
  }

  const numremove = get();
  for (let i = 1; i <= numremove; i++) {
    sym = get(); xr = get(); yb = get();
    [sym, removed] = RemoveWall(sym, xr, yb, removed);
  }

  const numdoors = get();
  for (let i = 1; i <= numdoors; i++) {
    xd = get(); yd = get();
    PutSym(cen, xd, yd, wallcolr, 0, 2);
  }

  const numlocked = get();
  for (let i = 1; i <= numlocked; i++) {
    xd = get(); yd = get();
    PutSym(lockeddoor, xd, yd, wallcolr, 0, 2);
  }

  const numsecret = get();
  for (let i = 1; i <= numsecret; i++) {
    xd = get(); yd = get();
    if (castle === 6 && xd === 15) yd = 7 + (cRoll(2) - 1) * 8;
    PutSym(secretdoor, xd, yd, wallcolr, 0, 2);
  }

  const numitems = get();
  for (let i = 1; i <= numitems; i++) {
    sym = get(); xd = get(); yd = get(); fc = get(); iop = get();
    if (sym === 7) sym = sym + 11 * cRoll(2);  // map
    PutSym(sym, xd, yd, fc, 0, 2);
    if (iop === -1) iop = -cRoll(nberry); else iop = -nberry - iop;
    AddToDrop(iop); drgoody[1][15] = xd; drgoody[1][16] = yd;
  }

  const numtraps = get();   // can be any non-dropped symbol, actually
  for (let i = 1; i <= numtraps; i++) {
    sym = get(); xd = get(); yd = get(); fc = get();
    if (sym === trap && fc === -1) {
      switch (cRoll(11)) {
        case 1: fc = 1; break;       // arrow
        case 2: fc = 2; break;       // dart
        case 3: fc = 3; break;       // shock
        case 4: fc = 4; break;       // radiation
        case 5: fc = 5; break;       // glue
        case 6: fc = 6; break;       // acid
        case 7: fc = 7; break;       // arrow
        case 8: fc = 8;              // teleport
          if (castle === 2) fc = 7;
          break;
        case 9: fc = 10; break;      // gas
        case 10: fc = 12; break;     // fire
        case 11: fc = 14; break;     // laser
      }
    }
    if (special === 6 && i > 11) yd = yd + cRoll(2) - 1;
    PutSym(sym, xd, yd, fc, 0, 2);
  }

  dots = dots + numremove - numitems - numtraps;
  return special;
}

// Creature type for a lair.  Returns [type, strength].
function LairCreat(strength) {
  let l = 0, maxcre = 0;
  const r = cRoll(100);
  if (r <= 60) {               // Anywhere critters
    maxcre = cint(3 + 3.49 * lvl + ncastle);
    for (;;) {   // redolc:
      l = cRoll(maxcre);
      switch (l) {
        case 1: case 2: case 3: case 5: case 6: case 10: case 11: case 16: case 17: case 25: case 30:  // 11 is wdpckr,30 kbee
        case 33: case 36: case 38: case 44: case 47: case 52: case 54: case 58: case 62: case 63:      // 52 is taran, 63 is Tyran
          break;
        default: continue;
      }
      break;
    }
    strength = cint(100 * l / maxcre);
  } else if (r <= 97) {        // terrain critters
    maxcre = lvl; if (maxcre > 17) maxcre = 17;
    l = cRoll(maxcre);
    strength = cint(100 * l / maxcre);
    switch (cRoll(4)) {
      case 1: l = ncreat + l; break;
      case 2: l = ncreat + crecas + l; break;
      case 3: l = ncreat + crecas + crefor + l; break;
      case 4: l = ncreat + crecas + crefor + creswa + l; break;
    }
  } else {                     // water
    maxcre = cint(1 + 1.5 * lvl); if (maxcre > creh2o) maxcre = creh2o;
    l = cRoll(maxcre); strength = cint(100 * l / maxcre);
    l = ncreat + crecas + crefor + creswa + crepla + l;
  }
  return [l, strength];
}

// Grandpa Munster turns you into a mouse and scatters your belongings.
function Mousify() {
  let numbr = 0, nitems = 0, x = 0, y = 0, j = 0, sym = 0, fc = 0, bc = 0, ffc = 0;
  const oldar = 0;   // (sic) undeclared variable
  PutSym(currsym, localx, localy, currf, currb, -1);   // erase old sym

  for (j = 1; j <= nnear; j++) { ncre[j][11] = ncre[j][11] & ~1; EraseCreat(j); }

  numbr = 30 - ndropped; nitems = 0;
  for (j = 1; j <= ngoody; j++) {
    if (Math.abs(goody[j][1]) < 3) {   // foodstuffs
      nitems = nitems + goody[j][3];
    } else {
      nitems = nitems + 1;
    }
  }
  if (numbr > nitems) numbr = nitems;
  PutSym(currsym, localx, localy, currf, currb, 2);   // don't put on page 1

  for (let i = 1, iEnd = numbr; i <= iEnd; i++) {
    do {   // mousfdot:
      [x, y] = finddot(incastle);
    } while (x > 9 && x < 18 && y > 13 && y < 18);  // not in secret rm
    for (j = 1; j <= nnear; j++) {
      ncre[j][4] = ncre[j][4] + localx - x;
      ncre[j][5] = ncre[j][5] + localy - y;
    }
    localx = x; localy = y;
    j = cRoll(ngoody);
    if (Math.abs(goody[j][1]) < 3) {
      AddToDrop(-nberry - 11 + qb(goody[j][1] === 2)); currb = 0;
      if (goody[j][1] === 1) { currsym = 22; currf = 5; } else { currsym = 254; currf = 6; }
      goody[j][3] = goody[j][3] - 1;
      if (goody[j][3] === 0) RemoveGoody(j, FALSE);
    } else {
      j = AddToDrop(j); RemoveGoody(j, FALSE);
    }
    drgoody[1][15] = localx; drgoody[1][16] = localy;
    PutSym(currsym, localx, localy, currf, currb, 2);   // set by addtodrop
    if (ngoody === 0) i = iEnd + 1;
  }
  for (let i = 2; i <= 51; i++) {
    for (j = 2; j <= 21; j++) {
      [sym, fc, bc] = GetSym(i, j, 1);
      if (sym === 250) { sym = 32; fc = 7; PutSym(sym, i, j, fc, bc, 1); }
    }
  }

  SetCombatStats();
  DisplayCharacter();
  if (dark) dark = oldar;
  ChangeDark();
  if (invisible) ffc = 8; else ffc = 15;
  PutSym(1, localx, localy, ffc, 0, -1);
}

// Scatters items (pak 0), the backpack (1) or the safe (2) around the player.
function Scatter(pak) {
  let numbr = 30 - ndropped, nitems = 0, addl = 0, lx = 0, ly = 0, j = 0, gtyp = 0, gnum = 0;
  let sc = 0, sym = 0, fc = 0, bc = 0, ffc = 0, gotdot = FALSE;
  PutSym(currsym, localx, localy, currf, currb, -1);
  switch (pak) {
    case 0:   // stuff
      for (j = 1; j <= ngoody; j++) {
        if (Math.abs(goody[j][1]) < 3) nitems = nitems + goody[j][3];   // foodstuffs
        else nitems = nitems + 1;
      }
      addl = 0;
      break;
    case 1:   // backpack
      for (j = 1; j <= npack; j++) {
        if (Math.abs(backpack[j][1]) < 3) nitems = nitems + backpack[j][3];
        else nitems = nitems + 1;
      }
      addl = ngoody;
      break;
    case 2:   // safe
      for (j = 1; j <= nsafe; j++) {
        if (Math.abs(safe[j][1]) < 3) nitems = nitems + safe[j][3];
        else nitems = nitems + 1;
      }
      addl = ngoody + npack;
      break;
  }
  if (numbr > nitems) numbr = nitems;

  const getdot = () => {
    gotdot = FALSE;
    while (!gotdot) {
      localx = localx + cRoll(3) - 2; localy = localy + cRoll(3) - 2;
      if (localx < 2) localx = lx; else if (localx > 51) localx = lx;
      if (localy < 2) localy = ly; else if (localy > 21) localy = ly;
      [sym, fc, bc] = GetSym(localx, localy, 2);
      if (incastle && sym === 250) gotdot = TRUE;
      if (incastle === 0 && (sym === 250 || sym === 249 || sym === 32)) gotdot = TRUE;
    }
  };

  for (let i = 1, iEnd = numbr; i <= iEnd; i++) {
    lx = localx; ly = localy; getdot();
    switch (pak) {
      case 0: j = cRoll(ngoody); gtyp = Math.abs(goody[j][1]); gnum = goody[j][3];
        if (ngoody === 0) i = iEnd + 1;
        break;
      case 1: j = cRoll(npack); gtyp = backpack[j][1]; gnum = backpack[j][3];
        if (npack === 0) i = iEnd + 1;
        break;
      case 2: j = cRoll(nsafe); gtyp = safe[j][1]; gnum = safe[j][3];
        if (nsafe === 0) i = iEnd + 1;
        break;
    }

    if (gtyp < 3) {
      AddToDrop(-nberry - 11 + qb(gtyp === 2)); currb = 0;
      if (gtyp === 1) { currsym = 22; currf = 5; } else { currsym = 254; currf = 6; }
      gnum = gnum - 1;
      if (gnum === 0) {
        pak = RemoveGoody(j, pak);
      } else {
        switch (pak) {
          case 0: goody[j][3] = gnum; break;
          case 1: backpack[j][3] = gnum; break;
          case 2: safe[j][3] = gnum; break;
        }
      }
    } else {
      AddToDrop((j + addl)); pak = RemoveGoody(j, pak);
    }
    drgoody[1][15] = localx; drgoody[1][16] = localy;
    sc = -1;
    if (incastle) {
      [sym, fc, bc] = GetSym(localx, localy, 1);
      if (sym !== 250) sc = 2;
    }
    PutSym(currsym, localx, localy, currf, currb, sc);   // set by addtodrop
    localx = lx; localy = ly;
  }
  [currsym, currf, currb] = GetSym(localx, localy, 2);
  if (invisible) ffc = 8; else ffc = 15;
  PutSym(1, localx, localy, ffc, 0, 1);
}

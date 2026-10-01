// Port of A5.BAS: berry effects, the per-turn upkeep (CheckFatPlus, Timely),
// death and the hall of fame, item generation (Determine*), the character
// display and creation, known-item screens, darkness, traps and pits.
//
// Copyright (c) 1995 Jeffrey R. Olson (MIT license, see LICENSE)
'use strict';

function BerEff$(i) {
  let a = 0, b = 0, c = 0;
  switch (i) {
    case 0: a = 297; b = 48; c = 14; break;
    case 1: a = 32; b = 61; c = 7; break;
    case 2: a = 65; b = 58; c = 7; break;
    case 3: a = 206; b = 54; c = 14; break;
    case 4: a = 156; b = 60; c = 7; break;
    case 5: a = 207; b = 20; c = 6; break;
    case 6: a = 204; b = 60; c = 4; break;
    case 7: a = 204; b = 60; c = 9; break;
    case 8: a = 207; b = 33; c = 13; break;
    case 9: a = 207; b = 46; c = 10; break;
    case 10: a = 207; b = 56; c = 9; break;
    case 11: a = 208; b = 1; c = 10; break;
    case 12: a = 208; b = 11; c = 9; break;
    case 13: a = 208; b = 20; c = 9; break;
    case 14: a = 208; b = 29; c = 9; break;
    case 15: a = 208; b = 38; c = 11; break;
    case 16: a = 208; b = 49; c = 12; break;
    case 17: a = 209; b = 1; c = 10; break;
    case 18: a = 209; b = 11; c = 16; break;
    case 19: a = 209; b = 27; c = 14; break;
    case 20: a = 209; b = 41; c = 19; break;
    case 21: a = 210; b = 1; c = 18; break;
    case 22: a = 210; b = 19; c = 15; break;
    case 23: a = 210; b = 34; c = 11; break;
    case 24: a = 210; b = 45; c = 14; break;
    case 25: a = 208; b = 61; c = 8; break;
    case 26: a = 209; b = 60; c = 8; break;
    case 27: a = 205; b = 60; c = 7; break;
    case 28: a = 237; b = 45; c = 14; break;
    case 29: a = 241; b = 20; c = 8; break;
    case 30: a = 285; b = 60; c = 5; break;
    case 31: a = 304; b = 1; c = 15; break;
    case 32: a = 304; b = 40; c = 19; break;
    case 33: a = 305; b = 15; c = 10; break;
    case 34: a = 394; b = 25; c = 18; break;
    case 35: a = 67; b = 62; c = 7; break;
    default: a = 1; b = 1; c = 1;
  }
  return jnk$(a, b, c);
}

// Once per turn: fatigue, hunger, regeneration and the timed effects.
async function CheckFatPlus() {
  let hundel = 0, prob = 0, roll = 0, mult = 0, dam = 0, dam1 = 0, dam2 = 0, ffkill = FALSE;
  let tg = 0, a = 0, b = 0, c = 0, d = 0, e = 0, F = 0, dic = 0;
  let tox = FALSE, toxpause = FALSE, add = 0, siz = 0, suitdam = 0;
  const pm10 = () => qb(pmut === 10 && berpmut === 0);

  fatadd = fatadd - 1.5 - 0.9 * qb(forcefield !== 0) - 5 * qb(mheal > 0);
  fatadd = fatadd + (1 - 2 * qb(berhpmut > 0)) * pm10();
  fatadd = fatadd + 3 * qb(berfresh > 0);
  fatigue = fatigue + fatadd;
  if (fatigue < 0) fatigue = 0;
  if (fatigue > 260) { fatigue = 241; pooped = TRUE; } else pooped = FALSE;

  hundel = cint(6 + (3 - 2 * qb(berhpmut > 0)) * pm10());
  hundel = cint(hundel * (1 - tapeworm));
  if ((asleep & qb(nnear > 0)) !== 0) hundel = idiv(hundel, 5);
  hunger = hunger + hundel / 2 + hundel * fatigue / 1600;

  if (neutronsuit) {
    if (berregen) prob = 0; else prob = cint(-2 * (lvl + 3));
    if (pmut === 8 && berpmut === 0) prob = idiv(prob, 3);
    if (rr > -5) prob = cint((prob * 15) / (5 + rr)); else prob = cint(prob * 20);
  } else {
    prob = cint((lvl + 3) * (4 - hunger / 1800));
    if (prob > 50) prob = 50;
    if (pm10()) prob = cint(prob + (10 - 10 * qb(berhpmut > 0)));
    if (mmut === 3 && bermmut === 0) prob = cint(prob * (1.3 - 0.3 * qb(berhmmut > 0)));
    if (berregen) prob = prob + 40;
    if (spore > 9) prob = 0; else if (spore > 0) prob = idiv(prob * 2, spore + 2);
  }
  for (;;) {   // redoregen
    roll = cRoll(100);
    if (roll < prob && mheal === 0 && hits < hitmax) {
      hits = hits + 1; prob = cint(prob - roll - 10); continue;
    } else if (prob < 0 && roll < -prob) {
      hits = hits - 1; if (hits < 0) { st1 = jnk$(362, 38, 17); await Dead(0); }
    }
    break;
  }
  if ((qb(cRoll(5) === 1) & qb(hits > hitmax)) !== 0) hits = hits - 1;
  if ((asleep & incastle & qb(nnear === 0) & qb(hits < hitmax)) !== 0) hits = hits + 2;

  if (mheal > 0) {
    mult = 1 - qb(berhmmut > 0);
    hunger = hunger + mult; mheal = mheal - 1; hits = hits + 3 * mult;
    if (hits > hitmax) { hits = hitmax; mheal = 0; }
  }

  if (wpturns > 0) {
    wpturns = wpturns - 1;
    if (wpturns === 0) {
      str = str - 3; dex = dex - 3; con = con - 3; rr = rr - 3;
      intl = intl - 3; hitmax = hitmax - 6 - lvl; hits = hits - 6 - lvl;
      if (hits < 0) hits = 0;
      if (rdisp === 1) await DisplayCharacter();
    }
  }

  if (tentgrab) {
    pmutturns = 5; l2 = bl;
    dam = cint(cRoll(idiv(lvl, 2) + 3) + otherdam + strdam);
    if (berhpmut > 0) dam = cint(dam * 2);
    [dam] = CrDamAlter(tentgrab, dam, 1); ncre[tentgrab][2] = cint(ncre[tentgrab][2] - dam);

    if (ncre[tentgrab][10] & 4096) dam1 = cRoll(4);
    if (ncre[tentgrab][10] & 8192) dam2 = cRoll(10);
    dam1 = cint(dam1 + dam2); [dam1, ffkill] = ffEffect(dam1, ffkill);
    if (dam1 > 0) {
      ljnk(86, 53, 16, 2); hits = hits - dam; ShowHits();   // (sic) dam, not dam1
      if (hits < 0) { st1 = jnk$(296, 61, 8) + bl + Der$(TRUE, tentgrab, 3); await Dead(0); }
    }
    if (ffkill) Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
    a = 94; b = 1; c = 22; if (ncre[tentgrab][2] < 0) { b = 23; c = 21; }
    Ljnkbig(a, b, c, 0, 0, 0, bl + Der$(FALSE, tentgrab, 1), 1, 1);
    if (ncre[tentgrab][2] < 0) {
      tg = tentgrab; await KillCreat(tg);
    } else {
      await MaybeMessPause(2, 0);
    }
  }

  if (invisible) {
    invisible = invisible - 1;
    if (invisible <= 0) { invisible = 0; PutSym(1, localx, localy, 15, 0, 1); }
  }

  if (coffee === 1) con = con - 1;
  if (coffee) { coffee = coffee - 1; if (coffee < 0) coffee = 0; }
  if (brandy === 1) str = str - 1;
  if (brandy) { brandy = brandy - 1; if (brandy < 0) brandy = 0; }

  if ((hail & qb(incastle === 0) & not(tent) & qb(cRoll(40) < lvl + 3)) !== 0) {
    hits = hits - 1; if (hits < 0) { st1 = jnk$(25, 63, 4); await Dead(0); }
    ljnk(381, 39, 20, 3); PrintMessage(15, 0);
  }

  if (radint) {
    dic = cint(radint - rr); if (dic < 1) dic = 1;
    dam = rolldice(2, dic, dic);
    dam = await DamSuit(1, dam);
    if ((spacesuit | bergreen) !== 0) {
      dam = 0;
    } else {
      ljnk(219, 1, 21, 3); PrintMessage(20, 0);
    }
    [dam, ffkill] = ffEffect(dam, ffkill); hits = hits - dam;
    if (hits < 0) {
      st1 = jnk$(11, 17, 9); await Dead(0);
    } else if (ffkill) {
      l1 = l3; l3 = ''; Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
      await MessPause(12, 0);
    }
  }

  tox = FALSE; toxpause = FALSE; d = 0;
  if (notoxin === 1) {                         // toxin already released?
    if (gt > serum) { tox = TRUE; toxpause = 1; d = 322; e = 46; F = 23; }
  } else if (gt > 10800 && notoxin === 0) {    // time to release toxin?
    notoxin = 1; toxpause = TRUE;
    a = 413; b = 28; c = 30; d = 415; e = 1; F = 41;
    if (gt > serum) tox = TRUE;
    for (let i = nnear; i >= 1; i--) {
      if ((ncre[i][1] === gdog) || (ncre[i][1] === grinch)) RemoveCreat(i);
    }
  } else if (terrain === 71) {                 // in Grinch square?
    if (notoxin === 0 && gt > serum) {
      tox = TRUE; toxpause = TRUE; d = 322; e = 46; F = 23;
    }
  }
  if (toxpause) {
    ClearMess();
    if (c > 0) ljnk(a, b, c, 1);
    ljnk(d, e, F, 2); PrintMessage(26, 0);
    if (toxpause === -1) await MessPause(26, 0);
  }
  if (tox) {
    add = gasmask + spacesuit + 3; if (asleep) { asleep = FALSE; zippy = -10; }
    hits = hits - cRoll(add); hitmax = hitmax - 1;
    if (hits < 0) { st1 = jnk$(139, 5, 11); await Dead(0); }
  }

  if (hittox) {
    if (cRoll(2000) < 3 - 150 * qb(berregen > 0)) {
      hittox = hittox - 1; hits = hits + 1; hitmax = hitmax + 1;
    }
  }

  if (spore > 0) {
    siz = cint(30 + 10 * pm10() * (1 - qb(berhpmut > 0)));
    siz = cint(siz + 20 * qb(pmut === 7 && berpmut === 0) * (1 - 0.45 * qb(berhpmut > 0)));
    if (asleep) siz = idiv(siz, 6);
    if (cRoll(siz) === 1) spore = spore - 1;
  }

  if (neutronsuit) {
    suitdam = cRoll(3);
    for (let icreat = nnear; icreat >= 1; icreat--) {
      if (crdsimp(ncre[icreat][4], ncre[icreat][5]) <= 1) {   // creat adjacent
        dam = suitdam; [dam] = CrDamAlter(icreat, dam, 2);
        ncre[icreat][2] = cint(ncre[icreat][2] - dam);
        if (ncre[icreat][2] < 0) {
          Ljnkbig(362, 38, 25, 0, 0, 0, Der$(FALSE, icreat, 1), 1, 1); l2 = '';
          await KillCreat(icreat);
        }
      }
    }
  }

  let olddark = 0, changed = 0;
  [dark, olddark, changed] = SetDark(dark, olddark, changed); if (changed) ChangeDark();

  await Timely();

  if (rdisp === 1) ShowHits();
}

// The character died (spec 0), quit (1), was killed by a special (2) or
// retired (3): offers a med kit, deletes the saved game and shows / updates
// the hall of fame in the file named by jnk$(3, 43, 12).
async function Dead(spec) {
  const nn = dimArray(' '.repeat(20), 42, [0, 2]), ee = dimLong(42, [0, 2]);
  const dd = dimArray(' '.repeat(29), 21, [0, 2]), numdead = dimInt([0, 2]), numretired = dimInt([0, 2]);
  const setNn = (i, p, s) => { nn[i][p] = fixstr(s, 20); };
  const setDd = (i, p, s) => { dd[i][p] = fixstr(s, 29); };
  let deadpage = 0, killedby$ = '', notingrinch = 0, triedmedkit = FALSE, diff = 0, add = 0;
  let filout$ = '', lof2 = 0, a$ = '', totalcastles = 0, rid = 0, a = 0, b = 0, c = 0, c$ = '';

  if (difficulty === easyplay) {
    deadpage = 2;
  } else if (difficulty === moderateplay) {
    deadpage = 1;
  } else {
    deadpage = 0;
  }

  killedby$ = st1;
  if (ucase$(left$(killedby$, 4)) === 'YOUR') killedby$ = 'a' + right$(killedby$, len(killedby$) - 4);
  if (left$(killedby$, 3) === 'The') killedby$ = 'a' + right$(killedby$, len(killedby$) - 3);
  rdisp = 1; ClearMess(); await DisplayCharacter();
  if (spec === 0 || spec === 2) {
    Ljnkbig(3, 19, 24, 0, 0, 0, killedby$, 1, 1); ljnk(3, 1, 18, 3);
    await MessPause(12, 0);
  }

  notingrinch = not(qb((incastle === -1) && (castle === 6) && (castlelevel === grinchlevel)));

  if (spec === 0 && notingrinch) {
    triedmedkit = FALSE;
    for (let md = 1, mdEnd = ngoody; md <= mdEnd; md++) {
      if (Math.abs(goody[md][1]) === 7 && goody[md][11] === 4 && goody[md][3] > 0 && hits < 0) {
        triedmedkit = TRUE;
        do {
          diff = cint(hitmax - hits); if (diff < 2) diff = 2;
          add = rolldice(idiv(diff, 2), 2, 2);
          if (add > 20) add = 20; else if (add < 3) add = 3;
          hits = hits + add;
          goody[md][3] = goody[md][3] - 1;
        } while (!(hits >= 0 || goody[md][3] <= 0));
        goody[md][3] = 0;
      }
    }
    if ((hits >= 0) && triedmedkit) {
      ClearMess();
      ljnk(148, 42, 24, 1); await MessPause(10, 0); ShowHits(); return;
    } else if (triedmedkit) {
      ClearMess();
      ljnk(265, 1, 36, 1); await MessPause(12, 0);
    }
  }

  const killsavefiles = () => { qbKill(filout$); KillBadMaps(-1); };   // kill saved files
  if (spec !== 1) {
    filout$ = left$(rtrim$(ltrim$(name$)), 8); filout$ = CheckFil(filout$);
    filout$ = ucase$(filout$ + '.alf');
    qbOpen(2, filout$, 'BINARY'); lof2 = qbFile(2).lof(); qbClose(2);
    if (lof2 > 0) {
      if (spec !== 3) {
        locate(24, 1); print('Delete ', filout$, ' [N]:'); await PauseForKey();
      } else {
        st1 = 'Y';
      }
      if (ucase$(left$(st1, 1)) === 'Y') killsavefiles();
    } else {
      killsavefiles();
    }
  }
  KillBadMaps(0);   // always kill "deleteme" files

  filout$ = jnk$(3, 43, 12);
  qbOpen(2, filout$, 'APPEND'); qbClose(2); const f2 = qbOpen(2, filout$, 'INPUT');
  for (let deadpages = 0; deadpages <= 2; deadpages++) {
    if (f2.eof()) numdead[deadpages] = 0; else { a$ = f2.lineInput(); numdead[deadpages] = cint(val(a$)); }
    if (numdead[deadpages] < 0) numdead[deadpages] = 0;
    for (let i = 1, iEnd = numdead[deadpages]; i <= iEnd; i++) {
      setNn(i, deadpages, f2.inputString()); ee[i][deadpages] = clng(f2.inputNumber()); setDd(i, deadpages, f2.inputString());
      setNn(i, deadpages, rtrim$(ltrim$(nn[i][deadpages])));
      setDd(i, deadpages, rtrim$(ltrim$(dd[i][deadpages])));
    }
    if (f2.eof()) numretired[deadpages] = 0; else { a$ = f2.inputString(); numretired[deadpages] = cint(val(a$)); }
    if (numretired[deadpages] < 0) numretired[deadpages] = 0;
    for (let ii = 1, iiEnd = numretired[deadpages]; ii <= iiEnd; ii++) {
      setNn(ii + 21, deadpages, f2.inputString()); ee[ii + 21][deadpages] = clng(f2.inputNumber());
      setNn(ii + 21, deadpages, rtrim$(ltrim$(nn[ii + 21][deadpages])));
    }
  }
  qbClose(2);

  if (spec !== 1 && spec !== 2) {
    if (spec === 3) {
      numretired[deadpage] = numretired[deadpage] + 1;
      setNn(numretired[deadpage] + 21, deadpage, rtrim$(ltrim$(name$)));
      ee[numretired[deadpage] + 21][deadpage] = expr;
    } else {
      totalcastles = 0;
      for (let lll = 0; lll <= 5; lll++) {
        totalcastles = totalcastles - qb((finishedcastles & 2 ** lll) === 2 ** lll);
      }
      if (totalcastles > 0) {
        expr = expr + 5000 * totalcastles; ClearMess(); await DisplayCharacter();
        Ljnkbig(395, 1, 11, 395, 19, 24, str$(5000 * totalcastles), 1, 1);
        Ljnkbig(396, 8, 13, 395, 48, 8 + qb(totalcastles === 1), str$(totalcastles), 1, 2);
        await MessPause(10, 0);
      }

      numdead[deadpage] = numdead[deadpage] + 1;
      setNn(numdead[deadpage], deadpage, rtrim$(ltrim$(name$)));
      ee[numdead[deadpage]][deadpage] = expr;
      setDd(numdead[deadpage], deadpage, rtrim$(ltrim$(killedby$)));
    }
  }

  const swap = (arr, i, j, p) => { const t = arr[i][p]; arr[i][p] = arr[j][p]; arr[j][p] = t; };
  for (let deadpages = 0; deadpages <= 2; deadpages++) {
    // check for duplicate dead guys:
    for (let iii = numdead[deadpages]; iii >= 2; iii--) {
      for (let j = iii - 1; j >= 1; j--) {
        if (ucase$(nn[j][deadpages]) === ucase$(nn[iii][deadpages])) {
          if (ee[j][deadpages] < ee[iii][deadpages]) rid = j; else rid = iii;
          for (let iiii = rid, iiiiEnd = numdead[deadpages] - 1; iiii <= iiiiEnd; iiii++) {
            nn[iiii][deadpages] = nn[iiii + 1][deadpages];
            ee[iiii][deadpages] = ee[iiii + 1][deadpages];
            dd[iiii][deadpages] = dd[iiii + 1][deadpages];
          }
          numdead[deadpages] = numdead[deadpages] - 1;
        }
      }
    }
    // sort dead guys by experience:
    for (let j = 1, jEnd = numdead[deadpages] - 1; j <= jEnd; j++) {
      for (let k = j + 1, kEnd = numdead[deadpages]; k <= kEnd; k++) {
        if (ee[j][deadpages] < ee[k][deadpages]) {
          swap(nn, j, k, deadpages); swap(ee, j, k, deadpages); swap(dd, j, k, deadpages);
        }
      }
    }

    for (let iii = numretired[deadpages]; iii >= 1; iii--) {
      // gets rid of jth dead character if character of same name has retired
      for (let j = numdead[deadpages]; j >= 1; j--) {
        if (ucase$(nn[j][deadpages]) === ucase$(nn[iii + 21][deadpages])) {
          if (j !== numdead[deadpages]) {
            const n = numdead[deadpages];
            swap(nn, j, n, deadpages); swap(ee, j, n, deadpages); swap(dd, j, n, deadpages);
          }
          numdead[deadpages] = numdead[deadpages] - 1;
        }
      }
      // check for duplicate retirees:
      for (let j = iii - 1; j >= 1; j--) {
        if (ucase$(nn[j + 21][deadpages]) === ucase$(nn[iii + 21][deadpages])) {
          if (ee[j + 21][deadpages] < ee[iii + 21][deadpages]) rid = j; else rid = iii;
          for (let iiii = rid + 21, iiiiEnd = numretired[deadpages] + 20; iiii <= iiiiEnd; iiii++) {
            nn[iiii][deadpages] = nn[iiii + 1][deadpages];
            ee[iiii][deadpages] = ee[iiii + 1][deadpages];
          }
          numretired[deadpages] = numretired[deadpages] - 1;
        }
      }
    }
    // sort retirees by experience:
    for (let iii = numretired[deadpages]; iii >= 1; iii--) {
      for (let j = 1; j <= iii - 1; j++) {
        if (ee[j + 21][deadpages] < ee[iii + 21][deadpages]) {
          swap(nn, j + 21, iii + 21, deadpages); swap(ee, j + 21, iii + 21, deadpages);
        }
      }
    }
  }

  const fo = qbOpen(2, filout$, 'OUTPUT');
  screenPages(3);
  for (let deadpages = 0; deadpages <= 2; deadpages++) {
    if (numdead[deadpages] > 20) numdead[deadpages] = 20;
    fo.write(numdead[deadpages]);

    if (numdead[deadpages] > 0) {
      ccls(3); box(1, 80, 1, 24, 2, 12, 3);
      color(12, 0); locate(2, 4); Printjnk(87, 14, 16);
      color(4); locate(2, 26); Printjnk(279, 46, 17); locate(2, 44);
      switch (deadpages) {
        case 0: b = 4; c = 6; break;
        case 1: b = 29; c = 13; break;
        default: b = 50; c = 4;
      }
      Printjnk(280, b, c);
      for (let j = 1; j <= numdead[deadpages]; j++) {
        fo.write(rtrim$(nn[j][deadpages]), ee[j][deadpages], rtrim$(dd[j][deadpages]));
        color(11); locate(j + 3, 4); print(nn[j][deadpages]); printTab(25);
        color(9); print(str$(ee[j][deadpages]), bl);
        Printjnk(6, 51, 10); print(chr$(44), bl);
        color(3);
        c$ = rtrim$(dd[j][deadpages]); Printjnk(11, 57, 10); print(c$);
      }
      color(10); locate(25, 10); Printjnk(35, 1, 32); DumpBuffer(); await PauseForKey();
    }

    if (numretired[deadpages] > 20) numretired[deadpages] = 20;
    fo.write(numretired[deadpages]);
    if (numretired[deadpages] > 0) {
      ccls(3); box(1, 80, 1, 24, 2, 13, 3);
      color(13, 0); locate(2, 4); Printjnk(410, 37, 12);
      color(5); locate(2, 26); Printjnk(279, 46, 17); locate(2, 44);
      switch (deadpages) {
        case 0: b = 4; c = 6; break;
        case 1: b = 29; c = 13; break;
        default: b = 50; c = 4;
      }
      Printjnk(280, b, c);
      for (let j = 22; j <= numretired[deadpages] + 21; j++) {
        fo.write(rtrim$(nn[j][deadpages]), ee[j][deadpages]);
        color(11); locate(j - 18, 4); print(nn[j][deadpages]); printTab(25);
        color(9); print(str$(ee[j][deadpages]), bl); Printjnk(6, 51, 10);
        color(3); print(space$(3));
        switch (cRoll(5)) {
          case 1: a = 100; b = 22; c = 18; break;
          case 2: a = 100; b = 40; c = 17; break;
          case 3: a = 100; b = 57; c = 9; break;
          case 4: a = 101; b = 21; c = 13; break;
          case 5: a = 101; b = 34; c = 19; break;
        }
        Printjnk(a, b, c);
      }
      color(10); locate(25, 10); Printjnk(35, 1, 32); DumpBuffer(); await PauseForKey();
    }
  }
  qbClose(2);

  bitit = TRUE; if (spec) bitit = 1;
}

// The Determine* routines fill in goody(ngoody) with a random item of their
// kind (unless dropped, i.e. it is an item picked up again) and announce it.
function DetermineArmor(dropped) {
  let typ = 0;
  if (!dropped) {
    typ = narm - cRoll(cRoll(narm - 1));
    goody[ngoody][1] = 4;
    goody[ngoody][2] = arm[typ][1];
    goody[ngoody][3] = typ;
    goody[ngoody][5] = qb(cRoll(20) === 1) + qb(cRoll(20) === 1) - qb(cRoll(14) === 1) - qb(cRoll(14) === 1);
    goody[ngoody][4] = cint((cRoll(arm[typ][2]) * 2 + arm[typ][2]) / 3 + goody[ngoody][5]);
    if (goody[ngoody][4] === 0) goody[ngoody][4] = 1;
    gdy[ngoody] = armnm$(typ);
  }
  ClearMess();   // darm
  Ljnkbig(1, 1, 13, 2, 62, 5, rtrim$(gdy[ngoody]), 2, 2);
  PrintMessage(7, 0);
  if (rdisp !== 1) DisplayGoodies(FALSE);
}

function DetermineBerry(dropped) {
  let typ = 0, d = 0, zz = 0, v = 0, a = 0, b = 0, c = 0;
  if (!dropped) {
    typ = cRoll(nberry);
    goody[ngoody][1] = 6; goody[ngoody][2] = 1;
    goody[ngoody][3] = typ;
    d = cRoll(6); goody[ngoody][4] = d;
    zz = cRoll(10000);
    if (zz < 5) v = 2; else if (zz < 100) v = 1; else v = 0;
    goody[ngoody][5] = v;
    switch (v) {
      case 0: a = -2; b = 37; c = 5; break;
      case 1: a = 7; b = 63; c = 6; break;
      default: a = 6; b = 61; c = 7;
    }
    gdy[ngoody] = Kolr$(d) + berry$[typ] + bl + jnk$(a, b, c);
    goody[ngoody][6] = cRoll(3) - 1;  // age
  }
  ClearMess();   // dber  (d is 0 for a dropped berry (sic))
  if (d === 2) st1 = 'an '; else st1 = 'a ';
  Ljnkbig(1, 1, 13, 0, 0, 0, st1 + rtrim$(gdy[ngoody]), 1, 2);
  PrintMessage(12, 0);
  if (rdisp !== 1) DisplayGoodies(FALSE);
}

function DetermineLsd(dropped) {
  let k = 0, bad = FALSE, sym = 0, fc = 0, bc = 0, sc = 0, a = 0, b = 0, c = 0, num = 0;
  let a$ = '', bb$ = '', aa$ = '';
  if (dropped >= 0) {
    if (dropped > 0) {
      k = dropped;
    } else {
      do {   // rdlsd
        k = cRoll(nlsd + nltrash);
      } while ((incastle & qb(k === 4 || k === 8 || k === 10 || k === 12)) !== 0);
    }

    if (k === 8) {   // safe
      bad = FALSE;
      for (let i = 1; i <= ngoody; i++) {
        if ((Math.abs(goody[i][1]) === 8) && (goody[i][11] === 8)) bad = TRUE;
      }
      for (let i = 1; i <= ndropped; i++) {   // remove dropped safe if there is one
        if (Math.abs(drgoody[i][1]) === 8 && drgoody[i][11] === 8) {
          if (drgoody[i][13] === mainx && drgoody[i][14] === mainy) {
            [sym, fc, bc] = GetSym(drgoody[i][15], drgoody[i][16], 1);
            if (sym === 21 || sym === 157) sc = -1; else sc = 2;
            PutSym(250, drgoody[i][15], drgoody[i][16], 8, 0, sc);
          }
          ShiftDropped(i); break;
        }
      }
      if (bad) k = nlsd + cRoll(nltrash);  // make cabinet
    }

    switch (cRoll(3)) {
      case 1: a = -2; b = 44; c = 7; break;
      case 2: a = -2; b = 51; c = 7; break;
      default: a = 253; b = 61; c = 7;
    }
    a$ = jnk$(a, b, c);
    switch (cRoll(3)) {
      case 1: a = 155; b = 7; c = 5; break;
      case 2: a = 155; b = 25; c = 4; break;     // shiny, tech, bizarre
      case 3: a = 163; b = 31; c = 7; break;
    }
    bb$ = jnk$(a, b, c);
    for (let j = 1; j <= 12; j++) goody[ngoody][j] = 0;
    goody[ngoody][1] = 8;
    for (let j = 1; j <= 3; j++) goody[ngoody][j + 1] = lsd[k][j];
    num = lsd[k][2];
    if (num > 0) goody[ngoody][3] = rolldice(num, 2, 1); else goody[ngoody][3] = -1;
    goody[ngoody][10] = lsdknown[k];
    goody[ngoody][11] = k;
    if (lsdknown[k]) {
      gdy[ngoody] = lsdnm$(k);
    } else {
      gdy[ngoody] = jnk$(-2, 58, 6) + bb$ + a$;
    }
  }
  ClearMess();   // dlsd
  switch (ucase$(left$(gdy[ngoody], 1))) {
    case 'A': case 'E': case 'I': case 'O': case 'U': aa$ = 'an '; break;
    default: aa$ = 'a ';
  }
  Ljnkbig(1, 1, 13, 0, 0, 0, aa$ + gdy[ngoody], 1, 2);
  PrintMessage(11, 0);

  if ((goody[ngoody][1] === 8) && (goody[ngoody][11] === 8) && (nsafe > 0)) goody[ngoody][1] = -8;

  if (rdisp !== 1) DisplayGoodies(FALSE);
}

function DetermineParts(dropped) {
  if (!dropped) {
    for (let j = 1; j <= 12; j++) goody[ngoody][j] = 0;
    goody[ngoody][1] = 10;
    goody[ngoody][2] = rolldice(5, 3, 3);
    goody[ngoody][3] = cRoll(4) + cRoll(3);
    gdy[ngoody] = jnk$(319, 50, 17);
  }
  ClearMess();   // dparts
  Ljnkbig(1, 1, 13, 0, 0, 0, 'some ' + gdy[ngoody], 1, 2);
  PrintMessage(13, 0);
  if (rdisp !== 1) DisplayGoodies(FALSE);
}

function DetermineShield(dropped) {
  let typ = 0;
  if (!dropped) {
    typ = nsh - cRoll(cRoll(nsh - 1));
    if (typ < 5) typ = nsh - cRoll(cRoll(nsh - 1));
    goody[ngoody][1] = 5;
    goody[ngoody][2] = sh[typ][1];
    goody[ngoody][3] = typ;
    goody[ngoody][5] = qb(cRoll(20) === 1) + qb(cRoll(20) === 1) - qb(cRoll(14) === 1) - qb(cRoll(14) === 1);
    goody[ngoody][4] = cint((cRoll(sh[typ][2]) * 2 + sh[typ][2]) / 3 + goody[ngoody][5]);
    if (goody[ngoody][4] === 0) goody[ngoody][4] = 1;
    gdy[ngoody] = shnm$(typ) + jnk$(3, 55, 7);
  }
  ClearMess(); Ljnkbig(1, 1, 15, 0, 0, 0, gdy[ngoody], 1, 2);   // dsh
  PrintMessage(3, 0);
  if (rdisp !== 1) DisplayGoodies(FALSE);
}

function DetermineSpecial(dropped, num) {
  let aa$ = '';
  ClearMess();
  if (num !== 1) aa$ = 'a '; else aa$ = '';
  Ljnkbig(1, 1, 13, 0, 0, 0, aa$ + gdy[ngoody], 1, 2);
  PrintMessage(15, 0);
  goody[ngoody][1] = 9; goody[ngoody][2] = dropped; goody[ngoody][3] = num;
  for (let i = 4; i <= 11; i++) goody[ngoody][i] = 0;
  if (num === 7) { goody[ngoody][4] = rolldice(5, 7, 4); goody[ngoody][5] = 0; }
  if (num === 9) goody[ngoody][4] = rolldice(3, 2, 2);       // wig condition
  if (rdisp !== 1) DisplayGoodies(FALSE);
  return num;
}

function DetermineSsd(dropped) {
  let k = 0, bad = FALSE, zz = 0, sym = 0, fc = 0, bc = 0, sc = 0, a = 0, b = 0, c = 0;
  let num = 0, typ = 0, a$ = '', bb$ = '';
  if (dropped >= 0) {
    if (dropped > 0) {
      k = dropped;
    } else {
      k = cRoll(int((nssd + ntechwep + nstrash) * 1.16));
      if (k > nssd + ntechwep + nstrash) {
        zz = cRoll(8);
        switch (zz) {
          case 1: case 2: case 3: k = 6; break;   // powerpack
          case 4: k = 23; break;                  // tricorder
          case 5: k = 2; break;                   // backpack
          case 6: k = 28; break;                  // microcomputer
          case 7: k = nssd + ntechwep + 16; break; // wristwatch
          case 8: k = 4; break;                   // medkit
        }
      }
      if (k === 5) bad = TRUE;
    }

    if (k === 2) {   // backpack
      for (let i = 1; i <= ngoody; i++) {
        if ((Math.abs(goody[i][1]) === 7) && (goody[i][11] === 2)) bad = TRUE;
      }
      for (let i = 1; i <= ndropped; i++) {   // remove dropped backpack if there is one
        if (Math.abs(drgoody[i][1]) === 7 && drgoody[i][11] === 2) {
          if (drgoody[i][13] === mainx && drgoody[i][14] === mainy) {
            [sym, fc, bc] = GetSym(drgoody[i][15], drgoody[i][16], 1);
            if (sym === 11 || sym === 12) sc = -1; else sc = 2;
            PutSym(250, drgoody[i][15], drgoody[i][16], 8, 0, sc);
          }
          ShiftDropped(i); break;
        }
      }
      for (let i = 1; i <= nsafe; i++) {
        if (safe[i][1] === 7 && safe[i][11] === 2) bad = TRUE;
      }
    }
    if (bad) k = nssd + ntechwep + cRoll(nstrash);  // trash

    switch (cRoll(3)) {
      case 1: a = -2; b = 44; c = 7; break;
      case 2: a = -2; b = 51; c = 7; break;       // device, object, gadget
      case 3: a = 253; b = 61; c = 7; break;
    }
    a$ = jnk$(a, b, c);
    switch (cRoll(3)) {
      case 1: a = 155; b = 7; c = 5; break;
      case 2: a = 155; b = 25; c = 4; break;      // shiny, tech, bizarre
      case 3: a = 163; b = 31; c = 7; break;
    }
    bb$ = jnk$(a, b, c);
    for (let j = 1; j <= 12; j++) goody[ngoody][j] = 0;
    goody[ngoody][1] = 7;
    for (let i = 1; i <= 8; i++) goody[ngoody][i + 1] = ssd[k][i];
    num = ssd[k][2];
    if (num > 0) goody[ngoody][3] = rolldice(num, 2, 1); else goody[ngoody][3] = -1;
    goody[ngoody][10] = ssdknown[k];
    goody[ngoody][11] = k;
    if (ssdknown[k]) {
      gdy[ngoody] = ssdnm$(k);
    } else {
      gdy[ngoody] = jnk$(3, 62, 6) + bb$ + a$;
    }

    switch (k) {
      case 19:     // ID
        goody[ngoody][5] = cRoll(cRoll(cRoll(3)));
        break;
      case nssd + ntechwep + 13:  // voodoo
        typ = cRoll(ncreat + creextra + 1); goody[ngoody][5] = typ;
        if (ssdknown[k]) gdy[ngoody] = CreatNam$(typ, 0) + bl + gdy[ngoody];
        if (left$(ucase$(gdy[ngoody]), 3) === 'THE') {
          gdy[ngoody] = right$(gdy[ngoody], len(gdy[ngoody]) - 4);
        }
        break;
    }
  }
  ClearMess();   // dssd
  switch (ucase$(left$(ltrim$(gdy[ngoody]), 1))) {
    case 'A': case 'E': case 'I': case 'O': case 'U': a$ = 'an '; break;
    default: a$ = 'a ';
  }
  Ljnkbig(1, 1, 13, 0, 0, 0, a$ + gdy[ngoody], 1, 2);
  PrintMessage(14, 0);

  if ((goody[ngoody][1] === 7) && (goody[ngoody][11] === 2) && (npack > 0)) goody[ngoody][1] = -7;

  if (rdisp !== 1) DisplayGoodies(FALSE);
}

function DetermineWep(dropped) {
  let typ = 0, num = 0, aa$ = '', bb$ = '';
  if (dropped) {
    typ = 0;
  } else {
    switch (cRoll(12)) {
      case 1: case 2: case 3:  // range
        typ = cRoll(cRoll(nrwep - 2)) + nwep; break;  // all but Ti, duralloy weps
      case 4: case 5:          // range
        typ = cRoll(cRoll(nrwep)) + nwep; break;
      case 6: case 7: case 8: case 9:
        typ = cRoll(cRoll(nwep - 5)); break;          // all but Ti, duralloy weps
      default:
        typ = cRoll(cRoll(nwep));
    }
    if ((typ < 1) || (typ > nwep + nrwep)) typ = 1;
    goody[ngoody][1] = 3;
    for (let jj = 1; jj <= 6; jj++) goody[ngoody][jj + 1] = wep[typ][jj];
    goody[ngoody][8] = typ;
    // + to hit, dam:
    goody[ngoody][9] = qb(cRoll(20) === 1) + qb(cRoll(20) === 1) - qb(cRoll(14) === 1) - qb(cRoll(14) === 1);
    goody[ngoody][10] = qb(cRoll(20) === 1) + qb(cRoll(20) === 1) - qb(cRoll(14) === 1) - qb(cRoll(14) === 1);
    gdy[ngoody] = wepnm$(typ);
  }
  bb$ = '';   // dwep
  if (typ > nwep) {
    num = rolldice(goody[ngoody][3], 2, 1); goody[ngoody][3] = num;
  }
  switch (ucase$(left$(gdy[ngoody], 1))) {
    case 'A': case 'E': case 'I': case 'O': case 'U': aa$ = 'an '; break;
    default: aa$ = 'a ';
  }
  if (goody[ngoody][3] > 1) { aa$ = ltrim$(str$(goody[ngoody][3])) + bl; bb$ = chr$(115); }
  ClearMess();
  Ljnkbig(1, 1, 13, 0, 0, 0, aa$ + gdy[ngoody] + bb$, 1, 2);
  PrintMessage(9, 0);
  if (rdisp !== 1) DisplayGoodies(FALSE);
}

// The character panel on the right of the screen (rdisp = 1).
async function DisplayCharacter() {
  if (rdisp !== 1) { DisplayGoodies(FALSE); return; }
  let row = 0, a = 0, b = 0, c = 0;
  const colm = 55;
  const locatnpr = () => { locate(row, colm); Printjnk(a, b, c); };
  rside = TRUE;
  clearright(vpage); screenPages(vpage); await HungFatEnc(); SetCombatStats();
  color(11, 0); locate(2, 55); print(name$); color(1);
  row = 3; a = 4; b = 1; c = 10; locatnpr();
  row = 4; b = 11; c = 11; locatnpr();
  row = 5; b = 22; c = 14; locatnpr();
  row = 6; b = 36; c = 22; locatnpr();
  row = 7; a = 5; b = 1; c = 19; locatnpr();
  row = 8; b = 20; c = 14; locatnpr();
  locate(10, 54); color(9); print(hits, bl);
  color(1); Printjnk(5, 34, 11); color(9); print(hitmax); color(1);
  row = 11; a = 5; b = 45; c = 13; locatnpr();
  row = 13; a = 6; b = 1; c = 8; locatnpr();
  row = 14; b = 23; c = 9; locatnpr();
  row = 15; b = 9; c = 14; locatnpr();
  row = 17; b = 32; c = 12; locatnpr();
  row = 18; b = 44; c = 7; locatnpr();
  color(9);
  locate(3, 65); print(str + stradd);
  locate(4, 66); print(dex + dexadd);
  locate(5, 69); print(con);
  locate(6, 77); print(rr);
  locate(7, 74); print(mr);
  locate(8, 69); print(intl);
  locate(11, 68); print(ac);
  locate(17, 68); print(expr);
  locate(18, 63); print(lvl);
  if (berhpmut > 0) color(13);
  locate(20, 54); if (pmutturns > 0) print(pmutturns); else print(' * ');
  print(pmutn$, bl);
  if (pmut === 17) { if (tentgrab) print(' grabbed'); else print(space$(8)); }
  if (berhmmut > 0) color(13); else color(9);
  locate(21, 54); if (mmutturns > 0) print(mmutturns); else print(' * ');
  print(mmutn$, bl);
  if (mmut === 7) { if (forcefield) print(' on '); else print(' off'); }
}

// The item list on the right of the screen: pak 0 = carried, 1 = backpack,
// 2 = safe.
function DisplayGoodies(pak) {
  let n = 0, mm = 0, nums = 0, nm$ = '', aaa = 0, j$ = '', fc = 0, a = 0, b = 0, c = 0, gg = 0;
  rside = FALSE; SortGoody(); clearright(vpage); screenPages(vpage);
  if (pak === 1) {
    n = npack;
  } else if (pak === 2) {
    n = nsafe;
  } else {
    n = ngoody;
  }
  for (let i = 1; i <= n; i++) {
    if (pak === 1) {
      mm = Math.abs(backpack[i][1]); nums = backpack[i][3]; nm$ = bakpak[i];
      aaa = backpack[i][11];
    } else if (pak === 2) {
      mm = Math.abs(safe[i][1]); nums = safe[i][3]; nm$ = saf[i];
      aaa = safe[i][11];
    } else {
      mm = Math.abs(goody[i][1]); nums = goody[i][3]; nm$ = gdy[i];
      aaa = goody[i][11];
    }
    j$ = nm$;
    switch (mm) {
      case 1: case 2:
        if (nums === 1) st1 = bl + jnk$(2, 47, 7); else st1 = jnk$(2, 53, 9);
        j$ = ltrim$(str$(nums) + st1 + rtrim$(nm$));
        if (mm === 1) fc = 13; else fc = 6;
        break;
      case 3:
        if (nums > 1) {
          j$ = ltrim$(str$(nums) + bl + rtrim$(nm$) + chr$(115));
        }
        fc = 1;
        break;
      case 4: fc = 7; break;
      case 5: fc = 3; break;
      case 6: fc = 12; if (knownb[nums]) j$ = j$ + ' *'; break;
      case 7:
        if (aaa === 19 && ssdknown[19]) {
          a = 263;
          if (pak === 1) {
            gg = backpack[i][5];
          } else if (pak === 2) {
            gg = safe[i][5];
          } else {
            gg = goody[i][5];
          }
          switch (gg) {
            case 2: b = 1; c = 10; break;
            case 3: b = 11; c = 8; break;
            case 4: b = 19; c = 12; break;
            default: a = 262; b = 58; c = 8;
          }
          j$ = jnk$(a, b, c) + bl + nm$;
        }
        fc = 14;
        break;
      case 8: fc = 11; break;
      case 9: fc = 15; break;
      default: fc = 13;
    }
    color(fc, 0);
    if ((pak === 0) && (goody[i][1] < 0)) {
      locate(i + 1, 54); print(chr$(42));
    }
    locate(i + 1, 55); print(chr$(i + 96), bl, left$(rtrim$(j$), 23));
  }
}

// Starting equipment, chosen from the character's attributes.
function EquipCharacter(supr) {
  let num = 0, weapon = 0, del = 0, dic = 0, ridarmor = FALSE, typ = 0, d = 0;
  const givber = () => {
    ngoody = ngoody + 1;
    typ = cRoll(nberry); knownb[typ] = TRUE; d = cRoll(6);
    goody[ngoody][1] = 6; goody[ngoody][2] = 1;
    goody[ngoody][3] = typ; goody[ngoody][4] = d; goody[ngoody][5] = 0;
    gdy[ngoody] = Kolr$(d) + berry$[typ] + bl + jnk$(-2, 37, 5);
  };

  num = idiv(str + dex, 2); if (pmut === 2 || pmut === 3) num = num - 6;
  if (supr) num = 1;
  if (num < 5) weapon = 8;
  else if (num < 8) weapon = 7;
  else if (num === 8 || num === 9 || num === 10) weapon = 6;
  else if (num === 11 || num === 12) weapon = 5;
  else if (num === 13 || num === 14) weapon = 4;
  else if (num === 15 || num === 16) weapon = 3;
  else if (num === 17 || num === 18) weapon = 2;
  else weapon = 1;
  gdy[1] = wepnm$(weapon); goody[1][1] = -3;
  for (let i = 1; i <= 6; i++) goody[1][i + 1] = wep[weapon][i];
  goody[1][8] = weapon;

  num = 16 - hits; if (supr) num = 4;
  if (num < 0) del = 1;            // nwep selection
  else if (num === 0 || num === 1) del = 2;
  else if (num === 2) del = 3;
  else if (num === 3) del = 4;
  else del = 5;
  gdy[2] = wepnm$(nwep + del); goody[2][1] = 3;
  for (let i = 1; i <= 6; i++) goody[2][i + 1] = wep[nwep + del][i];
  goody[2][8] = nwep + del;
  dic = idiv(str + dex + con + mr + rr + intl, 3); dic = 50 - dic;
  if (dic < 12) dic = 12;
  num = rolldice(dic, 3, 1); goody[2][3] = cint(goody[2][3] * num / 20);

  num = idiv(con + rr, 2);
  if (pmut === 7 || pmut === 8) num = num - 6; else if (pmut === 5) num = 15;
  ridarmor = FALSE; if (supr) num = 1;
  if (num < 5) armor = 8;
  else if (num < 8) armor = 9;
  else if (num >= 8 && num <= 10) armor = 10;
  else if (num >= 11 && num <= 14) armor = 11;
  else { armor = 11; ridarmor = TRUE; }
  gdy[3] = armnm$(armor);
  goody[3][1] = -4; goody[3][2] = arm[armor][1];
  goody[3][3] = armor; goody[3][4] = arm[armor][2];

  gdy[4] = 'Spam'; goody[4][1] = 1; goody[4][2] = 0; goody[4][3] = 1 - qb(hits < 14);
  ngoody = 4;

  num = idiv(intl + mr, 2); if (mmut === 2 || mmut === 3) num = num - 6;
  if (pmut === 5) num = 16;
  if (supr) num = 1;
  if (num < 5) shield = 4;
  else if (num < 7) shield = 5;
  else if (num < 9) shield = 6;
  else if (num >= 10 && num <= 11) shield = 7;
  else if (num >= 12 && num <= 15) shield = 8;
  else shield = 9;          // (also num = 9)
  if (shield < 9) {
    gdy[5] = shnm$(shield) + jnk$(3, 55, 7); goody[5][1] = -5;
    goody[5][2] = sh[shield][1]; goody[5][3] = shield; goody[5][4] = sh[shield][2];
    ngoody = 5;
  }

  switch (mmut) {
    case 2: case 3: givber(); break;
  }
  switch (pmut) {
    case 4: case 7: case 8: case 10: case 13: givber(); break;
    case 5: RemoveGoody(3, FALSE); break;
  }
  if (goody[3][1] === 4 && ridarmor) RemoveGoody(3, FALSE);
  SetCombatStats();
}

function EraseCreat(i) {
  let mmainx = 0, mmainy = 0, mlocx = 0, mlocy = 0, cresym = 0, cref = 0, sym = 0, fc = 0, bc = 0;
  [mmainx, mmainy, mlocx, mlocy] = FindMPos(i, mmainx, mmainy, mlocx, mlocy);
  if ((mmainx === mainx) && (mmainy === mainy)) {
    cresym = imod(ncre[i][8], 1000); cref = idiv(ncre[i][8], 1000);
    PutSym(cresym, mlocx, mlocy, cref, 0, 2);
    if (cresym === 228) {    // secret door
      [sym, fc, bc] = GetSym(mlocx, mlocy - 1, 2);
      if (fc === wallcolr) cresym = ver; else cresym = hor;
    }
    [sym, fc, bc] = GetSym(mlocx, mlocy, 1);
    if (sym !== 32 && fc !== 0) {
      PutSym(cresym, mlocx, mlocy, cref, 0, 1);
    }
  }
}

// Main-map square and local position of creature i.  Returns
// [mx, my, mlocx, mlocy].
function FindMPos(i, mx, my, mlocx, mlocy) {
  let mmx = 0, mmy = 0;
  if (incastle) {
    mx = mainx; my = mainy;
    mlocx = localx + ncre[i][4]; mlocy = localy + ncre[i][5];
  } else {
    mmx = mainx * 50 + localx + ncre[i][4] - 2;
    mmy = mainy * 20 + localy + ncre[i][5] - 2;
    mx = idiv(mmx, 50); my = idiv(mmy, 20);
    mlocx = imod(mmx, 50) + 2; mlocy = imod(mmy, 20) + 2;
    if (mx === mainx - 1 && mlocx === 51) {
      mx = mainx; mlocx = 1;
    } else if (mx === mainx + 1 && mlocx === 2) {
      mx = mainx; mlocx = 52;
    }
    if (my === mainy - 1 && mlocy === 21) {
      my = mainy; mlocy = 1;
    } else if (my === mainy + 1 && mlocy === 2) {
      my = mainy; mlocy = 22;
    }
  }
  return [mx, my, mlocx, mlocy];
}

// Damages / destroys / drains one of the character's items.  l2 returns
// the message; returns the item number (zero if it did nothing).
async function KillItem(i) {
  let item = 0, itemfind = 0, c = 0, stol = 0;
  l2 = bl;
  const getitem = () => {
    for (;;) {
      item = cRoll(ngoody); if (ngoody === 0) item = 0;
      switch (itemfind) {
        case 0: if (Math.abs(goody[item][1]) === 9) item = 0; break;
        case 3: case 4: case 5: case 6: if (Math.abs(goody[item][1]) !== itemfind) item = 0; break;
        case 7: if (Math.abs(goody[item][1]) !== 7 && Math.abs(goody[item][1]) !== 8) item = 0; break;
      }
      if (item > 0) {    // no steal Pres ID
        if (Math.abs(goody[item][1]) === 7 && goody[item][11] === 19 && goody[item][5] > 3) stol = 0;
      }
      if ((item | qb(cRoll(15) === 1)) !== 0) return;
    }
  };
  const destroy = () => {
    if (Math.abs(goody[item][1]) === 7 && goody[item][11] === 2) {   // backpack
      Scatter(1);
    } else if (Math.abs(goody[item][1]) === 8 && goody[item][11] === 8) {   // safe
      Scatter(2);
    }
    if (Math.abs(goody[item][1]) < 3) {  // food
      goody[item][3] = goody[item][3] - 1;
      Ljnkbig(1, 14, 9, 275, 40, 15, gdy[item], 1, 2);
      if (goody[item][3] <= 0) RemoveGoody(item, FALSE);
    } else {
      l2 = 'Your ' + gdy[item] + ' ' + jnk$(275, 41, 14);
      RemoveGoody(item, FALSE);
    }
  };
  switch (i) {
    case 0:   // destroy any
      itemfind = 0; getitem(); if (item) destroy();
      break;
    case 1:   // destroy tech
      itemfind = 7; getitem(); if (item) destroy();
      break;
    case 2:   // totally drain tech
      itemfind = 7; getitem();
      if (item && goody[item][3] > 0) {
        goody[item][3] = 0;
        l2 = 'Your ' + gdy[item] + ' ' + jnk$(274, 1, 22);
      }
      break;
    case 3:   // partially drain tech
      itemfind = 7; getitem();
      if (item && goody[item][3] > 0) {
        goody[item][3] = cRoll(goody[item][3]) - 1;
        l2 = 'Your ' + gdy[item] + ' ' + jnk$(274, 23, 32);
      }
      break;
    case 4:   // damage armor
      itemfind = 4; getitem();
      if (item) {
        goody[item][4] = goody[item][4] - 1;
        if (goody[item][4] === 0) destroy(); else l2 = 'Your ' + gdy[item] + ' ' + jnk$(270, 50, 18);
      }
      break;
    case 5:   // damage shield
      itemfind = 5; getitem();
      if (item) {
        goody[item][4] = goody[item][4] - 1;
        if (goody[item][4] === 0) destroy(); else l2 = 'Your ' + gdy[item] + ' ' + jnk$(272, 42, 19);
      }
      break;
    case 6:   // remove + from armor
      itemfind = 4; getitem();
      if (item) {
        goody[item][5] = goody[item][5] - 1;
        l2 = 'Your ' + gdy[item] + ' ' + jnk$(275, 1, 19);
      }
      break;
    case 7:   // remove + from shield
      itemfind = 5; getitem();
      if (item) {
        goody[item][5] = goody[item][5] - 1;
        l2 = 'Your ' + gdy[item] + ' ' + jnk$(275, 20, 20);
      }
      break;
    case 8:   // remove + from weapon
      itemfind = 3; getitem();
      if (item) {
        c = cRoll(2); goody[item][8 + c] = goody[item][8 + c] - 1;
        l2 = 'Your ' + gdy[item] + ' ' + jnk$(275, 27, 13);
      }
      break;
    case 9:   // destroy berry
      itemfind = 6; getitem(); if (item) destroy();
      break;
  }
  i = item; if (item > 0 && rdisp !== 1) await DisplayCharacter();
  return i;
}

// Rolls up a new character (supr: all attributes 18).
function MakeCharacter(supr) {
  let res = 0, knownberry = 0, knownssd = 0, knownlsd = 0;
  str = rolldice(6, 4, 3); dex = rolldice(6, 4, 3);
  con = rolldice(6, 4, 3); rr = rolldice(6, 4, 3);
  mr = rolldice(6, 4, 3); intl = rolldice(6, 4, 3);
  hunger = 0; fatigue = 0;
  expr = 0; lvl = 1;
  if (supr) { str = 18; dex = 18; con = 18; rr = 18; mr = 18; intl = 18; }
  pmut = cRoll(nphysmut); pmutn$ = pmutnm$(pmut);
  mmut = cRoll(nmentmut); mmutn$ = mmutnm$(mmut);
  switch (pmut) {
    case 2: dex = 19 + idiv(dex, 4); break;   // H Dex
    case 3: str = 19 + idiv(str, 4); break;   // H Str
    case 4: other2hitc = other2hitc + 2; other2hitr = other2hitr + 2; break;   // H Vis
    case 7: con = 19 + idiv(con, 4); break;   // Blood SC
    case 8: rr = 19 + idiv(rr, 4); break;     // Rad ref
  }

  switch (mmut) {
    case 1:   // Mil gen
      other2hitc = other2hitc + 2; other2hitr = other2hitr + 2; otherdam = otherdam + 4; break;
    case 2: intl = 19 + idiv(intl, 4); break;   // Sci Genius
    case 3: mr = 19 + idiv(mr, 4); break;       // H Willpower
    case 4: case 8: case 9: case 11: res = rolldice(6, 3, 3); if (mr < res) mr = res; break;
  }

  hitmax = 7 + rolldice(cint(con / 3 + 1), 3, 2);
  if (pmut === 7) hitmax = hitmax + 2;
  if (pmut === 10) hitmax = hitmax + 10;
  hits = hitmax;

  knownberry = rolldice(idiv(intl, 4), 2, 2);
  for (let i = 1; i <= knownberry; i++) knownb[berord[cRoll(nberry)]] = TRUE;

  knownssd = rolldice(idiv(intl, 5), 2, 2);
  for (let i = 1; i <= knownssd; i++) ssdknown[cRoll(nssd + ntechwep + nstrash)] = TRUE;

  knownlsd = cRoll(idiv(intl, 3)) - 1;
  for (let i = 1; i <= knownlsd; i++) {
    lsdknown[cRoll(nlsd + nltrash)] = TRUE;
  }

  SetCombatStats();
}

// Page 3: the berries, small and large devices the character knows.
async function MakeKnownScreen() {
  let row = 2, colm = 2, haspack = FALSE, hassafe = FALSE;
  const chk = async () => {
    if (row > 23 && colm > 5) {
      row = 1; colm = 2; locate(25, 10); Printjnk(35, 1, 32); await PauseForKey(); ccls(3);
    } else if (row > 23) {
      row = 1; colm = 43;
    }
  };
  screenPages(3); ccls(3);

  for (let ii = 1; ii <= ngoody; ii++) {
    if (goody[ii][1] === -7 && goody[ii][11] === 2) haspack = TRUE;
    if (goody[ii][1] === -8 && goody[ii][11] === 8) hassafe = TRUE;
  }

  color(12, 0); locate(1, 2); Printjnk(36, 1, 15);

  for (let i = 0; i <= nberry; i++) {
    if (knownb[berord[i]]) {
      color(4);
      await chk(); locate(row, colm); print(berry$[berord[i]]);
      Printjnk(22, 5, 9); print(BerEff$(berord[i]));
      color(12);
      if (haspack) {
        for (let ii = 1; ii <= npack; ii++) {
          if (backpack[ii][1] === 6 && backpack[ii][3] === berord[i]) {
            locate(row, colm - 1); print('+');
          }
        }
      } else if (hassafe) {
        for (let ii = 1; ii <= nsafe; ii++) {
          if (safe[ii][1] === 6 && safe[ii][3] === berord[i]) {
            locate(row, colm - 1); print('>');
          }
        }
      }
      for (let ii = 1; ii <= ngoody; ii++) {
        if (goody[ii][1] === 6 && goody[ii][3] === berord[i]) {
          locate(row, colm - 1); print('*');
        }
      }
      row = row + 1;
    }
  }

  color(14);
  row = row + 3; await chk();
  if (row > 2) row = row - 2; else row = 1;
  locate(row, colm); Printjnk(35, 33, 26); row = row + 1;
  for (let i = 1; i <= nssd + ntechwep + nstrash; i++) {
    if (ssdknown[i]) {
      color(6); await chk(); locate(row, colm);
      if ((incastle & qb(castle === 4)) !== 0) {
        switch (i) {
          case 10: case 19: case 27: case nssd + ntechwep + 1: case nssd + ntechwep + 6: case nssd + ntechwep + 13:
            print(ssdnm$(i)); break;
          default: st1 = ssdnm$(i); println(right$(st1, len(st1) - 6));   // (sic) no ';'
        }
      } else {
        print(ssdnm$(i));
      }
      color(14);
      if (haspack) {
        for (let ii = 1; ii <= npack; ii++) {
          if (backpack[ii][1] === 7 && backpack[ii][3] === i) {
            locate(row, colm - 1); print('+');
          }
        }
      } else if (hassafe) {
        for (let ii = 1; ii <= nsafe; ii++) {
          if (safe[ii][1] === 6 && safe[ii][3] === i) {
            locate(row, colm - 1); print('>');
          }
        }
      }
      for (let ii = 1; ii <= ngoody; ii++) {
        if (Math.abs(goody[ii][1]) === 7 && goody[ii][11] === i) {
          locate(row, colm - 1); print('*');
        }
      }
      row = row + 1;
    }
  }

  color(11);
  row = row + 3; await chk(); if (row > 2) row = row - 2; else row = 1;
  locate(row, colm); Printjnk(36, 16, 26); row = row + 1;
  for (let i = 1; i <= nlsd + nltrash; i++) {
    if (lsdknown[i]) {
      color(3);
      await chk(); locate(row, colm);
      if ((incastle & qb(castle === 4)) !== 0) {
        switch (i) {
          case 10: case nlsd + 12: print(lsdnm$(i)); break;
          default: st1 = lsdnm$(i); print(right$(st1, len(st1) - 6));
        }
      } else {
        print(lsdnm$(i));
      }
      color(11);
      if (hassafe) {
        for (let ii = 1; ii <= nsafe; ii++) {
          if (safe[ii][1] === 8 && safe[ii][3] === i) {
            locate(row, colm - 1); print('>');
          }
        }
      }
      for (let ii = 1; ii <= ngoody; ii++) {
        if (Math.abs(goody[ii][1]) === 8 && goody[ii][11] === i) {
          locate(row, colm - 1); print('*');
        }
      }
      row = row + 1;
    }
  }
  locate(25, 10); Printjnk(35, 1, 32);
}

// symbol: DATA
const SYMBOL_DATA = [
  1, 15, 'You', 15, 10, 'Thick Forest', 42, 2, 'Light Woods', 32, 7, 'Plains',
  176, 6, 'Marsh', 177, 6, 'Swamp', 247, 1, 'Water',
  30, 127, 94, 239, 234,
  15, 10, 'Tree', 42, 2, 'Bush', 249, 2, 'Underbrush',
  250, 6, 'Brush', 176, 6, 'Bog', 247, 9, 'Deep Water', 240, 5, 'Lair Entrance',
  24, 1, 'Weapon', 9, 11, 'Shield', 8, 7, 'Armor', 22, 5, 'Spam', 254, 6, 'Beef-a-Roni',
  5, 236, 4, 'Berries', 11, 12, 14, 'Small Tech Device', 21, 157, 11, 'Large Shiny Device',
  43, 9, 'Locked Door', 10, 8, 'Pit', 19, 4, 'Trap', 240, 13, 'Stairs Up', 240, 5, 'Stairs Down',
];

// Page 3: the legend of map symbols.
function MakeSymbolScreen() {
  let ptr = 0, sym = 0, sym2 = 0, clrr = 0;
  const read = () => SYMBOL_DATA[ptr++];
  screenPages(3, vpage);
  ccls(3);
  box(1, 40, 1, 24, 2, 3, 3);
  box(41, 80, 1, 24, 2, 3, 3);
  ptr = 0;   // RESTORE symbol
  color(9, 0); locate(2, 16); Printjnk(37, 1, 8); color(1);
  for (let i = 1; i <= 7; i++) {
    sym = read(); clrr = read(); st1 = read(); PutSym(sym, 9, i + 3, clrr, 0, 3);
    locate(i + 3, 16); print(st1);
  }
  PutSym(32, 9, 11, 0, 4, 3); locate(11, 16); Printjnk(37, 9, 14);
  for (let i = 1; i <= 2; i++) { sym = read(); PutSym(sym, 7 + i * 2, 13, 13, 0, 3); }
  sym = read(); PutSym(sym, 10, 14, 13, 0, 3);
  for (let i = 1; i <= 2; i++) { sym = read(); PutSym(sym, 7 + i * 2, 15, 13, 0, 3); }
  locate(14, 16); Printjnk(37, 23, 7);

  color(9);
  switch (incastle) {
    case 0:
      locate(2, 55); Printjnk(37, 30, 9); color(1);
      for (let i = 1; i <= 2; i++) {
        sym = read(); clrr = read(); st1 = read(); PutSym(sym, 48, i + 3, clrr, 0, 3);
        locate(i + 3, 55); print(st1);
      }
      PutSym(15, 48, 6, 2, 4, 3);
      locate(6, 55); Printjnk(239, 5, 9);
      for (let i = 3; i <= 12; i++) {
        sym = read(); clrr = read(); st1 = read(); PutSym(sym, 48, i + 4, clrr, 0, 3);
        locate(i + 4, 55); print(st1);
      }
      for (let i = 1; i <= 3; i++) {
        sym = read(); sym2 = read(); clrr = read(); st1 = read();
        PutSym(sym, 48, i + 16, clrr, 0, 3);
        PutSym(sym2, 50, i + 16, clrr, 0, 3);
        locate(i + 16, 55); print(st1);
      }
      break;
    case -1:
      locate(2, 55); Printjnk(37, 39, 13); color(1);
      for (let i = 1; i <= 7; i++) { sym = read(); clrr = read(); st1 = read(); }
      for (let i = 1; i <= 5; i++) {
        sym = read(); clrr = read(); st1 = read();
        PutSym(sym, 48, i + 3, clrr, 0, 3);
        locate(i + 3, 55); print(st1);
      }
      for (let i = 1; i <= 3; i++) {
        sym = read(); sym2 = read(); clrr = read(); st1 = read();
        PutSym(sym, 48, 8 + i, clrr, 0, 3);
        PutSym(sym2, 50, 8 + i, clrr, 0, 3);
        locate(i + 8, 55); print(st1);
      }
      color(wallcolr);
      locate(12, 48); Printjnk(216, 31, 12);
      for (let i = 1; i <= 5; i++) {
        sym = read(); clrr = read(); st1 = read();
        PutSym(sym, 48, i + 12, clrr, 0, 3);
        locate(i + 12, 55); print(st1);
      }
      break;
    default:
      locate(2, 55); Printjnk(182, 26, 11); color(1);
      for (let i = 1; i <= 7; i++) { sym = read(); clrr = read(); st1 = read(); }
      for (let i = 1; i <= 5; i++) {
        sym = read(); clrr = read(); st1 = read();
        PutSym(sym, 48, i + 3, clrr, 0, 3);
        locate(i + 3, 55); print(st1);
      }
      for (let i = 1; i <= 3; i++) {
        sym = read(); sym2 = read(); clrr = read(); st1 = read();
        PutSym(sym, 48, 8 + i, clrr, 0, 3);
        PutSym(sym2, 50, 8 + i, clrr, 0, 3);
        locate(i + 8, 55); print(st1);
      }
      color(wallcolr);
      locate(12, 48); Printjnk(314, 41, 12);
  }
  color(11); locate(25, 10); Printjnk(35, 1, 32);
  screenPages(vpage);
}

// Message for a mutant-plant hit (the body part is in l2).
function mphk(ch, atktyp) {
  let a = 38, b = 0, c = 0;
  switch (atktyp) {
    case 2: b = 1; c = 6; break;
    case 3: case 4: case 5: b = 7; c = 10; break;
    case 6: b = 17; c = 9; break;
    case 7: b = 26; c = 6; break;
    case 8: b = 32; c = 10; break;
    case 9: b = 42; c = 7; break;
    case 10: b = 26; c = 6; break;
    case 11: b = 49; c = 9; break;
    case 13: a = 39; b = 1; c = 12; break;
    default: a = 39; b = 25; c = 10;
  }
  Ljnkbig(a, b, c, 0, 0, 0, 'You ', 0, 2);
  a = 39;
  switch (ncre[ch][2]) {
    case 8: a = 110; b = 60; c = 8; break;   // hat
    case 7: b = 36; c = 9; break;            // nose
    case 5: case 6: b = 45; c = 7; break;    // ear
    case 4: case 3: b = 59; c = 7; break;    // arm
    case 2: case 1: b = 52; c = 7; break;    // eye
    default: ljnk(40, 1, 31, 2); b = 0;
  }
  if (b > 0) Ljnkbig(a, b, c, 0, 0, 0, rtrim$(l2) + bl, 0, 2);
}

// Fell into a pit.  Returns fc2 (a by-reference parameter, unchanged).
async function Pitt(fc2) {
  let siz = 0, dam = 0, ffkill = FALSE;
  inpit = TRUE; ClearMess();
  if (fc2 === 12) {
    siz = 8; ljnk(379, 32, 29, 2);
  } else if (fc2 === 4) {
    siz = 6; ljnk(243, 17, 18, 2);
  } else {
    siz = 4;
  }
  dam = rolldice(siz, lvl, lvl); [dam, ffkill] = ffEffect(dam, ffkill);
  ljnk(90, 1, 18, 1);
  if (ffkill) Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
  await MessPause(7, 0);
  if (dam > 0) dam = await DamSuit(0, dam);
  hits = hits - dam; ShowHits();
  if (hits < 0) { st1 = jnk$(90, 19, 16); await Dead(0); }
  return fc2;
}

function PutCreat(i) {
  let mmainx = 0, mmainy = 0, mlocx = 0, mlocy = 0, sy = 0, co = 0, bc = 0, yup = FALSE;
  [mmainx, mmainy, mlocx, mlocy] = FindMPos(i, mmainx, mmainy, mlocx, mlocy);
  if ((mmainx === mainx) && (mmainy === mainy)) {
    [sy, co, bc] = GetSym(mlocx, mlocy, 2);
    ncre[i][8] = cint(sy + 1000 * co);
    sy = imod(ncre[i][7], 1000); co = idiv(ncre[i][7], 1000);
    if (((pmut === 4 && berpmut === 0) || berdet > 0) && co === 0) co = 8;
    PutSym(sy, mlocx, mlocy, co, 0, 2);
    if (co === 0) { co = idiv(ncre[i][8], 1000); sy = imod(ncre[i][8], 1000); }
    yup = TRUE;
    if ((dark & qb((Math.abs(ncre[i][4]) > dark) || (Math.abs(ncre[i][5]) > dark))) !== 0) {
      yup = FALSE;
    } else if (incastle) {
      yup = SameRoom(ncre[i][4], ncre[i][5]);
    }
    if (yup) PutSym(sy, mlocx, mlocy, co, 0, 1);
  }
}

// Armor class and to-hit / damage modifiers.
function SetCombatStats() {
  let d = 0, delt = 0, s = 0;
  armor = 12; shield = 10;
  for (let i = 1; i <= ngoody; i++) {
    if (goody[i][1] === -4) armor = goody[i][3] - goody[i][5];
    if (goody[i][1] === -5) shield = goody[i][3] - goody[i][5];
  }
  ac = armor - 2;
  d = cint(dex + dexadd);
  if (d > 13) {
    delt = 13 - d;
  } else if (d < 10) {
    delt = 10 - d;
  } else {
    delt = 0;
  }
  if ((pmut === 5 && berpmut === 0) && (ac + ac + delt) > 6) { ac = 3; delt = 0; }
  delt = delt - 10 + shield;
  ac = ac + idiv(delt, 2);
  ac = ac - skinac - berac + 2 * qb(bulletsuit !== 0);
  if (pmut === 5 && berhpmut > 0) ac = ac - 3;

  dex2hit = 0; str2hit = 0; strdam = 0;

  if (d > 12) {
    dex2hit = fix((d - 11) / 2.5);
  } else if (d < 9) {
    dex2hit = d - 9;
  }

  s = cint(str + stradd);
  if (s > 12) {
    str2hit = fix((s - 12) / 2.5); strdam = fix((s - 10) / 2.5);
  } else if (s < 9) {
    str2hit = s - 9; strdam = (s - 9) / 2;
  }

  tohitbase = 18 - lvl / 1.2 - 4 * (qb(berblind > 0) | mask) + 2 * qb(invisible !== 0);
}

// How far the character can see (0 = everything).  Returns
// [dark, olddark, changed].
function SetDark(dark, olddark, changed) {
  let keen = 0, tt = 0;
  olddark = dark;
  keen = 0;
  if (pmut === 4 && berpmut === 0) keen = keen + (1 - qb(berhpmut > 0));
  if (berdet) keen = keen + 1;
  if (flashlight) keen = keen + 1;
  if (incastle === 0) {
    tt = imod(gt, 1440);
    if (tt >= 440 && tt <= 1220) {
      dark = 0;
    } else if ((tt >= 400 && tt <= 440) || (tt >= 1220 && tt <= 1260)) {
      dark = 4; if (keen) dark = 5;
    } else if ((tt >= 360 && tt <= 400) || (tt >= 1260 && tt <= 1300)) {
      if (moon > 1 && moon < 5) dark = 4; else dark = 3;
      if (keen) dark = dark + 1;
    } else {
      switch (moon) {
        case 1: case 2: case 4: case 5: dark = 2; break;
        case 3: dark = 3; break;
        case 7: dark = -1; break;
        default: dark = 1;
      }
      if (keen) { dark = dark + 1; if (dark === 0) dark = 1; }
    }
    if (flare) dark = 0;
    if (dark !== 0) { dark = dark + keen; if (dark === 0) dark = 1; }
    if (dark > 4) dark = 0;
  } else if (incastle === 1) {
    dark = 1 + keen;
    if (flare) dark = dark + 1;
    if (sunglasses) { dark = dark - 1; if (dark === 0) dark = -1; }
  } else if (incastle === -1) {
    dark = 0;
    if ((sunglasses & qb(keen === 0)) !== 0) dark = -1;
  }

  if ((mask | berblind) !== 0) dark = -1;

  if (olddark !== dark) changed = TRUE; else changed = FALSE;
  return [dark, olddark, changed];
}

function ShiftDropped(rm) {
  for (let j = rm, jEnd = ndropped - 1; j <= jEnd; j++) {
    drgdy[j] = drgdy[j + 1];
    for (let k = 1; k <= 16; k++) drgoody[j][k] = drgoody[j + 1][k];
  }
  for (let k = 1; k <= 16; k++) drgoody[ndropped][k] = 0;
  ndropped = ndropped - 1;
}

function ShowHits() {
  if (rside) {
    locate(10, 54); color(9, 0); print(hits, bl);
    color(1); Printjnk(5, 34, 11); color(9); println(hitmax, space$(4));
  }
}

// Merges stacks and sorts the carried items, then the backpack and safe.
function SortGoody() {
  let offset = 0, limit = 0, swtch = FALSE, bi = 0, bj = 0;
  const swapGoody = (i, j) => {
    const t = gdy[i]; gdy[i] = gdy[j]; gdy[j] = t;
    for (let k = 1; k <= 12; k++) { const u = goody[i][k]; goody[i][k] = goody[j][k]; goody[j][k] = u; }
  };
  const swapPack = (i, j) => {
    const t = bakpak[i]; bakpak[i] = bakpak[j]; bakpak[j] = t;
    for (let k = 1; k <= 12; k++) { const u = backpack[i][k]; backpack[i][k] = backpack[j][k]; backpack[j][k] = u; }
  };
  const swapSafe = (i, j) => {
    const t = saf[i]; saf[i] = saf[j]; saf[j] = t;
    for (let k = 1; k <= 12; k++) { const u = safe[i][k]; safe[i][k] = safe[j][k]; safe[j][k] = u; }
  };

  for (let i = ngoody; i >= 1; i--) {
    for (let j = ngoody, jEnd = i + 1; j >= jEnd; j--) {
      if (Math.abs(goody[i][1]) === 3 && Math.abs(goody[j][1]) === 3) {
        if ((gdy[i] === gdy[j]) && (goody[i][3] > 0)) {
          if (goody[i][9] === goody[j][9] && goody[i][10] === goody[j][10]) {
            goody[i][3] = goody[i][3] + goody[j][3];
            RemoveGoody(j, 0); break;
          }
        }
      } else if (Math.abs(goody[i][1]) < 3 && Math.abs(goody[j][1]) === Math.abs(goody[i][1])) {
        goody[i][3] = goody[i][3] + goody[j][3];
        RemoveGoody(j, 0); break;
      } else if (Math.abs(goody[i][1]) === 10 && Math.abs(goody[j][1]) === 10) {
        goody[i][2] = goody[i][2] + goody[j][2];
        goody[i][3] = goody[i][3] + goody[j][3];
        RemoveGoody(j, 0); break;
      }
    }
    if (goody[i][1] === 10 && goody[i][2] === 0 && goody[i][3] === 0) RemoveGoody(i, 0);
  }

  offset = idiv(ngoody, 2);
  while (offset > 0) {
    limit = ngoody - offset;
    do {
      swtch = FALSE;
      for (let i = 1, iEnd = limit; i <= iEnd; i++) {
        const j = i + offset;
        if (Math.abs(goody[i][1]) > Math.abs(goody[j][1])) {
          swapGoody(i, j);
          swtch = i;
        } else if (Math.abs(goody[i][1]) === Math.abs(goody[j][1]) && Math.abs(goody[i][1]) === 6) {
          for (let b1 = 0; b1 <= nberry; b1++) {
            if (berord[b1] === goody[i][3]) bi = b1;
            if (berord[b1] === goody[j][3]) bj = b1;
          }
          if (bi > bj) {
            swapGoody(i, j);
            swtch = i;
          }
        } else if (Math.abs(goody[i][1]) === Math.abs(goody[j][1])) {
          if (gdy[i] > gdy[j]) {
            swapGoody(i, j);
            swtch = i;
          }
        }
      }
      limit = swtch - offset;
    } while (swtch);
    offset = idiv(offset, 2);
  }

  for (let i = 1, iEnd = npack - 1; i <= iEnd; i++) {
    for (let j = i + 1, jEnd = npack; j <= jEnd; j++) {
      if (backpack[i][1] === 3 && backpack[j][1] === 3) {
        if ((bakpak[i] === bakpak[j]) && (backpack[i][3] > 0)) {
          backpack[i][3] = backpack[i][3] + backpack[j][3];
          RemoveGoody(j, 1); break;
        }
      } else if (backpack[i][1] < 3 && backpack[j][1] === backpack[i][1]) {
        backpack[i][3] = backpack[i][3] + backpack[j][3];
        RemoveGoody(j, 1); break;
      }
    }
  }
  for (let i = 1, iEnd = npack - 1; i <= iEnd; i++) {
    for (let j = i + 1, jEnd = npack; j <= jEnd; j++) {
      if (backpack[i][1] > backpack[j][1]) {
        swapPack(i, j);
      } else if (backpack[i][1] === backpack[j][1] && backpack[i][1] === 6) {
        for (let b1 = 1; b1 <= nberry; b1++) {
          if (berord[b1] === backpack[i][3]) bi = b1;
          if (berord[b1] === backpack[j][3]) bj = b1;
        }
        if (bi > bj) {
          swapPack(i, j);
          swtch = i;
        }
      } else if (backpack[i][1] === backpack[j][1]) {
        if (bakpak[i] > bakpak[j]) {
          swapPack(i, j);
          swtch = i;
        }
      }
    }
  }

  for (let i = 1, iEnd = nsafe - 1; i <= iEnd; i++) {
    for (let j = i + 1, jEnd = nsafe; j <= jEnd; j++) {
      if (safe[i][1] === 3 && safe[j][1] === 3) {
        if ((saf[i] === saf[j]) && (safe[i][3] > 0)) {
          safe[i][3] = safe[i][3] + safe[j][3];
          RemoveGoody(j, 2); break;
        }
      } else if (safe[i][1] < 3 && safe[j][1] === safe[i][1]) {
        safe[i][3] = safe[i][3] + safe[j][3];
        RemoveGoody(j, 2); break;
      }
    }
  }
  for (let i = 1, iEnd = nsafe - 1; i <= iEnd; i++) {
    for (let j = i + 1, jEnd = nsafe; j <= jEnd; j++) {
      if (safe[i][1] > safe[j][1]) {
        swapSafe(i, j);
      } else if (safe[i][1] === safe[j][1] && safe[i][1] === 6) {
        for (let b1 = 1; b1 <= nberry; b1++) {
          if (berord[b1] === safe[i][3]) bi = b1;
          if (berord[b1] === safe[j][3]) bj = b1;
        }
        if (bi > bj) {
          swapSafe(i, j);
          swtch = i;
        }
      } else if (safe[i][1] === safe[j][1]) {
        if (saf[i] > saf[j]) {
          swapSafe(i, j);
          swtch = i;
        }
      }
    }
  }
}

// Plays the next of the seven tape recorder messages (text in alphaman.6).
async function TapeRecorder(i) {
  let colr = 13, bakcolr = 0, offset = 0, numln = 0, sym = 0, num = 0, z = 0, HitSpace = 0;
  tapenum = imod(tapenum + 1, 7);
  screenPages(3, vpage); ccls(3);
  switch (tapenum) {
    case 1: offset = 164; numln = 6; sym = 71; colr = 12; break;
    case 2: offset = 170; numln = 4; sym = 127; break;
    case 3: offset = 174; numln = 4; sym = 30; break;
    case 4: offset = 178; numln = 5; sym = 239; break;
    case 5: offset = 183; numln = 4; sym = 234; break;
    case 6: offset = 187; numln = 4; sym = 94; break;
    case 0: offset = 191; numln = 4; sym = 71; bakcolr = 4; break;
  }
  PutSym(sym, 40, 3, colr, bakcolr, 3); color(3, 0);
  for (let j = 0; j <= numln - 1; j++) {
    num = j + offset; st1 = AM6[num];   // (alphaman.6, already decoded)
    locate(2 * j + 6, 6); print(st1);
  }
  switch (tapenum) {
    case 2: case 3: locate(12, 34 + 8 * tapenum); print(name$); break;
    case 0: locate(12, 45); println(name$); break;
  }
  if (i > 0 && i <= ngoody) RemoveGoody(i, FALSE);
  for (let j = 6; j <= 74; j++) PutSym(196, j, 20, 8, 0, 3);
  scratch[1] = 15; scratch[2] = 42; scratch[3] = 35; scratch[4] = 206; scratch[5] = 175; scratch[6] = 174;
  screenPages(3); HitSpace = 1;
  for (let j = 6; j <= 74; j++) {
    PutSym(scratch[z], j, 20, 4 + 8 * int(rnd() * 2), 0, 3);
    z = cRoll(6);
    // WHILE ABS(TIMER - t1) < .023 * HitSpace: waits for the next clock tick
    if (HitSpace) await sleepSeconds(0.023);
    if (HitSpace) HitSpace = 1 + qb(inkey$() !== '');  // 0 if hit space, else 1
    PutSym(32, j, 20, 7, 0, 3);
  }
  PutSym(32, 70, 20, 7, 0, 3); color(2); locate(25, 24); Printjnk(35, 1, 32);
  await PauseForKey();
  ccls(3); screenPages(vpage); ClearMess(); PrintMessage(7, 0);
}

// Hourly events (ripening berries, monoliths), falling asleep and waking
// up, warnings, clumsiness and dispersing gas.
async function Timely() {
  let hrs = 0, showright = FALSE, oldlen = 0, chan = 0, a = 0, b = 0, c = 0, ate = FALSE, num = 0;
  let yup = 0, dropp = FALSE, ix = 0, iy = 0, sym = 0, fc = 0, bc = 0, sc = 0;
  const ripeLen = (row) => {
    switch (row[4]) {
      case 1: return 6;
      case 2: return 3;
      case 3: return 6;
      case 4: return 6;
      case 5: return 5;
      default: row[4] = 6; return 4;
    }
  };
  hrs = cint(idiv(gt, 60));
  if (hrs >= ripehrs) {
    ripehrs = ripehrs + 2 + cRoll(2); showright = FALSE;
    for (let i = 1; i <= ngoody; i++) {
      if (goody[i][1] === 6 && goody[i][5] === 0 && cRoll(2) === 1) {
        if ((goody[i][6] < 2) || (goody[i][4] < 6)) {
          goody[i][6] = goody[i][6] + 1;
          if (goody[i][6] >= 3) {
            goody[i][6] = 0; goody[i][4] = imod(goody[i][4], 6) + 1;
            showright = TRUE;
            oldlen = ripeLen(goody[i]);
            gdy[i] = Kolr$(goody[i][4]) + right$(gdy[i], len(gdy[i]) - oldlen - 1);
          }
        }
      }
    }
    if (showright && (rdisp !== 1)) DisplayGoodies(FALSE);
    for (let i = 1; i <= npack; i++) {
      if (backpack[i][1] === 6 && backpack[i][5] === 0 && cRoll(2) === 1) {
        backpack[i][6] = backpack[i][6] + 1;
        if (backpack[i][6] >= 3) {
          backpack[i][6] = 0; backpack[i][4] = imod(backpack[i][4], 6) + 1;
          oldlen = ripeLen(backpack[i]);
          bakpak[i] = Kolr$(backpack[i][4]) + right$(bakpak[i], len(bakpak[i]) - oldlen - 1);
        }
      }
    }
    for (let i = 1; i <= nsafe; i++) {
      if (safe[i][1] === 6 && backpack[i][5] === 0 && cRoll(2) === 1) {   // (sic) backpack
        safe[i][6] = safe[i][6] + 1;
        if (safe[i][6] >= 3) {
          safe[i][6] = 0; safe[i][4] = imod(safe[i][4], 6) + 1;
          oldlen = ripeLen(safe[i]);
          saf[i] = Kolr$(safe[i][4]) + right$(saf[i], len(saf[i]) - oldlen - 1);
        }
      }
    }
    for (let i = 1; i <= nmonolith; i++) {
      if (cRoll(2) === 1) {
        if (monozone[i][3] > 0) monozone[i][3] = monozone[i][3] - 1;
      }
    }
    answer = TRUE;
  }
  hrs = imod(hrs, 24);

  l3 = '';
  if (asleep) {
    if (hrs >= 8 && hrs <= 11) { chan = 100 - 100 * tent; a = 252; b = 50; c = 17; }
    else if (hrs >= 12 && hrs <= 20) { chan = 100 - 100 * tent; a = 277; b = 49; c = 15; }
    else if (hrs === 6 || hrs === 7 || hrs === 21 || hrs === 22) { chan = 24 & not(tent); a = 253; b = 1; c = 15; }
    else { chan = 3 & not(tent); a = 253; b = 16; c = 19; }
    if (incastle === 0 || nnear > 0) chan = cint(chan / 3);
    if (cRoll(1000) < chan) {
      asleep = FALSE; zippy = -10;
      ljnk(253, 35, 11, 1); ljnk(a, b, c, 2); await MessPause(7, 0);
      ate = FALSE;
      if (tent) {   // scavengers
        switch (cRoll(5)) {
          case 1: case 2: case 3:
            num = cRoll(2);
            if (goody[num][1] === 1 || goody[num][1] === 2) {
              goody[num][3] = goody[num][3] - 1; ate = TRUE;
              if (goody[num][3] < 1) RemoveGoody(num, FALSE);
            }
            break;
          case 4:   // (num is still 0 here (sic))
            if (goody[1][1] === 1 || goody[1][1] === 2) {
              goody[1][3] = goody[1][3] - 1; ate = TRUE;
              if (goody[1][3] < 1) RemoveGoody(num, FALSE);
            }
            if (goody[2][1] === 1 || goody[2][1] === 2) {
              goody[2][3] = goody[2][3] - 1; ate = TRUE;
              if (goody[2][3] < 1) RemoveGoody(num, FALSE);
            }
            break;
          case 5:
            num = cRoll(2);
            if (goody[num][1] === 1 || goody[num][1] === 2) {
              goody[num][3] = 0; RemoveGoody(num, FALSE); ate = TRUE;
            }
            break;
        }
        if (ate) { ClearMess(); ljnk(392, 1, 28, 1); await MessPause(14, 0); }
      }
    }
  } else {
    tent = FALSE; l2 = '';
    if (hrs >= 7 && hrs <= 20) chan = 0;
    else if (hrs === 21) chan = 20;
    else if (hrs === 6 || hrs === 22) chan = 100;
    else if (hrs === 5 || hrs === 23) chan = 300;
    else chan = 1000;
    if (brandy > 0) chan = cint(chan * 4);
    if (coffee > 0) chan = cint(chan / 10);
    if (nnear > 0) chan = cint(chan / 2);
    if (berfresh) chan = cint(chan / 5);
    if (notoxin === 1 || terrain === 71) chan = cint(chan / 10);
    if (pmut === 10 && berpmut === 0) chan = cint(chan / 20);
    if (mmut === 3 && bermmut === 0) chan = cint(chan / 20);
    if (cRoll(10000) < chan) {
      asleep = TRUE; berhic = 0; sick = 0;
      ljnk(253, 46, 15, 1); await MessPause(1, 0);
    } else if ((chan > 0) && (cRoll(500) < chan)) {
      a = 254; c = 21; if (coffee > 0) { a = 289; c = 31; }
      ljnk(a, 1, c, 1); PrintMessage(9, 0);
    }
  }

  if ((not(asleep) & qb(cRoll(10) === 1)) !== 0) {
    yup = 0; ClearMess();
    if ((incastle === 0) && (hrs === 19 || hrs === 20)) { yup = 1; ljnk(254, 22, 26, yup); }
    if (hits < hitmax / 8 + 2) { yup = yup + 1; ljnk(384, 48, 19, yup); }
    if (fatigue > 90) { yup = yup + 1; Ljnkbig(254, 48, 12, 0, 0, 0, 'rest', 1, yup); }
    if (yup < 3 && hunger > 3000) { yup = yup + 1; ljnk(254, 48, 15, yup); }
    if (yup) PrintMessage(2, 0);
  }

  if ((berklutz & not(asleep) & qb(cRoll(5) === 1)) !== 0) {
    switch (currsym) {
      case 250: case 249: case 32: dropp = TRUE; break;
      default: dropp = FALSE;
    }
    if (dropp) {
      dropp = 0;
      for (;;) {   // retim
        const i = cRoll(ngoody);
        if (ngoody === 0) {
          dropp = 0;
        } else if (goody[i][1] <= 2) {
          if (cRoll(ngoody) !== ngoody) continue;
        } else {
          dropp = i;
        }
        break;
      }
      if (dropp) {
        dropp = AddToDrop(dropp); RemoveGoody(dropp, FALSE);
        if (rdisp !== 1) DisplayGoodies(FALSE);
      }
    }
  }

  ix = cRoll(50) + 1; iy = cRoll(20) + 1;
  [sym, fc, bc] = GetSym(ix, iy, 2);
  if (sym === gas) {
    [sym, fc, bc] = GetSym(ix, iy, 1);
    if (sym === gas) sc = -1; else sc = 2;
    PutSym(250, ix, iy, 8, 0, sc);
  }
}

// Stepped on a trap of colour colr.  Returns colr (negated after a
// teleport trap, for Move).
async function Trapp(colr) {
  let a = 0, b = 0, c = 0, d = 0, e = 0, F = 0, dam = 0, ffkill = FALSE, dic = 0, siz = 0;
  let xdot = 0, ydot = 0, xdel = 0, ydel = 0;
  ClearMess();
  if (cRoll(4) === 1) {
    a = 350;
    switch (colr) {
      case 1: a = 353; b = 1; c = 17; break;          // sleep
      case 2: b = 24; c = 6; break;                   // dart
      case 3: a = 351; b = 50; c = 19; break;         // shock
      case 5: a = 369; b = 30; c = 14; break;         // glue
      case 6:                                          // acid, QUICKSAND
        if (incastle) { b = 30; c = 13; } else { d = 384; e = 19; F = 9; }
        break;
      case 7:                                          // arrow, GOPHER HOLE
        if (incastle) { b = 16; c = 8; } else { d = 386; e = 55; F = 13; }
        break;
      case 8:                                          // teleport, TARPIT
        if (incastle) { a = 353; b = 18; c = 13; } else { d = 378; e = 59; F = 8; }
        break;
      case 10: a = 390; b = 46; c = 20; break;        // poison gas, POISON GAS
      case 12:                                         // fire, EXPLOSIVE GAS
        if (incastle) { b = 43; c = 16; } else { a = 340; b = 40; c = 24; }
        break;
      case 14: b = 59; c = 7; break;                  // laser
      default: a = 353; b = 31; c = 16;               // rad
    }
    if (d > 0) {
      Ljnkbig(392, 29, 21, d, e, F, bl, 1, 2);
    } else {
      Ljnkbig(a, b, c, 353, 47, 20, bl, 2, 2);
    }
  } else {
    switch (colr) {
      case 1:   // sleep
        asleep = TRUE; berhic = 0; sick = 0; a = 253; b = 46; c = 15;
        break;
      case 2:   // dart
        dam = cRoll(8);
        switch (cRoll(10)) {
          case 5: case 6: case 7: case 8: dex = dex - 1; dextox = dextox + 1; break;
          case 9: str = str - 1; strtox = strtox + 1; break;
          case 10:
            con = con - 1; contox = contox + 1; dam = cint(dam + lvl / 2);
            hittox = hittox + lvl / 2; hitmax = hitmax - lvl / 2;
            break;
        }
        a = 91; b = 1; c = 15; d = 90; e = 60; F = 6; SetCombatStats();
        break;
      case 3:   // shock
        dam = rolldice(4, 5 + lvl, lvl); dam = await DamSuit(4, dam);
        if (cRoll(12) === 1) await KillItem(cRoll(3));
        a = 92; b = 22; c = 19; d = 92; e = 41; F = 11;
        break;
      case 5:   // glue
        a = 163; b = 38; c = 25; inglue = TRUE;
        break;
      case 6:   // acid, QUICKSAND
        if (incastle) {
          dam = rolldice(4 + 3 * lvl, 2, 1); dam = await DamSuit(5, dam);
          if (cRoll(12) === 1) {
            c = cRoll(4) + 4;
            switch (c) {
              case 5: await KillItem(0); break;
              case 6: case 7: case 8: c = await KillItem(c); break;
            }
          }
          a = 91; b = 16; c = 17; d = 91; e = 33; F = 4;
        } else {
          a = 384; b = 1; c = 28; insand = TRUE;
        }
        break;
      case 7:   // arrow, GOPHER HOLE
        if (incastle) {
          dam = cRoll(3 + lvl * 2) + cRoll(3 + lvl * 2); dam = await DamSuit(0, dam);
          if (cRoll(12) === 1) await KillItem(3 + cRoll(2));
          a = 90; b = 35; c = 17; d = 90; e = 52; F = 8;
        } else {
          dam = cRoll(4 + lvl); zippy = zippy - cRoll(5) - cRoll(5);
          a = 390; b = 1; c = 29; d = 326; e = 41; F = 25;
        }
        break;
      case 8:   // teleport, TARPIT
        if (incastle) {
          for (;;) {   // trapptel
            [xdot, ydot] = finddot(incastle);
            if (castle === 2 && castlelevel === -7) {
              if (localx < 10 || localx > 17 || localy < 14 || localy > 17) {
                if (xdot < 10 || xdot > 17 || ydot < 14 || ydot > 17) continue;
              }
            }
            break;
          }
          xdel = xdot - localx; ydel = ydot - localy;
          for (let i = 1; i <= nnear; i++) {
            ncre[i][4] = ncre[i][4] - xdel;
            ncre[i][5] = ncre[i][5] - ydel;
            if (SameRoom(ncre[i][4], ncre[i][5])) await Awaken(i);
          }
          PutSym(currsym, localx, localy, currf, currb, -1);
          localx = xdot; localy = ydot;
          [currsym, currf, currb] = GetSym(localx, localy, 2);
          PutSym(1, localx, localy, 15, 0, -1);
          savecorn = 0;
          for (let i = localx - 1, iEnd = localx + 1; i <= iEnd; i++) {
            for (let j = localy - 1; j <= localy + 1; j++) DotIt(i, j);
          }
          DotCorn();
          berconfuse = berconfuse + rolldice(3, 3, 3);
          a = 241; b = 16; c = 15; colr = -colr;  // for move
        } else {
          inbog = TRUE; a = 378; b = 43; c = 25;
        }
        break;
      case 10:   // poison gas, POISON GAS
        a = 157; b = 34; c = 19; d = 157; e = 53; F = 10;
        dic = idiv(21 - con, 3) + idiv(lvl, 2); if (dic < 1) dic = 1;
        dam = rolldice(5, dic, dic);
        if (pmut === 7 && berpmut === 0) dam = cint((dam + 1) / (2 - 2 * qb(berhpmut > 0)));
        if ((gasmask | spacesuit) !== 0) dam = 0;
        break;
      case 12:   // fire, EXPLOSIVE GAS
        dam = rolldice(12 + lvl * 2, 2, 1); dam = await DamSuit(2, dam);
        if (cRoll(18) === 1) await KillItem(0);
        if (incastle) {
          a = 91; b = 37; c = 18; d = 91; e = 55; F = 4;
        } else {
          a = 342; b = 1; c = 28; d = 342; e = 15; F = 13;
        }
        break;
      case 14:   // laser
        dam = cRoll(15 + lvl) + 4; dam = await DamSuit(3, dam);
        if (cRoll(12) === 1) await KillItem(0);
        a = 92; b = 1; c = 21; d = 91; e = 59; F = 7;
        break;
      default:   // radiat
        siz = idiv(26 - rr, 2) + lvl; if (siz < 2) siz = 2;
        if (cRoll(12) === 1) await KillItem(9);
        dam = rolldice(siz, 5, 2); dam = await DamSuit(1, dam);
        a = 92; b = 52; c = 17; d = 0; e = 30; F = 9;
    }
    if (dam > 0) { [dam, ffkill] = ffEffect(dam, ffkill); hits = hits - dam; }
    ljnk(a, b, c, 1);
    if (hits < 0) {
      st1 = jnk$(d, e, F); ShowHits(); await Dead(0);
    } else if (ffkill) {
      await MessPause(Math.abs(colr), 0); ClearMess();
      Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
    }
  }
  await MessPause(Math.abs(colr), 0); ShowHits();
  return colr;
}

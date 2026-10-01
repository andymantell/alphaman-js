// Port of A8.BAS: status screens, building/dismantling devices, computers,
// damage modifiers, targeting, searching, strings (jnk$) and mutations.
//
// Copyright (c) 1995 Jeffrey R. Olson (MIT license, see LICENSE)
'use strict';

// a8comd: DATA for MakeCommandScreen (string number, start, length)
const A8COMD = [
  211, 1, 17, 211, 18, 17, 211, 35, 23,
  243, 35, 25, 212, 1, 20, 212, 21, 24,
  212, 45, 16, 213, 1, 10, 213, 11, 13,
  213, 24, 7, 213, 31, 15, 213, 46, 7,
  214, 1, 17, 214, 18, 15, 207, 1, 1,
  214, 33, 8, 214, 41, 7, 215, 1, 20,
  215, 21, 13, 96, 1, 13, 96, 14, 15,
  215, 34, 14, 211, 58, 9, 215, 48, 18,
  213, 53, 16, 279, 1, 20, 264, 43, 19,
  214, 53, 12, 216, 1, 12, 216, 13, 18,
  272, 20, 22, 262, 1, 19, 210, 59, 9,
];

// F4: active modifiers screen (page 3).
function ActiveMod() {
  let row = 0, col = 0, a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, lngth = 0;
  let needed = 0, aa$ = '';
  const incrow = () => {
    if (a > 0) Printjnk(a, b, c);
    if (d > 0) { print(printUsing$(jnk$(e, f, g), ltrim$(rtrim$(str$(d))))); d = 0; }
    row = row + 1; if (row > 18) { row = 4; col = col + 37; if (col > 60) col = 5; }
    locate(row, col);
  };
  const inc = (aa, bb, cc) => { a = aa; b = bb; c = cc; incrow(); };

  screenPages(3, vpage); ccls(3);
  if (notoxin) {
    color(12); locate(1, 5);
    Printjnk(140 + qb(notoxin > 0), 1, 42 + qb(notoxin > 0));
  }
  color(11, 0); locate(2 - qb(notoxin !== 0), 5); Printjnk(244, 47, 19);
  row = 3; col = 5; incrow();
  color(12);
  if (hits < 5) inc(246, 55, 8);
  color(4);
  if (hunger < -1500) inc(325, 44, 19);
  if (inwater) inc(59, 58, 8);
  if (inpit) inc(245, 1, 14);
  if (inweb) inc(160, 44, 14);
  if (inglue) inc(164, 41, 13);
  if (inbog) inc(383, 49, 17);
  if (insand) inc(384, 29, 18);
  if (grabbed > 0) inc(248, 42, 17);
  color(3);
  if (zippy > 0) inc(245, 15, 6);
  if (zippy < 0) inc(245, 21, 11);
  if (invisible) inc(248, 12, 9);
  if (berconfuse) inc(317, 36, 8);
  if (berblind) inc(247, 41, 5);
  if (berhic) {
    lngth = len(ber$); if (right$(ber$, 1) === 'e') lngth = lngth - 1;
    print(left$(ber$, lngth) + 'ing'); a = 0; incrow();
  }
  if (berhpmut) inc(418, 19, 23);
  if (berhmmut) inc(418, 42, 21);
  if (berdet) inc(247, 32, 9);
  color(9);
  if (berstr > 0) inc(245, 56, 6);
  if (berstr < 0) inc(245, 62, 4);
  if (berdex > 0) inc(246, 1, 5);
  if (berdex < 0) inc(246, 6, 6);
  if (bercon > 0) inc(246, 12, 6);
  if (bercon < 0) inc(246, 18, 6);
  if (berrr > 0) inc(246, 24, 27);
  if (berrr < 0) { Printjnk(246, 51, 4); Printjnk(246, 28, 23); a = 0; incrow(); }
  if (bermr > 0) inc(247, 1, 13);
  if (bermr < 0) { Printjnk(247, 14, 4); Printjnk(247, 7, 7); a = 0; incrow(); }
  if (berintl > 0) inc(247, 18, 5);
  if (berintl < 0) inc(247, 23, 4);
  color(5);
  if (berff | ffgen) inc(404, 12, 25);
  if (repulse) inc(122, 21, 31);
  if (bergreen) inc(205, 28, 5);
  if (berfresh) inc(288, 59, 9);
  if (berscience) inc(247, 46, 10);
  if (berscare) inc(247, 56, 11);
  if (berrambo) inc(248, 1, 11);
  if (berklutz) inc(304, 10, 6);
  if (berregen) inc(305, 49, 12);
  if (beryum) inc(306, 1, 5);
  color(2);
  if (sick) inc(248, 21, 14);
  if (strtox) {
    d = strtox; e = 307; f = 14; g = 12; inc(249, 1, 18);
  }
  if (dextox) {
    d = dextox; e = 369; f = 17; g = 13; inc(312, 19, 16);
  }
  if (contox) {
    d = contox; e = 369; f = 1; g = 16; inc(312, 35, 21);
  }
  if (hittox) {
    d = hittox; e = 307; f = 26; g = 10; inc(312, 35, 21);
  }
  color(6);
  if (serum > gt) inc(407, 1, 26);
  if (wpturns) inc(245, 32, 13);
  if (sunscreen) inc(245, 45, 11);
  if (mindweb) inc(110, 21, 22);
  if (udder) inc(248, 35, 7);
  if (tapeworm) inc(308, 56, 10);
  if (coffee) inc(291, 59, 10);
  if (brandy > 1500) {
    inc(247, 27, 5);
  } else if (brandy > 600) {
    inc(317, 44, 5);
  } else if (brandy > 0) {
    inc(317, 23, 13);
  }
  if (metshat) inc(94, 54, 13);
  color(8);
  if (spore === 0) {
    // nothing
  } else if (spore >= 1 && spore <= 3) inc(137, 1, 12);    // odd
  else if (spore >= 4 && spore <= 6) inc(137, 13, 15);     // sweat
  else if (spore >= 7 && spore <= 9) inc(137, 28, 20);     // lightheaded
  else inc(137, 48, 20);                                    // heart racing

  if (row === 4 && col === 5) { color(11); Printjnk(2, 15, 6); row = 5; }

  row = row + 2; if (col > 5) row = 20;
  color(9); locate(row, 4); SetCombatStats();
  print(printUsing$(jnk$(411, 1, 43), str2hit + other2hitc, strdam + otherdam));
  locate(row + 1, 4);
  print(printUsing$(jnk$(411, 1, 28), dex2hit + other2hitr, otherdam));
  Printjnk(411, 44, 13);
  if (lvl <= 12) needed = clng(5 * 2 ** lvl); else needed = clng((5 * 2 ** 12) * (lvl - 11));
  locate(row + 3, 5);
  print(printUsing$(jnk$(138, 17, 36), ltrim$(str$(needed)))); print(lvl + 1);
  color(3);
  locate(1, 50);
  if (fastfight) aa$ = 'on'; else aa$ = 'off';
  print(jnk$(279, 21, 19), aa$);
  locate(2, 50); b = 4; c = 22;
  switch (difficulty) {
    case moderateplay: b = 29; c = 18; break;
    case easyplay: b = 50; c = 9; break;
  }
  Printjnk(280, b, c);
  locate(25, 5); color(10, 0); Printjnk(3, 1, 18);
  screenPages(3);
}

// Scientific Genius: build a device from parts.  Returns iii (TRUE if a
// device was built; the caller uses it as "remoov").
async function BuildGoody(iii) {
  let brainymult = 0, partsweight = 0, partsenergy = 0, i = 0, max = 0, num = 0, typ = 0;
  let energy = 0, known = 0, weight = 0, maxenergy = 0, bad = FALSE, choice = 0;
  let energygiven = 0, minuse = 0;
  screenPages(3); ccls(3);
  exbg: {
    if (ngoody === 20) { ljnk(57, 25, 29, 1); await MessPause(5, 0); break exbg; }

    brainymult = Math.fround((1 - qb(berhmmut > 0)) * (1 - qb(berscience > 0)));
    brainymult = Math.fround(0.8 * brainymult / (1 - 2 * qb(berklutz > 0)) / (1 - 2 * qb(berrambo > 0)));
    if (brainymult > 1) brainymult = 1;
    if (goody[ngoody][1] === 10) {   // determine usable parts amounts----
      partsweight = cint(goody[ngoody][2] * brainymult);
      partsenergy = cint(goody[ngoody][3] * brainymult);
    } else {
      iii = FALSE; ClearMess(); ljnk(357, 1, 31, 1); await MessPause(5, 0); break exbg;
    }

    color(9, 0); locate(2, 5); Printjnk(356, 21, 48);
    i = 1; max = 0;
    do {
      for (;;) {   // renumbl:
        num = cRoll(nssd + ntechwep + nstrash + nlsd + nltrash);
        switch (num) {
          case 2: case 6: case 14: case 15: case 19: case nssd + ntechwep + 5: case nssd + ntechwep + 13:
          case nssd + ntechwep + nstrash + 8:
            continue;
        }
        break;
      }
      scratch[i] = num; typ = 1;
      if (num > nssd + ntechwep + nstrash) {
        num = num - nssd - ntechwep - nstrash; typ = 2;
      }
      energy = 0;
      if (typ === 1) {
        known = ssdknown[num]; st1 = ssdnm$(num);
        weight = ssd[num][1]; maxenergy = ssd[num][2];
      } else {
        known = lsdknown[num]; st1 = lsdnm$(num);
        weight = lsd[num][1]; maxenergy = lsd[num][2];
      }
      if (maxenergy > 0) {
        energy = cint(10 / maxenergy); if (energy < 1) energy = 1;
      }
      bad = FALSE;
      if (known & qb(weight <= partsweight) & qb(energy <= partsenergy)) {
        for (let j = 1; j <= i - 1; j++) {
          if (scratch[j] === scratch[i]) bad = TRUE;
        }
      } else {
        bad = TRUE;
      }
      if (!bad) {
        max = i; i = i + 1;
        color(17 - 3 * typ); locate(max + 3, 5); print(max, ': ', st1);
      } else if (cRoll(cint(20 * brainymult ** 2)) <= 1) {
        i = 11;
      }
    } while (i <= 8);

    color(9);
    if (max === 0) {
      locate(2, 5); Printjnk(359, 1, 41); println(space$(10));
      locate(3, 5); Printjnk(3, 1, 18); await PauseForKey(); screenPages(vpage); return iii;
    }

    for (;;) {   // rebg:
      locate(max + 5, 5); Printjnk(357, 32, 27);
      GameWait.number(); st1 = await inputString(''); choice = cint(val(st1));
      if (choice === 0) { fatadd = 1; iii = FALSE; screenPages(vpage); return iii; }
      if (choice >= 1 && choice <= max) {
        iii = TRUE;
        if (berconfuse) choice = cRoll(max);
        num = scratch[choice]; ngoody = ngoody + 1;
        for (let j = 1; j <= 12; j++) goody[ngoody][j] = 0;
        goody[ngoody][10] = TRUE;  // known
        if (num > nssd + ntechwep + nstrash) {
          // bldl:
          num = num - nssd - ntechwep - nstrash; goody[ngoody][1] = 8;
          for (let j = 1; j <= 3; j++) goody[ngoody][j + 1] = lsd[num][j];
          goody[ngoody][11] = num; maxenergy = lsd[num][2]; gdy[ngoody] = lsdnm$(num);
        } else {
          // blds:
          goody[ngoody][1] = 7;
          for (i = 1; i <= 8; i++) goody[ngoody][i + 1] = ssd[num][i];
          goody[ngoody][11] = num; maxenergy = ssd[num][2]; gdy[ngoody] = ssdnm$(num);
        }
        energygiven = 0;
        if ((maxenergy > 0) && (partsenergy > 0)) {
          color(13); locate(max + 7, 5); Printjnk(358, 1, 41);
          color(5); locate(max + 8, 5); Printjnk(416, 33, 33);
          locate(max + 9, 5); Printjnk(417, 1, 21);
          minuse = cint(10 / maxenergy); if (minuse < 1) minuse = 1;
          print(str$(minuse), jnk$(416, 35, 5)); if (minuse > 1) print('s');
          GameWait.number(); st1 = await inputString(' '); energygiven = cint(val(st1));
          if (energygiven > 10) energygiven = 10;
          if (energygiven > partsenergy) energygiven = partsenergy;
          if (energygiven < minuse) energygiven = 0;
          goody[ngoody][3] = cint(energygiven * maxenergy / 10);
        } else if (maxenergy > 0) {
          goody[ngoody][3] = 0;
        } else {
          goody[ngoody][3] = -1;
        }
        goody[ngoody - 1][2] = cint(goody[ngoody - 1][2] - goody[ngoody][2] / brainymult);
        goody[ngoody - 1][3] = cint(goody[ngoody - 1][3] - energygiven / brainymult);
        fatadd = 10;
        break;
      }
      locate(max + 6, 5); Printjnk(46, 1, 44);
    }
    if (rdisp === 2) DisplayGoodies(FALSE);
    screenPages(vpage);
    return iii;
  }
  // exbg:
  didstuff = FALSE; screenPages(vpage);
  return iii;
}

// Data computer (0), workstation (1) or monolith (2).
async function Compute(mainp) {
  let timesthrough = 0, nselect = 0, nselext = 0, maxcomp = 0, nope = FALSE, row = 0;
  let aa = 0, num = 0, typ = 0, numdice = 0, dicsiz = 0, lll = 0, mm = 0, k = 0, mx = 0;
  let numb = 0, zz = 0, a = 0, b = 0, c = 0, oldvpage = 0;
  let j = 0;
  const swapScratch = (x, y) => { const t = scratch[x]; scratch[x] = scratch[y]; scratch[y] = t; };
  const nmsel = () => {
    a = 177; st1 = '';
    switch (scratch[j]) {
      case 1: b = 15; c = 4; break;
      case 2: a = 207; b = 26; c = 7; break;
      case 3: b = 47; c = 5; break;
      case 4: a = 3; b = 56; c = 7; break;
      case 5: b = 58; c = 7; break;
      case 6: a = 178; b = 1; c = 18; break;
      case 7: a = 178; b = 19; c = 5; st1 = jnk$(178, 6, 13); break;
      case 8: a = 178; b = 24; c = 9; break;
      case 9: a = 178; b = 33; c = 4; break;
      case 10: a = 112; b = 13; c = 26; break;
      case 11: a = 276; b = 1; c = 28; break;
      case 12: a = 355; b = 1; c = 17; break;
      case 13: a = 355; b = 18; c = 27; break;
      case 14: a = 355; b = 45; c = 8; break;
    }
    st1 = jnk$(a, b, c) + st1;
  };
  // gettech: line num of ALPHAMAN.6
  const gettech = () => { st1 = rtrim$(AM6[num]); };
  // Picks n distinct values 1..max into scratch(21..20+n), sorted.
  const pickSorted = (n, maxv) => {
    for (let jj = 1; jj <= n; jj++) {
      for (;;) {
        scratch[jj + 20] = cRoll(maxv); nope = FALSE;
        for (let kk = 1; kk <= jj - 1; kk++) {
          if (scratch[jj + 20] === scratch[kk + 20]) { nope = TRUE; break; }
          if (scratch[jj + 20] < scratch[kk + 20]) swapScratch(jj + 20, kk + 20);
        }
        if (!nope) break;
      }
    }
  };
  const pickNumber = async (n) => {
    for (;;) {
      await PauseForKey();
      aa = cint(val(st1)); if (aa < 1 || aa > n) { Wrong(); continue; }
      return;
    }
  };

  // OPEN "alphaman.6" FOR BINARY AS #2   'for treatise, tech specifics
  timesthrough = 0;
  for (;;) {   // cmpt:
    timesthrough = timesthrough + 1;
    switch (mainp) {
      case 2:   // Monolith
        nselect = 9; nselext = 8; maxcomp = 14; break;
      case 1:   // Workstation
        nselect = 6 - 2 * qb(berscience !== 0) + qb(intl < 7) + qb(intl < 11);
        nselext = 3 - 2 * qb(berscience !== 0) + qb(intl < 9);
        maxcomp = 11;
        break;
      default:   // 0 - Data Computer
        nselect = 4 - 3 * qb(berscience !== 0) + qb(intl < 7) + qb(intl < 11);
        nselext = 2 - qb(berscience !== 0) + qb(intl < 9);
        maxcomp = 9;
    }
    for (j = 1; j <= maxcomp; j++) scratch[j] = j;
    for (j = 1; j <= nselect; j++) {
      for (;;) {   // resel:
        scratch[j] = cRoll(maxcomp); nope = FALSE;
        for (k = 1; k <= j - 1; k++) {
          if (scratch[j] === scratch[k]) { nope = TRUE; break; }
          if (scratch[j] < scratch[k]) swapScratch(j, k);
        }
        if (!nope) break;
      }
    }

    screenPages(3, vpage); ccls(3); row = 4; color(11, 0); locate(2, 5);
    if (mainp === 2) Printjnk(324, 41, 27); else Printjnk(178, 50, 14);
    color(9);
    for (j = 1; j <= nselect; j++) {
      nmsel(); locate(row, 5); print(str$(j), bl, st1); row = row + 1;
    }
    row = row + 1; color(3); locate(row, 5); Printjnk(349, 52, 16);
    screenPages(3);
    await pickNumber(nselect);   // rsel:
    if (berconfuse) aa = cRoll(nselect);
    ccls(3);
    switch (scratch[aa]) {
      case 1:   // Food ====================================================
        color(5); locate(5, 10); println(chr$(22)); color(13);
        locate(5, 15); Printjnk(179, 1, 48);
        color(6); locate(7, 10); println(chr$(254)); color(14);
        locate(7, 15); Printjnk(180, 1, 42);
        color(12); locate(9, 10); Printjnk(354, 1, 62); mx = mx + 10;
        break;
      case 2:      // Weapons =============================================
        num = nwep + nrwep; row = 3; color(9);
        nselext = nselext + 2; if (nselext > 9) nselext = 9;
        pickSorted(nselext, num);
        for (j = 1; j <= nselext; j++) {
          locate(row, 15); print(str$(j), bl, wepnm$(scratch[j + 20]));
          row = row + 1;
        }
        row = row + 1; color(3); locate(row, 5); Printjnk(178, 37, 13);
        row = row + 2;
        await pickNumber(nselext);   // rswep:
        if (berconfuse) aa = cRoll(nselext);
        typ = scratch[aa + 20];
        ccls(3); color(11);
        locate(10, 15); print(wepnm$(typ), ' : ');
        numdice = wep[typ][3]; dicsiz = wep[typ][4];
        print(ltrim$(str$(numdice)), '-', ltrim$(str$(numdice * dicsiz)), bl);
        Printjnk(179, 49, 7); print(space$(3));
        if (wep[typ][5] >= 0) {
          st1 = chr$(43) + ltrim$(str$(wep[typ][5]));
        } else {
          st1 = ltrim$(str$(wep[typ][5]));
        }
        print(st1, bl); Printjnk(179, 56, 7); print(space$(3));
        Printjnk(179, 63, 5); print(str$(wep[typ][6]));
        break;
      case 3:   // Armor ======================================================
        if (nselext > 9) nselext = 9;
        pickSorted(nselext, narm - 1);
        row = 3; color(7);
        for (j = 1; j <= nselext; j++) {
          locate(row, 15); println(str$(j), bl, armnm$(scratch[j + 20])); row = row + 1;
        }
        row = row + 1;
        color(15); locate(row, 5); Printjnk(178, 37, 13); row = row + 2;
        await pickNumber(nselext);   // rsarm:
        if (berconfuse) aa = cRoll(nselext);
        typ = scratch[aa + 20];
        ccls(3); locate(10, 15); print(armnm$(typ), ' : ');
        Printjnk(180, 43, 7); print(str$(typ - 2), chr$(44), space$(3));
        print(str$(arm[typ][2])); Printjnk(180, 50, 17);
        break;
      case 4:   // Shields ===================================================
        if (nselext > nsh - 1) nselext = nsh - 1;
        if (nselext > 9) nselext = 9;
        pickSorted(nselext, nsh - 1);
        row = 3; color(3);
        for (j = 1; j <= nselext; j++) {
          locate(row, 15); println(str$(j), bl, shnm$(scratch[j + 20])); row = row + 1;
        }
        row = row + 1;
        color(15); locate(row, 5); Printjnk(178, 37, 13); row = row + 2;
        await pickNumber(nselext);   // rssh:
        if (berconfuse) aa = cRoll(nselext);
        typ = scratch[aa + 20]; lll = idiv(nsh - typ + 1, 2); mm = (nsh - typ + 1) % 2;
        ccls(3); locate(10, 15); print(shnm$(typ), ' : -');
        if (lll) print(ltrim$(str$(lll)));
        if (mm > 0) print(chr$(171));
        Printjnk(61, 11, 7); print(space$(3), str$(sh[typ][2]));
        Printjnk(180, 50, 17);
        break;
      case 5:   // Berries =================================================
        if (nselext > 8) nselext = 8;
        row = 9 - nselext;
        for (j = 1; j <= nselext; j++) {
          k = cRoll(nberry); scratch[j + 20] = k;
          nope = FALSE;
          for (let l = 1; l <= j - 1; l++) {
            if (scratch[j + 20] === scratch[l + 20]) nope = TRUE;
          }
          if (!nope) {
            knownb[k] = TRUE; locate(row, 5);
            color(12); print(berry$[k]);
            color(4); Printjnk(22, 5, 9); println(BerEff$(k));
            locate(row + 1, 5); num = k + 230; gettech(); print(st1);
            row = row + 3;
          }
        }
        break;
      case 6:   // SSD ======================================================
        row = 4; color(14); locate(2, 1); Printjnk(193, 36, 33);
        for (j = 1; j <= nselext; j++) {
          k = cRoll(nssd + ntechwep + nstrash); scratch[j + 20] = k;
          nope = FALSE;
          for (let l = 1; l <= j - 1; l++) {
            if (scratch[j + 20] === scratch[l + 20]) { nope = TRUE; break; }
          }
          ssdknown[k] = TRUE; locate(row, 1);
          for (let l = 1; l <= ngoody; l++) {
            if (Math.abs(goody[l][1]) === 7 && goody[l][11] === k) goody[l][10] = TRUE;
          }
          for (let l = 1; l <= npack; l++) {
            if (Math.abs(backpack[l][1]) === 7 && backpack[l][11] === k) backpack[l][10] = TRUE;
          }
          for (let l = 1; l <= nsafe; l++) {
            if (Math.abs(safe[l][1]) === 7 && safe[l][11] === k) safe[l][10] = TRUE;
          }
          if (!nope) {
            color(14); print(ssdnm$(k));
            if (k > nssd && k <= nssd + ntechwep) {
              print(' : ');
              numdice = ssd[k][4]; dicsiz = ssd[k][5];
              print(ltrim$(str$(numdice)), '-', ltrim$(str$(numdice * dicsiz)), bl);
              Printjnk(179, 49, 7);
              print(space$(3), chr$(43), ltrim$(str$(ssd[k][6])), bl);
              Printjnk(179, 56, 7);
              print(space$(3));
              if (k <= nssd + ngrenade) {
                Printjnk(273, 57, 12);
              } else {
                Printjnk(179, 63, 5);
              }
              print(str$(ssd[k][7]));
            }
            if (k >= 1 && k <= nssd) num = k;
            else if (k >= nssd + 1 && k <= nssd + ngrenade) num = nssd + 1;
            else if (k >= nssd + ngrenade + 1 && k <= nssd + ntechwep) num = nssd + 2;
            else num = k - ntechwep + 2;
            num = k;
            gettech(); color(6); locate(row + 1, 1); print(st1); row = row + 2;
          }
        }
        break;
      case 7:   // LSD =======================================================
        row = 7; color(11); locate(5, 1); Printjnk(193, 36, 33);
        numb = cint(nselext / 2); if (numb < 1) numb = 1;
        for (j = 1; j <= numb; j++) {
          k = cRoll(nlsd + nltrash); scratch[j + 20] = k;
          nope = FALSE;
          for (let l = 1; l <= j - 1; l++) {
            if (scratch[j + 20] === scratch[l + 20]) { nope = TRUE; break; }
          }
          lsdknown[k] = TRUE; locate(row, 1);
          for (let l = 1; l <= ngoody; l++) {
            if (Math.abs(goody[l][1]) === 8 && goody[l][11] === k) goody[l][10] = TRUE;
          }
          for (let l = 1; l <= npack; l++) {
            if (Math.abs(backpack[l][1]) === 8 && backpack[l][11] === k) backpack[l][10] = TRUE;
          }
          for (let l = 1; l <= nsafe; l++) {
            if (Math.abs(safe[l][1]) === 8 && safe[l][11] === k) safe[l][10] = TRUE;
          }
          if (!nope) {
            color(11); println(lsdnm$(k));
            num = k + nssd + nstrash + 2;
            num = k + nssd + ntechwep + nstrash; gettech();
            color(3); locate(row + 1, 1); print(st1); row = row + 2;
          }
        }
        break;
      case 8:    // Critters ===============================================
        for (;;) {   // selcrtop:
          if (nselext > 9) nselext = 9;
          for (j = 1; j <= nselext; j++) {
            for (;;) {   // selcr:
              scratch[j + 20] = cRoll(ncreat + creextra); nope = FALSE;
              for (k = 1; k <= j - 1; k++) {
                if (scratch[j + 20] === scratch[k + 20]) { nope = TRUE; break; }
              }
              if (!nope) break;
            }
          }
          row = 3; color(1 + 1); ccls(3);
          for (j = 1; j <= nselext; j++) {
            if (scratch[j + 20] < 1) scratch[j + 20] = 1;   // CreatNam$ changes its BYREF typ
            locate(row, 15); println(str$(j) + bl + CreatNam$(scratch[j + 20], 1));
            row = row + 1;
          }
          row = row + 1;
          color(15); locate(row, 5); Printjnk(178, 37, 13); row = row + 2;
          await pickNumber(nselext);   // rscr:
          if (berconfuse) aa = cRoll(nselext);
          typ = scratch[aa + 20]; DisplayCritter(typ);
          if (cRoll(100) < mainp * intl && cRoll(10) !== 1) { await PauseForKey(); continue; }
          break;
        }
        break;
      case 9:   // Lore =====================================================
        color(10); row = 0;
        do {   // comlore:
          locate(10 + row, 10); zz = cRoll(84);
          if (mainp === 2) zz = row * 18 + 18;
          if (zz >= 1 && zz <= 19) { a = 61; b = 18; c = 27; }
          else if (zz >= 20 && zz <= 38) { a = 89; b = 1; c = 37; }
          else if (zz >= 39 && zz <= 57) { a = 198; b = 1; c = 48; }
          else if (zz >= 58 && zz <= 76) { a = 197; b = 33; c = 31; }
          else { a = 199; b = 1; c = 42; }
          Printjnk(a, b, c); row = row + 1;
        } while (mainp === 2 && row < 5);
        break;
      case 10:   // Treatise on Berry Colors ================================
        color(12);
        for (num = 150; num <= 163; num++) { gettech(); locate(num - 144, 5); print(st1); }
        break;
      case 11:   // Treatise on Arms and Armor ==============================
        color(9);
        for (num = 211; num <= 221; num++) { gettech(); locate(num - 205, 3); print(st1); }
        break;
      case 12:   // Weapon Comparison =======================================
        locate(5, 10); Printjnk(163, 1, 30); row = 0;
        do {
          row = row + 1; locate(6 + row, 10); print(wepnm$(row)); printTab(35);
          if (row < 11) println(wepnm$(row + 14));
        } while (row !== 14);
        break;
      case 13:   // Armor & Shield Comparison ===============================
        locate(5, 10); Printjnk(164, 1, 40); row = 0;
        do {
          row = row + 1; locate(6 + row, 10); print(armnm$(row)); printTab(35);
          if (row <= nsh) println(shnm$(row));
        } while (row !== 12);
        break;
      case 14:   // TapeRecorder messages
        oldvpage = vpage; vpage = 3; tapenum = 0;
        for (let i = 1; i <= 7; i++) await TapeRecorder(0);
        vpage = oldvpage;
        break;
    }

    color(10); locate(25, 1); Printjnk(35, 1, 32); await PauseForKey();
    mx = 25 + intl; if (mx > 50) mx = 50;
    if ((timesthrough < mainp + 1) || (cRoll(100) < mx)) continue;
    break;
  }
  ccls(3); screenPages(vpage);
}

// Creature damage modifiers.  Returns [dam, damtype].
function CrDamAlter(num, dam, damtype) {
  const defnum = ncre[num][10], suscnum = ncre[num][12];
  const typ = ncre[num][1];
  switch (damtype) {
    case 1: if (defnum & 1) dam = idiv(dam + 2, 3);
      if (suscnum & 1) dam = dam * 2;
      if (typ === mph) { dam = 1; mphk(num, 1); }
      if (typ === roach) roachdef = roachdef | 1;
      break;
    case 2: if (defnum & 8) dam = 0;
      if (suscnum & 8) dam = dam * 2;
      if (typ === mph) { dam = 1; mphk(num, 2); }
      if (typ === roach) roachdef = roachdef | 8;
      break;
    case 3: case 4: case 5: if (defnum & 1024) dam = 0;
      if (suscnum & 1024) dam = dam * 2;
      if (cRoll(3) === 1 && dam > 0) ncre[num][11] = ncre[num][11] | 8;
      if (typ === mph) { dam = 1; mphk(num, 3); }
      if (typ === roach) roachdef = roachdef | 1024;
      break;
    case 6: if (defnum & 2) dam = 0;
      if (suscnum & 2) dam = dam * 2;
      if (typ === mph) { dam = 1; mphk(num, 6); }
      if (typ === roach) roachdef = roachdef | 2;
      break;
    case 7:
      if (defnum & 64) {
        dam = 0;
      } else if (defnum & 128) {
        dam = -dam; Ljnkbig(-1, 62, 6, 0, 0, 0, Der$(FALSE, num, 2), 0, 2);
      }
      if (suscnum & 64) dam = dam * 2;
      if (typ === mph) { dam = 1; mphk(num, 7); }
      if (typ === roach) roachdef = roachdef | 64;
      break;
    case 8: if (defnum & 512) dam = 0;
      if (suscnum & 512) dam = dam * 2;
      if (typ === mph) { dam = 1; mphk(num, 8); }
      if (typ === roach) roachdef = roachdef | 512;
      break;
    case 9: if (defnum & 4) dam = 0;
      if (suscnum & 4) dam = dam * 2;
      if (typ === mph) { dam = 1; mphk(num, 9); }
      if (typ === roach) roachdef = roachdef | 4;
      break;
    case 10:
      if (defnum & 16) {
        dam = 0;
      } else if (defnum & 128) {
        dam = -dam; Ljnkbig(-1, 62, 6, 0, 0, 0, Der$(FALSE, num, 2), 0, 2);
      }
      if (suscnum & 16) dam = dam * 2;
      if (typ === mph) { dam = 1; mphk(num, 10); }
      if (typ === roach) roachdef = roachdef | 16;
      break;
    case 11: if (defnum & 32) dam = 0;
      if (suscnum & 32) dam = dam * 2;
      if (typ === mph) { dam = 1; mphk(num, 11); }
      if (typ === roach) roachdef = roachdef | 32;
      break;
    case 12: if (defnum & 1) dam = idiv(dam + 2, 3);
      if (suscnum & 1) dam = dam * 2;
      if (typ === mph) { dam = 1; mphk(num, 1); }
      ncre[num][6] = 0;   // move rate = 0
      break;
    case 15: if (suscnum & 128) dam = dam * 2;
      break;
    case 18: if ((suscnum & 2048) === 0) ncre[num][11] = ncre[num][11] | 32; else dam = 0;
      break;
    case 22: if ((suscnum & 4096) === 0) ncre[num][11] = ncre[num][11] | 2; else dam = 0;
      break;
    case 26: if (typ === mph) { dam = 1; mphk(num, 1); }
      if (typ === gill) dam = rolldice(12, 8, 6);
      break;
    case 27: if (typ === mph) { dam = 1; mphk(num, 3); }
      ncre[num][11] = ncre[num][11] & ~1;  // asleep
      break;
    case 28: if (typ === mph) { dam = 1; mphk(num, 9); }
      if ((suscnum & 2048) === 0) ncre[num][11] = ncre[num][11] | 16;
      break;
    case 29: if (typ === mph) { dam = 1; mphk(num, 9); }
      if (typ === slug || typ === snail || typ === leec || typ === slime) {
        dam = rolldice(8, 8, 8);
      }
      break;
    case 31:
      if (typ === rdro || typ === ddro || typ === sdro || typ === wdro || typ === robot) {
        dam = 2 * ncre[num][2];
      } else {
        damtype = 1; dam = 1; if (typ === mph) mphk(num, 1);
      }
      break;
    default: if (typ === mph) { dam = 1; mphk(num, 6); }
  }
  return [cint(dam), damtype];
}

// W: define the wimpy monster (written to alphaman.def).
async function define() {
  let w$ = '', wsym$ = '', w = 0;
  ccls(3); screenPages(3); locate(7, 5); color(5, 0);
  w$ = await inputString('Enter name for wimpy monster: ');
  if (ltrim$(rtrim$(w$)) !== '') wimpname$ = w$; else wimpname$ = 'Wolverine';
  locate(9, 5); color(4, 0);
  wsym$ = await inputString('Enter letter to represent this monster: ');
  if (ucase$(wsym$) >= 'A' && ucase$(wsym$) <= 'Z') {
    wimpsym = asc(wsym$);
  } else {
    wimpsym = 77;
  }
  locate(15, 5); for (let i = 0; i <= 15; i++) { color(i, 0); print(i); }
  locate(11, 5); color(4, 0);
  w = cint(await inputNumber('Enter color to represent this monster: '));
  if (w >= 0 && w <= 16) wimpcolr = w; else wimpcolr = 1;
  if (wimpcolr === wallcolr) wimpcolr = wallcolr - 8;
  screenPages(vpage);

  qbClose(2); const f2 = qbOpen(2, 'alphaman.def', 'OUTPUT');
  f2.println('WIMPNAME ' + wimpname$);
  f2.println('WIMPSYM ' + chr$(wimpsym));
  f2.println('WIMPCOLOR' + printText(wimpcolr)); qbClose(2);
}

// Scientific Genius: dismantle a device into parts.  Returns i (TRUE if
// something was dismantled; the caller uses it as "remoov").
async function Dismantle(i) {
  let k = 0, a = 0, b = 0, c = 0, fc = 0, fract = 0, fractnum = 0, massfract = 0, energyfract = 0, lng = 0;
  if (ngoody === 0) return i;
  ljnk(350, 1, 15, 1);
  k = 0; k = await SelectGoody(k, 14, FALSE);
  if (k < 1) { didstuff = FALSE; ClearMess(); return i; }
  if (berconfuse) k = cRoll(ngoody);
  switch (goody[k][1]) {
    case -7: case -8:
      a = 234; b = 41; c = 28; fc = 11; didstuff = FALSE;
      break;
    case 7: case 8: i = TRUE;  // returned to use as remoov
      fract = Math.fround((1 - qb(berscience > 0)) * (1 - qb(berhmmut > 0)));
      fract = Math.fround(fract / (1 - 2 * qb(berrambo > 0)) * (1 - 2 * qb(berklutz > 0)));
      switch (goody[k][1]) {
        case 7: fractnum = ssdtyp[goody[k][11]]; break;
        case 8: fractnum = lsdtyp[goody[k][11]]; break;
      }
      massfract = Math.fround((fractnum % 10) / 10 * fract * (6 + cRoll(8)) / 12);
      if (massfract > 0.95) massfract = Math.fround(0.95);
      energyfract = Math.fround(idiv(fractnum, 10) / 10 * fract * (8 + cRoll(5)) / 12);
      if (energyfract > 0.95) energyfract = Math.fround(0.95);
      goody[k][2] = cint(goody[k][2] * massfract);
      if (goody[k][2] < 1) goody[k][2] = 1;
      if (goody[k][3] > 0) {
        if (goody[k][1] === 7) {
          goody[k][3] = cint(goody[k][3] * 10 / ssd[goody[k][11]][2]);
        } else {
          goody[k][3] = cint(goody[k][3] * 10 / lsd[goody[k][11]][2]);
        }
        goody[k][3] = cint(goody[k][3] * (9 + cRoll(11)) / 20 * energyfract);
      } else {
        goody[k][3] = 0;
      }
      goody[k][1] = 10;
      for (let j = 4; j <= 12; j++) goody[k][j] = 0;
      gdy[k] = jnk$(319, 50, 17);
      fatadd = 4;
      if (goody[k][2] !== 1) lng = 13; else lng = 12;  // "s" on end
      Ljnkbig(412, 50, 12, 414, 49, lng, str$(goody[k][2]), 1, 1);
      if (goody[k][3] !== 1) lng = 13; else lng = 12;
      Ljnkbig(354, 25, 3, 358, 9, lng, str$(goody[k][3]), 1, 2);
      await MessPause(13, 0);
      break;
    default:
      a = 360; b = 1; c = 30; fc = 11; didstuff = FALSE;
  }
  if (c > 0) { ljnk(a, b, c, 2); fc = await MessPause(fc, 0); }
  if (rdisp === 2) DisplayGoodies(FALSE); else SortGoody();
  return i;
}

// Force field effects on damage to the player.  Returns [damage, ffkill].
function ffEffect(damage, ffkill) {
  let damreduce = 0, damreduce2 = 0, newdam = 0, iff = 0;
  ffkill = FALSE; if (damage < 1) return [damage, ffkill];

  if (forcefield) {
    damreduce = cRoll(damage) - 1;
    if (berhmmut > 0) {
      damreduce2 = cRoll(damage);
      if (damreduce < damreduce2) damreduce = damreduce2;
    }
    if (damreduce > (10 - 10 * qb(berhmmut > 0))) damreduce = (10 - 10 * qb(berhmmut > 0));
    damage = damage - damreduce;
  }

  if (berff) {
    damreduce = cRoll(damage) - 1;
    if (damreduce > 10) damreduce = 10;
    damage = damage - damreduce;
  }

  if (ffgen && (damage > 2)) {
    newdam = cRoll(cint(damage / 2)); ffgen = ffgen - cRoll(damage - newdam);
    damage = newdam; iff = 0;
    for (let iu = 1; iu <= ngoody; iu++) {
      if (goody[iu][1] === -7 && goody[iu][11] === 13) {
        iff = iu; goody[iu][3] = ffgen; break;
      }
    }
    if (ffgen <= 0) {
      ffgen = 0;
      if (iff > 0) {
        RemoveGoody(iff, FALSE); ffkill = TRUE;
        if (rdisp === 2) DisplayGoodies(FALSE);
      }
    }
  }
  return [damage, ffkill];
}

// Strings: substring of text line num (-2..420) of ALPHAMAN.1.
function jnk$(num, strt, leng) {
  if (num < -2) num = -2; else if (num > 420) num = 420;
  if (leng > 69 - strt) leng = 69 - strt;
  return mid$(JNK[num + 2], strt, leng);
}

// L(ook) at a distant main-map square (Heightened Vision / VisiScope).
async function Look(scope) {
  let vpagesav = 0, lsym = 0, nlx = 0, nly = 0, fc = 0, bc = 0, lookrad = FALSE;
  let oldterrain = 0, oldterrf = 0, oldterrb = 0, oldrz = 0, oldi = 0, oldradint = 0, z = 0;
  let startsav = 0, imax = 0, irm = 0, imin = 0, jmax = 0, jrm = 0, jmin = 0, ic = 0, jc = 0, t = 0;
  looking = TRUE; vpagesav = vpage; vpage = 0;
  lo2: {
    if (dark) { ljnk(241, 48, 20, 1); didstuff = FALSE; break lo2; }
    if (incastle) return;
    [lsym, nlx, nly, fc, bc] = await TargetLong(lsym, 200, nlx, nly, fc, bc); ClearMess();
    if (not(didstuff)) break lo2;

    for (let l = 1; l <= nnear; l++) {
      ncre[l][4] = ncre[l][4] - 50 * (nlx - mainx);
      ncre[l][5] = ncre[l][5] - 20 * (nly - mainy);
    }
    lookrad = FALSE;
    for (let i = 1; i <= 10; i++) {
      if (nlx === radzone[i][1] && nly === radzone[i][2]) {
        lookrad = TRUE;
        oldterrain = terrain; oldterrf = terrf; oldterrb = terrb;
        oldrz = radzone[i][3]; oldi = i; oldradint = radint;
        if (i === grinchzone) { terrain = 71; terrf = 5; map = TRUE; }
        terrb = 4; radzone[i][3] = -Math.abs(radzone[i][3]);
        radint = Math.abs(radzone[i][3]); break;
      }
    }

    z = crd(nlx - mainx, nly - mainy);
    if (berdet) z = idiv(z + 1, 2);
    if (scope & qb(pmut === 4) & qb(berpmut === 0)) z = idiv(z + 1, 2);
    if (pmut === 4 && berpmut === 0 && berhpmut > 0) z = idiv(z + 1, 2);
    const swapMain = () => {
      t = mainx; mainx = nlx; nlx = t;
      t = mainy; mainy = nly; nly = t;
    };
    if (z === 0) {
      ClearMess(); ljnk(47, 1, 27, 1); didstuff = FALSE; break lo2;
    } else if (z === 1) {
      swapMain(); looksym = terrain; t = terrain; terrain = lsym; lsym = t;
      startsav = starting; starting = 0;
      vpage = 1; await DetailedMap(FALSE); starting = startsav;
      swapMain(); t = terrain; terrain = lsym; lsym = t;
    } else if (z >= 2 && z <= 11) {
      swapMain(); looksym = terrain; t = terrain; terrain = lsym; lsym = t;
      startsav = starting; starting = 0;
      vpage = 1; await DetailedMap(FALSE); starting = startsav;
      swapMain(); t = terrain; terrain = lsym; lsym = t;
      screenPages(3, 0); ccls(3);
      imax = int(51 / z) + 1; irm = imax * z - 51; imin = cint(25 - imax / 2);
      jmax = int(21 / z) + 1; jrm = jmax * z - 21; jmin = cint(11 - jmax / 2);
      for (let i = 2; i <= imax; i++) {
        ic = cRoll(2 * z - 2 - irm) + irm - 1;
        for (let j = 2; j <= jmax; j++) {
          jc = cRoll(2 * z - 2 - jrm) + jrm - 1;
          const [sym, fcc, bcc] = GetSym(z * i - ic, z * j - jc, 1);
          PutSym(sym, i + imin, j + jmin, fcc, bcc, 3);
        }
      }
      box(imin + 1, imax + 1 + imin, jmin + 1, jmax + 1 + jmin, 1, 4, 3);
      screenPages(3, 3);
    } else {
      ljnk(47, 28, 34, 1); didstuff = FALSE;
    }
    if (didstuff) ClearMess();
    await MessPause(5, 0);
    for (let l = 1; l <= nnear; l++) {
      ncre[l][4] = ncre[l][4] + 50 * (nlx - mainx);
      ncre[l][5] = ncre[l][5] + 20 * (nly - mainy);
    }
    if (lookrad) {
      terrain = oldterrain; terrf = oldterrf; terrb = oldterrb;
      radzone[oldi][3] = oldrz; radint = oldradint;
    }

    looking = FALSE; await DetailedMap(FALSE); PutSym(lsym, nlx, nly, fc, bc, 0);
  }
  // lo2:
  looking = FALSE; vpage = vpagesav; screenPages(vpage); PrintMessage(7, 0);
}

// ? : command list and character description (page 3).
function MakeCommandScreen() {
  ClearMess();
  ljnk(28, 57, 11, 1); PrintMessage(3, 0);
  screenPages(3, vpage); ccls(3); color(3, 0);
  let d = 0;   // RESTORE a8comd
  for (let i = 1; i <= 11; i++) {
    for (let j = 1; j <= 60; j += 27) {
      if (j === 28) j = 29;
      const a = A8COMD[d++], b = A8COMD[d++], c = A8COMD[d++];
      st1 = jnk$(a, b, c);
      if (i > 3) {
        PutSym(asc(left$(st1, 1)), j, i, 11, 0, 3);
        locate(i, j + 1); print(right$(st1, len(st1) - 1));
      } else {
        locate(i, j); print(st1);
      }
      if (j === 29) j = 28;
    }
  }

  const f2 = qbOpen(2, 'alphaman.5', 'INPUT');
  for (let i = 1; i <= 33; i++) st1 = f2.lineInput();           // unused commands+blank
  st1 = f2.lineInput(); println(st1); st1 = f2.lineInput();
  color(9);
  for (let i = 1; i <= 6; i++) {
    locate(i + 13, 1); st1 = f2.lineInput(); print(st1);           // stat descr.
  }
  for (let i = 1; i <= 2 * pmut - 1; i++) st1 = f2.lineInput();    // unused pmuts+blank
  color(5); locate(20, 1); st1 = f2.lineInput(); print(st1);       // pmuts
  locate(21, 1); st1 = f2.lineInput(); print(st1);                 // pmuts
  for (let i = 1; i <= 2 * (nphysmut - pmut) + 2 * mmut - 1; i++) {
    st1 = f2.lineInput();                                          // unused pmuts+blank+mmuts
  }
  locate(22, 1); st1 = f2.lineInput(); print(st1);                 // mmuts
  locate(23, 1); st1 = f2.lineInput(); print(st1);                 // mmuts
  qbClose(2);

  color(10); locate(25, 1); Printjnk(320, 1, 68);
  screenPages(vpage);
}

// s(earch); s is FALSE for the automatic search done every turn.
async function Search(s) {
  let num = 0, rrr = 0, dx = 0, dy = 0, seecrit = FALSE;
  if (berblind) {
    ljnk(352, 56, 13, 1); didstuff = FALSE;
  } else if (mask) {
    ljnk(88, 45, 22, 2); didstuff = FALSE;
  } else {
    fatadd = fatig;
    if ((pmut === 4 && berpmut === 0)) {
      num = (25 - 25 * qb(berhpmut > 0)); rrr = (2 - qb(berhpmut > 0));
      if (uvhelmet) { num = num * 3; rrr = rrr + 1; }
    } else {
      num = 4; rrr = 1;
      if (uvhelmet) num = 10;
    }
    if (berdet > 0) { num = num * 3 + 5; rrr = rrr + 1; }
    if (s === FALSE) { num = cint(num / 5); rrr = rrr - 1; if (rrr < 1) rrr = 1; }
    if (sunglasses) { num = cint(num / 3); rrr = 1; }
    if (num < 1) num = 1;
    for (let i = 1; i <= num; i++) {
      do {   // sea:
        dx = cRoll(2 * rrr + 1) - 1 - rrr; dy = cRoll(2 * rrr + 1) - 1 - rrr;
      } while ((dx === 0 && dy === 0) || not(SameRoom(dx, dy)));
      const xx = dx + localx, yy = dy + localy;
      const [sym, fc, bc] = GetSym(xx, yy, 2);
      switch (sym) {
        case trap: case pit: case gas: case 215: case 216: PutSym(sym, xx, yy, fc, bc, 1); break;
        case secretdoor: PutSym(cen, xx, yy, wallcolr, 0, -1); break;
        default:
          if ((sym >= 65 && sym <= 90) || (sym >= 97 && sym <= 122)) {
            if (fc === 0) { PutSym(sym, xx, yy, 8, bc, -1); seecrit = TRUE; }
          } else if (fc === 0) PutSym(sym, xx, yy, 8, bc, -1);
      }
    }
  }
  if (seecrit) { ClearMess(); await MessPause(8, 0); }
}

// F10: a fake DOS prompt ("boss key").
async function Sneak() {
  let clm = 3, row = 5;
  screenPages(3); ccls(3); color(7, 0);
  locate(5, 1); print('C>');
  color(7 + 16, 0); locate(row, clm); print(chr$(95));
  await PauseForKey();
  while (st1 !== chr$(27) && st1 !== chr$(0) + chr$(68)) {
    color(7, 0); locate(row, clm); print(st1); clm = clm + 1;
    if (clm > 80 || asc(st1) === 13) {
      clm = clm - 1; locate(row, clm); print(' ');
      clm = 3; row = row + 1; if (row >= 25) { row = 1; ccls(3); }
      locate(row, 1); print('C>');
    }
    color(7 + 16, 0); locate(row, clm); print(chr$(95));
    await PauseForKey();
  }
  screenPages(vpage);
}

async function SplitCre(ch) {
  if (ncre[ch][2] <= 1) { ncre[ch][2] = -1; return; }
  ljnk(358, 42, 16, 2);
  crtyp = ncre[ch][1];
  const oldhits = ncre[ch][2];
  ncre[ch][2] = idiv(ncre[ch][2], 2); ncre[ch][3] = ncre[ch][2];  // leave outside IF
  if (nnear < 50) {
    MakeCreature(ncre[ch][4] + localx, ncre[ch][5] + localy, FALSE, FALSE);
    ncre[nnear][2] = oldhits - ncre[ch][2]; ncre[nnear][3] = ncre[nnear][2];
    await Awaken(nnear);
  }
}

// Lets the player move a cursor to pick a target square within range.
// Returns [num, dx, dy]: num > 0 is a creature, num < 0 is -symbol,
// num = 0 means cancelled / nothing there.
async function Target(num, range, dx, dy, avoidcolr) {
  let ndx = 0, ndy = 0, hid = FALSE, fred = FALSE, sym = 0, fc = 0, bc = 0, done = FALSE;
  let response = 0, sym2 = 0, fc2 = 0, bc2 = 0;
  vpage = 1; screenPages(vpage);
  if (avoidcolr === 0) avoidcolr = -1;
  ClearMess();
  ljnk(43, 1, 33, 1); ljnk(44, 1, 36, 2); PrintMessage(7, 0);
  dx = 0; dy = 0; ndx = 0; ndy = 0; hid = FALSE;
  [sym, fc, bc] = GetSym(localx + dx, localy + dy, 1);
  ta2: {
    for (;;) {   // tar:
      if (hid) fc = 0; else if (fred) fc = 4;
      PutSym(sym, localx + dx, localy + dy, fc, bc, 1);
      [sym, fc, bc] = GetSym(localx + ndx, localy + ndy, 1);
      if (fc === 0) {
        fc = 4; hid = TRUE; fred = FALSE;
      } else if (fc === 4 && sym !== trap && sym !== pit) {
        fc = 12; hid = FALSE; fred = TRUE;
      } else {
        hid = FALSE; fred = FALSE;
      }
      PutSym(sym, localx + ndx, localy + ndy, fc, 4, 1);
      dx = ndx; dy = ndy;
      GameWait.next('target', { page: 1, x: localx + dx, y: localy + dy }); await PauseForKey();
      response = 1000 * (len(st1) - 1) + asc(right$(st1, 1));
      done = FALSE;
      switch (response) {
        case 1071: ndx = dx - 1; ndy = dy - 1; break;
        case 1072: ndy = dy - 1; break;
        case 1073: ndx = dx + 1; ndy = dy - 1; break;
        case 1075: ndx = dx - 1; break;
        case 1077: ndx = dx + 1; break;
        case 1079: ndx = dx - 1; ndy = dy + 1; break;
        case 1080: ndy = dy + 1; break;
        case 1081: ndx = dx + 1; ndy = dy + 1; break;
        case 27: num = 0; didstuff = FALSE; break ta2;
        case 13: done = TRUE; break;
        default: ljnk(43, 34, 17, 3); PrintMessage(7, 0);
      }
      if (localx + ndx < 1) ndx = 1 - localx; else if (localx + ndx > 52) ndx = 52 - localx;
      if (localy + ndy < 1) ndy = 1 - localy; else if (localy + ndy > 22) ndy = 22 - localy;
      if (crd(ndx, ndy) > range) {
        ljnk(43, 51, 12, 3); PrintMessage(7, 0);
        ndx = dx; ndy = dy; continue;
      }
      [sym2, fc2, bc2] = GetSym(localx + ndx, localy + ndy, 2);
      if (fc2 === avoidcolr) {
        [sym2, fc2, bc2] = GetSym(localx + ndx, localy + ndy, 1);
        if (fc2 === avoidcolr) { ndx = dx; ndy = dy; }
      }
      if (not(done)) continue;
      break;
    }
    [sym2, fc2, bc2] = GetSym(localx + dx, localy + dy, 2);
    num = -sym2;
    for (let j = 1; j <= nnear; j++) {
      if (dx === ncre[j][4] && dy === ncre[j][5]) num = j;
    }
    if (num === 0) { sym = 250; fc = 8; bc = 0; }
    if (qb(avoidcolr === wallcolr) & incastle & not(SameRoom(dx, dy))) num = 0;
  }
  // ta2:
  if (hid) fc = 0;
  PutSym(sym, localx + ndx, localy + ndy, fc, bc, 1);
  return [num, dx, dy];
}

// Target a main-map square.  Returns [lsym, nlx, nly, fc, bc].
async function TargetLong(lsym, range, nlx, nly, fc, bc) {
  let lx = 0, ly = 0, response = 0, done = FALSE;
  screenPages(0); ClearMess();
  Ljnkbig(43, 1, 27, 43, 63, 6, bl, 3, 1); ljnk(44, 1, 36, 2);
  PrintMessage(7, 0);
  lx = mainx; ly = mainy; nlx = lx; nly = ly;
  [lsym, fc, bc] = GetSym(lx, ly, 0);
  for (;;) {   // lok:
    PutSym(lsym, lx, ly, fc, bc, 0);
    [lsym, fc, bc] = GetSym(nlx, nly, 0);
    PutSym(lsym, nlx, nly, fc, 3, 0);
    lx = nlx; ly = nly; GameWait.next('target', { page: 0, x: lx, y: ly }); await PauseForKey();
    response = 1000 * (len(st1) - 1) + asc(right$(st1, 1));
    done = FALSE;
    switch (response) {
      case 1071: nlx = lx - 1; nly = ly - 1; break;
      case 1072: nly = ly - 1; break;
      case 1073: nlx = lx + 1; nly = ly - 1; break;
      case 1075: nlx = lx - 1; break;
      case 1077: nlx = lx + 1; break;
      case 1079: nlx = lx - 1; nly = ly + 1; break;
      case 1080: nly = ly + 1; break;
      case 1081: nlx = lx + 1; nly = ly + 1; break;
      case 27: didstuff = FALSE; return [lsym, nlx, nly, fc, bc];
      case 13: done = TRUE; break;
      default: ljnk(43, 34, 17, 3); PrintMessage(7, 0);
    }
    if (nlx > 51 || nlx < 2 || nly > 21 || nly < 2) {
      ljnk(44, 37, 28, 3); PrintMessage(7, 0);
      nlx = lx; nly = ly; continue;
    }
    if (crd(nlx - mainx, nly - mainy) > range) {
      ljnk(43, 51, 12, 3); PrintMessage(7, 0);
      nlx = lx; nly = ly; continue;
    }
    if (not(done)) continue;
    return [lsym, nlx, nly, fc, bc];
  }
}

// m / p: use a mental (i = -2) or physical (i = -1) mutation.  Returns i,
// which BuildGoody / Dismantle may set to TRUE (used by Use as "remoov").
async function UseMutat(i) {
  let a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, fc = 7, bc = 0;
  let hpmut = 0, hmmut = 0, dam = 0, r = 0, num = 0, dx = 0, dy = 0, needed = 0, needed_s = 0;
  let rad = 0, siz = 0, intensity = 0, rol = 0, addl = 0, turns = 0, ii = 0;
  let x = 0, y = 0, s = 0, sym = 0, typ = 0, chan = 0, susc2m = 0, rnds = 0, waterborders = 0;
  let j = 0, k = 0, dropped = 0;
  ClearMess(); keysave2 = TRUE; SetCombatStats();
  umt: {
    switch (-i) {
      case 1:
        if (pmutturns > 0) {
          if (pmutturns === 1) st1 = bl; else st1 = 's';
          l2 = jnk$(69, 46, 16) + str$(pmutturns) + jnk$(70, 1, 10) + st1;
          didstuff = FALSE; await MessPause(10, 0); break umt;
        }
        hpmut = qb(berhpmut > 0);
        switch (pmut) {
          case 2: case 3: case 5: case 7: case 8: case 10:        // --- passive ones ---
            a = 70; b = 12; c = 38; didstuff = FALSE;
            break;
          case 1:         // Elect. Gen.
            if (currsym === 247 || currsym === 126) {
              dam = cRoll(cint(5 + 1.7 * lvl)); dam = dam + otherdam; r = 1;
              if (hpmut) { if (cRoll(2) === 1) dam = dam * 2; else r = 2; }
              if (cRoll(10) === 1) dam = dam * 2;
              pmutturns = 12 + hpmut * 3; fatadd = 10; ClearMess();
              ljnk(83, 39, 10, 1); await Explode(0, 0, dam, 9, 5, r, FALSE, 11, 5);
            } else {
              shock = TRUE; fatadd = 2;
            }
            break;
          case 4:     // H. Vision
            fc = 14;
            if (sunglasses) {
              a = 88; b = 19; c = 26; didstuff = FALSE;
            } else if (mask) {
              a = 88; b = 45; c = 22; didstuff = FALSE;
            } else if (incastle) {
              a = 53; b = 51; c = 15; fatadd = 2;
            } else if (dark > 0) {
              d = 241; e = 48; f = 20; didstuff = FALSE;
            } else {
              fatadd = 3; await Look(FALSE);
            }
            break;
          case 6:   // sonic
            dam = cRoll(cint(5 + 1.6 * lvl)); dam = dam + otherdam; r = 1;
            if (hpmut) { if (cRoll(2) === 1) dam = dam * 2; else r = 2; }
            if (cRoll(10) === 1) dam = dam * 2;
            pmutturns = 12 + hpmut * 3; fatadd = 10; ClearMess();
            ljnk(71, 1, 16, 1); await Explode(0, 0, dam, 10, 5, r, FALSE, 4, 5);
            break;
          case 9:  // laser
            [num, dx, dy] = await Target(num, Math.fround(7.5 - hpmut * 2), dx, dy, wallcolr); ClearMess();
            if (num === 0 || num === -1) { ClearMess(); didstuff = FALSE; break umt; }
            needed = tohitbase - other2hitr - dex2hit - 4; ljnk(72, 42, 10, 1);
            if (needed > 17) needed = 17; else if (needed < 4) needed = 4;
            dam = rolldice(cint(5 + lvl / 3), 3, 3) + otherdam;
            if (hpmut) { dam = dam * 2; needed = needed - 3; }
            if (cRoll(10) === 1) dam = cint(dam * 1.5);
            needed = (await Explode(dx, dy, dam, 7, needed, 0, FALSE, 14, 1)).need;
            pmutturns = 13 + hpmut * 3; fatadd = 10;
            break;
          case 11:   // foul musk
            didmusk = TRUE; if (hpmut) rad = 5; else rad = 3;
            for (let id = 1; id <= nnear; id++) {
              if (crd(ncre[id][4], ncre[id][5]) <= rad) {
                ncre[id][6] = -Math.abs(ncre[id][6]);
                if (cRoll(4 + hpmut) === 1 && (ncre[id][10] & 1024) === 0) ncre[id][11] = ncre[id][11] | 8;
              }
            }
            for (dx = -rad; dx <= rad; dx++) {
              for (dy = -rad; dy <= rad; dy++) {
                if (crd(dx, dy) < rad + 1) {
                  [sym, fc, bc] = GetSym(localx + dx, localy + dy, 1);
                  PutSym(sym, localx + dx, localy + dy, fc, 6, 1);
                }
              }
            }
            pmutturns = 14 + hpmut * 3; fatadd = 10 + hpmut * 3;
            ljnk(88, 1, 18, 1);
            await MessPause(6, 0);
            for (dx = -rad; dx <= rad; dx++) {
              for (dy = -rad; dy <= rad; dy++) {
                if (crd(dx, dy) < rad + 1) {
                  [sym, fc, bc] = GetSym(localx + dx, localy + dy, 1);
                  PutSym(sym, localx + dx, localy + dy, fc, 0, 1);
                }
              }
            }
            break;
          case 12:   // acidic saliva
            [num, dx, dy] = await Target(num, Math.fround(4.5 + lvl / 2 - hpmut * 3), dx, dy, wallcolr); ClearMess();
            if (num === 0 || num === -1) { ClearMess(); didstuff = FALSE; break umt; }
            needed = cint(tohitbase - other2hitr - dex2hit - 13 + 1.5 * crd(dx, dy) + hpmut * 6);
            if (needed > 16) needed = 16; else if (needed < 4) needed = 4;
            siz = idiv(6 + lvl - crd(dx, dy), 2); if (siz < 1) siz = 1;
            ljnk(152, 1, 9, 1); dam = rolldice(siz, 4, 4) + otherdam;
            if (hpmut) dam = dam * 2;
            if (cRoll(10) === 1) dam = cint(dam * 1.5);
            needed = (await Explode(dx, dy, dam, 6, needed, 0, FALSE, 6, 2)).need;
            pmutturns = 8 + hpmut * 2; fatadd = 10;
            break;
          case 13:   // poison claws
            [num, dx, dy] = await Target(num, 1.5, dx, dy, wallcolr); ClearMess();
            if (num === 0 || num === -1) { ClearMess(); didstuff = FALSE; break umt; }
            needed = tohitbase - other2hitc - str2hit - 3 + hpmut * 4;
            if (needed > 17) needed = 17; else if (needed < 4) needed = 4;
            ljnk(169, 51, 10, 1);
            intensity = cRoll(cRoll(lvl + 3));
            dam = rolldice(4, intensity, intensity) + otherdam + strdam;
            if (hpmut) dam = dam * 2;
            if (cRoll(10) === 1) dam = dam * 2;
            needed = (await Explode(dx, dy, dam, 3, needed, 0, FALSE, 6, 1)).need;
            pmutturns = -5 * qb(needed >= 0); fatadd = fatig + 3;
            break;
          case 14:   // H. Speed
            zippy = cRoll(11) + 9; zippy = 2 * idiv(zippy, 2);
            pmutturns = zippy * 2 + 6; fatadd = fatig + 4 + hpmut * 2;
            if (hpmut) zippy = zippy * 2;
            a = 153; b = 1; c = 5; fc = 11;
            break;
          case 15:   // rad. generation
            [num, dx, dy] = await Target(num, Math.fround(5.5 - hpmut * 3), dx, dy, wallcolr); ClearMess();
            if (num === 0 || num === -1) { ClearMess(); break umt; }
            needed = tohitbase - other2hitr - dex2hit - 8 + hpmut * 3;
            if (needed > 18) needed = 18; else if (needed < 7) needed = 7;
            ljnk(153, 6, 19, 1);
            dam = rolldice(cint(3 + lvl / 2), 3, 2) + otherdam;
            if (hpmut) dam = dam * 2;
            needed = (await Explode(dx, dy, dam, 2, needed, Math.fround(-5.5 + hpmut * 3), TRUE, 4, 3)).need;
            pmutturns = 15 + hpmut * 4; fatadd = 20;
            break;
          case 16:    // shoot quills
            [num, dx, dy] = await Target(num, 4.5, dx, dy, wallcolr); ClearMess();
            if (num === 0 || num === -1) { ClearMess(); didstuff = FALSE; break umt; }
            needed = tohitbase - other2hitr - dex2hit + hpmut * 5 - 6;
            if (incastle === 0) needed = needed + wind - 1;
            if (needed > 17) needed = 17; else if (needed < 5) needed = 5;
            ljnk(102, 20, 11, 1);
            dam = rolldice(cint(3 + lvl / 2), 3, 3) + otherdam;
            if (hpmut) dam = dam * 2;
            needed = (await Explode(dx, dy, dam, 1, needed, 0, FALSE, 7, 1)).need;
            pmutturns = 8 + hpmut * 3; fatadd = 8;
            break;
          case 17:    // tenticles
            [num, dx, dy] = await Target(num, 1.5, dx, dy, wallcolr); ClearMess();
            if (num <= 0) { ClearMess(); didstuff = FALSE; break umt; }
            needed = tohitbase - other2hitc - ncre[num][9];
            if (needed > 17) needed = 17; else if (needed < 4) needed = 4;
            rol = cRoll(20);
            if (rol >= needed) {
              // (sic) "roachdef = roachdef = roachdef OR 1" sets roachdef to -1
              if (ncre[num][1] === roach) roachdef = qb(roachdef === roachdef) | 1;
              Ljnkbig(101, 53, 13, 0, 0, 0, Der$(FALSE, num, 1), 1, 1);
              tentgrab = num;
            } else {
              Ljnkbig(50, 33, 10, 0, 0, 0, bl + Der$(FALSE, num, 1), 1, 1);
            }
            fc = 2; pmutturns = 2 + hpmut; fatadd = fatig + 5;
            await MessPause(2, 0);
            break;
        }
        break;
      case 2:
        if (mmutturns > 0) {
          if (mmutturns === 1) st1 = bl; else st1 = 's';
          l2 = jnk$(69, 46, 16) + str$(mmutturns) + jnk$(70, 1, 10) + st1;
          didstuff = FALSE; await MessPause(10, 0); break umt;
        }
        if (mindweb && mmut > 2) {
          mindweb = 0; ljnk(111, 14, 23, 1); await MessPause(10, 0);
        }
        hmmut = qb(berhmmut > 0);
        switch (mmut) {
          case 1:  // mil genius
            a = 70; b = 12; c = 38; didstuff = FALSE;
            break;
          case 2:  // sci genius
            ljnk(351, 1, 49, 1); PrintMessage(14, 0); await PauseForKey();
            if (ucase$(st1) === 'C') {
              i = await BuildGoody(i);
            } else if (ucase$(st1) === 'D') {
              i = await Dismantle(i);
            } else {
              didstuff = FALSE;
            }
            ClearMess();
            PrintMessage(7, 0);
            break;
          case 3:  // willpower
            str = str + 3; dex = dex + 3; con = con + 3; rr = rr + 3;
            intl = intl + 3; hits = hits + 6 + lvl; hitmax = hitmax + 6 + lvl;
            wpturns = rolldice(6, 6, 3); mmutturns = wpturns * 2;
            if (hmmut) wpturns = wpturns * 2 - 1;
            fatadd = 12; ClearMess(); a = 174; b = 1; c = 15; fc = 10;
            break;
          case 4:  // mental blast
            [num, dx, dy] = await Target(num, 7.5, dx, dy, wallcolr); ClearMess();
            if (num === 0 || num === -1) { ClearMess(); didstuff = FALSE; break umt; }
            if (num > 0) addl = 6 * qb((ncre[num][12] & 512) === 512);
            needed = cint(18 - mr * 0.7 + addl + hmmut * 3);
            if (needed > 17) needed = 17; else if (needed < 5) needed = 5;
            dam = rolldice(idiv(mr + lvl, 2), 3, 2);
            if (hmmut) dam = dam * 2;
            ljnk(73, 1, 17, 1); needed = (await Explode(dx, dy, dam, 8, needed, 0, FALSE, 10, 20)).need;
            mmutturns = 12 + hmmut * 3; fatadd = 7;
            break;
          case 5:  // teleport
            if (fatigue > 60 - 80 * hmmut) {
              didstuff = FALSE; a = 278; b = 32; c = 30;
            } else {
              teleporting = TRUE; await Teleport(0); teleporting = FALSE;
              if (didstuff) { fatadd = 100 + 60 * hmmut; mmutturns = 50 + 25 * hmmut; }
              await MessPause(3, 0);
            }
            break;
          case 6:  // mental heal
            turns = int((hitmax - hits + 2) / 3); ClearMess();
            if (hmmut) turns = cint(turns / 2);
            Ljnkbig(74, 1, 12, 74, 13, 23, str$(turns), 1, 1);
            ljnk(75, 1, 40, 2); PrintMessage(9, 0);
            color(9, 0); locate(24, 42); GameWait.number(); st1 = await lineInput('', true); ii = cint(val(st1));
            if (ii < turns) mheal = ii; else mheal = turns;
            if (mheal <= 0) {
              didstuff = FALSE; ClearMess();
            } else {
              fatadd = 5; mmutturns = 2 * mheal + 5;
            }
            break;
          case 7:  // force field
            fc = 3;
            if (forcefield) { a = 74; b = 36; c = 30; didstuff = FALSE; break umt; }
            forcefield = TRUE; a = 75; b = 41; c = 26; fatadd = 2;
            break;
          case 8:  // molecular disruption
            [num, dx, dy] = await Target(num, 1.5 - hmmut, dx, dy, 0); ClearMess();
            if (crd(dx, dy) > 1 - hmmut || num === 0 || num === -1) { didstuff = FALSE; break umt; }
            x = localx + dx; y = localy + dy; a = 12; b = 58; c = 5; fc = 9;
            switch (-num) {
              case 24: case 8: case 7: case 22: case 254: case 5: case 236: case 11: case 12: case 21:
              case 157: case 147: case 167: case 18: case 29: case 145: case 234: case 225: case 35:
                if (incastle) { s = 250; f = 8; } else { s = 32; f = 7; }
                PutSym(s, x, y, f, 0, 1);
                if (incastle) PutSym(s, x, y, f, 0, 2);
                [x, y, dropped] = RemoveLocalGoody(x, y, dropped);
                break;
              case 126: case 247:   // water
                waterborders = 0;
                for (let deli = -1; deli <= 1; deli++) {
                  for (let delj = -1; delj <= 1; delj++) {
                    [s, f] = GetSym(x + deli, y + delj, 2);
                    if (s === 126 || s === 247) waterborders = waterborders + 1;
                  }
                }
                if (waterborders < 4) {
                  if (incastle) { s = 250; f = 8; } else { s = 32; f = 7; }
                  PutSym(s, x, y, f, 0, -1);
                }
                break;
              case 219:
                if (incastle === 1) {
                  if (x > 2 && x < 51 && y > 2 && y < 21) {
                    PutSym(250, x, y, 8, 0, -1);
                  }
                }
                break;
              case ur: case um: case ul: case ml: case mrt: case ll: case lm: case lr: case hor: case ver:
              case cen: case lockeddoor:
                if ((incastle === 0) || ((incastle === -1) && (castle === 6))) break umt;
                for (j = x - 1; j <= x + 1; j++) {
                  for (k = y - 1; k <= y + 1; k++) {
                    [sym, fc, bc] = GetSym(j, k, 2);
                    if (sym === 32) PutSym(219, j, k, wallcolr, 0, -1);
                  }
                }
                PutSym(250, x, y, 8, 0, -1);
                if (dark === 0) {
                  for (j = x - 1; j <= x + 1; j++) {
                    for (k = y - 1; k <= y + 1; k++) {
                      savecorn = 0; DotIt(j, k); DotCorn();
                    }
                  }
                } else {
                  ChangeDark();
                }
                localx = localx + dx; localy = localy + dy;  // for sameroom
                for (let ig = 1; ig <= nnear; ig++) {
                  if (SameRoom(ncre[ig][4], ncre[ig][5])) await Awaken(ig);
                }
                localx = localx - dx; localy = localy - dy;  // undo it
                break;
              case 15: case 42: case trap: case pit: case 240: case gas: case 215: case 216:
                if (incastle) { s = 250; f = 8; } else { s = 32; f = 7; }
                PutSym(s, x, y, f, 0, -1);
                break;
              default:
                if (-num >= -nnear && -num <= -1) {     // creatures
                  await Awaken(num); typ = ncre[num][1]; fc = 12;
                  chan = idiv(25 + ncre[num][2] / 2, (1 - qb((ncre[num][12] & 512) === 512)));
                  if (hmmut) chan = chan - 10;
                  if (((cRoll(mr + lvl + 15) >= cRoll(chan)) && ((ncre[num][10] & 512) === 0))) {
                    c = 0; Ljnkbig(172, 1, 17, 0, 0, 0, Der$(FALSE, num, 1), 1, 1);
                    // (sic) "roachdef = roachdef = roachdef OR 512" sets roachdef to -1
                    if (typ === roach) roachdef = qb(roachdef === roachdef) | 512;
                    await KillCreat(num);
                  } else if ((ncre[num][10] & 512)) {
                    a = 86; b = 34; c = 19;
                  } else {
                    a = 73; b = 31; c = 32;
                  }
                } else {
                  didstuff = FALSE;
                }
            }
            if (didstuff) { mmutturns = 12 + 4 * hmmut; fatadd = 20 + hmmut * 10; }
            break;
          case 9:  // life leech
            for (j = nnear; j >= 1; j--) {
              typ = ncre[j][1];
              if ((crd(ncre[j][4], ncre[j][5]) < 1.5)) {
                susc2m = -qb((ncre[j][12] & 512) === 512);  // 0 or 1
                chan = cint(15 - mr * 0.4 - 6 * susc2m + hmmut * 3);
                if (chan < 6) chan = 6; else if (chan > 16) chan = 16;
                rol = cRoll(20);
                if (((ncre[j][10] & 512) === 0) && rol >= chan) {
                  await Awaken(j); typ = ncre[j][1]; ClearMess();
                  dam = cRoll(cint(lvl / 2 + 2)) + cRoll(idiv(lvl, 2) + 2);
                  dam = cint(dam * (1 + 0.5 * susc2m));
                  if (typ === roach) roachdef = roachdef | 512;
                  if (typ === mph) { dam = 1; mphk(j, 13); }
                  if (hmmut) dam = dam * 2;
                  ncre[j][2] = ncre[j][2] - dam;
                  Ljnkbig(76, 38, 28, 0, 0, 0, Der$(FALSE, j, 1), 1, 1);
                  if (ncre[j][2] < 0) await KillCreat(j);
                  hits = hits + dam * (1 + 0.8 * qb(hits >= hitmax));
                } else if ((ncre[j][10] & 512) === 512) {
                  l1 = Der$(FALSE, j, 2) + jnk$(86, 36, 17);
                } else {
                  ljnk(73, 31, 32, 1); l2 = 'on ' + Der$(FALSE, j, 1);
                }
                await MessPause(10, 0);
              }
            }
            mmutturns = 5 + hmmut * 2; fatadd = 7 + hmmut * 3;
            break;
          case 10:     // invisibility
            rnds = rolldice(4, 5, 5); mmutturns = 3 + rnds * 2;
            if (hmmut) rnds = rnds * 2;
            invisible = invisible + rnds; fatadd = 8 + hmmut * 4;
            PutSym(1, localx, localy, 8, 0, 1);
            a = 318; b = 16; c = 49; fc = 10;
            break;
          case 11:     // cryo
            [num, dx, dy] = await Target(num, 4, dx, dy, wallcolr); ClearMess();
            if (num === 0 || num === -1) { ClearMess(); didstuff = FALSE; break umt; }
            needed = cint(17 - mr * 0.5 + hmmut * 3); dam = 1;
            if (num > 0) {
              dam = rolldice(5 + idiv(lvl, 2), cint(2 ** ncre[num][15] + 1), cint(2 ** ncre[num][15] + 1));
              needed = needed + 4 * qb((ncre[num][12] & 512) === 512);
            }
            if (needed > 17) needed = 17; else if (needed < 5) needed = 5;
            if (hmmut) dam = dam * 2;
            ljnk(77, 48, 15, 1);
            needed = (await Explode(dx, dy, dam, 11, needed, 0, FALSE, 9, 20)).need;
            // (num < 0 would write outside ncre() in the original)
            if (needed > 0 && num >= 0) ncre[num][15] = ncre[num][15] + 1;
            mmutturns = 3 + hmmut; fatadd = 5 + hmmut * 2;
            break;
          case 12:     // Hypnosis
            [num, dx, dy] = await Target(num, 5, dx, dy, wallcolr); ClearMess();
            if (num === 0 || num === -1) { ClearMess(); didstuff = FALSE; break umt; }
            needed = cint(15 - mr * 0.4 + hmmut * 3);
            if (num > 0) needed = needed + 4 * qb((ncre[num][12] & 512) === 512);
            if (needed > 17) needed = 17; else if (needed < 4) needed = 4;
            // (sic) the original tests creature j (still 0 here), not num
            if ((((ncre[j][10] & 512) === 0) && cRoll(20) >= needed)) {
              // (num < 0 would write outside ncre() in the original)
              if (num >= 0) ncre[num][11] = ncre[num][11] & ~1;
              Ljnkbig(419, 30, 8, 419, 37, 9, Der$(FALSE, j, 1), 1, 1);
            } else if ((ncre[j][10] & 512) === 512) {
              l1 = Der$(FALSE, j, 2) + jnk$(86, 36, 17);
            } else {
              ljnk(73, 31, 32, 1); l2 = 'on ' + Der$(FALSE, j, 1);
            }
            await MessPause(13, 0); mmutturns = 3 + hmmut * 3; fatadd = 4 + hmmut * 2;
            break;
          case 13:     // Psychokinesis
            [num, dx, dy] = await Target(num, 4, dx, dy, wallcolr); ClearMess();
            if (num === 0) { ClearMess(); didstuff = FALSE; break umt; }
            dam = rolldice(1 + idiv(mr, 6) + idiv(lvl, 3), 2, 2);
            needed = 8; r = 1;
            if (hmmut) {
              // (sic) needed! is a different variable from needed
              needed_s = 5; if (cRoll(2) === 1) dam = dam * 2; else r = 2;
            }
            ljnk(420, 1, 28, 1);
            needed = (await Explode(dx, dy, dam, 1, needed, r, TRUE, 12, 2)).need;
            mmutturns = 16 + hmmut * 6; fatadd = 20;
            break;
        }
        break;
      default: didstuff = FALSE;
    }
  }
  // umt:
  await DisplayCharacter();
  if (c > 0) { ljnk(a, b, c, 2); fc = await MessPause(fc, 0); }
  return i;
}

// Loads the strings of ALPHAMAN.1 (built in here); prints the progress dots.
function GetTextArray() {
  for (let num = -2; num <= 420; num++) {   // change 420 in jnk$ as well!!!!
    if ((num % 20) === 0) print('.');
  }
}

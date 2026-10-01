// Port of A7.BAS: messages, symbols, creature names, character status,
// initialisation, the intro screen, loading/saving games and maps.
//
// Copyright (c) 1995 Jeffrey R. Olson (MIT license, see LICENSE)
//
// Porting conventions used in all game modules:
//  * SUBs that change their (by-reference) parameters return the new values
//    and callers assign them back, e.g. i = await SelectGoody(i, 7, FALSE).
//  * GetSym returns [sym, fc, bc].
//  * NOT on an integer that may be other than -1/0 is written not(x) (bitwise,
//    as in QuickBasic); AND/OR of integers are written & and |.
//  * Anything that can wait for a key press is async.
'use strict';

async function Awaken(i) {
  if ((ncre[i][11] & 1) === 0) {
    const typ = ncre[i][1];
    let numbr = 0, a = 0, b = 0, c = 0;
    switch (typ) {
      case elvis: case elvimp:
        ClearMess();
        ljnk(162, 45, 16, 1);
        for (;;) {        // reelv:
          numbr = cRoll(24); a = 369 + numbr;
          let again = false;
          switch (typ) {
            case elvis: b = 1;
              switch (numbr) {
                case 1: c = 29; break;
                case 2: c = 37; break;
                case 3: c = 39; break;
                case 4: c = 40; break;
                case 5: c = 38; break;
                case 6: c = 23; break;
                case 7: c = 28; break;
                case 8: c = 25; break;
                case 24: c = 31; break;
                default: again = true;
              }
              break;
            case elvimp:
              switch (numbr) {
                case 1: b = 30; c = 39; break;
                case 2: b = 38; c = 30; break;
                case 3: b = 40; c = 26; break;
                case 4: b = 41; c = 26; break;
                case 5: b = 39; c = 30; break;
                case 6: b = 24; c = 36; break;
                case 7: b = 29; c = 37; break;
                case 8: b = 26; c = 40; break;
                case 24: b = 32; c = 32; break;
                default: again = true;
              }
              break;
          }
          if (!again) break;
        }
        l2 = chr$(14) + ' ... ' + jnk$(a, b, c) + ' ... ' + chr$(14);
        await MessPause(9, 0);
        break;
    }
  }
  ncre[i][11] = ncre[i][11] | 1;
}

// Copies the temporary "deleteme.N" map files into <name>.sav.
function BackupMapsToName() {
  let filout$ = CheckFil(left$(rtrim$(ltrim$(name$)), 8));
  filout$ = filout$ + '.sav';
  qbClose(2); qbOpen(2, filout$, 'APPEND');   // to create file
  qbClose(2); qbKill(filout$);
  qbClose(2); const f2 = qbOpen(2, filout$, 'BINARY');

  let totnum = 0; f2.putInt(totnum);

  for (let endnum = -1; endnum <= 15; endnum++) {
    let smode = endnum; if (smode > 1) smode = 1;
    smode = -smode;    // smode=-1 is a castle level, smode 1 is lair

    const filin$ = 'deleteme.' + ltrim$(str$(endnum));

    qbClose(1); const f1 = qbOpen(1, filin$, 'BINARY');
    if (f1.lof() === 1) { qbClose(1); qbKill(filin$); continue; }

    totnum = totnum + 1;
    f2.putInt(endnum);

    f2.putSingle(f1.getSingle());                           // zzgt!
    const copyInt = () => { const v = f1.getInt(); f2.putInt(v); return v; };
    copyInt(); copyInt();                                     // mainx, mainy
    copyInt(); copyInt();                                     // localx, localy
    copyInt(); copyInt();                                     // currsym, currf

    const zzndropped = copyInt();
    for (let i = 1; i <= zzndropped; i++) {
      const lll = f1.getInt(); const a$ = f1.getString(lll);
      f2.putInt(lll); f2.putString(a$);
    }
    for (let i = 1; i <= zzndropped; i++) {
      for (let j = 1; j <= 16; j++) copyInt();
    }
    for (let i = 1; i <= 20; i++) for (let j = 1; j <= 3; j++) copyInt();

    const zznnear = copyInt();
    for (let i = 1; i <= zznnear; i++) for (let j = 1; j <= 15; j++) copyInt();

    for (let i = 2; i <= 51; i++) for (let j = 2; j <= 21; j++) copyInt();
    for (let i = 2; i <= 51; i++) for (let j = 2; j <= 21; j++) copyInt();

    copyInt(); copyInt(); copyInt(); copyInt();   // bldg, castle, castlelevel, mononum
    copyInt(); copyInt(); copyInt(); copyInt();   // lwall, rwall, twall, bwall
    copyInt(); copyInt(); copyInt(); copyInt();   // lwscr, rwscr, twscr, bwscr
    copyInt(); copyInt(); copyInt();              // dots, xenter, yenter
    copyInt(); copyInt(); copyInt();              // xenterscr, yenterscr, enterdir

    copyInt();                                    // goodycastle
    switch (smode) {
      case -1:   // castle level
        for (let i = -10; i <= 10; i++) { copyInt(); copyInt(); }
        break;
    }
  }

  f2.putInt(totnum, 1);

  qbClose(2); qbClose(1);   // (the original reopens alphaman.3 as #1 here)
}

function ChangeDark() {
  let r = 0, xlo = 0, xhi = 0, ylo = 0, yhi = 0, ffc = 0;
  let sym = 0, fc = 0, bc = 0, dx = 0, dy = 0;

  const darkout = () => {
    for (let x = xlo; x <= xhi; x++) {
      for (let y = ylo; y <= yhi; y++) {
        if (x > 1 && x < 52 && y > 1 && y < 22) {
          [sym, fc, bc] = GetSym(x, y, 1);
          switch (sym) {
            case 249: case 250: case 15: case 42: case 176: case 177: case 126: case 247:
              PutSym(32, x, y, 7, 0, 1); break;
            default:
              if ((sym >= 65 && sym <= 90) || (sym >= 97 && sym <= 122)) PutSym(32, x, y, 7, 0, 1);
          }
        }
      }
    }
  };

  const darkon = () => {
    if (not(SameRoom(dx, dy))) return;
    const xx = localx + dx, yy = localy + dy;
    if (xx > 51 || xx < 2 || yy > 21 || yy < 2) return;
    [sym, fc, bc] = GetSym(xx, yy, 2);
    switch (sym) {
      case trap: case pit: case gas: case 215: case 216: {
        const [sym1, fc1, bc1] = GetSym(xx, yy, 1);
        if (sym1 !== trap && sym1 !== pit && sym1 !== gas && sym1 !== 215 && sym1 !== 216) { sym = sym1; fc = fc1; bc = bc1; }
        break;
      }
      case secretdoor: {
        const [, f] = GetSym(xx + 1, yy, 2);
        if (f === wallcolr) sym = hor; else sym = ver;
        break;
      }
      case um: case lm: case ml: case mrt:
        savecorn = savecorn + 1;
        savcrn[savecorn][1] = xx; savcrn[savecorn][2] = yy;
        break;
      case cen: {
        const [, fca] = GetSym(xx - 1, yy, 2); const [, fcb] = GetSym(xx, yy - 1, 2);
        if (fca === wallcolr && fcb === wallcolr) {
          savecorn = savecorn + 1;
          savcrn[savecorn][1] = xx; savcrn[savecorn][2] = yy;
        }
        break;
      }
    }
    PutSym(sym, xx, yy, fc, bc, 1);
  };

  if (dark) {
    r = dark; if (r === -1) r = 0;
    if (incastle === 0) {
      xlo = 2; xhi = 51; ylo = 2; yhi = 21; darkout();
    } else if (incastle === -1) {
      PutSym(250, localx, localy, 8, 0, 1); UnDotIt(localx, localy);
    }
    savecorn = 0;
    for (dx = -r; dx <= r; dx++) for (dy = -r; dy <= r; dy++) darkon();
    DotCorn();
    if (invisible) ffc = 8; else ffc = 15;
    PutSym(1, localx, localy, ffc, 0, 1);
  } else {
    if (incastle === 0) {
      for (let x = 1; x <= 52; x++) {
        for (let y = 1; y <= 22; y++) {
          [sym, fc, bc] = GetSym(x, y, 2);
          switch (sym) {
            case 215: case 216: case trap: case pit: case gas:
              if (((pmut === 4 && berpmut === 0) || berdet > 0)) PutSym(sym, x, y, fc, bc, 1);
              break;
            default: PutSym(sym, x, y, fc, bc, 1);
          }
        }
      }
    } else if (incastle === -1) {
      PutSym(32, localx, localy, 8, 0, 1);
      savecorn = 0; DotIt(localx, localy); DotCorn();
      if (invisible) ffc = 8; else ffc = 15;
      PutSym(1, localx, localy, ffc, 0, 1);
    }
  }
}

// Makes a DOS-safe 8-character file name.  Returns the new name (the BASIC
// SUB modified its argument).
function CheckFil(a$) {
  a$ = left$(ltrim$(rtrim$(a$)), 8);
  const flen = len(a$);
  for (let i = 1; i <= flen; i++) {
    const aa = asc(mid$(a$, i, 1));
    if ((aa >= 48 && aa <= 57) || (aa >= 65 && aa <= 90) || (aa >= 97 && aa <= 122)) {
      // ok
    } else {
      a$ = midSet(a$, i, 1, '_'); if (i === 1) a$ = midSet(a$, 1, 1, 'A');
    }
  }
  if (flen === 0) a$ = 'AM01';
  return a$;
}

function ClearMess() {
  l1 = bl; l2 = bl; l3 = bl;
}

function clpage2() {
  for (let i = 1; i <= 52; i++) for (let j = 1; j <= 22; j++) pag2[i][j] = 32;
}

// Creature name.  (The BASIC version also sets a caller's typ < 1 to 1.)
function CreatNam$(typ, i) {
  let d$;
  if (typ < 1) typ = 1;
  if (typ === wimp && wimpname$ !== '') {
    d$ = wimpname$;
  } else if (typ === magg && ncre[i][14]) {
    d$ = 'Fly';
  } else {
    d$ = CRE[typ].name;
  }
  d$ = rtrim$(ltrim$(d$));
  if ((incastle === -1) && (castle === 4)) {
    switch (typ) {
      case trump: case marla: case ivana: case blob: case gumby: case pokey: case bush: case quayle: case mph:
        break;
      default: d$ = jnk$(246, 63, 6) + d$;
    }
  }
  return d$;
}

// Creature statistic 1..15 from ALPHAMAN.2.
function Creature(typ, stat) {
  if (typ < 1) typ = 1;
  let iii = CRE[typ].v[stat];
  if (typ === wimp && stat === 3) iii = cint(wimpsym + 1000 * wimpcolr);
  return iii;
}

// "the Snail", "The Snail", "a Snail" (i = 1, 2, 3); "it" if invisible.
function Der$(kil, num, i) {
  let d$ = '';
  const t = ncre[num][1];
  switch (t) {
    case japb: case mph: case gumby: case pokey: case blob: case rodan: case kong: case godz: case bfoot:
      break;
    case cubs:    // needs to be here because of CASE IS >
      if (i === 1) d$ = 'the '; else if (i === 2) d$ = 'The '; else d$ = 'a ';
      break;
    default:
      if (t > ncreat + creextra + 1) break;   // +1 for webspid
      switch (i) {
        case 3: {
          if (ncre[num][1] < 1) ncre[num][1] = 1;   // CreatNam$ changes its BYREF typ
          let a$ = ltrim$(CreatNam$(ncre[num][1], num));
          a$ = ucase$(left$(a$, 1));
          if (a$ === 'A' || a$ === 'E' || a$ === 'I' || a$ === 'O' || a$ === 'U') d$ = 'an ';
          else d$ = 'a ';
          break;
        }
        case 2: d$ = 'The '; break;
        default: d$ = 'the ';
      }
  }
  if (ncre[num][1] < 1) ncre[num][1] = 1;   // CreatNam$ changes its BYREF typ
  d$ = d$ + CreatNam$(ncre[num][1], num);
  if (not(kil)) {
    const [sym] = GetSym(ncre[num][4] + localx, ncre[num][5] + localy, 1);
    let invis = TRUE;
    if ((sym > 64 && sym < 91) || (sym > 96 && sym < 123)) invis = FALSE;
    if (invis) {
      if (i === 2) d$ = 'It'; else d$ = 'it';
    }
  }
  return d$;
}

// Shows a creature description on page 3.  ttyp < 0 means creature number
// -ttyp in ncre(), otherwise a creature type.
function DisplayCritter(ttyp) {
  // ---- assumes already in screen 3, calling prog will return to active screen
  let realcrit = FALSE, typ = ttyp, num = 0, fb = 0, bc = 0, fd = 0;
  let aa = 0, bb = 0, cc = 0, defnse = 0, susc = 0, robo = FALSE, mov = 0, ac = 0, hts = 0, hd = 0;
  let row = 0, botrow = 0, tohit = 0, astr = 0, rng = 0, atyp = 0, asiz = 0, a = 0, b = 0, c = 0, znum = 0;
  if (typ < 0) { realcrit = TRUE; num = -typ; typ = ncre[num][1]; }
  ccls(3); color(15); locate(3, 5);
  if (typ < 1) typ = 1;   // CreatNam$ changes its BYREF typ
  print(CreatNam$(typ, 1), space$(4));
  if (realcrit) fb = ncre[num][7]; else fb = Creature(typ, 3);
  if (idiv(fb, 1000) === 0) bc = 1; else bc = 0;
  color(idiv(fb, 1000), bc); print(bl, chr$(imod(fb, 1000)), bl);
  color(7, 0); print(space$(4));

  color(14, 0); println(printUsing$(jnk$(217, 1, 18), Creature(typ, 5)));

  locate(4, 5); color(13); st1 = 'in ';
  if (typ >= ncreat + 1 && typ <= ncreat + crecas) {
    aa = 45; bb = 61; cc = 5;
  } else if (typ >= ncreat + crecas && typ <= ncreat + crecas + crefor) {
    aa = 45; bb = 19; cc = 5;
  } else if (typ >= ncreat + crecas + crefor && typ <= ncreat + crecas + crefor + creswa) {
    aa = 45; bb = 35; cc = 5;
  } else if (typ >= ncreat + crecas + crefor + creswa && typ <= ncreat + crecas + crefor + creswa + crepla) {
    aa = 45; bb = 24; cc = 6;
  } else if (typ >= ncreat + crecas + crefor + creswa + crepla && typ <= ncreat + crecas + crefor + creswa + crepla + creh2o) {
    aa = 58; bb = 24; cc = 5;
  } else {
    st1 = ''; aa = 240; bb = 1; cc = 8;
  }
  Printjnk(27, 63, 6); print(st1); Printjnk(aa, bb, cc);

  color(9); locate(5, 5);
  if (realcrit) {
    defnse = ncre[num][10]; susc = ncre[num][12]; robo = FALSE;
    mov = Math.abs(ncre[num][6]); ac = ncre[num][9]; hts = ncre[num][2];
    print(printUsing$(jnk$(267, 28, 13), str$(hts))); print(space$(4));
  } else {
    if (typ === robot || typ === rdro || typ === ddro || typ === sdro) robo = TRUE;
    defnse = Creature(typ, 2); susc = Creature(typ, 4);
    if (typ === roach) defnse = roachdef;
    fb = Creature(typ, 1); hd = imod(idiv(fb, 10), 1000);
    mov = idiv(fb, 10000); ac = imod(fb, 10);
    if ((defnse & 16384)) ac = ac - 10;
    if ((susc & 16384)) ac = ac + 10;
    if ((defnse & -32768)) mov = mov + 4;
    if (not(robo)) {
      if (hd > 0) {
        print(printUsing$(jnk$(267, 28, 19), str$(hd), ltrim$(str$(hd * 8))));
      } else {
        print(jnk$(138, 1, 16));
      }
    } else {
      println(printUsing$(jnk$(270, 1, 49), chr$(63), chr$(63), chr$(63)));
    }
  }
  if (not(robo)) println(printUsing$(jnk$(270, 17, 33), str$(mov), str$(ac)));

  color(3); row = 7; botrow = 10;
  for (let l = 1; l <= 5; l++) {
    fb = Creature(typ, 4 + 2 * l); fd = Creature(typ, 5 + 2 * l);
    tohit = imod(fb, 100); astr = idiv(fb, 100);
    rng = imod(fd, 100); atyp = idiv(fd, 100);

    if (realcrit) {
      switch (typ) {
        case robot: case rdro: case sdro: case ddro:
          astr = imod(ncre[num][14], 10); tohit = idiv(ncre[num][14], 100);
          rng = imod(idiv(ncre[num][14], 10), 10);
          break;
        case webspid:
          astr = imod(ncre[num][14], 100); tohit = idiv(ncre[num][14], 100);
          break;
      }
    }

    if (atyp !== 0) {
      switch (atyp) {
        case 1: asiz = 6; if (astr === 0) { astr = 1; asiz = 3; }
          a = 194; b = 1; c = 7; break;
        case 2: asiz = 5; if (astr === 0) { astr = 1; asiz = 3; }
          a = 194; b = 8; c = 9; break;
        case 3: case 4: case 5: asiz = 4; if (astr === 0) { astr = 1; asiz = 3; }
          a = 194; b = 17; c = 6; break;
        case 6: asiz = 6; if (astr === 0) { astr = 1; asiz = 3; }
          a = 194; b = 23; c = 4; break;
        case 7: asiz = 4; if (astr === 0) { astr = 1; asiz = 3; }
          a = 194; b = 27; c = 5; break;
        case 8: asiz = 6; a = 194; b = 32; c = 12; break;
        case 9: asiz = 8; if (astr === 0) { astr = 1; asiz = 4; }
          a = 194; b = 44; c = 10; break;
        case 10: asiz = 5; if (astr === 0) { astr = 1; asiz = 3; }
          a = 194; b = 54; c = 4; break;
        case 11: asiz = 7; if (astr === 0) { astr = 1; asiz = 3; }
          a = 194; b = 58; c = 4; break;
        case 12: asiz = 3; a = 197; b = 21; c = 12; break;
        case 13: asiz = astr; astr = 1; a = 195; b = 9; c = 10; break;
        case 14: asiz = 0; astr = 0; a = 194; b = 62; c = 5; break;
        case 15: asiz = 4; a = 195; b = 19; c = 6; break;
        case 16: asiz = astr + 1; a = 196; b = 51; c = 12; break;
        case 17: asiz = 0; astr = 0; a = 222; b = 58; c = 10; break;
        case 18: asiz = 5; a = 196; b = 63; c = 5; break;
        case 19: asiz = 6; if (astr === 0) { astr = 1; asiz = 3; }
          a = 225; b = 60; c = 7; break;
        case 20: asiz = 0; a = 239; b = 41; c = 15; break;
        case 21: asiz = 0; a = 239; b = 56; c = 12; break;
        case 22: asiz = 0; a = 250; b = 1; c = 8; break;
        case 23: asiz = 0; a = 250; b = 9; c = 9; break;
        case 24: asiz = 0; a = 320; b = 60; c = 4; break;       // help
        case 25: asiz = 6; if (astr === 0) { astr = 1; asiz = 3; }
          a = 290; b = 65; c = 4; break;
        case 26: asiz = -1; astr = 1; a = 290; b = 44; c = 7; break;    // unusual
        case 27: asiz = 0; a = 178; b = 64; c = 5; break;       // sleep
      }
      st1 = jnk$(a, b, c);
      locate(row, 5); print(st1, bl); Printjnk(195, 25, 7); print(space$(3));
      if (robo) {
        print('?-? damage');
      } else {
        asiz = asiz * astr;
        if (asiz > 0) {
          print(printUsing$(jnk$(411, 57, 10), ltrim$(str$(astr)), ltrim$(str$(asiz))));
        } else if (asiz === 0) {
          Printjnk(413, 58, 8);
        } else {
          Printjnk(419, 60, 8);
        }
      }
      locate(row + 1, 5);
      if (robo) {
        Printjnk(141, 58, 9);
      } else {
        println(printUsing$(jnk$(217, 45, 9), rng));
      }
      row = row + 3; botrow = row + 1;
    }
  }
  color(13); locate(7, 55); Printjnk(195, 32, 11);
  color(5); row = 8;
  for (let l = 0; l <= 15; l++) {
    if (((defnse & 2 ** l) && l < 14) || ((susc & roundEven(2 ** (l - 3))) && l > 13)) {
      st1 = bl; locate(row, 55); row = row + 1; cc = 0;
      switch (l) {
        case 0: aa = 195; bb = 43; cc = 16; break;
        case 1: aa = 194; bb = 23; cc = 4; break;
        case 2: aa = 196; bb = 1; cc = 11; break;
        case 3: aa = 194; bb = 8; cc = 9; break;
        case 4: aa = 194; bb = 54; cc = 4; break;
        case 5: aa = 194; bb = 58; cc = 4; break;
        case 6: aa = 195; bb = 1; cc = 6; break;
        case 7: aa = 196; bb = 12; cc = 20; break;
        case 8: if (defnse & 2048) znum = 4; else znum = 1;
          aa = 195; bb = 59; cc = 10; st1 = str$(znum) + jnk$(196, 32, 5); break;
        case 9: aa = 196; bb = 37; cc = 14; break;
        case 10: aa = 194; bb = 17; cc = 6; break;
        case 11:
          if ((defnse & 256) === 0) {
            aa = 195; bb = 59; cc = 10; st1 = ' 3' + jnk$(196, 32, 5);
          } else {
            row = row - 1;
          }
          break;
        case 12: aa = 197; bb = 1; cc = 20; break;
        case 13: aa = 197; bb = 1; cc = 19; st1 = '10'; break;
        case 14: aa = 130; bb = 51; cc = 16; break;
        case 15: aa = 124; bb = 59; cc = 9; break;
      }
      if (cc > 0) { Printjnk(aa, bb, cc); print(st1); }
    }
  }
  color(12); row = row + 1; locate(row, 55); Printjnk(313, 23, 16);
  row = row + 1; color(4);
  for (let l = 0; l <= 15; l++) {
    if ((susc & 2 ** l)) {
      locate(row, 55); if (row < 25) row = row + 1;
      switch (l) {
        case 0: aa = 195; bb = 52; cc = 7; break;
        case 1: aa = 194; bb = 23; cc = 4; break;
        case 2: aa = 196; bb = 1; cc = 11; break;
        case 3: aa = 194; bb = 8; cc = 9; break;
        case 4: aa = 194; bb = 54; cc = 4; break;
        case 5: aa = 194; bb = 58; cc = 4; break;
        case 6: aa = 195; bb = 1; cc = 6; break;
        case 7: aa = 243; bb = 60; cc = 8; break;
        case 8: aa = 312; bb = 56; cc = 13; break;
        case 9: aa = 196; bb = 37; cc = 14; break;
        case 10: aa = 194; bb = 17; cc = 6; break;
        case 15: aa = 263; bb = 60; cc = 8; break;
        default: row = row - 1; cc = 0;
      }
      if (cc > 0) Printjnk(aa, bb, cc);
    }
  }

  if (realcrit) {
    color(10); locate(botrow, 5); Printjnk(267, 47, 14);
    if (ncre[num][6] < 0) Printjnk(267, 61, 8);
    if ((ncre[num][11] & 1)) Printjnk(251, 9, 6); else Printjnk(237, 35, 7);
    if (ncre[num][11] & 2) Printjnk(146, 62, 6);
    if (ncre[num][11] & 4) Printjnk(116, 14, 9);
    if (ncre[num][11] & 8) Printjnk(232, 12, 5);
    if (ncre[num][11] & 16) Printjnk(268, 1, 8);
    if (ncre[num][11] & 32) Printjnk(268, 9, 9);
  }
}

function DumpBuffer() {
  KB.clear();
}

function ErasePut() {
  for (let i = 1; i <= nnear; i++) { EraseCreat(i); PutCreat(i); }
}

// X(amine) command; with tric (tricorder) it examines a screen square.
async function Examine(tric) {
  let i = 0, a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, num = 0, dx = 0, dy = 0;
  let sym = 0, fc = 0, bc = 0, lnl = 0, bb = 0, cc = 0, az = 0, bz = 0, cz = 0;
  let a$ = '', b$ = '', c$ = '', d$ = '', ss$ = '', aa$ = '', bb$ = '';
  let xa = 0, xb = 0, xc = 0;
  if (not(tric)) {
    didstuff = FALSE; ClearMess();
    if (dark === -1) { ljnk(241, 48, 20, 1); await MessPause(7, 0); ClearMess(); return; }
    ljnk(259, 1, 27, 1); ljnk(259, 28, 25, 2); ljnk(8, 11, 11, 3);
  }
  exam: for (;;) {
    if (not(tric)) { PrintMessage(7, 0); await PauseForKey(); } else st1 = 'S';
    switch (ucase$(st1)) {
      case '?': await Help(5); return;
      case 'I':   // item
        ljnk(257, 49, 13, 1); i = 0; i = await SelectGoody(i, 7, FALSE);
        if (i < 1) { await DisplayCharacter(); PrintMessage(7, 0); break exam; }
        if (berconfuse) i = cRoll(ngoody);
        switch (Math.abs(goody[i][1])) {
          case 1: ljnk(258, 25, 20, 2); break;
          case 2: ljnk(258, 45, 21, 2); break;
          case 3: a$ = ''; if (goody[i][9] > 0) a$ = '+';
            if (goody[i][9]) a$ = a$ + ltrim$(str$(goody[i][9])) + ' to hit ';
            if (goody[i][10] > 0) b$ = '+';
            if (goody[i][10]) b$ = b$ + ltrim$(str$(goody[i][10])) + ' damage ';
            l2 = jnk$(24, 25, 7) + a$ + b$ + gdy[i];
            break;
          case 4: case 5: if (goody[i][4] === 1) lnl = 9; else lnl = 10;
            Ljnkbig(294, 1, 14, 294, 15, lnl, str$(goody[i][4]), 1, 2);
            if (goody[i][5] > 0) a$ = '+';
            if (goody[i][5]) l1 = "It's " + a$ + ltrim$(str$(goody[i][5])) + bl + gdy[i];
            break;
          case 6:
            switch (goody[i][6]) {
              case 0: bb = 41; cc = 14; break;
              case 1: bb = 41; cc = 9; break;
              case 2: bb = 55; cc = 14; break;
            }
            l2 = jnk$(129, bb, cc) + gdy[i];
            break;
          case 7: case 8:
            if (goody[i][10]) {
              if (goody[i][11] === 2 && Math.abs(goody[i][1]) === 7) {
                DisplayGoodies(1); ClearMess(); await MessPause(14, 0); await DisplayCharacter();
                break exam;
              } else if (goody[i][11] === 8 && Math.abs(goody[i][1]) === 8) {
                DisplayGoodies(2); ClearMess(); await MessPause(14, 0); await DisplayCharacter();
                break exam;
              } else {
                c$ = jnk$(10, 61, 5) + gdy[i];
                const g3 = goody[i][3];
                if (g3 === 0) l2 = c$ + jnk$(261, 1, 17);
                else if (g3 === 1) l2 = c$ + ' has' + str$(goody[i][3]) + jnk$(262, 20, 9);
                else if (g3 > 1) l2 = c$ + ' has' + str$(goody[i][3]) + jnk$(261, 8, 10);
                else Ljnkbig(259, 54, 15, 261, 9, 4, c$, 0, 2);
              }
            } else {
              az = 144;
              switch (cRoll(9)) {
                case 1: bz = 29; cz = 6; break;
                case 2: bz = 35; cz = 7; break;
                case 3: bz = 42; cz = 17; break;
                case 4: bz = 59; cz = 8; break;
                case 5: az = 145; bz = 1; cz = 14; break;
                case 6: az = 145; bz = 15; cz = 12; break;
                case 7: az = 145; bz = 27; cz = 7; break;
                case 8: az = 145; bz = 34; cz = 17; break;
                case 9: az = 145; bz = 51; cz = 17; break;
              }
              ss$ = jnk$(az, bz, cz);
              Ljnkbig(144, 1, 27, 0, 0, 0, ss$, 1, 1); ljnk(260, 26, 29, 2);
            }
            break;
          case 9:
            l1 = jnk$(261, 18, 17) + gdy[i];
            switch (goody[i][3]) {
              case 7: case 9: {
                const g4 = goody[i][4];
                if (g4 === 0) l2 = 'It' + jnk$(261, 1, 17);
                else if (g4 === 1) l2 = 'It has' + str$(goody[i][4]) + jnk$(262, 20, 9);
                else if (g4 > 1) l2 = 'It has' + str$(goody[i][4]) + jnk$(261, 8, 10);
                break;
              }
            }
            break;
          case 10:
            if (goody[i][2] !== 1) aa$ = 's'; else aa$ = '';
            if (goody[i][3] !== 1) bb$ = 's'; else bb$ = '';
            l1 = 'You have' + str$(goody[i][2]) + ' weight unit' + aa$ + ' and' + str$(goody[i][3]) + ' energy unit' + bb$;
            break;
          default:
            l2 = jnk$(261, 18, 17) + gdy[i];
        }
        fatadd = 1; await DisplayCharacter();
        break;
      case 'S':  // screen square
        [num, dx, dy] = await Target(num, 60, dx, dy, wallcolr * (1 + tric)); ClearMess();
        c$ = jnk$(261, 35, 7); d$ = c$ + 'a '; num = -num;
        a = 0; b = 0; c = 0; d = 0; e = 0; f = 0; g = 0; h = 0; i = 0;
        switch (true) {
          case num === 0: await DisplayCharacter(); break exam;
          case num < 0:
            if (tric) {
              screenPages(3); DisplayCritter(num); await PauseForKey();
              screenPages(vpage); break exam;
            } else {
              [sym, fc, bc] = GetSym(localx + dx, localy + dy, 2);
              if (fc !== 0) {
                l1 = c$ + Der$(TRUE, -num, 3);
                const hp = idiv(4 * (ncre[-num][2] + 1), (ncre[-num][3] + 1));
                if (hp >= 3) { xa = 136; xb = 62; xc = 7; }
                else if (hp === 2) { xa = 243; xb = 30; xc = 4; }
                else if (hp === 1) { xa = 114; xb = 59; xc = 9; }
                else if (hp < 1) { xa = 246; xb = 55; xc = 8; }
                Ljnkbig(257, 35, 9, xa, xb, xc, bl, 2, 2);
              } else {
                a = 261; b = 53; c = 15;
              }
            }
            break;
          case num === 15: d = 63; e = 41; f = 4; break;
          case num === 42: d = 238; e = 48; f = 4; break;
          case num === 247: case num === 126: a = 260; b = 55; c = 10; break;
          case num === 176: d = 260; e = 65; f = 3; break;
          case num === 22: Ljnkbig(1, 16, 7, 1, 34, 4, d$, 0, 2); break;
          case num === 254: d = 1; e = 16; f = 18; break;
          case num === 24:  // weapon
            d = 177; e = 27; f = 6; break;
          case num === 8:   // armor
            l2 = d$ + jnk$(256, 62, 7) + bl + jnk$(177, 47, 5); break;
          case num === 9:   // shield
            d = 177; e = 52; f = 6; break;
          case num === 5: case num === 236:  // berry
            d = -2; e = 37; f = 5; break;
          case num === 11: case num === 12:  // ssd
            d = -2; e = 52; f = 6; break;
          case num === 21: case num === 157:  // lsd
            d = -2; e = 52; f = 6; break;
          case num === 135: case num === 128: d = 352; e = 38; f = 18; break;
          case num === 240: [sym, fc, bc] = GetSym(localx + dx, localy + dy, 1);
            if (fc > 7) a$ = 'up'; else a$ = 'down';
            l2 = d$ + jnk$(261, 42, 8) + bl + a$;
            break;
          case num === pit: d = -2; e = 64; f = 3;
            [num, fc, bc] = GetSym(localx + dx, localy + dy, 2);
            PutSym(num, localx + dx, localy + dy, fc, bc, 1);
            break;
          case num === trap: d = 153; e = 41; f = 4;
            [num, fc, bc] = GetSym(localx + dx, localy + dy, 2);
            PutSym(num, localx + dx, localy + dy, fc, bc, 1);
            break;
          case num === 250: case num === 249: a = 261; b = 53; c = 15; break;
          case num === 32:
            if (incastle) {
              // nothing
            } else {
              a = 261; b = 53; c = 15;
            }
            break;
          case num === 1:
            if (not(dx | dy)) {
              a = 261; b = 50; c = 3;
            } else {
              d = 257; e = 62; f = 5;
            }
            break;
          case num === gas: a = 157; b = 53; c = 10; break;
          case num === 215: case num === 216: d = 161; e = 53; f = 3;   // web
            [num, fc, bc] = GetSym(localx + dx, localy + dy, 2);
            PutSym(num, localx + dx, localy + dy, fc, bc, 1);
            break;
          case num === monosym: d = 160; e = 58; f = 8; break;
          case num === chasm: d = 279; e = 1; f = 17; break;
          case num === 147: [num, fc, bc] = GetSym(localx + dx, localy + dy, 1);
            switch (fc) {
              case 1: a = 94; b = 44; c = 10; break;    // Mets hat
              case 15: a = 294; b = 25; c = 17; break;  // Skipper's hat
              default: a = 265; b = 56; c = 12;         // Ivana wig
            }
            break;
          case num === 167: a = 266; b = 50; c = 15; break;  // serum
          case num === 18: case num === 29: d = 289; e = 62; f = 3; break;  // map
          case num === 145: a = 296; b = 1; c = 26; break;   // BSshoes
          case num === 234: d = 294; e = 58; f = 10; break;  // Spacesuit
          case num === 225: a = 199; b = 32; c = 11; break;  // roastbeast
          case num === 35:                                   // bamboo raft
            d = 409; e = 54; f = 11; break;
          case num === ul: case num === um: case num === ur: case num === ml: case num === mrt:
          case num === ll: case num === lm: case num === lr: case num === hor: case num === ver:
            d = 172; e = 48; f = 4; break;
          case num === 219:
            if (incastle === -1) {
              a = 268; b = 18; c = 6;
            } else if (incastle === 1) {
              d = 172; e = 48; f = 4;
            }
            break;
          case num === cen: {
            const newx = localx + dx, newy = localy + dy;
            let sy, fc21, fc22, fc23, fc24;
            [sy, fc21] = GetSym(newx + 1, newy, 2); if (sy === 1) fc21 = currf;
            [sy, fc22] = GetSym(newx, newy + 1, 2); if (sy === 1) fc22 = currf;
            [sy, fc23] = GetSym(newx, newy - 1, 2); if (sy === 1) fc23 = currf;
            [sy, fc24] = GetSym(newx - 1, newy, 2); if (sy === 1) fc22 = currf;
            if ((fc21 === 9 && (fc22 === 9 || fc23 === 9)) || (fc24 === 9 && (fc22 === 9 || fc23 === 9))) {
              d = 172; e = 48; f = 4;
            } else {
              d = 231; e = 64; f = 4;
            }
            break;
          }
          case num === lockeddoor: d = 268; e = 24; f = 11; break;
        }
        break;
      case chr$(27): ClearMess(); await DisplayCharacter(); break exam;
      default: continue exam;
    }
    if (c > 0) {
      l2 = c$ + jnk$(a, b, c);
    } else if (f > 0) {
      l2 = d$ + jnk$(d, e, f);
    }
    if (g > 0) { l1 = l2; ljnk(g, h, i, 2); }
    await MessPause(7, 0);
    break;
  }
  // exex:
  PrintMessage(7, 0);
}

// Encumbrance / fatigue rate.
function Fatigu() {
  let fff = 0;
  for (let i = 1; i <= ngoody; i++) {
    if (goody[i][1] < 0) {
      fff = fff + idiv(goody[i][2], 2);
    } else {
      fff = fff + goody[i][2];
    }
  }
  for (let i = 1; i <= npack; i++) fff = fff + idiv(backpack[i][2], 2);
  for (let i = 1; i <= nsafe; i++) fff = fff + idiv(safe[i][2], 2);
  fff = fff - 30 * udder;
  fff = fff - 15 * ((2 + qb(berhpmut > 0)) * qb(pmut === 5 && berpmut === 0));
  fff = fff + 20 * qb(pmut === 10 && berpmut === 0);
  if (str + stradd > -12) {
    fff = cint(fff * 32 / (20 + str + stradd));
  } else {
    fff = cint(fff * Math.abs(str + stradd) / 3);
  }
  return Math.fround(fdiv(fff, (100 - 100 * boots)));
}

// Returns [sym, fcolr, bcolr] of a screen square.  Page 2 is the pag2 array.
function GetSym(col, row, pag) {
  let attr;
  if (pag === 2) {
    attr = pag2[col][row];
  } else {
    attr = cgetsym(col, row, pag);
  }
  return [imod(attr, 256), idiv(attr, 256) % 16, idiv(attr, 4096)];
}

async function Help(i) {
  let d = 0, clr = 0, strtnum = 0, lastnum = 0, a = 0, b = 0, c = 0, e = 0, f = 0, g = 0, h = 0, j = 0;
  switch (i) {
    case 1: case 2:             // ones printed on separate screen
      screenPages(3, vpage); ccls(3);
      switch (i) {
        case 1:   // general dumbness, at start of game
          d = 15; clr = 3; color(11, 0); strtnum = 280; lastnum = 286; break;
        case 2:   // use
          d = 16; clr = 6; color(14, 0); strtnum = 287; lastnum = 294; break;
      }
      for (let num = strtnum; num <= lastnum; num++) {
        st1 = AM6[num];
        locate(7 + num - strtnum, 4); print(st1);
      }
      box(1, 80, 5, d, 1, clr, 3); color(9, 0);
      locate(25, 10); Printjnk(35, 1, 32); screenPages(null, 3); await PauseForKey();
      break;
    case 3: case 4: case 5: case 6: case 7: case 8:   // ones printed on lines 23-25
      b = 1; e = 1; h = 1;
      switch (i) {
        case 3: a = 322; c = 45; d = 323; f = 46; g = 327; j = 34; break;   // eat
        case 4: a = 328; c = 50; d = 329; f = 54; g = 330; j = 47; break;   // throw
        case 5: a = 331; c = 53; d = 332; f = 54; g = 333; j = 46; break;   // eXamine
        case 6: a = 334; c = 52; d = 335; f = 54; g = 336; j = 50; break;   // Unuse
        case 7: a = 337; c = 54; d = 338; f = 54; g = 339; j = 54; break;   // figure
        case 8: a = 344; c = 53; d = 345; f = 52; g = 346; j = 51; break;   // drop
      }
      ljnk(a, b, c, 1); ljnk(d, e, f, 2); ljnk(g, h, j, 3); PrintMessage(13, 0);
      break;
  }
  didstuff = FALSE;
}

// Hunger, fatigue and encumbrance display (right-hand panel).
async function HungFatEnc() {
  let a = 23, b = 0, c = 0, zz = 0;
  hfee: {
    if (hunger < 0) { b = 32; c = 7; }
    else if (hunger <= 1000) { b = 39; c = 9; }
    else if (hunger <= 2000) { b = 44; c = 4; }
    else if (hunger <= 3000) { b = 48; c = 6; }
    else if (hunger <= 4000) { a = 392; b = 50; c = 11; }
    else if (hunger <= 5000) { b = 54; c = 8; }
    else if (hunger <= 6000) { a = 25; b = 1; c = 8; }
    else { st1 = jnk$(25, 12, 10); hits = -hitmax - 1; hunger = 5000; await Dead(0); break hfee; }
    locate(13, 64); color(9, 0); Printjnk(a, b, c); print(space$(11 - c));

    stradd = 0;
    zz = cint(fix(fatigue)); a = 26;
    if (zz < -2) { a = 18; b = 56; c = 5; stradd = 1; }
    else if (zz <= 20) { b = 11; c = 11; }
    else if (zz <= 60) { b = 16; c = 6; }
    else if (zz <= 100) { b = 6; c = 5; stradd = -1; }
    else if (zz <= 140) { a = 390; b = 30; c = 10; stradd = -2; }
    else if (zz <= 180) { b = 22; c = 6; stradd = -3; }
    else if (zz <= 240) { b = 28; c = 9; stradd = -4; }
    else { b = 1; c = 10; stradd = -5; }
    locate(3, 65); print(str + stradd);
    locate(14, 65); Printjnk(a, b, c); print(space$(11 - c));

    dexadd = 0;
    zz = cint(fatig * 100);
    if (zz < 30) { b = 22; c = 3; dexadd = 1; }
    else if (zz < 80) { b = 25; c = 10; }
    else if (zz < 160) { b = 30; c = 5; }
    else if (zz < 250) { b = 35; c = 8; dexadd = -1; }
    else if (zz < 370) { b = 48; c = 5; dexadd = -2; }
    else if (zz < 500) { b = 43; c = 10; dexadd = -3; }
    else { b = 53; c = 10; dexadd = -5; }
    color(9); locate(4, 66); print(dex + dexadd);
    locate(15, 70); Printjnk(25, b, c); print(space$(10 - c));

    if (berhpmut > 0) color(13);
    locate(20, 54); if (pmutturns > 0) print(pmutturns); else print(' * ');
    print(pmutn$, bl);
    if (pmut === 17) { if (tentgrab) print(' grabbed'); else print(space$(8)); }
    if (berhmmut > 0) color(13); else color(9);
    locate(21, 54); if (mmutturns > 0) print(mmutturns); else print(' * ');
    print(mmutn$, bl);
    if (mmut === 7) { if (forcefield) print(' on'); else print(' off'); }
  }
  SetCombatStats();
}

async function Initialize() {
  const iber = dimInt([0, nberry]);
  let x = 0, gotna = FALSE, gotsy = FALSE, gotco = FALSE;
  randomize(timer() + seed);
  x = cint(rnd(-seed)); crandomize(seed);
  mainx = 21 + cRoll(9); mainy = 8 + cRoll(5);
  localx = 21 + cRoll(9); localy = 8 + cRoll(5);

  gt = 480; ripehrs = 12;

  // CLOSE #1: OPEN "alphaman.3" FOR BINARY AS #1
  let nstuff = nwep + nrwep + nsh + narm;
  nstuff = nstuff + nssd + ntechwep + nstrash + nlsd + nltrash;
  // GET #1, 6 * nstuff - 1, i  (then read on sequentially)
  let p = 3 * nstuff - 1;
  p++;
  const get = () => ALPHA3[p++];
  for (let i = 1; i <= 10; i++) for (let j = 1; j <= 3; j++) symb[i][j] = get();

  for (let i = 1; i <= nwep + nrwep; i++) for (let j = 1; j <= 6; j++) wep[i][j] = get();

  for (let i = 1; i <= nsh; i++) { sh[i][1] = get(); sh[i][2] = get(); }

  for (let i = 1; i <= narm; i++) { arm[i][1] = get(); arm[i][2] = get(); }

  for (let i = 1; i <= nberry; i++) {
    let renameber;
    do {    // rber:
      renameber = FALSE;
      iber[i] = cRoll(22) * 100 + cRoll(22);
      for (let j = 1; j <= i - 1; j++) {
        if (iber[i] === iber[j]) { renameber = TRUE; break; }
      }
    } while (renameber);
    berry$[i] = jnk$(41, idiv(iber[i], 100) * 3 - 2, 3) + jnk$(42, imod(iber[i], 100) * 3 - 2, 3);
    berord[i] = i;
  }
  berry$[0] = jnk$(157, 63, 6); berord[0] = 0; iber[0] = 0;
  for (let i = 0; i <= nberry - 1; i++) {
    for (let j = i + 1; j <= nberry; j++) {
      if (iber[berord[i]] > iber[berord[j]]) { const t = berord[i]; berord[i] = berord[j]; berord[j] = t; }
    }
  }

  for (let i = 1; i <= nssd; i++) {
    ssdtyp[i] = get(); for (let j = 1; j <= 3; j++) ssd[i][j] = get();
    ssd[i][9] = get();
  }
  for (let i = nssd + 1; i <= nssd + ntechwep; i++) {
    ssdtyp[i] = get(); for (let j = 1; j <= 9; j++) ssd[i][j] = get();
  }
  for (let i = nssd + ntechwep + 1; i <= nssd + ntechwep + nstrash; i++) {
    ssdtyp[i] = get(); for (let j = 1; j <= 3; j++) ssd[i][j] = get();
    ssd[i][9] = get();
  }

  for (let i = 1; i <= nlsd + nltrash; i++) {
    lsdtyp[i] = get(); for (let j = 1; j <= 4; j++) lsd[i][j] = get();
  }

  elvislevel = 4 * (2 * int(rnd() * 2) - 1);
  grinchlevel = 5 * (2 * int(rnd() * 2) - 1);

  qbClose(2); qbOpen(2, 'alphaman.def', 'APPEND'); qbClose(2);
  const f2 = qbOpen(2, 'alphaman.def', 'INPUT');
  while (!f2.eof()) {
    st1 = f2.lineInput();
    switch (left$(st1, 6)) {
      case 'WIMPNA':
        wimpname$ = rtrim$(right$(st1, len(st1) - 9)); gotna = TRUE; break;
      case 'WIMPSY':
        wimpsym = asc(right$(rtrim$(st1), 1)); gotsy = TRUE; break;
      case 'WIMPCO':
        wimpcolr = val(right$(rtrim$(st1), 2)); gotco = TRUE; break;
    }
  }
  if (!(gotna && gotsy && gotco)) {
    await define();
  } else {
    if (ltrim$(rtrim$(wimpname$)) === '') wimpname$ = 'Wolverine';
    const wsym$ = chr$(wimpsym);
    if (ucase$(wsym$) < 'A' || ucase$(wsym$) > 'Z') wimpsym = 77;
    if (wimpcolr < 0 || wimpcolr > 15 || wimpcolr === wallcolr) wimpcolr = 1;
  }
  qbClose(2);
}

function Insect(num) {
  switch (ncre[num][1]) {
    case centi: case ant: case japb: case mant: case bee: case roach: case tara: case dung: case mosq:
    case dfly: case scor: case term: case moth: case quayle: case magg: case wspid: case bwid:
    case trump: case tick: case stink: case webspid: case bbeet: case locust: case brecl: case gwasp:
      return TRUE;
  }
  return FALSE;
}

async function IntroScreen() {
  const locandpr = (a, b, c, d, e) => { locate(a, b); Printjnk(c, d, e); };
  let t1 = 0, t2 = 0, a = 0, b = 0, c = 0, d$ = '';
  ccls(0); ccls(1); screenPages(0, 1);
  box(1, 80, 1, 25, 2, 5, 0);
  box(20, 61, 4, 8, 1, 2, 0);
  box(25, 56, 9, 14, 1, 1, 0);

  color(10, 0); locandpr(5, 22, 27, 1, 38);
  locandpr(6, 26, 276, 29, 30);
  locandpr(7, 25, 277, 1, 32);
  color(9); locandpr(10, 33, 277, 33, 16);
  locandpr(11, 29, 27, 39, 24);
  locandpr(12, 28, 28, 1, 26);
  locandpr(13, 33, 419, 1, 16);

  color(13); locandpr(16, 24, 156, 1, 34);
  locandpr(18, 24, 28, 27, 30);
  t1 = timer(); screenPages(0); DumpBuffer(); color(13);
  if (name$ === '') name$ = await lineInput('', true);
  t2 = timer(); if (t2 < t1) t2 = t2 + 86400;
  seed = 5 * t2 - 4 * t1;
  while (seed > 1000) seed = seed / 2;
  randomize(seed); crandomize(seed); rnd(-seed);
  if (name$ === '' || ucase$(left$(name$, 8)) === 'ALPHAMAN') {
    // nam:
    switch (cRoll(7)) {
      case 1: a = 29; b = 1; c = 11; break;
      case 2: a = 29; b = 12; c = 11; break;
      case 3: a = 29; b = 23; c = 12; break;
      case 4: a = 29; b = 35; c = 15; break;
      case 5: a = 29; b = 50; c = 13; break;
      case 6: a = 26; b = 37; c = 15; break;
      default: a = 26; b = 52; c = 13;
    }
    name$ = jnk$(a, b, c);
  }
  name$ = rtrim$(left$(ltrim$(name$), 20));
  locate(18, 54); print(space$(24)); locate(18, 54); println(name$);
  color(10); locandpr(20, 29, 279, 40, 23);
  color(2); locandpr(21, 29, 280, 1, 25);
  locandpr(22, 29, 280, 26, 21);
  locandpr(23, 29, 280, 47, 12);
  locate(20, 53); GameWait.number(); d$ = await lineInput('', true); difficulty = val(d$);
  if (difficulty === 1) {
    difficulty = moderateplay;
  } else if (difficulty > 1) {
    difficulty = easyplay;
  } else {
    difficulty = hardplay;
  }
  for (let i = 20; i <= 23; i++) { locate(i, 29); print(space$(35)); }
}

function KillBadMaps(mode) {
  // mode=-1: removes all name$ saved map
  // mode=0:  removes all temporary saved maps
  // mode=1:  removes all castle levels not belonging to current castle
  let filout$;
  if (mode === -1) {
    filout$ = CheckFil(left$(rtrim$(ltrim$(name$)), 8));
    filout$ = filout$ + '.sav';
    qbClose(2); qbOpen(2, filout$, 'APPEND');   // to create file
    qbClose(2); qbKill(filout$);
    return;
  }

  for (let cl = -9 - 2 * qb(mode === 1); cl <= 7; cl++) {
    let getridoffile = FALSE;
    filout$ = 'deleteme.' + ltrim$(str$(cl + 8));

    qbClose(2); const f2 = qbOpen(2, filout$, 'BINARY');

    if (mode === 1) {
      if (f2.lof() === 0) {
        getridoffile = TRUE;    // file didn't exist
      } else {
        f2.getSingle();                                   // zzgt!
        const zzmainx = f2.getInt(), zzmainy = f2.getInt();
        if (mainx !== zzmainx || mainy !== zzmainy) getridoffile = TRUE;
      }
    } else {
      getridoffile = TRUE;
    }

    // loopkbm:
    qbClose(2); if (getridoffile) qbKill(filout$);
  }
}

function Kolr$(i) {
  let b, c;
  switch (i) {
    case 1: b = 1; c = 4; break;
    case 2: b = 5; c = 7; break;
    case 3: b = 12; c = 7; break;
    case 4: b = 19; c = 6; break;
    case 5: b = 25; c = 5; break;
    default: b = 30; c = 7;
  }
  return jnk$(-2, b, c);
}

function ljnk(a, b, c, i) {
  st1 = jnk$(a, b, c);
  switch (i) {
    case 1: l1 = st1; break;
    case 2: l2 = st1; break;
    case 3: l3 = st1; break;
    case 4: s$ = st1; t$ = Terr$(terrain); break;
  }
}

function Ljnkbig(a, b, c, d, e, f, a$, n, i) {
  let j1$ = '', j2$ = '';
  if (c > 0) j1$ = jnk$(a, b, c);
  if (f > 0) j2$ = jnk$(d, e, f);
  switch (n) {
    case 0: j1$ = a$ + j1$ + j2$; break;
    case 1: j1$ = j1$ + a$ + j2$; break;
    default: j1$ = j1$ + j2$ + a$;
  }
  switch (i) {
    case 1: l1 = j1$; break;
    case 2: l2 = j1$; break;
    default: l3 = j1$;
  }
}

async function LoadGame(comm$) {
  let filin$ = CheckFil(comm$); filin$ = filin$ + '.alf';
  const f2 = qbOpen(2, filin$, 'BINARY');
  if (f2.lof() === 0) {      // doesn't exist
    qbClose(2); qbKill(filin$);
    Ljnkbig(204, 1, 15, 0, 0, 0, ucase$(filin$), 0, 1);
    PrintMessage(12, 0);
    return FALSE;
  }
  ccls(0); locate(12, 20); print('Loading game ');

  const vdate = f2.getLong();
  if (vdate !== versiondate) {
    locate(14, 20); print('Saved file is out of date');
    await PauseForKey();
    end();
  }

  let lll = f2.getInt(); name$ = f2.getString(lll);
  print('.');
  ngoody = f2.getInt(); npack = f2.getInt(); ndropped = f2.getInt(); nsafe = f2.getInt();
  for (let i = 1; i <= ngoody; i++) {
    lll = f2.getInt(); gdy[i] = f2.getString(lll);
  }
  print('.');
  for (let i = 1; i <= npack; i++) {
    lll = f2.getInt(); bakpak[i] = f2.getString(lll);
  }
  for (let i = 1; i <= ndropped; i++) {
    lll = f2.getInt(); drgdy[i] = f2.getString(lll);
  }
  for (let i = 1; i <= nsafe; i++) {
    lll = f2.getInt(); saf[i] = f2.getString(lll);
  }
  for (let i = 0; i <= 40; i++) berry$[i] = f2.getString(6);

  for (let i = 1; i <= ngoody; i++) for (let j = 1; j <= 12; j++) goody[i][j] = f2.getInt();
  for (let i = 1; i <= npack; i++) for (let j = 1; j <= 12; j++) backpack[i][j] = f2.getInt();
  for (let i = 1; i <= ndropped; i++) for (let j = 1; j <= 16; j++) drgoody[i][j] = f2.getInt();
  for (let i = 1; i <= nsafe; i++) for (let j = 1; j <= 12; j++) safe[i][j] = f2.getInt();
  print('.');
  nnear = f2.getInt();
  for (let i = 1; i <= nnear; i++) for (let j = 1; j <= 15; j++) ncre[i][j] = f2.getInt();
  for (let i = 0; i <= 40; i++) { berord[i] = f2.getInt(); knownb[i] = f2.getInt(); }
  print('.');
  for (let i = 2; i <= 51; i++) for (let j = 2; j <= 21; j++) goodythere[i][j] = f2.getInt();
  print('.');
  for (let i = 0; i <= 6; i++) for (let j = -10; j <= 10; j++) goodycastle[i][j] = f2.getInt();
  for (let i = 1; i <= 20; i++) for (let j = 1; j <= 3; j++) localgoody[i][j] = f2.getInt();
  for (let i = 1; i <= 10; i++) for (let j = 1; j <= 3; j++) radzone[i][j] = f2.getInt();
  for (let i = 1; i <= 80; i++) ssdknown[i] = f2.getInt();
  for (let i = 1; i <= 40; i++) lsdknown[i] = f2.getInt();
  for (let i = -10; i <= 10; i++) xstairs[i] = f2.getInt();
  for (let i = -10; i <= 10; i++) ystairs[i] = f2.getInt();
  for (let i = 1; i <= 10; i++) for (let j = 1; j <= 3; j++) monozone[i][j] = f2.getInt();
  print('.');
  const I = () => f2.getInt();
  str = I(); stradd = I(); dex = I(); dexadd = I();
  con = I(); rr = I(); mr = I(); intl = I();
  hitmax = I(); hits = I(); hunger = I(); fatigue = f2.getSingle();
  expr = f2.getLong(); lvl = I(); pmut = I(); mmut = I();
  pmutn$ = pmutnm$(pmut); mmutn$ = mmutnm$(mmut);
  radsuit = I(); heatsuit = I(); reflecsuit = I();
  flashlight = I(); gasmask = I(); sunglasses = I();
  wetsuit = I(); mask = I(); boots = I();
  pmutturns = I(); mmutturns = I(); inwater = I();
  waterturns = I(); inpit = I(); zippy = I();
  wpturns = I(); seed = f2.getSingle(); vpage = I();
  mainx = I(); mainy = I(); localx = I();
  localy = I(); terrain = I(); terrf = I();
  terrb = I(); currsym = I(); currf = I();
  currb = I(); ncastle = I(); nruins = I();
  castle = I(); castlelevel = I(); incastle = I();
  I();   // dum
  lwall = I(); rwall = I(); twall = I(); bwall = I();
  lwscr = I(); rwscr = I(); twscr = I();
  bwscr = I(); dots = I(); xenter = I();
  yenter = I(); xenterscr = I(); yenterscr = I();
  enterdir = I(); bitit = I(); berstr = I();
  print('.');
  berdex = I(); bercon = I(); berrr = I();
  bermr = I(); berintl = I();
  berac = I(); berpmut = I(); bermmut = I();
  berconfuse = I(); berdet = I(); berblind = I();
  berhic = I(); brandy = I(); berscare = I();
  strtox = I(); dextox = I(); contox = I();
  berrambo = I(); weather = I(); wind = I();
  gt = f2.getSingle(); rside = I(); roachdef = I();
  radint = I(); armor = I(); shield = I();
  dark = I(); grabbed = I(); vehicle = I(); confu = I();
  hittox = I(); asleep = I(); sunscreen = I();
  invisible = I(); udder = I(); flare = I();
  coffee = I(); tapenum = I(); berfresh = I();
  elvislevel = I(); grinchlevel = I(); grinchzone = I();
  serum = f2.getSingle(); map = I(); bsshoes = I();
  spacesuit = I(); bergreen = I(); berklutz = I();
  klutzdex = I(); berregen = I(); beryum = I();
  camosuit = I(); pinsuit = I(); notoxin = I();
  other2hitc = I(); other2hitr = I(); otherdam = I();
  tapeworm = I(); turbo = f2.getSingle(); bulletsuit = I();
  xmono = I(); ymono = I(); mononum = I();
  inweb = I(); ffgen = I(); inglue = I();
  inbog = I(); insand = I(); hail = I();
  tent = I(); berff = I(); berhpmut = I(); berhmmut = I();
  tentgrab = I(); metshat = I(); grinchstole = f2.getLong();
  mindweb = I(); repulse = I(); ripehrs = I();
  spore = I(); answer = I(); skinac = I();
  starting = I(); difficulty = I(); finishedcastles = I();
  uvhelmet = I(); neutronsuit = I();
  for (let i = 1; i <= 4; i++) I();   // dum
  print('.');
  const l = f2.getInt(); ber$ = space$(l);
  for (let j = 1; j <= l; j++) { const n$ = f2.getString(1); ber$ = midSet(ber$, j, 1, n$); }
  screenPages(0);      // SCREEN , , 1, 0
  for (let i = 2; i <= 51; i++) {
    for (let j = 2; j <= 21; j++) {
      const sss = f2.getInt(); const sym = imod(sss, 256);
      const fc = imod(idiv(sss, 256), 16), bc = idiv(sss, 4096);
      PutSym(sym, i, j, fc, bc, 1);
    }
    if (i === 25) print('.');
  }
  print('.');
  for (let i = 2; i <= 51; i++) for (let j = 2; j <= 21; j++) pag2[i][j] = f2.getInt();
  print('.');
  vpage = 0;
  RestoreNameToMaps();    // restore name$ files to "deleteme"

  qbClose(2);

  ClearMess();
  ljnk(93, 1, 12, 2); PrintMessage(5, 0);

  return TRUE;
}

// Temp map file name for SaveMaps / LoadMaps: "deleteme." + ending, where
// ending was a STRING * 3 (DOS ignores the trailing blanks).
function mapFileName(mode) {
  let ending = '';
  switch (mode) {
    case 0: ending = '0 '; break;
    case 1: ending = '-1'; break;
    case -1: ending = ltrim$(str$(castlelevel + 8)); break;
  }
  return 'deleteme.' + fixstr(ending, 3);
}

async function LoadMaps(mode) {
  // loads current stuff (critters, dropped items) for later retrieval
  // mode=0  is loading outdoor stuff                (deleteme.0)
  // mode=1  is loading a lair                       (deleteme.-1)
  // mode=-1 is loading the current castle level     (deleteme.n)
  // returns deltaTime (as an integer representing hours passed)
  //     if successfully loaded, 0 if not
  let LoadMapVal = 0;
  const filout$ = mapFileName(mode);

  qbClose(2); const f2 = qbOpen(2, filout$, 'BINARY');
  if (f2.lof() === 0) {                  // file didn't exist, so return 0
    qbClose(2); qbKill(filout$); return 0;
  }

  const zzgt = f2.getSingle();   // so I know how many changes to make later
  const zzmainx = f2.getInt(), zzmainy = f2.getInt();
  if (mainx !== zzmainx || mainy !== zzmainy) {
    qbClose(2); return 0;
  }

  LoadMapVal = cint(int(gt - zzgt) / 60 + 1);
  if (LoadMapVal < 1) LoadMapVal = 1;

  localx = f2.getInt(); localy = f2.getInt();

  currsym = f2.getInt(); currf = f2.getInt();

  ndropped = f2.getInt();
  for (let i = 1; i <= ndropped; i++) {
    const lll = f2.getInt(); drgdy[i] = f2.getString(lll);
  }
  for (let i = 1; i <= ndropped; i++) for (let j = 1; j <= 16; j++) drgoody[i][j] = f2.getInt();

  for (let i = 1; i <= 20; i++) for (let j = 1; j <= 3; j++) localgoody[i][j] = f2.getInt();

  nnear = f2.getInt();
  for (let i = 1; i <= nnear; i++) for (let j = 1; j <= 15; j++) ncre[i][j] = f2.getInt();

  for (let i = 2; i <= 51; i++) {
    for (let j = 2; j <= 21; j++) {
      const sss = f2.getInt(); const sym = imod(sss, 256);
      const fc = imod(idiv(sss, 256), 16), bc = idiv(sss, 4096);
      PutSym(sym, i, j, fc, bc, 1);
    }
  }
  for (let i = 2; i <= 51; i++) for (let j = 2; j <= 21; j++) pag2[i][j] = f2.getInt();

  bldg = f2.getInt(); castle = f2.getInt(); castlelevel = f2.getInt(); mononum = f2.getInt();
  lwall = f2.getInt(); rwall = f2.getInt(); twall = f2.getInt(); bwall = f2.getInt();
  lwscr = f2.getInt(); rwscr = f2.getInt(); twscr = f2.getInt(); bwscr = f2.getInt();
  dots = f2.getInt(); xenter = f2.getInt(); yenter = f2.getInt();
  xenterscr = f2.getInt(); yenterscr = f2.getInt(); enterdir = f2.getInt();

  switch (mode) {
    case 0:    // outdoors
      goodythere[mainx][mainy] = f2.getInt(); break;
    case 1:    // lair
      goodycastle[0][0] = f2.getInt(); break;
    case -1:   // castle level
      goodycastle[castle][castlelevel] = f2.getInt();
      for (let i = -10; i <= 10; i++) { xstairs[i] = f2.getInt(); ystairs[i] = f2.getInt(); }
      break;
  }
  qbClose(2);

  ljnk(63, 1, 12, 4); PrintMessage(7, 0);   // set terrain string
  await DisplayCharacter();

  if (mode === 0) { box(1, 52, 1, 22, 1, 4, 1); box(1, 52, 1, 22, 1, 4, 2); }

  return LoadMapVal;
}

async function MaybeMessPause(fc, bc) {
  if (fastfight) { l3 = bl; PrintMessage(fc, bc); return fc; }
  return await MessPause(fc, bc);
}

// Shows the message lines and waits for space or Esc.  Returns the (possibly
// changed) colour, which the BASIC SUB passed back through its parameter.
async function MessPause(fc, bc) {
  if (not(bitit)) {
    l3 = ''; PrintMessage(fc, bc); if (fc > 15) color(fc % 16, bc);
    for (;;) {    // MesPaws:
      locate(25, 1); Printjnk(35, 1, 32); GameWait.next('continue'); await PauseForKey();
      if (st1 !== bl && st1 !== chr$(27)) {
        fc = ((fc + 8) % 16); if (fc === 0) fc = 7;
        color(fc, bc); locate(23, 1); print(l1);
        locate(24, 1); print(l2); locate(25, 1); print(l3);
        continue;
      }
      break;
    }
    messturn = 4; ClearMess(); PrintMessage(fc % 16, bc);
  }
  return fc;
}

async function PauseForKey() {
  st1 = '';
  st1 = await getKey();
  // DEF SEG = 0: POKE (&H417), PEEK(&H417) MOD 32  (NumLock stays off)
}

function Plant(num) {
  switch (ncre[num][1]) {
    case daff: case zap: case sunf: case wil: case fern: case bush: case cact:
    case lotus: case aspa: case rose: case venus: case svine: case kelp: case pivy:
    case stool: case mush: case dweed: case rweed: case nshade:
      return TRUE;
  }
  return FALSE;
}

// Prints the command list (ALPHAMAN.5) on the printer.
function PrintCommandScreen() {
  ClearMess();
  ljnk(319, 14, 12, 2); PrintMessage(15, 0);
  lprint(jnk$(319, 26, 24)); lprint('');
  const f2 = qbOpen(2, 'alphaman.5', 'INPUT');
  for (let i = 1; i <= 34; i++) {
    st1 = f2.lineInput(); lprint(st1); if ((i === 10 || i === 33)) lprint('');
  }
  qbClose(2);
  lprintFlush();
}

function Printjnk(a, b, c) {
  print(jnk$(a, b, c));
}

function PrintMessage(fcolr, bcolr) {
  if (not(bitit)) {
    color(fcolr, bcolr);
    locate(23, 1); print(l1); locate(24, 1); print(l2); locate(25, 1); print(l3);
    if (l1 !== space$(54) || l2 !== space$(54) || l3 !== space$(54)) {
      lsave[1][lpoint] = l1; lsave[2][lpoint] = l2; lsave[3][lpoint] = l3;
      lpoint = (lpoint + 1) % 11;
    }
    if (s$ !== '') {
      s$ = left$(s$, 25);
      s$ = s$ + space$(13 - len(s$) / 2);
      s$ = space$(25 - len(s$)) + s$;
      color(14, 4); locate(24, 56); print(s$);
    }
    // tt:
    if (t$ !== '') {
      t$ = left$(t$, 25);
      t$ = t$ + space$(13 - len(t$) / 2);
      t$ = space$(25 - len(t$)) + t$;
      locate(25, 56); print(t$);
    }
    // ss:
    messturn = 0;
  }
  color(fcolr, bcolr);
}

// Page 2 is the pag2 array; page -1 means page 1 and page 2.
function PutSym(sym, col, row, fcolr, bcolr, pag) {
  if (col < 1 || col > 80 || row < 1 || row > 25) return;
  if (pag === 2) {
    if (col <= 52 && row <= 22) {
      pag2[col][row] = cint(sym + fcolr * 256 + bcolr * 4096);
    }
  } else if (pag === -1) {
    cputsym(sym, col, row, fcolr, bcolr, 1);
    pag2[col][row] = cint(sym + fcolr * 256 + bcolr * 4096);
  } else {
    cputsym(sym, col, row, fcolr, bcolr, pag);
  }
}

// Unpacks <name>.sav into the temporary "deleteme.N" map files.
function RestoreNameToMaps() {
  let filin$ = CheckFil(left$(rtrim$(ltrim$(name$)), 8));
  filin$ = filin$ + '.sav';
  qbClose(1); const f1 = qbOpen(1, filin$, 'BINARY');
  if (f1.lof() === 0) {
    qbClose(1);   // (the original reopens alphaman.3 as #1 here)
    return;
  }

  const totnum = f1.getInt();

  for (let filnum = 1; filnum <= totnum; filnum++) {
    const endnum = f1.getInt();
    let smode = endnum; if (smode > 1) smode = 1;
    smode = -smode;   // smode=-1 is castle level, smode=1 is lair
    const filout$ = 'deleteme.' + ltrim$(str$(endnum));

    qbClose(2); qbOpen(2, filout$, 'APPEND');   // to create file
    qbClose(2); qbKill(filout$); const f2 = qbOpen(2, filout$, 'BINARY');

    f2.putSingle(f1.getSingle());                           // zzgt!
    const copyInt = () => { const v = f1.getInt(); f2.putInt(v); return v; };
    copyInt(); copyInt();                                     // mainx, mainy
    copyInt(); copyInt();                                     // localx, localy
    copyInt(); copyInt();                                     // currsym, currf

    const zzndropped = copyInt();
    for (let i = 1; i <= zzndropped; i++) {
      const lll = f1.getInt(); const a$ = f1.getString(lll);
      f2.putInt(lll); f2.putString(a$);
    }
    for (let i = 1; i <= zzndropped; i++) for (let j = 1; j <= 16; j++) copyInt();
    for (let i = 1; i <= 20; i++) for (let j = 1; j <= 3; j++) copyInt();

    const zznnear = copyInt();
    for (let i = 1; i <= zznnear; i++) for (let j = 1; j <= 15; j++) copyInt();

    for (let i = 2; i <= 51; i++) for (let j = 2; j <= 21; j++) copyInt();
    for (let i = 2; i <= 51; i++) for (let j = 2; j <= 21; j++) copyInt();

    copyInt(); copyInt(); copyInt(); copyInt();   // bldg, castle, castlelevel, mononum
    copyInt(); copyInt(); copyInt(); copyInt();   // lwall, rwall, twall, bwall
    copyInt(); copyInt(); copyInt(); copyInt();   // lwscr, rwscr, twscr, bwscr
    copyInt(); copyInt(); copyInt();              // dots, xenter, yenter
    copyInt(); copyInt(); copyInt();              // xenterscr, yenterscr, enterdir

    copyInt();                                    // goodycastle
    switch (smode) {
      case -1:   // castle level
        for (let i = -10; i <= 10; i++) { copyInt(); copyInt(); }
        break;
    }
  }
  qbClose(2); qbClose(1);   // (the original reopens alphaman.3 as #1 here)
}

// S(ave) game.
async function Save() {
  let filout$ = CheckFil(left$(rtrim$(ltrim$(name$)), 8));
  filout$ = ucase$(filout$ + '.alf');
  qbClose(2); const f2 = qbOpen(2, filout$, 'BINARY'); ClearMess();
  ljnk(201, 52, 15, 1); Ljnkbig(200, 59, 10, 0, 0, 0, filout$, 1, 2);
  PrintMessage(3, 0);

  f2.putLong(versiondate);

  f2.putInt(len(name$)); f2.putString(name$);
  f2.putInt(ngoody); f2.putInt(npack); f2.putInt(ndropped); f2.putInt(nsafe);
  for (let i = 1; i <= ngoody; i++) { f2.putInt(len(gdy[i])); f2.putString(gdy[i]); }
  for (let i = 1; i <= npack; i++) { f2.putInt(len(bakpak[i])); f2.putString(bakpak[i]); }
  for (let i = 1; i <= ndropped; i++) { f2.putInt(len(drgdy[i])); f2.putString(drgdy[i]); }
  for (let i = 1; i <= nsafe; i++) { f2.putInt(len(saf[i])); f2.putString(saf[i]); }
  for (let i = 0; i <= nberry; i++) f2.putString(berry$[i]);
  for (let i = 1 + nberry; i <= 40; i++) f2.putString(berry$[nberry]);

  for (let i = 1; i <= ngoody; i++) for (let j = 1; j <= 12; j++) f2.putInt(goody[i][j]);
  for (let i = 1; i <= npack; i++) for (let j = 1; j <= 12; j++) f2.putInt(backpack[i][j]);
  for (let i = 1; i <= ndropped; i++) for (let j = 1; j <= 16; j++) f2.putInt(drgoody[i][j]);
  for (let i = 1; i <= nsafe; i++) for (let j = 1; j <= 12; j++) f2.putInt(safe[i][j]);
  f2.putInt(nnear);
  for (let i = 1; i <= nnear; i++) for (let j = 1; j <= 15; j++) f2.putInt(ncre[i][j]);
  for (let i = 0; i <= 40; i++) { f2.putInt(berord[i]); f2.putInt(knownb[i]); }
  for (let i = 2; i <= 51; i++) for (let j = 2; j <= 21; j++) f2.putInt(goodythere[i][j]);
  for (let i = 0; i <= 6; i++) for (let j = -10; j <= 10; j++) f2.putInt(goodycastle[i][j]);
  for (let i = 1; i <= 20; i++) for (let j = 1; j <= 3; j++) f2.putInt(localgoody[i][j]);
  for (let i = 1; i <= 10; i++) for (let j = 1; j <= 3; j++) f2.putInt(radzone[i][j]);
  for (let i = 1; i <= 80; i++) f2.putInt(ssdknown[i]);
  for (let i = 1; i <= 40; i++) f2.putInt(lsdknown[i]);
  for (let i = -10; i <= 10; i++) f2.putInt(xstairs[i]);
  for (let i = -10; i <= 10; i++) f2.putInt(ystairs[i]);
  for (let i = 1; i <= 10; i++) for (let j = 1; j <= 3; j++) f2.putInt(monozone[i][j]);
  const P = (v) => f2.putInt(v);
  P(str); P(stradd); P(dex); P(dexadd);
  P(con); P(rr); P(mr); P(intl);
  P(hitmax); P(hits); P(hunger); f2.putSingle(fatigue);
  f2.putLong(expr); P(lvl); P(pmut); P(mmut);
  P(radsuit); P(heatsuit); P(reflecsuit);
  P(flashlight); P(gasmask); P(sunglasses);
  P(wetsuit); P(mask); P(boots);
  P(pmutturns); P(mmutturns); P(inwater);
  P(waterturns); P(inpit); P(zippy);
  P(wpturns); f2.putSingle(seed); P(vpage);
  P(mainx); P(mainy); P(localx);
  P(localy); P(terrain); P(terrf);
  P(terrb); P(currsym); P(currf);
  P(currb); P(ncastle); P(nruins);
  P(castle); P(castlelevel); P(incastle);
  P(0);   // dum
  P(lwall); P(rwall); P(twall); P(bwall);
  P(lwscr); P(rwscr); P(twscr);
  P(bwscr); P(dots); P(xenter);
  P(yenter); P(xenterscr); P(yenterscr);
  P(enterdir); P(bitit); P(berstr);
  P(berdex); P(bercon); P(berrr);
  P(bermr); P(berintl);
  P(berac); P(berpmut); P(bermmut);
  P(berconfuse); P(berdet); P(berblind);
  P(berhic); P(brandy); P(berscare);
  P(strtox); P(dextox); P(contox);
  P(berrambo); P(weather); P(wind);
  f2.putSingle(gt); P(rside); P(roachdef);
  P(radint); P(armor); P(shield);
  P(dark); P(grabbed); P(vehicle); P(confu);
  P(hittox); P(asleep); P(sunscreen);
  P(invisible); P(udder); P(flare);
  P(coffee); P(tapenum); P(berfresh);
  P(elvislevel); P(grinchlevel); P(grinchzone);
  f2.putSingle(serum); P(map); P(bsshoes);
  P(spacesuit); P(bergreen); P(berklutz);
  P(klutzdex); P(berregen); P(beryum);
  P(camosuit); P(pinsuit); P(notoxin);
  P(other2hitc); P(other2hitr); P(otherdam);
  P(tapeworm); f2.putSingle(turbo); P(bulletsuit);
  P(xmono); P(ymono); P(mononum);
  P(inweb); P(ffgen); P(inglue);
  P(inbog); P(insand); P(hail);
  P(tent); P(berff); P(berhpmut); P(berhmmut);
  P(tentgrab); P(metshat); f2.putLong(grinchstole);
  P(mindweb); P(repulse); P(ripehrs);
  P(spore); P(answer); P(skinac);
  P(starting); P(difficulty); P(finishedcastles);
  P(uvhelmet); P(neutronsuit);
  for (let i = 1; i <= 4; i++) P(0);   // dum
  f2.putInt(len(ber$)); f2.putString(ber$);
  for (let i = 2; i <= 51; i++) {
    for (let j = 2; j <= 21; j++) {
      const [sym, fc, bc] = GetSym(i, j, 1);
      f2.putInt(cint(sym + 256 * fc + 4096 * bc));
    }
  }
  for (let i = 2; i <= 51; i++) for (let j = 2; j <= 21; j++) f2.putInt(pag2[i][j]);

  qbClose(2);
  ClearMess();
  BackupMapsToName();   // save "deleteme" files to name$
  Ljnkbig(289, 32, 30, 0, 0, 0, left$(filout$, len(filout$) - 4), 1, 2);
  ljnk(202, 52, 11, 1); await MessPause(5, 0);
  // (the unused GOSUB getname of the original is omitted)
}

function SaveMaps(mode) {
  // saves current stuff (critters, dropped items) for later retrieval
  // mode=0  is saving outdoor stuff                (deleteme.0)
  // mode=1  is saving a lair                       (deleteme.-1)
  // mode=-1 is saving the current castle level     (deleteme.cl+8)
  const filout$ = mapFileName(mode);

  qbClose(2); qbOpen(2, filout$, 'APPEND');   // to create file
  qbClose(2); qbKill(filout$);
  qbClose(2); const f2 = qbOpen(2, filout$, 'BINARY');

  f2.putSingle(gt);   // so I know how many changes to make later
  f2.putInt(mainx); f2.putInt(mainy);
  f2.putInt(localx); f2.putInt(localy);

  f2.putInt(currsym); f2.putInt(currf);

  f2.putInt(ndropped);
  for (let i = 1; i <= ndropped; i++) { f2.putInt(len(drgdy[i])); f2.putString(drgdy[i]); }
  for (let i = 1; i <= ndropped; i++) for (let j = 1; j <= 16; j++) f2.putInt(drgoody[i][j]);
  for (let i = 1; i <= 20; i++) for (let j = 1; j <= 3; j++) f2.putInt(localgoody[i][j]);

  f2.putInt(nnear);
  for (let i = 1; i <= nnear; i++) {
    EraseCreat(i); for (let j = 1; j <= 15; j++) f2.putInt(ncre[i][j]);
  }

  for (let i = 2; i <= 51; i++) {
    for (let j = 2; j <= 21; j++) {
      const [sym, fc, bc] = GetSym(i, j, 1);
      f2.putInt(cint(sym + 256 * fc + 4096 * bc));
    }
  }
  for (let i = 2; i <= 51; i++) for (let j = 2; j <= 21; j++) f2.putInt(pag2[i][j]);

  f2.putInt(bldg); f2.putInt(castle); f2.putInt(castlelevel); f2.putInt(mononum);
  f2.putInt(lwall); f2.putInt(rwall); f2.putInt(twall); f2.putInt(bwall);
  f2.putInt(lwscr); f2.putInt(rwscr); f2.putInt(twscr); f2.putInt(bwscr);
  f2.putInt(dots); f2.putInt(xenter); f2.putInt(yenter);
  f2.putInt(xenterscr); f2.putInt(yenterscr); f2.putInt(enterdir);

  switch (mode) {
    case 0:    // outdoors
      f2.putInt(goodythere[mainx][mainy]); break;
    case 1:    // lair
      f2.putInt(goodycastle[0][0]); break;
    case -1:   // castle level
      f2.putInt(goodycastle[castle][castlelevel]);
      for (let i = -10; i <= 10; i++) { f2.putInt(xstairs[i]); f2.putInt(ystairs[i]); }
      break;
  }
  qbClose(2);
}

// Lets the player pick an item: returns the item number (1..), -1/-2/-3 for
// the mutations / option 3, -10 for help, 0 for Esc.
async function SelectGoody(num, colr, pak) {
  let nnn, addl, k;
  if (rside || (pak > 0)) DisplayGoodies(pak);
  if (pak === 1) nnn = npack; else if (pak === 2) nnn = nsafe; else nnn = ngoody;
  if (pak) num = 0;
  locate(nnn + 2, 55); print(space$(26));
  locate(nnn + 3, 55); print(space$(26));
  locate(1, 55); print(space$(26));
  l2 = bl; l3 = bl; addl = 2;
  if ((num & 1)) { color(3, 0); locate(nnn + 2, 55); print('1. ', pmutn$); addl = 3; }
  if ((num & 2)) { color(3, 0); locate(nnn + addl, 55); print('2. ', mmutn$); addl = addl + 1; }
  if ((num & 4)) {
    color(27, 0); locate(1, 55); println('3.');
    color(11, 0); locate(1, 58); Printjnk(405, 58, 8);
  }
  PrintMessage(colr, 0);
  for (;;) {   // sg:
    GameWait.next('item', { pak, count: nnn, extras: num }); await PauseForKey(); k = asc(st1);
    switch (k) {
      case 27: num = 0; ClearMess(); return num;
      case 49: if ((num & 1)) { num = -1; return num; } Wrong(); continue;
      case 50: if ((num & 2)) { num = -2; return num; } Wrong(); continue;
      case 51: if ((num & 4)) { num = -3; return num; } Wrong(); continue;
      case 63: num = -10; return num;   // ?
      default: k = k - 96;
        if ((k < 1 || k > nnn)) { Wrong(); continue; }
        num = k; return num;
    }
  }
}

function SmartCre(typ) {
  switch (typ) {
    case wimp: case cb: case mph: case pryor: case pokey: case gumby: case bush: case quayle:
    case icew: case mant: case kong: case rodan: case godz:
    case rdro: case ddro: case sdro: case wdro: case bfoot: case brain:
      return TRUE;
  }
  if (typ > ncreat + creextra + 1) return TRUE;
  return FALSE;
}

function Tasty(num) {
  switch (ncre[num][1]) {
    case aspa: case fish: case mph: case goat: case gcrab: case mush: case chick: case locust: case bunny:
    case sard: case lobstr: case urchin: case squid: case rsnap: case octopus:
      return TRUE;
  }
  return FALSE;
}

function TeleCreat(dx, dy) {
  const ch = badmovecreat(dx, dy, nnear, 0, ncre);
  if (ch > 0) {
    let x = localx, y = localy;
    while ((Math.abs(x - localx) < 2 && Math.abs(y - localy) < 2)) {
      [x, y] = finddot(incastle);
    }
    EraseCreat(ch); if (tentgrab === ch) tentgrab = 0;
    ncre[ch][4] = x - localx; ncre[ch][5] = y - localy;
    ncre[ch][11] = ncre[ch][11] | 1;
    if ((ncre[ch][13] !== 0) && (grabbed > 0)) {
      ncre[ch][13] = 0; grabbed = grabbed - 1;
    }
    PutCreat(ch);
  }
}

// Name of a terrain type (or of the current castle level).
function Terr$(i) {
  let a, b, c;
  st1 = '';
  switch (i) {
    case 15: a = 45; b = 1; c = 12; break;
    case 42: a = 45; b = 13; c = 11; break;
    case 32: a = 45; b = 24; c = 6; break;
    case 176: a = 45; b = 30; c = 5; break;
    case 177: a = 45; b = 35; c = 5; break;
    case 247: a = 45; b = 40; c = 4; break;
    case 234: case 239: case 30: case 94: case 127: case 71: a = 45; b = 44; c = 6; break;
    default: a = 45; b = 50; c = 4;
  }
  if ((incastle === -1)) {
    if (castlelevel === 0) {
      a = 406; b = 25; c = 12; st1 = '';
    } else {
      const caslev = castlelevel - qb(castlelevel > 0);
      if (castle >= 1 && castle <= 6) { a = 84; b = 13; c = 13; st1 = str$(caslev); }
      else { a = 84; b = 1; c = 12; st1 = str$(caslev); }
    }
  } else if ((incastle === 1)) {
    a = 309; b = 12; c = 11;
  }

  return jnk$(a, b, c) + st1;
}

// U(nuse) command.
async function UnUse() {
  let i = 0, a = 0, b = 0, c = 0, k = 0, g$ = '';
  SetCombatStats();
  if (mmut === 7 && forcefield) i = 2; else i = 0;
  ljnk(65, 1, 26, 1); i = await SelectGoody(i, 7, FALSE);
  if (i === 0) { didstuff = FALSE; ClearMess(); PrintMessage(7, 0); return; }
  if (i === -10) { await Help(6); return; }
  a = 0; b = 0; c = 0;
  uud: {
    if (i < 0) {
      // unusemut:
      l3 = bl;
      if (i === -2 && mmut === 7) {
        if (not(forcefield)) { a = 67; b = 1; c = 34; didstuff = FALSE; break uud; }
        forcefield = FALSE; a = 67; b = 35; c = 27; fatadd = 1;
      } else {
        a = 66; b = 45; c = 23; didstuff = FALSE;
      }
      break uud;
    }
    if (berconfuse) i = cRoll(ngoody);
    if (goody[i][1] > 0) {
      ljnk(65, 27, 31, 3); PrintMessage(7, 0); return;
    }
    g$ = gdy[i];
    switch (Math.abs(goody[i][1])) {
      case 1: case 2: case 6: didstuff = FALSE; break;
      case 3: goody[i][1] = 3; b = 1; c = 21; break;
      case 4: armor = 12; goody[i][1] = 4; b = 22; c = 23; break;
      case 5: shield = 6; goody[i][1] = 5; b = 1; c = 21; break;
      case 7:
        if (not(goody[i][10])) {
          a = 77; b = 1; c = 32; didstuff = FALSE; break uud;
        }
        switch (goody[i][11]) {
          case 1:    // flashlight
            fatadd = 1; flashlight = FALSE; goody[i][1] = 7; b = 1; c = 21; break;
          case 2:    // backpack
            if (ngoody > 19) {
              didstuff = FALSE; a = 57; b = 25; c = 29; PrintMessage(2, 8); break uud;
            }
            ljnk(230, 1, 37, 1); k = 0; k = await SelectGoody(k, 14, 1);
            if (k < 1 || k > npack) { didstuff = FALSE; ClearMess(); PrintMessage(7, 0); return; }
            ngoody = ngoody + 1; gdy[ngoody] = bakpak[k];
            for (let j = 1; j <= 12; j++) goody[ngoody][j] = backpack[k][j];
            RemoveGoody(k, 1); if (npack === 0) goody[i][1] = 7;
            fatadd = fatig + 1;
            break;
          case 3:    // gas mask
            fatadd = 2; gasmask = FALSE; goody[i][1] = 7; b = 22; c = 23; break;
          case 10:   // tip mask
            fatadd = 1; mask = FALSE; goody[i][1] = 7; b = 22; c = 23;
            if (berscare === 0) {
              for (let id = 1; id <= nnear; id++) ncre[id][6] = Math.abs(ncre[id][6]);
            }
            break;
          case 11:   // boots
            boots = FALSE; fatadd = fatig; goody[i][1] = 7; b = 22; c = 23; break;
          case 13:   // ffgen
            fatadd = 1; ffgen = FALSE; goody[i][1] = 7; b = 1; c = 21; break;
          case 37:    // uv helmet
            fatadd = 2; uvhelmet = FALSE; goody[i][1] = 7; b = 22; c = 23; break;
          case nssd + ntechwep + 2:   // sunglas
            fatadd = 1; sunglasses = FALSE; goody[i][1] = 7; b = 22; c = 23; break;
          default: a = 66; b = 45; c = 23; didstuff = FALSE;
        }
        break;
      case 8:
        if (not(goody[i][10])) {
          a = 77; b = 1; c = 32; didstuff = FALSE; break uud;
        }
        b = 22; c = 23; goody[i][1] = 8;
        switch (goody[i][11]) {
          case 1: fatadd = 6; radsuit = FALSE; break;
          case 2: fatadd = 8; heatsuit = FALSE; break;
          case 3: fatadd = 3; reflecsuit = FALSE; break;
          case 4: case 12: case 13: case 15: case 16:  // hover,golf,pogo,kay,rubraft
            b = 1; c = 21; vehicle = 0; turbo = 1; fatadd = fatig + 2; break;
          case 7: fatadd = 6; wetsuit = FALSE; break;
          case 8:
            if (ngoody > 19) {
              didstuff = FALSE; a = 57; b = 25; c = 29; goody[i][1] = -8;
              PrintMessage(2, 8); break uud;
            }
            ljnk(361, 1, 33, 1); k = 0; k = await SelectGoody(k, 14, 2);
            if (k < 1 || k > nsafe) { didstuff = FALSE; ClearMess(); PrintMessage(7, 0); goody[i][1] = -8; return; }
            ngoody = ngoody + 1; gdy[ngoody] = saf[k];
            for (let j = 1; j <= 12; j++) goody[ngoody][j] = safe[k][j];
            RemoveGoody(k, 2);
            if (nsafe > 0) goody[i][1] = -8;
            fatadd = fatig + 1; a = 0; c = 0; l2 = bl;
            break;
          case 18: fatadd = 5; camosuit = FALSE; break;
          case 19: fatadd = 4; pinsuit = FALSE; break;
          case 20: fatadd = 5; bulletsuit = FALSE; break;
          case 21: fatadd = 1; repulse = FALSE; b = 1; c = 21; break;
          case 25: fatadd = 6; neutronsuit = FALSE; break;
          default: a = 66; b = 45; c = 23; didstuff = FALSE;
        }
        break;
      case 9:
        goody[i][1] = 9; b = 22; c = 23;
        switch (goody[i][3]) {
          case 4: fatadd = 3; bsshoes = FALSE; break;
          case 5: fatadd = 10; spacesuit = FALSE; break;
          case 7: b = 1; c = 21; goody[i][1] = 9;
            vehicle = 0; turbo = 1; fatadd = fatig + 2; break;
          case 8: metshat = FALSE; break;
          case 9: mr = mr - 15; intl = intl + 15; str = str + 5; dex = dex + 5; break;
          default: didstuff = FALSE; c = 0;
        }
        break;
      default: didstuff = FALSE;
    }
  }
  // uud:
  if (a > 0) {
    ljnk(a, b, c, 2);
  } else if (c > 0) {
    Ljnkbig(66, b, c, 0, 0, 0, g$, 1, 2);
  }
  l1 = bl; l3 = bl; PrintMessage(7, 0); fatig = Fatigu(); await HungFatEnc();
}

function UnYooz(numb, i) {
  for (let j = 1; j <= ngoody; j++) {
    if (j !== i && (goody[j][1] === -numb)) goody[j][1] = numb;
  }
}

function Wrong() {
  ljnk(46, 1, 44, 3);
  PrintMessage(7, 0);
}

function Yuck(num) {
  switch (ncre[num][1]) {
    case mold: case rotf: case slime: case ooze: case pmold: case blob: case quayle: case ghart:
    case stool: case mush: case tworm: case jelly: case saddam: case gworm: case efung: case gmold:
    case puff: case bogh:
      return TRUE;
  }
  return FALSE;
}

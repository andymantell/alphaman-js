// Port of A1.BAS: the main program (start-up and the main command loop) and
// the u(se) command.
//
// Copyright (c) 1995 Jeffrey R. Olson (MIT license, see LICENSE)
'use strict';

// The main module.  Comm$ is the DOS command line ("alphaman somename"),
// taken from the page URL.
async function AlphaMan(commandLine) {
  let Comm$ = commandLine;
  // Module-level variables of A1.BAS (reset by CLEAR).
  let firsttime = 0, x = 0, supr = 0, firstlocal = 0, response = 0, respsave1 = 0, respsave2 = 0;
  let month = 0, days = 0, hrs = 0, mins = 0, gt$ = '', a = 0, b = 0, c = 0, t = 0, a$ = '';
  let chan = 0, typ = 0, sym = 0, fc = 0, bc = 0, res60 = 0, dotrap = 0, dic = 0, dam = 0;
  let oldfatadd = 0, fastfightlocal = 0;

  const ToLC = () => {
    let firstletter = TRUE;
    for (let ii = 1; ii <= len(Comm$); ii++) {
      const aa = asc(mid$(Comm$, ii, 1));
      if (aa >= 65 && aa <= 90) {
        if (not(firstletter)) Comm$ = midSet(Comm$, ii, 1, lcase$(chr$(aa)));
        firstletter = FALSE;
      } else if (aa === 32) firstletter = TRUE;
      else firstletter = FALSE;
    }
  };

  verytop: for (;;) {
    ccls(0); ccls(1); ccls(3); clpage2(); locate(null, null, 0); screenPages(0);
    st1 = 'alphaman.'; qbClose();
    // (The check that ALPHAMAN.1 - ALPHAMAN.4 exist is not needed: the data
    // is built in.)
    // DEF SEG = 0: POKE (&H417), PEEK(&H417) AND 15   (NumLock off)

    color(11, 0); locate(10, 20); print('Loading data ');
    GetTextArray();

    firsttime = TRUE; name$ = '';

    newgame: for (;;) {
      if (Comm$ === '') await IntroScreen();
      if (firsttime) await Initialize();

      vpage = 0;
      if (Comm$ === '') {
        randomize(seed); x = cint(rnd(-seed)); crandomize(seed);
        supr = qb(ucase$(name$) === ucase$(jnk$(277, 20, 13)));    // true or false
        MakeCharacter(supr); EquipCharacter(supr);

        locate(21, 27); color(9, 0); Printjnk(321, 1, 27); await PauseForKey();
        if (ucase$(st1) === 'Y') {
          ccls(0); await Help(1); screenPages(0, 0);
          didstuff = FALSE; MakeCommandScreen();
          screenPages(null, 3); await PauseForKey();
          if (ucase$(st1) === 'P') PrintCommandScreen();
          screenPages(vpage); ClearMess(); PrintMessage(1, 0);
        }

        castlelevel = 0; incastle = 0;
        weather = rolldice(3, 2, 1); wind = rolldice(4, 2, 1);
        weather = 4 - weather; wind = 5 - wind;
        firstlocal = TRUE; starting = -1; answer = TRUE;
        ccls(0); rdisp = 1; fatig = Fatigu(); await DisplayCharacter(); MainMap(FALSE);
      } else {
        if (await LoadGame(Comm$)) {
          firstlocal = FALSE;
          randomize(seed); x = cint(rnd(-seed)); crandomize(seed);
          ccls(0); rdisp = 1; fatig = Fatigu(); await DisplayCharacter(); MainMap(TRUE);
        } else {
          firsttime = FALSE;
          ToLC(); name$ = Comm$; Comm$ = ''; continue newgame;
        }
      }
      break;
    }
    if (GameHooks.fastFightOn()) fastfightlocal = TRUE;   // touch controls only
    if (incastle === 0) { await DetailedMap(FALSE); firstlocal = FALSE; }
    if (Comm$ !== '') await DisplayCharacter();
    didstuff = TRUE;   // for first weather check

    mainloop: for (;;) {    // Main Loop of program ==========================
      await yieldToBrowser();
      fatig = Fatigu(); fastfight = fastfightlocal;
      if (bitit) {
        ccls(0); ccls(1); ccls(3); clpage2(); screenPages(0);
        if (bitit < 0) {
          color(13); locate(10, 25); Printjnk(170, 41, 27); await PauseForKey();
          color(2); locate(13, 25); Printjnk(273, 23, 34);
          color(10); locate(12, 25); Printjnk(273, 1, 22);
          if (ucase$(st1) === 'Y') {
            // CLEAR , , 10000
            qbClose(); resetState();
            firsttime = 0; x = 0; supr = 0; firstlocal = 0; response = 0; respsave1 = 0; respsave2 = 0;
            month = 0; days = 0; hrs = 0; mins = 0; gt$ = ''; a = 0; b = 0; c = 0; t = 0; a$ = '';
            chan = 0; typ = 0; sym = 0; fc = 0; bc = 0; res60 = 0; dotrap = 0; dic = 0; dam = 0;
            oldfatadd = 0; fastfightlocal = 0;
            Comm$ = (await GameHooks.newGame()) ? '' : await inputString(' ');   // touch: a new character
            ccls(0); continue verytop;
          }
        }
        await EndScreen(1); ccls(0); end();
      }

      messturn = messturn + 1;
      if (messturn > 5) {
        messturn = 0;
        month = imod(idiv(int(gt), 17280) + 9, 12); moon = imod(idiv(int(gt), 5220) + 1, 8);
        days = idiv(int(gt), 1440); hrs = imod(idiv(int(gt), 60), 24);
        mins = imod(int(gt), 60); gt$ = right$(str$(mins), 2);
        if (mins < 10) gt$ = midSet(gt$, 1, 1, chr$(48));
        gt$ = ltrim$(right$(str$(hrs), 2)) + chr$(58) + gt$;
        if (mins === 0 && didstuff) {
          weather = rolldice(3, 2, 1); wind = rolldice(4, 2, 1);
          weather = 4 - weather; wind = 5 - wind;
          if (weather === 3 && cRoll(50) === 1) hail = TRUE; else hail = FALSE;
        }
        a = 333; b = 55; c = 8;
        switch (month) {
          case 1: b = 47; c = 7; break;
          case 2: b = 54; break;
          case 3: a = 334; b = 54; c = 5; break;
          case 4: a = 335; b = 64; c = 5; break;
          case 5: a = 337; b = 62; c = 3; break;
          case 6: a = 334; b = 59; c = 4; break;
          case 7: a = 337; b = 65; c = 4; break;
          case 8: a = 334; b = 63; c = 6; break;
          case 9: a = 335; c = 9; break;
          case 10: b = 62; break;
          case 11: a = 338; break;
          default: a = 339;
        }
        gt$ = jnk$(342, 57, 11) + rtrim$(gt$) + bl + jnk$(a, b, c) + str$(days + 1);
        t = imod(gt, 1440);
        if ((t < 440 || t > 1200) && incastle === 0) {
          switch (moon) {
            case 3: a = 338; b = 63; c = 3; break;
            case 2: case 4: a = 341; b = 62; c = 7; break;
            case 1: case 5: a = 339; b = 63; c = 4; break;
            case 0: case 6: a = 343; b = 54; c = 7; break;
            default: a = 373; b = 23; c = 3;
          }
          gt$ = gt$ + space$(2) + jnk$(343, 44, 10) + jnk$(a, b, c) + jnk$(340, 64, 5);
        }
        l1 = gt$; l2 = jnk$(391, 59, 10) + bl + left$(time$(), len(time$()) - 3);
        if (incastle === 0) {
          switch (weather) {
            case 1: a = 357; b = 59; c = 9; break;
            case 2: a = 358; b = 58; c = 7; break;
            case 3: c = 7; if (hail) { a = 360; b = 61; } else { a = 375; b = 60; } break;
          }
          a$ = "It's " + jnk$(a, b, c) + ' and ';
          switch (wind) {
            case 1: a = 380; b = 63; c = 4; break;
            case 2: a = 379; b = 61; c = 6; break;
            case 3: a = 381; b = 59; c = 5; break;
            case 4: a = 388; b = 55; c = 10; break;
          }
          l3 = a$ + jnk$(a, b, c);
        } else {
          l3 = bl;
        }
        color(9, 0); locate(23, 1); print(l1);
        locate(24, 1); print(l2); locate(25, 1); print(l3);
      }

      if (incastle === 0 && weather === 3 && wind > 2 && cRoll(50) === 1 && didstuff) await Lightning();

      shock = 0; mirror = 0; sousa = 0;

      if (asleep) {
        ljnk(252, 28, 5, 1); st1 = chr$(46); forcefield = FALSE; tentgrab = 0;
      } else if ((mheal <= 0)) {
        GameWait.next('command'); await PauseForKey();
      } else {
        st1 = chr$(46);
      }
      response = 1000 * (len(st1) - 1) + asc(right$(st1, 1));
      respsave2 = respsave1; respsave1 = response; agin = FALSE;

      rsv: for (;;) {
        didstuff = TRUE; didmusk = FALSE; fatadd = 0;
        switch (response) {
          case 1071: case 1072: case 1073: case 1074: case 1075: case 1076: case 1077:
          case 1078: case 1079: case 1080: case 1081: case 1082: case 1083:
          case 46: case 100: case 101: case 102: case 109: case 112: case 114: case 115:
          case 116: case 117: case 85: case 88: case 90: case 60: case 62:
            if (berconfuse > 0) {
              response = confuse(response, 0);
            } else if (cRoll(3000) < brandy - 450) {
              response = confuse(response, 2);
            }
            if ((attractx | attracty) && (grabbed === 0)) {
              response = confuse(response, 0);
            }
            if (berhic) {
              response = 46; ClearMess(); l2 = ber$;
              await MaybeMessPause(10, 0);
            } else if (pooped) {
              mheal = 0; forcefield = FALSE; ClearMess(); ljnk(82, 1, 28, 1);
              await MessPause(4, 0); response = 46; asleep = TRUE;
            } else if ((sick !== 0) && (response !== 46) && (rnd() < 0.2 + (0.1 - 0.2 * qb(berhpmut > 0)) * qb(pmut === 4 && berpmut === 0) + (0.1 - 0.2 * qb(berhmmut > 0)) * qb(mmut === 3 && bermmut === 0))) {
              mheal = 0; forcefield = FALSE; ClearMess(); ljnk(248, 59, 9, 1);
              if (tapeworm && cRoll(40) === 1) { tapeworm = FALSE; ljnk(342, 29, 28, 1); }
              await MaybeMessPause(2, 0);
              response = 223;
            }
            break;
        }
        switch (response) {
          case 1071: case 1072: case 1073: case 1074: case 1075: case 1076: case 1077:
          case 1078: case 1079: case 1080: case 1081:      // 78946123
            if (vpage !== 1) {
              vpage = 1; screenPages(1); ljnk(63, 1, 12, 4); SetCombatStats();
              PrintMessage(7, 0); await DisplayCharacter();
            }
            switch (vehicle) {
              case 1: [response] = await Ride(response, 5 * turbo); fatadd = 0; break;  // hover
              case 3: [response] = await Ride(response, 2 * turbo); fatadd = 0; break;  // golf
              case 4: [response] = await Ride(response, 1 * turbo); fatadd = 5; break;  // pogo
              case 5: [response] = await Ride(response, 2 * turbo); fatadd = 3; break;  // kayak
              case 6: [response] = await Ride(response, 1 * turbo); fatadd = 3; break;  // rub raft
              case 7: [response] = await Ride(response, 1 * turbo); fatadd = 3; break;  // bamboo raft
              default: response = await Move(response);
            }
            if ((didstuff === FALSE) && berconfuse) { didstuff = TRUE; fatadd = -2; }
            break;
          case 46: case 1083:     // .  del
            fastfight = FALSE; fatadd = -6; if (asleep) fatadd = -12;
            break;
          case 27:      // esc
            didstuff = FALSE; ClearMess(); PrintMessage(7, 0);
            break;
          case 97:      // a(gain)
            if (respsave2 === 97) continue mainloop;
            agin = TRUE; response = respsave2; respsave1 = respsave2; continue rsv;
          case 63:      // ?
            didstuff = FALSE; MakeCommandScreen();
            screenPages(null, 3); await PauseForKey();
            if (ucase$(st1) === 'P') PrintCommandScreen();
            screenPages(vpage); ClearMess(); PrintMessage(1, 0);
            break;
          case 100:     // d(rop)
            switch (currsym) {
              case 5: case 8: case 9: case 11: case 12: case 21: case 22: case 24: case 43: case 206:
              case 157: case 236: case 254: case trap: case pit: case gas: case 240: case chasm:
              case monosym: case 215: case 216: case 146: case 167: case 18: case 29: case 145:
              case 234: case 225: case 35: case 135: case 128:
                didstuff = FALSE; ClearMess(); ljnk(82, 29, 31, 2); PrintMessage(4, 0);
                break;
              default: await Drop();
            }
            break;
          case 101:     // e(at)
            await Eat();
            break;
          case 102:     // f(igure)
            await Figure();
            break;
          case 109: case 112:     // m(ental mutation use), p(hysical mutation use)
            agin = TRUE; keysave2 = TRUE; keysave1 = -1 + qb(response === 109); await Use();
            keysave1 = 0; keysave2 = FALSE;
            break;
          case 114:     // r(emove trap)
            await Remove();
            break;
          case 115:     // s(earch)
            await Search(TRUE);
            break;
          case 116:     // t(hrow)
            await Throw(0); await DisplayCharacter();
            break;
          case 117:     // u(se)
            await Use();
            break;
          case 70:      // F(astfight toggle)
            didstuff = FALSE; fastfightlocal = not(fastfightlocal); ClearMess();
            if (fastfightlocal) { a = 281; b = 1; c = 28; } else { a = 281; b = 29; c = 29; }
            ljnk(a, b, c, 1); PrintMessage(4, 0);
            break;
          case 85:      // U(nuse)
            await UnUse();
            await DisplayCharacter();
            break;
          case 80:      // P(revious message)
            lsave[1][lpoint] = fixstr('_' + lsave[1][lpoint], 54);
            lsave[2][lpoint] = fixstr('_' + lsave[2][lpoint], 54);
            lsave[3][lpoint] = fixstr('_' + lsave[3][lpoint], 54);
            lpoint = lpoint - 1; if (lpoint < 0) lpoint = 10;
            color(9, 0);
            locate(23, 1); print(lsave[1][lpoint]);
            locate(24, 1); print(lsave[2][lpoint]);
            locate(25, 1); print(lsave[3][lpoint]);
            messturn = 0; didstuff = FALSE;
            break;
          case 81:      // Q(uit)
            ClearMess();
            ljnk(311, 17, 21, 2); PrintMessage(12, 0); await PauseForKey();
            if (ucase$(st1) === chr$(89)) {
              await Save();
              expr = -1000; st1 = 'no'; await Dead(1);
            } else if (ucase$(st1) === chr$(78)) {
              st1 = jnk$(71, 53, 9); await Dead(2);
            } else {
              ljnk(81, 54, 15, 2); PrintMessage(7, 0); didstuff = FALSE;
            }
            break;
          case 83:       // S(ave)
            didstuff = FALSE; await Save();
            break;
          case 87:       // W(impy define)
            didstuff = FALSE; await define();
            break;
          case 88:       // X(amine)
            if (vpage !== 1) {
              vpage = 1; screenPages(1);
              ljnk(63, 1, 12, 4); PrintMessage(3, 0); await DisplayCharacter();
            }
            await Examine(FALSE);
            break;
          case 90:       // Z(leep)
            if (hrs >= 7 && hrs <= 20) chan = Math.fround(0.02);
            else if (hrs === 21 || hrs === 22) chan = Math.fround(0.2);
            else chan = Math.fround(0.6);
            if (coffee > 0) chan = Math.fround(chan / 10);
            if (brandy > 0) chan = Math.fround(chan * 10);
            ClearMess();
            if (rnd() < chan) {
              ljnk(250, 48, 20, 1); asleep = TRUE; berhic = 0; sick = 0;
            } else {
              ljnk(251, 1, 28, 1);
              if (incastle && (nnear === 0)) {
                a = 252; if (rnd() < 0.5) { b = 1; c = 27; } else { b = 33; c = 17; }
              } else if (incastle === 0) {
                a = 251; b = 45; c = 23;
              } else {
                a = 251; b = 45; c = 15;
              }
              ljnk(a, b, c, 2); if (coffee > 0) ljnk(289, 1, 31, 2);
              if (hrs > 6 && hrs < 21) { ljnk(290, 1, 25, 1); l2 = ''; }
            }
            fatadd = -5; PrintMessage(1, 0); DumpBuffer();
            if (asleep) await MessPause(1, 0);
            break;
          case 60: case 62:     // <> go down,up
            if (grabbed) {
              ClearMess();
              ljnk(240, 9, 26, 1); ljnk(240, 35, 29, 2);
              PrintMessage(10, 0); ClearMess(); DumpBuffer();
              didstuff = FALSE;
            } else {
              if (incastle === -1) {
                res60 = response - 60;
                if (currsym === 240 && currf === 5 + 4 * res60) {
                  SaveMaps(-1);
                  castlelevel = castlelevel + res60 - 1;
                  fatadd = fatig * (1 + res60); await DrawDungeon();
                } else {
                  didstuff = FALSE;
                }
              } else if (incastle === 1) {
                if (currsym === 240 && currf === 5 + 4 * (response - 60)) {
                  if (currf === 13) {
                    SaveMaps(1);
                    await LeaveCastle();
                    localx = xenter; localy = yenter;
                    await DetailedMap(TRUE);
                    localx = xenter; localy = yenter;  // need this?
                    await DisplayCharacter();
                  } else {
                    didstuff = FALSE;   // go down stuff later on
                  }
                } else {
                  didstuff = FALSE;   // go down stuff later on
                }
              } else if (currsym === 240) {
                for (let kl = 1; kl <= ngoody; kl++) {
                  if (Math.abs(goody[kl][1]) === 8) {
                    typ = goody[kl][11];
                    if (typ === 4 || typ === 8 || typ === 10 || typ === 12) {
                      didstuff = FALSE; ClearMess();
                      Ljnkbig(10, 61, 5, 308, 32, 24, gdy[kl], 1, 2);
                      await MessPause(11, 0);
                    }
                  }
                }
                if (didstuff) { SaveMaps(0); await DrawLair(); }
              }
            }
            if (didstuff) { grabbed = 0; tentgrab = 0; }
            break;
          case 1059: case 49:   // F1,1
            rdisp = 1; await DisplayCharacter(); didstuff = FALSE;
            break;
          case 1060: case 50:   // F2
            rdisp = 2; await DisplayCharacter(); didstuff = FALSE;
            break;
          case 1061: case 51:   // F3
            await MakeKnownScreen();
            await PauseForKey();
            screenPages(vpage); didstuff = FALSE;
            break;
          case 1062: case 52:   // F4
            ActiveMod();
            await PauseForKey();
            screenPages(vpage); didstuff = FALSE;
            break;
          case 1063: case 53:   // F5
            SetCombatStats();
            vpage = 0; screenPages(0); ClearMess(); await DisplayCharacter();
            for (let idum = 2; idum <= 51; idum++) {
              for (let jdum = 2; jdum <= 21; jdum++) {
                if ((goodythere[idum][jdum] & 512)) {
                  [sym, fc, bc] = GetSym(idum, jdum, 0);
                  if (bc === 0) { bc = 1; PutSym(sym, idum, jdum, fc, bc, 0); }
                }
              }
            }
            ljnk(396, 30, 36, 1); ljnk(1, 38, 8, 4); await MessPause(1, 0);
            for (let idum = 2; idum <= 51; idum++) {
              for (let jdum = 2; jdum <= 21; jdum++) {
                if ((goodythere[idum][jdum] & 512)) {
                  [sym, fc, bc] = GetSym(idum, jdum, 0);
                  if (bc === 1) { bc = 0; PutSym(sym, idum, jdum, fc, bc, 0); }
                }
              }
            }
            vpage = 1; screenPages(1); ClearMess();
            ljnk(63, 1, 12, 4); PrintMessage(1, 0);
            didstuff = FALSE; await DisplayCharacter();
            break;
          case 1064: case 54:   // F6
            vpage = 1; screenPages(1);
            ljnk(63, 1, 12, 4); PrintMessage(7, 0);
            didstuff = FALSE; SetCombatStats(); await DisplayCharacter();
            break;
          case 1065: case 55:   // F7
            didstuff = FALSE; MakeSymbolScreen();
            screenPages(null, 3); await PauseForKey(); screenPages(null, vpage);
            break;
          case 1067: case 57:   // F9
            ljnk(201, 1, 51, 1); ljnk(202, 1, 51, 2); ljnk(203, 1, 51, 3);
            PrintMessage(5, 0); didstuff = FALSE;
            break;
          case 1068: case 48:        // F10
            didstuff = FALSE; await Sneak();
            break;
          case 223:     // barf
            if (rnd() < 0.5) {
              hits = hits - 1; if (hits < 0) { st1 = jnk$(249, 58, 7); await Dead(0); }
            }
            respsave1 = 46; respsave2 = 46; fatadd = 2;
            break;
          default:
            didstuff = FALSE;
            if (agin) { ClearMess(); l2 = 'Huh?'; PrintMessage(cRoll(15) + 1, 0); }
        }
        break;
      }
      attractx = 0; attracty = 0;
      if ((not(didstuff) | bitit) !== 0) continue mainloop;
      await BerryEffect();
      switch (response) {
        case 1070: case 46: case 1083: case 101: case 102: case 109: case 112: case 114:
        case 115: case 116: case 117: case 85: case 90: case 223:
          // 1070 is passed back by move,ride if doing trap is okay
          if (currsym === trap) {
            dotrap = qb(incastle === 0);
            if (not(dotrap)) {
              dotrap = qb(currf !== 1 && currf !== 5) | (qb(currf === 1) & not(asleep)) | (qb(currf === 5) & not(inglue));
            }
            if (dotrap && (currf === 5 && vehicle !== 0 && (incastle === 0))) dotrap = FALSE;
            if (dotrap) currf = await Trapp(currf);
          } else if (currsym === gas) {
            dic = cint((1.5 * lvl + 21 - con) / 3); if (dic < 1) dic = 1;
            dam = rolldice(4, dic, dic);
            if ((pmut === 7 && berpmut === 0)) dam = cint((dam + 1) / (2 - 2 * qb(berhpmut > 0)));
            if (gasmask | spacesuit) { dam = 0; l2 = bl; } else hits = hits - dam;
            if (hits < 0) { await MessPause(8, 0); st1 = jnk$(157, 53, 10); await Dead(0); }
            if (bitit) continue mainloop;
            if (dam > 0) { ClearMess(); ShowHits(); ljnk(157, 34, 19, 2); await MessPause(8, 0); }
          }
          break;
      }

      if (sick > 0) {
        sick = sick - 1; if (mheal | asleep) sick = sick - 4;
        if (pmut === 10 && berpmut === 0) sick = sick - 2 + 2 * qb(berhpmut > 0);
        if (mmut === 3 && bermmut === 0) sick = sick - 1 + 2 * qb(berhmmut > 0);
      } else {
        sick = 0;
      }
      if (flare > 0) flare = flare - 1;
      oldfatadd = fatadd;
      if ((qb(pmut === 4 && berpmut === 0 && dark > -1) | uvhelmet) !== 0) await Search(FALSE);
      if (pmut === 4 && berhpmut > 0 && dark > -1) await Search(FALSE);
      if (berdet > 0 && dark > -1) await Search(FALSE);
      fatadd = oldfatadd; await CheckFatPlus();
      skipcre: {
        if (zippy > 0) {
          zippy = zippy - 1;
          if ((zippy / 2 !== int(zippy / 2))) { ErasePut(); break skipcre; }
        }
        await CreatDo();
        if (zippy < 0) { zippy = zippy + 1; shock = 0; await CreatDo(); }
      }
      if (pmutturns > 0) pmutturns = pmutturns - 1;
      if (mmutturns > 0) mmutturns = mmutturns - 1;
      if (bitit) continue mainloop;
      if (rdisp === 1) await HungFatEnc();
      gt = gt + 0.18 - 0.18 * qb(zippy < 0) + 0.09 * qb(zippy > 0);
      if (asleep && (nnear === 0)) gt = gt + 2;
      if (inwater | insand) {
        if (not(wetsuit) && (vehicle !== 1) && (vehicle !== 5) && (vehicle !== 6) && (vehicle !== 7)) {
          if ((pmut === 10 && berpmut === 0)) {
            if (cRoll(6) < waterturns) hits = hits - cRoll(waterturns - 3);
            waterturns = waterturns + 1;
          } else if ((mmut === 3 && bermmut === 0)) {
            if (cRoll(6) < waterturns) hits = hits - cRoll(waterturns - 1);
            waterturns = waterturns + 2 + insand;
          } else {
            if (cRoll(6) < waterturns) hits = hits - cRoll(2 * waterturns - 2);
            waterturns = waterturns + 3 + insand;
          }
          ShowHits();
          if (hits < 0) { st1 = jnk$(59, 58, 8); await Dead(0); }
        }
      }
    }
  }
}

// u(se) command (also m / p for mutations).
async function Use() {
  let iuse = 0, a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, addgdy = 0, deplete = FALSE, worn = FALSE;
  let numbr = 0, k = 0, diff = 0, add = 0, delhit = 0, num = 0, recharge = 0, aa = 0;
  let a1 = 0, b1 = 0, c1 = 0, d1 = 0, e1 = 0, f1 = 0, addi = 0, addm = 0, typ = 0, rng = 0;
  let dx = 0, dy = 0, dam = 0, crenum = 0, damtype = 0, needed = 0, numid = 0, sym = 0, fc = 0, bc = 0;
  let remid = FALSE, damage = 0, ffkill = FALSE, flar = 0, olddark = 0, changed = 0;
  let aaa = 0, bbb = 0, ccc = 0, knife = 0, difff = 0, doaa = 0, maxplus = 0, detected = FALSE;
  let fcolr = 0, numshots = 0, colr = 0, r = 0, z = 0, cc = 0, foundvic = FALSE, timleft = 0;
  let days = 0, hrs = 0, mins = 0, d$ = '', h$ = '', m$ = '', speed = 0, spd$ = '';
  let za = 0, zb = 0, zc = 0, ze = 0, zf = 0, oldlen = 0, response = 0, vehtemp = 0, dis = 0;
  let rnds = 0, blpos = 0, x = 0, y = 0, zz = 0, effect = 0, bb = 0, a$ = '', b$ = '', bac$ = '';
  let cs = 0, ds = 0, es = 0, fs = 0, shown = FALSE;
  SetCombatStats();
  if (agin && keysave2) {
    iuse = keysave1;
  } else {
    iuse = 0;
    if (pmutturns <= 0) iuse = 1;
    if (mmutturns <= 0) iuse = iuse + 2;
    if (currsym === monosym) iuse = iuse + 4;
    ljnk(65, 3, 24, 1); iuse = await SelectGoody(iuse, 14, FALSE);
  }
  ClearMess();
  ud3: {
    if (iuse === 0) { didstuff = FALSE; agin = FALSE; PrintMessage(7, 0); break ud3; }
    keysave1 = iuse; keysave2 = FALSE;
    a = 0; b = 0; c = 0; d = 0; e = 0; f = 0; addgdy = 0;
    if (iuse === -10) { await Help(2); screenPages(vpage); ClearMess(); PrintMessage(1, 0); break ud3; }
    if (iuse === -3) { await UseMono(); break ud3; }
    if (iuse < 0) { iuse = await UseMutat(iuse); SetCombatStats(); break ud3; }
    if (berconfuse) iuse = cRoll(ngoody);
    ud2: {
      ud: {
        if (goody[iuse][1] < 0) {
          if (Math.abs(goody[iuse][1]) !== 7 && goody[iuse][11] === 2) {
            d = 68; e = 1; f = 25; if (berconfuse === 0) didstuff = FALSE;
            break ud;
          }
        }
        deplete = FALSE; PrintMessage(14, 0);
        switch (Math.abs(goody[iuse][1])) {
          case 1: case 2: case 6:
            d = 68; e = 26; f = 21; if (berconfuse === 0) didstuff = FALSE;
            break;
          case 3:
            if (goody[iuse][8] <= nwep) {
              goody[iuse][1] = -3; d = 68; e = 47; f = 15; addgdy = 2;
              UnYooz(3, iuse);
            } else {
              d = 385; e = 1; f = 28; if (berconfuse === 0) didstuff = FALSE;
            }
            break;
          case 4:
            worn = FALSE;
            for (let j = 1; j <= ngoody; j++) {
              if (goody[j][1] === -4) { worn = TRUE; break; }
            }
            if (worn) {
              d = 69; e = 1; f = 28; if (berconfuse === 0) didstuff = FALSE;
              d = 69; e = 1; f = 28; break ud;
            }
            armor = goody[iuse][3]; goody[iuse][1] = -4;
            d = 69; e = 29; f = 17; addgdy = 2;
            break;
          case 5:
            shield = goody[iuse][3]; goody[iuse][1] = -5;
            d = 68; e = 47; f = 15; addgdy = 2;
            UnYooz(5, iuse);
            break;
          case 7: case 8:
            if (not(goody[iuse][10])) {
              if (berconfuse === 0) didstuff = FALSE;
              d = 77; e = 1; f = 32; break ud;
            }
            if (goody[iuse][3] === 0) {
              fatadd = 1; d = 77; e = 33; f = 15; break ud;
            }
            if ((incastle === -1 && castle === 6 && castlelevel === grinchlevel)) {
              if (!((Math.abs(goody[iuse][1]) === 7 && goody[iuse][11] === 2) || (Math.abs(goody[iuse][1]) === 8 && goody[iuse][11] === 8))) {
                fatadd = 1; a = 77; b = 33; c = 15;
                d = 95; e = 27; f = 36; break ud;
              }
            }
            deplete = TRUE;
            numbr = goody[iuse][11] + 100 * (Math.abs(goody[iuse][1]) - 7);
            switch (numbr) {
              case 1:    // lava lamp
                if (flashlight) {
                  if (berconfuse === 0) didstuff = FALSE;
                  d = 315; e = 23; f = 33; break ud;
                }
                fatadd = 1; goody[iuse][1] = -7; flashlight = TRUE;
                a = 68; b = 47; c = 15; d = 159; e = 35; f = 8; addgdy = 1;
                break;
              case 2:    // Backpack
                if (npack > 9) {
                  if (berconfuse === 0) didstuff = FALSE;
                  ljnk(229, 35, 21, 2); PrintMessage(2, 8); break ud;
                }
                ljnk(229, 1, 34, 1); k = 0; k = await SelectGoody(k, 14, FALSE);
                if (k < 1 || k === iuse) { didstuff = FALSE; ClearMess(); break ud; }
                if (Math.abs(goody[k][1]) === 4 || Math.abs(goody[k][1]) === 8) {
                  didstuff = FALSE; ClearMess(); ljnk(230, 38, 30, 2);
                  PrintMessage(7, 0); break ud;
                } else if (goody[k][1] < 0) {
                  didstuff = FALSE; ClearMess(); ljnk(234, 41, 28, 2);
                  PrintMessage(7, 0); break ud;
                }
                npack = npack + 1; goody[iuse][1] = -7; bakpak[npack] = gdy[k];
                for (let j = 1; j <= 12; j++) backpack[npack][j] = goody[k][j];
                backpack[npack][1] = Math.abs(backpack[npack][1]); deplete = FALSE;
                RemoveGoody(k, 0); fatadd = fatig + 1; keysave2 = TRUE;
                break;
              case 3:    // gas mask
                if (gasmask | mask | uvhelmet) { d = 88; e = 45; f = 22; didstuff = FALSE; break ud; }
                fatadd = 2; goody[iuse][1] = -7; gasmask = TRUE;
                d = 68; e = 47; f = 15; addgdy = 2;
                break;
              case 4:    // medkit
                fatadd = 1; fatigue = fatigue / 2;
                d = 171; e = 1; f = 14;
                diff = hitmax - hits; if (diff < 2) diff = 2;
                add = rolldice(idiv(diff, 2), 3, 2);
                if (add > 40) add = 40; else if (add < 3) add = 3;
                if (berscience) add = add * 2;
                hits = hits + add; if (hitmax < hits) hitmax = hitmax + 1;
                if (hunger > 0) hunger = hunger * 0.75;
                if (berconfuse) berconfuse = 1;
                if (berblind) berblind = 1;
                if (berpmut) berpmut = 1;
                if (bermmut) bermmut = 1;
                if (sick) sick = 1;
                if (strtox > 0) { strtox = strtox - 1; str = str + 1; }
                if (dextox > 0) { dextox = dextox - 1; dex = dex + 1; }
                if (contox > 0) { contox = contox - 1; con = con + 1; }
                if (hittox > 0) {
                  delhit = cint((hittox + 1) / 2); hittox = hittox - delhit;
                  hits = hits + delhit; hitmax = hitmax + delhit;
                }
                spore = 0; tapeworm = FALSE; keysave2 = TRUE;
                break;
              case 5:    // tape recorder
                await TapeRecorder(iuse); ClearMess(); deplete = FALSE; break ud2;
              case 6:    // powerpak
                ljnk(223, 36, 14, 1); k = 0; k = await SelectGoody(k, 14, FALSE);
                if (k < 1) { didstuff = FALSE; ClearMess(); PrintMessage(3, 0); break ud3; }
                deplete = FALSE;
                switch (Math.abs(goody[k][1])) {
                  case 1: case 2: case 3: case 4: case 5: d = 224; e = 1; f = 19; didstuff = FALSE; break;
                  case 6: Ljnkbig(223, 50, 17, 0, 0, 0, gdy[k], 1, 2); f = 0;
                    if (k < iuse) { const t = k; k = iuse; iuse = t; }
                    RemoveGoody(k, FALSE); RemoveGoody(iuse, FALSE);
                    break;
                  case 7: case 8:
                    if (goody[k][1] < 0) {
                      d = 225; e = 1; f = 38; if (berconfuse === 0) didstuff = FALSE;
                    } else {
                      Ljnkbig(224, 20, 22, 0, 0, 0, gdy[k], 1, 2); f = 0;
                      if (Math.abs(goody[k][1]) === 7) {
                        num = ssd[goody[k][11]][2]; recharge = ssd[goody[k][11]][9];
                      } else {
                        num = lsd[goody[k][11]][2]; recharge = lsd[goody[k][11]][4];
                      }
                      if (qb(num === -1) | not(recharge)) {
                        if (num === -1) { e = 13; f = 25; } else { e = 38; f = 29; }
                        d = 269; didstuff = FALSE; break ud;
                      }
                      aa = -qb(goody[k][3] >= num) - qb(goody[k][3] >= idiv(num, 2));
                      if (goody[k][11] === 6) aa = 1;   // powerpack
                      goody[k][3] = num + aa;
                      if (goody[iuse][3] < 2) RemoveGoody(iuse, FALSE); else deplete = TRUE;
                    }
                    break;
                }
                break;
              case 7:    // chemical analyzer
                ljnk(175, 42, 13, 1); k = 0; k = await SelectGoody(k, 11, FALSE);
                if (k < 1) { didstuff = FALSE; ClearMess(); PrintMessage(3, 0); break ud3; }
                ljnk(175, 55, 8, 2);
                a = 176; b = 0; c = 0;
                switch (Math.abs(goody[k][1])) {
                  case 1: b = 1; c = 21; break;
                  case 2: b = 22; c = 15; break;
                  case 3:
                    switch (goody[k][8]) {
                      case 13: case 14: case nwep + 11: case nwep + 12: b = 46; c = 18; break;
                      case 2: case nwep + 4: case nwep + 6: case nwep + 8: b = 38; c = 8; break;
                      default: b = 36; c = 10;
                    }
                    break;
                  case 4: {
                    const g3 = goody[k][3];
                    if (g3 === 1 || g3 === 2) { b = 46; c = 18; }
                    else if (g3 < 10) { b = 36; c = 10; }
                    else { b = 38; c = 8; }
                    break;
                  }
                  case 5:
                    switch (goody[k][3]) {
                      case 1: case 2: b = 46; c = 18; break;
                      case 7: case 8: b = 38; c = 8; break;
                      default: b = 36; c = 10;
                    }
                    break;
                  case 6: knownb[goody[k][3]] = TRUE;
                    l2 = rtrim$(l2) + jnk$(177, 1, 14) + BerEff$(goody[k][3]);
                    break;
                  case 9:
                    switch (goody[k][3]) {
                      case 5: case 9: b = 36; c = 10; break;
                      default: b = 38; c = 8;
                    }
                    break;
                  default: b = 36; c = 10;
                }
                if (c > 0) { Ljnkbig(a, b, c, 0, 0, 0, rtrim$(l2) + bl, 0, 2); c = 0; }
                fatadd = 3; keysave2 = TRUE;
                break;
              case 8:    // visiscope
                if (sunglasses) {
                  d = 88; e = 19; f = 26; didstuff = FALSE;
                } else if (mask) {
                  d = 88; e = 45; f = 22; didstuff = FALSE;
                } else if (incastle) {
                  d = 53; e = 51; f = 15; fatadd = 2;
                } else if (dark > 0) {
                  d = 241; e = 48; f = 20; didstuff = FALSE;
                } else {
                  keysave2 = TRUE; fatadd = 3; await Look(TRUE);
                }
                break;
              case 9:    // tylenol
                fatadd = 1; keysave2 = TRUE;
                if ((qb(cRoll(20) > 1) | berscience) !== 0) {
                  hits = hits + cRoll(lvl + 5); sick = idiv(sick, 2);
                  if (cRoll(2) === 1) tapeworm = FALSE;
                  if (spore) spore = spore - 1;
                  if (hittox > 0) {
                    hits = hits + 1; hitmax = hitmax + 1; hittox = hittox - 1;
                  }
                  d = 78; e = 1; f = 15;
                } else {
                  hits = hits - cRoll(2 * lvl + 8) - cRoll(2 * lvl + 8);
                  sick = sick + 20; con = con - 1; contox = contox + 1;
                  tapeworm = FALSE;
                  a = 9; b = 56; c = 12; d = 173; e = 28; f = 28;
                  if (hits < 0) {
                    await MessPause(6, 0); st1 = jnk$(78, 16, 22); await Dead(0);
                  }
                }
                break;
              case 10:    // mask
                if (mask | gasmask | uvhelmet) { d = 88; e = 45; f = 22; didstuff = FALSE; break ud; }
                fatadd = 1; mask = TRUE; goody[iuse][1] = -7;
                for (let id = 1; id <= nnear; id++) ncre[id][6] = -Math.abs(ncre[id][6]);
                d = 69; e = 29; f = 17; addgdy = 2;
                break;
              case 11:    // boots
                if (bsshoes | boots) {
                  a = 308; b = 1; c = 31; didstuff = FALSE;
                } else {
                  fatadd = fatig / 2; boots = TRUE; goody[iuse][1] = -7;
                  a = 69; b = 29; c = 17; d = 173; e = 1; f = 27; addgdy = 1;
                }
                break;
              case 12:     // answering machine
                fatadd = 1; keysave2 = TRUE;
                if (answer | berscience) {
                  switch (cRoll(7)) {
                    case 1: a1 = 165; b1 = 45; c1 = 11; d = 166; e = 1; f = 31; break;  // mom
                    case 2: a1 = 198; b1 = 1; c1 = 10;                                  // gri
                      switch (cRoll(5)) {
                        case 1: d1 = 294; e1 = 58; f1 = 10; break;   // spc suit
                        case 2: d1 = 117; e1 = 29; f1 = 15; break;   // serum
                        case 3: d1 = 296; e1 = 11; f1 = 16; break;   // bss
                        case 4: d1 = 167; e1 = 29; f1 = 20; break;   // id
                        case 5: d1 = 199; e1 = 32; f1 = 11; break;   // rst bst
                      }
                      Ljnkbig(167, 1, 28, d1, e1, f1, bl, 2, 2);
                      break;
                    case 3: a1 = 197; b1 = 33; c1 = 5; d = 170; e = 1; f = 40; break;   // elvi
                    case 4: a1 = 61; b1 = 18; c1 = 14; d = 168; e = 1; f = 50; break;   // hmun
                    case 5: a1 = 294; b1 = 25; c1 = 11; d = 169; e = 1; f = 50; break;  // skp
                    case 6: a1 = 118; b1 = 57; c1 = 12; d = 264; e = 1; f = 42; break;  // don
                    case 7: a1 = 165; b1 = 56; c1 = 11; d = 166; e = 32; f = 36; break; // buz
                  }
                  Ljnkbig(165, 21, 24, a1, b1, c1, bl, 2, 1); answer = FALSE;
                } else {
                  d = 165; e = 1; f = 20;
                }
                break;
              case 13:    // force field gen
                if (ffgen) { d = 77; e = 1; f = 32; didstuff = FALSE; break ud; }
                fatadd = fatig / 2; goody[iuse][1] = -7;
                ffgen = goody[iuse][3] - 1; goody[iuse][3] = ffgen;
                d = 68; e = 47; f = 15; addgdy = 2;
                break;
              case 14: {  // bion crainium
                const roll = cRoll(100 + 15 * qb(berscience !== 0));
                if (roll < 10) {
                  addi = cRoll(3); addm = cRoll(3);
                  intl = intl + addi; mr = mr + addm;
                  d = 226; e = 1; f = 31;
                } else if (roll <= 85) {
                  intl = intl + 1; mr = mr + 1;
                  d = 226; e = 1; f = 31;
                } else {
                  intl = intl - 1; mr = mr - 1;
                  Ljnkbig(226, 1, 9, 226, 32, 5, bl, 2, 2);
                }
                fatadd = 5; zippy = zippy - 2;
                RemoveGoody(iuse, FALSE); deplete = FALSE;
                break;
              }
              case 15: {  // bion muscles
                const roll = cRoll(100 + 15 * qb(berscience !== 0));
                if (roll < 10) {
                  str = str + cRoll(3) + strtox; dex = dex + cRoll(3) + dextox;
                  strtox = 0; dextox = 0;
                  d = 226; e = 1; f = 31;
                } else if (roll <= 85) {
                  str = str + 1; dex = dex + 1;
                  if (strtox > 0) { str = str + 1; strtox = strtox - 1; }
                  if (dextox > 0) { dex = dex + 1; dextox = dextox - 1; }
                  d = 226; e = 1; f = 31;
                } else {
                  str = str - 1; dex = dex - 1;
                  Ljnkbig(226, 1, 9, 226, 32, 5, bl, 2, 2);
                }
                fatadd = 5; zippy = zippy - 2;
                RemoveGoody(iuse, FALSE); deplete = FALSE;
                break;
              }
              case 16: case 17:  // duct tape, TP
                typ = goody[iuse][11]; fatadd = fatig; rng = Math.fround(1.5 - 3 * qb(typ === 17));
                [num, dx, dy] = await Target(num, rng, dx, dy, wallcolr); ClearMess();
                if (not(didstuff)) {
                  PrintMessage(1, 0); didstuff = FALSE; break ud3;
                }
                if (num <= 0) break ud2;
                dam = 1; crenum = ncre[num][1];
                switch (typ) {
                  case 16: damtype = 12; needed = 15 - idiv(lvl, 2); break;
                  case 17: damtype = 15; needed = 13 - idiv(lvl, 2);
                    if (crenum === dung || crenum === sgull) dam = rolldice(8, 8, 8);
                    break;
                }
                keysave2 = TRUE; if (berscience) needed = needed - 5;
                Ljnkbig(229, 35, 5, 0, 0, 0, gdy[iuse], 1, 1);
                ({ damtype, need: needed } = await Explode(dx, dy, dam, damtype, needed, 0, FALSE, 14, 3));
                break ud2;
              case 18:    // sunscreen
                sunscreen = 6; fatadd = 3; d = 235; e = 55; f = 12;
                break;
              case 19:    // ID
                d = 263; e = 31; f = 29; fatadd = 1; numid = goody[iuse][5];
                if (numid > 4 || numid < 1) numid = 1;
                if (numid === 4 || incastle) {
                  for (let iid = -1; iid <= 1; iid++) {
                    for (let jid = -1; jid <= 1; jid++) {
                      [sym, fc, bc] = GetSym(localx + iid, localy + jid, 2);
                      if (sym === lockeddoor) {
                        PutSym(cen, localx + iid, localy + jid, fc, bc, -1);
                        if (numid === 4 && mainx === radzone[grinchzone][1] && mainy === radzone[grinchzone][2]) {
                          RemoveGoody(iuse, FALSE); deplete = FALSE;
                          a = d; b = e; c = f; d = 420; e = 29; f = 28;
                        }
                      }
                    }
                  }
                }
                for (let iid = 1; iid <= nnear; iid++) {
                  typ = ncre[iid][1]; remid = FALSE;
                  switch (typ) {
                    case rdro: remid = TRUE; break;
                    case ddro: if (numid > 1 + sunglasses + pinsuit) remid = TRUE; break;
                    case sdro: if (numid > 2 + sunglasses + pinsuit) remid = TRUE; break;
                    case robot: if (numid > 3 + sunglasses + pinsuit) remid = TRUE; break;
                  }
                  if (remid) ncre[iid][11] = ncre[iid][11] & ~1;
                }
                keysave2 = TRUE;
                break;
              case 20:    // flare
                fatadd = 2;
                if (incastle) {
                  ljnk(256, 18, 34, 2); dam = rolldice(4, 2, 2);
                  damage = dam; [damage, ffkill] = ffEffect(damage, ffkill);
                  hits = hits - damage;
                  if (hits < 0) {
                    await MessPause(12, 0); st1 = 'a ' + gdy[iuse]; await Dead(0);
                  } else if (ffkill) {
                    await MessPause(12, 0); ClearMess();
                    Ljnkbig(83, 1, 5, 207, 1, 19, jnk$(205, 39, 21), 1, 2);
                  }
                  await MessPause(12, 0); ClearMess();
                  Ljnkbig(73, 1, 5, 0, 0, 0, gdy[iuse], 1, 1);
                  await Explode(0, 0, dam, 10, 6, 6, FALSE, 12, 3);
                  if (goody[iuse][3] < 1) { deplete = FALSE; RemoveGoody(iuse, FALSE); }
                  break ud2;
                } else {
                  flar = rolldice(20, 12, 8); if (flare < flar) flare = flar;
                  if (berscience) flare = flare * 2;
                  d = 256; e = 1; f = 17;
                  [dark, olddark, changed] = SetDark(dark, olddark, changed); if (changed) ChangeDark();
                  if (goody[iuse][3] < 1) { deplete = FALSE; RemoveGoody(iuse, FALSE); }
                }
                break;
              case 21:    // mirror
                mirror = iuse; fatadd = 1; d = 255; e = 51; f = 16;
                deplete = FALSE; keysave2 = TRUE;
                break;
              case 22:    // misty
                d = 285; e = 16; f = 32; didstuff = FALSE;
                break;
              case 23:    // tricorder
                fatadd = 1; MapLevel(); await Examine(TRUE); if (dark) ChangeDark();
                aaa = 272; bbb = 1; ccc = 19;   // only used by elvis/grinch special
                if (incastle === -1 && castle === 1) {
                  if (elvislevel > 0) { aaa = 271; bbb = 38; ccc = 20; }
                  Ljnkbig(271, 1, 15, aaa, bbb, ccc, bl, 1, 1);
                } else if (incastle === -1 && castle === 6) {
                  if (grinchlevel > 0) { aaa = 271; bbb = 38; ccc = 20; }
                  Ljnkbig(271, 17, 20, aaa, bbb, ccc, bl, 1, 1);
                }
                break;
              case 24:    // massager
                d = 287; e = 1; f = 39; fatadd = 0; fatigue = 0;
                berfresh = berfresh + rolldice(25, 4, 4);
                break;
              case 25:    // thermos
                d = 286; e = 39; f = 30; fatadd = 0;
                if (coffee === 0) con = con + 1;
                coffee = coffee + rolldice(150, 4, 4); brandy = brandy * 0.51;
                berconfuse = berconfuse * 0.51;
                keysave2 = TRUE; hunger = hunger - 100;
                if (zippy < 0) zippy = 0;
                break;
              case 26:    // grenade launcher
                if (goody[iuse][3] < 0) {
                  await Throw(1); fatadd = 3; await DisplayCharacter(); break ud3;
                } else {
                  rng = 60; fatadd = 1;
                  [num, dx, dy] = await Target(num, rng, dx, dy, wallcolr); ClearMess();
                  if (not(didstuff)) { PrintMessage(1, 0); break ud3; }
                  needed = tohitbase - other2hitr - dex2hit - 6;
                  if (berscience) needed = needed - 3;
                  dam = rolldice(8, 8, 8) + otherdam; ljnk(269, 1, 12, 1);
                  ({ need: needed } = await Explode(dx, dy, dam, 1, needed, 1, TRUE, 11, 1));
                  if (didstuff) {
                    goody[iuse][3] = goody[iuse][3] - 1;
                    if (goody[iuse][3] === 0) goody[iuse][3] = -1;
                  }
                  break ud3;
                }
              case 27:    // Brandy
                a = 355; b = 58; c = 11; d = 356; e = 1; f = 20;
                fatadd = 0;
                if (brandy === 0) str = str + 1;
                brandy = brandy + 300 + cRoll(100) - cRoll(100);
                coffee = coffee * 0.51; keysave2 = TRUE; hunger = hunger * 0.9;
                break;
              case 28:    // MicroComputer
                fatadd = 10; await Compute(0); keysave2 = TRUE; break ud2;
              case 29:    // Breathalyzer
                bac$ = ltrim$(str$(cint(0.016 * brandy)));
                if (len(bac$) === 1) bac$ = '0' + bac$;
                Ljnkbig(142, 17, 31, 142, 48, 1, bac$, 1, 1);
                break;
              case 30:   // Alkaselzer
                a = 394; b = 43; c = 24; fatadd = 0;
                if (sick) { sick = 0; d = 394; e = 1; f = 24; }
                if (hittox > 0) { hits = hits + 1; hitmax = hitmax + 1; hittox = hittox - 1; }
                if (cRoll(2) === 1) tapeworm = FALSE;
                if (spore) spore = spore - 1;
                break;
              case 31:   // MindWeb generator
                a = 110; b = 10; c = 33; fatadd = 1;
                mindweb = 1; forcefield = FALSE;
                break;
              case 32:   // Cap'n Crunch
                a = 118; b = 41; c = 16; fatadd = 0; hunger = hunger - 200;
                zippy = cRoll(6) + 4; zippy = 2 * idiv(zippy, 2);
                break;
              case 33:   // Motion Sensor
                shown = FALSE; fatadd = 0;
                for (let ll1 = 1; ll1 <= nnear; ll1++) {
                  if (SameRoom(ncre[ll1][4], ncre[ll1][5])) {
                    sym = ncre[ll1][7] % 1000; fc = idiv(ncre[ll1][7], 1000);
                    if (fc === 0) { PutSym(sym, localx + ncre[ll1][4], localy + ncre[ll1][5], 30, 0, 1); shown = TRUE; }
                  }
                }
                if (not(shown)) { a = 130; b = 25; c = 26; }
                break;
              case 34: case 35:       // pencil sharpener, knife sharpener
                ljnk(134, 46, 13, 1); k = 0; k = await SelectGoody(k, 11, FALSE);
                if (k < 1) { didstuff = FALSE; ClearMess(); break ud; }
                keysave2 = TRUE; if (numbr === 35) knife = 1; else knife = -1;
                if (Math.abs(goody[k][1]) === 3) {
                  switch (goody[k][8] * knife) {
                    case 1: case -3: case 4: case 6: case 8: case 9: case 10: case 11: case 12: case -13: case 14:
                    case nwep + 1: case -nwep - 2: case nwep + 3: case -nwep - 4: case -nwep - 5: case nwep + 6:
                    case -nwep - 7: case -nwep - 8: case -nwep - 9: case -nwep - 10: case -nwep - 11: case -nwep - 12:  // sharpenable
                      if ((goody[k][8] === 13 || goody[k][8] === 14 || goody[k][8] === nwep + 11 || goody[k][8] === nwep + 12) && cRoll(4 - 4 * qb(berscience !== 0)) > 1) {
                        a = 135; b = 17; c = 32;     // duralloy
                      } else if (cRoll(10 - 10 * qb(berscience !== 0)) === 1) {
                        if (!(goody[k][8] === 13 || goody[k][8] === 14 || goody[k][8] === nwep + 11 || goody[k][8] === nwep + 12)) {  // damage wep if not duralloy
                          a = 149; b = 26; c = 21; difff = -5;
                          if (cRoll(3) === 1) {
                            goody[iuse][3] = goody[iuse][3] - 1;
                            RemoveGoody(k, FALSE); deplete = FALSE;
                          }
                        } else {                       // break sharpener on duralloy
                          a = 149; b = 47; c = 19; addgdy = 1;
                          RemoveGoody(iuse, FALSE); deplete = FALSE;
                        }
                      } else {
                        a = 149 + knife; b = 1; c = 36 - 5 * knife; difff = 1;
                      }
                      if (deplete) {
                        for (let iyi = 1; iyi <= Math.abs(difff); iyi++) {
                          if (cRoll(2) === 1) {
                            if (goody[k][10] < cRoll(5) || difff < 0) {
                              goody[k][10] = goody[k][10] + sgn(difff);
                            }
                          } else {
                            if (goody[k][9] < cRoll(5) || difff < 0) {
                              goody[k][9] = goody[k][9] + sgn(difff);
                            }
                          }
                        }
                      }
                      break;
                    default: a = 148 + knife; b = 1; c = 26 - knife;
                      didstuff = FALSE; deplete = FALSE;
                  }
                } else {
                  a = 153; b = 55; c = 12; didstuff = FALSE; deplete = FALSE;
                }
                break;
              case 36:   // Armor-all
                ljnk(135, 49, 14, 1); k = 0; k = await SelectGoody(k, 11, FALSE);
                if (k < 1) { didstuff = FALSE; ClearMess(); PrintMessage(3, 0); break ud3; }
                keysave2 = TRUE;
                if (Math.abs(goody[k][1]) === 4 || Math.abs(goody[k][1]) === 5) {
                  a = 150; b = 32; c = 29; doaa = 0; typ = goody[k][3];
                  switch (Math.abs(goody[k][1])) {
                    case 4: if (goody[k][4] < arm[typ][2]) goody[k][4] = arm[typ][2]; else doaa = 2; break;
                    case 5: if (goody[k][4] < sh[typ][2]) goody[k][4] = sh[typ][2]; else doaa = 3; break;
                  }
                  maxplus = 1 + idiv(goody[k][3] + doaa, 3);
                  if (doaa) {
                    if ((goody[k][5] < cRoll(maxplus))) {
                      goody[k][5] = goody[k][5] + 1;
                    } else if (cRoll(2) === 1) {
                      goody[k][4] = goody[k][4] + 1;
                    }
                  }
                } else if (Math.abs(goody[k][1]) === 9 && goody[k][3] === 7) {
                  a = 150; b = 32; c = 29; goody[k][4] = goody[k][4] + 10;
                } else {
                  a = 95; b = 63; c = 6;
                }
                break;
              case 37:      // UV helmet
                if (mask | gasmask | uvhelmet) { d = 88; e = 45; f = 22; didstuff = FALSE; break ud; }
                fatadd = 1; uvhelmet = TRUE; goody[iuse][1] = -7;
                await Search(TRUE);
                d = 69; e = 29; f = 17; addgdy = 2;
                break;
              case 38:      // Geiger counter
                detected = FALSE;
                if (incastle) {
                  for (dx = -6; dx <= 6; dx++) {
                    for (dy = -6; dy <= 6; dy++) {
                      if (SameRoom(dx, dy)) {
                        [sym, fc, bc] = GetSym(localx + dx, localy + dy, 2);
                        if (sym === trap && fc === 4) {
                          detected = TRUE;
                          PutSym(sym, localx + dx, localy + dy, fc, bc, 1);
                        }
                      }
                    }
                  }
                  a = 363; if (detected) { b = 1; c = 30; } else { b = 31; c = 34; }
                } else {
                  for (let i = 1; i <= 10; i++) {
                    if (Math.abs(mainx + dx - radzone[i][1]) < 4 && Math.abs(mainy + dy - radzone[i][2]) < 4) {
                      detected = TRUE;
                      [sym, fcolr, b] = GetSym(radzone[i][1], radzone[i][2], 0);
                      PutSym(sym, radzone[i][1], radzone[i][2], fcolr, 4, 0);
                    }
                  }
                  if (detected) {
                    vpage = 0; screenPages(0); await DisplayCharacter();
                    ljnk(364, 1, 30, 2); await MessPause(12, 0);
                    vpage = 1; screenPages(1); await DisplayCharacter();
                  } else {
                    a = 364; b = 31; c = 34;
                  }
                }
                break;
              case nssd + ntechwep + 1:   // boise
                fatadd = 3; d = 79; e = 30; f = 22;
                break;
              case nssd + ntechwep + 2:   // sunglas
                fatadd = 1; sunglasses = TRUE; goody[iuse][1] = -7;
                a = 69; b = 29; c = 17; d = 234; e = 24; f = 17; addgdy = 1;
                break;
              case nssd + ntechwep + 3:   // toast
                d = 80; e = 35; f = 14; fatadd = 0;
                break;
              case nssd + ntechwep + 4:   // cheese g
                fatadd = 0; hits = hits - cRoll(2);
                if (hits < 0) { st1 = jnk$(79, 52, 15); await Dead(0); }
                d = 81; e = 1; f = 25;
                break;
              case nssd + ntechwep + 5:   // bion spleen
                fatadd = fatig; z = cRoll(100 + 40 * qb(berscience !== 0));
                if (z < 40) {
                  hits = hits + 3 + hittox; hitmax = hitmax + 3 + hittox;
                  con = con + 1 + contox; rr = rr + 1; d = 155; e = 36; f = 25;
                  hittox = 0; contox = 0; spore = 0;
                } else if (z < 90) {
                  hits = hits + 3 + hittox; hitmax = hitmax + 3 + hittox;
                  hittox = 0; con = con + contox; contox = 0; spore = 0;
                  d = 154; e = 61; f = 6;
                } else {
                  hits = hits - 3; hitmax = hitmax - 3;
                  if (hits < 0) { st1 = 'a ' + gdy[iuse]; await Dead(0); }
                  if (z < 97) {
                    d = 155; e = 65; f = 3;
                  } else {
                    con = con - 1; rr = rr - 1;
                    Ljnkbig(155, 36, 23, 155, 61, 4, bl, 2, 2);
                  }
                }
                RemoveGoody(iuse, FALSE); deplete = FALSE;
                break;
              case nssd + ntechwep + 6: case nlsd + 107:  // watchman, WS TV
                if (incastle === -1 && castle !== 1 && castle !== 5 && castle !== 0 && (cRoll(2 + qb(berscience !== 0)) === 1)) {
                  cc = castle;
                } else {
                  cc = cRoll(14) - 1;
                }
                switch (cc) {
                  case 0: a = 205; b = 28; c = 11; break;
                  case 1: a = 78; b = 61; c = 6; break;
                  case 2: a = 417; b = 22; c = 12;                        // Munsters
                    if (incastle === -1 && castle === 2) MapLevel();
                    break;
                  case 3: a = 198; b = 49; c = 17;                        // Gilligan's
                    if (incastle === -1 && castle === 3) MapLevel();
                    break;
                  case 4: a = 106; b = 55; c = 13;                        // Trump
                    if (incastle === -1 && castle === 4) MapLevel();
                    break;
                  case 5: a = 0; b = 50; c = 18; break;
                  case 6: a = 1; b = 7; c = 1; d = 120; e = 35; f = 30;   // Grinch l2
                    if (incastle === -1 && castle === 6) MapLevel();
                    break;
                  case 7: a = 89; b = 38; c = 14; break;
                  case 8: a = 417; b = 34; c = 9; break;
                  case 9: a = 96; b = 29; c = 13; break;
                  case 10: a = 96; b = 42; c = 23; break;
                  case 11: a = 199; b = 43; c = 11; break;
                  case 12: a = 418; b = 1; c = 15; break;
                  case 13: a = 311; b = 62; c = 7; break;
                }
                Ljnkbig(81, 26, 25, a, b, c, bl, 1, 1); c = 0;
                keysave2 = TRUE; fatadd = 1; zippy = zippy - 2 + 2 * qb(numbr > 100);
                break;
              case nssd + ntechwep + 7:   // slinky
                d = 46; e = 45; f = 24; fatadd = 1;
                break;
              case nssd + ntechwep + 8:   // veg-o
                while (not(foundvic)) {
                  dx = cRoll(3) - 2;
                  dy = cRoll(3) - 2;
                  if (dx === 0 && dy === 0) {
                    d = 61; e = 45; f = 20; fatadd = 3; foundvic = TRUE;
                    hits = hits - cRoll(8);
                    if (hits < 0) { st1 = 'a ' + gdy[iuse]; await Dead(0); }
                  } else {
                    num = 0;
                    for (let j = 1; j <= nnear; j++) {
                      if (dx === ncre[j][4] && dy === ncre[j][5]) num = j;
                    }
                    if (num > 0) {
                      foundvic = TRUE; await Awaken(num); typ = ncre[num][1];
                      needed = 0; dam = cRoll(8);
                      if (Tasty(num)) {
                        dam = rolldice(8, 4, 4); hunger = hunger - 500;
                        if (hunger < -1999) hunger = -1999;
                      }
                      Ljnkbig(73, 1, 5, 0, 0, 0, gdy[iuse], 1, 1);
                      ({ need: needed } = await Explode(dx, dy, dam, 15, needed, 0, FALSE, 11, 1)); break ud2;
                    }
                  }
                }
                break;
              case nssd + ntechwep + 9:   // kaled
                zippy = zippy - 2; fatadd = 1; d = 220; e = 1; f = 37;
                break;
              case nssd + ntechwep + 10:  // f pen
                fatadd = 1; d = 221; e = 1; f = 37;
                break;
              case nssd + ntechwep + 11:  // camera
                [num, dx, dy] = await Target(num, 50, dx, dy, wallcolr); ClearMess();
                if (not(didstuff)) { PrintMessage(3, 0); break ud3; }
                if (Math.abs(dx) > Math.abs(dy)) {
                  if (Math.abs(dy) > Math.abs(dx) * 0.66) {
                    dy = 2 * sgn(dy);
                  } else if (Math.abs(dy) > Math.abs(dx) * 0.33) {
                    dy = sgn(dy);
                  } else {
                    dy = 0;
                  }
                  dx = 2 * sgn(dx);
                } else {
                  if (Math.abs(dx) > Math.abs(dy) * 0.66) {
                    dx = 2 * sgn(dx);
                  } else if (Math.abs(dx) > Math.abs(dy) * 0.33) {
                    dx = sgn(dx);
                  } else {
                    dx = 0;
                  }
                  dy = 2 * sgn(dy);
                }
                if (Math.abs(dx * dy) === 4) { dx = idiv(dx, 2); dy = idiv(dy, 2); }
                ljnk(130, 11, 14, 1); keysave2 = TRUE;
                await Explode(dx, dy, 1, 22, 5, 1, FALSE, 15, 10); fatadd = 1; l1 = bl;
                switch (cRoll(4)) {
                  case 1: d = 219; e = 40; f = 28; break;
                  case 2: d = 220; e = 38; f = 20; break;
                  case 3: d = 221; e = 38; f = 31; break;
                  default: d = 222; e = 1; f = 16;
                }
                break;
              case nssd + ntechwep + 12:  // hammock
                d = 250; e = 48; f = 20;
                asleep = TRUE; berhic = 0; sick = 0; fatadd = -8;
                break;
              case nssd + ntechwep + 13:  // voodoo doll
                typ = goody[iuse][5]; fatadd = 2;
                Ljnkbig(316, 1, 25, 0, 0, 0, gdy[iuse], 1, 1);
                for (let crit = nnear; crit >= 1; crit--) {
                  if (ncre[crit][1] === typ) await KillCreat(crit);
                }
                RemoveGoody(iuse, FALSE); deplete = FALSE;
                break;
              case nssd + ntechwep + 14:  // turbocharger
                ljnk(316, 26, 17, 1); k = 0; k = await SelectGoody(k, 11, FALSE);
                if (k < 1) { didstuff = FALSE; ClearMess(); PrintMessage(3, 0); break ud3; }
                switch (Math.abs(goody[k][1])) {
                  case 8:
                    if (not(goody[k][10])) { d = 77; e = 1; f = 32; didstuff = FALSE; break ud; }
                    switch (goody[k][11]) {
                      case 4: case 12: case 13: case 15: case 16:  // vehicles
                        goody[k][5] = goody[k][5] + 1;
                        if (goody[k][1] < 1) turbo = (2 + goody[k][5]) * 0.51;
                        d = 316; e = 43; f = 21;
                        break;
                      default: d = 153; e = 55; f = 12; didstuff = FALSE; break ud;
                    }
                    break;
                  case 9:
                    if (goody[k][3] === 7) {
                      goody[k][5] = goody[k][5] + 1;
                      if (goody[k][1] < 1) turbo = (2 + goody[k][5]) * 0.51;
                      d = 316; e = 43; f = 21;
                    } else {
                      d = 153; e = 55; f = 12; didstuff = FALSE; break ud;
                    }
                    break;
                  default: d = 153; e = 55; f = 12; didstuff = FALSE; break ud;
                }
                RemoveGoody(iuse, FALSE); deplete = FALSE;
                break;
              case nssd + ntechwep + 15:    // Chia pet
                a = 160; b = 1; c = 43; fatadd = 2;
                break;
              case nssd + ntechwep + 16:    // wristwatch
                timleft = Math.fround(10800 - gt); fatadd = 0; keysave2 = TRUE;
                if (notoxin > 0) {      // already released
                  a = 139; b = 1; c = 41;
                } else if (notoxin < 0) {  // successful
                  a = 140; b = 1; c = 42;
                } else {
                  d = 141; e = 1; f = 38; days = idiv(timleft, (60 * 24));
                  hrs = imod(idiv(timleft, 60), 24); mins = imod(timleft, 60);
                  if (days !== 1) d$ = 's,'; else d$ = ',';
                  if (hrs !== 1) h$ = 's,'; else h$ = ',';
                  if (mins !== 1) m$ = 's'; else m$ = '';
                  l1 = ltrim$(str$(days)) + ' day' + d$ + str$(hrs) + ' hour' + h$ + str$(mins) + ' minute' + m$ + ' remain';
                }
                break;
              case nssd + ntechwep + 17:     // radar gun
                fatadd = 1; [num, dx, dy] = await Target(num, 100, dx, dy, wallcolr); ClearMess();
                if ((not(didstuff))) { PrintMessage(1, 0); didstuff = FALSE; break ud3; }
                keysave2 = TRUE;
                if (num === -1) {
                  speed = -1;     // self
                  if (vehicle) {
                    switch (vehicle) {
                      case 1: speed = cint(-5 * turbo); break;
                      case 3: case 5: speed = cint(-2 * turbo); break;
                      case 4: case 6: case 7: speed = cint(-turbo); break;
                    }
                  }
                } else if (num > 0) {
                  speed = Math.abs(ncre[num][6]);
                } else {
                  speed = 0;
                }
                spd$ = str$(Math.abs(speed));
                if (speed === -1) { za = 147; zb = 28; zc = 12; ze = 21; zf = 16; }
                else if (speed < -1) { za = 147; zb = 28; zc = 12; ze = 37; zf = 17; }
                else if (speed === 1) { za = 143; zb = 1; zc = 20; ze = 21; zf = 16; }
                else { za = 143; zb = 1; zc = 20; ze = 37; zf = 17; }
                Ljnkbig(za, zb, zc, 143, ze, zf, spd$, 1, 1);
                break;
              case nssd + ntechwep + 18:     // radar detector
                a = 362; b = 16; c = 22; fatadd = 2;
                break;
              // ***********************************************************************
              case 101: case 102: case 103: case 107: case 118: case 119: case 120: case 125:
                // rad,heat,reflec,wet,camoflage,pinstripe,bullet
                if (radsuit | heatsuit | reflecsuit | wetsuit | spacesuit | camosuit | pinsuit | bulletsuit | neutronsuit) {
                  a = 307; b = 36; c = 29;
                  didstuff = FALSE;
                } else {
                  goody[iuse][1] = -8;
                  d = 69; e = 29; f = 17; addgdy = 2;
                  switch (goody[iuse][11]) {
                    case 1: fatadd = 6; radsuit = TRUE; break;
                    case 2: fatadd = 8; heatsuit = TRUE; break;
                    case 3: fatadd = 3; reflecsuit = TRUE; break;
                    case 7: fatadd = 10; wetsuit = TRUE; break;
                    case 18: fatadd = 4; camosuit = TRUE; break;
                    case 19: fatadd = 4; pinsuit = TRUE; break;
                    case 20: fatadd = 5; bulletsuit = TRUE; break;
                    case 25: fatadd = 6; neutronsuit = TRUE; break;
                  }
                }
                break;
              case 104: case 112: case 113: case 115: case 116:  // hover, golf,pogo,kayak,RubRaft
                d = 68; e = 47; f = 15; addgdy = 2;
                switch (goody[iuse][11]) {
                  case 4: vehicle = 1; inwater = FALSE; insand = FALSE;
                    inpit = FALSE; inweb = FALSE; inglue = FALSE; inbog = FALSE; break;
                  case 12: vehicle = 3; break;
                  case 13: vehicle = 4; break;
                  case 15: vehicle = 5; inwater = FALSE; insand = FALSE;
                    inpit = FALSE; inweb = FALSE; inglue = FALSE; inbog = FALSE; break;
                  case 16: vehicle = 6; inwater = FALSE; insand = FALSE;
                    inpit = FALSE; inweb = FALSE; inglue = FALSE; inbog = FALSE; break;
                }
                fatadd = fatig + 2; goody[iuse][1] = -8;
                turbo = (3 + 2 * goody[iuse][5]) * 0.334;
                break;
              case 105:   // computer workstation
                fatadd = 15; await Compute(1); keysave2 = TRUE; keysave2 = TRUE; break ud2;
              case 106:   // microwave
                ljnk(175, 27, 15, 1); k = 0; k = await SelectGoody(k, 11, FALSE);
                if (k < 1) { didstuff = FALSE; ClearMess(); PrintMessage(1, 0); break ud3; }
                switch (Math.abs(goody[k][1])) {
                  case 1: case 2: d = 158; e = 41; f = 26;
                    hunger = -1000; goody[k][3] = goody[k][3] - 1;
                    if (goody[k][3] < 1) {
                      goody[iuse][3] = goody[iuse][3] - 1;
                      RemoveGoody(k, FALSE); deplete = FALSE;
                    }
                    break;
                  case 6:
                    Ljnkbig(10, 61, 5, 15, 51, 7, gdy[k], 1, 1);
                    goody[k][4] = (goody[k][4] % 6) + 1;
                    switch (goody[k][4]) {
                      case 1: oldlen = 6; break;
                      case 2: oldlen = 3; break;
                      case 3: oldlen = 6; break;
                      case 4: oldlen = 6; break;
                      case 5: oldlen = 5; break;
                      default: oldlen = 4; goody[k][4] = 6;
                    }
                    l1 = rtrim$(l1) + bl + Kolr$(goody[k][4]);
                    gdy[k] = Kolr$(goody[k][4]) + right$(gdy[k], len(gdy[k]) - oldlen - 1);
                    break;
                  default:
                    if (Math.abs(goody[k][1]) === 9 && (goody[k][3] === 2)) {
                      gdy[k] = jnk$(139, 51, 17);
                      goody[k][5] = 1; a = 139; b = 42; c = 26;
                    } else {
                      ljnk(172, 1, 28, 2);
                      if (k < iuse) { const t = k; k = iuse; iuse = t; }
                      deplete = FALSE; RemoveGoody(k, FALSE);
                      if (k !== iuse) RemoveGoody(iuse, FALSE);
                    }
                }
                keysave2 = TRUE; fatadd = 3;
                break;
              // case 107 above
              case 108:   // safe
                if (nsafe > 9) {
                  didstuff = FALSE; ljnk(359, 42, 17, 2);
                  PrintMessage(2, 8); break ud;
                }
                ljnk(360, 31, 30, 1); k = 0; k = await SelectGoody(k, 14, FALSE);
                if (k < 1 || k === iuse) { didstuff = FALSE; ClearMess(); PrintMessage(1, 0); break ud3; }
                nsafe = nsafe + 1; saf[nsafe] = gdy[k]; goody[iuse][1] = -8;
                for (let j = 1; j <= 12; j++) safe[nsafe][j] = goody[k][j];
                safe[nsafe][1] = Math.abs(safe[nsafe][1]); deplete = FALSE;
                RemoveGoody(k, FALSE); fatadd = fatig + 3; keysave2 = TRUE;
                break;
              case 109:   // transmog
                fatadd = 6; [num, dx, dy] = await Target(num, 5.5, dx, dy, wallcolr); ClearMess();
                if ((not(didstuff))) { PrintMessage(1, 0); break ud3; }
                keysave2 = TRUE;
                if (num === -1) {    // self
                  ljnk(291, 1, 27, 1); k = 0; k = await SelectGoody(k, 11, FALSE);
                  if (k < 1) { didstuff = FALSE; ClearMess(); PrintMessage(1, 0); break ud3; }
                  ClearMess();
                  switch (Math.abs(goody[k][1])) {
                    case 1: case 2: d = 292; e = 1; f = 28;
                      goody[k][3] = goody[k][3] - 1;
                      if (goody[k][3] < 1) {
                        goody[iuse][3] = goody[iuse][3] - 1;
                        RemoveGoody(k, FALSE); deplete = FALSE;
                      }
                      break;
                    case 6: {
                      typ = cRoll(nberry);
                      goody[k][3] = typ;
                      let aa2, bb2, cc2;
                      switch (goody[k][5]) {
                        case 0: aa2 = -2; bb2 = 37; cc2 = 5; break;
                        case 1: aa2 = 7; bb2 = 63; cc2 = 6; break;
                        default: aa2 = 6; bb2 = 61; cc2 = 7;
                      }
                      st1 = jnk$(aa2, bb2, cc2);
                      gdy[k] = Kolr$(goody[k][4]) + berry$[typ] + bl + st1;
                      l2 = jnk$(292, 29, 17) + berry$[typ] + bl + st1;
                      aa = aa2; bb = bb2; cc = cc2;
                      break;
                    }
                    case 9: a = 77; b = 33; c = 15; break;
                    default: a = 77; b = 33; c = 15; d = 291; e = 28; f = 31;
                  }
                } else if (num > 0) {
                  await PolyCreat(dx, dy);
                } else {
                  didstuff = FALSE;
                }
                break;
              case 110:  // TK gun
                rng = 60; keysave2 = TRUE;
                [num, dx, dy] = await Target(num, rng, dx, dy, wallcolr); ClearMess();
                if (not(didstuff)) { PrintMessage(1, 0); break ud3; }
                needed = tohitbase - other2hitr - dex2hit - 10;
                dam = rolldice(30, 12, 12) + otherdam;
                if (berscience) { needed = needed - 4; dam = cint(dam * 1.5); }
                Ljnkbig(73, 1, 5, 0, 0, 0, gdy[iuse], 1, 1);
                ({ need: needed } = await Explode(dx, dy, dam, 1, needed, 1, TRUE, 11, 1));
                break ud2;
              case 111:   // jetpack
                fatadd = 6; ClearMess(); ljnk(232, 21, 20, 1);
                PrintMessage(11, 0);
                for (;;) {   // jetp:
                  await PauseForKey();
                  response = 1000 * (len(st1) - 1) + asc(right$(st1, 1));
                  if (response === 27) { didstuff = FALSE; ClearMess(); PrintMessage(1, 0); break ud3; }
                  if (response >= 1071 && response <= 1081) {
                    d = 182; e = 40; f = 9; vehtemp = vehicle; vehicle = 2;
                    dis = cint(30 - 1.5 * int(fatig)); if (dis < 10) dis = 10;
                    if (berscience) dis = dis * 2;
                    inwater = FALSE; [response, dis] = await Ride(response, dis); vehicle = vehtemp;
                    break;
                  }
                  Wrong();
                }
                sick = sick + cRoll(cRoll(20)); keysave2 = TRUE;
                break;
              // CASE 112, 113 above
              case 114:       // cloaking
                rnds = rolldice(7, 5, 5); invisible = invisible + rnds;
                PutSym(1, localx, localy, 8, 0, 1);
                d = 318; e = 16; f = 50;
                break;
              // CASE 15, 16 above
              case 117:    // home movie projector
                fatadd = 3; keysave2 = TRUE;
                if (cRoll(10 - 10 * qb(berscience !== 0)) === 1) {
                  Ljnkbig(290, 53, 12, 222, 1, 16, bl + bl, 1, 2);
                  goody[iuse][3] = 0; deplete = FALSE;
                } else {
                  switch (cRoll(4)) {
                    case 1: st1 = rtrim$(ltrim$(name$));
                      st1 = bl + right$(st1, len(st1) - instr(st1, bl));
                      Ljnkbig(318, 1, 15, 0, 0, 0, st1, 1, 2);
                      break;
                    case 2: d = 293; e = 1; f = 24; break;
                    case 3: st1 = rtrim$(ltrim$(name$));
                      blpos = instr(st1, bl);
                      if (blpos === 0) blpos = len(st1);
                      st1 = bl + left$(st1, blpos);
                      Ljnkbig(292, 46, 23, 0, 0, 0, st1, 1, 2);
                      break;
                    default: d = 293; e = 25; f = 22;
                  }
                  for (let ijk = 1; ijk <= nnear; ijk++) { ncre[ijk][11] = ncre[ijk][11] & ~1; ncre[ijk][13] = 0; }
                  grabbed = 0;
                }
                break;
              // cases 18-20 above
              case 121:  // repulsion field
                if (repulse) deplete = FALSE; else { goody[iuse][1] = -8; repulse = TRUE; }
                fatadd = 3; d = 121; e = 18; f = 34;
                break;
              case 122:   // displacer
                teleporting = TRUE; await Teleport(-2); teleporting = FALSE; fatadd = 3;
                break;
              case 123:   // jackhammer
                [num, dx, dy] = await Target(num, 1.5, dx, dy, 0); ClearMess();
                if (num === 0 || num === -1) { didstuff = FALSE; PrintMessage(1, 0); break ud3; }
                x = localx + dx; y = localy + dy;
                switch (-num) {
                  case 219:
                    if (incastle === 1) {
                      if (x > 2 && x < 51 && y > 2 && y < 21) {
                        PutSym(250, x, y, 8, 0, -1);
                      }
                    }
                    break;
                  case ur: case um: case ul: case ml: case mrt: case ll: case lm: case lr: case hor: case ver:
                  case cen: case lockeddoor:
                    if (incastle === 0) break ud3;
                    for (let j = x - 1; j <= x + 1; j++) {
                      for (let kk = y - 1; kk <= y + 1; kk++) {
                        [sym, fc, bc] = GetSym(j, kk, 2);
                        if (sym === 32) PutSym(219, j, kk, wallcolr, 0, -1);
                      }
                    }
                    PutSym(250, x, y, 8, 0, -1);
                    if (dark === 0) {
                      for (let j = x - 1; j <= x + 1; j++) {
                        for (let kk = y - 1; kk <= y + 1; kk++) {
                          savecorn = 0; DotIt(j, kk); DotCorn();
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
                  default:
                    if (-num >= -nnear && -num <= -1) {     // creatures
                      await Awaken(num); typ = ncre[num][1]; dam = rolldice(8, 6, 4);
                      Ljnkbig(73, 1, 5, 0, 0, 0, gdy[iuse], 1, 1);
                      needed = tohitbase - 5;
                      if (berscience) { needed = needed - 4; dam = cint(dam * 1.5); }
                      ({ need: needed } = await Explode(dx, dy, dam, 1, needed, 0, FALSE, 11, 1)); break ud2;
                    }
                    didstuff = FALSE;
                }
                break;
              case 124:    // tent
                hrs = idiv(imod(gt, 1440), 60);
                if (hrs < 6 || hrs > 20) {
                  d = 391; e = 1; f = 28; fatadd = 2;
                  asleep = TRUE; tent = TRUE; berhic = 0; sick = 0;
                } else {
                  d = 391; e = 29; f = 30; didstuff = FALSE;
                }
                break;
              // CASE 125    neutron suit, above
              case nlsd + 101:  // cig machine
                fatadd = 3; d = 79; e = 30; f = 22;
                break;
              case nlsd + 102:    // cabinet
                fatadd = 3; d = 222; e = 48; f = 10;
                break;
              case nlsd + 103:    // lipo
                fatadd = 5; d = 157; e = 1; f = 33;
                if (udder) { udder = FALSE; d = 242; e = 14; f = 23; }
                break;
              case nlsd + 104:    // still
                ljnk(171, 46, 13, 1); k = 0; k = await SelectGoody(k, 11, FALSE);
                if (k < 1) { didstuff = FALSE; ClearMess(); PrintMessage(1, 0); break ud3; }
                switch (Math.abs(goody[k][1])) {
                  case 1: case 2: d = 404; e = 37; f = 30;
                    goody[k][3] = goody[k][3] - 1;
                    if (goody[k][3] < 1) {
                      goody[iuse][3] = goody[iuse][3] - 1;
                      RemoveGoody(k, FALSE); deplete = FALSE;
                    }
                    break;
                  case 6:
                    switch (goody[k][5]) {
                      case 0: goody[k][5] = 1;
                        Ljnkbig(58, 1, 8, 7, 63, 6, bl, 1, 1);
                        gdy[k] = left$(gdy[k], len(gdy[k]) - 5) + jnk$(7, 63, 6);
                        break;
                      case 1: goody[k][5] = 2;
                        Ljnkbig(58, 1, 8, 6, 61, 7, bl, 1, 1);
                        gdy[k] = left$(gdy[k], len(gdy[k]) - 6) + jnk$(6, 61, 7);
                        break;
                      default: goody[k][5] = 2;
                        a = 175; b = 1; c = 26; goody[iuse][3] = goody[iuse][3] - 1;
                        RemoveGoody(k, FALSE); deplete = FALSE;
                    }
                    break;
                  case 9:
                    if (goody[k][3] === 2) {
                      gdy[k] = jnk$(139, 51, 17);
                      goody[k][5] = 1; a = 139; b = 42; c = 26;
                    } else {
                      d = 153; e = 55; f = 12; didstuff = FALSE;
                    }
                    break;
                  default: d = 153; e = 55; f = 12; didstuff = FALSE;
                }
                fatadd = 3; keysave2 = TRUE;
                break;
              case nlsd + 105:    // cyclotron
                fatadd = 3; d = 156; e = 35; f = 25;
                break;
              case nlsd + 106:    // Laserprinter
                d = 223; e = 1; f = 35; fatadd = 5;
                break;
              case nlsd + 108:    // Pros leg
                d = 222; e = 17; f = 31; fatadd = 3;
                break;
              case nlsd + 109:    // Dialysis
                d = 142; e = 49; f = 20; keysave2 = TRUE;
                fatadd = 10; con = con + contox; contox = 0;
                str = str + strtox; strtox = 0; dex = dex + dextox; dextox = 0;
                hits = hits + hittox; hitmax = hitmax + hittox; hittox = 0;
                hits = idiv(hitmax + hits, 2) + 1;
                if (berscience) hits = idiv(hitmax + hits, 2) + 1;
                sick = 0; tapeworm = FALSE; spore = 0;
                if (hunger > 0) hunger = hunger * 0.5;
                break;
              case nlsd + 110:  // potty
                a = 227; b = 33; c = 33; zz = cRoll(100); fatadd = 5;
                if (zz < 20) {
                  con = con - 1; contox = contox + 1;
                  d = 232; e = 1; f = 20; sick = sick + cRoll(10);
                } else if (zz < 40) {
                  str = str - 1; strtox = strtox + 1;
                  d = 232; e = 1; f = 20; sick = sick + cRoll(10);
                }
                break;
              case nlsd + 111: {   // sousa
                fatadd = 8; keysave2 = TRUE; effect = 1;
                const roll = cRoll(100);
                if (roll <= 10) { a = 123; b = 46; c = 19; effect = 0; }
                else if (roll <= 20) { a = 126; b = 12; c = 20; effect = 0; }
                else if (roll <= 29) { a = 125; b = 24; c = 18; }
                else if (roll <= 38) { a = 233; b = 26; c = 6; }
                else if (roll <= 47) { a = 233; b = 32; c = 17; }
                else if (roll <= 56) { a = 233; b = 49; c = 17; }
                else if (roll <= 65) { a = 129; b = 31; c = 10; }
                else if (roll <= 72) { a = 125; b = 15; c = 9; effect = 2; }
                else if (roll <= 78) { a = 234; b = 1; c = 23; effect = 2; }
                else if (roll <= 85) { a = 235; b = 10; c = 18; effect = 2; }
                else if (roll <= 92) { a = 129; b = 13; c = 15; effect = 2; }
                else if (roll <= 96) { a = 127; b = 50; c = 14; effect = 3; }
                else if (roll <= 98) { a = 122; b = 52; c = 15; effect = 4; }
                else { a = 127; b = 36; c = 14; effect = 4; }
                for (let ijk = 1; ijk <= nnear; ijk++) {  // wake up
                  if (SameRoom(ncre[ijk][4], ncre[ijk][5])) {
                    ncre[ijk][11] = ncre[ijk][11] | 1;
                  }
                }
                aa = 133; bb = 17; cc = 24;
                switch (effect) {
                  case 1: aa = 132; bb = 14; cc = 36; zippy = idiv(zippy, 2) * 2 + 2; break;
                  case 2: aa = 134; bb = 17; cc = 29; sousa = TRUE; break;
                  case 3: aa = 133; bb = 41; cc = 22;
                    for (let ijk = 1; ijk <= nnear; ijk++) ncre[ijk][11] = ncre[ijk][11] | 4;
                    break;
                  case 4: aa = 115; bb = 60; cc = 9;
                    for (let ijk = 1; ijk <= nnear; ijk++) {
                      ncre[ijk][11] = ncre[ijk][11] & ~1; ncre[ijk][13] = 0;
                    }
                    break;
                }
                Ljnkbig(233, 1, 25, a, b, c, bl, 2, 1); ljnk(aa, bb, cc, 2); c = 0;
                break;
              }
              case nlsd + 112:   // Kevorkian
                fatadd = 5; dam = rolldice(idiv(hitmax, 2), 4, 4);
                hits = hits - dam * (1 - qb(berscience !== 0));
                if (hits < 0) {
                  st1 = 'a ' + gdy[iuse]; await Dead(0);
                } else {
                  a = 154; b = 40; c = 21;
                }
                break;
              case nlsd + 113:       // Leafblower
                fatadd = 3; d = 147; e = 40; f = 22;
                break;
              default:
                if (numbr >= nssd + 1 && numbr <= nssd + ngrenade) {   // grenades
                  d = 78; e = 38; f = 23; didstuff = FALSE;
                } else if (numbr >= nssd + ngrenade + 1 && numbr <= nssd + ntechwep) {    // tech weps
                  keysave2 = TRUE; fatadd = fatig;
                  numshots = 1; damtype = goody[iuse][9]; colr = 14;
                  rng = Math.fround(goody[iuse][8] + 0.5);
                  needed = tohitbase - dex2hit - other2hitr - goody[iuse][7];
                  if (berscience) needed = needed - 3;
                  if (goody[iuse][11] === nssd + ngrenade + 6) {   // phaser
                    ClearMess();
                    ljnk(314, 1, 28, 1); PrintMessage(14, 0);
                    phasr: for (;;) {
                      await PauseForKey(); k = asc(st1);
                      switch (k) {
                        case 27: didstuff = FALSE; ClearMess(); break ud;
                        case 83: case 115: damtype = 27; rng = Math.fround(rng + 4); break phasr;  // stun
                        case 75: case 107: break phasr;    // kill
                        default: Wrong();
                      }
                    }
                  } else if (goody[iuse][11] === nssd + ngrenade + 19) {   // blaster
                    numshots = goody[iuse][3]; ClearMess();
                    Ljnkbig(117, 44, 18, 117, 62, 6, str$(numshots), 1, 1);
                    ljnk(118, 17, 24, 2); await MessPause(14, 0);
                  }
                  for (let izzz = 1; izzz <= numshots; izzz++) {
                    [num, dx, dy] = await Target(num, rng, dx, dy, wallcolr); ClearMess();
                    if ((not(didstuff) | qb(rng < crd(dx, dy))) !== 0) {
                      PrintMessage(1, 0); didstuff = FALSE;
                      if (izzz > 1) {
                        didstuff = TRUE; goody[iuse][3] = goody[iuse][3] - izzz + 2;
                      }              // will deplete 1 more below
                      break ud2;
                    }
                    dam = rolldice(goody[iuse][6], goody[iuse][5], goody[iuse][5]);
                    dam = dam + otherdam; r = 0;
                    if (berscience) dam = cint(dam * 1.5);
                    Ljnkbig(73, 1, 5, 0, 0, 0, gdy[iuse], 1, 1);
                    if (num > 0) typ = ncre[num][1]; else typ = 0;
                    switch (goody[iuse][11] - nssd - ngrenade) {
                      case 9: case 18:             // weedeater, chainsaw
                        if (num > 0) { if (Plant(num)) { dam = dam * 6; damtype = 15; } }
                        break;
                      case 10: r = 2; colr = 4; break;   // missile
                      case 11:                     // raid
                        if (num > 0) { if (Insect(num)) { dam = dam * 6; damtype = 15; } }
                        break;
                      case 12: r = -rng; colr = 4; break;   // flame
                      case 14: r = -rng; colr = 1; break;   // freeze
                      case 16:   // Mr Clean
                        if (num > 0) { if (Yuck(num)) { dam = dam * 6; damtype = 15; } }
                        break;
                      case 17:   // Bottle of Seltzer
                        if (typ === ant || typ === phoe) dam = dam * 10;
                        break;
                      case 20: r = -rng; colr = cRoll(15); break;   // silly string
                    }
                    ({ damtype, need: needed } = await Explode(dx, dy, dam, damtype, needed, r, TRUE, colr, 1));
                  }
                  goody[iuse][3] = goody[iuse][3] - numshots + 1; // will deplete 1 more below
                  break ud2;
                }
            }
            break;
          case 9:
            switch (goody[iuse][3]) {
              case 1:   // skiphat
                rng = 1; keysave2 = TRUE;
                [num, dx, dy] = await Target(num, rng, dx, dy, wallcolr); ClearMess();
                if ((not(didstuff) | qb(crd(dx, dy) > 1)) !== 0) {
                  PrintMessage(7, 0); break ud3;
                }
                needed = tohitbase - other2hitc - str2hit - 10;
                dam = cRoll(4); l1 = gdy[iuse];
                ({ need: needed } = await Explode(dx, dy, dam, 26, needed, 0, FALSE, 15, 1));
                break ud2;
              case 2:   // serum
                serum = gt + 1440 - 1440 * qb(goody[iuse][5] === 1);
                a$ = gdy[iuse]; st1 = bl; Ljnkbig(296, 27, 34, 0, 0, 0, a$, 1, 1);
                if (goody[iuse][5] === 1) {
                  cs = 42; ds = 297; es = 62; fs = 6;
                } else {
                  cs = 47; ds = 0; es = 0; fs = 0;
                }
                Ljnkbig(297, 1, cs, ds, es, fs, st1, 2, 2);
                RemoveGoody(iuse, FALSE); deplete = FALSE;
                break;
              case 3:   // map
                map = TRUE; a = 298; b = 1; c = 30; d = 298; e = 32; f = 26;
                PutSym(71, radzone[grinchzone][1], radzone[grinchzone][2], 13, 4, 0);
                radzone[grinchzone][3] = -Math.abs(radzone[grinchzone][1]);
                break;
              case 4:   // BSShoes
                if (boots | bsshoes) {
                  a = 308; b = 1; c = 31; didstuff = FALSE;
                } else {
                  fatadd = fatig / 2; bsshoes = TRUE; goody[iuse][1] = -9;
                  a = 69; b = 29; c = 17; addgdy = 1;
                  l2 = jnk$(299, 1, 20) + chr$(39);
                }
                break;
              case 5:   // Spacesuit
                if (radsuit | heatsuit | reflecsuit | wetsuit | spacesuit | camosuit | pinsuit | bulletsuit) {
                  a = 307; b = 36; c = 29; didstuff = FALSE;
                } else {
                  fatadd = 10; goody[iuse][1] = -9; spacesuit = TRUE;
                  a = 69; b = 29; c = 17; addgdy = 1; d = 299; e = 21; f = 25;
                }
                break;
              case 6:    // roastbeast
                d = 68; e = 26; f = 21; didstuff = FALSE;
                break;
              case 7:    // bamboo raft
                d = 68; e = 47; f = 15; addgdy = 2;
                vehicle = 7; inwater = FALSE; insand = FALSE;
                inpit = FALSE; inweb = FALSE; inglue = FALSE; inbog = FALSE;
                fatadd = fatig + 2; goody[iuse][1] = -9;
                turbo = (3 + 2 * goody[iuse][5]) * 0.334;
                break;
              case 8:   // Mets hat
                fatadd = 0; goody[iuse][1] = -9; metshat = TRUE;
                a = 69; b = 29; c = 17; addgdy = 1; d = 299; e = 21; f = 25;
                break;
              case 9:   // Ivana Wig
                if (goody[iuse][4] > 0) {
                  fatadd = 0; goody[iuse][1] = -9;
                  goody[iuse][4] = goody[iuse][4] - 1;
                  a = 69; b = 29; c = 17; addgdy = 1; d = 137; e = 1; f = 12;
                  mr = mr + 15; intl = intl - 15; str = str - 5; dex = dex - 5;
                } else {
                  Ljnkbig(169, 51, 5, 167, 59, 10, gdy[iuse], 1, 1); fatadd = 0;
                }
                break;
              default: didstuff = FALSE;
            }
            break;
          case 10: a = 352; b = 1; c = 37; break;
          default: didstuff = FALSE;
        }
      }
      // ud:
      st1 = ''; b$ = '';
      if (addgdy === 1) {
        st1 = gdy[iuse]; b$ = bl;
      } else if (addgdy === 2) {
        st1 = bl; b$ = gdy[iuse];
      }
      if (c > 0) Ljnkbig(a, b, c, 0, 0, 0, st1, 1, 1);
      if (f > 0) Ljnkbig(d, e, f, 0, 0, 0, b$, 1, 2);
      if (mirror) PrintMessage(3, 0); else await MessPause(3, 0);
    }
    // ud2:
    if (goody[iuse][3] > 0 && didstuff && deplete) goody[iuse][3] = goody[iuse][3] - 1;
  }
  // ud3:
  fatig = Fatigu(); await HungFatEnc(); await DisplayCharacter();
  if (not(didstuff)) keysave2 = FALSE;
}

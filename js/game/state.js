// ALPHA.DEC: constants and the COMMON SHARED variables of every module.
//
// Copyright (c) 1995 Jeffrey R. Olson (MIT license, see LICENSE)
//
// Shared scalars are defined as properties of the global object with setters
// that apply QuickBasic's conversion rules, so e.g. "hits = hits - dam / 2"
// rounds exactly as in the original (DEFINT A-Z: 16-bit integers, rounded
// to even).  Type-suffixed names lose their suffix (fatadd! -> fatadd).
'use strict';

// ------------------------------------------------------------ constants
const blk = 0, blu = 1, grn = 2, cyn = 3, red = 4, mag = 5, brn = 6, wht = 7;
const wallcolr = 9, pit = 10, trap = 19, secretdoor = 228, lockeddoor = 43;
const gas = 64, monosym = 227, nmonolith = 10, chasm = 31;
const pi = Math.fround(3.141593), TRUE = -1, FALSE = 0, bl = ' ';
const plains = 32, woods = 42, forest = 15, marsh = 176, swamp = 177, water = 247;
const ul = 201, um = 203, ur = 187, ml = 204, cen = 206, mrt = 185, ll = 200, lm = 202, lr = 188, hor = 205, ver = 186;
const hardplay = 0, moderateplay = 2, easyplay = 5;
const versiondate = 91094;

const nberry = 35;
const nphysmut = 17, nmentmut = 13;
const nwep = 14, nrwep = 12;
const nsh = 9, narm = 12;
const nssd = 38, ngrenade = 14, ntechwep = 37, nstrash = 18;
const nlsd = 25, nltrash = 13;

const ncreat = 66;
const crecas = 18;
const crefor = 17;
const creswa = 17;
const crepla = 17;
const creh2o = 23;
const creextra = crecas + crefor + creswa + crepla + creh2o;

const wimp = 1, centi = wimp + 2;
const snail = centi + 1, daff = snail + 3;
const aspa = daff + 1, dung = aspa + 1, ant = dung + 1, gspore = ant + 2;
const dfly = gspore + 1;
const lotus = dfly + 5, cb = lotus + 1, fish = cb + 3;
const rose = fish + 1, zap = rose + 1, mant = zap + 1;
const japb = mant + 1, mph = japb + 1;
const sunf = mph + 1, rweed = sunf + 1, bee = rweed + 1;
const roach = bee + 3, pryor = roach + 2, goat = pryor + 2;
const icew = goat + 1, rotf = icew + 1;
const pokey = rotf + 1, gumby = pokey + 1, tworm = gumby + 1;
const slug = tworm + 1, venus = slug + 3, blob = venus + 1;
const bush = blob + 2, quayle = bush + 1;
const tara = quayle + 2, phoe = tara + 1, scor = phoe + 1;
const robot = scor + 2, bwid = robot + 1, mosq = bwid + 2;
const kong = mosq + 5, rodan = kong + 1, godz = rodan + 1;

const slime = ncreat + 1;
const ooze = slime + 1, rdro = ooze + 2, magg = rdro + 1;
const rat = magg + 1, pmold = rat + 1, ddro = pmold + 2;
const gmold = ddro + 1, wspid = gmold + 2, efung = wspid + 1;
const volte = efung + 1, brecl = volte + 1;
const sdro = brecl + 1, brain = sdro + 1;
const wdro = brain + 1;

// '10000*move+10*HD+AC+, spec.def, 1000*clr+sym , susceptibility, exp
// '100*str+2hitbase, 100*attack type+range, ..., ..., ..., ...

const tfrog = ncreat + crecas + 1;
const svine = tfrog + 1, pivy = svine + 1, stool = pivy + 1;
const term = stool + 1, mush = term + 1, nshade = mush + 4;
const algore = nshade + 1, fern = algore + 1;
const bfoot = fern + 1, wil = bfoot + 2, raptor = wil + 1;

const leec = ncreat + crecas + crefor + 2;
const mold = leec + 1, gcrab = mold + 1, bbeet = gcrab + 3;
const tick = bbeet + 1, puff = tick + 1;
const dweed = puff + 1, gworm = dweed + 2, bogh = gworm + 5;

const chick = ncreat + crecas + crefor + creswa + 1;
const moth = chick + 3, stink = moth + 2, hyena = stink + 3, fox = hyena + 1;
const gwasp = fox + 1, locust = gwasp + 1, bunny = locust + 2;
const cact = bunny + 2;

const kelp = ncreat + crecas + crefor + creswa + crepla + 1;
const sard = kelp + 1, sgull = sard + 2, lobstr = sgull + 1;
const urchin = lobstr + 4, jelly = urchin + 1, squid = jelly + 1;
const rsnap = squid + 3, octopus = rsnap + 3;

const webspid = ncreat + creextra + 1;

const gill = webspid + 1;
const skip = gill + 1, prof = skip + 1, ging = prof + 1, mary = ging + 1;
const mrhow = mary + 1, mrshow = mrhow + 1;

const herm = mrshow + 1, lily = herm + 1, gramp = lily + 1, eddie = gramp + 1;
const mara = eddie + 1, spot = mara + 1, igor = spot + 1, fester = igor + 1;

const elvimp = fester + 1, elvis = elvimp + 1;

const buzz = elvis + 1, zola = buzz + 1, mdeck = zola + 1, ghart = mdeck + 1;
const saddam = ghart + 1, cubs = saddam + 1;

const trump = cubs + 1, ivana = trump + 1, marla = ivana + 1;

const grinch = marla + 1, gdog = grinch + 1;

// ------------------------------------------------------ typed globals
const QB_GLOBALS = {};   // name -> type, for resetState()

function defGlobal(name, type) {
  let value = type === 'str' || type === 'fixed54' ? (type === 'str' ? '' : ' '.repeat(54)) : 0;
  let conv;
  switch (type) {
    case 'int': conv = cint; break;
    case 'long': conv = clng; break;
    case 'single': conv = Math.fround; break;
    case 'str': conv = (v) => v; break;
    case 'fixed54': conv = (v) => fixstr(v, 54); break;
  }
  const numeric = type !== 'str' && type !== 'fixed54';
  Object.defineProperty(globalThis, name, {
    configurable: true,
    get() { return value; },
    set(v) {
      if (numeric ? typeof v !== 'number' : typeof v !== 'string') {
        console.error('type error assigning', name, v, new Error().stack);
      }
      value = conv(v);
    },
  });
  QB_GLOBALS[name] = type;
}

const INT_GLOBALS = `nnear incastle dots finishedcastles
  vpage mainx mainy localx localy terrain terrf terrb
  currsym currf currb ncastle looksym
  str stradd dex dexadd con rr mr intl hitmax hits
  hunger lvl
  shield armor pmut mmut
  lwall rwall twall bwall lwscr rwscr bwscr twscr
  ngoody npack ndropped nsafe
  ac str2hit strdam dex2hit other2hitc other2hitr otherdam
  tohitbase lpoint
  radsuit heatsuit reflecsuit flashlight gasmask sunglasses
  wetsuit mask boots ffgen sunscreen camosuit pinsuit
  uvhelmet neutronsuit
  forcefield shock touch mheal pmutturns mmutturns looking
  teleporting inwater waterturns inpit inweb zippy wpturns
  rdisp didstuff pooped messturn tentgrab
  castle castlelevel bldg nruins starting
  crtyp savecorn
  xenter yenter xenterscr yenterscr enterdir bitit
  berstr berdex bercon berrr bermr berintl berac skinac
  berpmut bermmut berconfuse berdet berblind berhic
  berscience berscare berrambo berfresh
  berklutz klutzdex berregen beryum berff
  berhpmut berhmmut
  strtox dextox contox hittox
  weather wind rside roachdef radint attractx attracty
  agin keysave1 keysave2 keysave3
  dark confu grabbed vehicle asleep invisible sick udder
  moon stopfastmove wimpsym wimpcolr flare
  mirror coffee tapenum elvislevel grinchlevel grinchzone
  bsshoes spacesuit bergreen map tapeworm didmusk
  bulletsuit brandy inglue inbog insand hail tent
  xmono ymono mononum notoxin metshat answer
  mindweb sousa repulse ripehrs spore
  difficulty fastfight`.split(/\s+/);
for (const n of INT_GLOBALS) defGlobal(n, 'int');
for (const n of ['fatigue', 'fatig', 'seed', 'fatadd', 'gt', 'turbo', 'serum']) defGlobal(n, 'single');
for (const n of ['expr', 'grinchstole']) defGlobal(n, 'long');
for (const n of ['st1', 'name$', 'pmutn$', 'mmutn$', 's$', 't$', 'ber$', 'wimpname$']) defGlobal(n, 'str');
for (const n of ['l1', 'l2', 'l3']) defGlobal(n, 'fixed54');

// ------------------------------------------------------ shared arrays
// (OPTION BASE 1: a bound n means 1..n; index 0 exists but is unused.)
let wep, sh, arm, symb, gdy, goody, bakpak, backpack, saf, safe, drgdy, drgoody;
let ncre, scratch, localgoody, goodythere, goodycastle;
let knownb, berry$, berord, ssd, ssdtyp, ssdknown, lsd, lsdtyp, lsdknown;
let radzone, savcrn, monozone, xstairs, ystairs, pag2, lsave;

// STATIC variable of KillCreat (A4).
let firstspecial = 0;

function resetState() {
  firstspecial = 0;
  for (const [n, type] of Object.entries(QB_GLOBALS)) {
    globalThis[n] = type === 'str' ? '' : type === 'fixed54' ? '' : 0;
  }
  wep = dimInt(26, 6); sh = dimInt(9, 2); arm = dimInt(12, 2);
  symb = dimInt(10, 3);
  gdy = dimStr(21); goody = dimInt(21, 12);
  bakpak = dimStr(10); backpack = dimInt(10, 12);
  saf = dimStr(10); safe = dimInt(10, 12);
  drgdy = dimStr(30); drgoody = dimInt(30, 16);
  ncre = dimInt([0, 50], [0, 15]); scratch = dimInt(50); localgoody = dimInt(30, 3);
  goodythere = dimInt([2, 51], [2, 21]); goodycastle = dimInt([0, 6], [-10, 10]);
  knownb = dimInt([0, 40]); berry$ = dimStr([0, 40]); berord = dimInt([0, 40]);
  ssd = dimInt(95, 9); ssdtyp = dimInt(95); ssdknown = dimInt(95);
  lsd = dimInt(40, 4); lsdtyp = dimInt(40); lsdknown = dimInt(40);
  radzone = dimInt(10, 3); savcrn = dimInt(30, 2); monozone = dimInt(10, 3);
  xstairs = dimInt([-10, 10]); ystairs = dimInt([-10, 10]); pag2 = dimInt([1, 52], [1, 22]);
  lsave = dimArray(' '.repeat(54), [1, 3], [0, 10]);
}
resetState();

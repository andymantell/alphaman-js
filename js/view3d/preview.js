// Previews of the outdoor areas next to the current one: their terrain and
// buildings, exactly as the game will generate them when the character walks
// in.  An area's terrain depends only on the game's seed and the area's
// position on the main map (DetailedMap reseeds both random number
// generators from them), so it can be worked out in advance.
//
// This repeats the start of DetailedMap (A4) up to the buildings, calling
// the game's own cdetailedmap, box, finddot and PutSym.  Those write to the
// game's screen pages and random number generators, so everything they touch
// is saved first and put back afterwards: the game never sees a difference.
// Creatures, items, traps and webs are not previewed; they only exist once
// the character arrives.

const MAIN_TERRAIN = new Set([15, 42, 32, 176, 177, 247, 234, 239, 30, 94, 127, 71]);
const BUILDINGS = new Set([234, 239, 30, 94, 127, 71]);

// The terrain MoveMain would set on entering main map square (mx, my).
function enteredTerrain(mx, my) {
  let t = SCR.getCell(0, mx, my) & 255;
  if (mx === mainx && my === mainy) t = terrain;      // the player's own square
  if (!MAIN_TERRAIN.has(t)) t = 32;
  for (let i = 1; i <= 10; i++) {
    if (mx === radzone[i][1] && my === radzone[i][2] && i === grinchzone) t = 71;
  }
  return t;
}

function saveState() {
  return {
    pag2: pag2.map((col) => (col ? Array.from(col) : col)),
    page1: SCR.pages[1].slice(),
    dirty: SCR.dirty,
    rndSeed, rndLast, cRandState,
  };
}

function restoreState(s) {
  for (let x = 0; x < s.pag2.length; x++) if (s.pag2[x]) pag2[x].set(s.pag2[x]);
  SCR.pages[1].set(s.page1);
  SCR.dirty = s.dirty;
  rndSeed = s.rndSeed; rndLast = s.rndLast; cRandState = s.cRandState;
}

// Generates main map square (mx, my) into the game's page 2 (pag2).
function generate(mx, my) {
  const ter = enteredTerrain(mx, my);
  const scratchT = [0, 0, 0, 0, 0];
  let x = 0;

  crandomize(seed + 1.3 * mx + 62.2 * my);
  rnd(Math.fround(-(seed + 1.3 * mx + 62.2 * my)));
  for (let i = 1, n = (mx % 5) * 7 + (my % 11) * 3; i <= n; i++) x = cint(rnd() + cRoll(10));

  let t1 = ter;
  for (let i = 1; i <= 4; i++) {
    const j = (i - 2) % 2, k = (i - 3) % 2;
    const nx = mx + j, ny = my + k;
    let s = SCR.getCell(0, nx, ny) & 255;
    // The game's own square shows the character there; when the character
    // walks in, MoveMain will have put the square's terrain back.
    if (nx === mainx && ny === mainy) s = terrain;
    if (t1 === 247) s = 247;
    switch (s) {
      case 15: case 42: case 176: case 177: case 32: case 247: break;
      default: s = t1;
    }
    scratchT[i] = s;
  }
  switch (t1) {
    case 234: case 239: case 30: case 94: case 127: case 71: {
      const j = cRoll(3);
      t1 = scratchT[j];
      switch (t1) {
        case 234: case 239: case 30: case 94: case 127: case 71: t1 = scratchT[j + 1]; break;
        default: t1 = 32;
      }
      break;
    }
  }
  cdetailedmap(t1, scratchT[1], scratchT[2], scratchT[3], scratchT[4]);

  let ruins = qb(cRoll(7) === 1) * (2 * qb(cRoll(3) === 1) + 1);
  let bldg = FALSE, monolith = FALSE, castleNo = 0, maxlevel = 0, minlevel = 0;
  let lwall = 0, rwall = 0, twall = 0, bwall = 0, lwscr = 0, rwscr = 0, twscr = 0, bwscr = 0;
  for (let i = 1; i <= nmonolith; i++) {
    if (monozone[i][1] === mx && monozone[i][2] === my) { ruins = 0; monolith = TRUE; }
  }
  if (BUILDINGS.has(ter)) {
    switch (ter) {
      case 127: castleNo = 1; maxlevel = 4; minlevel = -4; break;
      case 30: castleNo = 2; maxlevel = 0; minlevel = -7; break;
      case 239: castleNo = 3; maxlevel = 5; minlevel = -2; break;
      case 234: castleNo = 4; maxlevel = 7; minlevel = 0; break;
      case 94: castleNo = 5; maxlevel = 2; minlevel = -5; break;
      case 71: castleNo = 6; maxlevel = 5; minlevel = -5; break;
    }
    bldg = TRUE;
    lwall = 5; rwall = 48; twall = 3; bwall = 20;
    lwscr = 15; rwscr = 37; twscr = 6; bwscr = 15;
  } else if (ter !== 247) {
    if (ruins < 0) {
      bldg = TRUE; castleNo = 0;
      maxlevel = cRoll(cRoll(5)); minlevel = -cRoll(cRoll(5));
      lwall = 5 + cRoll(17); rwall = 48 - cRoll(18);
      twall = 3 + cRoll(5); bwall = 19 - cRoll(4);
      let dx = cint((rwall - lwall) / 3), dy = cint((bwall - twall) / 3);
      if (dx < 3) dx = 3;
      if (dy < 2) dy = 2;
      lwscr = cRoll(42 - dx) + 5; twscr = cRoll(16 - dy) + 3;
      rwscr = lwscr + dx; bwscr = twscr + dy;
    } else if (ruins > 0) {
      const xe = cRoll(30) + 10, ye = cRoll(8) + 6;
      PutSym(240, xe, ye, 5, 0, 2);
    } else if (monolith) {
      const [xm, ym] = finddot(0);
      PutSym(monosym, xm, ym, 11, 0, 2);
    }
  }
  if (bldg) {
    box(lwscr, rwscr, twscr, bwscr, 2, wallcolr, 2);
    if (castleNo === 6) {
      for (let i = lwscr - 1; i <= rwscr + 1; i++) {
        PutSym(chasm, i, twscr - 1, 8, 0, 2); PutSym(chasm, i, bwscr + 1, 8, 0, 2);
      }
      for (let i = twscr; i <= bwscr; i++) {
        PutSym(chasm, lwscr - 1, i, 8, 0, 2); PutSym(chasm, rwscr + 1, i, 8, 0, 2);
      }
    }
    for (let s2 = minlevel; s2 <= maxlevel - 1; s2++) {
      cRoll(rwall - lwall - 5); cRoll(bwall - twall - 5);      // stairs positions
    }
    const enterdir = cRoll(4), zz = cRoll(100);
    let xs = idiv(zz * (rwscr - lwscr - 2), 100) + 1 + lwscr;
    let ys = idiv(zz * (bwscr - twscr - 2), 100) + 1 + twscr;
    switch (enterdir) {
      case 1: xs = lwscr; break;
      case 2: xs = rwscr; break;
      case 3: ys = bwscr; break;
      default: ys = twscr;
    }
    let doorsym = cen;
    if (castleNo === 6 || cRoll(10) === 1) doorsym = lockeddoor;
    PutSym(doorsym, xs, ys, wallcolr, 0, 2);
    for (let i = lwscr + 1; i <= rwscr - 1; i++) {
      for (let j = twscr + 1; j <= bwscr - 1; j++) PutSym(32, i, j, 7, 0, 2);
    }
  }
}

// Returns the cells (2..51, 2..21) of main map square (mx, my) as an array
// of [x, y, attr << 8 | code], or null if it is not an area on the map.
export function previewArea(mx, my) {
  if (mx < 2 || mx > 51 || my < 2 || my > 21) return null;
  const saved = saveState();
  const cells = [];
  try {
    generate(mx, my);
    for (let x = 2; x <= 51; x++) {
      for (let y = 2; y <= 21; y++) {
        const v = pag2[x][y];
        const code = v & 255, fc = (v >> 8) & 15, bc = (v >> 12) & 7;
        if (code !== 32 || bc) cells.push([x, y, ((bc << 4) | fc) << 8 | code]);
      }
    }
  } finally {
    restoreState(saved);
  }
  return cells;
}

// Tests the touch controls in a phone-sized Chromium, sideways and upright:
// everything shown in the panel on the right of the game screen (stats,
// items, in-use marks, the mutation choices, the location box, live
// updates), the inventory popup and its actions, picking an item when the
// game asks, the answer buttons, whole-screen pages, and walking by touch.
// Upright, the panel is laid out again under the map (the split layout), so
// the tests also check that every copied part matches the game screen
// pixel for pixel and that taps land on the square they show.  Finally it
// checks that the desktop page has none of this.
//
//   node tools/test-touch.mjs      (needs the playwright package and Chromium)
//
// The game starts with a random character, so the checks only rely on what
// every new character has (starting equipment, two mutations ready).
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node-tools/node_modules/playwright'); }

// A small static server for the page.
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${server.address().port}/index.html`;

let failures = 0;
function check(layout, name, ok, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} [${layout}] ${name}${!ok && detail ? ' -- ' + detail : ''}`);
}
const wait = (page, ms) => page.waitForTimeout(ms);

// ---- Page helpers (run in the browser).
const state = (page) => page.evaluate(() => ({
  kind: GameWait.kind, info: GameWait.info, vpage: SCR.vpage, rdisp, ngoody, x: localx, y: localy,
  split: AlphaManTouch.isSplit(), lpoint,
}));
const rowText = (page, row, from = 1, to = 80) => page.evaluate(([row, from, to]) => {
  let t = '';
  for (let c = from; c <= to; c++) t += String.fromCharCode(SCR.getCell(SCR.vpage, c, row) & 255);
  return t;
}, [row, from, to]);
async function tapCell(page, col, row) {
  const p = await page.evaluate(([c, r]) => AlphaManTouch.whereIs(c, r), [col, row]);
  if (!p) throw new Error(`square ${col},${row} is not shown`);
  await page.touchscreen.tap(p.x, p.y);
}
// Answers messages ("press space") until the game waits for a command.
async function settle(page) {
  for (let i = 0; i < 30; i++) {
    const s = await state(page);
    if (s.kind === 'command') return s;
    if (s.kind === 'continue' || s.kind === 'key') await page.evaluate(() => KB.push(' '));
    else if (s.kind === 'choice' || s.kind === 'item' || s.kind === 'target') await page.evaluate(() => KB.push('\x1b'));
    await wait(page, 150);
  }
  return state(page);
}
// Keys the touch controls send, recorded.
const recordKeys = (page) => page.evaluate(() => {
  if (!window.sentKeys) { const push = KB.push.bind(KB); KB.push = (k) => { window.sentKeys.push(k); push(k); }; }
  window.sentKeys = [];
});
const sentKeys = (page) => page.evaluate(() => window.sentKeys);
// Compares the split layout's copies with the game screen: the map, the
// messages, the location box and every panel line.  Returns the parts that
// differ.
const compareCopies = (page) => page.evaluate(() => {
  const screen = document.getElementById('screen').getContext('2d');
  const map = document.querySelector('#pm-map canvas').getContext('2d');
  const msg = document.getElementById('pm-msg').getContext('2d');
  const panel = document.getElementById('pm-panel').getContext('2d');
  const same = (a, b) => { for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) return false; return true; };
  const bad = [];
  if (!same(screen.getImageData(0, 0, 468, 352), map.getImageData(0, 0, 468, 352))) bad.push('map');
  if (!same(screen.getImageData(0, 352, 486, 48), msg.getImageData(0, 0, 486, 48))) bad.push('messages');
  if (!same(screen.getImageData(495, 368, 225, 16), panel.getImageData(18, 0, 225, 16)) ||
      !same(screen.getImageData(495, 384, 225, 16), panel.getImageData(243, 0, 225, 16))) bad.push('location');
  for (const { row, side, line } of AlphaManTouch.panelLines()) {
    if (!same(screen.getImageData(477, (row - 1) * 16, 243, 16), panel.getImageData(side * 243, line * 16, 243, 16))) bad.push('panel row ' + row);
  }
  return bad;
});
// Panel rows (columns 54-80) that show something.
const panelRows = (page) => page.evaluate(() => {
  const rows = [];
  for (let r = 1; r <= 22; r++) {
    for (let c = 54; c <= 80; c++) { const ch = SCR.getCell(SCR.vpage, c, r) & 255; if (ch !== 32 && ch !== 0) { rows.push(r); break; } }
  }
  return rows;
});
// A neighbouring square that can be walked onto, as [dx, dy].
const freeStep = (page) => page.evaluate(() => {
  const open = new Set([32, 46, 250, 249, 44, 39, 96, 0]);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = localx + dx, y = localy + dy;
    if (x < 3 || x > 50 || y < 3 || y > 20) continue;
    if (open.has(SCR.getCell(1, x, y) & 255) && open.has(SCR.getCell(2, x, y) & 255)) return [dx, dy];
  }
  return null;
});

async function run(browser, layout, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL_);
  await wait(page, 800);
  const upright = height > width;

  // Start: the character screen, then the overview question.
  check(layout, 'start screen shown', await page.isVisible('#touch-start'));
  await page.tap('#touch-start .row button');
  await wait(page, 2500);
  let s = await state(page);
  const answers = await page.$$eval('#touch-answers.show .tk', (b) => b.map((x) => x.textContent));
  check(layout, 'overview question has Yes / No buttons', s.kind === 'choice' && answers.join() === 'Yes,No', JSON.stringify(answers));
  await page.tap('#touch-answers .tk >> text=No');
  s = await settle(page);
  check(layout, 'game waits for a command', s.kind === 'command', s.kind);

  // Layout.
  check(layout, upright ? 'split layout upright' : 'whole screen sideways', s.split === upright);
  check(layout, 'game screen canvas shown only when not split',
    (await page.$eval('#screen', (c) => getComputedStyle(c).visibility)) === (upright ? 'hidden' : 'visible'));

  // Where the keys are: upright, a row above the screen and a keyboard with
  // direction keys below it; sideways, columns either side.
  const keys = await page.evaluate(() => {
    const at = (id) => { const b = document.querySelector(`.tk[data-k="${id}"]`); return b && b.isConnected && b.getBoundingClientRect().height > 0 ? b.parentElement.id : null; };
    const screenBox = document.getElementById('viewport').getBoundingClientRect();
    const top = document.getElementById('touch-top').getBoundingClientRect();
    const space = document.querySelector('.tk[data-k=space]').getBoundingClientRect(), enter = document.querySelector('.tk[data-k=enter]').getBoundingClientRect();
    return {
      ids: Object.fromEntries(['inv', 'F5', 'F3', 'F4', 'help', 'esc', 'more', 'n', 'so', 'e', 'w', 'space', 'enter'].map((id) => [id, at(id)])),
      topAbove: top.height > 0 && top.bottom <= screenBox.top + 1,
      spaceEnterLine: Math.abs(space.top - enter.top) < 2 && space.height > 0,
      typeKey: !!document.querySelector('.tk[data-k=kbd]'),
    };
  });
  if (upright) {
    check(layout, 'F keys, help, Esc and More above the screen', keys.topAbove && ['F5', 'F3', 'F4', 'help', 'esc', 'more'].every((k) => keys.ids[k] === 'touch-top'), JSON.stringify(keys.ids));
    check(layout, 'direction keys and commands below the screen', ['n', 'so', 'e', 'w', 'inv', 'space', 'enter'].every((k) => keys.ids[k] === 'touch-bottom'), JSON.stringify(keys.ids));
  } else {
    check(layout, 'keys either side of the screen', ['inv', 'F5', 'F3', 'F4'].every((k) => keys.ids[k] === 'touch-left') && ['help', 'esc', 'more', 'space', 'enter'].every((k) => keys.ids[k] === 'touch-right'), JSON.stringify(keys.ids));
    check(layout, 'no direction keys sideways (taps and swipes instead)', !keys.ids.n);
  }
  check(layout, 'Space and Enter on one line', keys.spaceEnterLine);
  check(layout, 'no type key', !keys.typeKey);

  // Stats panel.
  if (s.rdisp !== 1) { await page.tap('.tk[data-k=inv]'); await wait(page, 400); }
  const name = (await page.evaluate(() => name$)).trim();
  check(layout, 'stats panel shows the name', (await rowText(page, 2, 55, 80)).trim() === name, name);
  const statRows = await panelRows(page);
  check(layout, 'stats panel rows', [2, 3, 4, 5, 6, 7, 8, 10, 11, 13, 14, 15, 17, 18].every((r) => statRows.includes(r)), statRows.join());
  check(layout, 'location box shown', /Main Map|Local Region/.test(await rowText(page, 24, 56, 80)));
  if (upright) {
    await wait(page, 100);
    const lines = await page.evaluate(() => AlphaManTouch.panelLines().map((p) => p.row));
    check(layout, 'every stats row is laid out', lines.join() === statRows.join(), lines.join());
    const bad = await compareCopies(page);
    check(layout, 'stats, map, messages and location copied exactly', bad.length === 0, bad.join());
  }

  // Live updates: hit points and hunger.
  const hits0 = await page.evaluate(() => hits);
  await page.evaluate(() => { hits = hits - 1; ShowHits(); });
  await wait(page, 150);
  check(layout, 'hit points update in the panel', (await rowText(page, 10, 54, 60)).trim().startsWith(String(hits0 - 1)));
  if (upright) check(layout, 'hit point change copied', (await compareCopies(page)).length === 0);
  await page.evaluate(() => { hits = hits + 1; ShowHits(); });
  await page.evaluate(async () => { hunger = 1500; await HungFatEnc(); });
  await wait(page, 150);
  const hungerText = await rowText(page, 13, 55, 80);
  check(layout, 'hunger updates in the panel', !/Very Full/.test(hungerText), hungerText.trim());
  if (upright) check(layout, 'hunger change copied', (await compareCopies(page)).length === 0);
  await page.evaluate(async () => { hunger = -1000; await HungFatEnc(); });

  // Inventory.
  await page.tap('.tk[data-k=inv]');
  await wait(page, 400);
  s = await state(page);
  check(layout, 'Inv shows the items', s.rdisp === 2);
  check(layout, 'the inventory key reads i inv/stats', (await page.$eval('.tk[data-k=inv]', (x) => x.textContent)) === 'iinv/stats');
  const itemRows = await panelRows(page);
  check(layout, 'one panel row per item', itemRows.join() === Array.from({ length: s.ngoody }, (_, i) => i + 2).join(), itemRows.join());
  if (upright) check(layout, 'items copied exactly', (await compareCopies(page)).length === 0);

  // The popup: Unuse for an item in use (*), Use otherwise, Eat only for food.
  const marks = await page.evaluate((n) => Array.from({ length: n }, (_, i) => ({
    row: i + 2, inUse: (SCR.getCell(SCR.vpage, 54, i + 2) & 255) === 42, edible: [1, 2, 6].includes(Math.abs(goody[i + 1][1])),
    text: (() => { let t = ''; for (let c = 57; c <= 80; c++) t += String.fromCharCode(SCR.getCell(SCR.vpage, c, i + 2) & 255); return t.trim(); })(),
  })), s.ngoody);
  check(layout, 'starting equipment is marked in use', marks.some((m) => m.inUse));
  for (const m of [marks.find((x) => x.inUse), marks.find((x) => !x.inUse)].filter(Boolean)) {
    await tapCell(page, 60, m.row);
    await wait(page, 250);
    const pop = await page.evaluate(() => {
      const p = document.getElementById('touch-popup');
      return { shown: !p.hidden, title: p.querySelector('p') && p.querySelector('p').textContent, acts: [...p.querySelectorAll('.tk')].map((b) => b.querySelector('kbd').textContent + ' ' + b.querySelector('.label').textContent) };
    });
    // Each action with the game's key for it.
    const want = [m.inUse ? 'U Unuse' : 'u Use', ...(m.edible ? ['e Eat'] : []), 't Throw', 'f Figure out', 'X Examine', 'd Drop', 'Esc Cancel'];
    check(layout, `popup for "${m.text}"`, pop.shown && pop.title === m.text && pop.acts.join() === want.join(), JSON.stringify(pop));
    await page.tap('#touch-popup .tk >> text=Cancel');
    await wait(page, 150);
  }
  check(layout, 'popup closed by Cancel', await page.$eval('#touch-popup', (p) => p.hidden));

  // Examine from the popup: the command, "an item" and the item are sent.
  await recordKeys(page);
  const lp = (await state(page)).lpoint;
  await tapCell(page, 60, 2);
  await wait(page, 250);
  await page.tap('#touch-popup .tk >> text=Examine');
  await wait(page, 800);
  check(layout, 'Examine sends X, I and the item', (await sentKeys(page)).join('') === 'XIa', JSON.stringify(await sentKeys(page)));
  check(layout, 'the game describes the item', (await state(page)).lpoint !== lp);
  s = await settle(page);

  // Picking an item when the game asks: X, then "An item", then a tap.
  await recordKeys(page);
  await page.evaluate(() => KB.push('X'));
  await wait(page, 300);
  await page.tap('#touch-answers .tk >> text=An item');
  await wait(page, 400);
  s = await state(page);
  check(layout, 'the game asks which item', s.kind === 'item');
  check(layout, 'the items are highlighted',
    upright ? await page.$eval('#pm-panel', (c) => c.classList.contains('pick')) : await page.isVisible('#touch-items.show'));
  await tapCell(page, 60, 3);
  await wait(page, 400);
  check(layout, 'tapping the second item picks b', (await sentKeys(page)).join('') === 'XIb', JSON.stringify(await sentKeys(page)));
  s = await settle(page);

  // The mutation choices listed under the items when using something.
  await page.evaluate(() => KB.push('u'));
  await wait(page, 400);
  s = await state(page);
  const extraRow = s.info && s.info.count + 2;
  const extraText = extraRow ? await rowText(page, extraRow, 55, 58) : '';
  check(layout, 'Use lists the mutations under the items', s.kind === 'item' && extraText.startsWith('1.'), extraText);
  if (extraRow) {
    const p = await page.evaluate((r) => AlphaManTouch.whereIs(60, r), extraRow);
    const cell = p && await page.evaluate(([x, y]) => AlphaManTouch.cellAtPoint(x, y), [p.x, p.y]);
    check(layout, 'the mutation line is where it is shown', cell && cell.row === extraRow, JSON.stringify(cell));
    if (upright) check(layout, 'mutation lines copied exactly', (await compareCopies(page)).length === 0);
  }
  await page.evaluate(() => KB.push('\x1b'));
  s = await settle(page);

  // Back to the stats.
  await page.tap('.tk[data-k=inv]');
  await wait(page, 400);
  check(layout, 'Inv again shows the stats', (await state(page)).rdisp === 1);

  // Whole-screen pages (F3: berries and devices) are shown whole.
  await page.tap('.tk[data-k=F3]');
  await wait(page, 500);
  s = await state(page);
  check(layout, 'F3 page shown whole', s.vpage === 3 && !s.split);
  await page.touchscreen.tap(width / 2, 60);
  s = await settle(page);
  check(layout, 'back to the map afterwards', s.split === upright && s.vpage <= 1, JSON.stringify(s));

  // Walking.  A tap sends one step towards it from the character; what is
  // checked first is the key sent, which does not depend on the terrain,
  // then the move itself where the square is free.
  if (s.vpage === 0) { await tapCell(page, 20, 10); await wait(page, 600); s = await settle(page); }
  const ARROW = { '1,0': '\0M', '-1,0': '\0K', '0,1': '\0P', '0,-1': '\0H' };
  const open = (dx, dy) => page.evaluate(([dx, dy]) => {
    const x = localx + dx, y = localy + dy;
    return x >= 2 && x <= 51 && y >= 2 && y <= 21 &&
      [32, 46, 250, 249, 44, 39, 96].includes(SCR.getCell(1, x, y) & 255) && [32, 46, 250, 249, 44, 39, 96, 0].includes(SCR.getCell(2, x, y) & 255);
  }, [dx, dy]);
  async function tapWalk(what, point, dir) {
    const from = await settle(page), free = await open(...dir);
    await recordKeys(page);
    await page.touchscreen.tap(point.x, point.y);
    await wait(page, 500);
    const keys = await sentKeys(page);
    check(layout, `${what}: sends ${['east', 'west', 'south', 'north'][['1,0', '-1,0', '0,1', '0,-1'].indexOf(dir.join())]}`,
      keys.length === 1 && keys[0] === ARROW[dir.join()], JSON.stringify(keys));
    const to = await settle(page);
    if (free) check(layout, `${what}: walks there`, to.x === from.x + dir[0] && to.y === from.y + dir[1], `${from.x},${from.y} -> ${to.x},${to.y}`);
  }
  const where = (col, row) => page.evaluate(([c, r]) => AlphaManTouch.whereIs(c, r), [col, row]);
  // On the map, a few squares away in each direction (where the map allows).
  for (const dir of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const at = await state(page);
    const tx = at.x + dir[0] * 4, ty = at.y + dir[1] * 4;
    if (tx < 1 || tx > 52 || ty < 1 || ty > 22) continue;
    await tapWalk(`a tap on the map (${dir})`, await where(tx, ty), dir);
  }
  // Under the map, straight below the character: the messages are south.
  let at = await state(page);
  await tapWalk('a tap on the messages below', await where(Math.min(at.x, 54), 24), [0, 1]);
  // The panel: under the map upright (south), right of it sideways (east).
  at = await state(page);
  if (upright) {
    const lines = await page.evaluate(() => AlphaManTouch.panelLines());
    const r = await page.$eval('#pm-panel', (c) => { const b = c.getBoundingClientRect(); return { top: b.top, height: b.height }; });
    const cx = (await page.evaluate(() => AlphaManTouch.whereIs(localx, localy))).x;
    check(layout, 'the panel has lines to tap', lines.length > 0);
    // (In the middle: near its bottom edge, a tap is taken as one on the
    // key just under it, as phones do.)
    await tapWalk('a tap on the panel below', { x: cx, y: r.top + r.height / 2 }, [0, 1]);
  } else {
    await tapWalk('a tap on the panel to the right', await where(70, at.y), [1, 0]);
  }

  // The direction keys of the upright keyboard: a tap is one step.
  if (upright) {
    for (const [id, dir] of [['e', [1, 0]], ['w', [-1, 0]], ['so', [0, 1]], ['n', [0, -1]]]) {
      const from = await settle(page), free = await open(...dir);
      await recordKeys(page);
      await page.tap(`.tk[data-k=${id}]`);
      await wait(page, 500);
      const keys = await sentKeys(page);
      check(layout, `direction key ${id} sends one step`, keys.length === 1 && keys[0] === ARROW[dir.join()], JSON.stringify(keys));
      const to = await settle(page);
      if (free) check(layout, `direction key ${id} walks there`, to.x === from.x + dir[0] && to.y === from.y + dir[1], `${from.x},${from.y} -> ${to.x},${to.y}`);
    }
  }

  check(layout, 'no script errors', errors.length === 0, errors.join(' | '));
  await page.screenshot({ path: path.join(process.env.TEST_SHOTS || '/tmp', `touch-${layout}.png`) });
  await ctx.close();
}

async function desktop(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(URL_);
  await wait(page, 800);
  const d = await page.evaluate(() => ({
    classes: document.body.className, pm: getComputedStyle(document.getElementById('pm')).display,
    keys: getComputedStyle(document.getElementById('touch-left')).display, start: document.getElementById('touch-start').classList.contains('show'),
    kind: GameWait.kind,
  }));
  check('desktop', 'no touch controls', !/\btouch\b|\bpm\b/.test(d.classes) && d.pm === 'none' && d.keys === 'none' && !d.start, JSON.stringify(d));
  check('desktop', 'the game asks for the name as usual', d.kind === 'text');
  await page.close();
}

const browser = await playwright.chromium.launch();
try {
  await run(browser, 'landscape', 844, 390);
  await run(browser, 'portrait', 390, 844);
  await desktop(browser);
} finally {
  await browser.close();
  server.close();
}
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);

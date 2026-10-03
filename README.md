# Alphaman Source and Files

Source code and related files for the 1995 DOS roguelike game Alphaman by
Jeffrey R. Olson.

Jeff can be reached via email at `ca_jeffo@yahoo.com`

## Play in your browser

This repository now also contains a JavaScript port of the game that runs in a
web browser: open `index.html` (served over HTTP, e.g.
`python3 -m http.server`), or play the GitHub Pages copy published from the
`main` branch. See [Browser port](#browser-port) below.

## The Game

The game itself is described at:

* http://roguebasin.roguelikedevelopment.org/index.php?title=Alphaman
* https://mutant-future.fandom.com/wiki/AlphaMan

The game is available for download at:

* https://archive.org/details/Alphaman11
* https://archive.org/details/Alphaman-roguelike
* https://www.myabandonware.com/game/alphaman-315
* https://www.dosgames.com/game/alphaman-the-new-beginning
* https://www.dosgamesarchive.com/download/alpha-man/

There are several contemporary discussions about Alphaman from 1995 on Usenet,
including the suggestions from others which are referenced in `FIXES.TXT`:

* https://groups.google.com/g/rec.games.roguelike.misc/search?q=Alphaman

## Files

The original files are in the `original/` directory.

#### Game source

* Any `.BAS` file is in MS QuickBasic 4.5 binary format
* Any `.BAS.txt` is a plaintext version of the same file
* `A1.BAS` to `A8.BAS` - Game source
* `ALPCLIB.C` - C helper library
* `MODJNK.BAS` - Game strings
* `MODAM6.BAS` - More strings
* `ALPHA.CAS` and `ALPHA.CAS.txt` - Castle data
* `ALPHA.DEC` and `ALPHA.DEC.txt` - Variable declarations
* `ALPHA.GDY` and `ALPHA.GDY.txt` - Weapon and item handling
* `ALPHA.CRE`, `CRELIST`, `CRETEST.*`, `CREVIEW.*`, `CREALTER.*`, `VIEW.*` -
  Definitions, programs, output for creature (enemy monster) generation

#### Supporting Files

* `ALPHA.DBG,DB2,DB3,DC2` - Debug snippets, commented out in the game code
* `BRESNHAM.C` - Public Domain example math code
* `MAZ.*` - Maze path finding test
* `*.BAT` - Build scripts for MS QuickBasic 4.5 and MS QuickC 2.5
* `*.MAK` Compiler directives to create object files from source and strings

#### Gameplay Assistance

Jeff made the FAQ available publicly. The Spoilers file was only provided
to the 50 to 100 people who registered the shareware. It appears on some very
old FTP listings but this is the first time it's been available publicly in
about two decades!

* `ALPHAMAN.FAQ.txt` - Alphaman FAQ by Jeff Olson, version 1.1
* `ALPHAMAN.SPL.txt` - Spoilers by Jeff Olson, version 1.1
* `ALPMAN11.TXT` - Description for upload to FTP sites
* `FIXES.TXT` - Changelog
* `README.TXT` - Descriptive file shipped with game
* `ITEMLIST` - All possible items in plaintext

#### Cheats

These tools require a `.ALF` saved game in the current directory.

* `ITEMS.EXE/BAS/txt` - Add berries, small and large tech devices
* `MUTAT.EXE/BAS/txt` - Modify player stats and physical/mental mutations

You can also name your character `Jeffrey Olson` to start with all stats at 18,
good gear like a Long Sword, Chainmail, Small Titanium Shield, and advantageous
Mutations. Keeping with the game's humour and not taking itself too seriously,
this inside joke allows Jeff to be atop everyone's High Score list.

GamqFAQs also contains a guide which does not allow copying elsewhere. The
author did not respond to my request to include it here:

* [Alphaman Food/Item/Lore Guide by BabaGan00sH](https://gamefaqs.gamespot.com/pc/564667-alphaman-1995/faqs/33882)

## Code Description

Alphaman was originally written as a QuickBasic program. In order to keep
the game on a single 3.5" floppy, Jeff used some C and assembly helpers
(`ALPCLIB.C`) which are linked into the QuickBasic objects at compile time.

Strings are kept in intermediate files and referenced by their binary offset
and length. String definitions are in `MODJNK.BAS` and `MODAM6.BAS`. String
print routines are `SUB Printjnk` in `A7.BAS` and `FUNCTION jnk$` in `A8.BAS`.

Jeff originally used floating point math to handle the game randomisation,
but after seeing how slowly the map generated on an 8088 system without a math
co-processor, he changed to integer-based math using bit-shifts with the help
of a classmate who had written some books on assembly language programming.

## File Formats

Note that when browsing QuickBasic source, `SUB` procedures are "hidden" from
the main file they are defined in. You can list and enter subprocedures in
QuickBasic by pressing the **F2** key or in the top menu bar by selecting
**View** then **SUBs...**.

A few of the text files may not open in your editor of choice. This occurs
because those files use ISO-8859-1 Latin encoding, not UTF-8 like most modern
text files. I chose not to convert the Latin files to preserve the content
accurately, as some DOS characters do not covert to UTF-8.

## Compiling

Alphaman can be compiled in DOSBox. The following was tested successfully
with [dosbox-staging](dosbox-staging.github.io/) version 0.76.0.

Install Microsoft QuickBasic 4.5 and Microsoft QuickC 2.5 with "medium" memory
model support selected. You can find those at:

* https://winworldpc.com/product/quickbasic/45
* https://winworldpc.com/product/quick-c/2x

Your `PATH` should look something like:

~~~
SET PATH=C:\QB45\;C:\QC25\BIN;%PATH%
~~~

You also need the `LIB` and `INCLUDE` variables set as QuickC requires, plus
add the QuickBasic path to libraries:

~~~
SET LIB=C:\QC25\LIB;C:\QB45
SET INCLUDE=C:\QC25\INCLUDE
~~~

* `ALPHAMAN.EXE` is generated by running `COMCLIB.BAT` then `COMALPHA.BAT`
* `ALPHAMAN.1` is generated by running `MODJNK.BAS`
* `ALPHAMAN.2` is generated by running `CREALTER.BAS`
* `ALPHAMAN.3` is generated by running `ALPHA.GDY`
* `ALPHAMAN.4` is generated by running `ALPHA.CAS`
* `ALPHAMAN.5` is plain text, no compilation required
* `ALPHAMAN.6` is generated by running `MODAM6.BAS`

These steps provide all required game files.

Interestingly, this source generates files with differences in `ALPHAMAN.1`
(strings) and `ALPHAMAN.4` (castles) compared to the v1.1 game release, so the
source may be a slightly later unreleased version.

## Browser port

The browser version is a hand port of the QuickBasic and C source to plain
JavaScript, aiming to behave exactly like the DOS game: the same random number
generators (QuickBasic's `RND` and the C library's `rand()`), 16-bit integer
arithmetic with QuickBasic's rounding, the 80x25 text screen with its eight
video pages, and saved games and high score files in the original binary
formats. Typos and quirks of the original code are kept and marked `(sic)`.

* `index.html` - the page; `js/main.js` starts the game
* `js/game/a1.js` ... `a8.js` - ports of `A1.BAS` ... `A8.BAS`, one function per
  `SUB`/`FUNCTION` with the same names; `js/game/state.js` holds the shared
  (`COMMON SHARED`) variables declared in `ALPHA.DEC`
* `js/alpclib.js` - port of `ALPCLIB.C`, including the assembly routines
* `js/runtime/` - the QuickBasic runtime the game needs: number and string
  functions, the text screen (drawn on a canvas with the VGA 9x16 font), the
  keyboard (`INKEY$`) and a DOS-like file store kept in the browser's
  `localStorage`
* `js/data.js` - the contents of `ALPHAMAN.1` - `ALPHAMAN.6`, generated by
  `node tools/build-data.mjs` from the data programs in `original/` and from
  `data/ALPHAMAN.5`
* `js/savepanel.js` - the saved-games list under the game screen
* `js/view3d/` - the optional 3D view; `js/touch/` - touch controls

Saved games (`NAME.ALF` plus `NAME.SAV`) live in the browser. The list under
the game screen lets you load, delete, download (as a `.zip` of the original
DOS files, which also work with the DOS version) and upload them.

### Full screen

The *Full screen* button or **Alt+Enter** shows the game screen (2D, or 3D
when it is on) scaled up to fill the display; Alt+Enter or Esc goes back.

### 3D view

Press **F8** (or the *3D view* button) to see the map as extruded neon
characters in 3D; F8 again goes back to 2D. The stats and messages stay as
they are. **Shift+F8** (or the menu) picks the camera:

* *Behind* (the default) and *First person* turn with you: Up/Down move
  forwards and backwards, Left/Right turn by 45 degrees, keypad 4/6 step
  sideways and 7/9/1/3 move diagonally.
* *Tabletop* looks down on the area with north up; the keys are unchanged.

While the 3D view is showing, a minimap to the left of the game screen shows
the 2D map, shrunk down.

Holding a movement key walks at a steady pace (a third of the keyboard's
auto-repeat rate), and turning while walking keeps you walking in the new
direction.

*Fast area changes* (on by default, 3D only) enters a new area straight
away; the original waits at least one second there and drops any keys
pressed meanwhile, which the 2D game still does.

Outdoors, the neighbouring areas are shown too, exactly as the game will
make them when you walk in. Areas you have not visited yet are in grey and
show only their terrain and buildings; areas you have visited are in colour
and also show the items lying there (including anything you dropped).
Creatures only appear when you arrive. The camera glides along while you
walk, though you still move a square at a time. Everything else, including what you can
see at night and inside castles, follows the 2D game.

The 3D view lives in `js/view3d/` and uses [three.js](https://threejs.org/)
from a CDN. It only reads the game's screen and variables and sends
keypresses. The one exception is a small hook (`GameHooks` in
`js/runtime/io.js`) for fast area changes, which does nothing while the 3D
view is off, so the 2D game plays exactly as before.

### Phones and tablets

On a touch screen the game gets touch controls (they can also be turned on
or off under *Settings*):

* the everyday commands as IBM Model M keys (light keys, with Esc and
  More grey, in a textured case). Each group of keys, and
  the answer buttons and item popup, is drawn once with three.js from a
  real Model M keycap (`js/touch/keyboard3d.js`, `js/touch/keycap.json`)
  and the buttons sit on top of the picture; it is drawn again only when
  a group changes size or its keys change. Caps are never narrower than
  they are tall, so sideways they are small squares with each key's name
  printed on the case below. Without WebGL the keys are drawn in CSS
  instead. Sideways they are in
  columns either side of the screen: on the left Esc, known berries and
  devices (F3), your condition (F4), the main map (F5), *i* (inventory /
  stats), again, search, the mutations, remove trap, save and rest; on the
  right the stairs, help, sleep, *More* and Space.
  Upright, Esc, F3, F4, F5 and *More* are in a row above the screen,
  laid out like the top of the keyboard,
  and right under the screen (kept low, near the thumbs) is a keyboard of
  the other commands, six across, in the order their keys have on a
  Model M (a s S r i p, then z m < > . ?), then the space bar along the
  bottom. There is no Enter key: when the game asks for a
  target, a *Fire* button appears (or tap the cursor's square again); walking is by tapping and swiping the map. The rest
  (previous messages, local map, symbols, fast fight, credits, the boss
  key) are in the *More* menu, with the settings;
* *i* shows your items on the right of the screen (and again goes back to
  the stats). Tapping an item offers what to do with it: use or unuse,
  eat (food and berries), throw, figure out, examine or drop, each shown
  with the game's own key for it;
* to move, touch the screen: you step in the direction of the touch from
  your character (holding keeps walking). Touching outside the map counts
  too, so the stats or the messages are an easy target for walking east or
  south into the next area. Dragging walks in the direction of the drag,
  like a joystick, which is easiest at the edges. A flick (a quick swipe)
  runs that way until something happens: a message, getting hurt, bumping
  into something, a new area, a creature coming near (even an invisible
  one, which you may need to fight), or another touch. Arrow keys over the
  bottom-left of the map can be turned on in the *More* menu;
* when the game asks for something, nothing needs typing: a tap continues
  after a message, picks the item tapped in the list on the right, moves
  the targeting cursor to the square tapped (tap it again to pick it), or
  gives a direction; questions with set answers (yes or no, a numbered
  list, short or long range, stun or kill...) show buttons for them, and
  where the game asks for a number a number pad appears;
* fast fight (no space bar needed between blows) starts on; F in the
  *More* menu turns it off;
* before the game starts, a screen asks for your name, the difficulty and
  the wimpy critter's name, letter and colour (all remembered for next
  time), and the game does not ask for them again, nor for a name when
  starting over after a death;
* the game can be played either way up: sideways, with the keys either
  side of the screen, or upright, with the keys below the screen. Upright,
  the map takes the full width, with the messages under it and then the
  panel from the right of the screen (stats or items) laid out again in
  two columns, with the location box above them. These are copies of the
  game screen, which the game draws as always; other screens (help, lists)
  are shown whole.

*Play* fills the screen where the browser can. iPhones have no full screen for web pages;
adding AlphaMan to the Home Screen (Share, *Add to Home Screen*) opens it
without Safari's bars, though saved games there are kept apart from those in
Safari.

The touch controls live in `js/touch/` and only send keypresses, apart
from hooks in `GameHooks` that start fast fight on and give the game the
character's details instead of its typed prompts (`newGame`, `wimpy`). To know
what the game is waiting for, the game labels its waits (`GameWait` in
`js/runtime/io.js`); the labels are never read by the game, so it plays
exactly the same with or without them.

Developer tools:

* `node tools/build-data.mjs` - regenerates `js/data.js`
* `node tools/verify-data.mjs DIR` - compares `js/data.js` with the data files
  of the 1.1 release in `DIR`. Everything matches except unused blank records,
  one line of `ALPHAMAN.6` that was corrected in `MODAM6.BAS` after the release
  (the port keeps the released text), and 1602 bytes at the end of the
  released `ALPHAMAN.4` that no castle refers to.
* `node tools/check-async.mjs` - checks that every call to a routine that
  waits for the player is awaited
* `node tools/lint.mjs` - checks the scripts for undefined names (needs eslint)
* `node tools/test-touch.mjs` - tests the touch controls in a phone-sized
  Chromium, sideways and upright: everything the panel on the right shows,
  the inventory popup, picking items, the answer buttons, whole-screen
  pages, walking by touch, and that the upright layout copies the game
  screen exactly, and that the keyboard is drawn from the keycap (needs
  playwright and its Chromium; for the drawn keyboard also three@0.170.0,
  which it serves in place of the CDN copy). GitHub runs it on
  every push (the *Touch control tests* workflow), separately from the
  deploy, so for now a failure does not stop the site being published
* `node tools/check-for-bounds.mjs` - finds `for` loops whose end value can
  change inside the loop (QuickBasic evaluates it only once)

`data/ALPHAMAN.5` (the help text read by the `?` screen) has no generator
program in the source; it is the file from the 1.1 release (`alphaman-11.zip`
on archive.org).

The screen font is the IBM VGA 9x16 font from
[pcface](https://github.com/susam/pcface) (CC BY-SA 4.0).

The touch keys' legends are in Varela Round (SIL Open Font License 1.1,
`js/touch/varela-round-OFL.txt`), standing in for the rounded Helvetica of
the Model M's keycaps. The keycap shape in `js/touch/keycap.json` is taken
from "IBM Model M Keyboard" (https://skfb.ly/6ZFM6) by timblewee, licensed
under Creative Commons Attribution 4.0
(http://creativecommons.org/licenses/by/4.0/). Changes: one keycap cut out
of the model and stored as integers; the keyboard is laid out, stretched
and lit by this program.

## License

The contents of this repository are made available under the MIT license.

tl;dr - do what you like, but include Jeff's copyright notice in any derivative.

~~~
Copyright (c) 1995 Jeffrey R. Olson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
~~~

## Maintainer

This repository is maintained by:

* Jamie Bainbridge - jamie.bainbridge@gmail.com


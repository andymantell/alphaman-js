// Starts AlphaMan in the page: sets up the screen, keyboard and the read-only
// ALPHAMAN.5, then runs the main program.  The DOS command line
// ("ALPHAMAN name" loads a saved game) is taken from the page's query string.
'use strict';

(function () {
  const canvas = document.getElementById('screen');
  const status = document.getElementById('status');
  new CanvasRenderer(canvas, SCR, VGA_FONT_9X16);
  KB = new Keyboard(window);
  DosFS.rom['ALPHAMAN.5'] = Uint8Array.from(ALPHA5, (c) => c.charCodeAt(0));
  SavePanel.init(document.getElementById('saves'));

  const commandLine = decodeURIComponent(location.search.replace(/^\?/, '')).trim();

  async function run(cmd) {
    status.textContent = '';
    try {
      await AlphaMan(cmd);
    } catch (e) {
      qbClose();
      if (e instanceof ProgramEnd) {
        status.textContent = 'AlphaMan has ended. Press any key to play again.';
      } else {
        console.error(e);
        status.textContent = 'AlphaMan stopped with an error: ' + e.message +
          '. Press any key to start again.';
      }
      KB.clear();
      await getKey();
      // A fresh start, as if typing ALPHAMAN at the DOS prompt again.
      if (location.search) { location.search = ''; return; }
      resetState();
      run('');
    }
  }
  run(commandLine);
})();

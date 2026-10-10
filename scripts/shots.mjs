// Launches the real Electron build hidden (--test), drives it through key moments of
// the story, and saves screenshots to ./shots for review.
import { _electron as electron } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'shots');
mkdirSync(out, { recursive: true });
const only = process.argv[2];

const app = await electron.launch({
  executablePath: path.join(root, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'),
  args: [root, '--test'],
  env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: '1' },
});
const page = await app.firstWindow();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(800);

const shot = async (name) => { if (!only || name.includes(only)) await page.screenshot({ path: path.join(out, `${name}.png`) }); console.log('shot', name); };
const G = (fn, arg) => page.evaluate(fn, arg);
const wait = (ms) => page.waitForTimeout(ms);

// Always start from a clean save.
await G(() => localStorage.clear());
await page.reload();
await wait(800);
await G(() => { window.__game.store.settings.oldLag = false; }); // screenshots want the old fixed timings
await shot('01-title');
await page.getByText('Switch it on').click();
await wait(500);
await shot('01b-file-select');
await page.locator('.file-main').first().click();
await wait(1500);
await shot('02-post');
await page.waitForSelector('.bootlogo', { timeout: 8000 });
await wait(900);
await shot('02b-bootlogo');
await G(() => { const s = window.__game.store; s.s.phase = 'login'; s.bump(); });
await wait(600);
await shot('03-login');
await page.locator('.user-tile').click();
await wait(1300);
await shot('03b-loading-settings');
await wait(2600);
await shot('04-desktop');

// Open the archive via the desktop shortcut.
await page.locator('.dicon', { hasText: 'Carrow Archive' }).dblclick();
await wait(500);
await shot('05-explorer-carrow');
await page.locator('.tile', { hasText: '02 Census' }).dblclick();
await wait(300);
await page.locator('.tile', { hasText: 'Census of Residents' }).dblclick();
await wait(500);
await shot('06-census-sheet');

// Open a document.
await G(() => { const s = window.__game.store; s.s.windows = []; s.bump(); });
await page.locator('.dicon', { hasText: 'Carrow Archive' }).dblclick();
await wait(300);
await page.locator('.tile', { hasText: '01 Administration' }).dblclick();
await wait(300);
await page.locator('.tile', { hasText: 'Board Minutes' }).dblclick();
await wait(500);
await shot('07-wordpad');

// Mill Row photo.
await G(() => { const s = window.__game.store; s.s.windows = []; s.bump(); });
await page.locator('.dicon', { hasText: 'Carrow Archive' }).dblclick();
await wait(300);
await page.locator('.tile', { hasText: '04 Photographs' }).dblclick();
await wait(400);
await shot('08-photos');
await page.locator('.tile', { hasText: 'Mill Row' }).dblclick();
await wait(600);
await shot('09-millrow-photo');

// Start menu.
await G(() => { const s = window.__game.store; s.s.windows = []; s.bump(); });
await page.locator('.startbtn').click();
await wait(300);
await shot('10-startmenu');
await page.locator('.sm-foot .sm-item', { hasText: 'Turn Off' }).click();
await wait(1400);
await shot('10b-turnoff-prompt');
await page.locator('.sd-foot .btn').click();
await wait(200);

// Command prompt with dir /a.
await G(() => { const s = window.__game.store; s.s.windows = []; s.bump(); });
await page.keyboard.press('Control+r');
await wait(300);
await page.keyboard.type('cmd');
await page.keyboard.press('Enter');
await wait(400);
await page.keyboard.type('cd \\HRS\\Carrow\\05 Engineering');
await page.keyboard.press('Enter');
await page.keyboard.type('dir /a');
await page.keyboard.press('Enter');
await wait(300);
await shot('11-cmd-dir');

// Jump to chapter 4 to see the edge leakage + paranoia.
await G(() => {
  const s = window.__game.store;
  s.s.windows = [];
  s.s.opts.showHidden = true;
  s.bump();
});
await G(() => { const s = window.__game.store; s.s.chapter = 3; s.s.edge = 2; s.s.glitch = 2; s.s.fs.profile.name = s.s.user + '.DUNMORE'; s.s.shownUser = s.s.user + ' Dunmore'; s.bump(); });
await page.locator('.dicon', { hasText: 'Carrow Archive' }).dblclick();
await wait(400);
await page.locator('.tile', { hasText: '~unmatched' }).dblclick();
await wait(500);
await shot('12-ch4-edges-unmatched');

// Climax.
await G(() => { const s = window.__game.store; s.s.glitch = 5; s.bump(); });
await wait(4300);
await shot('13-climax-leak');
await wait(2400);
await shot('14-climax-leak-late');
await wait(1500);
await shot('15-climax-shatter');
await page.waitForSelector('.bsod', { timeout: 15000 });
await wait(1500);
await shot('15b-bsod-fullwidth');
await G(() => { const s = window.__game.store; s.s.phase = 'reboot'; s.bump(); });
await wait(3200);
await shot('16-recovery-menu');
await G(() => { const s = window.__game.store; s.s.phase = 'recovery'; s.bump(); });
await wait(700);
await shot('17-recovery-desktop');

// Ending, then back to the file select: File 1 should now show as complete.
await G(() => { const s = window.__game.store; s.s.ending = 'restore'; s.s.phase = 'ending'; s.save(); s.bump(); });
await wait(600);
await G(() => { const s = window.__game.store; s.s.phase = 'title'; s.bump(); });
await wait(400);
await page.getByText('Switch it on').click();
await wait(500);
await shot('18-file-select-after');

console.log('errors:', errors.length ? errors.join('\n') : 'none');
await app.close();

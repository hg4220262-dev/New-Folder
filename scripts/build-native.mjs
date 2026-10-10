// Builds electron/native/presentation.node (macOS only). Never fails the build:
// if it cannot compile, the game falls back to Electron's auto-hiding full screen.
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'electron/native/presentation.m');
const out = path.join(root, 'electron/native/presentation.node');

if (process.platform !== 'darwin') process.exit(0);
if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) process.exit(0);

// N-API headers ship with Node itself; the ABI is stable across Node and Electron.
const candidates = [
  path.join(path.dirname(process.execPath), '..', 'include', 'node'),
  '/opt/homebrew/include/node',
  '/usr/local/include/node',
];
const inc = candidates.find((d) => existsSync(path.join(d, 'node_api.h')));
if (!inc) { console.warn('[native] node_api.h not found; using fallback full screen.'); process.exit(0); }

const args = [
  '-bundle', '-undefined', 'dynamic_lookup', '-fobjc-arc', '-O2', '-x', 'objective-c',
  '-mmacosx-version-min=11.0', '-arch', 'arm64', '-arch', 'x86_64',
  '-I', inc, '-framework', 'AppKit', '-o', out, src,
];
try {
  execFileSync('clang', args, { stdio: 'inherit' });
  console.log('[native] built', path.relative(root, out));
} catch {
  console.warn('[native] clang failed; using fallback full screen.');
}

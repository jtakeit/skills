/**
 * The headless browser the scripts measure with, bootstrapped once.
 *
 * Three scripts needed it and three scripts had their own copy of this, which
 * is how one of them ends up fixed and the others do not. It also carries the
 * two things that are easy to get wrong:
 *
 *   · **npm is `npm.cmd` on Windows.** `execFile` runs executables, not shell
 *     scripts, so spawning `npm` there fails with ENOENT — which reads as
 *     "npm is not installed" on a machine where it plainly is.
 *   · **playwright is two installs.** The package lands here on first use; the
 *     browser binary is a separate download into a shared cache, and its
 *     absence is otherwise discovered in the middle of a stage gate.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEPS = resolve(HERE, '..', '.deps');

/** `npm` on anything sane, `npm.cmd` on Windows. Same for npx. */
export const npm = (name = 'npm') => (process.platform === 'win32' ? `${name}.cmd` : name);

/** Where playwright keeps its browsers, per platform. */
export function browserCache() {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) return process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (process.platform === 'darwin') return join(homedir(), 'Library', 'Caches', 'ms-playwright');
  if (process.platform === 'win32') return join(process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'), 'ms-playwright');
  return join(homedir(), '.cache', 'ms-playwright');
}

export const hasChromium = () => {
  const cache = browserCache();
  try {
    return readdirSync(cache).some((entry) => entry.startsWith('chromium'));
  } catch {
    return false;
  }
};

/**
 * Returns playwright's `chromium`, installing the package on first use.
 *
 * `fail` is the caller's own die(): each script names itself in its errors, and
 * a shared bootstrap should not decide how a script exits.
 */
export async function loadChromium(fail) {
  const local = join(DEPS, 'node_modules', 'playwright');
  if (!existsSync(local)) {
    console.log('Installing playwright into scripts/.deps (first run only)…');
    mkdirSync(DEPS, { recursive: true });
    try {
      execFileSync(npm(), ['install', 'playwright', '--prefix', DEPS, '--no-audit', '--no-fund', '--loglevel', 'error'], {
        stdio: 'inherit',
      });
    } catch {
      fail(`could not install playwright. Run it by hand:\n  npm install playwright --prefix "${DEPS}"`);
    }
  }
  let chromium;
  try {
    // playwright is CommonJS: depending on what Node's lexer detects, the
    // exports arrive as named bindings or only under `default`. Take either.
    const mod = await import(pathToFileURL(join(local, 'index.js')).href);
    chromium = mod.chromium ?? mod.default?.chromium;
  } catch (e) {
    fail(`playwright failed to load — ${e.message}`);
  }
  if (!chromium) fail('playwright loaded but exposes no chromium — check the install in scripts/.deps');

  // The browser is not the package. Say so before the launch fails, because
  // "Executable doesn't exist at …" three screens into a stage is a bad way to
  // learn it. Asked of this playwright rather than of the cache: a cache that
  // holds an older chromium is not one this version can launch.
  let present = hasChromium();
  try {
    present = existsSync(chromium.executablePath());
  } catch {
    /* an older playwright without executablePath(): the cache answer stands */
  }
  if (!present) {
    console.log(`No chromium in ${browserCache()} — installing it (first run only)…`);
    try {
      execFileSync(npm('npx'), ['--yes', 'playwright', 'install', 'chromium'], { cwd: DEPS, stdio: 'inherit' });
    } catch {
      fail('could not install the browser. Run it by hand:\n  npx playwright install chromium');
    }
  }
  return chromium;
}

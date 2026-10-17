#!/usr/bin/env node
/**
 * jt-refs — the benchmarks a spec is built to stand next to, looked at.
 *
 *   jt-refs                       the list: id, trade, place, what it suits
 *   jt-refs porem hagis           pictures of each, into .jtakeit/refs/<id>/
 *   jt-refs --chosen              the ones design.benchmarks names
 *
 * The sixteen are in skills/spec/references/benchmarks.json, with what to take
 * from each. Their pages are theirs: no picture of them is kept in the plugin,
 * so they are taken fresh, live, when a build wants them — the first screen
 * and three screens down at a 1440×900 laptop, and the first screen on a
 * phone. A loader or a cookie banner is waited out and clicked away where it
 * can be.
 */
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadChromium } from './lib/browser.mjs';
import { findRoot, readState, STATE_FILE } from './lib/state.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIST = JSON.parse(readFileSync(join(HERE, '..', 'skills', 'spec', 'references', 'benchmarks.json'), 'utf8'));
const die = (m) => {
  console.error(`jt-refs: ${m}`);
  process.exit(1);
};

const argv = process.argv.slice(2);
const root = findRoot() ?? process.cwd();

let ids = argv.filter((a) => !a.startsWith('--'));
if (argv.includes('--chosen')) {
  const state = existsSync(join(root, STATE_FILE)) ? readState(root) : null;
  const chosen = String(state?.design?.benchmarks ?? '');
  ids = LIST.map((b) => b.id).filter((id) => new RegExp(`\\b${id}\\b`, 'i').test(chosen));
  if (!ids.length) die('design.benchmarks names none of the list — choose two or three first (references/benchmarks.md)');
}

if (!ids.length) {
  for (const b of LIST) console.log(`${b.id.padEnd(12)} ${`${b.trade}, ${b.place}`.padEnd(34)} ${b.suits}`);
  console.log(`\n${LIST.length} benchmarks. jt-refs <id> <id> to look at two or three; what to take from each is in benchmarks.json.`);
  process.exit(0);
}

const picked = ids.map((id) => LIST.find((b) => b.id === id.toLowerCase()) ?? die(`no benchmark called «${id}» — jt-refs lists them`));

const chromium = await loadChromium(die);
const browser = await chromium.launch();
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const ACCEPT = ['Accept', 'Accept all', 'Allow all', 'I agree', 'OK', 'Got it', 'Akzeptieren', 'Alle akzeptieren', 'Accepter', 'Tout accepter', 'Aceptar', 'Accetta', 'Accetta tutti'];

async function clear(page) {
  for (const name of ACCEPT) {
    const b = page.getByRole('button', { name, exact: true });
    if (await b.count().catch(() => 0)) {
      await b.first().click({ timeout: 1000 }).catch(() => {});
      return;
    }
  }
}

// All of them at once: each is a site of its own, waited on for its loader.
const shot = async (b) => {
  const lines = [];
  const dir = join(root, '.jtakeit', 'refs', b.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const files = [];
  for (const [w, h, tag, screens] of [[1440, 900, 'laptop', 4], [393, 852, 'phone', 1]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, userAgent: UA, locale: 'en-US' });
    const page = await ctx.newPage();
    try {
      await page.goto(b.url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      // Award-winning sites open on a loader more often than not.
      await page.waitForTimeout(5000);
      await clear(page);
      await page.waitForTimeout(600);
      for (let i = 0; i < screens; i++) {
        if (i) {
          await page.mouse.wheel(0, h);
          await page.waitForTimeout(1600);
        }
        const file = join(dir, `${tag}-${i}.jpg`);
        await page.screenshot({ path: file, type: 'jpeg', quality: 70 });
        files.push(file);
      }
    } catch (e) {
      lines.push(`${b.id}: ${tag} could not be read — ${String(e.message).split('\n')[0].slice(0, 100)}`);
    }
    await ctx.close();
  }
  lines.unshift(`\n${b.name} — ${b.trade}, ${b.place} · ${b.url}`, ...b.moves.map((m) => `  take: ${m}`));
  lines.push(...files.map((f) => `  ${f.replace(root, '.')}`));
  return lines;
};
for (const lines of await Promise.all(picked.map(shot))) console.log(lines.join('\n'));
await browser.close();
console.log('\nRead the pictures, then record the moves taken: jt-state set design.benchmarks "<id>: <move>; <id>: <move>"');

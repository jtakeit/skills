#!/usr/bin/env node
/**
 * jt-shots — every page of the build, section by section, at a laptop and a
 * phone, as pictures for somebody to look at.
 *
 *   jt-shots [--dist ./dist | --url http://localhost:4321/] [--out .jtakeit/shots]
 *
 * Written for the site critic (agents/site-critic.md): a reviewer that did not
 * build the page reads these and nothing else, so it sees what a visitor sees
 * rather than what the author meant. Every entrance is played before the
 * picture is taken — an empty band waiting for its reveal is not a design
 * fault — and the dev server's own furniture is hidden.
 *
 * Prints a manifest: page, width, section, file. Exit code 0.
 */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { loadChromium } from './lib/browser.mjs';
import { findRoot } from './lib/state.mjs';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const die = (m) => {
  console.error(`jt-shots: ${m}`);
  process.exit(1);
};

const root = findRoot() ?? process.cwd();
const out = resolve(flag('out', join(root, '.jtakeit', 'shots')));
const dist = resolve(flag('dist', join(root, 'dist')));
let url = flag('url');
let server = null;

/** The pages the build wrote: every top-level page, and one entry per collection. */
function pages() {
  if (url || !existsSync(dist)) return ['/'];
  const found = [];
  const walk = (dir, rel) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        if (name.startsWith('_') || name === 'v' || name.startsWith('.')) continue;
        walk(full, `${rel}${name}/`);
      } else if (name === 'index.html') found.push(rel || '/');
    }
  };
  walk(dist, '/');
  const depth = (p) => p.split('/').filter(Boolean).length;
  const firstOfEach = new Map();
  for (const p of found.filter((x) => depth(x) === 2).sort()) {
    const parent = p.split('/').filter(Boolean)[0];
    if (!firstOfEach.has(parent)) firstOfEach.set(parent, p);
  }
  return [...new Set([...found.filter((x) => depth(x) <= 1), ...firstOfEach.values()])].slice(0, 12);
}

// Read before a server of our own sets `url`, which would make it one page.
const PAGES = pages();

if (!url) {
  if (!existsSync(dist)) die('no build — `npm run build` first, or pass --url of a running site');
  const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2' };
  server = createServer((req, res) => {
    let file = join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    try {
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
    } catch {
      if (existsSync(`${file}.html`)) file = `${file}.html`;
    }
    try {
      const body = readFileSync(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  }).listen(4491);
  url = 'http://localhost:4491/';
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const chromium = await loadChromium(die);
const browser = await chromium.launch();
const manifest = [];

// Four pages at a time: a page and a size each, its pictures in its own
// directory, the manifest put back in order at the end.
const views = PAGES.flatMap((page) => [[page, 1440, 780, 'laptop'], [page, 393, 720, 'phone']]);
let next = 0;
const shoot = async () => {
  while (next < views.length) {
    const [page, w, h, tag] = views[next++];
    const shots = [];
    manifest.push(shots);
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    try {
      await p.goto(new URL(page.replace(/^\//, ''), url).href, { waitUntil: 'networkidle', timeout: 60_000 });
    } catch {
      await p.close();
      continue;
    }
    await p.addStyleTag({ content: 'jtk-writing, astro-dev-toolbar { display: none !important; }' });
    await p.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      for (const img of document.images) if (img.loading === 'lazy') img.loading = 'eager';
      for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 50));
      }
      scrollTo(0, 0);
      await Promise.all(
        [...document.images]
          .filter((img) => !img.complete)
          .map((img) => new Promise((r) => {
            img.addEventListener('load', r, { once: true });
            img.addEventListener('error', r, { once: true });
            setTimeout(r, 4000);
          })),
      );
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
    });
    await p.waitForTimeout(900);
    const slug = page === '/' ? 'home' : page.replace(/^\/|\/$/g, '').replace(/\//g, '__');
    const dir = join(out, slug);
    mkdirSync(dir, { recursive: true });
    // The first screen, as a visitor lands on it.
    const fold = join(dir, `${tag}-00-first-screen.png`);
    await p.screenshot({ path: fold });
    shots.push({ page, width: w, section: 'first screen', file: fold });
    // Then every section of <main>, the header and the footer, one picture each.
    const parts = await p.$$('body > header, main > *, body > footer, footer');
    let n = 0;
    for (const el of parts) {
      const box = await el.boundingBox();
      if (!box || box.height < 8) continue;
      n += 1;
      const name = await el.evaluate((e) => (e.querySelector('h1, h2, h3')?.textContent || e.tagName).trim().slice(0, 40).replace(/[^\w]+/g, '-').toLowerCase());
      const file = join(dir, `${tag}-${String(n).padStart(2, '0')}-${name || 'section'}.png`);
      await el.screenshot({ path: file });
      shots.push({ page, width: w, section: name, file });
    }
    await p.close();
  }
};
await Promise.all(Array.from({ length: 4 }, shoot));
const flat = manifest.flat();
manifest.length = 0;
manifest.push(...flat);

await browser.close();
server?.close();
writeFileSync(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
for (const m of manifest) console.log(`${m.page.padEnd(24)} ${String(m.width).padEnd(5)} ${m.section.padEnd(42)} ${m.file.replace(root, '.')}`);
console.log(`\n${manifest.length} picture(s) in ${out.replace(root, '.')} — manifest.json beside them.`);

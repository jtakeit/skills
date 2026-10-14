#!/usr/bin/env node
/**
 * jt-check — prove a built page composes, before a human is asked to judge it.
 *
 * What it does not check is as deliberate as what it does. jtakeit refuses a
 * build that is noindex, has a blocked robots.txt, an empty sitemap or a
 * foreign canonical; the catalogue tool (`npx @jtakeit/astro catalogue`) and
 * `validate_catalogue` judge the declaration; `jtk a11y` reads the pages
 * against WCAG; `preflight` says what a launch still waits on. None of that is
 * repeated here. What is left is what no platform can know:
 *
 *   · whether the page states a fact nobody confirmed — on a speculative build
 *     every claim came off a caption — or still carries a NEEDS CLIENT marker;
 *   · whether its words were written or lifted whole from the captions;
 *   · whether it holds to the one query `SEARCH` in src/data/site.ts names;
 *   · whether it composes: the first screen, stranded items, anchors that land,
 *     photographs that are cropped rather than squeezed, a surface that stays
 *     quiet, and a shape that is not the last project's again.
 *
 * Every one of these shipped at least once before it was written down here.
 * Asked whether the hero fits or whether a chip is stranded, a person says
 * "fine" and is honestly wrong.
 *
 *   jt-check --dist ./dist            # serves the build itself
 *   jt-check --url http://localhost:4321
 *   jt-check --spec                   # hold it to the speculative rules
 *
 * Exit code is the number of failures, capped at 100. Zero means it is worth a
 * human's attention.
 *
 * Needs the playwright package, which lives in scripts/.deps alongside jt-pitch.
 */

import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadChromium } from './lib/browser.mjs';
import { STATE_DIR, STATE_FILE, findRoot, readState } from './lib/state.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
const has = (n) => argv.includes(`--${n}`);
const flag = (n, d = undefined) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};

function die(message) {
  console.error(`jt-check: ${message}`);
  process.exit(1);
}

const results = [];
const pass = (name, detail = '') => results.push({ ok: true, name, detail });
const fail = (name, detail) => results.push({ ok: false, name, detail });
const note = (name, detail) => results.push({ ok: null, name, detail });

// --- what kind of build is this --------------------------------------------
//
// A spec build is held to rules a client's site is not: it may not state a fact
// nobody confirmed. Read that from the state rather than from a flag, so the
// rules cannot be turned off by forgetting one.

const root = findRoot() ?? process.cwd();
const state = existsSync(join(root, STATE_FILE)) ? readState(root) : null;
const track = state?.track ?? 'inbound';
const stage = state?.stage ?? 'spec';
const speculative = has('spec') || (track === 'outbound' && ['prospect', 'spec', 'pitch'].includes(stage));

// --- playwright -------------------------------------------------------------


// --- the page to check ------------------------------------------------------

const dist = resolve(flag('dist', 'dist'));
let url = flag('url');
let server = null;

if (!url) {
  if (!existsSync(dist)) die('give me a running site with --url, or a built one with --dist ./dist');
  const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml',
  };
  const port = Number(flag('port', 4489));
  server = createServer((req, res) => {
    let file = join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    try {
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
    } catch {
      if (existsSync(`${file}.html`)) file = `${file}.html`;
    }
    // Read before writing the header: a missing file throws, and the 404
    // cannot be sent once a 200 has already gone out.
    let body;
    try {
      body = readFileSync(file);
    } catch {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  }).listen(port);
  url = `http://localhost:${port}/`;
}

// --- checks that read the build, not the browser ----------------------------

const htmlPath = join(dist, 'index.html');
const html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf8') : null;

/** The page as a reader sees it: no markup, no scripts, no entities. */
const text = (html ?? '')
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z]+;|&#\d+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

if (html) {
  /*
   * Open questions left on the page. The brief marks a fact nobody has
   * confirmed NEEDS CLIENT; a spec build marks one UNCONFIRMED. Either one in
   * the built text is a sentence a visitor would read.
   */
  {
    const markers = text.match(/NEEDS (?:CLIENT|COPY|REVIEW)|UNCONFIRMED|TODO|lorem ipsum/gi) ?? [];
    markers.length
      ? fail('open markers', `${[...new Set(markers)].join(', ')} in the page's text — answer them or take them out`)
      : pass('open markers', 'no NEEDS CLIENT, UNCONFIRMED or TODO in the text');
  }

  // Structured data is the machine-readable assertion of facts, and a spec
  // build has none to assert. See jtakeit-sites:spec.
  if (speculative) {
    /"@type"\s*:\s*"FAQPage"/.test(html)
      ? fail('structured data', 'FAQPage markup on a spec build — nobody has confirmed those answers')
      : pass('structured data', 'no FAQPage asserted');
  }

  /**
   * The facts audit. Only on a speculative build, where every claim came off a
   * caption and none of it may be asserted on a real business's behalf.
   *
   * Patterns hard-fail; bare numbers are reported for a human to glance at,
   * because a legitimate sentence can contain one and a false positive that
   * blocks the stage is a check people learn to skip.
   */
  if (speculative) {
    const patterns = [
      ['a phone number', /\+?\d[\d\s\-()]{7,}/],
      ['an opening time', /\b\d{1,2}[:.]\d{2}\b/],
      ['a price', /\b\d+\s*(?:грн|₴|uah|usd|eur|chf|\$|€)/i],
      ['a street address', /(?:вул\.|ул\.|street|str\.|просп|буд\.)\s*\S+|\b\w+(?:strasse|straße|gasse|weg|platz)\s+\d+/i],
      ['a postcode and town', /\b(?:CH-)?\d{4}\s+(?:Z[üu]rich|Bern|Basel|Gen[eè]ve|Gen[fv]|Lausanne|Luzern|Winterthur|St\.?\s?Gallen|Lugano)\b/i],
      ['years of experience', /\b\d+\s*(?:рок|рік|год|лет|years|jahre|ans|anni)\w*/i],
      ['a rating', /★|⭐|\b\d[.,]\d\s*\/\s*5\b/],
    ];
    const found = patterns.filter(([, re]) => re.test(text)).map(([what]) => what);
    found.length
      ? fail('unconfirmed facts', `the page states ${found.join(', ')} — nobody confirmed any of it`)
      : pass('unconfirmed facts', 'no address, hours, prices, phone, experience or ratings');

    const numbers = [...new Set(text.match(/\b\d+\b/g) ?? [])];
    if (numbers.length) note('numbers on the page', `${numbers.join(', ')} — check each one is not a claim`);

    /*
     * Where a quoted line says it came from.
     *
     * Everything on the page is the business speaking, so attributing one of
     * their own sentences to them is odd on any site; on a spec build it also
     * announces that we went through their Instagram, which is the one thing
     * the pitch must not do. See jtakeit-sites:spec → references/copy.md.
     */
    const attribution = [
      /у своєму профіл|в своєму профіл|у профіл|зі свого профіл|из своего профил|в профиле/i,
      /instagram|інстаграм|инстаграм|@[a-z0-9._]{3,}/i,
      /з допису|із допису|з посту|в дописі|из поста|aus dem post/i,
    ];
    const leaked = attribution.filter((re) => re.test(text));
    leaked.length
      ? fail(
          'quotation',
          `the page says where a line came from ("${(leaked[0].exec(text) ?? [''])[0]}") — ` +
            'a quotation on their own site carries no source, and never the profile we read it in',
        )
      : pass('quotation', 'nothing on the page cites where it was taken from');
  }
}

/*
 * The headings, as a list.
 *
 * Not a judgement — a machine cannot tell «Why us» from a good label. It is
 * put in front of a person because headings are written one at a time, hours
 * apart, and are read by a visitor all at once in about four seconds. Most of
 * what is wrong with them is only visible in the list.
 */
if (html) {
  const headings = [...html.matchAll(/<h([12])[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map((m) => `${'#'.repeat(Number(m[1]))} ${m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`)
    .filter((h) => h.replace(/#+\s*/, ''));
  if (headings.length) note('headings', `read these aloud, in order — ${headings.join(' · ')}`);
  else note('headings', 'the page has no h1 or h2');
}

/**
 * The one query.
 *
 * `SEARCH` in src/data/site.ts names the query this page is for — one service,
 * one city, the way a customer would say it. This checks the two halves of
 * getting that wrong, which are opposite faults and equally common:
 *
 *   the page never says it   — a title that reads "Home" ranks for nothing
 *   the page only says it    — «Coiffeur Zürich Coiffeur in Zürich günstig», which
 *                              reads as spam to a person and, since about 2019,
 *                              to the crawler too
 *
 * Declension is why `SEARCH.forms` exists: «у Львові» is the sentence a person
 * would actually write in Ukrainian, and a check that only knew «Львів» would report a
 * correctly written page as missing its city. A form counts for whichever of
 * the two words it shares its first three characters with.
 */
if (html) {
  const sitePath = join(root, 'src', 'data', 'site.ts');
  const source = existsSync(sitePath) ? readFileSync(sitePath, 'utf8') : '';
  const block = /export const SEARCH[\s\S]*?=\s*{([\s\S]*?)};/.exec(source)?.[1] ?? '';
  const field = (key) => new RegExp(`\\b${key}\\s*:\\s*['"\`]([^'"\`]*)`).exec(block)?.[1].trim() ?? '';
  const service = field('service');
  const city = field('city');
  const forms = (/\bforms\s*:\s*\[([^\]]*)\]/.exec(block)?.[1] ?? '')
    .split(',')
    .map((f) => f.trim().replace(/^['"`]|['"`]$/g, ''))
    .filter(Boolean);

  const lower = (value) => value.toLowerCase();
  const variants = (term) => [
    term,
    ...forms.filter((f) => lower(f).startsWith(lower(term).slice(0, 3))),
  ].filter(Boolean);
  const holds = (haystack, term) =>
    !term || variants(term).some((v) => lower(haystack).includes(lower(v)));
  const count = (haystack, term) =>
    variants(term).reduce(
      (n, v) => n + (lower(haystack).split(lower(v)).length - 1),
      0,
    );

  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1].trim() ?? '';
  const description = /<meta name="description" content="([^"]*)"/i.exec(html)?.[1] ?? '';
  const h1 = (/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? '').replace(/<[^>]+>/g, ' ');

  if (!service) {
    note('the one query', 'SEARCH in src/data/site.ts is empty — nobody has decided what this page is for');
  } else {
    const query = [service, city].filter(Boolean).join(' ');
    const missing = [];
    if (!holds(title, service) || !holds(title, city)) missing.push(`the <title> ("${title.slice(0, 60)}")`);
    if (!holds(description, service) || !holds(description, city)) missing.push('the meta description');
    // The h1 is a sentence to a human first: the service has to be readable in
    // it, the city does not — plenty of good headlines put the city one line
    // below, and forcing it in is how a heading starts sounding like a listing.
    if (!holds(h1, service)) missing.push(`the <h1> ("${h1.trim().slice(0, 60)}")`);

    // Stuffing. The service word repeating is normal — it is what the page is
    // about. The pair repeating is not: nobody says "Coiffeur in Zürich" five times
    // in one page of prose.
    const words = text.split(/\s+/);
    let pairs = 0;
    if (city) {
      for (let i = 0; i < words.length; i++) {
        if (!holds(words[i], service)) continue;
        if (words.slice(i + 1, i + 4).some((w) => holds(w, city))) pairs++;
      }
    }
    const cityMentions = city ? count(text, city) : 0;
    const serviceShare = words.length ? count(text, service) / words.length : 0;

    const stuffed = [];
    if (pairs > 4) stuffed.push(`"${query}" appears ${pairs} times as a phrase`);
    if (cityMentions > 15) stuffed.push(`the city is named ${cityMentions} times`);

    if (missing.length)
      fail('the one query', `"${query}" is missing from ${missing.join(', ')}`);
    else if (stuffed.length)
      fail('the one query', `${stuffed.join('; ')} — written for the crawler, and it reads like it`);
    else {
      pass(
        'the one query',
        `"${query}" in the title, the h1 and the description; ${cityMentions} city mention(s), not stuffed`,
      );
      // Only on a page with enough words for a share to mean anything: three
      // sentences about haircuts are 6% "Coiffeur" and perfectly well written.
      if (words.length > 150 && serviceShare > 0.04)
        note('the one query', `"${service}" is ${Math.round(serviceShare * 100)}% of the words on the page — read it aloud`);
      if (city && cityMentions < 2)
        note('the one query', `the city is named ${cityMentions} time(s) in the copy — a local page usually earns two or three`);
    }
  }
}

/**
 * The copy is written, not transcribed.
 *
 * Only on a speculative build, where the raw captions are on disk to compare
 * against. The profile decides how the page sounds; it is not a source of
 * finished text, and a paragraph carried over whole reads on a landing page
 * exactly like what it is — a caption written for people who already follow
 * them. See jtakeit-sites:spec → references/copy.md.
 *
 * Marked quotations are exempt and are supposed to exist: <blockquote> and <q>
 * are stripped before the comparison, because quoting one line of theirs
 * deliberately is the opposite of the fault being measured.
 */
if (speculative && html) {
  const postsPath = join(root, STATE_DIR, 'instagram-posts.json');
  if (!existsSync(postsPath)) {
    note('copy', `no ${STATE_DIR}/instagram-posts.json — cannot measure the page against the captions`);
  } else {
    const words = (text) =>
      (String(text).toLowerCase().match(/[\p{L}\p{N}'\u2019-]+/gu) ?? []).map((w) => w.replace(/\u2019/g, "'"));

    const captions = [];
    const collect = (node) => {
      if (Array.isArray(node)) return node.forEach(collect);
      if (!node || typeof node !== 'object') return;
      for (const [key, value] of Object.entries(node)) {
        if (typeof value === 'string' && /caption|text|biography/i.test(key)) captions.push(value);
        else collect(value);
      }
    };
    try {
      collect(JSON.parse(readFileSync(postsPath, 'utf8')));
    } catch {
      captions.length = 0;
    }

    const RUN = 10;
    const grams = new Set();
    for (const caption of captions) {
      const w = words(caption);
      for (let i = 0; i + RUN <= w.length; i++) grams.add(w.slice(i, i + RUN).join(' '));
    }

    const page = words(
      html
        .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
        .replace(/<blockquote[\s\S]*?<\/blockquote>|<q[\s>][\s\S]*?<\/q>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;|&#\d+;/gi, ' '),
    );

    // Windows that appear verbatim in a caption, merged back into runs: two
    // overlapping ten-word hits are one twelve-word lift, not two faults.
    let longest = 0;
    let where = '';
    let run = 0;
    for (let i = 0; i + RUN <= page.length; i++) {
      run = grams.has(page.slice(i, i + RUN).join(' ')) ? run + 1 : 0;
      if (run && run - 1 + RUN > longest) {
        longest = run - 1 + RUN;
        where = page.slice(i - run + 1, i + RUN).join(' ');
      }
    }

    if (!grams.size) note('copy', 'no captions found in the scrape to compare against');
    else if (longest)
      fail(
        'copy',
        `${longest} words carried over from a caption verbatim — "${where.slice(0, 90)}…". ` +
          'Take the voice, write the text; quote deliberately, in a <blockquote>.',
      );
    else pass('copy', 'nothing lifted whole from the captions');
  }
}

// --- browser checks ---------------------------------------------------------

const chromium = await loadChromium(die);
const browser = await chromium.launch();

/**
 * Walk the page so lazy images decode and every scroll reveal fires, then
 * return to the top.
 *
 * `scroll-behavior: smooth` is suspended for the walk and restored after. It
 * has to be: the page we are checking asks for smooth scrolling, so the trip
 * back to the top animates, and on a long page it is still travelling when the
 * first screen gets measured — which reports a hero that overflows as one that
 * fits. Restoring by clearing the inline property leaves the stylesheet's own
 * value intact, which the in-page link check then reads.
 */
async function settle(page) {
  await page.evaluate(async () => {
    const doc = document.documentElement;
    doc.style.scrollBehavior = 'auto';
    const step = window.innerHeight * 0.5;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
    await (document.fonts?.ready ?? Promise.resolve());
    doc.style.scrollBehavior = '';
  });
  await page.waitForTimeout(350);
}

async function open(width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
  await settle(page);
  return page;
}

// -- the first screen --------------------------------------------------------
//
// The hero and the one action have to be on screen without scrolling. A short
// laptop is the case that gets missed, because nobody builds on one.

const FOLD = [
  [1440, 900],
  [1280, 800],
  [393, 852],
];

const foldProblems = [];
let sawCta = false;

for (const [w, h] of FOLD) {
  const page = await open(w, h);
  const m = await page.evaluate(() => {
    // The first thing in <main>, whatever tag it is. A hero wrapped in
    // <HeroField> is a div, not a section — reading the first *section* there
    // silently measures the band under the hero instead, which reports a fold
    // that fits as one that overflows and a moving hero as a still one.
    const hero = document.querySelector('main > *');
    if (!hero) return null;
    const cta = hero.querySelector('.btn, a[href^="#"], button');
    return {
      vh: window.innerHeight,
      hero: Math.round(hero.getBoundingClientRect().bottom),
      cta: cta ? Math.round(cta.getBoundingClientRect().bottom) : null,
      wide: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
  await page.close();
  if (!m) {
    foldProblems.push('no <section> inside <main> — cannot tell where the hero is');
    continue;
  }
  if (m.hero > m.vh) foldProblems.push(`${w}×${h}: hero overflows by ${m.hero - m.vh}px`);
  if (m.cta !== null) {
    sawCta = true;
    if (m.cta > m.vh) foldProblems.push(`${w}×${h}: the call to action is ${m.cta - m.vh}px below the fold`);
  }
  if (m.wide) foldProblems.push(`${w}×${h}: the page scrolls sideways`);
}

foldProblems.length
  ? fail('first screen', foldProblems.join('; '))
  : pass('first screen', `hero${sawCta ? ' and the one action' : ''} inside the fold at 1440, 1280 and 393`);
if (!sawCta) note('first screen', 'no button or in-page link found in the hero — is there a call to action?');

// -- orphans -----------------------------------------------------------------
//
// One item alone on the last line of a wrapping row. Swept, because it appears
// at widths nobody thinks to open and moves when the copy changes.

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
  await settle(page);

  const rows = await page.evaluate(() => document.querySelectorAll('[data-row]').length);
  if (!rows) {
    note('orphans', 'no [data-row] on the page — mark wrapping rows to have them watched');
  } else {
    const hits = [];
    for (let w = 320; w <= 1600; w += 20) {
      await page.setViewportSize({ width: w, height: 900 });
      const bad = await page.evaluate(() =>
        [...document.querySelectorAll('[data-row]')]
          .filter((row) => {
            const tops = [...row.children].map((c) => Math.round(c.getBoundingClientRect().top));
            const perLine = [...new Set(tops)].sort((a, b) => a - b).map((t) => tops.filter((x) => x === t).length);
            // Alone on the last line, while other lines hold more. A
            // single-column list is a list, not a broken row.
            return perLine.length > 1 && perLine.at(-1) === 1 && Math.max(...perLine) > 1;
          })
          .map((row) => row.className || row.tagName.toLowerCase()),
      );
      if (bad.length) hits.push(`${w}px (${bad[0]})`);
    }
    await page.close();
    hits.length
      ? fail('orphans', `${hits.length} width(s) strand one item on a line: ${hits.slice(0, 4).join(', ')}${hits.length > 4 ? '…' : ''}`)
      : pass('orphans', `${rows} row(s) clean from 320 to 1600px`);
  }
  if (!page.isClosed()) await page.close();
}

// -- in-page links -----------------------------------------------------------

{
  const page = await open(1280, 800);
  const smooth = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  const targets = await page.evaluate(() =>
    [...document.querySelectorAll('a[href^="#"]')]
      .map((a) => a.getAttribute('href'))
      .filter((h) => h && h.length > 1 && document.querySelector(h)),
  );

  if (smooth !== 'smooth') {
    fail('in-page links', 'scroll-behavior is not smooth — an anchor jump reads as a page reload');
  } else if (!targets.length) {
    note('in-page links', 'none found');
  } else {
    const bad = [];
    for (const href of [...new Set(targets)]) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);
      // Navigate by hash rather than by clicking. What is being measured is
      // where the anchor lands, and some legitimate links cannot be clicked at
      // all — the skip link lives off-screen until it takes focus.
      await page.evaluate((h) => {
        window.location.hash = '';
        window.location.hash = h;
      }, href);
      await page.waitForTimeout(1200);
      const landed = await page.evaluate((h) => {
        const el = document.querySelector(h);
        const head = el.querySelector('h1, h2, h3') ?? el;
        const top = head.getBoundingClientRect().top;
        return { top: Math.round(top), vh: window.innerHeight };
      }, href);
      // The heading has to be on screen and near the top of it: landing on a
      // section's padding shows an empty screen and reads as a dead link.
      if (landed.top < 0 || landed.top > landed.vh * 0.45) bad.push(`${href} lands with its heading at ${landed.top}px`);
    }
    await page.close();
    bad.length
      ? fail('in-page links', bad.join('; '))
      : pass('in-page links', `${new Set(targets).size} anchor(s) scroll smoothly onto their heading`);
  }
  if (!page.isClosed()) await page.close();
}

// -- photographs and the form ------------------------------------------------

{
  const page = await open(1280, 900);
  const m = await page.evaluate(() => {
    const placeholders = document.querySelectorAll('.shot--placeholder').length;
    const imgs = [...document.querySelectorAll('img')];
    /*
     * Alt text that is missing or reads like a file name is `jtk a11y`'s to
     * find (WCAG 1.1.1). What it accepts and this does not: every picture on
     * the page marked as saying nothing. `alt=""` is right for decoration and
     * wrong for the photograph the page is about.
     */
    const decorative = imgs.filter((i) => i.hasAttribute('alt') && !i.getAttribute('alt').trim());
    /*
     * Stretched photographs. A frame that does not match the picture must crop
     * into it, never squeeze it — and a squeezed photograph is the one image
     * fault a client always sees and never has words for. It happens exactly
     * one way: an <img> given both dimensions with object-fit left at `fill`.
     */
    const stretched = imgs
      .map((i) => {
        if (!i.naturalWidth || !i.naturalHeight) return null;
        const box = i.getBoundingClientRect();
        if (!box.width || !box.height) return null;
        if (getComputedStyle(i).objectFit !== 'fill') return null;
        const frame = box.width / box.height;
        const own = i.naturalWidth / i.naturalHeight;
        // A pixel of rounding on a 900px frame is not a distortion.
        if (Math.abs(frame / own - 1) < 0.02) return null;
        return `${i.currentSrc.split('/').pop()} is ${own.toFixed(2)}:1 and is drawn at ${frame.toFixed(2)}:1`;
      })
      .filter(Boolean);

    // How much of a picture a crop throws away. Not a failure — some crops are
    // deliberate — but past half the photograph it is usually the wrong file
    // rather than the wrong frame.
    const overcropped = imgs
      .map((i) => {
        if (!i.naturalWidth || !i.naturalHeight) return null;
        const box = i.getBoundingClientRect();
        if (!box.width || !box.height) return null;
        if (getComputedStyle(i).objectFit !== 'cover') return null;
        const own = i.naturalWidth / i.naturalHeight;
        const frame = box.width / box.height;
        const kept = Math.min(own, frame) / Math.max(own, frame);
        return kept < 0.5 ? `${i.currentSrc.split('/').pop()} keeps ${Math.round(kept * 100)}%` : null;
      })
      .filter(Boolean);

    // Autofill repaints a field with the browser's own colours unless a rule
    // covers it. Cheapest reliable probe: is such a rule in the stylesheets.
    let autofill = false;
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.cssText && rule.cssText.includes('-webkit-autofill')) autofill = true;
        }
      } catch {
        /* cross-origin stylesheet, not ours */
      }
    }
    return {
      placeholders,
      stretched,
      overcropped,
      imgs: imgs.length,
      decorative: decorative.length,
      autofill,
      fields: document.querySelectorAll('input, textarea').length,
    };
  });
  await page.close();

  m.placeholders
    ? fail('photographs', `${m.placeholders} placeholder frame(s) on the page`)
    : pass('photographs', `${m.imgs} image(s), none missing`);

  if (m.imgs && m.decorative === m.imgs)
    fail('alt text', `all ${m.imgs} image(s) are marked decorative — at least one of them is the page`);

  if (m.imgs) {
    m.stretched.length
      ? fail('photo shape', `stretched: ${m.stretched.slice(0, 3).join(', ')} — a frame crops, it never squeezes`)
      : pass('photo shape', 'no photograph is distorted by its frame');
  }
  if (m.overcropped.length)
    note('photo crop', `${m.overcropped.slice(0, 3).join(', ')} — measure the picture before choosing the frame`);

  if (m.fields) {
    m.autofill
      ? pass('autofill', 'the form keeps its palette when the browser fills it')
      : fail('autofill', 'no :-webkit-autofill rule — a filled form will turn white');
  }
}

// -- the surface -------------------------------------------------------------
//
// The ground the page is printed on, the edges its blocks are drawn with, and
// how they arrive. Three catalogues, in @jtakeit/astro's docs/surface.md, and
// four faults that are invisible in the window they were built in:
//
//   · a reveal that never fires, which is content nobody can read;
//   · a reveal inside the first screen, which delays the largest paint and
//     shows a visitor on a slow line an empty page;
//   · more than one thing moving forever, which is a demo rather than a design;
//   · a ground turned up until it competes with the text on it.
//
// The last one is the reason this is measured rather than discussed. "Is the
// texture too strong" is a question two people answer differently on two
// monitors; the contrast between the figure and the paper under it is a number.

let surfaceShape = null;

{
  const page = await open(1440, 900);
  // The walk in settle() starts the last block's entrance; it does not wait for
  // it to land. Measuring a transition that is still running reports a block
  // that arrived as a block that never did.
  await page.waitForTimeout(1200);
  const surface = await page.evaluate(() => {
    const luminance = (rgb) => {
      const [r, g, b] = rgb.map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const parse = (value) => {
      const m = /rgba?\(([^)]+)\)/.exec(value || '');
      if (!m) return null;
      const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      return parts.length >= 3 ? { rgb: parts.slice(0, 3), a: parts.length > 3 ? parts[3] : 1 } : null;
    };
    const over = (top, bottom, alpha) => top.map((c, i) => c * alpha + bottom[i] * (1 - alpha));
    const ratio = (a, b) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };

    const hidden = (el) => {
      const cs = getComputedStyle(el);
      return Number(cs.opacity) < 0.99 || /inset\(.*100%/.test(cs.clipPath);
    };

    /*
     * What moves forever, counted as *regions* rather than as elements.
     *
     * A wall of photographs is three drifting columns and one decision; a hero
     * of five looping clips is five <video> elements and one decision. Counting
     * elements made both of them look like a page out of control, which is the
     * check crying wolf at exactly the components that were built carefully.
     *
     * So a component that owns continuous motion marks its root
     * `data-motion="<name>"`, and everything animating inside it is that one
     * region. Anything moving forever with no such ancestor is its own region,
     * which is what catches the unconsidered case this check exists for.
     *
     * A looping autoplaying video counts. It is not a CSS animation and it is
     * unarguably something that moves while somebody is reading the page.
     */
    const cssForever = [...document.querySelectorAll('*')]
      .flatMap((el) => [
        [el, getComputedStyle(el)],
        [el, getComputedStyle(el, '::after')],
        [el, getComputedStyle(el, '::before')],
      ])
      .filter(([, cs]) => cs.animationName !== 'none' && /infinite/.test(cs.animationIterationCount))
      .map(([el]) => el);

    const videoForever = [...document.querySelectorAll('video[autoplay][loop]')];

    const interactive = (el) =>
      el.matches('a[href], button, [role="button"], input, select, textarea, summary') ||
      Boolean(el.closest('a[href], button'));

    const regions = new Map();
    for (const el of [...cssForever, ...videoForever]) {
      const owner = el.closest('[data-motion]');
      const key = owner
        ? owner.dataset.motion
        : `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(' ')[0]}` : ''}`;
      if (!regions.has(key)) regions.set(key, { declared: Boolean(owner), pressable: interactive(owner ?? el) });
    }

    const reveals = [...document.querySelectorAll('[data-reveal]')].filter(
      (el) => el.dataset.reveal !== 'none',
    );

    // A stagger hides its children rather than itself, so both are looked at.
    //
    // Hidden *and* never marked. `.is-in` is the observer's own record that the
    // block reached the screen: without it a block that is invisible is a block
    // nothing ever turned on, which is the fault. With it, an invisible block is
    // one whose entrance is still running, and that is not a fault.
    const stuck = reveals
      .filter((el) => !el.classList.contains('is-in'))
      .filter((el) => hidden(el) || [...el.children].some((child) => hidden(child)))
      .map((el) => el.dataset.reveal || 'rise');

    const layer = document.querySelector('.pattern__stencil, .pattern__drawing');
    let ground = null;
    if (layer) {
      const cs = getComputedStyle(layer);
      const ink = parse(cs.backgroundColor)?.a ? parse(cs.backgroundColor) : parse(getComputedStyle(layer.parentElement).color);
      const paper = parse(getComputedStyle(document.body).backgroundColor);
      const alpha = Number(cs.opacity) * (ink?.a ?? 1);
      ground = ink && paper
        ? {
            pattern: layer.parentElement.dataset.pattern,
            opacity: Number(alpha.toFixed(3)),
            contrast: Number(ratio(over(ink.rgb, paper.rgb, alpha), paper.rgb).toFixed(2)),
          }
        : { pattern: layer.parentElement.dataset.pattern, opacity: Number(alpha.toFixed(3)), contrast: null };
    }

    // How the photographs are printed. `recede` is not a look — it is a
    // photograph pushed back so copy can sit on it — so it is counted apart
    // from the one treatment the page is allowed to have.
    const treatments = [...new Set(
      [...document.querySelectorAll('[data-treatment]')].map((el) => el.dataset.treatment),
    )];

    const galleries = [...new Set(
      [...document.querySelectorAll('[data-arrangement]')].map((el) => el.dataset.arrangement),
    )];

    return {
      ground,
      stuck,
      treatments,
      galleries,
      looks: treatments.filter((t) => t !== 'recede' && t !== 'none'),
      shots: document.querySelectorAll('.shot').length,
      kinds: [...new Set(reveals.map((el) => el.dataset.reveal || 'rise'))],
      edges: [...new Set([...document.querySelectorAll('[data-edge]')].map((el) => el.dataset.edge))],
      forever: [...regions.keys()],
      // An edge that performs belongs to something a visitor can press. A wall
      // of photographs is not pressable and does not need to be: it is exempt
      // by declaring itself, which is a decision somebody wrote down.
      performing: [...regions.entries()].filter(([, r]) => !r.declared && !r.pressable).map(([k]) => k),
    };
  });
  await page.close();

  // A reveal inside the first screen. Measured on the two viewports where it
  // costs the most: the laptop everybody builds on, and the phone.
  const early = [];
  for (const [w, h] of [[1440, 900], [393, 852]]) {
    const view = await open(w, h);
    const found = await view.evaluate(() =>
      [...document.querySelectorAll('[data-reveal]')]
        .filter((el) => el.dataset.reveal !== 'none')
        .filter((el) => el.getBoundingClientRect().top < window.innerHeight - 8)
        .map((el) => `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(' ')[0]}` : ''}`),
    );
    await view.close();
    // Named once each: five identical selectors is the same fault printed five
    // times, and a long line is a line nobody finishes reading.
    const named = [...new Set(found)];
    if (found.length)
      early.push(
        `${w}×${h}: ${named.slice(0, 4).join(', ')}${named.length > 4 ? ` +${named.length - 4} more` : ''}` +
          `${found.length > named.length ? ` (${found.length} elements)` : ''}`,
      );
  }

  surfaceShape = surface;

  if (surface.stuck.length)
    fail(
      'reveals fire',
      `${surface.stuck.length} block(s) are still hidden after the page has been scrolled through ` +
        `(${[...new Set(surface.stuck)].join(', ')}) — that is content nobody can read. The observer ` +
        'in Layout.astro is what adds .is-in.',
    );
  else if (surface.kinds.length) pass('reveals fire', `${surface.kinds.join(', ')} — every block arrives`);

  if (early.length)
    fail(
      'the first screen is not revealed',
      `${early.join(' · ')} — an entrance above the fold delays the largest paint and shows an empty ` +
        'page on a slow line. Reveal what is scrolled to, never what is landed on.',
    );

  if (surface.kinds.length >= 3)
    fail(
      'one entrance',
      `${surface.kinds.join(', ')} — three kinds of entrance on one page is a component gallery. Pick the one this page's material asks for.`,
    );
  else if (surface.kinds.length === 2)
    note('one entrance', `${surface.kinds.join(' + ')} — two is defensible if the second is on the photographs; three is not`);

  /*
   * Two regions is the argument, three is the answer. A hero that moves and a
   * wall of work that drifts is a page most people would defend; a third thing
   * moving forever is a page nobody chose.
   */
  if (surface.forever.length > 2)
    fail(
      'what moves forever',
      `${surface.forever.join(', ')} — three regions moving at once is a demo. The hero is usually one of them; ` +
        'everything else that never stops is furniture asking to be looked at.',
    );
  else if (surface.forever.length === 2)
    note('what moves forever', `${surface.forever.join(' + ')} — two is defensible, and it is the ceiling`);
  else if (surface.forever.length) pass('what moves forever', surface.forever[0]);

  if (surface.performing.length)
    fail(
      'moving things are declared',
      `${surface.performing.join(', ')} moves forever without being pressable and without declaring itself. ` +
        'An animated edge belongs to the one thing a visitor is meant to press; a surface that moves on ' +
        'purpose marks its root data-motion="<name>" and says in a comment what buys the exception.',
    );

  /*
   * One treatment per site.
   *
   * The whole point of a treatment is that photographs shot in different lights
   * on different phones become one set. Two looks on one page is the fault the
   * treatment was there to fix, arrived at from the other direction — and it is
   * the shape a page takes when each section was styled on the day it was
   * written rather than decided once.
   */
  if (surface.looks.length > 1)
    fail(
      'one treatment',
      `${surface.looks.join(', ')} — a page printed two ways is the disagreement a treatment exists to remove. ` +
        'Pick the one this material asks for (photos.md); `recede` alongside it is fine, it is not a look.',
    );
  else if (surface.looks.length)
    pass('one treatment', `${surface.looks[0]} on ${surface.shots} photograph(s)`);

  if (surface.ground?.contrast !== null && surface.ground) {
    const { pattern, opacity, contrast } = surface.ground;
    contrast > 1.6
      ? fail(
          'the ground is quiet',
          `${pattern} sits at ${contrast}:1 against the paper (opacity ${opacity}) — a ground is read at a glance and never read at. Under 1.6:1.`,
        )
      : pass('the ground is quiet', `${pattern} at ${contrast}:1 against the paper`);
  }
}

// -- the shape of this build --------------------------------------------------
//
// Not a floor: a fingerprint. Three consecutive spec builds for three unrelated
// businesses shipped the same hero markup class for class, the same stack of
// full-bleed bands under it and the same serif-over-sans pairing — and nothing
// in the pipeline noticed, because each build looked fine on its own. What was
// missing was any measurement that survives the project it was taken in.
//
// So this measures what a page *is* rather than whether it works, prints it, and
// writes it to .jtakeit/fingerprint.json. Comparing fingerprints across clients
// is the developer's job; making one exist is this script's.

/*
 * Which angles this page argues from, read off the content document rather than
 * the built HTML.
 *
 * The block *types* are the record: they are named after what each block is on
 * this page, so a sequence of them is the page's argument in five words. Two
 * clients with the same sequence is a house style forming, and comparing
 * fingerprints is the only way anybody sees that — a page always looks
 * deliberate from inside the project it was built in.
 */
const blockSequence = (() => {
  const file = join(root, 'jtk', 'content', 'index.json');
  if (!existsSync(file)) return null;
  try {
    const doc = JSON.parse(readFileSync(file, 'utf8'));
    return (doc.blocks ?? []).map((b) => b.type);
  } catch {
    return null;
  }
})();

{
  const page = await open(1440, 900);
  const shape = await page.evaluate(() => {
    const sections = [...document.querySelectorAll('main > section')];
    // Not sections[0]: a hero on a moving ground is a div wrapping its content,
    // and reading the first section there fingerprints the wrong element.
    const hero = document.querySelector('main > *');
    const box = (el) => el.getBoundingClientRect();

    // The hero's anatomy, read off the DOM: which of the six shapes in
    // @jtakeit/astro's docs/shapes.md this actually is, rather than which one was intended.
    const anatomy = (() => {
      if (!hero) return 'no hero';
      // A pile is several photographs over each other and the heuristics below
      // would read it as a split — it has a class because the arrangement is a
      // component, so the fingerprint can simply ask.
      if (hero.querySelector('.pile')) return 'pile';
      const media = hero.querySelector('img, canvas, video, picture');
      const heading = hero.querySelector('h1');
      if (!media) return 'typographic';
      const m = box(media);
      const h = heading ? box(heading) : null;
      const fills = m.width > window.innerWidth * 0.9;
      const overlaps = h && m.top < h.bottom && m.bottom > h.top && m.left < h.right && m.right > h.left;
      if (fills && overlaps) return 'overlay';
      if (!h) return 'object';
      // Side by side, or stacked?
      const sideBySide = m.left > h.right - 8 || m.right < h.left + 8;
      if (!sideBySide) return m.height > window.innerHeight * 0.6 ? 'overlay' : 'object';
      return m.width > h.width * 1.1 ? 'portrait-led' : 'split';
    })();

    const fullBleed = sections.filter((s) => box(s).width > window.innerWidth * 0.98).length;
    const families = [...new Set([...document.querySelectorAll('h1, h2, p, body')].map((el) => getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim()))].filter(Boolean);
    const radii = {};
    for (const el of [...document.querySelectorAll('*')].slice(0, 600)) {
      const r = getComputedStyle(el).borderTopLeftRadius;
      if (r && r !== '0px') radii[r] = (radii[r] ?? 0) + 1;
    }
    const palette = {};
    for (const el of [...document.querySelectorAll('*')].slice(0, 600)) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && !/rgba\(0, 0, 0, 0\)/.test(bg)) palette[bg] = (palette[bg] ?? 0) + 1;
    }
    const sorted = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
    return {
      heroAnatomy: anatomy,
      sections: sections.length,
      fullBleed,
      headings: document.querySelectorAll('h1, h2').length,
      families: families.slice(0, 3),
      radii: sorted(radii, 3),
      palette: sorted(palette, 5),
      // Left as the scaffold shipped it? Those two values are the kit's own
      // placeholder blue and its "nobody chose a typeface yet" stack.
      untouched: {
        accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() === '#2f5bff',
        font: /^system-ui/.test(getComputedStyle(document.body).fontFamily),
      },
    };
  });
  await page.close();

  if (shape) {
    const scaffolded = [
      shape.untouched.accent ? '--accent is still the scaffold\'s placeholder blue' : '',
      shape.untouched.font ? 'the body is still system-ui — no typeface was chosen' : '',
    ].filter(Boolean);

    scaffolded.length
      ? fail('still the scaffold', `${scaffolded.join('; ')} — the default look is not a direction somebody chose`)
      : pass('still the scaffold', 'palette and type were chosen for this project');

    note(
      'shape',
      `hero: ${shape.heroAnatomy} · ${shape.sections} section(s), ${shape.fullBleed} full-bleed · ` +
        `type: ${shape.families.join(' + ') || '?'} · radii: ${shape.radii.join(' ') || 'none'}`,
    );

    if (blockSequence) {
      note('blocks', blockSequence.join(' → '));
      // Named after a template rather than after what they are on this page.
      // Not a failure — some pages genuinely have an about section — but it is
      // the tell that the sequence was filled in rather than chosen.
      const generic = blockSequence.filter((t) =>
        ['about', 'features', 'benefits', 'services', 'advantages', 'why_us', 'feature_grid'].includes(t),
      );
      if (generic.length)
        note(
          'blocks',
          `${generic.join(', ')} — named after a template. A block is named after what it is on ` +
            'this page (copy.md); a name that would fit any site usually means a block that would too',
        );
    }
    // The house tell, and the reason this block exists.
    if (surfaceShape)
      note(
        'surface',
        `ground: ${surfaceShape.ground?.pattern ?? 'none'} · ` +
          `edges: ${surfaceShape.edges.join(' ') || 'none'} · ` +
          `entrance: ${surfaceShape.kinds.join(' ') || 'none'} · ` +
          `photos: ${surfaceShape.treatments.join(' ') || 'untouched'} · ` +
          `work: ${surfaceShape.galleries.join(' ') || 'no gallery'}`,
      );

    if (shape.sections >= 5 && shape.fullBleed === shape.sections)
      note('shape', 'every section is a full-bleed band — that is the form all three of our last builds took (shapes.md)');

    if (existsSync(join(root, STATE_DIR)))
      writeFileSync(
        join(root, STATE_DIR, 'fingerprint.json'),
        `${JSON.stringify(
          {
            measuredAt: new Date().toISOString().slice(0, 19) + 'Z',
            ...shape,
            // Which ground, which edge, which entrance — the three catalogues
            // in surface.md, measured rather than taken from the design
            // document. Comparing these across clients is how a developer sees
            // a house style forming before a client does.
            blocks: blockSequence,
            surface: surfaceShape
              ? {
                  pattern: surfaceShape.ground?.pattern ?? 'none',
                  patternContrast: surfaceShape.ground?.contrast ?? null,
                  edges: surfaceShape.edges,
                  reveals: surfaceShape.kinds,
                  treatments: surfaceShape.treatments,
                  galleries: surfaceShape.galleries,
                }
              : null,
          },
          null,
          2,
        )}\n`,
        'utf8',
      );
  }
}

// -- the other end: a 27-inch monitor ----------------------------------------
//
// Every rule in the composition floor is about things fitting into a screen
// that is too small. This is the opposite fault and it is just as common: a
// page built at 1440 and never opened wider, where the shell is capped at
// 1200px, the type is a fixed 48px and the hero is 100svh tall. On a 2560×1440
// monitor that is a small island of content in a large empty field — measured
// on a real build: 38% of the width, 17% of the hero's height, and a headline
// exactly as big as it was on a laptop.
//
// The emptiness is the failure; the type not scaling is reported next to it,
// because a design may legitimately cap its headline and the two together are
// what tell the story.

{
  const reach = async (width, height) => {
    const page = await open(width, height);
    const m = await page.evaluate(() => {
      const hero = document.querySelector('main > *');
      if (!hero) return null;
      const box = hero.getBoundingClientRect();
      // What actually paints: text nodes, backgrounds, pictures. A wrapper with
      // no ink of its own is not content, and counting it would report an
      // empty screen as a full one.
      const nodes = [...hero.querySelectorAll('*')].filter((el) => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (!r.width || !r.height || style.visibility === 'hidden' || Number(style.opacity) < 0.05) return false;
        if (el.tagName === 'IMG' || el.tagName === 'CANVAS' || el.tagName === 'SVG') return true;
        const paints = style.backgroundImage !== 'none' || !/^rgba\(0, 0, 0, 0\)$/.test(style.backgroundColor);
        const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        return text || paints;
      });
      if (!nodes.length) return null;
      const rects = nodes.map((n) => n.getBoundingClientRect());
      const heading = hero.querySelector('h1');
      return {
        heroHeight: box.height,
        spanWidth: (Math.max(...rects.map((r) => r.right)) - Math.min(...rects.map((r) => r.left))) / window.innerWidth,
        spanHeight: (Math.max(...rects.map((r) => r.bottom)) - Math.min(...rects.map((r) => r.top))) / box.height,
        heading: heading ? parseFloat(getComputedStyle(heading).fontSize) : 0,
        full: box.height > window.innerHeight * 0.9,
      };
    });
    await page.close();
    return m;
  };

  const laptop = await reach(1440, 900);
  const monitor = await reach(2560, 1440);

  if (!laptop || !monitor) {
    note('wide screen', 'nothing paints inside the first <section> — cannot measure how it uses a large screen');
  } else {
    const problems = [];
    if (monitor.spanWidth < 0.5)
      problems.push(`the hero uses ${Math.round(monitor.spanWidth * 100)}% of a 2560px screen's width`);
    // Only for a hero that claimed the whole screen: a short band with air
    // around it is a design, a full-height band that is 80% empty is not.
    if (monitor.full && monitor.spanHeight < 0.3)
      problems.push(`it is ${Math.round(100 - monitor.spanHeight * 100)}% empty vertically while still asking for the whole screen`);

    problems.length
      ? fail('wide screen', `${problems.join('; ')} — the design gets bigger on a big monitor, it does not get more centred`)
      : pass('wide screen', `the hero fills ${Math.round(monitor.spanWidth * 100)}% of the width at 2560×1440`);

    const growth = laptop.heading ? monitor.heading / laptop.heading : 1;
    if (laptop.heading && growth < 1.05)
      note(
        'wide screen',
        `the headline is ${Math.round(monitor.heading)}px on both a laptop and a 27-inch monitor — clamp() with a vw term, capped`,
      );
  }
}

// -- empty space, band by band ------------------------------------------------
//
// The wide-screen check above measures the hero. This measures everything under
// it, because the fault turns up there too and looks worse: a contact band whose
// form is a 600px column floating in 1920px of colour, with the other two thirds
// of the screen empty on either side. Measured on a real build — 31% of the
// width, and the client saw it before we did.
//
// Two different faults, and they need different rules:
//
//   lopsided   content shoved to one side with a void beside it. Nobody chooses
//              this; it is a grid whose second column ended up empty.
//   thin       content that uses a third of the width. Legitimate for a column
//              of prose — a long FAQ reads as a document — and wrong for a form,
//              which is a thing to be filled in rather than read.

{
  const page = await open(1920, 1080);
  const bands = await page.evaluate(() => {
    const paints = (el) => {
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || Number(style.opacity) < 0.05) return false;
      if (['IMG', 'CANVAS', 'SVG', 'VIDEO', 'INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(el.tagName)) return true;
      return [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    };
    return [...document.querySelectorAll('main > section')]
      .map((section, i) => {
        const box = section.getBoundingClientRect();
        const rects = [...section.querySelectorAll('*')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 2 && r.height > 2 && paints(el);
          })
          .map((el) => el.getBoundingClientRect());
        if (!rects.length || box.width < 2) return null;
        const left = Math.min(...rects.map((r) => r.left)) - box.left;
        const right = box.right - Math.max(...rects.map((r) => r.right));
        const top = Math.min(...rects.map((r) => r.top)) - box.top;
        const bottom = box.bottom - Math.max(...rects.map((r) => r.bottom));
        return {
          name: section.id || String(section.className).split(' ')[0] || `section ${i + 1}`,
          width: Math.round(box.width),
          height: Math.round(box.height),
          left: Math.round(left),
          right: Math.round(right),
          // Against the section for lopsidedness, against the screen for width:
          // a centred shell that is itself narrow leaves air outside its own box.
          lopsided: Math.abs(left - right) / box.width,
          onScreen: (box.width - left - right) / window.innerWidth,
          tall: (box.height - top - bottom) / box.height,
          form: Boolean(section.querySelector('form')),
        };
      })
      .filter(Boolean);
  });
  await page.close();

  if (!bands.length) {
    note('empty space', 'no <section> inside <main> to measure');
  } else {
    const problems = [];

    // A void on one side of a band.
    for (const b of bands.filter((b) => b.lopsided > 0.15)) {
      problems.push(
        `${b.name}: ${b.left}px of air on one side and ${b.right}px on the other — a band with one empty half`,
      );
    }

    /*
     * The form is the case worth being strict about. A column of prose may be
     * narrow — that is what a measure is for — but a form floating in a third of
     * the screen reads as a page that ran out of ideas, and it is the block the
     * whole page exists to deliver somebody to. Give it something to stand
     * beside — the contact details, a photograph, the questions — or let it use
     * the width.
     */
    for (const b of bands.filter((b) => b.form && b.onScreen < 0.45)) {
      problems.push(
        `${b.name}: the form uses ${Math.round(b.onScreen * 100)}% of a 1920px screen — ` +
          'put something beside it or let it widen',
      );
    }

    // A band that is mostly its own padding.
    for (const b of bands.filter((b) => b.tall < 0.35 && b.height > 400)) {
      problems.push(`${b.name}: content fills ${Math.round(b.tall * 100)}% of a ${b.height}px band — the rest is air`);
    }

    problems.length
      ? fail('empty space', problems.slice(0, 4).join('; '))
      : pass('empty space', `${bands.length} band(s), none lopsided or mostly empty at 1920px`);

    // Narrow but centred and full: reported so a person can look, not failed.
    const thin = bands.filter((b) => !b.form && b.onScreen < 0.4 && b.lopsided <= 0.15 && b.tall >= 0.35);
    if (thin.length)
      note(
        'empty space',
        `${thin.map((b) => `${b.name} ${Math.round(b.onScreen * 100)}%`).join(', ')} — narrow columns, deliberate or not?`,
      );
  }
}

// -- the hero with JavaScript off --------------------------------------------
//
// The floor the whole kit is built on, and the one a moving hero is most likely
// to break: a canvas that paints the background is a background that does not
// exist for a visitor whose script never ran, a browser without WebGL, or a
// crawler. What is measured is the difference between the two passes — a
// heading that is empty, or a hero with no button in it, is somebody else's
// check, and reporting it here would only teach people to skip this one.

{
  const measure = () => {
    const hero = document.querySelector('main > *');
    if (!hero) return null;
    const visible = (el) => {
      if (!el) return null;
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && Number(style.opacity) > 0.05;
    };
    const paints = (el) => {
      const style = getComputedStyle(el);
      return style.backgroundImage !== 'none' || !/^rgba\(0, 0, 0, 0\)$|^transparent$/.test(style.backgroundColor);
    };
    return {
      heading: visible(hero.querySelector('h1')),
      action: visible(hero.querySelector('.btn, a[href^="#"], a[href^="tel:"], button')),
      canvas: hero.querySelectorAll('canvas').length,
      // A canvas cannot be the ground, so something behind it has to be.
      ground:
        [hero, ...hero.querySelectorAll('*')].some((el) => el.tagName !== 'CANVAS' && paints(el)) ||
        paints(document.body),
      // Content stuck at zero opacity. A decorative canvas waiting for its first
      // frame is supposed to be there — that is the fallback working.
      hidden: [...hero.querySelectorAll('*')].filter(
        (el) =>
          Number(getComputedStyle(el).opacity) < 0.05 &&
          el.getAttribute('aria-hidden') !== 'true' &&
          (el.textContent ?? '').trim().length > 0,
      ).length,
    };
  };

  const scripted = await (async () => {
    const page = await open(393, 852);
    const m = await page.evaluate(measure);
    await page.close();
    return m;
  })();

  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 393, height: 852 } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
  const bare = await page.evaluate(measure);
  await context.close();

  if (!scripted || !bare) {
    note('without javascript', 'no <section> inside <main> to look at');
  } else {
    const problems = [];
    if (scripted.heading && !bare.heading) problems.push('the heading disappears');
    if (scripted.action && !bare.action) problems.push('the call to action disappears');
    if (bare.hidden > scripted.hidden)
      problems.push(`${bare.hidden - scripted.hidden} element(s) stay at opacity 0 — a reveal hung on a script that never ran`);
    // Invisible in both passes is not a JavaScript fault, it is text nobody
    // will ever read — and it is only ever found by looking for it.
    if (scripted.hidden)
      problems.push(`${scripted.hidden} element(s) in the hero never become visible at all, script or no script`);
    if (bare.canvas && !bare.ground) problems.push('the hero is painted by a canvas and nothing else — with no script it is blank');
    problems.length
      ? fail('without javascript', problems.join('; '))
      : pass('without javascript', `the first screen stands on its own${bare.canvas ? ', canvas or no canvas' : ''}`);

    /*
     * Whether the hero moves at all.
     *
     * Reported rather than required — a photograph-led hero can be right
     * without one. It is here because "we forgot" and "we decided not to" look
     * identical in a finished page, and the second time a build shipped a still
     * hero nobody had actually chosen it. The review gate asks the question;
     * this line is what stops it being answered from memory.
     */
    scripted.canvas
      ? note('hero motion', `${scripted.canvas} moving ground in the hero — check its colours are theirs`)
      : note('hero motion', 'the hero does not move — deliberate, or was HeroField forgotten again?');
  }
}

await browser.close();
if (server) server.close();

// --- report -----------------------------------------------------------------

console.log(`\nCheck · ${url}${speculative ? '  (spec build)' : ''}`);
// Which project this is. Printed because the commonest way to get a confusing
// result out of any jt-* script is to run it from the wrong directory.
console.log(`Project · ${root}\n`);
for (const r of results) {
  const mark = r.ok === true ? '✓' : r.ok === false ? '✗' : '·';
  console.log(`  ${mark} ${r.name.padEnd(20)} ${r.detail}`);
}

const failures = results.filter((r) => r.ok === false);
const notes = results.filter((r) => r.ok === null);
console.log('');
if (failures.length) {
  console.log(`${failures.length} failure(s). Fix these before asking anybody to look at the page.`);
} else {
  console.log(`Passed${notes.length ? ` with ${notes.length} thing(s) to look at` : ''}.`);
  console.log('');
  console.log('Now the half a script cannot do — put the review gate to the developer:');
  console.log('  · do they recognise themselves in the first three seconds?');
  console.log('  · which blocks are selling, and from which angle?');
  console.log('  · is this the right hero photograph — and is the person in it?');
  console.log('  · does it read like them, or like us — and is any of it pasted?');
  console.log('  · anything on the page nobody confirmed?');
  console.log('  · is the page still about them, or has it become about a query?');
  console.log('  · does the hero move — and if not, was that a decision?');
  console.log('  · read the headings aloud, in order. Do they sound like a person?');
  console.log('  (the full set is in jtakeit-sites:spec → references/review.md)');
}
process.exit(Math.min(failures.length, 100));
